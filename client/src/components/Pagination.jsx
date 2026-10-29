export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.totalPages <= 1) {
    return meta?.total ? <p className="small text-muted mb-0">Showing {meta.total} result{meta.total === 1 ? '' : 's'}</p> : null;
  }
  const { page, totalPages, total, limit } = meta;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const pages = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p += 1) pages.push(p);

  return (
    <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
      <p className="small text-muted mb-0">Showing {start}–{end} of {total}</p>
      <nav aria-label="Pagination">
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
            <button type="button" className="page-link" onClick={() => onPageChange(page - 1)} aria-label="Previous page">
              <i className="bi bi-chevron-left" />
            </button>
          </li>
          {pages[0] > 1 && <li className="page-item disabled"><span className="page-link">…</span></li>}
          {pages.map((p) => (
            <li key={p} className={`page-item ${p === page ? 'active' : ''}`} aria-current={p === page ? 'page' : undefined}>
              <button type="button" className="page-link" onClick={() => onPageChange(p)}>{p}</button>
            </li>
          ))}
          {pages[pages.length - 1] < totalPages && <li className="page-item disabled"><span className="page-link">…</span></li>}
          <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
            <button type="button" className="page-link" onClick={() => onPageChange(page + 1)} aria-label="Next page">
              <i className="bi bi-chevron-right" />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
