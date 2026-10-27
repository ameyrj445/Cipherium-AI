import React from 'react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../components/ErrorBoundary';

const FaultyComponent = () => {
  throw new Error('Simulation of catastrophic React render crash');
};

const HealthyComponent = () => <div>Healthy Workspace Content</div>;

describe('ErrorBoundary Component', () => {
  // Suppress console.error during deliberate error throwing
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children undisturbed when no runtime errors occur', () => {
    render(
      <ErrorBoundary>
        <HealthyComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Healthy Workspace Content')).toBeInTheDocument();
  });

  it('catches render exceptions and presents a clean recovery dialog', () => {
    render(
      <ErrorBoundary>
        <FaultyComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByText(/An unexpected interface error occurred/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload application/i })).toBeInTheDocument();
  });
});
