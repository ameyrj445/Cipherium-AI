import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationDropdown from '../components/common/NotificationDropdown';

describe('NotificationDropdown Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders bell button with unread count badge', () => {
    render(<NotificationDropdown user={{ email: 'test@example.com' }} />);
    const bellBtn = screen.getByRole('button', { name: /notifications/i });
    expect(bellBtn).toBeInTheDocument();

    // Default notifications include 3 unread
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('opens notification popover when bell button is clicked', () => {
    render(<NotificationDropdown user={{ email: 'test@example.com' }} />);
    const bellBtn = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(bellBtn);

    expect(screen.getByRole('dialog', { name: /notification center/i })).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText(/Keep Your Daily Streak Active!/i)).toBeInTheDocument();
  });

  it('marks all notifications as read when "Mark all read" is clicked', () => {
    render(<NotificationDropdown user={{ email: 'test@example.com' }} />);
    const bellBtn = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(bellBtn);

    const markAllBtn = screen.getByRole('button', { name: /mark all read/i });
    fireEvent.click(markAllBtn);

    // Unread count badge should disappear
    expect(screen.queryByText('3 new')).not.toBeInTheDocument();
    expect(screen.queryByText('Mark all read')).not.toBeInTheDocument();
  });

  it('filters notifications by "All" and "Unread" tabs', () => {
    render(<NotificationDropdown user={{ email: 'test@example.com' }} />);
    const bellBtn = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(bellBtn);

    const unreadTab = screen.getByRole('button', { name: /unread/i });
    fireEvent.click(unreadTab);

    // Default unread items: ML alert, Streak, DP quiz (3 items)
    expect(screen.getByText(/ML Flash Fix: Binary Search Trees/i)).toBeInTheDocument();
    expect(screen.getByText(/Keep Your Daily Streak Active!/i)).toBeInTheDocument();

    // Read item should not be in unread tab
    expect(screen.queryByText(/Milestone Progress: Arrays & Two Pointers/i)).not.toBeInTheDocument();

    const allTab = screen.getByRole('button', { name: /^all/i });
    fireEvent.click(allTab);
    expect(screen.getByText(/Milestone Progress: Arrays & Two Pointers/i)).toBeInTheDocument();
  });

  it('clicks a notification to mark as read and navigate to target view', () => {
    const handleNavigate = vi.fn();
    render(
      <NotificationDropdown
        user={{ email: 'test@example.com' }}
        onNavigate={handleNavigate}
      />
    );

    const bellBtn = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(bellBtn);

    const notifItem = screen.getByText(/ML Flash Fix: Binary Search Trees/i);
    fireEvent.click(notifItem);

    expect(handleNavigate).toHaveBeenCalledWith('Practice', { topic: 'Binary Search Trees' });
    expect(screen.queryByRole('dialog', { name: /notification center/i })).not.toBeInTheDocument();
  });

  it('dismisses a single notification', () => {
    render(<NotificationDropdown user={{ email: 'test@example.com' }} />);
    const bellBtn = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(bellBtn);

    expect(screen.getByText(/Keep Your Daily Streak Active!/i)).toBeInTheDocument();
    const dismissButtons = screen.getAllByTitle('Dismiss');
    fireEvent.click(dismissButtons[1]); // Dismiss second notification (Streak)

    expect(screen.queryByText(/Keep Your Daily Streak Active!/i)).not.toBeInTheDocument();
  });

  it('clears all notifications and displays empty state', () => {
    render(<NotificationDropdown user={{ email: 'test@example.com' }} />);
    const bellBtn = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(bellBtn);

    const clearAllBtn = screen.getByRole('button', { name: /clear all/i });
    fireEvent.click(clearAllBtn);

    expect(screen.getByText(/All caught up! 🎉/i)).toBeInTheDocument();
  });

  it('opens settings when "Notification Preferences" is clicked', () => {
    const handleOpenSettings = vi.fn();
    render(
      <NotificationDropdown
        user={{ email: 'test@example.com' }}
        onOpenSettings={handleOpenSettings}
      />
    );

    const bellBtn = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(bellBtn);

    const settingsBtn = screen.getByRole('button', { name: /notification preferences/i });
    fireEvent.click(settingsBtn);

    expect(handleOpenSettings).toHaveBeenCalled();
  });
});
