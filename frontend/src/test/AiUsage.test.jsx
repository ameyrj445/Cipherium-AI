import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe } from 'jest-axe';
import AiUsage from '../components/AiUsage';
import TutorPanel from '../components/TutorPanel';
import { quotaFromFixture, isMonthlyQuotaError, UNAVAILABLE_QUOTA, CONFIRMED_EXHAUSTED_QUOTA } from '../utils/aiQuota';

const now = Date.parse('2026-11-10T00:00:00Z');
const fixture = (used, limit = 100) => quotaFromFixture({ used, limit, measured_at: '2026-11-09T00:00:00Z', resets_at: '2026-12-01T00:00:00Z' }, now);
describe('Prepared quota contract (fixture inputs only)', () => {
  it.each([[0, 0], [89, 89], [90, 90], [100, 100], [120, 100]])('calculates and clamps %s tokens', (used, expected) => {
    expect(fixture(used).percentage).toBe(expected);
    expect(fixture(used).exhausted).toBe(used >= 100);
  });
  it('cannot activate fixture data in production', () => {
    vi.stubEnv('MODE', 'production');
    expect(fixture(100)).toBe(UNAVAILABLE_QUOTA);
    vi.unstubAllEnvs();
  });
  it('handles zero allowance without NaN or division by zero', () => {
    expect(fixture(0, 0)).toMatchObject({ percentage: 100, exhausted: true });
  });
  it.each([null, {}, { monthly_token_used: 0, token_quota: 50000 }, { used: -1 }, { used: '90' }, { used: Infinity }, { used: 1.5 }])('rejects missing/invalid data %j', (snapshot) => {
    expect(quotaFromFixture(snapshot, now)).toBe(UNAVAILABLE_QUOTA);
  });
  it('rejects expired, missing, impossible or future measurement dates and invalid limits', () => {
    const base = { used: 10, limit: 100, measured_at: '2026-11-09', resets_at: '2026-12-01' };
    for (const change of [{ limit: -1 }, { limit: 1.5 }, { limit: '100' }, { resets_at: null }, { resets_at: 'bad' }, { resets_at: '2026-11-01' }, { measured_at: null }, { measured_at: '2027-01-01' }]) {
      expect(quotaFromFixture({ ...base, ...change }, now)).toBe(UNAVAILABLE_QUOTA);
    }
  });
  it('does not round a below-threshold balance into a 90% warning', () => {
    expect(fixture(8999, 10000).warning).toBe(false);
  });
  it('matches only explicit monthly quota 429, never ordinary throttling', () => {
    const message = 'Monthly AI quota exceeded. Upgrade or wait until next month.';
    expect(isMonthlyQuotaError({ status: 429, message })).toBe(true);
    expect(isMonthlyQuotaError({ response: { status: 429, data: { detail: message } } })).toBe(true);
    for (const err of [null, {}, { status: 429, message: 'Too many requests' }, { status: 403, message }]) expect(isMonthlyQuotaError(err)).toBe(false);
  });
});
describe('AI Usage presentation', () => {
  it('defaults to honest unavailable without a progress bar or fabricated reset', () => {
    render(<AiUsage />);
    expect(screen.getByText(/Usage unavailable/)).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByText(/50,000/)).not.toBeInTheDocument();
  });
  it('renders exact numeric fixture usage and UTC reset with accessible progress', async () => {
    const { container } = render(<AiUsage quota={fixture(25)} />);
    expect(screen.getByText('25 / 100 tokens used (25%)')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Monthly AI token usage' })).toHaveAttribute('value', '25');
    expect(screen.getByText(/2026-12-01 00:00:00 UTC/)).toBeInTheDocument();
    expect((await axe(container)).violations).toEqual([]);
  });
  it('warns at 90%, disables at 100%, and uses no fake dates for server rejection', () => {
    const { rerender } = render(<AiUsage quota={fixture(90)} compact />);
    expect(screen.getByRole('status')).toHaveTextContent('at least 90%');
    rerender(<AiUsage quota={fixture(100)} compact />);
    expect(screen.getByRole('status')).toHaveTextContent('Sending is disabled');
    rerender(<AiUsage quota={CONFIRMED_EXHAUSTED_QUOTA} />);
    expect(screen.getByRole('status')).toHaveTextContent('reset date is unavailable');
    expect(screen.getByRole('status')).toHaveTextContent('If your allowance has been restored, reload to retry; the server will check it again.');
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    rerender(<AiUsage quota={fixture(20)} compact />);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
  it('leaves tutor send usable when unavailable, but blocks exhausted click and Enter', () => {
    const send = vi.fn();
    const props = { chatInput: 'Hello', handleSendChat: send, conversations: { activeId: 1, items: [] } };
    const { rerender } = render(<TutorPanel {...props} quota={UNAVAILABLE_QUOTA} />);
    const button = screen.getByRole('button', { name: /send message/i });
    expect(button).not.toBeDisabled();
    rerender(<TutorPanel {...props} quota={fixture(100)} />);
    expect(button).toBeDisabled();
    fireEvent.click(button);
    fireEvent.keyDown(screen.getByRole('textbox', { name: /message/i }), { key: 'Enter' });
    expect(send).not.toHaveBeenCalled();
    rerender(<TutorPanel {...props} quota={fixture(90)} />);
    expect(button).not.toBeDisabled();
  });
});
