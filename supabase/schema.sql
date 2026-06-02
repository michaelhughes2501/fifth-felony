-- ============================================================
-- Reentry Support Platform — Database Schema
-- Run this in Supabase SQL Editor (or via `supabase db push`).
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists vector;

-- ---------- Profiles (extends auth.users) ----------
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  city        text,
  bio         text,
  goals       text,
  role        text not null default 'member' check (role in ('member','provider','admin')),
  created_at  timestamptz not null default now()
);

-- ---------- Jobs ----------
create table if not exists jobs (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  company       text not null,
  location      text,
  description   text,
  fair_chance   boolean not null default true,
  apply_url     text,
  created_at    timestamptz not null default now()
);

-- ---------- Housing ----------
create table if not exists housing (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  type          text check (type in ('transitional','rental','halfway','shelter')),
  location      text,
  description   text,
  contact       text,
  created_at    timestamptz not null default now()
);

-- ---------- Legal aid resources ----------
create table if not exists legal_resources (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  category      text,  -- e.g. expungement, housing rights, employment law
  location      text,
  description   text,
  contact       text,
  created_at    timestamptz not null default now()
);

-- ---------- Community posts (forum) ----------
create table if not exists community_posts (
  id            uuid primary key default uuid_generate_v4(),
  author_id     uuid references profiles(id) on delete set null,
  title         text not null,
  body          text not null,
  created_at    timestamptz not null default now()
);

create table if not exists community_replies (
  id            uuid primary key default uuid_generate_v4(),
  post_id       uuid references community_posts(id) on delete cascade,
  author_id     uuid references profiles(id) on delete set null,
  body          text not null,
  created_at    timestamptz not null default now()
);

-- ---------- Job applications (user <-> job) ----------
create table if not exists job_applications (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references profiles(id) on delete cascade,
  job_id        uuid references jobs(id) on delete cascade,
  status        text not null default 'interested' check (status in ('interested','applied','interviewing','hired','closed')),
  created_at    timestamptz not null default now(),
  unique (user_id, job_id)
);

-- ---------- Knowledge base for RAG (pgvector) ----------
create table if not exists knowledge_docs (
  id            uuid primary key default uuid_generate_v4(),
  title         text,
  content       text not null,
  embedding     vector(1536),
  created_at    timestamptz not null default now()
);

create index if not exists knowledge_docs_embedding_idx
  on knowledge_docs using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Similarity search function used by the chat API
create or replace function match_knowledge (
  query_embedding vector(1536),
  match_count int default 4
) returns table (id uuid, title text, content text, similarity float)
language sql stable as $$
  select id, title, content, 1 - (embedding <=> query_embedding) as similarity
  from knowledge_docs
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles            enable row level security;
alter table community_posts     enable row level security;
alter table community_replies   enable row level security;
alter table job_applications    enable row level security;

-- Profiles: a user can read all profiles but only edit their own
create policy "profiles readable" on profiles for select using (true);
create policy "profiles self-insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles self-update" on profiles for update using (auth.uid() = id);

-- Community: anyone signed in can read; authors manage their own
create policy "posts readable" on community_posts for select using (true);
create policy "posts insert own" on community_posts for insert with check (auth.uid() = author_id);
create policy "posts update own" on community_posts for update using (auth.uid() = author_id);
create policy "posts delete own" on community_posts for delete using (auth.uid() = author_id);

create policy "replies readable" on community_replies for select using (true);
create policy "replies insert own" on community_replies for insert with check (auth.uid() = author_id);
create policy "replies delete own" on community_replies for delete using (auth.uid() = author_id);

-- Job applications: strictly private to the owner
create policy "apps select own" on job_applications for select using (auth.uid() = user_id);
create policy "apps insert own" on job_applications for insert with check (auth.uid() = user_id);
create policy "apps update own" on job_applications for update using (auth.uid() = user_id);
create policy "apps delete own" on job_applications for delete using (auth.uid() = user_id);

-- Public resource tables (jobs, housing, legal, knowledge) are readable by all;
-- writes are restricted to service role (admin seeding / provider portal).
alter table jobs               enable row level security;
alter table housing            enable row level security;
alter table legal_resources    enable row level security;
create policy "jobs readable"    on jobs            for select using (true);
create policy "housing readable" on housing         for select using (true);
create policy "legal readable"   on legal_resources for select using (true);
