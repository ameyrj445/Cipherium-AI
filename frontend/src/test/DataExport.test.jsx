import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import DataExport from '../components/DataExport';
import { profileAPI } from '../services/api';
vi.mock('../services/api', () => ({ profileAPI: { exportData: vi.fn() } }));

let click;
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:mock-export'), revokeObjectURL: vi.fn() });
  click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });
const start = () => fireEvent.click(screen.getByRole('button', { name: 'Export my data' }));

describe('server data export', () => {
  it('describes capped JSON and mastery-only CSV truthfully with a labeled choice', () => {
    render(<DataExport />);
    expect(screen.getByText(/200 quiz attempts, 100 study tasks, 100 tutor messages and 20 study plans/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Export format'), { target: { value: 'csv' } });
    expect(screen.getByText(/Includes topic mastery rows only/)).toBeInTheDocument();
  });
  it('downloads server JSON (not local secrets), cleans the anchor and revokes the URL', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    profileAPI.exportData.mockResolvedValue({ data: { user: { name: 'Mock learner' }, masteries: [] } });
    render(<DataExport />);
    await act(async () => start());
    expect(profileAPI.exportData).toHaveBeenCalledWith('json');
    const blob = URL.createObjectURL.mock.calls[0][0];
    expect(blob.type).toBe('application/json');
    const text = await new Promise(resolve => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsText(blob); });
    expect(JSON.parse(text)).toEqual({ user: { name: 'Mock learner' }, masteries: [] });
    expect(click.mock.instances[0].download).toMatch(/^cipherium_export_\d{4}-\d{2}-\d{2}\.json$/);
    expect(document.querySelector('a[download]')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('Download started');
    act(() => vi.runAllTimers());
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-export');
  });
  it('downloads the original CSV blob with the correct extension', async () => {
    const blob = new Blob(['topic_id,topic_name\n1,Mock'], { type: 'text/csv' });
    profileAPI.exportData.mockResolvedValue({ data: blob });
    render(<DataExport />);
    fireEvent.change(screen.getByLabelText('Export format'), { target: { value: 'csv' } });
    start();
    await waitFor(() => expect(click).toHaveBeenCalledOnce());
    expect(profileAPI.exportData).toHaveBeenCalledWith('csv');
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(click.mock.instances[0].download).toMatch(/\.csv$/);
  });
  it('guards repeated clicks and format changes while pending', async () => {
    let resolve;
    profileAPI.exportData.mockReturnValue(new Promise(r => { resolve = r; }));
    render(<DataExport />);
    start();
    fireEvent.click(screen.getByRole('button', { name: 'Preparing export…' }));
    expect(profileAPI.exportData).toHaveBeenCalledOnce();
    expect(screen.getByLabelText('Export format')).toBeDisabled();
    await act(async () => resolve({ data: {} }));
    expect(screen.getByRole('button', { name: 'Export my data' })).toBeEnabled();
  });
  it.each([
    [{ response: { status: 401 } }, /session has expired/],
    [{ response: { status: 429, data: new Blob(['rate limited']) } }, /Export limit reached/],
    [new Error('Network Error'), /Check your connection/],
    [Object.assign(new Error('timeout'), { code: 'ECONNABORTED' }), /Check your connection/],
    [{ response: { status: 500 } }, /server could not export/],
  ])('shows safe actionable errors and allows retry (%j)', async (error, message) => {
    profileAPI.exportData.mockRejectedValueOnce(error).mockResolvedValueOnce({ data: {} });
    render(<DataExport />);
    start();
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Retry export' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Download started'));
    expect(screen.queryByRole('alert')).toBeNull();
  });
  it('does not download when a pending request resolves after navigation', async () => {
    let resolve;
    profileAPI.exportData.mockReturnValue(new Promise(r => { resolve = r; }));
    const { unmount } = render(<DataExport />);
    start(); unmount();
    await act(async () => resolve({ data: {} }));
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
  it('cleans up when triggering the download fails', async () => {
    vi.useFakeTimers();
    click.mockImplementation(() => { throw new Error('download blocked'); });
    profileAPI.exportData.mockResolvedValue({ data: {} });
    render(<DataExport />);
    await act(async () => start());
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(document.querySelector('a[download]')).toBeNull();
    act(() => vi.runAllTimers());
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-export');
  });
});
