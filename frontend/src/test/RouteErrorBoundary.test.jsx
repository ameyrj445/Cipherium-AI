import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ErrorBoundary from '../components/ErrorBoundary';

const Crash = () => { throw new Error('Private diagnostic detail'); };

afterEach(() => vi.unstubAllEnvs());

describe('view error recovery', () => {
  it('keeps surrounding navigation available after a view fails', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { rerender } = render(<><nav>Workspace navigation</nav><ErrorBoundary key="broken" scope="view"><Crash /></ErrorBoundary></>);
      expect(screen.getByRole('alert')).toHaveTextContent('This page could not be displayed');
      expect(screen.getByText('Workspace navigation')).toBeInTheDocument();
      rerender(<><nav>Workspace navigation</nav><ErrorBoundary key="healthy" scope="view"><div>Healthy page</div></ErrorBoundary></>);
      expect(screen.getByText('Healthy page')).toBeInTheDocument();
    } finally { consoleSpy.mockRestore(); }
  });

  it('retries a failed view without reloading the entire application', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let shouldCrash = true;
    const ConditionalView = () => shouldCrash ? <Crash /> : <div>Recovered view</div>;
    try {
      render(<ErrorBoundary scope="view"><ConditionalView /></ErrorBoundary>);
      shouldCrash = false;
      fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
      expect(screen.getByText('Recovered view')).toBeInTheDocument();
    } finally { consoleSpy.mockRestore(); }
  });

  it('shows details in development but hides them in production', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      vi.stubEnv('DEV', true);
      const { unmount } = render(<ErrorBoundary scope="view"><Crash /></ErrorBoundary>);
      expect(screen.getByText('Private diagnostic detail')).toBeInTheDocument();
      unmount();
      vi.stubEnv('DEV', false);
      render(<ErrorBoundary scope="view"><Crash /></ErrorBoundary>);
      expect(screen.queryByText('Private diagnostic detail')).not.toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    } finally { consoleSpy.mockRestore(); }
  });
});
