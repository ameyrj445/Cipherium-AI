import React from 'react';
import { Play, Bookmark, ExternalLink, Code2, BookOpen, FileText } from 'lucide-react';

export default function RecommendedPanel({
  customPlan = null,
  activeResourceFilter = 'All',
  setActiveResourceFilter,
  onOpenResources,
}) {
  // Extract resources from customPlan if available
  let dynamicCards = [];
  if (customPlan && customPlan.milestones) {
    customPlan.milestones.forEach((m, mIdx) => {
      (m.resources || []).forEach((r, rIdx) => {
        let tag = 'Roadmap Resource';
        let tagType = 'badge-recommended';
        if (r.resource_type === 'practice') {
          tag = 'Practice Task';
          tagType = 'badge-popular';
        } else if (r.resource_type === 'video') {
          tag = 'Video Lecture';
          tagType = 'badge-weak-pill';
        }

        // Color coding
        let thumbColor = '#1e293b';
        if (r.url && r.url.includes('youtube')) thumbColor = '#991b1b';
        else if (r.url && r.url.includes('leetcode')) thumbColor = '#b45309';
        else if (r.url && r.url.includes('geeksforgeeks')) thumbColor = '#15803d';
        else if (r.url && r.url.includes('neetcode')) thumbColor = '#1d4ed8';

        dynamicCards.push({
          id: r.id || `res-${mIdx}-${rIdx}`,
          title: r.title,
          author: r.summary || m.title,
          url: r.url,
          duration: `${r.estimated_minutes || 20} min • ${r.resource_type || 'Article'}`,
          tag,
          tagType,
          thumbnailColor: thumbColor,
          type: r.resource_type || 'article',
        });
      });
    });
  }

  const defaultCards = [
    {
      id: 1,
      title: 'Binary Search Explained Visually',
      author: 'NeetCode',
      url: 'https://neetcode.io/practice',
      duration: '12 min • Video',
      tag: 'Recommended',
      tagType: 'badge-recommended',
      thumbnailColor: '#1e293b',
      type: 'video',
    },
    {
      id: 2,
      title: 'Tree Data Structure - Full Course',
      author: 'freeCodeCamp',
      url: 'https://www.freecodecamp.org/news/',
      duration: '1 hr 20 min • Video',
      tag: 'Most Relevant',
      tagType: 'badge-popular',
      thumbnailColor: '#312e81',
      type: 'video',
    },
    {
      id: 3,
      title: 'Graphs in 20 Minutes',
      author: 'Abdul Bari',
      url: 'https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/',
      duration: '20 min • Video',
      tag: 'Based on Weak Topic',
      tagType: 'badge-weak-pill',
      thumbnailColor: '#14532d',
      type: 'video',
    },
    {
      id: 4,
      title: 'Dynamic Programming - Basics',
      author: 'takeUforward',
      url: 'https://takeuforward.org/dynamic-programming/',
      duration: '45 min • Video',
      tag: 'Popular',
      tagType: 'badge-popular',
      thumbnailColor: '#0369a1',
      type: 'article',
    },
  ];

  const allCards = dynamicCards.length > 0 ? dynamicCards.slice(0, 5) : defaultCards;

  const filteredCards = activeResourceFilter === 'All'
    ? allCards
    : allCards.filter(c => {
        if (activeResourceFilter === 'Videos') return c.type === 'video';
        if (activeResourceFilter === 'Practice Questions') return c.type === 'practice';
        if (activeResourceFilter === 'Articles') return c.type === 'article';
        if (activeResourceFilter === 'Notes') return c.type === 'cheatsheet' || c.type === 'article';
        return true;
      });

  return (
    <div className="ui-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            {customPlan ? `Curated for ${customPlan.subject}` : 'Recommended for You'}
          </h3>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
            {customPlan ? 'Top internet resources from your roadmap' : 'AI-curated resources based on your performance'}
          </div>
        </div>
        {onOpenResources && (
          <button
            onClick={onOpenResources}
            style={{ border: 'none', background: 'transparent', color: '#2563eb', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
          >
            View All →
          </button>
        )}
      </div>

      {/* Filter Pills */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '14px', paddingBottom: '4px' }}>
        {['All', 'Videos', 'Practice Questions', 'Articles'].map((pill) => (
          <button
            key={pill}
            onClick={() => setActiveResourceFilter && setActiveResourceFilter(pill)}
            style={{
              padding: '4px 10px',
              borderRadius: '16px',
              border: 'none',
              background: activeResourceFilter === pill ? '#2563eb' : '#f1f5f9',
              color: activeResourceFilter === pill ? '#fff' : '#64748b',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {pill}
          </button>
        ))}
      </div>

      {/* Resource Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {(filteredCards.length > 0 ? filteredCards : allCards).map((r) => (
          <a
            key={r.id}
            href={r.url || '#'}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 10px',
              borderRadius: '10px',
              border: '1px solid #f1f5f9',
              background: '#fff',
              textDecoration: 'none',
              transition: 'border-color 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#93c5fd'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#f1f5f9'}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                background: r.thumbnailColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {r.type === 'practice' ? (
                <Code2 size={18} color="#fff" />
              ) : r.type === 'video' ? (
                <Play size={18} color="#fff" fill="#fff" />
              ) : (
                <BookOpen size={18} color="#fff" />
              )}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                {r.title}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {r.author}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>{r.duration}</span>
                <span className={`badge ${r.tagType}`} style={{ fontSize: '0.6rem', padding: '1px 5px' }}>
                  {r.tag}
                </span>
              </div>
            </div>
            <ExternalLink size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
          </a>
        ))}
      </div>
    </div>
  );
}
