import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import TutorPanel from '../components/TutorPanel';

const state = (overrides = {}) => ({
  items: [{ id: 7, title: 'Binary search proof' }, { id: 8, title: 'A very long conversation title '.repeat(8) }],
  activeId: 7, listLoading: false, listError: '', hasMore: true,
  loadingMessages: false, error: '', creating: false,
  select: vi.fn(), refresh: vi.fn(), loadMore: vi.fn(), showLegacy: vi.fn(), ...overrides,
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('Persistent tutor conversation controls', () => {
  it('uses real conversation buttons with selection and pagination, not sample inquiries', () => {
    const conversations = state();
    render(<TutorPanel conversations={conversations} />);
    expect(screen.queryByText('Two Sum vs Sliding Window')).not.toBeInTheDocument();
    const selected = screen.getByRole('button', { name: 'Open conversation: Binary search proof' });
    expect(selected).toHaveAttribute('aria-current', 'true');
    fireEvent.click(selected);
    expect(conversations.select).toHaveBeenCalledWith(7);
    fireEvent.click(screen.getByRole('button', { name: 'Load more conversations' }));
    expect(conversations.loadMore).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Refresh conversations' }));
    expect(conversations.refresh).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Earlier history (read-only)' }));
    expect(conversations.showLegacy).toHaveBeenCalledOnce();
  });

  it('announces errors and loading, disables duplicate list requests and composer while loading', () => {
    const send = vi.fn();
    render(<TutorPanel conversations={state({ listLoading: true, listError: 'Cannot load conversations', loadingMessages: true, error: 'History unavailable' })} chatInput="Hello" handleSendChat={send} />);
    expect(screen.getByText('Cannot load conversations')).toHaveAttribute('role', 'alert');
    expect(screen.getByText('History unavailable')).toHaveAttribute('role', 'alert');
    expect(screen.getByText('Loading conversation…')).toHaveAttribute('role', 'status');
    expect(screen.getByRole('button', { name: 'Refresh conversations' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Load more conversations' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Message the tutor' })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    fireEvent.submit(screen.getByRole('textbox').closest('form'));
    expect(send).not.toHaveBeenCalled();
  });

  it('shows legacy history as read-only and offers a new conversation', () => {
    const clear = vi.fn();
    render(<TutorPanel conversations={state({ activeId: 'legacy' })} onClearHistory={clear} chatInput="Hello" />);
    expect(screen.getByText(/oldest 30 messages across all chats/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'New Conversation', exact: true }));
    expect(clear).toHaveBeenCalledOnce();
  });

  it('shows start guidance and blocks composer while creating', () => {
    render(<TutorPanel conversations={state({ activeId: null, creating: true })} chatInput="Hello" />);
    expect(screen.getByText(/Start a new conversation or select a saved conversation/)).toBeInTheDocument();
    expect(screen.getByText('Creating conversation…')).toHaveAttribute('role', 'status');
    expect(screen.getByRole('button', { name: 'New Conversation', exact: true })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
  });

  it('shows empty and untitled states without crashing', () => {
    const { rerender } = render(<TutorPanel conversations={state({ items: [], hasMore: false })} />);
    expect(screen.getByText(/No saved conversations yet/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load more conversations' })).not.toBeInTheDocument();
    rerender(<TutorPanel conversations={state({ items: [{ id: 5 }] })} />);
    expect(screen.getByRole('button', { name: 'Open conversation: Untitled conversation' })).toBeInTheDocument();
  });

  it('starts narrow screens collapsed with accessible toggles and hides panel controls when closed', () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener, removeEventListener })));
    const conversations = state();
    const { unmount } = render(<TutorPanel conversations={conversations} />);
    const show = screen.getByRole('button', { name: 'Show conversations and topics' });
    expect(show).toHaveAttribute('aria-controls', 'tutor-conversation-panel');
    expect(show).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: 'Open conversation: Binary search proof' })).not.toBeInTheDocument();
    fireEvent.click(show);
    fireEvent.click(screen.getByRole('button', { name: 'Open conversation: Binary search proof' }));
    expect(conversations.select).toHaveBeenCalledWith(7);
    expect(screen.getByRole('button', { name: 'Show conversations and topics' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open conversation: Binary search proof' })).not.toBeInTheDocument();
    unmount();
    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
