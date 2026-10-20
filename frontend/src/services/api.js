import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to automatically attach JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cipherium_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
};

export const quizAPI = {
  getTopics: () => api.get('/topics'),
  getNextQuestion: (topicId) => api.get(`/quizzes/next${topicId ? `?topic_id=${topicId}` : ''}`),
  submitAttempt: (data) => api.post('/quizzes/attempts', data),
};

export const analyticsAPI = {
  getMastery: () => api.get('/analytics/mastery'),
  getRecommendations: () => api.get('/recommendations'),
  generateRoadmap: (targetHours) => api.post('/roadmaps/generate', { target_hours_per_week: targetHours }),
  createCustomPlan: (data) => api.post('/roadmaps/custom', data),
  getCurrentPlan: () => api.get('/roadmaps/current'),
  updatePlanProgress: (data) => api.put('/roadmaps/progress', data),
};

export const geminiAPI = {
  getStatus: () => api.get('/settings/gemini-status'),
  setKey: (apiKey) => api.post('/settings/gemini-key', { api_key: apiKey }),
};

export const tutorAPI = {
  sendMessage: (data) => api.post('/tutor/chat', data),
};

export default api;
