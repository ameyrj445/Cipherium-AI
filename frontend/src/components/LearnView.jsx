import React, { useState, useEffect } from 'react';
import {
  BookOpen, CheckCircle2, Circle, ExternalLink, Play, FileText,
  Code2, ChevronDown, ChevronUp, ChevronRight, Search,
  Zap, Clock, RotateCcw, Sparkles, Layers
} from 'lucide-react';
import { analyticsAPI } from '../services/api';

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

function InlinePlanDetails({ plan, onUpdateProgress }) {
  return <div style={{ marginTop: '-4px', marginBottom: '10px', padding: '18px 22px', border: '1px solid #bfdbfe', borderTop: 'none', borderRadius: '0 0 16px 16px', background: '#fff' }}>
    {(plan.milestones || []).map((milestone, index) => {
      const completed = milestone.completed_subtopics || [];
      return <details key={milestone.id || index} open={index === 0} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '12px', overflow: 'hidden' }}>
        <summary style={{ cursor: 'pointer', padding: '13px 16px', fontWeight: 800, color: '#0f172a', background: '#f8fafc' }}>Stage {index + 1}: {milestone.title} <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 500 }}>— {completed.length}/{(milestone.subtopics || []).length} topics done</span></summary>
        <div style={{ padding: '14px 16px' }}>
          {(milestone.subtopics || []).map((subtopic) => { const done = completed.includes(subtopic); const resource = getChecklistResource(subtopic, milestone.resources, plan.subject); return <div key={subtopic} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}><input type="checkbox" checked={done} onChange={() => onUpdateProgress?.({ plan_id: plan.id, milestone_id: milestone.id, subtopic_name: subtopic, subtopic_completed: !done })} /><span style={{ flex: 1, color: done ? '#15803d' : '#1e293b', textDecoration: done ? 'line-through' : 'none', fontSize: '0.84rem' }}>{subtopic}</span><a href={resource.url} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: '0.74rem', fontWeight: 700, textDecoration: 'none' }}>{resource.label} <ExternalLink size={11} style={{ verticalAlign: 'middle' }} /></a></div>; })}
          {(milestone.resources || []).length > 0 && <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>{milestone.resources.map((resource) => <a key={resource.id} href={resource.url} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: '0.75rem', padding: '6px 9px', background: '#eff6ff', borderRadius: '7px', textDecoration: 'none' }}>{resource.title} <ExternalLink size={11} style={{ verticalAlign: 'middle' }} /></a>)}</div>}
        </div>
      </details>;
    })}
  </div>;
}

