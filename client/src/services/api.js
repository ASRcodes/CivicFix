import axios from 'axios';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');

/**
 * Shared Axios instance.
 * - withCredentials: sends the httpOnly auth cookie (the token is never readable by JS).
 * - X-Requested-With: required by the server's CSRF guard on state-changing requests.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 20000,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.skipAuthEvent) {
      window.dispatchEvent(new CustomEvent('civicfix:unauthorized', { detail: error.response.data?.message }));
    }
    return Promise.reject(error);
  },
);

/** Human-readable message for any Axios error (network, timeout, server). */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;
  if (error.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  if (!error.response) return 'Cannot reach the CivicFix server. Check your connection and that the API is running.';
  return error.response.data?.message || fallback;
}

/** Converts a 422 response into { field: message }. */
export function getFieldErrors(error) {
  const list = error?.response?.data?.errors;
  if (!Array.isArray(list)) return {};
  return list.reduce((acc, e) => {
    if (e.field && !acc[e.field]) acc[e.field] = e.message;
    return acc;
  }, {});
}

/** Removes empty values so they are not sent as query params. */
export function cleanParams(params = {}) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));
}

export default api;
