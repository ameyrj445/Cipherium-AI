import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import KnowledgeGraphView from '../components/KnowledgeGraphView';
import { analyticsAPI } from '../services/api';

vi.mock('../services/api', () => ({
  analyticsAPI: {
    getKnowledgeGraph: vi.fn(),
  },
}));

describe('KnowledgeGraphView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    analyticsAPI.getKnowledgeGraph.mockReturnValue(new Promise(() => {}));
    render(<KnowledgeGraphView onOpenTopic={() => {}} onOpenQuiz={() => {}} />);
    expect(screen.getByText(/Computing Curriculum Directed Acyclic Graph/i)).toBeInTheDocument();
  });

  it('renders graph header, tiers and nodes when data arrives', async () => {
    analyticsAPI.getKnowledgeGraph.mockResolvedValue({
      data: {
        total_nodes: 2,
        max_depth: 1,
        cycles_detected: false,
        nodes: [
          {
            id: 'node-1',
            name: 'Arrays',
            category: 'Data Structures',
            depth: 0,
            status: 'mastered',
            bkt_probability: 0.95,
            mastery_score: 95,
            prerequisites: [],
            blocked_by: []
          },
          {
            id: 'node-2',
            name: 'Linked Lists',
            category: 'Data Structures',
            depth: 1,
            status: 'unlocked',
            bkt_probability: 0.5,
            mastery_score: 50,
            prerequisites: ['node-1'],
            blocked_by: []
          }
        ],
        edges: [{ source: 'node-1', target: 'node-2' }]
      }
    });

    render(<KnowledgeGraphView onOpenTopic={() => {}} onOpenQuiz={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/Interactive Knowledge Map/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Arrays')).toBeInTheDocument();
    expect(screen.getByText('Linked Lists')).toBeInTheDocument();
    expect(screen.getByText(/Foundational Roots/i)).toBeInTheDocument();
  });
});