// ── Site badge colors ─────────────────────────────────────────────────────────
const SITE_STYLES = {
  gfg:      { label: 'GFG',      bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
  leetcode: { label: 'LeetCode', bg: '#fff8e1', color: '#f57f17', border: '#ffe082' },
  neetcode: { label: 'NeetCode', bg: '#e3f2fd', color: '#1565c0', border: '#90caf9' },
  striver:  { label: 'Striver',  bg: '#f3e5f5', color: '#6a1b9a', border: '#ce93d8' },
  fcc:      { label: 'FCC',      bg: '#e8f5e9', color: '#1b5e20', border: '#a5d6a7' },
  mdn:      { label: 'MDN',      bg: '#e8eaf6', color: '#283593', border: '#9fa8da' },
  w3s:      { label: 'W3Schools', bg: '#e0f7fa', color: '#006064', border: '#80deea' },
  visualgo: { label: 'Visualgo', bg: '#fff3e0', color: '#e65100', border: '#ffcc80' },
  cpalgo:   { label: 'CP-Algo',  bg: '#fce4ec', color: '#880e4f', border: '#f48fb1' },
  programiz:{ label: 'Programiz',bg: '#e1f5fe', color: '#01579b', border: '#81d4fa' },
  ostep:    { label: 'OSTEP',    bg: '#f1f8e9', color: '#33691e', border: '#c5e1a5' },
  other:    { label: 'Resource', bg: '#f5f5f5', color: '#424242', border: '#e0e0e0' },
};

const TYPE_ICONS = {
  video:      { Icon: Play,     color: '#dc2626', label: 'Video' },
  article:    { Icon: BookOpen, color: '#2563eb', label: 'Article' },
  practice:   { Icon: Code2,    color: '#16a34a', label: 'Practice' },
  cheatsheet: { Icon: FileText, color: '#d97706', label: 'Sheet' },
};

export default function LearnView({
  topics = [],
  onSelectTopic,
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
      <div style={{ maxWidth: '920px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
          <button
            onClick={() => setSelectedSubjectId(null)}
            className="btn btn-white"
            style={{ fontSize: '0.78rem', padding: '7px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            ← Back to Subjects
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.5rem' }}>{subj.icon}</span>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{subj.title}</h2>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>{subj.tagline}</p>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: subj.color }}>{pct}%</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{doneCount}/{totalTopicCount} topics done</div>
          </div>
        </div>

        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden', marginBottom: '22px' }}>
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
                  border: `1.5px solid ${stageComplete ? '#86efac' : stageStarted ? subj.borderColor : '#e2e8f0'}`,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: '#fff',
                  boxShadow: stageComplete ? '0 2px 8px rgba(16,185,129,0.08)' : 'none',
                }}
              >
                <div
                  onClick={() => toggleStage(sIdx)}
                  style={{
                    padding: '16px 22px',
                    background: stageComplete ? '#f0fdf4' : stageStarted ? subj.bgColor : '#fafafa',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: stageComplete ? '#10b981' : stageStarted ? subj.color : '#e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem', flexShrink: 0
                  }}>
                    {stageComplete ? '✓' : stage.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#0f172a' }}>{stage.title}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                      {stageDone}/{stageTotal} topics completed
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {stageComplete && <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '3px 8px', borderRadius: '8px' }}>✓ Complete</span>}
                    {isExpanded ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
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
                            border: `1px solid ${isDone ? '#86efac' : '#e2e8f0'}`,
                            borderRadius: '12px',
                            overflow: 'hidden',
                            background: isDone ? '#f0fdf4' : '#fff',
                          }}
                        >
                          <div style={{
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            background: isDone ? '#f0fdf4' : '#fff',
                          }}>
                            <div style={{
                              width: '28px', height: '28px', borderRadius: '50%',
                              background: isDone ? '#10b981' : subj.color,
                              color: '#fff', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0
                            }}>
                              {isDone ? '✓' : tIdx + 1}
                            </div>

                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: '0.9rem', fontWeight: 700,
                                color: isDone ? '#15803d' : '#0f172a',
                                textDecoration: isDone ? 'line-through' : 'none',
                              }}>
                                {topic.title}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                                {topic.resources.length} resources · {topic.resources.filter(r => r.type === 'practice').length} practice problems
                              </div>
                            </div>

                            <button
                              onClick={(e) => { e.stopPropagation(); toggleTopicDone(topic.id); }}
                              style={{
                                border: isDone ? '1.5px solid #10b981' : `1.5px solid ${subj.color}`,
                                background: isDone ? '#dcfce7' : '#fff',
                                color: isDone ? '#15803d' : subj.color,
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
                            borderTop: '1px solid #f1f5f9',
                            background: isDone ? '#f0fdf4' : '#fafafa',
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
      </div>
    );
  }

  // ── Main Learn View with Active Plan & Explore Roadmaps ───────────────────────
  return (
    <div style={{ maxWidth: '980px', margin: '0 auto' }}>
      {/* Header with Navigation Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            📚 Roadmap & Curated Learning Tracker
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.86rem', marginTop: '4px' }}>
            Master your topics step-by-step with verified internet resources from GeeksForGeeks, LeetCode, NeetCode, YouTube, and Striver.
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', gap: '4px' }}>
          <button
            onClick={() => setActiveTab('activePlan')}
            style={{
              padding: '7px 14px',
              borderRadius: '9px',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'activePlan' ? '#ffffff' : 'transparent',
              color: activeTab === 'activePlan' ? '#2563eb' : '#64748b',
              boxShadow: activeTab === 'activePlan' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={14} color={activeTab === 'activePlan' ? '#2563eb' : '#64748b'} />
            My Study Plans {customPlans.length ? `(${customPlans.length})` : ''}
          </button>
          <button
            onClick={() => setActiveTab('explore')}
            style={{
              padding: '7px 14px',
              borderRadius: '9px',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'explore' ? '#ffffff' : 'transparent',
              color: activeTab === 'explore' ? '#2563eb' : '#64748b',
              boxShadow: activeTab === 'explore' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Layers size={14} color={activeTab === 'explore' ? '#2563eb' : '#64748b'} />
            Explore All Subjects
          </button>
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
                return <React.Fragment key={plan.id}><div className="ui-card" style={{ padding: '20px 24px', textAlign: 'left', border: selected ? '1.5px solid #93c5fd' : '1px solid #e2e8f0', background: selected ? 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)' : '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center' }}><div><span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2563eb', background: '#dbeafe', padding: '3px 9px', borderRadius: '10px' }}>⚡ Active Roadmap</span><div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '9px' }}>{plan.subject}</div><div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '4px' }}>Level: {plan.skill_level || 'Beginner'} · Target: {plan.target_hours_per_week} hrs/week · Duration: {plan.duration_weeks} weeks</div></div><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ textAlign: 'right' }}><div style={{ color: '#2563eb', fontWeight: 800, fontSize: '1.55rem' }}>{progress}%</div><div style={{ color: '#64748b', fontSize: '0.72rem' }}>{completedTopics} of {totalTopics} subtopics completed</div></div><button type="button" onClick={() => { onSelectPlan?.(plan); onOpenStudyPlan?.(); }} style={{ padding: '8px 11px', borderRadius: '9px', border: '1px solid #bfdbfe', background: '#fff', color: '#1d4ed8', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>Edit Plan</button><button type="button" onClick={() => { if (window.confirm(`Delete the ${plan.subject} study plan? This cannot be undone.`)) onDeletePlan?.(plan.id); }} style={{ padding: '8px 11px', borderRadius: '9px', border: '1px solid #fecaca', background: '#fff', color: '#dc2626', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>Delete Plan</button><button type="button" onClick={() => { onSelectPlan?.(plan); setExpandedPlanId(expanded ? null : plan.id); setExpandedStages({ 0: true }); }} style={{ width: '38px', height: '38px', borderRadius: '10px', border: '1px solid #bfdbfe', background: '#fff', color: '#2563eb', cursor: 'pointer' }}>{expanded ? <ChevronUp size={19} /> : <ChevronDown size={19} />}</button></div></div>
                  <div style={{ height: '8px', background: '#dbeafe', borderRadius: '8px', overflow: 'hidden', marginTop: '16px' }}><div style={{ height: '100%', width: `${progress}%`, background: '#2563eb', borderRadius: '8px' }} /></div>
                  <div style={{ display: 'flex', gap: '26px', marginTop: '12px', fontSize: '0.76rem', color: '#64748b' }}><span>Total hours: <strong style={{ color: '#0f172a' }}>{totalHours}h</strong></span><span>Hours logged: <strong style={{ color: '#0f172a' }}>{loggedHours}h</strong></span><span>Hours remaining: <strong style={{ color: '#0f172a' }}>{Math.max(totalHours - loggedHours, 0)}h</strong></span></div>
                </div>{expanded && <InlinePlanDetails plan={plan} onUpdateProgress={onUpdateProgress} />}</React.Fragment>;
              })}
            </div>
          )}
          {false && customPlan?.is_added_to_learn && expandedPlanId === customPlan.id ? (
            <div>
              {/* Plan Overview Card */}
              <div
                className="ui-card"
                style={{
                  padding: '24px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
                  border: '1.5px solid #bfdbfe',
                  marginBottom: '22px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: '#2563eb',
                        background: '#dbeafe',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginBottom: '8px',
                      }}
                    >
                      <Sparkles size={12} /> Active Roadmap
                    </span>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {customPlan.subject}
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                      Level: <strong>{customPlan.skill_level || 'Beginner'}</strong> • Target: <strong>{customPlan.target_hours_per_week} hrs/week</strong> • Duration: <strong>{customPlan.duration_weeks} weeks</strong>
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563eb', lineHeight: 1 }}>
                        {planStats.pct}%
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                        {planStats.doneSubs} of {planStats.totalSubs} subtopics completed
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedPlanId(expandedPlanId === customPlan.id ? null : customPlan.id)}
                      title={expandedPlanId === customPlan.id ? 'Collapse plan details' : 'Expand plan details'}
                      style={{ width: '34px', height: '34px', borderRadius: '9px', border: '1px solid #bfdbfe', background: '#fff', color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {expandedPlanId === customPlan.id ? <ChevronUp size={19} /> : <ChevronDown size={19} />}
                    </button>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {onOpenStudyPlan && (
                        <button
                          onClick={onOpenStudyPlan}
                          className="btn btn-white"
                          style={{ padding: '8px 14px', fontSize: '0.78rem', border: '1px solid #bfdbfe', borderRadius: '10px' }}
                        >
                          Edit Plan
                        </button>
                      )}
                      {onDeletePlan && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete the ${customPlan.subject} study plan? This cannot be undone.`)) onDeletePlan(customPlan.id);
                          }}
                          style={{ padding: '8px 14px', fontSize: '0.78rem', border: '1px solid #fecaca', borderRadius: '10px', background: '#fff', color: '#dc2626', cursor: 'pointer' }}
                        >
                          Delete Plan
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: '10px', background: '#dbeafe', borderRadius: '6px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${planStats.pct}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
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
                    <div key={label} style={{ background: '#ffffff', border: '1px solid #dbeafe', borderRadius: '10px', padding: '9px 11px' }}>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{label}</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{value}</div>
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
                        border: `1.5px solid ${isMilestoneComplete ? '#86efac' : isMilestoneStarted ? '#93c5fd' : '#e2e8f0'}`,
                        borderRadius: '16px',
                        overflow: 'hidden',
                        background: '#ffffff',
                        boxShadow: '0 2px 8px rgba(15,23,42,0.03)',
                      }}
                    >
                      {/* Milestone Header */}
                      <div
                        onClick={() => toggleStage(mIdx)}
                        style={{
                          padding: '16px 22px',
                          background: isMilestoneComplete ? '#f0fdf4' : isMilestoneStarted ? '#eff6ff' : '#fafafa',
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
                            background: isMilestoneComplete ? '#10b981' : isMilestoneStarted ? '#2563eb' : '#94a3b8',
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
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                              {m.title}
                            </div>
                            {isMilestoneComplete && (
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: '8px' }}>
                                Completed
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                            {completedSubs.length}/{subCount} subtopics done • ~{m.estimated_hours || 8} hrs estimated
                          </div>
                        </div>

                        {isExpanded ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
                      </div>

                      {/* Milestone Body */}
                      {isExpanded && (
                        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                          {/* Subtopics Checklist */}
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
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
                                      border: `1px solid ${isDone ? '#86efac' : '#e2e8f0'}`,
                                      background: isDone ? '#f0fdf4' : '#ffffff',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease',
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '6px',
                                        border: isDone ? 'none' : '1.5px solid #cbd5e1',
                                        background: isDone ? '#10b981' : '#ffffff',
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
                                        color: isDone ? '#15803d' : '#0f172a',
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
                                        color: '#2563eb',
                                        fontWeight: 700,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        textDecoration: 'none',
                                      }}
                                    >
                                      {checklistResource.label} <ExternalLink size={11} />
                                    </a>

                                    <span style={{ fontSize: '0.72rem', color: isDone ? '#15803d' : '#94a3b8' }}>
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
                              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                                Curated Learning Material & Practice Links
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
                                {m.resources.map((res, rIdx) => {
                                  const typeInfo = TYPE_ICONS[res.resource_type] || TYPE_ICONS.article;
                                  const TypeIcon = typeInfo.Icon;
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
                                        border: `1px solid ${isResDone ? '#86efac' : '#e2e8f0'}`,
                                        borderRadius: '12px',
                                        padding: '12px',
                                        background: isResDone ? '#f0fdf4' : '#fafafa',
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
                                          <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <Clock size={11} /> {res.estimated_minutes || 20}m
                                          </span>
                                        </div>

                                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.3, marginBottom: '4px' }}>
                                          {res.title}
                                        </div>

                                        {res.summary && (
                                          <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.4 }}>
                                            {res.summary}
                                          </div>
                                        )}
                                      </div>

                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: '4px' }}>
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
                                            color: isResDone ? '#16a34a' : '#64748b',
                                            fontSize: '0.72rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                          }}
                                        >
                                          {isResDone ? <CheckCircle2 size={13} color="#16a34a" /> : <Circle size={13} color="#94a3b8" />}
                                          {isResDone ? 'Completed' : 'Mark done'}
                                        </button>

                                        <a
                                          href={res.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          style={{
                                            fontSize: '0.74rem',
                                            fontWeight: 700,
                                            color: '#2563eb',
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
            <div
              className="ui-card"
              style={{
                display: customPlans.length ? 'none' : undefined,
                textAlign: 'center',
                padding: '48px 24px',
                borderRadius: '20px',
                border: '1.5px dashed #cbd5e1',
                background: '#ffffff',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Sparkles size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                No Plan Added to Learn Yet
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.86rem', maxWidth: '440px', margin: '8px auto 20px' }}>
                Generate a study plan, then select “Add to Learn” to track its roadmap, resources, and progress here.
              </p>
              {onOpenStudyPlan && (
                <button
                  onClick={onOpenStudyPlan}
                  className="btn btn-primary"
                  style={{ padding: '10px 22px', fontSize: '0.88rem', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Sparkles size={16} /> Open Study Plan
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: EXPLORE ALL SUBJECT ROADMAPS ─────────────────────────────── */}
      {activeTab === 'explore' && (
        <div>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '22px', maxWidth: '420px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search subjects (DSA, OS, Networks...)"
              style={{
                width: '100%', padding: '10px 14px 10px 40px',
                borderRadius: '12px', border: '1.5px solid #e2e8f0',
                background: '#fff', fontSize: '0.86rem', outline: 'none',
              }}
            />
          </div>

          {/* Subject Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '18px' }}>
            {subjectsLoading && <p style={{ color: '#64748b', margin: 0 }}>Loading subject roadmaps…</p>}
            {!subjectsLoading && subjects.length === 0 && <p style={{ color: '#64748b', margin: 0 }}>No subject roadmaps are available yet.</p>}
            {subjects
              .filter(s => !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((subj) => {
                let total = 0, done = 0;
                subj.stages.forEach(st => st.topics.forEach(t => { total++; if (doneTopics[t.id]) done++; }));
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                return (
                  <div
                    key={subj.id}
                    onClick={() => { setSelectedSubjectId(subj.id); setExpandedStages({ 0: true }); }}
                    style={{
                      border: `1.5px solid ${done > 0 ? subj.borderColor : '#e2e8f0'}`,
                      borderRadius: '18px',
                      padding: '22px',
                      background: '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = subj.color; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = done > 0 ? subj.borderColor : '#e2e8f0'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <div style={{ fontSize: '2rem' }}>{subj.icon}</div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: subj.color }}>{pct}%</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{done}/{total} done</div>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                      {subj.title}
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5, marginBottom: '14px' }}>
                      {subj.tagline}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
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
          <div style={{ marginTop: '32px', padding: '16px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: '8px', fontWeight: 700 }}>📌 CURATED SOURCES</div>
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
  );
}

