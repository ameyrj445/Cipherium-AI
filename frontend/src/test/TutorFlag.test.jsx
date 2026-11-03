import React from 'react';
import { act, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TutorFeedback from '../components/TutorFeedback';
import { TUTOR_FLAG_COMMENT_MAX_LENGTH, tutorFlagKey, useTutorFeedback } from '../hooks/useTutorFeedback';
import { feedbackAPI } from '../services/api';

vi.mock('../services/api', () => ({ feedbackAPI: { getMyFeedback: vi.fn(), submit: vi.fn() } }));

const answer = { id: 42, role: 'assistant', text: 'A fictional saved tutor answer.' };
const comment = 'The second step uses the wrong sign.';
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

// This hook has the same lifetime as App; only the answer view changes tabs.
function Harness({ session = 'session-a', message = answer, visible = true }) {
  const feedback = useTutorFeedback(session);
  return <>
    <button type="button">Outside the answer</button>
    {visible && <TutorFeedback message={message} feedback={feedback} />}
  </>;
}

function openReport() {
  const trigger = screen.getByRole('button', { name: /^(Flag incorrect answer|View report status)$/ });
  trigger.focus();
  fireEvent.click(trigger);
  return screen.getByRole('dialog', { name: 'Flag incorrect answer' });
}

function enterComment(value = comment) {
  fireEvent.change(screen.getByRole('textbox', { name: 'What is incorrect?' }), { target: { value } });
}

function submitReport(value = comment) {
  const dialog = openReport();
  enterComment(value);
  fireEvent.click(within(dialog).getByRole('button', { name: 'Submit report' }));
  return dialog;
}

beforeEach(() => {
  vi.resetAllMocks();
  feedbackAPI.getMyFeedback.mockResolvedValue({ data: [] });
  feedbackAPI.submit.mockResolvedValue({ data: { id: 901, feedback_type: 'bug' } });
});

describe('Incorrect-answer report eligibility and payload', () => {
  it.each([
    { role: 'user' }, { streaming: true }, { isCustomCard: true }, { error: true },
    { text: '' }, { text: '  \n' },
  ])('does not offer reporting for an ineligible answer %j', (extra) => {
    render(<Harness message={{ ...answer, ...extra }} />);
    expect(screen.queryByRole('button', { name: 'Flag incorrect answer' })).not.toBeInTheDocument();
    expect(feedbackAPI.submit).not.toHaveBeenCalled();
  });

  it.each([undefined, null, 0, -1, 1.5, '42', Number.MAX_SAFE_INTEGER + 1])('allows a fresh completed answer with no usable saved ID (%s), without enabling ratings', async (id) => {
    const message = { ...answer, id };
    render(<Harness message={message} />);
    expect(screen.queryByRole('button', { name: 'Helpful' })).not.toBeInTheDocument();
    expect(screen.getByText(/no saved message ID/)).toBeInTheDocument();
    submitReport();
    await waitFor(() => expect(feedbackAPI.submit).toHaveBeenCalledExactlyOnceWith({ feedback_type: 'bug', comment }, 'session-a'));
  });

  it('sends only a trimmed bug comment with the owning session, never a fabricated target', async () => {
    render(<Harness />);
    submitReport(`  ${comment}\n\t`);
    await waitFor(() => expect(feedbackAPI.submit).toHaveBeenCalledTimes(1));
    expect(feedbackAPI.submit).toHaveBeenCalledExactlyOnceWith({ feedback_type: 'bug', comment }, 'session-a');
    expect(feedbackAPI.submit.mock.calls[0][0]).not.toHaveProperty('target_id');
    expect(feedbackAPI.submit.mock.calls[0][0]).not.toHaveProperty('rating');
    expect(feedbackAPI.getMyFeedback).not.toHaveBeenCalled();
    await waitFor(() => expect(within(screen.getByRole('dialog')).getByRole('status')).toHaveTextContent('Report submitted. Thank you!'));
  });

  it('does not auto-send answer text, IDs, or any report when the dialog is opened and cancelled', () => {
    render(<Harness />);
    const dialog = openReport();
    expect(within(dialog).getByRole('textbox', { name: 'What is incorrect?' })).toHaveValue('');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(feedbackAPI.submit).not.toHaveBeenCalled();
    expect(feedbackAPI.getMyFeedback).not.toHaveBeenCalled();
  });

  it('keeps thumbs ratings and bug reports independent for the same saved answer', async () => {
    const { result } = renderHook(() => useTutorFeedback('session-a'));
    await act(async () => { await result.current.submit(answer, 1); });
    await act(async () => { await result.current.submitFlag(answer, comment); });
    expect(feedbackAPI.submit).toHaveBeenNthCalledWith(1, { feedback_type: 'tutor_rating', target_id: 42, rating: 1 }, 'session-a');
    expect(feedbackAPI.submit).toHaveBeenNthCalledWith(2, { feedback_type: 'bug', comment }, 'session-a');
    expect(result.current.entries.get(42)).toMatchObject({ status: 'success', rating: 1 });
    expect(result.current.flagEntries.get(42)).toMatchObject({ status: 'success' });
  });
});

describe('Report comment validation', () => {
  it.each(['', '   ', '\n\t '])('rejects blank comments without a network call (%j)', async (value) => {
    render(<Harness />);
    const dialog = openReport();
    enterComment(value);
    fireEvent.submit(within(dialog).getByRole('button', { name: 'Submit report' }).closest('form'));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/describe|explain|comment|required|incorrect/i);
    expect(feedbackAPI.submit).not.toHaveBeenCalled();
  });

  it('rejects an over-limit programmatic value without silently truncating or sending it', async () => {
    expect(TUTOR_FLAG_COMMENT_MAX_LENGTH).toBe(2000);
    render(<Harness />);
    const dialog = openReport();
    const value = 'x'.repeat(TUTOR_FLAG_COMMENT_MAX_LENGTH + 1);
    enterComment(value);
    expect(within(dialog).getByRole('textbox', { name: 'What is incorrect?' })).toHaveValue(value);
    fireEvent.submit(within(dialog).getByRole('button', { name: 'Submit report' }).closest('form'));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/2,?000|too long|characters/i);
    expect(feedbackAPI.submit).not.toHaveBeenCalled();
  });

  it('accepts the maximum-length comment intact', async () => {
    const value = 'x'.repeat(TUTOR_FLAG_COMMENT_MAX_LENGTH);
    render(<Harness />);
    submitReport(value);
    await waitFor(() => expect(feedbackAPI.submit).toHaveBeenCalledExactlyOnceWith({ feedback_type: 'bug', comment: value }, 'session-a'));
  });

  it.each([undefined, null, 42, {}, '', ' \n ', 'x'.repeat(2001)])('also validates direct hook calls (%j)', async (value) => {
    const { result } = renderHook(() => useTutorFeedback('session-a'));
    await act(async () => { await result.current.submitFlag(answer, value); });
    expect(feedbackAPI.submit).not.toHaveBeenCalled();
    expect(feedbackAPI.getMyFeedback).not.toHaveBeenCalled();
  });
});

