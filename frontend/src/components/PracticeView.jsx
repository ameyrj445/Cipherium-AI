import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Code2, ExternalLink, Search, CheckCircle2, Circle, BookOpen,
  ArrowRight, Clock, CheckCircle, XCircle, RefreshCw, Zap, Award,
  Flame, HelpCircle, FastForward, Target, Play, ChevronLeft, ChevronRight
} from 'lucide-react';
import PageContainer from './layout/PageContainer';
import PageHeader from './layout/PageHeader';
import TwoPaneLayout from './layout/TwoPaneLayout';
import { quizAPI } from '../services/api';

const SITE = {
  leetcode: ['LeetCode', '#F59E0B', 'rgba(245, 158, 11, 0.12)'],
  neetcode: ['NeetCode', '#8B5CF6', 'rgba(139, 92, 246, 0.12)'],
  hackerrank: ['HackerRank', '#10B981', 'rgba(16, 185, 129, 0.12)'],
  codeforces: ['Codeforces', '#6366F1', 'rgba(99, 102, 241, 0.12)'],
  gfg: ['GeeksforGeeks', '#10B981', 'rgba(16, 185, 129, 0.12)'],
  other: ['Practice Resource', '#94A3B8', 'rgba(148, 163, 184, 0.12)'],
};

const siteFor = (url = '') => {
  const value = url.toLowerCase();
  if (value.includes('geeksforgeeks')) return SITE.gfg;
  const match = Object.keys(SITE).find((key) => key !== 'other' && value.includes(key));
  return SITE[match || 'other'];
};

