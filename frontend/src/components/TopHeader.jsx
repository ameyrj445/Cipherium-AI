import React, { useState } from 'react';
import { Search, Bell, LogIn, LogOut, User, ChevronDown } from 'lucide-react';

export default function TopHeader({
  userName = 'Student',
  userEmail = '',
  onOpenAuth,
  onLogout,
  isAuthenticated = false,
}) {
  const [showMenu, setShowMenu] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
          Good Morning, {userName}! 👋
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.86rem', marginTop: '2px', margin: 0 }}>
          Let's make progress on your personalized learning journey today.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Search bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#fff',
            border: '1px solid #e2e8f0',
            padding: '9px 16px',
            borderRadius: '24px',
            width: '320px',
          }}
        >
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search topics, roadmap, or concepts..."
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '0.84rem',
              width: '100%',
              color: '#0f172a',
            }}
          />
        </div>

        {/* Notifications */}
        <button
          title="Notifications"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#fff',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Bell size={17} color="#64748b" />
        </button>

        {/* User Account / Auth Dropdown */}
        <div style={{ position: 'relative' }}>
          {isAuthenticated ? (
            <div
              onClick={() => setShowMenu(!showMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#fff',
                border: '1px solid #e2e8f0',
                padding: '4px 10px 4px 6px',
                borderRadius: '24px',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  color: '#fff',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {getInitials(userName)}
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>{userName}</span>
              <ChevronDown size={14} color="#64748b" />
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LogIn size={15} /> Sign In
            </button>
          )}

          {/* Account Popover Menu */}
          {showMenu && isAuthenticated && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '46px',
                width: '210px',
                background: '#fff',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                padding: '8px',
                zIndex: 100,
              }}
            >
              <div style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>{userName}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {userEmail || 'student@cipherium.ai'}
                </div>
              </div>

              <button
                onClick={() => { setShowMenu(false); onOpenAuth(); }}
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
                  color: '#334155',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <User size={14} /> Switch Account
              </button>

              <button
                onClick={() => { setShowMenu(false); onLogout(); }}
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
                  color: '#ef4444',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
