# Initial JavaScript budget (S3-5)

Implemented on `feat/sarvesh-s3`, stacked on unmerged S2 work.

## Reproduce

```sh
npm ci
npm run test:coverage
npm run test:bundle
```

`test:bundle` always builds first, then runs `scripts/bundle-size.test.js` with Node's test runner. The existing frontend CI job invokes this command after coverage and lint. CI trigger branches remain unchanged: feature pushes do not independently trigger this workflow; the main-targeting PR does. Remote CI success is not claimed by local test results.

## Measurement and result

The limit is **strictly less than 250,000 bytes**, interpreting KB conservatively as decimal. The measurement sums individually gzip-compressed production JS files using Node zlib's default gzip settings. It starts with all manifest entry points and recursively includes every static `imports` dependency, deduplicating shared files and cycles. HTML scripts and modulepreload links are also included. Missing artifacts, missing manifest links, external scripts and nonempty executable inline scripts fail rather than being silently skipped. Genuine `dynamicImports` are excluded from *initial* JS, but remain part of the total application download after navigation.

- Before: one JS entry, **293,434 gzip bytes** by the same Node gzip method (Vite console reported 295.71 kB with its own compressor settings).
- After: entry **138,599** + shared runtime **23,393** = **161,992 gzip bytes** (~44.8% reduction).
- These measurements are compressed JS artifact sizes, not measured network transfer, parse time or page performance. CSS, font and image bytes are not part of the specified JS budget.
- The raw entry remains above Vite's 500 kB advisory threshold. The warning is retained, not suppressed; the gzip initial-JS requirement still passes.

`AnalyticsFullView`, `KnowledgeGraphView` and `AdminView` use React.lazy with an accessible Suspense loading announcement inside the existing view-scoped ErrorBoundary. Navigation remains available during loading. Recharts and analytics-specific CSS now load with Analytics instead of the entry. The production-manifest test also asserts that the three assigned views remain dynamic and absent from the initial static closure.

The manifest inspection identifies Analytics as the largest deferred JS chunk (~462 kB raw). No generated manual vendor partitions or artificial entry exclusions were used. The static public assets are small SVGs (favicon ~9.5 kB and icons ~5 kB); no >100 kB public/source static assets required an additional deferred loader.

## Verification

- 443 frontend tests across 54 files pass; inclusive branch coverage 83.54%.
- Four bundle tests pass: actual production budget/lazy chunks, strict boundary rejection, static graph deduplication/cycles/missing links, and fail-closed artifact/HTML-only preload accounting.
- Navigation tests explicitly cover deferred resolution, abandoning a pending view, revisiting it, rejected chunk containment and navigation recovery. Existing real-page axe scans still pass after asynchronous page loading.
- Lint passes with existing warnings; production build passes with the retained raw-entry advisory.
- Independent review passed. Browser/network inspection, remote CI and teammate PR/merge are separate gates. No browser performance or mobile visual pass is claimed.

## Chunk-load failure behavior

A rejected lazy import is contained by the existing page ErrorBoundary. The shell remains usable to choose another page. React caches a rejected lazy import; the existing view-only “Try again” action does not guarantee a network refetch. Reloading the browser is the reliable retry after a transient deployment/network chunk failure. This is documented rather than silently issuing repeated downloads or resetting user application state.
