import React from 'react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../src/App';
import api, { authAPI, analyticsAPI, tutorAPI, startSession, endSession } from '../src/services/api';

// These are real App interactions against a real FastAPI process with a fresh
// disposable SQLite DB. No vi.mock, fake HTTP responses or backend route stubs.
const responses = [];
let responseInterceptor;
let serial = 0;
let account;
const password = 'Integration-only-password-42!';
const requestPath = response => response.config.url.split('?')[0];
const completed = async (path, from = 0) => {
  let response;
  await waitFor(() => {
    response = responses.slice(from).find(r => requestPath(r) === path);
    expect(response).toBeDefined();
    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);
  }, { timeout: 20000 });
  return response;
};
const click = name => fireEvent.click(screen.getAllByRole('button', { name, exact: true })[0]);
const change = (node, value) => fireEvent.change(node, { target: { value } });
const dashboard = async () => {
  await screen.findByRole('button', { name: 'Dashboard', exact: true });
  await completed('/tasks/today');
  await completed('/roadmaps/custom');
};
const mountSignedIn = async (beforeMount) => {
  const result = await authAPI.register({ name: 'Integration Learner', email: account.email, password });
  const token = result.data.access_token;
  startSession(token, { id: result.data.user_id, name: 'Integration Learner', email: account.email });
  if (beforeMount) await beforeMount();
  render(<App />);
  await dashboard();
  return token;
};

beforeAll(() => {
  const url = process.env.CIPHERIUM_INTEGRATION_URL;
  if (!url || !/^http:\/\/127\.0\.0\.1:\d+$/.test(url)) throw new Error('Use npm run test:integration; never point these mutation tests at shared data.');
  responseInterceptor = api.interceptors.response.use(response => { responses.push(response); return response; });
});
beforeEach(() => {
  responses.length = 0;
  localStorage.clear(); endSession(); window.history.replaceState({}, '', '/');
  account = { email: `journey-${Date.now()}-${++serial}@example.com` };
});
afterEach(() => { vi.restoreAllMocks(); endSession(); });
afterAll(() => api.interceptors.response.eject(responseInterceptor));

