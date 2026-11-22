-- Apply this file to a fresh Neon database before starting the app.
-- Run scripts/migrate-neon.mjs to apply tracked SQL migrations safely.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY,
  full_name text,
  city text,
  bio text,
  goals text,
  role text NOT NULL DEFAULT 'resident' CHECK (role IN ('member','provider','resident','moderator','admin','super_admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, company text NOT NULL,
  location text, description text, fair_chance boolean NOT NULL DEFAULT true,
  apply_url text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS housing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL,
  type text CHECK (type IN ('transitional','rental','halfway','shelter')),
  location text, description text, contact text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS legal_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, category text,
  location text, description text, contact text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  title text NOT NULL, body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS community_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), post_id uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL, body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'interested' CHECK (status IN ('interested','applied','interviewing','hired','closed')),
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (user_id, job_id)
);
CREATE TABLE IF NOT EXISTS knowledge_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text, content text NOT NULL,
  embedding vector(1536), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_knowledge_docs_title_unique ON knowledge_docs(title);
CREATE OR REPLACE FUNCTION match_knowledge(query_embedding vector(1536), match_count int DEFAULT 4)
RETURNS TABLE(id uuid, title text, content text, similarity float)
LANGUAGE sql STABLE AS $$
  SELECT id, title, content, 1 - (embedding <=> query_embedding) AS similarity
  FROM knowledge_docs WHERE embedding IS NOT NULL ORDER BY embedding <=> query_embedding LIMIT match_count;
$$;
CREATE TABLE IF NOT EXISTS daily_check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'steady' CHECK (status IN ('steady','needs_support','urgent')),
  mood_score int NOT NULL DEFAULT 3 CHECK (mood_score BETWEEN 1 AND 5),
  support_needed boolean NOT NULL DEFAULT false, notes text, points_awarded int NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS daily_check_ins_user_day_unique ON daily_check_ins (user_id, ((created_at AT TIME ZONE 'UTC')::date));
CREATE TABLE IF NOT EXISTS positive_behavior_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL, points int NOT NULL DEFAULT 0, source_id uuid UNIQUE, note text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_behavior_events_source_unique ON positive_behavior_events(source_id);
CREATE TABLE IF NOT EXISTS supervision_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), participant_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  supervisor_id uuid REFERENCES profiles(id) ON DELETE SET NULL, supervisor_name text NOT NULL,
  supervisor_role text NOT NULL DEFAULT 'case_manager' CHECK (supervisor_role IN ('case_manager','observer','moderator','admin')),
  visibility_note text, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role text CHECK (role IN ('user','assistant','system')), content text NOT NULL,
  tokens int, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  feature text, provider text, model text, prompt_tokens int DEFAULT 0, completion_tokens int DEFAULT 0,
  total_tokens int DEFAULT 0, meta jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL, target text, meta jsonb NOT NULL DEFAULT '{}'::jsonb, ip text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_job_applications_user ON job_applications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_replies_post ON community_replies(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON chat_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_created ON usage_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created ON audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_check_ins_user_created ON daily_check_ins(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_events_user_created ON positive_behavior_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supervision_assignments_participant_active ON supervision_assignments(participant_id, active, created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text,
  body text,
  read boolean NOT NULL DEFAULT false,
  type text,
  message text,
  is_read boolean,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS body text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read boolean NOT NULL DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read boolean;
UPDATE notifications SET title = COALESCE(title, type, 'Notification'), body = COALESCE(body, message, ''), read = COALESCE(is_read, read, false);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('member','provider','resident','moderator','admin','super_admin'));

-- This database is accessed only by trusted server-side API code. Authorization
-- is enforced in the application; do not expose the Neon role to browser clients.

CREATE TABLE IF NOT EXISTS legal_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  case_number text NOT NULL CHECK (char_length(case_number) BETWEEN 1 AND 60),
  court text NOT NULL CHECK (char_length(court) BETWEEN 1 AND 120),
  case_type text NOT NULL DEFAULT 'criminal'
    CHECK (case_type IN ('criminal','probation_parole','expungement','family','civil','other')),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','pending_hearing','on_supervision','closed','dismissed')),
  next_hearing_at timestamptz,
  attorney text CHECK (char_length(attorney) <= 120),
  notes text CHECK (char_length(notes) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_legal_cases_user_hearing ON legal_cases(user_id, next_hearing_at);
