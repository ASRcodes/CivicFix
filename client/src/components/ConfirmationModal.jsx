import Modal from './Modal.jsx';

export default function ConfirmationModal({
  show, title = 'Are you sure?', message, confirmLabel = 'Confirm', variant = 'danger', busy = false, onConfirm, onCancel,
}) {
  return (
    <Modal
      show={show}
      title={title}
      onClose={busy ? undefined : onCancel}
      footer={(
        <>
          <button type="button" className="btn btn-light" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="button" className={`btn btn-${variant}`} onClick={onConfirm} disabled={busy}>
            {busy && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </>
      )}
    >
      <p className="mb-0">{message}</p>
    </Modal>
  );
}
