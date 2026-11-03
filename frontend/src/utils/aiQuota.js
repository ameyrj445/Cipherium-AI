// UI contract only. Do not feed /settings/profile defaults into this model.
// Production wiring remains unavailable until the backend contract is repaired.
export const UNAVAILABLE_QUOTA = Object.freeze({ status: 'unavailable', exhausted: false });
export const CONFIRMED_EXHAUSTED_QUOTA = Object.freeze({ status: 'exhausted', exhausted: true });

// Used by fixture-driven UI tests only; deliberately not imported by App.
export function quotaFromFixture(snapshot, now = Date.now()) {
  if (import.meta.env.MODE !== 'test') return UNAVAILABLE_QUOTA;
  const { used, limit, resets_at: reset, measured_at: measured } = snapshot || {};
  const resetAt = typeof reset === 'string' ? Date.parse(reset) : NaN;
  const measuredAt = typeof measured === 'string' ? Date.parse(measured) : NaN;
  if (!Number.isSafeInteger(used) || used < 0 || !Number.isSafeInteger(limit) || limit < 0
    || !Number.isFinite(resetAt) || !Number.isFinite(measuredAt) || measuredAt > now
    || resetAt <= now || resetAt <= measuredAt) return UNAVAILABLE_QUOTA;
  const percentage = limit === 0 ? 100 : Math.min(100, used / limit * 100);
  return { status: 'ready', used, limit, resetAt, percentage, exhausted: used >= limit, warning: limit > 0 && used / limit >= 0.9 };
}

export function isMonthlyQuotaError(error) {
  const status = error?.status ?? error?.response?.status;
  const detail = error?.response?.data?.detail ?? error?.message;
  return status === 429 && detail === 'Monthly AI quota exceeded. Upgrade or wait until next month.';
}
