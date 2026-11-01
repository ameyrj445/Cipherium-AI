# Cipherium-AI — AdaptiveAI SRS Feature Tracker

> **Document:** AdaptiveAI SRS Implementation & Feature Verification Checklist  
> **Target System:** Cipherium-AI (FastAPI + React + PostgreSQL + scikit-learn)  
> **Status Legend:**  
> - ✅ `Implemented` — Fully implemented and verified in the codebase  
> - 🔶 `Partial / Variant` — Implemented but incomplete, variant design, or heuristic  
> - ⏳ `Backlog / Pending` — Planned in SRS (P0/P1/P2/P3), not yet built  
> - ❌ `Out of Scope (MVP)` — Explicitly excluded for MVP per SRS Section 1.3  

---

## 📊 High-Level Implementation Dashboard

| Category | Total Requirements | ✅ Implemented | 🔶 Partial / Variant | ⏳ Backlog | Progress (%) |
|---|:---:|:---:|:---:|:---:|:---:|
| **1. Identity & Profile (FR-AUTH / FR-PROF)** | 9 | 7 | 1 | 1 | **77.8%** |
| **2. Curriculum & Content (FR-CUR)** | 7 | 5 | 0 | 2 | **71.4%** |
| **3. Diagnostic & Quiz Engine (FR-QUIZ)** | 8 | 5 | 2 | 1 | **75.0%** |
| **4. Mastery & Cognitive Modeling (FR-MAST)** | 8 | 6 | 1 | 1 | **81.3%** |
| **5. Recommendations & Adaptivity (FR-REC)** | 6 | 4 | 0 | 2 | **66.7%** |
| **6. Personalized Roadmap (FR-ROAD)** | 5 | 3 | 1 | 1 | **70.0%** |
| **7. AI Tutor & Pedagogical RAG (FR-TUTOR)** | 10 | 4 | 3 | 3 | **55.0%** |
| **8. Dashboard & Reporting (FR-DASH)** | 6 | 4 | 1 | 1 | **75.0%** |
| **9. Administration & CMS (FR-ADMIN)** | 3 | 0 | 0 | 3 | **0.0%** |
| **10. Non-Functional Requirements (NFR)** | 12 | 3 | 4 | 5 | **41.7%** |
| **11. Database Schema Specifications** | 19 | 8 | 6 | 5 | **57.9%** |
| **12. REST API Endpoints Contract** | 20 | 10 | 6 | 4 | **65.0%** |
| **TOTAL** | **113** | **56** | **26** | **31** | **61.1%** |

```
Overall Progress:
[██████████████████████████████░░░░░░░░░░░░░░░░░░░░] 61.1% (56 Completed / 26 Partial / 31 Backlog)
```

---

## 1. Identity & Profile Requirements

| Requirement ID | Priority | Description | Status | Current Codebase Implementation & Location |
|---|:---:|---|:---:|---|
| **FR-AUTH-01** | P0 | User registration & authentication with password encryption | ✅ Implemented | `backend/app/routers/auth.py` (`/auth/register`, `/auth/login`) with 12-round native Bcrypt hashing and legacy SHA-256 upgrade. |
| **FR-AUTH-02a** | P0 | Stateless JWT session tokens & expiration | ✅ Implemented | HMAC-SHA256 JWTs with 12h default TTL via `app/services/auth.py`. |
| **FR-AUTH-02b** | P0 | Client-side session termination / logout | ✅ Implemented | Handled in React client session store upon logout or token expiry. |
| **FR-AUTH-02c** | P0 | Password reset flow via verified email | ✅ Implemented | Cryptographic time-limited tokens via itsdangerous in `app/services/email.py`, `/auth/forgot-password` and `/auth/reset-password` in `app/routers/auth.py`. |
| **FR-AUTH-02d** | P0 | Per-IP / per-user login rate-limiting | ✅ Implemented | SlowAPI rate limiter middleware with 10/min on `/auth/login` and 5/min on `/auth/forgot-password`. |
| **FR-PROF-01** | P0 | Profile preferences: target goal, weekly hours, difficulty | ✅ Implemented | `UserSettings` model (`target_role`, `weekly_hours`, `difficulty_mode`, notification toggles) via `GET/PUT /settings/profile`. |
| **FR-PROF-02a** | P0 | Learner preference editing UI/API | ✅ Implemented | `PUT /settings/profile` and frontend `SettingsView.jsx`. |
| **FR-PROF-02b** | P0 | Learner GDPR data export | ⏳ Backlog | Planned in Sprint 2 via `GET /me/export`. |
| **FR-PROF-02c** | P0 | Account deletion workflow | ✅ Implemented | `DELETE /auth/me` and `DELETE /me` soft-deletes user, anonymizes PII, cascades access revocation. |

