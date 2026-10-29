import { useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import FormInput from '../../components/FormInput.jsx';
import PasswordStrength from '../../components/PasswordStrength.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { authService } from '../../services/authService.js';
import { getErrorMessage, getFieldErrors } from '../../services/api.js';
import { PASSWORD_RE, PHONE_RE } from '../../utils/validation.js';
import { formatDate } from '../../utils/format.js';

export default function ProfilePage() {
  useDocumentTitle('Profile');
  const { user, setUser } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState({ name: user.name, phone: user.phone || '' });
  const [pErrors, setPErrors] = useState({});
  const [pBusy, setPBusy] = useState(false);

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwBusy, setPwBusy] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    const errs = {};
    if (profile.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (profile.phone.trim() && !PHONE_RE.test(profile.phone.trim())) errs.phone = 'Enter a valid phone number';
    setPErrors(errs);
    if (Object.keys(errs).length) return;
    setPBusy(true);
    try {
      const updated = await authService.updateProfile({ name: profile.name.trim(), phone: profile.phone.trim() });
      setUser(updated);
      toast.success('Profile saved');
    } catch (err) {
      setPErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setPBusy(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pw.currentPassword) errs.currentPassword = 'Enter your current password';
    if (!PASSWORD_RE.test(pw.newPassword)) errs.newPassword = 'Use 8-72 characters with upper-case, lower-case and a number';
    if (pw.confirm !== pw.newPassword) errs.confirm = 'Passwords do not match';
    setPwErrors(errs);
    if (Object.keys(errs).length) return;
    setPwBusy(true);
    try {
      await authService.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password changed');
    } catch (err) {
      setPwErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Your profile" subtitle={`${user.email}, member since ${formatDate(user.createdAt)}`} />
      <div className="row g-4">
        <div className="col-lg-6">
          <form className="cf-card p-4 d-grid gap-3" onSubmit={saveProfile} noValidate>
            <h2 className="h5 mb-0">Contact details</h2>
            <FormInput id="p-name" label="Full name" required value={profile.name} maxLength={80} onChange={(e) => setProfile({ ...profile, name: e.target.value })} error={pErrors.name} />
            <FormInput id="p-phone" type="tel" label="Phone (optional)" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} error={pErrors.phone} />
            <FormInput id="p-email" label="Email" value={user.email} disabled hint="Email cannot be changed." />
            <div><button type="submit" className="btn btn-primary" disabled={pBusy}>{pBusy && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}Save profile</button></div>
          </form>
        </div>
        <div className="col-lg-6">
          <form className="cf-card p-4 d-grid gap-3" onSubmit={changePassword} noValidate>
            <h2 className="h5 mb-0">Change password</h2>
            <FormInput id="pw-current" type="password" label="Current password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} error={pwErrors.currentPassword} />
            <div>
              <FormInput id="pw-new" type="password" label="New password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} error={pwErrors.newPassword} />
              <PasswordStrength password={pw.newPassword} />
            </div>
            <FormInput id="pw-confirm" type="password" label="Confirm new password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} error={pwErrors.confirm} />
            <div><button type="submit" className="btn btn-outline-primary" disabled={pwBusy}>{pwBusy && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}Change password</button></div>
          </form>
        </div>
      </div>
    </>
  );
}
