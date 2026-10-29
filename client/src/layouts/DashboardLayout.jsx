import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <div className="cf-dash">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="cf-dash-main d-flex flex-column">
        <header className="cf-topbar px-3 px-lg-4 py-2 d-flex align-items-center gap-3">
          <button type="button" className="btn btn-light d-lg-none" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
            <i className="bi bi-list fs-5" />
          </button>
          <div className="small text-muted d-none d-sm-block">
            {isAdmin ? 'Administration' : 'Citizen dashboard'}
          </div>
          <div className="ms-auto d-flex align-items-center gap-2">
            {!isAdmin && (
              <Link to="/dashboard/complaints/new" className="btn btn-teal btn-sm">
                <i className="bi bi-plus-lg me-1" />New complaint
              </Link>
            )}
            <span className="small fw-semibold d-none d-md-inline text-truncate" style={{ maxWidth: 180 }}>{user?.name}</span>
          </div>
        </header>
        <main id="main" className="flex-grow-1 p-3 p-lg-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
