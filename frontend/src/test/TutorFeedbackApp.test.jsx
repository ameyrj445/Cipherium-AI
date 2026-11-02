import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import { authAPI, tutorAPI, feedbackAPI } from '../services/api';

vi.mock('../services/api', () => {
  const empty = () => vi.fn().mockResolvedValue({ data: [] });
  return {
    getStoredSession: () => ({ token: 'session-a', user: { id: 1 }, expiresAt: Date.now() + 600000 }),
    startSession: () => ({ expiresAt: Date.now() + 600000 }), endSession: vi.fn(),
    authAPI: { getProfile: vi.fn(), login: vi.fn() },
    quizAPI: { getTopics: empty() },
    analyticsAPI: Object.fromEntries(['getMastery', 'getRecommendations', 'generateRoadmap', 'getCurrentPlan', 'getCustomPlans'].map((key) => [key, empty()])),
    tasksAPI: { getTodayTasks: empty() },
    tutorAPI: { getHistory: vi.fn(), streamMessage: vi.fn(), sendMessage: vi.fn() },
    feedbackAPI: { getMyFeedback: vi.fn(), submit: vi.fn() },
  };
});
vi.mock('../components/layout/AppShell', () => ({ default: ({ activeNav, setActiveNav, onLogout, children }) => <>
  <button onClick={() => setActiveNav('AI Tutor')}>Tutor tab</button><button onClick={onLogout}>Log out</button>
  {activeNav === 'AI Tutor' && children}
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

async function openTutor() {
  render(<App />);
  fireEvent.click(screen.getByText('Tutor tab'));
  await screen.findByText('Persisted answer A');
}

describe('App tutor feedback integration', () => {
  it('preserves real history IDs through App mapping and submits linked feedback', async () => {
    await openTutor();
    fireEvent.click(screen.getByRole('button', { name: 'Helpful', exact: true }));
    await waitFor(() => expect(feedbackAPI.submit).toHaveBeenCalledWith({ feedback_type: 'tutor_rating', target_id: 731, rating: 1 }, 'session-a'));
  });

  it('does not expose previous account messages or ratings after logout and empty history', async () => {
    await openTutor();
    fireEvent.click(screen.getByText('Log out'));
    authAPI.getProfile.mockResolvedValue({ data: { id: 2 } });
    tutorAPI.getHistory.mockResolvedValue({ data: [] });
    fireEvent.click(screen.getByText('Log in B'));
    await screen.findByText('Tutor tab');
    await waitFor(() => expect(authAPI.getProfile).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('Persisted answer A')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Helpful', exact: true })).not.toBeInTheDocument();
    expect(feedbackAPI.submit).not.toHaveBeenCalled();
  });

  it('ignores old history completing after switching accounts', async () => {
    let resolveOld;
    tutorAPI.getHistory.mockReturnValueOnce(new Promise((resolve) => { resolveOld = resolve; }));
    render(<App />);
    fireEvent.click(screen.getByText('Tutor tab'));
    await waitFor(() => expect(tutorAPI.getHistory).toHaveBeenCalled());
    fireEvent.click(screen.getByText('Log out'));
    authAPI.getProfile.mockResolvedValue({ data: { id: 2 } });
    tutorAPI.getHistory.mockResolvedValue({ data: [] });
    fireEvent.click(screen.getByText('Log in B'));
    await screen.findByText('Tutor tab');
    await act(async () => resolveOld({ data: [{ id: 731, role: 'assistant', message: 'Old private answer' }] }));
    expect(screen.queryByText('Old private answer')).not.toBeInTheDocument();
  });

  it('does not replace an active new answer with delayed saved history or assign it an old ID', async () => {
    let resolveHistory;
    tutorAPI.getHistory.mockReturnValueOnce(new Promise((resolve) => { resolveHistory = resolve; }));
    render(<App />);
    fireEvent.click(screen.getByText('Tutor tab'));
    await waitFor(() => expect(tutorAPI.getHistory).toHaveBeenCalled());
    const input = screen.getByPlaceholderText(/Ask anything about your syllabus/);
    fireEvent.change(input, { target: { value: 'A new question' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(tutorAPI.streamMessage).toHaveBeenCalled());
    await act(async () => resolveHistory({ data: [{ id: 731, role: 'assistant', message: 'Old history' }] }));
    const [, chunk, done] = tutorAPI.streamMessage.mock.calls[0];
    act(() => { chunk('New answer'); done({}); });
    expect(screen.getByText('New answer')).toBeInTheDocument();
    expect(screen.queryByText('Old history')).not.toBeInTheDocument();
    expect(screen.getByText(/this answer has no saved message ID/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Helpful', exact: true })).not.toBeInTheDocument();
  });

  it('ignores previous streaming callbacks after starting a new chat', async () => {
    await openTutor();
    const input = screen.getByPlaceholderText(/Ask anything about your syllabus/);
    fireEvent.change(input, { target: { value: 'First question' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    const [, chunk, done, error] = tutorAPI.streamMessage.mock.calls[0];
    fireEvent.click(screen.getByRole('button', { name: /New/ }));
    await act(async () => { chunk('Stale answer'); done({}); await error(new Error('late')); });
    expect(screen.queryByText('Stale answer')).not.toBeInTheDocument();
    expect(tutorAPI.sendMessage).not.toHaveBeenCalled();
    expect(screen.queryByText('First question')).not.toBeInTheDocument();
  });

});