---

## 2. Curriculum & Content Requirements

| Requirement ID | Priority | Description | Status | Current Codebase Implementation & Location |
|---|:---:|---|:---:|---|
| **FR-CUR-01** | P0 | Domain hierarchy: Subject → Module → Topic → Resource | ✅ Implemented | Modeled across `SubjectRoadmap`, `Topic`, and `Resource` in `app/models/__init__.py`. |
| **FR-CUR-02a** | P0 | Prerequisite Directed Acyclic Graph (DAG) representation | ✅ Implemented | Prerequisite dependencies linked and parsed in `app/services/knowledge_graph.py`. |
| **FR-CUR-02b** | P0 | Prerequisite cycle detection | ✅ Implemented | 3-Color DFS cycle detector (`detect_circular_dependencies`) prevents cyclic dependencies. |
| **FR-CUR-02c** | P0 | Topological depth ordering & status resolution | ✅ Implemented | Kahn's algorithm (`calculate_topological_depths`) resolves topic state: `locked`, `unlocked`, or `mastered`. |
| **FR-CUR-03** | P0 | Question attributes: topic, difficulty (1–5), explanation, answers | ✅ Implemented | `Question` model stores `difficulty`, JSON `options`, `correct_answer`, `explanation`. |
| **FR-CUR-04** | P1 | Question immutable versioning for historical attempts | ⏳ Backlog | Questions currently lack explicit `version` column referenced in `QuizAttempt`. |
| **FR-CUR-05** | P1 | Content editor review & approval workflow | ⏳ Backlog | Seed questions loaded statically; editorial lifecycle states (`draft`, `review`, `published`) not yet enforced. |

---

## 3. Diagnostic & Adaptive Quiz Engine

| Requirement ID | Priority | Description | Status | Current Codebase Implementation & Location |
|---|:---:|---|:---:|---|
| **FR-QUIZ-01** | P0 | Diagnostic assessment generation across prerequisites & targets | ✅ Implemented | `POST /quizzes/exam` creates timed mock diagnostic examinations across topics. |
| **FR-QUIZ-02** | P0 | Single-answer Multiple Choice Questions (MCQ) | ✅ Implemented | MCQ option shuffling to prevent positional bias (`GET /quizzes/next`). |
| **FR-QUIZ-03a** | P0 | Persist attempt: answer, correctness, elapsed time, timestamp | ✅ Implemented | `QuizAttempt` stores `selected_answer`, `is_correct`, `time_taken_seconds`, and `attempted_at`. |
| **FR-QUIZ-03b** | P0 | Persist hint usage count per attempt | 🔶 Partial | Attempt time recorded; `hint_count` not yet added to schema. |
| **FR-QUIZ-04a** | P0 | Enforce one scored submission per question per session | 🔶 Partial | Backend calculates scoring; duplicate submission prevention is client-side rather than transactional. |
| **FR-QUIZ-04b** | P0 | Idempotency-Key header support | ⏳ Backlog | HTTP `Idempotency-Key` header validation not yet implemented. |
| **FR-QUIZ-05** | P0 | Real-time mastery update upon submission | ✅ Implemented | `POST /quizzes/attempts` triggers `calculate_topic_mastery` and updates `TopicMastery`. |
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
| **FR-MAST-05b** | P1 | Ebbinghaus / SM-2 spaced repetition decay | ✅ Implemented | $R(t) = e^{-\Delta t / S}$ memory stability calculation in `services/bkt_service.py`. |
| **FR-MAST-05c** | P1 | Supervised ML Topic Risk Classifier (OULAD) | ✅ Implemented | 100-estimator Random Forest (`weak_topic_classifier.joblib`) predicts topic failure probability. |
| **FR-MAST-05d** | P1 | Holdout empirical comparison between BKT and heuristic | 🔶 Partial | BKT and heuristics run side-by-side; automated log-loss/Brier benchmark report is pending. |

