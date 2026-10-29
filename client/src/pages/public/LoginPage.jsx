import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import FormInput from '../../components/FormInput.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { getErrorMessage, getFieldErrors } from '../../services/api.js';
import { EMAIL_RE } from '../../utils/validation.js';

export default function LoginPage() {
  useDocumentTitle('Log in');
  const { login, user, homePath } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  if (user) return <Navigate to={homePath} replace />;

  const set = (k) => (e) => { setValues((v) => ({ ...v, [k]: e.target.value })); setErrors((er) => ({ ...er, [k]: undefined })); };

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!EMAIL_RE.test(values.email.trim())) found.email = 'Enter a valid email address';
    if (!values.password) found.password = 'Enter your password';
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      const u = await login({ email: values.email.trim(), password: values.password });
      toast.success(`Welcome back, ${u.name.split(' ')[0]}`);
      const target = u.role === 'admin'
        ? (from?.startsWith('/admin') ? from : '/admin')
        : (from && !from.startsWith('/admin') ? from : '/dashboard');
      navigate(target === '/report' ? '/dashboard/complaints/new' : target, { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cf-auth-wrap">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-sm-10 col-md-7 col-lg-5">
            <div className="cf-card p-4 p-md-5">
              <h1 className="h3 mb-1">Log in</h1>
              <p className="text-muted mb-4">Citizens and municipal staff use the same login.</p>
              {from && <div className="alert alert-info small py-2">Log in to continue to the page you requested.</div>}
              <ErrorMessage message={formError} />
              <form onSubmit={submit} noValidate className="d-grid gap-3">
                <FormInput id="email" type="email" label="Email" autoComplete="email" required value={values.email} onChange={set('email')} error={errors.email} />
                <div>
                  <label htmlFor="password" className="form-label">Password<span className="text-danger ms-1" aria-hidden="true">*</span></label>
                  <div className="input-group has-validation">
                    <input id="password" type={showPw ? 'text' : 'password'} className={`form-control ${errors.password ? 'is-invalid' : ''}`} autoComplete="current-password"
                      value={values.password} onChange={set('password')} aria-invalid={errors.password ? 'true' : undefined} required />
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                      <i className={`bi ${showPw ? 'bi-eye-slash' : 'bi-eye'}`} />
                    </button>
                    {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
                  {busy && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}Log in
                </button>
              </form>
              <p className="text-center mt-4 mb-0 small">New to CivicFix? <Link to="/register" state={{ from }}>Create an account</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