describe('Report dialog accessibility and dismissal', () => {
  it('labels the modal and comment, puts focus in the comment field, and traps both Tab boundaries', () => {
    render(<Harness />);
    const dialog = openReport();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    const textbox = within(dialog).getByRole('textbox', { name: 'What is incorrect?' });
    expect(textbox).toHaveFocus();
    const controls = Array.from(dialog.querySelectorAll('button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex="0"]'));
    expect(controls.length).toBeGreaterThan(1);
    const first = controls[0];
    const last = controls[controls.length - 1];
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(first).toHaveFocus();
    first.focus();
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });

  it('keeps background controls out of the modal and restores background accessibility on dismissal', () => {
    const { container } = render(<Harness />);
    const outside = screen.getByRole('button', { name: 'Outside the answer' });
    const previousOverflow = document.body.style.overflow;
    const dialog = openReport();
    expect(container).toHaveAttribute('inert');
    expect(container).toHaveAttribute('aria-hidden', 'true');
    expect(document.body.style.overflow).toBe('hidden');
    outside.focus();
    expect(within(dialog).getByRole('textbox')).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(container).not.toHaveAttribute('inert');
    expect(container).not.toHaveAttribute('aria-hidden');
    expect(document.body.style.overflow).toBe(previousOverflow);
    expect(screen.getByRole('button', { name: 'Outside the answer' })).toBeInTheDocument();
  });

  it.each(['Escape', 'Cancel', 'Close report dialog'])('dismisses with %s and restores focus without sending', (method) => {
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Flag incorrect answer' });
    const dialog = openReport();
    enterComment();
    if (method === 'Escape') fireEvent.keyDown(within(dialog).getByRole('textbox'), { key: 'Escape' });
    else fireEvent.click(within(dialog).getByRole('button', { name: method }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(feedbackAPI.submit).not.toHaveBeenCalled();
  });

  it('closes an open draft when the answer changes and never attaches it to the replacement answer', () => {
    const { rerender } = render(<Harness />);
    openReport();
    enterComment('Private draft about answer A');
    rerender(<Harness message={{ ...answer, id: 77, text: 'Replacement answer' }} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const dialog = openReport();
    expect(within(dialog).getByRole('textbox')).toHaveValue('');
    expect(feedbackAPI.submit).not.toHaveBeenCalled();
  });

  it('closes the draft when one fresh answer is replaced by another with the same missing ID', () => {
    const freshA = { role: 'assistant', text: 'Fresh answer A' };
    const freshB = { role: 'assistant', text: 'Fresh answer B' };
    const { rerender } = render(<Harness message={freshA} />);
    openReport();
    enterComment('Draft only about fresh answer A');
    rerender(<Harness message={freshB} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const dialog = openReport();
    expect(within(dialog).getByRole('textbox')).toHaveValue('');
    expect(feedbackAPI.submit).not.toHaveBeenCalled();
  });

  it('closes and clears a draft immediately on session replacement', () => {
    const { rerender } = render(<Harness />);
    openReport();
    enterComment('Account A private draft');
    rerender(<Harness session="session-b" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const dialog = openReport();
    expect(within(dialog).getByRole('textbox')).toHaveValue('');
    expect(feedbackAPI.submit).not.toHaveBeenCalled();
  });
});

describe('Report deduplication and view remounts', () => {
  it('prevents immediate double clicks while a request is pending', async () => {
    const pending = deferred();
    feedbackAPI.submit.mockReturnValueOnce(pending.promise);
    render(<Harness />);
    const dialog = openReport();
    enterComment();
    const submit = within(dialog).getByRole('button', { name: 'Submit report' });
    fireEvent.click(submit);
    fireEvent.click(submit);
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(1);
    expect(dialog.querySelector('button[type="submit"]:not(:disabled)')).not.toBeInTheDocument();
    await act(async () => pending.resolve({ data: {} }));
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(1);
  });

  it('keeps the in-flight operation locked when the view unmounts and remounts before completion', async () => {
    const pending = deferred();
    feedbackAPI.submit.mockReturnValueOnce(pending.promise);
    const { rerender } = render(<Harness />);
    submitReport();
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(1);
    rerender(<Harness visible={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(<Harness />);
    const dialog = openReport();
    expect(within(dialog).getByRole('status')).toHaveTextContent(/sending|submitting|saving/i);
    expect(dialog.querySelector('button[type="submit"]:not(:disabled)')).not.toBeInTheDocument();
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve({ data: {} }));
    expect(within(dialog).getByRole('status')).toHaveTextContent(/saved|submitted|thank you/i);
  });

  it.each([
    ['a saved-ID replacement', { id: 731, role: 'assistant', text: 'Fresh answer now loaded from history' }],
    ['a different fresh answer', { role: 'assistant', text: 'Another completed answer' }],
  ])('keeps a fresh report pending when switching to %s', async (_label, replacement) => {
    const fresh = { role: 'assistant', text: 'Fresh answer before history reload' };
    const pending = deferred();
    feedbackAPI.submit.mockReturnValueOnce(pending.promise);
    const { rerender } = render(<Harness message={fresh} />);
    submitReport();
    rerender(<Harness message={replacement} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const dialog = openReport();
    expect(within(dialog).getByRole('status')).toHaveTextContent('Sending report');
    expect(dialog.querySelector('button[type="submit"]:not(:disabled)')).not.toBeInTheDocument();
    fireEvent.submit(dialog.querySelector('form'));
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve({ data: {} }));
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(1);
  });

  it('guards direct cross-answer requests while pending and releases the guard after a known rejection', async () => {
    const fresh = { role: 'assistant', text: 'A fresh answer' };
    const pending = deferred();
    feedbackAPI.submit.mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useTutorFeedback('session-a'));
    let request;
    act(() => {
      request = result.current.submitFlag(fresh, comment);
      result.current.submitFlag({ ...fresh, id: 731 }, comment);
      result.current.submitFlag(answer, 'Another report');
    });
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(1);
    await act(async () => { pending.reject({ response: { status: 422 } }); await request; });
    await act(async () => { await result.current.submitFlag(answer, 'Another report'); });
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(2);
    expect(feedbackAPI.submit).toHaveBeenLastCalledWith({ feedback_type: 'bug', comment: 'Another report' }, 'session-a');
  });

  it('preserves a successful report after view unmount and never offers to send it again', async () => {
    const { rerender } = render(<Harness />);
    submitReport();
    await waitFor(() => expect(screen.getByRole('dialog')).toHaveTextContent(/saved|submitted|thank you/i));
    rerender(<Harness visible={false} />);
    rerender(<Harness />);
    const dialog = openReport();
    expect(within(dialog).getByRole('status')).toHaveTextContent(/saved|submitted|thank you/i);
    expect(dialog.querySelector('button[type="submit"]:not(:disabled)')).not.toBeInTheDocument();
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(1);
  });

  it('allows Escape while pending, restores focus, and reopens without sending again', async () => {
    const pending = deferred();
    feedbackAPI.submit.mockReturnValueOnce(pending.promise);
    render(<Harness />);
    const dialog = submitReport();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View report status' })).toHaveFocus();
    openReport();
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve({ data: {} }));
  });

  it('guards duplicate direct hook calls synchronously, before rerender and after success', async () => {
    const pending = deferred();
    feedbackAPI.submit.mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useTutorFeedback('session-a'));
    let first;
    act(() => {
      first = result.current.submitFlag(answer, comment);
      result.current.submitFlag(answer, 'A duplicate click');
    });
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(1);
    expect(result.current.flagEntries.get(42)).toMatchObject({ status: 'pending' });
    await act(async () => { pending.resolve({ data: {} }); await first; });
    await act(async () => { await result.current.submitFlag(answer, comment); });
    expect(result.current.flagEntries.get(42)).toMatchObject({ status: 'success' });
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(1);
  });

  it('remains usable without duplicate sending under StrictMode', async () => {
    render(<React.StrictMode><Harness /></React.StrictMode>);
    submitReport();
    await waitFor(() => expect(screen.getByRole('dialog')).toHaveTextContent(/saved|submitted|thank you/i));
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(1);
  });
});

describe('Report rejection and ambiguous delivery', () => {
  it.each([400, 401, 403, 422, 429])('permits an explicit retry after a definitive HTTP %s rejection', async (status) => {
    feedbackAPI.submit.mockRejectedValueOnce({ response: { status } });
    render(<Harness />);
    const dialog = submitReport();
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/not accepted|rejected|try again/i);
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(1);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Retry report' }));
    await waitFor(() => expect(within(dialog).getByRole('status')).toHaveTextContent(/saved|submitted|thank you/i));
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(2);
    expect(feedbackAPI.submit).toHaveBeenNthCalledWith(2, { feedback_type: 'bug', comment }, 'session-a');
    expect(feedbackAPI.getMyFeedback).not.toHaveBeenCalled();
  });

  it.each([undefined, 408, 500, 503])('never resends after ambiguous failure %s, including reopening and remounting', async (status) => {
    feedbackAPI.submit.mockRejectedValueOnce(status ? { response: { status } } : new Error('Connection lost'));
    const { rerender } = render(<Harness />);
    let dialog = submitReport();
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/confirm|may have|uncertain/i);
    expect(dialog.querySelector('button[type="submit"]:not(:disabled)')).not.toBeInTheDocument();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    dialog = openReport();
    expect(within(dialog).getByRole('alert')).toHaveTextContent(/confirm|may have|uncertain/i);
    rerender(<Harness visible={false} />);
    rerender(<Harness />);
    dialog = openReport();
    expect(within(dialog).getByRole('alert')).toHaveTextContent(/confirm|may have|uncertain/i);
    expect(dialog.querySelector('button[type="submit"]:not(:disabled)')).not.toBeInTheDocument();
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(1);
    expect(feedbackAPI.getMyFeedback).not.toHaveBeenCalled();
  });

  it('blocks another answer after an ambiguous POST because unlinked bug feedback cannot be verified', async () => {
    feedbackAPI.submit.mockRejectedValueOnce(new Error('Network failure after POST'));
    const { rerender } = render(<Harness />);
    const firstDialog = submitReport();
    await within(firstDialog).findByRole('alert');
    rerender(<Harness message={{ role: 'assistant', text: 'Another fresh answer' }} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const dialog = openReport();
    expect(within(dialog).getByRole('alert')).toHaveTextContent(/confirm|may have|uncertain/i);
    expect(dialog.querySelector('button[type="submit"]:not(:disabled)')).not.toBeInTheDocument();
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(1);
    expect(feedbackAPI.getMyFeedback).not.toHaveBeenCalled();
  });

  it('replaces an earlier retryable error with the global uncertain state after another answer has ambiguous delivery', async () => {
    const other = { role: 'assistant', text: 'Second completed answer' };
    feedbackAPI.submit.mockRejectedValueOnce({ response: { status: 422 } })
      .mockRejectedValueOnce(new Error('Second report outcome unknown'));
    const { rerender } = render(<Harness />);
    const firstDialog = submitReport('First report was definitely rejected');
    await within(firstDialog).findByRole('alert');
    expect(within(firstDialog).getByRole('button', { name: 'Retry report' })).toBeEnabled();
    rerender(<Harness message={other} />);
    const secondDialog = submitReport('Second report has unknown delivery');
    expect(await within(secondDialog).findByRole('alert')).toHaveTextContent(/confirm|may have|uncertain/i);
    rerender(<Harness />);
    const reopened = openReport();
    expect(within(reopened).getByRole('alert')).toHaveTextContent(/confirm|may have|uncertain/i);
    expect(reopened.querySelector('button[type="submit"]:not(:disabled)')).not.toBeInTheDocument();
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(2);
    expect(feedbackAPI.getMyFeedback).not.toHaveBeenCalled();
  });

  it('restores only the rejected answer own comment after another pending report succeeds', async () => {
    const other = { role: 'assistant', text: 'Answer B' };
    const pendingB = deferred();
    feedbackAPI.submit.mockRejectedValueOnce({ response: { status: 422 } })
      .mockReturnValueOnce(pendingB.promise);
    const { rerender } = render(<Harness />);
    const firstDialog = submitReport('A details');
    await within(firstDialog).findByRole('alert');
    rerender(<Harness message={other} />);
    submitReport('B details');
    rerender(<Harness />);
    const reopened = openReport();
    const textbox = within(reopened).getByRole('textbox', { name: 'What is incorrect?' });
    expect(textbox).toHaveAttribute('readonly');
    expect(textbox).toHaveValue('B details');
    await act(async () => pendingB.resolve({ data: {} }));
    expect(textbox).not.toHaveAttribute('readonly');
    expect(textbox).toHaveValue('A details');
    fireEvent.click(within(reopened).getByRole('button', { name: 'Retry report' }));
    await waitFor(() => expect(within(reopened).getByRole('status')).toHaveTextContent('Report submitted'));
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(3);
    expect(feedbackAPI.submit).toHaveBeenNthCalledWith(3, { feedback_type: 'bug', comment: 'A details' }, 'session-a');
  });

  it('starts an untouched answer with an empty draft after another pending report succeeds', async () => {
    const other = { role: 'assistant', text: 'Untouched fresh answer B' };
    const pendingA = deferred();
    feedbackAPI.submit.mockReturnValueOnce(pendingA.promise);
    const { rerender } = render(<Harness />);
    submitReport('A details');
    rerender(<Harness message={other} />);
    const dialog = openReport();
    const textbox = within(dialog).getByRole('textbox', { name: 'What is incorrect?' });
    expect(textbox).toHaveAttribute('readonly');
    expect(textbox).toHaveValue('A details');
    await act(async () => pendingA.resolve({ data: {} }));
    expect(textbox).not.toHaveAttribute('readonly');
    expect(textbox).toHaveValue('');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Submit report' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('Describe what is incorrect');
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(1);
    enterComment('B details');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Submit report' }));
    await waitFor(() => expect(within(dialog).getByRole('status')).toHaveTextContent('Report submitted'));
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(2);
    expect(feedbackAPI.submit).toHaveBeenNthCalledWith(2, { feedback_type: 'bug', comment: 'B details' }, 'session-a');
  });

  it('guards a fresh answer with local identity without including that identity in the request', async () => {
    const fresh = { role: 'assistant', text: 'Completed answer without a server ID' };
    const { result } = renderHook(() => useTutorFeedback('session-a'));
    await act(async () => { await result.current.submitFlag(fresh, comment); });
    expect(result.current.flagEntries.get(tutorFlagKey(fresh))).toMatchObject({ status: 'success' });
    await act(async () => { await result.current.submitFlag(fresh, 'Duplicate'); });
    expect(feedbackAPI.submit).toHaveBeenCalledExactlyOnceWith({ feedback_type: 'bug', comment }, 'session-a');
  });

  it('locks ambiguous direct submissions even when a caller changes the comment', async () => {
    feedbackAPI.submit.mockRejectedValueOnce(new Error('Network failure after POST'));
    const { result } = renderHook(() => useTutorFeedback('session-a'));
    await act(async () => { await result.current.submitFlag(answer, comment); });
    expect(result.current.flagEntries.get(42)).toMatchObject({ status: 'error', uncertain: true });
    await act(async () => { await result.current.submitFlag(answer, 'Edited report'); });
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(1);
    expect(feedbackAPI.getMyFeedback).not.toHaveBeenCalled();
  });
});

describe('Report session isolation', () => {
  it('does not send a report without an authenticated session', async () => {
    const { result } = renderHook(() => useTutorFeedback(''));
    await act(async () => { await result.current.submitFlag(answer, comment); });
    expect(feedbackAPI.submit).not.toHaveBeenCalled();
    expect(feedbackAPI.getMyFeedback).not.toHaveBeenCalled();
  });

  it.each([{ role: 'user' }, { streaming: true }, { error: true }, { isCustomCard: true }, { text: '' }])('guards ineligible direct calls %j', async (extra) => {
    const { result } = renderHook(() => useTutorFeedback('session-a'));
    await act(async () => { await result.current.submitFlag({ ...answer, ...extra }, comment); });
    expect(feedbackAPI.submit).not.toHaveBeenCalled();
  });

  it.each(['resolve', 'reject'])('ignores late POST %s after session replacement while the new session can report', async (completion) => {
    const old = deferred();
    feedbackAPI.submit.mockReturnValueOnce(old.promise);
    const { result, rerender } = renderHook(({ session }) => useTutorFeedback(session), { initialProps: { session: 'session-a' } });
    let oldRequest;
    act(() => { oldRequest = result.current.submitFlag(answer, 'Account A report'); });
    expect(result.current.flagEntries.get(42)).toMatchObject({ status: 'pending' });
    rerender({ session: 'session-b' });
    expect(result.current.flagEntries.size).toBe(0);
    await act(async () => {
      if (completion === 'resolve') old.resolve({ data: { id: 901 } });
      else old.reject(new Error('Old session failure'));
      await oldRequest;
    });
    expect(result.current.flagEntries.size).toBe(0);
    await act(async () => { await result.current.submitFlag(answer, 'Account B report'); });
    expect(feedbackAPI.submit).toHaveBeenLastCalledWith({ feedback_type: 'bug', comment: 'Account B report' }, 'session-b');
    expect(result.current.flagEntries.get(42)).toMatchObject({ status: 'success' });
  });

  it('does not let an old completion clear the new session pending guard', async () => {
    const old = deferred();
    const current = deferred();
    feedbackAPI.submit.mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
    const { result, rerender } = renderHook(({ session }) => useTutorFeedback(session), { initialProps: { session: 'session-a' } });
    let oldRequest, newRequest;
    act(() => { oldRequest = result.current.submitFlag(answer, 'Old session report'); });
    rerender({ session: 'session-b' });
    act(() => { newRequest = result.current.submitFlag(answer, 'New session report'); });
    await act(async () => { old.resolve({ data: {} }); await oldRequest; });
    await act(async () => { await result.current.submitFlag({ ...answer, id: 99 }, 'Duplicate while pending'); });
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(2);
    expect(result.current.flagEntries.get(42)).toMatchObject({ status: 'pending', comment: 'New session report' });
    await act(async () => { current.resolve({ data: {} }); await newRequest; });
    expect(result.current.flagEntries.get(42)).toMatchObject({ status: 'success', comment: 'New session report' });
  });

  it.each(['resolve', 'reject'])('never displays an old report result after an open modal changes session (%s)', async (completion) => {
    const old = deferred();
    feedbackAPI.submit.mockReturnValueOnce(old.promise);
    const { rerender } = render(<Harness />);
    submitReport('Account A private report');
    rerender(<Harness session="session-b" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await act(async () => {
      if (completion === 'resolve') old.resolve({ data: {} });
      else old.reject(new Error('Old account failure'));
    });
    expect(screen.queryByText('Account A private report')).not.toBeInTheDocument();
    expect(screen.queryByText('Report submitted. Thank you!')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    const dialog = openReport();
    expect(within(dialog).getByRole('textbox')).toHaveValue('');
    expect(within(dialog).getByRole('button', { name: 'Submit report' })).toBeEnabled();
    expect(feedbackAPI.submit).toHaveBeenCalledTimes(1);
  });

  it('refuses stale callbacks from a replaced session or an unmounted owner', async () => {
    const { result, rerender, unmount } = renderHook(({ session }) => useTutorFeedback(session), { initialProps: { session: 'session-a' } });
    const staleSubmit = result.current.submitFlag;
    rerender({ session: 'session-b' });
    await act(async () => { await staleSubmit(answer, comment); });
    const unmountedSubmit = result.current.submitFlag;
    unmount();
    await act(async () => { await unmountedSubmit(answer, comment); });
    expect(feedbackAPI.submit).not.toHaveBeenCalled();
  });
});
