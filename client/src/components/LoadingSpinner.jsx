export default function LoadingSpinner({ label = 'Loading', fullPage = false, small = false }) {
  const spinner = (
    <div className="d-flex align-items-center justify-content-center gap-2 py-4 text-muted" role="status" aria-live="polite">
      <span className={`spinner-border ${small ? 'spinner-border-sm' : ''}`} style={{ color: 'var(--cf-teal)' }} aria-hidden="true" />
      <span>{label}…</span>
    </div>
  );
  if (!fullPage) return spinner;
  return <div className="d-flex align-items-center justify-content-center min-vh-75">{spinner}</div>;
}
