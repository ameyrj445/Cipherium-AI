# Cipherium-AI — AdaptiveAI SRS Feature Tracker

> **Document:** AdaptiveAI SRS Implementation & Feature Verification Checklist  
> **Target System:** Cipherium-AI (FastAPI + React + PostgreSQL + scikit-learn)  
> **Status Legend:**  
> - ✅ `Implemented` — Fully implemented and verified in the codebase  
> - 🔶 `Partial / Variant` — Implemented but incomplete, variant design, or heuristic  
> - ⏳ `Backlog / Pending` — Planned in SRS (P0/P1/P2/P3), not yet built  
> - ❌ `Out of Scope (MVP)` — Explicitly excluded for MVP per SRS Section 1.3  

---

> Verification totals below are an implementation inventory, not release approval. Latest frontend evidence and unresolved acceptance gates: `frontend/docs/verification-status.md`.

## 📊 High-Level Implementation Dashboard

| Category | Total Requirements | ✅ Implemented | 🔶 Partial / Variant | ⏳ Backlog | Progress (%) |
|---|:---:|:---:|:---:|:---:|:---:|
| **1. Identity & Profile (FR-AUTH / FR-PROF)** | 9 | 9 | 0 | 0 | **100.0%** |
| **2. Curriculum & Content (FR-CUR)** | 7 | 6 | 0 | 1 | **85.7%** |
| **3. Diagnostic & Quiz Engine (FR-QUIZ)** | 8 | 8 | 0 | 0 | **100.0%** |
| **4. Mastery & Cognitive Modeling (FR-MAST)** | 8 | 8 | 0 | 0 | **100.0%** |
| **5. Recommendations & Adaptivity (FR-REC)** | 6 | 6 | 0 | 0 | **100.0%** |
| **6. Personalized Roadmap (FR-ROAD)** | 5 | 5 | 0 | 0 | **100.0%** |
| **7. AI Tutor & Pedagogical RAG (FR-TUTOR)** | 10 | 10 | 0 | 0 | **100.0%** |
| **8. Dashboard & Reporting (FR-DASH)** | 6 | 5 | 0 | 1 | **83.3%** |
| **9. Administration & CMS (FR-ADMIN)** | 3 | 3 | 0 | 0 | **100.0%** |
| **10. Non-Functional Requirements (NFR)** | 12 | 9 | 2 | 1 | **75.0%** |
| **11. Database Schema Specifications** | 19 | 18 | 0 | 1 | **94.7%** |
| **12. REST API Endpoints Contract** | 20 | 20 | 0 | 0 | **100.0%** |
| **TOTAL** | **113** | **107** | **2** | **4** | **94.7%** |

```
Overall Progress:
[█████████████████████████████████████████████████░] 94.7% (107 Completed / 2 Partial / 4 Backlog)
```

---

## 1. Identity & Profile Requirements

| Requirement ID | Priority | Description | Status | Current Codebase Implementation & Location |
|---|:---:|---|:---:|---|
| **FR-AUTH-01** | P0 | User registration & authentication with password encryption | ✅ Implemented | `backend/app/routers/auth.py` (`/auth/register`, `/auth/login`) with 12-round native Bcrypt hashing and legacy SHA-256 upgrade. |
| **FR-AUTH-02a** | P0 | Stateless JWT session tokens & expiration | ✅ Implemented | HMAC-SHA256 JWTs with 12h default TTL via `app/services/auth.py`. |
| **FR-AUTH-02b** | P0 | Client-side session termination / logout | ✅ Implemented | Handled in React client session store upon logout or token expiry. |
| **FR-AUTH-02c** | P0 | Password reset flow via verified email | ✅ Implemented | Cryptographic time-limited tokens via itsdangerous in `app/services/email.py`, `/auth/forgot-password` and `/auth/reset-password` in `app/routers/auth.py`, and dedicated `PasswordRecovery.jsx` UI. |
| **FR-AUTH-02d** | P0 | Per-IP / per-user login rate-limiting | ✅ Implemented | SlowAPI rate limiter middleware with 10/min on `/auth/login`, 5/min on `/auth/forgot-password`, and 30/min on `/tutor/chat` with 429 `Retry-After`. |
| **FR-PROF-01** | P0 | Profile preferences: target goal, weekly hours, difficulty | ✅ Implemented | `UserSettings` model (`target_role`, `weekly_hours`, `difficulty_mode`, notification toggles) via `GET/PUT /settings/profile`. |
| **FR-PROF-02a** | P0 | Learner preference editing UI/API | ✅ Implemented | `PUT /settings/profile` and frontend `SettingsView.jsx`. |
| **FR-PROF-02b** | P0 | Learner GDPR data export | ✅ Implemented | `GET /me/export` returns complete privacy export containing profile, quiz attempts, study plans, tutor chat history, and mastery states. |
| **FR-PROF-02c** | P0 | Account deletion workflow | ✅ Implemented | `DELETE /auth/me` and `DELETE /me` soft-deletes user, anonymizes PII, cascades access revocation. |

