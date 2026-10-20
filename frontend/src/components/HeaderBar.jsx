import React from 'react';
import { RefreshCw, Zap } from 'lucide-react';

export default function HeaderBar({ activeTab, fetchAllData, loadingData, onStartDiagnostic }) {
  const titles = {
    dashboard: 'Mastery Analytics & Performance',
    quiz: 'Adaptive Diagnostic Testing',
    roadmap: 'Generated Study Roadmap',
    tutor: 'Cipherium Contextual AI Tutor',
    resources: 'Ranked Learning Recommendations',
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
          {titles[activeTab] || 'Workspace'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
          Real-time educational intelligence calibrated to your syllabus and weak-topic detection
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={fetchAllData}
          disabled={loadingData}
          className="btn btn-secondary"
          style={{ fontSize: '0.8rem', padding: '8px 14px' }}
        >
          <RefreshCw size={14} className={loadingData ? 'spin' : ''} /> Refresh
        </button>
        <button
          onClick={onStartDiagnostic}
          className="btn btn-primary"
          style={{ fontSize: '0.8rem', padding: '8px 14px' }}
        >
          <Zap size={14} /> Start Diagnostic Quiz
        </button>
      </div>
    </div>
  );
}
