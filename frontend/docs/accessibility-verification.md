# Accessibility verification — S3-4

Status: **partial manual acceptance**, not a WCAG conformance certification.

## Implementation-checkpoint aggregate result

441 tests across 53 files pass; inclusive frontend branch coverage 83.54%. Lint and production build pass with existing warnings. These are local cloud results, not remote CI or manual audit completion.

## Automated checks

`npm test -- src/test/a11y.test.jsx` runs jest-axe on the real App and navigation shell for Dashboard, Learn, Practice, Analytics, Settings, Tutor and Admin, with mocked network boundaries only. Empty and populated states are covered, including all admin tabs. Page-specific content is asserted before scans. Rules include WCAG 2 A/AA, 2.1 A/AA and 2.2 AA tags. Tests assert zero detected violations, not that all possible accessibility issues are absent.

JSDOM cannot perform layout, rendered color contrast, real browser Tab navigation or screen-reader announcements. Axe's canvas warnings are an explicit verification limitation; color-contrast rules are not globally disabled to conceal this. Pure contrast tests separately check opaque shared text/surface pairs, not the rendered page.

## Changes

- Associated Settings profile/preferences/key labels with their inputs.
- Named the saved-plan expand button and exposed expansion state.
- Made actionable metric cards native buttons.
- Added a first-focusable skip link and focusable main target.
- Mobile navigation is a labelled modal with initial focus, Tab wrapping, Escape, return focus, and inert background.
- Raised shared muted-text contrast and corrected several hardcoded low-contrast metadata/error colors.
- Shared text accent is separate from brand background colors.
- Focus indicators override inline `outline:none`; forced-color mode supported.

## Measured opaque pairs

- #9CA3AF metadata on #2A2A30 hover surface: 5.62:1 (other shared dark surfaces are higher).
- White primary-button label on #4F46E5: 6.29:1.
- #A5B4FC accent/focus on #2A2A30: 7.15:1.

These calculations do not establish contrast for every gradient, translucent overlay, chart label or state. Full rendered contrast audit remains required.

## Subsequent sampled desktop verification

A clean isolated desktop install at commit `1e6125e1011e1f58ff0513c3c3b7f96b23ab83f4` verified the first-focusable skip link and focus transfer to main, visible focus and Space activation of representative Study Plan/Practice controls, and accessible names for Resources search and Practice choices. Sampled Resources text contrast measured 17.00:1 (heading), 7.37:1 (description), and 6.54:1 (card summary). This is not a complete page/state or screen-reader audit. Later report-modal desktop checks are recorded in `tutor-feedback.md`.

## Remaining manual acceptance checklist

- Browser Tab/Shift+Tab order on all seven pages and populated/empty/error flows; no focus obscured by sticky elements.
- Actual NVDA or VoiceOver reading of labels, headings, controls and live messages.
- 200%/400% zoom, narrow mobile widths, large fonts and horizontal overflow.
- Native forced-colors mode and visible focus on every interactive element.
- Rendered body-text contrast >=4.5:1 across all pages, gradients and interaction states.
- Keyboard operation of drawers/dialogs and return focus in the real browser.

Automated keyboard events and inert-attribute assertions are regression tests, not substitutes for these manual checks. No backend/database changes. Remote CI and teammate-reviewed PR/merge are separate gates.

## Earlier mobile verification environment limitation

On 2026-11-03, an installed cloud Chromium/Playwright launch at a requested 390×844 viewport failed before a page rendered with `socket() failed: Operation not permitted`. The supported reviewed escalation failed for the same reason. No mobile result is claimed. The connected desktop browser previously offered no viewport-size/device-emulation controls. Do not treat JSDOM responsive tests as rendered-mobile evidence. See `verification-status.md` for the remaining test matrix.

## Subsequent narrow-viewport findings and candidate fix

The desktop browser later completed a sampled audit on published `469974e0` at
320/375/390/768 CSS pixels. Dashboard, Learn, Practice, Analytics and the top bar
had overflow/clipped-control findings. Settings, Tutor and Admin had no observed
overflow in those sampled states; skip-link/drawer/Admin keyboard samples passed.
Local `eac13c0e` addresses layout causes and passes 555 automated frontend tests,
including seven new reflow-contract/interaction regressions. Its rendered retest
is still pending. This is not a physical-device, full contrast or screen-reader
check. See `mobile-reflow.md`.
