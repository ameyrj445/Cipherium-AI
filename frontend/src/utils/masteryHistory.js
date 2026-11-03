const probability = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1 ? value * 100 : null;
export const validId = (value) => Number.isSafeInteger(value) && value > 0;

// Preserve incomplete audit records, but never turn missing values into zero mastery.
export function normalizeMasteryHistory(payload) {
  if (!Array.isArray(payload)) throw new Error('Invalid mastery history response');
  let skipped = 0;
  const rows = payload.flatMap((event, index) => {
    if (!event || !validId(event.id) || !validId(event.topic_id)) { skipped += 1; return []; }
    // API timestamps may be UTC without an offset (SQLAlchemy's naive UTC datetime).
    const raw = typeof event.created_at === 'string' ? event.created_at : '';
    const [year, month, day] = raw.slice(0, 10).split('-').map(Number);
    const calendarDate = new Date(0);
    calendarDate.setUTCFullYear(year, month - 1, day);
    const validCalendarDate = year > 0 && calendarDate.getUTCFullYear() === year && calendarDate.getUTCMonth() === month - 1 && calendarDate.getUTCDate() === day;
    const timestamp = validCalendarDate && /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/.test(raw)
      ? Date.parse(/(?:Z|[+-]\d{2}:\d{2})$/.test(raw) ? raw : `${raw}Z`) : NaN;
    return [{ id: event.id, topicId: event.topic_id, prior: probability(event.prior), posterior: probability(event.posterior), timestamp: Number.isFinite(timestamp) ? timestamp : null, index }];
  });
  rows.sort((a, b) => (a.timestamp ?? Infinity) - (b.timestamp ?? Infinity) || a.id - b.id || a.index - b.index);
  return { rows, skipped };
}

