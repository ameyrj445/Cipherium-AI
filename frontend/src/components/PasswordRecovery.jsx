import React, { useEffect, useRef, useState } from 'react';
import { authAPI } from '../services/api';

const card = { maxWidth: 430, margin: '10vh auto', padding: 32, borderRadius: 12, background: 'var(--bg-surface, #1E1E22)', color: 'var(--text-primary, #F3F4F6)', border: '1px solid var(--border-stroke, #2D2D35)' };
const input = { display: 'block', width: '100%', boxSizing: 'border-box', padding: 10, marginTop: 6, marginBottom: 16, borderRadius: 8, border: '1px solid var(--border-stroke, #2D2D35)', background: 'var(--bg-shell, #161618)', color: 'inherit' };
const button = { padding: '10px 16px', borderRadius: 8, border: 0, background: '#6366f1', color: 'white', cursor: 'pointer' };

export default function PasswordRecovery({ mode, token, onBack, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (pending.current) return;
    setError('');
    if (mode === 'reset' && !token) { setError('This reset link is missing a token. Request a new link.'); return; }
    if (mode === 'reset' && password.trim().length < 6) { setError('Password must contain at least 6 non-space characters.'); return; }
    if (mode === 'reset' && password !== confirm) { setError('Passwords do not match.'); return; }
    pending.current = true;
    setLoading(true);
    try {
      if (mode === 'forgot') await authAPI.forgotPassword({ email: email.trim() });
      else await authAPI.resetPassword({ token, new_password: password });
      if (mounted.current) {
        setDone(true);
        setPassword(''); setConfirm('');
        if (mode === 'reset') onSuccess();
      }
    } catch (err) {
      if (!mounted.current) return;
      if (err.response?.status === 429) setError('Too many attempts. Please wait and try again.');
      else if (!err.response) setError('Unable to connect. Check your connection and try again.');
      else if (mode === 'reset' && [400, 401, 404, 410, 422].includes(err.response.status)) setError('This reset link is invalid or expired. Request a new link.');
      else setError('Unable to complete your request. Please try again.');
    } finally {
      pending.current = false;
      if (mounted.current) setLoading(false);
    }
  };

  return <main style={{ minHeight: '100vh', background: 'var(--bg-canvas, #121214)', padding: '1px 20px' }}>
    <section style={card} aria-labelledby="recovery-title">
      <h1 id="recovery-title">{mode === 'forgot' ? 'Forgot password' : 'Reset password'}</h1>
      {done ? <p role="status">{mode === 'forgot' ? 'If an account exists for that email, reset instructions may be sent.' : 'Password updated. You can now sign in.'}</p> : <>
        <p>{mode === 'forgot' ? 'Enter your email to request a reset link.' : 'Choose a new password for your account.'}</p>
        {error && <p role="alert" style={{ color: '#fb7185' }}>{error}</p>}
        <form onSubmit={submit}>
          {mode === 'forgot' ? <label>Email address<input style={input} type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label> : token ? <>
            <label>New password<input style={input} type="password" autoComplete="new-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
            <label>Confirm new password<input style={input} type="password" autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} /></label>
          </> : <p role="alert">This reset link is missing a token. Request a new link.</p>}
          {(mode === 'forgot' || token) && <button style={button} disabled={loading} type="submit">{loading ? 'Please wait…' : mode === 'forgot' ? 'Send reset link' : 'Reset password'}</button>}
        </form>
      </>}
      <p><button type="button" onClick={onBack} style={{ ...button, background: 'transparent', color: '#818cf8', paddingLeft: 0 }}>Back to sign in</button></p>
    </section>
  </main>;
}
