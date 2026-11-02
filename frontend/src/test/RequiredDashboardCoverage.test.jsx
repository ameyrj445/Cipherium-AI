import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ContinueLearningRow, { ContinueLearningCards, TodaysTasksCard } from '../components/ContinueLearningRow';
import RecommendedPanel from '../components/RecommendedPanel';
import AnalyticsPanel from '../components/AnalyticsPanel';
import StatCards from '../components/StatCards';

describe('dashboard branch behavior', () => {
  it('routes roadmap and practice actions independently without an active plan', () => {
    const learn = vi.fn(), practice = vi.fn();
    render(<ContinueLearningRow onOpenLearn={learn} onOpenPractice={practice} />);
    fireEvent.click(screen.getByRole('button', { name: /Explore roadmaps/ }));
    fireEvent.click(screen.getByRole('button', { name: /Start diagnostic practice/ }));
    fireEvent.click(screen.getByRole('button', { name: /Browse roadmaps/ }));
    expect(learn).toHaveBeenCalledTimes(2); expect(practice).toHaveBeenCalledOnce();
  });
  it('uses final completed milestone and study-plan navigation fallback', () => {
    const open = vi.fn();
    render(<ContinueLearningCards customPlan={{ subject: 'Algorithms', milestones: [{ title: 'Done stage', subtopics: ['A'], completed_subtopics: ['A'] }] }} onOpenStudyPlan={open} />);
    expect(screen.getByText('100% Complete')).toBeInTheDocument();
    expect(screen.getByText('Current: Done stage')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Resume study stage/ })); expect(open).toHaveBeenCalledOnce();
  });
  it('handles a plan with missing arrays and no subtopics', () => {
    render(<ContinueLearningCards customPlan={{ milestones: [{ title: 'Empty stage' }] }} />);
    expect(screen.getByText('0% Complete')).toBeInTheDocument();
    expect(screen.getByText('Current: Empty stage')).toBeInTheDocument();
  });
  it('renders an empty curriculum action and supports optional callbacks', () => {
    const open = vi.fn();
    render(<TodaysTasksCard customPlan={{ milestones: [] }} onOpenStudyPlan={open} />);
    fireEvent.click(screen.getByRole('button', { name: 'Review curriculum' })); expect(open).toHaveBeenCalledOnce();
  });
  it('toggles completed and incomplete plan tasks with correct payload and limits to four', () => {
    const update = vi.fn();
    render(<TodaysTasksCard customPlan={{ milestones: [{ id: 7, subtopics: ['A', 'B', 'C', 'D', 'E'], completed_subtopics: ['A'] }] }} onUpdatePlanProgress={update} />);
    fireEvent.click(screen.getByTitle('A')); fireEvent.click(screen.getByTitle('B'));
    expect(update.mock.calls.map(([arg]) => arg)).toEqual([{ milestone_id: 7, subtopic_name: 'A', subtopic_completed: false }, { milestone_id: 7, subtopic_name: 'B', subtopic_completed: true }]);
    expect(screen.queryByTitle('E')).not.toBeInTheDocument();
    const row = screen.getByTitle('B').parentElement.parentElement;
    fireEvent.mouseEnter(row); fireEvent.mouseLeave(row);
    const complete = screen.getByTitle('A').parentElement.parentElement;
    fireEvent.mouseEnter(complete); fireEvent.mouseLeave(complete);
  });
  it('falls back to final stage for fully completed plans and legacy toggle callback', () => {
    const toggle = vi.fn();
    render(<TodaysTasksCard customPlan={{ milestones: [{ subtopics: ['Completed'], completed_subtopics: ['Completed'] }] }} onToggleTask={toggle} />);
    fireEvent.click(screen.getByTitle('Completed')); expect(toggle).toHaveBeenCalledWith('task-sub-0');
  });
  it('accepts plain daily tasks and missing callbacks without changing data', () => {
    const tasks = [{ id: 1, title: 'Legacy', done: false, duration: '10 min' }];
    render(<TodaysTasksCard todayTasks={tasks} />); fireEvent.click(screen.getByTitle('Legacy')); expect(tasks[0].done).toBe(false);
  });
  it('handles no milestone arrays and no data without inventing tasks', () => {
    render(<TodaysTasksCard customPlan={{ milestones: [{}] }} />); expect(screen.getByText('No tasks scheduled')).toBeInTheDocument();
  });
  it.each(['Videos', 'Articles', 'Practice', 'Unknown'])('filters real recommendations using %s', (filter) => {
    const recs = [
      { id: 1, title: 'Watch', resource_type: 'video', url: 'https://example.com/1' },
      { id: 2, title: 'Read', resource_type: 'article', url: 'https://example.com/2' },
      { id: 3, title: 'Solve', resource_type: 'challenge', url: 'https://example.com/3' },
      { id: 4, title: 'Unspecified', url: 'https://example.com/4' },
    ];
    const filterChange = vi.fn();
    render(<RecommendedPanel recommendations={recs} activeResourceFilter={filter} setActiveResourceFilter={filterChange} />);
    expect(screen.getByText(filter === 'Videos' ? 'Watch' : filter === 'Articles' ? 'Read' : filter === 'Practice' ? 'Solve' : 'Watch')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'All' })); expect(filterChange).toHaveBeenCalledWith('All');
  });
  it('uses plan resource defaults and falls back when selected filter has no matches', () => {
    render(<RecommendedPanel customPlan={{ subject: 'Systems', milestones: [{ title: 'Stage' }, { title: 'Topic', resources: [{ title: 'Plan article', url: 'https://example.com' }] }] }} activeResourceFilter="Videos" />);
    expect(screen.getByText('Curated for Systems')).toBeInTheDocument(); expect(screen.getByText('Plan article')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Articles' }));
  });
  it('shows curated examples for an empty plan and opens resources', () => {
    const open = vi.fn();
    render(<RecommendedPanel customPlan={{ subject: 'Empty', milestones: [] }} onOpenResources={open} />);
    expect(screen.getByText('Dynamic Programming Patterns')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /View all/ })); expect(open).toHaveBeenCalledOnce();
  });
  it('renders analytics empty state, optional period control and practice action', () => {
    const start = vi.fn();
    render(<AnalyticsPanel onStartPractice={start} />);
    fireEvent.click(screen.getByRole('button', { name: 'Year' }));
    fireEvent.click(screen.getByRole('button', { name: 'Start diagnostic practice' })); expect(start).toHaveBeenCalledOnce();
  });
  it('renders completion-only analytics and switches periods', () => {
    const period = vi.fn();
    render(<AnalyticsPanel dashboardData={{ completion: 12 }} analyticsPeriod="Month" setAnalyticsPeriod={period} />);
    expect(screen.getByText('0 trackable stages')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Week' })); expect(period).toHaveBeenCalledWith('Week');
  });
  it('shows at most five topic bars with fallback names and colors', () => {
    render(<AnalyticsPanel dashboardData={{ topicsData: [{ pct: 0 }, { topic: 'Named', pct: 40, color: 'red' }, ...Array.from({ length: 4 }, (_, i) => ({ topic: `Topic${i}`, pct: 12 }))] }} />);
    expect(screen.getByText('0%')).toBeInTheDocument(); expect(screen.getByText('Named')).toBeInTheDocument(); expect(screen.queryByText('Topic3')).not.toBeInTheDocument();
  });
  it('uses duration-derived hours and supports milestones without subtopic arrays', () => {
    render(<StatCards customPlan={{ milestones: [{}], duration_weeks: 3, target_hours_per_week: 4 }} />);
    expect(screen.getByText('0/12h')).toBeInTheDocument(); expect(screen.getByText('Subtopics (0/0)')).toBeInTheDocument();
  });
  it('defaults plan hours to 20 and clamps remaining hours at zero', () => {
    render(<StatCards customPlan={{ milestones: [], completed_hours: 30 }} />);
    expect(screen.getByText('30/20h')).toBeInTheDocument(); expect(screen.getByText('0h remaining')).toBeInTheDocument();
  });
  it('renders a plan with no milestones using logged hours', () => {
    render(<StatCards customPlan={{}} studyHours={2} />); expect(screen.getByText('2h')).toBeInTheDocument();
  });
  it.each([{ topicsCompleted: 1 }, { studyHours: 1 }, { dayStreak: 1 }])('keeps nonzero activity visible: %j', (props) => {
    render(<StatCards {...props} />); expect(screen.getByText('Study Time')).toBeInTheDocument();
  });
});
