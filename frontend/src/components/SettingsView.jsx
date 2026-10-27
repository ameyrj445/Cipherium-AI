import React, { useState, useEffect } from 'react';
import {
  User, Brain, Bell, ShieldCheck, Download, RefreshCw,
  LogOut, Eye, EyeOff, CheckCircle2
} from 'lucide-react';
import SettingSection from './common/SettingSection';
import ToggleSwitch from './common/ToggleSwitch';
import PageContainer from './layout/PageContainer';
import PageHeader from './layout/PageHeader';
import { settingsAPI, geminiAPI } from '../services/api';

/**
 * Production-ready Settings & Configuration view for Cipherium AI.
 * Uses PageContainer, PageHeader, and a balanced wide responsive grid
 * to persist learner preferences, AI engine hyperparameters, and security controls.
 */
export default function SettingsView({
  user = null,
  aiModel = 'gemini-2.5-flash',
  setAiModel = () => {},
  sessionExpiresAt = null,
  onLogout = () => {},
  customPlan = null,
}) {
  const storageKey = user?.email ? `cipherium_settings_${user.email}` : 'cipherium_settings_default';

  // State initialization with localStorage fallback
  const [profile, setProfile] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return {
        targetRole: saved.targetRole || 'Full-Stack Software Engineer',
        weeklyHours: saved.weeklyHours || 6,
        difficultyMode: saved.difficultyMode || 'standard',
        dailyStreakReminder: saved.dailyStreakReminder !== false,
        diagnosticQuizAlert: saved.diagnosticQuizAlert !== false,
        weakTopicPing: saved.weakTopicPing !== false,
        customApiKey: saved.customApiKey || '',
      };
    } catch {
      return {
        targetRole: 'Full-Stack Software Engineer',
        weeklyHours: 6,
        difficultyMode: 'standard',
        dailyStreakReminder: true,
        diagnosticQuizAlert: true,
        weakTopicPing: true,
        customApiKey: '',
      };
    }
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [refreshStatus, setRefreshStatus] = useState('');
  const [geminiStatus, setGeminiStatus] = useState(null);

  // Sync with backend on component mount
  useEffect(() => {
    let mounted = true;
    settingsAPI.getProfileSettings()
      .then((res) => {
        if (mounted && res.data) {
          setProfile((prev) => ({
            ...prev,
            targetRole: res.data.target_role || prev.targetRole,
            weeklyHours: res.data.weekly_hours || prev.weeklyHours,
            difficultyMode: res.data.difficulty_mode || prev.difficultyMode,
            dailyStreakReminder: res.data.daily_streak_reminder !== false,
            diagnosticQuizAlert: res.data.diagnostic_quiz_alert !== false,
            weakTopicPing: res.data.weak_topic_ping !== false,
            customApiKey: res.data.custom_gemini_api_key || prev.customApiKey,
          }));
        }
      })
      .catch(() => {});

    geminiAPI.getStatus()
      .then((res) => {
        if (mounted && res.data) {
          setGeminiStatus(res.data);
        }
      })
      .catch(() => {});

    return () => { mounted = false; };
  }, []);

  // Auto-save settings on modification & persist to database
  const updateSetting = async (key, value) => {
    const next = { ...profile, [key]: value };
    setProfile(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
    setSaveStatus('Preferences saved');
    setTimeout(() => setSaveStatus(''), 2500);

    if (!user) return;

    try {
      await settingsAPI.updateProfileSettings({
        target_role: next.targetRole,
        weekly_hours: Number(next.weeklyHours),
        difficulty_mode: next.difficultyMode,
        daily_streak_reminder: next.dailyStreakReminder,
        diagnostic_quiz_alert: next.diagnosticQuizAlert,
        weak_topic_ping: next.weakTopicPing,
        custom_gemini_api_key: next.customApiKey || null,
      });

      if (key === 'customApiKey') {
        await geminiAPI.setKey(value);
        const statusRes = await geminiAPI.getStatus();
        if (statusRes.data) setGeminiStatus(statusRes.data);
      }
    } catch (err) {
      console.error('Failed to sync settings with server:', err);
    }
  };


  // Export Learning Telemetry as JSON
  const handleExportData = () => {
    const telemetry = {
      user: {
        name: user?.name || 'Student',
        email: user?.email || '',
        exportedAt: new Date().toISOString(),
      },
      settings: profile,
      activeModel: aiModel,
      activePlan: customPlan ? {
        subject: customPlan.subject,
        skillLevel: customPlan.skill_level,
        durationWeeks: customPlan.duration_weeks,
        completedHours: customPlan.completed_hours,
      } : null,
      platform: 'Cipherium AI v2.0',
    };

    const blob = new Blob([JSON.stringify(telemetry, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cipherium_telemetry_${(user?.email || 'student').split('@')[0]}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Safely refresh cached progress without dropping auth
  const handleRefreshCache = () => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('cipherium_learn_done') || key.startsWith('cipherium_custom_plans')) {
          localStorage.removeItem(key);
        }
      });
      setRefreshStatus('Cache refreshed cleanly');
      setTimeout(() => setRefreshStatus(''), 2500);
    } catch (e) {
      console.error('Error refreshing cache:', e);
    }
  };

  return (
    <PageContainer noGrid>
      {/* Header */}
      <PageHeader
        eyebrow="ACCOUNT & WORKSPACE CONFIGURATION"
        title="Settings & Preferences"
        description="Configure your academic targets, AI tutor hyperparameters, study reminders, and telemetry data."
        actions={
          saveStatus ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '20px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                fontSize: '0.78rem',
                fontWeight: 700,
              }}
            >
              <CheckCircle2 size={14} />
              <span>{saveStatus}</span>
            </div>
          ) : null
        }
      />

      {/* Balanced 2-Column Wide Grid for Settings Sections */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Column 1: Academic Profile & AI Engine */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* 1. Academic & Student Profile */}
          <SettingSection
            icon={User}
            title="Student & Academic Profile"
            description="Your identity and target learning pace across the Cipherium curriculum."
            badge={user?.email ? 'Verified Student' : 'Guest Account'}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary, #9CA3AF)', display: 'block', marginBottom: '6px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  readOnly
                  value={user?.name || 'Alex Chen'}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-shell, #161618)',
                    border: '1px solid var(--border-stroke, #2D2D35)',
                    color: 'var(--text-primary, #F3F4F6)',
                    fontSize: '0.84rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary, #9CA3AF)', display: 'block', marginBottom: '6px' }}>
                  Email Address
                </label>
                <input
                  type="text"
                  readOnly
                  value={user?.email || 'student@cipherium.ai'}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-shell, #161618)',
                    border: '1px solid var(--border-stroke, #2D2D35)',
                    color: 'var(--text-secondary, #9CA3AF)',
                    fontSize: '0.84rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary, #9CA3AF)', display: 'block', marginBottom: '6px' }}>
                  Target Role / Specialization
                </label>
                <select
                  value={profile.targetRole}
                  onChange={(e) => updateSetting('targetRole', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-shell, #161618)',
                    border: '1px solid var(--border-stroke, #2D2D35)',
                    color: 'var(--text-primary, #F3F4F6)',
                    fontSize: '0.84rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="Full-Stack Software Engineer">Full-Stack Software Engineer</option>
                  <option value="Machine Learning & AI Specialist">Machine Learning & AI Specialist</option>
                  <option value="Systems & Distributed Architect">Systems & Distributed Architect</option>
                  <option value="Computer Science Undergraduate">Computer Science Undergraduate</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary, #9CA3AF)', display: 'block', marginBottom: '6px' }}>
                  Weekly Study Goal (Hours)
                </label>
                <select
                  value={profile.weeklyHours}
                  onChange={(e) => updateSetting('weeklyHours', Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-shell, #161618)',
                    border: '1px solid var(--border-stroke, #2D2D35)',
                    color: 'var(--text-primary, #F3F4F6)',
                    fontSize: '0.84rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value={4}>4 Hours / Week (Casual Review)</option>
                  <option value={6}>6 Hours / Week (Recommended)</option>
                  <option value={8}>8 Hours / Week (Accelerated Sprint)</option>
                  <option value={12}>12 Hours / Week (Interview Prep)</option>
                  <option value={16}>16 Hours / Week (Intensive Bootcamp)</option>
                </select>
              </div>
            </div>
          </SettingSection>

          {/* 2. AI Intelligence & Tutor Configuration */}
          <SettingSection
            icon={Brain}
            title="AI Intelligence & Diagnostic Hyperparameters"
            description="Configure pedagogical grounding, model latency, and adaptive assessment behavior."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Model Switcher */}
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary, #9CA3AF)', display: 'block', marginBottom: '6px' }}>
                  AI Tutor Intelligence Tier
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tag: 'Fast · Low Latency (Recommended)' },
                    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', tag: 'Deep Reasoning · Step-by-Step' },
                  ].map((model) => (
                    <div
                      key={model.id}
                      onClick={() => setAiModel(model.id)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: aiModel === model.id ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-shell, #161618)',
                        border: `1px solid ${aiModel === model.id ? '#6366f1' : 'var(--border-stroke, #2D2D35)'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'border-color 0.15s ease',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary, #F3F4F6)' }}>
                          {model.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #9CA3AF)' }}>{model.tag}</div>
                      </div>
                      {aiModel === model.id && <CheckCircle2 size={16} color="#6366f1" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Diagnostic Staircase Tuning */}
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary, #9CA3AF)', display: 'block', marginBottom: '6px' }}>
                  Adaptive Diagnostic Behavior
                </label>
                <select
                  value={profile.difficultyMode}
                  onChange={(e) => updateSetting('difficultyMode', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-shell, #161618)',
                    border: '1px solid var(--border-stroke, #2D2D35)',
                    color: 'var(--text-primary, #F3F4F6)',
                    fontSize: '0.84rem',
                    outline: 'none',
                    marginBottom: '14px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="standard">Standard Staircase (Calibrated Promotion [1-5])</option>
                  <option value="rigorous">Rigorous (+2 Step-up on Consecutive Passes)</option>
                  <option value="gradual">Foundation First (Higher Weighting on Recency)</option>
                </select>

                {/* Custom API Key Input */}
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary, #9CA3AF)', display: 'block', marginBottom: '6px' }}>
                    Optional Custom Gemini API Key (Bring Your Own Key)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="AIzaSy... (leave blank to use server environment key)"
                      value={profile.customApiKey}
                      onChange={(e) => updateSetting('customApiKey', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 36px 9px 12px',
                        borderRadius: '8px',
                        background: 'var(--bg-shell, #161618)',
                        border: '1px solid var(--border-stroke, #2D2D35)',
                        color: 'var(--text-primary, #F3F4F6)',
                        fontSize: '0.82rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-tertiary, #6B7280)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title={showApiKey ? 'Hide Key' : 'Show Key'}
                    >
                      {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {geminiStatus && (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: geminiStatus.has_key ? '#10B981' : '#F59E0B',
                        }}
                      />
                      <span style={{ color: geminiStatus.has_key ? '#10B981' : '#F59E0B', fontWeight: 600 }}>
                        {geminiStatus.has_key ? `Cloud Gemini Active (${geminiStatus.masked_key || 'Configured'})` : 'Fallback Local Model (No API key set)'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </SettingSection>
        </div>

        {/* Column 2: Reminders & Telemetry */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* 3. Study Reminders & Alerts */}
          <SettingSection
            icon={Bell}
            title="Study Reminders & Retention Alerts"
            description="Schedule nudges to maintain memory consolidation and spaced repetition intervals."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <ToggleSwitch
                id="streak-toggle"
                checked={profile.dailyStreakReminder}
                onChange={(checked) => updateSetting('dailyStreakReminder', checked)}
                label="Daily Study Streak Alerts"
                description="Nudge when streak is in danger of resetting at 20:00 local time."
              />

              <ToggleSwitch
                id="quiz-alert-toggle"
                checked={profile.diagnosticQuizAlert}
                onChange={(checked) => updateSetting('diagnosticQuizAlert', checked)}
                label="Diagnostic Spaced Repetition Reminders"
                description="Notify when a topic’s recency score decays below mastery threshold."
              />

              <ToggleSwitch
                id="weak-topic-toggle"
                checked={profile.weakTopicPing}
                onChange={(checked) => updateSetting('weakTopicPing', checked)}
                label="ML Flash Fix Triage Notifications"
                description="Flag high-risk topics when the Random Forest predictor identifies knowledge gaps."
              />
            </div>
          </SettingSection>

          {/* 4. Data Telemetry & Session Management */}
          <SettingSection
            icon={ShieldCheck}
            title="Data Telemetry & Session Security"
            description="Inspect security tokens, export academic logs, or reset offline caching."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Active Session Info */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: 'var(--bg-shell, #161618)',
                  border: '1px solid var(--border-stroke, #2D2D35)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary, #F3F4F6)' }}>
                    Active JWT Authorization Session
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #9CA3AF)', marginTop: '2px' }}>
                    Expires: {sessionExpiresAt ? new Date(sessionExpiresAt).toLocaleString() : '12 hours from issue'} · Algorithm: HS256
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="btn btn-white"
                  style={{
                    fontSize: '0.76rem',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#fb7185',
                    borderColor: 'rgba(244, 63, 94, 0.3)',
                    cursor: 'pointer',
                  }}
                >
                  <LogOut size={13} />
                  <span>Sign Out</span>
                </button>
              </div>

              {/* Telemetry Actions */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="btn btn-primary"
                  style={{
                    fontSize: '0.78rem',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <Download size={14} />
                  <span>Export Telemetry (.JSON)</span>
                </button>

                <button
                  type="button"
                  onClick={handleRefreshCache}
                  className="btn btn-white"
                  style={{
                    fontSize: '0.78rem',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={14} />
                  <span>{refreshStatus || 'Refresh Local Roadmap Cache'}</span>
                </button>
              </div>
            </div>
          </SettingSection>
        </div>
      </div>
    </PageContainer>
  );
}
