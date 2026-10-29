import { NavLink } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const CITIZEN_LINKS = [
  { to: '/dashboard', label: 'Overview', icon: 'bi-grid-1x2', end: true },
  { to: '/dashboard/complaints', label: 'My complaints', icon: 'bi-list-check', end: true },
  { to: '/dashboard/complaints/new', label: 'Report an issue', icon: 'bi-plus-circle' },
  { to: '/dashboard/profile', label: 'Profile', icon: 'bi-person' },
];

const ADMIN_LINKS = [
  { to: '/admin', label: 'Overview', icon: 'bi-bar-chart', end: true },
  { to: '/admin/complaints', label: 'Complaints', icon: 'bi-inboxes' },
  { to: '/admin/users', label: 'Users', icon: 'bi-people' },
  { to: '/admin/departments', label: 'Departments', icon: 'bi-building' },
  { to: '/admin/profile', label: 'Profile', icon: 'bi-person' },
];

export default function Sidebar({ open, onClose }) {
  const { user, isAdmin, logout } = useAuth();
  const links = isAdmin ? ADMIN_LINKS : CITIZEN_LINKS;

  return (
    <>
      <div className={`cf-sidebar-backdrop ${open ? 'open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`cf-sidebar p-3 ${open ? 'open' : ''}`} aria-label="Dashboard navigation">
        <div className="d-flex align-items-center justify-content-between mb-4 px-1">
          <Logo onDark />
          <button type="button" className="btn btn-sm text-white d-lg-none" onClick={onClose} aria-label="Close menu">
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <nav className="nav flex-column gap-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="nav-link" onClick={onClose}>
              <i className={`bi ${l.icon}`} aria-hidden="true" />{l.label}
            </NavLink>
          ))}
          <NavLink to="/" className="nav-link" onClick={onClose}>
            <i className="bi bi-house" aria-hidden="true" />Public site
          </NavLink>
        </nav>
        <div className="mt-auto pt-3 border-top border-secondary">
          <div className="px-1 mb-2">
            <div className="fw-semibold text-truncate">{user?.name}</div>
            <div className="cf-sidebar-role">{isAdmin ? 'Administrator' : 'Citizen'}</div>
          </div>
          <button type="button" className="btn btn-outline-light btn-sm w-100" onClick={logout}>
            <i className="bi bi-box-arrow-right me-1" />Log out
          </button>
        </div>
      </aside>
    </>
  );
}
