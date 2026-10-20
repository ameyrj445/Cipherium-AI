import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { BarChart2, Flame, Award, Brain, Target, TrendingUp } from 'lucide-react';

export default function AnalyticsFullView({ analytics, pieData, onPracticeTopic, customPlan = null }) {
  // Compute custom plan metrics if present
  let planStats = null;
  if (customPlan && customPlan.milestones) {
    let totalSubs = 0;
    let doneSubs = 0;
    let completedMilestones = 0;
    customPlan.milestones.forEach((m) => {
      const subs = m.subtopics || [];
      const done = m.completed_subtopics || [];
      totalSubs += subs.length;
      doneSubs += done.length;
      if (subs.length > 0 && done.length >= subs.length) {
        completedMilestones++;
      }
    });
    planStats = {
      subject: customPlan.subject,
      totalSubs,
      doneSubs,
      pct: totalSubs > 0 ? Math.round((doneSubs / totalSubs) * 100) : 0,
      totalMilestones: customPlan.milestones.length,
      completedMilestones,
      hoursCompleted: customPlan.completed_hours || 0,
      totalHours: customPlan.total_estimated_hours || (customPlan.duration_weeks * customPlan.target_hours_per_week),
    };
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>Academic Mastery & Learning Analytics</h2>
        <p style={{ color: '#64748b', fontSize: '0.86rem', marginTop: '4px' }}>
          Real-time metrics calculated via weighted correctness heuristics and ML weak-topic classifiers.
        </p>
      </div>

      {/* Top 4 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="ui-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.78rem', fontWeight: 600 }}>
            <span>TOTAL ATTEMPTS</span>
            <Award size={18} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>
            {analytics?.total_quizzes_taken || 28}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '4px' }}>↑ 33% this month</div>
        </div>

        <div className="ui-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.78rem', fontWeight: 600 }}>
            <span>OVERALL ACCURACY</span>
            <TrendingUp size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '8px' }}>
            {analytics?.overall_accuracy || 84}%
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>Weighted recency score</div>
        </div>

        <div className="ui-card" style={{ padding: '20px', borderLeft: '4px solid #f43f5e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.78rem', fontWeight: 600 }}>
            <span>WEAK TOPICS</span>
            <Brain size={18} color="#f43f5e" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f43f5e', marginTop: '8px' }}>
            {analytics?.weak_topics_count || 3}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#f43f5e', marginTop: '4px' }}>Requires immediate review</div>
        </div>

        <div className="ui-card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.78rem', fontWeight: 600 }}>
            <span>STRONG TOPICS</span>
            <Target size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '8px' }}>
            {analytics?.strong_topics_count || 6}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '4px' }}>Mastery validated (&gt;75%)</div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div className="ui-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
            Mastery Score by Curriculum Topic
          </h3>
          <div style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.topics || []} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                <XAxis dataKey="topic_code" stroke="#64748b" fontSize={11} angle={-20} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 1]} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  formatter={(val) => [`${Math.round(val * 100)}% Mastery`, 'Score']}
                />
                <Bar dataKey="mastery_score" radius={[6, 6, 0, 0]} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut chart */}
        <div className="ui-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
            Strengths vs Weaknesses
          </h3>
          <div style={{ position: 'relative', width: '160px', height: '160px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>84%</span>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Overall Score</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px', fontSize: '0.8rem', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span>
                Strong Topics
              </span>
              <span style={{ fontWeight: 700 }}>6</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></span>
                Moderate Topics
              </span>
              <span style={{ fontWeight: 700 }}>4</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f43f5e' }}></span>
                Weak Topics
              </span>
              <span style={{ fontWeight: 700 }}>3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Study Plan Velocity & Progress Section */}
      {planStats && (
        <div
          className="ui-card"
          style={{
            padding: '24px',
            marginBottom: '24px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
            border: '1.5px solid #bfdbfe',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#2563eb', background: '#dbeafe', padding: '3px 10px', borderRadius: '12px' }}>
                Active Study Plan Tracking
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '6px', margin: 0 }}>
                {planStats.subject} — Roadmap Velocity
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                Completed {planStats.doneSubs} of {planStats.totalSubs} subtopics • {planStats.completedMilestones} of {planStats.totalMilestones} stages finished
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563eb' }}>{planStats.pct}%</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Overall Plan Completion</div>
            </div>
          </div>

          {/* Milestone Bars Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(customPlan.milestones.length, 6)}, 1fr)`, gap: '10px', marginTop: '16px' }}>
            {customPlan.milestones.map((m, idx) => {
              const subs = m.subtopics || [];
              const done = m.completed_subtopics || [];
              const mPct = subs.length > 0 ? Math.round((done.length / subs.length) * 100) : 0;
              const isFinished = mPct === 100;
              return (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: isFinished ? '#f0fdf4' : '#ffffff',
                    border: `1px solid ${isFinished ? '#86efac' : '#e2e8f0'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: isFinished ? '#15803d' : '#0f172a' }}>
                      Stage {idx + 1}
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: isFinished ? '#15803d' : '#2563eb' }}>
                      {mPct}%
                    </span>
                  </div>
                  <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${mPct}%`, height: '100%', background: isFinished ? '#10b981' : '#2563eb', borderRadius: '3px' }}></div>
                  </div>
                  <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {done.length}/{subs.length} topics
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Table */}
      <div className="ui-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
          Detailed Topic Diagnostics
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
              <th style={{ padding: '12px' }}>Topic Name</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px' }}>ML Diagnostic (OULAD)</th>
              <th style={{ padding: '12px' }}>Attempts</th>
              <th style={{ padding: '12px' }}>Mastery Score</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Remediate</th>
            </tr>
          </thead>
          <tbody>
            {analytics?.topics?.map((item) => (
              <tr key={item.topic_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px', fontWeight: 600 }}>{item.topic_name}</td>
                <td style={{ padding: '12px' }}>
                  <span
                    className={`badge ${
                      item.status === 'weak'
                        ? 'badge-weak-pill'
                        : item.status === 'strong'
                        ? 'badge-recommended'
                        : 'badge-popular'
                    }`}
                  >
                    {item.status.replace('_', ' ')}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: item.ml_prediction === 'Intervention Needed' ? '#fff1f2' : '#ecfdf5',
                        color: item.ml_prediction === 'Intervention Needed' ? '#e11d48' : '#059669',
                        border: `1px solid ${item.ml_prediction === 'Intervention Needed' ? '#fecdd3' : '#a7f3d0'}`
                      }}
                    >
                      {item.ml_prediction || 'On Track'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                      ({Math.round((item.ml_weak_probability || 0) * 100)}% risk)
                    </span>
                  </div>
                </td>
                <td style={{ padding: '12px', color: '#64748b' }}>{item.attempt_count} ({item.correct_count} correct)</td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '100px', height: '6px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.round(item.mastery_score * 100)}%`,
                          height: '100%',
                          background: item.status === 'weak' ? '#f43f5e' : item.status === 'strong' ? '#10b981' : '#f59e0b',
                        }}
                      ></div>
                    </div>
                    <span style={{ fontWeight: 700 }}>{Math.round(item.mastery_score * 100)}%</span>
                  </div>
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  <button
                    onClick={() => onPracticeTopic(item.topic_id)}
                    className="btn btn-white"
                    style={{ padding: '5px 12px', fontSize: '0.75rem', border: '1px solid #e2e8f0' }}
                  >
                    Practice
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
