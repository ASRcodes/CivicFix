import api, { API_BASE_URL, cleanParams } from './api.js';

/** Builds multipart form data so an optional image can be sent with the fields. */
function toFormData(values, image, extra = {}) {
  const fd = new FormData();
  Object.entries({ ...values, ...extra }).forEach(([k, v]) => {
    if (v !== undefined && v !== null) fd.append(k, typeof v === 'string' ? v.trim() : String(v));
  });
  if (image) fd.append('image', image);
  return fd;
}

export const complaintService = {
  list: (params) => api.get('/complaints', { params: cleanParams(params) }).then((r) => r.data),
  summary: () => api.get('/complaints/summary').then((r) => r.data.data),
  get: (id) => api.get(`/complaints/${id}`).then((r) => r.data.data),
  create: (values, image) => api.post('/complaints', toFormData(values, image)).then((r) => r.data.data.complaint),
  update: (id, values, image, removeAttachment) =>
    api.patch(`/complaints/${id}`, toFormData(values, image, removeAttachment ? { removeAttachment: 'true' } : {}))
      .then((r) => r.data.data.complaint),
  remove: (id) => api.delete(`/complaints/${id}`).then((r) => r.data),
  activity: (id) => api.get(`/complaints/${id}/activity`).then((r) => r.data.data.timeline),
  addUpdate: (id, payload) => api.post(`/complaints/${id}/updates`, payload).then((r) => r.data),
  track: (reference) => api.get(`/complaints/reference/${encodeURIComponent(reference)}`).then((r) => r.data.data),
  attachmentUrl: (id, version = '') => `${API_BASE_URL}/complaints/${id}/attachment${version ? `?v=${encodeURIComponent(version)}` : ''}`,
};
