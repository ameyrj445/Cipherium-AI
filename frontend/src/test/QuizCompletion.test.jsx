import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import PracticeView from '../components/PracticeView';
import api, { quizAPI } from '../services/api';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const question = { id: 1, question_text: 'Choose a value', options: ['One', 'Two'] };
describe('adaptive completion controls', () => {
  it('announces pending-save failure and retries completion while locking choices', () => {
    const submit = vi.fn(); const choose = vi.fn();
    render(<PracticeView currentQuestion={question} selectedOption="One" setSelectedOption={choose}
      quizPendingSave quizSubmissionBlocked quizError="Answer recorded; retry saving."
      handleSubmitQuiz={submit} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Answer recorded');
    expect(screen.getByRole('button', { name: 'Submit Response' })).toBeDisabled();
    fireEvent.click(screen.getByText('Two').closest('[role="button"]'));
    expect(choose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Retry saving result' }));
    expect(submit).toHaveBeenCalledOnce();
  });
  it('does not offer retry for an unknown answer outcome', () => {
    render(<PracticeView currentQuestion={question} selectedOption="One" quizSubmissionBlocked quizError="Submission not confirmed." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Submission not confirmed');
    expect(screen.queryByRole('button', { name: 'Retry saving result' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Response' })).toBeDisabled();
  });
  it('binds answer and completion to the initiating session and encodes the id', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: {} });
    await quizAPI.submitAttempt({ question_id: 1 }, 'token');
    await quizAPI.completeSession('q/1', 'token');
    expect(post).toHaveBeenNthCalledWith(1, '/quizzes/attempts', { question_id: 1 }, { expectedSessionToken: 'token' });
    expect(post).toHaveBeenNthCalledWith(2, '/quizzes/q%2F1/complete', null, { expectedSessionToken: 'token' });
  });
});