---

## 5. Recommendations & Adaptivity

| Requirement ID | Priority | Description | Status | Current Codebase Implementation & Location |
|---|:---:|---|:---:|---|
| **FR-REC-01a** | P0 | Multi-factor recommendation ranking score | ✅ Implemented | Zone of Proximal Development (ZPD) score: $S = 0.5 \times \text{Weak Topic} + 0.3 \times \text{Difficulty Fit} + 0.2 \times \text{Prereq Fit}$. |
| **FR-REC-01b** | P0 | Filter out topics with unmet hard prerequisites | ✅ Implemented | Recommendations respect DAG dependency states. |
| **FR-REC-02** | P0 | Explainable recommendation reasoning | ✅ Implemented | `recommendation_reason` dynamically generated in `ResourceResponse`. |
| **FR-REC-03** | P1 | Dynamic difficulty staircase adaptation | ✅ Implemented | $\ge 85\%$ accuracy steps difficulty up $+1$; $< 50\%$ steps difficulty down $-1$. |
| **FR-REC-04** | P1 | Explicit learner feedback (`too_easy`, `too_hard`, `not_relevant`) | ⏳ Backlog | Feedback submission endpoint not yet wired. |
| **FR-REC-05** | P2 | Contextual Bandit policy (LinUCB / Thompson Sampling) | ⏳ Backlog | P2 milestone; deterministic baseline is operational per SRS recommendation. |

---

## 6. Personalized Roadmap

| Requirement ID | Priority | Description | Status | Current Codebase Implementation & Location |
|---|:---:|---|:---:|---|
| **FR-ROAD-01** | P0 | Automated study plan generation from time budget & prerequisites | ✅ Implemented | `POST /roadmaps/generate` and `POST /roadmaps/custom` in `services/study_plan_generator.py`. |
| **FR-ROAD-02** | P0 | Curated duration estimates for milestones and resources | ✅ Implemented | Detailed estimated hours per subtopic and milestone in curated blueprints. |
| **FR-ROAD-03** | P0 | Non-destructive daily task rescheduling | ✅ Implemented | `DailyTask` table (`GET /tasks/today`, `PUT /tasks/{id}/toggle`). |
| **FR-ROAD-04** | P1 | Dynamic roadmap regeneration upon mastery changes | 🔶 Partial | Manual roadmap regeneration available; automatic event-driven regeneration not yet configured. |
| **FR-ROAD-05** | P1 | Interactive milestone & task progress tracking | ✅ Implemented | `PUT /roadmaps/progress` updates completed subtopics and resources. |

---

## 7. AI Tutor & Pedagogical RAG

