import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const SESSION_STORAGE_KEY = 'cipherium_session';
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

// Keep the active token in memory, and retain it in browser storage only until
// its two-hour expiry so a refresh can restore a still-valid sign-in.
let sessionToken = '';

export const setSessionToken = (token) => {
  sessionToken = token || '';
};

export const getStoredSession = () => {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || 'null');
    if (!session?.token || !session?.expiresAt || session.expiresAt <= Date.now()) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    setSessionToken(session.token);
    return session;
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
};

export const startSession = (token, user) => {
  const session = { token, user, expiresAt: Date.now() + SESSION_DURATION_MS };
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  setSessionToken(token);
  return session;
};

export const endSession = () => {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  setSessionToken('');
};

// Interceptor to automatically attach the active-session JWT Bearer token.
api.interceptors.request.use(
  (config) => {
    if (sessionToken) {
      config.headers.Authorization = `Bearer ${sessionToken}`;
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
  getCustomPlans: () => api.get('/roadmaps/custom'),
  deleteCustomPlan: (planId) => api.delete(`/roadmaps/custom/${planId}`),
  saveCustomPlan: (plan) => api.post('/roadmaps/custom/save', { plan }),
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
