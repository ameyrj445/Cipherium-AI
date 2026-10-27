import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GlobalSearch from '../components/common/GlobalSearch';

describe('GlobalSearch Component', () => {
  const sampleTopics = [
    { id: '1', name: 'Binary Search Trees', category: 'Data Structures' },
    { id: '2', name: 'Dynamic Programming', category: 'Algorithms' },
  ];

  const samplePlan = {
    id: 'p1',
    subject: 'Data Structures & Algorithms',
    milestones: [
      { id: 'm1', title: 'Binary Search Variants', subtopics: ['Lower Bound', 'Rotated Array'] },
    ],
  };

  it('renders search input with placeholder and shortcut badge', () => {
    render(<GlobalSearch />);
    const input = screen.getByRole('textbox', { name: /search topics/i });
    expect(input).toBeInTheDocument();
    expect(screen.getByText('/')).toBeInTheDocument();
  });

  it('opens dropdown and displays quick tools when input is focused with empty query', () => {
    render(<GlobalSearch topics={sampleTopics} />);
    const input = screen.getByRole('textbox', { name: /search topics/i });
    fireEvent.focus(input);

    expect(screen.getByText('Quick Navigation & Tools')).toBeInTheDocument();
    expect(screen.getByText('Popular Curriculum Topics')).toBeInTheDocument();
  });

  it('filters results across views, topics, and study plan milestones when query is entered', () => {
    render(
      <GlobalSearch
        topics={sampleTopics}
        customPlan={samplePlan}
      />
    );

    const input = screen.getByRole('textbox', { name: /search topics/i });
    fireEvent.change(input, { target: { value: 'binary' } });

    // Should find the topic
    expect(screen.getByText('Binary Search Trees')).toBeInTheDocument();
    // Should find the milestone
    expect(screen.getByText('Binary Search Variants')).toBeInTheDocument();
    expect(screen.getByText(/MATCHING RESULTS/i)).toBeInTheDocument();
  });

  it('calls onNavigate with appropriate target when a result is clicked', () => {
    const handleNavigate = vi.fn();
    render(
      <GlobalSearch
        topics={sampleTopics}
        onNavigate={handleNavigate}
      />
    );

    const input = screen.getByRole('textbox', { name: /search topics/i });
    fireEvent.change(input, { target: { value: 'analytics' } });

    const viewResult = screen.getByText('Analytics');
    fireEvent.click(viewResult);

    expect(handleNavigate).toHaveBeenCalledWith('Analytics');
  });

  it('clears query when clear button is clicked', () => {
    render(<GlobalSearch topics={sampleTopics} />);
    const input = screen.getByRole('textbox', { name: /search topics/i });
    fireEvent.change(input, { target: { value: 'graph' } });

    expect(input.value).toBe('graph');
    const clearBtn = screen.getByTitle('Clear search');
    fireEvent.click(clearBtn);

    expect(input.value).toBe('');
  });

  it('navigates through results using keyboard ArrowDown and Enter', () => {
    const handleNavigate = vi.fn();
    render(
      <GlobalSearch
        topics={sampleTopics}
        onNavigate={handleNavigate}
      />
    );

    const input = screen.getByRole('textbox', { name: /search topics/i });
    fireEvent.change(input, { target: { value: 'dynamic' } });

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(handleNavigate).toHaveBeenCalledWith('Practice', { topic: 'Dynamic Programming' });
  });

  it('renders helpful empty state when no results match query', () => {
    render(<GlobalSearch topics={sampleTopics} />);
    const input = screen.getByRole('textbox', { name: /search topics/i });
    fireEvent.change(input, { target: { value: 'xyzunknownterm' } });

    expect(screen.getByText(/No matches found for/i)).toBeInTheDocument();
  });

  it('closes dropdown when Escape key is pressed', () => {
    render(<GlobalSearch topics={sampleTopics} />);
    const input = screen.getByRole('textbox', { name: /search topics/i });
    fireEvent.focus(input);

    expect(screen.getByText('Quick Navigation & Tools')).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByText('Quick Navigation & Tools')).not.toBeInTheDocument();
  });
});
