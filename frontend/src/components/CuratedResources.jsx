import React from 'react';
import { ExternalLink } from 'lucide-react';

export default function CuratedResources({ recommendations }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {recommendations.map((res) => (
          <div
            key={res.id}
            className="glass-panel"
            style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span className="badge badge-info">{res.topic_name}</span>
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>
                  {Math.round((res.relevance_score || 0) * 100)}% Match
                </span>
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>{res.title}</h3>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '14px' }}>
                {res.summary}
              </p>

              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '16px',
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>Why recommended:</span>
                <span style={{ fontSize: '0.8rem', color: '#fbbf24' }}>{res.recommendation_reason}</span>
              </div>
            </div>

            <a
              href={res.url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Open Resource <ExternalLink size={14} />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
