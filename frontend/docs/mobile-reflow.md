# Mobile layout follow-up

## Evidence and scope

Published S3 base: `469974e037a2e2155fce655b6c46449cc9cceca6`.
Candidate: `59e6ecf807f548686fe61562ce9f3ed5f469205b`.
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
- Search/notification panels fit the narrow viewport and available screen height.
  Search results remain aligned to the search control on wider screens.

## Automated result on candidate

- 555 tests in 58 files pass; inclusive branch coverage 84.04%.
- Seven new tests protect grid opt-in, four small-width statistic fixtures,
  Practice-mode interactions and long-account-name header actions.
- Lint passes with existing warnings. Production build and four bundle checks pass;
  initial static-import JavaScript closure 165,050 gzip bytes (<250,000).
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
- Open search with/without results and notifications at 320; all panel edges and
  close/dismiss interactions remain reachable. Test a long account name.
- Retain skip-link order, drawer focus trap/Escape/return focus and focus visibility.
- Recheck Settings/Tutor/Admin to catch shared-container regressions.

Status: candidate awaiting independent review and PC rendered retest; not pushed.
Physical touch-device behavior, full screen-reader/contrast audit and 200%/400%
zoom remain separate acceptance checks.
