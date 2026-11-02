import React from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import AppShell from '../components/layout/AppShell';

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(window, 'innerWidth', { value: 375, writable: true, configurable: true });
});
afterEach(() => vi.restoreAllMocks());

function openDrawer() {
  const trigger = screen.getByRole('button', { name: 'Toggle navigation drawer' });
  trigger.focus();
  fireEvent.click(trigger);
  return trigger;
}

describe('shell keyboard accessibility', () => {
  it('puts skip navigation first and focuses the main content target', () => {
    window.innerWidth = 1400;
    const { container } = render(<AppShell><h1>Workspace</h1></AppShell>);
    const skip = screen.getByRole('link', { name: 'Skip to main content' });
    expect(container.querySelector('a,button,input')).toBe(skip);
    fireEvent.click(skip);
    expect(screen.getByRole('main')).toHaveFocus();
    expect(skip).toHaveAttribute('href', '#main-content');
  });

  it('opens a labelled modal, makes background inert, traps Tab and restores focus on Escape', () => {
    const { container } = render(<AppShell><button>Page action</button></AppShell>);
    const trigger = openDrawer();
    const dialog = screen.getByRole('dialog', { name: 'Navigation menu' });
    const close = within(dialog).getByRole('button', { name: 'Close navigation menu' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(close).toHaveFocus();
    expect(container.querySelector('#main-content').parentElement).toHaveAttribute('inert');
    expect(screen.queryByRole('button', { name: 'Page action' })).not.toBeInTheDocument();
    const buttons = within(dialog).getAllByRole('button');
    const last = buttons.at(-1);
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(close).toHaveFocus();
    fireEvent.keyDown(close, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Page action' })).toBeInTheDocument();
  });

  it('contains attempted outside focus, closes via explicit control, and permits subsequent focus', () => {
    render(<AppShell><button>Page action</button></AppShell>);
    const outside = screen.getByRole('button', { name: 'Page action' });
    const trigger = openDrawer();
    const close = screen.getByRole('button', { name: 'Close navigation menu' });
    outside.focus();
    expect(close).toHaveFocus();
    fireEvent.click(close);
    expect(trigger).toHaveFocus();
    outside.focus();
    expect(outside).toHaveFocus();
  });

  it('removes modal semantics and background inertness after resize or navigation', () => {
    const nav = vi.fn();
    const { container } = render(<AppShell setActiveNav={nav}><p>Body</p></AppShell>);
    openDrawer();
    fireEvent.click(screen.getByRole('button', { name: 'Learn', exact: true }));
    expect(nav).toHaveBeenCalledWith('Learn');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    openDrawer();
    act(() => { window.innerWidth = 1400; window.dispatchEvent(new Event('resize')); });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(container.querySelector('#main-content').parentElement).not.toHaveAttribute('inert');
  });
});
