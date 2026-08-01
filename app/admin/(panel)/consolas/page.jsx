import { createClient } from '@/lib/postgres-client.server';
import { money } from '@/lib/format';
import ConsolaForm from '@/components/forms/ConsolaForm';
import ConsolaSessionForm from '@/components/forms/ConsolaSessionForm';
import EstadoConsola from '@/components/EstadoConsola';

export const dynamic = 'force-dynamic';

const ESTADO_TXT = { disponible: 'Disponible', en_uso: 'En uso', reservada: 'Reservada', fuera_servicio: 'Fuera de servicio' };

export default async function ConsolasPage() {
  let consoles = [];
  let sesiones = [];
  let err = null;
  const client = createClient();
  const [c, s] = await Promise.all([
    client.from('consoles').select('id, nombre, estado').order('nombre', { ascending: true }),
    client.from('console_sessions').select('id, juego, inicio, fin, precio, estado, consoles(nombre)').order('id', { ascending: false }).limit(50),
  ]);
  consoles = c.data || [];
  sesiones = s.data || [];
  err = c.error?.message || s.error?.message || null;

  return (
    <div>
      <h1 className="admin-h1">Consolas</h1>
      <p className="admin-sub">Estado de las consolas y sesiones de juego.</p>

      <ConsolaForm />
      <ConsolaSessionForm consoles={consoles} />

      {err && <p className="form-msg err" style={{ marginTop: 16 }}>Error: {err}</p>}

      <p className="section-title" style={{ marginTop: 26 }}>Consolas</p>
      <div className="table-wrap" style={{ marginTop: 0 }}>
        <table className="data">
          <thead><tr><th>Consola</th><th>Estado</th></tr></thead>
          <tbody>
            {consoles.length === 0 && <tr><td colSpan={2} className="empty">No hay consolas cargadas.</td></tr>}
            {consoles.map((c) => (
              <tr key={c.id}>
                <td>{c.nombre}</td>
                <td><EstadoConsola id={c.id} estado={c.estado} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="section-title" style={{ marginTop: 26 }}>Últimas sesiones</p>
      <div className="table-wrap" style={{ marginTop: 0 }}>
        <table className="data">
          <thead><tr><th>Consola</th><th>Juego</th><th>Inicio</th><th>Fin</th><th>Precio</th><th>Estado</th></tr></thead>
          <tbody>
            {sesiones.length === 0 && <tr><td colSpan={6} className="empty">Sin sesiones registradas.</td></tr>}
            {sesiones.map((s) => (
              <tr key={s.id}>
                <td>{s.consoles?.nombre || '—'}</td>
                <td>{s.juego || '—'}</td>
                <td>{s.inicio ? new Date(s.inicio).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                <td>{s.fin ? new Date(s.fin).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                <td>{money(s.precio)}</td>
                <td>{s.estado || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
