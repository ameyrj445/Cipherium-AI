import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TopHeader from '../components/TopHeader';
import ResourcesFullView from '../components/ResourcesFullView';
import PracticeView from '../components/PracticeView';
import AnalyticsFullView from '../components/AnalyticsFullView';
import SettingsView from '../components/SettingsView';
import LoginScreen from '../components/LoginScreen';

describe('Page Titles and Tagging Verification', () => {
  it('renders breadcrumb tagging in TopHeader', () => {
    render(<TopHeader userName="Amey" activeNav="Dashboard" />);
    expect(screen.getByText('Cipherium AI')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Amey!/)).toBeInTheDocument();
  });

  it('renders eyebrow category tag and proper title in ResourcesFullView', () => {
    render(<ResourcesFullView recommendations={[]} customPlan={null} />);
    expect(screen.getByText('CURATED LEARNING REPOSITORY')).toBeInTheDocument();
    expect(screen.getByText('Curated Learning & Practice Library')).toBeInTheDocument();
  });

  it('renders eyebrow tag and proper title in PracticeView', () => {
    render(
      <PracticeView
        plans={[]}
        topics={[]}
        currentQuestion={{ id: 1, question_text: 'What is a stack?', topic_name: 'DSA', difficulty: 2, options: ['LIFO', 'FIFO'] }}
        selectedOption=""
      />
    );
    expect(screen.getByText('ADAPTIVE PRACTICE & EVALUATION')).toBeInTheDocument();
    expect(screen.getByText('Adaptive Practice & Diagnostic Evaluation')).toBeInTheDocument();
  });

  it('renders eyebrow tag and proper title in AnalyticsFullView', () => {
    render(<AnalyticsFullView analytics={null} plans={[]} />);
    expect(screen.getByText('PERFORMANCE INTELLIGENCE & ML DIAGNOSTICS')).toBeInTheDocument();
    expect(screen.getByText('Curriculum Mastery & Performance Analytics')).toBeInTheDocument();
  });

  it('renders eyebrow tag and proper title in SettingsView', () => {
    render(<SettingsView user={{ name: 'Alex', email: 'alex@example.com' }} />);
    expect(screen.getByText('ACCOUNT & WORKSPACE CONFIGURATION')).toBeInTheDocument();
    expect(screen.getByText('Settings & Preferences')).toBeInTheDocument();
  });

  it('renders eyebrow category badges in LoginScreen', () => {
    render(
      <LoginScreen
        authMode="login"
        setAuthMode={() => {}}
        authName=""
        setAuthName={() => {}}
        authEmail=""
        setAuthEmail={() => {}}
        authPassword=""
        setAuthPassword={() => {}}
        authError=""
        setAuthError={() => {}}
        handleAuth={() => {}}
      />
    );
    expect(screen.getByText('Adaptive Academic Mastery Platform')).toBeInTheDocument();
    expect(screen.getByText('Authentication & Access')).toBeInTheDocument();
    expect(screen.getByText('Sign In to Workspace')).toBeInTheDocument();
  });
});
