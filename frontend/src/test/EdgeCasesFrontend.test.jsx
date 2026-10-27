import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ActivityHeatmap from '../components/ActivityHeatmap';
import CompetencyRadarChart from '../components/CompetencyRadarChart';
import RetentionScheduleCard from '../components/RetentionScheduleCard';
import KnowledgeGraphView from '../components/KnowledgeGraphView';
import { analyticsAPI, tutorAPI } from '../services/api';

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    analyticsAPI: {
      getRetentionSchedule: vi.fn(),
      getKnowledgeGraph: vi.fn(),
      getActivityHeatmap: vi.fn(),
    },
  };
});

describe('Frontend Edge Cases - ActivityHeatmap', () => {
  it('safely renders when heatmapData is null or undefined', () => {
    const { container } = render(
      <ActivityHeatmap heatmapData={null} totalActivities={0} currentStreak={0} longestStreak={0} />
    );
    expect(screen.getByText(/Annual Practice Activity Matrix/i)).toBeInTheDocument();
    expect(container).toBeDefined();
  });

  it('safely handles sparse or null day elements in heatmapData', () => {
    const sparseData = [null, { date: '2026-05-01', count: null, level: undefined }, { date: '2026-05-02' }];
    render(<ActivityHeatmap heatmapData={sparseData} />);
    expect(screen.getByText(/Annual Practice Activity Matrix/i)).toBeInTheDocument();
  });
});

describe('Frontend Edge Cases - CompetencyRadarChart', () => {
  it('returns null for non-array or malformed data', () => {
    const { container: c1 } = render(<CompetencyRadarChart radarData={null} />);
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(<CompetencyRadarChart radarData="invalid" />);
    expect(c2.firstChild).toBeNull();
  });

  it('sanitizes radar items with missing scores, NaNs, or missing categories', () => {
    const malformed = [
      { category: null, score: 'invalid' },
      { category: 'Networking', score: NaN },
      { category: 'Algorithms', score: 150 },
    ];
    render(<CompetencyRadarChart radarData={malformed} />);
    expect(screen.getByText(/Curriculum Domain Competency Radar/i)).toBeInTheDocument();
  });
});

describe('Frontend Edge Cases - RetentionScheduleCard', () => {
  it('renders helpful empty state when schedule is empty', async () => {
    analyticsAPI.getRetentionSchedule.mockResolvedValueOnce({
      data: {
        due_today_count: 0,
        schedule: [],
      },
    });

    render(<RetentionScheduleCard onStartQuiz={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText(/No learning topics scheduled yet/i)).toBeInTheDocument();
    });
  });

  it('gracefully handles missing retention metrics without NaN crashes', async () => {
    analyticsAPI.getRetentionSchedule.mockResolvedValueOnce({
      data: {
        due_today_count: null,
        schedule: [
          {
            topic_id: 1,
            topic_name: 'Edge Case Mastery',
            topic_code: 'ECM101',
            retention_status: 'review_recommended',
            retention_rate: null,
            bkt_probability: undefined,
            attempt_count: undefined,
          },
        ],
      },
    });

    render(<RetentionScheduleCard onStartQuiz={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText('Edge Case Mastery')).toBeInTheDocument();
      expect(screen.getByText(/0 attempts/i)).toBeInTheDocument();
    });
  });
});

describe('Frontend Edge Cases - KnowledgeGraphView', () => {
  it('renders graceful empty state when category filter yields 0 nodes', async () => {
    analyticsAPI.getKnowledgeGraph.mockResolvedValueOnce({
      data: {
        nodes: [],
        edges: [],
        mastered_count: 0,
        unlocked_count: 0,
        locked_count: 0,
      },
    });

    render(<KnowledgeGraphView onStartQuiz={() => {}} onAskTutor={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText(/No curriculum concepts found for category "All"/i)).toBeInTheDocument();
    });
  });
});

describe('Frontend Edge Cases - API streamMessage', () => {
  it('handles non-200 responses and surfaces detail message', async () => {
    const globalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({ detail: 'Question message cannot be empty.' }),
    });

    let caughtError = null;
    await tutorAPI.streamMessage(
      { message: '   ' },
      () => {},
      () => {},
      (err) => {
        caughtError = err;
      }
    );

    expect(caughtError).toBeDefined();
    expect(caughtError.message).toBe('Question message cannot be empty.');

    global.fetch = globalFetch;
  });

  it('handles AbortError without firing error handler', async () => {
    const globalFetch = global.fetch;
    const abortErr = new Error('The operation was aborted');
    abortErr.name = 'AbortError';

    global.fetch = vi.fn().mockRejectedValueOnce(abortErr);

    let errorFired = false;
    await tutorAPI.streamMessage(
      { message: 'Hello' },
      () => {},
      () => {},
      () => {
        errorFired = true;
      }
    );

    expect(errorFired).toBe(false);

    global.fetch = globalFetch;
  });
});
