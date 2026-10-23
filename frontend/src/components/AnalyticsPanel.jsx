import React from 'react';
import { BarChart2, Clock, BookOpen, Flame } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AnalyticsPanel({ analyticsPeriod, setAnalyticsPeriod, dashboardData }) {
  const data = dashboardData || { completion: 0, topicsDone: 0, totalTopics: 0, resourcesDone: 0, totalResources: 0, studyHours: 0, topicsData: [], pieData: [] };
  const topicsData = data.topicsData || [];
  const pieData = data.pieData || [];

  return (
    <div className="ui-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>Analytics</h3>
          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Track your progress and identify areas to improve</div>
        </div>
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '2px' }}>
          {['Week', 'Month', 'Year'].map((p) => (
            <button
              key={p}
              onClick={() => setAnalyticsPeriod(p)}
              style={{
                padding: '4px 8px',
                border: 'none',
                borderRadius: '6px',
                background: analyticsPeriod === p ? '#fff' : 'transparent',
                color: analyticsPeriod === p ? '#0f172a' : '#64748b',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Mini Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '18px' }}>
        <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '0.7rem' }}>
            <BarChart2 size={12} />
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{data.completion}%</div>
          <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Plan Progress</div>
        </div>

        <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#3b82f6', fontSize: '0.7rem' }}>
            <Clock size={12} />
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{data.studyHours} hrs</div>
          <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Logged Study Time</div>
        </div>

        <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#8b5cf6', fontSize: '0.7rem' }}>
            <BookOpen size={12} />
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{data.topicsDone}/{data.totalTopics}</div>
          <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Topics Completed</div>
        </div>

        <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontSize: '0.7rem' }}>
            <Flame size={12} />
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{data.resourcesDone}/{data.totalResources}</div>
          <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Resources Completed</div>
        </div>
      </div>

      {/* Topic-wise Performance vs Strengths Pie */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: '10px' }}>Topic-wise Performance</div>
          {topicsData.map((t) => (
            <div key={t.topic} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748b', marginBottom: '3px' }}>
                <span>{t.topic}</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{t.pct}%</span>
              </div>
              <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${t.pct}%`, height: '100%', background: t.color, borderRadius: '4px' }}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Donut Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>Strengths vs Weaknesses</div>
          <div style={{ position: 'relative', width: '110px', height: '110px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={35} outerRadius={50} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '1rem', fontWeight: 800 }}>{data.completion}%</span>
              <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>Plan</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '8px', fontSize: '0.68rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
              <span>Completed stages ({pieData[0]?.value || 0})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
              <span>Started stages ({pieData[1]?.value || 0})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e' }}></span>
              <span>Not started stages ({pieData[2]?.value || 0})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