---

## 2. Curriculum & Content Requirements

| Requirement ID | Priority | Description | Status | Current Codebase Implementation & Location |
|---|:---:|---|:---:|---|
| **FR-CUR-01** | P0 | Domain hierarchy: Subject → Module → Topic → Resource | ✅ Implemented | Modeled across `SubjectRoadmap`, `Topic`, and `Resource` in `app/models/__init__.py`. |
| **FR-CUR-02a** | P0 | Prerequisite Directed Acyclic Graph (DAG) representation | ✅ Implemented | Normalized relational `TopicPrerequisite` junction table (`app/models/topic_prerequisite.py`) and topological analysis in `app/services/knowledge_graph.py`. |
| **FR-CUR-02b** | P0 | Prerequisite cycle detection | ✅ Implemented | 3-Color DFS cycle detector (`detect_circular_dependencies`) prevents cyclic dependencies. |
| **FR-CUR-02c** | P0 | Topological depth ordering & status resolution | ✅ Implemented | Kahn's algorithm (`calculate_topological_depths`) resolves topic state: `locked`, `unlocked`, or `mastered`. |
| **FR-CUR-03** | P0 | Question attributes: topic, difficulty (1–5), explanation, answers | ✅ Implemented | `Question` model stores `difficulty`, JSON `options`, `correct_answer`, `explanation`. |
| **FR-CUR-04** | P1 | Question immutable versioning for historical attempts | ⏳ Backlog | Questions currently lack explicit `version` column referenced in `QuizAttempt`. |
| **FR-CUR-05** | P1 | Content editor review & approval workflow | ✅ Implemented | Admin Question CMS (`GET/POST/PUT/DELETE /admin/questions`) enforces CRUD permissions and moderation. |

---

## 3. Diagnostic & Adaptive Quiz Engine

| Requirement ID | Priority | Description | Status | Current Codebase Implementation & Location |
|---|:---:|---|:---:|---|
| **FR-QUIZ-01** | P0 | Diagnostic assessment generation across prerequisites & targets | ✅ Implemented | `POST /quizzes/exam` creates timed mock diagnostic examinations across topics. |
| **FR-QUIZ-02** | P0 | Single-answer Multiple Choice Questions (MCQ) | ✅ Implemented | MCQ option shuffling to prevent positional bias (`GET /quizzes/next`). |
| **FR-QUIZ-03a** | P0 | Persist attempt: answer, correctness, elapsed time, timestamp | ✅ Implemented | `QuizAttempt` stores `selected_answer`, `is_correct`, `time_taken_seconds`, and `attempted_at`. |
| **FR-QUIZ-03b** | P0 | Persist hint usage count per attempt | ✅ Implemented | `hint_count` persisted on `QuizAttempt` with proportional scoring penalty and zero-floor protection. |
| **FR-QUIZ-04a** | P0 | Enforce one scored submission per question per session | ✅ Implemented | Relational `QuizSession` model tracks attempt bounds and finalizes sessions via `POST /quizzes/{id}/complete`. |
| **FR-QUIZ-04b** | P0 | Idempotency-Key header support | ✅ Implemented | Supported on `POST /quizzes/attempts` via in-memory and Redis-ready cache in `app/utils/idempotency.py`. |
| **FR-QUIZ-05** | P0 | Real-time mastery update upon submission | ✅ Implemented | `POST /quizzes/attempts` triggers `calculate_topic_mastery`, updates `TopicMastery`, and logs audit trail. |
| **FR-QUIZ-06** | P1 | Avoid immediate duplicate questions | ✅ Implemented | `GET /quizzes/next` filters against `user_attempted_qids` set. |

