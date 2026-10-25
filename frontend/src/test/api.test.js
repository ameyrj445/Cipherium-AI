import { describe, it, expect, beforeEach, vi } from 'vitest';
import api, {
  startSession,
  getStoredSession,
  endSession,
  setSessionToken,
} from '../services/api';

describe('Centralized API & Session Management Service', () => {
  beforeEach(() => {
    localStorage.clear();
    setSessionToken('');
    vi.restoreAllMocks();
  });

  it('startSession correctly persists token, user, and future expiresAt timestamp', () => {
    const mockUser = { id: 1, email: 'student@cipherium.ai', name: 'Amey Jain' };
    const mockToken = 'mock.jwt.token';

    const session = startSession(mockToken, mockUser);

    expect(session.token).toBe(mockToken);
    expect(session.user).toEqual(mockUser);
    expect(session.expiresAt).toBeGreaterThan(Date.now());

    // Verify localStorage item
    const stored = JSON.parse(localStorage.getItem('cipherium_session'));
    expect(stored.token).toBe(mockToken);
    expect(stored.user.email).toBe('student@cipherium.ai');
  });

  it('getStoredSession returns active session when not expired', () => {
    const mockUser = { id: 2, email: 'active@cipherium.ai' };
    startSession('valid.token', mockUser);

    const restored = getStoredSession();
    expect(restored).not.toBeNull();
    expect(restored.token).toBe('valid.token');
    expect(restored.user.email).toBe('active@cipherium.ai');
  });

  it('getStoredSession purges expired session and returns null', () => {
    const expiredSession = {
      token: 'expired.token',
      user: { id: 3 },
      expiresAt: Date.now() - 5000, // 5 seconds in the past
    };
    localStorage.setItem('cipherium_session', JSON.stringify(expiredSession));

    const restored = getStoredSession();
    expect(restored).toBeNull();
    expect(localStorage.getItem('cipherium_session')).toBeNull();
  });

  it('endSession clears session from localStorage and resets memory token', () => {
    startSession('token.to.delete', { id: 4 });
    endSession();

    expect(localStorage.getItem('cipherium_session')).toBeNull();
    expect(getStoredSession()).toBeNull();
  });

  it('attaches Authorization header when sessionToken is set', async () => {
    setSessionToken('bearer.jwt.payload');

    // Spy on axios request interceptor logic
    const mockConfig = { headers: {} };
    const handler = api.interceptors.request.handlers[0].fulfilled;
    const transformed = handler(mockConfig);

    expect(transformed.headers.Authorization).toBe('Bearer bearer.jwt.payload');
  });

  it('leaves Authorization header untouched when no session token exists', async () => {
    setSessionToken('');

    const mockConfig = { headers: {} };
    const handler = api.interceptors.request.handlers[0].fulfilled;
    const transformed = handler(mockConfig);

    expect(transformed.headers.Authorization).toBeUndefined();
  });
});