describe('real backend learner journeys (disposable data, offline AI fallback)', () => {
  it('registers, signs out, logs in and renders the authenticated dashboard', async () => {
    render(<App />);
    click('Register');
    change(screen.getByPlaceholderText('e.g. Amey Jain'), 'Integration Learner');
    change(screen.getByPlaceholderText('student@cipherium.ai'), account.email);
    change(screen.getByPlaceholderText('••••••••'), password);
    click('Create Account & Start');
    await dashboard();
    const registration = await completed('/auth/register');
    expect(registration.data.user_id).toBeTypeOf('number');
    expect((await authAPI.getProfile()).data.email).toBe(account.email);
    click('Log out');
    click('Sign In');
    await screen.findByRole('button', { name: 'Sign In & Open Workspace' });
    change(screen.getByPlaceholderText('student@cipherium.ai'), account.email);
    change(screen.getByPlaceholderText('••••••••'), password);
    click('Sign In & Open Workspace');
    await completed('/auth/login');
    await screen.findByRole('button', { name: 'Dashboard', exact: true });
    expect((await authAPI.getProfile()).data.email).toBe(account.email);
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });

  it('answers a real adaptive quiz and persists its mastery update', async () => {
    await mountSignedIn(); click('Practice');
    const question = (await completed('/quizzes/next')).data;
    await screen.findByText(question.question_text);
    fireEvent.click(screen.getByText(question.options[0]).closest('[role="button"]'));
    click('Submit Response');
    const attempt = (await completed('/quizzes/attempts')).data;
    await completed(`/quizzes/${attempt.quiz_id}/complete`);
    expect(attempt.new_mastery_score).toBeTypeOf('number');
    const mastery = (await analyticsAPI.getMastery()).data;
    const row = mastery.topics.find(t => t.topic_id === question.topic_id);
    expect(row).toBeDefined();
    expect(row.mastery_score).toBe(attempt.new_mastery_score);
    expect(row.attempt_count).toBeGreaterThan(0);
    const persisted = (await api.get(`/quizzes/${attempt.quiz_id}`)).data;
    expect(persisted.is_finalized).toBe(true);
    expect(persisted.question_ids).toContain(question.id);
    // Finalizing the adaptive question also releases the backend anti-cheat lock.
    const tutor = await api.post('/tutor/chat', { message: 'Explain arrays simply.' });
    expect(tutor.status).toBe(200);
    await screen.findByText(attempt.is_correct ? /Correct! Well done/i : /Incorrect/i);
  });

  it('creates a tutor thread, consumes real SSE and restores persisted messages', async () => {
    const token = await mountSignedIn(); click('AI Tutor');
    click('New Conversation');
    let thread;
    await waitFor(() => { thread = responses.find(r => requestPath(r) === '/tutor/conversations' && r.config.method === 'post')?.data; expect(thread?.id).toBeTypeOf('number'); });
    // POST result is authoritative; list responses can also use this path.
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Message the tutor' })).toBeEnabled());
    const nativeFetch = globalThis.fetch;
    let sseResponse;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (...args) => {
      const response = await nativeFetch(...args);
      if (String(args[0]).endsWith('/tutor/chat/stream')) sseResponse = response.clone();
      return response;
    });
    const message = 'Explain arrays and their indexing in simple terms.';
    change(screen.getByRole('textbox', { name: 'Message the tutor' }), message);
    click('Send message');
    await waitFor(async () => {
      const saved = (await tutorAPI.getConversationMessages(thread.id, token)).data;
      expect(saved.filter(m => m.role === 'assistant')).toHaveLength(1);
    }, { timeout: 20000, interval: 250 });
    expect(sseResponse?.headers.get('content-type')).toMatch(/text\/event-stream/);
    const events = await sseResponse.text();
    expect(events).toContain('"done": true');
    expect(responses.some(r => r.config.method === 'post' && requestPath(r) === '/tutor/chat')).toBe(false);
    const saved = (await tutorAPI.getConversationMessages(thread.id, token)).data;
    expect(saved.find(m => m.role === 'user').message).toBe(message);
    const answer = saved.find(m => m.role === 'assistant').message;
    expect(answer.length).toBeGreaterThan(20);
    await screen.findByText((_, node) => node.tagName === 'DIV' && node.textContent === answer);
    expect(screen.queryByText(/Could not send|Unable to send/i)).not.toBeInTheDocument();
  });

  it('independently generates an isolated roadmap and persists a daily-task toggle', async () => {
    // Explicitly exercise this endpoint only for a fresh disposable account,
    // separate from App initialization. Never overwrite a user's saved plan.
    await mountSignedIn(() => analyticsAPI.generateRoadmap(10));
    const roadmap = (await completed('/roadmaps/generate')).data;
    expect(roadmap.tasks.length).toBeGreaterThan(0);
    expect(responses.filter(r => requestPath(r) === '/roadmaps/generate')).toHaveLength(1);
    const tasks = (await completed('/tasks/today')).data;
    expect(tasks.length).toBeGreaterThan(0);
    const task = tasks[0];
    const title = await screen.findByText(task.title);
    fireEvent.click(title.closest('[role="button"]') || title.closest('button') || title);
    const toggled = await completed(`/tasks/${task.id}/toggle`);
    expect(toggled.data.is_done).toBe(!task.is_done);
    const reread = await api.get('/tasks/today');
    expect(reread.data.find(t => t.id === task.id).is_done).toBe(!task.is_done);
  });

  it('preserves a saved custom plan on workspace load and study-plan navigation', async () => {
    const plan = {
      subject: 'Preserved integration plan', target_hours_per_week: 6,
      milestones: [{ id: 'foundation', title: 'Foundations', status: 'in_progress',
        subtopics: ['Arrays'], completed_subtopics: [], resources: [] }],
    };
    let before;
    await mountSignedIn(async () => {
      await analyticsAPI.saveCustomPlan(plan);
      before = (await analyticsAPI.getCustomPlans()).data;
    });
    click('Study Plan');
    await screen.findByRole('heading', { name: /Preserved integration plan/ });
    expect(screen.getByRole('heading', { name: 'Plan freshness unavailable' })).toBeInTheDocument();
    const regenerate = screen.getByRole('button', { name: 'Regenerate plan' });
    expect(regenerate).toBeDisabled();
    fireEvent.click(regenerate); fireEvent.click(regenerate);
    click('Dashboard'); click('Study Plan');
    expect((await analyticsAPI.getCustomPlans()).data).toEqual(before);
    expect(responses.some(r => requestPath(r) === '/roadmaps/generate')).toBe(false);
    expect(responses.some(r => requestPath(r) === '/roadmaps/status')).toBe(false);
  });

  it('requests a real export and starts a downloadable JSON with the signed-in user data', async () => {
    await mountSignedIn(); click('Settings');
    await screen.findByRole('button', { name: 'Export my data' });
    let downloadedBlob;
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = blob => { downloadedBlob = blob; return 'blob:integration-download'; };
    URL.revokeObjectURL = () => {};
    // JSDOM cannot save to disk; intercept only the final browser download click.
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    try {
      click('Export my data');
      await completed('/me/export');
      await waitFor(() => expect(anchorClick).toHaveBeenCalledOnce());
      const json = await new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(JSON.parse(reader.result)); reader.onerror = reject; reader.readAsText(downloadedBlob);
      });
      expect(json.user.email).toBe(account.email);
      expect(json.user).not.toHaveProperty('password_hash');
      expect(json).toHaveProperty('quiz_history');
      expect(anchorClick.mock.instances[0].download).toMatch(/^cipherium_export_.*\.json$/);
      expect(document.querySelector('a[download]')).toBeNull();
    } finally { URL.createObjectURL = originalCreate; URL.revokeObjectURL = originalRevoke; }
  });
});
