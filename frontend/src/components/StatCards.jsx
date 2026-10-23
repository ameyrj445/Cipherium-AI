import React from 'react';
import { BarChart2, BookOpen, Brain, Flame, Clock } from 'lucide-react';

export default function StatCards({
  customPlan = null,
  overallProgress = 0,
  topicsCompleted = 0,
  weakTopics = 0,
  dayStreak = 0,
}) {
  let displayProgress = overallProgress;
  let displayCompleted = topicsCompleted;
  let displayLabel = 'Topics Completed';
  let hoursCompleted = 0;
  let totalHours = 0;

  if (customPlan && customPlan.milestones) {
    let totalSubs = 0;
    let doneSubs = 0;
    customPlan.milestones.forEach((m) => {
      totalSubs += (m.subtopics || []).length;
      doneSubs += (m.completed_subtopics || []).length;
    });

    displayProgress = totalSubs > 0 ? Math.round((doneSubs / totalSubs) * 100) : 0;
    displayCompleted = doneSubs;
    displayLabel = `Subtopics (${doneSubs}/${totalSubs})`;
    hoursCompleted = customPlan.completed_hours || 0;
    totalHours = customPlan.total_estimated_hours || (customPlan.duration_weeks * customPlan.target_hours_per_week);
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '22px' }}>
      <div className="ui-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: '#ecfdf5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BarChart2 size={22} color="#10b981" />
        </div>
        <div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>{displayProgress}%</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {customPlan ? 'Plan Progress' : 'Add a plan to begin'}
          </div>
        </div>
      </div>

      <div className="ui-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: '#f5f3ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BookOpen size={22} color="#8b5cf6" />
        </div>
        <div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>{displayCompleted}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{displayLabel}</div>
        </div>
      </div>

      <div className="ui-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: customPlan ? '#eff6ff' : '#fff1f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {customPlan ? (
            <Clock size={22} color="#2563eb" />
          ) : (
            <div style={{ position: 'relative' }}>
              <Brain size={22} color="#f43f5e" />
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#f43f5e',
                }}
              ></span>
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
            {customPlan ? `${hoursCompleted}/${totalHours}h` : weakTopics}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {customPlan ? `${Math.max(totalHours - hoursCompleted, 0)}h remaining` : 'Plans in Learn'}
          </div>
        </div>
      </div>

      <div className="ui-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: '#fffbeb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Flame size={22} color="#f59e0b" />
        </div>
        <div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>{dayStreak}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Day Streak</div>
        </div>
      </div>
    </div>
  );
}
