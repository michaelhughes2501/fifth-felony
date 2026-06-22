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

-- ============================================================
-- Additions: notifications, knowledge_base alias, display_name
-- ============================================================

-- Notifications
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);
alter table notifications enable row level security;
create policy "Owner notifications" on notifications for all using (auth.uid() = user_id);

-- display_name alias on profiles (used by community replies API)
alter table profiles add column if not exists display_name text generated always as (coalesce(full_name, 'Anonymous')) stored;

-- ============================================================
-- Deep-Audit additions (mirrors migration 20260614000000):
-- RBAC role model + chat persistence + usage/audit logs.
-- ============================================================

-- Widen role check + new default (legacy member/provider still valid).
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles
  add constraint profiles_role_check
  check (role in ('member','provider','resident','moderator','admin','super_admin'));
alter table profiles alter column role set default 'resident';

create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('admin','super_admin')
  );
$$;

create table if not exists chat_conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists chat_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references chat_conversations(id) on delete cascade,
  role text check (role in ('user','assistant','system')),
  content text not null,
  tokens int,
  created_at timestamptz default now()
);

create table if not exists usage_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete set null,
  feature text, provider text, model text,
  prompt_tokens int default 0, completion_tokens int default 0, total_tokens int default 0,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references profiles(id) on delete set null,
  action text not null, target text,
  meta jsonb default '{}'::jsonb, ip text,
  created_at timestamptz default now()
);

-- Notifications already declared above; align to audit shape additively.
alter table notifications add column if not exists title text;
alter table notifications add column if not exists body text;
alter table notifications add column if not exists read boolean default false;

create index if not exists idx_chat_conversations_user_id on chat_conversations(user_id);
create index if not exists idx_chat_conversations_created_at on chat_conversations(created_at);
create index if not exists idx_chat_messages_conversation_id on chat_messages(conversation_id);
create index if not exists idx_chat_messages_created_at on chat_messages(created_at);
create index if not exists idx_usage_logs_user_id on usage_logs(user_id);
create index if not exists idx_usage_logs_created_at on usage_logs(created_at);
create index if not exists idx_audit_logs_actor_id on audit_logs(actor_id);
create index if not exists idx_audit_logs_created_at on audit_logs(created_at);

alter table chat_conversations enable row level security;
alter table chat_messages      enable row level security;
alter table usage_logs         enable row level security;
alter table audit_logs         enable row level security;

drop policy if exists "conversations select own" on chat_conversations;
create policy "conversations select own" on chat_conversations for select using (auth.uid() = user_id);
drop policy if exists "conversations insert own" on chat_conversations;
create policy "conversations insert own" on chat_conversations for insert with check (auth.uid() = user_id);
drop policy if exists "conversations update own" on chat_conversations;
create policy "conversations update own" on chat_conversations for update using (auth.uid() = user_id);

drop policy if exists "messages select own" on chat_messages;
create policy "messages select own" on chat_messages for select using (
  exists (select 1 from chat_conversations c where c.id = chat_messages.conversation_id and c.user_id = auth.uid())
);
drop policy if exists "messages insert own" on chat_messages;
create policy "messages insert own" on chat_messages for insert with check (
  exists (select 1 from chat_conversations c where c.id = chat_messages.conversation_id and c.user_id = auth.uid())
);

drop policy if exists "usage insert authenticated" on usage_logs;
create policy "usage insert authenticated" on usage_logs for insert with check (auth.role() = 'authenticated');
drop policy if exists "usage select admin" on usage_logs;
create policy "usage select admin" on usage_logs for select using (is_admin());

drop policy if exists "audit insert authenticated" on audit_logs;
create policy "audit insert authenticated" on audit_logs for insert with check (auth.role() = 'authenticated');
drop policy if exists "audit select admin" on audit_logs;
create policy "audit select admin" on audit_logs for select using (is_admin());
