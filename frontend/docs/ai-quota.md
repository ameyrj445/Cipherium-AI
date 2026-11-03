# AI quota frontend preparation (S3-1)

Status: **frontend-prepared / backend-blocked**, not a live quota meter.

## Production behavior

- Settings displays **Usage unavailable**, without a number, progress bar or invented reset date.
- App deliberately does not read quota values from `/settings/profile`. Its GET/PUT handlers currently omit persisted values when constructing their response, causing schema defaults to be returned.
- There is no environment flag, browser storage override or production mock endpoint that enables fixture values.
- Only an exact HTTP 429 monthly-quota rejection from the tutor marks the current login's quota as exhausted. Generic throttling, offline errors and partial streams do not imply monthly exhaustion. No fallback/retry is attempted for that rejection.
- Confirmed exhaustion disables sending through both UI and hook guards, survives conversation navigation/New Chat, and disappears on session change. This is an in-memory server-rejection state, not persisted usage. Reloading starts unknown; the server remains authoritative for subsequent attempts. The UI explains that, if allowance has been restored, reloading permits a server-validated retry.
- Without authoritative reset metadata the UI says the reset date is unavailable. It does not promise a calendar reset or schedule a client-side unlock.

## Prepared fixture contract

`quotaFromFixture` accepts only explicit test-mode snapshots and returns unavailable in development/production builds. Example used in component tests:

```json
{
  "used": 90,
  "limit": 100,
  "measured_at": "2026-11-09T00:00:00Z",
  "resets_at": "2026-12-01T00:00:00Z"
}
```

These names describe a **proposed test contract**, not existing API fields or a promise from the backend owner. Counts must be nonnegative safe integers; timestamps must be parseable, measurement cannot be in the future and reset must be after measurement/current time. Expired or malformed snapshots become unavailable. A zero allowance is exhausted without division by zero; overages clamp the progress bar to 100% while preserving actual counts. Warnings start at the exact 90% threshold, not a rounded display percentage. Reset time is displayed in UTC.

The prepared UI includes an accessible named progress bar, numeric counts, yellow 90% warning, 100% send lock and reset display. Tests inject snapshots directly; **App never injects them**.

## Backend handoff / activation criteria

1. Return persisted usage/quota and reliable reset/period metadata for the authenticated user, rather than schema defaults. Agree authoritative field names and semantics, including zero allowance/custom-key behavior.
2. Make monthly reset reliable and period-aware. Current startup-on-day-1 implementation does not guarantee a reset schedule.
3. Specify how to refresh usage after tutor completion and when resuming a session. Define stale/missing/error behavior and quota error identification.
4. Once the backend contract is verified, replace test-only preparation with a session-bound live adapter; add real-backend tests for 89.99%, 90%, 100%, exhausted reset, concurrent usage and session changes before enabling it.

No backend code or database is modified here. Mock/fixture percentages do not establish live quota correctness.

## Verification

Presentation/model tests cover unknown, zero/over/invalid usage, threshold boundaries, dates, production fixture rejection, progress semantics and axe. App integration proves settings values cannot enable a meter, a specific quota response propagates to both views, and logout clears it. Hook tests cover streaming/fallback quota errors, generic 429, stale session errors, partial streams and switching conversations. Final aggregate results are recorded in the delivery summary; mobile/browser and live-quota verification remain separate gates.

Final local validation: 587 unit tests across 61 files passed; inclusive branch coverage 84.65%; lint/build and four bundle-budget checks passed. Five isolated real-backend journeys passed with external services disabled; they are regression evidence, not authoritative quota/reset acceptance. No candidate browser/mobile verification is claimed here.
