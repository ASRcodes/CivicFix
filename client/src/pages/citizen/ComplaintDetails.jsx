import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import StatusBadge from '../../components/StatusBadge.jsx';
import PriorityBadge from '../../components/PriorityBadge.jsx';
import ActivityTimeline from '../../components/ActivityTimeline.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ConfirmationModal from '../../components/ConfirmationModal.jsx';
import AdminComplaintPanel from '../../features/admin/AdminComplaintPanel.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { complaintService } from '../../services/complaintService.js';
import { getErrorMessage } from '../../services/api.js';
import { CATEGORY_ICON } from '../../utils/constants.js';
import { formatDateTime } from '../../utils/format.js';

/** Complaint details for both citizens (owner) and administrators. */
export default function ComplaintDetails() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const base = isAdmin ? '/admin/complaints' : '/dashboard/complaints';

  const { data, loading, error, reload, status } = useAsync(() => complaintService.get(id), [id]);
  useDocumentTitle(data?.complaint?.referenceNumber || 'Complaint');

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [comment, setComment] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  if (loading && !data) return <LoadingSpinner label="Loading complaint" />;
  if (error && !data) {
    if (status === 404 || status === 403) {
      return (
        <EmptyState icon="bi-file-earmark-x" title={status === 404 ? 'Complaint not found' : 'You cannot view this complaint'}
          message={status === 404 ? 'It may have been deleted.' : 'Complaints are only visible to the citizen who submitted them and to staff.'}
          action={<Link to={base} className="btn btn-primary">Back to complaints</Link>} />
      );
    }
    return <ErrorMessage message={error} onRetry={reload} />;
  }

  const { complaint: c, timeline, permissions } = data;

  const remove = async () => {
    setDeleting(true);
    try {
      await complaintService.remove(c._id);
      toast.success(`Complaint ${c.referenceNumber} deleted`);
      navigate(base, { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const sendComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setCommentBusy(true);
    try {
      await complaintService.addUpdate(c._id, { publicMessage: comment.trim() });
      setComment('');
      toast.success('Comment added');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCommentBusy(false);
    }
  };

  const mapUrl = c.latitude != null && c.longitude != null
    ? `https://www.openstreetmap.org/?mlat=${c.latitude}&mlon=${c.longitude}#map=18/${c.latitude}/${c.longitude}`
    : null;

  return (
    <>
      <Link to={base} className="small text-decoration-none d-inline-block mb-3"><i className="bi bi-arrow-left me-1" />Back to complaints</Link>

      <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
            <span className="cf-ref">{c.referenceNumber}</span>
            <StatusBadge status={c.status} />
            <PriorityBadge priority={c.priority} />
          </div>
          <h1 className="h3 mb-0">{c.title}</h1>
        </div>
        {!isAdmin && (permissions.canEdit || permissions.canDelete) && (
          <div className="d-flex gap-2 align-self-start">
            {permissions.canEdit && <Link to={`${base}/${c._id}/edit`} className="btn btn-outline-primary"><i className="bi bi-pencil me-1" />Edit</Link>}
            {permissions.canDelete && <button type="button" className="btn btn-outline-danger" onClick={() => setConfirmDelete(true)}><i className="bi bi-trash me-1" />Delete</button>}
          </div>
        )}
        {isAdmin && (
          <button type="button" className="btn btn-outline-danger align-self-start" onClick={() => setConfirmDelete(true)}>
            <i className="bi bi-trash me-1" />Delete
          </button>
        )}
      </div>

      <div className="row g-4">
        <div className={isAdmin ? 'col-xl-8' : 'col-lg-8'}>
          <div className="cf-card p-3 p-md-4 mb-4">
            <h2 className="h6 text-muted mb-2">Description</h2>
            <p style={{ whiteSpace: 'pre-line' }}>{c.description}</p>
            <div className="row g-3 small">
              <div className="col-sm-6"><div className="text-muted">Category</div><i className={`bi ${CATEGORY_ICON[c.category]} me-1`} aria-hidden="true" />{c.category}</div>
              <div className="col-sm-6"><div className="text-muted">Submitted</div>{formatDateTime(c.createdAt)}</div>
              <div className="col-sm-6"><div className="text-muted">Address</div>{c.address}</div>
              <div className="col-sm-6"><div className="text-muted">City / area</div>{c.city}</div>
              <div className="col-sm-6">
                <div className="text-muted">Coordinates</div>
                {mapUrl ? <a href={mapUrl} target="_blank" rel="noopener noreferrer">{c.latitude}, {c.longitude} <i className="bi bi-box-arrow-up-right small" /></a> : 'Not provided'}
              </div>
              <div className="col-sm-6">
                <div className="text-muted">Assigned to</div>
                {c.departmentId?.name || 'Not yet assigned'}{c.assignedTo && <span className="text-muted">, {c.assignedTo}</span>}
              </div>
              {c.resolvedAt && <div className="col-sm-6"><div className="text-muted">Resolved</div>{formatDateTime(c.resolvedAt)}</div>}
              {isAdmin && c.citizenId && (
                <div className="col-sm-6"><div className="text-muted">Reported by</div>{c.citizenId.name}<div className="text-muted">{c.citizenId.email}{c.citizenId.phone && `, ${c.citizenId.phone}`}</div></div>
              )}
            </div>
            {c.attachment && (
              <div className="mt-4">
                <h2 className="h6 text-muted mb-2">Photo</h2>
                {imageFailed
                  ? <p className="small text-muted">The photo could not be loaded.</p>
                  : <img src={complaintService.attachmentUrl(c._id, c.updatedAt)} alt={`Photo attached to ${c.title}`} className="cf-attachment" onError={() => setImageFailed(true)} />}
              </div>
            )}
          </div>

          <div className="cf-card p-3 p-md-4">
            <h2 className="h5 mb-3">Activity</h2>
            <ActivityTimeline items={timeline} showInternal={isAdmin} />
            {!isAdmin && c.status !== 'Rejected' && (
              <form onSubmit={sendComment} className="mt-3 border-top pt-3">
                <label htmlFor="comment" className="form-label">Add a comment for the municipal team</label>
                <textarea id="comment" className="form-control mb-2" rows={2} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="e.g. The problem got worse after last night's rain." />
                <button type="submit" className="btn btn-primary btn-sm" disabled={commentBusy || !comment.trim()}>
                  {commentBusy && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}Post comment
                </button>
              </form>
            )}
          </div>
        </div>

        <div className={isAdmin ? 'col-xl-4' : 'col-lg-4'}>
          {isAdmin ? (
            <AdminComplaintPanel complaint={c} nextStatuses={permissions.nextStatuses} onChanged={reload} />
          ) : (
            <div className="cf-card p-3">
              <h2 className="h6">What happens next</h2>
              <p className="small text-muted mb-2">
                {c.status === 'Pending' && 'Your complaint is waiting for review. You can still edit or delete it.'}
                {c.status === 'Under Review' && 'Staff are verifying the details and assigning a department.'}
                {c.status === 'In Progress' && 'The responsible team is working on it.'}
                {c.status === 'Resolved' && 'This issue has been marked as fixed. If it returns, add a comment and staff can reopen it.'}
                {c.status === 'Rejected' && 'This complaint was closed without action. The reason is shown in the activity history.'}
              </p>
              <Link to={`/track?ref=${c.referenceNumber}`} className="small">Public tracking page</Link>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        show={confirmDelete}
        title="Delete this complaint?"
        message={`Complaint ${c.referenceNumber} and its activity history will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete complaint"
        busy={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
