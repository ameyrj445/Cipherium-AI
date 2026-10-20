import React, { useState } from 'react';
import { Zap, Clock, CheckCircle2, XCircle, ArrowRight, RefreshCw, Award, Target, Sparkles } from 'lucide-react';

export default function PracticeView({
  topics = [],
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
  const [filterDifficulty, setFilterDifficulty] = useState('All');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>Adaptive Practice & Diagnostics</h2>
          <p style={{ color: '#64748b', fontSize: '0.86rem', marginTop: '4px' }}>
            Interactive question bank that automatically adjusts difficulty based on your accuracy.
          </p>
        </div>

        <button
          onClick={() => loadNextQuestion(selectedTopicId)}
          className="btn btn-primary"
          style={{ padding: '9px 18px' }}
        >
          <RefreshCw size={15} /> New Question
        </button>
      </div>

      {/* Topic Filter Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '14px', marginBottom: '18px' }}>
        <button
          onClick={() => {
            setSelectedTopicId(null);
            loadNextQuestion(null);
          }}
          className={`btn ${selectedTopicId === null ? 'btn-primary' : 'btn-white'}`}
          style={{ fontSize: '0.8rem', padding: '7px 14px', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}
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
            className={`btn ${selectedTopicId === t.id ? 'btn-primary' : 'btn-white'}`}
            style={{ fontSize: '0.8rem', padding: '7px 14px', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Main Question Card */}
      <div className="ui-card" style={{ padding: '32px', position: 'relative', maxWidth: '820px' }}>
        {quizLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(3px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '18px',
              zIndex: 10,
            }}
          >
            <RefreshCw size={28} className="spin" color="#2563eb" />
          </div>
        )}

        {currentQuestion ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <span className="badge badge-popular">{currentQuestion.topic_name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.8rem' }}>
                <Clock size={15} />
                <span>Difficulty: Level {currentQuestion.difficulty}/5</span>
              </div>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.45, marginBottom: '24px' }}>
              {currentQuestion.question_text}
            </h3>

            {/* Multiple Choice Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                let border = isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0';
                let bg = isSelected ? '#eff6ff' : '#fff';

                if (quizResult) {
                  if (opt === quizResult.correct_answer) {
                    border = '2px solid #10b981';
                    bg = '#ecfdf5';
                  } else if (isSelected && !quizResult.is_correct) {
                    border = '2px solid #f43f5e';
                    bg = '#fff1f2';
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
                      borderRadius: '14px',
                      border,
                      background: bg,
                      cursor: quizResult ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: '0.92rem', color: '#0f172a', fontWeight: isSelected ? 600 : 500 }}>
                      {opt}
                    </span>
                    {quizResult && opt === quizResult.correct_answer && <CheckCircle2 size={20} color="#10b981" />}
                    {quizResult && isSelected && !quizResult.is_correct && <XCircle size={20} color="#f43f5e" />}
                  </div>
                );
              })}
            </div>

            {/* Explanation & Feedback Banner */}
            {quizResult && (
              <div
                style={{
                  background: quizResult.is_correct ? '#ecfdf5' : '#fff1f2',
                  border: `1px solid ${quizResult.is_correct ? '#a7f3d0' : '#fecdd3'}`,
                  borderRadius: '12px',
                  padding: '18px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span
                    style={{
                      fontWeight: 700,
                      color: quizResult.is_correct ? '#059669' : '#e11d48',
                      fontSize: '0.95rem',
                    }}
                  >
                    {quizResult.is_correct ? '✓ Correct Answer!' : '✕ Incorrect Attempt'}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    • Updated Topic Mastery: {Math.round(quizResult.new_mastery_score * 100)}% ({quizResult.new_status})
                  </span>
                </div>
                <p style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.5 }}>
                  {quizResult.explanation}
                </p>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              {!quizResult ? (
                <button
                  onClick={handleOptionSubmit}
                  disabled={!selectedOption || quizLoading}
                  className="btn btn-primary"
                  style={{ padding: '12px 28px', opacity: selectedOption ? 1 : 0.5 }}
                >
                  Submit Answer
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
            <p style={{ color: '#64748b', marginBottom: '16px' }}>Ready to test your knowledge?</p>
            <button onClick={() => loadNextQuestion(null)} className="btn btn-primary">
              Start Practice Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
