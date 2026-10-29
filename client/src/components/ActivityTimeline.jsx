import StatusBadge from './StatusBadge.jsx';
import { ACTION_LABEL } from '../utils/constants.js';
import { formatDateTime } from '../utils/format.js';

const ICON = {
  CREATED: 'bi-flag-fill',
  EDITED: 'bi-pencil',
  STATUS_CHANGED: 'bi-arrow-repeat',
  ASSIGNED: 'bi-person-badge',
  PUBLIC_UPDATE: 'bi-megaphone',
  CITIZEN_COMMENT: 'bi-chat-left-text',
  INTERNAL_NOTE: 'bi-lock-fill',
};

export default function ActivityTimeline({ items = [], showInternal = false }) {
  if (!items.length) return <p className="text-muted small mb-0">No activity yet.</p>;
  return (
    <ol className="cf-timeline">
      {items.map((a) => {
        const internalOnly = showInternal && a.visibleToCitizen === false;
        const iconClass = internalOnly ? 'internal' : a.actor?.role === 'citizen' ? 'citizen' : '';
        return (
          <li key={a._id}>
            <span className={`cf-timeline-icon ${iconClass}`} aria-hidden="true"><i className={`bi ${ICON[a.action] || 'bi-dot'}`} /></span>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <strong className="small">{ACTION_LABEL[a.action] || a.action}</strong>
              {a.action === 'STATUS_CHANGED' && (
                <span className="d-inline-flex align-items-center gap-1">
                  {a.previousStatus && <StatusBadge status={a.previousStatus} />}
                  <i className="bi bi-arrow-right small text-muted" aria-label="to" />
                  <StatusBadge status={a.newStatus} />
                </span>
              )}
              {internalOnly && <span className="badge text-bg-warning">Staff only</span>}
            </div>
            <div className="small text-muted d-flex flex-wrap gap-2"><span>{a.actor?.name}</span><time dateTime={a.createdAt}>{formatDateTime(a.createdAt)}</time></div>
            {a.publicMessage && <p className="mb-1 mt-1">{a.publicMessage}</p>}
            {showInternal && a.internalNote && (
              <div className="cf-internal-note mt-1"><i className="bi bi-lock me-1" aria-hidden="true" /><span className="visually-hidden">Internal note: </span>{a.internalNote}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
