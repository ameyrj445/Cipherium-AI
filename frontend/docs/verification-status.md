# Frontend verification status

Evidence checkpoint: 2026-11-03. Published bases: team S2 `3fc50885` and stacked S3 `469974e0`. Latest local mobile-reflow candidate: `eac13c0e`.
This records observed results, not a release approval or WCAG certification.
Historical task reports retain their original totals; use the exact commit/tree
when comparing results. Future source changes require affected checks to rerun.

## Latest combined local result

The mobile-reflow candidate `eac13c0e68cbe4db28a566f28e1b927c3e00c566`
(tree `0c6cb0e99cf9a1fd474098d6527210a322ab3b3a`) passed 555 frontend tests
across 58 files, 84.07% branch coverage, lint with existing warnings, production
build and four bundle checks. Initial static-import JavaScript closure measured
165,057 gzip bytes (<250,000 gate). Five isolated actual-App/FastAPI/SQLite journeys
passed. It fixes layout causes found in the desktop browser's narrow-viewport audit;
rendered acceptance on this candidate remains pending. See `mobile-reflow.md`.
No push, PR or merge is implied by this local candidate.

### Previous saved-card checkpoint

The S3 saved-card integration commit `a7008072b697617096a698b90cd024c1e51d06d9`
(tree `ce7e0838978b9f240a97d1e7d6d1c51240574e12`) passed 548 frontend tests
across 57 files, inclusive branch coverage 83.99%, lint (with existing warnings),
production build and four bundle tests. Initial static-import JavaScript closure
measured 164,861 gzip bytes (<250,000 gate). Five isolated actual-App/FastAPI/SQLite
journeys passed on that same tree. The following documentation-only refresh does
not change product code. These saved-card commits were subsequently published to the team branches listed above.

S2 saved-card commit `3fc50885a02339b5d09e60482279cf602b3a2657` passed 426 tests,
lint and production build. Its 24 new tests cover success/pending/error/uncertain
states, valid targets, session changes, resource access and tooltip interactions.
The earlier report-modal integration passed 524 tests and remains historical evidence.

The integration server used synthetic accounts, a disposable database and actual
product offline fallbacks with external providers disabled. Optional Chroma and
transformers packages were omitted. These are not live Gemini tests, a full
production-stack benchmark, or proof of every backend transaction. Export tests
verify payload bytes and the download action, not a file saved on a device.

No remote CI success is established by these local results. The existing workflow
runs selected branch pushes and PRs targeting main/master, not these feature-branch
pushes. No teammate-reviewed PR/main merge is recorded at this checkpoint.

## Manual checks already observed

- Desktop conversation UI: list/selection/New Conversation, long text and mocked
  loading/error states at `c9279406`.
- Admin desktop subset: navigation/tabs/resource form/missing-endpoint notice,
  long question text and mocked Publish at `10d943b5`; other admin visual states
  were not completed.
- Sampled desktop keyboard and Resources contrast at `1e6125e1`, detailed in
  `accessibility-verification.md`.
- Lazy-view desktop smoke at `475f4a09`, detailed in `bundle-budget.md`.
- Adaptive quiz completion retry at `d4c06fec`: one mocked answer submission,
  two completion calls after one simulated failure; no duplicate answer.
- Report modal desktop checks at `fa976545`, detailed in `tutor-feedback.md`.

These checks used isolated copies and mocked API data. They do not validate live
backend persistence, mobile rendering, or screen-reader speech.

## Narrow-viewport audit on the published base

A desktop browser audit on `469974e0` at 320, 375, 390 and 768 CSS pixels found
Dashboard overflow at every width, Learn overflow at 320/375/390, clipped Practice
mode controls at 320, offscreen Analytics Practice actions at 320/375/390, and
shared top-bar controls outside the narrow viewport. Settings, Tutor and Admin
showed no overflow in the sampled states. Sampled skip-link/drawer/Admin keyboard
checks passed. This used mock data in an isolated copy, not live backend or a
physical mobile device. The new candidate addresses those findings but must be
retested in the browser before any fixed/pass claim.

