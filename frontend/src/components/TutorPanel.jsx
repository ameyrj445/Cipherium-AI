import React from 'react';
import { Sparkles, Brain, Paperclip, Send, RefreshCw } from 'lucide-react';

export default function TutorPanel({
  aiModel,
  setAiModel,
  chatMessages,
  chatInput,
  setChatInput,
  handleSendChat,
  tutorThinking,
  width = 380,
  onResizeDragStart,
  onResizeReset,
  isResizing,
}) {
  return (
    <aside
      style={{
        width: `${width}px`,
        background: 'linear-gradient(180deg, #0b1536 0%, #0a0e23 100%)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid #1e293b',
        flexShrink: 0,
        maxHeight: '100vh',
        position: 'relative',
        transition: isResizing ? 'none' : undefined,
      }}
    >
      {/* ── Drag Handle (left edge) ── */}
      <div
        onMouseDown={onResizeDragStart}
        onDoubleClick={onResizeReset}
        title="Drag to resize · Double-click to reset"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '6px',
          height: '100%',
          cursor: 'ew-resize',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '3px',
            height: '48px',
            borderRadius: '3px',
            background: isResizing ? '#3b82f6' : 'rgba(255,255,255,0.18)',
            transition: 'background 0.15s ease',
          }}
        />
      </div>

      {/* Header */}
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#fff' }}>AI Tutor</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Your 24/7 learning companion</div>
          </div>
        </div>

        <select
          value={aiModel}
          onChange={(e) => setAiModel(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff',
            borderRadius: '8px',
            padding: '4px 8px',
            fontSize: '0.74rem',
            outline: 'none',
          }}
        >
          <option value="GPT-4o" style={{ background: '#0b1536' }}>
            GPT-4o
          </option>
          <option value="Gemini-1.5" style={{ background: '#0b1536' }}>
            Gemini-1.5
          </option>
        </select>
      </div>

      {/* Chat Messages */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {chatMessages.map((msg, idx) => {
          if (msg.role === 'user') {
            return (
              <div
                key={idx}
                style={{
                  alignSelf: 'flex-end',
                  background: '#3b82f6',
                  color: '#fff',
                  padding: '10px 14px',
                  borderRadius: '16px 16px 4px 16px',
                  fontSize: '0.84rem',
                  lineHeight: 1.45,
                  maxWidth: '85%',
                }}
              >
                {msg.text}
              </div>
            );
          }

          if (msg.isCustomCard) {
            return (
              <div
                key={idx}
                style={{
                  alignSelf: 'flex-start',
                  background: '#ffffff',
                  color: '#0f172a',
                  padding: '16px',
                  borderRadius: '16px 16px 16px 4px',
                  fontSize: '0.82rem',
                  lineHeight: 1.5,
                  width: '100%',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Brain size={16} color="#3b82f6" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6' }}>Step-by-step Example</span>
                </div>
                <p style={{ marginBottom: '12px', color: '#334155', fontSize: '0.82rem' }}>{msg.text}</p>

                {/* Array Blocks */}
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', margin: '14px 0' }}>
                  {msg.array.map((num, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginBottom: '2px' }}>{i}</div>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: i === msg.highlightIndex ? '#4f46e5' : '#f1f5f9',
                          color: i === msg.highlightIndex ? '#fff' : '#0f172a',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #e2e8f0',
                          fontSize: '0.82rem',
                        }}
                      >
                        {num}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Steps List */}
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', marginBottom: '12px', fontSize: '0.76rem', color: '#475569' }}>
                  {msg.steps.map((s, stepIdx) => (
                    <div key={stepIdx} style={{ marginBottom: '2px' }}>
                      {s}
                    </div>
                  ))}
                </div>

                {/* Complexity Footer */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#4f46e5',
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: '8px',
                  }}
                >
                  <span>Time: {msg.timeComp}</span>
                  <span>Space: {msg.spaceComp}</span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={idx}
              style={{
                alignSelf: 'flex-start',
                background: '#ffffff',
                color: '#0f172a',
                padding: '12px 16px',
                borderRadius: '16px 16px 16px 4px',
                fontSize: '0.84rem',
                lineHeight: 1.5,
                maxWidth: '90%',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              }}
            >
              {msg.text}
            </div>
          );
        })}

        {tutorThinking && (
          <div
            style={{
              alignSelf: 'flex-start',
              background: 'rgba(255,255,255,0.08)',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '0.78rem',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <RefreshCw size={14} className="spin" color="#60a5fa" /> Synthesizing answer...
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendChat} style={{ padding: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', background: '#0a0d20' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '24px',
            padding: '6px 12px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Paperclip size={18} color="#94a3b8" style={{ cursor: 'pointer' }} />
          <input
            type="text"
            placeholder="Ask anything about your studies..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.82rem' }}
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || tutorThinking}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#3b82f6',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Send size={15} color="#fff" />
          </button>
        </div>
      </form>
    </aside>
  );
}
