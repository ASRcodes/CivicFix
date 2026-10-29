import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';

/**
 * Requires a logged-in user. With role="citizen", administrators are sent to the admin area.
 * (UX only: the API enforces every permission independently.)
 */
export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner fullPage label="Checking your session" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (role === 'citizen' && user.role === 'admin') return <Navigate to="/admin" replace />;
  return children || <Outlet />;
}
