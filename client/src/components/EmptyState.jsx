export default function EmptyState({ icon = 'bi-inbox', title, message, action }) {
  return (
    <div className="text-center py-5 px-3">
      <div className="mx-auto mb-3 cf-category-icon" style={{ width: 56, height: 56, fontSize: '1.6rem' }} aria-hidden="true">
        <i className={`bi ${icon}`} />
      </div>
      <h3 className="h5">{title}</h3>
      {message && <p className="text-muted mx-auto" style={{ maxWidth: '46ch' }}>{message}</p>}
      {action}
    </div>
  );
}
