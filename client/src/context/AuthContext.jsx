import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();
  const userRef = useRef(null);
  userRef.current = user;

  // Restore the session from the httpOnly cookie on first load.
  useEffect(() => {
    let active = true;
    authService.me()
      .then((u) => { if (active) setUser(u); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  // Any 401 from the API (expired/invalid session) logs the user out locally.
  useEffect(() => {
    const onUnauthorized = (event) => {
      if (!userRef.current) return;
      setUser(null);
      toast.warning(event.detail || 'Your session has expired. Please log in again.');
      navigate('/login', { replace: true, state: { from: window.location.pathname } });
    };
    window.addEventListener('civicfix:unauthorized', onUnauthorized);
    return () => window.removeEventListener('civicfix:unauthorized', onUnauthorized);
  }, [navigate, toast]);

  const login = useCallback(async (credentials) => {
    const u = await authService.login(credentials);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (payload) => {
    const u = await authService.register(payload);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const value = useMemo(() => ({
    user,
    loading,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    setUser,
    homePath: user?.role === 'admin' ? '/admin' : '/dashboard',
  }), [user, loading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
