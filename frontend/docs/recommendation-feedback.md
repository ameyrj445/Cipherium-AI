# Recommendation feedback

Authenticated learners can choose Helpful, Too easy, Too hard, or Not relevant on resources returned by `/recommendations`, in the dashboard and resource library. Sample cards and generated roadmap resources deliberately have no controls: their IDs are not proven database Resource IDs.

## Behavior
- Uses `POST /feedback` with real resource `target_id`, appropriate feedback type, and `rating: 1` only for Helpful.
- Easy/hard changes the user's overall difficulty preference; this effect is explained before submission.
- Conservative frontend policy: one response per resource. The UI checks authenticated feedback history first, paginated at 100 records, and stops safely after 10,000 records rather than sending if absence cannot be established.
- State is held at App/session level, shared between cards and navigation, reset on session change. No feedback state is persisted in localStorage.
- Both read and write calls bind to the expected login token and have a 15-second timeout. Repeated clicks lock synchronously. Stale work cannot issue a POST after unmount/logout or update another login's UI.
- A network/timeout/server failure during POST may have saved. The only next action is a readback check, never an automatic resend. Definitive 4xx rejections (except 408) and failed preflight reads permit explicit retries.

## Saved-card completion
Only a confirmed successful POST or a confirmed matching history entry dims the
card surface. Pending, rejected and ambiguous results never look saved. We retain
rather than remove the card so its resource link and completion controls remain
available. We do not reduce opacity on text or controls. The saved marker opens a
thank-you tooltip on pointer hover, keyboard focus or tap; Escape dismisses it,
and the tooltip stays within the card's available width. Status text remains
available without opening the tooltip. New login sessions remove saved styling.

## Assignment/API contract reconciliation
The assignment describes recommendation feedback as `rec_rating` plus a rating,
but does not supply a mapping for the distinct difficulty choices. The current
backend explicitly handles `too_easy` / `too_hard` by changing the learner's
**overall difficulty mode**, and accepts `not_relevant` separately. It only rewards
a resource for `rec_rating` with `rating: 1`. We therefore preserve the existing
verified mapping: Helpful → `rec_rating`, `rating: 1`; the other buttons → their
explicit named types with no invented numeric rating. All use the real resource
`target_id`. Replacing these with guessed -1/0/1 mappings would change backend
behavior, not just UI. Product/backend confirmation remains needed to reconcile
the assignment wording; this change does not claim that contract issue is solved.

## Backend follow-up
There is no server target validation, unique constraint/idempotency key, or update endpoint. Read-before-write cannot enforce exactly-once across browser tabs/devices, and history pagination is not a transaction snapshot. Reloading after an ambiguous request loses the in-memory uncertain flag. Jay should add authoritative resource validation and idempotency before promising exactly-once effects. Product/backend should confirm whether difficulty feedback should eventually be repeatable per resource. Current UI intentionally does not stack repeated responses.

## Verification
Hook and integration tests cover payloads, malformed IDs, sample/plan exclusion, prior history including later pages, unrelated tutor feedback with the same ID, rapid clicks, success retained through navigation/filtering, history errors, explicit rejection retry, ambiguous failure check-only, logout/session changes, and StrictMode.

Browser visual QA script was prepared with mocked APIs. In this cloud executor Chromium launch was blocked by sandbox socket restrictions; the approved escalation attempt failed before launch due to a read-only runtime mount. Desktop/mobile screenshot verification is therefore not claimed. Responsive CSS uses wrapping controls, 44px button height, and a grid minimum that fits narrow containers; real visual QA remains outstanding.


### Saved-card regression checks (2026-11-03)
Focused tests cover all four success choices, prior history, no dimming for pending,
error/ambiguous or invalid/sample targets, session reset, both recommendation
views, resource link usability, tooltip focus/hover/tap/Escape and unique IDs.
These are DOM-level tests; responsive browser and assistive-technology verification
are separate gates, not implied by wrapping CSS or a test pass.

### Narrow-card tooltip correction

Desktop narrow-viewport QA found the above-trigger overlay could cover rating controls. The thank-you tooltip now participates in normal document flow below its trigger, growing the card instead of covering adjacent content. Its card-bounded width, contrast, keyboard, Escape and outside-tap behavior are preserved. A CSS/DOM regression checks normal-flow positioning; rendered-width retesting remains a separate browser check.
