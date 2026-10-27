import React, { useState } from 'react';
import {
  BookOpen, Clock, CheckCircle2, ExternalLink,
  ChevronDown, ChevronUp, Award, Zap, Plus,
  Search, Sparkles, Layers
} from 'lucide-react';
import PageContainer from './layout/PageContainer';
import PageHeader from './layout/PageHeader';
import StickyRail from './layout/StickyRail';

const POPULAR_SUBJECTS = [
  { name: 'Data Structures & Algorithms', icon: '⚡', category: 'Core CS' },
  { name: 'Operating Systems & Concurrency', icon: '💻', category: 'Systems' },
  { name: 'Computer Networks & Protocols', icon: '🌐', category: 'Networking' },
  { name: 'Database Management & SQL', icon: '🗄️', category: 'Databases' },
  { name: 'Machine Learning & Applied AI', icon: '🤖', category: 'AI/Data' },
  { name: 'System Design & Scalability', icon: '🏗️', category: 'Architecture' },
  { name: 'Full-Stack Web Development', icon: '🚀', category: 'Web Dev' }
];

const topicWords = (value) => new Set(
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9+#. ]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2)
);

const getSubtopicResource = (subtopic, stageResources, subject) => {
  const subtopicTerms = topicWords(subtopic);
  const closestResource = (stageResources || []).reduce(
    (best, resource) => {
      const resourceTerms = topicWords(`${resource.title} ${resource.summary}`);
      const score = [...subtopicTerms].filter((term) => resourceTerms.has(term)).length;
      return score > best.score ? { resource, score } : best;
    },
    { resource: null, score: 0 }
  );

  if (closestResource.resource && closestResource.score > 0 && closestResource.resource.url) {
    return { url: closestResource.resource.url, label: 'Open resource' };
  }

  return {
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${subject || 'study'} ${subtopic} tutorial`)}`,
    label: 'Find tutorial',
  };
};

