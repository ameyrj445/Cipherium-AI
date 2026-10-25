import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search, X, BookOpen, Layers, Compass,
  Sparkles, ExternalLink, ArrowRight, CornerDownLeft
} from 'lucide-react';

const DEFAULT_CURRICULUM_TOPICS = [
  { id: 't-arrays', name: 'Arrays & Two Pointers', category: 'Data Structures' },
  { id: 't-bs', name: 'Binary Search & Variants', category: 'Algorithms' },
  { id: 't-trees', name: 'Trees & Binary Search Trees (BST)', category: 'Data Structures' },
  { id: 't-graphs', name: 'Graph Algorithms (BFS, DFS, Dijkstra)', category: 'Algorithms' },
  { id: 't-dp', name: 'Dynamic Programming & Memoization', category: 'Algorithms' },
  { id: 't-os', name: 'Operating Systems & Concurrency', category: 'Systems' },
  { id: 't-cn', name: 'Computer Networks & TCP/IP', category: 'Systems' },
  { id: 't-dbms', name: 'Database Management Systems (DBMS & SQL)', category: 'Databases' },
  { id: 't-sysdesign', name: 'System Design & Scalability', category: 'Architecture' },
];

const PLATFORM_VIEWS = [
  { name: 'Dashboard', desc: 'Home, study streak stats, and daily progress', target: 'Dashboard' },
  { name: 'Learn', desc: 'Interactive subject roadmaps and curriculum milestones', target: 'Learn' },
  { name: 'Practice', desc: 'Adaptive diagnostic quiz and curated roadmap challenges', target: 'Practice' },
  { name: 'Study Plan', desc: 'Custom AI generative study roadmap and milestone checklist', target: 'Study Plan' },
  { name: 'Analytics', desc: 'Curriculum mastery curves and ML performance diagnostics', target: 'Analytics' },
  { name: 'Resources', desc: 'Curated library of tutorials, practice sets, and docs', target: 'Resources' },
  { name: 'AI Tutor', desc: 'Gemini-powered pedagogical assistant and concept explainer', target: 'AI Tutor' },
  { name: 'Settings', desc: 'Study streak alerts, ML triage preferences, and security', target: 'Settings' },
];

