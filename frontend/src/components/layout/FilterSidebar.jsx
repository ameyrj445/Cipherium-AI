import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, X, SlidersHorizontal, Check } from 'lucide-react';
import { breakpoints } from '../../theme/designTokens.js';

/**
 * FilterSidebar
 *
 * Sticky left filter column for Resources and catalog exploration views.
 * Supports collapsible sections, single & multi-select options, counts, and mobile drawer mode.
 */
export default function FilterSidebar({
  groups = [],
  selectedFilters = {},
  onSelectOption = () => {},
  onClearAll = () => {},
  width = 220,
  style = {},
  className = '',
}) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoints.lg;
  });

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoints.lg);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleGroup = (groupId) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const activeFilterCount = Object.values(selectedFilters).reduce((acc, val) => {
    if (Array.isArray(val)) return acc + val.length;
    if (val && val !== 'All') return acc + 1;
    return acc;
  }, 0);

  const sidebarContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Header Row with Clear All */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border-stroke, #2D2D35)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SlidersHorizontal size={16} color="var(--primary-brand, #6366F1)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary, #F3F4F6)' }}>
            Filters
          </span>
          {activeFilterCount > 0 && (
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                background: 'var(--primary-brand, #6366F1)',
                color: '#fff',
                padding: '1px 6px',
                borderRadius: '10px',
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </div>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--primary-brand, #818CF8)',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '2px 4px',
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter Groups */}
      {groups.map((group) => {
        const isCollapsed = !!collapsedGroups[group.id];
        const currentSelected = selectedFilters[group.id];

        return (
          <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Group Title Accordion Header */}
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary, #9CA3AF)',
                fontSize: '0.78rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                cursor: 'pointer',
                padding: '4px 0',
                textAlign: 'left',
              }}
            >
              <span>{group.label}</span>
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </button>

            {/* Group Options */}
            {!isCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {group.options.map((opt) => {
                  const isMulti = group.multiSelect;
                  const isChecked = isMulti
                    ? Array.isArray(currentSelected) && currentSelected.includes(opt.id)
                    : currentSelected === opt.id;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onSelectOption(group.id, opt.id, isMulti)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        background: isChecked ? 'rgba(99, 102, 241, 0.14)' : 'transparent',
                        border: isChecked
                          ? '1px solid rgba(99, 102, 241, 0.3)'
                          : '1px solid transparent',
                        color: isChecked
                          ? 'var(--text-primary, #F3F4F6)'
                          : 'var(--text-secondary, #9CA3AF)',
                        fontSize: '0.8rem',
                        fontWeight: isChecked ? 600 : 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isChecked) {
                          e.currentTarget.style.background = 'var(--bg-hover, #2A2A30)';
                          e.currentTarget.style.color = 'var(--text-primary, #F3F4F6)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isChecked) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--text-secondary, #9CA3AF)';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isMulti ? (
                          <div
                            style={{
                              width: '14px',
                              height: '14px',
                              borderRadius: '3px',
                              border: isChecked
                                ? '1px solid var(--primary-brand, #6366F1)'
                                : '1px solid var(--border-stroke, #2D2D35)',
                              background: isChecked ? 'var(--primary-brand, #6366F1)' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {isChecked && <Check size={10} color="#fff" strokeWidth={3} />}
                          </div>
                        ) : null}
                        <span>{opt.label}</span>
                      </div>

                      {opt.count !== undefined && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-tertiary, #6B7280)',
                            marginLeft: '4px',
                          }}
                        >
                          {opt.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Tablet / Mobile Drawer trigger and modal
  if (isMobile) {
    return (
      <div style={{ width: '100%', marginBottom: '16px', ...style }}>
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            background: 'var(--bg-surface, #1E1E22)',
            border: '1px solid var(--border-stroke, #2D2D35)',
            borderRadius: '8px',
            color: 'var(--text-primary, #F3F4F6)',
            fontSize: '0.84rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <SlidersHorizontal size={15} color="var(--primary-brand, #6366F1)" />
          <span>Filter Resources</span>
          {activeFilterCount > 0 && (
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                background: 'var(--primary-brand, #6366F1)',
                color: '#fff',
                padding: '1px 6px',
                borderRadius: '10px',
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>

        {mobileDrawerOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              zIndex: 1000,
              display: 'flex',
              justifyContent: 'flex-start',
            }}
            onClick={() => setMobileDrawerOpen(false)}
          >
            <div
              style={{
                width: '300px',
                height: '100%',
                background: 'var(--bg-surface, #1E1E22)',
                borderRight: '1px solid var(--border-stroke, #2D2D35)',
                padding: '24px 18px',
                overflowY: 'auto',
                boxSizing: 'border-box',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#F3F4F6' }}>
                  Filter Resources
                </span>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#9CA3AF',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <X size={20} />
                </button>
              </div>
              {sidebarContent}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop Sticky Sidebar
  return (
    <aside
      className={`filter-sidebar ${className}`.trim()}
      style={{
        width: `${width}px`,
        flexShrink: 0,
        position: 'sticky',
        top: '24px',
        alignSelf: 'start',
        background: 'var(--bg-surface, #1E1E22)',
        border: '1px solid var(--border-stroke, #2D2D35)',
        borderRadius: '12px',
        padding: '16px',
        boxSizing: 'border-box',
        maxHeight: 'calc(100dvh - 80px)',
        overflowY: 'auto',
        ...style,
      }}
    >
      {sidebarContent}
    </aside>
  );
}
