import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import FormInput from '../../components/FormInput.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import PasswordStrength from '../../components/PasswordStrength.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { getErrorMessage, getFieldErrors } from '../../services/api.js';
import { EMAIL_RE, PASSWORD_RE, PHONE_RE } from '../../utils/validation.js';

export default function RegisterPage() {
  useDocumentTitle('Create account');
  const { register, user, homePath } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const from = useLocation().state?.from;

  const [values, setValues] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homePath} replace />;

  const set = (k) => (e) => { setValues((v) => ({ ...v, [k]: e.target.value })); setErrors((er) => ({ ...er, [k]: undefined })); };

  const validate = () => {
    const e = {};
    if (values.name.trim().length < 2) e.name = 'Enter your full name (at least 2 characters)';
    if (!EMAIL_RE.test(values.email.trim())) e.email = 'Enter a valid email address';
    if (values.phone.trim() && !PHONE_RE.test(values.phone.trim())) e.phone = 'Enter a valid phone number';
    if (!PASSWORD_RE.test(values.password)) e.password = 'Use 8-72 characters with upper-case, lower-case and a number';
    if (values.confirmPassword !== values.password) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      toast.success('Account created. Welcome to CivicFix!');
      navigate(from === '/report' ? '/dashboard/complaints/new' : '/dashboard', { replace: true });
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
          <div className="col-md-9 col-lg-6">
            <div className="cf-card p-4 p-md-5">
              <h1 className="h3 mb-1">Create your account</h1>
              <p className="text-muted mb-4">You need an account to submit complaints and receive updates.</p>
              <ErrorMessage message={formError} />
              <form onSubmit={submit} noValidate className="row g-3">
                <FormInput className="col-12" id="name" label="Full name" autoComplete="name" required value={values.name} onChange={set('name')} error={errors.name} maxLength={80} />
                <FormInput className="col-md-7" id="email" type="email" label="Email" autoComplete="email" required value={values.email} onChange={set('email')} error={errors.email} />
                <FormInput className="col-md-5" id="phone" type="tel" label="Phone (optional)" autoComplete="tel" value={values.phone} onChange={set('phone')} error={errors.phone} />
                <div className="col-12">
                  <FormInput id="password" type="password" label="Password" autoComplete="new-password" required value={values.password} onChange={set('password')} error={errors.password} />
                  <PasswordStrength password={values.password} />
                </div>
                <FormInput className="col-12" id="confirmPassword" type="password" label="Confirm password" autoComplete="new-password" required
                  value={values.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} />
                <div className="col-12 d-grid">
                  <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
                    {busy && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}Create account
                  </button>
                </div>
              </form>
              <p className="text-center mt-4 mb-0 small">Already registered? <Link to="/login" state={{ from }}>Log in</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
