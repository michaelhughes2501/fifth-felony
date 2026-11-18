-- ============================================================
-- Open Road (Fifth_felony) — Complete Database Schema
-- Single idempotent migration: run once in Supabase SQL Editor
-- or via: supabase db push
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists vector;

-- ============================================================
-- Core tables
-- ============================================================

-- Profiles (extends auth.users)
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  city        text,
  bio         text,
  goals       text,
  role        text not null default 'member' check (role in ('member','provider','admin')),
  created_at  timestamptz not null default now()
);

-- Display name computed column (used by community replies)
alter table profiles add column if not exists display_name text
  generated always as (coalesce(full_name, 'Anonymous')) stored;

-- Jobs
create table if not exists jobs (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  company     text not null,
  location    text,
  description text,
  fair_chance boolean not null default true,
  apply_url   text,
  created_at  timestamptz not null default now()
);

-- Housing
create table if not exists housing (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  type        text check (type in ('transitional','rental','halfway','shelter')),
  location    text,
  description text,
  contact     text,
  created_at  timestamptz not null default now()
);

-- Legal resources
create table if not exists legal_resources (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  category    text,
  location    text,
  description text,
  contact     text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- Community / Forum
-- ============================================================

create table if not exists community_posts (
  id        uuid primary key default uuid_generate_v4(),
  author_id uuid references profiles(id) on delete set null,
  title     text not null,
  body      text not null,
  created_at timestamptz not null default now()
);

create table if not exists community_replies (
  id        uuid primary key default uuid_generate_v4(),
  post_id   uuid references community_posts(id) on delete cascade,
  author_id uuid references profiles(id) on delete set null,
  body      text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_community_replies_post on community_replies(post_id);

-- ============================================================
-- Job applications (user <-> job tracker)
-- ============================================================

create table if not exists job_applications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references profiles(id) on delete cascade,
  job_id     uuid references jobs(id) on delete cascade,
  status     text not null default 'interested'
             check (status in ('interested','applied','interviewing','hired','closed')),
  created_at timestamptz not null default now(),
  unique (user_id, job_id)
);

-- ============================================================
-- Roll Call / Daily check-ins
-- ============================================================

create table if not exists daily_check_ins (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references profiles(id) on delete cascade,
  status         text not null check (status in ('steady','needs_support','urgent')),
  mood_score     integer not null check (mood_score between 1 and 5),
  support_needed boolean not null default false,
  notes          text,
  points_awarded integer not null default 10,
  created_at     timestamptz not null default now(),
  constraint daily_check_ins_user_day_unique unique (user_id, (created_at::date))
);

create index if not exists idx_daily_check_ins_user on daily_check_ins(user_id);

-- ============================================================
-- Good Time — positive behaviour events
-- ============================================================

create table if not exists positive_behavior_events (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  event_type text not null,
  points     integer not null default 0,
  source_id  uuid,
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists idx_pbe_user on positive_behavior_events(user_id);
create index if not exists idx_pbe_user_created on positive_behavior_events(user_id, created_at);

-- ============================================================
-- Supervision assignments (PO / case-manager relationship)
-- ============================================================

create table if not exists supervision_assignments (
  id                uuid primary key default uuid_generate_v4(),
  participant_id    uuid not null references profiles(id) on delete cascade,
  supervisor_id     uuid references profiles(id) on delete set null,
  supervisor_name   text not null default 'Unassigned',
  supervisor_role   text not null default 'case_manager'
                    check (supervisor_role in ('case_manager','observer','moderator','admin')),
  visibility_note   text,
  active            boolean not null default true,
  created_at        timestamptz not null default now()
);

create index if not exists idx_supervision_participant on supervision_assignments(participant_id, active);

-- ============================================================
-- Notifications
-- ============================================================

create table if not exists notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references profiles(id) on delete cascade,
  type        text not null,
  message     text not null,
  is_read     boolean default false,
  created_at  timestamptz default now()
);

create index if not exists idx_notifications_user_unread
  on notifications(user_id) where is_read = false;

-- ============================================================
-- Saved resources
-- ============================================================

create table if not exists saved_resources (
  user_id       uuid references profiles(id) on delete cascade,
  resource_type text not null,
  resource_id   uuid not null,
  created_at    timestamptz default now(),
  primary key (user_id, resource_type, resource_id)
);

-- ============================================================
-- Knowledge base for RAG (pgvector — 1536-dim = text-embedding-3-small)
-- ============================================================

create table if not exists knowledge_docs (
  id         uuid primary key default uuid_generate_v4(),
  title      text,
  content    text not null,
  embedding  vector(1536),
  created_at timestamptz not null default now()
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

alter table profiles             enable row level security;
alter table community_posts      enable row level security;
alter table community_replies    enable row level security;
alter table job_applications     enable row level security;
alter table daily_check_ins      enable row level security;
alter table positive_behavior_events enable row level security;
alter table supervision_assignments enable row level security;
alter table notifications        enable row level security;
alter table saved_resources      enable row level security;
alter table jobs                 enable row level security;
alter table housing              enable row level security;
alter table legal_resources      enable row level security;

-- Profiles
create policy if not exists "profiles readable"     on profiles for select using (true);
create policy if not exists "profiles self-insert"  on profiles for insert with check (auth.uid() = id);
create policy if not exists "profiles self-update"  on profiles for update using (auth.uid() = id);

-- Public resource tables (read-only via anon; writes via service role only)
create policy if not exists "jobs readable"    on jobs            for select using (true);
create policy if not exists "housing readable" on housing         for select using (true);
create policy if not exists "legal readable"   on legal_resources for select using (true);

-- Community
create policy if not exists "posts readable"    on community_posts for select using (true);
create policy if not exists "posts insert own"  on community_posts for insert with check (auth.uid() = author_id);
create policy if not exists "posts update own"  on community_posts for update using (auth.uid() = author_id);
create policy if not exists "posts delete own"  on community_posts for delete using (auth.uid() = author_id);

create policy if not exists "replies readable"   on community_replies for select using (true);
create policy if not exists "replies insert own" on community_replies for insert with check (auth.uid() = author_id);
create policy if not exists "replies delete own" on community_replies for delete using (auth.uid() = author_id);

-- Job applications (strictly private)
create policy if not exists "apps select own" on job_applications for select using (auth.uid() = user_id);
create policy if not exists "apps insert own" on job_applications for insert with check (auth.uid() = user_id);
create policy if not exists "apps update own" on job_applications for update using (auth.uid() = user_id);
create policy if not exists "apps delete own" on job_applications for delete using (auth.uid() = user_id);

-- Daily check-ins (private to owner + readable by assigned supervisor)
create policy if not exists "check_ins own" on daily_check_ins for all using (auth.uid() = user_id);

-- Positive behaviour events (private to owner)
create policy if not exists "pbe own" on positive_behavior_events for all using (auth.uid() = user_id);

-- Supervision assignments (participant sees their own; supervisor sees their assignments)
create policy if not exists "supervision participant" on supervision_assignments
  for select using (auth.uid() = participant_id or auth.uid() = supervisor_id);

-- Notifications
create policy if not exists "notifications own" on notifications for all using (auth.uid() = user_id);

-- Saved resources
create policy if not exists "saved_resources own" on saved_resources for all using (auth.uid() = user_id);

-- ============================================================
-- Seed data (idempotent — insert only if the table is empty)
-- ============================================================

insert into jobs (title, company, location, description, fair_chance, apply_url)
select * from (values
  ('Warehouse Associate',  'Greenline Logistics',  'Boston, MA',    'Full-time warehouse role. No background restrictions. Training provided.',              true, 'https://example.com/apply/1'),
  ('Line Cook',            'Second Plate Kitchen', 'Boston, MA',    'Busy kitchen seeking reliable cooks. Fair-chance employer, all welcome.',               true, 'https://example.com/apply/2'),
  ('Construction Laborer', 'Rebuild Contracting',  'Cambridge, MA', 'Entry-level construction. Daily pay available, on-the-job training.',                   true, 'https://example.com/apply/3'),
  ('Customer Support Rep', 'Bright Path Telecom',  'Remote',        'Remote phone support. Quiet workspace and internet required.',                           true, 'https://example.com/apply/4'),
  ('Landscaping Crew',     'Evergreen Grounds',    'Somerville, MA','Seasonal outdoor work. Valid license a plus but not required.',                          true, 'https://example.com/apply/5')
) as v(title, company, location, description, fair_chance, apply_url)
where not exists (select 1 from jobs limit 1);

insert into housing (name, type, location, description, contact)
select * from (values
  ('Fresh Start Transitional Home', 'transitional', 'Boston, MA',    'Up to 12 months supportive transitional housing with case management.', 'intake@freshstart.example.org'),
  ('Bridgeway Halfway House',       'halfway',      'Dorchester, MA','Structured halfway housing for individuals on supervised release.',       '(617) 555-0142'),
  ('Open Door Rentals',             'rental',       'Quincy, MA',    'Affordable studio and 1BR rentals, no background check on application.','rentals@opendoor.example.org'),
  ('Harbor Light Shelter',          'shelter',      'Boston, MA',    'Emergency overnight shelter with meals and referrals.',                  '(617) 555-0188')
) as v(name, type, location, description, contact)
where not exists (select 1 from housing limit 1);

insert into legal_resources (name, category, location, description, contact)
select * from (values
  ('Statewide Expungement Clinic', 'expungement',    'Massachusetts', 'Free help sealing or expunging eligible records. Monthly walk-in clinics.', 'clinic@legalaid.example.org'),
  ('Tenant Rights Hotline',        'housing rights', 'Massachusetts', 'Free advice on evictions, deposits, and discrimination in housing.',         '(800) 555-0123'),
  ('Fair Employment Project',      'employment law', 'Boston, MA',    'Guidance on ban-the-box rights and workplace discrimination.',               'help@fairemployment.example.org'),
  ('ID & Documents Assistance',    'documentation',  'Massachusetts', 'Help replacing birth certificates, IDs, and Social Security cards.',         'docs@reentryhelp.example.org')
) as v(name, category, location, description, contact)
where not exists (select 1 from legal_resources limit 1);
