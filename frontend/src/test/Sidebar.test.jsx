import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '../components/Sidebar';

describe('Sidebar Navigation Component', () => {
  it('renders branding and primary navigation links in expanded view', () => {
    render(
      <Sidebar
        activeNav="Dashboard"
        setActiveNav={() => {}}
        handleOpenQuiz={() => {}}
        user={{ name: 'Amey Jain', email: 'student@cipherium.ai' }}
        width={220}
      />
    );

    expect(screen.getByText('Cipherium AI')).toBeInTheDocument();
    expect(screen.getByText('Academic Mastery')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Learn')).toBeInTheDocument();
    expect(screen.getByText('Practice')).toBeInTheDocument();
    expect(screen.getByText('Study Plan')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Resources')).toBeInTheDocument();
    expect(screen.getByText('AI Tutor')).toBeInTheDocument();
  });

  it('invokes setActiveNav when a navigation button is clicked', () => {
    const handleNav = vi.fn();
    render(
      <Sidebar
        activeNav="Dashboard"
        setActiveNav={handleNav}
        handleOpenQuiz={() => {}}
        user={null}
        width={220}
      />
    );

    const analyticsBtn = screen.getByRole('button', { name: /analytics/i });
    fireEvent.click(analyticsBtn);

    expect(handleNav).toHaveBeenCalledWith('Analytics');
  });

  it('triggers handleOpenQuiz when Practice navigation item is clicked', () => {
    const handleNav = vi.fn();
    const handleQuiz = vi.fn();

    render(
      <Sidebar
        activeNav="Dashboard"
        setActiveNav={handleNav}
        handleOpenQuiz={handleQuiz}
        user={null}
        width={220}
      />
    );

    const practiceBtn = screen.getByRole('button', { name: /practice/i });
    fireEvent.click(practiceBtn);

    expect(handleNav).toHaveBeenCalledWith('Practice');
    expect(handleQuiz).toHaveBeenCalledTimes(1);
  });
});
