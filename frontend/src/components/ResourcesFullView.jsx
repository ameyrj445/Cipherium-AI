import React, { useState } from 'react';
import { ExternalLink, Play, Bookmark, Clock, Sparkles, BookOpen, Code2, FileText, CheckCircle2 } from 'lucide-react';

export default function ResourcesFullView({ recommendations = [], customPlan = null }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract resources from customPlan
  const planResources = [];
  if (customPlan && customPlan.milestones) {
    customPlan.milestones.forEach((m) => {
      (m.resources || []).forEach((r) => {
        planResources.push({
          id: r.id,
          title: r.title,
          url: r.url,
          resource_type: r.resource_type || 'article',
          estimated_minutes: r.estimated_minutes || 20,
          summary: r.summary || `Part of ${m.title}`,
          topic_name: customPlan.subject,
          recommendation_reason: `Curated learning link for ${m.title}`,
          relevance_score: 0.96,
          isFromPlan: true,
          milestoneTitle: m.title,
          completed: r.completed,
        });
      });
    });
  }

  // Combine plan resources (ranked highest) with diagnostic recommendations
  const allResources = [...planResources, ...recommendations.map(r => ({ ...r, isFromPlan: false }))];

  const typeFiltered = activeFilter === 'All'
    ? allResources
    : activeFilter === 'My Plan'
    ? allResources.filter(r => r.isFromPlan)
    : activeFilter === 'Practice'
    ? allResources.filter(r => (r.resource_type || '').toLowerCase().includes('practice') || (r.resource_type || '').toLowerCase().includes('exercise'))
    : allResources.filter(r => (r.resource_type || '').toLowerCase() === activeFilter.toLowerCase());
  const filtered = typeFiltered.filter((resource) => !searchQuery.trim() || `${resource.title} ${resource.summary || ''} ${resource.topic_name || ''} ${resource.milestoneTitle || ''}`.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            📚 Curated Learning & Practice Library
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.86rem', marginTop: '4px' }}>
            {customPlan
              ? `Displaying learning links from your "${customPlan.subject}" study plan and diagnostic recommendations.`
              : 'Ranked by pedagogical relevance, difficulty alignment, and diagnosed knowledge gaps.'}
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'All', label: 'All Resources' },
            ...(customPlan ? [{ id: 'My Plan', label: `My ${customPlan.subject} Plan` }] : []),
            { id: 'video', label: 'Videos' },
            { id: 'article', label: 'Articles' },
            { id: 'Practice', label: 'Practice (LeetCode)' },
            { id: 'cheatsheet', label: 'Cheatsheets' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={`btn ${activeFilter === cat.id ? 'btn-primary' : 'btn-white'}`}
              style={{ padding: '6px 14px', fontSize: '0.78rem', border: '1px solid #e2e8f0', borderRadius: '10px' }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search resources, topics, or roadmap stages" style={{ width: '100%', maxWidth: '420px', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '18px', outline: 'none' }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '20px' }}>
        {filtered.map((res, idx) => {
          // Identify source site
          let siteTag = 'Resource';
          let siteColor = '#2563eb';
          const u = (res.url || '').toLowerCase();
          if (u.includes('youtube')) { siteTag = 'YouTube Video'; siteColor = '#dc2626'; }
          else if (u.includes('leetcode')) { siteTag = 'LeetCode Problem'; siteColor = '#d97706'; }
          else if (u.includes('neetcode')) { siteTag = 'NeetCode'; siteColor = '#2563eb'; }
          else if (u.includes('geeksforgeeks')) { siteTag = 'GeeksForGeeks'; siteColor = '#16a34a'; }
          else if (u.includes('takeuforward')) { siteTag = 'takeUforward'; siteColor = '#7c3aed'; }

          return (
            <div
              key={res.id || idx}
              className="ui-card"
              style={{
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: res.isFromPlan ? '1.5px solid #bfdbfe' : '1px solid #e2e8f0',
                background: '#ffffff',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '8px',
                      background: res.isFromPlan ? '#eff6ff' : '#f1f5f9',
                      color: siteColor,
                      border: `1px solid ${res.isFromPlan ? '#bfdbfe' : '#e2e8f0'}`,
                    }}
                  >
                    {siteTag}
                  </span>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#10b981' }}>
                    {Math.round((res.relevance_score || 0.9) * 100)}% Match
                  </span>
                </div>

                <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px', lineHeight: 1.35 }}>
                  {res.title}
                </h3>

                <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5, marginBottom: '14px' }}>
                  {res.summary}
                </p>

                {res.isFromPlan && res.milestoneTitle && (
                  <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '10px', border: '1px solid #f1f5f9', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Roadmap Stage:</div>
                    <div style={{ fontSize: '0.76rem', color: '#1e40af', fontWeight: 700 }}>
                      {res.milestoneTitle}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#64748b' }}>
                  <Clock size={14} />
                  <span>{res.estimated_minutes || 20} mins</span>
                </div>
                <a
                  href={res.url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                  style={{ fontSize: '0.78rem', padding: '7px 14px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  Open Resource <ExternalLink size={13} />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
