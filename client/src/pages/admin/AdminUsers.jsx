import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader.jsx';
import Pagination from '../../components/Pagination.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmationModal from '../../components/ConfirmationModal.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { adminService } from '../../services/adminService.js';
import { getErrorMessage } from '../../services/api.js';
import { formatDate } from '../../utils/format.js';

function UserDetails({ userId, onClose }) {
  const { data, loading, error } = useAsync(() => (userId ? adminService.user(userId) : Promise.resolve(null)), [userId]);
  return (
    <Modal show={Boolean(userId)} title="Account details" onClose={onClose} size="modal-lg">
      {loading && <LoadingSpinner />}
      <ErrorMessage message={error} />
      {data && (
        <>
          <div className="row g-3 small mb-3">
            <div className="col-sm-6"><div className="text-muted">Name</div>{data.user.name}</div>
            <div className="col-sm-6"><div className="text-muted">Email</div>{data.user.email}</div>
            <div className="col-sm-6"><div className="text-muted">Phone</div>{data.user.phone || '—'}</div>
            <div className="col-sm-6"><div className="text-muted">Role</div>{data.user.role === 'admin' ? 'Administrator' : 'Citizen'}</div>
            <div className="col-sm-6"><div className="text-muted">Joined</div>{formatDate(data.user.createdAt)}</div>
            <div className="col-sm-6"><div className="text-muted">Last login</div>{data.user.lastLoginAt ? formatDate(data.user.lastLoginAt) : 'Never'}</div>
          </div>
          <h3 className="h6">Complaints ({data.complaintCount})</h3>
          <div className="d-flex flex-wrap gap-2 mb-3">
            {Object.entries(data.complaintsByStatus).map(([s, n]) => <span key={s} className="small"><StatusBadge status={s} /> {n}</span>)}
          </div>
          {data.recentComplaints.length > 0 && (
            <ul className="list-group">
              {data.recentComplaints.map((c) => (
                <li key={c._id} className="list-group-item d-flex justify-content-between align-items-center gap-2">
                  <Link to={`/admin/complaints/${c._id}`} onClick={onClose} className="text-decoration-none small">
                    <span className="cf-ref me-2">{c.referenceNumber}</span>{c.title}
                  </Link>
                  <StatusBadge status={c.status} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Modal>
  );
}

export default function AdminUsers() {
  useDocumentTitle('Users');
  const { user: me } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [role, setRole] = useState('');
  const [active, setActive] = useState('');
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setPage(1); }, [debounced, role, active]);

  const { data, loading, error, reload } = useAsync(
    () => adminService.users({ search: debounced, role, active, page, limit: 15 }),
    [debounced, role, active, page],
  );
  const users = data?.data?.users || [];

  const confirmToggle = async () => {
    setBusy(true);
    try {
      const res = await adminService.setUserActive(toggling._id, !toggling.isActive);
      toast.success(res.message);
      setToggling(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setToggling(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Users" subtitle="Registered accounts and how many complaints each has submitted." />
      <div className="cf-card-flat p-3 mb-3">
        <div className="row g-2 align-items-end">
          <div className="col-md-6">
            <label htmlFor="u-search" className="form-label small mb-1">Search</label>
            <input id="u-search" type="search" className="form-control" placeholder="Name, email or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="col-6 col-md-3">
            <label htmlFor="u-role" className="form-label small mb-1">Role</label>
            <select id="u-role" className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">All roles</option><option value="citizen">Citizens</option><option value="admin">Administrators</option>
            </select>
          </div>
          <div className="col-6 col-md-3">
            <label htmlFor="u-active" className="form-label small mb-1">Account status</label>
            <select id="u-active" className="form-select" value={active} onChange={(e) => setActive(e.target.value)}>
              <option value="">All</option><option value="true">Active</option><option value="false">Deactivated</option>
            </select>
          </div>
        </div>
      </div>

      <div className="cf-card p-3">
        {loading && <LoadingSpinner label="Loading users" />}
        <ErrorMessage message={error} onRetry={reload} />
        {!loading && !error && users.length === 0 && <EmptyState icon="bi-people" title="No users found" message="Try a different search or filter." />}
        {!loading && !error && users.length > 0 && (
          <>
            <div className="table-responsive">
              <table className="table cf-table align-middle">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>Complaints</th><th>Joined</th><th>Status</th><th><span className="visually-hidden">Actions</span></th></tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td className="fw-semibold">{u.name}</td>
                      <td className="small">{u.email}</td>
                      <td className="small">{u.role === 'admin' ? <span className="badge text-bg-dark">Admin</span> : 'Citizen'}</td>
                      <td>{u.complaintCount}</td>
                      <td className="small text-nowrap">{formatDate(u.createdAt)}</td>
                      <td>{u.isActive ? <span className="badge text-bg-success">Active</span> : <span className="badge text-bg-secondary">Deactivated</span>}</td>
                      <td className="text-end text-nowrap">
                        <button type="button" className="btn btn-sm btn-outline-primary me-1" onClick={() => setViewing(u._id)}>View</button>
                        {String(u._id) !== String(me._id) && (
                          <button type="button" className={`btn btn-sm ${u.isActive ? 'btn-outline-danger' : 'btn-outline-success'}`} onClick={() => setToggling(u)}>
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={data.meta} onPageChange={setPage} />
          </>
        )}
      </div>

      <UserDetails userId={viewing} onClose={() => setViewing(null)} />
      <ConfirmationModal
        show={Boolean(toggling)}
        title={toggling?.isActive ? 'Deactivate account?' : 'Activate account?'}
        message={toggling?.isActive
          ? `${toggling?.name} will be logged out and unable to sign in until the account is activated again. Their complaints are kept.`
          : `${toggling?.name} will be able to sign in again.`}
        confirmLabel={toggling?.isActive ? 'Deactivate' : 'Activate'}
        variant={toggling?.isActive ? 'danger' : 'success'}
        busy={busy}
        onConfirm={confirmToggle}
        onCancel={() => setToggling(null)}
      />
    </>
  );
}
