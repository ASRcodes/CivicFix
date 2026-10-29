import { useEffect, useRef } from 'react';

/** Accessible, React-controlled Bootstrap-styled modal (no Bootstrap JS needed). */
export default function Modal({ show, title, onClose, children, footer, size = '' }) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Depends only on `show`, so re-renders (e.g. typing in a field) never move focus.
  useEffect(() => {
    if (!show) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onCloseRef.current?.(); };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('overflow-hidden');
    const previous = document.activeElement;
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('overflow-hidden');
      previous?.focus?.();
    };
  }, [show]);

  if (!show) return null;
  return (
    <>
      <div className="cf-modal-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="modal d-block cf-modal" role="dialog" aria-modal="true" aria-labelledby="cf-modal-title" onClick={onClose}>
        <div className={`modal-dialog modal-dialog-centered ${size}`} onClick={(e) => e.stopPropagation()}>
          <div className="modal-content" ref={dialogRef} tabIndex={-1}>
            <div className="modal-header">
              <h2 className="modal-title h5" id="cf-modal-title">{title}</h2>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </div>
        </div>
      </div>
    </>
  );
}
