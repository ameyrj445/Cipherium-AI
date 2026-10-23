import React from 'react';
import { CheckCircle2, Circle, ChevronRight, Lock, ExternalLink, Sparkles } from 'lucide-react';

export default function StudyPlanPanel({ plan, onOpenFullPlan, onUpdateProgress, onRegeneratePlan }) {
  const milestones = plan?.milestones || [];
  const activeSubject = plan?.subject || 'No active study plan';

  // Calculate stats
  let totalSubs = 0;
  let doneSubs = 0;
  milestones.forEach((m) => {
    totalSubs += (m.subtopics || []).length;
    doneSubs += (m.completed_subtopics || []).length;
  });
  const pct = totalSubs > 0 ? Math.round((doneSubs / totalSubs) * 100) : 0;

  return (
    <div className="ui-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>Active Study Plan</h3>
            <span className="badge badge-popular" style={{ fontSize: '0.66rem', padding: '2px 8px' }}>
              {pct}% Done
            </span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
            {activeSubject} • {milestones.length} Milestones
          </div>
        </div>
        <button
          onClick={onOpenFullPlan}
          className="btn btn-primary"
          style={{ fontSize: '0.72rem', padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Sparkles size={12} /> Manage Plan
        </button>
      </div>

      {/* Progress Bar */}
      <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', marginBottom: '14px' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#2563eb', borderRadius: '4px', transition: 'width 0.3s ease' }} />
      </div>

      {/* Timeline Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {milestones.slice(0, 4).map((m, idx) => {
          const isDone = m.status === 'completed';
          const isInProgress = m.status === 'in_progress' || idx === 0;
          const completedSubs = m.completed_subtopics || [];
          const subtopics = m.subtopics || [];

          return (
            <div
              key={m.id || idx}
              style={{
                border: isDone ? '1px solid #bbf7d0' : isInProgress ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                background: isDone ? '#f0fdf4' : isInProgress ? '#eff6ff' : '#fff',
                borderRadius: '12px',
                padding: '12px',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isInProgress ? '8px' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '6px',
                      background: isDone ? '#10b981' : isInProgress ? '#3b82f6' : '#cbd5e1',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                    }}
                  >
                    {isDone ? '✓' : idx + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isInProgress ? '#1e3a8a' : isDone ? '#14532d' : '#334155' }}>
                      {m.title}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: isInProgress ? '#60a5fa' : '#64748b' }}>
                      {completedSubs.length} of {subtopics.length} items done • {m.estimated_hours} hrs
                    </div>
                  </div>
                </div>

                <button
                  onClick={onOpenFullPlan}
                  style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '4px' }}
                >
                  <ChevronRight size={15} />
                </button>
              </div>

              {/* Subtopics snippet for in-progress stage */}
              {isInProgress && subtopics.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', paddingLeft: '30px', marginTop: '6px' }}>
                  {subtopics.slice(0, 3).map((sub, sIdx) => {
                    const isChecked = completedSubs.includes(sub);
                    return (
                      <div
                        key={sIdx}
                        onClick={() =>
                          onUpdateProgress &&
                          onUpdateProgress({
                            milestone_id: m.id,
                            subtopic_name: sub,
                            subtopic_completed: !isChecked,
                          })
                        }
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.74rem',
                          color: isChecked ? '#15803d' : '#1e293b',
                          cursor: 'pointer',
                          textDecoration: isChecked ? 'line-through' : 'none',
                        }}
                      >
                        {isChecked ? (
                          <CheckCircle2 size={13} color="#10b981" />
                        ) : (
                          <Circle size={13} color="#94a3b8" />
                        )}
                        <span>{sub}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '14px', textAlign: 'center' }}>
        <button
          onClick={onOpenFullPlan}
          style={{
            background: 'none',
            border: 'none',
            color: '#2563eb',
            fontSize: '0.76rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          View Full Curriculum & Resources <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
