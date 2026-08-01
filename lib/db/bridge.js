const JOIN_MAP = {
  sale_items: {
    sales: { foreignKey: 'sale_id' },
    products: { foreignKey: 'product_id' },
  },
};

function quoteIdent(name) {
  return '"' + String(name).replace(/"/g, '""') + '"';
}

function splitTopLevel(input) {
  const parts = [];
  let current = '';
  let depth = 0;
  for (const char of String(input || '')) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function normalizeValue(value) {
  if (value === undefined) return null;
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value) || (value && typeof value === 'object')) {
    return JSON.stringify(value);
  }
  return value;
}

function normalizeRecord(record) {
  const normalized = {};
  for (const [key, value] of Object.entries(record || {})) {
    normalized[key] = normalizeValue(value);
  }
  return normalized;
}

function parseSelectPart(part) {
  if (!part || part === '*') {
    return { kind: 'base-all' };
  }

  const joinMatch = part.match(/^([a-zA-Z_][\w]*)(!:?inner)?\((.+)\)$/);
  if (joinMatch) {
    return {
      kind: 'join',
      relation: joinMatch[1],
      inner: Boolean(joinMatch[2]),
      fields: splitTopLevel(joinMatch[3]).filter(Boolean),
    };
  }

  return { kind: 'base-field', field: part };
}

function toSqlColumn(column, baseAlias = 't') {
  const text = String(column);
  if (text.includes('.')) {
    const [table, field] = text.split('.');
    return `${quoteIdent(table)}.${quoteIdent(field)}`;
  }
  return `${baseAlias}.${quoteIdent(text)}`;
}

function getJoinConfig(table, relation) {
  return JOIN_MAP[table]?.[relation] || null;
}

function transformJoinedRows(rows) {
  return rows.map((row) => {
    const output = {};
    const grouped = {};

    for (const [key, value] of Object.entries(row)) {
      const separator = key.indexOf('__');
      if (separator === -1) {
        output[key] = value;
        continue;
      }

      const relation = key.slice(0, separator);
      const field = key.slice(separator + 2);
      if (!grouped[relation]) grouped[relation] = {};
      grouped[relation][field] = value;
    }

    for (const [relation, values] of Object.entries(grouped)) {
      const allNull = Object.values(values).every((value) => value === null || value === undefined);
      output[relation] = allNull ? null : values;
    }

    return output;
  });
}

function buildWhereClause(state, values) {
  const clauses = [];
  for (const filter of state.filters || []) {
    const column = toSqlColumn(filter.column);
    if (filter.type === 'is-null') {
      clauses.push(`${column} is null`);
      continue;
    }
    if (filter.type === 'is-not-null') {
      clauses.push(`${column} is not null`);
      continue;
    }
    if (filter.type === 'not') {
      if (filter.operator === 'is' && filter.value == null) {
        clauses.push(`${column} is not null`);
      }
      continue;
    }

    const index = values.push(normalizeValue(filter.value));
    const placeholder = `$${index}`;
    if (filter.type === 'eq') clauses.push(`${column} = ${placeholder}`);
    else if (filter.type === 'neq') clauses.push(`${column} <> ${placeholder}`);
    else if (filter.type === 'gte') clauses.push(`${column} >= ${placeholder}`);
    else if (filter.type === 'lte') clauses.push(`${column} <= ${placeholder}`);
    else if (filter.type === 'ilike') clauses.push(`${column} ilike ${placeholder}`);
  }

  return clauses.length ? ` where ${clauses.join(' and ')}` : '';
}

function buildSelectProjection(state) {
  const parts = splitTopLevel(state.selectColumns || '*').map(parseSelectPart);
  const selectItems = [];
  const joins = [];

  for (const part of parts) {
    if (part.kind === 'base-all') {
      selectItems.push('t.*');
      continue;
    }
    if (part.kind === 'base-field') {
      const column = part.field.trim();
      if (!column) continue;
      if (column === '*') {
        selectItems.push('t.*');
      } else {
        selectItems.push(`${toSqlColumn(column)} as ${quoteIdent(column.replace(/\./g, '__'))}`);
      }
      continue;
    }

    const joinConfig = getJoinConfig(state.table, part.relation);
    if (!joinConfig) continue;
    joins.push({ relation: part.relation, inner: part.inner, foreignKey: joinConfig.foreignKey });
    const fields = part.fields.length > 0 ? part.fields : ['id'];
    for (const field of fields) {
      selectItems.push(`${quoteIdent(part.relation)}.${quoteIdent(field)} as ${quoteIdent(`${part.relation}__${field}`)}`);
    }
  }

  if (!selectItems.length) selectItems.push('t.*');
  return { selectItems, joins };
}

