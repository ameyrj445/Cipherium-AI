import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HeroBanner from '../components/HeroBanner';

describe('HeroBanner Component (Streamlined Slim Layout)', () => {
  it('renders onboarding card when no custom plan exists', () => {
    render(<HeroBanner customPlan={null} onContinueLearning={() => {}} onViewStudyPlan={() => {}} />);

    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.getByText('Create your first study plan')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create study plan/i })).toBeInTheDocument();
  });

  it('renders active roadmap state and single Continue Learning button when plan exists', () => {
    const mockPlan = {
      subject: 'Data Structures & Algorithms',
    };

    render(<HeroBanner customPlan={mockPlan} onContinueLearning={() => {}} onViewStudyPlan={() => {}} />);

    expect(screen.getByText('Active Roadmap')).toBeInTheDocument();
    expect(screen.getByText('Data Structures & Algorithms')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue learning/i })).toBeInTheDocument();
  });

  it('triggers onContinueLearning callback when Continue Learning button is clicked', () => {
    const handleContinue = vi.fn();
    const mockPlan = { subject: 'Operating Systems' };

    render(<HeroBanner customPlan={mockPlan} onContinueLearning={handleContinue} onViewStudyPlan={() => {}} />);

    const continueBtn = screen.getByRole('button', { name: /continue learning/i });
    fireEvent.click(continueBtn);

    expect(handleContinue).toHaveBeenCalledTimes(1);
  });

  it('triggers onViewStudyPlan callback when Create Study Plan button is clicked in onboarding mode', () => {
    const handleViewPlan = vi.fn();
    render(<HeroBanner customPlan={null} onContinueLearning={() => {}} onViewStudyPlan={handleViewPlan} />);

    const createPlanBtn = screen.getByRole('button', { name: /create study plan/i });
    fireEvent.click(createPlanBtn);

    expect(handleViewPlan).toHaveBeenCalledTimes(1);
  });
});
