import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTutorConversations } from '../hooks/useTutorConversations';
import { tutorAPI } from '../services/api';
vi.mock('../services/api', () => ({ tutorAPI: Object.fromEntries(['sendMessage', 'getHistory', 'getConversations', 'getConversationMessages', 'createConversation', 'streamMessage', 'sendConversationMessage'].map((key) => [key, vi.fn()])) }));
const deferred = () => { let resolve; let reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return { promise, resolve, reject }; };
beforeEach(() => {
  vi.resetAllMocks();
  tutorAPI.getHistory.mockResolvedValue({ data: [{ id: 90, role: 'assistant', message: 'Earlier answer' }] });
  tutorAPI.getConversations.mockResolvedValue({ data: [{ id: 1, title: 'Arrays', topic_id: 3 }, { id: 2, title: 'Trees' }] });
  tutorAPI.getConversationMessages.mockResolvedValue({ data: [] });
  tutorAPI.createConversation.mockResolvedValue({ data: { id: 3, title: 'Question', topic_id: 3 } });
  tutorAPI.streamMessage.mockImplementation(async (_data, chunk, done) => { chunk('Answer'); done({}); });
  tutorAPI.sendConversationMessage.mockResolvedValue({ data: { response: 'Fallback answer' } });
  tutorAPI.sendMessage.mockResolvedValue({ data: { response: 'General answer' } });
});
async function ready() { const hook = renderHook(({ token }) => useTutorConversations(token), { initialProps: { token: 'a' } }); await waitFor(() => expect(hook.result.current.loadingMessages).toBe(false)); return hook; }
describe('Persistent tutor conversations', () => {
  it('loads independent list and read-only earlier history with actual message IDs', async () => {
    const { result } = await ready();
    expect(result.current.messages[0].id).toBe(90);
    expect(result.current.activeId).toBe('legacy');
    expect(result.current.items).toHaveLength(2);
    expect(tutorAPI.getConversations).toHaveBeenCalledWith({ skip: 0, limit: 20 }, 'a');
    await act(async () => result.current.send('not allowed'));
    expect(tutorAPI.createConversation).not.toHaveBeenCalled();
  });
  it('creates on New Conversation, clears history, and guards duplicate clicks/sends', async () => {
    const { result } = await ready(); const create = deferred(); tutorAPI.createConversation.mockReturnValue(create.promise);
    let pending;
    act(() => { pending = result.current.newConversation(); void result.current.newConversation(); });
    expect(tutorAPI.createConversation).toHaveBeenCalledTimes(1);
    expect(result.current.messages).toEqual([]); expect(result.current.creating).toBe(true);
    await act(async () => result.current.send('Must wait'));
    expect(tutorAPI.streamMessage).not.toHaveBeenCalled();
    await act(async () => { create.resolve({ data: { id: 3, title: 'New Conversation' } }); await pending; });
    act(() => result.current.setTopicId(3));
    tutorAPI.streamMessage.mockResolvedValue(undefined);
    await act(async () => { void result.current.send('Question'); void result.current.send('Duplicate'); });
    expect(tutorAPI.streamMessage).toHaveBeenCalledTimes(1);
    expect(tutorAPI.streamMessage.mock.calls[0][0]).toEqual({ message: 'Question', topic_id: 3, mode: 'socratic', conversation_id: 3 });
    expect(tutorAPI.streamMessage.mock.calls[0][5]).toBe('a');
    const [,chunk,done] = tutorAPI.streamMessage.mock.calls[0];
    act(() => { chunk('Answer'); done({}); });
    expect(result.current.messages[1].text).toBe('Answer'); expect(result.current.messages[1].id).toBeUndefined();
  });
  it('uses existing selected thread and topic, without creating another', async () => {
    const { result } = await ready();
    tutorAPI.getConversationMessages.mockResolvedValue({ data: [{ id: 22, role: 'assistant', message: 'Saved' }] });
    await act(async () => result.current.select(1));
    expect(result.current.messages[0].id).toBe(22);
    await act(async () => result.current.send('Next', 'direct'));
    expect(tutorAPI.createConversation).not.toHaveBeenCalled();
    expect(tutorAPI.streamMessage.mock.calls[0][0]).toMatchObject({ conversation_id: 1, topic_id: 3, mode: 'direct' });
  });
  it('ignores stale history and conversation selection responses', async () => {
    const { result } = await ready(); const first = deferred(); tutorAPI.getConversationMessages.mockReturnValueOnce(first.promise);
    act(() => { void result.current.select(1); });
    await act(async () => result.current.select(2));
    await act(async () => first.resolve({ data: [{ id: 9, role: 'assistant', message: 'wrong thread' }] }));
    expect(result.current.activeId).toBe(2); expect(result.current.messages).toEqual([]);
  });
  it('aborts and ignores stream callbacks and fallback after thread switching', async () => {
    const { result } = await ready(); tutorAPI.streamMessage.mockResolvedValue(undefined);
    await act(async () => result.current.newConversation()); await act(async () => result.current.send('Question'));
    const [, chunk, done, fail, signal] = tutorAPI.streamMessage.mock.calls[0];
    await act(async () => result.current.select(2));
    await act(async () => { chunk('stale'); done({}); await fail({ status: 405 }); });
    expect(signal.aborted).toBe(true); expect(result.current.messages).toEqual([]);
    expect(tutorAPI.sendConversationMessage).not.toHaveBeenCalled();
  });
  it('ignores create completion in another session', async () => {
    const { result, rerender } = await ready(); const create = deferred(); tutorAPI.createConversation.mockReturnValue(create.promise);
    act(() => { void result.current.newConversation(); });
    rerender({ token: 'b' });
    await act(async () => create.resolve({ data: { id: 3, title: 'private' } }));
    expect(tutorAPI.streamMessage).not.toHaveBeenCalled(); expect(result.current.token).toBe('b');
  });
  it('does not expose prior-session messages while the new history is pending', async () => {
    const { result, rerender } = await ready(); tutorAPI.getHistory.mockReturnValue(new Promise(() => {}));
    await act(async () => rerender({ token: 'b' })); expect(result.current.messages).toEqual([]);
  });
  it('offers an honest error on creation failure without sending unscoped chat', async () => {
    const { result } = await ready(); tutorAPI.createConversation.mockRejectedValue(new Error('network'));
    await act(async () => result.current.newConversation()); await act(async () => result.current.send('Question'));
    expect(result.current.error).toMatch(/may already have been created/); expect(result.current.thinking).toBe(false);
    expect(tutorAPI.streamMessage).not.toHaveBeenCalled();
  });
  it('uses conversation-scoped fallback only for unsupported streaming endpoints', async () => {
    const { result } = await ready(); tutorAPI.streamMessage.mockImplementation(async (_d,_c,_done,error) => error({ status: 405 }));
    await act(async () => result.current.select(1)); await act(async () => result.current.send('Question'));
    expect(tutorAPI.sendConversationMessage).toHaveBeenCalledWith(1, expect.objectContaining({ conversation_id: 1, topic_id: 3 }), 'a', expect.any(AbortSignal));
    expect(result.current.messages[1].text).toBe('Fallback answer');
  });
  it.each([new Error('network'), { status: 429 }, { status: 500 }])('does not automatically resend an ambiguous or rejected stream: %j', async (error) => {
    const { result } = await ready(); tutorAPI.streamMessage.mockImplementation(async (_d,_c,_done,fail) => fail(error));
    await act(async () => result.current.select(1)); await act(async () => result.current.send('Question'));
    expect(tutorAPI.sendConversationMessage).not.toHaveBeenCalled(); expect(result.current.error).toMatch(/Reopen/);
  });
  it('preserves partial text and never falls back after receiving chunks', async () => {
    const { result } = await ready(); tutorAPI.streamMessage.mockImplementation(async (_d,chunk,_done,fail) => { chunk('Partial'); await fail({ status: 405 }); });
    await act(async () => result.current.select(1)); await act(async () => result.current.send('Question'));
    expect(tutorAPI.sendConversationMessage).not.toHaveBeenCalled(); expect(result.current.messages[1]).toMatchObject({ text: 'Partial', streaming: false });
  });
  it('paginates and deduplicates overlapping pages, and can retry a list failure', async () => {
    tutorAPI.getConversations.mockResolvedValueOnce({ data: Array.from({ length:20 }, (_,i) => ({ id:i+1, title:'Conversation' })) });
    const { result } = await ready(); expect(result.current.hasMore).toBe(true);
    tutorAPI.getConversations.mockRejectedValueOnce(new Error('offline'));
    await act(async () => result.current.loadMore()); expect(result.current.listError).toBeTruthy();
    tutorAPI.getConversations.mockResolvedValueOnce({ data: [{ id:20 }, { id:21 }] });
    await act(async () => result.current.loadMore());
    expect(tutorAPI.getConversations).toHaveBeenLastCalledWith({ skip:20, limit:20 }, 'a');
    expect(result.current.items).toHaveLength(21); expect(result.current.hasMore).toBe(false);
  });
  it('shows message fetch failures without retaining a different thread transcript', async () => {
    const { result } = await ready(); tutorAPI.getConversationMessages.mockRejectedValue(new Error('404'));
    await act(async () => result.current.select(1)); expect(result.current.error).toMatch(/Could not load/); expect(result.current.messages).toEqual([]);
  });
  it('persists selected grounding and a descriptive title when creating', async () => {
    const { result } = await ready();
    act(() => result.current.setTopicId(3));
    await act(async () => result.current.newConversation('Arrays'));
    expect(tutorAPI.createConversation).toHaveBeenCalledWith({ title: expect.stringMatching(/^Arrays discussion/), topic_id:3 }, 'a', expect.any(AbortSignal));
    expect(result.current.topicId).toBe(3);
  });
  it('does not let stale list responses erase a newly created conversation', async () => {
    const { result } = await ready(); const pending = deferred();
    tutorAPI.getConversations.mockReturnValueOnce(pending.promise);
    act(() => { void result.current.refresh(); });
    await act(async () => result.current.newConversation());
    await act(async () => pending.resolve({ data:[] }));
    expect(result.current.items.some((c) => c.id === 3)).toBe(true);
  });
  it('does not reopen a new conversation if a different thread was selected while creating', async () => {
    const { result } = await ready(); const pending = deferred(); tutorAPI.createConversation.mockReturnValueOnce(pending.promise);
    act(() => { void result.current.newConversation(); });
    await act(async () => result.current.select(2));
    await act(async () => pending.resolve({ data:{ id:3 } }));
    expect(result.current.activeId).toBe(2);
  });
  it('times out an incomplete stream and blocks retries until reopening', async () => {
    const { result } = await ready();
    await act(async () => result.current.select(1));
    tutorAPI.streamMessage.mockResolvedValue(undefined);
    vi.useFakeTimers();
    try {
      await act(async () => result.current.send('Question'));
      await act(async () => vi.advanceTimersByTime(90000));
      expect(result.current.thinking).toBe(false); expect(result.current.blocked).toBe(true);
      await act(async () => result.current.send('Duplicate'));
      expect(tutorAPI.streamMessage).toHaveBeenCalledTimes(1);
      expect(tutorAPI.sendConversationMessage).not.toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });
  it('does not abort a terminal stream on navigation before backend persistence can finish', async () => {
    const { result } = await ready(); await act(async () => result.current.select(1));
    await act(async () => result.current.send('Question'));
    const signal = tutorAPI.streamMessage.mock.calls[0][4];
    await act(async () => result.current.select(2));
    expect(signal.aborted).toBe(false);
  });

  it('keeps General context in fallback instead of inheriting the saved thread topic', async () => {
    const { result } = await ready();
    await act(async () => result.current.select(1));
    act(() => result.current.setTopicId(null));
    tutorAPI.streamMessage.mockImplementation(async (_d,_c,_done,fail) => fail({ status:405 }));
    await act(async () => result.current.send('General question'));
    expect(tutorAPI.sendConversationMessage).not.toHaveBeenCalled();
    expect(tutorAPI.sendMessage).toHaveBeenCalledWith({ message:'General question', topic_id:undefined, mode:'socratic', conversation_id:1 }, 'a', expect.any(AbortSignal));
    expect(result.current.messages[1].text).toBe('General answer');
  });

});
