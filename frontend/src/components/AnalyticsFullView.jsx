import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart2, BookOpen, CheckCircle2, Clock, Target, Flame, XCircle,
  Brain, ChevronRight, Zap, TrendingUp, AlertTriangle, ArrowRight, Award
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, AreaChart, Area
} from 'recharts';
import { analyticsAPI } from '../services/api';
import PageContainer from './layout/PageContainer';
import PageHeader from './layout/PageHeader';
import FlashFixCard from './common/FlashFixCard';
import ActivityHeatmap from './ActivityHeatmap';
import CompetencyRadarChart from './CompetencyRadarChart';

const totalsFor = (plans) =>
  plans.reduce(
    (total, plan) => {
      const milestones = plan.milestones || [];
      total.planHours += plan.total_estimated_hours || (plan.duration_weeks || 0) * (plan.target_hours_per_week || 0);
      total.loggedHours += plan.completed_hours || 0;
      total.stages += milestones.length;
      milestones.forEach((milestone) => {
        const topics = milestone.subtopics || [];
        const completed = milestone.completed_subtopics || [];
        const resources = milestone.resources || [];
        total.topics += topics.length;
        total.topicsDone += completed.length;
        total.resources += resources.length;
        total.resourcesDone += resources.filter((resource) => resource.completed).length;
        if (
          topics.length + resources.length > 0 &&
          completed.length + resources.filter((resource) => resource.completed).length === topics.length + resources.length
        ) {
          total.stagesDone += 1;
        }
      });
      return total;
    },
    { topics: 0, topicsDone: 0, resources: 0, resourcesDone: 0, planHours: 0, loggedHours: 0, stages: 0, stagesDone: 0 }
  );

