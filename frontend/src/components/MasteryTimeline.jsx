import React, { useEffect, useId, useMemo, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { analyticsAPI } from '../services/api';
import './MasteryTimeline.css';

import { normalizeMasteryHistory, validId } from '../utils/masteryHistory';

const percent = (value) => value === null ? 'Unavailable' : `${Math.round(value * 10) / 10}%`;

export default function MasteryTimeline({ topics = [] }) {
  const id = useId();
  const [selection, setSelection] = useState('all');
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ status: 'loading', rows: [], skipped: 0 });
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function load() {
      try {
        const response = await analyticsAPI.getMasteryHistory(undefined, { signal: controller.signal });
        const data = normalizeMasteryHistory(response.data);
        if (active) setState({ status: 'ready', ...data });
      } catch (error) {
        if (active) setState({ status: 'error', rows: [], skipped: 0, auth: [401, 403].includes(error?.response?.status) });
      }
    }
    load();
    return () => { active = false; controller.abort(); };
  }, [attempt]);

  const options = useMemo(() => {
    const names = new Map();
    if (Array.isArray(topics)) topics.forEach((topic) => {
      if (validId(topic?.topic_id)) names.set(topic.topic_id, typeof topic.topic_name === 'string' && topic.topic_name.trim() ? topic.topic_name : `Topic ${topic.topic_id}`);
    });
    state.rows.forEach((row) => { if (!names.has(row.topicId)) names.set(row.topicId, `Topic ${row.topicId}`); });
    return [...names].sort((a, b) => a[0] - b[0]);
  }, [topics, state.rows]);
  const rows = state.rows.filter((row) => selection === 'all' || String(row.topicId) === selection);
  const groups = options.filter(([topicId]) => rows.some((row) => row.topicId === topicId));
  const incomplete = state.skipped > 0 || rows.some((row) => row.timestamp === null || row.prior === null || row.posterior === null);

  return (
    <section className="ui-card mastery-timeline" aria-labelledby={`${id}-title`} style={{ gridColumn: '1 / -1', minWidth: 0, padding: '24px' }}>
      <h3 id={`${id}-title`}>Mastery timeline</h3>
      <p>Saved mastery estimates before and after each learning event. Each topic has its own timeline; events are equally spaced, not elapsed time.</p>
      <div className="mastery-timeline__filter">
      <label htmlFor={`${id}-topic`}>Timeline topic</label>
      <select id={`${id}-topic`} value={selection} onChange={(event) => setSelection(event.target.value)}>
        <option value="all">All topics</option>
        {options.map(([topicId, name]) => <option key={topicId} value={topicId}>{name}</option>)}
      </select>
      </div>
      {state.status === 'loading' && <p role="status">Loading mastery history…</p>}
      {state.status === 'error' && <div role="alert">
        <p>{state.auth ? 'Your session cannot access mastery history. Please sign in again.' : 'Could not load mastery history. Please try again.'}</p>
        <button type="button" onClick={() => { setState({ status: 'loading', rows: [], skipped: 0 }); setAttempt((value) => value + 1); }}>Retry mastery history</button>
      </div>}
      {state.status === 'ready' && <>
        <p role="status">{rows.length ? `${rows.length} saved mastery events.` : 'No mastery history yet for this selection. Complete a practice question to start your timeline.'}</p>
        {incomplete && <p>Some history is incomplete. Unavailable values are not plotted; records without dates appear last in the table.{state.skipped > 0 ? ` ${state.skipped} invalid records were omitted.` : ''}</p>}
        {groups.map(([topicId, name]) => {
          const chartRows = rows.filter((row) => row.topicId === topicId && row.timestamp !== null).map((row, index) => ({ ...row, event: index + 1, date: new Date(row.timestamp).toISOString() }));
          return <div key={topicId}>
            <h4>{name}</h4>
            {chartRows.length > 0 && <div role="region" aria-label={`${name} mastery chart. Exact values are available in the history table below.`}>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartRows} accessibilityLayer>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="event" label={{ value: 'Learning event (chronological)', position: 'insideBottom', offset: -2 }} height={45} />
                  <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ''} formatter={(value) => percent(value)} />
                  <Legend />
                  <Line name="Before event" dataKey="prior" stroke="#818cf8" strokeDasharray="5 3" connectNulls={false} isAnimationActive={false} />
                  <Line name="After event" dataKey="posterior" stroke="#10b981" connectNulls={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>}
          </div>;
        })}
        {rows.length > 0 && <details className="mastery-timeline__details">
          <summary>View mastery history table</summary>
          <p id={`${id}-scroll-hint`} className="mastery-timeline__scroll-hint">On smaller screens, scroll horizontally to see every column.</p>
          <div className="mastery-timeline__table-scroll" role="region" aria-label="Mastery history table, scrollable" aria-describedby={`${id}-scroll-hint`} tabIndex={0}>
            <table className="mastery-timeline__table">
              <caption>Mastery history, oldest first (times in UTC)</caption>
              <thead><tr><th scope="col">Event</th><th scope="col">Topic</th><th scope="col">Date (UTC)</th><th scope="col">Before event</th><th scope="col">After event</th></tr></thead>
              <tbody>{rows.map((row) => <tr key={`${row.id}-${row.index}`}><td>{row.id}</td><td>{options.find(([topicId]) => topicId === row.topicId)?.[1]}</td><td className="mastery-timeline__date">{row.timestamp === null ? 'Date unavailable' : new Date(row.timestamp).toISOString()}</td><td>{percent(row.prior)}</td><td>{percent(row.posterior)}</td></tr>)}</tbody>
            </table>
          </div>
        </details>}
      </>}
    </section>
  );
}
