import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bell, CheckCheck, Trash2, X, Brain, Zap,
  BookOpen, CheckCircle2, Sparkles, Settings
} from 'lucide-react';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    category: 'ml',
    badge: 'ML Alert',
    badgeColor: '#C084FC',
    badgeBg: 'rgba(168, 85, 247, 0.12)',
    iconType: 'Brain',
    title: 'ML Flash Fix: Binary Search Trees',
    message: 'Random Forest predictor flagged low mastery (42%). Review recommended.',
    targetView: 'Practice',
    targetPayload: { topic: 'Binary Search Trees' },
    time: '15m ago',
    unread: true,
  },
  {
    id: 'notif-2',
    category: 'streak',
    badge: 'Streak',
    badgeColor: '#FBBF24',
    badgeBg: 'rgba(245, 158, 11, 0.12)',
    iconType: 'Zap',
    title: 'Keep Your Daily Streak Active!',
    message: 'Complete today\'s diagnostic quiz before 20:00 to maintain your streak.',
    targetView: 'Practice',
    targetPayload: {},
    time: '1h ago',
    unread: true,
  },
  {
    id: 'notif-3',
    category: 'quiz',
    badge: 'Spaced Review',
    badgeColor: '#60A5FA',
    badgeBg: 'rgba(59, 130, 246, 0.12)',
    iconType: 'BookOpen',
    title: 'Diagnostic Review: Dynamic Programming',
    message: 'Recency score has decayed. Quick 3-question evaluation ready.',
    targetView: 'Practice',
    targetPayload: { topic: 'Dynamic Programming' },
    time: '3h ago',
    unread: true,
  },
  {
    id: 'notif-4',
    category: 'milestone',
    badge: 'Study Plan',
    badgeColor: '#34D399',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    iconType: 'CheckCircle2',
    title: 'Milestone Progress: Arrays & Two Pointers',
    message: 'You have completed 4 of 5 roadmap concepts in Stage 1.',
    targetView: 'Study Plan',
    targetPayload: {},
    time: 'Yesterday',
    unread: false,
  },
  {
    id: 'notif-5',
    category: 'ai',
    badge: 'AI Tutor',
    badgeColor: '#818CF8',
    badgeBg: 'rgba(99, 102, 241, 0.12)',
    iconType: 'Sparkles',
    title: 'Gemini Pedagogical Assistant',
    message: 'Ask Gemini to break down time complexities or visualize algorithm steps.',
    targetView: 'AI Tutor',
    targetPayload: {},
    time: '2d ago',
    unread: false,
  },
];