## Remaining verification matrix

Run with synthetic data and an isolated test environment. Never use the user's
existing database for destructive account, roadmap or admin checks.

| Area | Procedure | Required evidence |
| --- | --- | --- |
| Mobile/reflow | Dashboard, Learn, Practice, Analytics, Settings, Tutor and Admin at 320, 390 and 768 CSS-pixel widths; populated/empty/error states and 200%/400% zoom | Screenshots with viewport/commit; no unintended page overflow, clipped actions or inaccessible dialogs |
| Modal/drawer | Tab/Shift+Tab, Escape, return focus, background inertness, long content, touch targets; repeat after navigation | Actual browser observations, not only synthetic keyboard events |
| Screen reader | NVDA or VoiceOver on seven assigned pages; labels, headings, errors, live status, expanded/selected state | Screen-reader/version and specific observed announcements; unresolved issues listed |
| Contrast/focus | Rendered body text, links, metadata, gradients, disabled/error states and focus indicators on all pages | Measured foreground/background/state, not a single shared-token calculation |
| Admin | Role-gating, feedback, resource creation and loading/error scenarios | Desktop/mobile observations and separate isolated backend persistence assertions |
| Report | Submit a synthetic bug/comment report and independently read back persistence | Actual isolated backend result; do not claim an answer link not sent by the API |
| Password | Complete real email delivery/reset with approved test mailbox/configuration | Confirmed delivered mail and successful reset; never record reset secrets |

The mobile widths are a proposed verification matrix, not claimed acceptance
wording or completed results. A narrow viewport screenshot alone does not prove
mobile device behavior or WCAG conformance.

## Known feature dependencies, not test failures

- Admin existing-resource list/edit needs backend endpoints.
- Fresh-answer ratings need persisted assistant IDs and server-side protection.
- Quota UI needs actual usage/quota and reliable reset metadata.
- Current-plan regeneration needs consistent plan identity and safe targeting;
  the unsafe unused load-time generation call has now been removed, while the backend identity/targeting contract still needs repair.
- Recommendation saved-card/tooltip behavior is implemented and locally tested.
  Real browser/mobile/assistive-technology checks remain outstanding. The assignment
  specifies `rec_rating` but existing Too easy/Too hard types adjust overall difficulty;
  product/backend confirmation is needed before changing that mapping.

## Narrow-card correction checkpoint

Actual narrow-viewport PC QA found the previous above-trigger tooltip overlapped rating controls at 320/390/768 widths, without horizontal overflow. The correction places the tooltip in normal document flow below its trigger. All automated gates above were rerun on the corrected product tree; browser rechecking of those widths remains pending. The new CSS/DOM test verifies normal-flow declarations and ordering, not measured browser geometry.

## AI quota frontend preparation (2026-11-03)

S3-1 now has fixture-tested presentation and exact server-quota-rejection handling.
Production settings remain **Usage unavailable**, with no synthetic percentage or
reset date. No fixture is wired into App or enabled by configuration. Live meter,
90% proactive warning and metadata-driven reset remain backend-blocked; see
`ai-quota.md`. This addition does not close those acceptance requirements.

## Study-plan freshness frontend preparation (2026-11-03)

S3-2 prepares an unavailable production notice plus test-only freshness/refresh
states. Regeneration stays disabled, and no status API is consumed. The unused
load-time generation call was removed to prevent automatic cross-plan overwrites.
649 frontend tests across 63 files, 84.92% inclusive branch coverage, lint/build,
four bundle checks and six isolated real-backend journeys passed on this product
tree. Chromium launch was blocked by the cloud runtime, so no browser/mobile pass
is claimed. Live activation remains backend-blocked; see `study-plan-freshness.md`.
