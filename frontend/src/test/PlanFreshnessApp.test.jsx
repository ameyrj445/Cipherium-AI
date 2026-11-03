import React from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import { analyticsAPI, authAPI } from '../services/api';

vi.mock('../services/api', () => {
  const empty = () => vi.fn().mockResolvedValue({ data: [] });
  return {
    getStoredSession: () => ({ token: 'a', user: { id: 1 }, expiresAt: Date.now() + 600000 }),
    startSession: () => ({ expiresAt: Date.now() + 600000 }), endSession: vi.fn(),
    authAPI: { getProfile: empty() }, quizAPI: { getTopics: empty() },
    analyticsAPI: Object.fromEntries(['getMastery', 'getRecommendations', 'getCurrentPlan', 'getCustomPlans',
      'getRetentionSchedule', 'generateRoadmap', 'getRoadmapStatus', 'createCustomPlan'].map(key => [key, empty()])),
    tasksAPI: { getTodayTasks: empty() },
    tutorAPI: { getHistory: empty(), getConversations: empty() },
    feedbackAPI: { getMyFeedback: empty() },
  };
});
vi.mock('../components/layout/AppShell', () => ({ default: ({ setActiveNav, onLogout, children }) => <>
  {['Study Plan', 'Learn', 'Dashboard'].map(view => <button key={view} onClick={() => setActiveNav(view)}>{view} tab</button>)}
  <button onClick={onLogout}>Log out</button>{children}
</> }));
vi.mock('../components/LearnView', () => ({ default: ({ customPlans, onSelectPlan }) => <>
  {customPlans.map(plan => <button key={plan.id} onClick={() => onSelectPlan(plan)}>Select {plan.subject}</button>)}
</> }));
vi.mock('../components/LoginScreen', () => ({ default: () => <p>Signed out</p> }));
const plan = {
  id: 42, subject: 'Saved algorithms', is_stale: true, last_generated_at: '2020-01-01T00:00:00Z',
  milestones: [{ title: 'Basics', subtopics: ['Arrays'], resources: [] }],
  fixture: { plan_id: 42, status: 'stale', checked_at: '2026-11-03T00:00:00Z', last_generated_at: '2026-11-01T00:00:00Z' },
};
beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear();
  authAPI.getProfile.mockResolvedValue({ data: { id: 1, name: 'Learner' } });
  analyticsAPI.getCustomPlans.mockResolvedValue({ data: [plan, { ...plan, id: 43, subject: 'Saved systems' }] });
  analyticsAPI.getCurrentPlan.mockResolvedValue({ data: plan });
});
const openPlan = async () => {
  render(<App />);
  await waitFor(() => expect(analyticsAPI.getCustomPlans).toHaveBeenCalled());
  fireEvent.click(screen.getByText('Study Plan tab'));
  await screen.findByRole('heading', { name: /Saved algorithms.*Academic Study Plan/ });
};
it('never calls untargeted generation/status during load, repeated disabled clicks, or navigation', async () => {
  await openPlan();
  const action = screen.getByRole('button', { name: 'Regenerate plan' });
  expect(action).toBeDisabled();
  fireEvent.click(action); fireEvent.click(action);
  fireEvent.click(screen.getByText('Dashboard tab')); fireEvent.click(screen.getByText('Study Plan tab'));
  expect(screen.getByRole('heading', { name: 'Plan freshness unavailable' })).toBeInTheDocument();
  expect(screen.queryByText('Your study plan may be out of date')).not.toBeInTheDocument();
  expect(analyticsAPI.generateRoadmap).not.toHaveBeenCalled();
  expect(analyticsAPI.getRoadmapStatus).not.toHaveBeenCalled();
  expect(analyticsAPI.createCustomPlan).not.toHaveBeenCalled();
});
it('does not use cached fixtures to claim stale when reading plans fails', async () => {
  localStorage.setItem('cipherium_saved_plans_1', JSON.stringify([plan]));
  analyticsAPI.getCustomPlans.mockRejectedValue(new Error('offline'));
  analyticsAPI.getCurrentPlan.mockRejectedValue(new Error('offline'));
  await openPlan();
  expect(screen.getByText('Plan freshness unavailable')).toBeInTheDocument();
  expect(screen.queryByText('Your study plan may be out of date')).not.toBeInTheDocument();
  expect(analyticsAPI.generateRoadmap).not.toHaveBeenCalled();
});
it('keeps switching plans and logout free of freshness assertions or regeneration', async () => {
  await openPlan();
  fireEvent.click(screen.getByText('Learn tab'));
  fireEvent.click(screen.getByText('Select Saved systems'));
  fireEvent.click(screen.getByText('Study Plan tab'));
  expect(screen.getByRole('heading', { name: /Saved systems.*Academic Study Plan/ })).toBeInTheDocument();
  expect(screen.getByText('Plan freshness unavailable')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Log out'));
  expect(screen.getByText('Signed out')).toBeInTheDocument();
  expect(screen.queryByText('Plan freshness unavailable')).not.toBeInTheDocument();
  expect(analyticsAPI.generateRoadmap).not.toHaveBeenCalled();
});
it('does not create a standard roadmap when an account has no saved plans', async () => {
  analyticsAPI.getCustomPlans.mockResolvedValue({ data: [] });
  analyticsAPI.getCurrentPlan.mockResolvedValue({ data: null });
  render(<App />);
  await waitFor(() => expect(analyticsAPI.getCustomPlans).toHaveBeenCalled());
  fireEvent.click(screen.getByText('Study Plan tab'));
  expect(screen.queryByRole('button', { name: 'Regenerate plan' })).not.toBeInTheDocument();
  expect(analyticsAPI.generateRoadmap).not.toHaveBeenCalled();
});
