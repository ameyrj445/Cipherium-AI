import React from 'react';
import { ExternalLink } from 'lucide-react';

export default function StudyRoadmap({ roadmap }) {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div
        className="glass-panel"
        style={{ padding: '28px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>Weekly Study Milestone Plan</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Prioritized sequence: Weak topics are scheduled first to optimize study efficiency.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#818cf8' }}>
            {roadmap?.total_estimated_hours || 0} Hours
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Paced at {roadmap?.target_hours_per_week || 10} hrs/week
          </div>
        </div>
      </div>

      {/* Tasks Sequence Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {roadmap?.tasks?.map((task) => (
          <div
            key={task.task_id}
            className="glass-panel"
            style={{ padding: '24px', borderLeft: task.priority === 'High' ? '4px solid #f43f5e' : '4px solid #6366f1' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {task.milestone}
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                  {task.topic_name}
                </h3>
              </div>
              <span className={`badge ${task.priority === 'High' ? 'badge-weak' : 'badge-info'}`}>
                {task.priority} Priority • {task.estimated_hours} hrs
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Recommended study items for this milestone:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {task.recommended_resources?.map((res) => (
                <div
                  key={res.id}
                  style={{
                    padding: '12px 14px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{res.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'capitalize' }}>
                      {res.resource_type} • {res.estimated_minutes} mins
                    </div>
                  </div>
                  <a href={res.url} target="_blank" rel="noreferrer" style={{ color: '#818cf8', padding: '6px' }}>
                    <ExternalLink size={16} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
