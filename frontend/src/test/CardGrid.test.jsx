import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CardGrid from '../components/layout/CardGrid';

describe('CardGrid Component', () => {
  it('renders children properly', () => {
    render(
      <CardGrid>
        <div data-testid="card-1">Card 1</div>
        <div data-testid="card-2">Card 2</div>
      </CardGrid>
    );

    expect(screen.getByTestId('card-1')).toBeInTheDocument();
    expect(screen.getByTestId('card-2')).toBeInTheDocument();
  });

  it('applies default responsive auto-fill and gap styles', () => {
    const { container } = render(
      <CardGrid>
        <div>Content</div>
      </CardGrid>
    );

    const grid = container.firstChild;
    expect(grid).toHaveStyle({
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
      gap: '24px',
      width: '100%',
    });
  });

  it('supports custom minWidth and gap', () => {
    const { container } = render(
      <CardGrid minWidth={280} gap={16}>
        <div>Content</div>
      </CardGrid>
    );

    const grid = container.firstChild;
    expect(grid).toHaveStyle({
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '16px',
    });
  });

  it('supports fixed columns override instead of auto-fill', () => {
    const { container } = render(
      <CardGrid columns={3} gap={32}>
        <div>Content</div>
      </CardGrid>
    );

    const grid = container.firstChild;
    expect(grid).toHaveStyle({
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '32px',
    });
  });

  it('allows custom className and style merge', () => {
    const { container } = render(
      <CardGrid className="custom-card-grid" style={{ padding: '20px' }}>
        <div>Content</div>
      </CardGrid>
    );

    const grid = container.firstChild;
    expect(grid).toHaveClass('custom-card-grid');
    expect(grid).toHaveStyle({
      padding: '20px',
      display: 'grid',
    });
  });
});