export default function StudyPlanView({
  plan,
  loading,
  error,
  onGeneratePlan,
  onUpdateProgress,
  onAddToLearn,
  onPracticeTopic
}) {
  const [showGenerator, setShowGenerator] = useState(!plan);
  const [subjectInput, setSubjectInput] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [targetHoursPerWeek, setTargetHoursPerWeek] = useState(10);
  const [skillLevel, setSkillLevel] = useState('Beginner');
  const [learningGoal, setLearningGoal] = useState('Full Mastery');

  // Milestone expansion state
  const [expandedMilestones, setExpandedMilestones] = useState({ 0: true });
  const [stageFilter, setStageFilter] = useState('All');
  const [stageSearch, setStageSearch] = useState('');

  const toggleMilestone = (idx) => {
    setExpandedMilestones((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleQuickSubject = (name) => {
    setSubjectInput(name);
  };

  const handleSubmitGenerate = async (e) => {
    if (e) e.preventDefault();
    const finalSubject = subjectInput.trim() || 'Data Structures & Algorithms';
    const didGenerate = await onGeneratePlan({
      subject: finalSubject,
      duration_weeks: Number(durationWeeks),
      target_hours_per_week: Number(targetHoursPerWeek),
      skill_level: skillLevel,
      learning_goal: learningGoal,
    });
    if (didGenerate) setShowGenerator(false);
  };

  // Calculate statistics from the plan
  const milestones = plan?.milestones || [];
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((m) => m.status === 'completed').length;

  let totalSubtopicsCount = 0;
  let completedSubtopicsCount = 0;
  let totalResourcesCount = 0;
  let completedResourcesCount = 0;

  milestones.forEach((m) => {
    totalSubtopicsCount += (m.subtopics || []).length;
    completedSubtopicsCount += (m.completed_subtopics || []).length;
    totalResourcesCount += (m.resources || []).length;
    completedResourcesCount += (m.resources || []).filter((r) => r.completed).length;
  });

  const totalTrackableItems = totalSubtopicsCount + totalResourcesCount;
  const completedTrackableItems = completedSubtopicsCount + completedResourcesCount;
  const overallPercentage =
    totalTrackableItems > 0 ? Math.round((completedTrackableItems / totalTrackableItems) * 100) : 0;

  const totalHours = plan?.total_estimated_hours || (durationWeeks * targetHoursPerWeek);
  const loggedHours = plan?.completed_hours || 0;

  const filteredMilestones = milestones.filter((m) => {
    const searchText = `${m.title || ''} ${m.description || ''} ${(m.subtopics || []).join(' ')} ${(m.resources || []).map((resource) => resource.title).join(' ')}`.toLowerCase();
    if (stageSearch.trim() && !searchText.includes(stageSearch.toLowerCase())) return false;
    if (stageFilter === 'All') return true;
    if (stageFilter === 'In Progress') return m.status === 'in_progress';
    if (stageFilter === 'Completed') return m.status === 'completed';
    return true;
  });

  const calculatedTotalHours = durationWeeks * targetHoursPerWeek;
  const displaySubject = subjectInput.trim() || 'Data Structures & Algorithms';

  return (
    <PageContainer>
      {/* 1. Header row */}
      <div style={{ gridColumn: '1 / -1' }}>
        <PageHeader
          eyebrow="ACADEMIC STUDY PLAN & ROADMAP ENGINE"
          title={plan ? `${plan.subject} · Academic Study Plan` : 'Personalized Academic Study Plan & Syllabus Generator'}
          description="Synthesize a multi-week milestone roadmap scaled to your weekly hours budget with verified tutorials, documentation, and an interactive progress tracker."
          actions={
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {plan && (
                <button
                  type="button"
                  onClick={() => onAddToLearn && onAddToLearn(!plan.is_added_to_learn)}
                  className={plan.is_added_to_learn ? 'btn btn-white' : 'btn btn-primary'}
                  style={{
                    fontSize: '0.82rem',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: plan.is_added_to_learn ? '1px solid #10B981' : 'none',
                    color: plan.is_added_to_learn ? '#10B981' : undefined,
                  }}
                >
                  {plan.is_added_to_learn ? '✓ Added to Learn' : 'Add to Learn'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowGenerator(!showGenerator)}
                className="btn btn-primary"
                style={{
                  padding: '8px 14px',
                  fontSize: '0.82rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {showGenerator ? (
                  <>
                    <ChevronUp size={15} /> Close Generator
                  </>
                ) : (
                  <>
                    <Plus size={15} /> New Subject Plan
                  </>
                )}
              </button>
            </div>
          }
        />
      </div>

      {/* ── GENERATOR MODE: TWO COLUMN (7 cols Form + 5 cols Live Preview) ── */}
      {showGenerator && (
        <>
          {/* Left Column (7 of 12 cols): Generator Form */}
          <div
            style={{
              gridColumn: '1 / span 7',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div
              className="ui-card"
              style={{
                padding: '24px',
                background: 'var(--bg-surface, #1E1E22)',
                border: '1px solid var(--border-stroke, #2D2D35)',
                borderRadius: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Sparkles size={16} color="#818CF8" />
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary, #F3F4F6)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                  Plan Configuration
                </span>
              </div>

              {error && (
                <div role="alert" style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.14)', border: '1px solid rgba(251, 113, 133, 0.55)', color: '#fecdd3', fontSize: '0.8rem', marginBottom: '16px' }}>
                  Could not generate the plan: {error}
                </div>
              )}

              <form onSubmit={handleSubmitGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Popular Blueprints */}
                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #9CA3AF)', marginBottom: '8px', fontWeight: 700 }}>
                    POPULAR CURRICULUM BLUEPRINTS:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {POPULAR_SUBJECTS.map((subj) => (
                      <button
                        key={subj.name}
                        type="button"
                        onClick={() => handleQuickSubject(subj.name)}
                        style={{
                          background: subjectInput === subj.name ? '#6366F1' : 'var(--bg-shell, #161618)',
                          border: subjectInput === subj.name ? '1px solid #818CF8' : '1px solid var(--border-stroke, #2D2D35)',
                          color: subjectInput === subj.name ? '#ffffff' : 'var(--text-secondary, #9CA3AF)',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>{subj.icon}</span>
                        <span>{subj.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject Input Field */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-primary, #F3F4F6)', fontWeight: 700, marginBottom: '6px' }}>
                    Target Subject or Course Name:
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} color="var(--text-secondary, #9CA3AF)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      value={subjectInput}
                      onChange={(e) => setSubjectInput(e.target.value)}
                      placeholder="e.g. Data Structures & Algorithms, Operating Systems, Machine Learning..."
                      style={{
                        width: '100%',
                        padding: '11px 14px 11px 40px',
                        borderRadius: '10px',
                        background: 'var(--bg-shell, #161618)',
                        border: '1px solid var(--border-stroke, #2D2D35)',
                        color: 'var(--text-primary, #F3F4F6)',
                        fontSize: '0.88rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Form Controls 2x2 Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary, #9CA3AF)', fontWeight: 600, marginBottom: '6px' }}>
                      Duration (Weeks):
                    </label>
                    <select
                      value={durationWeeks}
                      onChange={(e) => setDurationWeeks(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        background: 'var(--bg-shell, #161618)',
                        border: '1px solid var(--border-stroke, #2D2D35)',
                        color: 'var(--text-primary, #F3F4F6)',
                        fontSize: '0.82rem',
                        outline: 'none',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value={1}>1 Week (Crash Review)</option>
                      <option value={2}>2 Weeks (Accelerated)</option>
                      <option value={4}>4 Weeks (Standard)</option>
                      <option value={8}>8 Weeks (Comprehensive)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary, #9CA3AF)', fontWeight: 600, marginBottom: '6px' }}>
                      Weekly Commitment:
                    </label>
                    <select
                      value={targetHoursPerWeek}
                      onChange={(e) => setTargetHoursPerWeek(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        background: 'var(--bg-shell, #161618)',
                        border: '1px solid var(--border-stroke, #2D2D35)',
                        color: 'var(--text-primary, #F3F4F6)',
                        fontSize: '0.82rem',
                        outline: 'none',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value={5}>5 Hours / Week</option>
                      <option value={10}>10 Hours / Week (Balanced)</option>
                      <option value={15}>15 Hours / Week</option>
                      <option value={20}>20 Hours / Week (Intensive)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary, #9CA3AF)', fontWeight: 600, marginBottom: '6px' }}>
                      Starting Skill Level:
                    </label>
                    <select
                      value={skillLevel}
                      onChange={(e) => setSkillLevel(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        background: 'var(--bg-shell, #161618)',
                        border: '1px solid var(--border-stroke, #2D2D35)',
                        color: 'var(--text-primary, #F3F4F6)',
                        fontSize: '0.82rem',
                        outline: 'none',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="Beginner">Beginner (Foundations first)</option>
                      <option value="Intermediate">Intermediate (Core & patterns)</option>
                      <option value="Advanced">Advanced (Complex systems)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary, #9CA3AF)', fontWeight: 600, marginBottom: '6px' }}>
                      Learning Objective:
                    </label>
                    <select
                      value={learningGoal}
                      onChange={(e) => setLearningGoal(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        background: 'var(--bg-shell, #161618)',
                        border: '1px solid var(--border-stroke, #2D2D35)',
                        color: 'var(--text-primary, #F3F4F6)',
                        fontSize: '0.82rem',
                        outline: 'none',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="Full Mastery">Full Curriculum Mastery</option>
                      <option value="Interview Prep">Technical Interview Prep</option>
                      <option value="Exam Prep">Semester Exam / GATE Prep</option>
                      <option value="Practical Projects">Hands-on Project Building</option>
                    </select>
                  </div>
                </div>

                {/* Sticky Action Footer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border-stroke, #2D2D35)',
                    marginTop: '8px',
                  }}
                >
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary, #9CA3AF)' }}>
                    Pacing: <strong>{calculatedTotalHours} total hours</strong> planned
                  </span>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{
                      padding: '10px 22px',
                      borderRadius: '8px',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {loading ? (
                      <>Synthesizing Plan...</>
                    ) : (
                      <>
                        <Zap size={16} /> Synthesize Study Plan
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column (5 of 12 cols): Sticky Live-Updating Preview Card */}
          <StickyRail columns={5}>
            <div
              className="ui-card"
              style={{
                padding: '24px',
                background: 'var(--bg-surface, #1E1E22)',
                border: '1.5px solid rgba(99, 102, 241, 0.35)',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: '#818CF8',
                    background: 'rgba(99, 102, 241, 0.15)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Eye size={12} /> Live Preview
                </span>
                <span className="badge badge-info">{skillLevel}</span>
              </div>

              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary, #F3F4F6)', margin: '0 0 6px 0', lineHeight: 1.3 }}>
                  {displaySubject}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #9CA3AF)', margin: 0 }}>
                  Target: {learningGoal} · {durationWeeks} Weeks
                </p>
              </div>

              {/* Calculated Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'var(--bg-shell, #161618)', border: '1px solid var(--border-stroke, #2D2D35)', padding: '10px 12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary, #9CA3AF)' }}>Total Commitment</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#6366F1', marginTop: '2px' }}>
                    {calculatedTotalHours} Hours
                  </div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-tertiary, #6B7280)' }}>
                    {targetHoursPerWeek}h/wk × {durationWeeks}wks
                  </div>
                </div>

                <div style={{ background: 'var(--bg-shell, #161618)', border: '1px solid var(--border-stroke, #2D2D35)', padding: '10px 12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary, #9CA3AF)' }}>Est. Milestones</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10B981', marginTop: '2px' }}>
                    {Math.max(durationWeeks, 4)} Stages
                  </div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-tertiary, #6B7280)' }}>
                    Structured pacing
                  </div>
                </div>
              </div>

              {/* Projected Milestones Timeline Preview */}
              <div>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary, #9CA3AF)', marginBottom: '8px' }}>
                  PROJECTED SYLLABUS STAGES:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { week: 'Stage 1', desc: 'Core Foundations & Mental Models' },
                    { week: 'Stage 2', desc: 'Key Algorithms, Syntax & Core Patterns' },
                    { week: 'Stage 3', desc: 'Intermediate Systems, Optimization & Drills' },
                    { week: `Stage ${Math.max(durationWeeks, 4)}`, desc: 'Deep Mastery, Synthesis & Real Practice' },
                  ].map((s, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        background: 'var(--bg-shell, #161618)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-stroke, #2D2D35)',
                      }}
                    >
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#818CF8', background: 'rgba(99, 102, 241, 0.12)', padding: '2px 6px', borderRadius: '4px' }}>
                        {s.week}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-primary, #F3F4F6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct trigger button in preview */}
              <button
                type="button"
                onClick={handleSubmitGenerate}
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '10px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  marginTop: '8px',
                }}
              >
                {loading ? 'Synthesizing...' : 'Generate This Plan Now →'}
              </button>
            </div>
          </StickyRail>
        </>
      )}

      {/* ── PLAN ACTIVE DASHBOARD: FULL WIDTH & STICKY RIGHT RAIL ── */}
      {plan && !showGenerator && (
        <>
          {/* Summary stats bar across the top (Full 12 columns) */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div
              className="ui-card"
              style={{
                padding: '22px 26px',
                borderRadius: '16px',
                background: 'var(--bg-surface, #1E1E22)',
                border: '1px solid var(--border-stroke, #2D2D35)',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
              }}
            >
              {/* Stat 1: Overall Progress */}
              <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-shell, #161618)', border: '1px solid var(--border-stroke, #2D2D35)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#818CF8', fontWeight: 700, textTransform: 'uppercase' }}>Overall Progress</span>
                  <Award size={16} color="#6366F1" />
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary, #F3F4F6)', marginTop: '4px' }}>
                  {overallPercentage}%
                </div>
                <div style={{ height: '6px', background: 'var(--border-stroke, #2D2D35)', borderRadius: '4px', overflow: 'hidden', marginTop: '8px' }}>
                  <div style={{ width: `${overallPercentage}%`, height: '100%', background: '#6366F1', borderRadius: '4px' }} />
                </div>
              </div>

              {/* Stat 2: Milestones */}
              <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-shell, #161618)', border: '1px solid var(--border-stroke, #2D2D35)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700, textTransform: 'uppercase' }}>Milestones Done</span>
                  <CheckCircle2 size={16} color="#10B981" />
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>
                  {completedMilestones} / {totalMilestones}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #9CA3AF)', marginTop: '8px' }}>
                  {totalMilestones - completedMilestones} stages remaining
                </div>
              </div>

              {/* Stat 3: Study Hours */}
              <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-shell, #161618)', border: '1px solid var(--border-stroke, #2D2D35)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#F59E0B', fontWeight: 700, textTransform: 'uppercase' }}>Study Hours</span>
                  <Clock size={16} color="#F59E0B" />
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#F59E0B', marginTop: '4px' }}>
                  {loggedHours} / {totalHours}h
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #9CA3AF)', marginTop: '8px' }}>
                  {Math.max(0, Math.round(totalHours - loggedHours))}h to completion
                </div>
              </div>

              {/* Stat 4: Subtopics Checklist */}
              <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--bg-shell, #161618)', border: '1px solid var(--border-stroke, #2D2D35)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#A78BFA', fontWeight: 700, textTransform: 'uppercase' }}>Subtopics</span>
                  <Layers size={16} color="#A78BFA" />
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary, #F3F4F6)', marginTop: '4px' }}>
                  {completedSubtopicsCount} / {totalSubtopicsCount}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #9CA3AF)', marginTop: '8px' }}>
                  Checkpoints mastered
                </div>
              </div>
            </div>
          </div>

          {/* Main Milestones List (8 of 12 columns) */}
          <div
            style={{
              gridColumn: '1 / span 8',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Filter and Search Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                padding: '12px 16px',
                background: 'var(--bg-surface, #1E1E22)',
                border: '1px solid var(--border-stroke, #2D2D35)',
                borderRadius: '12px',
              }}
            >
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {['All', 'In Progress', 'Completed'].map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStageFilter(filter)}
                    className={`btn ${stageFilter === filter ? 'btn-primary' : 'btn-white'}`}
                    style={{ fontSize: '0.76rem', padding: '5px 12px', borderRadius: '8px', border: '1px solid var(--border-stroke, #2D2D35)' }}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div style={{ position: 'relative' }}>
                <Search size={14} color="var(--text-secondary, #9CA3AF)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  value={stageSearch}
                  onChange={(event) => setStageSearch(event.target.value)}
                  placeholder="Search stages or topics..."
                  style={{
                    padding: '6px 10px 6px 30px',
                    width: '180px',
                    border: '1px solid var(--border-stroke, #2D2D35)',
                    background: 'var(--bg-shell, #161618)',
                    color: 'var(--text-primary, #F3F4F6)',
                    borderRadius: '8px',
                    outline: 'none',
                    fontSize: '0.76rem',
                  }}
                />
              </div>
            </div>

            {/* Milestones Accordion */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredMilestones.map((m, idx) => {
                const isExpanded = expandedMilestones[idx] ?? (idx === 0);
                const subtopics = m.subtopics || [];
                const completedSubs = m.completed_subtopics || [];
                const stageResources = m.resources || [];
                const isStageComplete = m.status === 'completed';

                return (
                  <div
                    key={m.id || idx}
                    className="ui-card"
                    style={{
                      border: isStageComplete
                        ? '1px solid rgba(16, 185, 129, 0.4)'
                        : m.status === 'in_progress'
                        ? '1px solid rgba(99, 102, 241, 0.4)'
                        : '1px solid var(--border-stroke, #2D2D35)',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      background: 'var(--bg-surface, #1E1E22)',
                    }}
                  >
                    <div
                      onClick={() => toggleMilestone(idx)}
                      style={{
                        padding: '16px 20px',
                        background: isStageComplete
                          ? 'rgba(16, 185, 129, 0.08)'
                          : m.status === 'in_progress'
                          ? 'rgba(99, 102, 241, 0.06)'
                          : 'var(--bg-surface, #1E1E22)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            background: isStageComplete ? '#10B981' : m.status === 'in_progress' ? '#6366F1' : 'var(--border-stroke, #2D2D35)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                          }}
                        >
                          {isStageComplete ? '✓' : idx + 1}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary, #F3F4F6)' }}>
                            {m.title}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #9CA3AF)', marginTop: '2px' }}>
                            {completedSubs.length}/{subtopics.length} concepts completed
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isStageComplete && (
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10B981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                            ✓ Done
                          </span>
                        )}
                        {isExpanded ? <ChevronUp size={18} color="#9CA3AF" /> : <ChevronDown size={18} color="#9CA3AF" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border-stroke, #2D2D35)' }}>
                        {m.description && (
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #9CA3AF)', margin: 0, lineHeight: 1.5 }}>
                            {m.description}
                          </p>
                        )}

                        {/* Subtopics Checklist */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#818CF8', textTransform: 'uppercase' }}>
                            Checklist Concepts:
                          </span>
                          {subtopics.map((sub, sIdx) => {
                            const isDone = completedSubs.includes(sub);
                            const resourceLink = getSubtopicResource(sub, stageResources, plan.subject);
                            return (
                              <div
                                key={sIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '8px 12px',
                                  background: isDone ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-shell, #161618)',
                                  borderRadius: '8px',
                                  border: '1px solid var(--border-stroke, #2D2D35)',
                                }}
                              >
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}>
                                  <input
                                    type="checkbox"
                                    checked={isDone}
                                    onChange={() =>
                                      onUpdateProgress({
                                        milestone_id: m.id,
                                        subtopic_name: sub,
                                        subtopic_completed: !isDone,
                                      })
                                    }
                                    style={{ accentColor: '#10B981', cursor: 'pointer' }}
                                  />
                                  <span style={{ fontSize: '0.82rem', color: isDone ? '#10B981' : 'var(--text-primary, #F3F4F6)', textDecoration: isDone ? 'line-through' : 'none', fontWeight: isDone ? 500 : 600 }}>
                                    {sub}
                                  </span>
                                </label>

                                {resourceLink && (
                                  <a
                                    href={resourceLink.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      fontSize: '0.72rem',
                                      color: '#818CF8',
                                      textDecoration: 'none',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {resourceLink.label} <ExternalLink size={11} />
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Rail (4 of 12 columns, sticky): Actions & Resource Links */}
          <StickyRail columns={4} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Quick Actions Panel */}
            <div
              className="ui-card"
              style={{
                padding: '20px',
                background: 'var(--bg-surface, #1E1E22)',
                border: '1px solid var(--border-stroke, #2D2D35)',
                borderRadius: '14px',
              }}
            >
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary, #F3F4F6)', marginBottom: '14px' }}>
                Study Roadmap Actions
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => onAddToLearn && onAddToLearn(!plan.is_added_to_learn)}
                  className={plan.is_added_to_learn ? 'btn btn-white' : 'btn btn-primary'}
                  style={{
                    width: '100%',
                    fontSize: '0.8rem',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    border: plan.is_added_to_learn ? '1px solid #10B981' : 'none',
                    color: plan.is_added_to_learn ? '#10B981' : undefined,
                  }}
                >
                  {plan.is_added_to_learn ? '✓ Pinned to Learn Dashboard' : 'Pin to Learn Dashboard'}
                </button>

                {onPracticeTopic && (
                  <button
                    type="button"
                    onClick={() => onPracticeTopic(plan.subject)}
                    className="btn btn-white"
                    style={{
                      width: '100%',
                      fontSize: '0.8rem',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Zap size={14} color="#6366F1" /> Practice This Subject
                  </button>
                )}

                <div style={{ borderTop: '1px solid var(--border-stroke, #2D2D35)', paddingTop: '10px', marginTop: '4px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #9CA3AF)', marginBottom: '8px' }}>
                    Log Study Session Time:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => onUpdateProgress({ logged_hours_delta: 0.5 })}
                      className="btn btn-white"
                      style={{ fontSize: '0.74rem', padding: '6px', borderRadius: '6px' }}
                    >
                      +30 min
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateProgress({ logged_hours_delta: 1.0 })}
                      className="btn btn-white"
                      style={{ fontSize: '0.74rem', padding: '6px', borderRadius: '6px' }}
                    >
                      +1 hour
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Curated Resources Summary */}
            <div
              className="ui-card"
              style={{
                padding: '20px',
                background: 'var(--bg-surface, #1E1E22)',
                border: '1px solid var(--border-stroke, #2D2D35)',
                borderRadius: '14px',
              }}
            >
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#818CF8', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={14} /> Curated Reference Links
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary, #9CA3AF)', lineHeight: 1.45, marginBottom: '14px' }}>
                Verified internet tutorials and problem sets matching your roadmap milestones:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { name: 'NeetCode Practice Roadmap', url: 'https://neetcode.io/roadmap' },
                  { name: 'Striver A2Z DSA Sheet', url: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/' },
                  { name: 'GeeksforGeeks Algorithms', url: 'https://www.geeksforgeeks.org/fundamentals-of-algorithms/' },
                ].map((ref, idx) => (
                  <a
                    key={idx}
                    href={ref.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'var(--bg-shell, #161618)',
                      border: '1px solid var(--border-stroke, #2D2D35)',
                      color: '#818CF8',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    <span>{ref.name}</span>
                    <ExternalLink size={12} />
                  </a>
                ))}
              </div>
            </div>
          </StickyRail>
        </>
      )}
    </PageContainer>
  );
}

function Eye(props) {
  return (
    <svg width={props.size || 16} height={props.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
