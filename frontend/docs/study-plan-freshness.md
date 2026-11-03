# Study-plan freshness frontend preparation (S3-2)

Owner: **Sarvesh (frontend)**. Status: **frontend-prepared / backend-blocked**.
This does not enable live stale detection or regeneration.

## Production behavior and safety fix

- A displayed study plan gets a neutral **Plan freshness unavailable** notice and
  a disabled **Regenerate plan** button with an accessible explanation.
- No displayed plan means no freshness banner. Missing/unsaved IDs stay unavailable.
- The banner has no API import, regeneration handler or callback. App does not
  pass fixtures, read `/roadmaps/status`, infer staleness from age/quiz completion,
  or use cached/server plan fields as a freshness assessment.
- Test fixtures are rejected when `import.meta.env.PROD` is true, including a
  production build using `--mode test`, and in every mode other than `test`.
  There is no production feature flag, query-string or storage override.
- Removed App's unused `generateRoadmap(10)` initialization call and `_roadmap`
  state. Merely loading the workspace no longer creates a standard roadmap or
  calls an endpoint that could overwrite an existing custom plan. Its returned
  data was not rendered anywhere. Explicit **New Subject Plan** generation,
  custom-plan save/progress and daily-task flows are unchanged.
- Backend quiz completion may still refresh a standard roadmap independently;
  that backend behavior is unchanged and is not evidence about a displayed
  custom plan. No backend source or database is modified by this preparation.

## Why live activation is blocked

`StudyPlanView` displays custom milestone plans. The current freshness service
checks a standard list-shaped roadmap with topic IDs. `/roadmaps/status` returns
no plan ID, and its `last_generated_at` comes from a separately selected latest
record rather than necessarily the record checked for staleness.
`POST /roadmaps/generate` has no target plan ID and selects the first user plan to
update, so wiring it to this banner could overwrite a different/custom plan.
Custom-plan save/list responses also do not consistently expose the persisted
record's identity. These are backend contract dependencies, not UI test failures.

## Fixture presentation contract

`planFreshnessFromFixture` is a proposed test contract, not a parser for an
existing endpoint. For example:

```json
{
  "plan_id": 42,
  "status": "stale",
  "last_generated_at": "2026-11-01T08:00:00Z",
  "checked_at": "2026-11-03T09:00:00Z"
}
```

The fixture plan ID must be a positive safe integer and exactly match the
currently displayed ID. Accepted states are checking, fresh, stale,
regenerating, error and refreshed. Every preview says **State preview only** and
keeps the action disabled, including success and error previews. Error copy
states that the outcome is unknown; it does not invent a confirmed failure or
invite an unsafe retry.

Assessed states require UTC ISO timestamps with optional three-digit
milliseconds. Generation must not be after assessment, and assessment must not
be in the future. Impossible dates, invalid values, unknown states and missing
or mismatched IDs all fall back to unavailable. Checking/error may omit both
dates; supplying either requires both to validate. No generation date is invented.
This fixture format is not an agreed backend contract or an assessment lifetime
policy. A future live adapter must define expiration, session isolation and
concurrency behavior before using such metadata.

The responsive banner stays in normal flow, wraps its text/action and has a
44px minimum action height. Status announcements are polite, uncertain errors
use an alert, and the disabled action references its visible explanation.

## Backend activation checklist

1. Agree which plan type can be assessed and regenerated. Return a stable,
   persisted ID consistently across save/current/list/status responses.
2. Assess that exact authenticated user's plan and return its ID, revision and
   authoritative freshness/generation metadata from the same record.
3. Provide an explicitly targeted operation with authorization, concurrency and
   retry/idempotency semantics. Define whether progress and the current plan are
   preserved, replaced or require confirmation. Never reuse generic generation.
4. Resolve how quiz auto-refresh and manual refresh interact. Define status
   refresh/expiration after quizzes, selection changes, navigation and login.
5. Replace fixture preparation only after real-backend tests establish matching
   identity, no cross-plan overwrite, preserved progress and safe uncertain-result
   handling. Then enable an authenticated, session-bound UI flow with repeated
   click, race, cancellation and recovery tests.

## Verification

- 62 focused model/component/App tests cover all preview states, absent/invalid
  data, timestamp boundaries/impossible dates, mismatched identities, production
  fixture rejection (including production/test mode), cached fields, plan
  switching/logout, no implicit generation and disabled repeated clicks.
- An actual Vite production library build with `mode=test` also returns unavailable for a valid stale fixture, verifying the compiled gate as well as mocked environment tests.
- Axe scans cover all seven banner states. Stylesheet assertions cover wrapping
  and normal-flow rules; these are not browser geometry or screen-reader tests.
- 649 tests across 63 frontend files passed, with 84.92% inclusive branch coverage.
  Lint passed with pre-existing warnings; production build and all four bundle
  checks passed (167,050 initial gzip bytes, below 250,000).
- Six isolated actual-App/FastAPI/SQLite journeys passed. Standard generation is
  now invoked explicitly for a fresh disposable account, independently of App
  initialization. A new journey persists a custom plan first, loads/navigates the
  UI and rereads it unchanged, with no generation/status request from App.
- Headless Chromium could not launch in this cloud runtime because its local
  singleton socket was not permitted. No rendered desktop/mobile, physical
  device, live stale assessment, real regeneration, remote CI or release
  acceptance is claimed. Those remain separate gates.
