import api from './api.js';

export const publicService = {
  stats: () => api.get('/public/stats').then((r) => r.data.data),
  recent: (limit = 6) => api.get('/public/recent-complaints', { params: { limit } }).then((r) => r.data.data.complaints),
};
