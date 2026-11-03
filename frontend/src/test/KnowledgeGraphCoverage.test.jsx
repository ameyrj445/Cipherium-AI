import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import KnowledgeGraphView from '../components/KnowledgeGraphView';
import { analyticsAPI } from '../services/api';
vi.mock('../services/api', () => ({ analyticsAPI: { getKnowledgeGraph: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
const nodes = [
  { id: 1, name: 'Root', status: 'mastered', category: 'Basics', description: 'Root details', bkt_probability: .9 },
  { id: 2, name: 'Next', status: 'unlocked', category: 'Basics', depth: 0, bkt_probability: .3, prerequisites: ['Root'] },
  { id: 3, name: 'Locked topic', status: 'locked', category: 'Advanced', depth: 4, blocked_by: ['Root'], prerequisites: ['Root'] },
  { id: 4, name: 'Uncategorized', status: 'locked' },
];
describe('knowledge graph branch interactions', () => {
  it('loads data, filters categories and keeps optional callbacks safe', async () => {
    analyticsAPI.getKnowledgeGraph.mockResolvedValue({ data: { nodes } });
    render(<KnowledgeGraphView />);
    expect(await screen.findByText('Tier 5: Depth Level 4')).toBeInTheDocument();
    expect(screen.getByText(/Prerequisite required/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Advanced' }));
    expect(screen.getByText('Locked topic')).toBeInTheDocument(); expect(screen.queryByRole('heading', { name: 'Root' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Take Diagnostic' }));
    fireEvent.click(screen.getByTitle('Ask AI Tutor'));
    fireEvent.click(screen.getByRole('button', { name: 'General' }));
    expect(screen.getByRole('heading', { name: 'Uncategorized' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Locked topic' })).not.toBeInTheDocument();
  });
  it('dispatches quiz and tutor actions without opening node details', async () => {
    const quiz = vi.fn(), tutor = vi.fn();
    analyticsAPI.getKnowledgeGraph.mockResolvedValue({ data: { nodes: [nodes[1]], mastered_count: 1, unlocked_count: 2, locked_count: 3 } });
    render(<KnowledgeGraphView onStartQuiz={quiz} onAskTutor={tutor} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Start Practice' }));
    fireEvent.click(screen.getByTitle('Ask AI Tutor'));
    expect(quiz).toHaveBeenCalledWith(2); expect(tutor).toHaveBeenCalledWith('Explain the core intuition and practical use cases of Next.');
    expect(screen.queryByText('Direct Prerequisite Dependencies:')).not.toBeInTheDocument();
  });
  it.each(nodes.slice(0, 3))('opens $status details, prerequisite chain, launches and closes', async (node) => {
    const quiz = vi.fn();
    analyticsAPI.getKnowledgeGraph.mockResolvedValue({ data: { nodes: [node] } });
    render(<KnowledgeGraphView onStartQuiz={quiz} />);
    const title = await screen.findByRole('heading', { name: node.name });
    fireEvent.mouseEnter(title.parentElement.parentElement); fireEvent.mouseLeave(title.parentElement.parentElement);
    fireEvent.click(title);
    expect(screen.getByText(node.status.toUpperCase())).toBeInTheDocument();
    expect(screen.getByText(node.description || 'Foundational syllabus topic in computational thinking and computer science.')).toBeInTheDocument();
    if (!node.prerequisites) expect(screen.getByText('None (Foundational Root Topic)')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Direct Prerequisite Dependencies:'));
    expect(screen.getByRole('button', { name: /Launch Diagnostic/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Launch Diagnostic/ }));
    expect(quiz).toHaveBeenCalledWith(node.id); expect(screen.queryByText('Direct Prerequisite Dependencies:')).not.toBeInTheDocument();
    fireEvent.click(title); fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('Direct Prerequisite Dependencies:')).not.toBeInTheDocument();
    fireEvent.click(title);
    fireEvent.click(screen.getByText('Direct Prerequisite Dependencies:').parentElement.parentElement.parentElement);
    expect(screen.queryByText('Direct Prerequisite Dependencies:')).not.toBeInTheDocument();
  });
  it('recovers after a rejected request when retry succeeds', async () => {
    analyticsAPI.getKnowledgeGraph.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ data: { nodes: [nodes[0]] } });
    render(<KnowledgeGraphView />);
    expect(await screen.findByText('Failed to load curriculum knowledge graph.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry Loading' }));
    expect(await screen.findByRole('heading', { name: 'Root' })).toBeInTheDocument();
    expect(screen.queryByText('Error Loading Knowledge Graph')).not.toBeInTheDocument();
    expect(analyticsAPI.getKnowledgeGraph).toHaveBeenCalledTimes(2);
  });
  it('handles a response with no graph data and can retry the request', async () => {
    analyticsAPI.getKnowledgeGraph.mockResolvedValueOnce({ data: null }).mockResolvedValueOnce({ data: {} });
    render(<KnowledgeGraphView />);
    expect(await screen.findByText('Unable to retrieve knowledge map.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry Loading' }));
    expect(await screen.findByText(/No curriculum concepts found/)).toBeInTheDocument();
    expect(analyticsAPI.getKnowledgeGraph).toHaveBeenCalledTimes(2);
  });
});
