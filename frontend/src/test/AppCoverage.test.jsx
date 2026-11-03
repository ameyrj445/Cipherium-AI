import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import { authAPI, analyticsAPI, quizAPI, tasksAPI, getStoredSession, startSession, endSession } from '../services/api';
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
vi.mock('../components/PracticeView',()=>({default:p=><><p>Practice view</p><p>{p.currentQuestion?.text}</p><p>{p.quizResult?.feedback}</p><p>{p.quizError}</p>{p.quizPendingSave && <button onClick={p.handleSubmitQuiz}>Retry saving result</button>}<p>{p.initialTopic}</p><button onClick={()=>p.loadNextQuestion(1)}>Question</button><button onClick={()=>p.setSelectedOption('B')}>Answer B</button><button onClick={p.handleSubmitQuiz}>Submit</button><button onClick={p.onOpenStudyPlan}>Plan</button></>}));
vi.mock('../components/AnalyticsFullView',()=>({default:p=><button onClick={()=>p.onPracticeTopic('Graphs')}>Practice analytics</button>}));
vi.mock('../components/KnowledgeGraphView',()=>({default:p=><><button onClick={()=>p.onStartQuiz(2)}>Graph quiz</button><button onClick={()=>p.onAskTutor('Explain graph')}>Graph tutor</button></>}));
vi.mock('../components/SettingsView',()=>({default:p=><><p>Settings view</p><button onClick={p.onLogout}>Settings logout</button></>}));
vi.mock('../components/AdminView',()=>({default:()=> <p>Admin view</p>}));
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
 quizAPI.getNextQuestion.mockResolvedValue({data:{id:4,text:'Question text'}});quizAPI.submitAttempt.mockResolvedValue({data:{feedback:'Correct',quiz_id:'session-1'}});quizAPI.completeSession.mockResolvedValue({data:{}});
});
const go=n=>fireEvent.click(screen.getByText(`Go ${n}`));
describe('App state integration',()=>{
 it('loads saved-plan metrics and toggles server task',async()=>{
  render(<App/>);await screen.findByText('Completion 67');
  fireEvent.click(screen.getByText('Task:false'));
  await waitFor(()=>expect(tasksAPI.toggleTask).toHaveBeenCalledWith(5));expect(screen.getByText('Task:true')).toBeInTheDocument();
 });
 it('creates, updates, saves and deletes a plan through root handlers',async()=>{
  render(<App/>);await screen.findByText('Completion 67');go('Study Plan');
  fireEvent.click(screen.getByText('Generate'));await waitFor(()=>expect(analyticsAPI.createCustomPlan).toHaveBeenCalledWith({subject:'Math'}));
  fireEvent.click(screen.getByText('Progress'));await waitFor(()=>expect(analyticsAPI.updatePlanProgress).toHaveBeenCalledWith({plan_id:1,milestone_id:'m'}));
  fireEvent.click(screen.getByText('Unsave plan'));await waitFor(()=>expect(analyticsAPI.updatePlanProgress).toHaveBeenCalledWith({plan_id:1,add_to_learn:false}));
  fireEvent.click(screen.getByText('Save plan'));await screen.findByText('Learn view');
  fireEvent.click(screen.getByText('Delete plan'));await screen.findByText('0 plans');expect(analyticsAPI.deleteCustomPlan).toHaveBeenCalledWith(1);
 });
 it('shows incomplete-generation and backend save errors',async()=>{
  analyticsAPI.createCustomPlan.mockResolvedValue({data:{}});analyticsAPI.saveCustomPlan.mockRejectedValue({response:{data:{detail:'Save unavailable'}}});
  render(<App/>);await screen.findByText('Completion 67');go('Study Plan');
  fireEvent.click(screen.getByText('Generate'));await screen.findByText(/server returned an incomplete study plan/);
  fireEvent.click(screen.getByText('Save plan'));await screen.findByText('Save unavailable');
 });
 it('loads quiz, submits answer and refreshes analytics',async()=>{
  render(<App/>);await screen.findByText('Completion 67');go('Practice');
  fireEvent.click(screen.getByText('Submit'));expect(quizAPI.submitAttempt).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Question'));await screen.findByText('Question text');
  fireEvent.click(screen.getByText('Answer B'));fireEvent.click(screen.getByText('Submit'));await screen.findByText('Correct');
  expect(quizAPI.submitAttempt).toHaveBeenCalledWith({question_id:4,selected_answer:'B',time_taken_seconds:15},'a');
 });
 it('routes contextual graph, analytics, settings and resources callbacks',async()=>{
  render(<App/>);await screen.findByText('Completion 67');
  go('Knowledge Graph');fireEvent.click(await screen.findByText('Graph tutor'));expect(screen.getByText('Tutor input: Explain graph')).toBeInTheDocument();
  go('Knowledge Graph');fireEvent.click(await screen.findByText('Graph quiz'));await screen.findByText('Question text');expect(quizAPI.getNextQuestion).toHaveBeenCalledWith(2);
  go('Analytics');fireEvent.click(await screen.findByText('Practice analytics'));expect(screen.getByText('Graphs')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Search Arrays'));expect(screen.getByText('Arrays')).toBeInTheDocument();
  go('Admin');expect(await screen.findByText('Admin view')).toBeInTheDocument();
  go('Dashboard');fireEvent.click(screen.getByText('All resources'));expect(screen.getByText('Resources view')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Preferences'));expect(screen.getByText('Settings view')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Settings logout'));expect(screen.getByText('Login view')).toBeInTheDocument();expect(endSession).toHaveBeenCalledOnce();
 });
 it('expires an invalid restored session rather than showing protected data',async()=>{
  authAPI.getProfile.mockRejectedValue({response:{status:401}});render(<App/>);await screen.findByText('Login view');expect(endSession).toHaveBeenCalled();
 });
 it('registers and authenticates from entered fields',async()=>{
  getStoredSession.mockReturnValue(null);authAPI.register.mockResolvedValue({data:{access_token:'b',user_id:2}});
  render(<App/>);fireEvent.click(screen.getByText('Register mode'));
  fireEvent.change(screen.getByLabelText('name'),{target:{value:'User'}});fireEvent.change(screen.getByLabelText('email'),{target:{value:'u@example.test'}});fireEvent.change(screen.getByLabelText('password'),{target:{value:'test-pass'}});
  fireEvent.click(screen.getByText('Authenticate'));await screen.findByText('Go Dashboard');expect(authAPI.register).toHaveBeenCalledWith({name:'User',email:'u@example.test',password:'test-pass'});
 });
 it('surfaces authentication failure without creating a session',async()=>{
  getStoredSession.mockReturnValue(null);authAPI.login.mockRejectedValue(new Error('offline'));render(<App/>);fireEvent.click(screen.getByText('Authenticate'));
  await screen.findByText('Authentication failed. Please check credentials.');expect(startSession).not.toHaveBeenCalled();
 });
});

