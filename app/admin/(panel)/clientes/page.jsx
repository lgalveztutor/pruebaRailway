import { createClient } from '@/lib/postgres-client.server';
import { fechaCorta } from '@/lib/format';
import ClienteForm from '@/components/forms/ClienteForm';
import AtenderLead from '@/components/AtenderLead';
import DescargarInvitados from '@/components/DescargarInvitados';

export const dynamic = 'force-dynamic';

const hhmm = (t) => (t ? String(t).slice(0, 5) : '—');

export default async function ClientesPage() {
  let rows = [];
  let leads = [];
  let invitados = [];
  let err = null;
  let invErr = null;
  const supabase = createClient();

  // Retención: purga contactos de invitados con más de 31 días (no satura la base).
  await supabase.rpc('purgar_invitados_viejos');

  const [c, l, g] = await Promise.all([
    supabase.from('clients')
      .select('id, nombre, telefono, email, cumpleanos, codigo_referido, descuento_pct, created_at')
      .order('created_at', { ascending: false }).limit(200),
    supabase.from('web_leads')
      .select('id, nombre, telefono, experiencia, dia, hora, personas, codigo_referido, created_at')
      .eq('atendido', false)
      .order('created_at', { ascending: false }).limit(100),
    supabase.from('birthday_guests')
      .select('id, cumple_nombre, cumple_telefono, cumple_fecha, nino_nombre, nino_detalle, adulto_nombre, adulto_telefono, created_at')
      .order('created_at', { ascending: false }).limit(1000),
  ]);
  rows = c.data || [];
  leads = l.data || [];
  invitados = g.data || [];
  err = c.error?.message || null;
  invErr = g.error?.message || null;

  // Agrupa los invitados en "carpetas" por cumpleañero.
  const carpetas = {};
  for (const g of invitados) {
    const key = (g.cumple_nombre || '—') + '|' + (g.cumple_telefono || '');
    if (!carpetas[key]) carpetas[key] = { nombre: g.cumple_nombre || '—', telefono: g.cumple_telefono, fecha: g.cumple_fecha, items: [] };
    carpetas[key].items.push(g);
  }
  const carpetasArr = Object.values(carpetas);

  return (
    <div>
      <h1 className="admin-h1">Clientes</h1>
      <p className="admin-sub">Agenda principal · las consultas de la web caen acá (embudo).</p>

      {/* ===== Embudo: consultas de la web sin atender ===== */}
      {leads.length > 0 && (
        <div className="card" style={{ borderColor: 'rgba(255,46,166,.4)' }}>
          <p className="section-title" style={{ color: 'var(--magenta)' }}>📥 Consultas de la web ({leads.length})</p>
          <div className="table-wrap" style={{ marginTop: 0 }}>
            <table className="data">
              <thead>
                <tr><th>Nombre</th><th>WhatsApp</th><th>Quiere</th><th>Día</th><th>Hora</th><th>Pers.</th><th>Referido</th><th>Entró</th><th></th></tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id}>
                    <td>{l.nombre || '—'}</td>
                    <td>{l.telefono || '—'}</td>
                    <td>{l.experiencia || '—'}</td>
                    <td>{l.dia ? fechaCorta(l.dia) : '—'}</td>
                    <td>{hhmm(l.hora)}</td>
                    <td>{l.personas ?? '—'}</td>
                    <td>{l.codigo_referido ? <span className="pill realizada">{l.codigo_referido}</span> : '—'}</td>
                    <td>{fechaCorta(String(l.created_at).slice(0, 10))}</td>
                    <td><AtenderLead id={l.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== Contactos capturados por listas de invitados de cumpleaños ===== */}
      <div className="card" style={{ borderColor: 'rgba(156,255,46,.35)', marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <p className="section-title" style={{ color: 'var(--green)', marginBottom: 2 }}>🎂 Contactos de listas de invitados ({invitados.length})</p>
            <p className="admin-sub" style={{ marginTop: 0 }}>Una carpeta por cumpleañero · se guardan hasta 1 mes · descargá el ZIP antes del cierre.</p>
          </div>
          <DescargarInvitados data={invitados} />
        </div>

        {invErr && (
          <p className="form-msg err">No se pudo leer la tabla de invitados. Falta correr <code>db/paso-13-invitados.sql</code> en PostgreSQL. ({invErr})</p>
        )}

        {!invErr && invitados.length === 0 && (
          <p className="empty" style={{ marginTop: 10 }}>Todavía no hay listas de invitados cargadas desde la web.</p>
        )}

        {!invErr && carpetasArr.map((c, i) => (
          <details className="folder" key={i}>
            <summary>
              📁 {c.nombre}
              <span style={{ color: 'var(--muted)', fontWeight: 500 }}> · {c.items.length} invitado{c.items.length === 1 ? '' : 's'}{c.telefono ? ` · ${c.telefono}` : ''}{c.fecha ? ` · ${fechaCorta(c.fecha)}` : ''}</span>
            </summary>
            <div className="table-wrap" style={{ marginTop: 8 }}>
              <table className="data">
                <thead>
                  <tr><th>Niño invitado</th><th>Adulto responsable</th><th>Teléfono</th><th>Detalle</th></tr>
                </thead>
                <tbody>
                  {c.items.map((g) => (
                    <tr key={g.id}>
                      <td>{g.nino_nombre}</td>
                      <td>{g.adulto_nombre}</td>
                      <td>{g.adulto_telefono}</td>
                      <td style={{ color: 'var(--muted)' }}>{g.nino_detalle || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ))}
      </div>

      <ClienteForm />

      {err && <p className="form-msg err" style={{ marginTop: 16 }}>Error: {err}</p>}

      <p className="section-title" style={{ marginTop: 26, fontSize: 17, fontWeight: 800, letterSpacing: '.1em' }}>Clientes registrados</p>
      <div className="table-wrap" style={{ marginTop: 0 }}>
        <table className="data">
          <thead>
            <tr><th>Nombre</th><th>Teléfono</th><th>Email</th><th>Cumpleaños</th><th>Referido</th><th>Alta</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="empty">Todavía no hay clientes cargados.</td></tr>
            )}
            {rows.map((c) => (
              <tr key={c.id}>
                <td>{c.nombre}</td>
                <td>{c.telefono || '—'}</td>
                <td>{c.email || '—'}</td>
                <td>{c.cumpleanos ? fechaCorta(c.cumpleanos) : '—'}</td>
                <td>{c.codigo_referido
                  ? <span className="pill realizada">{c.codigo_referido}{Number(c.descuento_pct) > 0 ? ` · ${c.descuento_pct}%` : ''}</span>
                  : '—'}</td>
                <td>{fechaCorta(c.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
