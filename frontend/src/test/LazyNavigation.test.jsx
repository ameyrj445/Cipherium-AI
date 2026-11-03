import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import { authAPI, analyticsAPI, quizAPI, tasksAPI, getStoredSession, startSession } from '../services/api';
vi.mock('../services/api',()=>{
 const fn=()=>vi.fn().mockResolvedValue({data:[]});
 return {getStoredSession:vi.fn(),startSession:vi.fn(),endSession:vi.fn(),
 authAPI:{getProfile:fn(),login:fn(),register:fn(),deleteAccount:fn()},
 analyticsAPI:Object.fromEntries(['getMastery','getRecommendations','generateRoadmap','getCurrentPlan','getCustomPlans','createCustomPlan','updatePlanProgress','saveCustomPlan','deleteCustomPlan'].map(k=>[k,fn()])),
 quizAPI:{getTopics:fn(),getNextQuestion:fn(),submitAttempt:fn(),completeSession:fn()},tasksAPI:{getTodayTasks:fn(),toggleTask:fn()},
 feedbackAPI:{getMyFeedback:fn(),submit:fn()}, tutorAPI:{getConversations:fn(),getHistory:fn()}};
});
vi.mock('../components/layout/AppShell',()=>({default:({children,setActiveNav,onLogout,onOpenAuth,onOpenSettings,onNavigate})=><><nav>{['Dashboard','Learn','Practice','Study Plan','Analytics','Resources','AI Tutor','Admin','Settings','Knowledge Graph'].map(n=><button key={n} onClick={()=>setActiveNav(n)}>Go {n}</button>)}<button onClick={onLogout}>Logout</button><button onClick={onOpenAuth}>Auth</button><button onClick={onOpenSettings}>Preferences</button><button onClick={()=>onNavigate('Practice',{topic:'Arrays'})}>Search Arrays</button></nav>{children}</>}));
vi.mock('../components/LoginScreen',()=>({default:p=><><p>Login view</p><p>{p.authError}</p><button onClick={()=>p.handleAuth({preventDefault(){}})}>Authenticate</button><button onClick={()=>p.setAuthMode('register')}>Register mode</button><input aria-label="name" onChange={e=>p.setAuthName(e.target.value)}/><input aria-label="email" onChange={e=>p.setAuthEmail(e.target.value)}/><input aria-label="password" onChange={e=>p.setAuthPassword(e.target.value)}/><button onClick={p.onForgotPassword}>Forgot</button></>}));
vi.mock('../components/StudyPlanView',()=>({default:p=><><p>Plan view</p><p>{p.error}</p><p>{p.plan?.subject}</p><button onClick={()=>p.onGeneratePlan({subject:'Math'})}>Generate</button><button onClick={()=>p.onUpdateProgress({milestone_id:'m'})}>Progress</button><button onClick={()=>p.onAddToLearn(true)}>Save plan</button><button onClick={()=>p.onAddToLearn(false)}>Unsave plan</button><button onClick={()=>p.onPracticeTopic('Math')}>Practice plan</button></>}));
vi.mock('../components/LearnView',()=>({default:p=><><p>Learn view</p><p>{p.customPlans.length} plans</p><button onClick={()=>p.onDeletePlan(1)}>Delete plan</button><button onClick={()=>p.onSelectTopic(1)}>Quiz topic</button><button onClick={p.onOpenStudyPlan}>Open plan</button></>}));
vi.mock('../components/PracticeView',()=>({default:p=><><p>Practice view</p><p>{p.currentQuestion?.text}</p><p>{p.quizResult?.feedback}</p><p>{p.initialTopic}</p><button onClick={()=>p.loadNextQuestion(1)}>Question</button><button onClick={()=>p.setSelectedOption('B')}>Answer B</button><button onClick={p.handleSubmitQuiz}>Submit</button><button onClick={p.onOpenStudyPlan}>Plan</button></>}));
const lazyControl = vi.hoisted(() => ({ resolve: null }));
vi.mock('../components/AnalyticsFullView', () => new Promise(resolve => { lazyControl.resolve = resolve; }));
vi.mock('../components/KnowledgeGraphView',()=>({default:p=><><button onClick={()=>p.onStartQuiz(2)}>Graph quiz</button><button onClick={()=>p.onAskTutor('Explain graph')}>Graph tutor</button></>}));
vi.mock('../components/SettingsView',()=>({default:p=><><p>Settings view</p><button onClick={p.onLogout}>Settings logout</button></>}));
vi.mock('../components/AdminView', async () => { throw new Error('Chunk download failed'); });
vi.mock('../components/ResourcesFullView',()=>({default:()=> <p>Resources view</p>}));
vi.mock('../components/TutorPanel',()=>({default:p=><p>Tutor input: {p.chatInput}</p>}));
vi.mock('../components/RetentionScheduleCard',()=>({default:p=><button onClick={()=>p.onStartQuiz(3)}>Retention quiz</button>}));
vi.mock('../components/ContinueLearningRow',()=>({ContinueLearningCards:p=><><button onClick={p.onOpenLearn}>Continue Learn</button><button onClick={p.onOpenPractice}>Continue Practice</button></>,TodaysTasksCard:p=><>{p.todayTasks.map(t=><button key={t.id} onClick={()=>p.onToggleTask(t.id)}>{t.title}:{String(t.done)}</button>)}</>}));
vi.mock('../components/AnalyticsPanel',()=>({default:p=><><p>Completion {p.dashboardData.completion}</p><button onClick={p.onStartPractice}>Analytics practice</button></>}));
vi.mock('../components/RecommendedPanel',()=>({default:p=><button onClick={p.onOpenResources}>All resources</button>}));
const plan={id:1,subject:'Saved math',is_added_to_learn:true,completed_hours:2,milestones:[{title:'Complete',subtopics:['a'],completed_subtopics:['a'],resources:[]},{subtopics:['b'],completed_subtopics:[],resources:[{completed:true}]},{subtopics:[],completed_subtopics:[]}]};
beforeEach(()=>{
 vi.clearAllMocks();localStorage.clear();window.history.replaceState({},'','/');
 getStoredSession.mockReturnValue({token:'a',user:{id:1,name:'A'},expiresAt:Date.now()+600000});
 startSession.mockReturnValue({expiresAt:Date.now()+600000});
 authAPI.getProfile.mockResolvedValue({data:{id:1,name:'A'}});
 analyticsAPI.getCustomPlans.mockResolvedValue({data:[plan]});analyticsAPI.getCurrentPlan.mockResolvedValue({data:plan});
 analyticsAPI.getMastery.mockResolvedValue({data:{day_streak:2}});analyticsAPI.getRecommendations.mockResolvedValue({data:[]});
 analyticsAPI.createCustomPlan.mockResolvedValue({data:plan});analyticsAPI.saveCustomPlan.mockResolvedValue({data:plan});analyticsAPI.updatePlanProgress.mockResolvedValue({data:plan});
 tasksAPI.getTodayTasks.mockResolvedValue({data:[{id:5,title:'Task',is_done:false}]});
 quizAPI.getNextQuestion.mockResolvedValue({data:{id:4,text:'Question text'}});quizAPI.submitAttempt.mockResolvedValue({data:{feedback:'Correct',quiz_id:'session-1'}});
});
const go=n=>fireEvent.click(screen.getByText(`Go ${n}`));

describe('lazy navigation lifecycle', () => {
 it('announces loading, keeps navigation usable, and ignores a resolved abandoned view', async () => {
  render(<App />); await screen.findByText('Completion 67');
  go('Analytics'); expect(screen.getByRole('status')).toHaveTextContent('Loading Analytics');
  go('Resources'); expect(screen.getByText('Resources view')).toBeInTheDocument();
  await waitFor(() => expect(lazyControl.resolve).toBeTypeOf('function'));
  await act(async () => lazyControl.resolve({ default: () => <h2>Lazy analytics loaded</h2> }));
  expect(screen.queryByText('Lazy analytics loaded')).not.toBeInTheDocument();
  go('Analytics'); expect(await screen.findByText('Lazy analytics loaded')).toBeInTheDocument();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
 });
 it('contains a failed chunk in the view boundary and allows navigation away', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
   render(<App />); await screen.findByText('Completion 67'); go('Admin');
   expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
   go('Resources'); expect(screen.getByText('Resources view')).toBeInTheDocument();
   expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  } finally { consoleError.mockRestore(); }
 });
});
