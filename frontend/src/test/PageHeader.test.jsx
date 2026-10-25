import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PageHeader from '../components/layout/PageHeader';

describe('PageHeader Component', () => {
  it('renders required title properly as an h1 heading', () => {
    render(<PageHeader title="Curated Learning & Practice Library" />);

    const heading = screen.getByRole('heading', { level: 1, name: 'Curated Learning & Practice Library' });
    expect(heading).toBeInTheDocument();
    expect(heading.style.fontSize).toBe('24px');
    expect(heading.style.fontWeight).toBe('800');
    expect(heading.style.letterSpacing).toBe('-0.02em');
    expect(heading.style.margin).toBe('0px');
  });

  it('renders eyebrow when provided', () => {
    render(
      <PageHeader
        eyebrow="CURATED LEARNING REPOSITORY"
        title="Curated Learning"
      />
    );

    const eyebrowEl = screen.getByText('CURATED LEARNING REPOSITORY');
    expect(eyebrowEl).toBeInTheDocument();
    expect(eyebrowEl.style.fontSize).toBe('12px');
    expect(eyebrowEl.style.fontWeight).toBe('800');
    expect(eyebrowEl.style.textTransform).toBe('uppercase');
    expect(eyebrowEl.style.letterSpacing).toBe('0.06em');
    expect(eyebrowEl.style.color).toBe('var(--primary-brand, #6366F1)');
  });

  it('does not render eyebrow when omitted', () => {
    const { container } = render(<PageHeader title="Simple Title" />);
    expect(container.querySelector('span')).toBeNull();
  });

  it('renders description subtitle when provided', () => {
    render(
      <PageHeader
        title="Curated Learning"
        description="Ranked by pedagogical relevance, difficulty alignment, and diagnosed knowledge gaps."
      />
    );

    const descEl = screen.getByText(/Ranked by pedagogical relevance/i);
    expect(descEl).toBeInTheDocument();
    expect(descEl).toHaveStyle({
      fontSize: '14px',
      marginTop: '4px',
    });
  });

  it('does not render description when omitted', () => {
    const { container } = render(<PageHeader title="Simple Title" />);
    expect(container.querySelector('p')).toBeNull();
  });

  it('renders actions as-is on the right side', () => {
    render(
      <PageHeader
        title="Dashboard"
        actions={<button type="button" data-testid="action-btn">Export Data</button>}
      />
    );

    expect(screen.getByTestId('action-btn')).toBeInTheDocument();
  });

  it('applies standard container flex layout styles', () => {
    const { container } = render(
      <PageHeader
        title="Settings & Preferences"
        eyebrow="ACCOUNT CONFIG"
      />
    );

    const root = container.firstChild;
    expect(root).toHaveStyle({
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      gap: '16px',
      marginBottom: '24px',
    });
  });

  it('supports custom className and style merge', () => {
    const { container } = render(
      <PageHeader
        title="Custom Header"
        className="custom-page-header"
        style={{ padding: '16px', opacity: '0.9' }}
      />
    );

    const root = container.firstChild;
    expect(root).toHaveClass('custom-page-header');
    expect(root).toHaveStyle({
      padding: '16px',
      opacity: '0.9',
      marginBottom: '24px',
    });
  });
});
