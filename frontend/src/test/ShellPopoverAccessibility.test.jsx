import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { axe } from 'jest-axe';
import GlobalSearch from '../components/common/GlobalSearch';
import NotificationDropdown from '../components/common/NotificationDropdown';

const scan = async (container) => expect((await axe(container)).violations).toEqual([]);
describe('shared shell popover accessibility', () => {
  beforeEach(() => localStorage.clear());
  it('scans quick suggestions, matching options and no-match fallback', async () => {
    const { container } = render(<GlobalSearch />);
    const input = screen.getByRole('combobox');
    act(() => input.focus());
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await scan(container);
    fireEvent.change(input, { target: { value: 'a' } });
    const options = screen.getAllByRole('option');
    expect(screen.getByRole('status')).toHaveTextContent(`${options.length} matching results`);
    expect(input).toHaveAttribute('aria-controls', screen.getByRole('listbox').id);
    expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input).toHaveAttribute('aria-activedescendant', options[1].id);
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    await scan(container);
    fireEvent.change(input, { target: { value: 'no-match-unique' } });
    expect(input).not.toHaveAttribute('aria-activedescendant');
    expect(screen.getByRole('status')).toHaveTextContent('No matching results');
    await scan(container);
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input).toHaveFocus();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
  it('closes search when tabbing outside but keeps quick navigation usable', () => {
    render(<><GlobalSearch /><button>Outside</button></>);
    const input = screen.getByRole('combobox');
    act(() => input.focus());
    act(() => screen.getByRole('button', { name: 'Dashboard' }).focus());
    expect(screen.getByRole('region')).toBeInTheDocument();
    act(() => screen.getByRole('button', { name: 'Outside' }).focus());
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
  it('exposes each notification as a native action independent of dismiss', async () => {
    const onNavigate = vi.fn();
    const { container } = render(<NotificationDropdown user={{ email: 'qa@example.com' }} onNavigate={onNavigate} />);
    const bell = screen.getByRole('button', { name: 'Notifications' });
    fireEvent.click(bell);
    const action = screen.getByRole('button', { name: /^ML Flash Fix:/ });
    expect(action.tagName).toBe('BUTTON');
    expect(screen.getByRole('button', { name: /^All / })).toHaveAttribute('aria-pressed', 'true');
    await scan(container);
    fireEvent.click(action);
    expect(bell).toHaveFocus();
    expect(onNavigate).toHaveBeenCalledWith('Practice', { topic: 'Binary Search Trees' });
    fireEvent.click(bell);
    act(() => screen.getByRole('button', { name: /^Dismiss ML Flash Fix:/ }).focus());
    fireEvent.keyDown(document.activeElement, { key: 'Escape' });
    expect(bell).toHaveFocus();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('keeps focus in the panel when dismiss/read/clear removes the active control', () => {
    render(<NotificationDropdown user={{ email: 'qa@example.com' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    const panel = screen.getByRole('dialog');
    const dismiss = screen.getByRole('button', { name: /^Dismiss ML Flash Fix:/ });
    act(() => dismiss.focus());
    fireEvent.click(dismiss);
    expect(panel).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: /Mark all read/ }));
    expect(panel).toHaveFocus();
    expect(screen.queryByRole('button', { name: /Mark all read/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Clear all/ }));
    expect(panel).toHaveFocus();
    expect(screen.queryByRole('button', { name: /Clear all/ })).not.toBeInTheDocument();
  });

  it('preserves input focus on option mousedown so clicking can select before blur', () => {
    const onNavigate = vi.fn();
    render(<GlobalSearch onNavigate={onNavigate} />);
    const input = screen.getByRole('combobox');
    act(() => input.focus());
    fireEvent.change(input, { target: { value: 'analytics' } });
    const option = screen.getByRole('option');
    // A canceled mousedown prevents the browser's default input blur/unmount.
    expect(fireEvent.mouseDown(option)).toBe(false);
    expect(input).toHaveFocus();
    fireEvent.mouseUp(option);
    fireEvent.click(option);
    expect(onNavigate).toHaveBeenCalledWith('Analytics');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

});
