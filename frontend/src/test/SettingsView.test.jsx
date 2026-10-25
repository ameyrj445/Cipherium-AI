import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SettingsView from '../components/SettingsView';

describe('SettingsView Component', () => {
  const mockUser = {
    id: 1,
    name: 'Alex Chen',
    email: 'alex.chen@cipherium.ai',
  };

  it('renders all four settings categories with user info', () => {
    render(
      <SettingsView
        user={mockUser}
        aiModel="gemini-2.5-flash"
        sessionExpiresAt="2026-10-26T12:00:00Z"
      />
    );

    expect(screen.getByText('Settings & Preferences')).toBeInTheDocument();
    expect(screen.getByText('Student & Academic Profile')).toBeInTheDocument();
    expect(screen.getByText('AI Intelligence & Diagnostic Hyperparameters')).toBeInTheDocument();
    expect(screen.getByText('Study Reminders & Retention Alerts')).toBeInTheDocument();
    expect(screen.getByText('Data Telemetry & Session Security')).toBeInTheDocument();

    expect(screen.getByDisplayValue('Alex Chen')).toBeInTheDocument();
    expect(screen.getByDisplayValue('alex.chen@cipherium.ai')).toBeInTheDocument();
    expect(screen.getByText('Verified Student')).toBeInTheDocument();
  });

  it('updates academic role and triggers saved feedback', () => {
    render(<SettingsView user={mockUser} />);

    const roleSelect = screen.getByDisplayValue('Full-Stack Software Engineer');
    fireEvent.change(roleSelect, { target: { value: 'Machine Learning & AI Specialist' } });

    expect(screen.getByText('Preferences saved')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Machine Learning & AI Specialist')).toBeInTheDocument();
  });

  it('triggers setAiModel when selecting intelligence tier', () => {
    const handleSetModel = vi.fn();
    render(
      <SettingsView
        user={mockUser}
        aiModel="gemini-2.5-flash"
        setAiModel={handleSetModel}
      />
    );

    const proCard = screen.getByText('Gemini 1.5 Pro');
    fireEvent.click(proCard);
    expect(handleSetModel).toHaveBeenCalledWith('gemini-1.5-pro');
  });

  it('toggles notification switches cleanly', () => {
    render(<SettingsView user={mockUser} />);

    const streakSwitch = screen.getByRole('switch', { name: /Daily Study Streak Alerts/i });
    expect(streakSwitch).toBeInTheDocument();
    expect(streakSwitch).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(streakSwitch);
    expect(screen.getByText('Preferences saved')).toBeInTheDocument();
  });

  it('calls onLogout when clicking Sign Out button', () => {
    const handleLogout = vi.fn();
    render(<SettingsView user={mockUser} onLogout={handleLogout} />);

    const signOutBtn = screen.getByRole('button', { name: /Sign Out/i });
    fireEvent.click(signOutBtn);
    expect(handleLogout).toHaveBeenCalledTimes(1);
  });
});