async function executeSelect(client, state) {
  const values = [];
  const { selectItems, joins } = buildSelectProjection(state);
  let sql = `select ${selectItems.join(', ')} from public.${quoteIdent(state.table)} as t`;

  for (const join of joins) {
    const joinType = join.inner ? 'inner join' : 'left join';
    sql += ` ${joinType} public.${quoteIdent(join.relation)} as ${quoteIdent(join.relation)} on ${quoteIdent(join.relation)}.id = t.${quoteIdent(join.foreignKey)}`;
  }

  sql += buildWhereClause(state, values);

  if (state.order?.column) {
    sql += ` order by ${toSqlColumn(state.order.column)} ${state.order.ascending === false ? 'desc' : 'asc'}`;
  }
  if (state.limitNumber) {
    values.push(state.limitNumber);
    sql += ` limit $${values.length}`;
  }

  if (state.count === 'exact' && state.head) {
    const countSql = `select count(*)::int as count from public.${quoteIdent(state.table)} as t${sql.slice(sql.indexOf(' from public.'))}`;
    const countResult = await client.query(countSql, values);
    return { data: [], error: null, count: Number(countResult.rows[0]?.count || 0) };
  }

  const result = await client.query(sql, values);
  return {
    data: transformJoinedRows(result.rows),
    error: null,
    count: state.count === 'exact' ? result.rowCount : null,
  };
}

async function executeInsert(client, state) {
  const rows = Array.isArray(state.values) ? state.values : [state.values || {}];
  if (!rows.length || !rows[0] || Object.keys(rows[0]).length === 0) {
    return { data: [], error: null, count: null };
  }

  const normalized = rows.map(normalizeRecord);
  const columns = Object.keys(normalized[0]);
  const params = [];
  const valueSql = normalized.map((row) => {
    const placeholders = columns.map((column) => {
      params.push(row[column]);
      return `$${params.length}`;
    });
    return `(${placeholders.join(', ')})`;
  });

  let sql = `insert into public.${quoteIdent(state.table)} (${columns.map(quoteIdent).join(', ')}) values ${valueSql.join(', ')}`;
  if (state.selectColumns) {
    const projection = buildSelectProjection({ table: state.table, selectColumns: state.selectColumns });
    sql += ` returning ${projection.selectItems.join(', ')}`;
  }

  const result = await client.query(sql, params);
  if (!state.selectColumns) {
    return { data: [], error: null, count: result.rowCount };
  }
  return { data: transformJoinedRows(result.rows), error: null, count: result.rowCount };
}

async function executeUpdate(client, state) {
  const normalized = normalizeRecord(state.values || {});
  const columns = Object.keys(normalized);
  const params = [];
  const setSql = columns.map((column) => {
    params.push(normalized[column]);
    return `${quoteIdent(column)} = $${params.length}`;
  });

  let sql = `update public.${quoteIdent(state.table)} set ${setSql.join(', ')}`;
  sql += buildWhereClause(state, params);
  if (state.selectColumns) {
    const projection = buildSelectProjection({ table: state.table, selectColumns: state.selectColumns });
    sql += ` returning ${projection.selectItems.join(', ')}`;
  }

  const result = await client.query(sql, params);
  if (!state.selectColumns) {
    return { data: [], error: null, count: result.rowCount };
  }
  return { data: transformJoinedRows(result.rows), error: null, count: result.rowCount };
}

async function executeDelete(client, state) {
  const params = [];
  let sql = `delete from public.${quoteIdent(state.table)}`;
  sql += buildWhereClause(state, params);
  if (state.selectColumns) {
    const projection = buildSelectProjection({ table: state.table, selectColumns: state.selectColumns });
    sql += ` returning ${projection.selectItems.join(', ')}`;
  }

  const result = await client.query(sql, params);
  if (!state.selectColumns) {
    return { data: [], error: null, count: result.rowCount };
  }
  return { data: transformJoinedRows(result.rows), error: null, count: result.rowCount };
}

