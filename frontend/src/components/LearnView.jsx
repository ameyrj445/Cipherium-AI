import React, { useState, useEffect } from 'react';
import {
  BookOpen, CheckCircle2, Circle, ExternalLink, Play, FileText,
  Code2, ChevronDown, ChevronUp, ChevronRight, Search,
  Clock, RotateCcw, Compass, Layers, Sparkles
} from 'lucide-react';
import { analyticsAPI } from '../services/api';
import BlueprintWizard from './common/BlueprintWizard';
import MilestoneProgressTree from './common/MilestoneProgressTree';
import PageContainer from './layout/PageContainer';
import PageHeader from './layout/PageHeader';
import StickyRail from './layout/StickyRail';


const getChecklistResource = (subtopic, stageResources, subject) => {
  const terms = new Set(String(subtopic || '').toLowerCase().match(/[a-z0-9+#.]{3,}/g) || []);
  const match = (stageResources || []).reduce((best, resource) => {
    const resourceTerms = new Set(`${resource.title || ''} ${resource.summary || ''}`.toLowerCase().match(/[a-z0-9+#.]{3,}/g) || []);
    const score = [...terms].filter((term) => resourceTerms.has(term)).length;
    return score > best.score ? { resource, score } : best;
  }, { resource: null, score: 0 });

  return match.resource && match.score > 0 && match.resource.url
    ? { url: match.resource.url, label: 'Open resource' }
    : {
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${subject || 'study'} ${subtopic} tutorial`)}`,
      label: 'Find tutorial',
    };
};

function InlinePlanDetails({ plan, onUpdateProgress, onStartPractice, onAskTutor }) {
  return (
    <div style={{ marginTop: '8px', marginBottom: '16px' }}>
      <MilestoneProgressTree
        milestones={plan.milestones || []}
        planId={plan.id}
        subject={plan.subject}
        onUpdateProgress={onUpdateProgress}
        onStartPractice={onStartPractice}
        onAskTutor={onAskTutor}
      />
    </div>
  );
}

// ── Site badge colors ─────────────────────────────────────────────────────────
const SITE_STYLES = {
  gfg:      { label: 'GFG',      bg: 'rgba(99, 102, 241, 0.12)', color: '#818CF8', border: 'rgba(99, 102, 241, 0.25)' },
  leetcode: { label: 'LeetCode', bg: 'rgba(99, 102, 241, 0.12)', color: '#818CF8', border: 'rgba(99, 102, 241, 0.25)' },
  neetcode: { label: 'NeetCode', bg: 'rgba(99, 102, 241, 0.12)', color: '#818CF8', border: 'rgba(99, 102, 241, 0.25)' },
  striver:  { label: 'Striver',  bg: 'rgba(99, 102, 241, 0.12)', color: '#818CF8', border: 'rgba(99, 102, 241, 0.25)' },
  fcc:      { label: 'FCC',      bg: 'rgba(99, 102, 241, 0.12)', color: '#818CF8', border: 'rgba(99, 102, 241, 0.25)' },
  mdn:      { label: 'MDN',      bg: 'rgba(99, 102, 241, 0.12)', color: '#818CF8', border: 'rgba(99, 102, 241, 0.25)' },
  w3s:      { label: 'W3Schools', bg: 'rgba(99, 102, 241, 0.12)', color: '#818CF8', border: 'rgba(99, 102, 241, 0.25)' },
  visualgo: { label: 'Visualgo', bg: 'rgba(99, 102, 241, 0.12)', color: '#818CF8', border: 'rgba(99, 102, 241, 0.25)' },
  cpalgo:   { label: 'CP-Algo',  bg: 'rgba(99, 102, 241, 0.12)', color: '#818CF8', border: 'rgba(99, 102, 241, 0.25)' },
  programiz:{ label: 'Programiz',bg: 'rgba(99, 102, 241, 0.12)', color: '#818CF8', border: 'rgba(99, 102, 241, 0.25)' },
  ostep:    { label: 'OSTEP',    bg: 'rgba(99, 102, 241, 0.12)', color: '#818CF8', border: 'rgba(99, 102, 241, 0.25)' },
  other:    { label: 'Resource', bg: 'rgba(99, 102, 241, 0.12)', color: '#818CF8', border: 'rgba(99, 102, 241, 0.25)' },
};

const TYPE_ICONS = {
  video:      { Icon: Play,     color: '#818CF8', label: 'Video' },
  article:    { Icon: BookOpen, color: '#818CF8', label: 'Article' },
  practice:   { Icon: Code2,    color: '#818CF8', label: 'Practice' },
  cheatsheet: { Icon: FileText, color: '#818CF8', label: 'Sheet' },
};

export default function LearnView({
  topics: _topics = [],
  onSelectTopic: _onSelectTopic = null,
  customPlan = null,
  customPlans = [],
  onSelectPlan,
  onDeletePlan,
  onUpdateProgress,
  onOpenStudyPlan,
  user = null,
}) {
  const [activeTab, setActiveTab] = useState('activePlan');
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [expandedStages, setExpandedStages] = useState({ 0: true, 1: true });
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [durationFilter, setDurationFilter] = useState('All');
  const [hoursFilter, setHoursFilter] = useState('All');

  // Auto-switch to active plan tab if customPlan becomes available
  useEffect(() => {
    if (customPlan?.is_added_to_learn) {
      setActiveTab('activePlan');
    }
  }, [customPlan?.id, customPlan?.is_added_to_learn]);

  useEffect(() => {
    let mounted = true;
    analyticsAPI.getSubjectRoadmaps()
      .then(({ data }) => {
        if (mounted) setSubjects(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (mounted) setSubjects([]);
      })
      .finally(() => {
        if (mounted) setSubjectsLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  // User-isolated local tracker state for exploring non-active subjects
  const userStorageKey = user?.email ? `cipherium_learn_done_${user.email}` : 'cipherium_learn_done';

  const [doneTopics, setDoneTopics] = useState(() => {
    try { return JSON.parse(localStorage.getItem(userStorageKey) || '{}'); }
    catch { return {}; }
  });

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(userStorageKey) || '{}');
      setDoneTopics(stored);
    } catch {
      setDoneTopics({});
    }
  }, [userStorageKey]);

  useEffect(() => {
    localStorage.setItem(userStorageKey, JSON.stringify(doneTopics));
  }, [doneTopics, userStorageKey]);

  const toggleTopicDone = (topicId) => {
    setDoneTopics(prev => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  const toggleStage = (idx) => {
    setExpandedStages(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Helper for active custom plan calculations
  const calculatePlanProgress = () => {
    if (!customPlan || !customPlan.milestones) return { totalSubs: 0, doneSubs: 0, pct: 0, totalHours: 0, doneHours: 0, remainingHours: 0 };
    let totalSubs = 0;
    let doneSubs = 0;
    customPlan.milestones.forEach(m => {
      totalSubs += (m.subtopics || []).length;
      doneSubs += (m.completed_subtopics || []).length;
    });
    const pct = totalSubs > 0 ? Math.round((doneSubs / totalSubs) * 100) : 0;
    return {
      totalSubs,
      doneSubs,
      pct,
      totalHours: customPlan.total_estimated_hours || 0,
      doneHours: customPlan.completed_hours || 0,
      remainingHours: Math.max((customPlan.total_estimated_hours || 0) - (customPlan.completed_hours || 0), 0)
    };
  };

  const planStats = calculatePlanProgress();
  const selectedSubject = subjects.find(subject => subject.id === selectedSubjectId);

  // ── Render Subject Detail when exploring a specific subject ───────────────────
  if (selectedSubjectId) {
    const subj = selectedSubject;
    if (!subj) {
      return (
        <div style={{ maxWidth: '920px', margin: '0 auto', padding: '40px 0', textAlign: 'center', color: '#64748b' }}>
          <p>{subjectsLoading ? 'Loading subject roadmap…' : 'This subject roadmap is no longer available.'}</p>
          <button className="btn btn-white" onClick={() => setSelectedSubjectId(null)}>← Back to Subjects</button>
        </div>
      );
    }

    let totalTopicCount = 0, doneCount = 0;
    subj.stages.forEach(st => {
      st.topics.forEach(t => {
        totalTopicCount++;
        if (doneTopics[t.id]) doneCount++;
      });
    });
    const pct = totalTopicCount > 0 ? Math.round((doneCount / totalTopicCount) * 100) : 0;

    return (
      <PageContainer noGrid>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
          <button
            onClick={() => setSelectedSubjectId(null)}
            className="btn btn-white"
            style={{ fontSize: '0.78rem', padding: '7px 14px', border: '1px solid var(--border-stroke, #2D2D35)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            ← Back to Subjects
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.5rem' }}>{subj.icon}</span>
              <div>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: subj.color,
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    display: 'inline-block',
                    marginBottom: '2px',
                  }}
                >
                  Subject Syllabus & Roadmap
                </span>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary, #F3F4F6)', margin: 0 }}>{subj.title}</h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #9CA3AF)', margin: '2px 0 0 0' }}>{subj.tagline}</p>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: subj.color }}>{pct}%</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #9CA3AF)' }}>{doneCount}/{totalTopicCount} topics done</div>
          </div>
        </div>

        <div style={{ height: '8px', background: 'var(--bg-shell, #161618)', borderRadius: '6px', overflow: 'hidden', marginBottom: '22px' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: subj.color, borderRadius: '6px', transition: 'width 0.4s ease' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {subj.stages.map((stage, sIdx) => {
            const isExpanded = expandedStages[sIdx] !== false;
            const stageDone = stage.topics.filter(t => doneTopics[t.id]).length;
            const stageTotal = stage.topics.length;
            const stageComplete = stageDone === stageTotal;
            const stageStarted = stageDone > 0;

            return (
              <div
                key={stage.id}
                style={{
                  border: `1.5px solid ${stageComplete ? '#10B981' : stageStarted ? subj.borderColor : 'var(--border-stroke, #2D2D35)'}`,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: 'var(--bg-surface, #1E1E22)',
                  boxShadow: stageComplete ? '0 2px 8px rgba(16,185,129,0.12)' : 'none',
                }}
              >
                <div
                  onClick={() => toggleStage(sIdx)}
                  style={{
                    padding: '16px 22px',
                    background: stageComplete ? 'rgba(16, 185, 129, 0.1)' : stageStarted ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-surface, #1E1E22)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: stageComplete ? '#10B981' : stageStarted ? subj.color : 'var(--bg-shell, #161618)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem', flexShrink: 0
                  }}>
                    {stageComplete ? '✓' : stage.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-primary, #F3F4F6)' }}>{stage.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #9CA3AF)', marginTop: '2px' }}>
                      {stageDone}/{stageTotal} topics completed
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {stageComplete && <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10B981', background: 'rgba(16, 185, 129, 0.15)', padding: '3px 8px', borderRadius: '8px' }}>✓ Complete</span>}
                    {isExpanded ? <ChevronUp size={18} color="var(--text-secondary, #9CA3AF)" /> : <ChevronDown size={18} color="var(--text-secondary, #9CA3AF)" />}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {stage.topics.map((topic, tIdx) => {
                      const isDone = !!doneTopics[topic.id];
                      return (
                        <div
                          key={topic.id}
                          style={{
                            border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-stroke, #2D2D35)'}`,
                            borderRadius: '12px',
                            overflow: 'hidden',
                            background: isDone ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-shell, #161618)',
                          }}
                        >
                          <div style={{
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            background: isDone ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-shell, #161618)',
                          }}>
                            <div style={{
                              width: '28px', height: '28px', borderRadius: '50%',
                              background: isDone ? '#10B981' : subj.color,
                              color: '#ffffff', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0
                            }}>
                              {isDone ? '✓' : tIdx + 1}
                            </div>

                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: '0.9rem', fontWeight: 700,
                                color: isDone ? '#10B981' : 'var(--text-primary, #F3F4F6)',
                                textDecoration: isDone ? 'line-through' : 'none',
                              }}>
                                {topic.title}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #9CA3AF)', marginTop: '2px' }}>
                                {topic.resources.length} resources · {topic.resources.filter(r => r.type === 'practice').length} practice problems
                              </div>
                            </div>

                            <button
                              onClick={(e) => { e.stopPropagation(); toggleTopicDone(topic.id); }}
                              style={{
                                border: isDone ? '1.5px solid #10B981' : `1.5px solid ${subj.color || '#6366F1'}`,
                                background: isDone ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface, #1E1E22)',
                                color: isDone ? '#10B981' : (subj.color || '#818CF8'),
                                padding: '5px 12px',
                                borderRadius: '8px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                flexShrink: 0,
                              }}
                            >
                              {isDone ? (<><RotateCcw size={13} /> Undo</>) : (<><CheckCircle2 size={13} /> Mark Done</>)}
                            </button>
                          </div>

                          <div style={{
                            padding: '10px 16px 14px 56px',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                            borderTop: '1px solid var(--border-stroke, #2D2D35)',
                            background: isDone ? 'rgba(16, 185, 129, 0.04)' : 'var(--bg-shell, #161618)',
                          }}>
                            {topic.resources.map((res, rIdx) => {
                              const siteStyle = SITE_STYLES[res.site] || SITE_STYLES.other;
                              const typeInfo = TYPE_ICONS[res.type] || TYPE_ICONS.article;
                              const TypeIcon = typeInfo.Icon;
                              return (
                                <a
                                  key={rIdx}
                                  href={res.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '5px 10px',
                                    borderRadius: '8px',
                                    background: siteStyle.bg,
                                    border: `1px solid ${siteStyle.border}`,
                                    color: siteStyle.color,
                                    fontSize: '0.74rem',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    opacity: isDone ? 0.65 : 1,
                                  }}
                                  title={res.label}
                                >
                                  <TypeIcon size={13} color={typeInfo.color} />
                                  <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {res.label}
                                  </span>
                                  <ExternalLink size={11} style={{ opacity: 0.6, flexShrink: 0 }} />
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </PageContainer>
    );
  }

  // ── Main Learn View with Active Plan & Explore Roadmaps ───────────────────────
  const hasPlans = customPlans.length > 0;
  const lastVisitedPlan = customPlan || customPlans[0] || null;

  return (
    <PageContainer>
      {/* 1. Header row with segmented control right-aligned */}
      <div style={{ gridColumn: '1 / -1' }}>
        <PageHeader
          eyebrow="CURRICULUM ROADMAPS & LEARNING TRACKER"
          title="Curated Learning Roadmaps & Progress Tracker"
          description="Master core computer science topics step-by-step with verified internet resources from GeeksForGeeks, LeetCode, NeetCode, YouTube, and Striver."
          actions={
            <div
              style={{
                display: 'flex',
                background: 'var(--bg-surface, #1E1E22)',
                border: '1px solid var(--border-stroke, #2D2D35)',
                padding: '4px',
                borderRadius: '12px',
                gap: '4px',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('activePlan')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '9px',
                  border: activeTab === 'activePlan' ? '1px solid var(--border-stroke, #2D2D35)' : '1px solid transparent',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === 'activePlan' ? 'var(--bg-canvas, #121214)' : 'transparent',
                  color: activeTab === 'activePlan' ? 'var(--text-primary, #F3F4F6)' : 'var(--text-secondary, #9CA3AF)',
                  boxShadow: activeTab === 'activePlan' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Compass size={14} color={activeTab === 'activePlan' ? '#6366F1' : 'var(--text-secondary, #9CA3AF)'} />
                My Study Plans {customPlans.length ? `(${customPlans.length})` : ''}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('explore')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '9px',
                  border: activeTab === 'explore' ? '1px solid var(--border-stroke, #2D2D35)' : '1px solid transparent',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === 'explore' ? 'var(--bg-canvas, #121214)' : 'transparent',
                  color: activeTab === 'explore' ? 'var(--text-primary, #F3F4F6)' : 'var(--text-secondary, #9CA3AF)',
                  boxShadow: activeTab === 'explore' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Layers size={14} color={activeTab === 'explore' ? '#6366F1' : 'var(--text-secondary, #9CA3AF)'} />
                Explore All Subjects
              </button>
            </div>
          }
        />
      </div>

      {/* 2. Main Column (9 cols if hasPlans, else 12 cols) */}
      <div
        style={{
          gridColumn: hasPlans ? '1 / span 9' : '1 / -1',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          width: '100%',
        }}
      >
        {/* Filter and Sort Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            padding: '12px 16px',
            background: 'var(--bg-surface, #1E1E22)',
            border: '1px solid var(--border-stroke, #2D2D35)',
            borderRadius: '12px',
          }}
        >
          {/* Category chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary, #9CA3AF)', marginRight: '2px' }}>
              Category:
            </span>
            {['All', 'DSA', 'ML', 'Full-Stack', 'Systems'].map((cat) => {
              const isSel = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: isSel ? '#6366F1' : 'var(--border-stroke, #2D2D35)',
                    background: isSel ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-shell, #161618)',
                    color: isSel ? '#818CF8' : 'var(--text-secondary, #9CA3AF)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Duration & Weekly Hours Dropdowns */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value)}
              aria-label="Filter by duration"
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border-stroke, #2D2D35)',
                background: 'var(--bg-shell, #161618)',
                color: 'var(--text-primary, #F3F4F6)',
                fontSize: '0.76rem',
                cursor: 'pointer',
              }}
            >
              <option value="All">All Durations</option>
              <option value="<8">&lt; 8 weeks</option>
              <option value=">=8">8+ weeks</option>
            </select>

            <select
              value={hoursFilter}
              onChange={(e) => setHoursFilter(e.target.value)}
              aria-label="Filter by weekly hours"
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border-stroke, #2D2D35)',
                background: 'var(--bg-shell, #161618)',
                color: 'var(--text-primary, #F3F4F6)',
                fontSize: '0.76rem',
                cursor: 'pointer',
              }}
            >
              <option value="All">All Weekly Hours</option>
              <option value="<6">&lt; 6 hrs/wk</option>
              <option value=">=6">6+ hrs/wk</option>
            </select>
          </div>
        </div>

        {/* ── TAB 1: ACTIVE STUDY PLAN ROADMAP ─────────────────────────────────── */}
        {activeTab === 'activePlan' && (
          <div>
            {customPlans.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
              {customPlans.map((plan) => {
                const totalTopics = (plan.milestones || []).reduce((total, milestone) => total + (milestone.subtopics || []).length, 0);
                const completedTopics = (plan.milestones || []).reduce((total, milestone) => total + (milestone.completed_subtopics || []).length, 0);
                const progress = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;
                const totalHours = plan.total_estimated_hours || (plan.duration_weeks || 0) * (plan.target_hours_per_week || 0);
                const loggedHours = plan.completed_hours || 0;
                const selected = plan.id === customPlan?.id;
                const expanded = expandedPlanId === plan.id;
                return <React.Fragment key={plan.id}><div className="ui-card" style={{ padding: '20px 24px', textAlign: 'left', border: selected ? '1.5px solid #6366F1' : '1px solid var(--border-stroke, #2D2D35)', background: selected ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-surface, #1E1E22)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center' }}><div><span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#818CF8', background: 'rgba(99, 102, 241, 0.15)', padding: '3px 9px', borderRadius: '10px' }}>⚡ Active Roadmap</span><div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary, #F3F4F6)', marginTop: '9px' }}>{plan.subject}</div><div style={{ color: 'var(--text-secondary, #9CA3AF)', fontSize: '0.78rem', marginTop: '4px' }}>Level: {plan.skill_level || 'Beginner'} · Target: {plan.target_hours_per_week} hrs/week · Duration: {plan.duration_weeks} weeks</div></div><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ textAlign: 'right' }}><div style={{ color: '#6366F1', fontWeight: 800, fontSize: '1.55rem' }}>{progress}%</div><div style={{ color: 'var(--text-secondary, #9CA3AF)', fontSize: '0.72rem' }}>{completedTopics} of {totalTopics} subtopics completed</div></div><button type="button" onClick={() => { onSelectPlan?.(plan); onOpenStudyPlan?.(); }} style={{ padding: '8px 11px', borderRadius: '9px', border: '1px solid var(--border-stroke, #2D2D35)', background: 'var(--bg-shell, #161618)', color: 'var(--text-primary, #F3F4F6)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>Edit Plan</button><button type="button" onClick={() => { if (window.confirm(`Delete the ${plan.subject} study plan? This cannot be undone.`)) onDeletePlan?.(plan.id); }} style={{ padding: '8px 11px', borderRadius: '9px', border: '1px solid rgba(244, 63, 94, 0.3)', background: 'rgba(244, 63, 94, 0.1)', color: '#F43F5E', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>Delete Plan</button><button type="button" onClick={() => { onSelectPlan?.(plan); setExpandedPlanId(expanded ? null : plan.id); setExpandedStages({ 0: true }); }} style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1px solid var(--border-stroke, #2D2D35)', background: 'var(--bg-shell, #161618)', color: '#6366F1', cursor: 'pointer' }}>{expanded ? <ChevronUp size={19} /> : <ChevronDown size={19} />}</button></div></div>
                  <div style={{ height: '8px', background: 'var(--border-stroke, #2D2D35)', borderRadius: '8px', overflow: 'hidden', marginTop: '16px' }}><div style={{ height: '100%', width: `${progress}%`, background: '#6366F1', borderRadius: '8px' }} /></div>
                  <div style={{ display: 'flex', gap: '26px', marginTop: '12px', fontSize: '0.76rem', color: 'var(--text-secondary, #9CA3AF)' }}><span>Total hours: <strong style={{ color: 'var(--text-primary, #F3F4F6)' }}>{totalHours}h</strong></span><span>Hours logged: <strong style={{ color: 'var(--text-primary, #F3F4F6)' }}>{loggedHours}h</strong></span><span>Hours remaining: <strong style={{ color: 'var(--text-primary, #F3F4F6)' }}>{Math.max(totalHours - loggedHours, 0)}h</strong></span></div>
                </div>{expanded && <InlinePlanDetails plan={plan} onUpdateProgress={onUpdateProgress} onStartPractice={onSelectTopic} onAskTutor={onSelectTopic} />}</React.Fragment>;
              })}
            </div>
          )}
          {customPlan?.is_added_to_learn && expandedPlanId === customPlan.id ? (
            <div>
              {/* Plan Overview Card */}
              <div
                className="ui-card"
                style={{
                  padding: '24px',
                  borderRadius: '10px',
                  background: 'var(--bg-surface, #1E1E22)',
                  border: '1px solid var(--border-stroke, #2D2D35)',
                  marginBottom: '22px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: '#818CF8',
                        background: 'rgba(99, 102, 241, 0.15)',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginBottom: '8px',
                      }}
                    >
                      <BookOpen size={12} /> Active Roadmap
                    </span>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary, #F3F4F6)', margin: 0 }}>
                      {customPlan.subject}
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #9CA3AF)', marginTop: '4px' }}>
                      Level: <strong>{customPlan.skill_level || 'Beginner'}</strong> • Target: <strong>{customPlan.target_hours_per_week} hrs/week</strong> • Duration: <strong>{customPlan.duration_weeks} weeks</strong>
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#6366F1', lineHeight: 1 }}>
                        {planStats.pct}%
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #9CA3AF)', marginTop: '4px' }}>
                        {planStats.doneSubs} of {planStats.totalSubs} subtopics completed
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedPlanId(expandedPlanId === customPlan.id ? null : customPlan.id)}
                      title={expandedPlanId === customPlan.id ? 'Collapse plan details' : 'Expand plan details'}
                      style={{ width: '34px', height: '34px', borderRadius: '9px', border: '1px solid var(--border-stroke, #2D2D35)', background: 'var(--bg-shell, #161618)', color: '#6366F1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {expandedPlanId === customPlan.id ? <ChevronUp size={19} /> : <ChevronDown size={19} />}
                    </button>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {onOpenStudyPlan && (
                        <button
                          onClick={onOpenStudyPlan}
                          className="btn btn-white"
                          style={{ padding: '8px 14px', fontSize: '0.78rem', border: '1px solid var(--border-stroke, #2D2D35)', borderRadius: '10px' }}
                        >
                          Edit Plan
                        </button>
                      )}
                      {onDeletePlan && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete the ${customPlan.subject} study plan? This cannot be undone.`)) onDeletePlan(customPlan.id);
                          }}
                          style={{ padding: '8px 14px', fontSize: '0.78rem', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.1)', color: '#F43F5E', cursor: 'pointer' }}
                        >
                          Delete Plan
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: '10px', background: 'var(--border-stroke, #2D2D35)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${planStats.pct}%`,
                      height: '100%',
                      background: '#6366F1',
                      borderRadius: '6px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '14px' }}>
                  {[
                    ['Total hours', `${planStats.totalHours}h`],
                    ['Hours logged', `${planStats.doneHours}h`],
                    ['Hours remaining', `${planStats.remainingHours}h`],
                  ].map(([label, value]) => (
                    <div key={label} style={{ background: 'var(--bg-shell, #161618)', border: '1px solid var(--border-stroke, #2D2D35)', borderRadius: '10px', padding: '9px 11px' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary, #9CA3AF)' }}>{label}</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary, #F3F4F6)', marginTop: '2px' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestones Accordion */}
              {expandedPlanId === customPlan.id && (<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(customPlan.milestones || []).map((m, mIdx) => {
                  const isExpanded = expandedStages[mIdx] !== false;
                  const completedSubs = m.completed_subtopics || [];
                  const subCount = (m.subtopics || []).length;
                  const isMilestoneComplete = subCount > 0 && completedSubs.length >= subCount;
                  const isMilestoneStarted = completedSubs.length > 0;

                  return (
                    <div
                      key={m.id || mIdx}
                      style={{
                        border: `1.5px solid ${isMilestoneComplete ? '#10B981' : isMilestoneStarted ? '#6366F1' : 'var(--border-stroke, #2D2D35)'}`,
                        borderRadius: '16px',
                        overflow: 'hidden',
                        background: 'var(--bg-surface, #1E1E22)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      }}
                    >
                      {/* Milestone Header */}
                      <div
                        onClick={() => toggleStage(mIdx)}
                        style={{
                          padding: '16px 22px',
                          background: isMilestoneComplete ? 'rgba(16, 185, 129, 0.1)' : isMilestoneStarted ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-surface, #1E1E22)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: isMilestoneComplete ? '#10B981' : isMilestoneStarted ? '#6366F1' : 'var(--bg-shell, #161618)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.9rem',
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {isMilestoneComplete ? '✓' : mIdx + 1}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary, #F3F4F6)' }}>
                              {m.title}
                            </div>
                            {isMilestoneComplete && (
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10B981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '8px' }}>
                                Completed
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #9CA3AF)', marginTop: '2px' }}>
                            {completedSubs.length}/{subCount} subtopics done • ~{m.estimated_hours || 8} hrs estimated
                          </div>
                        </div>

                        {isExpanded ? <ChevronUp size={18} color="var(--text-secondary, #9CA3AF)" /> : <ChevronDown size={18} color="var(--text-secondary, #9CA3AF)" />}
                      </div>

                      {/* Milestone Body */}
                      {isExpanded && (
                        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                          {/* Subtopics Checklist */}
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary, #9CA3AF)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                              Checklist: Mark Topics Done as you Learn
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {(m.subtopics || []).map((sub, sIdx) => {
                                const isDone = completedSubs.includes(sub);
                                const checklistResource = getChecklistResource(sub, m.resources, customPlan.subject);
                                return (
                                  <div
                                    key={sIdx}
                                    onClick={() => {
                                      if (onUpdateProgress) {
                                        onUpdateProgress({
                                          milestone_id: m.id,
                                          subtopic_name: sub,
                                          subtopic_completed: !isDone,
                                        });
                                      }
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '12px',
                                      padding: '10px 14px',
                                      borderRadius: '10px',
                                      border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-stroke, #2D2D35)'}`,
                                      background: isDone ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-shell, #161618)',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease',
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '6px',
                                        border: isDone ? 'none' : '1.5px solid var(--border-stroke, #2D2D35)',
                                        background: isDone ? '#10B981' : 'var(--bg-shell, #161618)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                      }}
                                    >
                                      {isDone && <CheckCircle2 size={15} color="#ffffff" />}
                                    </div>

                                    <span
                                      style={{
                                        fontSize: '0.86rem',
                                        color: isDone ? '#10B981' : '#F8FAFC',
                                        textDecoration: isDone ? 'line-through' : 'none',
                                        fontWeight: isDone ? 500 : 600,
                                        flex: 1,
                                      }}
                                    >
                                      {sub}
                                    </span>

                                    <a
                                      href={checklistResource.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={(event) => event.stopPropagation()}
                                      style={{
                                        flexShrink: 0,
                                        fontSize: '0.72rem',
                                        color: '#818CF8',
                                        fontWeight: 700,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        textDecoration: 'none',
                                      }}
                                    >
                                      {checklistResource.label} <ExternalLink size={11} />
                                    </a>

                                    <span style={{ fontSize: '0.72rem', color: isDone ? '#10B981' : '#94A3B8' }}>
                                      {isDone ? 'Done' : 'Click to mark done'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Curated Resources for this milestone */}
                          {(m.resources || []).length > 0 && (
                            <div>
                              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                                Curated Learning Material & Practice Links
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
                                {m.resources.map((res, rIdx) => {
                                  const isResDone = !!res.completed;

                                  // Determine site badge
                                  let siteKey = 'other';
                                  const u = (res.url || '').toLowerCase();
                                  if (u.includes('geeksforgeeks')) siteKey = 'gfg';
                                  else if (u.includes('leetcode')) siteKey = 'leetcode';
                                  else if (u.includes('neetcode')) siteKey = 'neetcode';
                                  else if (u.includes('takeuforward') || u.includes('striver')) siteKey = 'striver';
                                  else if (u.includes('freecodecamp')) siteKey = 'fcc';
                                  else if (u.includes('mozilla') || u.includes('mdn')) siteKey = 'mdn';
                                  else if (u.includes('w3schools')) siteKey = 'w3s';
                                  else if (u.includes('visualgo')) siteKey = 'visualgo';

                                  const siteStyle = SITE_STYLES[siteKey] || SITE_STYLES.other;

                                  return (
                                    <div
                                      key={res.id || rIdx}
                                      style={{
                                        border: `1px solid ${isResDone ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-stroke, #2D2D35)'}`,
                                        borderRadius: '12px',
                                        padding: '12px',
                                        background: isResDone ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-shell, #161618)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        gap: '8px',
                                      }}
                                    >
                                      <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                          <span style={{ fontSize: '0.66rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: siteStyle.bg, color: siteStyle.color, border: `1px solid ${siteStyle.border}` }}>
                                            {siteStyle.label}
                                          </span>
                                          <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary, #9CA3AF)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <Clock size={11} /> {res.estimated_minutes || 20}m
                                          </span>
                                        </div>

                                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary, #F3F4F6)', lineHeight: 1.3, marginBottom: '4px' }}>
                                          {res.title}
                                        </div>

                                        {res.summary && (
                                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #9CA3AF)', lineHeight: 1.4 }}>
                                            {res.summary}
                                          </div>
                                        )}
                                      </div>

                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-stroke, #2D2D35)', paddingTop: '8px', marginTop: '4px' }}>
                                        <button
                                          onClick={() => {
                                            if (onUpdateProgress) {
                                              onUpdateProgress({
                                                milestone_id: m.id,
                                                resource_id: res.id,
                                                resource_completed: !isResDone,
                                              });
                                            }
                                          }}
                                          style={{
                                            border: 'none',
                                            background: 'transparent',
                                            color: isResDone ? '#10B981' : '#94A3B8',
                                            fontSize: '0.72rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                          }}
                                        >
                                          {isResDone ? <CheckCircle2 size={13} color="#10B981" /> : <Circle size={13} color="#94A3B8" />}
                                          {isResDone ? 'Completed' : 'Mark done'}
                                        </button>

                                        <a
                                          href={res.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          style={{
                                            fontSize: '0.74rem',
                                            fontWeight: 700,
                                            color: '#818CF8',
                                            textDecoration: 'none',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
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
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>)}
            </div>
          ) : (
            <div style={{ display: customPlans.length ? 'none' : undefined, width: '100%' }}>
              <BlueprintWizard
                bare
                categoryFilter={categoryFilter}
                durationFilter={durationFilter}
                hoursFilter={hoursFilter}
                onSelectBlueprint={(blueprintId) => {
                  setSelectedSubjectId(blueprintId);
                }}
                onOpenCustomGenerator={onOpenStudyPlan}
              />
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: EXPLORE ALL SUBJECT ROADMAPS ─────────────────────────────── */}
      {activeTab === 'explore' && (
        <div>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '22px', maxWidth: '420px' }}>
            <Search size={16} color="var(--text-secondary, #9CA3AF)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search subjects (DSA, OS, Networks...)"
              style={{
                width: '100%', padding: '10px 14px 10px 40px',
                borderRadius: '12px', border: '1.5px solid var(--border-stroke, #2D2D35)',
                background: 'var(--bg-shell, #161618)', color: 'var(--text-primary, #F3F4F6)', fontSize: '0.86rem', outline: 'none',
              }}
            />
          </div>

          {/* Subject Cards Grid: repeat(auto-fill, minmax(340px, 1fr)) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
            {subjectsLoading && <p style={{ color: '#64748b', margin: 0 }}>Loading subject roadmaps...</p>}
            {!subjectsLoading && subjects.length === 0 && <p style={{ color: '#64748b', margin: 0 }}>No subject roadmaps are available yet.</p>}
            {subjects
              .filter(s => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase().trim();
                const matchTitle = s.title.toLowerCase().includes(q);
                const matchDesc = s.desc?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q);
                const matchStages = s.stages?.some(st =>
                  st.title.toLowerCase().includes(q) ||
                  st.topics?.some(t => t.title.toLowerCase().includes(q))
                );
                return matchTitle || matchDesc || matchStages;
              })
              .map((subj) => {
                let total = 0, done = 0;
                subj.stages.forEach(st => st.topics.forEach(t => { total++; if (doneTopics[t.id]) done++; }));
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                return (
                  <div
                    key={subj.id}
                    onClick={() => { setSelectedSubjectId(subj.id); setExpandedStages({ 0: true }); }}
                    style={{
                      border: `1.5px solid ${done > 0 ? subj.borderColor : 'var(--border-stroke, #2D2D35)'}`,
                      borderRadius: '18px',
                      padding: '22px',
                      background: 'var(--bg-surface, #1E1E22)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '100%',
                      boxSizing: 'border-box',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = subj.color; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = done > 0 ? subj.borderColor : 'var(--border-stroke, #2D2D35)'; }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                        <div style={{ fontSize: '2rem' }}>{subj.icon}</div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: subj.color }}>{pct}%</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary, #9CA3AF)' }}>{done}/{total} done</div>
                        </div>
                      </div>

                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary, #F3F4F6)', marginBottom: '6px' }}>
                        {subj.title}
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #9CA3AF)', lineHeight: 1.5, marginBottom: '14px' }}>
                        {subj.tagline}
                      </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px' }}>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #9CA3AF)' }}>
                        {subj.stages.length} stages • {total} topics
                      </div>
                      <span style={{ color: subj.color, fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        View Roadmap <ChevronRight size={16} />
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Trusted Sources Footer */}
          <div style={{ marginTop: '32px', padding: '16px 20px', background: 'var(--bg-surface, #1E1E22)', borderRadius: '12px', border: '1px solid var(--border-stroke, #2D2D35)' }}>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary, #9CA3AF)', marginBottom: '8px', fontWeight: 700 }}>📌 CURATED SOURCES</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {Object.values(SITE_STYLES).map(s => (
                <span key={s.label} style={{ padding: '3px 10px', borderRadius: '8px', background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: '0.72rem', fontWeight: 600 }}>
                  {s.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>

      {/* 3. Right Rail (3 cols) when hasPlans is true */}
      {hasPlans && (
        <StickyRail columns={3} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Resume Where You Left Off */}
          {lastVisitedPlan && (
            <div
              className="ui-card"
              style={{
                padding: '18px',
                background: 'var(--bg-surface, #1E1E22)',
                border: '1px solid var(--border-stroke, #2D2D35)',
                borderRadius: '12px',
              }}
            >
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#818CF8',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RotateCcw size={12} />
                <span>Resume Where You Left Off</span>
              </div>
              <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary, #F3F4F6)', margin: '0 0 6px' }}>
                {lastVisitedPlan.subject}
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #9CA3AF)', margin: '0 0 14px', lineHeight: 1.4 }}>
                {lastVisitedPlan.milestones?.[0]?.title || 'Continue your targeted syllabus'}
              </p>
              <button
                type="button"
                onClick={() => {
                  onSelectPlan?.(lastVisitedPlan);
                  onOpenStudyPlan?.();
                }}
                className="btn btn-primary"
                style={{ width: '100%', fontSize: '0.78rem', padding: '8px 12px', borderRadius: '8px' }}
              >
                Resume Roadmap →
              </button>
            </div>
          )}

          {/* Active Plans Compact List */}
          <div
            className="ui-card"
            style={{
              padding: '18px',
              background: 'var(--bg-surface, #1E1E22)',
              border: '1px solid var(--border-stroke, #2D2D35)',
              borderRadius: '12px',
            }}
          >
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary, #F3F4F6)', marginBottom: '12px' }}>
              Your Active Plans ({customPlans.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {customPlans.map((p) => {
                const totalTopics = (p.milestones || []).reduce((acc, m) => acc + (m.subtopics || []).length, 0);
                const doneTopicsCount = (p.milestones || []).reduce((acc, m) => acc + (m.completed_subtopics || []).length, 0);
                const pct = totalTopics ? Math.round((doneTopicsCount / totalTopics) * 100) : 0;
                const isSelected = p.id === customPlan?.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => onSelectPlan?.(p)}
                    style={{
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-shell, #161618)',
                      border: '1px solid',
                      borderColor: isSelected ? 'rgba(99, 102, 241, 0.35)' : 'var(--border-stroke, #2D2D35)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary, #F3F4F6)', marginBottom: '5px' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                        {p.subject}
                      </span>
                      <span style={{ color: '#818CF8' }}>{pct}%</span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--border-stroke, #2D2D35)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#6366F1' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Generate Custom AI Plan CTA */}
          <div
            className="ui-card"
            style={{
              padding: '18px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(124, 58, 237, 0.06))',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <Sparkles size={20} color="#818CF8" style={{ margin: '0 auto 8px' }} />
            <h5 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary, #F3F4F6)', margin: '0 0 6px' }}>
              Custom AI Study Plan
            </h5>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary, #9CA3AF)', margin: '0 0 14px', lineHeight: 1.45 }}>
              Generate an adaptive roadmap matching your schedule and skill level.
            </p>
            <button
              type="button"
              onClick={onOpenStudyPlan}
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '0.78rem', padding: '8px 12px', borderRadius: '8px' }}
            >
              Generate Custom AI Plan
            </button>
          </div>
        </StickyRail>
      )}
    </PageContainer>
  );
}

