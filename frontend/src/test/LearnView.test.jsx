import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LearnView from '../components/LearnView';
import { analyticsAPI } from '../services/api';
vi.mock('../services/api', () => ({ analyticsAPI: { getSubjectRoadmaps: vi.fn() } }));
vi.mock('../components/common/BlueprintWizard', () => ({ default: ({ categoryFilter, durationFilter, hoursFilter, onSelectBlueprint, onOpenCustomGenerator }) => <section aria-label="Blueprints"><output>{categoryFilter}|{durationFilter}|{hoursFilter}</output><button onClick={() => onSelectBlueprint('DSA')}>Choose DSA blueprint</button><button onClick={onOpenCustomGenerator}>Custom blueprint</button></section> }));
vi.mock('../components/common/MilestoneProgressTree', () => ({ default: ({ planId, milestones }) => <div data-testid="inline-plan">Plan {planId}: {milestones.length} stages</div> }));
const resources = [
  { title: 'Array guide', label: 'Array guide', url: 'https://example.com/arrays', site: 'gfg', type: 'article' },
  { title: 'Practice arrays', label: 'Practice arrays', url: 'https://example.com/practice', site: 'unknown', type: 'practice' },
  { label: 'Watch arrays', url: 'https://example.com/video', site: 'leetcode', type: 'video' },
  { label: 'Reference sheet', url: 'https://example.com/sheet', site: 'mdn', type: 'cheatsheet' },
  { label: 'Other resource', url: 'https://example.com/other', type: 'unknown' },
];
const subjects = [
  { id: 'DSA', title: 'Algorithms', tagline: 'Data foundations', desc: 'Coding foundations', icon: 'A', color: '#123456', borderColor: '#654321', stages: [{ id: 's1', title: 'Foundations', icon: '1', topics: [{ id: 't1', title: 'Arrays', resources }, { id: 't2', title: 'Lists', resources: [] }] }, { id: 's2', title: 'Advanced', topics: [{ id: 't3', title: 'Trees', resources: [] }] }] },
  { id: 'OS', title: 'Operating Systems', tagline: 'Processes and memory', description: 'Kernel concepts', stages: [{ id: 'os1', title: 'Memory', topics: [{ id: 'ot', title: 'Paging', resources: [] }] }] },
  { id: 'empty', title: 'Empty subject', tagline: 'Coming soon', stages: [] },
];
const plan = (overrides = {}) => ({ id: 1, subject: 'Custom Algorithms', is_added_to_learn: true, duration_weeks: 4, target_hours_per_week: 5, total_estimated_hours: 20, completed_hours: 4, milestones: [{ id: 'm1', title: 'Plan foundation', subtopics: ['Arrays', 'No matching source'], completed_subtopics: ['Arrays'], estimated_hours: 4, resources: [{ id: 'r1', title: 'Array guide', summary: 'Arrays tutorial', url: 'https://geeksforgeeks.org/arrays', completed: true }, { id: 'r2', title: 'Other lesson', url: 'https://example.com/lesson', estimated_minutes: 15 }] }], ...overrides });
const explore = () => fireEvent.click(screen.getByRole('button', { name: 'Explore All Subjects' }));
async function loaded(props = {}) { render(<LearnView {...props} />); await waitFor(() => expect(analyticsAPI.getSubjectRoadmaps).toHaveBeenCalled()); await act(async () => {}); }
beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); analyticsAPI.getSubjectRoadmaps.mockResolvedValue({ data: subjects }); });

