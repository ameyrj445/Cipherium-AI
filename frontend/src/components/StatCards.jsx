import React from 'react';
import { BarChart2, BookOpen, Clock, Flame } from 'lucide-react';
import StatCard from './common/StatCard';

/**
 * Compact 4-item stats strip for Row 2 of the dashboard:
 * 1. Overall Progress
 * 2. Topics Completed
 * 3. Study Time
 * 4. Day Streak
 *
 * If the user has no plan and zero recorded progress/streak, this strip
 * is suppressed to avoid confronting the user with a row of empty zeros.
 */
export default function StatCards({
  customPlan = null,
  overallProgress = 0,
  topicsCompleted = 0,
  studyHours = 0,
  dayStreak = 0,
}) {
  let displayProgress = overallProgress;
  let displayCompleted = topicsCompleted;
  let displayLabel = 'Topics Completed';
  let hoursCompleted = studyHours;
  let totalHours = 0;

  if (customPlan && customPlan.milestones) {
    let totalSubs = 0;
    let doneSubs = 0;
    customPlan.milestones.forEach((m) => {
      totalSubs += (m.subtopics || []).length;
      doneSubs += (m.completed_subtopics || []).length;
    });

    displayProgress = totalSubs > 0 ? Math.round((doneSubs / totalSubs) * 100) : 0;
    displayCompleted = doneSubs;
    displayLabel = `Subtopics (${doneSubs}/${totalSubs})`;
    hoursCompleted = customPlan.completed_hours || 0;
    totalHours = customPlan.total_estimated_hours || (customPlan.duration_weeks * customPlan.target_hours_per_week) || 20;
  }

  // If user has no plan and zero activity across all metrics, hide widgets that would show zeros
  const hasAnyActivity = Boolean(
    customPlan ||
    displayProgress > 0 ||
    displayCompleted > 0 ||
    hoursCompleted > 0 ||
    dayStreak > 0
  );

  if (!hasAnyActivity) {
    return null;
  }

  const studyTimeValue = customPlan && totalHours > 0
    ? `${hoursCompleted}/${totalHours}h`
    : `${hoursCompleted}h`;

  const studyTimeSublabel = customPlan && totalHours > 0
    ? `${Math.max(totalHours - hoursCompleted, 0)}h remaining`
    : 'Logged study time';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '28px',
      }}
    >
      <StatCard
        icon={BarChart2}
        value={`${displayProgress}%`}
        label="Overall Progress"
        sublabel={customPlan ? 'Plan Progress' : 'Add a plan to begin'}
        accentColor="#10B981"
      />

      <StatCard
        icon={BookOpen}
        value={displayCompleted}
        label={displayLabel}
        sublabel="Curriculum topics"
        accentColor="#7C3AED"
      />

      <StatCard
        icon={Clock}
        value={studyTimeValue}
        label="Study Time"
        sublabel={studyTimeSublabel}
        accentColor="#6366F1"
      />

      <StatCard
        icon={Flame}
        value={dayStreak}
        label="Day Streak"
        sublabel="Consecutive days"
        accentColor="#F59E0B"
      />
    </div>
  );
}
