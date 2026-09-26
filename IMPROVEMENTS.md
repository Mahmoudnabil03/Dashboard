# SocialHub Improvements Tracker

Source of truth for the P0-P3 hardening backlog. Checked items are implemented,
committed, and deployed. Live: https://dashboard.mahmoudnabil03.workers.dev/

## P0 - Critical
- [ ] Blank first paint: splash in index.html, lazy routes plus Suspense, preload hints
- [ ] Email verification: token flow with expiry plus provider abstraction (mock fallback)
- [ ] Security headers on all responses (CSP, frame, nosniff, HSTS, referrer)
- [ ] Structured logging with levels plus run_id plus LOG_LEVEL toggle

## P1 - High
- [ ] Rate limiting on auth endpoints (D1 sliding window plus backoff messaging)
- [ ] Unified inbox MVP hardening (exists: filters/search/reply; add assign plus status workflow)
- [ ] Accessibility pass on auth screens (labels, aria, focus, contrast, keyboard)
- [ ] React Error Boundary around app plus friendly fallback
- [ ] Safer token storage: httpOnly Secure SameSite cookies plus short sessions (keep Bearer compat)
- [ ] Forgot password plus inline validation plus loading states on auth forms

## P2 - Medium
- [ ] PWA: manifest icons/colors, service worker (network-first), install prompt support
- [ ] Content planner: drag-and-drop reschedule on calendar (plus PUT /api/posts/:id)
- [ ] Analytics CSV export (plus document PDF follow-up)
- [ ] AI moderation: sentiment/spam flags on inbox via Workers AI (plus /api/ai/moderate)
- [x] State management: TanStack Query already in deps (verify usage, document)
- [ ] SEO/OG tags, favicons, Apple touch icon

## P3 - Lower
- [ ] Dark/light mode toggle (persist, respect prefers-color-scheme)
- [ ] TypeScript migration plan (doc only; repo is JS)
- [ ] CI/CD: GitHub Actions (install, build, dry-run deploy)
- [ ] Operational alerts: documented (Cloudflare dashboard config, needs UI setup)
- [x] Configuration as code: wrangler.jsonc is source of truth

## Blockers / external credentials needed
- OAuth client IDs/secrets (Twitter/X, Facebook, Instagram, LinkedIn, TikTok)
- Email provider key for production sending (else mock logs to server console)
- OPENAI_API_KEY optional (Workers AI binding is primary)
- JWT_SECRET rotation policy documented in README
