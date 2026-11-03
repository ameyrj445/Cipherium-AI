import React, { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MasteryTimeline from '../components/MasteryTimeline';
import { readFileSync } from 'node:fs';
const timelineStyles = readFileSync('src/components/MasteryTimeline.css', 'utf8');
import { normalizeMasteryHistory } from '../utils/masteryHistory';
import { analyticsAPI } from '../services/api';
vi.mock('../services/api', () => ({ analyticsAPI: { getMasteryHistory: vi.fn() } }));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  LineChart: ({ children, data }) => <div data-testid="chart-data" data-rows={JSON.stringify(data)}>{children}</div>,
  CartesianGrid: () => null, Legend: () => null, Line: () => null, Tooltip: () => null, XAxis: () => null, YAxis: () => null,
}));
const event = (id = 1, extra = {}) => ({ id, topic_id: 1, prior: 0.2, posterior: 0.4, created_at: '2026-01-01T12:00:00', ...extra });
const deferred = () => { let resolve; let reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const openTable = () => { fireEvent.click(screen.getByText('View mastery history table')); return screen.getByRole('table'); };
beforeEach(() => vi.resetAllMocks()); afterEach(cleanup);
describe('normalizeMasteryHistory', () => {
  it.each([null, undefined, {}, 'history', 42])('rejects malformed envelope %s', (payload) => expect(() => normalizeMasteryHistory(payload)).toThrow());
  it('accepts empty history', () => expect(normalizeMasteryHistory([])).toEqual({ rows: [], skipped: 0 }));
  it('skips invalid identities', () => {
    const result = normalizeMasteryHistory([null, {}, event('1'), event(2, { topic_id: -1 }), event(3, { topic_id: '2' }), event(4)]);
    expect(result.skipped).toBe(5); expect(result.rows.map((row) => row.id)).toEqual([4]);
  });
  it('sorts dates then ids with undated rows last without mutating input', () => {
    const payload = [event(9, { created_at: null }), event(3, { created_at: '2026-01-02T00:00:00Z' }), event(2), event(1)];
    expect(normalizeMasteryHistory(payload).rows.map((row) => row.id)).toEqual([1, 2, 3, 9]);
    expect(payload.map((row) => row.id)).toEqual([9, 3, 2, 1]);
  });
  it('treats naive dates as UTC and honors offsets', () => {
    const { rows } = normalizeMasteryHistory([event(1), event(2, { created_at: '2026-01-01T13:00:00+01:00' })]);
    expect(rows[0].timestamp).toBe(Date.UTC(2026, 0, 1, 12)); expect(rows[1].timestamp).toBe(rows[0].timestamp);
  });
  it.each([null, undefined, '', 'invalid', 0, '2026-01-01', '2026-99-99T99:99:99', '2026-02-30T00:00:00Z', '2026-01-01T24:00:00Z', '0000-01-01T00:00:00Z'])('preserves unavailable or impossible date %s', (created_at) => {
    expect(normalizeMasteryHistory([event(1, { created_at })]).rows[0].timestamp).toBeNull();
  });
  it.each([null, undefined, '', '0.4', NaN, Infinity, -0.1, 1.01])('does not coerce invalid probability %s', (value) => {
    expect(normalizeMasteryHistory([event(1, { prior: value, posterior: value })]).rows[0]).toMatchObject({ prior: null, posterior: null });
  });
  it('preserves zero and one probabilities', () => expect(normalizeMasteryHistory([event(1, { prior: 0, posterior: 1 })]).rows[0]).toMatchObject({ prior: 0, posterior: 100 }));
});
describe('MasteryTimeline', () => {
  it('announces loading then honest empty state', async () => {
    const request = deferred(); analyticsAPI.getMasteryHistory.mockReturnValue(request.promise); render(<MasteryTimeline />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading mastery history');
    await act(async () => request.resolve({ data: [] }));
    expect(screen.getByRole('status')).toHaveTextContent('No mastery history yet'); expect(screen.queryByTestId('chart-data')).not.toBeInTheDocument();
  });
  it('renders ordered table values, separate topic charts and accessible controls', async () => {
    analyticsAPI.getMasteryHistory.mockResolvedValue({ data: [event(3, { topic_id: 2 }), event(2), event(1, { prior: 0, posterior: 1 })] });
    render(<MasteryTimeline topics={[{ topic_id: 1, topic_name: 'Arrays' }]} />); await screen.findByText('3 saved mastery events.');
    expect(screen.getByRole('region', { name: 'Mastery timeline' })).toBeInTheDocument();
    const select = screen.getByRole('combobox', { name: 'Timeline topic' }); select.focus(); expect(select).toHaveFocus();
    expect(screen.getAllByTestId('chart-data')).toHaveLength(2);
    const table = openTable(); expect(within(table).getAllByRole('columnheader')).toHaveLength(5);
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows.map((row) => within(row).getAllByRole('cell')[0].textContent)).toEqual(['1', '2', '3']);
    expect(rows[0]).toHaveTextContent('0%100%'); expect(table).toHaveTextContent('2026-01-01T12:00:00.000Z');
  });
  it('handles rapid topic changes without requests or stale rows', async () => {
    analyticsAPI.getMasteryHistory.mockResolvedValue({ data: [event(1), event(2, { topic_id: 2 })] });
    render(<MasteryTimeline topics={[{ topic_id: 3, topic_name: 'No events' }]} />); await screen.findByText('2 saved mastery events.');
    const select = screen.getByRole('combobox'); for (const value of ['1', '2', '1', 'all', '2']) fireEvent.change(select, { target: { value } });
    expect(screen.getByRole('status')).toHaveTextContent('1 saved mastery events');
    expect(JSON.parse(screen.getByTestId('chart-data').dataset.rows).map((row) => row.topicId)).toEqual([2]);
    fireEvent.change(select, { target: { value: '3' } }); expect(screen.getByRole('status')).toHaveTextContent('No mastery history yet');
    expect(screen.queryByTestId('chart-data')).not.toBeInTheDocument(); expect(analyticsAPI.getMasteryHistory).toHaveBeenCalledTimes(1);
  });
  it('reports incomplete records without plotting unknown dates or coercing values', async () => {
    analyticsAPI.getMasteryHistory.mockResolvedValue({ data: [null, event(1, { prior: null }), event(2, { created_at: null, posterior: undefined })] });
    render(<MasteryTimeline topics={null} />); await screen.findByText(/Some history is incomplete/);
    expect(screen.getByText(/1 invalid records were omitted/)).toBeInTheDocument();
    const chart = JSON.parse(screen.getByTestId('chart-data').dataset.rows); expect(chart).toHaveLength(1); expect(chart[0].prior).toBeNull();
    const table = openTable(); expect(within(table).getAllByText('Unavailable')).toHaveLength(2); expect(within(table).getByText('Date unavailable')).toBeInTheDocument();
  });
  it.each([{ response: { status: 500 } }, new Error('offline')])('retries request failures', async (error) => {
    analyticsAPI.getMasteryHistory.mockRejectedValueOnce(error).mockResolvedValueOnce({ data: [event()] }); render(<MasteryTimeline />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load mastery history');
    fireEvent.click(screen.getByRole('button', { name: 'Retry mastery history' })); await screen.findByText('1 saved mastery events.');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument(); expect(analyticsAPI.getMasteryHistory).toHaveBeenCalledTimes(2);
    expect(analyticsAPI.getMasteryHistory.mock.calls[0][1].signal.aborted).toBe(true);
  });
  it.each([401, 403])('explains authentication failure %s', async (status) => {
    analyticsAPI.getMasteryHistory.mockRejectedValue({ response: { status } }); render(<MasteryTimeline />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Please sign in again'); expect(screen.queryByTestId('chart-data')).not.toBeInTheDocument();
  });
  it('treats malformed response as error rather than empty history', async () => {
    analyticsAPI.getMasteryHistory.mockResolvedValue({ data: { events: [] } }); render(<MasteryTimeline />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load mastery history'); expect(screen.queryByText(/No mastery history yet/)).not.toBeInTheDocument();
  });
  it('aborts on unmount and ignores late result', async () => {
    const request = deferred(); analyticsAPI.getMasteryHistory.mockReturnValue(request.promise); const { unmount, container } = render(<MasteryTimeline />);
    const signal = analyticsAPI.getMasteryHistory.mock.calls[0][1].signal; unmount(); expect(signal.aborted).toBe(true);
    await act(async () => request.resolve({ data: [event()] })); expect(container).toBeEmptyDOMElement();
  });
  it.each(['success', 'failure'])('ignores stale %s after StrictMode replacement request', async (outcome) => {
    const old = deferred(); const current = deferred(); analyticsAPI.getMasteryHistory.mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
    render(<StrictMode><MasteryTimeline /></StrictMode>); expect(analyticsAPI.getMasteryHistory.mock.calls[0][1].signal.aborted).toBe(true);
    await act(async () => current.resolve({ data: [] }));
    await act(async () => outcome === 'success' ? old.resolve({ data: [event()] }) : old.reject(new Error('stale')));
    expect(screen.getByRole('status')).toHaveTextContent('No mastery history yet'); expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});


describe('mastery history table layout regressions', () => {
  it('provides a keyboard-focusable named scroll region around all five columns', async () => {
    const longName = 'A very long topic name '.repeat(12);
    analyticsAPI.getMasteryHistory.mockResolvedValue({ data: [event()] });
    render(<MasteryTimeline topics={[{ topic_id: 1, topic_name: longName }]} />);
    await screen.findByText('1 saved mastery events.');
    const table = openTable();
    const region = screen.getByRole('region', { name: 'Mastery history table, scrollable' });
    expect(region).toContainElement(table);
    expect(region).toHaveAttribute('tabindex', '0');
    expect(region).toHaveAccessibleDescription('On smaller screens, scroll horizontally to see every column.');
    region.focus();
    expect(region).toHaveFocus();
    expect(within(table).getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual(['Event', 'Topic', 'Date (UTC)', 'Before event', 'After event']);
    expect(within(table).getAllByRole('cell')).toHaveLength(5);
    expect(within(table).getByText(longName.trim())).toBeInTheDocument();
  });

  it('keeps explicit padding and contained scrolling despite the global CSS reset', () => {
    // jsdom does not measure layout; assert the scoped CSS contract, not visual correctness.
    expect(timelineStyles).toMatch(/\.mastery-timeline__table th,\s*\.mastery-timeline__table td\s*\{[^}]*padding: 12px 16px/s);
    expect(timelineStyles).toMatch(/\.mastery-timeline__table-scroll\s*\{[^}]*max-width: 100%;[^}]*overflow-x: auto/s);
    expect(timelineStyles).toMatch(/\.mastery-timeline__table\s*\{[^}]*width: 100%;[^}]*min-width: 680px/s);
    expect(timelineStyles).toMatch(/td:nth-child\(2\)\s*\{[^}]*overflow-wrap: anywhere/s);
    expect(timelineStyles).toMatch(/select\s*\{[^}]*max-width: 100%/s);
  });
});
