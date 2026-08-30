# EstateHub — Real Estate Social Media Manager

Manage a real estate company's social presence from one dashboard: property
listings, AI-generated listing posts, a content calendar, lead capture, and
comment management across Twitter/X, Instagram, Facebook, and LinkedIn.

Runs entirely on **Cloudflare's free tier** as a single full-stack Worker:
a [Hono](https://hono.dev) API + [D1](https://developers.cloudflare.com/d1/)
(SQLite) database, serving a React single-page app from the same origin.

---

## Features

- **Dashboard hub** — KPIs, listings-by-status and lead-pipeline charts, upcoming posts, connected accounts
- **Properties** — full CRUD listings manager (photos, price, beds/baths, status)
- **Listing → post generator** — AI-written, platform-tailored captions (falls back to a smart template if no OpenAI key)
- **Content calendar** — month view of scheduled posts, per-platform
- **Leads** — pipeline board (new → contacted → qualified → closed → lost); convert comments into leads
- **Comments** — AI-assisted replies
- **Accounts** — connect social platforms via OAuth

---

## Architecture

```
┌─────────────────────────── Cloudflare Worker ("dashboard") ───────────────────────────┐
│                                                                                        │
│   /api/*   ──►  Hono router  ──►  D1 (SQLite) database  [binding: DB]                   │
│   /* (everything else)  ──►  React SPA static assets     [binding: ASSETS, SPA mode]    │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

| Layer     | Tech                                                              |
|-----------|-------------------------------------------------------------------|
| Frontend  | React 18 (CRA), React Router, Tailwind, Recharts, lucide-react    |
| API       | Hono on Cloudflare Workers                                        |
| Database  | Cloudflare D1 (SQLite)                                            |
| Auth      | JWT via `hono/jwt`; passwords hashed with Web Crypto PBKDF2       |
| AI        | OpenAI REST (optional; template fallback for listing posts)      |

### Project structure

```
.
├── wrangler.jsonc          # Worker config (main, D1 + ASSETS bindings)
├── schema.sql              # D1 schema
├── package.json            # Worker deps (hono) + wrangler
├── worker/
│   ├── index.js            # Hono app: mounts /api/* + serves SPA
│   ├── lib.js              # JWT/PBKDF2 auth, D1 JSON helpers, OpenAI helper
│   └── routes/             # auth, properties, leads, posts, ai, social
└── frontend/
    ├── src/                # React app (api.js -> same-origin /api)
    └── build/              # CRA output (generated; uploaded as static assets)
```

---

## Prerequisites

- Node.js 22+ (Wrangler requires Node ≥ 22)
- A Cloudflare account
- (Optional) An OpenAI API key for live AI generation

---

## Deploy to Cloudflare

The repo is connected to a Cloudflare **Workers** project (GitHub-linked builds).

### One-time setup

1. **Create the D1 database** (or via the dashboard → Storage & Databases → D1):
   ```bash
   npx wrangler login
   npx wrangler d1 create aqarx-db
   ```

2. **Paste the returned `database_id`** into `wrangler.jsonc`
   The repository is already configured with the database ID supplied for `aqarx-db`.

3. **Create the tables** in the remote database:
   ```bash
   npx wrangler d1 execute aqarx-db --remote --file=./schema.sql
   ```

4. **Set variables & secrets** (dashboard → your Worker → Settings → Variables and Secrets):

   | Name | Required | Purpose |
   |------|----------|---------|
   | `JWT_SECRET` | **Yes** | signs auth tokens — a long random string |
   | `OPENAI_API_KEY` | No | live AI copy (otherwise listing posts use a template) |
   | `OPENAI_MODEL` | No | defaults to `gpt-4o-mini` |
   | `FRONTEND_URL` | No | OAuth redirect base (defaults to request origin) |
   | `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET` | No | Twitter/X OAuth |
   | `INSTAGRAM_CLIENT_ID` / `INSTAGRAM_CLIENT_SECRET` | No | Instagram OAuth |
   | `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` | No | Facebook OAuth |
   | `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` | No | LinkedIn OAuth |

5. **Build & deploy settings** (dashboard → Settings → Build):
   - **Root directory:** `/`
   - **Build command:** `npm install && cd frontend && npm install && npm run build`
   - **Deploy command:** `npx wrangler deploy`

### Every deploy

Push to the connected branch:

```bash
git add -A
git commit -m "your message"
git push
```

Cloudflare then: installs deps → builds the React app → `wrangler deploy`
bundles the Worker and uploads `frontend/build` as static assets.

---

## Local development

Full-stack (Worker + local D1 + built SPA):

```bash
npm install
cd frontend && npm install && npm run build && cd ..
npm run db:local          # apply schema.sql to a local D1
npx wrangler dev          # serves API + SPA at http://localhost:8787
```

Create a `.dev.vars` file in the repo root for local secrets (gitignored):

```
JWT_SECRET=dev-secret-change-me
OPENAI_API_KEY=sk-...
```

Frontend-only with hot reload (point CRA at the running Worker):

```bash
cd frontend
set REACT_APP_API_URL=http://localhost:8787/api   # PowerShell: $env:REACT_APP_API_URL="..."
npm start
```

---

## API overview

All routes are under `/api`. Protected routes require `Authorization: Bearer <token>`.

| Group | Endpoints |
|-------|-----------|
| Auth | `POST /auth/register`, `POST /auth/login` |
| Properties | `GET/POST /properties`, `GET/PUT/DELETE /properties/:id`, `PATCH /properties/:id/status`, `GET /properties/stats/summary` |
| Posts | `GET/POST /posts`, `PATCH /posts/:id/status`, `DELETE /posts/:id` |
| Leads | `GET/POST /leads`, `POST /leads/from-comment`, `GET/PUT/DELETE /leads/:id`, `PATCH /leads/:id/status`, `GET /leads/stats/summary` |
| AI | `POST /ai/generate-listing-post`, `POST /ai/generate-content`, `POST /ai/suggestions`, `POST /ai/reply-comment`, `GET/POST /ai/agents` |
| Social | `GET /social/accounts`, `DELETE /social/accounts/:id`, `GET /social/comments/:postId`, `POST /social/comments/reply`, `GET /social/:platform/auth`, `GET /social/:platform/callback` |

---

## Notes & limitations

- **Free-tier friendly:** D1 free tier includes 5 GB storage and 5M row reads/day.
- **Comment ingestion** is not automated yet — the `comments` table needs a
  platform webhook or polling job to populate it before replies/lead-conversion
  have data to work with.
- **Social OAuth** requires registering real apps with each platform and setting
  the client ID/secret variables; the Twitter flow uses a placeholder PKCE
  challenge and needs hardening for production.