---

## 4. Mastery & Cognitive Modeling

| Requirement ID | Priority | Description | Status | Current Codebase Implementation & Location |
|---|:---:|---|:---:|---|
| **FR-MAST-01** | P0 | Per-user, per-topic mastery score [0, 1] + evidence count | ✅ Implemented | `TopicMastery` tracks `mastery_score`, `attempt_count`, and `correct_count`. |
| **FR-MAST-02** | P0 | Weighted mastery formula | ✅ Implemented | $M = 0.7 \times \text{Overall Accuracy} + 0.3 \times \text{Recency (last 5)}$ in `services/analytics.py`. |
| **FR-MAST-03** | P0 | Cold-start uncertainty protection (< 3 attempts) | ✅ Implemented | Thresholding flags topics with $< 3$ attempts as `insufficient_data`. |
| **FR-MAST-04** | P0 | Discrete mastery tiers (`insufficient_data`, `weak`, `developing`, `strong`) | ✅ Implemented | Exact thresholds: $<0.50$ `weak`, $0.50-0.75$ `developing`, $>0.75$ `strong`. |
| **FR-MAST-05a** | P1 | Bayesian Knowledge Tracing (BKT) cognitive modeling | ✅ Implemented | Corbett-Anderson BKT ($P(L_0)=0.20, P(T)=0.15, P(S)=0.10, P(G)=0.25$) in `services/bkt_service.py`. |
| **FR-MAST-05b** | P1 | Ebbinghaus / SM-2 spaced repetition decay | ✅ Implemented | $R(t) = e^{-\Delta t / S}$ memory stability; schedules persisted to `ReviewSchedule` table (`app/models/review_schedule.py`). |
| **FR-MAST-05c** | P1 | Supervised ML Topic Risk Classifier (OULAD) | ✅ Implemented | 100-estimator Random Forest (`weak_topic_classifier.joblib`) with batched vector inference in `app/ml/predictor.py`. |
| **FR-MAST-05d** | P1 | Holdout empirical comparison between BKT and heuristic | ✅ Implemented | `backend/scripts/benchmark_models.py` benchmarks OULAD dataset on BKT vs Random Forest; telemetry served at `GET /analytics/model-info`. |

---

## 5. Recommendations & Adaptivity

| Requirement ID | Priority | Description | Status | Current Codebase Implementation & Location |
|---|:---:|---|:---:|---|
| **FR-REC-01a** | P0 | Multi-factor recommendation ranking score | ✅ Implemented | Zone of Proximal Development (ZPD) score: $S = 0.5 \times \text{Weak Topic} + 0.3 \times \text{Difficulty Fit} + 0.2 \times \text{Prereq Fit}$. |
| **FR-REC-01b** | P0 | Filter out topics with unmet hard prerequisites | ✅ Implemented | Recommendations respect DAG dependency states and normalized prerequisite links. |
| **FR-REC-02** | P0 | Explainable recommendation reasoning | ✅ Implemented | `recommendation_reason` dynamically generated in `ResourceResponse`. |
| **FR-REC-03** | P1 | Dynamic difficulty staircase adaptation | ✅ Implemented | $\ge 85\%$ accuracy steps difficulty up $+1$; $< 50\%$ steps difficulty down $-1$. |
| **FR-REC-04** | P1 | Explicit learner feedback (`too_easy`, `too_hard`, `not_relevant`) | ✅ Implemented | `POST /feedback` endpoint with `Feedback` ORM model supporting `tutor_rating`, `rec_rating`, `bug`, `too_easy`, `too_hard`, and `not_relevant`. |
| **FR-REC-05** | P2 | Contextual Bandit policy (LinUCB / Thompson Sampling) | ✅ Implemented | Epsilon-greedy bandit ($\epsilon = 0.1$) in `app/services/bandit.py` with online reward updates persisted in `RecommendationArm`. |

---

## 6. Personalized Roadmap

