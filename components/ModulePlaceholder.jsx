// Placeholder de modulo (Paso 1). Se reemplaza por la funcionalidad real en los Pasos 4-5.
export default function ModulePlaceholder({ title, description, stage }) {
  return (
    <div>
      <h1 className="admin-h1">{title}</h1>
      <p className="admin-sub">{description}</p>
      <div className="card">
        <span className="badge badge-soon">Próximamente · {stage}</span>
        <p style={{ color: 'var(--muted)', marginBottom: 0, marginTop: 14 }}>
          Este módulo ya tiene su ruta y su lugar en el panel. La carga y gestión
          de datos se implementa en {stage}.
        </p>
      </div>
    </div>
  );
}
