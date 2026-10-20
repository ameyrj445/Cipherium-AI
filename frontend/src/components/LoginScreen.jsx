import React from 'react';
import {
  Brain,
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Compass,
  Zap,
  Layers,
  ShieldCheck,
  Star
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
        background: 'linear-gradient(135deg, #0b1329 0%, #1e1b4b 50%, #0f172a 100%)',
        color: '#ffffff',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background ambient lighting effects */}
      <div
        style={{
          position: 'absolute',
          top: '-150px',
          left: '-150px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-120px',
          right: '-120px',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.22) 0%, transparent 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
        }}
      />

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
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #ec4899, #8b5cf6, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 25px -4px rgba(139, 92, 246, 0.5)',
              }}
            >
              <Brain size={28} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>
                Cipherium AI
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: '4px' }}>
                Adaptive Learning & Academic Mastery
              </div>
            </div>
          </div>

          {/* Heading */}
          <div>
            <h1
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                lineHeight: 1.2,
                letterSpacing: '-0.03em',
                background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '14px',
              }}
            >
              Master Any Subject with AI Roadmaps & Curated Resources
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: 1.6, maxWidth: '520px' }}>
              Sign in to unlock your personalized curriculum, real-time subtopics checklist, and high-quality learning materials curated from GeeksForGeeks, LeetCode, NeetCode, and YouTube.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '18px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                }}
              >
                <Compass size={20} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '4px' }}>
                Custom Study Plans
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                Enter any subject and get a multi-week roadmap scaled to your weekly hours budget.
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '18px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                }}
              >
                <BookOpen size={20} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '4px' }}>
                Curated Internet Sources
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                Real links to GeeksforGeeks, LeetCode, NeetCode, Abdul Bari, and Striver videos.
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '18px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                }}
              >
                <CheckCircle2 size={20} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '4px' }}>
                Two-Way Tracker
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                Check off subtopics and practice tasks; progress syncs to your account database.
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '18px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(168, 85, 247, 0.15)',
                  color: '#c084fc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                }}
              >
                <Sparkles size={20} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '4px' }}>
                AI Academic Tutor
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                24/7 intelligent tutoring with interactive code explanations and step-by-step guidance.
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
              maxWidth: '440px',
              background: '#ffffff',
              borderRadius: '24px',
              padding: '36px',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
              color: '#0f172a',
              position: 'relative',
            }}
          >
            {/* Header inside card */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  color: '#ffffff',
                  marginBottom: '12px',
                  boxShadow: '0 8px 16px rgba(37, 99, 235, 0.25)',
                }}
              >
                <Lock size={24} />
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {authMode === 'login' ? 'Sign In to Workspace' : 'Create Student Account'}
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '6px' }}>
                {authMode === 'login'
                  ? 'Access your personalized study roadmaps and analytics'
                  : 'Start tracking your custom learning journey'}
              </p>
            </div>

            {/* Auth Mode Toggle Tabs */}
            <div
              style={{
                display: 'flex',
                background: '#f1f5f9',
                padding: '4px',
                borderRadius: '12px',
                marginBottom: '20px',
              }}
            >
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: '9px',
                  border: 'none',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: authMode === 'login' ? '#ffffff' : 'transparent',
                  color: authMode === 'login' ? '#0f172a' : '#64748b',
                  boxShadow: authMode === 'login' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setAuthError(''); }}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: '9px',
                  border: 'none',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: authMode === 'register' ? '#ffffff' : 'transparent',
                  color: authMode === 'register' ? '#0f172a' : '#64748b',
                  boxShadow: authMode === 'register' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Register
              </button>
            </div>

            {/* Error Message */}
            {authError && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  color: '#dc2626',
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
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Full Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amey Jain"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px 10px 38px',
                        borderRadius: '10px',
                        border: '1.5px solid #e2e8f0',
                        fontSize: '0.88rem',
                        outline: 'none',
                        color: '#0f172a',
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    required
                    placeholder="student@cipherium.ai"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      borderRadius: '10px',
                      border: '1.5px solid #e2e8f0',
                      fontSize: '0.88rem',
                      outline: 'none',
                      color: '#0f172a',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      borderRadius: '10px',
                      border: '1.5px solid #e2e8f0',
                      fontSize: '0.88rem',
                      outline: 'none',
                      color: '#0f172a',
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
                  padding: '13px',
                  borderRadius: '12px',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                }}
              >
                {loading ? 'Authenticating...' : authMode === 'login' ? 'Sign In & Open Workspace' : 'Create Account & Start'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            {/* Fast Demo One-Click Fill */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '8px' }}>
                Want to test immediately?
              </div>
              <button
                type="button"
                onClick={handleQuickDemo}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  color: '#2563eb',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
              >
                <Sparkles size={13} color="#2563eb" /> Quick-Fill Demo Student Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
