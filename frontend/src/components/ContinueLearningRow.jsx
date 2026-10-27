import React from 'react';
import { BookOpen, Zap, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import SectionHeader from './common/SectionHeader';
import EmptyState from './common/EmptyState';

/**
 * ContinueLearningCards
 * Renders the active roadmap and diagnostic practice cards.
 */
export function ContinueLearningCards({
  customPlan = null,
  onOpenStudyPlan,
  onOpenLearn,
  onOpenPractice,
}) {
  let activeMilestone = null;
  let planProgressPct = 0;

  if (customPlan && customPlan.milestones) {
    for (const m of customPlan.milestones) {
      const subs = m.subtopics || [];
      const doneSubs = m.completed_subtopics || [];
      if (subs.length === 0 || doneSubs.length < subs.length) {
        activeMilestone = m;
        break;
      }
    }
    if (!activeMilestone && customPlan.milestones.length > 0) {
      activeMilestone = customPlan.milestones[customPlan.milestones.length - 1];
    }

    let totalSubs = 0;
    let doneSubs = 0;
    customPlan.milestones.forEach((m) => {
      totalSubs += (m.subtopics || []).length;
      doneSubs += (m.completed_subtopics || []).length;
    });
    planProgressPct = totalSubs > 0 ? Math.round((doneSubs / totalSubs) * 100) : 0;
  }

  return (
    <div>
      <SectionHeader
        title="Continue Learning"
        actionLabel="View all roadmaps →"
        onAction={onOpenLearn || onOpenStudyPlan}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {/* Card 1: Active Roadmap Card */}
        <div
          className="ui-card"
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'var(--bg-surface, #1E1E22)',
            border: customPlan
              ? '1px solid rgba(99, 102, 241, 0.4)'
              : '1px solid var(--border-stroke, #2D2D35)',
            borderRadius: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BookOpen size={18} color="#6366F1" />
              </div>
              {customPlan ? (
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: '#818CF8',
                    background: 'rgba(99, 102, 241, 0.12)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                  }}
                >
                  {planProgressPct}% Complete
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary, #9CA3AF)',
                    background: 'var(--bg-shell, #161618)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-stroke, #2D2D35)',
                  }}
                >
                  Curated
                </span>
              )}
            </div>

            <h4
              onClick={onOpenLearn || onOpenStudyPlan}
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-primary, #F3F4F6)',
                margin: '0 0 6px',
                cursor: 'pointer',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.35,
              }}
              title={customPlan?.subject || 'Engineering Blueprints & Roadmaps'}
            >
              {customPlan?.subject || 'Engineering Blueprints & Roadmaps'}
            </h4>

            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary, #9CA3AF)',
                margin: '0 0 16px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.45,
              }}
            >
              {activeMilestone
                ? `Current: ${activeMilestone.title}`
                : 'Structured engineering syllabi in Algorithms, Systems, and AI.'}
            </p>
          </div>

          {customPlan ? (
            <div>
              <div
                style={{
                  height: '6px',
                  background: 'var(--bg-shell, #161618)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: '10px',
                  border: '1px solid var(--border-stroke, #2D2D35)',
                }}
              >
                <div style={{ width: `${planProgressPct}%`, height: '100%', background: '#6366F1', borderRadius: '4px' }} />
              </div>
              <button
                type="button"
                onClick={onOpenLearn || onOpenStudyPlan}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#818CF8',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Resume study stage <ArrowRight size={13} />
              </button>
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={onOpenLearn}
                className="btn btn-primary"
                style={{
                  fontSize: '0.8rem',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                Explore roadmaps <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Card 2: Adaptive Practice Card */}
        <div
          className="ui-card"
          style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'var(--bg-surface, #1E1E22)',
            border: '1px solid var(--border-stroke, #2D2D35)',
            borderRadius: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(124, 58, 237, 0.15)',
                  border: '1px solid rgba(124, 58, 237, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Zap size={18} color="#7C3AED" />
              </div>
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: '#C4B5FD',
                  background: 'rgba(124, 58, 237, 0.15)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(124, 58, 237, 0.3)',
                }}
              >
                Adaptive Drills
              </span>
            </div>

            <h4
              onClick={onOpenPractice || onOpenLearn}
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-primary, #F3F4F6)',
                margin: '0 0 6px',
                cursor: 'pointer',
                lineHeight: 1.35,
              }}
            >
              Diagnostic Practice & Challenges
            </h4>

            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary, #9CA3AF)',
                margin: '0 0 16px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.45,
              }}
            >
              Topic-targeted multiple choice drills and algorithm challenges to reinforce retention.
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={onOpenPractice || onOpenLearn}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#818CF8',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Start diagnostic practice <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * TodaysTasksCard
 * Renders the daily tasks card with checkboxes and completion status.
 */
