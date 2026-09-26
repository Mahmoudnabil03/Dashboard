# TypeScript Migration Plan (SocialHub)

Status: planned, not started. The repo is JavaScript (CRA frontend, Hono worker).
P0-P1 hardening was prioritized; this plan keeps a future migration safe.

## Principles
- Incremental, file by file. Never a flag-day rewrite.
- `allowJs` plus `checkJs` first for early signal without renames.
- Strict mode only for new/converted modules at first.

## Order
1. Tooling: add `typescript`, `@types/react`, `@types/node`; `tsconfig.json`
   with `allowJs: true`, `outDir` unchanged behavior for CRA.
2. Shared contracts first: `frontend/src/api.js` -> `.ts` (endpoint map plus
   response types), `worker/lib.js` row shapers and `Env` bindings type.
3. Backend routes next (auth, social, tracking), then frontend pages in order
   of churn: Settings, Campaigns, Inbox, AIAgent.
4. Enable `strict: true` per converted file via `// @ts-strict` tracking list.
5. CI: add `tsc --noEmit` to the workflow once the first module converts.

## Non-goals
- No dependency or bundler changes as part of the migration.
- No behavior changes; each conversion ships with passing build.
