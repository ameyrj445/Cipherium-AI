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
  ChevronDown,
} from 'lucide-react';

export default function Sidebar({
  activeNav,
  setActiveNav,
  handleOpenQuiz,
  user,
  width = 220,
  onResizeDragStart,
  onResizeReset,
  isResizing,
  onOpenAuth,
}) {
  const collapsed = width < 100;

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Learn', icon: BookOpen },
    { name: 'Practice', icon: Zap },
    { name: 'Study Plan', icon: Compass },
    { name: 'Analytics', icon: BarChart2 },
    { name: 'Resources', icon: FolderKanban },
    { name: 'AI Tutor', icon: Brain },
  ];

  return (
    <aside
      className="sidebar-dark"
      style={{
        width: `${width}px`,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: collapsed ? '24px 8px' : '24px 14px',
        flexShrink: 0,
        position: 'relative',
        transition: isResizing ? 'none' : 'padding 0.15s ease',
        overflow: 'hidden',
      }}
    >
      {/* ── Drag Handle (right edge) ── */}
      <div
        onMouseDown={onResizeDragStart}
        onDoubleClick={onResizeReset}
        title="Drag to resize · Double-click to reset"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '6px',
          height: '100%',
          cursor: 'ew-resize',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Visual grip dot strip */}
        <div
          style={{
            width: '3px',
            height: '48px',
            borderRadius: '3px',
            background: isResizing ? '#3b82f6' : 'rgba(255,255,255,0.18)',
            transition: 'background 0.15s ease',
          }}
        />
      </div>

      <div>
        {/* Logo & Platform Name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: collapsed ? '0' : '0 8px',
            marginBottom: '28px',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ec4899, #8b5cf6, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Brain size={22} color="#fff" />
          </div>
          {!collapsed && (
            <div>
              <div
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: '#fff',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                }}
              >
                Cipherium AI
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                Learn Smarter, Go Further
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
                onClick={() => {
                  setActiveNav(item.name);
                  if (item.name === 'Practice') handleOpenQuiz();
                }}
                title={collapsed ? item.name : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: collapsed ? 0 : '12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '11px' : '11px 14px',
                  borderRadius: '12px',
                  background: isActive ? '#1e3a8a' : 'transparent',
                  color: isActive ? '#60a5fa' : '#94a3b8',
                  border: 'none',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  width: '100%',
                }}
              >
                <Icon size={18} color={isActive ? '#60a5fa' : '#94a3b8'} />
                {!collapsed && item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer: Settings & Profile */}
      <div>
        <button
          title={collapsed ? 'Settings' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? 0 : '12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '10px' : '10px 14px',
            borderRadius: '12px',
            color: '#94a3b8',
            background: 'transparent',
            border: 'none',
            fontSize: '0.86rem',
            cursor: 'pointer',
            width: '100%',
            marginBottom: '16px',
          }}
        >
          <Settings size={18} />
          {!collapsed && 'Settings'}
        </button>

        <div
          onClick={onOpenAuth}
          title="Account profile / Switch account"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: collapsed ? '8px' : '10px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '14px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            cursor: 'pointer',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.86rem',
              flexShrink: 0,
            }}
          >
            {user?.name ? user.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() : 'AJ'}
          </div>
          {!collapsed && (
            <>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}
                >
                  {user?.name || 'Student Account'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  {user?.email ? user.email.split('@')[0] : 'Click to sign in'}
                </div>
              </div>
              <ChevronDown size={14} color="#64748b" />
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