export function TodaysTasksCard({
  customPlan = null,
  todayTasks = [],
  onToggleTask,
  onOpenStudyPlan,
  onOpenLearn,
  onUpdatePlanProgress,
}) {
  let dynamicTasks = [];

  if (customPlan && customPlan.milestones) {
    let activeMilestone = null;
    for (const m of customPlan.milestones) {
      const subs = m.subtopics || [];
      const doneSubs = m.completed_subtopics || [];
      if (subs.length === 0 || doneSubs.length < subs.length) {
        activeMilestone = m;
        break;
      }
    }
    if (!activeMilestone && customPlan.milestones.length > 0) {
      activeMilestone = customPlan.milestones[customPlan.milestones.length - 1];
    }

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

  const tasksToRender = customPlan ? dynamicTasks : (todayTasks.length > 0 ? todayTasks.slice(0, 4) : []);

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
    <div>
      <SectionHeader
        title="Today's Tasks"
        actionLabel={customPlan ? 'Full plan →' : ''}
        onAction={onOpenStudyPlan}
      />

      <div
        className="ui-card"
        style={{
          padding: '20px',
          background: 'var(--bg-surface, #1E1E22)',
          border: '1px solid var(--border-stroke, #2D2D35)',
          borderRadius: '12px',
          minHeight: '190px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: tasksToRender.length > 0 ? 'flex-start' : 'center',
        }}
      >
        {tasksToRender.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tasksToRender.map((t) => (
              <div
                key={t.id}
                onClick={() => handleTaskClick(t)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: t.done ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-shell, #161618)',
                  border: '1px solid var(--border-stroke, #2D2D35)',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!t.done) e.currentTarget.style.background = 'var(--bg-hover, #2A2A30)';
                }}
                onMouseLeave={(e) => {
                  if (!t.done) e.currentTarget.style.background = 'var(--bg-shell, #161618)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                  {t.done ? (
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#10B981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <CheckCircle2 size={13} color="#fff" />
                    </div>
                  ) : (
                    <Circle size={18} color="var(--text-tertiary, #6B7280)" style={{ flexShrink: 0 }} />
                  )}
                  <span
                    style={{
                      fontSize: '0.84rem',
                      color: t.done ? '#34D399' : 'var(--text-primary, #F3F4F6)',
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
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #9CA3AF)', flexShrink: 0 }}>
                  {t.duration}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            compact
            icon={CheckCircle2}
            title="No tasks scheduled"
            description={customPlan ? "You're all caught up on today's target milestones." : "Select a roadmap or blueprint to generate daily checkpoints."}
            actionLabel={customPlan ? "Review curriculum" : "Browse roadmaps"}
            onAction={customPlan ? onOpenStudyPlan : onOpenLearn}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Default Export: Keep backward compatibility with existing usages
 */
export default function ContinueLearningRow(props) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)',
        gap: '24px',
        marginBottom: '32px',
      }}
    >
      <ContinueLearningCards {...props} />
      <TodaysTasksCard {...props} />
    </div>
  );
}
