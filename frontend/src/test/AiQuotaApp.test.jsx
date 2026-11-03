import React from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import { authAPI, tutorAPI, settingsAPI } from '../services/api';
vi.mock('../services/api', () => {
  const empty = () => vi.fn().mockResolvedValue({ data: [] });
  return {
    getStoredSession: () => ({ token: 'a', user: { id: 1 }, expiresAt: Date.now() + 600000 }),
    startSession: () => ({ expiresAt: Date.now() + 600000 }), endSession: vi.fn(),
    authAPI: { getProfile: empty(), login: empty() }, quizAPI: { getTopics: empty() },
    analyticsAPI: Object.fromEntries(['getMastery','getRecommendations','getCurrentPlan','getCustomPlans','getRetentionSchedule'].map(key => [key, empty()])),
    tasksAPI: { getTodayTasks: empty() },
    tutorAPI: Object.fromEntries(['getHistory','getConversations','getConversationMessages','streamMessage'].map(key => [key, empty()])),
    feedbackAPI: { getMyFeedback: empty(), submit: empty() },
    settingsAPI: { getProfileSettings: empty() }, geminiAPI: { getStatus: empty() },
  };
});
vi.mock('../components/layout/AppShell', () => ({ default: ({ setActiveNav, onLogout, children }) => <>
  <button onClick={() => setActiveNav('Settings')}>Settings tab</button>
  <button onClick={() => setActiveNav('AI Tutor')}>Tutor tab</button>
  <button onClick={onLogout}>Log out</button>{children}
</> }));
vi.mock('../components/LoginScreen', () => ({ default: () => <p>Signed out</p> }));
beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear();
  authAPI.getProfile.mockResolvedValue({ data: { id: 1, name: 'Learner' } });
  settingsAPI.getProfileSettings.mockResolvedValue({ data: { monthly_token_used: 50000, token_quota: 50000 } });
  tutorAPI.getConversations.mockResolvedValue({ data: [{ id: 1, title: 'Saved thread' }] });
});
it('never enables a quota meter from current settings values; server-confirmed quota follows navigation and clears on logout', async () => {
  tutorAPI.streamMessage.mockImplementation(async (_d,_c,_done,error) => error({ status: 429, message: 'Monthly AI quota exceeded. Upgrade or wait until next month.' }));
  render(<App />);
  await screen.findByText('Settings tab');
  fireEvent.click(screen.getByText('Settings tab'));
  await waitFor(() => expect(settingsAPI.getProfileSettings).toHaveBeenCalled());
  expect(screen.getByText(/Usage unavailable/)).toBeInTheDocument();
  expect(screen.queryByRole('progressbar', { name: 'Monthly AI token usage' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('Tutor tab'));
  fireEvent.click(await screen.findByRole('button', { name: /Saved thread/ }));
  const input = screen.getByRole('textbox', { name: /message/i });
  await waitFor(() => expect(input).not.toBeDisabled());
  fireEvent.change(input, { target: { value: 'Explain' } });
  fireEvent.click(screen.getByRole('button', { name: /send message/i }));
  await screen.findByText(/Monthly AI quota reached/);
  expect(input).toBeDisabled();
  fireEvent.click(screen.getByText('Settings tab'));
  expect(screen.getByText(/reset date is unavailable/)).toBeInTheDocument();
  fireEvent.click(screen.getByText('Log out'));
  expect(screen.queryByText(/Monthly AI quota reached/)).not.toBeInTheDocument();
});
