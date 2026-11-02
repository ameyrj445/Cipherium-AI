import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import useAccountDeletion from '../hooks/useAccountDeletion';
import { authAPI } from '../services/api';
vi.mock('../services/api', () => ({ authAPI: { deleteAccount: vi.fn() } }));

describe('App-owned account deletion', () => {
  it('deduplicates requests across rerenders and signs out the originating session', async () => {
    let resolve;
    authAPI.deleteAccount.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    const logout = vi.fn();
    const { result, rerender } = renderHook(() => useAccountDeletion('session-a', logout));
    let request;
    await act(async () => { request = result.current.deleteAccount(); });
    rerender();
    expect(result.current.deletionPending).toBe(true);
    expect(result.current.deleteAccount()).toBe(request);
    await act(async () => { resolve({}); await request; });
    expect(logout).toHaveBeenCalledTimes(1);
    expect(result.current.deletionPending).toBe(false);
  });

  it('releases a failed request and permits an explicit retry without early logout', async () => {
    authAPI.deleteAccount.mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce({});
    const logout = vi.fn();
    const { result } = renderHook(() => useAccountDeletion('session', logout));
    await act(async () => { await expect(result.current.deleteAccount()).rejects.toThrow('Offline'); });
    expect(result.current.deletionPending).toBe(false);
    expect(logout).not.toHaveBeenCalled();
    await act(async () => { await result.current.deleteAccount(); });
    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('does not sign out a different session when an old deletion completes', async () => {
    let resolve;
    authAPI.deleteAccount.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    const logout = vi.fn();
    const { result, rerender } = renderHook(({ token }) => useAccountDeletion(token, logout), { initialProps: { token: 'old' } });
    let request;
    await act(async () => { request = result.current.deleteAccount(); });
    rerender({ token: 'new' });
    expect(result.current.deletionPending).toBe(false);
    await act(async () => { resolve({}); await request; });
    expect(logout).not.toHaveBeenCalled();
  });
});
