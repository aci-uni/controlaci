import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth services
export const authService = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (username, password) => api.post('/auth/register', { username, password }),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (formData) => api.put('/auth/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getUsers: () => api.get('/auth/users')
};

// Contest services
export const contestService = {
  getAll: () => api.get('/contests'),
  getMy: () => api.get('/contests/my'),
  getById: (id) => api.get(`/contests/${id}`),
  create: (data) => api.post('/contests', data),
  update: (id, data) => api.put(`/contests/${id}`, data),
  delete: (id) => api.delete(`/contests/${id}`),
  addMember: (contestId, userId) => api.post(`/contests/${contestId}/members`, { userId }),
  removeMember: (contestId, userId) => api.delete(`/contests/${contestId}/members/${userId}`)
};

// Time entry services
export const timeEntryService = {
  clockIn: (formData) => api.post('/timeentries/entry', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  clockOut: (entryId, formData) => api.put(`/timeentries/exit/${entryId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getByContest: (contestId) => api.get(`/timeentries/contest/${contestId}`),
  getMyEntries: (contestId) => api.get(`/timeentries/my/${contestId}`),
  getOpenEntry: (contestId) => api.get(`/timeentries/open/${contestId}`),
  getStats: (contestId) => api.get(`/timeentries/stats/${contestId}`),
  getDaily: (contestId, date) => api.get(`/timeentries/daily/${contestId}/${date}`)
};

// Notification services
export const notificationService = {
  getMy: () => api.get('/notifications/my'),
  send: (userId, message, type, contestId) => api.post('/notifications', { userId, message, type, contestId }),
  sendBulk: (userIds, message, type, contestId) => api.post('/notifications/bulk', { userIds, message, type, contestId }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/mark-all-read'),
  getUnreadCount: () => api.get('/notifications/unread-count')
};

export default api;
