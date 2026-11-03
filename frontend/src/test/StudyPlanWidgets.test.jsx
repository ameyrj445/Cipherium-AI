import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StudyPlanPanel from '../components/StudyPlanPanel';
import MilestoneProgressTree from '../components/common/MilestoneProgressTree';

const milestones = [
 {id:'a',title:'Basics',status:'in_progress',estimated_hours:4,subtopics:['Done','Next','Later','Extra'],completed_subtopics:['Done'],resources:[{id:1,title:'Guide',url:'https://example.com',type:'article',completed:false}]},
 {id:'b',title:'Finished',status:'completed',subtopics:['Complete'],completed_subtopics:['Complete']},
 {title:'Empty',status:'pending'},
 {id:'d',title:'Waiting',subtopics:['Wait'],completed_subtopics:[]},
 {id:'e',title:'Hidden',subtopics:[]}
];
describe('study plan widgets',()=>{
 it('renders an empty plan safely before data arrives',()=>{
  render(<StudyPlanPanel />);
  expect(screen.getByText(/No active study plan/)).toBeInTheDocument();
  expect(screen.getByText('0% Done')).toBeInTheDocument();
 });
 it('summarizes checkpoints, limits previews and emits reversible updates',()=>{
  const update=vi.fn(),open=vi.fn();
  render(<StudyPlanPanel plan={{subject:'Algorithms',milestones}} onUpdateProgress={update} onOpenFullPlan={open}/>);
  expect(screen.getByText('33% Done')).toBeInTheDocument();
  expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  expect(screen.queryByText('Extra')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('Done'));
  expect(update).toHaveBeenLastCalledWith({milestone_id:'a',subtopic_name:'Done',subtopic_completed:false});
  fireEvent.click(screen.getByText('Next'));
  expect(update).toHaveBeenLastCalledWith({milestone_id:'a',subtopic_name:'Next',subtopic_completed:true});
  fireEvent.click(screen.getByRole('button',{name:'Manage Plan'}));
  expect(open).toHaveBeenCalledOnce();
 });
 it('handles optional update callback without crashing',()=>{
  render(<StudyPlanPanel plan={{milestones:[milestones[0]]}}/>);
  fireEvent.click(screen.getByText('Next'));
  expect(screen.getByText('25% Done')).toBeInTheDocument();
 });
 it('does not invent a loading state for the synchronous empty tree',()=>{
  const {container}=render(<MilestoneProgressTree/>);
  expect(container).toBeEmptyDOMElement();
 });
 it('renders complete, active and empty stages and toggles expansion',()=>{
  const update=vi.fn(),practice=vi.fn(),tutor=vi.fn();
  render(<MilestoneProgressTree milestones={milestones} planId={3} subject="Algorithms" onUpdateProgress={update} onStartPractice={practice} onAskTutor={tutor}/>);
  expect(screen.getByText('Completed')).toBeInTheDocument();
  fireEvent.click(screen.getAllByTitle('Mark as incomplete')[0]);
  expect(update).toHaveBeenLastCalledWith({plan_id:3,milestone_id:'a',subtopic_name:'Done',subtopic_completed:false});
  fireEvent.click(screen.getAllByTitle('Mark as completed')[0]);
  expect(update).toHaveBeenLastCalledWith({plan_id:3,milestone_id:'a',subtopic_name:'Next',subtopic_completed:true});
  fireEvent.click(screen.getAllByRole('button',{name:'Practice Challenge'})[0]);
  expect(practice).toHaveBeenCalledWith('Next');
  fireEvent.click(screen.getAllByRole('button',{name:'Ask AI Tutor'})[0]);
  expect(tutor).toHaveBeenCalledWith('Next');
  expect(screen.getAllByRole('link',{name:'Watch Explainer'})[0]).toHaveAttribute('href',expect.stringContaining('Algorithms%20Next'));
  fireEvent.click(screen.getByText('Stage 1: Basics'));
  expect(screen.queryByText('Guide')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('Stage 1: Basics'));
  expect(screen.getByText('Guide')).toBeInTheDocument();
 });
});
