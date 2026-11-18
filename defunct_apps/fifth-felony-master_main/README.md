# Open Road — Reentry Support Platform

A serverless web app connecting formerly incarcerated people with holistic support: **jobs, housing, mental health, legal aid, and community**, plus an AI assistant grounded in a local knowledge base (RAG).

Built on the stack recommended in the build guide: **Next.js (React + TypeScript)** frontend, **serverless API routes**, **Supabase (Postgres + Auth + pgvector)**, and **OpenAI** for the assistant. Deploys to **Vercel**.

---

## What's included

| Area | Status |
|------|--------|
| Landing page + 5 domain pages | ✅ |
| Supabase Auth (email/password) + protected routes | ✅ |
| Jobs / Housing / Legal — searchable, DB-backed | ✅ |
| Community forum — read + post (auth-gated, RLS) | ✅ |
| Mental health resources + crisis banners | ✅ |
| AI assistant — RAG + OpenAI moderation guardrails | ✅ |
| User dashboard with progress stats | ✅ |
| Save jobs + application tracker (status: interested → hired) | ✅ |
| Provider portal (`/admin`) — create/edit/delete jobs, housing, legal | ✅ |
| Toast notifications + optimistic UI updates | ✅ |
| Postgres schema, RLS policies, seed data | ✅ |

---

## 1. Prerequisites

- Node 18+
- A [Supabase](https://supabase.com) project (free tier is fine)
- An [OpenAI API key](https://platform.openai.com)

## 2. Configure environment

Copy `.env.example` to `.env.local` and fill in values from your Supabase
dashboard (**Settings → API**) and OpenAI:

```bash
cp .env.example .env.local
```

## 3. Set up the database

In the Supabase SQL Editor, run **in order**:

1. `supabase/schema.sql` — tables, pgvector, RLS policies, the `match_knowledge` function
2. `supabase/seed.sql` — sample jobs, housing, and legal resources

## 4. Seed the AI knowledge base (for RAG)

```bash
OPENAI_API_KEY=sk-... \
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=... \
node scripts/seed-knowledge.mjs
```

## 5. Run locally

```bash
npm install
npm run dev
# http://localhost:3000
```

## 6. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add the four environment variables in the Vercel dashboard
(**Project → Settings → Environment Variables**), then `vercel --prod`.
The API routes deploy automatically as serverless functions.

---

## Architecture (MVC)

The codebase follows a Model–View–Controller separation. In the Next.js App
Router, routing and rendering belong to `app/`, so views are the pages and
components; models and controllers are explicit layers underneath.

```
src/
├─ types/                 # Shared domain types + Result<T>
├─ models/                # MODEL — data access (CRUD) per resource
│  ├─ job.model.ts
│  ├─ housing.model.ts
│  ├─ legal.model.ts
│  ├─ community.model.ts
│  └─ application.model.ts
├─ controllers/           # CONTROLLER — validation, auth, business logic
│  ├─ job.controller.ts
│  ├─ housing.controller.ts
│  ├─ legal.controller.ts
│  ├─ community.controller.ts
│  ├─ application.controller.ts
│  └─ chat.controller.ts  # RAG pipeline + moderation guardrails
├─ app/                   # VIEW (routes/pages) + thin API routes
│  ├─ api/                #   routes only parse req → call controller → respond
│  │  ├─ jobs/route.ts          (GET list, POST create)
│  │  ├─ jobs/[id]/route.ts     (GET, PATCH, DELETE)
│  │  └─ …same shape for housing, legal, community, applications, chat
│  ├─ jobs/ housing/ legal/ …   # page views
│  └─ layout.tsx, page.tsx, globals.css
├─ components/            # VIEW — reusable UI
└─ lib/                   # Supabase + OpenAI clients (infrastructure)
```

**Request flow:** `page/route (view)` → `controller (logic)` → `model (data)` → Supabase.
Controllers return a `Result<T>` (`{ ok, data }` or `{ ok, error, status }`),
so routes never need their own try/catch and error handling stays consistent.

### REST API (full CRUD)

| Resource | Collection | Item |
|----------|-----------|------|
| Jobs | `GET /api/jobs` · `POST /api/jobs` | `GET/PATCH/DELETE /api/jobs/[id]` |
| Housing | `GET /api/housing` · `POST /api/housing` | `GET/PATCH/DELETE /api/housing/[id]` |
| Legal | `GET /api/legal` · `POST /api/legal` | `GET/PATCH/DELETE /api/legal/[id]` |
| Community | `GET /api/community` · `POST /api/community` | `PATCH/DELETE /api/community/[id]` |
| Applications | `GET /api/applications` · `POST /api/applications` | `PATCH/DELETE /api/applications/[id]` |
| Chat (AI) | `POST /api/chat` | — |

Writes to public resource tables (jobs/housing/legal) use the service-role
client and are intended for an admin/provider portal. Community posts and job
applications are owner-scoped and enforced by Row Level Security.

---

## Original architecture notes

- **Modular monolith** — one Next.js app, internally separated by domain
  (matches the guide's "scale when you need to" recommendation). API routes can
  later be peeled into dedicated services.
- **Security** — Row Level Security on all user data; job applications and
  community posts are owner-scoped. Service-role key is server-only.
- **AI guardrails** — every user message passes OpenAI moderation before the
  LLM; the system prompt enforces no legal/medical advice and surfaces the 988
  crisis line. Answers are grounded in retrieved knowledge docs to reduce
  hallucination.

## Provider portal & roles

`/admin` is a tabbed portal to create, edit, and delete jobs, housing, and
legal resources. It's protected by middleware (must be signed in). Writes to
those tables go through the service-role client on the server.

**Before production:** gate `/admin` by role. The `profiles.role` column already
exists (`member` / `provider` / `admin`) — add a check in middleware or the
admin page's server layer so only providers/admins can reach it, and tighten the
public-table write policies accordingly.

## Next steps (roadmap)

- Community replies thread (model + UI) — `community_replies` table is ready
- Role-based access on `/admin` (column exists; enforce it)
- Real-time community updates via Supabase Realtime
- External job-board API integration (e.g. Honest Jobs)
- SMS reminders via Twilio; Stripe for employer subscriptions
