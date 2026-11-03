import { afterEach, describe, expect, it, vi } from 'vitest';
import api, { analyticsAPI, setSessionToken } from '../services/api';
afterEach(() => { vi.restoreAllMocks(); setSessionToken(''); });
describe('mastery history API contract', () => {
  it('omits optional filter and forwards abort signal', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: [] }); const signal = new AbortController().signal;
    await analyticsAPI.getMasteryHistory(undefined, { signal });
    expect(get).toHaveBeenCalledExactlyOnceWith('/analytics/mastery/history', { params: {}, signal });
  });
  it('forwards optional topic filter', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: [] }); await analyticsAPI.getMasteryHistory(7);
    expect(get).toHaveBeenCalledExactlyOnceWith('/analytics/mastery/history', { params: { topic_id: 7 }, signal: undefined });
  });
  it('uses shared authentication without a live request', async () => {
    setSessionToken('mock-token');
    const adapter = vi.fn(async (config) => ({ data: [], status: 200, statusText: 'OK', headers: {}, config }));
    const original = api.defaults.adapter; api.defaults.adapter = adapter;
    try { await analyticsAPI.getMasteryHistory(); expect(adapter.mock.calls[0][0].headers.Authorization).toBe('Bearer mock-token'); expect(adapter.mock.calls[0][0].url).toBe('/analytics/mastery/history'); }
    finally { api.defaults.adapter = original; }
  });
});
