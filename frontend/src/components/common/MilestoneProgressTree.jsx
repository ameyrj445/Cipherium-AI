import React, { useState } from 'react';
import {
  CheckCircle2, Circle, ChevronDown, ChevronUp, ExternalLink,
  Code2, MessageSquare, Play
} from 'lucide-react';
import ResourceCard from './ResourceCard';

/**
 * Gamified, step-by-step visual roadmap tree tracking student milestones.
 * Includes contextual quick actions (Start Lesson, Practice Challenge, Ask Tutor).
 */
export default function MilestoneProgressTree({
  milestones = [],
  planId = null,
  subject = 'Roadmap',
  onUpdateProgress = () => {},
  onStartPractice = () => {},
  onAskTutor = () => {},
}) {
  const [expandedStages, setExpandedStages] = useState({ 0: true });

  const toggleStage = (idx) => {
    setExpandedStages((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (!milestones.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {milestones.map((milestone, stageIdx) => {
        const subtopics = milestone.subtopics || [];
        const completed = milestone.completed_subtopics || [];
        const isStageComplete = subtopics.length > 0 && completed.length === subtopics.length;
        const stageProgress = subtopics.length ? Math.round((completed.length / subtopics.length) * 100) : 0;
        const isExpanded = expandedStages[stageIdx] !== false;

        return (
          <div
            key={milestone.id || stageIdx}
            className="ui-card"
            style={{
              borderRadius: '14px',
              border: isStageComplete ? '1px solid rgba(16, 185, 129, 0.4)' : isExpanded ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-stroke, #2D2D35)',
              background: 'var(--bg-surface, #1E1E22)',
              overflow: 'hidden',
              textAlign: 'left',
              transition: 'border-color 0.2s ease',
            }}
          >
            {/* Stage Accordion Header */}
            <div
              onClick={() => toggleStage(stageIdx)}
              style={{
                padding: '16px 20px',
                background: isExpanded ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                borderBottom: isExpanded ? '1px solid var(--border-stroke, #2D2D35)' : 'none',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: isStageComplete ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                    color: isStageComplete ? '#10b981' : '#818cf8',
                    border: `1px solid ${isStageComplete ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    flexShrink: 0,
                  }}
                >
                  {isStageComplete ? <CheckCircle2 size={16} /> : stageIdx + 1}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary, #F3F4F6)' }}>
                      Stage {stageIdx + 1}: {milestone.title}
                    </h4>
                    {isStageComplete && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        Completed
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #9CA3AF)', marginTop: '2px' }}>
                    {completed.length} of {subtopics.length} checkpoints mastered · {milestone.estimated_hours || 6} hours estimated
                  </div>
                </div>
              </div>

              {/* Progress & Accordion Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
                  <span style={{ fontSize: '0.86rem', fontWeight: 800, color: isStageComplete ? '#10b981' : '#818cf8' }}>
                    {stageProgress}%
                  </span>
                </div>
                <div style={{ color: 'var(--text-secondary, #9CA3AF)' }}>
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>
            </div>

            {/* Stage Body Content */}
            {isExpanded && (
              <div style={{ padding: '20px' }}>
                {/* Visual Checkpoint Node Tree */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary, #6B7280)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                    Checkpoint Progression Rail
                  </div>

                  {subtopics.map((subtopic, sIdx) => {
                    const isDone = completed.includes(subtopic);
                    const isFirstIncomplete = !isDone && subtopics.slice(0, sIdx).every((t) => completed.includes(t));

                    return (
                      <div
                        key={subtopic}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '10px',
                          background: isFirstIncomplete ? 'rgba(99, 102, 241, 0.08)' : isDone ? 'rgba(16, 185, 129, 0.04)' : 'var(--bg-shell, #161618)',
                          border: isFirstIncomplete ? '1.5px solid rgba(99, 102, 241, 0.5)' : isDone ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border-stroke, #2D2D35)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                            {/* Checkbox Trigger */}
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateProgress({
                                  plan_id: planId,
                                  milestone_id: milestone.id,
                                  subtopic_name: subtopic,
                                  subtopic_completed: !isDone,
                                });
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                color: isDone ? '#10b981' : isFirstIncomplete ? '#818cf8' : 'var(--text-tertiary, #6B7280)',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
                            >
                              {isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                            </button>

                            <span
                              style={{
                                fontSize: '0.86rem',
                                fontWeight: isFirstIncomplete ? 700 : 500,
                                color: isDone ? 'var(--text-secondary, #9CA3AF)' : isFirstIncomplete ? 'var(--text-primary, #F3F4F6)' : 'var(--text-secondary, #9CA3AF)',
                                textDecoration: isDone ? 'line-through' : 'none',
                              }}
                            >
                              {subtopic}
                            </span>

                            {isFirstIncomplete && (
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  color: '#a5b4fc',
                                  background: 'rgba(99, 102, 241, 0.12)',
                                  border: '1px solid rgba(99, 102, 241, 0.25)',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                }}
                              >
                                CURRENT ACTIVE NODE
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Contextual Action Bar on Active Checkpoint */}
                        {isFirstIncomplete && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              paddingTop: '8px',
                              borderTop: '1px solid rgba(99, 102, 241, 0.15)',
                              flexWrap: 'wrap',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => onStartPractice(subtopic)}
                              className="btn btn-primary"
                              style={{
                                fontSize: '0.74rem',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                cursor: 'pointer',
                              }}
                            >
                              <Code2 size={12} />
                              <span>Practice Challenge</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onAskTutor(subtopic)}
                              className="btn btn-white"
                              style={{
                                fontSize: '0.74rem',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                cursor: 'pointer',
                              }}
                            >
                              <MessageSquare size={12} />
                              <span>Ask AI Tutor</span>
                            </button>

                            <a
                              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${subject} ${subtopic} tutorial`)}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                fontSize: '0.74rem',
                                color: 'var(--text-secondary, #9CA3AF)',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 8px',
                              }}
                            >
                              <Play size={11} />
                              <span>Watch Explainer</span>
                              <ExternalLink size={10} />
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Milestone Curated Media Resources */}
                {(milestone.resources || []).length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary, #6B7280)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                      Curated Study Material for this Stage
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                      {milestone.resources.map((res, rIdx) => (
                        <ResourceCard
                          key={res.id || rIdx}
                          resource={{
                            ...res,
                            isFromPlan: true,
                            milestoneTitle: milestone.title,
                          }}
                          compact
                          showAiReason={false}
                          onToggleComplete={() => {
                            onUpdateProgress({
                              plan_id: planId,
                              milestone_id: milestone.id,
                              resource_id: res.id,
                              resource_completed: !res.completed,
                            });
                          }}
                          isCompleted={!!res.completed}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
