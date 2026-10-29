import { Link } from 'react-router-dom';
import KpiCard from '../../components/KpiCard.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { complaintService } from '../../services/complaintService.js';
import { timeAgo } from '../../utils/format.js';

export default function CitizenDashboard() {
  useDocumentTitle('My dashboard');
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(() => complaintService.summary(), []);

  return (
    <>
      <PageHeader
        title={`Hello, ${user.name.split(' ')[0]}`}
        subtitle="Here is where your complaints stand today."
        actions={<Link to="/dashboard/complaints/new" className="btn btn-teal"><i className="bi bi-plus-lg me-1" />Report an issue</Link>}
      />
      {loading && <LoadingSpinner label="Loading your summary" />}
      <ErrorMessage message={error} onRetry={reload} />
      {data && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-6 col-xl-3"><KpiCard label="Total submitted" value={data.total} icon="bi-collection" /></div>
            <div className="col-6 col-xl-3"><KpiCard label="Pending" value={data.byStatus.Pending} icon="bi-hourglass-split" tone="amber" /></div>
            <div className="col-6 col-xl-3"><KpiCard label="In progress" value={data.byStatus['Under Review'] + data.byStatus['In Progress']} icon="bi-tools" tone="teal" hint="Under review or being worked on" /></div>
            <div className="col-6 col-xl-3"><KpiCard label="Resolved" value={data.byStatus.Resolved} icon="bi-check2-circle" tone="green" /></div>
          </div>
          <div className="cf-card p-3 p-md-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h5 mb-0">Recent activity</h2>
              <Link to="/dashboard/complaints" className="small">See all complaints</Link>
            </div>
            {data.recent.length === 0 ? (
              <EmptyState
                icon="bi-megaphone"
                title="You have not reported anything yet"
                message="Spotted a pothole, a broken light or uncollected garbage? Report it and follow its progress here."
                action={<Link to="/dashboard/complaints/new" className="btn btn-teal">Report your first issue</Link>}
              />
            ) : (
              <ul className="list-group list-group-flush">
                {data.recent.map((c) => (
                  <li key={c._id} className="list-group-item px-0 d-flex flex-wrap align-items-center gap-2">
                    <div className="flex-grow-1 min-w-0">
                      <Link to={`/dashboard/complaints/${c._id}`} className="fw-semibold text-decoration-none">{c.title}</Link>
                      <div className="small text-muted"><span className="cf-ref me-2">{c.referenceNumber}</span>updated {timeAgo(c.updatedAt)}</div>
                    </div>
                    <StatusBadge status={c.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </>
  );
}
