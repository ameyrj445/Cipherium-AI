import { useEffect } from 'react';

/**
 * Metadata configuration for each view/page in Cipherium AI.
 */
export const PAGE_METADATA = {
  Login: {
    title: 'Sign In | Cipherium AI - Academic Mastery & Roadmap Engine',
    description: 'Sign in to Cipherium AI to access personalized learning roadmaps, adaptive quizzes, curriculum analytics, and AI tutoring.',
    keywords: 'sign in, login, cipherium ai, student access, study plan',
    badge: 'AUTHENTICATION & ACCESS',
  },
  Register: {
    title: 'Create Account | Cipherium AI - Academic Mastery & Roadmap Engine',
    description: 'Create your Cipherium AI account to begin adaptive learning, diagnostic assessments, and curated CS roadmaps.',
    keywords: 'register, create account, signup, cipherium ai, student onboarding',
    badge: 'STUDENT ONBOARDING',
  },
  Dashboard: {
    title: 'Dashboard | Cipherium AI - Academic Learning Platform',
    description: 'Personalized learning dashboard featuring active syllabus roadmaps, daily goals, quick analytics, and study metrics.',
    keywords: 'dashboard, learning overview, academic progress, daily streak, study metrics',
    badge: 'WORKSPACE OVERVIEW',
  },
  Learn: {
    title: 'Learn & Roadmaps | Cipherium AI - Curated Curricula & Tracker',
    description: 'Step-by-step curated computer science roadmaps with verified video masterclasses, technical guides, and interactive checklists.',
    keywords: 'learn, roadmaps, curriculum, data structures, algorithms, operating systems, networks',
    badge: 'CURRICULUM ROADMAPS & LEARNING TRACKER',
  },
  Practice: {
    title: 'Practice & Quizzes | Cipherium AI - Adaptive Diagnostic Assessments',
    description: 'Adaptive diagnostic quizzes and curated algorithmic coding problems matched to syllabus milestones.',
    keywords: 'practice, quizzes, diagnostic test, leetcode, coding challenges, dsa problems',
    badge: 'ADAPTIVE PRACTICE & EVALUATION',
  },
  'Study Plan': {
    title: 'Study Plan | Cipherium AI - AI Roadmap & Syllabus Generator',
    description: 'Generate multi-week personalized study blueprints customized by target weekly hours, difficulty level, and mastery objectives.',
    keywords: 'study plan, roadmap generator, syllabus builder, milestone tracker, weekly goals',
    badge: 'ACADEMIC STUDY PLAN & ROADMAP ENGINE',
  },
  Analytics: {
    title: 'Analytics & Mastery | Cipherium AI - ML Performance Diagnostics',
    description: 'Detailed analytics on curriculum mastery, ML-predicted weak topics, and study plan execution momentum.',
    keywords: 'analytics, mastery score, weak topic prediction, machine learning, retention, flashcards',
    badge: 'PERFORMANCE INTELLIGENCE & ML DIAGNOSTICS',
  },
  Resources: {
    title: 'Resources | Cipherium AI - Curated Academic Learning Library',
    description: 'Comprehensive repository of vetted articles, video masterclasses, cheatsheets, and coding problem sets.',
    keywords: 'resources, learning library, videos, articles, cheatsheets, leetcode, geeksforgeeks',
    badge: 'CURATED LEARNING REPOSITORY',
  },
  'AI Tutor': {
    title: 'AI Tutor | Cipherium AI - Curriculum-Grounded Assistant',
    description: 'Interactive AI pedagogical tutor powered by Gemini, grounded in syllabus topics for algorithmic walkthroughs and concept explanations.',
    keywords: 'ai tutor, pedagogical assistant, gemini ai, syllabus tutor, concept explanation',
    badge: 'AI PEDAGOGICAL ASSISTANT',
  },
  Settings: {
    title: 'Settings | Cipherium AI - Account & Learning Preferences',
    description: 'Customize student academic profile, AI tutor hyperparameters, study streak reminders, and export learning telemetry.',
    keywords: 'settings, user profile, ai hyperparameters, study reminders, telemetry',
    badge: 'ACCOUNT & WORKSPACE CONFIGURATION',
  },
};

/**
 * Custom hook to dynamically update document title and head metadata per page.
 */
export function useDocumentMetadata(pageKey, overrideTitle = null) {
  useEffect(() => {
    const meta = PAGE_METADATA[pageKey] || PAGE_METADATA.Dashboard;
    const finalTitle = overrideTitle || meta.title;

    // Update browser tab document title
    document.title = finalTitle;

    // Update meta description
    let descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
      descMeta.setAttribute('content', meta.description);
    }

    // Update meta keywords
    let keywordsMeta = document.querySelector('meta[name="keywords"]');
    if (keywordsMeta) {
      keywordsMeta.setAttribute('content', meta.keywords);
    }

    // Update OpenGraph Title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', finalTitle);
    }

    // Update Twitter Title
    let twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', finalTitle);
    }
  }, [pageKey, overrideTitle]);
}
