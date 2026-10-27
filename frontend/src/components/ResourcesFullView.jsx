import React, { useState, useMemo } from 'react';
import { Search, BookOpen, X } from 'lucide-react';
import ResourceCard from './common/ResourceCard';
import PageContainer from './layout/PageContainer';
import PageHeader from './layout/PageHeader';
import FilterSidebar from './layout/FilterSidebar';
import EmptyState from './layout/EmptyState';

/**
 * Production-ready curated educational library view.
 * Uses PageContainer, 220px sticky FilterSidebar, search bar with count indicator,
 * and a responsive repeat(auto-fill, minmax(300px, 1fr)) card grid.
 */
export default function ResourcesFullView({ recommendations = [], customPlan = null }) {
  const [selectedFilters, setSelectedFilters] = useState({
    type: 'All',
    difficulty: 'All',
    topics: [],
    duration: 'All',
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Extract resources from customPlan
  const planResources = useMemo(() => {
    if (!customPlan?.milestones) return [];
    const extracted = [];
    customPlan.milestones.forEach((m) => {
      (m.resources || []).forEach((r) => {
        extracted.push({
          id: r.id,
          title: r.title,
          url: r.url,
          resource_type: r.resource_type || 'article',
          estimated_minutes: r.estimated_minutes || 20,
          summary: r.summary || `Curated for stage: ${m.title}`,
          topic_name: customPlan.subject,
          recommendation_reason: `Directly reinforces Stage "${m.title}" in your active study plan.`,
          isFromPlan: true,
          milestoneTitle: m.title,
          completed: r.completed,
          difficulty: r.difficulty || 'Intermediate',
        });
      });
    });
    return extracted;
  }, [customPlan]);

  // Combine plan resources (ranked highest) with diagnostic recommendations
  const allResources = useMemo(() => {
    const diagnosticList = recommendations.map((r) => ({
      ...r,
      isFromPlan: false,
      recommendation_reason: r.recommendation_reason ||
        (r.topic_name ? `Recommended because recent diagnostic questions identified gaps in ${r.topic_name}.` : 'Curated for your current skill level.'),
      difficulty: r.difficulty || ((r.estimated_minutes || 15) > 30 ? 'Advanced' : (r.estimated_minutes || 15) > 15 ? 'Intermediate' : 'Beginner'),
    }));
    return [...planResources, ...diagnosticList];
  }, [planResources, recommendations]);

  // Dynamically extract unique topics
  const uniqueTopics = useMemo(() => {
    const set = new Set();
    allResources.forEach((r) => {
      if (r.topic_name) set.add(r.topic_name);
    });
    return Array.from(set).sort();
  }, [allResources]);

  // Build filter sidebar groups configuration
  const filterGroups = useMemo(() => {
    const groups = [
      {
        id: 'type',
        label: 'Type',
        multiSelect: false,
        options: [
          { id: 'All', label: 'All Types', count: allResources.length },
          ...(customPlan ? [{ id: 'My Plan', label: 'Roadmap Only', count: planResources.length }] : []),
          {
            id: 'video',
            label: 'Videos',
            count: allResources.filter((r) => (r.resource_type || r.type || '').toLowerCase().includes('video')).length,
          },
          {
            id: 'article',
            label: 'Articles',
            count: allResources.filter((r) => {
              const t = (r.resource_type || r.type || '').toLowerCase();
              return t.includes('article') || (!t.includes('video') && !t.includes('practice') && !t.includes('cheat'));
            }).length,
          },
          {
            id: 'Practice',
            label: 'Practice Tasks',
            count: allResources.filter((r) => {
              const t = (r.resource_type || r.type || '').toLowerCase();
              return t.includes('practice') || t.includes('exercise') || t.includes('challenge');
            }).length,
          },
          {
            id: 'cheatsheet',
            label: 'Cheatsheets',
            count: allResources.filter((r) => (r.resource_type || r.type || '').toLowerCase().includes('cheat')).length,
          },
        ],
      },
      {
        id: 'difficulty',
        label: 'Difficulty',
        multiSelect: false,
        options: [
          { id: 'All', label: 'All Levels' },
          { id: 'Beginner', label: 'Beginner' },
          { id: 'Intermediate', label: 'Intermediate' },
          { id: 'Advanced', label: 'Advanced' },
        ],
      },
      {
        id: 'duration',
        label: 'Duration',
        multiSelect: false,
        options: [
          { id: 'All', label: 'Any Duration' },
          { id: '<15m', label: '< 15 mins' },
          { id: '15-30m', label: '15 - 30 mins' },
          { id: '30m+', label: '30+ mins' },
        ],
      },
    ];

    if (uniqueTopics.length > 0) {
      groups.push({
        id: 'topics',
        label: 'Topics',
        multiSelect: true,
        options: uniqueTopics.map((top) => ({
          id: top,
          label: top,
          count: allResources.filter((r) => r.topic_name === top).length,
        })),
      });
    }

    return groups;
  }, [allResources, planResources, customPlan, uniqueTopics]);

  const handleSelectOption = (groupId, optionId, isMulti) => {
    setSelectedFilters((prev) => {
      if (isMulti) {
        const currentArr = Array.isArray(prev[groupId]) ? prev[groupId] : [];
        const exists = currentArr.includes(optionId);
        return {
          ...prev,
          [groupId]: exists ? currentArr.filter((id) => id !== optionId) : [...currentArr, optionId],
        };
      }
      return {
        ...prev,
        [groupId]: optionId,
      };
    });
  };

  const handleClearAll = () => {
    setSelectedFilters({
      type: 'All',
      difficulty: 'All',
      topics: [],
      duration: 'All',
    });
    setSearchQuery('');
  };

  // Perform full multi-faceted filtering
  const filtered = useMemo(() => {
    return allResources.filter((r) => {
      // 1. Type
      if (selectedFilters.type === 'My Plan' && !r.isFromPlan) return false;
      if (selectedFilters.type === 'Practice') {
        const t = (r.resource_type || r.type || '').toLowerCase();
        if (!t.includes('practice') && !t.includes('exercise') && !t.includes('challenge')) return false;
      } else if (selectedFilters.type !== 'All' && selectedFilters.type !== 'My Plan') {
        const t = (r.resource_type || r.type || '').toLowerCase();
        if (!t.includes(selectedFilters.type.toLowerCase())) return false;
      }

      // 2. Difficulty
      if (selectedFilters.difficulty !== 'All') {
        const diff = (r.difficulty || '').toLowerCase();
        const sel = selectedFilters.difficulty.toLowerCase();
        if (sel === 'beginner' && !diff.includes('begin') && !diff.includes('easy')) return false;
        if (sel === 'intermediate' && !diff.includes('inter') && !diff.includes('med')) return false;
        if (sel === 'advanced' && !diff.includes('adv') && !diff.includes('hard')) return false;
      }

      // 3. Duration
      const mins = r.estimated_minutes || 15;
      if (selectedFilters.duration === '<15m' && mins >= 15) return false;
      if (selectedFilters.duration === '15-30m' && (mins < 15 || mins > 30)) return false;
      if (selectedFilters.duration === '30m+' && mins <= 30) return false;

      // 4. Topic multi-select
      if (selectedFilters.topics.length > 0) {
        if (!r.topic_name || !selectedFilters.topics.includes(r.topic_name)) return false;
      }

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const searchable = `${r.title} ${r.summary || ''} ${r.topic_name || ''} ${r.milestoneTitle || ''}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }

      return true;
    });
  }, [allResources, selectedFilters, searchQuery]);

  const hasActiveFilters =
    selectedFilters.type !== 'All' ||
    selectedFilters.difficulty !== 'All' ||
    selectedFilters.duration !== 'All' ||
    selectedFilters.topics.length > 0 ||
    searchQuery.trim().length > 0;

  return (
    <PageContainer noGrid>
      {/* Page Header */}
      <PageHeader
        eyebrow="CURATED LEARNING REPOSITORY"
        title="Curated Learning & Practice Library"
        description={
          customPlan
            ? `Displaying verified resources from your "${customPlan.subject}" roadmap and diagnostic recommendations.`
            : 'Ranked by pedagogical relevance, difficulty alignment, and diagnosed knowledge gaps.'
        }
      />

      {/* Main 2-Column Exploration Layout */}
      <div
        style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'flex-start',
          width: '100%',
        }}
      >
        {/* Left Sticky 220px Filter Column */}
        <FilterSidebar
          groups={filterGroups}
          selectedFilters={selectedFilters}
          onSelectOption={handleSelectOption}
          onClearAll={handleClearAll}
          width={220}
        />

        {/* Right Main Content Area */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Search & Results Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
              background: 'var(--bg-surface, #1E1E22)',
              border: '1px solid var(--border-stroke, #2D2D35)',
              borderRadius: '12px',
              padding: '12px 16px',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary, #9CA3AF)',
                }}
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics, platforms (LeetCode, GFG, YouTube), or techniques..."
                style={{
                  width: '100%',
                  padding: '9px 36px 9px 36px',
                  background: 'var(--bg-canvas, #121214)',
                  border: '1px solid var(--border-stroke, #2D2D35)',
                  borderRadius: '8px',
                  color: 'var(--text-primary, #F3F4F6)',
                  fontSize: '0.84rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-tertiary, #6B7280)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Live Count Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary, #9CA3AF)',
                  fontWeight: 600,
                }}
              >
                Showing <strong style={{ color: 'var(--text-primary, #F3F4F6)' }}>{filtered.length}</strong> of{' '}
                {allResources.length} resources
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  style={{
                    fontSize: '0.76rem',
                    color: 'var(--primary-brand, #818CF8)',
                    background: 'transparent',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Wider Resource Cards Grid: repeat(auto-fill, minmax(300px, 1fr)) */}
          {filtered.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px',
              }}
            >
              {filtered.map((resource, idx) => (
                <ResourceCard
                  key={resource.id || idx}
                  resource={resource}
                  showAiReason
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                background: 'var(--bg-surface, #1E1E22)',
                border: '1px dashed var(--border-stroke, #2D2D35)',
                borderRadius: '14px',
                padding: '24px',
              }}
            >
              <EmptyState
                icon={<BookOpen size={36} color="var(--primary-brand, #818CF8)" />}
                title="No Matching Resources Found"
                message="Try adjusting your keywords, expanding your duration limits, or clearing selected topics."
                action={{
                  label: 'Clear All Filters',
                  onClick: handleClearAll,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
