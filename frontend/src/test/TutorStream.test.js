import { afterEach, describe, expect, it, vi } from 'vitest';
import { tutorAPI, setSessionToken } from '../services/api';
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; setSessionToken(''); vi.restoreAllMocks(); });
const response = (pieces) => ({ ok: true, body: new ReadableStream({ start(controller) { for (const piece of pieces) controller.enqueue(new TextEncoder().encode(piece)); controller.close(); } }) });
describe('Conversation streaming transport', () => {
  it('binds conversation payload and token, handles split SSE and CRLF completion', async () => {
    setSessionToken('a'); globalThis.fetch = vi.fn().mockResolvedValue(response(['data: {"chunk":"Hel', 'lo"}\r\n\r\ndata: {"done":true}']));
    const chunk = vi.fn(), done = vi.fn(), error = vi.fn();
    const controller = new AbortController();
    await tutorAPI.streamMessage({ message: 'Hi', conversation_id: 42 }, chunk, done, error, controller.signal, 'a');
    expect(chunk).toHaveBeenCalledWith('Hello'); expect(done).toHaveBeenCalledTimes(1); expect(error).not.toHaveBeenCalled();
    expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('/tutor/chat/stream'), expect.objectContaining({ signal: controller.signal, headers: expect.objectContaining({ Authorization: 'Bearer a' }), body: JSON.stringify({ message:'Hi', conversation_id:42 }) }));
  });
  it('never sends a request with a different login token', async () => {
    setSessionToken('b'); globalThis.fetch = vi.fn();
    await tutorAPI.streamMessage({ message:'private' }, vi.fn(), vi.fn(), vi.fn(), undefined, 'a');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
  it('reports early EOF as ambiguous instead of leaving thinking forever', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(response(['data: {"chunk":"Partial"}\n\n']));
    const error = vi.fn(), done = vi.fn(); await tutorAPI.streamMessage({}, vi.fn(), done, error);
    expect(done).not.toHaveBeenCalled(); expect(error).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('before completion') }));
  });
  it.each(['data: not-json\n\n', 'data: {"error":"failed"}\n\n'])('reports malformed/error events: %s', async (body) => {
    globalThis.fetch = vi.fn().mockResolvedValue(response([body])); const error = vi.fn();
    await tutorAPI.streamMessage({}, vi.fn(), vi.fn(), error); expect(error).toHaveBeenCalledTimes(1);
  });
  it('retains HTTP status so only an explicit unsupported endpoint can fall back', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok:false, status:405, json:async () => ({ detail:'Method not allowed' }) });
    const error = vi.fn(); await tutorAPI.streamMessage({}, vi.fn(), vi.fn(), error);
    expect(error).toHaveBeenCalledWith(expect.objectContaining({ status:405 }));
  });
  it('ignores duplicate terminal events', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(response(['data: {"done":true}\n\ndata: {"done":true}\n\n']));
    const done = vi.fn(); await tutorAPI.streamMessage({}, vi.fn(), done, vi.fn()); expect(done).toHaveBeenCalledTimes(1);
  });
});
