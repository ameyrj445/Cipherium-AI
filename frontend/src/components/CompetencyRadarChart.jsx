import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Compass } from 'lucide-react';

export default function CompetencyRadarChart({ radarData = [] }) {
  if (!Array.isArray(radarData) || radarData.length === 0) return null;

  const sanitizedData = radarData
    .filter(Boolean)
    .map((item) => ({
      category: item.category || 'General',
      score: typeof item.score === 'number' && !isNaN(item.score)
        ? Math.max(0, Math.min(100, Math.round(item.score)))
        : 0,
      ...item,
    }));

  if (sanitizedData.length === 0) return null;

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <Compass size={18} color="#818cf8" />
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0 }}>
          Curriculum Domain Competency Radar
        </h3>
      </div>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: '0 0 16px' }}>
        Multi-dimensional mastery synthesis across foundational computer science and systems domains.
      </p>

      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={sanitizedData}>
            <PolarGrid stroke="rgba(255, 255, 255, 0.12)" />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fill: '#c7d2fe', fontSize: 11, fontWeight: 600 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: '#64748b', fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: '#fff',
              }}
              formatter={(value) => [`${value}% Mastery`, 'Score']}
            />
            <Radar
              name="Mastery Score"
              dataKey="score"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.45}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