| Requirement ID | Priority | Description | Status | Current Codebase Implementation & Location |
|---|:---:|---|:---:|---|
| **FR-TUTOR-01** | P1 | Topic-grounded contextual chat | ✅ Implemented | `POST /tutor/chat` injects curriculum syllabus and topic metadata into LLM system context. |
| **FR-TUTOR-02a** | P1 | Vector embeddings RAG pipeline over course materials | 🔶 Partial | Static curriculum knowledge base in `services/tutor.py`; vector database (pgvector/Chroma) not yet built. |
| **FR-TUTOR-02b** | P1 | Source citations attached to tutor responses | ✅ Implemented | Responses attach curated learning resource titles and URLs. |
| **FR-TUTOR-03** | P1 | Pedagogical modes: Socratic, Direct, Exam-Prep | ✅ Implemented | Structured system personas: Socratic hint scaffolding, direct technical breakdown, Big-O exam prep. |
| **FR-TUTOR-04** | P1 | Anti-cheating answer suppression during active quizzes | 🔶 Partial | Explanations hidden on `/quizzes/next`; tutor answer suppression during active exam is advisory. |
| **FR-TUTOR-05a** | P1 | Real-time Server-Sent Events (SSE) streaming | ✅ Implemented | `POST /tutor/chat/stream` streams tokens with low time-to-first-byte (TTFB). |
| **FR-TUTOR-05b** | P1 | Token quotas & per-user LLM spending caps | ⏳ Backlog | Custom Gemini key supported per user; hard budget limiters not implemented. |
| **FR-TUTOR-06** | P1 | Dialogue telemetry (latency, token usage, retrieval IDs) | ⏳ Backlog | Structured logs record requests; per-query token counting not stored. |
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
| **FR-DASH-03** | P1 | Spaced repetition memory retention card | ✅ Implemented | `RetentionScheduleCard.jsx` displaying memory stability and review urgency tags. |
| **FR-DASH-04** | P1 | Export learning summary (PDF / CSV) | ⏳ Backlog | Frontend rendering only; backend PDF/CSV export endpoint not implemented. |

---

## 9. Administration & CMS

| Requirement ID | Priority | Description | Status | Current Codebase Implementation & Location |
|---|:---:|---|:---:|---|
| **FR-ADMIN-01** | P1 | Content lifecycle management (`draft`, `review`, `published`, `archived`) | ⏳ Backlog | No admin CMS interface or content lifecycle transition APIs. |
| **FR-ADMIN-02** | P1 | Privacy-preserving aggregated student performance metrics | ⏳ Backlog | Admin aggregate reporting dashboard not yet built. |
| **FR-ADMIN-03** | P1 | Flagged tutor answers & incorrect question reporting | ⏳ Backlog | Feedback and question error reporting pipeline not implemented. |

---

## 10. Non-Functional Requirements (NFR)

| Requirement ID | Target Specification | Status | Current Codebase Implementation & Notes |
|---|---|:---:|---|
| **NFR-PERF-01** | Non-LLM API latency p95 < 400 ms | 🔶 Partial | Fast response times with SQLite/Postgres; formal load test benchmark pending. |
| **NFR-PERF-02** | Tutor first visible response p95 < 5 s | ✅ Implemented | SSE streaming (`/tutor/chat/stream`) begins token output almost immediately. |
| **NFR-AVAIL-01** | Availability 99.5% target | ⏳ Backlog | Production monitoring, health checks, and alerting need cloud deployment setup. |
| **NFR-SEC-01** | HTTPS & secure transport | 🔶 Partial | Handled via Nginx reverse proxy in Docker Compose; Bearer JWT used. |
| **NFR-SEC-02** | Strict ownership checks & RBAC | ✅ Implemented | `get_current_user` dependency enforces user-level scoping across all stateful endpoints. |
| **NFR-SEC-03** | Rate limiting & LLM abuse caps | ⏳ Backlog | No per-IP or token quota middleware currently active. |
| **NFR-PRIV-01** | Data minimization & retention policies | ⏳ Backlog | No automatic message purge or privacy retention schedule configured. |
| **NFR-OBS-01** | Structured logs, trace IDs, metrics | 🔶 Partial | Structured stdout logging via Python `logging`; OpenTelemetry/Prometheus not integrated. |
| **NFR-REL-01** | Database backups & tested restore | ⏳ Backlog | Relies on volume mounts; automated backup cron not configured. |
| **NFR-UX-01** | WCAG 2.2 AA accessibility compliance | 🔶 Partial | Clean Linear/GitHub design tokens; formal screen reader & contrast audit pending. |
| **NFR-TEST-01** | $\ge 80\%$ test coverage on critical paths | ✅ Implemented | **188 automated tests** (87 backend Pytest + 101 frontend Vitest). |
| **NFR-COST-01** | Monthly LLM spending budget & alerts | ⏳ Backlog | User-provided Gemini key supported; hard budget ceilings not implemented. |

