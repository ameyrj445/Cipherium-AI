import { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { profileAPI } from '../services/api';

export default function DataExport() {
  const [format, setFormat] = useState('json');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const inFlight = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const exportData = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError('');
    setStatus('');
    try {
      const response = await profileAPI.exportData(format);
      // Do not start a download after navigating away from Settings.
      if (!mounted.current) return;
      const blob = format === 'json'
        ? new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
        : response.data;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      try {
        anchor.href = url;
        anchor.download = `cipherium_export_${new Date().toISOString().slice(0, 10)}.${format}`;
        document.body.appendChild(anchor);
        anchor.click();
        setStatus('Download started. Keep your exported personal data in a safe place.');
      } finally {
        anchor.remove();
        // Allow the browser to consume the download URL before releasing it.
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (err) {
      if (!mounted.current) return;
      const code = err.response?.status;
      setError(code === 401
        ? 'Your session has expired. Sign in again, then retry the export.'
        : code === 429
          ? 'Export limit reached (3 per hour). Wait before retrying.'
          : !err.response
            ? 'Could not download your data. Check your connection and retry.'
            : 'The server could not export your data. Please retry later.');
    } finally {
      inFlight.current = false;
      if (mounted.current) setPending(false);
    }
  };

  return (
    <div aria-busy={pending}>
      <label htmlFor="data-export-format" style={{ display: 'block', marginBottom: '8px' }}>Export format</label>
      <select
        id="data-export-format"
        value={format}
        onChange={(event) => { setFormat(event.target.value); setError(''); setStatus(''); }}
        disabled={pending}
        aria-describedby="data-export-scope"
        style={{ padding: '8px', maxWidth: '100%', background: 'var(--bg-shell, #161618)', color: 'var(--text-primary, #F3F4F6)', border: '1px solid var(--border-stroke, #2D2D35)', borderRadius: '8px' }}
      >
        <option value="json">JSON — profile and learning data</option>
        <option value="csv">CSV — topic mastery only</option>
      </select>
      <p id="data-export-scope" style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #9CA3AF)', lineHeight: 1.6 }}>
        {format === 'json'
          ? 'Includes your profile, saved settings and topic masteries, plus up to 200 quiz attempts, 100 study tasks, 100 tutor messages and 20 study plans. This is not a complete history.'
          : 'Includes topic mastery rows only: topic ID, name, mastery score, attempt count and last seen. Does not include your profile, settings or learning histories.'}
        {' '}Exports use saved server data, not local cache. Limit: 3 exports per hour.
      </p>
      <button type="button" className="btn btn-primary" disabled={pending} onClick={exportData}>
        <Download size={14} aria-hidden="true" />
        <span>{pending ? 'Preparing export…' : error ? 'Retry export' : 'Export my data'}</span>
      </button>
      {error && <p role="alert" style={{ color: '#fb7185' }}>{error}</p>}
      <p role="status" style={{ fontSize: '0.78rem' }}>{pending ? 'Preparing your download…' : status}</p>
    </div>
  );
}
