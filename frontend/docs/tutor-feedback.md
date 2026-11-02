# S2-3: linked tutor feedback (frontend-only)

## Implemented

- Preserve database message IDs from `GET /tutor/history` and rate only completed, persisted assistant messages with positive safe-integer IDs.
- Helpful/not-helpful submits `POST /feedback` with `feedback_type: tutor_rating`, the real message ID as `target_id`, and rating `1`/`-1`.
- Check all pages of `GET /feedback/my` before submitting. Existing tutor ratings are shown as saved, never overwritten or posted again.
- Synchronous per-message pending locks prevent repeated/opposite clicks. App-level state survives tab navigation, but is discarded when the login changes.
- Lookup failures and explicit rejected requests have retry controls. Ambiguous network/408/5xx outcomes only allow readback checks, never blind resubmission in that session.
- Session checks and a request-dispatch token binding prevent queued feedback from being sent under another login. Late reads/results and unmounted work are ignored.
- Chat history is session-tagged. Delayed history cannot replace locally started/cleared chats; old stream callbacks cannot populate a new chat.

## Backend dependencies (not implemented here)

The current REST answer response and SSE `done` event do not expose a saved assistant message ID. SSE `done` is emitted before persistence. These fresh answers therefore visibly remain unrated; IDs are not fabricated, inferred from text, or replaced with unlinked feedback.

The history endpoint returns the **oldest 30** by default, not the newest messages. Reloading does not guarantee a fresh answer will become available to rate. The backend should return the persisted assistant ID after commit in REST and SSE completion, and support newest-history/pagination consistently.

The feedback endpoint has no per-user/target uniqueness, idempotency key, or target ownership/role validation. Frontend checks prevent ordinary repeated submissions and known prior ratings, but cannot guarantee exactly-once behavior across tabs or a reload racing an unresolved save. Server validation and idempotency remain required for that guarantee.

## Validation

All feedback/network tests use mocks. No live API calls, backend changes, push, or deployment are required for this implementation.

Run from `frontend`: `npm test`, `npm run lint`, `npm run build`.

Coverage includes real ID mapping through App, invalid/example/user/streaming messages, exact payloads, duplicate clicks, pagination, navigation retention, retries, ambiguous outcomes, session switches, unmount/StrictMode, dispatch-token binding, delayed history, and stale stream callbacks after New chat.
