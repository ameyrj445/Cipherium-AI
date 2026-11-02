/**
 * Cipherium AI - Centralized HTTP Client & Session Management
 *
 * Architecture:
 * - Uses Axios with baseURL dynamically populated from Vite environment variables.
 * - Manages student authentication sessions with a 12-hour structured token TTL.
 * - Automatically injects JWT Bearer authorization headers via Axios request interceptors.
 * - Organizes backend endpoint calls into semantic resource namespaces:
 *     authAPI, quizAPI, analyticsAPI, tutorAPI, and geminiAPI.
 */

import axios from 'axios';

// Vite environment variable with local fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const SESSION_STORAGE_KEY = 'cipherium_session';
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12-hour session lifetime

// Fast in-memory token cache to avoid redundant localStorage reads on every request
let sessionToken = '';

export const setSessionToken = (token) => {
  sessionToken = token || '';
};

/**
 * Restores the active user session from browser storage if still within the 12-hour TTL.
 * Automatically purges expired sessions to ensure stale credentials are not reused.
 */
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

/**
 * Initiates a new authenticated session, calculates the expiration timestamp,
 * and caches the token for immediate API requests.
 */
export const startSession = (token, user) => {
  const session = { token, user, expiresAt: Date.now() + SESSION_DURATION_MS };
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  setSessionToken(token);
  return session;
};

/**
 * Clears the active session from both memory and local storage.
 */
export const endSession = () => {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  setSessionToken('');
};

/**
 * Axios Request Interceptor:
 * Attaches the Authorization header with the Bearer JWT token if a valid session exists.
 */
