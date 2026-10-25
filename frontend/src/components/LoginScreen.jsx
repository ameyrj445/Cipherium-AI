import React from 'react';
import {
  Brain,
  Lock,
  Mail,
  User,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  ShieldCheck,
} from 'lucide-react';

export default function LoginScreen({
  authMode = 'login',
  setAuthMode,
  authName,
  setAuthName,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authError,
  setAuthError,
  handleAuth,
  loading = false,
}) {
  const handleQuickDemo = () => {
    setAuthEmail('student@cipherium.ai');
    setAuthPassword('cipherium123');
    setAuthName('Amey Jain');
    setAuthMode('login');
    setAuthError('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        background: 'var(--bg-canvas, #121214)',
        color: 'var(--text-primary, #F3F4F6)',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Main Container */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.15fr 1fr',
          width: '100%',
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '48px 36px',
          alignItems: 'center',
          gap: '48px',
          zIndex: 1,
        }}
      >
        {/* Left Column: Brand & Feature Showcase */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Logo badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Brain size={26} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
                Cipherium AI
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary, #9CA3AF)', letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: '4px' }}>
                Academic Mastery & Roadmap Engine
              </div>
            </div>
          </div>

          {/* Heading */}
          <div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                padding: '3px 10px',
                borderRadius: '6px',
                fontSize: '0.74rem',
                color: '#818cf8',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}
            >
              Adaptive Academic Mastery Platform
            </span>
            <h1
              style={{
                fontSize: '2.4rem',
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary, #F3F4F6)',
                marginBottom: '14px',
              }}
            >
              Master Any Subject with Tailored Roadmaps & Curated Resources
            </h1>
            <p style={{ color: 'var(--text-secondary, #9CA3AF)', fontSize: '0.96rem', lineHeight: 1.6, maxWidth: '520px' }}>
              Sign in to unlock your personalized curriculum, real-time subtopics checklist, and high-quality learning materials curated from GeeksForGeeks, LeetCode, NeetCode, and YouTube.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div
              style={{
                background: 'var(--bg-surface, #1E1E22)',
                border: '1px solid var(--border-stroke, #2D2D35)',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: 'var(--bg-shell, #161618)',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                }}
              >
                <Compass size={18} />
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '4px', color: 'var(--text-primary, #F3F4F6)' }}>
                Custom Study Plans
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #9CA3AF)', lineHeight: 1.45 }}>
                Enter any subject and get a multi-week roadmap scaled to your weekly hours budget.
              </div>
            </div>

            <div
              style={{
                background: 'var(--bg-surface, #1E1E22)',
                border: '1px solid var(--border-stroke, #2D2D35)',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: 'var(--bg-shell, #161618)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                }}
              >
                <BookOpen size={18} />
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '4px', color: 'var(--text-primary, #F3F4F6)' }}>
                Curated Internet Sources
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #9CA3AF)', lineHeight: 1.45 }}>
                Real links to GeeksforGeeks, LeetCode, NeetCode, Abdul Bari, and Striver videos.
              </div>
            </div>

            <div
              style={{
                background: 'var(--bg-surface, #1E1E22)',
                border: '1px solid var(--border-stroke, #2D2D35)',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: 'var(--bg-shell, #161618)',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                }}
              >
                <CheckCircle2 size={18} />
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '4px', color: 'var(--text-primary, #F3F4F6)' }}>
                Two-Way Tracker
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #9CA3AF)', lineHeight: 1.45 }}>
                Check off subtopics and practice tasks; progress syncs to your account database.
              </div>
            </div>

            <div
              style={{
                background: 'var(--bg-surface, #1E1E22)',
                border: '1px solid var(--border-stroke, #2D2D35)',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: 'var(--bg-shell, #161618)',
                  color: '#a855f7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                }}
              >
                <Brain size={18} />
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '4px', color: 'var(--text-primary, #F3F4F6)' }}>
                AI Academic Tutor
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #9CA3AF)', lineHeight: 1.45 }}>
                Intelligent tutoring with code explanations grounded in your curriculum.
              </div>
            </div>
          </div>

          {/* Social Proof Footer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: '#64748b' }}>
            <ShieldCheck size={16} color="#10b981" />
            <span>Secure Database Persistence • JWT Encrypted • Personalized Workspace</span>
          </div>
        </div>

        {/* Right Column: Authentication Card */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: '100%',
              maxWidth: '430px',
              background: 'var(--bg-surface, #1E1E22)',
              borderRadius: '12px',
              padding: '32px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              border: '1px solid var(--border-stroke, #2D2D35)',
              color: 'var(--text-primary, #F3F4F6)',
              position: 'relative',
            }}
          >
            {/* Header inside card */}
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: '#ffffff',
                  marginBottom: '12px',
                }}
              >
                <Lock size={20} />
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: '#818cf8',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    display: 'inline-block',
                  }}
                >
                  {authMode === 'login' ? 'Authentication & Access' : 'New Student Onboarding'}
                </span>
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary, #F3F4F6)', margin: 0 }}>
                {authMode === 'login' ? 'Sign In to Workspace' : 'Create Student Account'}
              </h2>
              <p style={{ color: 'var(--text-secondary, #9CA3AF)', fontSize: '0.82rem', marginTop: '6px' }}>
                {authMode === 'login'
                  ? 'Access your personalized study roadmaps and analytics'
                  : 'Start tracking your custom learning journey'}
              </p>
            </div>

            {/* Auth Mode Toggle Tabs */}
            <div
              style={{
                display: 'flex',
                background: 'var(--bg-shell, #161618)',
                padding: '3px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid var(--border-stroke, #2D2D35)',
              }}
            >
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: authMode === 'login' ? '1px solid var(--border-stroke, #2D2D35)' : '1px solid transparent',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: authMode === 'login' ? 'var(--bg-surface, #1E1E22)' : 'transparent',
                  color: authMode === 'login' ? 'var(--text-primary, #F3F4F6)' : 'var(--text-secondary, #9CA3AF)',
                  boxShadow: authMode === 'login' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                  transition: 'background-color 0.15s ease, color 0.15s ease',
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setAuthError(''); }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: authMode === 'register' ? '1px solid var(--border-stroke, #2D2D35)' : '1px solid transparent',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: authMode === 'register' ? 'var(--bg-surface, #1E1E22)' : 'transparent',
                  color: authMode === 'register' ? 'var(--text-primary, #F3F4F6)' : 'var(--text-secondary, #9CA3AF)',
                  boxShadow: authMode === 'register' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                  transition: 'background-color 0.15s ease, color 0.15s ease',
                }}
              >
                Register
              </button>
            </div>

            {/* Error Message */}
            {authError && (
              <div
                style={{
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  color: '#fb7185',
                  fontSize: '0.82rem',
                  marginBottom: '16px',
                }}
              >
                {authError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {authMode === 'register' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary, #F3F4F6)', marginBottom: '5px' }}>
                    Full Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} color="var(--text-secondary, #9CA3AF)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amey Jain"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px 10px 38px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-stroke, #2D2D35)',
                        background: 'var(--bg-shell, #161618)',
                        fontSize: '0.88rem',
                        outline: 'none',
                        color: 'var(--text-primary, #F3F4F6)',
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary, #F3F4F6)', marginBottom: '5px' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="var(--text-secondary, #9CA3AF)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    required
                    placeholder="student@cipherium.ai"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-stroke, #2D2D35)',
                      background: 'var(--bg-shell, #161618)',
                      fontSize: '0.88rem',
                      outline: 'none',
                      color: 'var(--text-primary, #F3F4F6)',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary, #F3F4F6)', marginBottom: '5px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="var(--text-secondary, #9CA3AF)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-stroke, #2D2D35)',
                      background: 'var(--bg-shell, #161618)',
                      fontSize: '0.88rem',
                      outline: 'none',
                      color: 'var(--text-primary, #F3F4F6)',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  marginTop: '8px',
                  padding: '11px',
                  borderRadius: '8px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  background: '#6366f1',
                  border: '1px solid #6366f1',
                  width: '100%',
                }}
              >
                {loading ? 'Authenticating...' : authMode === 'login' ? 'Sign In & Open Workspace' : 'Create Account & Start'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            {/* Fast Demo One-Click Fill */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-stroke, #2D2D35)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #9CA3AF)', marginBottom: '8px' }}>
                Want to test immediately?
              </div>
              <button
                type="button"
                onClick={handleQuickDemo}
                style={{
                  background: 'var(--bg-shell, #161618)',
                  border: '1px solid var(--border-stroke, #2D2D35)',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  color: '#818cf8',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover, #2A2A30)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-shell, #161618)'}
              >
                <User size={13} color="#818cf8" /> Quick-Fill Demo Student Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
