import { Link } from 'react-router-dom';
import KpiCard from '../../components/KpiCard.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { adminService } from '../../services/adminService.js';
import { ACTION_LABEL, CATEGORY_ICON } from '../../utils/constants.js';
import { timeAgo } from '../../utils/format.js';

export default function AdminDashboard() {
  useDocumentTitle('Admin overview');
  const { data, loading, error, reload } = useAsync(() => adminService.dashboard(), []);

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="Live figures calculated from the complaint database."
        actions={(
          <>
            <button type="button" className="btn btn-light" onClick={reload} disabled={loading}><i className="bi bi-arrow-clockwise me-1" />Refresh</button>
            <Link to="/admin/complaints?status=Pending" className="btn btn-primary">Review pending</Link>
          </>
        )}
      />
      {loading && !data && <LoadingSpinner label="Calculating statistics" />}
      <ErrorMessage message={error} onRetry={reload} />
      {data && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-4 col-xl-2"><KpiCard label="Total" value={data.totals.total} icon="bi-collection" hint={`${data.totals.lastThirtyDays} in last 30 days`} /></div>
            <div className="col-6 col-md-4 col-xl-2"><KpiCard label="Pending" value={data.totals.pending} icon="bi-hourglass-split" tone="amber" /></div>
            <div className="col-6 col-md-4 col-xl-2"><KpiCard label="Under review" value={data.totals.underReview} icon="bi-search" tone="blue" /></div>
            <div className="col-6 col-md-4 col-xl-2"><KpiCard label="In progress" value={data.totals.inProgress} icon="bi-tools" tone="teal" /></div>
            <div className="col-6 col-md-4 col-xl-2"><KpiCard label="Resolved" value={data.totals.resolved} icon="bi-check2-circle" tone="green" /></div>
            <div className="col-6 col-md-4 col-xl-2"><KpiCard label="Rejected" value={data.totals.rejected} icon="bi-x-circle" tone="red" /></div>
          </div>

          <div className="row g-4">
            <div className="col-lg-5">
              <div className="cf-card p-3 p-md-4 mb-4">
                <h2 className="h6 text-muted">Resolution rate</h2>
                <div className="d-flex align-items-end gap-3 mb-2">
                  <span className="cf-kpi-value">{data.resolutionRate}%</span>
                  <span className="small text-muted pb-2">of non-rejected complaints resolved</span>
                </div>
                <div className="cf-bar mb-3" role="img" aria-label={`Resolution rate ${data.resolutionRate} percent`}><span style={{ width: `${data.resolutionRate}%` }} /></div>
                <div className="small text-muted">
                  Average time to resolve: <strong className="text-body">{data.averageResolutionDays ?? '—'}{data.averageResolutionDays != null && ' days'}</strong>
                  <br />Registered citizens: <strong className="text-body">{data.totals.citizens}</strong>, active departments: <strong className="text-body">{data.totals.activeDepartments}</strong>
                </div>
              </div>

              <div className="cf-card p-3 p-md-4">
                <h2 className="h6 text-muted mb-3">Complaints by category</h2>
                {(() => {
                  const max = Math.max(1, ...data.byCategory.map((c) => c.count));
                  return (
                    <ul className="list-unstyled d-grid gap-3 mb-0">
                      {data.byCategory.map((c) => (
                        <li key={c.category}>
                          <div className="d-flex justify-content-between small mb-1">
                            <Link to={`/admin/complaints?category=${encodeURIComponent(c.category)}`} className="text-decoration-none text-body">
                              <i className={`bi ${CATEGORY_ICON[c.category]} me-1 text-muted`} aria-hidden="true" />{c.category}
                            </Link>
                            <strong>{c.count}</strong>
                          </div>
                          <div className="cf-bar"><span style={{ width: `${(c.count / max) * 100}%` }} /></div>
                        </li>
                      ))}
                    </ul>
                  );
                })()}
              </div>
            </div>

            <div className="col-lg-7">
              <div className="cf-card p-3 p-md-4 h-100">
                <h2 className="h6 text-muted mb-3">Recent activity</h2>
                {data.recentActivity.length === 0 ? <p className="text-muted small">No activity yet.</p> : (
                  <ul className="list-group list-group-flush">
                    {data.recentActivity.map((a) => (
                      <li key={a._id} className="list-group-item px-0">
                        <div className="d-flex justify-content-between gap-2">
                          <div className="min-w-0">
                            <span className="small fw-semibold">{ACTION_LABEL[a.action]}</span>
                            {a.newStatus && a.action === 'STATUS_CHANGED' && <span className="small"> to {a.newStatus}</span>}
                            {a.complaint && (
                              <div className="small text-truncate">
                                <Link to={`/admin/complaints/${a.complaint._id}`} className="cf-ref text-decoration-none me-1">{a.complaint.referenceNumber}</Link>
                                <span className="text-muted">{a.complaint.title}</span>
                              </div>
                            )}
                          </div>
                          <div className="small text-muted text-end text-nowrap">{a.actor.name}<br />{timeAgo(a.createdAt)}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
