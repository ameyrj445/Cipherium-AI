# Frontend verification status

Evidence checkpoint: 2026-11-03. Published bases: team S2 `e1fb9299` and stacked S3 `fa976545`. Latest local saved-card integration: `a7008072`.
This records observed results, not a release approval or WCAG certification.
Historical task reports retain their original totals; use the exact commit/tree
when comparing results. Future source changes require affected checks to rerun.

## Latest combined local result

The S3 saved-card integration commit `a7008072b697617096a698b90cd024c1e51d06d9`
(tree `ce7e0838978b9f240a97d1e7d6d1c51240574e12`) passed 548 frontend tests
across 57 files, inclusive branch coverage 83.99%, lint (with existing warnings),
production build and four bundle tests. Initial static-import JavaScript closure
measured 164,861 gzip bytes (<250,000 gate). Five isolated actual-App/FastAPI/SQLite
journeys passed on that same tree. The following documentation-only refresh does
not change product code. At this evidence checkpoint, these local saved-card commits have not yet been published.

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
  the existing load-time generation risk must be resolved with the backend owner.
- Recommendation saved-card/tooltip behavior is implemented and locally tested.
  Real browser/mobile/assistive-technology checks remain outstanding. The assignment
  specifies `rec_rating` but existing Too easy/Too hard types adjust overall difficulty;
  product/backend confirmation is needed before changing that mapping.

## Narrow-card correction checkpoint

Actual narrow-viewport PC QA found the previous above-trigger tooltip overlapped rating controls at 320/390/768 widths, without horizontal overflow. The correction places the tooltip in normal document flow below its trigger. All automated gates above were rerun on the corrected product tree; browser rechecking of those widths remains pending. The new CSS/DOM test verifies normal-flow declarations and ordering, not measured browser geometry.
