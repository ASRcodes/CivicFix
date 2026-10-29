import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import ComplaintForm from '../../features/complaints/ComplaintForm.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { complaintService } from '../../services/complaintService.js';
import { getErrorMessage, getFieldErrors } from '../../services/api.js';

export default function NewComplaint() {
  useDocumentTitle('Report an issue');
  const navigate = useNavigate();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [serverErrors, setServerErrors] = useState({});
  const [created, setCreated] = useState(null);

  const submit = async (values, image) => {
    setBusy(true);
    setError('');
    try {
      const complaint = await complaintService.create(values, image);
      setCreated(complaint);
      toast.success(`Complaint ${complaint.referenceNumber} submitted`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setServerErrors(getFieldErrors(err));
      setError(getErrorMessage(err, 'Your complaint could not be submitted. Nothing was saved.'));
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    return (
      <div className="cf-card p-4 p-md-5 text-center mx-auto" style={{ maxWidth: 620 }}>
        <div className="cf-category-icon mx-auto mb-3" style={{ width: 64, height: 64, fontSize: '2rem' }}><i className="bi bi-check2" /></div>
        <h1 className="h3">Complaint submitted</h1>
        <p className="text-muted">Keep this reference number. You can use it to track progress, even without logging in.</p>
        <div className="cf-receipt-ref my-3" aria-label="Reference number">{created.referenceNumber}</div>
        <div className="d-flex flex-wrap justify-content-center gap-2 mt-4">
          <Link to={`/dashboard/complaints/${created._id}`} className="btn btn-primary">View complaint</Link>
          <button type="button" className="btn btn-outline-primary" onClick={() => navigator.clipboard?.writeText(created.referenceNumber).then(() => toast.info('Reference copied'))}>
            <i className="bi bi-clipboard me-1" />Copy reference
          </button>
          <button type="button" className="btn btn-light" onClick={() => setCreated(null)}>Report another issue</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Report an issue" subtitle="Fields marked * are required. You can edit the complaint while it is still Pending." />
      <div className="cf-card p-3 p-md-4" style={{ maxWidth: 900 }}>
        <ErrorMessage message={error} />
        <ComplaintForm submitLabel="Submit complaint" busy={busy} serverErrors={serverErrors} onSubmit={submit} onCancel={() => navigate('/dashboard')} />
      </div>
    </>
  );
}
