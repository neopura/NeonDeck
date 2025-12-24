import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Services API
export const servicesAPI = {
    getAll: (params = {}) => api.get('/services', { params }),
    getById: (id) => api.get(`/services/${id}`),
    create: (data) => api.post('/services', data),
    update: (id, data) => api.patch(`/services/${id}`, data),
    delete: (id) => api.delete(`/services/${id}`),
};

// Categories API
export const categoriesAPI = {
    getAll: () => api.get('/categories'),
    create: (data) => api.post('/categories', data),
    update: (id, data) => api.patch(`/categories/${id}`, data),
    delete: (id) => api.delete(`/categories/${id}`),
};

// Scanner API
export const scannerAPI = {
    trigger: () => api.post('/scan/trigger'),
    getStatus: () => api.get('/scan/status'),
    getHistory: (limit = 10) => api.get('/scan/history', { params: { limit } }),
};

export default api;
