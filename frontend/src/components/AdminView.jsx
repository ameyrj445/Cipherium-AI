import React, { useEffect, useId, useRef, useState } from 'react';
import { adminAPI } from '../services/api';
import './AdminView.css';

const PAGE_SIZE = 25;
const statuses = ['draft', 'review', 'published', 'archived'];
const feedbackTypes = ['too_easy', 'too_hard', 'not_relevant', 'rec_rating', 'tutor_rating', 'bug'];
const errorMessage = (error, mutation = false) => {
  const status = error?.response?.status;
  if (status === 401) return 'Your session has expired. Sign in again.';
  if (status === 403) return 'Administrator access is required. Your permissions may have changed.';
  if (status === 404) return 'This item or service is no longer available. Refresh the list.';
  if (status === 422 || status === 400) return 'The server rejected these values. Check the form and try again.';
  if (status === 429) return 'Too many requests. Wait before trying again.';
  return mutation ? 'The result could not be confirmed. Do not submit again until the saved state has been checked.' : 'Unable to load this list. Please try again.';
};
const ambiguous = (error) => !error?.response?.status || error.response.status >= 500;

function useAdminList(kind, token, filter, page, enabled) {
  const [state, setState] = useState({ rows: [], loading: false, error: '', key: null });
  const [revision, setRevision] = useState(0);
  const key = JSON.stringify([kind, token, filter, page, enabled, revision]);
  useEffect(() => {
    if (!enabled) return;
    let current = true;
    const controller = new AbortController();
    const params = { skip: page * PAGE_SIZE, limit: PAGE_SIZE };
    if (filter) params[kind === 'questions' ? 'status' : 'feedback_type'] = filter;
    const request = kind === 'questions' ? adminAPI.getQuestions : adminAPI.getFeedback;
    request(params, token, controller.signal).then(({ data }) => {
      if (current) setState({ key, rows: Array.isArray(data) ? data : [], loading: false, error: Array.isArray(data) ? '' : 'The server returned an invalid list.' });
    }).catch((error) => {
      if (current) setState({ key, rows: [], loading: false, error: errorMessage(error) });
    });
    return () => { current = false; controller.abort(); };
  }, [kind, token, filter, page, enabled, revision, key]);
  const visible = state.key === key ? state : { rows: [], loading: enabled, error: '' };
  return { ...visible, refresh: () => setRevision((value) => value + 1) };
}

// Lock before awaiting so rapid clicks cannot create two writes. Ignore results
// after unmount/session change. An aborted request may still have saved remotely.
function useAdminMutation() {
  const [state, setState] = useState({ busy: false, error: '', success: '', uncertain: false });
  const locked = useRef(false);
  const lifetime = useRef({ live: false, controller: null });
  useEffect(() => {
    const life = { live: true, controller: null };
    lifetime.current = life;
    return () => { life.live = false; life.controller?.abort(); };
  }, []);
  const run = async (action, onSuccess, success) => {
    if (locked.current) return;
    locked.current = true;
    const life = lifetime.current;
    life.controller = new AbortController();
    setState({ busy: true, error: '', success: '', uncertain: false });
    try {
      const response = await action(life.controller.signal);
      if (!life.live) return;
      setState({ busy: false, error: '', success, uncertain: false });
      locked.current = false;
      onSuccess(response.data);
    } catch (error) {
      if (!life.live) return;
      const uncertain = ambiguous(error);
      locked.current = uncertain;
      setState({ busy: false, error: errorMessage(error, true), success: '', uncertain });
    }
  };
  return { ...state, run };
}

