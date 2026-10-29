import { useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmationModal from '../../components/ConfirmationModal.jsx';
import FormInput from '../../components/FormInput.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { adminService } from '../../services/adminService.js';
import { getErrorMessage, getFieldErrors } from '../../services/api.js';

export default function AdminDepartments() {
  useDocumentTitle('Departments');
  const toast = useToast();
  const { data: departments, loading, error, reload } = useAsync(() => adminService.departments(), []);

  const [editing, setEditing] = useState(null); // null | {} (new) | department
  const [form, setForm] = useState({ name: '', description: '' });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(null);
  const [busy, setBusy] = useState(false);

  const openEditor = (dept) => {
    setEditing(dept || {});
    setForm({ name: dept?.name || '', description: dept?.description || '' });
    setFormErrors({});
  };

  const save = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) { setFormErrors({ name: 'Name must be at least 2 characters' }); return; }
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), description: form.description.trim() };
      if (editing._id) await adminService.updateDepartment(editing._id, payload);
      else await adminService.createDepartment(payload);
      toast.success(editing._id ? 'Department updated' : 'Department created');
      setEditing(null);
      reload();
    } catch (err) {
      const fe = getFieldErrors(err);
      setFormErrors(Object.keys(fe).length ? fe : { name: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async () => {
    setBusy(true);
    try {
      await adminService.deactivateDepartment(deactivating._id);
      toast.success(`${deactivating.name} deactivated`);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
      setDeactivating(null);
    }
  };

  const reactivate = async (dept) => {
    try {
      await adminService.updateDepartment(dept._id, { isActive: true });
      toast.success(`${dept.name} reactivated`);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        title="Departments"
        subtitle="Teams that complaints can be assigned to. Deactivated departments keep their history but cannot receive new assignments."
        actions={<button type="button" className="btn btn-primary" onClick={() => openEditor(null)}><i className="bi bi-plus-lg me-1" />New department</button>}
      />
      {loading && <LoadingSpinner label="Loading departments" />}
      <ErrorMessage message={error} onRetry={reload} />
      {!loading && !error && departments?.length === 0 && (
        <EmptyState icon="bi-building" title="No departments yet" message="Create the teams that handle complaints, such as Sanitation or Water Supply."
          action={<button type="button" className="btn btn-primary" onClick={() => openEditor(null)}>Create a department</button>} />
      )}
      {!loading && departments?.length > 0 && (
        <div className="row g-3">
          {departments.map((d) => (
            <div className="col-md-6 col-xl-4" key={d._id}>
              <div className={`cf-card p-3 h-100 d-flex flex-column ${d.isActive ? '' : 'opacity-75'}`}>
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <h2 className="h6 mb-1">{d.name}</h2>
                  {d.isActive ? <span className="badge text-bg-success">Active</span> : <span className="badge text-bg-secondary">Inactive</span>}
                </div>
                <p className="small text-muted flex-grow-1">{d.description || 'No description'}</p>
                <div className="small mb-3"><strong>{d.openCount}</strong> open of <strong>{d.complaintCount}</strong> assigned complaints</div>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openEditor(d)}>Edit</button>
                  {d.isActive
                    ? <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setDeactivating(d)}>Deactivate</button>
                    : <button type="button" className="btn btn-sm btn-outline-success" onClick={() => reactivate(d)}>Reactivate</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        show={Boolean(editing)}
        title={editing?._id ? 'Edit department' : 'New department'}
        onClose={() => !saving && setEditing(null)}
      >
        <form onSubmit={save} noValidate className="d-grid gap-3">
          <FormInput id="d-name" label="Name" required maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={formErrors.name} />
          <FormInput id="d-desc" as="textarea" rows={3} label="Description" maxLength={500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} error={formErrors.description} />
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-light" onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}{editing?._id ? 'Save changes' : 'Create department'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        show={Boolean(deactivating)}
        title="Deactivate department?"
        message={`${deactivating?.name} will no longer be available for new assignments. Existing complaints keep their assignment.`}
        confirmLabel="Deactivate"
        busy={busy}
        onConfirm={deactivate}
        onCancel={() => setDeactivating(null)}
      />
    </>
  );
}
