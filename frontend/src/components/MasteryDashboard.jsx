import React from 'react';
import { Award, Flame, XCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export default function MasteryDashboard({
  analytics,
  onStartQuiz,
  onViewRoadmap,
}) {
  return (
    <div>
      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>TOTAL ATTEMPTS</span>
            <Award size={16} color="#6366f1" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '8px' }}>
            {analytics?.total_quizzes_taken || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>Questions evaluated</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>OVERALL ACCURACY</span>
            <Flame size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '8px' }}>
            {analytics?.overall_accuracy || 0}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>Historical precision rate</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #f43f5e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>WEAK TOPICS</span>
            <XCircle size={16} color="#f43f5e" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fb7185', marginTop: '8px' }}>
            {analytics?.weak_topics_count || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#fb7185', marginTop: '4px' }}>Needs immediate intervention</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>STRONG TOPICS</span>
            <CheckCircle size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399', marginTop: '8px' }}>
            {analytics?.strong_topics_count || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '4px' }}>Validated mastery (&gt;75%)</div>
        </div>
      </div>

      {/* Visual Charts & Mastery Graph */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
            Curriculum Mastery Scores (Weighted Formulation)
          </h3>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.topics || []} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                <XAxis dataKey="topic_code" stroke="#64748b" fontSize={11} angle={-25} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 1]} />
                <Tooltip
                  contentStyle={{ background: '#0f1623', border: '1px solid var(--border-accent)', borderRadius: '8px' }}
                  formatter={(val) => [`${Math.round(val * 100)}% Mastery`, 'Score']}
                />
                <Bar dataKey="mastery_score" radius={[6, 6, 0, 0]} fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '8px' }}>
            Calculated via <code>M = 0.7 × accuracy + 0.3 × recency_score</code>
          </div>
        </div>

        {/* Weak Topic Quick Remediation Trigger */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
              Weak-Topic Remediation
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Topics diagnosed below 50% accuracy or requiring reinforcement based on practice tests.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {analytics?.topics?.filter((t) => t.status === 'weak' || t.status === 'developing').slice(0, 3).map((item) => (
                <div
                  key={item.topic_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{item.topic_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {item.attempt_count} attempts • {item.accuracy_percentage}% acc
                    </div>
                  </div>
                  <button
                    onClick={() => onStartQuiz(item.topic_id)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                  >
                    Practice
                  </button>
                </div>
              ))}
              {(!analytics?.topics ||
                analytics.topics.filter((t) => t.status === 'weak' || t.status === 'developing').length === 0) && (
                <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
                  No weak areas diagnosed yet! Take diagnostic quizzes to populate your analytics.
                </div>
              )}
            </div>
          </div>

          <button onClick={onViewRoadmap} className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
            View Tailored Study Plan <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Comprehensive Topic Mastery Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
          Full Topic Mastery Breakdown
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px' }}>Topic Name</th>
                <th style={{ padding: '12px' }}>Category</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Attempts</th>
                <th style={{ padding: '12px' }}>Mastery Score</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {analytics?.topics?.map((item) => (
                <tr key={item.topic_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: '#fff' }}>{item.topic_name}</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{item.category}</td>
                  <td style={{ padding: '12px' }}>
                    <span className={`badge badge-${item.status}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                    {item.attempt_count} ({item.correct_count} correct)
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          flex: 1,
                          height: '6px',
                          background: 'rgba(255,255,255,0.06)',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          minWidth: '80px',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.round(item.mastery_score * 100)}%`,
                            height: '100%',
                            background:
                              item.status === 'weak' ? '#fb7185' : item.status === 'developing' ? '#fbbf24' : '#34d399',
                          }}
                        ></div>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>
                        {Math.round(item.mastery_score * 100)}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button
                      onClick={() => onStartQuiz(item.topic_id)}
                      className="btn btn-secondary"
                      style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                    >
                      Quiz
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
