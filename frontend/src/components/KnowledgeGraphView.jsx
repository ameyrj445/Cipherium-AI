import React, { useEffect, useState, useMemo } from 'react';
import {
  Network, GitFork, Lock, Unlock, CheckCircle2, AlertCircle,
  Sparkles, ArrowRight, BookOpen, Brain, RefreshCw, Layers, ChevronRight
} from 'lucide-react';
import { analyticsAPI } from '../services/api';

export default function KnowledgeGraphView({ onStartQuiz, onAskTutor }) {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedNode, setSelectedNode] = useState(null);

  const fetchGraph = () => {
    setLoading(true);
    analyticsAPI.getKnowledgeGraph()
      .then((res) => {
        setGraphData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load curriculum knowledge graph.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  const categories = useMemo(() => {
    if (!graphData?.nodes) return ['All'];
    const cats = new Set(graphData.nodes.map((n) => n.category || 'General'));
    return ['All', ...Array.from(cats)];
  }, [graphData]);

  const filteredNodes = useMemo(() => {
    if (!graphData?.nodes) return [];
    if (selectedCategory === 'All') return graphData.nodes;
    return graphData.nodes.filter((n) => n.category === selectedCategory);
  }, [graphData, selectedCategory]);

  // Group nodes by topological depth
  const depthTiers = useMemo(() => {
    const tiers = {};
    filteredNodes.forEach((node) => {
      const d = node.depth ?? 0;
      if (!tiers[d]) tiers[d] = [];
      tiers[d].push(node);
    });
    return tiers;
  }, [filteredNodes]);

  const tierLabels = {
    0: 'Tier 1: Foundational Roots (Zero Prerequisites)',
    1: 'Tier 2: Intermediate Dependencies (Requires Tier 1)',
    2: 'Tier 3: Advanced Concepts (Requires Tier 2)',
    3: 'Tier 4: Specialized Architectures (Requires Tier 3)',
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
        <RefreshCw size={32} className="spin" color="#6366f1" style={{ marginBottom: '14px' }} />
        <h3>Computing Curriculum Directed Acyclic Graph (DAG)...</h3>
      </div>
    );
  }

  if (error || !graphData) {
    return (
      <div className="ui-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
        <AlertCircle size={36} color="#ef4444" style={{ marginBottom: '12px' }} />
        <h3>Error Loading Knowledge Graph</h3>
        <p style={{ color: '#64748b' }}>{error || 'Unable to retrieve knowledge map.'}</p>
        <button onClick={fetchGraph} className="btn btn-primary" style={{ marginTop: '14px' }}>
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#6366f1', letterSpacing: '.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Network size={14} /> CURRICULUM PREREQUISITE GRAPH
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '6px 0 4px', color: '#fff' }}>
            Interactive Knowledge Map (DAG)
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', margin: 0, maxWidth: '620px' }}>
            Visualizes academic prerequisite paths. Nodes unlock dynamically as you prove mastery on foundational topics using Bayesian Knowledge Tracing.
          </p>
        </div>

        {/* Legend / Counters */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div className="glass-panel" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="#34d399" />
            <span style={{ fontSize: '0.8rem', color: '#fff' }}>
              <strong>{graphData.mastered_count ?? 0}</strong> Mastered
            </span>
          </div>
          <div className="glass-panel" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Unlock size={16} color="#fbbf24" />
            <span style={{ fontSize: '0.8rem', color: '#fff' }}>
              <strong>{graphData.unlocked_count ?? 0}</strong> Unlocked
            </span>
          </div>
          <div className="glass-panel" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={16} color="#fb7185" />
            <span style={{ fontSize: '0.8rem', color: '#fff' }}>
              <strong>{graphData.locked_count ?? 0}</strong> Locked
            </span>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '22px' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.78rem', padding: '6px 14px', whiteSpace: 'nowrap' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Topological Tiers Canvas */}
      {filteredNodes.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
          No curriculum concepts found for category "{selectedCategory}".
        </div>
      ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {Object.keys(depthTiers).sort((a, b) => Number(a) - Number(b)).map((depthStr) => {
          const depth = Number(depthStr);
          const nodesInTier = depthTiers[depth];

          return (
            <div key={depth} className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
              {/* Tier Heading */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={18} color="#6366f1" />
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                    {tierLabels[depth] || `Tier ${depth + 1}: Depth Level ${depth}`}
                  </h3>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {nodesInTier.length} {nodesInTier.length === 1 ? 'Concept' : 'Concepts'}
                </span>
              </div>

              {/* Node Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '16px' }}>
                {nodesInTier.map((node) => {
                  const isMastered = node.status === 'mastered';
                  const isUnlocked = node.status === 'unlocked';
                  const isLocked = node.status === 'locked';
                  const bktPct = Math.round((node.bkt_probability ?? 0.2) * 100);

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        background: isMastered
                          ? 'rgba(16, 185, 129, 0.07)'
                          : isUnlocked
                          ? 'rgba(99, 102, 241, 0.08)'
                          : 'rgba(255, 255, 255, 0.02)',
                        border: isMastered
                          ? '1px solid rgba(16, 185, 129, 0.35)'
                          : isUnlocked
                          ? '1px solid rgba(99, 102, 241, 0.4)'
                          : '1px solid rgba(244, 63, 94, 0.25)',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease, border-color 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                      {/* Node Header */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)' }}>
                            {node.code}
                          </span>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: isMastered ? '#059669' : isUnlocked ? '#4f46e5' : '#e11d48',
                              color: '#fff'
                            }}
                          >
                            {isMastered ? <CheckCircle2 size={12} /> : isUnlocked ? <Unlock size={12} /> : <Lock size={12} />}
                            {isMastered ? 'Mastered' : isUnlocked ? 'Unlocked' : 'Locked'}
                          </span>
                        </div>
                        <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
                          {node.name}
                        </h4>
                        <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                          {node.category}
                        </div>
                      </div>

                      {/* Locked Dependency Notice */}
                      {isLocked && node.blocked_by?.length > 0 && (
                        <div
                          style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            background: 'rgba(244, 63, 94, 0.12)',
                            border: '1px solid rgba(244, 63, 94, 0.25)',
                            fontSize: '0.72rem',
                            color: '#fda4af',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '6px'
                          }}
                        >
                          <Lock size={13} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <strong>Prerequisite required:</strong> Master <em>{node.blocked_by.join(', ')}</em> first to unlock.
                          </div>
                        </div>
                      )}

                      {/* BKT Mastery Indicator */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '3px' }}>
                          <span style={{ color: 'var(--text-dim)' }}>BKT Latent Knowledge</span>
                          <strong style={{ color: isMastered ? '#34d399' : '#818cf8' }}>
                            P(L) = {bktPct}%
                          </strong>
                        </div>
                        <div style={{ height: '5px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${bktPct}%`,
                              height: '100%',
                              background: isMastered ? '#10b981' : isUnlocked ? '#6366f1' : '#f43f5e'
                            }}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartQuiz?.(node.id);
                          }}
                          className={`btn ${isLocked ? 'btn-secondary' : 'btn-primary'}`}
                          style={{ flex: 1, padding: '6px 10px', fontSize: '0.75rem', justifyContent: 'center' }}
                        >
                          {isLocked ? 'Take Diagnostic' : isMastered ? 'Review Quiz' : 'Start Practice'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAskTutor?.(`Explain the core intuition and practical use cases of ${node.name}.`);
                          }}
                          className="btn btn-secondary"
                          title="Ask AI Tutor"
                          style={{ padding: '6px 10px' }}
                        >
                          <Brain size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Node Detail Modal / Overlay */}
      {selectedNode && (
        <div
          onClick={() => setSelectedNode(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 8, 16, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-panel"
            style={{ maxWidth: '520px', width: '100%', padding: '28px', border: '1px solid rgba(99, 102, 241, 0.4)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)' }}>
                  {selectedNode.code} · Depth Level {selectedNode.depth}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: '4px 0 0' }}>
                  {selectedNode.name}
                </h3>
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: selectedNode.status === 'mastered' ? '#059669' : selectedNode.status === 'unlocked' ? '#4f46e5' : '#e11d48',
                  color: '#fff'
                }}
              >
                {selectedNode.status.toUpperCase()}
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '20px' }}>
              {selectedNode.description || 'Foundational syllabus topic in computational thinking and computer science.'}
            </p>

            {/* Prerequisite Chain */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: '8px' }}>
                Direct Prerequisite Dependencies:
              </div>
              {selectedNode.prerequisites?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedNode.prerequisites.map((p) => (
                    <div
                      key={p}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.8rem',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{p}</span>
                      <ChevronRight size={14} color="#64748b" />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} /> None (Foundational Root Topic)
                </div>
              )}
            </div>

            {/* BKT Stat */}
            <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#fff', marginBottom: '6px' }}>
                <span>Bayesian Latent Knowledge Probability:</span>
                <strong>{Math.round((selectedNode.bkt_probability ?? 0.2) * 100)}%</strong>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                Evaluated from chronological response slips and guess propensities.
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  setSelectedNode(null);
                  onStartQuiz?.(selectedNode.id);
                }}
                className="btn btn-primary"
                style={{ flex: 1, padding: '10px', justifyContent: 'center' }}
              >
                Launch Diagnostic Quiz <ArrowRight size={15} />
              </button>
              <button
                onClick={() => setSelectedNode(null)}
                className="btn btn-secondary"
                style={{ padding: '10px 18px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
