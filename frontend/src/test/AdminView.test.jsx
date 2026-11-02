import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import AdminView from '../components/AdminView';
import Sidebar from '../components/Sidebar';
import { adminAPI } from '../services/api';

vi.mock('../services/api', () => ({ adminAPI: { getQuestions: vi.fn(), createQuestion: vi.fn(), updateQuestionStatus: vi.fn(), createResource: vi.fn(), getFeedback: vi.fn() } }));
const topics = [{ id: 1, name: 'Networks' }];
const admin = { id: 1, role: 'admin' };
const question = { id: 7, topic_id: 1, question_text: 'What is TCP?', difficulty: 2, status: 'draft' };
const deferred = () => { let resolve; let reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const renderAdmin = (props = {}) => render(<AdminView user={admin} token="token-a" topics={topics} {...props} />);
const change = (label, value, scope = screen) => fireEvent.change(scope.getByLabelText(label), { target: { value } });
function fillQuestion(overrides = {}) {
  const form = within(screen.getByRole('form', { name: 'Add question' }));
  change('Topic', '1', form); change('Question text', overrides.text ?? 'Question?', form);
  change('Options (one per line)', overrides.options ?? 'Yes\nNo', form);
  change('Correct answer', overrides.answer ?? 'Yes', form);
}
function fillResource(url = 'https://example.com/article') {
  const form = within(screen.getByRole('form', { name: 'Add resource' }));
  change('Topic', '1', form); change('Title', 'TCP guide', form); change('URL', url, form);
}
beforeEach(() => {
  vi.clearAllMocks();
  adminAPI.getQuestions.mockResolvedValue({ data: [question] });
  adminAPI.getFeedback.mockResolvedValue({ data: [] });
  adminAPI.createQuestion.mockResolvedValue({ data: { ...question, id: 8 } });
  adminAPI.updateQuestionStatus.mockResolvedValue({ data: { ...question, status: 'published' } });
  adminAPI.createResource.mockResolvedValue({ data: { id: 9, title: 'TCP guide' } });
});

describe('Admin access and tabs', () => {
  it.each([null, { role: 'student' }, { role: 'Admin' }])('hides admin navigation for non-admin %s', (user) => {
    render(<Sidebar user={user} activeNav="Dashboard" setActiveNav={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /^Admin$/ })).not.toBeInTheDocument();
  });
  it('shows admin navigation and navigates for admin', () => {
    const navigate = vi.fn(); render(<Sidebar user={admin} activeNav="Dashboard" setActiveNav={navigate} />);
    fireEvent.click(screen.getByRole('button', { name: /^Admin$/ })); expect(navigate).toHaveBeenCalledWith('Admin');
  });
  it('guards the view and makes no calls for students or missing token', () => {
    const view = renderAdmin({ user: { role: 'student' } });
    expect(screen.getByRole('alert')).toHaveTextContent('Administrator access');
    view.rerender(<AdminView user={admin} token="" topics={topics} />);
    expect(adminAPI.getQuestions).not.toHaveBeenCalled(); expect(adminAPI.getFeedback).not.toHaveBeenCalled();
  });
  it('renders exact tabs, defaults to drafts, and supports keyboard navigation', async () => {
    renderAdmin();
    expect(screen.getAllByRole('tab').map((item) => item.textContent)).toEqual(['Questions', 'Resources', 'Feedback']);
    await screen.findByText('What is TCP?');
    expect(adminAPI.getQuestions).toHaveBeenCalledWith({ status: 'draft', skip: 0, limit: 25 }, 'token-a', expect.any(AbortSignal));
    expect(adminAPI.getFeedback).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Questions' }), { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Resources' })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('Resources');
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Resources' }), { key: 'End' });
    expect(screen.getByRole('tab', { name: 'Feedback' })).toHaveFocus();
    await waitFor(() => expect(adminAPI.getFeedback).toHaveBeenCalled());
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Feedback' }), { key: 'Home' });
    expect(screen.getByRole('tab', { name: 'Questions' })).toHaveFocus();
    await screen.findByText('What is TCP?');
  });
});
describe('Question moderation', () => {
  it('sends exact Publish and Archive payloads and prevents duplicate clicks', async () => {
    const request = deferred(); adminAPI.updateQuestionStatus.mockReturnValueOnce(request.promise);
    renderAdmin(); const publish = await screen.findByRole('button', { name: 'Publish question 7' });
    fireEvent.click(publish); fireEvent.click(publish);
    expect(adminAPI.updateQuestionStatus).toHaveBeenCalledTimes(1);
    expect(adminAPI.updateQuestionStatus).toHaveBeenCalledWith(7, 'published', 'token-a', expect.any(AbortSignal));
    await act(async () => request.resolve({ data: { ...question, status: 'published' } }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Archive question 7' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Archive question 7' }));
    await waitFor(() => expect(adminAPI.updateQuestionStatus).toHaveBeenLastCalledWith(7, 'archived', 'token-a', expect.any(AbortSignal)));
  });
  it('validates unique options and correct answer before adding a draft', async () => {
    renderAdmin(); await screen.findByText('What is TCP?');
    fillQuestion({ options: 'Yes\nYes' }); fireEvent.submit(screen.getByRole('form', { name: 'Add question' }));
    expect(adminAPI.createQuestion).not.toHaveBeenCalled(); expect(screen.getByRole('alert')).toHaveTextContent('unique options');
    fillQuestion(); fireEvent.submit(screen.getByRole('form', { name: 'Add question' }));
    await screen.findByText('Question saved as a draft.');
    expect(adminAPI.createQuestion).toHaveBeenCalledWith({ topic_id: 1, question_text: 'Question?', options: ['Yes', 'No'], correct_answer: 'Yes', difficulty: 1, explanation: null, status: 'draft' }, 'token-a', expect.any(AbortSignal));
  });
  it('retains form on 422 and permits a corrected retry', async () => {
    adminAPI.createQuestion.mockRejectedValueOnce({ response: { status: 422 } });
    renderAdmin(); fillQuestion(); fireEvent.submit(screen.getByRole('form', { name: 'Add question' }));
    await screen.findByText('The server rejected these values. Check the form and try again.');
    expect(screen.getByLabelText('Question text')).toHaveValue('Question?');
    fireEvent.submit(screen.getByRole('form', { name: 'Add question' })); await screen.findByText('Question saved as a draft.');
  });
  it('blocks ambiguous create retry even after changing tabs', async () => {
    adminAPI.createQuestion.mockRejectedValueOnce(new Error('timeout'));
    renderAdmin(); fillQuestion(); fireEvent.submit(screen.getByRole('form', { name: 'Add question' }));
    await screen.findByText(/The result could not be confirmed/);
    fireEvent.click(screen.getByRole('tab', { name: 'Resources' })); fireEvent.click(screen.getByRole('tab', { name: 'Questions' }));
    expect(screen.getByRole('button', { name: 'Save draft question' })).toBeDisabled();
    fireEvent.submit(screen.getByRole('form', { name: 'Add question' })); expect(adminAPI.createQuestion).toHaveBeenCalledTimes(1);
    await screen.findByText('What is TCP?');
  });
  it('shows loading/empty/forbidden states and allows read retry', async () => {
    const request = deferred(); adminAPI.getQuestions.mockReturnValueOnce(request.promise);
    renderAdmin(); expect(screen.getByText('Loading questions…')).toBeInTheDocument();
    await act(async () => request.reject({ response: { status: 403 } }));
    expect(screen.getByRole('alert')).toHaveTextContent('Administrator access');
    adminAPI.getQuestions.mockResolvedValueOnce({ data: [] }); fireEvent.click(screen.getByRole('button', { name: 'Refresh list' }));
    await screen.findByText('No questions found.');
  });
  it('paginates and resets page on status filter change', async () => {
    adminAPI.getQuestions.mockResolvedValue({ data: Array.from({ length: 25 }, (_, i) => ({ ...question, id: i + 1 })) });
    renderAdmin(); await screen.findByRole('button', { name: 'Publish question 25' });
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await waitFor(() => expect(adminAPI.getQuestions).toHaveBeenLastCalledWith({ status: 'draft', skip: 25, limit: 25 }, 'token-a', expect.any(AbortSignal)));
    change('Question status', 'archived');
    await waitFor(() => expect(adminAPI.getQuestions).toHaveBeenLastCalledWith({ status: 'archived', skip: 0, limit: 25 }, 'token-a', expect.any(AbortSignal)));
  });
  it('does not display a stale list response after filter change', async () => {
    const old = deferred(); adminAPI.getQuestions.mockReturnValueOnce(old.promise).mockResolvedValueOnce({ data: [] });
    renderAdmin(); change('Question status', 'published'); await screen.findByText('No questions found.');
    await act(async () => old.resolve({ data: [question] })); expect(screen.queryByText('What is TCP?')).not.toBeInTheDocument();
  });
});
describe('Resources and feedback', () => {
  it('states missing endpoints honestly and adds a resource with validated payload', async () => {
    renderAdmin(); fireEvent.click(screen.getByRole('tab', { name: 'Resources' }));
    expect(screen.getByRole('note')).toHaveTextContent('not available yet');
    fillResource('javascript:alert(1)'); fireEvent.submit(screen.getByRole('form', { name: 'Add resource' }));
    expect(adminAPI.createResource).not.toHaveBeenCalled(); expect(screen.getByRole('alert')).toHaveTextContent('HTTP(S)');
    fillResource(); fireEvent.submit(screen.getByRole('form', { name: 'Add resource' }));
    await screen.findByText('Resource created.');
    expect(adminAPI.createResource).toHaveBeenCalledWith({ topic_id: 1, title: 'TCP guide', resource_type: 'article', url: 'https://example.com/article', difficulty: 1, estimated_minutes: 15, summary: null }, 'token-a', expect.any(AbortSignal));
    expect(screen.getByRole('region', { name: 'Resources added this visit' })).toHaveTextContent('TCP guide');
  });
  it('disables creation when topics are unavailable', async () => {
    renderAdmin({ topics: [] }); expect(screen.getByRole('button', { name: 'Save draft question' })).toBeDisabled();
    fireEvent.click(screen.getByRole('tab', { name: 'Resources' })); expect(screen.getByRole('button', { name: 'Save resource' })).toBeDisabled();
  });
  it('shows read-only feedback with literal comments, zero ratings and filtering', async () => {
    adminAPI.getFeedback.mockResolvedValue({ data: [{ id: 3, user_id: 99, feedback_type: 'bug', target_id: 2, rating: 0, comment: '<script>bad()</script>', created_at: '2026-11-02' }] });
    renderAdmin(); fireEvent.click(screen.getByRole('tab', { name: 'Feedback' }));
    await screen.findByText('<script>bad()</script>');
    expect(screen.getByRole('table')).toHaveTextContent('0'); expect(document.querySelector('script')).toBeNull();
    change('Feedback type', 'bug');
    await waitFor(() => expect(adminAPI.getFeedback).toHaveBeenLastCalledWith({ feedback_type: 'bug', skip: 0, limit: 25 }, 'token-a', expect.any(AbortSignal)));
  });
  it('does not leak old admin results into a new login', async () => {
    const old = deferred(); adminAPI.getFeedback.mockReturnValueOnce(old.promise);
    const view = renderAdmin(); fireEvent.click(screen.getByRole('tab', { name: 'Feedback' }));
    view.rerender(<AdminView user={{ id: 2, role: 'student' }} token="token-b" topics={topics} />);
    await act(async () => old.resolve({ data: [{ id: 1, comment: 'Private report' }] }));
    expect(screen.queryByText('Private report')).not.toBeInTheDocument(); expect(screen.getByRole('alert')).toHaveTextContent('Administrator access');
  });
  it('aborts in-flight creation on logout and does not show its success', async () => {
    const pending = deferred(); adminAPI.createResource.mockReturnValueOnce(pending.promise);
    const view = renderAdmin(); fireEvent.click(screen.getByRole('tab', { name: 'Resources' })); fillResource(); fireEvent.submit(screen.getByRole('form', { name: 'Add resource' }));
    const signal = adminAPI.createResource.mock.calls[0][2];
    view.rerender(<AdminView user={null} token="" topics={topics} />); expect(signal.aborted).toBe(true);
    await act(async () => pending.resolve({ data: { id: 1, title: 'Private resource' } })); expect(screen.queryByText('Resource created.')).not.toBeInTheDocument();
  });
});
