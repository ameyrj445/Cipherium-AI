import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCards from '../components/StatCards';

describe('StatCards Component', () => {
  it('renders statistics when non-zero progress exists', () => {
    render(
      <StatCards
        customPlan={null}
        overallProgress={45}
        topicsCompleted={6}
        studyHours={3}
        dayStreak={7}
      />
    );

    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('Add a plan to begin')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('Topics Completed')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Day Streak')).toBeInTheDocument();
  });

  it('accurately computes subtopics progress and study hours from an active custom plan', () => {
    const mockPlan = {
      subject: 'Data Structures & Algorithms',
      completed_hours: 8,
      total_estimated_hours: 20,
      milestones: [
        {
          id: 'm1',
          subtopics: ['Arrays', 'Two Pointers'],
          completed_subtopics: ['Arrays'],
        },
        {
          id: 'm2',
          subtopics: ['Binary Search', 'Sliding Window'],
          completed_subtopics: ['Binary Search', 'Sliding Window'],
        },
      ],
    };

    render(
      <StatCards
        customPlan={mockPlan}
        overallProgress={0}
        topicsCompleted={0}
        studyHours={0}
        dayStreak={12}
      />
    );

    // 3 out of 4 subtopics done = 75%
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Plan Progress')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Subtopics (3/4)')).toBeInTheDocument();
    expect(screen.getByText('8/20h')).toBeInTheDocument();
    expect(screen.getByText('12h remaining')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('hides the entire strip when user has no plan and zero activity across all metrics', () => {
    const { container } = render(
      <StatCards
        customPlan={null}
        overallProgress={0}
        topicsCompleted={0}
        studyHours={0}
        dayStreak={0}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
