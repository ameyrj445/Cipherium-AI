import React, { useMemo, useState } from 'react';
import { BarChart2, BookOpen, CheckCircle2, Clock, Target } from 'lucide-react';

const totalsFor = (plans) => plans.reduce((total, plan) => {
  const milestones = plan.milestones || [];
  total.planHours += plan.total_estimated_hours || (plan.duration_weeks || 0) * (plan.target_hours_per_week || 0);
  total.loggedHours += plan.completed_hours || 0;
  total.stages += milestones.length;
  milestones.forEach((milestone) => {
    const topics = milestone.subtopics || [];
    const completed = milestone.completed_subtopics || [];
    const resources = milestone.resources || [];
    total.topics += topics.length;
    total.topicsDone += completed.length;
    total.resources += resources.length;
    total.resourcesDone += resources.filter((resource) => resource.completed).length;
    if (topics.length + resources.length > 0 && completed.length + resources.filter((resource) => resource.completed).length === topics.length + resources.length) total.stagesDone += 1;
  });
  return total;
}, { topics: 0, topicsDone: 0, resources: 0, resourcesDone: 0, planHours: 0, loggedHours: 0, stages: 0, stagesDone: 0 });

export default function AnalyticsFullView({ plans = [], onPracticeTopic }) {
  const [planFilter, setPlanFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const matchingPlans = plans.filter((plan) => `${plan.subject} ${(plan.milestones || []).map((milestone) => milestone.title).join(' ')}`.toLowerCase().includes(searchQuery.toLowerCase()));
  const displayedPlans = (planFilter === 'All' ? matchingPlans : plans.filter((plan) => plan.id === planFilter)).filter((plan) => matchingPlans.includes(plan));
  const totals = useMemo(() => totalsFor(displayedPlans), [displayedPlans]);
  const completion = totals.topics + totals.resources ? Math.round(((totals.topicsDone + totals.resourcesDone) / (totals.topics + totals.resources)) * 100) : 0;

  if (!plans.length) return <div className="ui-card" style={{ padding: '52px 24px', textAlign: 'center' }}><BarChart2 size={36} color="#2563eb" /><h2 style={{ margin: '12px 0 8px' }}>Your progress report will appear here</h2><p style={{ color: '#64748b', margin: 0 }}>Add a generated study plan to Learn, then complete topics and resources to build your report.</p></div>;

  const cards = [
    { label: 'Overall completion', value: `${completion}%`, Icon: Target, color: '#2563eb' },
    { label: 'Concepts completed', value: `${totals.topicsDone}/${totals.topics}`, Icon: CheckCircle2, color: '#10b981' },
    { label: 'Resources completed', value: `${totals.resourcesDone}/${totals.resources}`, Icon: BookOpen, color: '#8b5cf6' },
    { label: 'Tracked hours', value: `${totals.loggedHours}/${totals.planHours}h`, Icon: Clock, color: '#f59e0b' },
  ];

  return <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '18px', marginBottom: '24px', flexWrap: 'wrap' }}>
      <div><span style={{ fontSize: '.72rem', fontWeight: 800, color: '#2563eb', letterSpacing: '.06em' }}>PROGRESS-ONLY ANALYTICS</span><h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '5px 0' }}>{planFilter === 'All' ? 'All active plans analysis' : `${displayedPlans[0]?.subject || 'Plan'} analysis`}</h2><p style={{ color: '#64748b', margin: 0 }}>Totals are calculated only from the selected plan’s tracked topics, resources, and study time.</p></div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search plan or milestone" style={{ padding: '9px 12px', minWidth: '190px', border: '1px solid #cbd5e1', borderRadius: '9px' }} /><label style={{ fontSize: '.76rem', color: '#475569', fontWeight: 700 }}>Plan filter<br /><select value={planFilter} onChange={(event) => setPlanFilter(event.target.value)} style={{ marginTop: '5px', padding: '9px 12px', minWidth: '210px', border: '1px solid #cbd5e1', borderRadius: '9px', color: '#0f172a', background: '#fff' }}><option value="All">All active plans</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.subject}</option>)}</select></label></div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px', marginBottom: '22px' }}>{cards.map(({ label, value, Icon, color }) => <div className="ui-card" key={label} style={{ padding: '18px' }}><Icon size={20} color={color} /><div style={{ fontWeight: 800, fontSize: '1.45rem', marginTop: '10px' }}>{value}</div><div style={{ fontSize: '.76rem', color: '#64748b', marginTop: '3px' }}>{label}</div></div>)}</div>
    <div className="ui-card" style={{ padding: '22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}><div><h3 style={{ margin: 0 }}>Roadmap progress</h3><p style={{ color: '#64748b', fontSize: '.8rem', margin: '5px 0 0' }}>{totals.stagesDone} of {totals.stages} stages fully complete</p></div><strong style={{ color: '#2563eb', fontSize: '1.2rem' }}>{completion}%</strong></div>
      {displayedPlans.map((plan) => <div key={plan.id} style={{ marginTop: '18px' }}><div style={{ fontWeight: 800, color: '#0f172a', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0' }}>{plan.subject}</div>{(plan.milestones || []).map((milestone, index) => { const total = (milestone.subtopics || []).length + (milestone.resources || []).length; const done = (milestone.completed_subtopics || []).length + (milestone.resources || []).filter((resource) => resource.completed).length; const percent = total ? Math.round(done / total * 100) : 0; return <div key={milestone.id || index} style={{ padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '.86rem' }}><strong>Stage {index + 1}: {milestone.title}</strong><span style={{ color: '#64748b', whiteSpace: 'nowrap' }}>{done}/{total} tracked</span></div><div style={{ height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', margin: '10px 0' }}><div style={{ height: '100%', width: `${percent}%`, background: percent === 100 ? '#10b981' : '#2563eb' }} /></div><button className="btn btn-white" onClick={() => onPracticeTopic?.(milestone.title)} style={{ padding: '6px 10px', fontSize: '.73rem' }}>Open related practice</button></div>; })}</div>)}
    </div>
  </div>;
}
