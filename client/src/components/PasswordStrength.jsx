import { passwordStrength } from '../utils/validation.js';

const LEVELS = [
  { label: 'Too weak', color: '#c0392b' },
  { label: 'Too weak', color: '#c0392b' },
  { label: 'Weak', color: '#d68910' },
  { label: 'Fair', color: '#d68910' },
  { label: 'Good', color: '#0e8a8c' },
  { label: 'Strong', color: '#1e6b34' },
];

export default function PasswordStrength({ password }) {
  if (!password) return null;
  const { checks, score } = passwordStrength(password);
  const level = LEVELS[score];
  return (
    <div className="mt-2" aria-live="polite">
      <div className="d-flex align-items-center gap-2">
        <div className="cf-strength flex-grow-1"><span style={{ width: `${(score / 5) * 100}%`, background: level.color }} /></div>
        <span className="small fw-semibold" style={{ color: level.color }}>{level.label}</span>
      </div>
      <ul className="list-unstyled small mt-2 mb-0 row g-1">
        {checks.map((c) => (
          <li key={c.label} className={`col-6 ${c.ok ? 'text-success' : 'text-muted'}`}>
            <i className={`bi ${c.ok ? 'bi-check-circle-fill' : 'bi-circle'} me-1`} aria-hidden="true" />{c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
