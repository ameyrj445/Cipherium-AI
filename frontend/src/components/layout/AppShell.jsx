import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../Sidebar';
import TopHeader from '../TopHeader';
import { breakpoints, layout } from '../../theme/designTokens.js';

/**
 * AppShell
 *
 * Global layout wrapper for every route in Cipherium AI.
 * - Fixed left sidebar (240px expanded, 72px collapsed), state persisted in localStorage
 * - Slim sticky top bar (56px)
 * - Fluid main content area filling remaining width and height
 * - Mobile drawer mode on screens < 768px
 */
export default function AppShell({
  children,
  activeNav = 'Dashboard',
  setActiveNav = () => {},
  handleOpenQuiz = () => {},
  user = null,
  token = '',
  onOpenAuth = () => {},
  onLogout = () => {},
  onOpenSettings = () => {},
  onNavigate = () => {},
  topics = [],
  customPlan = null,
  customPlans = [],
  recommendations = [],
}) {
  // Persist sidebar collapsed state
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('cipherium_sidebar_collapsed');
        if (saved !== null) return JSON.parse(saved);
        return window.innerWidth < breakpoints.xl;
      } catch (e) {
        return false;
      }
    }
    return false;
  });

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoints.md;
  });

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const drawerRef = useRef(null);
  const mainRef = useRef(null);

  useEffect(() => {
    if (!isMobile || !mobileDrawerOpen) return;
    const drawer = drawerRef.current;
    const previousFocus = document.activeElement;
    const focusable = () => Array.from(drawer.querySelectorAll(
      'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
    )).filter((element) => !element.closest('[hidden], [inert]'));
    const focusFirst = () => (focusable()[0] || drawer).focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMobileDrawerOpen(false);
      } else if (event.key === 'Tab') {
        const items = focusable();
        const first = items[0];
        const last = items[items.length - 1];
        if (!first) {
          event.preventDefault();
          drawer.focus();
        } else if (event.shiftKey && (document.activeElement === first || !drawer.contains(document.activeElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !drawer.contains(document.activeElement))) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const onFocusIn = (event) => {
      if (!drawer.contains(event.target)) focusFirst();
    };
    focusFirst();
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focusin', onFocusIn);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [isMobile, mobileDrawerOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const mobile = window.innerWidth < breakpoints.md;
      setIsMobile(mobile);
      if (mobile) {
        setMobileDrawerOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('cipherium_sidebar_collapsed', JSON.stringify(next));
      } catch (e) {
        // Ignore localStorage error
      }
      return next;
    });
  };

  const sidebarWidth = isMobile
    ? 0
    : collapsed
    ? layout.sidebarCollapsed
    : layout.sidebarExpanded;

  return (
    <div
      className="app-shell"
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg-canvas, #121214)',
        color: 'var(--text-primary, #F3F4F6)',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
        <a
          href="#main-content"
          inert={isMobile && mobileDrawerOpen ? true : undefined}
          aria-hidden={isMobile && mobileDrawerOpen ? true : undefined}
          className="skip-to-content"
          onClick={(event) => { event.preventDefault(); mainRef.current?.focus(); }}
        >Skip to main content</a>
      {/* 1. Left Fixed Sidebar (Desktop / Tablet) */}
      {!isMobile && (
        <Sidebar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          handleOpenQuiz={handleOpenQuiz}
          user={user}
          collapsed={collapsed}
          onToggleCollapse={handleToggleCollapse}
          onOpenAuth={onOpenAuth}
          onLogout={onLogout}
        />
      )}

      {/* Mobile Drawer (Screens < 768px) */}
      {isMobile && mobileDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 200,
          }}
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setMobileDrawerOpen(false)}
              style={{ position: 'fixed', top: '8px', left: '250px', zIndex: 201, minWidth: '44px', minHeight: '44px', padding: '8px', borderRadius: '8px', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--text-secondary)' }}
            >Close</button>
            <Sidebar
              activeNav={activeNav}
              setActiveNav={setActiveNav}
              handleOpenQuiz={handleOpenQuiz}
              user={user}
              collapsed={false}
              isMobileDrawer
              onCloseDrawer={() => setMobileDrawerOpen(false)}
              onOpenAuth={onOpenAuth}
              onLogout={onLogout}
            />
          </div>
        </div>
      )}

      {/* 2. Main Content Wrapper: Left Margin matches sidebar width */}
      <div
        inert={isMobile && mobileDrawerOpen ? true : undefined}
        aria-hidden={isMobile && mobileDrawerOpen ? true : undefined}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          marginLeft: `${sidebarWidth}px`,
          width: `calc(100% - ${sidebarWidth}px)`,
          minHeight: '100vh',
          transition: 'margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1), width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxSizing: 'border-box',
        }}
      >
        {/* Sticky 56px Top Header Bar */}
        <TopHeader
          userName={user?.name?.split(' ')[0] || 'Student'}
          userEmail={user?.email || ''}
          isAuthenticated={!!token}
          onOpenAuth={onOpenAuth}
          onLogout={onLogout}
          onOpenSettings={onOpenSettings}
          activeNav={activeNav}
          onNavigate={onNavigate}
          topics={topics}
          customPlan={customPlan}
          customPlans={customPlans}
          recommendations={recommendations}
          user={user}
          onToggleMobileDrawer={isMobile ? () => setMobileDrawerOpen(!mobileDrawerOpen) : undefined}
        />

        {/* Main Content Area filling remaining width and height */}
        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          style={{
            flex: 1,
            width: '100%',
            minHeight: `calc(100dvh - ${layout.topbarHeight}px)`,
            boxSizing: 'border-box',
            position: 'relative',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
