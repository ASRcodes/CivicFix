import { Link } from 'react-router-dom';

export default function Logo({ onDark = false, to = '/' }) {
  return (
    <Link to={to} className={`cf-logo ${onDark ? 'on-dark' : ''}`} aria-label="CivicFix home">
      <span className="cf-logo-mark" aria-hidden="true"><i className="bi bi-geo-alt-fill" /></span>
      <span className="cf-logo-text">Civic<span>Fix</span></span>
    </Link>
  );
}
