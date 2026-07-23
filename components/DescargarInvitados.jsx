'use client';

import { useState } from 'react';

// Carga JSZip desde CDN una sola vez.
function loadJSZip() {
  return new Promise((res, rej) => {
    if (window.JSZip) return res(window.JSZip);
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    s.onload = () => res(window.JSZip);
    s.onerror = () => rej(new Error('No se pudo cargar el generador de ZIP.'));
    document.head.appendChild(s);
  });
}

function safe(name) {
  return String(name || 'sin-nombre').replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim().slice(0, 60) || 'sin-nombre';
}

function toCSV(rows) {
  const head = ['Niño invitado', 'Adulto responsable', 'Teléfono', 'Detalle', 'Fecha del cumple', 'Cargado'];
  const esc = (s) => '"' + String(s ?? '').replace(/"/g, '""') + '"';
  const lines = [head.map(esc).join(',')];
  rows.forEach((r) => lines.push([
    r.nino_nombre, r.adulto_nombre, r.adulto_telefono, r.nino_detalle || '',
    r.cumple_fecha || '', String(r.created_at || '').slice(0, 10),
  ].map(esc).join(',')));
  return '﻿' + lines.join('\r\n'); // BOM para que Excel lea los acentos
}

// data: lista plana de invitados. Se arma un árbol Mes → Cumpleañero → contactos.csv
export default function DescargarInvitados({ data = [] }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function descargar() {
    setErr(null);
    setBusy(true);
    try {
      const JSZip = await loadJSZip();
      const zip = new JSZip();
      // agrupa por mes y por cumpleañero
      const agrupa = {};
      for (const g of data) {
        const mes = String(g.created_at || '').slice(0, 7) || 'sin-fecha';
        const cumple = safe(g.cumple_nombre) + (g.cumple_telefono ? ` (${safe(g.cumple_telefono)})` : '');
        const key = `${mes}__${cumple}`;
        (agrupa[key] = agrupa[key] || { mes, cumple, items: [] }).items.push(g);
      }
      Object.values(agrupa).forEach((grp) => {
        zip.folder(grp.mes).folder(grp.cumple).file('contactos.csv', toCSV(grp.items));
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contactos-invitados-${new Date().toISOString().slice(0, 7)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErr(e.message || 'Error al generar el ZIP.');
    } finally {
      setBusy(false);
    }
  }

  if (!data.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <button type="button" className="btn-secondary" onClick={descargar} disabled={busy}>
        {busy ? 'Generando…' : '⬇️ Descargar carpeta (ZIP)'}
      </button>
      {err && <span className="form-msg err" style={{ margin: 0 }}>{err}</span>}
    </div>
  );
}
