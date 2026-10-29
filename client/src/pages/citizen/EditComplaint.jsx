import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ComplaintForm from '../../features/complaints/ComplaintForm.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { complaintService } from '../../services/complaintService.js';
import { getErrorMessage, getFieldErrors } from '../../services/api.js';

export default function EditComplaint() {
  useDocumentTitle('Edit complaint');
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => complaintService.get(id), [id]);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [serverErrors, setServerErrors] = useState({});

  if (loading) return <LoadingSpinner label="Loading complaint" />;
  if (error) return <ErrorMessage message={error} onRetry={reload} />;

  const { complaint, permissions } = data;
  if (!permissions.canEdit) {
    return (
      <EmptyState
        icon="bi-lock"
        title="This complaint can no longer be edited"
        message={`Its status is "${complaint.status}". Complaints can only be edited while Pending. You can still add a comment.`}
        action={<Link to={`/dashboard/complaints/${id}`} className="btn btn-primary">Back to complaint</Link>}
      />
    );
  }

  const submit = async (values, image, removeAttachment) => {
    setBusy(true);
    setSaveError('');
    try {
      await complaintService.update(id, values, image, removeAttachment);
      toast.success('Complaint updated');
      navigate(`/dashboard/complaints/${id}`);
    } catch (err) {
      setServerErrors(getFieldErrors(err));
      setSaveError(getErrorMessage(err, 'Changes could not be saved.'));
    } finally {
      setBusy(false);
    }
  };

  const initial = {
    title: complaint.title,
    description: complaint.description,
    category: complaint.category,
    priority: complaint.priority,
    address: complaint.address,
    city: complaint.city,
    latitude: complaint.latitude ?? '',
    longitude: complaint.longitude ?? '',
  };

  return (
    <>
      <PageHeader title="Edit complaint" subtitle={<span className="cf-ref">{complaint.referenceNumber}</span>} />
      <div className="cf-card p-3 p-md-4" style={{ maxWidth: 900 }}>
        <ErrorMessage message={saveError} />
        <ComplaintForm
          initialValues={initial}
          existingAttachmentUrl={complaint.attachment ? complaintService.attachmentUrl(id, complaint.updatedAt) : null}
          submitLabel="Save changes"
          busy={busy}
          serverErrors={serverErrors}
          onSubmit={submit}
          onCancel={() => navigate(`/dashboard/complaints/${id}`)}
        />
      </div>
    </>
  );
}
