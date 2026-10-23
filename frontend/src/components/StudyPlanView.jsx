import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Play,
  FileText,
  Code2,
  Award,
  Zap,
  RotateCcw,
  Plus,
  Flame,
  Search,
  Filter,
  Layers,
  ArrowRight
} from 'lucide-react';

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

// Generated plans may have stage-level resources only. Prefer the closest
// curated stage resource, then provide a focused YouTube learning search so
// every individual checklist concept is still directly actionable.
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
  // Filter for stages
  const [stageFilter, setStageFilter] = useState('All'); // All, In Progress, Completed

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
    e.preventDefault();
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

  const totalHours = plan?.total_estimated_hours || durationWeeks * targetHoursPerWeek;
  const loggedHours = plan?.completed_hours || 0;

  // Filtered milestones
  const filteredMilestones = milestones.filter((m) => {
    if (stageFilter === 'All') return true;
    if (stageFilter === 'In Progress') return m.status === 'in_progress';
    if (stageFilter === 'Completed') return m.status === 'completed';
    return true;
  });

  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* ── TOP SECTION: PROMPT / GENERATOR BANNER ── */}
      <div
        className="ui-card"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #1e293b 100%)',
          border: '1px solid #334155',
          borderRadius: '20px',
          padding: '28px 32px',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 12px 30px -8px rgba(15, 23, 42, 0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '620px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(147, 197, 253, 0.3)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.74rem', color: '#93c5fd', fontWeight: 600, marginBottom: '12px' }}>
              <Sparkles size={14} color="#60a5fa" />
              AI Intelligent Study Plan & Tracker Engine
            </div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff', lineHeight: 1.25, marginBottom: '8px' }}>
              What subject or topic do you want to master?
            </h1>
            <p style={{ fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.55 }}>
              Choose or type any topic. Cipherium synthesizes a multi-week roadmap complete with
              top video masterclasses, documentation, cheatsheets, and an interactive progress tracker.
            </p>
          </div>

          <button
            onClick={() => setShowGenerator(!showGenerator)}
            className="btn btn-primary"
            style={{
              padding: '10px 18px',
              fontSize: '0.84rem',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
            }}
          >
            {showGenerator ? (
              <>
                <ChevronUp size={16} /> Close Generator
              </>
            ) : (
              <>
                <Plus size={16} /> New Subject Plan
              </>
            )}
          </button>
        </div>

        {/* ── GENERATOR FORM (COLLAPSIBLE / EXPANDED) ── */}
        {showGenerator && (
          <form
            onSubmit={handleSubmitGenerate}
            style={{
              marginTop: '22px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {error && (
              <div role="alert" style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.14)', border: '1px solid rgba(251, 113, 133, 0.55)', color: '#fecdd3', fontSize: '0.8rem' }}>
                Could not generate the plan: {error}
              </div>
            )}

            {/* Quick Chips */}
            <div>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}>
                POPULAR ENGINEERING BLUEPRINTS:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {POPULAR_SUBJECTS.map((subj) => (
                  <button
                    key={subj.name}
                    type="button"
                    onClick={() => handleQuickSubject(subj.name)}
                    style={{
                      background: subjectInput === subj.name ? '#3b82f6' : 'rgba(255, 255, 255, 0.08)',
                      border: subjectInput === subj.name ? '1px solid #60a5fa' : '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#fff',
                      padding: '6px 12px',
                      borderRadius: '10px',
                      fontSize: '0.76rem',
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
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                Subject / Topic Name:
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  placeholder="e.g. Data Structures & Algorithms, Operating Systems, Machine Learning, Rust, Cloud AWS..."
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.07)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Customization Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '6px' }}>
                  Duration (Weeks):
                </label>
                <select
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#1e293b',
                    border: '1px solid #475569',
                    color: '#fff',
                    fontSize: '0.8rem',
                  }}
                >
                  <option value={1}>1 Week (Intensive Crash)</option>
                  <option value={2}>2 Weeks (Accelerated)</option>
                  <option value={4}>4 Weeks (Standard Mastery)</option>
                  <option value={8}>8 Weeks (Deep Dive)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '6px' }}>
                  Weekly Commitment:
                </label>
                <select
                  value={targetHoursPerWeek}
                  onChange={(e) => setTargetHoursPerWeek(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#1e293b',
                    border: '1px solid #475569',
                    color: '#fff',
                    fontSize: '0.8rem',
                  }}
                >
                  <option value={5}>5 Hours / Week</option>
                  <option value={10}>10 Hours / Week (Recommended)</option>
                  <option value={15}>15 Hours / Week</option>
                  <option value={20}>20 Hours / Week</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '6px' }}>
                  Starting Skill Level:
                </label>
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#1e293b',
                    border: '1px solid #475569',
                    color: '#fff',
                    fontSize: '0.8rem',
                  }}
                >
                  <option value="Beginner">Beginner (Foundations first)</option>
                  <option value="Intermediate">Intermediate (Core & patterns)</option>
                  <option value="Advanced">Advanced (Complex systems)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '6px' }}>
                  Target Goal:
                </label>
                <select
                  value={learningGoal}
                  onChange={(e) => setLearningGoal(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#1e293b',
                    border: '1px solid #475569',
                    color: '#fff',
                    fontSize: '0.8rem',
                  }}
                >
                  <option value="Full Mastery">Full Curriculum Mastery</option>
                  <option value="Interview Prep">Technical Interview Prep</option>
                  <option value="Exam Prep">Semester Exam / GATE Prep</option>
                  <option value="Practical Projects">Hands-on Project Building</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                }}
              >
                {loading ? (
                  <>Synthesizing Plan & Resources...</>
                ) : (
                  <>
                    <Zap size={16} /> Generate Study Plan & Resources
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── PLAN ACTIVE DASHBOARD & TRACKER HEADER ── */}
      {plan && (
        <>
          <div
            className="ui-card"
            style={{
              padding: '24px 28px',
              borderRadius: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
          >
            {/* Subject Title & Badges */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="badge badge-popular">{plan.subject}</span>
                  <span className="badge badge-info">{plan.skill_level}</span>
                  <span className="badge" style={{ background: '#fef3c7', color: '#b45309' }}>
                    {plan.learning_goal || 'Mastery'}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                  {plan.subject} — {plan.duration_weeks}-Week Master Plan
                </h2>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                  Generated on {plan.created_at || 'Today'} • Paced at {plan.target_hours_per_week || 10} hrs/week
                </div>
              </div>

              {/* Quick Hours Logger */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => onAddToLearn && onAddToLearn(!plan.is_added_to_learn)}
                  className={plan.is_added_to_learn ? 'btn btn-white' : 'btn btn-primary'}
                  style={{ fontSize: '0.78rem', padding: '7px 12px', borderRadius: '8px', border: plan.is_added_to_learn ? '1px solid #86efac' : 'none' }}
                >
                  {plan.is_added_to_learn ? '✓ Added to Learn' : 'Add to Learn'}
                </button>
                <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>Log Study Time:</span>
                <button
                  onClick={() => onUpdateProgress({ logged_hours_delta: 0.5 })}
                  className="btn btn-white"
                  style={{ fontSize: '0.74rem', padding: '5px 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  title="Add 30 minutes of study time"
                >
                  +30 min
                </button>
                <button
                  onClick={() => onUpdateProgress({ logged_hours_delta: 1.0 })}
                  className="btn btn-white"
                  style={{ fontSize: '0.74rem', padding: '5px 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  title="Add 1 hour of study time"
                >
                  +1 hour
                </button>
              </div>
            </div>

            {/* Tracker Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {/* Card 1: Overall Progress */}
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#1e3a8a', fontWeight: 700, textTransform: 'uppercase' }}>
                    Overall Progress
                  </span>
                  <Award size={16} color="#2563eb" />
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1d4ed8' }}>
                  {overallPercentage}%
                </div>
                <div style={{ height: '6px', background: '#dbeafe', borderRadius: '4px', overflow: 'hidden', marginTop: '6px' }}>
                  <div style={{ width: `${overallPercentage}%`, height: '100%', background: '#2563eb', borderRadius: '4px' }} />
                </div>
              </div>

              {/* Card 2: Milestones */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#14532d', fontWeight: 700, textTransform: 'uppercase' }}>
                    Milestones Done
                  </span>
                  <CheckCircle2 size={16} color="#16a34a" />
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803d' }}>
                  {completedMilestones} / {totalMilestones}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#166534', marginTop: '4px' }}>
                  {totalMilestones - completedMilestones} stages remaining
                </div>
              </div>

              {/* Card 3: Tracked Hours */}
              <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '12px', padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#713f12', fontWeight: 700, textTransform: 'uppercase' }}>
                    Study Hours
                  </span>
                  <Clock size={16} color="#ca8a04" />
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#a16207' }}>
                  {loggedHours} / {totalHours} hrs
                </div>
                <div style={{ fontSize: '0.72rem', color: '#854d0e', marginTop: '4px' }}>
                  {Math.max(0, Math.round(totalHours - loggedHours))} hrs to completion
                </div>
              </div>

              {/* Card 4: Study Streak */}
              <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '12px', padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#881337', fontWeight: 700, textTransform: 'uppercase' }}>
                    Active Streak
                  </span>
                  <Flame size={16} color="#e11d48" />
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#be123c' }}>
                  18 Days 🔥
                </div>
                <div style={{ fontSize: '0.72rem', color: '#9f1239', marginTop: '4px' }}>
                  Consistency multiplier: 1.25x
                </div>
              </div>
            </div>
          </div>

          {/* ── STAGES FILTER & MILESTONES ROADMAP ── */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  Curriculum Milestones & Resources
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Click subtopics to mark them done as you learn. Expand any stage to access top curated learning resources.
                </div>
              </div>

              {/* Filter Buttons */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {['All', 'In Progress', 'Completed'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStageFilter(filter)}
                    className={`btn ${stageFilter === filter ? 'btn-primary' : 'btn-white'}`}
                    style={{ fontSize: '0.74rem', padding: '5px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Milestones List */}
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
                        ? '1px solid #86efac'
                        : m.status === 'in_progress'
                        ? '1px solid #93c5fd'
                        : '1px solid #e2e8f0',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      transition: 'border-color 0.2s ease',
                    }}
                  >
                    {/* Milestone Accordion Header */}
                    <div
                      onClick={() => toggleMilestone(idx)}
                      style={{
                        padding: '16px 20px',
                        background: isStageComplete
                          ? '#f0fdf4'
                          : m.status === 'in_progress'
                          ? '#f8fafc'
                          : '#fff',
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
                            background: isStageComplete ? '#10b981' : m.status === 'in_progress' ? '#3b82f6' : '#94a3b8',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                          }}
                        >
                          {isStageComplete ? '✓' : m.stage_number || idx + 1}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0f172a' }}>
                              {m.title}
                            </span>
                            <span
                              className={`badge ${
                                isStageComplete
                                  ? 'badge-popular'
                                  : m.status === 'in_progress'
                                  ? 'badge-info'
                                  : ''
                              }`}
                              style={{
                                fontSize: '0.68rem',
                                background: isStageComplete ? '#dcfce7' : m.status === 'in_progress' ? '#eff6ff' : '#f1f5f9',
                                color: isStageComplete ? '#15803d' : m.status === 'in_progress' ? '#1d4ed8' : '#64748b',
                              }}
                            >
                              {isStageComplete ? 'Completed' : m.status === 'in_progress' ? 'In Progress' : 'Upcoming'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                            {completedSubs.length} of {subtopics.length} subtopics completed • Estimated: {m.estimated_hours} hrs
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {isExpanded ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
                      </div>
                    </div>

                    {/* Milestone Expanded Body */}
                    {isExpanded && (
                      <div style={{ padding: '18px 22px', borderTop: '1px solid #f1f5f9', background: '#fff' }}>
                        {m.description && (
                          <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.55, marginBottom: '16px' }}>
                            {m.description}
                          </p>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.3fr', gap: '24px' }}>
                          {/* Left Column: Subtopics Tracker Checklist */}
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <CheckCircle2 size={15} color="#2563eb" />
                              Key Concepts & Subtopics Checklist:
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {subtopics.map((sub, sIdx) => {
                                const isChecked = completedSubs.includes(sub);
                                const subtopicResource = getSubtopicResource(sub, stageResources, plan?.subject);
                                return (
                                  <label
                                    key={sIdx}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'flex-start',
                                      gap: '10px',
                                      padding: '8px 12px',
                                      borderRadius: '8px',
                                      background: isChecked ? '#f0fdf4' : '#f8fafc',
                                      border: isChecked ? '1px solid #bbf7d0' : '1px solid #f1f5f9',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease',
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() =>
                                        onUpdateProgress({
                                          milestone_id: m.id,
                                          subtopic_name: sub,
                                          subtopic_completed: !isChecked,
                                        })
                                      }
                                      style={{ marginTop: '2px', accentColor: '#10b981', cursor: 'pointer' }}
                                    />
                                    <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                                      <span
                                        style={{
                                          fontSize: '0.8rem',
                                          color: isChecked ? '#166534' : '#1e293b',
                                          textDecoration: isChecked ? 'line-through' : 'none',
                                          lineHeight: 1.4,
                                        }}
                                      >
                                        {sub}
                                      </span>
                                      <a
                                        href={subtopicResource.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(event) => event.stopPropagation()}
                                        style={{
                                          flexShrink: 0,
                                          fontSize: '0.7rem',
                                          color: '#2563eb',
                                          fontWeight: 700,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '3px',
                                          textDecoration: 'none',
                                        }}
                                      >
                                        {subtopicResource.label} <ExternalLink size={11} />
                                      </a>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>

                            {/* Milestone Practice Button */}
                            <button
                              onClick={() => onPracticeTopic && onPracticeTopic(m.title)}
                              className="btn btn-white"
                              style={{
                                width: '100%',
                                marginTop: '14px',
                                fontSize: '0.78rem',
                                padding: '8px',
                                borderRadius: '8px',
                                border: '1px solid #bfdbfe',
                                color: '#1d4ed8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                              }}
                            >
                              <Zap size={14} color="#2563eb" />
                              Test Diagnostic Knowledge for this Stage
                            </button>
                          </div>

                          {/* Right Column: Best Curated Resources */}
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <BookOpen size={15} color="#2563eb" />
                              Curated Best Resources & References:
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {stageResources.map((res) => {
                                const isVideo = res.resource_type === 'video';
                                const isCheatsheet = res.resource_type === 'cheatsheet';
                                const isPractice = res.resource_type === 'practice';

                                return (
                                  <div
                                    key={res.id}
                                    style={{
                                      padding: '12px 14px',
                                      borderRadius: '10px',
                                      background: res.completed ? '#f0fdf4' : '#fafafa',
                                      border: res.completed ? '1px solid #86efac' : '1px solid #e2e8f0',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '6px',
                                      transition: 'all 0.15s ease',
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {isVideo ? (
                                          <Play size={13} color="#dc2626" />
                                        ) : isCheatsheet ? (
                                          <FileText size={13} color="#d97706" />
                                        ) : isPractice ? (
                                          <Code2 size={13} color="#16a34a" />
                                        ) : (
                                          <BookOpen size={13} color="#2563eb" />
                                        )}
                                        <span
                                          style={{
                                            fontSize: '0.68rem',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            color: isVideo ? '#dc2626' : isCheatsheet ? '#d97706' : isPractice ? '#16a34a' : '#2563eb',
                                          }}
                                        >
                                          {res.resource_type} • {res.estimated_minutes} min
                                        </span>
                                      </div>

                                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#64748b', cursor: 'pointer' }}>
                                        <input
                                          type="checkbox"
                                          checked={res.completed || false}
                                          onChange={() =>
                                            onUpdateProgress({
                                              milestone_id: m.id,
                                              resource_id: res.id,
                                              resource_completed: !res.completed,
                                            })
                                          }
                                          style={{ accentColor: '#10b981', cursor: 'pointer' }}
                                        />
                                        <span>Done</span>
                                      </label>
                                    </div>

                                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>
                                      {res.title}
                                    </div>

                                    {res.summary && (
                                      <div style={{ fontSize: '0.74rem', color: '#64748b', lineHeight: 1.4 }}>
                                        {res.summary}
                                      </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                                      <a
                                        href={res.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                          fontSize: '0.72rem',
                                          color: '#2563eb',
                                          fontWeight: 600,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          textDecoration: 'none',
                                        }}
                                      >
                                        Open Link <ExternalLink size={12} />
                                      </a>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
