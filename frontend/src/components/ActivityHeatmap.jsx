import React, { useState } from 'react';
import { Flame, Trophy, Calendar, Zap, Activity } from 'lucide-react';

export default function ActivityHeatmap({ heatmapData = [], totalActivities = 0, currentStreak = 0, longestStreak = 0 }) {
  const [hoveredCell, setHoveredCell] = useState(null);

  // Group into 53 weeks (columns) of 7 days (rows)
  const weeks = [];
  let currentWeek = [];

  const safeData = Array.isArray(heatmapData) ? heatmapData : [];
  safeData.forEach((day, index) => {
    currentWeek.push(day || { level: 0, count: 0, date: '' });
    if (currentWeek.length === 7 || index === safeData.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const getCellColor = (level) => {
    switch (level) {
      case 1:
        return 'rgba(99, 102, 241, 0.35)';
      case 2:
        return 'rgba(99, 102, 241, 0.60)';
      case 3:
        return 'rgba(129, 140, 248, 0.85)';
      case 4:
        return '#818cf8';
      default:
        return 'rgba(255, 255, 255, 0.06)';
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      {/* Header and Telemetry */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="#818cf8" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Annual Practice Activity Matrix
            </h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: '4px 0 0' }}>
            {totalActivities} total diagnostic quizzes & pedagogical tutor inquiries logged over the past 365 days.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontSize: '0.78rem',
              color: '#f87171',
              fontWeight: 700,
            }}
          >
            <Flame size={15} color="#ef4444" />
            <span>Current Streak: <strong>{currentStreak} days</strong></span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              fontSize: '0.78rem',
              color: '#fbbf24',
              fontWeight: 700,
            }}
          >
            <Trophy size={15} color="#f59e0b" />
            <span>Best Streak: <strong>{longestStreak} days</strong></span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid Canvas */}
      <div style={{ overflowX: 'auto', paddingBottom: '6px' }}>
        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', gap: '3px' }}>
            {weeks.map((week, wIdx) => (
              <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {week.map((day, dIdx) => (
                  <div
                    key={dIdx}
                    onMouseEnter={() => setHoveredCell(day)}
                    onMouseLeave={() => setHoveredCell(null)}
                    style={{
                      width: '11px',
                      height: '11px',
                      borderRadius: '2px',
                      backgroundColor: getCellColor(day?.level ?? 0),
                      cursor: 'pointer',
                      transition: 'transform 0.1s ease',
                      border: (day?.count ?? 0) > 0 ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid transparent',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hover Info & Legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', fontSize: '0.74rem', color: 'var(--text-dim)', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          {hoveredCell ? (
            <span style={{ color: '#fff', fontWeight: 600 }}>
              {(hoveredCell.count ?? 0)} practice activit{(hoveredCell.count ?? 0) === 1 ? 'y' : 'ies'} on {hoveredCell.date || 'selected date'}
            </span>
          ) : (
            <span>Hover over any day square to inspect daily practice velocity</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((lvl) => (
            <div
              key={lvl}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '2px',
                backgroundColor: getCellColor(lvl),
              }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
