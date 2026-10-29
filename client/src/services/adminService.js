import api, { cleanParams } from './api.js';

export const adminService = {
  dashboard: () => api.get('/admin/dashboard').then((r) => r.data.data),
  complaints: (params) => api.get('/admin/complaints', { params: cleanParams(params) }).then((r) => r.data),
  changeStatus: (id, payload) => api.patch(`/admin/complaints/${id}/status`, payload).then((r) => r.data),
  assign: (id, payload) => api.patch(`/admin/complaints/${id}/assign`, payload).then((r) => r.data),
  users: (params) => api.get('/admin/users', { params: cleanParams(params) }).then((r) => r.data),
  user: (id) => api.get(`/admin/users/${id}`).then((r) => r.data.data),
  setUserActive: (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive }).then((r) => r.data),
  departments: (params) => api.get('/admin/departments', { params: cleanParams(params) }).then((r) => r.data.data.departments),
  createDepartment: (payload) => api.post('/admin/departments', payload).then((r) => r.data),
  updateDepartment: (id, payload) => api.patch(`/admin/departments/${id}`, payload).then((r) => r.data),
  deactivateDepartment: (id) => api.delete(`/admin/departments/${id}`).then((r) => r.data),
};
