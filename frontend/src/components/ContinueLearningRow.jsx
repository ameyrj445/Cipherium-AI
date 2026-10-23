import React from 'react';
import { BookOpen, Zap, CheckCircle2, Circle, Sparkles, ArrowRight, Clock } from 'lucide-react';

export default function ContinueLearningRow({
  customPlan = null,
  todayTasks = [],
  onToggleTask,
  onOpenStudyPlan,
  onOpenLearn,
  onUpdatePlanProgress,
}) {
  // If we have an active custom plan, derive current active milestone and tasks
  let activeMilestone = null;
  let activeMilestonePct = 0;
  let planProgressPct = 0;
  let dynamicTasks = [];

  if (customPlan && customPlan.milestones) {
    // Find first milestone that isn't completely done
    for (const m of customPlan.milestones) {
      const subs = m.subtopics || [];
      const doneSubs = m.completed_subtopics || [];
      if (subs.length === 0 || doneSubs.length < subs.length) {
        activeMilestone = m;
        activeMilestonePct = subs.length > 0 ? Math.round((doneSubs.length / subs.length) * 100) : 0;
        break;
      }
    }
    if (!activeMilestone && customPlan.milestones.length > 0) {
      activeMilestone = customPlan.milestones[customPlan.milestones.length - 1];
      activeMilestonePct = 100;
    }

    // Overall plan progress
    let totalSubs = 0;
    let doneSubs = 0;
    customPlan.milestones.forEach((m) => {
      totalSubs += (m.subtopics || []).length;
      doneSubs += (m.completed_subtopics || []).length;
    });
    planProgressPct = totalSubs > 0 ? Math.round((doneSubs / totalSubs) * 100) : 0;

    // Generate dynamic tasks from current milestone
    if (activeMilestone) {
      const subs = activeMilestone.subtopics || [];
      const completed = activeMilestone.completed_subtopics || [];
      subs.slice(0, 4).forEach((sub, idx) => {
        const isDone = completed.includes(sub);
        dynamicTasks.push({
          id: `task-sub-${idx}`,
          title: sub,
          duration: '25 min',
          done: isDone,
          milestoneId: activeMilestone.id,
          subtopicName: sub,
        });
      });
    }
  }

  // Dashboard tasks exist only when they come from the active study plan.
  const tasksToRender = customPlan ? dynamicTasks : [];

  const handleTaskClick = (task) => {
    if (task.subtopicName && task.milestoneId && onUpdatePlanProgress) {
      onUpdatePlanProgress({
        milestone_id: task.milestoneId,
        subtopic_name: task.subtopicName,
        subtopic_completed: !task.done,
      });
    } else if (onToggleTask) {
      onToggleTask(task.id);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', marginBottom: '24px' }}>
      {/* Continue Learning Cards */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Continue Learning
          </h3>
          <button
            onClick={onOpenLearn || onOpenStudyPlan}
            style={{ border: 'none', background: 'transparent', color: '#2563eb', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
          >
            View All Roadmaps →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {/* Card 1: Active Custom Plan or Featured */}
          <div
            className="ui-card"
            style={{
              padding: '18px',
              border: customPlan ? '1.5px solid #bfdbfe' : '1px solid #e2e8f0',
              background: customPlan ? '#ffffff' : '#ffffff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={18} color="#2563eb" />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '3px 8px', borderRadius: '12px' }}>
                {planProgressPct}%
              </span>
            </div>
            <div
              onClick={onOpenLearn}
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#0f172a',
                marginBottom: '4px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={customPlan?.subject || 'No active study plan'}
            >
              {customPlan?.subject || 'No active study plan'}
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: '#64748b',
                marginBottom: '14px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {activeMilestone ? activeMilestone.title : 'Create and add a study plan to begin'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '4px', flex: 1, marginRight: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${planProgressPct}%`, height: '100%', background: '#2563eb', borderRadius: '4px' }}></div>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                {`${activeMilestone?.completed_subtopics?.length || 0}/${activeMilestone?.subtopics?.length || 0} topics`}
              </span>
            </div>
          </div>

          {/* Card 2: Plan-linked practice */}
          <div className="ui-card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: '#f5f3ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BookOpen size={18} color="#7c3aed" />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', padding: '3px 8px', borderRadius: '12px' }}>
                Practice
              </span>
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
              Topic-based practice links
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '14px' }}>
              LeetCode, NeetCode, projects and curated exercises
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '4px', flex: 1, marginRight: '10px', overflow: 'hidden' }}>
                <div style={{ width: '0%', height: '100%', background: '#7c3aed', borderRadius: '4px' }}></div>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{customPlan ? 'Open plan' : '0 completed'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Plan Checklist */}
      <div className="ui-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Today's Tasks
            </h3>
            {activeMilestone && (
              <div style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 600 }}>
                From: {activeMilestone.title}
              </div>
            )}
          </div>
          {onOpenStudyPlan && (
            <button
              onClick={onOpenStudyPlan}
              style={{ border: 'none', background: 'transparent', color: '#2563eb', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Full Plan →
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {!customPlan && (
            <div style={{ fontSize: '0.82rem', color: '#64748b', padding: '10px 8px' }}>
              Add a study plan to see your tasks here.
            </div>
          )}
          {tasksToRender.map((t) => (
            <div
              key={t.id}
              onClick={() => handleTaskClick(t)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                padding: '6px 8px',
                borderRadius: '8px',
                background: t.done ? '#f0fdf4' : 'transparent',
                transition: 'background 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                {t.done ? (
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CheckCircle2 size={13} color="#fff" />
                  </div>
                ) : (
                  <Circle size={18} color="#cbd5e1" style={{ flexShrink: 0 }} />
                )}
                <span
                  style={{
                    fontSize: '0.84rem',
                    color: t.done ? '#15803d' : '#0f172a',
                    textDecoration: t.done ? 'line-through' : 'none',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={t.title}
                >
                  {t.title}
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', flexShrink: 0 }}>{t.duration}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
