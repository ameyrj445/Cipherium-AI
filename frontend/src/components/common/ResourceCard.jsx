import React from 'react';
import {
  ExternalLink, Clock, Play, FileText, Code2, BookOpen,
  CheckCircle2, Circle, Sparkles
} from 'lucide-react';

/**
 * Returns visual metadata and branding colors for verified educational platforms.
 */
function getSiteBranding(url = '') {
  const u = url.toLowerCase();
  const purpleStyle = {
    color: '#818CF8',
    bg: 'rgba(99, 102, 241, 0.12)',
    border: 'rgba(99, 102, 241, 0.25)',
  };

  if (u.includes('youtube.com') || u.includes('youtu.be')) {
    return { name: 'YouTube Video', ...purpleStyle };
  }
  if (u.includes('leetcode.com')) {
    return { name: 'LeetCode Problem', ...purpleStyle };
  }
  if (u.includes('neetcode.io')) {
    return { name: 'NeetCode Practice', ...purpleStyle };
  }
  if (u.includes('geeksforgeeks.org')) {
    return { name: 'GeeksForGeeks Guide', ...purpleStyle };
  }
  if (u.includes('takeuforward.org')) {
    return { name: 'takeUforward Striver', ...purpleStyle };
  }
  if (u.includes('programiz.com')) {
    return { name: 'Programiz Tutorial', ...purpleStyle };
  }
  return { name: 'Curated Resource', ...purpleStyle };
}

/**
 * Returns icon and label based on resource content type.
 */
function getTypeConfig(type = 'article') {
  const t = type.toLowerCase();
  if (t.includes('video')) return { icon: Play, label: 'Video Lecture' };
  if (t.includes('practice') || t.includes('exercise') || t.includes('challenge')) return { icon: Code2, label: 'Practice Task' };
  if (t.includes('cheat') || t.includes('summary')) return { icon: BookOpen, label: 'Cheatsheet' };
  return { icon: FileText, label: 'Article Guide' };
}

/**
 * Production-ready reusable card component for learning resources.
 */
export default function ResourceCard({
  resource,
  onToggleComplete = null,
  isCompleted = false,
  compact = false,
  showAiReason = true,
}) {
  if (!resource) return null;

  const site = getSiteBranding(resource.url);
  const typeConfig = getTypeConfig(resource.resource_type || resource.type);
  const TypeIcon = typeConfig.icon;
  const completed = isCompleted || !!resource.completed;

  // Contextual AI matching explanation
  const aiReason = resource.recommendation_reason ||
    (resource.isFromPlan
      ? `Part of your active ${resource.milestoneTitle || 'roadmap'} milestone.`
      : resource.topic_name
      ? `Targets your diagnosed gap in ${resource.topic_name}.`
      : 'Pedagogically ranked for your current learning stage.');

  const estimatedMins = resource.estimated_minutes || (resource.duration ? parseInt(resource.duration, 10) : 15) || 15;
  const rawDifficulty = resource.difficulty || (estimatedMins > 30 ? 'Hard' : estimatedMins > 15 ? 'Medium' : 'Easy');
  const diffLower = String(rawDifficulty).toLowerCase();
  const diffBadge = diffLower.includes('hard') || diffLower.includes('adv')
    ? { label: resource.difficulty || 'Hard', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' }
    : diffLower.includes('med') || diffLower.includes('inter')
    ? { label: resource.difficulty || 'Medium', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' }
    : { label: resource.difficulty || 'Easy', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' };

  return (
    <div
      className="ui-card"
      style={{
        padding: compact ? '16px' : '22px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: '14px',
        border: completed ? '1px solid rgba(16, 185, 129, 0.4)' : resource.isFromPlan ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-stroke, #2D2D35)',
        background: completed ? 'rgba(16, 185, 129, 0.04)' : 'var(--bg-surface, #1E1E22)',
        transition: 'border-color 0.2s ease, transform 0.2s ease',
        textAlign: 'left',
      }}
    >
      <div>
        {/* Top Badges Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                background: site.bg,
                color: site.color,
                border: `1px solid ${site.border}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <TypeIcon size={11} />
              {site.name}
            </span>

            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                background: diffBadge.bg,
                color: diffBadge.color,
                border: `1px solid ${diffBadge.border}`,
              }}
            >
              {diffBadge.label}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-secondary, #9CA3AF)' }}>
            <Clock size={12} />
            <span>{estimatedMins} min read</span>
          </div>
        </div>

        {/* AI Rationale Tag */}
        {showAiReason && (
          <div
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              color: '#c7d2fe',
              fontSize: '0.72rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
              marginBottom: '12px',
              lineHeight: 1.4,
            }}
          >
            <Sparkles size={12} style={{ flexShrink: 0, marginTop: '2px', color: '#818cf8' }} />
            <span>{aiReason}</span>
          </div>
        )}

        {/* Title (16px per spec) */}
        <h4
          style={{
            margin: '0 0 8px',
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--text-primary, #F3F4F6)',
            lineHeight: 1.35,
          }}
        >
          {resource.title}
        </h4>

        {/* Summary / Description (14px, 2-line clamp per spec) */}
        {resource.summary && (
          <p
            className="line-clamp-2"
            style={{
              margin: '0 0 14px',
              fontSize: '0.875rem',
              color: 'var(--text-secondary, #9CA3AF)',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {resource.summary}
          </p>
        )}
      </div>

      {/* Action Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-stroke, #2D2D35)',
          marginTop: '6px',
          gap: '8px',
        }}
      >
        {onToggleComplete ? (
          <button
            type="button"
            onClick={() => onToggleComplete(resource)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '4px 6px',
              color: completed ? '#10b981' : 'var(--text-tertiary, #6B7280)',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            {completed ? <CheckCircle2 size={14} color="#10b981" /> : <Circle size={14} color="var(--text-tertiary, #6B7280)" />}
            <span>{completed ? 'Completed' : 'Mark Done'}</span>
          </button>
        ) : (
          <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary, #6B7280)' }}>
            {typeConfig.label}
          </span>
        )}

        <a
          href={resource.url || '#'}
          target="_blank"
          rel="noreferrer"
          className="btn btn-primary"
          style={{
            fontSize: '0.74rem',
            padding: '6px 12px',
            borderRadius: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            textDecoration: 'none',
          }}
        >
          <span>Open Resource</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
