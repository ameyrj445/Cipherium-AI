import { useLayoutEffect, useRef, useState } from 'react';
import { authAPI } from '../services/api';

// Owned by App so navigation cannot reset an in-flight destructive operation.
export default function useAccountDeletion(token, onLogout) {
  const currentToken = useRef(token);
  useLayoutEffect(() => { currentToken.current = token; }, [token]);
  const requests = useRef(new Map());
  const [pendingToken, setPendingToken] = useState(null);

  const deleteAccount = () => {
    if (!token) return Promise.reject(new Error('Sign in before deleting your account.'));
    if (requests.current.has(token)) return requests.current.get(token);
    setPendingToken(token);
    const request = Promise.resolve().then(() => authAPI.deleteAccount()).then(() => {
      // A response for an older session must not sign out a newly signed-in user.
      if (currentToken.current === token) onLogout();
    }).finally(() => {
      requests.current.delete(token);
      setPendingToken((pending) => pending === token ? null : pending);
    });
    requests.current.set(token, request);
    return request;
  };

  return { deleteAccount, deletionPending: pendingToken === token && !!token };
}
