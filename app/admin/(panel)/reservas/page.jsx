import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { fechaCorta, money } from '@/lib/format';
import ReservaForm from '@/components/forms/ReservaForm';
import WalkinForm from '@/components/forms/WalkinForm';
import DevolverPulsera from '@/components/DevolverPulsera';
import EstadoSelect from '@/components/EstadoSelect';

export const dynamic = 'force-dynamic';

const hhmm = (t) => (t ? String(t).slice(0, 5) : '—');

const OPC_RESERVA = [
  { v: 'pendiente', label: 'Pendiente' },
  { v: 'reservado', label: 'Reservado' },
  { v: 'sena', label: 'Seña' },
  { v: 'pago_completo', label: 'Pago completo' },
  { v: 'confirmada', label: 'Confirmada' },
  { v: 'realizada', label: 'Realizada' },
  { v: 'cancelada', label: 'Cancelada' },
];
const OPC_CUMPLE = [
  { v: 'consultado', label: 'Consultado' },
  { v: 'senado', label: 'Señado' },
  { v: 'confirmado', label: 'Confirmado' },
  { v: 'pago_completo', label: 'Pago completo' },
  { v: 'realizado', label: 'Realizado' },
  { v: 'cancelado', label: 'Cancelado' },
];

export default async function ReservasPage() {
  let conTurno = [];
  let walkins = [];
  let err = null;

  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const [r, b, w] = await Promise.all([
      supabase.from('reservations')
        .select('id, nombre, telefono, fecha, hora, personas, tipo, sena, total_estimado, estado')
        .order('fecha', { ascending: false }).limit(200),
      supabase.from('birthday_reservations')
        .select('id, cumpleanero, fecha, horario, cant_chicos, cant_adultos, sena, total, estado')
        .order('fecha', { ascending: false }).limit(200),
      supabase.from('walkin_orders')
        .select('id, fecha, encargado, personas, sector, precio, pago_total, medio_pago, hora_pedida, hora_terminada, estado')
        .order('id', { ascending: false }).limit(200),
    ]);
    err = r.error?.message || b.error?.message || w.error?.message || null;

    const reservas = (r.data || []).map((x) => ({
      key: 'r' + x.id, tabla: 'reservations', rid: x.id, fecha: x.fecha, hora: x.hora, nombre: x.nombre, telefono: x.telefono,
      personas: x.personas, tipo: x.tipo || 'general', sena: x.sena, total: x.total_estimado, estado: x.estado, origen: 'Reserva',
    }));
    const cumples = (b.data || []).map((x) => ({
      key: 'b' + x.id, tabla: 'birthday_reservations', rid: x.id, fecha: x.fecha, hora: x.horario, nombre: x.cumpleanero, telefono: null,
      personas: (Number(x.cant_chicos || 0) + Number(x.cant_adultos || 0)) || null,
      tipo: 'cumpleaños', sena: x.sena, total: x.total, estado: x.estado, origen: 'Cumpleaños',
    }));
    conTurno = [...reservas, ...cumples].sort((a, z) => (a.fecha < z.fecha ? 1 : -1));
    walkins = w.data || [];
  }

  return (
    <div>
      <h1 className="admin-h1">Reservas</h1>
      <p className="admin-sub">Clientes con turno y clientes de orden de llegada, todo junto.</p>
      {err && <p className="form-msg err">Error: {err}</p>}

      {/* ===================== CON TURNO ===================== */}
      <p className="section-title" style={{ marginTop: 8, color: 'var(--cyan)', fontSize: 17 }}>🗓️ Clientes con turno</p>
      <ReservaForm />
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>Fecha</th><th>Hora</th><th>Cliente</th><th>Pers.</th><th>Tipo</th><th>Origen</th><th>Seña</th><th>Total</th><th>Estado</th></tr>
          </thead>
          <tbody>
            {conTurno.length === 0 && <tr><td colSpan={9} className="empty">Sin reservas con turno.</td></tr>}
            {conTurno.map((r) => (
              <tr key={r.key} id={r.key}>
                <td>{fechaCorta(r.fecha)}</td>
                <td>{hhmm(r.hora)}</td>
                <td>{r.nombre || '—'}</td>
                <td>{r.personas ?? '—'}</td>
                <td>{r.tipo}</td>
                <td>{r.origen === 'Cumpleaños'
                  ? <span className="pill senado">🎂 Cumpleaños</span>
                  : <span style={{ color: 'var(--muted)' }}>Reserva</span>}</td>
                <td>{money(r.sena)}</td>
                <td>{money(r.total)}</td>
                <td><EstadoSelect tabla={r.tabla} id={r.rid} value={r.estado} options={r.origen === 'Cumpleaños' ? OPC_CUMPLE : OPC_RESERVA} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===================== SIN TURNO / ORDEN DE LLEGADA ===================== */}
      <p className="section-title" style={{ marginTop: 34, color: 'var(--magenta)', fontSize: 17 }}>🎟️ Clientes sin turno · Orden de llegada</p>
      <WalkinForm />
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>Encargado</th><th>Pers.</th><th>Sector · horas</th><th>Pedida</th><th>Terminada</th><th>Pago</th><th>Medio</th><th>Origen</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {walkins.length === 0 && <tr><td colSpan={10} className="empty">Sin órdenes de llegada.</td></tr>}
            {walkins.map((o) => (
              <tr key={o.id}>
                <td>{o.encargado}</td>
                <td>{o.personas ?? '—'}</td>
                <td>{o.sector || '—'}</td>
                <td>{hhmm(o.hora_pedida)}</td>
                <td>{hhmm(o.hora_terminada)}</td>
                <td>{money(o.pago_total)}</td>
                <td>{o.medio_pago || '—'}</td>
                <td><span className="pill consultado">Orden de llegada</span></td>
                <td><span className={'pill ' + (o.estado === 'devuelta' ? 'realizada' : 'en_uso')}>{o.estado}</span></td>
                <td>{o.estado === 'activa' && <DevolverPulsera id={o.id} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
