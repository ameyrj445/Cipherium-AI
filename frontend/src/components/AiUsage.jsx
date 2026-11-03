import React from 'react';
import { UNAVAILABLE_QUOTA } from '../utils/aiQuota';
import './AiUsage.css';

export default function AiUsage({ quota = UNAVAILABLE_QUOTA, compact = false }) {
  const resetText = quota.status === 'ready'
    ? `Resets ${new Date(quota.resetAt).toISOString().replace('T', ' ').replace('.000Z', ' UTC')}.`
    : 'The reset date is unavailable. The server controls when access resumes. If your allowance has been restored, reload to retry; the server will check it again.';
  if (compact && !quota.exhausted && !(quota.status === 'ready' && quota.warning)) return null;
  return (
    <section className={`ai-usage${compact ? ' ai-usage--compact' : ''}`} aria-label="AI usage">
      {!compact && <h3>AI Usage</h3>}
      {quota.status === 'unavailable' ? <p>Usage unavailable. Verified usage and reset information are not yet supplied by the server.</p> : <>
        {!compact && quota.status === 'ready' && <>
          <p>{quota.used.toLocaleString('en-US')} / {quota.limit.toLocaleString('en-US')} tokens used ({Math.floor(quota.percentage)}%)</p>
          <progress aria-label="Monthly AI token usage" max="100" value={quota.percentage} />
        </>}
        {quota.exhausted ? <p role="status" className="ai-usage__warning">Monthly AI quota reached. Sending is disabled. {resetText}</p>
          : quota.warning ? <p role="status" className="ai-usage__warning">You have used at least 90% of your monthly AI quota. {resetText}</p>
            : <p>{resetText}</p>}
      </>}
    </section>
  );
}
