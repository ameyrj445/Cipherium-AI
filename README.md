# Cipherium AI

**Cipherium AI** is an AI-powered personalized learning platform that diagnoses student performance, surfaces weak curriculum topics, recommends tailored learning resources, generates dynamic milestone roadmaps, and provides a contextual AI study tutor.

---

## Architecture Overview

- **Backend**: FastAPI (Python 3.11+ / 3.14), SQLAlchemy ORM, SQLite / PostgreSQL.
- **Frontend**: React.js with Vite, Tailwind CSS, Recharts for dynamic analytics, Lucide Icons, and Axios client.
- **Analytics & ML Core**: 
  - Dynamic mastery formulation: $M = 0.7 \times \text{accuracy} + 0.3 \times \text{recency}$.
  - Weak-topic detection: classifies topics as `weak`, `developing`, or `strong`.
  - Recommendation ranking: $S = 0.5 \times \text{relevance} + 0.3 \times \text{difficulty\_fit} + 0.2 \times \text{prereq\_fit}$.
  - Adaptive assessment difficulty (levels 1–5).
- **AI Tutor Service**: Contextually grounded pedagogical chat engine with optional Gemini API integration (`google-genai`).

---

## Running Locally

### PostgreSQL setup

1. Install PostgreSQL and create the database and application user:

```sql
CREATE USER cipherium_user WITH PASSWORD 'choose-a-strong-password';
CREATE DATABASE cipherium_ai OWNER cipherium_user;
```

2. Copy `backend/.env.example` to `backend/.env`, then set `DATABASE_URL` with the same user, password, host, port, and database name.

3. Install backend dependencies and start the API. On startup, SQLAlchemy creates the tables and seeds the default topics, questions, and resources automatically.
### 1. Backend Server
```bash
cd backend
# Activate virtual environment
# Windows:
.venv\Scripts\Activate.ps1
# Mac/Linux:
source .venv/bin/activate

# Run FastAPI server
uvicorn app.main:app --reload --port 8000
```
- Interactive Swagger API Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Frontend Web Application
```bash
cd frontend
npm install
npm run dev -- --port 5173
```
- Open [http://localhost:5173/](http://localhost:5173/) in your browser.

---

## Default Test Account
- **Email:** `student@cipherium.ai`
- **Password:** `cipherium123`
*(Self-registration for new accounts is also available directly on the login screen)*