---

## 11. Database Schema Alignment

| SRS Proposed Table | Current Model Equivalent | Status | Schema Gaps / Implementation Notes |
|---|---|:---:|---|
| `users` | `User` | ✅ Implemented | Uses integer primary key instead of UUID; stores `email`, `password_hash`, `role`. |
| `learner_profiles` | `UserSettings` | 🔶 Partial | Stores `target_role`, `weekly_hours`, `difficulty_mode`; missing explicit `timezone` column. |
| `subjects` | `SubjectRoadmap` | ✅ Implemented | Stores curated subject syllabi in JSON format. |
| `topics` | `Topic` | ✅ Implemented | Stores `code`, `name`, `category`, `description`, `prerequisites` JSON. |
| `topic_prerequisites` | `Topic.prerequisites` JSON | 🔶 Partial | Implemented as JSON string on `Topic`; relational junction table not used. |
| `resources` | `Resource` | ✅ Implemented | Stores `title`, `resource_type`, `url`, `difficulty`, `estimated_minutes`, `summary`. |
| `questions` | `Question` | ✅ Implemented | Stores `topic_id`, `difficulty`, `question_text`, `options` JSON, `correct_answer`, `explanation`. |
| `quiz_sessions` | *Implicit in QuizAttempt* | 🔶 Partial | No standalone session table; attempts are logged individually. |
| `quiz_items` | *Not implemented* | ⏳ Backlog | Frozen test question composition table not yet modeled. |
| `question_attempts` | `QuizAttempt` | ✅ Implemented | Stores `user_id`, `question_id`, `selected_answer`, `is_correct`, `time_taken_seconds`, `attempted_at`. |
| `topic_mastery` | `TopicMastery` | ✅ Implemented | Stores `user_id`, `topic_id`, `mastery_score`, `status`, `attempt_count`, `correct_count`. |
| `mastery_events` | *Not implemented* | ⏳ Backlog | Historical mastery score delta log table not yet modeled. |
| `roadmaps` | `StudyPlan` | ✅ Implemented | Stores `user_id`, `plan_json`, `target_hours_per_week`. |
| `roadmap_tasks` | `DailyTask` | 🔶 Partial | Tracks `title`, `duration`, `is_done`, `date_str`; not foreign-keyed to `StudyPlan`. |
| `tutor_conversations` | *Not implemented* | ⏳ Backlog | Messages currently link directly to `user_id` without conversation grouping. |
| `tutor_messages` | `TutorMessage` | ✅ Implemented | Stores `user_id`, `role`, `message`, `topic_id`, `created_at`. |
| `review_schedule` | Computed on-the-fly via SM-2 | 🔶 Partial | Computed dynamically in `bkt_service.py`; not persisted to dedicated table. |
| `feedback` | *Not implemented* | ⏳ Backlog | User feedback table for tutor and recommendation quality not modeled. |
| `recommendation_events`| *Not implemented* | ⏳ Backlog | Recommendation impressions and click telemetry table not modeled. |

---

## 12. REST API Endpoints Status

