import React from 'react';
import { CheckCircle2, Circle, ChevronRight, Compass } from 'lucide-react';

export default function StudyPlanPanel({ plan, onOpenFullPlan, onUpdateProgress, _onRegeneratePlan }) {
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
    <div className="ui-card" style={{ padding: '20px', background: '#1E1E22', border: '1px solid #2D2D35' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#F3F4F6' }}>Active Study Plan</h3>
            <span className="badge badge-popular" style={{ fontSize: '0.66rem', padding: '2px 8px' }}>
              {pct}% Done
            </span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#9CA3AF' }}>
            {activeSubject} • {milestones.length} Milestones
          </div>
        </div>
        <button
          onClick={onOpenFullPlan}
          className="btn btn-primary"
          style={{ fontSize: '0.74rem', padding: '5px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          <Compass size={13} /> Manage Plan
        </button>
      </div>

      {/* Progress Bar */}
      <div style={{ height: '6px', background: '#161618', borderRadius: '4px', overflow: 'hidden', marginBottom: '14px', border: '1px solid #2D2D35' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#6366F1', borderRadius: '4px', transition: 'width 0.3s ease' }} />
      </div>

      {/* Timeline Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {milestones.slice(0, 4).map((m, idx) => {
          const isDone = m.status === 'completed';
          const isInProgress = m.status === 'in_progress' || idx === 0;
          const completedSubs = m.completed_subtopics || [];
          const subtopics = m.subtopics || [];

          return (
            <div
              key={m.id || idx}
              style={{
                border: isDone ? '1px solid rgba(16, 185, 129, 0.3)' : isInProgress ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid #2D2D35',
                background: isDone ? 'rgba(16, 185, 129, 0.05)' : isInProgress ? 'rgba(99, 102, 241, 0.08)' : '#161618',
                borderRadius: '8px',
                padding: '10px 12px',
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
                      background: isDone ? '#10B981' : isInProgress ? '#6366F1' : '#2D2D35',
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
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isInProgress ? '#818CF8' : isDone ? '#34D399' : '#F3F4F6' }}>
                      {m.title}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#9CA3AF' }}>
                      {completedSubs.length} of {subtopics.length} items done • {m.estimated_hours} hrs
                    </div>
                  </div>
                </div>

                <button
                  onClick={onOpenFullPlan}
                  style={{ background: 'none', border: 'none', color: '#818CF8', cursor: 'pointer', padding: '4px' }}
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
                          color: isChecked ? '#34D399' : '#F3F4F6',
                          cursor: 'pointer',
                          textDecoration: isChecked ? 'line-through' : 'none',
                        }}
                      >
                        {isChecked ? (
                          <CheckCircle2 size={13} color="#10B981" />
                        ) : (
                          <Circle size={13} color="#6B7280" />
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
            color: '#818CF8',
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
