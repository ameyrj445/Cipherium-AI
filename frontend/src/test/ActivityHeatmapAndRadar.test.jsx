import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ActivityHeatmap from '../components/ActivityHeatmap';
import CompetencyRadarChart from '../components/CompetencyRadarChart';

describe('ActivityHeatmap Component', () => {
  const sampleData = [
    { date: '2026-01-01', count: 0, level: 0 },
    { date: '2026-01-02', count: 3, level: 2 },
    { date: '2026-01-03', count: 12, level: 4 },
  ];

  it('renders telemetry stats and activity header', () => {
    render(
      <ActivityHeatmap
        heatmapData={sampleData}
        totalActivities={15}
        currentStreak={4}
        longestStreak={12}
      />
    );

    expect(screen.getByText(/Annual Practice Activity Matrix/i)).toBeInTheDocument();
    expect(screen.getByText(/15 total diagnostic quizzes/i)).toBeInTheDocument();
    expect(screen.getByText(/4 days/i)).toBeInTheDocument();
    expect(screen.getByText(/12 days/i)).toBeInTheDocument();
  });
});

describe('CompetencyRadarChart Component', () => {
  it('returns null when radar data is empty', () => {
    const { container } = render(<CompetencyRadarChart radarData={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders header when radar data is present', () => {
    const mockRadar = [
      { category: 'Data Structures', score: 85, fullMark: 100 },
      { category: 'Algorithms', score: 70, fullMark: 100 },
    ];
    render(<CompetencyRadarChart radarData={mockRadar} />);
    expect(screen.getByText(/Curriculum Domain Competency Radar/i)).toBeInTheDocument();
  });
});
