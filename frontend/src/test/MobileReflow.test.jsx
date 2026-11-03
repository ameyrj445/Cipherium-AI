import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import PageContainer from '../components/layout/PageContainer';
import StatCards from '../components/StatCards';
import PracticeView from '../components/PracticeView';
import TopHeader from '../components/TopHeader';
import { readFileSync } from 'node:fs';
const css = readFileSync(`${process.cwd()}/src/index.css`, 'utf8');

vi.mock('../services/api', () => ({ quizAPI: { generateExam: vi.fn(), submitAttempt: vi.fn() } }));
vi.mock('../components/common/NotificationDropdown', () => ({ default: () => <button>Notifications</button> }));
afterEach(() => { window.innerWidth = 1024; });

// JSDOM does not lay out pixels. These tests protect the reflow contracts and
// interactions; the viewport/overflow acceptance check runs in a real browser.
describe('mobile reflow contracts', () => {
  it('only marks grid containers for the mobile stacking rule', () => {
    const { rerender } = render(<PageContainer data-testid="page">Grid</PageContainer>);
    expect(screen.getByTestId('page')).toHaveClass('page-container--grid');
    rerender(<PageContainer noGrid fullHeight data-testid="page">App panel</PageContainer>);
    expect(screen.getByTestId('page')).not.toHaveClass('page-container--grid');
    expect(css).toMatch(/@media \(max-width: 1023px\)[\s\S]*grid-template-columns: minmax\(0, 1fr\)/);
    expect(css).toContain('.page-container--grid > * { grid-column: 1 / -1 !important; }');
  });

  it.each([320, 375, 390, 768])('keeps every statistic in a shrinkable grid at %ipx', (width) => {
    window.innerWidth = width;
    const { container } = render(<StatCards overallProgress={100} topicsCompleted={123456} studyHours={99999} dayStreak={365} />);
    expect(container.firstChild.style.gridTemplateColumns).toBe('repeat(auto-fit, minmax(min(220px, 100%), 1fr))');
    expect(screen.getByText('99999h')).toBeInTheDocument();
    expect(container.querySelectorAll('.ui-card')).toHaveLength(4);
    for (const card of container.querySelectorAll('.ui-card')) expect(card).toHaveStyle({ minWidth: 0 });
  });

  it('keeps all three practice modes operable in the wrapping tab group', () => {
    window.innerWidth = 320;
    render(<PracticeView />);
    const exam = screen.getByRole('button', { name: 'Timed Exam' });
    expect(exam.parentElement).toHaveClass('page-segmented-controls');
    fireEvent.click(exam);
    expect(screen.getByRole('button', { name: 'Launch Diagnostic Benchmark' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Coding Challenges/ }));
    expect(screen.getByRole('button', { name: /Create a study plan/i })).toBeInTheDocument();
    expect(css).toMatch(/\.page-segmented-controls\s*{[^}]*flex-wrap: wrap;/);
    expect(css).toMatch(/\.page-segmented-controls > button\s*{[^}]*white-space: normal;/);
  });

  it('preserves search, drawer and profile actions with a long account name', () => {
    window.innerWidth = 320;
    const drawer = vi.fn();
    render(<TopHeader userName={'LongAccountName'.repeat(12)} isAuthenticated onToggleMobileDrawer={drawer} />);
    fireEvent.click(screen.getByRole('button', { name: 'Toggle navigation drawer' }));
    expect(drawer).toHaveBeenCalledOnce();
    const search = screen.getByRole('textbox', { name: 'Search topics, roadmap, or concepts' });
    fireEvent.focus(search);
    expect(screen.getByRole('listbox')).toHaveClass('global-search-results');
    fireEvent.change(search, { target: { value: 'unlikely-result' } });
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(search).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'User profile menu' }));
    expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument();
    expect(css).toMatch(/\.global-search input\s*{ min-width: 0; }/);
    expect(css).toMatch(/\.notification-panel\s*{[^}]*position: fixed !important;/);
  });
});
