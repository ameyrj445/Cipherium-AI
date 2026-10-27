import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Zap,
  Compass,
  BarChart2,
  FolderKanban,
  Settings,
  Brain,
  Network,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { layout } from '../theme/designTokens.js';

export default function Sidebar({
  activeNav,
  setActiveNav,
  handleOpenQuiz,
  user,
  collapsed = false,
  onToggleCollapse,
  onOpenAuth,
  onLogout = () => {},
  isMobileDrawer = false,
  onCloseDrawer,
}) {
  const width = collapsed ? layout.sidebarCollapsed : layout.sidebarExpanded;

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Learn', icon: BookOpen },
    { name: 'Practice', icon: Zap },
    { name: 'Study Plan', icon: Compass },
    { name: 'Knowledge Graph', icon: Network },
    { name: 'Analytics', icon: BarChart2 },
    { name: 'Resources', icon: FolderKanban },
    { name: 'AI Tutor', icon: Brain },
  ];

  return (
    <aside
      className="sidebar-dark"
      aria-label="Main Navigation"
      style={{
        width: `${width}px`,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: collapsed ? '20px 8px' : '20px 14px',
        flexShrink: 0,
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1), padding 0.2s ease',
        overflowX: 'hidden',
        overflowY: 'auto',
        boxSizing: 'border-box',
        borderRight: '1px solid var(--border-stroke, #2D2D35)',
        background: 'var(--bg-shell, #161618)',
      }}
    >
      <div>
        {/* Logo & Platform Name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: collapsed ? '0' : '0 8px',
            marginBottom: '28px',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 10px rgba(99, 102, 241, 0.35)',
            }}
          >
            <Brain size={20} color="#fff" />
          </div>
          {!collapsed && (
            <div>
              <div
                style={{
                  fontSize: '1.02rem',
                  fontWeight: 800,
                  color: '#F3F4F6',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.15,
                }}
              >
                Cipherium AI
              </div>
              <div style={{ fontSize: '0.68rem', color: '#9CA3AF', marginTop: '2px', fontWeight: 500 }}>
                Academic Mastery
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.name;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => {
                  setActiveNav(item.name);
                  if (item.name === 'Practice' && handleOpenQuiz) handleOpenQuiz();
                  if (isMobileDrawer && onCloseDrawer) onCloseDrawer();
                }}
                title={collapsed ? item.name : undefined}
                aria-label={item.name}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: collapsed ? 0 : '12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '10px' : '10px 12px',
                  borderRadius: '8px',
                  background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: isActive ? '#F3F4F6' : '#9CA3AF',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid transparent',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--bg-hover, #2A2A30)';
                    e.currentTarget.style.color = '#F3F4F6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#9CA3AF';
                  }
                }}
              >
                <Icon size={18} color={isActive ? '#818CF8' : '#9CA3AF'} style={{ flexShrink: 0 }} />
                {!collapsed && <span>{item.name}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer: Toggle Collapse, Settings & Profile */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid var(--border-stroke, #2D2D35)',
              background: 'var(--bg-surface, #1E1E22)',
              color: '#9CA3AF',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
              marginBottom: '2px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover, #2A2A30)';
              e.currentTarget.style.color = '#F3F4F6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-surface, #1E1E22)';
              e.currentTarget.style.color = '#9CA3AF';
            }}
          >
            {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            setActiveNav('Settings');
            if (isMobileDrawer && onCloseDrawer) onCloseDrawer();
          }}
          title={collapsed ? 'Settings' : undefined}
          aria-label="Settings"
          aria-current={activeNav === 'Settings' ? 'page' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? 0 : '12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '9px' : '9px 12px',
            borderRadius: '8px',
            color: activeNav === 'Settings' ? '#F3F4F6' : '#9CA3AF',
            background: activeNav === 'Settings' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            border: activeNav === 'Settings' ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid transparent',
            fontSize: '0.86rem',
            fontWeight: activeNav === 'Settings' ? 600 : 500,
            cursor: 'pointer',
            width: '100%',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (activeNav !== 'Settings') {
              e.currentTarget.style.background = 'var(--bg-hover, #2A2A30)';
              e.currentTarget.style.color = '#F3F4F6';
            }
          }}
          onMouseLeave={(e) => {
            if (activeNav !== 'Settings') {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#9CA3AF';
            }
          }}
        >
          <Settings size={18} color={activeNav === 'Settings' ? '#818CF8' : '#9CA3AF'} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Settings</span>}
        </button>

        <button
          type="button"
          onClick={() => {
            if (onLogout) onLogout();
            if (isMobileDrawer && onCloseDrawer) onCloseDrawer();
          }}
          title={collapsed ? 'Log out' : undefined}
          aria-label="Log out"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? 0 : '12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '9px' : '9px 12px',
            borderRadius: '8px',
            color: '#9CA3AF',
            background: 'transparent',
            border: '1px solid transparent',
            fontSize: '0.86rem',
            fontWeight: 500,
            cursor: 'pointer',
            width: '100%',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(244, 63, 94, 0.12)';
            e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.25)';
            e.currentTarget.style.color = '#FB7185';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.color = '#9CA3AF';
          }}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}
