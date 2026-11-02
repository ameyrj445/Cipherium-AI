# Persistent tutor conversations

The Tutor sidebar loads authenticated conversation pages (20 at a time), opens
saved message histories with their actual IDs, and starts a new persisted thread
immediately when New Conversation is pressed. It clears the message area, disables
the composer until creation succeeds and guards repeated clicks. Rename/delete are
not offered because APIs are absent. New threads save the selected syllabus topic and a topic/date title; conversation IDs distinguish otherwise similar titles.


Every request carries the expected login token. Changing login or conversation
invalidates pending read/stream/create callbacks. An in-flight answer cannot
appear in another thread. Switching aborts the client request, not necessarily
server work. Reopen the original conversation to see what was saved.

Streaming sends the active conversation_id and explicit topic_id. Only explicit
404/405/501 responses before any text trigger the conversation-specific standard
endpoint (or /tutor/chat with the same conversation_id for General context, to avoid saved-topic inheritance); network errors, timeouts, incomplete streams, rate limits and partial
responses are never automatically resubmitted. An ambiguous result blocks sending
until the learner reopens a thread or deliberately starts another conversation. Creation
errors similarly warn that a server row may already exist. These are not server
idempotency guarantees.

## Backend limitations / handoff

- Earlier history is read-only and explicitly shows the oldest 30 messages across
  all chats. The history endpoint omits conversation_id, has no skip parameter and
  cannot distinguish unthreaded legacy messages. It is not called recent history.
- Conversation lists paginate by offset; concurrent insert/reordering can skip a
  row. The client deduplicates overlapping pages, and Refresh resets the offset.
- Conversation messages are returned in full; no message pagination is available.
- Streaming yields its final event before persisting the assistant response and
  does not supply a saved message ID. New responses remain unrateable until loaded
  later from persisted history. Completion is not proof of durable saving. The
  client avoids aborting a completed stream during subsequent navigation.
- Streaming does not inherit the thread topic or auto-title it; the client supplies
  topic explicitly. Creation supplies an explicit topic/date title. Topic changes apply to the next
  turn, but no API updates the thread's topic metadata.
- No backend/database modifications, rename/delete APIs, quota changes or ownership
  policy changes are part of this frontend task.

Responsive panels collapse below 900px and stack when opened. Automated tests cover
selection races, account changes, double sends, creation errors, pagination,
streaming/fallback isolation, partial failures, legacy history and UI states.
