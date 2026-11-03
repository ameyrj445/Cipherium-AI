# S2-3: tutor ratings and incorrect-answer reports (frontend-only)

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


## Incorrect-answer issue reports

The incorrect-answer action opens a comment modal for a non-streaming assistant response with text, including a fresh answer without a saved message ID. A stopped partial response can also be reported. It submits exactly `POST /feedback` with `{ feedback_type: 'bug', comment }`. It does **not** send `target_id`, the answer text, or a conversation ID. The modal explicitly describes this as a general issue report and asks the learner to describe the problem. This is not automatic answer traceability, an incorrect-question linkage, or a verified moderation workflow.

Report state is separate from helpful/not-helpful ratings and lives with the current login. Per-answer local success locks and session-wide pending/uncertain guards prevent duplicate clicks or navigation-based resubmission while a request is unresolved. Saved answers use their ID only as a local UI key; fresh answers use their existing object identity. A known rejection can be corrected/retried. A transport failure, timeout, or server failure may already have committed, so no automatic or manual resend is offered for an ambiguous result in that session. With no idempotency key or reliable report-to-answer readback key, frontend code cannot guarantee exactly-once submission across tabs/reloads/logins or a successfully reported fresh answer later loaded as a new saved record. Closing a pending modal does not cancel a submitted report.

Dialog checks cover comment validation, explicit label/description, initial focus, trapped keyboard focus, Escape/Close, focus restoration, session changes, and stale asynchronous completion. Unit tests are mocked; browser/assistive-technology checks and live backend transactions remain separate verification gates.

The comment is required, whitespace-only input is rejected, and the UI limit is 2,000 characters. Leading/trailing whitespace is trimmed. Text is rendered as text, not HTML. Opening, cancelling, or closing a draft sends nothing.

### Local verification for the flag addition

- Full frontend suite: 41 test files, 402 tests passed (72 new flag cases).
- Lint: exit 0, unchanged 40 baseline warnings.
- Production build: passed, existing large-chunk warning remains on S2.
- Tests exercise exact payloads, fresh/saved eligibility, focus/inert cleanup, draft cancellation, request locking across view/message/session changes, definite rejections, ambiguous outcomes, and stale callbacks.
- No browser rendering/mobile/screen-reader verification or live backend transaction is claimed. No backend files are changed.
