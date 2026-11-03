import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TutorFeedback from '../components/TutorFeedback';
import { canRateMessage, useTutorFeedback } from '../hooks/useTutorFeedback';
import { feedbackAPI } from '../services/api';

vi.mock('../services/api', () => ({ feedbackAPI: { getMyFeedback: vi.fn(), submit: vi.fn() } }));
const answer = { id: 42, role: 'assistant', text: 'Saved answer' };
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
function Harness({ session = 'session-a', message = answer, visible = true }) {
  const feedback = useTutorFeedback(session);
  return visible ? <TutorFeedback message={message} feedback={feedback} /> : null;
}

beforeEach(() => {
  vi.resetAllMocks();
  feedbackAPI.getMyFeedback.mockResolvedValue({ data: [] });
  feedbackAPI.submit.mockResolvedValue({ data: { id: 1, target_id: 42, rating: 1 } });
});

describe('Tutor feedback eligibility and controls', () => {
  it.each([undefined, null, 0, -1, 1.5, '42', Number.MAX_SAFE_INTEGER + 1])('rejects invalid saved ID %s', (id) => {
    render(<Harness message={{ ...answer, id }} />);
    expect(canRateMessage({ ...answer, id })).toBe(false);
    expect(screen.queryByRole('button', { name: 'Helpful' })).not.toBeInTheDocument();
    expect(screen.getByText(/no saved message ID/)).toBeInTheDocument();
    expect(feedbackAPI.submit).not.toHaveBeenCalled();
  });
  it.each([{ role: 'user' }, { isCustomCard: true }, { error: true }, { streaming: true }])('does not rate noneligible message %j', (extra) => {
    render(<Harness message={{ ...answer, ...extra }} />);
    expect(canRateMessage({ ...answer, ...extra })).toBe(false);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
  it.each([['Helpful', 1], ['Not helpful', -1]])('links %s to the actual persisted ID', async (label, rating) => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: label }));
    expect(await screen.findByText('Rating saved. Thank you!')).toBeInTheDocument();
    expect(feedbackAPI.submit).toHaveBeenCalledExactlyOnceWith({ feedback_type: 'tutor_rating', target_id: 42, rating }, 'session-a');
    expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Helpful' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Not helpful' })).toBeDisabled();
  });
  it('locks repeated/opposite clicks during pending and retains success across tab unmount', async () => {
    const pending = deferred();
    feedbackAPI.submit.mockReturnValue(pending.promise);
    const { rerender } = render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Helpful' }));
    fireEvent.click(screen.getByRole('button', { name: 'Not helpful' }));
    expect(screen.getByRole('status')).toHaveTextContent('Checking and saving');
    await waitFor(() => expect(feedbackAPI.submit).toHaveBeenCalledTimes(1));
    rerender(<Harness visible={false} />);
    await act(async () => pending.resolve({ data: {} }));
    rerender(<Harness />);
    expect(screen.getByText('Rating saved. Thank you!')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Helpful' }));
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(1);
  });
});