| Requirement ID | Priority | Description | Status | Current Codebase Implementation & Location |
|---|:---:|---|:---:|---|
| **FR-ROAD-01** | P0 | Automated study plan generation from time budget & prerequisites | ✅ Implemented | `POST /roadmaps/generate` and `POST /roadmaps/custom` in `services/study_plan_generator.py`. |
| **FR-ROAD-02** | P0 | Curated duration estimates for milestones and resources | ✅ Implemented | Detailed estimated hours per subtopic and milestone in curated blueprints. |
| **FR-ROAD-03** | P0 | Non-destructive daily task rescheduling | ✅ Implemented | `DailyTask` table (`GET /tasks/today`, `PUT /tasks/{id}/toggle`). |
| **FR-ROAD-04** | P1 | Dynamic roadmap regeneration upon mastery changes | ✅ Implemented | `is_plan_stale()` and `regenerate_if_stale()` auto-regenerate outdated study plans on quiz completion (`GET /roadmaps/status`). |
| **FR-ROAD-05** | P1 | Interactive milestone & task progress tracking | ✅ Implemented | `PUT /roadmaps/progress` updates completed subtopics and resources. |

---

## 7. AI Tutor & Pedagogical RAG

| Requirement ID | Priority | Description | Status | Current Codebase Implementation & Location |
|---|:---:|---|:---:|---|
| **FR-TUTOR-01** | P1 | Topic-grounded contextual chat | ✅ Implemented | `POST /tutor/chat` injects curriculum syllabus and topic metadata into LLM system context. |
| **FR-TUTOR-02a** | P1 | Vector embeddings RAG pipeline over course materials | ✅ Implemented | Chroma-backed vector pipeline in `backend/app/services/rag.py` with chunking, retrieval, and document ingestion via `ingest_docs.py`. |
| **FR-TUTOR-02b** | P1 | Source citations attached to tutor responses | ✅ Implemented | Responses attach curated learning resource titles and chunk IDs. |
| **FR-TUTOR-03** | P1 | Pedagogical modes: Socratic, Direct, Exam-Prep | ✅ Implemented | Structured system personas: Socratic hint scaffolding, direct technical breakdown, Big-O exam prep. |
| **FR-TUTOR-04** | P1 | Anti-cheating answer suppression during active quizzes | ✅ Implemented | Anti-cheat lock in `backend/app/services/quiz_lock.py` returns 403 when a student queries the tutor during an active quiz. |
| **FR-TUTOR-05a** | P1 | Real-time Server-Sent Events (SSE) streaming | ✅ Implemented | `POST /tutor/stream` streams tokens with low TTFB. |
| **FR-TUTOR-05b** | P1 | Token quotas & per-user LLM spending caps | ✅ Implemented | `monthly_token_used` and `token_quota` tracked on `UserSettings`; enforces 429 quota ceiling and resets on day 1. |
| **FR-TUTOR-06** | P1 | Dialogue telemetry (latency, token usage, retrieval IDs) | ✅ Implemented | `latency_ms`, `token_count`, and `retrieval_chunk_ids` recorded on `TutorMessage`; monitored via `GET /analytics/tutor-stats`. |
| **FR-TUTOR-07a** | P1 | Fallback mode when LLM is unavailable or offline | ✅ Implemented | Grounded deterministic heuristic knowledge engine activates when `GEMINI_API_KEY` is absent. |
| **FR-TUTOR-07b** | P1 | Prompt injection & untrusted context sanitization | ✅ Implemented | Defense-in-depth sanitization in `app/utils/sanitize.py` with null-byte stripping, 2000-char length truncation, and regex injection signature detection. |

---

## 8. Dashboard & Reporting

