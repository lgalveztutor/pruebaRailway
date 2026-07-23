'use client';

// Botón para descargar datos como CSV (se abre en Excel).
export default function ExportCSV({ filename = 'reporte.csv', headers = [], rows = [] }) {
  function download() {
    const esc = (v) => {
      const s = v == null ? '' : String(v);
      return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const lines = [headers.join(';'), ...rows.map((r) => r.map(esc).join(';'))];
    const csv = '﻿' + lines.join('\n'); // BOM para acentos en Excel
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button className="btn-secondary" onClick={download} disabled={rows.length === 0}>
      Exportar CSV ({rows.length})
    </button>
  );
}
