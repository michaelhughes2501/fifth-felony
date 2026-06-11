# Fifth_felony — Open Road Reentry Support Platform

Next.js 16 + TypeScript + Supabase + OpenAI

## Quick start (localhost)

### 1. Add your real API keys

Edit `.env.local` (copy from `.env.local.example`):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-your-openai-key
NEXTAUTH_SECRET=fifth-felony-dev-secret-change-in-production
NEXTAUTH_URL=http://localhost:3002
```

### 2. Run the SQL migration in Supabase

Go to your Supabase project → **SQL Editor** and run the full contents of:

```
supabase/migrations/20240520000000_setup_schema.sql
```

This creates all tables and seeds starter data:
- `profiles` — user accounts (extends auth.users)
- `jobs` — fair-chance job listings
- `housing` — transitional housing resources
- `legal_resources` — legal aid and expungement clinics
- `community_posts` / `community_replies` — forum
- `job_applications` — per-user job tracking
- `daily_check_ins` — resident roll-call / mood tracking
- `positive_behavior_events` — good-time points system
- `supervision_assignments` — case manager assignments
- `knowledge_docs` — pgvector knowledge base for RAG (requires `vector` extension)
- `notifications` — user notifications

Requires the `vector` extension (pgvector). Enable it in Supabase:
**Database → Extensions → vector → Enable**

### 3. Install and run

```bash
npm install
npm run dev        # starts on http://localhost:3002
```

### 4. Without real keys (UI-only mode)

The app boots fine with the placeholder keys already in `.env.local`.
Pages load, navigation works. Supabase calls and the AI assistant will
return errors until real keys are added — this is expected.

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 App Router |
| Language | TypeScript 6 |
| Database / Auth | Supabase (PostgreSQL + pgvector + RLS) |
| AI assistant | OpenAI gpt-4o-mini + text-embedding-3-small |
| Styling | Tailwind CSS 4 |
| Rate limiting | In-memory (see src/lib/rate-limit.ts) |
| Security headers | middleware.ts (X-Frame-Options, CSP, HSTS, etc.) |

## API routes

| Route | Methods | Auth required |
|-------|---------|---------------|
| `/api/chat` | POST | No (rate-limited) |
| `/api/jobs` | GET, POST | POST: service role |
| `/api/housing` | GET, POST | POST: service role |
| `/api/legal` | GET, POST | POST: service role |
| `/api/community` | GET, POST | POST: signed in |
| `/api/applications` | GET, POST | Yes |
| `/api/resident-dashboard` | GET | Yes |
| `/api/roll-call` | POST | Yes |

## Security notes

- `.env.local` is git-ignored. Never commit real keys.
- The `SUPABASE_SERVICE_ROLE_KEY` is server-only — never exposed to the browser.
- All protected routes (`/dashboard`, `/admin`, `/applications`) redirect to `/login` via middleware.
- Row Level Security enforces data isolation at the database level.
- Rotate any keys that were previously committed to version control.
