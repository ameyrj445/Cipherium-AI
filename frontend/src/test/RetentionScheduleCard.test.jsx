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
  // Style contracts only: JSDOM cannot prove browser geometry or zoom reflow.
  it('allows the empty schedule grid to shrink below its desktop track minimum', async () => {
    analyticsAPI.getRetentionSchedule.mockResolvedValue({ data: { schedule: [] } });
    render(<RetentionScheduleCard />);
    const empty = await screen.findByText(/No learning topics scheduled yet/);
    expect(empty.parentElement.style.gridTemplateColumns).toBe('repeat(auto-fill, minmax(min(290px, 100%), 1fr))');
    expect(empty.closest('.glass-panel')).toHaveStyle({ minWidth: 0, overflowWrap: 'anywhere' });
  });

  it('keeps long topic text and review actions in shrinkable wrapping cards', async () => {
    const name = 'UnbrokenTopicName'.repeat(20);
    const code = 'LONGCODE'.repeat(15);
    const onStartQuiz = vi.fn();
    analyticsAPI.getRetentionSchedule.mockResolvedValue({ data: {
      due_today_count: 1,
      schedule: [{ topic_id: 'long-topic', topic_name: name, topic_code: code,
        retention_status: 'review_recommended', retention_rate: 0.7,
        bkt_probability: 0.9, attempt_count: 123456789 }],
    } });
    render(<RetentionScheduleCard onStartQuiz={onStartQuiz} />);
    const heading = await screen.findByRole('heading', { name });
    expect(heading.parentElement.parentElement).toHaveStyle({ minWidth: 0 });
    expect(screen.getByText(code).parentElement).toHaveStyle({ flexWrap: 'wrap' });
    expect(screen.getByText('Memory Retention Curve').parentElement).toHaveStyle({ flexWrap: 'wrap' });
    expect(screen.getByText('123456789 attempts').parentElement).toHaveStyle({ flexWrap: 'wrap' });
    expect(screen.getByRole('heading', { level: 3 })).toHaveStyle({ flexWrap: 'wrap' });
    const button = screen.getByRole('button', { name: /Take 3-Min Retention Quiz/ });
    expect(button).toHaveStyle({ whiteSpace: 'normal', flexWrap: 'wrap', minWidth: 0 });
    fireEvent.click(button);
    expect(onStartQuiz).toHaveBeenCalledWith('long-topic');
  });

});
