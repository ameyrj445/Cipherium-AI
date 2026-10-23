import React, { useState, useEffect } from 'react';
import { useResizable } from './hooks/useResizable';
import { authAPI, quizAPI, analyticsAPI, tutorAPI, getStoredSession, startSession, endSession } from './services/api';

// Modular Components
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import HeroBanner from './components/HeroBanner';
import StatCards from './components/StatCards';
import ContinueLearningRow from './components/ContinueLearningRow';
import AnalyticsPanel from './components/AnalyticsPanel';
import StudyPlanPanel from './components/StudyPlanPanel';
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

export default function App() {
  // Resizable panels
  const sidebar = useResizable({ initialSize: 220, min: 64, max: 320, side: 'right' });
  const tutor   = useResizable({ initialSize: 380, min: 240, max: 560, side: 'left' });
  const isResizingAny = sidebar.isResizing || tutor.isResizing;

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

  // Legacy keys are no longer used; the structured session above expires after two hours.
  useEffect(() => {
    localStorage.removeItem('cipherium_token');
    localStorage.removeItem('cipherium_user');
  }, []);

  useEffect(() => {
    if (!token || !sessionExpiresAt) return undefined;

    const timeout = window.setTimeout(() => {
      endSession();
      setToken('');
      setUser(null);
      setSessionExpiresAt(null);
      setShowAuthModal(true);
    }, Math.max(sessionExpiresAt - Date.now(), 0));

    return () => window.clearTimeout(timeout);
  }, [token, sessionExpiresAt]);

  // Active Navigation Tab
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [activeResourceFilter, setActiveResourceFilter] = useState('All');
  const [analyticsPeriod, setAnalyticsPeriod] = useState('Month');

  // Live Data States
  const [analytics, setAnalytics] = useState(null);
  const [topics, setTopics] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [roadmap, setRoadmap] = useState(null);
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
  const [aiModel, setAiModel] = useState('GPT-4o');
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
  const cachePlans = (plans) => {
    if (plansStorageKey) localStorage.setItem(plansStorageKey, JSON.stringify(plans));
  };

  // Load user data whenever token changes
  const loadUserData = async () => {
    try {
      const [topRes, anaRes, recRes, roadRes, planRes, plansRes] = await Promise.all([
        quizAPI.getTopics().catch(() => ({ data: [] })),
        analyticsAPI.getMastery().catch(() => ({ data: null })),
        analyticsAPI.getRecommendations().catch(() => ({ data: [] })),
        analyticsAPI.generateRoadmap(10).catch(() => ({ data: null })),
        analyticsAPI.getCurrentPlan().catch(() => null),
        analyticsAPI.getCustomPlans().catch(() => ({ data: [] })),
      ]);
      if (topRes.data) setTopics(topRes.data);
      if (anaRes.data) setAnalytics(anaRes.data);
      if (recRes.data) setRecommendations(recRes.data);
      if (roadRes.data) setRoadmap(roadRes.data);
      const savedPlans = Array.isArray(plansRes.data) && plansRes.data.length
        ? plansRes.data
        : JSON.parse(localStorage.getItem(plansStorageKey) || '[]');
      setCustomPlans(savedPlans);
      cachePlans(savedPlans);
      const currentPlan = savedPlans.find((plan) => plan.id === planRes?.data?.id) || savedPlans[0] || planRes?.data || null;
      setCustomPlan(currentPlan);
    } catch (err) {
      console.error('Initialization error:', err);
    }
  };

  useEffect(() => {
    if (token) {
      loadUserData();
    }
  }, [token]);

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
    e.preventDefault();
    if (!chatInput.trim() || tutorThinking) return;

    const userMsg = chatInput.trim();
    const updated = [...chatMessages, { role: 'user', text: userMsg }];
    setChatMessages(updated);
    setChatInput('');
    setTutorThinking(true);

    try {
      const res = await tutorAPI.sendMessage({ message: userMsg });
      setChatMessages([...updated, { role: 'assistant', text: res.data.response }]);
    } catch (err) {
      setChatMessages([...updated, { role: 'assistant', text: "I'm synthesizing an answer using syllabus and RAG notes..." }]);
    } finally {
      setTutorThinking(false);
    }
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

  const handleToggleTask = (id) => {
    setTodayTasks(todayTasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
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
        color: ['#3b82f6', '#06b6d4', '#8b5cf6', '#f59e0b', '#38bdf8', '#a78bfa'][index % 6],
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
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#f8fafc',
        color: '#0f172a',
        cursor: isResizingAny ? 'ew-resize' : 'default',
        userSelect: isResizingAny ? 'none' : 'auto',
      }}
    >
      {/* 1. Left Sidebar */}
      <Sidebar
        activeNav={activeNav}
        setActiveNav={(nav) => {
          setActiveNav(nav);
        }}
        handleOpenQuiz={() => {
          setActiveNav('Practice');
          setPracticeTopic('');
        }}
        user={user}
        width={sidebar.size}
        onResizeDragStart={sidebar.handleMouseDown}
        onResizeReset={sidebar.resetSize}
        isResizing={sidebar.isResizing}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      {/* Main Center + Right Columns Container */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Center Workspace Scrollable View */}
        <main style={{ flex: 1, padding: '24px 28px', overflowY: 'auto', maxHeight: '100vh' }}>
          {/* Top Header Bar */}
          <TopHeader
            userName={user?.name?.split(' ')[0] || 'Student'}
            userEmail={user?.email || ''}
            isAuthenticated={!!token}
            onOpenAuth={() => setShowAuthModal(true)}
            onLogout={handleLogout}
          />

          {/* DYNAMIC ROUTING ACCORDING TO ACTIVENAV */}
          {activeNav === 'Dashboard' && (
            <>
              {/* Hero Banner Card */}
              <HeroBanner
                onContinueLearning={() => setActiveNav('Learn')}
                onViewStudyPlan={() => setActiveNav('Study Plan')}
              />

              {/* Four Summary Stat Cards */}
              <StatCards
                customPlan={learningPlan}
                overallProgress={dashboardData.completion}
                topicsCompleted={dashboardData.topicsDone}
                weakTopics={0}
                dayStreak={0}
              />

              {/* Continue Learning & Today's Plan Row */}
              <ContinueLearningRow
                customPlan={learningPlan}
                todayTasks={todayTasks}
                onToggleTask={handleToggleTask}
                onOpenStudyPlan={() => setActiveNav('Study Plan')}
                onOpenLearn={() => setActiveNav('Learn')}
                onUpdatePlanProgress={handleUpdatePlanProgress}
              />

              {/* Three Lower Analytics & Planning Panels */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.3fr 1.2fr', gap: '20px' }}>
                <AnalyticsPanel
                  analyticsPeriod={analyticsPeriod}
                  setAnalyticsPeriod={setAnalyticsPeriod}
                  dashboardData={dashboardData}
                />

                <StudyPlanPanel
                  plan={learningPlan}
                  onOpenFullPlan={() => setActiveNav('Study Plan')}
                  onUpdateProgress={handleUpdatePlanProgress}
                  onRegeneratePlan={() => setActiveNav('Study Plan')}
                />

                <RecommendedPanel
                  customPlan={learningPlan}
                  activeResourceFilter={activeResourceFilter}
                  setActiveResourceFilter={setActiveResourceFilter}
                  onOpenResources={() => setActiveNav('Resources')}
                />
              </div>
            </>
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
              onSelectTopic={(title) => {
                setActiveNav('Practice');
                loadNextQuestion();
              }}
            />
          )}

          {activeNav === 'Practice' && (
            <PracticeView
              plans={customPlans.filter((plan) => plan.is_added_to_learn)}
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

          {activeNav === 'Analytics' && (
            <AnalyticsFullView
              analytics={analytics}
              plans={customPlans.filter((plan) => plan.is_added_to_learn)}
              onPracticeTopic={(topicId) => {
                setActiveNav('Practice');
                setPracticeTopic('');
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
              chatMessages={chatMessages}
              chatInput={chatInput}
              setChatInput={setChatInput}
              handleSendChat={handleSendChat}
              tutorThinking={tutorThinking}
              embedded
            />
          )}
        </main>
      </div>

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
    </div>
  );
}