export default function GlobalSearch({
  onNavigate = () => {},
  topics = [],
  customPlan = null,
  customPlans = [],
  recommendations = [],
  placeholder = 'Search topics, roadmap, or concepts... (Press /)',
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Combine loaded backend topics with default topics if empty
  const activeTopics = useMemo(() => {
    if (Array.isArray(topics) && topics.length > 0) {
      return topics.map((t) => ({
        id: t.id || t.topic_code || t.name,
        name: t.name || t.topic_name,
        category: t.category || 'Curriculum',
      }));
    }
    return DEFAULT_CURRICULUM_TOPICS;
  }, [topics]);

  // Extract milestones from customPlan and customPlans
  const activeMilestones = useMemo(() => {
    const list = [];
    const plansToScan = customPlan ? [customPlan, ...customPlans.filter((p) => p.id !== customPlan.id)] : customPlans;
    plansToScan.forEach((plan) => {
      if (plan?.milestones && Array.isArray(plan.milestones)) {
        plan.milestones.forEach((m, idx) => {
          list.push({
            id: m.id || `${plan.id}-m-${idx}`,
            planSubject: plan.subject || 'Study Plan',
            title: m.title || `Stage ${idx + 1}`,
            subtopics: m.subtopics || [],
          });
        });
      }
    });
    return list;
  }, [customPlan, customPlans]);

  // Unified Search Results computation
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const items = [];

    // 1. Matching Views
    PLATFORM_VIEWS.forEach((view) => {
      if (view.name.toLowerCase().includes(q) || view.desc.toLowerCase().includes(q)) {
        items.push({
          id: `view-${view.target}`,
          type: 'VIEW',
          title: view.name,
          subtitle: view.desc,
          badge: 'NAVIGATION',
          badgeColor: '#818CF8',
          badgeBg: 'rgba(99, 102, 241, 0.12)',
          icon: Compass,
          action: () => {
            onNavigate(view.target);
          },
        });
      }
    });

    // 2. Matching Curriculum Topics
    activeTopics.forEach((t) => {
      if (t.name.toLowerCase().includes(q) || (t.category && t.category.toLowerCase().includes(q))) {
        items.push({
          id: `topic-${t.id}`,
          type: 'TOPIC',
          title: t.name,
          subtitle: `Curriculum Topic · ${t.category}`,
          badge: 'TOPIC',
          badgeColor: '#34D399',
          badgeBg: 'rgba(16, 185, 129, 0.12)',
          icon: BookOpen,
          action: () => {
            onNavigate('Practice', { topic: t.name });
          },
        });
      }
    });

    // 3. Matching Study Plan Milestones & Subtopics
    activeMilestones.forEach((m) => {
      const matchMilestone = m.title.toLowerCase().includes(q) || m.planSubject.toLowerCase().includes(q);
      const matchedSubtopics = m.subtopics.filter((st) => st.toLowerCase().includes(q));

      if (matchMilestone || matchedSubtopics.length > 0) {
        items.push({
          id: `milestone-${m.id}`,
          type: 'MILESTONE',
          title: m.title,
          subtitle: `${m.planSubject}${matchedSubtopics.length ? ` · Matched: ${matchedSubtopics.slice(0, 2).join(', ')}` : ''}`,
          badge: 'MILESTONE',
          badgeColor: '#FBBF24',
          badgeBg: 'rgba(245, 158, 11, 0.12)',
          icon: Layers,
          action: () => {
            onNavigate('Study Plan');
          },
        });
      }
    });

    // 4. Matching Curated Resources
    if (Array.isArray(recommendations)) {
      recommendations.forEach((rec, idx) => {
        const title = rec.title || rec.label || '';
        const topic = rec.topic_name || rec.subject || '';
        if (title.toLowerCase().includes(q) || topic.toLowerCase().includes(q)) {
          items.push({
            id: `rec-${rec.id || idx}`,
            type: 'RESOURCE',
            title,
            subtitle: `${topic ? `${topic} · ` : ''}${rec.type || 'Practice'} (${rec.site || 'Resource'})`,
            badge: 'RESOURCE',
            badgeColor: '#A78BFA',
            badgeBg: 'rgba(167, 139, 250, 0.12)',
            icon: ExternalLink,
            action: () => {
              if (rec.url) {
                window.open(rec.url, '_blank', 'noopener,noreferrer');
              } else {
                onNavigate('Resources');
              }
            },
          });
        }
      });
    }

    return items;
  }, [query, activeTopics, activeMilestones, recommendations, onNavigate]);

  // Ensure selected index is always valid within current results bounds
  const activeIndex = selectedIndex < results.length ? selectedIndex : 0;

  // Global keyboard shortcuts (/ or Ctrl+K / Cmd+K to focus, Escape to dismiss)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Focus search when pressing '/' outside form fields
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        !document.activeElement?.isContentEditable
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }

      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (item) => {
    if (!item) return;
    item.action();
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0 && results[activeIndex]) {
        handleSelectResult(results[activeIndex]);
      } else if (query.trim()) {
        // Fallback: search practice topics
        onNavigate('Practice', { topic: query.trim() });
        setIsOpen(false);
        setQuery('');
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '340px' }}>
      {/* Search Bar Input */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          background: '#1E1E22',
          border: isOpen ? '1px solid #6366F1' : '1px solid #2D2D35',
          boxShadow: isOpen ? '0 0 0 3px rgba(99, 102, 241, 0.15)' : 'none',
          padding: '8px 12px',
          borderRadius: '8px',
          width: '100%',
          transition: 'all 0.15s ease',
        }}
      >
        <Search size={16} color={isOpen ? '#818CF8' : '#9CA3AF'} style={{ flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search topics, roadmap, or concepts"
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '0.84rem',
            width: '100%',
            color: '#F3F4F6',
          }}
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            title="Clear search"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              color: '#9CA3AF',
            }}
          >
            <X size={14} />
          </button>
        ) : (
          <span
            style={{
              fontSize: '0.68rem',
              color: '#6B7280',
              background: '#28282E',
              border: '1px solid #383842',
              borderRadius: '4px',
              padding: '1px 5px',
              fontWeight: 600,
              userSelect: 'none',
              flexShrink: 0,
            }}
          >
            /
          </span>
        )}
      </div>

      {/* Instant Search Results Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            width: '420px',
            maxHeight: '440px',
            background: '#1A1A1E',
            border: '1px solid #2D2D35',
            borderRadius: '10px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.75)',
            zIndex: 1000,
            overflowY: 'auto',
            padding: '8px',
          }}
        >
          {query.trim() === '' ? (
            /* Quick Suggestions / Popular Searches when query is empty */
            <div>
              <div
                style={{
                  padding: '8px 10px 6px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: '#9CA3AF',
                }}
              >
                Quick Navigation & Tools
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', padding: '0 4px 10px' }}>
                {PLATFORM_VIEWS.slice(0, 4).map((view) => (
                  <button
                    key={view.name}
                    type="button"
                    onClick={() => {
                      onNavigate(view.target);
                      setIsOpen(false);
                    }}
                    style={{
                      background: '#222226',
                      border: '1px solid #2E2E36',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#2A2A32';
                      e.currentTarget.style.borderColor = '#4F46E5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#222226';
                      e.currentTarget.style.borderColor = '#2E2E36';
                    }}
                  >
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#F3F4F6' }}>{view.name}</span>
                    <ArrowRight size={12} color="#818CF8" />
                  </button>
                ))}
              </div>

              <div
                style={{
                  padding: '8px 10px 6px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: '#9CA3AF',
                  borderTop: '1px solid #28282E',
                }}
              >
                Popular Curriculum Topics
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '4px 6px 6px' }}>
                {['Binary Search', 'Trees & BST', 'Dynamic Programming', 'Graph BFS/DFS', 'Operating Systems'].map((topicName) => (
                  <button
                    key={topicName}
                    type="button"
                    onClick={() => {
                      onNavigate('Practice', { topic: topicName });
                      setIsOpen(false);
                    }}
                    style={{
                      background: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      color: '#C7D2FE',
                      fontSize: '0.74rem',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)')}
                  >
                    <Sparkles size={11} color="#818CF8" /> {topicName}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length > 0 ? (
            /* Filtered Search Results */
            <div>
              <div
                style={{
                  padding: '6px 10px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: '#9CA3AF',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>MATCHING RESULTS ({results.length})</span>
                <span style={{ fontSize: '0.64rem', color: '#6B7280' }}>Use ↑ ↓ to navigate · ↵ to select</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {results.map((item, index) => {
                  const isSelected = index === activeIndex;
                  const Icon = item.icon || BookOpen;

                  return (
                    <div
                      key={item.id}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectResult(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        padding: '9px 12px',
                        borderRadius: '7px',
                        background: isSelected ? '#26262E' : 'transparent',
                        border: isSelected ? '1px solid #3F3F4D' : '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.1s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            background: isSelected ? '#33333F' : '#222228',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={14} color={isSelected ? '#818CF8' : '#9CA3AF'} />
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              color: isSelected ? '#FFFFFF' : '#E5E7EB',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {item.title}
                          </div>
                          <div
                            style={{
                              fontSize: '0.7rem',
                              color: '#9CA3AF',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {item.subtitle}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <span
                          style={{
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            color: item.badgeColor,
                            background: item.badgeBg,
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          {item.badge}
                        </span>
                        {isSelected && <CornerDownLeft size={12} color="#818CF8" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Empty State */
            <div style={{ padding: '24px 16px', textAlign: 'center' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                }}
              >
                <Search size={18} color="#EF4444" />
              </div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#F3F4F6', marginBottom: '4px' }}>
                No matches found for &quot;{query}&quot;
              </div>
              <p style={{ fontSize: '0.74rem', color: '#9CA3AF', margin: '0 0 14px' }}>
                Try searching for standard curriculum topics, roadmaps, or learning tools.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '6px' }}>
                {['Binary Search', 'Practice', 'Study Plan', 'OS'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setQuery(s);
                      inputRef.current?.focus();
                    }}
                    style={{
                      background: '#222226',
                      border: '1px solid #2D2D35',
                      color: '#9CA3AF',
                      borderRadius: '5px',
                      padding: '3px 8px',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer info bar */}
          <div
            style={{
              borderTop: '1px solid #26262C',
              padding: '6px 10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.66rem',
              color: '#6B7280',
              marginTop: '4px',
            }}
          >
            <span>Cipherium AI Global Navigator</span>
            <span>ESC to close</span>
          </div>
        </div>
      )}
    </div>
  );
}