| SRS Proposed Method & Route | Cipherium-AI Route | Status | Notes |
|---|---|:---:|---|
| `POST /auth/register` | `POST /auth/register` | ✅ Implemented | Full validation, password hashing, token issue. |
| `POST /auth/login` | `POST /auth/login` | ✅ Implemented | Credential verification and JWT issue. |
| `GET /me/profile` | `GET /settings/profile` | ✅ Implemented | Retrieves student study configuration. |
| `PATCH /me/profile` | `PUT /settings/profile` | ✅ Implemented | Updates target hours, difficulty, notification toggles. |
| `GET /subjects` | `GET /roadmaps/subjects` | ✅ Implemented | Lists curated multi-subject roadmaps. |
| `GET /subjects/{id}/topics` | `GET /topics` | 🔶 Partial | Returns all topics; filtering by subject ID not parameterized. |
| `POST /assessments/diagnostic` | `POST /quizzes/exam` | ✅ Implemented | Generates full curriculum diagnostic test. |
| `GET /quizzes/{id}` | `GET /quizzes/next` | 🔶 Partial | Adaptive single-question retrieval without answer exposure. |
| `POST /quizzes/{id}/items/{item_id}/submit` | `POST /quizzes/attempts` | 🔶 Partial | Submits answer, returns correctness, updates mastery. Missing item-level pathing. |
| `POST /quizzes/{id}/complete` | *Implicit* | ⏳ Backlog | Quiz completed automatically upon attempt submissions; no explicit finalize route. |
| `GET /me/mastery` | `GET /analytics/mastery` | ✅ Implemented | Full topic mastery breakdown with BKT and ML predictions. |
| `GET /me/recommendations` | `GET /recommendations` | ✅ Implemented | ZPD-ranked resources with explainable reasoning. |
| `POST /me/roadmap/generate` | `POST /roadmaps/generate` | ✅ Implemented | Generates personalized study plan. |
| `GET /me/roadmap/tasks/{id}` | `GET /tasks/today` | 🔶 Partial | Retrieves daily tasks scheduled for today. |
| `PATCH /me/roadmap/tasks/{id}` | `PUT /tasks/{task_id}/toggle` | ✅ Implemented | Toggles completion status of a daily task. |
| `GET /me/dashboard` | Aggregated frontend client calls | ✅ Implemented | Aggregates mastery, streak, tasks, heatmap, and radar in single view. |
| `POST /tutor/conversations` | *Implicit* | ⏳ Backlog | Conversations are currently topic-scoped rather than session-scoped. |
| `POST /tutor/conversations/{id}/messages` | `POST /tutor/chat` & `/stream` | ✅ Implemented | Interactive contextual chat with SSE streaming support. |
| `POST /feedback` | *Not implemented* | ⏳ Backlog | Route for reporting bugs or flagging tutor answers. |
| `POST /admin/resources` | *Not implemented* | ⏳ Backlog | Content authoring route for admin/editor roles. |
| `POST /admin/questions` | *Not implemented* | ⏳ Backlog | Question draft authoring route for admin/editor roles. |

---

## 13. Immediate Prioritized Sprint Backlog

### Sprint A (P0 Completeness)
1. **Idempotency-Key Support:** Add middleware or request-header validation on `POST /quizzes/attempts`.
2. **Hint Count Tracking:** Add `hint_count` to `QuizAttempt` and factor into mastery formula.
3. **Password Reset Flow:** Implement email-based password reset token endpoints (`POST /auth/forgot-password`).
4. **Rate Limiting:** Add slowapi or Redis rate-limiting on sensitive endpoints (`/auth/login`, `/tutor/chat`).

### Sprint B (P1 Core Features)
1. **Vector Document RAG:** Integrate `pgvector` or local Chroma store to chunk and embed DSA Markdown notes.
2. **Downloadable Progress Summary:** Build `GET /analytics/export?format=pdf|csv` for learner transcripts.
3. **Content Versioning & CMS:** Add question lifecycle statuses (`draft`, `review`, `published`).
4. **Learner Feedback Endpoint:** Create `POST /feedback` for rating recommendations and tutor responses.
5. **Mastery Audit Log:** Create `mastery_events` table to record chronological historical progression.
