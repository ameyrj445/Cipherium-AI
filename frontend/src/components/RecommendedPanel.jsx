import React from 'react';
import SectionHeader from './common/SectionHeader';
import ResourceCard from './common/ResourceCard';

/**
 * Row 4 Right (4 cols equivalent): Recommended resources panel.
 * Shows a maximum of 3 curated items with a subtle "View all →" link.
 */
export default function RecommendedPanel({
  customPlan = null,
  activeResourceFilter = 'All',
  setActiveResourceFilter,
  onOpenResources,
}) {
  let dynamicCards = [];
  if (customPlan && customPlan.milestones) {
    customPlan.milestones.forEach((m, mIdx) => {
      (m.resources || []).forEach((r, rIdx) => {
        dynamicCards.push({
          id: r.id || `res-${mIdx}-${rIdx}`,
          title: r.title,
          summary: r.summary || m.title,
          url: r.url,
          estimated_minutes: r.estimated_minutes || 20,
          resource_type: r.resource_type || 'article',
          recommendation_reason: `Recommended for ${m.title}`,
          isFromPlan: true,
          milestoneTitle: m.title,
          completed: r.completed,
        });
      });
    });
  }

  const defaultCards = [
    {
      id: 1,
      title: 'Binary Search Edge Cases & Patterns',
      summary: 'Essential boundary conditions and index pointers.',
      url: 'https://neetcode.io/practice',
      estimated_minutes: 15,
      resource_type: 'video',
      difficulty: 'Medium',
    },
    {
      id: 2,
      title: 'Graph Traversal: BFS vs DFS Intuition',
      summary: 'Cycle detection, adjacency lists, and traversal drills.',
      url: 'https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/',
      estimated_minutes: 20,
      resource_type: 'article',
      difficulty: 'Medium',
    },
    {
      id: 3,
      title: 'Dynamic Programming Patterns',
      summary: 'Memoization vs tabulation step-by-step breakdown.',
      url: 'https://takeuforward.org/dynamic-programming/',
      estimated_minutes: 30,
      resource_type: 'article',
      difficulty: 'Hard',
    },
  ];

  const allCards = dynamicCards.length > 0 ? dynamicCards : defaultCards;

  const filteredCards = activeResourceFilter === 'All'
    ? allCards
    : allCards.filter((c) => {
        const type = (c.resource_type || '').toLowerCase();
        if (activeResourceFilter === 'Videos') return type.includes('video');
        if (activeResourceFilter === 'Practice') return type.includes('practice') || type.includes('challenge');
        if (activeResourceFilter === 'Articles') return type.includes('article');
        return true;
      });

  // Strict maximum of 3 items per design rules
  const displayCards = (filteredCards.length > 0 ? filteredCards : allCards).slice(0, 3);

  return (
    <div>
      <SectionHeader
        title={customPlan ? `Curated for ${customPlan.subject}` : 'Recommended for You'}
        actionLabel="View all →"
        onAction={onOpenResources}
      />

      <div
        className="ui-card"
        style={{
          padding: '20px',
          borderRadius: '12px',
          background: 'var(--bg-surface, #1E1E22)',
          border: '1px solid var(--border-stroke, #2D2D35)',
        }}
      >
        {/* Subtle Category Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '16px' }}>
          {['All', 'Videos', 'Articles', 'Practice'].map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => setActiveResourceFilter && setActiveResourceFilter(pill)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: activeResourceFilter === pill ? '#6366F1' : 'var(--border-stroke, #2D2D35)',
                background: activeResourceFilter === pill ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-shell, #161618)',
                color: activeResourceFilter === pill ? '#818CF8' : 'var(--text-secondary, #9CA3AF)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {pill}
            </button>
          ))}
        </div>

        {/* Max 3 Compact Resource Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {displayCards.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              compact
              showAiReason={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