describe('LearnView roadmaps', () => {
  it('renders blueprint empty-plan state and forwards all filters and custom navigation', async () => {
    const open = vi.fn(); await loaded({ onOpenStudyPlan: open });
    expect(screen.getByRole('heading', { name: /Curated Learning Roadmaps/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'ML', exact: true }));
    fireEvent.change(screen.getByLabelText('Filter by duration'), { target: { value: '<8' } });
    fireEvent.change(screen.getByLabelText('Filter by weekly hours'), { target: { value: '>=6' } });
    expect(screen.getByText('ML|<8|>=6')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Custom blueprint')); expect(open).toHaveBeenCalledOnce();
  });
  it('shows pending state, then normalized empty state for malformed data', async () => {
    let resolve; analyticsAPI.getSubjectRoadmaps.mockReturnValue(new Promise(r => { resolve = r; }));
    render(<LearnView />); explore(); expect(screen.getByText('Loading subject roadmaps...')).toBeInTheDocument();
    await act(async () => resolve({ data: null })); expect(screen.getByText('No subject roadmaps are available yet.')).toBeInTheDocument();
  });
  it('shows an empty roadmap message on fetch failure and ignores late results after unmount', async () => {
    analyticsAPI.getSubjectRoadmaps.mockRejectedValueOnce(new Error('offline'));
    const view = render(<LearnView />); explore();
    expect(await screen.findByText('No subject roadmaps are available yet.')).toBeInTheDocument(); view.unmount();
    let resolve; analyticsAPI.getSubjectRoadmaps.mockReturnValue(new Promise(r => { resolve = r; }));
    const second = render(<LearnView />); second.unmount(); await act(async () => resolve({ data: subjects }));
    expect(screen.queryByText('Algorithms')).not.toBeInTheDocument();
  });
  it('handles selecting a blueprint before fetch completes and an unavailable blueprint', async () => {
    let resolve; analyticsAPI.getSubjectRoadmaps.mockReturnValue(new Promise(r => { resolve = r; })); render(<LearnView />);
    fireEvent.click(screen.getByText('Choose DSA blueprint')); expect(screen.getByText('Loading subject roadmap…')).toBeInTheDocument();
    await act(async () => resolve({ data: [] })); expect(screen.getByText('This subject roadmap is no longer available.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Back to Subjects/ })); expect(screen.getByLabelText('Blueprints')).toBeInTheDocument();
  });
  it.each([['Algorithms', 'Algorithms'], ['coding', 'Algorithms'], ['kernel', 'Operating Systems'], ['Foundations', 'Algorithms'], ['Paging', 'Operating Systems'], ['  ', 'Algorithms']])('filters by %s across title, description, stage and topic', async (query, expected) => {
    await loaded(); explore(); fireEvent.change(screen.getByPlaceholderText(/Search subjects/), { target: { value: query } });
    expect(screen.getByRole('heading', { name: expected })).toBeInTheDocument();
    if (query.trim()) expect(screen.queryByRole('heading', { name: 'Empty subject' })).not.toBeInTheDocument();
  });
  it('shows no matching cards for unknown search and supports empty subject roadmap', async () => {
    await loaded(); explore(); const input = screen.getByPlaceholderText(/Search subjects/);
    fireEvent.change(input, { target: { value: 'missing' } }); expect(screen.queryByRole('heading', { name: 'Algorithms' })).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: '' } }); fireEvent.click(screen.getByRole('heading', { name: 'Empty subject' }));
    expect(screen.getByText('0/0 topics done')).toBeInTheDocument();
  });
  it('opens subjects, tracks/undoes topics, persists progress and collapses stages', async () => {
    await loaded({ user: { email: 'student@example.test' } }); explore();
    const heading = screen.getByRole('heading', { name: 'Algorithms' }); const card = heading.parentElement.parentElement;
    fireEvent.mouseEnter(card); expect(card.style.transform).toBe('translateY(-3px)'); fireEvent.mouseLeave(card); expect(card.style.transform).toBe('translateY(0)');
    fireEvent.click(heading); expect(screen.getByText('0/3 topics done')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Other resource' })).toHaveAttribute('href', 'https://example.com/other');
    fireEvent.click(screen.getAllByRole('button', { name: 'Mark Done' })[0]); expect(screen.getByText('1/3 topics done')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('cipherium_learn_done_student@example.test')).t1).toBe(true);
    fireEvent.click(screen.getAllByRole('button', { name: 'Mark Done' })[0]); expect(screen.getByText('✓ Complete')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Undo' })[0]); expect(screen.getByText('1/3 topics done')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Foundations')); expect(screen.queryByText('Arrays')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Foundations')); expect(screen.getByText('Arrays')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Back to Subjects/ })); expect(screen.getByText('1/3 done')).toBeInTheDocument();
  });
  it('recovers malformed saved progress and uses the new user progress when the account changes', async () => {
    localStorage.setItem('cipherium_learn_done_a@example.test', '{bad');
    const view = render(<LearnView user={{ email: 'a@example.test' }} />); await act(async () => {}); explore();
    expect(screen.getByText('0/3 done')).toBeInTheDocument();
    localStorage.setItem('cipherium_learn_done_b@example.test', JSON.stringify({ t1: true, t2: true, t3: true }));
    view.rerender(<LearnView user={{ email: 'b@example.test' }} />); expect(screen.getByText('3/3 done')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('heading', { name: 'Algorithms' })); expect(screen.getByText('100%')).toBeInTheDocument();
  });
  it('selects, resumes, edits and conditionally deletes plans', async () => {
    const current = plan(); const empty = plan({ id: 2, subject: 'Empty plan', milestones: undefined, total_estimated_hours: 0, completed_hours: 0 });
    const select = vi.fn(), open = vi.fn(), remove = vi.fn(); const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await loaded({ customPlan: current, customPlans: [current, empty], onSelectPlan: select, onOpenStudyPlan: open, onDeletePlan: remove });
    expect(screen.getByText('1 of 2 subtopics completed')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit Plan' })[0]); expect(select).toHaveBeenCalledWith(current); expect(open).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: /Resume Roadmap/ })); expect(open).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete Plan' })[0]); expect(remove).not.toHaveBeenCalled();
    confirm.mockReturnValue(true); fireEvent.click(screen.getAllByRole('button', { name: 'Delete Plan' })[1]); expect(remove).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByRole('button', { name: 'Generate Custom AI Plan' })); expect(open).toHaveBeenCalledTimes(3); confirm.mockRestore();
  });
});

