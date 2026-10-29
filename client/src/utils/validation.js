import { IMAGE_TYPES, MAX_IMAGE_MB } from './constants.js';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/;
export const PHONE_RE = /^\+?[0-9\s-]{7,20}$/;

/** Score 0-4 with guidance shown under the password field. */
export function passwordStrength(pw = '') {
  const checks = [
    { ok: pw.length >= 8, label: 'At least 8 characters' },
    { ok: /[A-Z]/.test(pw), label: 'An upper-case letter' },
    { ok: /[a-z]/.test(pw), label: 'A lower-case letter' },
    { ok: /\d/.test(pw), label: 'A number' },
  ];
  const score = checks.filter((c) => c.ok).length + (pw.length >= 12 && /[^A-Za-z0-9]/.test(pw) ? 1 : 0);
  return { checks, score: Math.min(score, 5) };
}

export function validateComplaint(values, { partial = false } = {}) {
  const e = {};
  const req = (k) => !partial || values[k] !== undefined;
  if (req('title') && (!values.title || values.title.trim().length < 5 || values.title.trim().length > 120)) e.title = 'Title must be 5-120 characters';
  if (req('description') && (!values.description || values.description.trim().length < 20 || values.description.trim().length > 2000)) e.description = 'Description must be 20-2000 characters';
  if (req('category') && !values.category) e.category = 'Choose a category';
  if (req('address') && (!values.address || values.address.trim().length < 5)) e.address = 'Address must be at least 5 characters';
  if (req('city') && (!values.city || values.city.trim().length < 2)) e.city = 'City/area is required';
  const hasLat = values.latitude !== '' && values.latitude !== undefined && values.latitude !== null;
  const hasLng = values.longitude !== '' && values.longitude !== undefined && values.longitude !== null;
  if (hasLat !== hasLng) e.latitude = 'Provide both latitude and longitude, or neither';
  if (hasLat && (Number.isNaN(Number(values.latitude)) || Math.abs(Number(values.latitude)) > 90)) e.latitude = 'Latitude must be between -90 and 90';
  if (hasLng && (Number.isNaN(Number(values.longitude)) || Math.abs(Number(values.longitude)) > 180)) e.longitude = 'Longitude must be between -180 and 180';
  return e;
}

export function validateImage(file) {
  if (!file) return null;
  if (!IMAGE_TYPES.includes(file.type)) return 'Only JPEG, PNG or WebP images are allowed';
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) return `Image must be smaller than ${MAX_IMAGE_MB} MB`;
  return null;
}
