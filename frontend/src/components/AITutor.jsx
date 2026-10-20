import React from 'react';
import { Sparkles, RefreshCw, Send } from 'lucide-react';

export default function AITutor({
  topics,
  chatTopicId,
  setChatTopicId,
  messages,
  chatInput,
  setChatInput,
  handleSendMessage,
  tutorThinking,
}) {
  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)' }}>
      {/* Topic Context Selector for Grounded Answers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tutor Grounding Context:</span>
        <select
          value={chatTopicId || ''}
          onChange={(e) => setChatTopicId(e.target.value ? parseInt(e.target.value) : null)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            color: '#fff',
            fontSize: '0.85rem',
          }}
        >
          <option value="">General Curriculum Context</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Chat Messages Log */}
      <div
        className="glass-panel"
        style={{
          flex: 1,
          padding: '24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '16px',
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              background:
                msg.role === 'user'
                  ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                  : 'rgba(255,255,255,0.04)',
              border: msg.role === 'user' ? 'none' : '1px solid var(--border-subtle)',
              padding: '16px 20px',
              borderRadius: '16px',
              color: '#fff',
              fontSize: '0.9rem',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}
          >
            {msg.role === 'assistant' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '6px',
                  color: '#818cf8',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                <Sparkles size={14} /> Cipherium AI Tutor
              </div>
            )}
            {msg.text}
          </div>
        ))}
        {tutorThinking && (
          <div
            style={{
              alignSelf: 'flex-start',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border-subtle)',
              padding: '12px 18px',
              borderRadius: '16px',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <RefreshCw size={14} className="spin" color="#6366f1" /> Tutor is synthesizing syllabus context...
          </div>
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px' }}>
        <input
          type="text"
          placeholder="Ask a question about data structures, algorithms, SQL indexes..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          style={{
            flex: 1,
            padding: '14px 18px',
            borderRadius: '12px',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--border-subtle)',
            color: '#fff',
            fontSize: '0.95rem',
          }}
        />
        <button
          type="submit"
          disabled={!chatInput.trim() || tutorThinking}
          className="btn btn-primary"
          style={{ padding: '0 24px' }}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
