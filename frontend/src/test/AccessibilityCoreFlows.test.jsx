import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import FilterSidebar from '../components/layout/FilterSidebar';
import StudyPlanView from '../components/StudyPlanView';
import PracticeView from '../components/PracticeView';

vi.mock('../services/api', () => ({
  quizAPI: { generateExam: vi.fn().mockResolvedValue({ data: { questions: [{ id: 1, question_text: 'FIFO?', options: ['Queue', 'Stack'], correct_answer: 'Queue' }] } }), submitAttempt: vi.fn() },
}));

afterEach(() => { Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 }); });

describe('core accessibility interactions', () => {
  it('traps keyboard focus in the mobile filter dialog and restores it on Escape', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 });
    render(<FilterSidebar groups={[{ id: 'type', label: 'Type', options: [{ id: 'All', label: 'All' }] }]} />);
    const trigger = screen.getByRole('button', { name: 'Filter Resources' });
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Filter resources' });
    const close = screen.getByRole('button', { name: 'Close filters' });
    expect(close).toHaveFocus();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(screen.getByRole('button', { name: /All/ })).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(close).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('exposes milestone expansion as a keyboard-operable button', () => {
    render(<StudyPlanView plan={{ subject: 'Databases', milestones: [{ id: 1, title: 'SQL Basics', status: 'in_progress', subtopics: ['Joins'], resources: [] }] }} onUpdateProgress={vi.fn()} />);
    const milestone = screen.getByRole('button', { name: 'SQL Basics milestone' });
    expect(milestone).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(milestone);
    expect(milestone).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('checkbox', { name: 'Joins' })).not.toBeInTheDocument();
  });

  it('offers exam answers as focusable buttons with selection state', async () => {
    render(<PracticeView />);
    fireEvent.click(screen.getByRole('button', { name: 'Timed Exam' }));
    fireEvent.click(screen.getByRole('button', { name: 'Launch Diagnostic Benchmark' }));
    const option = await screen.findByRole('button', { name: 'A Queue' });
    expect(option).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(option);
    expect(option).toHaveAttribute('aria-pressed', 'true');
  });
});
