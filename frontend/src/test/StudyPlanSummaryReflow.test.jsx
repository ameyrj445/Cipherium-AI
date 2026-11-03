import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import StudyPlanView from '../components/StudyPlanView';

const plan = {
  id: 42,
  subject: 'Algorithms',
  total_estimated_hours: 999999999999999,
  completed_hours: 123456789012345,
  milestones: [
    { id: 1, title: 'Basics', status: 'completed', subtopics: ['Arrays'], completed_subtopics: ['Arrays'], resources: [] },
    { id: 2, title: 'Trees', status: 'in_progress', subtopics: ['Traversal', 'Search'], completed_subtopics: ['Traversal'], resources: [] },
  ],
};
const originalWidth = window.innerWidth;
afterEach(() => { window.innerWidth = originalWidth; });

// JSDOM protects the responsive style/data contracts, not rendered geometry.
// Real-browser overflow and text-bound checks are a separate acceptance step.
describe('study plan progress summary reflow', () => {
  it.each([320, 375, 390, 640, 768, 1024, 1280])('retains all four statistics in a bounded grid at %ipx', width => {
    window.innerWidth = width;
    const { container } = render(<StudyPlanView plan={plan} />);
    const summary = container.querySelector('.study-plan-summary');
    expect(summary.style.gridTemplateColumns).toBe('repeat(auto-fit, minmax(min(200px, 100%), 1fr))');
    expect(summary.children).toHaveLength(4);
    for (const label of ['Overall Progress', 'Milestones Done', 'Study Hours', 'Subtopics']) {
      const stat = within(summary).getByText(label).parentElement.parentElement;
      expect(stat).toHaveStyle({ minWidth: 0, overflowWrap: 'anywhere' });
      expect(stat.firstChild).toHaveStyle({ gap: '8px' });
      expect(stat.querySelector('svg')).toHaveStyle({ flexShrink: 0 });
      expect(stat.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    }
    for (const value of ['67%', '1 / 2', '123456789012345 / 999999999999999h', '2 / 3']) {
      expect(within(summary).getByText(value)).toBeInTheDocument();
    }
  });

  it('preserves accessible content, freshness gating and milestone controls', async () => {
    window.innerWidth = 320;
    const onUpdateProgress = vi.fn();
    const { container } = render(<StudyPlanView plan={plan} onUpdateProgress={onUpdateProgress} />);
    expect((await axe(container.querySelector('.study-plan-summary'))).violations).toEqual([]);
    const regeneration = screen.getByRole('button', { name: 'Regenerate plan' });
    expect(regeneration).toBeDisabled();
    expect(screen.getByRole('heading', { name: 'Plan freshness unavailable' })).toBeInTheDocument();
    const milestone = screen.getByRole('button', { name: 'Basics milestone' });
    expect(milestone).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(milestone);
    expect(milestone).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(milestone);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Arrays' }));
    expect(onUpdateProgress).toHaveBeenLastCalledWith({ milestone_id: 1, subtopic_name: 'Arrays', subtopic_completed: false });
    expect(regeneration).toBeDisabled();
  });
});
