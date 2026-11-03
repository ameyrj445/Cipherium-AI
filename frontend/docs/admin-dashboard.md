# Admin dashboard: supported frontend scope

S2-1 is **partial**, not complete. The Questions, Resources and Feedback tabs
implement the currently available server contract, with no backend modifications.

- Sidebar entry is shown only for the exact `admin` role; the view independently
  checks role and token. Server `require_admin` remains the real authorization
  boundary. Each admin request is bound to the initiating session, has a timeout,
  and is aborted on unmount. Results from old sessions/filters are ignored.
- Questions default to drafts, with 25-row offset pagination, status filtering,
  publish/archive PATCH actions and an inline draft-authoring form. Correct answer
  must match a unique trimmed option; at least two choices are required. Topic IDs
  come from the existing curriculum topic list.
- Resource authoring uses POST `/admin/resources`. HTTP(S) URLs only, positive
  whole-number duration and known topics are validated before submission. The
  local success list is explicitly only resources added during the current visit.
- Feedback is a read-only, paginated all-user table using `/admin/feedback` and
  server-side type filtering. React text rendering prevents comments from becoming
  executable markup. It must not be exported or logged as part of frontend QA.

## Missing backend contract

The Notion assignment requires an existing-resource list and resource editing.
There is **no GET `/admin/resources` or content-update resource route** in the
inspected backend. POST `/admin/resources/{id}/version` only increments a counter;
it does not edit content. The frontend therefore does not invent these endpoints,
pretend recommendation results are the complete resource catalogue, or expose a
misleading edit button. Jay must supply authenticated list/update contracts before
this part can be integrated and tested.

## Write uncertainty and pagination

Creation requests have no server idempotency support. A network timeout/5xx may
occur after the server saves. The relevant mutation controls stay locked while
this panel remains mounted (including tab switches), with an explicit warning.
No automatic POST retry occurs. Navigating away/reloading resets this in-memory
lock; it is not durable exactly-once protection. Check saved state before manually
repeating an uncertain write; resource lookup currently needs backend assistance.
Refresh list remains available for question status readback. Server-side stable
ordering/snapshot pagination is not guaranteed, so concurrent edits can move
question/feedback rows between pages.

## Verification

Automated component/API tests cover role gating, tab keyboard interactions, exact
publish payload, draft validation, creation, filtering/pagination, empty/loading/
error states, literal feedback text, session changes, stale responses and ambiguous
write protection. Lint/build and full frontend suite must be rerun against the
final tree. Browser/mobile visual QA, real backend admin transactions, CI and
teammate PR review are separate verification gates; mocked tests do not prove them.

### Subsequent desktop verification

At `10d943b58abe1a3572c5a2f74c6b75f92ae2ec15`, isolated desktop QA with mocked data verified the admin navigation entry, three tabs, readable resource form and missing-endpoint notice, long question text wrapping, and a mocked Publish status update. Resource submission, feedback, loading/error and non-admin scenarios were not completed visually. Automated tests cover those behaviors separately. No real backend admin transaction or mobile/screen-reader result is claimed.
