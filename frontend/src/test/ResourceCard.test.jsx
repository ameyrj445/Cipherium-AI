import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ResourceCard from '../components/common/ResourceCard';

describe('ResourceCard Component', () => {
  const mockResource = {
    id: 'res-1',
    title: 'AVL Tree Balancing & Rotations',
    summary: 'Visual breakdown of single and double rotations.',
    url: 'https://www.youtube.com/watch?v=mock123',
    resource_type: 'video',
    estimated_minutes: 18,
    difficulty: 'Intermediate',
    recommendation_reason: 'Diagnosed gap in tree rotations.',
  };

  it('renders rich media metadata and site branding badge', () => {
    render(<ResourceCard resource={mockResource} />);

    expect(screen.getByText('AVL Tree Balancing & Rotations')).toBeInTheDocument();
    expect(screen.getByText(/YouTube Video/i)).toBeInTheDocument();
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
    expect(screen.getByText(/18 min read/i)).toBeInTheDocument();
    expect(screen.getByText('Diagnosed gap in tree rotations.')).toBeInTheDocument();
  });

  it('handles completion toggle callbacks properly', () => {
    const handleToggle = vi.fn();
    render(<ResourceCard resource={mockResource} onToggleComplete={handleToggle} isCompleted={false} />);

    const markBtn = screen.getByRole('button', { name: /Mark Done/i });
    expect(markBtn).toBeInTheDocument();

    fireEvent.click(markBtn);
    expect(handleToggle).toHaveBeenCalledTimes(1);
    expect(handleToggle).toHaveBeenCalledWith(mockResource);
  });

  it('renders open resource link with target _blank', () => {
    render(<ResourceCard resource={mockResource} />);
    const link = screen.getByRole('link', { name: /Open Resource/i });
    expect(link).toHaveAttribute('href', 'https://www.youtube.com/watch?v=mock123');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('returns null gracefully when resource is undefined', () => {
    const { container } = render(<ResourceCard resource={null} />);
    expect(container.firstChild).toBeNull();
  });
});
