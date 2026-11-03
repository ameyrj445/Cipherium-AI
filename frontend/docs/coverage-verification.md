# Coverage verification (S3-3)

This work is on `feat/sarvesh-s3`, stacked on the unmerged S2 head `10d943b58abe1a3572c5a2f74c6b75f92ae2ec15`. It must not be treated as independent of the S2 work or merged without team review.

## Reproduce frontend measurement

From `frontend`, install the locked dependencies with `npm ci`, then run:

- `npm run test:coverage`
- `npm run lint`
- `npm run build`

Vitest V8 measures **all 59 product JavaScript/JSX files under `src`**, including components, hooks, services, utilities, tokens and the entry point. Only `src/test/**` is excluded. Unimported source remains in the denominator. The global branch threshold is 80% and the existing frontend CI job runs that command. This is an aggregate threshold, not 80% per file. Generated reports are ignored by Git.

The initial inclusive baseline was 61.24% branches (2378/3883), 67.89% lines, with 330 passing tests. The new tests exercise real component rendering, loading/error recovery, filters, callbacks, topic/plan progress, authentication, navigation, responsive behavior, storage failures and unmounts. The test inventory explains synchronous components that have no loading state; no fake loading props were added to make a checklist pass.

Tests exposed and fixed three existing frontend bugs:

1. Expanding a saved plan in LearnView referenced an undeclared callback due to a destructured prop alias mismatch.
2. KnowledgeGraphView displayed a General category for uncategorized nodes but filtered those same nodes out when General was selected.
3. A failed graph fetch left its error set when retry succeeded, preventing recovery.

All three have regression assertions. No backend implementation was changed.

## Measured frontend result

- At the S3-3 implementation checkpoint, 417 tests passed across 50 files. See `verification-status.md` for later aggregate results.
- Branches: **82.65% (3211/3885)**.
- Lines: **86.21% (2227/2583)**.
- Statements: **84.62%**; functions: **74.05%**.

The remaining files below 75% branch coverage are recorded for follow-up, not removed from the denominator:

| Source | Branch coverage |
|---|---:|
| `components/ActivityHeatmap.jsx` | 72.72% |
| `components/AnalyticsFullView.jsx` | 71.53% |
| `components/RetentionScheduleCard.jsx` | 74.24% |
| `components/SettingsView.jsx` | 68.67% |
| `components/StudyPlanView.jsx` | 73.64% |
| `components/TutorPanel.jsx` | 65.68% |
| `components/common/BlueprintWizard.jsx` | 59.45% |
| `components/common/GlobalSearch.jsx` | 57.93% |
| `components/common/NotificationDropdown.jsx` | 74.73% |
| `components/layout/EmptyState.jsx` | 73.33% |
| `components/layout/PageHeader.jsx` | 64.28% |

## Backend measurement

At the same source base, 188 existing backend tests passed using disposable SQLite and an external harness that blocked outbound networking before importing application code. Every Python source file in `app/routers` and `app/services` was measured, with no exclusions (18 files).

- Combined line/statement coverage: **1565/1937 = 80.795%**.
- Routers separately: **898/1168 = 76.884%**.
- Services separately: **667/769 = 86.736%**.

The combined >=80% target is met. If the team interprets acceptance as >=80% separately for each category or file, routers do not pass and need additional tests. Do not report every router/service as above 80%.

The first ordinary run was stopped after tests attempted external model calls; it yielded no valid measurement. The successful offline harness blocked 17 network operations, so this is evidence for local/mock/fallback behavior, not a live model integration. No original user database was modified. Logs, JSON measurement and the execution harness are retained as delivery artifacts, not as portable backend implementation changes.

## Remaining gates

Automated coverage is not proof of WCAG compliance, mobile visual correctness, live backend behavior, or green remote CI. A remote CI pass and teammate-reviewed PR are still required by the project definition of done. The next ordered task is the separate accessibility audit (S3-4).
