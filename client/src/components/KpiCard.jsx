export default function KpiCard({ label, value, icon, tone = 'navy', hint }) {
  const color = { navy: 'var(--cf-navy)', teal: 'var(--cf-teal-700)', amber: 'var(--cf-amber)', green: '#1e6b34', red: '#a12b25', blue: '#2a4f9a' }[tone];
  return (
    <div className="cf-card cf-kpi h-100">
      <div className="d-flex justify-content-between align-items-start">
        <span className="cf-kpi-label">{label}</span>
        {icon && <i className={`bi ${icon} fs-5`} style={{ color }} aria-hidden="true" />}
      </div>
      <div className="cf-kpi-value" style={{ color }}>{value}</div>
      {hint && <div className="small text-muted">{hint}</div>}
    </div>
  );
}
