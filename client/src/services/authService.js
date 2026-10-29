import api from './api.js';

export const authService = {
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data.data.user),
  login: (payload) => api.post('/auth/login', payload, { skipAuthEvent: true }).then((r) => r.data.data.user),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me', { skipAuthEvent: true }).then((r) => r.data.data.user),
  updateProfile: (payload) => api.patch('/auth/me', payload).then((r) => r.data.data.user),
  changePassword: (payload) => api.patch('/auth/me/password', payload),
};
