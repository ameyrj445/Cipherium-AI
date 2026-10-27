import React from 'react';
import { Brain, Lock, Mail, User, ArrowRight, X } from 'lucide-react';

export default function AuthModal({
  isOpen = true,
  onClose,
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
  if (!isOpen) return null;

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
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(18, 18, 20, 0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="ui-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--bg-surface, #1E1E22)',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          position: 'relative',
          border: '1px solid var(--border-stroke, #2D2D35)',
          color: 'var(--text-primary, #F3F4F6)',
        }}
      >
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              border: '1px solid var(--border-stroke, #2D2D35)',
              background: 'var(--bg-shell, #161618)',
              width: '30px',
              height: '30px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary, #9CA3AF)',
            }}
          >
            <X size={16} />
          </button>
        )}

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#ffffff',
              boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)',
              marginBottom: '12px',
            }}
          >
            <Brain size={24} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary, #F3F4F6)', margin: 0 }}>
            {authMode === 'login' ? 'Welcome to Cipherium AI' : 'Join Cipherium AI'}
          </h2>
          <p style={{ color: 'var(--text-secondary, #9CA3AF)', fontSize: '0.82rem', marginTop: '6px' }}>
            {authMode === 'login'
              ? 'Sign in to access your personalized study plans and progress'
              : 'Create an account to track roadmaps, mastery, and resources'}
          </p>
        </div>

        {/* Auth Mode Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-shell, #161618)',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '20px',
            border: '1px solid var(--border-stroke, #2D2D35)',
          }}
        >
          <button
            type="button"
            onClick={() => { setAuthMode('login'); setAuthError(''); }}
            style={{
              flex: 1,
              padding: '9px',
              borderRadius: '8px',
              border: authMode === 'login' ? '1px solid var(--border-stroke, #2D2D35)' : '1px solid transparent',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: authMode === 'login' ? 'var(--bg-surface, #1E1E22)' : 'transparent',
              color: authMode === 'login' ? 'var(--text-primary, #F3F4F6)' : 'var(--text-secondary, #9CA3AF)',
              boxShadow: authMode === 'login' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
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
              borderRadius: '8px',
              border: authMode === 'register' ? '1px solid var(--border-stroke, #2D2D35)' : '1px solid transparent',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: authMode === 'register' ? 'var(--bg-surface, #1E1E22)' : 'transparent',
              color: authMode === 'register' ? 'var(--text-primary, #F3F4F6)' : 'var(--text-secondary, #9CA3AF)',
              boxShadow: authMode === 'register' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error message */}
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
                placeholder="you@domain.com"
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
              padding: '12px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              background: '#6366f1',
              border: '1px solid #6366f1',
            }}
          >
            {loading ? 'Authenticating...' : authMode === 'login' ? 'Sign In to Workspace' : 'Create Account'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Demo Fast-Login Pill */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-stroke, #2D2D35)', textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleQuickDemo}
            style={{
              background: 'var(--bg-shell, #161618)',
              border: '1px solid var(--border-stroke, #2D2D35)',
              padding: '7px 14px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: '#818cf8',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <User size={13} color="#818cf8" /> Quick Fill Demo Account
          </button>
        </div>
      </div>
    </div>
  );
}
