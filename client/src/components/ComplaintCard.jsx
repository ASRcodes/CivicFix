import StatusBadge from './StatusBadge.jsx';
import { CATEGORY_ICON } from '../utils/constants.js';
import { timeAgo } from '../utils/format.js';

/** Compact public complaint card (privacy-safe fields only). */
export default function ComplaintCard({ complaint }) {
  return (
    <article className="cf-card p-3 h-100 d-flex flex-column">
      <div className="d-flex justify-content-between align-items-center mb-2 gap-2">
        <span className="cf-ref small">{complaint.referenceNumber}</span>
        <StatusBadge status={complaint.status} />
      </div>
      <h3 className="h6 mb-2">{complaint.title}</h3>
      <div className="small text-muted mt-auto d-flex flex-wrap gap-3">
        <span><i className={`bi ${CATEGORY_ICON[complaint.category] || 'bi-tag'} me-1`} aria-hidden="true" />{complaint.category}</span>
        <span><i className="bi bi-geo-alt me-1" aria-hidden="true" />{complaint.city}</span>
        <span>{timeAgo(complaint.createdAt)}</span>
      </div>
    </article>
  );
}
