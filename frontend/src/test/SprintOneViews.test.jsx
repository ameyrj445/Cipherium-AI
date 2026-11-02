import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginScreen from '../components/LoginScreen';
import StudyPlanView from '../components/StudyPlanView';
import ResourcesFullView from '../components/ResourcesFullView';
import AnalyticsFullView from '../components/AnalyticsFullView';
import PracticeView from '../components/PracticeView';
import { quizAPI } from '../services/api';

vi.mock('../services/api', () => ({
  analyticsAPI: {
    getFlashcards: vi.fn().mockResolvedValue({ data: [] }),
    getActivityHeatmap: vi.fn().mockResolvedValue({ data: { heatmap_data: [] } }),
  },
  quizAPI: { generateExam: vi.fn(), submitAttempt: vi.fn() },
}));

describe('Sprint one view interactions', () => {
  beforeEach(() => vi.clearAllMocks());
  it('LoginScreen routes registration, demo credentials and submit through callbacks', () => {
    const callbacks = {
      setAuthMode: vi.fn(), setAuthName: vi.fn(), setAuthEmail: vi.fn(),
      setAuthPassword: vi.fn(), setAuthError: vi.fn(), handleAuth: vi.fn((event) => event.preventDefault()),
    };
    render(<LoginScreen authMode="login" authName="" authEmail="" authPassword="" {...callbacks} />);
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(callbacks.setAuthMode).toHaveBeenCalledWith('register');
    fireEvent.click(screen.getByRole('button', { name: /demo/i }));
    expect(callbacks.setAuthEmail).toHaveBeenCalledWith('student@cipherium.ai');
    expect(callbacks.setAuthPassword).toHaveBeenCalledWith('cipherium123');
    fireEvent.submit(screen.getByRole('button', { name: /sign in & open workspace/i }).closest('form'));
    expect(callbacks.handleAuth).toHaveBeenCalledOnce();
  });

  it('LoginScreen shows registration fields and disables authentication while loading', () => {
    const setAuthName = vi.fn();
    render(<LoginScreen authMode="register" authName="" authEmail="" authPassword="" authError="Invalid details" loading setAuthName={setAuthName} setAuthEmail={vi.fn()} setAuthPassword={vi.fn()} setAuthMode={vi.fn()} setAuthError={vi.fn()} handleAuth={vi.fn()} />);
    expect(screen.getByText('Invalid details')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('e.g. Amey Jain'), { target: { value: 'Alex' } });
    expect(setAuthName).toHaveBeenCalledWith('Alex');
    expect(screen.getByRole('button', { name: 'Authenticating...' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Forgot password?' })).not.toBeInTheDocument();
  });

  it('StudyPlanView submits configured generation options and exposes errors', async () => {
    const onGeneratePlan = vi.fn().mockResolvedValue(true);
    render(<StudyPlanView error="service unavailable" onGeneratePlan={onGeneratePlan} />);
    expect(screen.getByRole('alert')).toHaveTextContent('service unavailable');
    fireEvent.change(screen.getByPlaceholderText(/e.g. Data Structures/), { target: { value: '  Databases  ' } });
    fireEvent.click(screen.getByRole('button', { name: /synthesize study plan/i }));
    await waitFor(() => expect(onGeneratePlan).toHaveBeenCalledWith(expect.objectContaining({
      subject: 'Databases', duration_weeks: 4, target_hours_per_week: 10,
    })));
  });

  it('StudyPlanView disables generation while loading', () => {
    render(<StudyPlanView loading onGeneratePlan={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Synthesizing Plan...' })).toBeDisabled();
  });

  it('StudyPlanView tracks time and opens practice for an existing plan', () => {
    const onUpdateProgress = vi.fn();
    const onPracticeTopic = vi.fn();
    render(<StudyPlanView plan={{ subject: 'Databases', milestones: [{ id: 1, title: 'SQL Basics', status: 'in_progress', subtopics: ['Joins'], completed_subtopics: [], resources: [] }] }} onUpdateProgress={onUpdateProgress} onPracticeTopic={onPracticeTopic} />);
    fireEvent.click(screen.getByRole('button', { name: '+30 min' }));
    expect(onUpdateProgress).toHaveBeenCalledWith({ logged_hours_delta: 0.5 });
    fireEvent.click(screen.getByRole('button', { name: 'Practice This Subject' }));
    expect(onPracticeTopic).toHaveBeenCalledWith('Databases');
    fireEvent.change(screen.getByPlaceholderText('Search stages or topics...'), { target: { value: 'absent' } });
    expect(screen.queryByText('SQL Basics')).not.toBeInTheDocument();
  });

  it('StudyPlanView updates a checklist and filters milestones by status', () => {
    const onUpdateProgress = vi.fn();
    const plan = { subject: 'Databases', milestones: [
      { id: 1, title: 'SQL Basics', status: 'in_progress', subtopics: ['Joins'], completed_subtopics: [], resources: [{ title: 'Joins Guide', url: 'https://example.com/joins' }] },
      { id: 2, title: 'Indexing', status: 'completed', subtopics: ['Indexes'], completed_subtopics: ['Indexes'], resources: [] },
    ] };
    render(<StudyPlanView plan={plan} onUpdateProgress={onUpdateProgress} />);
    expect(screen.getByRole('link', { name: /open resource/i })).toHaveAttribute('href', 'https://example.com/joins');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Joins' }));
    expect(onUpdateProgress).toHaveBeenCalledWith({ milestone_id: 1, subtopic_name: 'Joins', subtopic_completed: true });
    fireEvent.click(screen.getByRole('button', { name: 'Completed' }));
    expect(screen.queryByText('SQL Basics')).not.toBeInTheDocument();
    expect(screen.getByText('Indexing')).toBeInTheDocument();
  });

  it('ResourcesFullView searches across plan and recommendations', () => {
    render(<ResourcesFullView recommendations={[{ id: 2, title: 'Graph Algorithms', url: 'https://example.com/graph', resource_type: 'article' }]} customPlan={{ subject: 'Databases', milestones: [{ title: 'SQL', resources: [{ id: 1, title: 'SQL Tutorial', url: 'https://example.com/sql' }] }] }} />);
    expect(screen.getByText('SQL Tutorial')).toBeInTheDocument();
    expect(screen.getByText('Graph Algorithms')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Search topics, platforms/), { target: { value: 'Graph' } });
    expect(screen.getByText('Graph Algorithms')).toBeInTheDocument();
    expect(screen.queryByText('SQL Tutorial')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /reset filters/i }));
    expect(screen.getByText('SQL Tutorial')).toBeInTheDocument();
  });

  it('ResourcesFullView exposes an empty state when search has no match', () => {
    render(<ResourcesFullView recommendations={[{ id: 1, title: 'Graph Algorithms', url: 'https://example.com/graph' }]} />);
    fireEvent.change(screen.getByPlaceholderText(/Search topics, platforms/), { target: { value: 'Nonexistent topic' } });
    expect(screen.getByText('No Matching Resources Found')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear All Filters' }));
    expect(screen.getByText('Graph Algorithms')).toBeInTheDocument();
  });

  it('ResourcesFullView combines roadmap, type, difficulty, duration and topic filters', () => {
    const recommendations = [
      { id: 2, title: 'Graph Video', url: 'https://example.com/video', resource_type: 'video', estimated_minutes: 10, topic_name: 'Graphs', difficulty: 'Beginner' },
      { id: 3, title: 'SQL Challenge', url: 'https://example.com/challenge', resource_type: 'practice', estimated_minutes: 40, topic_name: 'Databases', difficulty: 'Advanced' },
    ];
    const customPlan = { subject: 'Databases', milestones: [{ title: 'SQL', resources: [{ id: 1, title: 'SQL Tutorial', url: 'https://example.com/sql', resource_type: 'article', estimated_minutes: 20 }] }] };
    render(<ResourcesFullView recommendations={recommendations} customPlan={customPlan} />);
    fireEvent.click(screen.getByRole('button', { name: /Roadmap Only/ }));
    expect(screen.getByText('SQL Tutorial')).toBeInTheDocument();
    expect(screen.queryByText('Graph Video')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /All Types/ }));
    fireEvent.click(screen.getByRole('button', { name: /Videos/ }));
    expect(screen.getByText('Graph Video')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Advanced/ }));
    expect(screen.getByText('No Matching Resources Found')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    fireEvent.click(screen.getByRole('button', { name: /Practice Tasks/ }));
    expect(screen.getByText('SQL Challenge')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /30\+ mins/ }));
    expect(screen.getByText('SQL Challenge')).toBeInTheDocument();
  });

  it('AnalyticsFullView switches to execution and filters plans', async () => {
    render(<AnalyticsFullView plans={[{ id: 1, subject: 'Databases', milestones: [{ title: 'SQL', subtopics: ['Joins'], completed_subtopics: ['Joins'], resources: [] }] }]} />);
    fireEvent.click(screen.getByRole('button', { name: /study plan execution/i }));
    expect(screen.getByText('Overall Completion')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Search plan or milestone'), { target: { value: 'missing' } });
    expect(screen.getAllByText('0/0')).toHaveLength(2);
  });

  it('AnalyticsFullView routes weak topic practice through the callback', () => {
    const onPracticeTopic = vi.fn();
    render(<AnalyticsFullView analytics={{ topics: [{ topic_id: 8, topic_name: 'Graph Theory', status: 'weak', mastery_score: 0.2, ml_weak_probability: 0.9 }] }} onPracticeTopic={onPracticeTopic} />);
    fireEvent.click(screen.getByRole('button', { name: 'Practice' }));
    expect(onPracticeTopic).toHaveBeenCalledWith('Graph Theory');
  });

  it('PracticeView sends an empty challenge state to study plan creation', () => {
    const onOpenStudyPlan = vi.fn();
    render(<PracticeView onOpenStudyPlan={onOpenStudyPlan} />);
    fireEvent.click(screen.getByRole('button', { name: /coding challenges/i }));
    fireEvent.click(screen.getByRole('button', { name: /create a study plan/i }));
    expect(onOpenStudyPlan).toHaveBeenCalledOnce();
  });

  it('PracticeView disables quiz submission until an answer is selected', () => {
    const handleSubmitQuiz = vi.fn();
    render(<PracticeView currentQuestion={{ id: 1, question_text: 'Which data structure is FIFO?', options: ['Queue', 'Stack'], topic_name: 'Queues' }} handleSubmitQuiz={handleSubmitQuiz} />);
    expect(screen.getByRole('button', { name: 'Submit Response' })).toBeDisabled();
  });

  it('PracticeView accepts a quiz option and submits a selected answer', () => {
    const setSelectedOption = vi.fn();
    const handleSubmitQuiz = vi.fn();
    const question = { id: 1, question_text: 'Which data structure is FIFO?', options: ['Queue', 'Stack'], topic_name: 'Queues' };
    const { rerender } = render(<PracticeView currentQuestion={question} setSelectedOption={setSelectedOption} handleSubmitQuiz={handleSubmitQuiz} />);
    fireEvent.click(screen.getByText('Queue'));
    expect(setSelectedOption).toHaveBeenCalledWith('Queue');
    rerender(<PracticeView currentQuestion={question} selectedOption="Queue" setSelectedOption={setSelectedOption} handleSubmitQuiz={handleSubmitQuiz} />);
    fireEvent.click(screen.getByRole('button', { name: 'Submit Response' }));
    expect(handleSubmitQuiz).toHaveBeenCalledOnce();
  });

  it('PracticeView filters curated challenges and marks a resource complete', () => {
    const onUpdateProgress = vi.fn();
    const plans = [{ id: 7, subject: 'Algorithms', milestones: [{ id: 3, title: 'Arrays', resources: [
      { id: 9, title: 'Two Sum Challenge', resource_type: 'practice', url: 'https://leetcode.com/problems/two-sum', completed: false },
      { id: 10, title: 'Array Notes', resource_type: 'article', url: 'https://example.com/notes' },
    ] }] }];
    render(<PracticeView plans={plans} onUpdateProgress={onUpdateProgress} />);
    fireEvent.click(screen.getByRole('button', { name: /coding challenges/i }));
    expect(screen.getByText('Two Sum Challenge')).toBeInTheDocument();
    expect(screen.queryByText('Array Notes')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mark done' }));
    expect(onUpdateProgress).toHaveBeenCalledWith({ plan_id: 7, milestone_id: 3, resource_id: 9, resource_completed: true });
    fireEvent.change(screen.getByPlaceholderText(/Find a topic/), { target: { value: 'unmatched' } });
    expect(screen.queryByText('Two Sum Challenge')).not.toBeInTheDocument();
  });

  it('PracticeView reports exam generation errors and allows retry', async () => {
    quizAPI.generateExam.mockRejectedValueOnce({ response: { data: { detail: 'Question bank unavailable' } } });
    render(<PracticeView />);
    fireEvent.click(screen.getByRole('button', { name: 'Timed Exam' }));
    fireEvent.click(screen.getByRole('button', { name: '10 Questions' }));
    fireEvent.click(screen.getByRole('button', { name: '5m' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lvl 2' }));
    fireEvent.click(screen.getByRole('button', { name: 'Launch Diagnostic Benchmark' }));
    expect(await screen.findByText('Question bank unavailable')).toBeInTheDocument();
    expect(quizAPI.generateExam).toHaveBeenCalledWith({ question_count: 10, time_limit_minutes: 5, max_difficulty: 2 });
  });

  it('PracticeView handles an empty generated exam without entering exam mode', async () => {
    quizAPI.generateExam.mockResolvedValueOnce({ data: { questions: [] } });
    render(<PracticeView />);
    fireEvent.click(screen.getByRole('button', { name: 'Timed Exam' }));
    fireEvent.click(screen.getByRole('button', { name: 'Launch Diagnostic Benchmark' }));
    expect(await screen.findByText(/No exam questions could be generated/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Launch Diagnostic Benchmark' })).toBeEnabled();
  });

  it('PracticeView reveals a hint, then clears it when skipping', () => {
    const loadNextQuestion = vi.fn();
    render(<PracticeView currentQuestion={{ id: 1, question_text: 'What is FIFO?', options: ['Queue', 'Stack'], topic_name: 'Queues' }} loadNextQuestion={loadNextQuestion} />);
    fireEvent.click(screen.getByRole('button', { name: 'Get Hint' }));
    expect(screen.getByText(/core invariants of Queues/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Skip Question' }));
    expect(loadNextQuestion).toHaveBeenCalledWith(null);
    expect(screen.queryByText(/core invariants of Queues/)).not.toBeInTheDocument();
  });

  it('PracticeView shows a graded quiz result and loads the next question', () => {
    const loadNextQuestion = vi.fn();
    render(<PracticeView currentQuestion={{ id: 1, question_text: 'What is FIFO?', options: ['Queue', 'Stack'], topic_name: 'Queues' }} selectedOption="Stack" quizResult={{ is_correct: false, correct_answer: 'Queue', new_mastery_score: 0.4, new_status: 'developing', explanation: 'A queue is FIFO.' }} loadNextQuestion={loadNextQuestion} />);
    expect(screen.getByText('A queue is FIFO.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next Question' }));
    expect(loadNextQuestion).toHaveBeenCalledWith(null);
  });

  it('PracticeView grades an exam and can return to adaptive practice', async () => {
    quizAPI.generateExam.mockResolvedValueOnce({ data: { time_limit_minutes: 5, questions: [{ id: 11, question_text: 'FIFO structure?', options: ['Queue', 'Stack'], correct_answer: 'Queue', explanation: 'First in, first out.' }] } });
    quizAPI.submitAttempt.mockResolvedValue({ data: {} });
    render(<PracticeView />);
    fireEvent.click(screen.getByRole('button', { name: 'Timed Exam' }));
    fireEvent.click(screen.getByRole('button', { name: 'Launch Diagnostic Benchmark' }));
    expect(await screen.findByText('FIFO structure?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Queue'));
    fireEvent.click(screen.getByRole('button', { name: 'Finish & Grade Exam' }));
    expect(await screen.findByText('Mastery Demonstrated')).toBeInTheDocument();
    expect(quizAPI.submitAttempt).toHaveBeenCalledWith({ question_id: 11, selected_answer: 'Queue', time_taken_seconds: 15 });
    fireEvent.click(screen.getByRole('button', { name: 'Adaptive Practice' }));
    expect(screen.getByRole('button', { name: /adaptive quiz/i })).toBeInTheDocument();
  });
});
