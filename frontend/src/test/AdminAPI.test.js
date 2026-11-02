import { beforeEach, describe, expect, it, vi } from 'vitest';
import api, { adminAPI, setSessionToken } from '../services/api';

beforeEach(() => { vi.restoreAllMocks(); setSessionToken('admin-token'); });
describe('Admin API contract', () => {
  it('binds question list to session, timeout, abort and pagination', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: [] });
    const signal = new AbortController().signal;
    await adminAPI.getQuestions({ status: 'draft', skip: 25, limit: 25 }, 'admin-token', signal);
    expect(get).toHaveBeenCalledWith('/admin/questions', { params: { status: 'draft', skip: 25, limit: 25 }, expectedSessionToken: 'admin-token', signal, timeout: 15000 });
  });
  it('patches only the lifecycle status', async () => {
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: {} });
    await adminAPI.updateQuestionStatus(7, 'published', 'admin-token');
    expect(patch).toHaveBeenCalledWith('/admin/questions/7/status', { status: 'published' }, { expectedSessionToken: 'admin-token', signal: undefined, timeout: 15000 });
  });
  it('uses supported resource and question creation routes', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: {} });
    const resource = { title: 'Resource' }; const question = { question_text: 'Question?' };
    await adminAPI.createResource(resource, 'admin-token'); await adminAPI.createQuestion(question, 'admin-token');
    expect(post).toHaveBeenNthCalledWith(1, '/admin/resources', resource, expect.objectContaining({ expectedSessionToken: 'admin-token', timeout: 15000 }));
    expect(post).toHaveBeenNthCalledWith(2, '/admin/questions', question, expect.objectContaining({ expectedSessionToken: 'admin-token' }));
  });
  it('filters feedback server-side and does not provide invented resource editing APIs', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: [] });
    await adminAPI.getFeedback({ feedback_type: 'bug', skip: 0, limit: 25 }, 'admin-token');
    expect(get).toHaveBeenCalledWith('/admin/feedback', expect.objectContaining({ params: { feedback_type: 'bug', skip: 0, limit: 25 }, expectedSessionToken: 'admin-token' }));
    expect(adminAPI.getResources).toBeUndefined(); expect(adminAPI.updateResource).toBeUndefined();
  });
  it('rejects a queued admin request if the login changed', () => {
    const interceptor = api.interceptors.request.handlers[0].fulfilled;
    setSessionToken('different-user');
    expect(() => interceptor({ headers: {}, expectedSessionToken: 'admin-token' })).toThrow();
  });
});
