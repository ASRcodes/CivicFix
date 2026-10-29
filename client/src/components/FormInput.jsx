/**
 * Labelled form control with inline validation message.
 * as: 'input' | 'textarea' | 'select'
 */
export default function FormInput({
  id, label, as = 'input', error, hint, required, children, className = '', ...props
}) {
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(' ') || undefined;
  const common = {
    id,
    name: props.name || id,
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': describedBy,
    required,
    ...props,
  };
  let control;
  if (as === 'textarea') control = <textarea className={`form-control ${error ? 'is-invalid' : ''}`} {...common} />;
  else if (as === 'select') control = <select className={`form-select ${error ? 'is-invalid' : ''}`} {...common}>{children}</select>;
  else control = <input className={`form-control ${error ? 'is-invalid' : ''}`} {...common} />;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label}{required && <span className="text-danger ms-1" aria-hidden="true">*</span>}
        </label>
      )}
      {control}
      {hint && !error && <div id={`${id}-hint`} className="form-text">{hint}</div>}
      {error && <div id={`${id}-error`} className="invalid-feedback d-block">{error}</div>}
    </div>
  );
}