describe('Feedback readback and safe retry', () => {
  it('finds an existing tutor rating beyond the first page and does not submit again', async () => {
    feedbackAPI.getMyFeedback.mockResolvedValueOnce({ data: Array.from({ length: 100 }, (_, i) => ({ target_id: i + 100, feedback_type: 'rec_rating' })) })
      .mockResolvedValueOnce({ data: [{ target_id: 42, feedback_type: 'tutor_rating', rating: -1 }] });
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Helpful' }));
    await screen.findByText('Rating saved. Thank you!');
    expect(feedbackAPI.getMyFeedback).toHaveBeenNthCalledWith(1, { skip: 0, limit: 100 }, 'session-a');
    expect(feedbackAPI.getMyFeedback).toHaveBeenNthCalledWith(2, { skip: 100, limit: 100 }, 'session-a');
    expect(feedbackAPI.submit).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Not helpful' })).toHaveAttribute('aria-pressed', 'true');
  });
  it('does not confuse another feedback type sharing the target ID', async () => {
    feedbackAPI.getMyFeedback.mockResolvedValue({ data: [{ target_id: 42, feedback_type: 'rec_rating', rating: 1 }] });
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Helpful' }));
    await screen.findByText('Rating saved. Thank you!');
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(1);
  });
  it.each([new Error('offline'), null])('fails closed for unavailable or malformed history and supports retry (%s)', async (failure) => {
    if (failure) feedbackAPI.getMyFeedback.mockRejectedValueOnce(failure);
    else feedbackAPI.getMyFeedback.mockResolvedValueOnce({ data: {} });
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Helpful' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Nothing was sent');
    expect(feedbackAPI.submit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Retry rating' }));
    await screen.findByText('Rating saved. Thank you!');
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(1);
  });
  it('allows retry for a definitive rejection', async () => {
    feedbackAPI.submit.mockRejectedValueOnce({ response: { status: 422 } });
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Not helpful' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('not accepted');
    fireEvent.click(screen.getByRole('button', { name: 'Retry rating' }));
    await screen.findByText('Rating saved. Thank you!');
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(2);
  });
  it.each([undefined, 408, 500])('never resends an ambiguous POST failure (%s)', async (status) => {
    feedbackAPI.submit.mockRejectedValueOnce(status ? { response: { status } } : new Error('network'));
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Helpful' }));
    await screen.findByRole('alert');
    expect(screen.getByRole('button', { name: 'Helpful' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Check rating status' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No rating was resent'));
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(1);
    feedbackAPI.getMyFeedback.mockResolvedValueOnce({ data: [{ target_id: 42, feedback_type: 'tutor_rating', rating: 1 }] });
    fireEvent.click(screen.getByRole('button', { name: 'Check rating status' }));
    await screen.findByText('Rating saved. Thank you!');
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(1);
  });
});

describe('Feedback session isolation', () => {
  it('does not submit without an authenticated session', async () => {
    render(<Harness session="" />);
    fireEvent.click(screen.getByRole('button', { name: 'Helpful' }));
    expect(feedbackAPI.getMyFeedback).not.toHaveBeenCalled();
    expect(feedbackAPI.submit).not.toHaveBeenCalled();
  });
  it('remains usable after StrictMode effect setup and cleanup', async () => {
    render(<React.StrictMode><Harness /></React.StrictMode>);
    fireEvent.click(screen.getByRole('button', { name: 'Helpful' }));
    await screen.findByText('Rating saved. Thank you!');
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(1);
  });
  it('does not start a POST after the owning App unmounts', async () => {
    const pending = deferred();
    feedbackAPI.getMyFeedback.mockReturnValueOnce(pending.promise);
    const { unmount } = render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Helpful' }));
    unmount();
    await act(async () => pending.resolve({ data: [] }));
    expect(feedbackAPI.submit).not.toHaveBeenCalled();
  });
  it('discards stale history and stops pagination after a session change', async () => {
    const pending = deferred();
    feedbackAPI.getMyFeedback.mockReturnValueOnce(pending.promise);
    const { rerender } = render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Helpful' }));
    rerender(<Harness session="session-b" />);
    await act(async () => pending.resolve({ data: Array.from({ length: 100 }, () => ({ feedback_type: 'rec_rating' })) }));
    expect(feedbackAPI.getMyFeedback).toHaveBeenCalledTimes(1);
    expect(feedbackAPI.submit).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Helpful' })).not.toBeDisabled();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
  it.each(['resolve', 'reject'])('ignores a late POST %s after changing session', async (completion) => {
    const pending = deferred();
    feedbackAPI.submit.mockReturnValueOnce(pending.promise);
    const { rerender } = render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Helpful' }));
    await waitFor(() => expect(feedbackAPI.submit).toHaveBeenCalledTimes(1));
    rerender(<Harness session="session-b" />);
    await act(async () => completion === 'resolve' ? pending.resolve({ data: {} }) : pending.reject(new Error('late failure')));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Helpful' })).not.toBeDisabled();
  });
});
