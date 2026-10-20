import React, { useState, useEffect } from 'react';
import { useResizable } from './hooks/useResizable';
import { authAPI, quizAPI, analyticsAPI, tutorAPI } from './services/api';

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
  const [token, setToken] = useState(localStorage.getItem('cipherium_token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('cipherium_user') || 'null'));
  const [showAuthModal, setShowAuthModal] = useState(!token);
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

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
  const [planLoading, setPlanLoading] = useState(false);

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

  // Load user data whenever token changes
  const loadUserData = async () => {
    try {
      const [topRes, anaRes, recRes, roadRes, planRes] = await Promise.all([
        quizAPI.getTopics().catch(() => ({ data: [] })),
        analyticsAPI.getMastery().catch(() => ({ data: null })),
        analyticsAPI.getRecommendations().catch(() => ({ data: [] })),
        analyticsAPI.generateRoadmap(10).catch(() => ({ data: null })),
        analyticsAPI.getCurrentPlan().catch(() => null),
      ]);
      if (topRes.data) setTopics(topRes.data);
      if (anaRes.data) setAnalytics(anaRes.data);
      if (recRes.data) setRecommendations(recRes.data);
      if (roadRes.data) setRoadmap(roadRes.data);
      if (planRes?.data) setCustomPlan(planRes.data);
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

      localStorage.setItem('cipherium_token', activeToken);
      localStorage.setItem('cipherium_user', JSON.stringify(userData));

      setToken(activeToken);
      setUser(userData);
      setShowAuthModal(false);
    } catch (err) {
      console.error('Auth error:', err);
      setAuthError(err.response?.data?.detail || 'Authentication failed. Please check credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('cipherium_token');
    localStorage.removeItem('cipherium_user');
    setToken('');
    setUser(null);
    setCustomPlan(null);
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
    try {
      const res = await analyticsAPI.createCustomPlan(planConfig);
      setCustomPlan(res.data);
      setActiveNav('Study Plan');
    } catch (err) {
      console.error('Failed to generate study plan:', err);
    } finally {
      setPlanLoading(false);
    }
  };

  const handleUpdatePlanProgress = async (updatePayload) => {
    try {
      const res = await analyticsAPI.updatePlanProgress(updatePayload);
      if (res.data && !res.data.error) {
        setCustomPlan(res.data);
      }
    } catch (err) {
      console.error('Failed to update study plan progress:', err);
    }
  };

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

  // Strengths vs Weaknesses Pie Data
  const pieData = [
    { name: 'Strong Topics', value: analytics?.strong_topics_count || 6, color: '#10b981' },
    { name: 'Moderate Topics', value: analytics?.developing_topics_count || 4, color: '#f59e0b' },
    { name: 'Weak Topics', value: analytics?.weak_topics_count || 3, color: '#f43f5e' },
  ];

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
          if (nav === 'Practice' && !currentQuestion) {
            loadNextQuestion();
          }
        }}
        handleOpenQuiz={() => {
          setActiveNav('Practice');
          loadNextQuestion();
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
                customPlan={customPlan}
                overallProgress={analytics?.overall_accuracy || 84}
                topicsCompleted={12}
                weakTopics={analytics?.weak_topics_count || 3}
                dayStreak={18}
              />

              {/* Continue Learning & Today's Plan Row */}
              <ContinueLearningRow
                customPlan={customPlan}
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
                  pieData={pieData}
                />

                <StudyPlanPanel
                  plan={customPlan}
                  onOpenFullPlan={() => setActiveNav('Study Plan')}
                  onUpdateProgress={handleUpdatePlanProgress}
                  onRegeneratePlan={() => setActiveNav('Study Plan')}
                />

                <RecommendedPanel
                  customPlan={customPlan}
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
              customPlan={customPlan}
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
              topics={topics}
              selectedTopicId={selectedTopicId}
              setSelectedTopicId={setSelectedTopicId}
              currentQuestion={currentQuestion}
              selectedOption={selectedOption}
              setSelectedOption={setSelectedOption}
              quizResult={quizResult}
              quizLoading={quizLoading}
              loadNextQuestion={loadNextQuestion}
              handleOptionSubmit={handleSubmitQuiz}
            />
          )}

          {activeNav === 'Study Plan' && (
            <StudyPlanView
              plan={customPlan}
              loading={planLoading}
              onGeneratePlan={handleGenerateCustomPlan}
              onUpdateProgress={handleUpdatePlanProgress}
              onPracticeTopic={(topicName) => {
                setActiveNav('Practice');
                loadNextQuestion();
              }}
            />
          )}

          {activeNav === 'Analytics' && (
            <AnalyticsFullView
              analytics={analytics}
              pieData={pieData}
              customPlan={customPlan}
              onPracticeTopic={(topicId) => {
                setActiveNav('Practice');
                loadNextQuestion(topicId);
              }}
            />
          )}

          {activeNav === 'Resources' && (
            <ResourcesFullView
              recommendations={recommendations}
              customPlan={customPlan}
            />
          )}

          {activeNav === 'AI Tutor' && (
            <div style={{ background: '#fff', borderRadius: '18px', padding: '24px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>AI Study Tutor</h2>
              <p style={{ color: '#64748b', fontSize: '0.86rem', marginBottom: '20px' }}>
                Your 24/7 dedicated learning assistant. Use the chat panel on the right to ask questions anytime!
              </p>
              <div style={{ padding: '20px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', color: '#1e3a8a', fontSize: '0.9rem' }}>
                💡 <strong>Tutor Tip:</strong> Type any concept or algorithmic problem (such as <em>"Explain Dijkstra's shortest path"</em> or <em>"How does B-Tree indexing work?"</em>) in the right panel input bar to receive immediate grounded assistance.
              </div>
            </div>
          )}
        </main>

        {/* Dedicated AI Tutor Panel */}
        <TutorPanel
          aiModel={aiModel}
          setAiModel={setAiModel}
          chatMessages={chatMessages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          handleSendChat={handleSendChat}
          tutorThinking={tutorThinking}
          width={tutor.size}
          onResizeDragStart={tutor.handleMouseDown}
          onResizeReset={tutor.resetSize}
          isResizing={tutor.isResizing}
        />
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
