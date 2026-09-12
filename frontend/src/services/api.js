import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('govassist_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to catch 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized, clear invalid token
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        localStorage.removeItem('govassist_token');
        localStorage.removeItem('govassist_user');
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/users/me');
    return res.data;
  },
};

export const profileApi = {
  get: async () => {
    const res = await api.get('/users/profile');
    return res.data;
  },
  update: async (profileData) => {
    const res = await api.put('/users/profile', profileData);
    return res.data;
  },
};

export const docApi = {
  list: async () => {
    const res = await api.get('/documents');
    return res.data;
  },
  upload: async (file, docType) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', docType);
    const res = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  getAnalysis: async (docId) => {
    const res = await api.get(`/documents/${docId}/analysis`);
    return res.data;
  },
  syncToProfile: async (docId) => {
    const res = await api.post(`/documents/${docId}/sync-to-profile`);
    return res.data;
  },
  delete: async (docId) => {
    const res = await api.delete(`/documents/${docId}`);
    return res.data;
  },
};

export const schemeApi = {
  list: async (params = {}) => {
    const res = await api.get('/schemes', { params });
    return res.data;
  },
  get: async (schemeId) => {
    const res = await api.get(`/schemes/${schemeId}`);
    return res.data;
  },
  create: async (schemeData) => {
    const res = await api.post('/schemes', schemeData);
    return res.data;
  },
  update: async (schemeId, schemeData) => {
    const res = await api.put(`/schemes/${schemeId}`, schemeData);
    return res.data;
  },
  delete: async (schemeId) => {
    const res = await api.delete(`/schemes/${schemeId}`);
    return res.data;
  },
};

export const eligibilityApi = {
  check: async () => {
    const res = await api.post('/eligibility/check');
    return res.data;
  },
  getResults: async () => {
    const res = await api.get('/eligibility/results');
    return res.data;
  },
};

export const chatApi = {
  sendMessage: async (message) => {
    const res = await api.post('/chat', { message });
    return res.data;
  },
};

export const historyApi = {
  list: async () => {
    const res = await api.get('/history');
    return res.data;
  },
  record: async (actionType, schemeId = null, schemeName = null, notes = null) => {
    const res = await api.post('/history', null, {
      params: { action_type: actionType, scheme_id: schemeId, scheme_name: schemeName, notes },
    });
    return res.data;
  },
};

export const dashboardApi = {
  getStats: async () => {
    const res = await api.get('/dashboard/stats');
    return res.data;
  },
};

export const adminApi = {
  getStats: async () => {
    const res = await api.get('/admin/stats');
    return res.data;
  },
  getUsers: async (search = '') => {
    const res = await api.get('/admin/users', { params: { search } });
    return res.data;
  },
};

export default api;
