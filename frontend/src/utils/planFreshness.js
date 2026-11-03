// Presentation preparation only. The current status endpoint describes a
// different plan type and does not identify the displayed custom plan.
export const UNAVAILABLE_PLAN_FRESHNESS = Object.freeze({ status: 'unavailable' });

const FIXTURE_STATES = new Set(['checking', 'fresh', 'stale', 'regenerating', 'error', 'refreshed']);
const requiresAssessment = new Set(['fresh', 'stale', 'regenerating', 'refreshed']);
const validId = value => Number.isSafeInteger(value) && value > 0;
const timestamp = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return NaN;
  const parsed = Date.parse(value);
  // Date.parse normalizes impossible dates such as February 30; reject them.
  return Number.isFinite(parsed) && new Date(parsed).toISOString().replace('.000Z', 'Z') === value.replace('.000Z', 'Z')
    ? parsed : NaN;
};

// A proposed fixture contract, NOT an adapter for /roadmaps/status. App never
// supplies fixtures. Development/production cannot enable them via props,
// environment flags, URL parameters, cached plans or storage.
export function planFreshnessFromFixture(fixture, displayedPlanId, now = Date.now()) {
  if (import.meta.env.PROD || import.meta.env.MODE !== 'test' || !Number.isFinite(now)
    || !validId(displayedPlanId) || !validId(fixture?.plan_id)
    || fixture.plan_id !== displayedPlanId || !FIXTURE_STATES.has(fixture.status)) {
    return UNAVAILABLE_PLAN_FRESHNESS;
  }
  const generatedAt = timestamp(fixture.last_generated_at);
  const checkedAt = timestamp(fixture.checked_at);
  const hasDates = fixture.last_generated_at !== undefined || fixture.checked_at !== undefined;
  if ((requiresAssessment.has(fixture.status) || hasDates)
    && (!Number.isFinite(generatedAt) || !Number.isFinite(checkedAt)
      || generatedAt > checkedAt || checkedAt > now)) return UNAVAILABLE_PLAN_FRESHNESS;
  return { status: fixture.status, generatedAt: Number.isFinite(generatedAt) ? generatedAt : null };
}