api.interceptors.request.use(
  (config) => {
    // Feedback must never be reassigned to a different login while queued.
    if (config.expectedSessionToken !== undefined && config.expectedSessionToken !== sessionToken) {
      throw new axios.CanceledError('The feedback session has changed.');
    }
    if (sessionToken) {
      config.headers.Authorization = `Bearer ${sessionToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Auth Service ──────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  deleteAccount: () => api.delete('/me'),
};

// ── Diagnostic Quizzes & Assessments ──────────────────────────────────────────
export const quizAPI = {
  getTopics: () => api.get('/topics'),
  getNextQuestion: (topicId) => api.get(`/quizzes/next${topicId ? `?topic_id=${topicId}` : ''}`),
  submitAttempt: (data) => api.post('/quizzes/attempts', data),
  generateExam: (params = {}) => api.post('/quizzes/exam', null, { params }),
};

// ── Analytics, Machine Learning & Study Plans ─────────────────────────────────
export const analyticsAPI = {
  getMastery: () => api.get('/analytics/mastery'),
  getMasteryHistory: (topicId, { signal } = {}) => api.get('/analytics/mastery/history', {
    params: topicId == null ? {} : { topic_id: topicId },
    signal,
  }),
  getRecommendations: () => api.get('/recommendations'),
  generateRoadmap: (targetHours) => api.post('/roadmaps/generate', { target_hours_per_week: targetHours }),
  getSubjectRoadmaps: () => api.get('/roadmaps/subjects'),
  createCustomPlan: (data) => api.post('/roadmaps/custom', data),
  getCustomPlans: () => api.get('/roadmaps/custom'),
  deleteCustomPlan: (planId) => api.delete(`/roadmaps/custom/${planId}`),
  saveCustomPlan: (plan) => api.post('/roadmaps/custom/save', { plan }),
  getCurrentPlan: () => api.get('/roadmaps/current'),
  updatePlanProgress: (data) => api.put('/roadmaps/progress', data),
  getFlashcards: () => api.get('/analytics/flashcards'),
  getStreak: () => api.get('/analytics/streak'),
  getRetentionSchedule: () => api.get('/analytics/retention-schedule'),
  getKnowledgeGraph: () => api.get('/analytics/knowledge-graph'),
  getActivityHeatmap: () => api.get('/analytics/activity-heatmap'),
};

// ── Daily Study Tasks ─────────────────────────────────────────────────────────
export const tasksAPI = {
  getTodayTasks: () => api.get('/tasks/today'),
  toggleTask: (taskId) => api.put(`/tasks/${taskId}/toggle`),
};

// ── Persistent User Settings & Preferences ───────────────────────────────────
export const settingsAPI = {
  getProfileSettings: () => api.get('/settings/profile'),
  updateProfileSettings: (data) => api.put('/settings/profile', data),
};

// ── Gemini AI Tutor Configuration ─────────────────────────────────────────────
export const geminiAPI = {
  getStatus: () => api.get('/settings/gemini-status'),
  setKey: (apiKey) => api.post('/settings/gemini-key', { api_key: apiKey }),
};

// ── AI Pedagogical Tutor Dialogue ─────────────────────────────────────────────
export const tutorAPI = {
  sendMessage: (data, expectedSessionToken, signal) => api.post('/tutor/chat', data, { expectedSessionToken, signal, timeout: 60000 }),
  getHistory: (limit = 30, expectedSessionToken, signal) => api.get(`/tutor/history?limit=${limit}`, { expectedSessionToken, signal, timeout: 15000 }),
  createConversation: (data, expectedSessionToken, signal) => api.post('/tutor/conversations', data, { expectedSessionToken, signal, timeout: 15000 }),
  getConversations: (params, expectedSessionToken) => api.get('/tutor/conversations', { params, expectedSessionToken, timeout: 15000 }),
  getConversationMessages: (id, expectedSessionToken, signal) => api.get(`/tutor/conversations/${id}/messages`, { expectedSessionToken, signal, timeout: 15000 }),
  sendConversationMessage: (id, data, expectedSessionToken, signal) => api.post(`/tutor/conversations/${id}/messages`, data, { expectedSessionToken, signal, timeout: 60000 }),
  streamMessage: async (data, onChunk, onDone, onError, signal, expectedSessionToken) => {
    try {
      const token = sessionToken || getStoredSession()?.token;
      if (expectedSessionToken !== undefined && token !== expectedSessionToken) return;
      const response = await fetch(`${API_BASE_URL}/tutor/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
        signal,
      });

      if (!response.ok) {
        let errorDetail = `HTTP error ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson?.detail) errorDetail = errJson.detail;
        } catch (_) {}
        const error = new Error(errorDetail);
        error.status = response.status;
        throw error;
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by environment');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let completed = false;
      const consume = (event) => {
        const data = event.split(/\r?\n/).filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trimStart()).join('\n');
        if (!data || completed) return;
        const parsed = JSON.parse(data);
        if (parsed.error) throw new Error('The tutor response stream failed.');
        if (parsed.done) {
          completed = true;
          onDone?.(parsed);
        } else if (typeof parsed.chunk === 'string') onChunk?.(parsed.chunk);
      };
      try {
        while (true) {
          const { value, done } = await reader.read();
          buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
          const events = buffer.split(/\r?\n\r?\n/);
          buffer = events.pop();
          for (const event of events) consume(event);
          if (done) { if (buffer.trim()) consume(buffer); break; }
        }
        if (!completed) throw new Error('The response stream ended before completion.');
      } finally { reader.releaseLock?.(); }
    } catch (err) {
      if (err.name === 'AbortError') {
        // Stream aborted gracefully
        return;
      }
      if (onError) await onError(err);
    }
  },
};

// ── Learner Profile & GDPR Data Portability ──────────────────────────────────
export const profileAPI = {
  exportData: (format = 'json') =>
    api.get(`/me/export?format=${format}`, {
      responseType: format === 'json' ? 'json' : 'blob',
      timeout: 60000,
    }),
};

// ── Recommendation & Dialogue Feedback ───────────────────────────────────────
export const feedbackAPI = {
  submit: (data, expectedSessionToken) => api.post('/feedback', data, { expectedSessionToken, timeout: 15000 }),
  getMyFeedback: (params, expectedSessionToken) => api.get('/feedback/my', { params, expectedSessionToken, timeout: 15000 }),
};

// ── Admin Content Management System (CMS) ────────────────────────────────────
export const adminAPI = {
  createResource: (data) => api.post('/admin/resources', data),
  bumpResourceVersion: (id) => api.post(`/admin/resources/${id}/version`),
  createQuestion: (data) => api.post('/admin/questions', data),
  updateQuestionStatus: (id, status) => api.patch(`/admin/questions/${id}/status`, { status }),
  getQuestions: (params) => api.get('/admin/questions', { params }),
  getFeedback: (params) => api.get('/admin/feedback', { params }),
  getOverview: () => api.get('/admin/analytics/overview'),
};

export default api;
