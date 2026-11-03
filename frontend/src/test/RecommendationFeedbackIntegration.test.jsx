import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RecommendedPanel from '../components/RecommendedPanel';
import ResourcesFullView from '../components/ResourcesFullView';
const resource = { id: 42, title: 'Binary search', url: 'https://example.com/learn', resource_type: 'article' };
const plan = { subject: 'Algorithms', milestones: [{ title: 'Searching', resources: [{ ...resource, feedbackTargetId: 42 }] }] };
const feedback = () => ({ authenticated: true, entries: new Map(), submit: vi.fn() });
describe('Recommendation feedback provenance', () => {
  it('never rates sample dashboard cards with invented numeric IDs', () => {
    render(<RecommendedPanel recommendationFeedback={feedback()} />);
    expect(screen.queryByRole('button', { name: 'Helpful' })).not.toBeInTheDocument();
  });
  it.each([RecommendedPanel, ResourcesFullView])('does not expose feedback for roadmap resources', (View) => {
    render(<View customPlan={plan} recommendationFeedback={feedback()} />);
    expect(screen.queryByRole('button', { name: 'Helpful' })).not.toBeInTheDocument();
  });
  it.each([RecommendedPanel, ResourcesFullView])('wires API recommendations to actual resource targets', (View) => {
    const state = feedback();
    render(<View recommendations={[resource]} recommendationFeedback={state} />);
    fireEvent.click(screen.getByRole('button', { name: 'Too easy' }));
    expect(state.submit).toHaveBeenCalledExactlyOnceWith(42, 'too_easy');
    expect(screen.getByText(/adjusts your overall learning difficulty/)).toBeInTheDocument();
  });
  it('renders matching plan/API IDs independently and enables only the API card', () => {
    render(<ResourcesFullView customPlan={plan} recommendations={[resource]} recommendationFeedback={feedback()} />);
    expect(screen.getAllByText('Binary search')).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Helpful' })).toHaveLength(1);
  });
  it('keeps API feedback visible when the roadmap would otherwise fill all dashboard slots', () => {
    const fullPlan = { subject: 'Algorithms', milestones: [{ title: 'Searching', resources: [1, 2, 3, 4].map((id) => ({ ...resource, id, title: `Plan item ${id}` })) }] };
    render(<RecommendedPanel customPlan={fullPlan} recommendations={[resource]} recommendationFeedback={feedback()} />);
    expect(screen.getByRole('group', { name: 'Feedback for Binary search' })).toBeInTheDocument();
    expect(screen.getByText('Recommended for You')).toBeInTheDocument();
    expect(screen.getByText('Plan item 1')).toBeInTheDocument();
    expect(screen.getByText('Plan item 2')).toBeInTheDocument();
    expect(screen.queryByText('Plan item 3')).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Open Resource' })).toHaveLength(3);
  });
  it('filters hide and restore a saved feedback state', () => {
    const state = feedback(); state.entries.set(42, { status: 'success', choice: 'helpful' });
    render(<ResourcesFullView recommendations={[resource]} recommendationFeedback={state} />);
    const search = screen.getByPlaceholderText(/Search/i);
    fireEvent.change(search, { target: { value: 'no match' } });
    expect(screen.queryByRole('button', { name: 'Helpful' })).not.toBeInTheDocument();
    fireEvent.change(search, { target: { value: '' } });
    expect(screen.getByRole('button', { name: 'Helpful' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Helpful' })).toHaveAttribute('aria-pressed', 'true');
  });
});
