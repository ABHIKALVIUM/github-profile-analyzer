# ⬡ GitHub Profile Analyzer
### Backend Node.js Internship Assignment · Educase India

> A full-stack application that fetches GitHub profile data, calculates a **Developer Activity Score**, detects the **Primary Tech Stack**, persists insights in MySQL, and visualises everything in a clean React dashboard.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Local Setup — Backend](#local-setup--backend)
5. [Local Setup — Frontend](#local-setup--frontend)
6. [Database Seeding](#database-seeding)
7. [API Reference](#api-reference)
8. [Activity Score Algorithm](#activity-score-algorithm)
9. [Running Tests](#running-tests)
10. [Design Decisions](#design-decisions)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                          │
│              React (Vite) + Tailwind CSS + Axios                │
└─────────────────────────────┬───────────────────────────────────┘
                              │  HTTP (CORS-gated)
┌─────────────────────────────▼───────────────────────────────────┐
│                       EXPRESS SERVER                            │
│                                                                 │
│  ┌──────────┐   ┌────────────┐   ┌─────────────┐              │
│  │  Router  │──▶│ Controller │──▶│   Service   │              │
│  └──────────┘   └────────────┘   └──────┬──────┘              │
│                                         │                       │
│                         ┌──────────────▼──────────────┐        │
│                         │         Model Layer          │        │
│                         │  (SQL queries / pool calls)  │        │
│                         └──────────────┬──────────────┘        │
│  Middleware: CORS · Rate Limiter ·     │                        │
│              Error Handler · JSON Body │                        │
└────────────────────────────────────────┼────────────────────────┘
                                         │
          ┌──────────────────────────────▼──────────────────────┐
          │  External: GitHub REST API v3   │   MySQL Database   │
          └─────────────────────────────────────────────────────┘
```

### MVC + Service Layer

| Layer | File(s) | Responsibility |
|---|---|---|
| **Router** | `routes/profileRoutes.js` | Maps URL patterns to controllers; attaches rate limiters |
| **Controller** | `controllers/profileController.js` | Input validation, delegates to service, formats HTTP response |
| **Service** | `services/githubService.js` | All business logic: GitHub API calls, score algorithm, stack detection, DB writes |
| **Model** | `models/profileModel.js` | Raw SQL queries, pool management — no business logic |
| **Middleware** | `middleware/errorHandler.js` | Centralised error formatting; never leaks stack traces in production |

> **Why a separate Service layer?**  
> Controllers should not know *how* an activity score is calculated — only that they can ask for one. Keeping orchestration logic in a Service makes it independently testable (`calculateActivityScore` is a pure function), swappable (swap GitHub API for GitLab without touching the controller), and readable.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | Express.js 4 |
| Database | MySQL 8 via `mysql2` (promise pool) |
| HTTP Client | Axios |
| Rate Limiting | `express-rate-limit` |
| Testing | Jest + Supertest |
| Frontend | React 18 (Vite) |
| Styling | Tailwind CSS 3 |
| Data Fetching | Axios |

---

## Project Structure

```
github-analyzer/
├── backend/
│   ├── config/
│   │   ├── db.js           # MySQL connection pool
│   │   └── schema.sql      # DDL — run once to create tables
│   ├── controllers/
│   │   └── profileController.js
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── models/
│   │   └── profileModel.js
│   ├── routes/
│   │   └── profileRoutes.js
│   ├── services/
│   │   └── githubService.js  ← core business logic lives here
│   ├── tests/
│   │   └── api.test.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── ProfileCard.jsx
    │   │   └── HistoryPanel.jsx
    │   ├── hooks/
    │   │   └── useGitHubAnalyzer.js
    │   ├── utils/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

---

## Local Setup — Backend

### Prerequisites

- Node.js ≥ 18
- MySQL 8 running locally (or Docker: `docker run -p 3306:3306 -e MYSQL_ROOT_PASSWORD=secret -d mysql:8`)

### Steps

```bash
# 1. Clone and enter the backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Copy environment file and fill in your values
cp .env.example .env
# Edit .env — set DB_PASSWORD and optionally GITHUB_TOKEN

# 4. Create the database schema (see next section)

# 5. Start the development server
npm run dev
# → Server running on http://localhost:5000
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Express server port |
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | `root` | MySQL user |
| `DB_PASSWORD` | *(required)* | MySQL password |
| `DB_NAME` | `github_analyzer` | Database name |
| `GITHUB_TOKEN` | *(optional)* | Personal Access Token — raises rate limit 60 → 5 000 req/hr |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |

---

## Local Setup — Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server (proxies /api → localhost:5000 automatically)
npm run dev
# → App running on http://localhost:5173
```

> No `.env` file is needed for local dev — the Vite proxy in `vite.config.js` forwards all `/api` calls to the backend.  
> For production deployments, set `VITE_API_URL=https://your-backend-domain.com/api` in a `.env.production` file.

---

## Database Seeding

```bash
# Option A — via CLI (recommended)
mysql -u root -p < backend/config/schema.sql

# Option B — inside the MySQL shell
mysql> source /path/to/backend/config/schema.sql;

# Option C — Docker one-liner
docker exec -i <container_id> mysql -uroot -psecret < backend/config/schema.sql
```

The schema creates two tables:

| Table | Purpose |
|---|---|
| `profiles` | One row per GitHub username; upserted on re-analysis |
| `language_stats` | Child table storing per-profile language breakdown |

Both tables use `utf8mb4` collation to handle all Unicode characters (emoji bios, non-ASCII names).

---

## API Reference

### `GET /api/analyze/:username`

Fetches from GitHub, calculates insights, upserts to MySQL, and returns enriched data.

**Rate limit:** 30 requests / 15 minutes per IP

**Success — 200**
```json
{
  "success": true,
  "data": {
    "username": "torvalds",
    "name": "Linus Torvalds",
    "avatar_url": "https://avatars.githubusercontent.com/u/1024025",
    "bio": "Linux kernel creator",
    "location": "Portland, OR",
    "public_repos": 7,
    "public_gists": 0,
    "followers": 230000,
    "following": 0,
    "activity_score": 72.5,
    "primary_stack": "C, Shell, Perl",
    "top_languages": [["C", 4], ["Shell", 2], ["Perl", 1]],
    "github_created_at": "2011-09-03 15:13:19",
    "github_url": "https://github.com/torvalds"
  }
}
```

**Error — 404**
```json
{ "success": false, "error": "GitHub user 'xyz' not found" }
```

---

### `GET /api/profiles`

Returns all previously analyzed profiles, newest first.

**Rate limit:** 100 requests / 15 minutes per IP

**Success — 200**
```json
{
  "success": true,
  "count": 2,
  "data": [
    { "id": 1, "username": "torvalds", "activity_score": "72.50", ... },
    { "id": 2, "username": "gaearon",  "activity_score": "61.30", ... }
  ]
}
```

---

### `GET /health`

Lightweight health-check endpoint (no rate limiting).

```json
{ "status": "ok", "timestamp": "2024-02-10T12:00:00.000Z" }
```

---

## Activity Score Algorithm

The **Developer Activity Score** (0–100) is a single number summarising GitHub public activity. It is calculated entirely from the GitHub Users API response — no scraping required.

```
Score = repoScore + gistScore + followerScore + followScore + ageScore

Where each component uses logarithmic scaling:
  logScale(value, cap) = log(1 + value) / log(1 + cap)   [clamped to 1]

  repoScore     = logScale(public_repos,  200) × 40   pts
  gistScore     = logScale(public_gists,   50) × 10   pts
  followerScore = logScale(followers,     500) × 25   pts
  followScore   = logScale(following,     300) × 10   pts
  ageScore      = logScale(accountAgeYrs,  10) × 15   pts
```

**Why logarithmic?** A linear scale would mean someone with 1 000 followers scores 10× a developer with 100. Log-scaling compresses outliers so the score reflects realistic activity tiers rather than GitHub fame.

| Score Range | Tier |
|---|---|
| 70 – 100 | 🟢 Highly Active |
| 40 – 69 | 🟡 Moderately Active |
| 0 – 39 | 🔴 Early Stage |

---

## Running Tests

```bash
cd backend
npm test
```

The test suite uses **Jest + Supertest**. The GitHub API and MySQL pool are mocked so tests run without network access or a database.

**Test coverage:**

| Test | What it verifies |
|---|---|
| `GET /health` | Server is reachable and returns status ok |
| `GET /api/analyze/:username` — success | Returns 200 + enriched profile |
| `GET /api/analyze/:username` — not found | Returns 404 with error message |
| `GET /api/analyze/:username` — bad format | Returns 400 before service is called |
| `GET /api/profiles` — with data | Returns array + count |
| `GET /api/profiles` — empty | Returns empty array gracefully |
| `calculateActivityScore` — unit | Returns a number in [0, 100] |
| `calculateActivityScore` — new account | Returns near-zero score |

---

## Design Decisions

**Connection Pooling** — `mysql2` pool with `connectionLimit: 10` reuses TCP connections across requests, avoiding the overhead of a new handshake per query. Critical for burst traffic.

**Upsert over Insert** — `INSERT … ON DUPLICATE KEY UPDATE` on the `username` column means re-analyzing a user refreshes stale data without creating duplicate rows. No `SELECT` + `INSERT` race condition.

**Transactional language writes** — Language stats are rebuilt inside a `BEGIN … COMMIT` block (delete-then-insert). If the insert fails, the delete is rolled back, maintaining data integrity.

**Service vs Controller** — The `analyzeProfile` function in the Service layer is the single source of truth for the analysis workflow. Controllers are intentionally < 20 lines; they validate input and format output, nothing else. This makes the Service independently unit-testable.

**Rate Limiting** — Two separate limiters: aggressive on `/analyze` (30/15 min) because it triggers outbound GitHub API calls; relaxed on `/profiles` (100/15 min) because it only hits the local DB.

**Log-scaled scoring** — Prevents celebrity developers from making the metric meaningless for typical users. A developer with 50 repos and 200 followers will score in the 55–65 range, not near zero.

---