describe('LearnView saved plan expansion regression', () => {
  async function expanded(current, extra = {}) {
    await loaded({ customPlan: current, customPlans: [current], ...extra });
    const planCard = screen.getAllByText(current.subject)[0].closest('.ui-card');
    fireEvent.click(within(planCard).getAllByRole('button')[2]);
    return planCard;
  }
  it('expands a saved plan without crashing and emits exact subtopic/resource progress payloads', async () => {
    const current = plan(), update = vi.fn(), selectTopic = vi.fn();
    await expanded(current, { onUpdateProgress: update, onSelectTopic: selectTopic });
    expect(screen.getByTestId('inline-plan')).toHaveTextContent('Plan 1: 1 stages');
    expect(screen.getByText('Checklist: Mark Topics Done as you Learn')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Arrays')); expect(update).toHaveBeenLastCalledWith({ milestone_id: 'm1', subtopic_name: 'Arrays', subtopic_completed: false });
    fireEvent.click(screen.getByText('No matching source')); expect(update).toHaveBeenLastCalledWith({ milestone_id: 'm1', subtopic_name: 'No matching source', subtopic_completed: true });
    const previous = update.mock.calls.length; fireEvent.click(screen.getByRole('link', { name: 'Open resource' })); expect(update).toHaveBeenCalledTimes(previous);
    expect(screen.getByRole('link', { name: 'Open resource' })).toHaveAttribute('href', 'https://geeksforgeeks.org/arrays');
    expect(screen.getByRole('link', { name: 'Find tutorial' })).toHaveAttribute('href', expect.stringContaining('youtube.com/results?search_query='));
    fireEvent.click(screen.getByRole('button', { name: 'Completed', exact: true })); expect(update).toHaveBeenLastCalledWith({ milestone_id: 'm1', resource_id: 'r1', resource_completed: false });
    fireEvent.click(screen.getByRole('button', { name: 'Mark done', exact: true })); expect(update).toHaveBeenLastCalledWith({ milestone_id: 'm1', resource_id: 'r2', resource_completed: true });
    fireEvent.click(screen.getAllByText('Plan foundation')[0]); expect(screen.queryByText('Checklist: Mark Topics Done as you Learn')).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByText('Plan foundation')[0]); expect(screen.getByText('Checklist: Mark Topics Done as you Learn')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Collapse plan details')); expect(screen.queryByTestId('inline-plan')).not.toBeInTheDocument();
  });
  it('renders unstarted, partially completed, complete and empty milestone states with resource badge fallbacks', async () => {
    const domains = ['leetcode.com', 'neetcode.io', 'takeuforward.org', 'freecodecamp.org', 'developer.mozilla.org', 'w3schools.com', 'visualgo.net', 'example.com'];
    const current = plan({ completed_hours: 99, milestones: [
      { id: 'a', title: 'Ready milestone', subtopics: ['A'], completed_subtopics: ['A'], resources: domains.map((domain, i) => ({ id: `res${i}`, title: `Lesson ${i}`, url: `https://${domain}`, completed: i % 2 === 0 })) },
      { id: 'b', title: 'Pending milestone', subtopics: ['B'], resources: [{ title: 'No URL', summary: 'Other', completed: false }] },
      { title: 'Empty milestone' },
    ] });
    await expanded(current);
    expect(screen.getByText('LeetCode')).toBeInTheDocument(); expect(screen.getByText('NeetCode')).toBeInTheDocument();
    expect(screen.getByText('Striver')).toBeInTheDocument(); expect(screen.getByText('FCC')).toBeInTheDocument();
    expect(screen.getByText('MDN')).toBeInTheDocument(); expect(screen.getByText('W3Schools')).toBeInTheDocument(); expect(screen.getByText('Visualgo')).toBeInTheDocument();
    expect(screen.getByText('Empty milestone')).toBeInTheDocument();
    fireEvent.click(screen.getByText('B')); fireEvent.click(screen.getAllByRole('button', { name: 'Mark done', exact: true })[0]);
    expect(screen.getByText('Pending milestone')).toBeInTheDocument();
  });
  it('supports an empty active plan and optional callbacks without fabricated progress', async () => {
    const current = plan({ subject: 'Blank', milestones: undefined, total_estimated_hours: undefined, completed_hours: undefined, skill_level: 'Advanced' });
    await expanded(current);
    expect(screen.getByTestId('inline-plan')).toHaveTextContent('0 stages');
    expect(screen.getByText('Advanced', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getAllByText('0%').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /Resume Roadmap/ }));
  });
  it('returns to the active plan when a newly added plan arrives', async () => {
    const view = render(<LearnView />); await act(async () => {}); explore(); expect(screen.getByPlaceholderText(/Search subjects/)).toBeInTheDocument();
    const current = plan(); view.rerender(<LearnView customPlan={current} customPlans={[current]} />);
    expect(screen.queryByPlaceholderText(/Search subjects/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'My Study Plans (1)' })).toBeInTheDocument();
  });
});
