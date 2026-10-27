import React, { useEffect, useState } from 'react';
import { BrainCircuit, Clock, AlertTriangle, CheckCircle2, RotateCcw, ArrowRight, Sparkles } from 'lucide-react';
import { analyticsAPI } from '../services/api';

export default function RetentionScheduleCard({ onStartQuiz }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    analyticsAPI.getRetentionSchedule()
      .then((res) => {
        if (isMounted) {
          setData(res.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError('Failed to load retention schedule');
          setLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', textAlign: 'center', color: 'var(--text-dim)' }}>
        Loading cognitive retention schedule...
      </div>
    );
  }

  if (error || !data) return null;

  const dueItems = (data.schedule || []).filter(
    (item) => item.retention_status === 'critical_review' || item.retention_status === 'review_recommended'
  );

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BrainCircuit size={20} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Cognitive Retention & Spaced Repetition (Ebbinghaus SM-2)
              <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(99,102,241,0.2)', color: '#818cf8', fontWeight: 700 }}>
                BKT Powered
              </span>
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: '3px 0 0' }}>
              Scientifically calculates memory decay curves and schedules optimal revision moments before forgetting occurs.
            </p>
          </div>
        </div>

        {/* Due Counter Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '20px',
          background: (data.due_today_count ?? 0) > 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: (data.due_today_count ?? 0) > 0 ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          {(data.due_today_count ?? 0) > 0 ? (
            <>
              <AlertTriangle size={15} color="#fb7185" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fb7185' }}>
                {data.due_today_count} {data.due_today_count === 1 ? 'Topic' : 'Topics'} Due for Revision
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 size={15} color="#34d399" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399' }}>
                All Retention States Optimal
              </span>
            </>
          )}
        </div>
      </div>

      {/* Grid of Scheduled Topics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '14px' }}>
        {!(data.schedule && data.schedule.length > 0) ? (
          <div style={{ gridColumn: '1 / -1', padding: '16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No learning topics scheduled yet. Take your first diagnostic quiz to calibrate your spaced repetition curve!
          </div>
        ) : (dueItems.length > 0 ? dueItems : (data.schedule || []).slice(0, 3)).map((item) => {
          const retentionPct = Math.round((item.retention_rate ?? 1.0) * 100);
          const bktPct = Math.round((item.bkt_probability ?? 0.5) * 100);
          const isCritical = item.retention_status === 'critical_review';
          const isRec = item.retention_status === 'review_recommended';

          return (
            <div
              key={item.topic_id}
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                background: isCritical
                  ? 'rgba(244, 63, 94, 0.06)'
                  : isRec
                  ? 'rgba(251, 191, 36, 0.06)'
                  : 'rgba(255, 255, 255, 0.02)',
                border: isCritical
                  ? '1px solid rgba(244, 63, 94, 0.25)'
                  : isRec
                  ? '1px solid rgba(251, 191, 36, 0.25)'
                  : '1px solid rgba(255, 255, 255, 0.07)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '10px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8' }}>{item.topic_code}</span>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '8px',
                    background: isCritical ? '#f43f5e' : isRec ? '#d97706' : '#10b981',
                    color: '#fff'
                  }}>
                    {isCritical ? 'Critical Review' : isRec ? 'Review Recommended' : 'Retention Safe'}
                  </span>
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: '0.92rem', color: '#fff', fontWeight: 700 }}>
                  {item.topic_name}
                </h4>
              </div>

              {/* Progress Gauges */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Memory Retention Curve</span>
                    <strong style={{ color: retentionPct < 60 ? '#fb7185' : retentionPct < 80 ? '#fbbf24' : '#34d399' }}>
                      {retentionPct}%
                    </strong>
                  </div>
                  <div style={{ height: '6px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${retentionPct}%`,
                      height: '100%',
                      background: retentionPct < 60 ? '#f43f5e' : retentionPct < 80 ? '#fbbf24' : '#10b981'
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  <span>BKT Latent Mastery: <strong style={{ color: '#818cf8' }}>P(L) = {bktPct}%</strong></span>
                  <span>{item.attempt_count ?? 0} attempts</span>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => onStartQuiz?.(item.topic_id)}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  fontSize: '0.76rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <RotateCcw size={13} /> Take 3-Min Retention Quiz
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
