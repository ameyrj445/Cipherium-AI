import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import RetentionScheduleCard from '../components/RetentionScheduleCard';
import { analyticsAPI } from '../services/api';

vi.mock('../services/api', () => ({
  analyticsAPI: {
    getRetentionSchedule: vi.fn(),
  },
}));

describe('RetentionScheduleCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading placeholder initially', () => {
    analyticsAPI.getRetentionSchedule.mockReturnValue(new Promise(() => {}));
    render(<RetentionScheduleCard onStartQuiz={() => {}} />);
    expect(screen.getByText(/Loading cognitive retention schedule/i)).toBeInTheDocument();
  });

  it('renders retention schedule items and triggers quiz action', async () => {
    const handleStartQuiz = vi.fn();
    analyticsAPI.getRetentionSchedule.mockResolvedValue({
      data: {
        total_tracked_topics: 1,
        due_for_review_count: 1,
        average_retention_rate: 0.62,
        schedule: [
          {
            topic_id: 'top-1',
            topic_name: 'Binary Search Trees',
            stability_days: 2.5,
            retention_rate: 0.58,
            retention_status: 'critical_review',
            bkt_probability: 0.70,
            recommended_quiz_type: 'adaptive',
            recommended_question_count: 5
          }
        ]
      }
    });

    render(<RetentionScheduleCard onStartQuiz={handleStartQuiz} />);

    await waitFor(() => {
      expect(screen.getByText(/Cognitive Retention & Spaced Repetition/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Binary Search Trees')).toBeInTheDocument();
    expect(screen.getByText(/Critical Review/i)).toBeInTheDocument();

    const quizButton = screen.getByRole('button', { name: /Take 3-Min Retention Quiz/i });
    fireEvent.click(quizButton);
    expect(handleStartQuiz).toHaveBeenCalled();
  });
});