describe('adaptive quiz finalization against the backend session contract', () => {
 const answer = async () => {
  go('Practice'); fireEvent.click(screen.getByText('Question')); await screen.findByText('Question text');
  fireEvent.click(screen.getByText('Answer B'));
 };
 it('finalizes before showing success and retries only completion after a failure', async () => {
  quizAPI.completeSession.mockRejectedValueOnce(new Error('timeout'));
  render(<App/>); await screen.findByText('Completion 67'); await answer();
  fireEvent.click(screen.getByText('Submit'));
  await screen.findByText(/answer was recorded, but saving mastery/);
  expect(screen.queryByText('Correct')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('Retry saving result'));
  await screen.findByText('Correct');
  expect(quizAPI.submitAttempt).toHaveBeenCalledTimes(1);
  expect(quizAPI.completeSession).toHaveBeenCalledTimes(2);
  expect(quizAPI.completeSession).toHaveBeenLastCalledWith('session-1','a');
 });
 it('blocks duplicate clicks and loading another question while completion is pending', async () => {
  let finish; quizAPI.completeSession.mockImplementationOnce(() => new Promise(r => { finish = r; }));
  render(<App/>); await screen.findByText('Completion 67'); await answer();
  fireEvent.click(screen.getByText('Submit')); fireEvent.click(screen.getByText('Submit'));
  await waitFor(() => expect(quizAPI.completeSession).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByText('Question'));
  expect(quizAPI.getNextQuestion).toHaveBeenCalledTimes(1);
  finish({data:{}}); await screen.findByText('Correct');
  fireEvent.click(screen.getByText('Submit')); expect(quizAPI.submitAttempt).toHaveBeenCalledTimes(1);
 });
 it('does not blindly retry an ambiguous answer submission', async () => {
  quizAPI.submitAttempt.mockRejectedValueOnce(new Error('connection lost'));
  render(<App/>); await screen.findByText('Completion 67'); await answer();
  fireEvent.click(screen.getByText('Submit'));
  await screen.findByText(/answer submission could not be confirmed/);
  fireEvent.click(screen.getByText('Submit')); fireEvent.click(screen.getByText('Question'));
  expect(quizAPI.submitAttempt).toHaveBeenCalledTimes(1);
  expect(quizAPI.completeSession).not.toHaveBeenCalled();
  expect(quizAPI.getNextQuestion).toHaveBeenCalledTimes(1);
 });
 it('does not display success when the server response lacks a quiz session id', async () => {
  quizAPI.submitAttempt.mockResolvedValueOnce({data:{feedback:'Not finalized'}});
  render(<App/>); await screen.findByText('Completion 67'); await answer();
  fireEvent.click(screen.getByText('Submit')); await screen.findByText(/answer submission could not be confirmed/);
  expect(quizAPI.completeSession).not.toHaveBeenCalled();
 });
 it('ignores a completion response after logout', async () => {
  let finish; quizAPI.completeSession.mockImplementationOnce(() => new Promise(r => { finish = r; }));
  render(<App/>); await screen.findByText('Completion 67'); await answer();
  fireEvent.click(screen.getByText('Submit'));
  await waitFor(() => expect(quizAPI.completeSession).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByText('Logout')); finish({data:{}});
  await screen.findByText('Login view'); expect(screen.queryByText('Correct')).not.toBeInTheDocument();
 });
 it('reports an analytics refresh failure separately from an already finalized result', async () => {
  render(<App/>); await screen.findByText('Completion 67'); await answer();
  analyticsAPI.getMastery.mockRejectedValueOnce(new Error('refresh failed'));
  fireEvent.click(screen.getByText('Submit')); await screen.findByText('Correct');
  await screen.findByText(/result was saved, but refreshing analytics failed/);
  expect(screen.queryByText('Retry saving result')).not.toBeInTheDocument();
 });
});
