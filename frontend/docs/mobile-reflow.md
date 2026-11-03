# Mobile layout follow-up

## Evidence and scope

Published S3 base: `469974e037a2e2155fce655b6c46449cc9cceca6`.
Candidate: `eac13c0e68cbe4db28a566f28e1b927c3e00c566`.
Date: 2026-11-03. Frontend only; no backend, database, authentication or API changes.

The desktop-browser audit used isolated mocked data and responsive widths
320/375/390/768 CSS pixels. It found:

- Dashboard: overflow at all four widths; desktop content spans and stat cards.
- Learn: overflow by 81/26/11px at 320/375/390; none observed at 768.
- Practice: Timed Exam control clipped at 320.
- Analytics: Practice action outside the viewport at 320/375/390.
- Shared header: search/right controls outside narrow viewports.
- Settings, Tutor, Admin: no observed overflow in sampled states.

## Changes

- Grid-mode PageContainer panels stack below 1024px, matching StickyRail's existing
  breakpoint. Non-grid/full-height layouts keep their existing layout mode.
- Statistics, roadmap/blueprint/resource/challenge cards use a minimum track size
  bounded by available width. Large statistic values may wrap rather than disappear.
- Learn plan summaries/actions/hours, section actions, page mode controls and
  Analytics triage actions wrap without removing their callbacks or accessible names.
- Header search can shrink. Narrow screens retain the drawer, search, notification
  and account controls while omitting duplicate breadcrumbs and visible account name.
- Profile-menu names wrap even when they contain a long unbroken string.
- Search/notification panels fit the narrow viewport and available screen height
  below 768px, including intermediate 640px widths with long account names.
  Search results remain aligned to the search control on wider screens.

## Automated result on candidate

- 555 tests in 58 files pass; inclusive branch coverage 84.07%.
- Seven new tests protect grid opt-in, four small-width statistic fixtures,
  Practice-mode interactions and long-account-name header actions.
- Lint passes with existing warnings. Production build and four bundle checks pass;
  initial static-import JavaScript closure 165,057 gzip bytes (<250,000).
- Five actual-App journeys pass against isolated real FastAPI/SQLite with external
  providers disabled. No user database is accessed by that harness.
- `git diff --check` passes.

JSDOM validates contracts/interactions, not geometry. These results are not a
rendered-mobile pass, remote CI result or WCAG conformance claim.

## Required rendered retest before publishing

- Dashboard, Learn (empty/populated/expanded/explore), Practice (all three modes),
  Analytics and header at 320/375/390/768; desktop smoke at 1280+.
- No unintended horizontal page overflow or clipped controls; real clicks on
  Practice and Learn actions still navigate as expected.
- Open search with/without results and notifications at 320 and 640; type, clear
  and select a result; all panel edges and
  close/dismiss interactions remain reachable. Test a long account name.
- Retain skip-link order, drawer focus trap/Escape/return focus and focus visibility.
- Recheck Settings/Tutor/Admin to catch shared-container regressions.

Status: candidate awaiting independent review and PC rendered retest; not pushed.
Physical touch-device behavior, full screen-reader/contrast audit and 200%/400%
zoom remain separate acceptance checks.

## Retention-card follow-up — 2026-11-03

PC mocked-App audit of team commit `52663d5` found the Dashboard empty retention
schedule's 290px minimum track clipped text inside its 216px content area at a
320px viewport. This candidate changes that track minimum to `min(290px, 100%)`,
retaining the 290px desktop grid behavior. Populated topic cards also allow long
unbroken names/codes, status labels, metrics and quiz actions to wrap.

Local automated candidate results: 562 tests across 59 files, 84.33% inclusive
branch coverage, lint (existing warnings), production build, four bundle checks
and five isolated actual-App/FastAPI/SQLite journeys pass. Initial static-import
JavaScript closure: 165,585 gzip bytes. Two added tests protect the empty-grid and
long-content style/interaction contracts; JSDOM does not measure pixel layout.

Awaiting independent review and rendered retest before publication: empty and
populated Dashboard retention cards at 320/375/390/640 and desktop 1280+, including
long unbroken topic names/codes, all review statuses and clicking the quiz action.
Check card/text edges, not only document scroll width (overflow can be clipped).
Narrow viewport checks are reflow approximations, not actual browser zoom tests.
No screen-reader, physical touch-device or full WCAG-conformance claim is made.
