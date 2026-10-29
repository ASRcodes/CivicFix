import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import StatusBadge from '../../components/StatusBadge.jsx';
import PriorityBadge from '../../components/PriorityBadge.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { complaintService } from '../../services/complaintService.js';
import { getErrorMessage } from '../../services/api.js';
import { formatDate, formatDateTime } from '../../utils/format.js';
import { STATUS_ICON } from '../../utils/constants.js';

const REF_RE = /^CF-\d{4}-\d{6}$/;

export default function TrackComplaintPage() {
  useDocumentTitle('Track a complaint');
  const [params, setParams] = useSearchParams();
  const initial = params.get('ref') || '';
  const [input, setInput] = useState(initial);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const lookup = async (ref) => {
    const value = ref.trim().toUpperCase();
    if (!REF_RE.test(value)) {
      setError('Reference numbers look like CF-2026-000123.');
      setResult(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setResult(await complaintService.track(value));
      setParams({ ref: value }, { replace: true });
    } catch (err) {
      setResult(null);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initial) lookup(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const c = result?.complaint;

  return (
    <div className="container py-5" style={{ maxWidth: 820 }}>
      <h1 className="h2 mb-1">Track a complaint</h1>
      <p className="text-muted mb-4">Enter the reference number you received when the complaint was submitted. No login needed.</p>
      <form className="cf-card p-3 mb-4" onSubmit={(e) => { e.preventDefault(); lookup(input); }} noValidate>
        <label htmlFor="ref" className="form-label">Reference number</label>
        <div className="input-group input-group-lg">
          <input id="ref" className="form-control text-uppercase" placeholder="CF-2026-000123" value={input}
            onChange={(e) => setInput(e.target.value)} maxLength={14} autoComplete="off" />
          <button type="submit" className="btn btn-primary" disabled={loading}><i className="bi bi-search me-1" />Track</button>
        </div>
      </form>

      {loading && <LoadingSpinner label="Looking up complaint" />}
      <ErrorMessage message={error} />

      {c && !loading && (
        <div className="cf-card p-4">
          <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
            <span className="cf-ref fs-5">{c.referenceNumber}</span>
            <StatusBadge status={c.status} />
          </div>
          <h2 className="h4">{c.title}</h2>
          <div className="row g-3 small mt-1 mb-4">
            <div className="col-6 col-md-3"><div className="text-muted">Category</div>{c.category}</div>
            <div className="col-6 col-md-3"><div className="text-muted">Priority</div><PriorityBadge priority={c.priority} /></div>
            <div className="col-6 col-md-3"><div className="text-muted">Area</div>{c.city}</div>
            <div className="col-6 col-md-3"><div className="text-muted">Submitted</div>{formatDate(c.createdAt)}</div>
            <div className="col-12"><div className="text-muted">Responsible department</div>{c.department || 'Not yet assigned'}</div>
          </div>
          <h3 className="h6">Progress</h3>
          <ol className="cf-timeline mt-3">
            {result.timeline.map((t) => (
              <li key={t._id}>
                <span className="cf-timeline-icon" aria-hidden="true"><i className={`bi ${t.action === 'ASSIGNED' ? 'bi-person-badge' : STATUS_ICON[t.newStatus] || 'bi-flag-fill'}`} /></span>
                <strong className="small d-block">
                  {t.action === 'CREATED' && 'Complaint submitted'}
                  {t.action === 'ASSIGNED' && 'Assigned to a department'}
                  {t.action === 'STATUS_CHANGED' && <>Status changed to {t.newStatus}</>}
                </strong>
                <time className="small text-muted" dateTime={t.createdAt}>{formatDateTime(t.createdAt)}</time>
              </li>
            ))}
          </ol>
          <p className="small text-muted mb-0">Messages from staff are visible to the citizen who submitted the complaint after logging in.</p>
        </div>
      )}
    </div>
  );
}