async function executeRpc(client, state) {
  const entries = Object.entries(state.rpcArgs || {});
  const params = entries.map(([, value]) => normalizeValue(value));
  const placeholders = params.map((_, index) => `$${index + 1}`).join(', ');
  const sql = `select * from public.${quoteIdent(state.rpcName)}(${placeholders})`;
  const result = await client.query(sql, params);
  return { data: result.rows[0] || null, error: null, count: null };
}

export async function executeDbAction(client, state) {
  switch (state.action) {
    case 'select':
      return executeSelect(client, state);
    case 'insert':
      return executeInsert(client, state);
    case 'update':
      return executeUpdate(client, state);
    case 'delete':
      return executeDelete(client, state);
    case 'rpc':
      return executeRpc(client, state);
    default:
      throw new Error(`Accion de BD no soportada: ${state.action}`);
  }
}

export class PgLikeBuilder {
  constructor(executor, table) {
    this.executor = executor;
    this.state = {
      action: 'select',
      table,
      selectColumns: '*',
      filters: [],
      order: null,
      limitNumber: null,
      selectSet: false,
      count: null,
      head: false,
      values: null,
      rpcName: null,
      rpcArgs: null,
    };
  }

  select(columns = '*', options = {}) {
    this.state.action = this.state.action === 'insert' || this.state.action === 'update' || this.state.action === 'delete' ? this.state.action : 'select';
    this.state.selectColumns = columns || '*';
    this.state.selectSet = true;
    this.state.count = options.count || null;
    this.state.head = Boolean(options.head);
    return this;
  }

  insert(values) {
    this.state.action = 'insert';
    this.state.values = values;
    return this;
  }

  update(values) {
    this.state.action = 'update';
    this.state.values = values;
    return this;
  }

  delete() {
    this.state.action = 'delete';
    return this;
  }

  rpc(name, args) {
    this.state.action = 'rpc';
    this.state.rpcName = name;
    this.state.rpcArgs = args;
    return this;
  }

  eq(column, value) { this.state.filters.push({ type: 'eq', column, value }); return this; }
  neq(column, value) { this.state.filters.push({ type: 'neq', column, value }); return this; }
  gte(column, value) { this.state.filters.push({ type: 'gte', column, value }); return this; }
  lte(column, value) { this.state.filters.push({ type: 'lte', column, value }); return this; }
  ilike(column, value) { this.state.filters.push({ type: 'ilike', column, value }); return this; }
  not(column, operator, value) {
    if (operator === 'is' && value == null) {
      this.state.filters.push({ type: 'is-not-null', column });
    } else {
      this.state.filters.push({ type: 'not', column, operator, value });
    }
    return this;
  }
  order(column, options = {}) { this.state.order = { column, ascending: options.ascending !== false }; return this; }
  limit(number) { this.state.limitNumber = number; return this; }
  single() { this.state.single = true; return this; }
  maybeSingle() { this.state.maybeSingle = true; return this; }

  async execute() {
    const result = await this.executor(this.state);
    if (this.state.single) {
      const data = Array.isArray(result.data) ? result.data[0] || null : result.data;
      if (!data) {
        return { data: null, error: null, count: result.count };
      }
      return { ...result, data };
    }
    if (this.state.maybeSingle) {
      const data = Array.isArray(result.data) ? result.data[0] || null : result.data;
      return { ...result, data };
    }
    return result;
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  catch(reject) {
    return this.execute().catch(reject);
  }
}

export function createDbLikeClient(executor, authAdapter) {
  return {
    auth: {
      async getUser() {
        return authAdapter.getUser();
      },
      async signInWithPassword(credentials) {
        return authAdapter.signInWithPassword(credentials);
      },
      async signOut() {
        return authAdapter.signOut();
      },
    },
    from(table) {
      return new PgLikeBuilder(executor, table);
    },
    rpc(name, args) {
      return new PgLikeBuilder(executor, null).rpc(name, args);
    },
  };
}
