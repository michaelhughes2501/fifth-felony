-- ============================================================
-- Deep-Audit migration: RBAC + chat persistence + usage/audit logs
-- Idempotent: safe to run multiple times. Mirrored into schema.sql.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- RBAC: widen the profiles.role check to the new role model
-- without breaking existing 'member'/'provider' rows.
-- Levels (low->high): resident, moderator, admin, super_admin.
-- Legacy: member -> resident, provider -> moderator.
-- ------------------------------------------------------------
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles
  add constraint profiles_role_check
  check (role in ('member','provider','resident','moderator','admin','super_admin'));
alter table profiles alter column role set default 'resident';

-- Helper: is the current user an admin (or higher)?
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role in ('admin','super_admin')
  );
$$;

-- ------------------------------------------------------------
-- Chat persistence
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Usage + audit logs
-- ------------------------------------------------------------
create table if not exists usage_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete set null,
  feature text,
  provider text,
  model text,
  prompt_tokens int default 0,
  completion_tokens int default 0,
  total_tokens int default 0,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  target text,
  meta jsonb default '{}'::jsonb,
  ip text,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- Notifications (already present in base schema; ensure it exists)
-- ------------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  title text,
  body text,
  read boolean default false,
  created_at timestamptz default now()
);
-- Bring an older notifications table (type/message/is_read) up to the
-- audit shape without dropping existing data.
alter table notifications add column if not exists title text;
alter table notifications add column if not exists body text;
alter table notifications add column if not exists read boolean default false;

-- ------------------------------------------------------------
-- Indexes (FK columns + created_at)
-- ------------------------------------------------------------
create index if not exists idx_chat_conversations_user_id on chat_conversations(user_id);
create index if not exists idx_chat_conversations_created_at on chat_conversations(created_at);
create index if not exists idx_chat_messages_conversation_id on chat_messages(conversation_id);
create index if not exists idx_chat_messages_created_at on chat_messages(created_at);
create index if not exists idx_usage_logs_user_id on usage_logs(user_id);
create index if not exists idx_usage_logs_created_at on usage_logs(created_at);
create index if not exists idx_audit_logs_actor_id on audit_logs(actor_id);
create index if not exists idx_audit_logs_created_at on audit_logs(created_at);
create index if not exists idx_notifications_user_id on notifications(user_id);

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table chat_conversations enable row level security;
alter table chat_messages      enable row level security;
alter table usage_logs         enable row level security;
alter table audit_logs         enable row level security;
alter table notifications      enable row level security;

-- Conversations: a user owns their own
drop policy if exists "conversations select own" on chat_conversations;
create policy "conversations select own" on chat_conversations
  for select using (auth.uid() = user_id);
drop policy if exists "conversations insert own" on chat_conversations;
create policy "conversations insert own" on chat_conversations
  for insert with check (auth.uid() = user_id);
drop policy if exists "conversations update own" on chat_conversations;
create policy "conversations update own" on chat_conversations
  for update using (auth.uid() = user_id);

-- Messages: scoped to a conversation the user owns
drop policy if exists "messages select own" on chat_messages;
create policy "messages select own" on chat_messages
  for select using (
    exists (
      select 1 from chat_conversations c
      where c.id = chat_messages.conversation_id
        and c.user_id = auth.uid()
    )
  );
drop policy if exists "messages insert own" on chat_messages;
create policy "messages insert own" on chat_messages
  for insert with check (
    exists (
      select 1 from chat_conversations c
      where c.id = chat_messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

-- Notifications: owner manages their own
drop policy if exists "notifications owner" on notifications;
create policy "notifications owner" on notifications
  for all using (auth.uid() = user_id);

-- Usage logs: any authenticated user may insert; only admins may read
drop policy if exists "usage insert authenticated" on usage_logs;
create policy "usage insert authenticated" on usage_logs
  for insert with check (auth.role() = 'authenticated');
drop policy if exists "usage select admin" on usage_logs;
create policy "usage select admin" on usage_logs
  for select using (is_admin());

-- Audit logs: any authenticated user may insert; only admins may read
drop policy if exists "audit insert authenticated" on audit_logs;
create policy "audit insert authenticated" on audit_logs
  for insert with check (auth.role() = 'authenticated');
drop policy if exists "audit select admin" on audit_logs;
create policy "audit select admin" on audit_logs
  for select using (is_admin());
