import React, { useState } from 'react';
import { LogIn, LogOut, User, ChevronDown, Settings, Menu } from 'lucide-react';
import GlobalSearch from './common/GlobalSearch';
import NotificationDropdown from './common/NotificationDropdown';
import { layout } from '../theme/designTokens.js';

export default function TopHeader({
  userName = 'Student',
  userEmail = '',
  onOpenAuth,
  onLogout,
  isAuthenticated = false,
  onOpenSettings,
  activeNav = 'Dashboard',
  onNavigate = () => {},
  topics = [],
  customPlan = null,
  customPlans = [],
  recommendations = [],
  user = null,
  onToggleMobileDrawer,
}) {
  const [showMenu, setShowMenu] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const [greeting] = useState(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  });

  const isDashboard = activeNav === 'Dashboard';

  return (
    <header
      className="top-header-bar"
      style={{
        height: `${layout.topbarHeight}px`,
        minHeight: `${layout.topbarHeight}px`,
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'var(--bg-shell, #161618)',
        borderBottom: '1px solid var(--border-stroke, #2D2D35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        boxSizing: 'border-box',
      }}
    >
      {/* Left Area: Mobile Drawer Toggle + Breadcrumb / Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onToggleMobileDrawer && (
          <button
            type="button"
            onClick={onToggleMobileDrawer}
            aria-label="Toggle navigation drawer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary, #9CA3AF)',
              padding: '6px',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            <Menu size={20} />
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#818cf8',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              padding: '2px 8px',
              borderRadius: '5px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Cipherium AI
          </span>
          <span style={{ color: 'var(--border-stroke, #2D2D35)', fontSize: '0.8rem' }}>/</span>
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--text-secondary, #94a3b8)',
              letterSpacing: '0.02em',
            }}
          >
            {activeNav}
          </span>

          {/* Show personalized greeting ONLY on Dashboard */}
          {isDashboard && (
            <>
              <span style={{ color: 'var(--border-stroke, #2D2D35)', fontSize: '0.8rem' }}>·</span>
              <span
                style={{
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  color: 'var(--text-primary, #F3F4F6)',
                  letterSpacing: '-0.01em',
                }}
              >
                {greeting}, {userName}! 👋
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right Area: Search, Notifications, Profile Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <GlobalSearch
          onNavigate={onNavigate}
          topics={topics}
          customPlan={customPlan}
          customPlans={customPlans}
          recommendations={recommendations}
        />

        <NotificationDropdown
          user={user || (userEmail ? { email: userEmail, name: userName } : null)}
          onNavigate={onNavigate}
          onOpenSettings={onOpenSettings}
        />

        {/* User Account / Auth Dropdown */}
        <div style={{ position: 'relative' }}>
          {isAuthenticated ? (
            <div
              onClick={() => setShowMenu(!showMenu)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setShowMenu(!showMenu);
              }}
              aria-label="User profile menu"
              aria-expanded={showMenu}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-surface, #1E1E22)',
                border: '1px solid var(--border-stroke, #2D2D35)',
                padding: '4px 10px 4px 5px',
                borderRadius: '8px',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'border-color 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  background: '#4F46E5',
                  color: '#fff',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {getInitials(userName)}
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary, #F3F4F6)' }}>
                {userName}
              </span>
              <ChevronDown size={13} color="#9CA3AF" />
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="btn btn-primary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LogIn size={14} /> Sign In
            </button>
          )}

          {/* Account Popover Menu */}
          {showMenu && isAuthenticated && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '40px',
                width: '210px',
                background: 'var(--bg-surface-elevated, #222226)',
                borderRadius: '8px',
                border: '1px solid var(--border-stroke, #2D2D35)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.65)',
                padding: '6px',
                zIndex: 100,
              }}
            >
              <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-stroke, #2D2D35)' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F3F4F6' }}>{userName}</div>
                <div style={{ fontSize: '0.72rem', color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {userEmail || 'student@cipherium.ai'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onOpenAuth();
                }}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.8rem',
                  color: '#F3F4F6',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover, #2A2A30)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <User size={14} color="#9CA3AF" /> Switch Account
              </button>

              {onOpenSettings && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onOpenSettings();
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.8rem',
                    color: '#F3F4F6',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover, #2A2A30)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Settings size={14} color="#9CA3AF" /> Settings & Preferences
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  onLogout();
                }}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.8rem',
                  color: '#EF4444',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
