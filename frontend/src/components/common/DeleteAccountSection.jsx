import React, { useEffect, useId, useRef, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import SettingSection from './SettingSection';
import { authAPI } from '../../services/api';
import './DeleteAccountSection.css';

export default function DeleteAccountSection({ user, onLogout, onDeleteAccount, deletionPending = false }) {
  const [confirming, setConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setPending] = useState(false);
  const pending = submitting || deletionPending;
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const trigger = useRef(null);
  const input = useRef(null);
  const id = useId();

  useEffect(() => {
    if (confirming) input.current?.focus();
  }, [confirming]);

  const cancel = () => {
    if (inFlight.current || pending) return;
    setConfirming(false);
    setConfirmation('');
    setError('');
    trigger.current?.focus();
  };

  const deleteAccount = async (event) => {
    event.preventDefault();
    if (!user || confirmation !== 'DELETE' || pending || inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError('');
    try {
      if (onDeleteAccount) await onDeleteAccount();
      else await authAPI.deleteAccount();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' && detail.trim()
        ? detail
        : 'Unable to delete your account. Please try again.');
      inFlight.current = false;
      setPending(false);
      return;
    }
    // Keep submission locked after success, even while the parent signs out.
    if (!onDeleteAccount) onLogout();
  };

  if (!user) return null;

  return (
    <div className="account-danger-zone">
      <SettingSection icon={TriangleAlert} title="Danger Zone"
        description="Deleting your account deactivates it and anonymizes your name and email. You will lose access to your learning data and be signed out. This action cannot be undone.">
        <button ref={trigger} type="button" className="btn account-delete-button"
          aria-expanded={confirming} aria-controls={`${id}-confirmation`}
          disabled={pending} onClick={() => setConfirming(true)}>
          Delete account
        </button>
        {pending && !confirming && <p role="status">Deleting your account… Please wait.</p>}
        {confirming && (
          <form id={`${id}-confirmation`} aria-label="Confirm account deletion"
            onSubmit={deleteAccount} onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                cancel();
              }
            }}>
            <p id={`${id}-warning`}>To confirm deletion of {user.email || 'your account'}, type DELETE exactly.</p>
            <label htmlFor={`${id}-input`}>Deletion confirmation</label>
            <input ref={input} id={`${id}-input`} value={confirmation}
              aria-describedby={`${id}-warning`} autoComplete="off" spellCheck={false}
              disabled={pending} onChange={(event) => setConfirmation(event.target.value)} />
            {error && <p role="alert" className="account-delete-error">{error}</p>}
            <p role="status">{pending ? 'Deleting your account… Please wait.' : ''}</p>
            <div className="account-delete-actions">
              <button type="button" className="btn btn-white" disabled={pending} onClick={cancel}>Cancel</button>
              <button type="submit" className="btn account-delete-button"
                disabled={confirmation !== 'DELETE' || pending}>
                {pending ? 'Deleting…' : 'Permanently delete account'}
              </button>
            </div>
          </form>
        )}
      </SettingSection>
    </div>
  );
}
