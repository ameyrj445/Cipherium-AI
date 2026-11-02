import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from '../App';
import { authAPI, tutorAPI, analyticsAPI, feedbackAPI } from '../services/api';

vi.mock('../services/api', () => {
  const empty = () => vi.fn().mockResolvedValue({ data: [] });
  return {
    getStoredSession: () => ({ token: 'session-a', user: { id: 1 }, expiresAt: Date.now() + 600000 }),
    startSession: () => ({ expiresAt: Date.now() + 600000 }), endSession: vi.fn(),
    authAPI: { getProfile: vi.fn(), login: vi.fn() },
    quizAPI: { getTopics: empty() },
    analyticsAPI: Object.fromEntries(['getMastery', 'getRecommendations', 'generateRoadmap', 'getCurrentPlan', 'getCustomPlans', 'getRetentionSchedule'].map((key) => [key, empty()])),
    tasksAPI: { getTodayTasks: empty() },
    tutorAPI: { getHistory: vi.fn(), streamMessage: vi.fn(), sendMessage: vi.fn() },
    feedbackAPI: { getMyFeedback: vi.fn(), submit: vi.fn() },
  };
});
vi.mock('../components/layout/AppShell', () => ({ default: ({ setActiveNav, onLogout, children }) => <>
  <button onClick={() => setActiveNav('Dashboard')}>Dashboard tab</button><button onClick={() => setActiveNav('Resources')}>Resources tab</button><button onClick={onLogout}>Log out</button>
  {children}
</> }));
vi.mock('../components/LoginScreen', () => ({ default: ({ handleAuth }) => <button onClick={() => handleAuth({ preventDefault() {} })}>Log in B</button> }));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  authAPI.getProfile.mockResolvedValue({ data: { id: 1 } });
  authAPI.login.mockResolvedValue({ data: { access_token: 'session-b', user: { id: 2 } } });
  tutorAPI.getHistory.mockResolvedValue({ data: [{ id: 731, role: 'assistant', message: 'Persisted answer A' }] });
  feedbackAPI.getMyFeedback.mockResolvedValue({ data: [] });
  feedbackAPI.submit.mockResolvedValue({ data: { id: 9 } });
});


describe('App recommendation feedback integration', () => {
  it('shares saved recommendation feedback between dashboard and Resources and clears it on logout', async () => {
    analyticsAPI.getRecommendations.mockResolvedValue({ data: [{ id: 42, title: 'Real recommendation', url: 'https://example.com', resource_type: 'article' }] });
    render(<App />);
    await screen.findByRole('group', { name: 'Feedback for Real recommendation' });
    fireEvent.click(screen.getByRole('button', { name: 'Helpful', exact: true }));
    await screen.findByText('Feedback saved. Thank you!');
    expect(feedbackAPI.submit).toHaveBeenCalledExactlyOnceWith({ feedback_type: 'rec_rating', target_id: 42, rating: 1 }, 'session-a');
    fireEvent.click(screen.getByText('Resources tab'));
    expect(screen.getByRole('button', { name: 'Helpful', exact: true })).toBeDisabled();
    fireEvent.click(screen.getByText('Dashboard tab'));
    expect(screen.getByRole('button', { name: 'Helpful', exact: true })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByText('Log out'));
    expect(screen.queryByText('Feedback saved. Thank you!')).not.toBeInTheDocument();
  });
});
