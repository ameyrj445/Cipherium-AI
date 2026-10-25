import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FlashFixCard from '../components/common/FlashFixCard';

describe('FlashFixCard Component', () => {
  it('renders topic name, plain-English diagnosis, and estimated time', () => {
    render(
      <FlashFixCard
        topicName="Binary Search Edge Cases"
        diagnosis="Identified boundary condition errors when low == high."
        estimatedTime="15 mins"
        riskScore={78}
        status="Needs Practice"
      />
    );

    expect(screen.getByText('Binary Search Edge Cases')).toBeInTheDocument();
    expect(screen.getByText('Identified boundary condition errors when low == high.')).toBeInTheDocument();
    expect(screen.getByText(/~15 mins fix/i)).toBeInTheDocument();
    expect(screen.getByText('Needs Practice')).toBeInTheDocument();
    expect(screen.getByText('78%')).toBeInTheDocument();
  });

  it('triggers onPractice callback with topic name', () => {
    const handlePractice = vi.fn();
    render(
      <FlashFixCard
        topicName="Graph Cycle Detection"
        onPractice={handlePractice}
      />
    );

    const practiceBtn = screen.getByRole('button', { name: /Start Flash Fix/i });
    fireEvent.click(practiceBtn);
    expect(handlePractice).toHaveBeenCalledTimes(1);
    expect(handlePractice).toHaveBeenCalledWith('Graph Cycle Detection');
  });
});
