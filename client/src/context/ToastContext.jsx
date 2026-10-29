import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

const ICONS = { success: 'bi-check-circle-fill text-success', danger: 'bi-exclamation-octagon-fill text-danger', warning: 'bi-exclamation-triangle-fill text-warning', info: 'bi-info-circle-fill text-primary' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const notify = useCallback((message, variant = 'success', timeout = 4500) => {
    idRef.current += 1;
    const id = idRef.current;
    setToasts((list) => [...list.slice(-3), { id, message, variant }]);
    if (timeout) setTimeout(() => dismiss(id), timeout);
  }, [dismiss]);

  const value = useMemo(() => ({
    notify,
    success: (m) => notify(m, 'success'),
    error: (m) => notify(m, 'danger', 7000),
    warning: (m) => notify(m, 'warning', 6000),
    info: (m) => notify(m, 'info'),
  }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="cf-toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className={`cf-toast ${t.variant}`} role={t.variant === 'danger' ? 'alert' : 'status'}>
            <i className={`bi ${ICONS[t.variant] || ICONS.info} mt-1`} aria-hidden="true" />
            <div className="flex-grow-1 small">{t.message}</div>
            <button type="button" className="btn-close btn-sm" aria-label="Dismiss notification" onClick={() => dismiss(t.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
