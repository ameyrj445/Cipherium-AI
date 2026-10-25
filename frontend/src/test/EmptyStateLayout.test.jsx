import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from '../components/layout/EmptyState';
import { FileText } from 'lucide-react';

describe('Layout EmptyState Component', () => {
  it('renders default AlertCircle icon and text elements in normal mode', () => {
    const { container } = render(
      <EmptyState
        title="No data yet"
        message="Complete a quiz to see your analytics"
      />
    );

    expect(screen.getByText('No data yet')).toBeInTheDocument();
    expect(screen.getByText('Complete a quiz to see your analytics')).toBeInTheDocument();

    const root = container.firstChild;
    expect(root).toHaveStyle({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
    });

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('renders custom icon when provided', () => {
    const { container } = render(
      <EmptyState
        icon={<FileText data-testid="custom-icon" />}
        title="No documents"
      />
    );

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('renders action button and handles click event', () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        title="No flashcards"
        message="Create flashcards to get started"
        action={{ label: 'Create Card', onClick: handleClick }}
      />
    );

    const button = screen.getByRole('button', { name: 'Create Card' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveStyle({
      backgroundColor: '#6366F1',
      color: '#FFFFFF',
      fontSize: '14px',
      fontWeight: '600',
    });

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders compact mode with row layout, smaller icon and text', () => {
    const handleClick = vi.fn();
    const { container } = render(
      <EmptyState
        title="No items"
        message="List is empty"
        action={{ label: 'Add', onClick: handleClick }}
        compact={true}
      />
    );

    const root = container.firstChild;
    expect(root).toHaveStyle({
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px 12px',
    });

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');

    const titleEl = screen.getByText('No items');
    expect(titleEl).toHaveStyle({
      fontSize: '13px',
      fontWeight: '700',
    });

    const messageEl = screen.getByText('List is empty');
    expect(messageEl).toHaveStyle({
      fontSize: '13px',
    });

    const button = screen.getByRole('button', { name: 'Add' });
    expect(button).toHaveStyle({
      fontSize: '13px',
    });
  });

  it('merges custom styles properly', () => {
    const { container } = render(
      <EmptyState
        title="Custom styled"
        style={{ minHeight: '300px', backgroundColor: '#1E1E22' }}
      />
    );

    const root = container.firstChild;
    expect(root).toHaveStyle({
      minHeight: '300px',
      backgroundColor: '#1E1E22',
    });
  });
});