| Requirement ID | Priority | Description | Status | Current Codebase Implementation & Location |
|---|:---:|---|:---:|---|
| **FR-DASH-01a** | P0 | Multi-axis Competency Radar Chart | ✅ Implemented | `CompetencyRadarChart.jsx` visualizes relative mastery across curriculum subfields. |
| **FR-DASH-01b** | P0 | GitHub-style 365-day practice activity heatmap | ✅ Implemented | `ActivityHeatmap.jsx` powered by `GET /analytics/activity-heatmap`. |
| **FR-DASH-01c** | P0 | Active study streak counter | ✅ Implemented | `GET /analytics/streak` computes current and longest streak days. |
| **FR-DASH-02** | P0 | Weak topic diagnostics & remediation cards | ✅ Implemented | `AnalyticsPanel.jsx` and active-recall flashcard decks (`GET /analytics/flashcards`). |
| **FR-DASH-03** | P1 | Spaced repetition memory retention card | ✅ Implemented | `RetentionScheduleCard.jsx` displaying memory stability and review urgency tags backed by `ReviewSchedule`. |
| **FR-DASH-04** | P1 | Export learning summary (PDF / CSV) | ⏳ Backlog | Frontend rendering only; backend PDF/CSV export endpoint not implemented. |

---

## 9. Administration & CMS

| Requirement ID | Priority | Description | Status | Current Codebase Implementation & Location |
|---|:---:|---|:---:|---|
| **FR-ADMIN-01** | P1 | Content lifecycle management (`draft`, `review`, `published`, `archived`) | ✅ Implemented | Admin Question CMS (`/admin/questions`) provides full authoring, editing, and publishing controls. |
| **FR-ADMIN-02** | P1 | Privacy-preserving aggregated student performance metrics | ✅ Implemented | `GET /admin/overview` aggregates student counts, active sessions, quiz statistics, and tutor engagement metrics. |
| **FR-ADMIN-03** | P1 | Flagged tutor answers & incorrect question reporting | ⚠️ Partial | General issue reports use `POST /feedback` with `feedback_type: "bug"` and a comment. The optional `target_id` is omitted by the incorrect-answer modal, so reports do not provide automatic answer/question traceability. Admin feedback viewing is available; a structured moderation workflow is not verified. |

---

## 10. Non-Functional Requirements (NFR)

