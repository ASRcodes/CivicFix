import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/report', label: 'Report Issue' },
  { to: '/track', label: 'Track Complaint' },
  { to: '/about', label: 'About' },
  { to: '/help', label: 'Help' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout, homePath } = useAuth();
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <nav className="navbar navbar-expand-lg cf-navbar py-2 sticky-top" aria-label="Main navigation">
      <div className="container">
        <Logo onDark />
        <button
          className="navbar-toggler"
          type="button"
          aria-controls="cf-main-nav"
          aria-expanded={open}
          aria-label="Toggle navigation"
          onClick={() => setOpen((o) => !o)}
        >
          <i className={`bi ${open ? 'bi-x-lg' : 'bi-list'} fs-4`} />
        </button>
        <div className={`collapse navbar-collapse ${open ? 'show' : ''}`} id="cf-main-nav">
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-lg-2">
            {LINKS.map((l) => (
              <li className="nav-item" key={l.to}>
                <NavLink to={l.to} end={l.end} className="nav-link px-2">{l.label}</NavLink>
              </li>
            ))}
          </ul>
          <div className="d-flex gap-2 pb-2 pb-lg-0">
            {user ? (
              <>
                <NavLink to={homePath} className="btn btn-teal btn-sm">
                  <i className="bi bi-speedometer2 me-1" />Dashboard
                </NavLink>
                <button type="button" className="btn btn-outline-light btn-sm" onClick={logout}>Log out</button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="btn btn-outline-light btn-sm">Log in</NavLink>
                <NavLink to="/register" className="btn btn-teal btn-sm">Create account</NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
