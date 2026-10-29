export default function ErrorMessage({ message, onRetry, className = '' }) {
  if (!message) return null;
  return (
    <div className={`alert alert-danger d-flex align-items-start gap-2 ${className}`} role="alert">
      <i className="bi bi-exclamation-octagon-fill mt-1" aria-hidden="true" />
      <div className="flex-grow-1">{message}</div>
      {onRetry && (
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={onRetry}>
          <i className="bi bi-arrow-clockwise me-1" />Try again
        </button>
      )}
    </div>
  );
}
