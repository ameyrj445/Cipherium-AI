/**
 * Cipherium AI - Primary Application Root & Dynamic Router
 *
 * Architecture:
 *   - Manages client authentication state with 12-hour structured token persistence.
 *   - Routes views seamlessly between Dashboard, Learn, Practice, Study Plan,
 *     Analytics, Resources, and AI Tutor.
 *   - Synchronizes learning analytics, adaptive quizzes, and study progress across views.
 *   - Wraps the entire component tree in an Error Boundary for crash resilience.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { authAPI, quizAPI, analyticsAPI, tutorAPI, tasksAPI, getStoredSession, startSession, endSession } from './services/api';

// Error Boundary & Modular Components
import ErrorBoundary from './components/ErrorBoundary';
import AppShell from './components/layout/AppShell';
import PageContainer from './components/layout/PageContainer';
import StickyRail from './components/layout/StickyRail';
import HeroBanner from './components/HeroBanner';
import StatCards from './components/StatCards';
import { ContinueLearningCards, TodaysTasksCard } from './components/ContinueLearningRow';
import AnalyticsPanel from './components/AnalyticsPanel';
import RecommendedPanel from './components/RecommendedPanel';
import TutorPanel from './components/TutorPanel';
import AuthModal from './components/AuthModal';
import LoginScreen from './components/LoginScreen';

// Dedicated Views for Navigation
import LearnView from './components/LearnView';
import PracticeView from './components/PracticeView';
import AnalyticsFullView from './components/AnalyticsFullView';
import ResourcesFullView from './components/ResourcesFullView';
import StudyPlanView from './components/StudyPlanView';
import SettingsView from './components/SettingsView';
import KnowledgeGraphView from './components/KnowledgeGraphView';
import RetentionScheduleCard from './components/RetentionScheduleCard';

import { useDocumentMetadata } from './hooks/useDocumentMetadata';

export default function App() {
  // Session & Auth
  const [restoredSession] = useState(() => getStoredSession());
  const [token, setToken] = useState(restoredSession?.token || '');
  const [user, setUser] = useState(restoredSession?.user || null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState(restoredSession?.expiresAt || null);
  const [showAuthModal, setShowAuthModal] = useState(!restoredSession);
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Define session expiration handler before useEffect to satisfy temporal ordering
  const endInvalidSession = useCallback(() => {
    endSession();
    setToken('');
    setUser(null);
    setSessionExpiresAt(null);
    setShowAuthModal(true);
  }, []);

  // Legacy keys are no longer used; the structured session above expires after twelve hours.
  useEffect(() => {
    localStorage.removeItem('cipherium_token');
    localStorage.removeItem('cipherium_user');
  }, []);

  useEffect(() => {
    if (!token || !sessionExpiresAt) return undefined;

    const timeout = window.setTimeout(() => {
      endInvalidSession();
    }, Math.max(sessionExpiresAt - Date.now(), 0));

    return () => window.clearTimeout(timeout);
  }, [token, sessionExpiresAt, endInvalidSession]);

  // Active Navigation Tab
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [activeResourceFilter, setActiveResourceFilter] = useState('All');
  const [analyticsPeriod, setAnalyticsPeriod] = useState('Month');

  // Dynamic document title & meta tagging
  const activePageKey = !token ? (authMode === 'login' ? 'Login' : 'Register') : activeNav;
  useDocumentMetadata(activePageKey);

  // Live Data States
  const [analytics, setAnalytics] = useState(null);
  const [topics, setTopics] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [_roadmap, setRoadmap] = useState(null);
  const [customPlan, setCustomPlan] = useState(null);
  const [customPlans, setCustomPlans] = useState([]);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState('');
  const [practiceTopic, setPracticeTopic] = useState('');

  // Diagnostic Quiz / Practice State
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [quizResult, setQuizResult] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);

  // AI Tutor State
  const [aiModel, setAiModel] = useState('gemini-2.5-flash');
  const [tutorMode, setTutorMode] = useState('socratic'); // 'socratic' | 'direct' | 'exam_prep'
  const [tutorTopicId, setTutorTopicId] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [tutorThinking, setTutorThinking] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'user',
      text: 'Can you explain how binary search works with a visual example?'
    },
    {
      role: 'assistant',
      isCustomCard: true,
      text: 'Sure! Binary search is an efficient algorithm to find an element in a sorted array. It repeatedly divides the search interval in half.',
      array: [2, 5, 8, 12, 16, 23, 38],
      highlightIndex: 3,
      steps: [
        '1. Start with low = 0, high = 6',
        '2. Find the middle element: (0 + 6) / 2 = 3',
        '3. Compare 12 with the middle element',
        '4. If equal -> element found!'
      ],
      timeComp: 'O(log n)',
      spaceComp: 'O(1)'
    }
  ]);

  // Today's Plan Checklist
  const [todayTasks, setTodayTasks] = useState([
    { id: 1, title: 'Complete DSA Quiz', duration: '15 min', done: true },
    { id: 2, title: 'Watch OS video lecture', duration: '30 min', done: false },
    { id: 3, title: 'Practice 5 questions', duration: '20 min', done: false },
    { id: 4, title: 'Chat with AI Tutor', duration: 'Any time', done: false },
  ]);

  const plansStorageKey = user?.id ? `cipherium_saved_plans_${user.id}` : '';
  const cachePlans = useCallback((plans) => {
    if (plansStorageKey) localStorage.setItem(plansStorageKey, JSON.stringify(plans));
  }, [plansStorageKey]);

  // Load user data whenever token changes
  const loadUserData = useCallback(async () => {
    try {
      // Confirm a restored token before allowing plan generation or other
      // authenticated actions to be shown.
      const profileRes = await authAPI.getProfile();
      if (profileRes.data) setUser(profileRes.data);
      const [topRes, anaRes, recRes, roadRes, planRes, plansRes, tasksRes, historyRes] = await Promise.all([
        quizAPI.getTopics().catch(() => ({ data: [] })),
        analyticsAPI.getMastery().catch(() => ({ data: null })),
        analyticsAPI.getRecommendations().catch(() => ({ data: [] })),
        analyticsAPI.generateRoadmap(10).catch(() => ({ data: null })),
        analyticsAPI.getCurrentPlan().catch(() => null),
        analyticsAPI.getCustomPlans().catch(() => ({ data: [] })),
        tasksAPI.getTodayTasks().catch(() => ({ data: [] })),
        tutorAPI.getHistory(30).catch(() => ({ data: [] })),
      ]);
      if (topRes.data) setTopics(topRes.data);
      if (anaRes.data) setAnalytics(anaRes.data);
      if (recRes.data) setRecommendations(recRes.data);
      if (roadRes.data) setRoadmap(roadRes.data);
      if (Array.isArray(tasksRes.data) && tasksRes.data.length > 0) {
        setTodayTasks(tasksRes.data.map((t) => ({
          id: t.id,
          title: t.title,
          duration: t.duration || '15 min',
          done: !!t.is_done,
        })));
      }
      if (Array.isArray(historyRes.data) && historyRes.data.length > 0) {
        setChatMessages(historyRes.data.map((msg) => ({
          role: msg.role,
          text: msg.message,
          created_at: msg.created_at,
        })));
      }
      const savedPlans = Array.isArray(plansRes.data) && plansRes.data.length
        ? plansRes.data
        : JSON.parse(localStorage.getItem(plansStorageKey) || '[]');
      setCustomPlans(savedPlans);
      cachePlans(savedPlans);
      const currentPlan = savedPlans.find((plan) => plan.id === planRes?.data?.id) || savedPlans[0] || planRes?.data || null;
      setCustomPlan(currentPlan);
    } catch (err) {
      console.error('Initialization error:', err);
      if (err.response?.status === 401) endInvalidSession();
    }
  }, [endInvalidSession, plansStorageKey, cachePlans]);

  useEffect(() => {
    if (token) {
      loadUserData();
    }
  }, [token, loadUserData]);

  // Authentication submission
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      let res;
      if (authMode === 'login') {
        res = await authAPI.login({ email: authEmail, password: authPassword });
      } else {
        res = await authAPI.register({ name: authName, email: authEmail, password: authPassword });
      }

      const activeToken = res.data.access_token;
      const userData = {
        name: res.data.name || authName,
        email: res.data.email || authEmail,
        id: res.data.user_id,
      };

      const session = startSession(activeToken, userData);
      setToken(activeToken);
      setUser(userData);
      setSessionExpiresAt(session.expiresAt);
      setShowAuthModal(false);
    } catch (err) {
      console.error('Auth error:', err);
      setAuthError(err.response?.data?.detail || 'Authentication failed. Please check credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    endSession();
    setToken('');
    setSessionExpiresAt(null);
    setUser(null);
    setCustomPlan(null);
    setCustomPlans([]);
    setAnalytics(null);
    setRecommendations([]);
    setRoadmap(null);
    setCurrentQuestion(null);
    setQuizResult(null);
    setSelectedTopicId(null);
    setShowAuthModal(false);
  };

  // Custom Study Plan Handlers
  const handleGenerateCustomPlan = async (planConfig) => {
    setPlanLoading(true);
    setPlanError('');
    try {
      const res = await analyticsAPI.createCustomPlan(planConfig);
      if (!res.data?.milestones?.length) {
        throw new Error('The server returned an incomplete study plan. Please try again.');
      }
      setCustomPlan(res.data);
      setActiveNav('Study Plan');
      return true;
    } catch (err) {
      console.error('Failed to generate study plan:', err);
      const message = err.response?.data?.detail || err.message || 'Unable to generate the study plan. Please try again.';
      setPlanError(message);
      return false;
    } finally {
      setPlanLoading(false);
    }
  };

  const handleUpdatePlanProgress = async (updatePayload) => {
    try {
      const res = await analyticsAPI.updatePlanProgress({ plan_id: customPlan?.id, ...updatePayload });
      if (res.data && !res.data.error) {
        setCustomPlan(res.data);
        setCustomPlans((plans) => {
          const updatedPlans = plans.map((plan) => plan.id === res.data.id ? res.data : plan);
          cachePlans(updatedPlans);
          return updatedPlans;
        });
      }
    } catch (err) {
      console.error('Failed to update study plan progress:', err);
    }
  };

  const handleAddPlanToLearn = async (addToLearn) => {
    if (!customPlan) return;
    try {
      if (addToLearn) {
        const res = await analyticsAPI.saveCustomPlan(customPlan);
        setCustomPlan(res.data);
        setCustomPlans((plans) => {
          const updatedPlans = [res.data, ...plans.filter((plan) => plan.id !== res.data.id)];
          cachePlans(updatedPlans);
          return updatedPlans;
        });
        setActiveNav('Learn');
      } else {
        await handleUpdatePlanProgress({ add_to_learn: false });
      }
    } catch (err) {
      setPlanError(err.response?.data?.detail || 'Unable to save this plan. Please try again.');
    }
  };

  const handleDeletePlan = async (planId) => {
    try {
      await analyticsAPI.deleteCustomPlan(planId);
      setCustomPlans((plans) => {
        const updatedPlans = plans.filter((plan) => plan.id !== planId);
        cachePlans(updatedPlans);
        setCustomPlan(updatedPlans[0] || null);
        return updatedPlans;
      });
    } catch (err) {
      console.error('Failed to delete study plan:', err);
      setPlanError(err.response?.data?.detail || 'Unable to delete the study plan. Please try again.');
    }
  };

  // Only the plan deliberately added to Learn drives plan-specific surfaces.
  const learningPlan = customPlan?.is_added_to_learn ? customPlan : null;

  // AI Tutor Chat
  const handleSendChat = async (e) => {
    e?.preventDefault?.();
    if (!chatInput.trim() || tutorThinking) return;

    const userMsg = chatInput.trim();
    const currentMode = tutorMode || 'socratic';
    const updated = [...chatMessages, { role: 'user', text: userMsg }];
    setChatMessages(updated);
    setChatInput('');
    setTutorThinking(true);

    const streamingIndex = updated.length;
    // Add placeholder assistant message in streaming state
    setChatMessages([
      ...updated,
      {
        role: 'assistant',
        text: '',
        mode: currentMode,
        streaming: true,
      },
    ]);

    let accumulatedText = '';

    await tutorAPI.streamMessage(
      {
        message: userMsg,
        topic_id: tutorTopicId || undefined,
        mode: currentMode,
      },
      (chunk) => {
        accumulatedText += chunk;
        setChatMessages((prev) => {
          const next = [...prev];
          if (next[streamingIndex]) {
            next[streamingIndex] = {
              ...next[streamingIndex],
              text: accumulatedText,
              mode: currentMode,
              streaming: true,
            };
          }
          return next;
        });
      },
      (donePayload) => {
        setChatMessages((prev) => {
          const next = [...prev];
          if (next[streamingIndex]) {
            next[streamingIndex] = {
              ...next[streamingIndex],
              text: accumulatedText,
              mode: donePayload?.mode || currentMode,
              streaming: false,
              suggested_resources: donePayload?.suggested_resources || [],
            };
          }
          return next;
        });
        setTutorThinking(false);
      },
      async (err) => {
        console.warn('Streaming error, falling back to standard API:', err);
        try {
          const res = await tutorAPI.sendMessage({
            message: userMsg,
            topic_id: tutorTopicId || undefined,
            mode: currentMode,
          });
          setChatMessages((prev) => {
            const next = [...prev];
            next[streamingIndex] = {
              role: 'assistant',
              text: res.data.response,
              mode: res.data.mode || currentMode,
              streaming: false,
              suggested_resources: res.data.suggested_resources || [],
            };
            return next;
          });
        } catch (fallbackErr) {
          console.error('Tutor chat fallback error:', fallbackErr);
          setChatMessages((prev) => {
            const next = [...prev];
            next[streamingIndex] = {
              role: 'assistant',
              text: "I'm synthesizing an answer using syllabus and RAG notes...",
              mode: currentMode,
              streaming: false,
            };
            return next;
          });
        } finally {
          setTutorThinking(false);
        }
      }
    );
  };

  // Practice & Quiz Handler
  const loadNextQuestion = async (topicId = null) => {
    setQuizLoading(true);
    setQuizResult(null);
    setSelectedOption('');
    try {
      const res = await quizAPI.getNextQuestion(topicId);
      setCurrentQuestion(res.data);
      if (topicId) setSelectedTopicId(topicId);
    } catch (e) {
      console.error(e);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!selectedOption || !currentQuestion) return;
    setQuizLoading(true);
    try {
      const res = await quizAPI.submitAttempt({
        question_id: currentQuestion.id,
        selected_answer: selectedOption,
        time_taken_seconds: 15
      });
      setQuizResult(res.data);
      const [anaRes, recRes] = await Promise.all([
        analyticsAPI.getMastery(),
        analyticsAPI.getRecommendations()
      ]);
      setAnalytics(anaRes.data);
      setRecommendations(recRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleToggleTask = async (id) => {
    setTodayTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
    try {
      if (typeof id === 'number') {
        await tasksAPI.toggleTask(id);
      }
    } catch (err) {
      console.error('Failed to toggle daily task in backend:', err);
    }
  };

  // Dashboard metrics deliberately use only the plan added to Learn. No plan
  // (or no recorded plan activity) means every dashboard metric remains zero.
  const dashboardData = (() => {
    if (!learningPlan) {
      return {
        completion: 0, topicsDone: 0, totalTopics: 0, resourcesDone: 0,
        totalResources: 0, studyHours: 0, topicsData: [],
        pieData: [
          { name: 'Completed stages', value: 0, color: '#10b981' },
          { name: 'Started stages', value: 0, color: '#f59e0b' },
          { name: 'Not started stages', value: 0, color: '#f43f5e' },
        ],
      };
    }

    let topicsDone = 0;
    let totalTopics = 0;
    let resourcesDone = 0;
    let totalResources = 0;
    let completedStages = 0;
    let startedStages = 0;
    const topicsData = (learningPlan.milestones || []).map((milestone, index) => {
      const subtopics = milestone.subtopics || [];
      const completedSubtopics = milestone.completed_subtopics || [];
      const resources = milestone.resources || [];
      const completedResources = resources.filter((resource) => resource.completed).length;
      const trackedItems = subtopics.length + resources.length;
      const completedItems = completedSubtopics.length + completedResources;
      totalTopics += subtopics.length;
      topicsDone += completedSubtopics.length;
      totalResources += resources.length;
      resourcesDone += completedResources;
      if (trackedItems > 0 && completedItems === trackedItems) completedStages += 1;
      else if (completedItems > 0) startedStages += 1;
      return {
        topic: milestone.title || `Stage ${index + 1}`,
        pct: trackedItems ? Math.round((completedItems / trackedItems) * 100) : 0,
        color: ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#38bdf8', '#f43f5e'][index % 6],
      };
    });
    const totalTrackedItems = totalTopics + totalResources;

    return {
      completion: totalTrackedItems ? Math.round(((topicsDone + resourcesDone) / totalTrackedItems) * 100) : 0,
      topicsDone,
      totalTopics,
      resourcesDone,
      totalResources,
      studyHours: learningPlan.completed_hours || 0,
      topicsData,
      pieData: [
        { name: 'Completed stages', value: completedStages, color: '#10b981' },
        { name: 'Started stages', value: startedStages, color: '#f59e0b' },
        { name: 'Not started stages', value: Math.max((learningPlan.milestones || []).length - completedStages - startedStages, 0), color: '#f43f5e' },
      ],
    };
  })();

  // ── Show Login Interface First: Workspace is only unlocked after authentication ──
  if (!token) {
    return (
      <ErrorBoundary>
        <LoginScreen
          authMode={authMode}
          setAuthMode={setAuthMode}
          authName={authName}
          setAuthName={setAuthName}
          authEmail={authEmail}
          setAuthEmail={setAuthEmail}
          authPassword={authPassword}
          setAuthPassword={setAuthPassword}
          authError={authError}
          setAuthError={setAuthError}
          handleAuth={handleAuth}
          loading={authLoading}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <AppShell
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        handleOpenQuiz={() => {
          setActiveNav('Practice');
          setPracticeTopic('');
        }}
        user={user}
        token={token}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onOpenSettings={() => setActiveNav('Settings')}
        onNavigate={(nav, payload) => {
          setActiveNav(nav);
          if (payload?.topic) {
            setPracticeTopic(payload.topic);
          }
        }}
        topics={topics}
        customPlan={learningPlan || customPlan}
        customPlans={customPlans}
        recommendations={recommendations}
      >
        {/* DYNAMIC ROUTING ACCORDING TO ACTIVENAV */}
        {activeNav === 'Dashboard' && (
          <PageContainer>
            {/* Row 1: Slim Hero / Onboarding Banner (Full width: 12 cols) */}
            <div style={{ gridColumn: '1 / -1' }}>
              <HeroBanner
                customPlan={learningPlan}
                onContinueLearning={() => setActiveNav('Learn')}
                onViewStudyPlan={() => setActiveNav('Study Plan')}
              />
            </div>

            {/* Row 2: Four Summary Stat Cards (Full width: 12 cols) */}
            <div style={{ gridColumn: '1 / -1' }}>
              <StatCards
                customPlan={learningPlan}
                overallProgress={dashboardData.completion}
                topicsCompleted={dashboardData.topicsDone}
                studyHours={dashboardData.studyHours}
                dayStreak={analytics?.day_streak || 0}
              />

            </div>

            {/* Main Column (8 of 12 cols): Continue Learning + Performance Analytics */}
            <div style={{ gridColumn: '1 / span 8', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <ContinueLearningCards
                customPlan={learningPlan}
                onOpenStudyPlan={() => setActiveNav('Study Plan')}
                onOpenLearn={() => setActiveNav('Learn')}
                onOpenPractice={() => {
                  setActiveNav('Practice');
                  setPracticeTopic('');
                }}
              />

              <AnalyticsPanel
                analyticsPeriod={analyticsPeriod}
                setAnalyticsPeriod={setAnalyticsPeriod}
                dashboardData={dashboardData}
                onStartPractice={() => {
                  setActiveNav('Practice');
                  setPracticeTopic('');
                }}
              />

              <RetentionScheduleCard
                onStartQuiz={(topicId) => {
                  setSelectedTopicId(topicId);
                  loadNextQuestion(topicId);
                  setActiveNav('Practice');
                }}
              />
            </div>

            {/* Sticky Right Rail (4 of 12 cols): Today's Tasks + Recommended for You */}
            <StickyRail columns={4} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <TodaysTasksCard
                customPlan={learningPlan}
                todayTasks={todayTasks}
                onToggleTask={handleToggleTask}
                onOpenStudyPlan={() => setActiveNav('Study Plan')}
                onOpenLearn={() => setActiveNav('Learn')}
                onUpdatePlanProgress={handleUpdatePlanProgress}
              />

              <RecommendedPanel
                customPlan={learningPlan}
                activeResourceFilter={activeResourceFilter}
                setActiveResourceFilter={setActiveResourceFilter}
                onOpenResources={() => setActiveNav('Resources')}
              />
            </StickyRail>
          </PageContainer>
        )}

        {activeNav === 'Learn' && (
          <LearnView
            topics={topics}
            customPlan={learningPlan}
            customPlans={customPlans}
            onSelectPlan={setCustomPlan}
            onDeletePlan={handleDeletePlan}
            onUpdateProgress={handleUpdatePlanProgress}
            onOpenStudyPlan={() => setActiveNav('Study Plan')}
            user={user}
            onSelectTopic={() => {
              setActiveNav('Practice');
              loadNextQuestion();
            }}
          />
        )}

        {activeNav === 'Practice' && (
          <PracticeView
            plans={customPlans.filter((plan) => plan.is_added_to_learn)}
            topics={topics}
            currentQuestion={currentQuestion}
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
            quizResult={quizResult}
            quizLoading={quizLoading}
            loadNextQuestion={loadNextQuestion}
            handleSubmitQuiz={handleSubmitQuiz}
            selectedTopicId={selectedTopicId}
            setSelectedTopicId={setSelectedTopicId}
            initialTopic={practiceTopic}
            onUpdateProgress={handleUpdatePlanProgress}
            onOpenStudyPlan={() => setActiveNav('Study Plan')}
          />
        )}

        {activeNav === 'Study Plan' && (
          <StudyPlanView
            plan={customPlan}
            loading={planLoading}
            error={planError}
            onGeneratePlan={handleGenerateCustomPlan}
            onUpdateProgress={handleUpdatePlanProgress}
            onAddToLearn={handleAddPlanToLearn}
            onPracticeTopic={(topicName) => {
              setActiveNav('Practice');
              setPracticeTopic(topicName);
            }}
          />
        )}

        {activeNav === 'Knowledge Graph' && (
          <KnowledgeGraphView
            onStartQuiz={(topicId) => {
              setSelectedTopicId(topicId);
              loadNextQuestion(topicId);
              setActiveNav('Practice');
            }}
            onAskTutor={(prompt) => {
              setActiveNav('AI Tutor');
              setChatInput(prompt);
            }}
          />
        )}

        {activeNav === 'Analytics' && (
          <AnalyticsFullView
            analytics={analytics}
            plans={customPlans.filter((plan) => plan.is_added_to_learn)}
            onPracticeTopic={(topicName) => {
              setActiveNav('Practice');
              setPracticeTopic(topicName);
            }}
          />
        )}

        {activeNav === 'Resources' && (
          <ResourcesFullView
            recommendations={recommendations}
            customPlan={learningPlan}
          />
        )}

        {activeNav === 'AI Tutor' && (
          <TutorPanel
            aiModel={aiModel}
            setAiModel={setAiModel}
            tutorMode={tutorMode}
            setTutorMode={setTutorMode}
            chatMessages={chatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleSendChat={handleSendChat}
            tutorThinking={tutorThinking}
            topics={topics}
            tutorTopicId={tutorTopicId}
            setTutorTopicId={setTutorTopicId}
            onClearHistory={() => setChatMessages([])}
            embedded
          />
        )}

        {activeNav === 'Settings' && (
          <SettingsView
            user={user}
            aiModel={aiModel}
            setAiModel={setAiModel}
            sessionExpiresAt={sessionExpiresAt}
            onLogout={handleLogout}
            customPlan={learningPlan}
          />
        )}
      </AppShell>

      {/* Modern Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={token ? () => setShowAuthModal(false) : null}
        authMode={authMode}
        setAuthMode={setAuthMode}
        authName={authName}
        setAuthName={setAuthName}
        authEmail={authEmail}
        setAuthEmail={setAuthEmail}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        authError={authError}
        setAuthError={setAuthError}
        handleAuth={handleAuth}
        loading={authLoading}
      />
    </ErrorBoundary>
  );
}