export default function AnalyticsFullView({
  analytics = null,
  plans = [],
  onPracticeTopic = () => {},
}) {
  const [activeTab, setActiveTab] = useState('mastery'); // 'mastery' or 'roadmap'
  const [planFilter, setPlanFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // Load flashcards for weak topics
  useEffect(() => {
    let isMounted = true;
    async function loadCards() {
      setLoadingCards(true);
      try {
        const res = await analyticsAPI.getFlashcards();
        if (isMounted && res.data) setFlashcards(res.data);
      } catch (e) {
        console.error('Error fetching flashcards:', e);
      } finally {
        if (isMounted) setLoadingCards(false);
      }
    }
    loadCards();
    return () => { isMounted = false; };
  }, []);

  const [activityData, setActivityData] = useState(null);

  // Load activity heatmap and competency radar
  useEffect(() => {
    let isMounted = true;
    analyticsAPI.getActivityHeatmap()
      .then((res) => {
        if (isMounted && res.data) setActivityData(res.data);
      })
      .catch((err) => {
        console.error('Error fetching activity heatmap:', err);
      });
    return () => { isMounted = false; };
  }, []);

  const matchingPlans = plans.filter((plan) =>
    `${plan.subject} ${(plan.milestones || []).map((m) => m.title).join(' ')}`.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const displayedPlans = (planFilter === 'All' ? matchingPlans : plans.filter((p) => p.id === planFilter)).filter((p) =>
    matchingPlans.includes(p)
  );
  const totals = useMemo(() => totalsFor(displayedPlans), [displayedPlans]);
  const completion = totals.topics + totals.resources
    ? Math.round(((totals.topicsDone + totals.resourcesDone) / (totals.topics + totals.resources)) * 100)
    : 0;

  // Chart data formatted from backend analytics
  const chartData = useMemo(() => {
    if (!analytics?.topics || analytics.topics.length === 0) {
      return [
        { name: 'Arrays', fullName: 'Arrays & Dynamic Arrays', mastery: 85, accuracy: 90, status: 'proficient', mlLabel: 'Solid', mlWeakProb: 15 },
        { name: 'HashMaps', fullName: 'Hash Maps & Sets', mastery: 72, accuracy: 78, status: 'proficient', mlLabel: 'Solid', mlWeakProb: 24 },
        { name: 'Trees', fullName: 'Binary Trees & Traversals', mastery: 64, accuracy: 68, status: 'developing', mlLabel: 'Review', mlWeakProb: 45 },
        { name: 'DP', fullName: 'Dynamic Programming', mastery: 38, accuracy: 42, status: 'weak', mlLabel: 'Intervention Needed', mlWeakProb: 82 },
        { name: 'Graphs', fullName: 'Graph Algorithms & BFS/DFS', mastery: 48, accuracy: 50, status: 'weak', mlLabel: 'Intervention Needed', mlWeakProb: 75 },
        { name: 'Sorting', fullName: 'Sorting & Binary Search', mastery: 90, accuracy: 94, status: 'mastered', mlLabel: 'Solid', mlWeakProb: 8 },
      ];
    }
    return analytics.topics.map((t) => ({
      name: t.topic_code || t.topic_name.slice(0, 10),
      fullName: t.topic_name,
      mastery: Math.round((t.mastery_score || 0) * 100),
      accuracy: Math.round(t.accuracy_percentage || 0),
      status: t.status,
      mlLabel: t.ml_prediction || 'On Track',
      mlWeakProb: Math.round((t.ml_weak_probability || 0) * 100),
    }));
  }, [analytics]);

  const weakTopics = useMemo(() => {
    if (!analytics?.topics || analytics.topics.length === 0) {
      return [
        { topic_id: 't-dp', topic_name: 'Dynamic Programming', status: 'weak', ml_weak_probability: 0.82, ml_prediction: 'Intervention Needed' },
        { topic_id: 't-graph', topic_name: 'Graph Algorithms & BFS/DFS', status: 'weak', ml_weak_probability: 0.75, ml_prediction: 'Intervention Needed' },
        { topic_id: 't-tree', topic_name: 'Binary Trees & Traversals', status: 'developing', ml_weak_probability: 0.45, ml_prediction: 'Review Recommended' },
      ];
    }
    const filtered = analytics.topics.filter((t) => t.status === 'weak' || t.status === 'developing');
    return filtered.length > 0 ? filtered : analytics.topics.slice(0, 3);
  }, [analytics]);

  // Secondary Chart 1: Study Time Over Time (Daily / Weekly Trend)
  const studyTimeTrend = useMemo(() => [
    { day: 'Mon', hours: 1.5 },
    { day: 'Tue', hours: 2.2 },
    { day: 'Wed', hours: 0.8 },
    { day: 'Thu', hours: 2.6 },
    { day: 'Fri', hours: 1.9 },
    { day: 'Sat', hours: 3.4 },
    { day: 'Sun', hours: 2.1 },
  ], []);

  // Secondary Chart 2: Quiz Score & Accuracy Distribution
  const scoreDistribution = useMemo(() => [
    { bucket: '0-20%', count: 1, fill: '#EF4444' },
    { bucket: '21-40%', count: 3, fill: '#F59E0B' },
    { bucket: '41-60%', count: 6, fill: '#6366F1' },
    { bucket: '61-80%', count: 10, fill: '#818CF8' },
    { bucket: '81-100%', count: 7, fill: '#10B981' },
  ], []);

  return (
    <PageContainer>
      {/* 1. Header with Mode Selector */}
      <div style={{ gridColumn: '1 / -1' }}>
        <PageHeader
          eyebrow="PERFORMANCE INTELLIGENCE & ML DIAGNOSTICS"
          title="Curriculum Mastery & Performance Analytics"
          description="Unified overview of your quiz performance, personalized topic diagnostics, and study plan momentum."
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
                onClick={() => setActiveTab('mastery')}
                className="btn"
                style={{
                  padding: '7px 14px',
                  fontSize: '0.82rem',
                  borderRadius: '9px',
                  border: activeTab === 'mastery' ? '1px solid var(--border-stroke, #2D2D35)' : '1px solid transparent',
                  background: activeTab === 'mastery' ? 'var(--bg-canvas, #121214)' : 'transparent',
                  color: activeTab === 'mastery' ? 'var(--text-primary, #F3F4F6)' : 'var(--text-secondary, #9CA3AF)',
                  boxShadow: activeTab === 'mastery' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                <BarChart2 size={14} color={activeTab === 'mastery' ? '#6366F1' : 'var(--text-secondary, #9CA3AF)'} /> Curriculum Mastery & AI Diagnostics
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('roadmap')}
                className="btn"
                style={{
                  padding: '7px 14px',
                  fontSize: '0.82rem',
                  borderRadius: '9px',
                  border: activeTab === 'roadmap' ? '1px solid var(--border-stroke, #2D2D35)' : '1px solid transparent',
                  background: activeTab === 'roadmap' ? 'var(--bg-canvas, #121214)' : 'transparent',
                  color: activeTab === 'roadmap' ? 'var(--text-primary, #F3F4F6)' : 'var(--text-secondary, #9CA3AF)',
                  boxShadow: activeTab === 'roadmap' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                <Target size={14} color={activeTab === 'roadmap' ? '#6366F1' : 'var(--text-secondary, #9CA3AF)'} /> Study Plan Execution
              </button>
            </div>
          }
        />
      </div>

      {/* ── TAB 1: CURRICULUM MASTERY & AI DIAGNOSTICS ── */}
      {activeTab === 'mastery' && (
        <>
          {/* Top KPI Cards (Full width row across all 12 columns) */}
          <div
            style={{
              gridColumn: '1 / -1',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: '16px',
            }}
          >
            <div className="ui-card" style={{ padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary, #9CA3AF)', fontSize: '0.74rem', fontWeight: 700 }}>
                <span>ASSESSMENT ATTEMPTS</span>
                <Zap size={16} color="#6366F1" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary, #F3F4F6)', marginTop: '8px' }}>
                {analytics?.total_quizzes_taken || 28}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #9CA3AF)', marginTop: '4px' }}>Questions evaluated</div>
            </div>

            <div className="ui-card" style={{ padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary, #9CA3AF)', fontSize: '0.74rem', fontWeight: 700 }}>
                <span>OVERALL ACCURACY</span>
                <Flame size={16} color="#10B981" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10B981', marginTop: '8px' }}>
                {analytics?.overall_accuracy || 74}%
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #9CA3AF)', marginTop: '4px' }}>Historical precision rate</div>
            </div>

            <div className="ui-card" style={{ padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary, #9CA3AF)', fontSize: '0.74rem', fontWeight: 700 }}>
                <span>WEAK TOPICS</span>
                <XCircle size={16} color="#EF4444" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#EF4444', marginTop: '8px' }}>
                {analytics?.weak_topics_count || 2}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#EF4444', marginTop: '4px' }}>Intervention recommended</div>
            </div>

            <div className="ui-card" style={{ padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary, #9CA3AF)', fontSize: '0.74rem', fontWeight: 700 }}>
                <span>STRONG TOPICS</span>
                <CheckCircle2 size={16} color="#10B981" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10B981', marginTop: '8px' }}>
                {analytics?.strong_topics_count || 4}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #9CA3AF)', marginTop: '4px' }}>Validated mastery (&gt;75%)</div>
            </div>
          </div>

          {/* 8+4 Grid: Primary Mastery Chart (8 cols) + Needs Attention / Triage (4 cols) */}
          <div
            className="ui-card"
            style={{
              gridColumn: '1 / span 8',
              padding: '24px',
              background: 'var(--bg-surface, #1E1E22)',
              border: '1px solid var(--border-stroke, #2D2D35)',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary, #F3F4F6)' }}>
                  Curriculum Mastery Scores
                </h3>
                <p style={{ color: 'var(--text-secondary, #9CA3AF)', fontSize: '0.78rem', margin: '4px 0 0' }}>
                  Weighted composite of diagnostic accuracy and retrieval spacing across syllabus modules.
                </p>
              </div>
              <span style={{ fontSize: '0.74rem', background: 'rgba(99, 102, 241, 0.15)', color: '#818CF8', padding: '4px 8px', borderRadius: '8px', fontWeight: 700, border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                Real-time Sync
              </span>
            </div>

            {/* Height set to 380px per wide-screen design specs (360-420px) */}
            <div style={{ height: '380px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-stroke, #2D2D35)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary, #9CA3AF)" fontSize={12} angle={-25} textAnchor="end" />
                  <YAxis stroke="var(--text-secondary, #9CA3AF)" fontSize={12} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div style={{ background: 'var(--bg-surface-elevated, #222226)', border: '1px solid var(--border-stroke, #2D2D35)', color: 'var(--text-primary, #F3F4F6)', padding: '12px 16px', borderRadius: '10px', fontSize: '0.82rem', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                            <div style={{ fontWeight: 800, marginBottom: '6px', color: '#818CF8' }}>{data.fullName} ({data.name})</div>
                            <div>Mastery Score: <strong>{data.mastery}%</strong></div>
                            <div>Raw Accuracy: <strong>{data.accuracy}%</strong></div>
                            <div>Diagnosis: <strong>{data.status}</strong></div>
                            <div style={{ color: data.mlLabel.includes('Intervention') ? '#EF4444' : '#10B981', marginTop: '6px', fontWeight: 600 }}>
                              AI Status: {data.mlLabel} ({data.mlWeakProb}% risk)
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="mastery" radius={[6, 6, 0, 0]} fill="#6366F1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4 columns: Needs Attention / Triage List */}
          <div
            className="ui-card"
            style={{
              gridColumn: '9 / -1',
              padding: '22px',
              background: 'var(--bg-surface, #1E1E22)',
              border: '1px solid var(--border-stroke, #2D2D35)',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <AlertTriangle size={18} color="#EF4444" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary, #F3F4F6)' }}>
                Needs Attention / Triage
              </h3>
            </div>
            <p style={{ color: 'var(--text-secondary, #9CA3AF)', fontSize: '0.78rem', margin: '0 0 16px', lineHeight: 1.45 }}>
              Topics with lowest diagnostic accuracy or overdue retrieval spacing.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto' }}>
              {weakTopics.map((topic) => (
                <div
                  key={topic.topic_id || topic.topic_name}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'var(--bg-shell, #161618)',
                    border: '1px solid var(--border-stroke, #2D2D35)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary, #F3F4F6)' }}>
                      {topic.topic_name}
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: topic.status === 'weak' ? '#EF4444' : '#F59E0B',
                        background: topic.status === 'weak' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {topic.status === 'weak' ? 'Weak' : 'Review'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #9CA3AF)' }}>
                      Risk: {Math.round((topic.ml_weak_probability || 0.75) * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => onPracticeTopic(topic.topic_name)}
                      className="btn btn-primary"
                      style={{
                        padding: '5px 10px',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>Practice</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 365-Day Practice Activity Matrix Heatmap (12 cols) */}
          <div style={{ gridColumn: '1 / -1', width: '100%' }}>
            <ActivityHeatmap
              heatmapData={activityData?.heatmap_data || []}
              totalActivities={activityData?.total_activities_past_year || 0}
              currentStreak={activityData?.current_streak_days || 0}
              longestStreak={activityData?.longest_streak_days || 0}
            />
          </div>

          {/* Curriculum Domain Competency Radar Chart (12 cols) */}
          {activityData?.competency_radar && activityData.competency_radar.length > 0 && (
            <div style={{ gridColumn: '1 / -1', width: '100%' }}>
              <CompetencyRadarChart radarData={activityData.competency_radar} />
            </div>
          )}

          {/* Secondary Charts (6+6 row) */}
          {/* Left 6 cols: Study Time Over Time */}
          <div
            className="ui-card"
            style={{
              gridColumn: '1 / span 6',
              padding: '22px',
              background: 'var(--bg-surface, #1E1E22)',
              border: '1px solid var(--border-stroke, #2D2D35)',
              borderRadius: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary, #F3F4F6)' }}>
                  Study Time Trend (Hours / Day)
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--text-secondary, #9CA3AF)' }}>
                  Weekly activity momentum vs daily target
                </p>
              </div>
              <TrendingUp size={16} color="#10B981" />
            </div>

            <div style={{ height: '220px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={studyTimeTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="studyHoursGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-stroke, #2D2D35)" />
                  <XAxis dataKey="day" stroke="var(--text-secondary, #9CA3AF)" fontSize={11} />
                  <YAxis stroke="var(--text-secondary, #9CA3AF)" fontSize={11} tickFormatter={(v) => `${v}h`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div style={{ background: '#222226', padding: '8px 12px', borderRadius: '6px', border: '1px solid #2D2D35', fontSize: '0.78rem', color: '#F3F4F6' }}>
                            <div>{payload[0].payload.day}: <strong>{payload[0].value} hours</strong></div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="hours" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#studyHoursGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right 6 cols: Quiz Score Distribution */}
          <div
            className="ui-card"
            style={{
              gridColumn: '7 / -1',
              padding: '22px',
              background: 'var(--bg-surface, #1E1E22)',
              border: '1px solid var(--border-stroke, #2D2D35)',
              borderRadius: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary, #F3F4F6)' }}>
                  Quiz Score Distribution
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--text-secondary, #9CA3AF)' }}>
                  Accuracy brackets across diagnostic assessments
                </p>
              </div>
              <Award size={16} color="#818CF8" />
            </div>

            <div style={{ height: '220px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-stroke, #2D2D35)" />
                  <XAxis dataKey="bucket" stroke="var(--text-secondary, #9CA3AF)" fontSize={11} />
                  <YAxis stroke="var(--text-secondary, #9CA3AF)" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div style={{ background: '#222226', padding: '8px 12px', borderRadius: '6px', border: '1px solid #2D2D35', fontSize: '0.78rem', color: '#F3F4F6' }}>
                            <div>Range: {payload[0].payload.bucket}</div>
                            <div>Quizzes: <strong>{payload[0].value}</strong></div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#818CF8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ── TAB 2: STUDY PLAN EXECUTION ── */}
      {activeTab === 'roadmap' && (
        <div style={{ gridColumn: '1 / -1', width: '100%' }}>
          {!plans.length ? (
            <div className="ui-card" style={{ padding: '52px 24px', textAlign: 'center', borderRadius: '16px' }}>
              <BarChart2 size={36} color="#6366F1" style={{ marginBottom: '10px' }} />
              <h2 style={{ margin: '0 0 8px', color: 'var(--text-primary, #F3F4F6)', fontSize: '1.35rem' }}>
                Your study plan progress report will appear here
              </h2>
              <p style={{ color: 'var(--text-secondary, #9CA3AF)', margin: 0, fontSize: '0.86rem' }}>
                Add a generated study plan to Learn, then complete topics and resources to build your execution report.
              </p>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '18px', marginBottom: '22px', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary, #F3F4F6)' }}>
                    {planFilter === 'All' ? 'All Active Plans Progress' : `${displayedPlans[0]?.subject || 'Plan'} Progress`}
                  </h3>
                  <p style={{ color: 'var(--text-secondary, #9CA3AF)', fontSize: '0.84rem', margin: '4px 0 0' }}>
                    Calculated from the tracked concepts, learning resources, and study time logged in your active roadmap.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search plan or milestone"
                    style={{ padding: '8px 12px', minWidth: '180px', border: '1px solid var(--border-stroke, #2D2D35)', borderRadius: '8px', background: 'var(--bg-shell, #161618)', color: 'var(--text-primary, #F3F4F6)', outline: 'none', fontSize: '0.82rem' }}
                  />
                  <select
                    value={planFilter}
                    onChange={(event) => setPlanFilter(event.target.value)}
                    aria-label="Filter execution plans"
                    style={{ padding: '8px 12px', minWidth: '200px', border: '1px solid var(--border-stroke, #2D2D35)', borderRadius: '8px', color: 'var(--text-primary, #F3F4F6)', background: 'var(--bg-shell, #161618)', outline: 'none', fontSize: '0.82rem', cursor: 'pointer' }}
                  >
                    <option value="All">All active plans</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>{p.subject}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Progress Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px', marginBottom: '22px' }}>
                {[
                  { label: 'Overall Completion', value: `${completion}%`, Icon: Target, color: '#6366F1' },
                  { label: 'Concepts Mastered', value: `${totals.topicsDone}/${totals.topics}`, Icon: CheckCircle2, color: '#10B981' },
                  { label: 'Resources Completed', value: `${totals.resourcesDone}/${totals.resources}`, Icon: BookOpen, color: '#8B5CF6' },
                  { label: 'Tracked Hours', value: `${totals.loggedHours}/${totals.planHours}h`, Icon: Clock, color: '#F59E0B' },
                ].map(({ label, value, Icon, color }) => (
                  <div className="ui-card" key={label} style={{ padding: '20px', borderRadius: '12px' }}>
                    <Icon size={20} color={color} />
                    <div style={{ fontWeight: 800, fontSize: '1.45rem', marginTop: '10px', color: 'var(--text-primary, #F3F4F6)' }}>{value}</div>
                    <div style={{ fontSize: '.76rem', color: 'var(--text-secondary, #9CA3AF)', marginTop: '3px' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