| Requirement ID | Target Specification | Status | Current Codebase Implementation & Notes |
|---|---|:---:|---|
| **NFR-PERF-01** | Non-LLM API latency p95 < 400 ms | ✅ Implemented | Verified via `backend/tests/perf/test_perf_endpoints.py` with batched vector inference in predictor.py. |
| **NFR-PERF-02** | Tutor first visible response p95 < 5 s | ✅ Implemented | SSE streaming (`/tutor/stream`) begins token output almost immediately. |
| **NFR-AVAIL-01** | Availability 99.5% target | ✅ Implemented | Liveness and readiness probes implemented at `GET /health/live` and `GET /health/ready`. |
| **NFR-SEC-01** | HTTPS & secure transport | ✅ Implemented | Defensive security headers (`Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `CSP`) injected via Starlette middleware. |
| **NFR-SEC-02** | Strict ownership checks & RBAC | ✅ Implemented | `get_current_user` and `require_admin` dependencies enforce user/role scoping across all routes. |
| **NFR-SEC-03** | Rate limiting & LLM abuse caps | ✅ Implemented | SlowAPI rate limiting (429 with `Retry-After`) and monthly token quotas active. |
| **NFR-PRIV-01** | Data minimization & retention policies | ✅ Implemented | `POST /admin/maintenance/purge-stale` purges tutor interactions older than the retention window. |
| **NFR-OBS-01** | Structured logs, trace IDs, metrics | ✅ Implemented | Trace ID middleware assigns and logs unique `X-Trace-ID` on all requests. |
| **NFR-REL-01** | Database backups & tested restore | ⏳ Backlog | Automated backup cron not configured; volume mounts used for persistent storage. |
| **NFR-UX-01** | WCAG 2.2 AA accessibility compliance | 🔶 Partial | Automated axe/keyboard regressions and sampled desktop checks are implemented; full rendered contrast, mobile/reflow and screen-reader audits remain outstanding. No WCAG conformance claim. See `frontend/docs/accessibility-verification.md`. |
| **NFR-TEST-01** | $\ge 80\%$ test coverage on critical paths | ✅ Implemented | Latest local S3 product tree: 547 frontend tests and 83.99% aggregate branch coverage; five isolated backend-integrated journeys pass. Historical backend checkpoint: 188 tests. Counts alone do not prove every critical path; see `frontend/docs/verification-status.md` for scope and remaining gates. |
| **NFR-COST-01** | Monthly LLM spending budget & alerts | 🔶 Partial | Hard monthly token quotas active per user; organization billing webhooks not configured. |

---

## 11. Database Schema Alignment

| SRS Proposed Table | Current Model Equivalent | Status | Schema Gaps / Implementation Notes |
|---|---|:---:|---|
| `users` | `User` | ✅ Implemented | Stores `email`, `password_hash`, `role`, `is_active`, `deleted_at`. |
| `learner_profiles` | `UserSettings` | ✅ Implemented | Stores `target_role`, `weekly_hours`, `difficulty_mode`, `monthly_token_used`, `token_quota`. |
| `subjects` | `SubjectRoadmap` | ✅ Implemented | Stores curated subject syllabi in JSON format. |
| `topics` | `Topic` | ✅ Implemented | Stores `code`, `name`, `category`, `description`, `prerequisites` JSON. |
| `topic_prerequisites` | `TopicPrerequisite` | ✅ Implemented | Normalized relational junction table with foreign keys to `Topic`. |
| `resources` | `Resource` | ✅ Implemented | Stores `title`, `resource_type`, `url`, `difficulty`, `estimated_minutes`, `summary`. |
| `questions` | `Question` | ✅ Implemented | Stores `topic_id`, `difficulty`, `question_text`, `options` JSON, `correct_answer`, `explanation`. |
| `quiz_sessions` | `QuizSession` | ✅ Implemented | Standalone session model with `session_type`, `status`, and timestamps. |
| `quiz_items` | *Not implemented* | ⏳ Backlog | Dynamic question selection used in lieu of frozen quiz item composition. |
| `question_attempts` | `QuizAttempt` | ✅ Implemented | Stores `user_id`, `question_id`, `selected_answer`, `is_correct`, `time_taken_seconds`, `hint_count`, `attempted_at`. |
| `topic_mastery` | `TopicMastery` | ✅ Implemented | Stores `user_id`, `topic_id`, `mastery_score`, `status`, `attempt_count`, `correct_count`. |
| `mastery_events` | `MasteryEvent` | ✅ Implemented | Chronological audit trail logging BKT posterior adjustments. |
| `roadmaps` | `StudyPlan` | ✅ Implemented | Stores `user_id`, `plan_json`, `target_hours_per_week`. |
| `roadmap_tasks` | `DailyTask` | ✅ Implemented | Tracks `title`, `duration`, `is_done`, `date_str`. |
| `tutor_conversations` | `TutorConversation` | ✅ Implemented | Groups chat interactions by conversation topic with titles and session metadata. |
| `tutor_messages` | `TutorMessage` | ✅ Implemented | Stores `user_id`, `role`, `message`, `topic_id`, `latency_ms`, `token_count`, `retrieval_chunk_ids`. |
| `review_schedule` | `ReviewSchedule` | ✅ Implemented | Stores per-(user, topic) SM-2 stability and next review timestamps. |
| `feedback` | `Feedback` | ✅ Implemented | Stores ratings and flags for recommendations, tutor answers, and bugs. |
| `recommendation_arms` | `RecommendationArm` | ✅ Implemented | Tracks per-user contextual bandit pull counts and reward tallies. |

---

## 12. REST API Endpoints Status

| SRS Proposed Method & Route | Cipherium-AI Route | Status | Notes |
|---|---|:---:|---|
| `POST /auth/register` | `POST /auth/register` | ✅ Implemented | Full validation, password hashing, token issue. |
| `POST /auth/login` | `POST /auth/login` | ✅ Implemented | Credential verification and JWT issue with rate limiting. |
| `GET /me/profile` | `GET /settings/profile` | ✅ Implemented | Retrieves student study configuration. |
| `PATCH /me/profile` | `PUT /settings/profile` | ✅ Implemented | Updates target hours, difficulty, notification toggles. |
| `GET /subjects` | `GET /roadmaps/subjects` | ✅ Implemented | Lists curated multi-subject roadmaps. |
| `GET /subjects/{id}/topics` | `GET /topics?subject_id=...` | ✅ Implemented | Filters topics by subject ID parameter. |
| `POST /assessments/diagnostic` | `POST /quizzes/exam` | ✅ Implemented | Generates full curriculum diagnostic test. |
| `GET /quizzes/{id}` | `GET /quizzes/next` | ✅ Implemented | Adaptive single-question retrieval without answer exposure. |
| `POST /quizzes/{id}/items/{item_id}/submit` | `POST /quizzes/attempts` | ✅ Implemented | Submits answer, supports `Idempotency-Key`, returns correctness, updates mastery. |
| `POST /quizzes/{id}/complete` | `POST /quizzes/{id}/complete` | ✅ Implemented | Explicitly finalizes quiz session, triggers roadmap freshness check, and releases anti-cheat lock. |
| `GET /me/mastery` | `GET /analytics/mastery` | ✅ Implemented | Full topic mastery breakdown with BKT and ML predictions. |
| `GET /me/recommendations` | `GET /recommendations` | ✅ Implemented | ZPD-ranked and $\epsilon$-greedy bandit-optimized resources. |
| `POST /me/roadmap/generate` | `POST /roadmaps/generate` | ✅ Implemented | Generates personalized study plan. |
| `GET /me/roadmap/tasks/{id}` | `GET /tasks/today` | ✅ Implemented | Retrieves daily tasks scheduled for today. |
| `PATCH /me/roadmap/tasks/{id}` | `PUT /tasks/{task_id}/toggle` | ✅ Implemented | Toggles completion status of a daily task. |
| `GET /me/dashboard` | Aggregated frontend client calls | ✅ Implemented | Aggregates mastery, streak, tasks, heatmap, and radar in single view. |
| `POST /tutor/conversations` | `POST /tutor/conversations` | ✅ Implemented | Creates and groups named tutor conversation sessions. |
| `POST /tutor/conversations/{id}/messages` | `POST /tutor/chat` & `/stream` | ✅ Implemented | Interactive contextual chat with SSE streaming and anti-cheat lock. |
| `POST /feedback` | `POST /feedback` | ✅ Implemented | Route for reporting bugs, rating recommendations, or flagging tutor answers. |
| `POST /admin/questions` | `POST /admin/questions` | ✅ Implemented | Question draft and publishing authoring route for admin roles. |

---

## 13. Sprints Completion Status

| Sprint | Contributor | Scope & Tasks | Status |
|---|---|---|:---:|
| **Jay Sprint 1** (`feat/jay-s1`) | Jay | Password Reset Flow, Login Rate Limiting, Account Soft-Deletion, Admin RBAC, Prompt Injection Sanitization | ✅ Merged |
| **Jay Sprint 2** (`feat/jay-s2`) | Jay | Admin Question CMS, Privacy & GDPR Export, Tutor Conversation Sessions, Recommendation Feedback, Data Retention Policy | ✅ Merged |
| **Jay Sprint 3** (`feat/jay-s3`) | Jay | Structured Logging & Trace IDs, Real SMTP Service, Health Checks (/health/live, /health/ready), Security Headers, Admin System Metrics | ✅ Merged |
| **Amey Sprint 1** (`feat/amey-s1`) | Amey | Relational Quiz Sessions, Idempotency-Key Support, Mastery Event Audit Log, Subject Filtering | ✅ Merged |
| **Amey Sprint 2** (`feat/amey-s2`) | Amey | Vector RAG Pipeline (Chroma), Dialogue Telemetry, Dynamic Roadmap Regeneration, ML Model Benchmark Report, Token Quotas & LLM Cap | ✅ Merged |
| **Amey Sprint 3** (`feat/amey-s3`) | Amey | API Performance Benchmarking, Review Schedule Persistence, Anti-Cheat Tutor Lock, Contextual Bandit Baseline, Topic Prerequisite Junction Table | ✅ Merged |
| **Sarvesh Sprint 1** (`feat/sarvesh-s1`) | Sarvesh | Forgot & Reset Password UI, WCAG 2.2 Keyboard Accessibility, Scoped Error Boundary Recovery, Core View Vitest Suite Expansion | ✅ Merged |

### Frontend verification notes

| Task | Contributor | Implementation | Verification / remaining work |
|---|---|---|---|
| S2-6 conversation sidebar (`feat/sarvesh-s2`) | Sarvesh | API-backed conversation list/load-more, selection with saved message IDs, immediate New Conversation creation, conversation-scoped streaming/fallback, responsive sidebar and session-race protection. | Automated frontend tests, lint and build pass. Independent review and desktop mocked visual checks passed; mobile visual checks and real-backend end-to-end persistence remain unverified. Team PR/merge remain separate gates. See `frontend/docs/tutor-conversations.md` for backend limits. |
| S2-1 admin dashboard (`feat/sarvesh-s2`) | Sarvesh | Role-gated Questions / Resources / Feedback tabs; question drafts, publish/archive and authoring; resource creation; read-only all-user feedback. **Partial:** required existing-resource list/edit awaits backend endpoints. | Automated component/API checks cover role gating, payloads, validation, pagination and session/write uncertainty. Desktop mocked visual checks covered tabs, the resource form and question publishing; feedback, loading/error, non-admin and mobile visual checks remain unverified. Real-backend transactions, CI and teammate PR/merge remain separate gates. See `frontend/docs/admin-dashboard.md`. |

| S3-3 coverage (`feat/sarvesh-s3`, stacked on unmerged S2) | Sarvesh | Inclusive frontend coverage configuration, 80% aggregate branch CI gate, component/loading-state inventory, edge-flow tests and three regression fixes. | Frontend 82.65% branches; 417 tests pass, lint/build pass with existing warnings. Backend isolated existing suite: 188 pass, combined routers/services 80.795% lines (routers alone 76.884%). Remote CI and teammate PR/merge remain pending. See `frontend/docs/coverage-verification.md`. |

| S3-4 accessibility (`feat/sarvesh-s3`) | Sarvesh | Real-page axe regression scans, form/control labels, mobile drawer keyboard behavior, skip link, readable shared text colors and visible focus. **Partial:** manual WCAG 2.2 audit remains outstanding. | Automated scans do not establish full conformance; screen-reader, rendered contrast, real keyboard and mobile verification remain required. See `frontend/docs/accessibility-verification.md`. |

| S3-5 initial bundle (`feat/sarvesh-s3`) | Sarvesh | Lazy Analytics/Knowledge Graph/Admin views with Suspense; production manifest static-import-closure JS budget, strict <250,000 gzip bytes enforced in frontend CI. | Initial JS 161,992 gzip bytes (baseline 293,434 with the same method); 443 component/unit tests and four bundle tests pass; 83.54% inclusive branch coverage; lint/build pass with existing warnings. Browser/network profiling, remote CI and teammate PR/merge remain separate gates. See `frontend/docs/bundle-budget.md`. |

| S3-6 real-backend journeys (`feat/sarvesh-s3`) | Sarvesh | Separate Vitest/JSDOM actual-App journeys over a real isolated FastAPI/SQLite server: auth/dashboard, adaptive quiz/mastery, tutor SSE/persistence, generated roadmap/daily task, export/download action. CI integration stage and safe disposable fixture. Fixed adaptive-session completion mismatch uncovered by the tests. | Five journeys pass locally using actual offline AI/service fallback, not live external providers. Unit suite, coverage and bundle gate verified separately; timed-exam completion, real browser/download/mobile, actual CI and teammate PR/merge remain separate gates. See `frontend/docs/integration-journeys.md`. |

| S2-3 tutor feedback completion (`e1fb9299`; S3 `fa976545`) | Sarvesh | Saved-answer ratings plus incorrect-answer issue-report modal using `bug`/`comment`. No automatic answer linkage. | Automated/session/accessibility checks are recorded in `frontend/docs/tutor-feedback.md`. Published on S2 and integrated into S3; sampled desktop mocked-modal QA passed. Mobile/AT, actual report persistence, remote CI and team review remain separate gates. |

| S2-5 recommendation saved-card treatment | Sarvesh | Confirmed ratings dim only the card surface, preserve resource access and provide a keyboard/hover/tap thank-you tooltip. Pending/error/ambiguous states do not look saved. | Focused regression tests cover eligibility, all choices, session changes and tooltip interactions. API mapping follows existing backend semantics; assignment `rec_rating` mapping still needs product/backend reconciliation. Browser/mobile/AT checks and team review remain separate gates. See `frontend/docs/recommendation-feedback.md`. |