export default function PracticeView({
  plans = [],
  topics = [],
  currentQuestion = null,
  selectedOption = '',
  setSelectedOption = () => {},
  quizResult = null,
  quizLoading = false,
  loadNextQuestion = () => {},
  handleSubmitQuiz = () => {},
  selectedTopicId = null,
  setSelectedTopicId = () => {},
  onUpdateProgress,
  onOpenStudyPlan,
  initialTopic = '',
}) {
  const [activeTab, setActiveTab] = useState('quiz'); // 'quiz', 'challenges', or 'exam'
  const [query, setQuery] = useState(initialTopic);
  const [planId, setPlanId] = useState('All');
  const [stage, setStage] = useState('All');

  // Session Statistics & Timer
  const [sessionStats, setSessionStats] = useState({
    totalAttempted: 0,
    correctCount: 0,
    streak: 0,
    elapsedSeconds: 0,
  });

  const [showHint, setShowHint] = useState(false);

  // Timed Diagnostic Mock Exam State
  const [examConfig, setExamConfig] = useState({
    question_count: 5,
    time_limit_minutes: 10,
    max_difficulty: 3,
  });
  const [isExamActive, setIsExamActive] = useState(false);
  const [examLoading, setExamLoading] = useState(false);
  const [examError, setExamError] = useState('');
  const [examData, setExamData] = useState(null);
  const [currentExamIndex, setCurrentExamIndex] = useState(0);
  const [examAnswers, setExamAnswers] = useState({});
  const [examSecondsLeft, setExamSecondsLeft] = useState(600);
  const [isExamFinished, setIsExamFinished] = useState(false);
  const [examResults, setExamResults] = useState(null);
  const [submittingExam, setSubmittingExam] = useState(false);

  // Finish exam handler defined before countdown effect to ensure stable reference
  const handleFinishExam = useCallback(async () => {
    if (submittingExam || !examData) return;
    setSubmittingExam(true);
    const questions = examData.questions || [];
    let correctCount = 0;

    await Promise.all(
      questions.map(async (q) => {
        const selected = examAnswers[q.id];
        const isCorrect = selected === q.correct_answer;
        if (isCorrect) correctCount++;
        if (selected) {
          try {
            await quizAPI.submitAttempt({
              question_id: q.id,
              selected_answer: selected,
              time_taken_seconds: 15,
            });
          } catch (e) {
            console.error('Error recording exam attempt:', e);
          }
        }
      })
    );

    const scorePct = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    setExamResults({
      correctCount,
      totalCount: questions.length,
      scorePct,
      timeTakenSeconds: (examData.time_limit_minutes || examConfig.time_limit_minutes) * 60 - examSecondsLeft,
      questions,
      answers: examAnswers,
    });
    setIsExamFinished(true);
    setSubmittingExam(false);
  }, [submittingExam, examData, examAnswers, examConfig.time_limit_minutes, examSecondsLeft]);

  // Countdown timer for active exam
  useEffect(() => {
    if (!isExamActive || isExamFinished) return undefined;
    const interval = setInterval(() => {
      setExamSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isExamActive, isExamFinished]);

  useEffect(() => {
    if (isExamActive && !isExamFinished && examSecondsLeft === 0 && examData) {
      handleFinishExam();
    }
  }, [examSecondsLeft, isExamActive, isExamFinished, examData, handleFinishExam]);

  const handleStartExam = async () => {
    setExamLoading(true);
    setExamError('');
    try {
      const res = await quizAPI.generateExam({
        question_count: examConfig.question_count,
        time_limit_minutes: examConfig.time_limit_minutes,
        max_difficulty: examConfig.max_difficulty,
      });
      if (!res.data?.questions?.length) {
        throw new Error('No exam questions could be generated matching the requested criteria.');
      }
      setExamData(res.data);
      setExamAnswers({});
      setCurrentExamIndex(0);
      setExamSecondsLeft((res.data.time_limit_minutes || examConfig.time_limit_minutes) * 60);
      setIsExamActive(true);
      setIsExamFinished(false);
      setExamResults(null);
    } catch (err) {
      console.error('Failed to generate diagnostic exam:', err);
      setExamError(err.response?.data?.detail || err.message || 'Could not generate exam.');
    } finally {
      setExamLoading(false);
    }
  };

  const handleSelectExamAnswer = (questionId, option) => {
    setExamAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleResetExam = () => {
    setIsExamActive(false);
    setIsExamFinished(false);
    setExamData(null);
    setExamAnswers({});
    setExamResults(null);
    setExamError('');
  };


  useEffect(() => {
    setQuery(initialTopic);
    if (initialTopic) setActiveTab('challenges');
  }, [initialTopic]);

  useEffect(() => {
    setStage('All');
  }, [planId]);

  // Load initial question on mount if missing
  useEffect(() => {
    if (!currentQuestion && !quizLoading) {
      loadNextQuestion(null);
    }
  }, []);

  // Update session stats upon receiving a quiz result
  useEffect(() => {
    if (quizResult) {
      setSessionStats((prev) => {
        const isCorrect = Boolean(quizResult.is_correct);
        const correctCount = isCorrect ? prev.correctCount + 1 : prev.correctCount;
        const streak = isCorrect ? prev.streak + 1 : 0;
        return {
          ...prev,
          totalAttempted: prev.totalAttempted + 1,
          correctCount,
          streak,
        };
      });
    }
  }, [quizResult]);

  // Session timer ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionStats((prev) => ({ ...prev, elapsedSeconds: prev.elapsedSeconds + 1 }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const accuracyPct = sessionStats.totalAttempted > 0
    ? Math.round((sessionStats.correctCount / sessionStats.totalAttempted) * 100)
    : 100;

  // Filter curated challenge items from active plans
  const challengeItems = useMemo(() => {
    return plans.flatMap((plan) =>
      (plan.milestones || []).flatMap((milestone) =>
        (milestone.resources || [])
          .filter((res) => res.resource_type === 'practice' || /practice|challenge|exercise|problem/i.test(res.title || ''))
          .map((res) => ({ ...res, plan, milestone }))
      )
    );
  }, [plans]);

  const selectedPlan = planId === 'All' ? null : plans.find((plan) => plan.id === planId);
  const filteredChallenges = challengeItems.filter((item) => {
    const matchesPlan = planId === 'All' || item.plan.id === planId;
    const matchesStage = stage === 'All' || item.milestone.id === stage;
    const matchesQuery = !query.trim() || `${item.plan.subject} ${item.milestone.title} ${item.title} ${item.summary || ''}`.toLowerCase().includes(query.toLowerCase());
    return matchesPlan && matchesStage && matchesQuery;
  });

  const handleNextQuestion = () => {
    setShowHint(false);
    loadNextQuestion(selectedTopicId);
  };

  const handleSkipQuestion = () => {
    setShowHint(false);
    loadNextQuestion(selectedTopicId);
  };

  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const currentExamQuestion = examData?.questions?.[currentExamIndex] || null;
  const examMinutesLeft = Math.floor(examSecondsLeft / 60);
  const examSecsLeft = examSecondsLeft % 60;
  const formattedExamTimer = `${String(examMinutesLeft).padStart(2, '0')}:${String(examSecsLeft).padStart(2, '0')}`;
  const examAnsweredCount = Object.keys(examAnswers).length;

  return (

    <PageContainer fullHeight noGrid>
      {/* 1. Reusable Header */}
      <PageHeader
        eyebrow="ADAPTIVE PRACTICE & EVALUATION"
        title="Adaptive Practice & Diagnostic Evaluation"
        description="Take adaptive multiple-choice diagnostic quizzes or tackle curated problem sets from your study roadmaps."
        style={{ marginBottom: '16px' }}
        actions={
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-surface, #1E1E22)',
              border: '1px solid var(--border-stroke, #2D2D35)',
              padding: '4px',
              borderRadius: '12px',
              gap: '4px',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('quiz')}
              className="btn"
              style={{
                padding: '7px 14px',
                fontSize: '0.82rem',
                borderRadius: '9px',
                border: activeTab === 'quiz' ? '1px solid var(--border-stroke, #2D2D35)' : '1px solid transparent',
                background: activeTab === 'quiz' ? 'var(--bg-canvas, #121214)' : 'transparent',
                color: activeTab === 'quiz' ? 'var(--text-primary, #F3F4F6)' : 'var(--text-secondary, #9CA3AF)',
                boxShadow: activeTab === 'quiz' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              <Zap size={14} color={activeTab === 'quiz' ? '#6366F1' : 'var(--text-secondary, #9CA3AF)'} /> Adaptive Quiz
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('challenges')}
              className="btn"
              style={{
                padding: '7px 14px',
                fontSize: '0.82rem',
                borderRadius: '9px',
                border: activeTab === 'challenges' ? '1px solid var(--border-stroke, #2D2D35)' : '1px solid transparent',
                background: activeTab === 'challenges' ? 'var(--bg-canvas, #121214)' : 'transparent',
                color: activeTab === 'challenges' ? 'var(--text-primary, #F3F4F6)' : 'var(--text-secondary, #9CA3AF)',
                boxShadow: activeTab === 'challenges' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              <Code2 size={14} color={activeTab === 'challenges' ? '#6366F1' : 'var(--text-secondary, #9CA3AF)'} /> Coding Challenges ({challengeItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('exam')}
              className="btn"
              style={{
                padding: '7px 14px',
                fontSize: '0.82rem',
                borderRadius: '9px',
                border: activeTab === 'exam' ? '1px solid var(--border-stroke, #2D2D35)' : '1px solid transparent',
                background: activeTab === 'exam' ? 'var(--bg-canvas, #121214)' : 'transparent',
                color: activeTab === 'exam' ? 'var(--text-primary, #F3F4F6)' : 'var(--text-secondary, #9CA3AF)',
                boxShadow: activeTab === 'exam' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              <Award size={14} color={activeTab === 'exam' ? '#6366F1' : 'var(--text-secondary, #9CA3AF)'} /> Timed Exam
            </button>

          </div>
        }
      />

      {/* ── TAB 1: ADAPTIVE DIAGNOSTIC QUIZ (TWO PANE VIEW) ── */}
      {activeTab === 'quiz' && (
        <TwoPaneLayout
          leftColumns={8}
          rightColumns={4}
          left={
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
              {/* Wrapping Topic Chips with "All" and Active Highlight */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  padding: '8px 12px',
                  background: 'var(--bg-surface, #1E1E22)',
                  border: '1px solid var(--border-stroke, #2D2D35)',
                  borderRadius: '12px',
                }}
              >
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary, #9CA3AF)', marginRight: '4px' }}>
                  Topic:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTopicId(null);
                    setShowHint(false);
                    loadNextQuestion(null);
                  }}
                  style={{
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    padding: '5px 12px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: selectedTopicId === null ? '#6366F1' : 'var(--border-stroke, #2D2D35)',
                    background: selectedTopicId === null ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-shell, #161618)',
                    color: selectedTopicId === null ? '#818CF8' : 'var(--text-secondary, #9CA3AF)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  All Topics (Adaptive)
                </button>
                {topics.map((t) => {
                  const isSel = selectedTopicId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setSelectedTopicId(t.id);
                        setShowHint(false);
                        loadNextQuestion(t.id);
                      }}
                      style={{
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        padding: '5px 12px',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: isSel ? '#6366F1' : 'var(--border-stroke, #2D2D35)',
                        background: isSel ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-shell, #161618)',
                        color: isSel ? '#818CF8' : 'var(--text-secondary, #9CA3AF)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>

              {/* Main Question Card with pinned submit */}
              <div
                className="ui-card"
                style={{
                  padding: '32px',
                  position: 'relative',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'var(--bg-surface, #1E1E22)',
                  border: '1px solid var(--border-stroke, #2D2D35)',
                  borderRadius: '16px',
                  boxSizing: 'border-box',
                }}
              >
                {quizLoading && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(18, 18, 20, 0.85)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '16px',
                      zIndex: 10,
                    }}
                  >
                    <RefreshCw size={28} className="spin" color="#6366F1" />
                  </div>
                )}

                {currentQuestion ? (
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {/* Question Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
                      <span
                        style={{
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: '#818CF8',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                        }}
                      >
                        {currentQuestion.topic_name || 'Core Curriculum'}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #9CA3AF)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Target size={14} color="#6366F1" /> Question #{sessionStats.totalAttempted + 1}
                      </span>
                    </div>

                    {/* Question Text (20px per design specs) */}
                    <h3
                      style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: 'var(--text-primary, #F3F4F6)',
                        lineHeight: 1.5,
                        margin: '0 0 24px 0',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {currentQuestion.question_text}
                    </h3>

                    {/* Roomy Option Rows (16px per design specs) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                      {(currentQuestion.options || []).map((opt, idx) => {
                        const isSelected = selectedOption === opt;
                        let borderColor = isSelected ? '#6366F1' : 'var(--border-stroke, #2D2D35)';
                        let bg = isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-shell, #161618)';

                        if (quizResult) {
                          if (opt === quizResult.correct_answer) {
                            borderColor = '#10B981';
                            bg = 'rgba(16, 185, 129, 0.15)';
                          } else if (isSelected && !quizResult.is_correct) {
                            borderColor = '#EF4444';
                            bg = 'rgba(239, 68, 68, 0.15)';
                          }
                        }

                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              if (!quizResult && !quizLoading) setSelectedOption(opt);
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if ((e.key === 'Enter' || e.key === ' ') && !quizResult && !quizLoading) {
                                setSelectedOption(opt);
                              }
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
                              gap: '14px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                              <span
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '8px',
                                  background: isSelected ? '#6366F1' : 'var(--bg-surface, #1E1E22)',
                                  border: '1px solid var(--border-stroke, #2D2D35)',
                                  color: isSelected ? '#fff' : 'var(--text-secondary, #9CA3AF)',
                                  fontSize: '0.84rem',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                {optionLetters[idx] || idx + 1}
                              </span>
                              <span style={{ fontSize: '16px', color: 'var(--text-primary, #F3F4F6)', fontWeight: 500 }}>
                                {opt}
                              </span>
                            </div>

                            {quizResult && opt === quizResult.correct_answer && <CheckCircle size={20} color="#10B981" />}
                            {quizResult && isSelected && !quizResult.is_correct && <XCircle size={20} color="#EF4444" />}
                          </div>
                        );
                      })}
                    </div>

                    {/* In-Place Explanation Card */}
                    {quizResult && (
                      <div
                        style={{
                          background: quizResult.is_correct ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          border: `1px solid ${quizResult.is_correct ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                          borderRadius: '12px',
                          padding: '20px',
                          marginBottom: '20px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          {quizResult.is_correct ? (
                            <span style={{ fontWeight: 800, color: '#10B981', fontSize: '0.96rem' }}>✓ Correct! Well done.</span>
                          ) : (
                            <span style={{ fontWeight: 800, color: '#EF4444', fontSize: '0.96rem' }}>✕ Incorrect Response</span>
                          )}
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #9CA3AF)' }}>
                            • Updated Topic Mastery: <strong>{Math.round(quizResult.new_mastery_score * 100)}%</strong> ({quizResult.new_status})
                          </span>
                        </div>
                        {quizResult.explanation && (
                          <p style={{ fontSize: '0.88rem', color: 'var(--text-primary, #F3F4F6)', lineHeight: 1.55, margin: 0 }}>
                            {quizResult.explanation}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Hint Box (if toggled) */}
                    {showHint && !quizResult && (
                      <div
                        style={{
                          padding: '14px 18px',
                          background: 'rgba(99, 102, 241, 0.08)',
                          border: '1px solid rgba(99, 102, 241, 0.25)',
                          borderRadius: '10px',
                          marginBottom: '20px',
                        }}
                      >
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#818CF8', marginBottom: '4px' }}>
                          💡 Conceptual Hint
                        </div>
                        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary, #9CA3AF)', margin: 0, lineHeight: 1.45 }}>
                          Consider the core invariants of {currentQuestion.topic_name || 'this data structure'}. Pay special attention to edge cases and time-complexity constraints.
                        </p>
                      </div>
                    )}

                    {/* Submit pinned at bottom */}
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-stroke, #2D2D35)' }}>
                      {!quizResult ? (
                        <button
                          type="button"
                          onClick={handleSubmitQuiz}
                          disabled={!selectedOption || quizLoading}
                          className="btn btn-primary"
                          style={{
                            padding: '12px 28px',
                            fontSize: '0.92rem',
                            fontWeight: 700,
                            borderRadius: '10px',
                            opacity: selectedOption ? 1 : 0.5,
                            cursor: selectedOption ? 'pointer' : 'not-allowed',
                          }}
                        >
                          Submit Response
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleNextQuestion}
                          className="btn btn-primary"
                          style={{
                            padding: '12px 28px',
                            fontSize: '0.92rem',
                            fontWeight: 700,
                            borderRadius: '10px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <span>Next Question</span>
                          <ArrowRight size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', margin: 'auto' }}>
                    <Award size={40} color="#6366F1" style={{ marginBottom: '14px' }} />
                    <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary, #F3F4F6)', fontSize: '1.25rem' }}>
                      Ready to Benchmark Your Knowledge?
                    </h3>
                    <p style={{ color: 'var(--text-secondary, #9CA3AF)', marginBottom: '22px', fontSize: '0.88rem' }}>
                      Take an adaptive quiz tailored to your current study topics and track your progress in real time.
                    </p>
                    <button
                      type="button"
                      onClick={() => loadNextQuestion(null)}
                      className="btn btn-primary"
                      style={{ padding: '10px 24px', fontSize: '0.88rem' }}
                    >
                      Start Adaptive Assessment
                    </button>
                  </div>
                )}
              </div>
            </div>
          }
          right={
            /* Right Pane: Sticky Session Panel */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                className="ui-card"
                style={{
                  padding: '22px',
                  background: 'var(--bg-surface, #1E1E22)',
                  border: '1px solid var(--border-stroke, #2D2D35)',
                  borderRadius: '16px',
                }}
              >
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#818CF8', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: '16px' }}>
                  SESSION STATS
                </div>

                {/* 1. Questions Counter */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid var(--border-stroke, #2D2D35)' }}>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #9CA3AF)' }}>Questions Attempted</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary, #F3F4F6)' }}>
                      {sessionStats.totalAttempted}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #9CA3AF)' }}>Accuracy So Far</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10B981' }}>
                      {accuracyPct}%
                    </div>
                  </div>
                </div>

                {/* 2. Current Difficulty Meter (2/5) */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary, #9CA3AF)', fontWeight: 600 }}>Current Difficulty:</span>
                    <strong style={{ color: 'var(--text-primary, #F3F4F6)' }}>
                      {currentQuestion?.difficulty || 2} / 5
                    </strong>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', height: '8px' }}>
                    {[1, 2, 3, 4, 5].map((lvl) => {
                      const active = (currentQuestion?.difficulty || 2) >= lvl;
                      const colors = ['#10B981', '#10B981', '#F59E0B', '#F59E0B', '#EF4444'];
                      return (
                        <div
                          key={lvl}
                          style={{
                            flex: 1,
                            borderRadius: '4px',
                            background: active ? colors[lvl - 1] : 'var(--bg-shell, #161618)',
                            border: '1px solid',
                            borderColor: active ? 'transparent' : 'var(--border-stroke, #2D2D35)',
                            transition: 'all 0.2s ease',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* 3. Timer & Streak Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: 'var(--bg-shell, #161618)',
                      border: '1px solid var(--border-stroke, #2D2D35)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Clock size={16} color="#818CF8" />
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary, #9CA3AF)' }}>Session Time</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary, #F3F4F6)' }}>
                        {formatTimer(sessionStats.elapsedSeconds)}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: 'var(--bg-shell, #161618)',
                      border: '1px solid var(--border-stroke, #2D2D35)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Flame size={16} color="#F59E0B" />
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary, #9CA3AF)' }}>Current Streak</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#F59E0B' }}>
                        {sessionStats.streak} 🔥
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Skip & Hint Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleSkipQuestion}
                    className="btn btn-white"
                    style={{
                      padding: '9px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <FastForward size={14} /> Skip Question
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowHint(!showHint)}
                    className="btn btn-white"
                    style={{
                      padding: '9px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      borderColor: showHint ? '#6366F1' : undefined,
                      color: showHint ? '#818CF8' : undefined,
                      cursor: 'pointer',
                    }}
                  >
                    <HelpCircle size={14} /> {showHint ? 'Hide Hint' : 'Get Hint'}
                  </button>
                </div>
              </div>
            </div>
          }
        />
      )}

      {/* ── TAB 2: CODING CHALLENGES (LEETCODE / NEETCODE) ── */}
      {activeTab === 'challenges' && (
        <div style={{ width: '100%' }}>
          {!plans.length ? (
            <div className="ui-card" style={{ textAlign: 'center', padding: '56px 24px', borderRadius: '16px' }}>
              <Code2 size={36} color="#6366F1" style={{ marginBottom: '14px' }} />
              <h2 style={{ fontSize: '1.45rem', margin: '0 0 8px', color: 'var(--text-primary, #F3F4F6)' }}>
                Curated Coding Challenges
              </h2>
              <p style={{ color: 'var(--text-secondary, #9CA3AF)', maxWidth: '480px', margin: '0 auto 20px', lineHeight: 1.55 }}>
                Generate a study plan or select a curriculum blueprint to unlock curated LeetCode, NeetCode, and GFG problems matched to each milestone.
              </p>
              <button type="button" onClick={onOpenStudyPlan} className="btn btn-primary" style={{ padding: '10px 22px' }}>
                Create a study plan <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div>
              {/* Filter controls */}
              <div
                className="ui-card"
                style={{
                  padding: '14px 18px',
                  marginBottom: '20px',
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  borderRadius: '12px',
                }}
              >
                <div style={{ position: 'relative', flex: '1 1 280px' }}>
                  <Search size={16} color="var(--text-secondary, #9CA3AF)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Find a topic, e.g. arrays, sliding window, SQL"
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 38px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-stroke, #2D2D35)',
                      background: 'var(--bg-shell, #161618)',
                      color: 'var(--text-primary, #F3F4F6)',
                      outline: 'none',
                      fontSize: '0.84rem',
                    }}
                  />
                </div>
                <select
                  value={planId}
                  onChange={(event) => setPlanId(event.target.value)}
                  aria-label="Filter challenges by plan"
                  style={{
                    padding: '9px 12px',
                    border: '1px solid var(--border-stroke, #2D2D35)',
                    borderRadius: '10px',
                    color: 'var(--text-primary, #F3F4F6)',
                    background: 'var(--bg-shell, #161618)',
                    outline: 'none',
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value="All">All active plans</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.subject}</option>
                  ))}
                </select>
                <select
                  value={stage}
                  onChange={(event) => setStage(event.target.value)}
                  aria-label="Filter challenges by stage"
                  style={{
                    padding: '9px 12px',
                    border: '1px solid var(--border-stroke, #2D2D35)',
                    borderRadius: '10px',
                    color: 'var(--text-primary, #F3F4F6)',
                    background: 'var(--bg-shell, #161618)',
                    outline: 'none',
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value="All">All roadmap stages</option>
                  {(selectedPlan?.milestones || []).map((item, index) => (
                    <option key={item.id || index} value={item.id}>Stage {index + 1}: {item.title}</option>
                  ))}
                </select>
              </div>

              {/* Challenges Grid: auto-fill on wide screens */}
              {filteredChallenges.length ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
                  {filteredChallenges.map((item, index) => {
                    const [siteLabel, color, background] = siteFor(item.url);
                    return (
                      <div
                        key={item.id || `${item.plan.id}-${item.milestone.id}-${index}`}
                        className="ui-card"
                        style={{
                          padding: '20px',
                          border: item.completed ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-stroke, #2D2D35)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          borderRadius: '14px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                          <span style={{ fontSize: '.68rem', fontWeight: 800, color, background, borderRadius: '999px', padding: '4px 8px' }}>
                            {siteLabel}
                          </span>
                          <span style={{ fontSize: '.72rem', color: 'var(--text-secondary, #9CA3AF)' }}>
                            {item.estimated_minutes || 30} min
                          </span>
                        </div>
                        <div>
                          <div style={{ fontSize: '.72rem', color: 'var(--text-secondary, #9CA3AF)', marginBottom: '4px' }}>
                            {item.plan.subject} · {item.milestone.title}
                          </div>
                          <h3 style={{ margin: 0, fontSize: '1rem', lineHeight: 1.35, color: 'var(--text-primary, #F3F4F6)' }}>
                            {item.title}
                          </h3>
                        </div>
                        <p style={{ color: 'var(--text-secondary, #9CA3AF)', fontSize: '.8rem', lineHeight: 1.45, margin: 0 }}>
                          {item.summary || 'Practice this roadmap concept on the linked platform.'}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-stroke, #2D2D35)', marginTop: 'auto' }}>
                          <button
                            type="button"
                            onClick={() => onUpdateProgress?.({
                              plan_id: item.plan.id,
                              milestone_id: item.milestone.id,
                              resource_id: item.id,
                              resource_completed: !item.completed,
                            })}
                            style={{
                              border: 0,
                              background: 'transparent',
                              cursor: 'pointer',
                              color: item.completed ? '#10B981' : 'var(--text-secondary, #9CA3AF)',
                              fontSize: '.76rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}
                          >
                            {item.completed ? <CheckCircle2 size={15} color="#10B981" /> : <Circle size={15} color="var(--text-secondary, #9CA3AF)" />} {item.completed ? 'Completed' : 'Mark done'}
                          </button>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#818CF8', fontSize: '.78rem', fontWeight: 800, textDecoration: 'none', display: 'flex', gap: '5px', alignItems: 'center' }}
                          >
                            Open challenge <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="ui-card" style={{ padding: '36px', textAlign: 'center', borderRadius: '14px' }}>
                  <Code2 size={28} color="#6366F1" style={{ marginBottom: '8px' }} />
                  <h3 style={{ color: 'var(--text-primary, #F3F4F6)' }}>No matching exercises found</h3>
                  <p style={{ color: 'var(--text-secondary, #9CA3AF)', marginBottom: '16px', fontSize: '0.84rem' }}>
                    Try adjusting your search query or select another milestone.
                  </p>
                  <button type="button" onClick={onOpenStudyPlan} className="btn btn-white">
                    <BookOpen size={15} /> Open study plan
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: TIMED DIAGNOSTIC BENCHMARK EXAM ── */}
      {activeTab === 'exam' && (
        <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
          {!isExamActive && !isExamFinished && (
            <div
              className="ui-card"
              style={{
                padding: '36px',
                borderRadius: '16px',
                background: 'var(--bg-surface, #1E1E22)',
                border: '1px solid var(--border-stroke, #2D2D35)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Award size={22} color="#818CF8" />
                </div>
                <div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: '#818CF8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      display: 'block',
                    }}
                  >
                    STANDARDIZED ASSESSMENT
                  </span>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary, #F3F4F6)', margin: 0 }}>
                    Timed Diagnostic Benchmark Exam
                  </h2>
                </div>
              </div>

              <p style={{ color: 'var(--text-secondary, #9CA3AF)', fontSize: '0.88rem', lineHeight: 1.55, marginBottom: '28px' }}>
                Benchmark your computer science and algorithmic problem-solving speed under realistic exam constraints. Questions are randomly sampled from your curriculum and graded automatically with in-depth pedagogical breakdowns.
              </p>

              {examError && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#F87171',
                    fontSize: '0.82rem',
                    marginBottom: '20px',
                  }}
                >
                  {examError}
                </div>
              )}

              {/* Config Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                {/* 1. Question Count */}
                <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-shell, #161618)', border: '1px solid var(--border-stroke, #2D2D35)' }}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary, #9CA3AF)', display: 'block', marginBottom: '10px' }}>
                    QUESTION COUNT
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[5, 10, 15].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setExamConfig((prev) => ({ ...prev, question_count: cnt }))}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: examConfig.question_count === cnt ? '1.5px solid #6366F1' : '1px solid var(--border-stroke, #2D2D35)',
                          background: examConfig.question_count === cnt ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                          color: examConfig.question_count === cnt ? '#818CF8' : 'var(--text-secondary, #9CA3AF)',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                        }}
                      >
                        {cnt} Questions
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Time Limit */}
                <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-shell, #161618)', border: '1px solid var(--border-stroke, #2D2D35)' }}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary, #9CA3AF)', display: 'block', marginBottom: '10px' }}>
                    TIME LIMIT
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[5, 10, 15, 20].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setExamConfig((prev) => ({ ...prev, time_limit_minutes: mins }))}
                        style={{
                          flex: 1,
                          padding: '8px 8px',
                          borderRadius: '8px',
                          border: examConfig.time_limit_minutes === mins ? '1.5px solid #6366F1' : '1px solid var(--border-stroke, #2D2D35)',
                          background: examConfig.time_limit_minutes === mins ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                          color: examConfig.time_limit_minutes === mins ? '#818CF8' : 'var(--text-secondary, #9CA3AF)',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                        }}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Max Difficulty */}
                <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-shell, #161618)', border: '1px solid var(--border-stroke, #2D2D35)' }}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary, #9CA3AF)', display: 'block', marginBottom: '10px' }}>
                    MAX DIFFICULTY
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 2, 3, 4, 5].map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setExamConfig((prev) => ({ ...prev, max_difficulty: diff }))}
                        style={{
                          flex: 1,
                          padding: '8px 6px',
                          borderRadius: '8px',
                          border: examConfig.max_difficulty === diff ? '1.5px solid #6366F1' : '1px solid var(--border-stroke, #2D2D35)',
                          background: examConfig.max_difficulty === diff ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                          color: examConfig.max_difficulty === diff ? '#818CF8' : 'var(--text-secondary, #9CA3AF)',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                        }}
                      >
                        Lvl {diff}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={handleStartExam}
                  disabled={examLoading}
                  className="btn btn-primary"
                  style={{
                    padding: '12px 28px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: examLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {examLoading ? (
                    <>
                      <RefreshCw size={16} className="spin" /> Generating Exam...
                    </>
                  ) : (
                    <>
                      <Play size={16} /> Launch Diagnostic Benchmark
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Active Exam Mode */}
          {isExamActive && !isExamFinished && examData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Header Status Bar */}
              <div
                className="ui-card"
                style={{
                  padding: '16px 24px',
                  borderRadius: '14px',
                  background: 'var(--bg-surface, #1E1E22)',
                  border: '1px solid var(--border-stroke, #2D2D35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '14px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#818CF8', textTransform: 'uppercase' }}>
                    Diagnostic Mock Exam In Progress
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary, #F3F4F6)' }}>
                    Question {currentExamIndex + 1} of {examData.questions.length} ({examAnsweredCount} answered)
                  </div>
                </div>

                {/* Countdown Timer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    background: examSecondsLeft < 120 ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-shell, #161618)',
                    border: `1px solid ${examSecondsLeft < 120 ? '#EF4444' : 'var(--border-stroke, #2D2D35)'}`,
                    color: examSecondsLeft < 120 ? '#F87171' : '#F3F4F6',
                    fontWeight: 800,
                    fontSize: '1rem',
                  }}
                >
                  <Clock size={18} color={examSecondsLeft < 120 ? '#EF4444' : '#818CF8'} />
                  <span>{formattedExamTimer}</span>
                </div>

                <button
                  type="button"
                  onClick={handleFinishExam}
                  disabled={submittingExam}
                  className="btn btn-primary"
                  style={{
                    padding: '8px 18px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    background: '#10B981',
                    borderColor: '#10B981',
                  }}
                >
                  {submittingExam ? 'Grading...' : 'Finish & Grade Exam'}
                </button>
              </div>

              {/* Question Navigation Pills */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  background: 'var(--bg-surface, #1E1E22)',
                  border: '1px solid var(--border-stroke, #2D2D35)',
                }}
              >
                {examData.questions.map((q, idx) => {
                  const isAnswered = examAnswers[q.id] !== undefined;
                  const isCurrent = idx === currentExamIndex;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentExamIndex(idx)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        border: isCurrent ? '2px solid #6366F1' : '1px solid var(--border-stroke, #2D2D35)',
                        background: isAnswered ? '#6366F1' : isCurrent ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-shell, #161618)',
                        color: isAnswered || isCurrent ? '#FFFFFF' : 'var(--text-secondary, #9CA3AF)',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Question Card */}
              {currentExamQuestion && (
                <div
                  className="ui-card"
                  style={{
                    padding: '32px',
                    borderRadius: '16px',
                    background: 'var(--bg-surface, #1E1E22)',
                    border: '1px solid var(--border-stroke, #2D2D35)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'rgba(99, 102, 241, 0.12)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        color: '#818CF8',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                      }}
                    >
                      {currentExamQuestion.topic_name || 'General Computer Science'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #9CA3AF)' }}>
                      Difficulty Level: <strong>{currentExamQuestion.difficulty} / 5</strong>
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary, #F3F4F6)', lineHeight: 1.55, marginBottom: '24px' }}>
                    {currentExamQuestion.question_text}
                  </h3>

                  {/* Options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                    {currentExamQuestion.options.map((opt, optIdx) => {
                      const isSelected = examAnswers[currentExamQuestion.id] === opt;
                      const letter = optionLetters[optIdx] || String(optIdx + 1);
                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleSelectExamAnswer(currentExamQuestion.id, opt)}
                          style={{
                            padding: '14px 18px',
                            borderRadius: '10px',
                            border: `1.5px solid ${isSelected ? '#6366F1' : 'var(--border-stroke, #2D2D35)'}`,
                            background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-shell, #161618)',
                            color: isSelected ? '#FFFFFF' : 'var(--text-primary, #F3F4F6)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '6px',
                              border: `1px solid ${isSelected ? '#6366F1' : 'var(--border-stroke, #2D2D35)'}`,
                              background: isSelected ? '#6366F1' : 'transparent',
                              color: isSelected ? '#FFFFFF' : 'var(--text-secondary, #9CA3AF)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              flexShrink: 0,
                            }}
                          >
                            {letter}
                          </div>
                          <span style={{ fontSize: '0.88rem', lineHeight: 1.45, flex: 1 }}>{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Navigation Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      type="button"
                      disabled={currentExamIndex === 0}
                      onClick={() => setCurrentExamIndex((prev) => Math.max(prev - 1, 0))}
                      className="btn btn-white"
                      style={{
                        padding: '8px 16px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        opacity: currentExamIndex === 0 ? 0.4 : 1,
                        cursor: currentExamIndex === 0 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <ChevronLeft size={16} /> Previous
                    </button>

                    {currentExamIndex < examData.questions.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentExamIndex((prev) => prev + 1)}
                        className="btn btn-primary"
                        style={{
                          padding: '8px 20px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        Next <ChevronRight size={16} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleFinishExam}
                        disabled={submittingExam}
                        className="btn btn-primary"
                        style={{
                          padding: '8px 22px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          background: '#10B981',
                          borderColor: '#10B981',
                        }}
                      >
                        {submittingExam ? 'Grading...' : 'Finish & Grade'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Post-Exam Results View */}
          {isExamFinished && examResults && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Score Hero Card */}
              <div
                className="ui-card"
                style={{
                  padding: '36px',
                  borderRadius: '16px',
                  background: 'var(--bg-surface, #1E1E22)',
                  border: '1px solid var(--border-stroke, #2D2D35)',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    background: examResults.scorePct >= 80 ? 'rgba(16, 185, 129, 0.15)' : examResults.scorePct >= 50 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: examResults.scorePct >= 80 ? '#10B981' : examResults.scorePct >= 50 ? '#F59E0B' : '#EF4444',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    marginBottom: '12px',
                  }}
                >
                  <Award size={16} /> {examResults.scorePct >= 80 ? 'Mastery Demonstrated' : examResults.scorePct >= 50 ? 'Solid Foundations' : 'Needs Reinforcement'}
                </div>

                <div style={{ fontSize: '3.2rem', fontWeight: 900, color: 'var(--text-primary, #F3F4F6)', lineHeight: 1.1, marginBottom: '8px' }}>
                  {examResults.scorePct}%
                </div>

                <p style={{ color: 'var(--text-secondary, #9CA3AF)', fontSize: '0.92rem', marginBottom: '24px' }}>
                  You answered <strong>{examResults.correctCount}</strong> out of <strong>{examResults.totalCount}</strong> questions correctly in {Math.floor(examResults.timeTakenSeconds / 60)} minutes {examResults.timeTakenSeconds % 60} seconds.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={handleResetExam}
                    className="btn btn-primary"
                    style={{ padding: '10px 22px', fontSize: '0.84rem', fontWeight: 700 }}
                  >
                    Retake Assessment
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleResetExam();
                      setActiveTab('quiz');
                    }}
                    className="btn btn-white"
                    style={{ padding: '10px 22px', fontSize: '0.84rem', fontWeight: 600 }}
                  >
                    Adaptive Practice
                  </button>
                </div>
              </div>

              {/* Detailed Question Review */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary, #F3F4F6)', margin: '8px 0 4px' }}>
                  Question-by-Question Diagnostic Review
                </h3>

                {examResults.questions.map((q, idx) => {
                  const userAns = examResults.answers[q.id];
                  const isCorrect = userAns === q.correct_answer;
                  return (
                    <div
                      key={q.id}
                      className="ui-card"
                      style={{
                        padding: '24px',
                        borderRadius: '12px',
                        background: 'var(--bg-surface, #1E1E22)',
                        border: `1.5px solid ${isCorrect ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary, #9CA3AF)' }}>
                          Question {idx + 1} · {q.topic_name}
                        </span>
                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            color: isCorrect ? '#10B981' : '#EF4444',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {isCorrect ? <CheckCircle size={14} /> : <XCircle size={14} />}
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary, #F3F4F6)', margin: '0 0 16px', lineHeight: 1.5 }}>
                        {q.question_text}
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                        {q.options.map((opt, oIdx) => {
                          const isUserPicked = userAns === opt;
                          const isActualCorrect = q.correct_answer === opt;
                          let bg = 'var(--bg-shell, #161618)';
                          let border = 'var(--border-stroke, #2D2D35)';
                          let textCol = 'var(--text-primary, #F3F4F6)';

                          if (isActualCorrect) {
                            bg = 'rgba(16, 185, 129, 0.12)';
                            border = '#10B981';
                            textCol = '#10B981';
                          } else if (isUserPicked && !isActualCorrect) {
                            bg = 'rgba(239, 68, 68, 0.12)';
                            border = '#EF4444';
                            textCol = '#EF4444';
                          }

                          return (
                            <div
                              key={oIdx}
                              style={{
                                padding: '10px 14px',
                                borderRadius: '8px',
                                background: bg,
                                border: `1px solid ${border}`,
                                color: textCol,
                                fontSize: '0.84rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <span>{opt}</span>
                              {isActualCorrect && <CheckCircle size={15} color="#10B981" />}
                              {isUserPicked && !isActualCorrect && <XCircle size={15} color="#EF4444" />}
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div
                          style={{
                            padding: '12px 14px',
                            borderRadius: '8px',
                            background: 'rgba(99, 102, 241, 0.08)',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            color: '#C7D2FE',
                            fontSize: '0.8rem',
                            lineHeight: 1.5,
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'flex-start',
                          }}
                        >
                          <HelpCircle size={16} color="#818CF8" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <strong style={{ color: '#818CF8' }}>Explanation: </strong>
                            {q.explanation}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}

