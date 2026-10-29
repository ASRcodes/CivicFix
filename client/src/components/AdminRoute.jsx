import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';
import EmptyState from './EmptyState.jsx';

/** Restricts a route tree to administrators. The API enforces this independently. */
export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner fullPage label="Checking your session" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.role !== 'admin') {
    return (
      <div className="container py-5">
        <EmptyState
          icon="bi-shield-lock"
          title="Administrators only"
          message="Your account does not have access to the admin area."
          action={<Link to="/dashboard" className="btn btn-primary">Go to my dashboard</Link>}
        />
      </div>
    );
  }
  return children || <Outlet />;
}
