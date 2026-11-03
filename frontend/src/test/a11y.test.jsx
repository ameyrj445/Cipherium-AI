import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import App from '../App';
import { getStoredSession, analyticsAPI, adminAPI, quizAPI, tutorAPI } from '../services/api';

// Scan real page markup and the real navigation shell; only network boundaries
// are mocked. JSDOM cannot measure rendered color contrast or tab geometry.
vi.mock('../services/api', () => {
  const fn = (data = []) => vi.fn().mockResolvedValue({ data });
  return {
    getStoredSession: vi.fn(), startSession: vi.fn(), endSession: vi.fn(),
    authAPI: { getProfile: fn({ id: 1, name: 'Admin', email: 'a@example.test', role: 'admin' }) },
    analyticsAPI: {
      generateRoadmap: fn({}), getMastery: fn({}), getRecommendations: fn(), getCurrentPlan: fn(null), getCustomPlans: fn(),
      getSubjectRoadmaps: fn(), getActivityHeatmap: fn({ heatmap_data: [] }), getFlashcards: fn(),
      getRetentionSchedule: fn(), getKnowledgeGraph: fn({ nodes: [], edges: [] }),
    },
    quizAPI: { getTopics: fn(), getNextQuestion: fn(null), generateExam: fn({ questions: [] }) },
    tasksAPI: { getTodayTasks: fn() }, feedbackAPI: { getMyFeedback: fn() },
    tutorAPI: { getConversations: fn(), getHistory: fn(), getConversationMessages: fn() },
    adminAPI: { getQuestions: fn(), getFeedback: fn() },
    settingsAPI: { getProfileSettings: fn({}), updateProfileSettings: fn({}) },
    geminiAPI: { getStatus: fn({}) },
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  for (const fn of [analyticsAPI.getCustomPlans, analyticsAPI.getRecommendations, quizAPI.getTopics, tutorAPI.getConversations, adminAPI.getQuestions, adminAPI.getFeedback]) fn.mockResolvedValue({ data: [] });
  analyticsAPI.getCurrentPlan.mockResolvedValue({ data: null });
  quizAPI.getNextQuestion.mockResolvedValue({ data: null });
  localStorage.clear(); window.history.replaceState({}, '', '/');
  getStoredSession.mockReturnValue({ token: 'test', user: { id: 1, name: 'Admin', role: 'admin' }, expiresAt: Date.now() + 600000 });
});
const check = async (container) => {
  const result = await axe(container, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } });
  expect(result.violations.map(({ id, nodes }) => ({ id, elements: nodes.map(n => n.html) }))).toEqual([]);
};

const loaded = async (page, populated = false) => {
  const titles = { Dashboard: populated ? 'Computer science' : 'Create your first study plan', Learn: 'Curated Learning Roadmaps & Progress Tracker', Practice: 'Adaptive Practice & Diagnostic Evaluation', Analytics: 'Curriculum Mastery & Performance Analytics', Settings: 'Settings & Preferences', Admin: 'Admin dashboard' };
  if (page === 'AI Tutor') await screen.findByRole('textbox', { name: 'Message the tutor' });
  else await screen.findAllByRole('heading', { name: titles[page], exact: true }, { timeout: 8000 });
  if (page === 'Admin') await waitFor(() => expect(screen.queryByText('Loading questions…')).not.toBeInTheDocument());
  expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
};

const populatedPlan = { id: 1, subject: 'Computer science', is_added_to_learn: true, milestones: [{ id: 1, title: 'Arrays', status: 'in_progress', subtopics: ['Indexes'], completed_subtopics: [], resources: [{ id: 1, title: 'Arrays guide', url: 'https://example.test', resource_type: 'article' }] }] };

describe('WCAG A/AA page markup audits (not a manual conformance claim)', () => {
  it.each(['Dashboard', 'Learn', 'Practice', 'Analytics', 'Settings', 'AI Tutor', 'Admin'])('%s has no axe-detectable A/AA violations', async (page) => {
    const { container } = render(<App />);
    await screen.findByRole('button', { name: 'Dashboard', exact: true });
    await act(async () => {});
    if (page !== 'Dashboard') {
      fireEvent.click(screen.getAllByRole('button', { name: page, exact: true })[0]);
      await act(async () => {});
    }
    await loaded(page);
    await check(container);
  });
});


describe('populated and alternate page accessibility states', () => {
  it.each(['Dashboard', 'Learn', 'Practice', 'Analytics', 'AI Tutor', 'Admin'])('%s populated state has no axe-detectable A/AA violations', async page => {
    analyticsAPI.getCustomPlans.mockResolvedValue({ data: [populatedPlan] });
    analyticsAPI.getCurrentPlan.mockResolvedValue({ data: populatedPlan });
    analyticsAPI.getRecommendations.mockResolvedValue({ data: [{ id: 1, title: 'Reference', url: 'https://example.test', resource_type: 'article' }] });
    quizAPI.getTopics.mockResolvedValue({ data: [{ id: 1, name: 'Arrays' }] });
    quizAPI.getNextQuestion.mockResolvedValue({ data: { id: 1, question_text: 'Choose an answer', options: ['One', 'Two'] } });
    tutorAPI.getConversations.mockResolvedValue({ data: [{ id: 1, title: 'Arrays discussion', topic_id: 1 }] });
    adminAPI.getQuestions.mockResolvedValue({ data: [{ id: 1, question_text: 'Draft question', topic_id: 1, status: 'draft', difficulty: 1 }] });
    adminAPI.getFeedback.mockResolvedValue({ data: [{ id: 1, user_id: 1, feedback_type: 'bug', comment: 'Needs review', created_at: '2026-01-01' }] });
    const { container } = render(<App />);
    await act(async () => {});
    if (page !== 'Dashboard') fireEvent.click(screen.getAllByRole('button', { name: page, exact: true })[0]);
    await act(async () => {});
    await loaded(page, true);
    if (page === 'Admin') await screen.findByText('Draft question');
    if (page === 'AI Tutor') await screen.findByRole('button', { name: /Arrays discussion/ });
    await check(container);
    if (page === 'Admin') {
      for (const tab of ['Resources', 'Feedback']) {
        fireEvent.click(screen.getByRole('tab', { name: tab }));
        await act(async () => {});
        await check(container);
      }
    }
  });
});
