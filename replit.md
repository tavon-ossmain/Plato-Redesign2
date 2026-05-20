# Plato's Core — Signal Command Center

A B2B intent-signal triage tool: detects, verifies, scores, and routes high-intent buying signals to sales owners. Three-column desktop layout + two-screen mobile triage flow.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/platos-core run dev` — run the frontend (port 25155)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes to dev Postgres
- `pnpm --filter @workspace/api-server run seed` — re-seed the database with sample data (uses ON CONFLICT DO NOTHING for signals/workspaces)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (port 25155, path `/`)
- API: Express 5 (port 8080, path `/api`)
- DB: PostgreSQL (Replit-managed) + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → typed React Query hooks)
- Build: esbuild (CJS bundle)

## Where things live

| Thing | Path |
|---|---|
| DB schema (source of truth) | `lib/db/src/schema/` |
| Drizzle config | `lib/db/drizzle.config.ts` |
| OpenAPI spec (source of truth) | `lib/api-spec/openapi.yaml` |
| Generated React Query hooks | `lib/api-client-react/src/generated/api.ts` |
| Generated Zod schemas | `lib/api-zod/src/generated/api.ts` |
| API routes | `artifacts/api-server/src/routes/signals.ts` |
| Frontend component | `artifacts/platos-core/src/components/SignalCommandCenter.tsx` |
| Seed script | `artifacts/api-server/src/seed.ts` |

## Database schema

Three tables, all portable to any Postgres:

- **workspaces** — id (text pk), name, plan, quota, used, raw_scanned, unique_accounts, duplicates_suppressed, stale_signals
- **signals** — id (text pk), workspace_id, contact fields (name/title/linkedin), all score/disposition/routing fields, feedback
- **workspace_sources** — id (serial pk), workspace_id, name, yield, status

Dashboard `billableOpportunities` and `intentUpdates` are derived live with COUNT queries from the signals table. Everything else is stored on `workspaces`.

## Architecture decisions

- Contract-first API: OpenAPI spec is written by hand → Orval generates typed hooks. Never edit generated files.
- Dashboard stats are a mix: live counts from signals table + ingestion counters stored on the workspaces row (rawScanned, uniqueAccounts, etc.)
- Seed script uses `ON CONFLICT DO NOTHING` so it's safe to re-run without duplicating data
- No auth yet — all routes are public. Next step is Clerk auth gating
- In-memory state is gone: assign and feedback mutations now persist to Postgres and survive server restarts

## Product

Signal Command Center: a triage interface for detected buying signals. Signals come in from sources (LinkedIn, G2, Reddit, Job Boards, Web Scrape), are scored on fit/confidence/freshness, and routed to the right sales owner. Reps can mark signals as duplicate/outdated/watchlist. A proof chain tracks the signal lifecycle from detection to feedback.

## User preferences

- Final UI design is approved — do not change layout, colors, or component structure without explicit direction
- Light/dark mode toggle is in the header (defaults to dark)
- Never use console.log in server code — use req.log in route handlers, logger singleton elsewhere

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change before editing frontend code
- Run `pnpm --filter @workspace/db run push` after any schema change before testing API routes
- Do NOT run `pnpm dev` at workspace root — use workflow restart or `--filter` commands
- Verify with `pnpm --filter @workspace/<name> run typecheck`, not `build` (build needs PORT/BASE_PATH env vars)
- The shared reverse proxy routes all traffic — curl against `localhost:80`, never direct service ports

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Production schema changes are handled automatically by Replit's Publish flow — do not write custom migration scripts
