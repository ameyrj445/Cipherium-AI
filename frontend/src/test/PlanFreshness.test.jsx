import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { readFileSync } from 'node:fs';
import PlanFreshnessBanner from '../components/PlanFreshnessBanner';
import StudyPlanView from '../components/StudyPlanView';
import { planFreshnessFromFixture, UNAVAILABLE_PLAN_FRESHNESS } from '../utils/planFreshness';

const now = Date.parse('2026-11-03T10:00:00Z');
const fixture = (status = 'stale', changes = {}) => ({
  plan_id: 42, status, last_generated_at: '2026-11-01T08:00:00Z', checked_at: '2026-11-03T09:00:00Z', ...changes,
});
const plan = { id: 42, subject: 'Algorithms', milestones: [{ title: 'Basics', subtopics: ['Arrays'], resources: [] }] };
beforeEach(() => vi.spyOn(Date, 'now').mockReturnValue(now));
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('test-only plan freshness contract', () => {
  it.each(['checking', 'fresh', 'stale', 'regenerating', 'error', 'refreshed'])('prepares %s for the identified plan only', status => {
    expect(planFreshnessFromFixture(fixture(status), 42, now)).toEqual({ status, generatedAt: Date.parse('2026-11-01T08:00:00Z') });
  });
  it.each([undefined, null, {}, [], { is_stale: true, last_generated_at: '2026-11-01T08:00:00Z' },
    fixture('unknown'), fixture('Stale'), fixture('stale', { plan_id: '42' }), fixture('stale', { plan_id: 43 }),
    fixture('stale', { plan_id: 0 }), fixture('stale', { plan_id: -1 }), fixture('stale', { plan_id: 1.5 }),
    fixture('stale', { checked_at: undefined }), fixture('stale', { last_generated_at: null }),
    fixture('stale', { checked_at: 'not a date' }), fixture('stale', { checked_at: '2026-11-03' }),
    fixture('stale', { last_generated_at: '2026-11-03T09:30:00Z' }), fixture('stale', { checked_at: '2026-11-04T09:00:00Z' }),
    fixture('error', { last_generated_at: undefined }),
    fixture('stale', { last_generated_at: '2026-02-30T08:00:00Z' }), fixture('stale', { last_generated_at: '2026-13-01T08:00:00Z' }),
    fixture('stale', { last_generated_at: '2026-11-01T08:00:00' }), fixture('stale', { last_generated_at: 1793520000000 }),
  ])('rejects absent, mismatched, malformed or unscoped data %#', data => {
    expect(planFreshnessFromFixture(data, 42, now)).toBe(UNAVAILABLE_PLAN_FRESHNESS);
  });
  it.each([null, undefined, '42', 0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('rejects invalid displayed identity %s', id => {
    expect(planFreshnessFromFixture(fixture(), id, now)).toBe(UNAVAILABLE_PLAN_FRESHNESS);
  });
  it('rejects an invalid clock and accepts boundary timestamps', () => {
    expect(planFreshnessFromFixture(fixture(), 42, NaN)).toBe(UNAVAILABLE_PLAN_FRESHNESS);
    expect(planFreshnessFromFixture(fixture('fresh', { last_generated_at: '2026-11-03T10:00:00Z', checked_at: '2026-11-03T10:00:00Z' }), 42, now).status).toBe('fresh');
  });
  it.each(['checking', 'error'])('permits %s without inventing a generation date', status => {
    expect(planFreshnessFromFixture({ plan_id: 42, status }, 42, now)).toEqual({ status, generatedAt: null });
  });
  it('rejects fixtures in a production build even when built with test mode', () => {
    vi.stubEnv('MODE', 'test'); vi.stubEnv('PROD', true);
    expect(planFreshnessFromFixture(fixture(), 42, now)).toBe(UNAVAILABLE_PLAN_FRESHNESS);
    render(<PlanFreshnessBanner planId={42} fixture={fixture()} />);
    expect(screen.getByRole('heading', { name: 'Plan freshness unavailable' })).toBeInTheDocument();
    expect(screen.queryByText('Your study plan may be out of date')).not.toBeInTheDocument();
  });
  it.each(['production', 'development', 'preview', ''])('rejects fixtures outside test mode (%s)', mode => {
    vi.stubEnv('MODE', mode);
    expect(planFreshnessFromFixture(fixture(), 42, now)).toBe(UNAVAILABLE_PLAN_FRESHNESS);
    render(<PlanFreshnessBanner planId={42} fixture={fixture()} />);
    expect(screen.getByRole('heading', { name: 'Plan freshness unavailable' })).toBeInTheDocument();
    expect(screen.queryByText('Your study plan may be out of date')).not.toBeInTheDocument();
    expect(screen.queryByText(/Last generated/)).not.toBeInTheDocument();
  });
});

describe('plan freshness presentation', () => {
  it('defaults to unknown and never infers stale from age or plan fields', () => {
    render(<StudyPlanView plan={{ ...plan, is_stale: true, status: 'stale', last_generated_at: '2020-01-01', fixture: fixture() }} />);
    expect(screen.getByRole('heading', { name: 'Plan freshness unavailable' })).toBeInTheDocument();
    expect(screen.queryByText('Your study plan may be out of date')).not.toBeInTheDocument();
    expect(screen.queryByText(/Last generated/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Regenerate plan' })).toBeDisabled();
  });
  it('does not show a freshness banner without a plan', () => {
    render(<StudyPlanView />);
    expect(screen.queryByRole('region', { name: 'Plan freshness unavailable' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Regenerate plan' })).not.toBeInTheDocument();
  });
  it.each([
    ['checking', 'Checking plan freshness…'], ['fresh', 'Study plan is up to date'],
    ['stale', 'Your study plan may be out of date'], ['regenerating', 'Regenerating study plan…'],
    ['error', 'Plan refresh could not be confirmed'], ['refreshed', 'Study plan refreshed'],
  ])('renders accessible %s preview without enabling regeneration', async (status, title) => {
    const { container } = render(<PlanFreshnessBanner planId={42} fixture={fixture(status)} />);
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    expect(screen.getByRole(status === 'error' ? 'alert' : 'status')).toHaveAttribute('aria-atomic', 'true');
    const action = screen.getByRole('button');
    expect(action).toBeDisabled();
    expect(action).toHaveAccessibleDescription(/State preview only.*Regeneration is unavailable/);
    expect(action).toHaveAttribute('aria-busy', String(['checking', 'regenerating'].includes(status)));
    fireEvent.click(action); fireEvent.click(action);
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    expect(container.querySelector('time')).toHaveAttribute('datetime', '2026-11-01T08:00:00.000Z');
    expect(container.querySelector('time')).toHaveTextContent('2026-11-01 08:00:00 UTC');
    expect((await axe(container)).violations).toEqual([]);
  });
  it('discards another plan’s status immediately on selection changes', () => {
    const { rerender } = render(<PlanFreshnessBanner planId={42} fixture={fixture()} />);
    expect(screen.getByText('Your study plan may be out of date')).toBeInTheDocument();
    rerender(<PlanFreshnessBanner planId={43} fixture={fixture()} />);
    expect(screen.queryByText('Your study plan may be out of date')).not.toBeInTheDocument();
    expect(screen.getByText('Plan freshness unavailable')).toBeInTheDocument();
    rerender(<PlanFreshnessBanner planId={43} fixture={fixture('fresh', { plan_id: 43 })} />);
    expect(screen.getByText('Study plan is up to date')).toBeInTheDocument();
    rerender(<PlanFreshnessBanner planId={43} />);
    expect(screen.queryByText('Study plan is up to date')).not.toBeInTheDocument();
  });
  it('shows no date for error without assessment and no raw backend message', () => {
    render(<PlanFreshnessBanner planId={42} fixture={{ plan_id: 42, status: 'error', message: '<script>private error</script>' }} />);
    expect(screen.queryByText(/Last generated|private error/)).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('The outcome is unknown');
  });
  it('has no accessibility violations in the production default', async () => {
    const { container } = render(<PlanFreshnessBanner planId={42} />);
    expect((await axe(container)).violations).toEqual([]);
  });
  it('keeps the banner in normal flow with narrow-width wrapping', () => {
    // Stylesheet guard, not a claim of measured browser geometry.
    const css = readFileSync('src/components/PlanFreshnessBanner.css', 'utf8');
    expect(css).toContain('flex-wrap: wrap');
    expect(css).toContain('min-width: 0');
    expect(css).toContain('overflow-wrap: anywhere');
    expect(css).toContain('white-space: normal');
    expect(css).toContain('min-height: 44px');
    expect(css).toContain('@media (max-width: 480px)');
    expect(css).not.toMatch(/position:\s*(absolute|fixed)|overflow:\s*hidden/);
  });
});
