import { useEffect, useState } from 'react';
import FormInput from '../../components/FormInput.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { adminService } from '../../services/adminService.js';
import { complaintService } from '../../services/complaintService.js';
import { getErrorMessage } from '../../services/api.js';

/** Admin-only management controls shown on the complaint details page. */
export default function AdminComplaintPanel({ complaint, nextStatuses, onChanged }) {
  const toast = useToast();
  const [departments, setDepartments] = useState([]);
  const [deptError, setDeptError] = useState('');

  const [status, setStatus] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [statusErr, setStatusErr] = useState('');
  const [statusBusy, setStatusBusy] = useState(false);

  const [deptId, setDeptId] = useState(complaint.departmentId?._id || '');
  const [staff, setStaff] = useState(complaint.assignedTo || '');
  const [assignBusy, setAssignBusy] = useState(false);

  const [updMsg, setUpdMsg] = useState('');
  const [updNote, setUpdNote] = useState('');
  const [updBusy, setUpdBusy] = useState(false);

  useEffect(() => {
    adminService.departments({ active: 'true' })
      .then(setDepartments)
      .catch((err) => setDeptError(getErrorMessage(err)));
  }, []);

  useEffect(() => {
    setDeptId(complaint.departmentId?._id || '');
    setStaff(complaint.assignedTo || '');
    setStatus('');
  }, [complaint]);

  const changeStatus = async (e) => {
    e.preventDefault();
    setStatusErr('');
    if (!status) { setStatusErr('Choose the new status'); return; }
    if (status === 'Rejected' && !statusMsg.trim()) { setStatusErr('Give the citizen a reason for rejecting the complaint'); return; }
    setStatusBusy(true);
    try {
      await adminService.changeStatus(complaint._id, { status, publicMessage: statusMsg.trim(), internalNote: statusNote.trim() });
      toast.success(`Status changed to ${status}`);
      setStatusMsg(''); setStatusNote('');
      onChanged();
    } catch (err) {
      setStatusErr(getErrorMessage(err));
    } finally {
      setStatusBusy(false);
    }
  };

  const assign = async (e) => {
    e.preventDefault();
    setAssignBusy(true);
    try {
      const res = await adminService.assign(complaint._id, { departmentId: deptId || null, assignedTo: staff.trim() });
      toast.success(res.message || 'Assignment updated');
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAssignBusy(false);
    }
  };

  const addUpdate = async (e) => {
    e.preventDefault();
    if (!updMsg.trim() && !updNote.trim()) { toast.warning('Write a public update or an internal note'); return; }
    setUpdBusy(true);
    try {
      await complaintService.addUpdate(complaint._id, { publicMessage: updMsg.trim(), internalNote: updNote.trim() });
      toast.success('Update added');
      setUpdMsg(''); setUpdNote('');
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdBusy(false);
    }
  };

  const rejected = complaint.status === 'Rejected';

  return (
    <div className="d-grid gap-3">
      <form className="cf-card p-3" onSubmit={changeStatus} noValidate>
        <h2 className="h6 mb-3"><i className="bi bi-arrow-repeat me-1" />Change status</h2>
        {nextStatuses.length === 0 ? (
          <p className="small text-muted mb-0">"{complaint.status}" is a final status. No further changes are possible.</p>
        ) : (
          <div className="d-grid gap-2">
            <FormInput id="new-status" as="select" label="New status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Choose…</option>
              {nextStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </FormInput>
            <FormInput id="status-msg" as="textarea" rows={2} maxLength={1000}
              label={status === 'Rejected' ? 'Reason for rejection (shown to citizen)' : 'Message to citizen (optional)'}
              required={status === 'Rejected'} value={statusMsg} onChange={(e) => setStatusMsg(e.target.value)} />
            <FormInput id="status-note" as="textarea" rows={2} maxLength={1000} label="Internal note (staff only)" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} />
            {statusErr && <div className="text-danger small" role="alert">{statusErr}</div>}
            <button type="submit" className={`btn ${status === 'Rejected' ? 'btn-danger' : 'btn-primary'}`} disabled={statusBusy}>
              {statusBusy && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
              {status ? `Set to ${status}` : 'Update status'}
            </button>
          </div>
        )}
      </form>

      <form className="cf-card p-3" onSubmit={assign} noValidate>
        <h2 className="h6 mb-3"><i className="bi bi-person-badge me-1" />Assignment</h2>
        {deptError && <div className="text-danger small mb-2">{deptError}</div>}
        <div className="d-grid gap-2">
          <FormInput id="assign-dept" as="select" label="Department" value={deptId} onChange={(e) => setDeptId(e.target.value)} disabled={rejected}>
            <option value="">Not assigned</option>
            {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </FormInput>
          <FormInput id="assign-staff" label="Field staff / officer" maxLength={100} placeholder="e.g. Road crew B" value={staff} onChange={(e) => setStaff(e.target.value)} disabled={rejected} />
          <button type="submit" className="btn btn-outline-primary" disabled={assignBusy || rejected}>
            {assignBusy && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}Save assignment
          </button>
        </div>
      </form>

      <form className="cf-card p-3" onSubmit={addUpdate} noValidate>
        <h2 className="h6 mb-3"><i className="bi bi-chat-square-text me-1" />Add an update</h2>
        <div className="d-grid gap-2">
          <FormInput id="upd-msg" as="textarea" rows={2} maxLength={1000} label="Public update (visible to citizen)" value={updMsg} onChange={(e) => setUpdMsg(e.target.value)} />
          <FormInput id="upd-note" as="textarea" rows={2} maxLength={1000} label="Internal note (staff only)" value={updNote} onChange={(e) => setUpdNote(e.target.value)} />
          <button type="submit" className="btn btn-outline-primary" disabled={updBusy}>
            {updBusy && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}Add update
          </button>
        </div>
      </form>
    </div>
  );
}
