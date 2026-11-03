import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PracticeView from '../components/PracticeView';
import AdminView from '../components/AdminView';
import AnalyticsFullView from '../components/AnalyticsFullView';
import SectionHeader from '../components/common/SectionHeader';
import SettingSection from '../components/common/SettingSection';
import StatCard from '../components/common/StatCard';
import ToggleSwitch from '../components/common/ToggleSwitch';
import { quizAPI, adminAPI, analyticsAPI } from '../services/api';
vi.mock('../services/api', () => ({
  quizAPI: { generateExam: vi.fn(), submitAttempt: vi.fn() },
  adminAPI: { getQuestions: vi.fn(), getFeedback: vi.fn() },
  analyticsAPI: { getFlashcards: vi.fn(), getActivityHeatmap: vi.fn() },
}));
const pending = () => new Promise(() => {});

describe('actual loading states and primitive render inventory', () => {
  it('keeps quiz selection and submit disabled while a quiz request is pending', () => {
    const select = vi.fn();
    render(<PracticeView quizLoading selectedOption="Answer A" setSelectedOption={select} currentQuestion={{ id: 1, question_text: 'Question while loading', options: ['Answer A', 'Answer B'] }} />);
    fireEvent.click(screen.getByText('Answer B'));
    expect(select).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Submit/ })).toBeDisabled();
  });
  it('shows generating exam state and disables repeated generation', () => {
    quizAPI.generateExam.mockReturnValue(pending());
    render(<PracticeView />);
    fireEvent.click(screen.getByRole('button', { name: /Timed Exam/ }));
    fireEvent.click(screen.getByRole('button', { name: /Launch Diagnostic Benchmark/ }));
    expect(screen.getByRole('button', { name: /Generating Exam/ })).toBeDisabled();
    expect(quizAPI.generateExam).toHaveBeenCalledOnce();
  });
  it('announces feedback loading and blocks pagination until the response arrives', () => {
    adminAPI.getQuestions.mockReturnValue(pending()); adminAPI.getFeedback.mockReturnValue(pending());
    render(<AdminView user={{ role: 'admin', id: 1 }} token="test" />);
    fireEvent.click(screen.getByRole('tab', { name: 'Feedback' }));
    expect(screen.getByRole('status')).toHaveTextContent('Loading feedback');
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });
  it('renders analytics safely while both auxiliary requests are pending', () => {
    analyticsAPI.getFlashcards.mockReturnValue(pending()); analyticsAPI.getActivityHeatmap.mockReturnValue(pending());
    render(<AnalyticsFullView />);
    expect(screen.getByRole('heading', { name: /Analytics/ })).toBeInTheDocument();
    expect(analyticsAPI.getFlashcards).toHaveBeenCalled();
    // This view has no visible loading indicator; do not invent one in the test.
  });
  it('renders section and settings primitives with their children and actions', () => {
    const action = vi.fn();
    render(<><SectionHeader title="Section title" subtitle="Section help" actionLabel="Open section" onAction={action} /><SettingSection title="Preferences" description="Manage options" badge="New"><p>Settings body</p></SettingSection></>);
    expect(screen.getByRole('heading', { name: 'Section title' })).toBeInTheDocument();
    expect(screen.getByText('Settings body')).toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: 'Open section' })); expect(action).toHaveBeenCalledOnce();
  });
  it('renders metric and toggle primitives and emits the next checked value', () => {
    const change = vi.fn(), click = vi.fn();
    render(<><StatCard label="Hours" value="4h" sublabel="Today" onClick={click} /><ToggleSwitch id="emails" label="Emails" onChange={change} /></>);
    fireEvent.click(screen.getByText('4h')); expect(click).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('switch', { name: 'Emails' })); expect(change).toHaveBeenCalledWith(true);
  });
});