export default function NotificationDropdown({
  user = null,
  onNavigate = () => {},
  onOpenSettings = () => {},
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'unread'
  const containerRef = useRef(null);

  const storageKey = user?.email
    ? `cipherium_notifications_${user.email}`
    : 'cipherium_notifications_default';

  const settingsKey = user?.email
    ? `cipherium_settings_${user.email}`
    : 'cipherium_settings_default';

  // Read user settings for notification filter toggles
  const userPreferences = useMemo(() => {
    // Sync preferences when dropdown opens or settings key updates
    void isOpen;
    try {
      const saved = JSON.parse(localStorage.getItem(settingsKey) || '{}');
      return {
        dailyStreakReminder: saved.dailyStreakReminder !== false,
        diagnosticQuizAlert: saved.diagnosticQuizAlert !== false,
        weakTopicPing: saved.weakTopicPing !== false,
      };
    } catch {
      return {
        dailyStreakReminder: true,
        diagnosticQuizAlert: true,
        weakTopicPing: true,
      };
    }
  }, [settingsKey, isOpen]);

  // Notifications state loaded from localStorage
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
      return INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  // Persist notifications on modification
  const persistNotifications = (nextList) => {
    setNotifications(nextList);
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextList));
    } catch (err) {
      console.error('Failed to save notifications to storage:', err);
    }
  };

  // Filter notifications according to user settings in SettingsView
  const filteredBySettings = useMemo(() => {
    return notifications.filter((notif) => {
      if (notif.category === 'streak' && !userPreferences.dailyStreakReminder) return false;
      if (notif.category === 'quiz' && !userPreferences.diagnosticQuizAlert) return false;
      if (notif.category === 'ml' && !userPreferences.weakTopicPing) return false;
      return true;
    });
  }, [notifications, userPreferences]);

  // Tab filtering
  const displayedNotifications = useMemo(() => {
    if (activeTab === 'unread') {
      return filteredBySettings.filter((n) => n.unread);
    }
    return filteredBySettings;
  }, [filteredBySettings, activeTab]);

  const unreadCount = useMemo(() => {
    return filteredBySettings.filter((n) => n.unread).length;
  }, [filteredBySettings]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handlers
  const handleMarkAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, unread: false }));
    persistNotifications(updated);
  };

  const handleDismissOne = (e, notifId) => {
    e.stopPropagation();
    const updated = notifications.filter((n) => n.id !== notifId);
    persistNotifications(updated);
  };

  const handleClearAll = () => {
    persistNotifications([]);
  };

  const handleNotificationClick = (notif) => {
    // Mark as read
    const updated = notifications.map((n) => (n.id === notif.id ? { ...n, unread: false } : n));
    persistNotifications(updated);

    // Route to target view
    if (notif.targetView) {
      onNavigate(notif.targetView, notif.targetPayload);
    }
    setIsOpen(false);
  };

  const renderIcon = (type, color) => {
    switch (type) {
      case 'Brain':
        return <Brain size={15} color={color} />;
      case 'Zap':
        return <Zap size={15} color={color} />;
      case 'BookOpen':
        return <BookOpen size={15} color={color} />;
      case 'CheckCircle2':
        return <CheckCircle2 size={15} color={color} />;
      case 'Sparkles':
        return <Sparkles size={15} color={color} />;
      default:
        return <Bell size={15} color={color} />;
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        type="button"
        title="Notifications"
        aria-label="Notifications"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: isOpen ? '#2A2A30' : '#1E1E22',
          border: isOpen ? '1px solid #6366F1' : '1px solid #2D2D35',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.background = '#2A2A30';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.background = '#1E1E22';
        }}
      >
        <Bell size={16} color={isOpen ? '#818CF8' : '#9CA3AF'} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              minWidth: '17px',
              height: '17px',
              borderRadius: '999px',
              background: '#4F46E5',
              color: '#FFFFFF',
              fontSize: '0.62rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid #161618',
              boxShadow: '0 2px 6px rgba(79, 70, 229, 0.4)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Notification Center"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '380px',
            maxHeight: '480px',
            background: '#1A1A1E',
            border: '1px solid #2D2D35',
            borderRadius: '12px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.75)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #28282E',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#1F1F24',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#F3F4F6' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#818CF8',
                    padding: '2px 7px',
                    borderRadius: '10px',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#818CF8',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div
            style={{
              display: 'flex',
              padding: '8px 14px 4px',
              gap: '6px',
              borderBottom: '1px solid #24242A',
              background: '#1A1A1E',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              style={{
                background: activeTab === 'all' ? '#272730' : 'transparent',
                border: 'none',
                color: activeTab === 'all' ? '#F3F4F6' : '#9CA3AF',
                fontSize: '0.74rem',
                fontWeight: activeTab === 'all' ? 700 : 500,
                padding: '4px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              All ({filteredBySettings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              style={{
                background: activeTab === 'unread' ? '#272730' : 'transparent',
                border: 'none',
                color: activeTab === 'unread' ? '#F3F4F6' : '#9CA3AF',
                fontSize: '0.74rem',
                fontWeight: activeTab === 'unread' ? 700 : 500,
                padding: '4px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Scrollable Notifications List */}
          <div style={{ overflowY: 'auto', maxHeight: '340px', padding: '6px' }}>
            {displayedNotifications.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'rgba(99, 102, 241, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 10px',
                  }}
                >
                  <Bell size={20} color="#818CF8" />
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#F3F4F6', marginBottom: '3px' }}>
                  {activeTab === 'unread' ? 'No unread notifications' : 'All caught up! 🎉'}
                </div>
                <p style={{ fontSize: '0.74rem', color: '#9CA3AF', margin: 0 }}>
                  {activeTab === 'unread'
                    ? 'Check the "All" tab to view past learning updates.'
                    : 'No alerts or reminders pending at this time.'}
                </p>
              </div>
            ) : (
              displayedNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: notif.unread ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                    border: notif.unread ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent',
                    marginBottom: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = notif.unread ? 'rgba(99, 102, 241, 0.14)' : '#232329';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notif.unread ? 'rgba(99, 102, 241, 0.08)' : 'transparent';
                  }}
                >
                  {/* Category Icon */}
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      background: '#232329',
                      border: '1px solid #2F2F38',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {renderIcon(notif.iconType, notif.badgeColor)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          color: notif.badgeColor,
                          background: notif.badgeBg,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {notif.badge}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#6B7280' }}>
                        {notif.time}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: notif.unread ? 700 : 600,
                        color: notif.unread ? '#FFFFFF' : '#D1D5DB',
                        lineHeight: 1.35,
                        marginBottom: '3px',
                      }}
                    >
                      {notif.title}
                    </div>

                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: '#9CA3AF',
                        lineHeight: 1.4,
                      }}
                    >
                      {notif.message}
                    </div>
                  </div>

                  {/* Dismiss Button */}
                  <button
                    type="button"
                    title="Dismiss"
                    onClick={(e) => handleDismissOne(e, notif.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#6B7280',
                      cursor: 'pointer',
                      padding: '2px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      flexShrink: 0,
                      opacity: 0.6,
                      transition: 'opacity 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.color = '#EF4444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.6';
                      e.currentTarget.style.color = '#6B7280';
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '8px 14px',
              borderTop: '1px solid #24242A',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#1A1A1E',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onOpenSettings) onOpenSettings();
                else onNavigate('Settings');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9CA3AF',
                fontSize: '0.72rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 0',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#F3F4F6')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#9CA3AF')}
            >
              <Settings size={12} /> Notification Preferences
            </button>

            {filteredBySettings.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#EF4444',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 0',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                <Trash2 size={12} /> Clear all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