function Notices({ state }) {
  return <>{state.error && <p role="alert">{state.error}</p>}{state.success && <p role="status">{state.success}</p>}</>;
}
function Pager({ page, setPage, list }) {
  return <div className="admin-actions" aria-label="Pagination">
    <button type="button" disabled={page === 0 || list.loading} onClick={() => setPage(page - 1)}>Previous page</button>
    <span>Page {page + 1}</span>
    <button type="button" disabled={list.loading || !!list.error || list.rows.length < PAGE_SIZE} onClick={() => setPage(page + 1)}>Next page</button>
    <button type="button" disabled={list.loading} onClick={list.refresh}>Refresh list</button>
  </div>;
}
function TopicField({ topics, prefix }) {
  return <label htmlFor={`${prefix}-topic`}>Topic<select id={`${prefix}-topic`} name="topic_id" required defaultValue="">
    <option value="" disabled>Select a topic</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
  </select></label>;
}
function DifficultyField({ prefix }) {
  return <label htmlFor={`${prefix}-difficulty`}>Difficulty<select id={`${prefix}-difficulty`} name="difficulty" defaultValue="1">{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>;
}
function QuestionForm({ token, topics, onCreated }) {
  const mutation = useAdminMutation();
  const [validation, setValidation] = useState('');
  const prefix = useId();
  const submit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const options = String(data.get('options')).split('\n').map((value) => value.trim()).filter(Boolean);
    const text = String(data.get('question_text')).trim();
    const answer = String(data.get('correct_answer')).trim();
    const topic = Number(data.get('topic_id'));
    if (!text || options.length < 2 || new Set(options).size !== options.length || !options.includes(answer) || !topics.some((item) => Number(item.id) === topic)) {
      setValidation('Enter a question, choose a topic, and provide at least two unique options. The correct answer must exactly match one option.'); return;
    }
    setValidation('');
    mutation.run((signal) => adminAPI.createQuestion({ topic_id: topic, question_text: text, options, correct_answer: answer, difficulty: Number(data.get('difficulty')), explanation: String(data.get('explanation')).trim() || null, status: 'draft' }, token, signal), () => { form.reset(); onCreated(); }, 'Question saved as a draft.');
  };
  return <form onSubmit={submit} className="admin-form" aria-label="Add question">
    <h3>Add Question</h3><p>New questions are saved as drafts for review.</p>
    <fieldset disabled={mutation.busy || mutation.uncertain}><legend>Question details</legend>
      <TopicField topics={topics} prefix={prefix} />
      <label htmlFor={`${prefix}-text`}>Question text<textarea id={`${prefix}-text`} name="question_text" required maxLength={10000} /></label>
      <label htmlFor={`${prefix}-options`}>Options (one per line)<textarea id={`${prefix}-options`} name="options" required maxLength={10000} /></label>
      <label htmlFor={`${prefix}-answer`}>Correct answer<input id={`${prefix}-answer`} name="correct_answer" required maxLength={2000} /></label>
      <DifficultyField prefix={prefix} />
      <label htmlFor={`${prefix}-explanation`}>Explanation (optional)<textarea id={`${prefix}-explanation`} name="explanation" maxLength={10000} /></label>
      <button type="submit" disabled={!topics.length}>{mutation.busy ? 'Saving question…' : 'Save draft question'}</button>
    </fieldset>
    {!topics.length && <p role="status">Topics are unavailable. Reload the application before adding content.</p>}
    {validation && <p role="alert">{validation}</p>}<Notices state={mutation} />
  </form>;
}
function Questions({ token, topics, enabled }) {
  const [filter, setFilter] = useState('draft');
  const [page, setPage] = useState(0);
  const list = useAdminList('questions', token, filter, page, enabled);
  const mutation = useAdminMutation();
  const prefix = useId();
  const update = (question, status) => mutation.run((signal) => adminAPI.updateQuestionStatus(question.id, status, token, signal), () => list.refresh(), `Question ${question.id} marked ${status}.`);
  return <>
    <h2>Questions</h2>
    <label htmlFor={prefix}>Question status<select id={prefix} value={filter} disabled={mutation.busy} onChange={(event) => { setFilter(event.target.value); setPage(0); }}><option value="">All statuses</option>{statuses.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
    <Notices state={mutation} />
    {mutation.uncertain && <p>Refresh the list to inspect the result. Further status changes are blocked while this panel remains open to avoid an unconfirmed repeat.</p>}
    {list.loading && <p role="status">Loading questions…</p>}
    {list.error && <p role="alert">{list.error}</p>}
    {!list.loading && !list.error && !list.rows.length && <p>No questions found.</p>}
    <ul className="admin-question-list">{list.rows.map((question) => <li key={question.id}>
      <h3>Question {question.id}</h3><p className="admin-content">{question.question_text}</p>
      <p>Topic: {topics.find((topic) => topic.id === question.topic_id)?.name || `ID ${question.topic_id}`} · Difficulty: {question.difficulty} · Status: {question.status}</p>
      <div className="admin-actions">
        <button type="button" disabled={mutation.busy || mutation.uncertain || list.loading || question.status === 'published'} onClick={() => update(question, 'published')}>Publish question {question.id}</button>
        <button type="button" disabled={mutation.busy || mutation.uncertain || list.loading || question.status === 'archived'} onClick={() => update(question, 'archived')}>Archive question {question.id}</button>
      </div>
    </li>)}</ul>
    <Pager page={page} setPage={setPage} list={list} />
    <QuestionForm token={token} topics={topics} onCreated={list.refresh} />
  </>;
}
function Resources({ token, topics }) {
  const mutation = useAdminMutation();
  const [validation, setValidation] = useState('');
  const [created, setCreated] = useState([]);
  const prefix = useId();
  const submit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get('title')).trim();
    const url = String(data.get('url')).trim();
    const topic = Number(data.get('topic_id'));
    const minutes = Number(data.get('estimated_minutes'));
    let safeURL = false;
    try { safeURL = ['http:', 'https:'].includes(new URL(url).protocol); } catch { /* invalid URL */ }
    if (!title || !safeURL || !topics.some((item) => Number(item.id) === topic) || !Number.isInteger(minutes) || minutes < 1 || minutes > 10080) {
      setValidation('Enter a title, choose a topic, use an HTTP(S) URL, and set a whole-number duration from 1 to 10080 minutes.'); return;
    }
    setValidation('');
    mutation.run((signal) => adminAPI.createResource({ topic_id: topic, title, resource_type: String(data.get('resource_type')), url, difficulty: Number(data.get('difficulty')), estimated_minutes: minutes, summary: String(data.get('summary')).trim() || null }, token, signal), (resource) => { setCreated((rows) => [...rows, resource]); form.reset(); }, 'Resource created.');
  };
  return <>
    <h2>Resources</h2><p role="note">Existing-resource listing and editing are not available yet: the backend does not expose these admin endpoints. Added resources below are only those created in this visit, not the complete library.</p>
    <form onSubmit={submit} className="admin-form" aria-label="Add resource">
      <h3>Add Resource</h3><fieldset disabled={mutation.busy || mutation.uncertain}><legend>Resource details</legend>
        <TopicField topics={topics} prefix={prefix} />
        <label htmlFor={`${prefix}-title`}>Title<input id={`${prefix}-title`} name="title" required maxLength={500} /></label>
        <label htmlFor={`${prefix}-url`}>URL<input id={`${prefix}-url`} name="url" type="url" required maxLength={4000} /></label>
        <label htmlFor={`${prefix}-type`}>Resource type<select id={`${prefix}-type`} name="resource_type" defaultValue="article">{['article', 'video', 'exercise', 'cheatsheet'].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <DifficultyField prefix={prefix} />
        <label htmlFor={`${prefix}-minutes`}>Estimated minutes<input id={`${prefix}-minutes`} name="estimated_minutes" type="number" min="1" max="10080" step="1" defaultValue="15" required /></label>
        <label htmlFor={`${prefix}-summary`}>Summary (optional)<textarea id={`${prefix}-summary`} name="summary" maxLength={10000} /></label>
        <button type="submit" disabled={!topics.length}>{mutation.busy ? 'Saving resource…' : 'Save resource'}</button>
      </fieldset>
      {!topics.length && <p role="status">Topics are unavailable. Reload the application before adding content.</p>}
      {validation && <p role="alert">{validation}</p>}<Notices state={mutation} />
    </form>
    {!!created.length && <section aria-label="Resources added this visit"><h3>Added this visit</h3><ul>{created.map((resource) => <li key={resource.id}>{resource.title} (ID {resource.id})</li>)}</ul></section>}
  </>;
}
function Feedback({ token, enabled }) {
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const list = useAdminList('feedback', token, filter, page, enabled);
  const prefix = useId();
  return <>
    <h2>Feedback</h2><p>Read-only feedback across users. Comments are displayed as plain text.</p>
    <label htmlFor={prefix}>Feedback type<select id={prefix} value={filter} onChange={(event) => { setFilter(event.target.value); setPage(0); }}><option value="">All types</option>{feedbackTypes.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
    {list.loading && <p role="status">Loading feedback…</p>}{list.error && <p role="alert">{list.error}</p>}
    {!list.loading && !list.error && !list.rows.length && <p>No feedback found.</p>}
    {!!list.rows.length && <div className="admin-table-scroll" role="region" aria-label="Feedback table" tabIndex={0}>
      <table><caption>User feedback reports</caption><thead><tr>{['ID', 'User', 'Type', 'Target', 'Rating', 'Comment', 'Created'].map((heading) => <th scope="col" key={heading}>{heading}</th>)}</tr></thead>
        <tbody>{list.rows.map((item) => <tr key={item.id}><td>{item.id}</td><td>{item.user_id ?? '—'}</td><td>{item.feedback_type}</td><td>{item.target_id ?? '—'}</td><td>{item.rating ?? '—'}</td><td className="admin-content">{item.comment || '—'}</td><td>{item.created_at || '—'}</td></tr>)}</tbody>
      </table>
    </div>}
    <Pager page={page} setPage={setPage} list={list} />
  </>;
}
function AuthorizedAdmin({ token, topics }) {
  const [tab, setTab] = useState('Questions');
  const tabs = ['Questions', 'Resources', 'Feedback'];
  const prefix = useId();
  const tabRefs = useRef([]);
  const navigate = (event, index) => {
    const next = event.key === 'ArrowRight' ? (index + 1) % 3 : event.key === 'ArrowLeft' ? (index + 2) % 3 : event.key === 'Home' ? 0 : event.key === 'End' ? 2 : null;
    if (next === null) return;
    event.preventDefault(); setTab(tabs[next]); tabRefs.current[next]?.focus();
  };
  return <section className="admin-view" aria-label="Admin dashboard">
    <h1>Admin dashboard</h1><p>Manage curriculum content and review feedback.</p>
    <div role="tablist" aria-label="Administration sections" className="admin-tabs">{tabs.map((name, index) => <button key={name} ref={(node) => { tabRefs.current[index] = node; }} type="button" role="tab" id={`${prefix}-${name}`} aria-controls={`${prefix}-${name}-panel`} aria-selected={tab === name} tabIndex={tab === name ? 0 : -1} onKeyDown={(event) => navigate(event, index)} onClick={() => setTab(name)}>{name}</button>)}</div>
    {tabs.map((name) => <div key={name} role="tabpanel" id={`${prefix}-${name}-panel`} aria-labelledby={`${prefix}-${name}`} hidden={tab !== name} tabIndex={0}>
      {name === 'Questions' ? <Questions token={token} topics={topics} enabled={tab === name} /> : name === 'Resources' ? <Resources token={token} topics={topics} /> : <Feedback token={token} enabled={tab === name} />}
    </div>)}
  </section>;
}
export default function AdminView({ user, token, topics = [] }) {
  if (user?.role !== 'admin' || !token) return <section className="admin-view"><h1>Admin dashboard</h1><p role="alert">Administrator access is required.</p></section>;
  return <AuthorizedAdmin key={`${token}:${user.id}`} token={token} topics={topics} />;
}
