import React from 'react';
import { Clock, CheckCircle, XCircle, ArrowRight, RefreshCw } from 'lucide-react';

export default function DiagnosticQuiz({
  topics,
  selectedTopicId,
  setSelectedTopicId,
  currentQuestion,
  selectedOption,
  setSelectedOption,
  quizResult,
  quizLoading,
  loadNextQuestion,
  handleOptionSubmit,
}) {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Topic Filter Pill Selector */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '16px' }}>
        <button
          onClick={() => {
            setSelectedTopicId(null);
            loadNextQuestion(null);
          }}
          className={`btn ${selectedTopicId === null ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.8rem', padding: '8px 14px', whiteSpace: 'nowrap' }}
        >
          All Topics (Adaptive)
        </button>
        {topics.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setSelectedTopicId(t.id);
              loadNextQuestion(t.id);
            }}
            className={`btn ${selectedTopicId === t.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '8px 14px', whiteSpace: 'nowrap' }}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Quiz Question Card */}
      <div className="glass-panel" style={{ padding: '36px', position: 'relative' }}>
        {quizLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(10, 13, 20, 0.7)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '16px',
              zIndex: 10,
            }}
          >
            <RefreshCw size={28} className="spin" color="#6366f1" />
          </div>
        )}

        {currentQuestion ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span className="badge badge-info">{currentQuestion.topic_name}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} /> Difficulty Level: {currentQuestion.difficulty}/5
              </span>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', lineHeight: 1.5, marginBottom: '28px' }}>
              {currentQuestion.question_text}
            </h2>

            {/* Options List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                let borderColor = isSelected ? 'var(--primary-500)' : 'var(--border-subtle)';
                let bg = isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)';

                if (quizResult) {
                  if (opt === quizResult.correct_answer) {
                    borderColor = '#10b981';
                    bg = 'rgba(16, 185, 129, 0.15)';
                  } else if (isSelected && !quizResult.is_correct) {
                    borderColor = '#f43f5e';
                    bg = 'rgba(244, 63, 94, 0.15)';
                  }
                }

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (!quizResult) setSelectedOption(opt);
                    }}
                    style={{
                      padding: '16px 20px',
                      borderRadius: '12px',
                      border: `1.5px solid ${borderColor}`,
                      background: bg,
                      cursor: quizResult ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 500 }}>{opt}</span>
                    {quizResult && opt === quizResult.correct_answer && <CheckCircle size={20} color="#10b981" />}
                    {quizResult && isSelected && !quizResult.is_correct && <XCircle size={20} color="#f43f5e" />}
                  </div>
                );
              })}
            </div>

            {/* Immediate Remediation & Explanation Card */}
            {quizResult && (
              <div
                style={{
                  background: quizResult.is_correct ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                  border: `1px solid ${
                    quizResult.is_correct ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'
                  }`,
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  {quizResult.is_correct ? (
                    <span style={{ fontWeight: 700, color: '#34d399', fontSize: '0.95rem' }}>✓ Correct Answer!</span>
                  ) : (
                    <span style={{ fontWeight: 700, color: '#fb7185', fontSize: '0.95rem' }}>✕ Incorrect</span>
                  )}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    • Updated Topic Mastery: {Math.round(quizResult.new_mastery_score * 100)}% ({quizResult.new_status})
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                  {quizResult.explanation}
                </p>
              </div>
            )}

            {/* Submission and Next Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              {!quizResult ? (
                <button
                  onClick={handleOptionSubmit}
                  disabled={!selectedOption || quizLoading}
                  className="btn btn-primary"
                  style={{ padding: '12px 28px', opacity: selectedOption ? 1 : 0.5 }}
                >
                  Submit Response
                </button>
              ) : (
                <button
                  onClick={() => loadNextQuestion(selectedTopicId)}
                  className="btn btn-primary"
                  style={{ padding: '12px 28px' }}
                >
                  Next Question <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Ready to test your knowledge?</p>
            <button onClick={() => loadNextQuestion(null)} className="btn btn-primary">
              Start Diagnostic Test
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
