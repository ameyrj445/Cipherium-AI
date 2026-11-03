import { isMonthlyQuotaError } from '../utils/aiQuota';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { tutorAPI } from '../services/api';

const PAGE_SIZE = 20;
const empty = (token) => ({ token, items: [], activeId: 'legacy', messages: [], topicId: null,
  quotaExceeded: false, listLoading: false, listError: '', hasMore: false, loadingMessages: false, error: '', creating: false, thinking: false, blocked: false });
const validId = (id) => Number.isSafeInteger(id) && id > 0;
const mapMessages = (rows) => rows.filter((m) => m && ['user', 'assistant'].includes(m.role)).map((m) => ({
  id: m.id, role: m.role, text: m.message || '', created_at: m.created_at,
}));

// Each request is bound to both a login and a view generation. Aborting a stream
// stops local updates, but cannot promise to cancel a write already on the server.
export function useTutorConversations(token) {
  const [state, setState] = useState(() => empty(token));
  const current = useRef(state);
  const session = useRef(token);
  const generation = useRef(0);
  const listGeneration = useRef(0);
  const offset = useRef(0);
  const activeRequest = useRef(null);
  const streamTimer = useRef(null);
  const update = useCallback((values) => {
    current.current = { ...current.current, ...(typeof values === 'function' ? values(current.current) : values) };
    setState(current.current);
  }, []);
  const invalidate = useCallback(() => {
    generation.current += 1;
    clearTimeout(streamTimer.current);
    activeRequest.current?.abort();
    activeRequest.current = null;
  }, []);

  const list = useCallback(async (append = false) => {
    const expected = session.current;
    if (!expected || (append && current.current.listLoading)) return;
    const request = ++listGeneration.current;
    const skip = append ? offset.current : 0;
    update({ listLoading: true, listError: '' });
    try {
      const response = await tutorAPI.getConversations({ skip, limit: PAGE_SIZE }, expected);
      if (session.current !== expected || request !== listGeneration.current) return;
      if (!Array.isArray(response.data)) throw new Error('Invalid conversation list');
      const rows = response.data.filter((c) => validId(c?.id));
      offset.current = skip + response.data.length;
      update((s) => ({ items: [...new Map([...(append ? s.items : []), ...rows].map((c) => [c.id, c])).values()],
        hasMore: response.data.length === PAGE_SIZE, listLoading: false }));
    } catch {
      if (session.current === expected && request === listGeneration.current) update({ listLoading: false, listError: 'Could not load conversations. Please retry.' });
    }
  }, [update]);

  const select = useCallback(async (id) => {
    if (id !== 'legacy' && !validId(id)) return;
    invalidate();
    const expected = session.current;
    if (!expected) return;
    const request = generation.current;
    const controller = new AbortController();
    activeRequest.current = controller;
    update({ activeId: id, messages: [], topicId: current.current.items.find((c) => c.id === id)?.topic_id || null,
      loadingMessages: true, creating: false, thinking: false, error: '', blocked: true });
    try {
      const response = id === 'legacy'
        ? await tutorAPI.getHistory(30, expected, controller.signal)
        : await tutorAPI.getConversationMessages(id, expected, controller.signal);
      if (session.current !== expected || request !== generation.current) return;
      if (!Array.isArray(response.data)) throw new Error('Invalid messages');
      update({ messages: mapMessages(response.data), loadingMessages: false, blocked: false });
    } catch {
      if (session.current === expected && request === generation.current) update({ loadingMessages: false,
        error: 'Could not load these messages. Select this conversation again to retry.', messages: [] });
    }
  }, [invalidate, update]);

  useLayoutEffect(() => {
    session.current = token;
    invalidate();
    listGeneration.current += 1;
    offset.current = 0;
    update(empty(token));
    if (token) { void list(); void select('legacy'); }
    return () => { session.current = ''; invalidate(); listGeneration.current += 1; };
  }, [token, invalidate, list, select, update]);

  const newConversation = useCallback(async (topicName = 'General') => {
    if (!session.current || current.current.creating) return;
    invalidate();
    const expected = session.current;
    const request = generation.current;
    const topicId = current.current.topicId;
    const title = `${topicName || 'General'} discussion · ${new Date().toLocaleString()}`.slice(0, 200);
    const controller = new AbortController();
    activeRequest.current = controller;
    update({ activeId: null, messages: [], topicId, error: '', loadingMessages: false, creating: true, thinking: false, blocked: true });
    try {
      const response = await tutorAPI.createConversation({ title, topic_id: topicId || undefined }, expected, controller.signal);
      if (session.current !== expected || request !== generation.current) return;
      if (!validId(response.data?.id)) throw new Error('Invalid conversation');
      listGeneration.current += 1;
      update((prev) => ({ activeId: response.data.id, creating: false, blocked: false, listLoading: false,
        items: [response.data, ...prev.items.filter((c) => c.id !== response.data.id)] }));
    } catch {
      if (session.current === expected && request === generation.current) update({ creating: false, blocked: true,
        error: 'Could not confirm conversation creation. Refresh the list and reopen any new conversation before starting another: a conversation may already have been created.' });
    }
  }, [invalidate, update]);

  const send = useCallback(async (text, mode = 'socratic') => {
    text = text.trim();
    const s = current.current;
    if (!text || !session.current || s.quotaExceeded || s.thinking || s.creating || s.loadingMessages || s.blocked || !validId(s.activeId)) return false;
    const expected = session.current;
    const request = ++generation.current;
    const controller = new AbortController();
    activeRequest.current = controller;
    const isCurrent = () => session.current === expected && generation.current === request;
    const id = s.activeId;
    const topic = s.topicId;
    update({ thinking: true, error: '' });
    const previous = current.current.messages;
    update({ messages: [...previous, { role: 'user', text }, { role: 'assistant', text: '', streaming: true, mode }], creating: false });
    const index = previous.length + 1;
    let received = '';
    let settled = false;
    const answer = (values) => {
      if (!isCurrent()) return;
      update((prev) => ({ messages: prev.messages.map((m, i) => i === index ? { ...m, ...values } : m) }));
    };
    const finish = (payload = {}) => {
      if (!isCurrent() || settled) return;
      settled = true;
      clearTimeout(streamTimer.current);
      activeRequest.current = null;
      answer({ text: received, streaming: false, mode: payload.mode || mode, suggested_resources: payload.suggested_resources || [] });
      update({ thinking: false });
      void list();
    };
    const quotaFailure = (error) => {
      if (!isCurrent() || received || !isMonthlyQuotaError(error)) return false;
      // An explicit pre-stream quota rejection did not save this outgoing turn.
      update({ thinking: false, quotaExceeded: true, messages: previous, error: '' });
      return true;
    };
    const fail = async (error) => {
      if (!isCurrent() || settled) return;
      settled = true;
      clearTimeout(streamTimer.current);
      if (quotaFailure(error)) return;
      // Only an explicit unsupported endpoint can be safely retried through the
      // non-streaming route. A broken connection may already have saved a turn.
      if (!received && [404, 405, 501].includes(error?.status)) {
        try {
          const payload = { message: text, topic_id: topic || undefined, mode, conversation_id: id };
          // The conversation wrapper inherits a saved topic for null topic_id.
          // General context therefore uses the owned, explicitly scoped chat API.
          const response = topic
            ? await tutorAPI.sendConversationMessage(id, payload, expected, controller.signal)
            : await tutorAPI.sendMessage(payload, expected, controller.signal);
          if (!isCurrent()) return;
          answer({ text: response.data.response, streaming: false, mode: response.data.mode || mode, suggested_resources: response.data.suggested_resources || [] });
          update({ thinking: false });
          void list();
          return;
        } catch (fallbackError) {
          if (quotaFailure(fallbackError)) return;
          /* Ambiguous fallback failure is not retried. */
        }
      }
      if (isCurrent()) {
        answer({ streaming: false });
        update({ thinking: false, blocked: true, error: 'The response could not be confirmed. Reopen this conversation to check saved messages before sending again.' });
      }
    };
    streamTimer.current = setTimeout(() => { void fail(new Error('Response timeout')); controller.abort(); }, 90000);
    try {
      await tutorAPI.streamMessage({ message: text, topic_id: topic || undefined, mode, conversation_id: id },
        (chunk) => { if (!isCurrent() || settled) return; received += chunk || ''; answer({ text: received }); }, finish, fail,
        controller.signal, expected);
    } catch (error) { await fail(error); }
    return true;
  }, [list, update]);

  const visible = state.token === token ? state : empty(token);
  return { ...visible, select, showLegacy: () => select('legacy'), newConversation,
    refresh: () => list(), loadMore: () => list(true), send,
    setTopicId: (topicId) => update({ topicId }) };
}
