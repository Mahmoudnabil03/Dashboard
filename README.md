# SocialHub - Manage. Connect. Grow.

All-in-one social media command center: connect accounts, schedule content,
track pixels and conversions, run campaigns, and work with an AI marketing
co-pilot. Live at https://dashboard.mahmoudnabil03.workers.dev/

## Stack

- Frontend: React 18 SPA (react-router, TanStack Query, recharts, Tailwind)
- Backend: Cloudflare Worker (Hono) plus D1 database, Workers AI binding
- Deploy: single Worker serves `/api/*` and the SPA bundle (`wrangler.jsonc`)

## Quick start

```bash
npm install
cp .env.example .dev.vars   # fill local values, never commit secrets
npx wrangler d1 execute aqarx-db --local --file=./schema.sql
cd frontend && npm install && npm start
npx wrangler dev            # serves API on :8787 (set REACT_APP_API_URL)
```

## Scripts (repo root)

- `npm run dev` - wrangler dev
- `npm run build` - production frontend build
- `npm run deploy` - build plus wrangler deploy
- `npm run db:local` / `npm run db:remote` - apply `schema.sql`

## Secrets (production via `wrangler secret put`)

Required: `JWT_SECRET`, `FRONTEND_URL`.
Social OAuth: `TWITTER_CLIENT_ID/SECRET`, `FACEBOOK_CLIENT_ID/SECRET`,
`INSTAGRAM_CLIENT_ID/SECRET`, `LINKEDIN_CLIENT_ID/SECRET`, `TIKTOK_CLIENT_KEY/SECRET`.
Webhooks: `*_WEBHOOK_VERIFY_TOKEN` per platform (any random string).
AI: Workers AI binding is primary (no secret); optional `AI_MODEL`, `OPENAI_API_KEY`.
Email: `EMAIL_PROVIDER=mock` logs to console; `resend` plus `RESEND_API_KEY` sends.
See `.env.example`. Rotate `JWT_SECRET` with care: it signs every session.

## Key flows

- Auth: register (email verification link, 24h) -> verify -> login (httpOnly
  `sh_token` cookie plus in-memory Bearer; old localStorage sessions migrate once).
- Password reset: 1-hour token links, no account enumeration.
- Social: Accounts page Connect buttons -> OAuth popup -> callback stores
  page/channel tokens server-side. Webhooks per platform with verify tokens.
- Tracking: Settings -> Integrations for Meta Pixel/CAPI, GA4, GTM, TikTok,
  LinkedIn, Snapchat, Pinterest (add/edit/test/delete).
- Content: Posts, drag-and-drop Calendar reschedule, Content ideas, Campaigns.
- AI: chat co-pilot, reply drafts, suggestions, comment tone/spam check.
- Team roles: owner, admin, manager, analyst, content. Billing plans gate usage.

## MCP for AI assistants

`mcp-server/` exposes the live API over MCP (40+ tools). Project `opencode.json`
wires `socialhub` (local), `cloudflare-ai-gateway`, and `github` (OAuth on
restart). Set `SOCIALHUB_API_TOKEN` to a login JWT after restart.

## Compliance

Terms, Privacy, Cookies, and Egypt Law 151/2020 compliance pages ship in-app
(`/terms`, `/privacy`, `/cookies`, `/compliance`). Data: D1 (AWS Bahrain
region account), TLS 1.3, AES-256 at rest, PBKDF2 passwords.

## Docs

- `IMPROVEMENTS.md` - hardening backlog tracker (source of truth for P0-P3).
- `mcp-server/README.md` - MCP setup and tool catalog.
- `schema.sql` - full D1 schema including auth hardening tables.

## Operations

- Logs: every Worker execution emits JSON lines with run_id (start/end/error stages).
- Alerts (Cloudflare dashboard, manual setup): 5xx spike alert on the
  dashboard Worker, Workers AI usage/budget alert, D1 slow-query review,
  auth-failure review via dashboard_rate_events growth.
- TypeScript: incremental plan in TYPESCRIPT.md (repo is currently JS).
