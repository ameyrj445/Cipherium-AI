# Real-backend learner journeys (S3-6)

Run from `frontend` after `npm ci` and installation of `backend/requirements-dev.txt` into an isolated Python environment:

```sh
INTEGRATION_PYTHON=/path/to/venv/bin/python npm run test:integration
```

On Windows PowerShell, set `$env:INTEGRATION_PYTHON` to that environment's Python executable, then run `npm run test:integration`. Python defaults to `python3` on Unix and `python` on Windows. Node must satisfy the lockfile packages' engine requirements.

## What actually runs

The Node launcher starts the real FastAPI application on an ephemeral loopback port. The Python launcher always replaces `DATABASE_URL` with a fresh temporary SQLite database, runs the application's real schema initialization and seed, and refuses database fallback to another path. It does not change the checked-in backend implementation, override HTTP routes, replace auth, or inject API responses.

Vitest/JSDOM mounts the actual `App` and uses the production Axios/fetch clients over HTTP. No component/service mocks are used. ResizeObserver, matchMedia and scrolling have JSDOM-only layout shims; the final browser download click/object URL is intercepted because JSDOM cannot save a file. The returned export bytes are parsed and checked, not fabricated.

The suite contains six independently registered disposable learner journeys:

1. Register through the UI, render the authenticated dashboard, log out, sign in again, and verify the server identity.
2. Select and submit a real adaptive question, complete its backend session, verify persisted mastery and finalized question IDs, and verify the tutor is unlocked afterward.
3. Create a conversation through the UI, send a message, consume actual `text/event-stream` with its completion event (no nonstreaming fallback), verify both messages in the database through the owned-message endpoint, and verify the assistant answer in the UI.
4. Explicitly generate a standard roadmap for a fresh disposable account before mounting App, verify nonempty tasks and that App does not generate again, toggle a displayed daily task, and read back persisted state.
5. Persist a custom plan before mounting App, navigate to its unavailable freshness banner, try the disabled action, and reread the plan unchanged with no generation/status request.
6. Request the real JSON export from Settings, check returned signed-in identity/history and absence of password hashes, and verify the final download action/filename.

External provider credentials are cleared and outbound connections are blocked in the Python process. The tutor/RAG/ML therefore exercise their real offline fallback paths. This verifies application/frontend/backend/auth/ORM/SSE integration, **not live Gemini quality, real embedding retrieval, SMTP, a production deployment, browser rendering, mobile layout or a physical downloaded file**.

## Isolation and CI

`vitest.integration.config.js` selects only `integration/**/*.integration.test.jsx`; normal unit and coverage commands select only `src/**/*.test.*`. The CI `frontend-integration` stage runs this suite after the backend and frontend checks, with a fresh checkout and Python/Node environments. Existing workflow trigger policy is unchanged; feature-branch pushes do not by themselves run this workflow. A remote CI pass is not implied by a local pass.

The launcher terminates only its own child processes and asks Python for graceful shutdown. The temporary database, cache/vector paths and test logs are removed on success. On failure, sanitized test-only logs are retained in a printed temporary directory for diagnosis, and the run exits nonzero. Startup failure is a failure, never a skipped or passing suite. Never replace the launcher with a shared database/API URL: generation and task tests intentionally mutate data.

## Integration defect fixed

The real quiz journey initially failed: the frontend submitted `/quizzes/attempts`, but the backend intentionally defers persisted mastery and tutor unlocking until `/quizzes/{quiz_id}/complete`. The adaptive single-question handler now completes that returned session before displaying success. Completion failures expose a **Retry saving result** action that retries the known session, not the answer POST. Duplicate clicks and session changes are guarded. An ambiguous answer submission is not blindly retried; the current question is locked and the uncertainty is explained. Analytics refresh failure is shown separately from a saved result.

This fix covers the adaptive single-question path used by this journey. The distinct timed-exam flow still needs its own completion integration and dedicated end-to-end acceptance; these passing journeys must not be read as coverage of every quiz variant. Backend completion also owns roadmap refresh behavior; this suite's isolation does not resolve the previously documented current-plan regeneration contract risk.

## Verification

The S3-2 checkpoint passes six real-backend journeys. The separate unit suite passes 649 tests across 63 files, inclusive branch coverage is 84.92%, lint passes with existing warnings, and the production bundle budget passes at 167,050 gzip bytes. Teammate PR review, actual CI execution and broader live-provider/manual verification remain separate release gates.

## Freshness preparation safety check (S3-2)

App initialization no longer calls the untargeted generation endpoint. The independent endpoint journey is retained only against a fresh disposable account; the new saved-plan journey guards against reintroducing load-time overwrites. Live stale detection and targeted regeneration remain backend-blocked. See `study-plan-freshness.md`.
