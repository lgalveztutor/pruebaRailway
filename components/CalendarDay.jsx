'use client';

import { useState } from 'react';

// Celda de día del calendario. Si el día junta muchos turnos, no los apila:
// muestra un botón "N turnos · ver" que abre un menú con TODOS los turnos.
const MAX_INLINE = 3;

export default function CalendarDay({ day, events = [], isToday }) {
  const [open, setOpen] = useState(false);
  const many = events.length > MAX_INLINE;

  return (
    <div className={'cal-cell' + (isToday ? ' today' : '')}>
      <div className="cal-daynum">{day}</div>

      {/* Pocos turnos: se ven en la celda */}
      {!many && events.map((ev, j) => (
        <div className={'cal-ev ' + ev.tipo} key={j} title={ev.txt}>{ev.txt}</div>
      ))}

      {/* Día lleno: se colapsa en un botón que abre el menú */}
      {many && (
        <button type="button" className="cal-more-btn" onClick={() => setOpen(true)}>
          📋 {events.length} turnos · ver
        </button>
      )}

      {open && (
        <>
          <div className="cal-backdrop" onClick={() => setOpen(false)} />
          <div className="cal-pop" role="dialog">
            <div className="cal-pop-head">
              <strong>Día {day} · {events.length} turnos</strong>
              <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar">✕</button>
            </div>
            <div className="cal-pop-list">
              {events.map((ev, j) => (
                <a className={'cal-pop-item ' + ev.tipo} key={j} href={ev.href} onClick={() => setOpen(false)}>
                  {ev.txt}
                  <span className="cal-pop-go">Ver →</span>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
