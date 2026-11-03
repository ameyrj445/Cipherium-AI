import React from 'react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AppShell from '../components/layout/AppShell';
import TopHeader from '../components/TopHeader';
import SettingsView from '../components/SettingsView';
import { settingsAPI, geminiAPI } from '../services/api';
vi.mock('../services/api',()=>({settingsAPI:{getProfileSettings:vi.fn(),updateProfileSettings:vi.fn()},geminiAPI:{getStatus:vi.fn(),setKey:vi.fn()},authAPI:{exportData:vi.fn()}}));
beforeEach(()=>{
 localStorage.clear(); vi.clearAllMocks();
 Object.defineProperty(window,'innerWidth',{value:1400,writable:true,configurable:true});
 settingsAPI.getProfileSettings.mockResolvedValue({data:null}); settingsAPI.updateProfileSettings.mockResolvedValue({data:{}});
 geminiAPI.getStatus.mockResolvedValue({data:null}); geminiAPI.setKey.mockResolvedValue({data:{}});
});
afterEach(()=>vi.restoreAllMocks());
describe('real shell navigation',()=>{
 it('persists collapse state, opens admin/settings and logs out',()=>{
  const nav=vi.fn(),logout=vi.fn();
  render(<AppShell user={{name:'Admin Person',email:'admin@example.test',role:'admin'}} token="a" setActiveNav={nav} onLogout={logout}><p>Workspace</p></AppShell>);
  expect(screen.getByText('Workspace')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Collapse sidebar'}));
  expect(localStorage.getItem('cipherium_sidebar_collapsed')).toBe('true');
  fireEvent.click(screen.getByRole('button',{name:'Expand sidebar'}));
  expect(localStorage.getItem('cipherium_sidebar_collapsed')).toBe('false');
  fireEvent.click(screen.getByRole('button',{name:'Admin',exact:true})); expect(nav).toHaveBeenLastCalledWith('Admin');
  fireEvent.click(screen.getByRole('button',{name:'Settings',exact:true})); expect(nav).toHaveBeenLastCalledWith('Settings');
  fireEvent.click(screen.getByRole('button',{name:'Log out',exact:true})); expect(logout).toHaveBeenCalledOnce();
 });
 it('handles corrupted preferences and mobile drawer close/navigation/resize',()=>{
  localStorage.setItem('cipherium_sidebar_collapsed','bad-json');window.innerWidth=375;
  const nav=vi.fn(),quiz=vi.fn();
  render(<AppShell setActiveNav={nav} handleOpenQuiz={quiz}><p>Content</p></AppShell>);
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Toggle navigation drawer'}));
  expect(screen.getByRole('navigation')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Practice',exact:true}));
  expect(nav).toHaveBeenCalledWith('Practice');expect(quiz).toHaveBeenCalledOnce();
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Toggle navigation drawer'}));
  act(()=>{window.innerWidth=1200;window.dispatchEvent(new Event('resize'));});
  expect(screen.getByRole('button',{name:'Collapse sidebar'})).toBeInTheDocument();
  act(()=>{window.innerWidth=375;window.dispatchEvent(new Event('resize'));});
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
 });
 it('restores saved collapsed preference',()=>{
  localStorage.setItem('cipherium_sidebar_collapsed','true');
  render(<AppShell/>);expect(screen.getByRole('button',{name:'Expand sidebar'})).toBeInTheDocument();
 });
 it('handles authenticated profile menu actions and keyboard toggling',()=>{
  const auth=vi.fn(),logout=vi.fn(),settings=vi.fn();
  render(<TopHeader userName="Alex Person" userEmail="a@example.test" isAuthenticated onOpenAuth={auth} onLogout={logout} onOpenSettings={settings}/>);
  fireEvent.keyDown(screen.getByRole('button',{name:'User profile menu'}),{key:'Enter'});
  fireEvent.click(screen.getByRole('button',{name:'Switch Account'}));expect(auth).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole('button',{name:'User profile menu'}));
  fireEvent.click(screen.getByRole('button',{name:'Settings & Preferences'}));expect(settings).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole('button',{name:'User profile menu'}));
  fireEvent.click(screen.getByRole('button',{name:'Sign Out'}));expect(logout).toHaveBeenCalledOnce();
 });
 it('renders unauthenticated header and opens auth',()=>{
  const auth=vi.fn();render(<TopHeader activeNav="Learn" onOpenAuth={auth}/>);
  fireEvent.click(screen.getByRole('button',{name:/sign in/i}));expect(auth).toHaveBeenCalledOnce();
 });
});
describe('settings persistence edges',()=>{
 it('loads saved server preferences then syncs a change',async()=>{
  settingsAPI.getProfileSettings.mockResolvedValue({data:{target_role:'Machine Learning & AI Specialist',weekly_hours:12,difficulty_mode:'advanced',daily_streak_reminder:false,diagnostic_quiz_alert:false,weak_topic_ping:false}});
  render(<SettingsView user={{email:'a@example.test'}}/>);
  await screen.findByDisplayValue('Machine Learning & AI Specialist');
  expect(screen.getByRole('switch',{name:/Daily Study Streak Alerts/i})).toHaveAttribute('aria-checked','false');
  fireEvent.click(screen.getByRole('switch',{name:/Daily Study Streak Alerts/i}));
  await waitFor(()=>expect(settingsAPI.updateProfileSettings).toHaveBeenCalled());
  expect(settingsAPI.updateProfileSettings.mock.calls[0][0]).toMatchObject({daily_streak_reminder:true,weekly_hours:12});
 });
 it('renders corrupted storage defaults and tolerates unavailable settings service',async()=>{
  localStorage.setItem('cipherium_settings_default','bad');settingsAPI.getProfileSettings.mockRejectedValue(new Error('offline'));geminiAPI.getStatus.mockRejectedValue(new Error('offline'));
  render(<SettingsView/>);
  expect(screen.getByDisplayValue('Full-Stack Software Engineer')).toBeInTheDocument();
  await act(async()=>{});
 });
 it('ignores late profile responses after unmount',async()=>{
  let resolve;settingsAPI.getProfileSettings.mockReturnValue(new Promise(r=>{resolve=r;}));
  const {unmount}=render(<SettingsView/>);unmount();
  await act(async()=>resolve({data:{target_role:'late'}}));
  expect(screen.queryByDisplayValue('late')).not.toBeInTheDocument();
 });
});
