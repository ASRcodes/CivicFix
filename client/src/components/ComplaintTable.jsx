import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';
import PriorityBadge from './PriorityBadge.jsx';
import { CATEGORY_ICON } from '../utils/constants.js';
import { formatDate } from '../utils/format.js';

/**
 * Complaint list: a table on md+ screens and stacked cards on phones.
 * linkBase: '/dashboard/complaints' or '/admin/complaints'
 */
export default function ComplaintTable({ complaints, linkBase, showCitizen = false }) {
  return (
    <>
      <div className="table-responsive d-none d-md-block">
        <table className="table cf-table align-middle">
          <thead>
            <tr>
              <th scope="col">Reference</th>
              <th scope="col">Title</th>
              <th scope="col">Category</th>
              {showCitizen && <th scope="col">Citizen</th>}
              <th scope="col">Submitted</th>
              <th scope="col">Priority</th>
              <th scope="col">Status</th>
              <th scope="col">Assigned to</th>
              <th scope="col"><span className="visually-hidden">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((c) => (
              <tr key={c._id}>
                <td className="cf-ref">{c.referenceNumber}</td>
                <td style={{ maxWidth: 260 }}><div className="text-truncate fw-semibold">{c.title}</div><div className="small text-muted text-truncate">{c.city}</div></td>
                <td className="small text-nowrap"><i className={`bi ${CATEGORY_ICON[c.category]} me-1 text-muted`} aria-hidden="true" />{c.category}</td>
                {showCitizen && <td className="small">{c.citizenId?.name || '—'}</td>}
                <td className="small text-nowrap">{formatDate(c.createdAt)}</td>
                <td><PriorityBadge priority={c.priority} /></td>
                <td><StatusBadge status={c.status} /></td>
                <td className="small">
                  {c.departmentId?.name || <span className="text-muted">Not assigned</span>}
                  {c.assignedTo && <div className="text-muted">{c.assignedTo}</div>}
                </td>
                <td className="text-end">
                  <Link to={`${linkBase}/${c._id}`} className="btn btn-sm btn-outline-primary text-nowrap">View details</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="d-md-none d-grid gap-2">
        {complaints.map((c) => (
          <Link key={c._id} to={`${linkBase}/${c._id}`} className="cf-card-flat p-3 text-decoration-none text-reset">
            <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
              <span className="cf-ref small">{c.referenceNumber}</span>
              <StatusBadge status={c.status} />
            </div>
            <div className="fw-semibold">{c.title}</div>
            <div className="small text-muted d-flex flex-wrap gap-3 mt-1">
              <span>{c.category}</span><span>{formatDate(c.createdAt)}</span><PriorityBadge priority={c.priority} />
            </div>
            {showCitizen && c.citizenId?.name && <div className="small text-muted mt-1">By {c.citizenId.name}</div>}
          </Link>
        ))}
      </div>
    </>
  );
}
