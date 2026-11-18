-- ============================================================
-- Fifth Felony / Open Road — Full Schema Migration
-- Consolidates schema.sql + adds resident-dashboard tables
-- Run in Supabase SQL Editor or via: supabase db push
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ---------- Profiles (extends auth.users) ----------
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  city        TEXT,
  bio         TEXT,
  goals       TEXT,
  role        TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member','provider','admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- display_name computed alias used by community replies
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT
  GENERATED ALWAYS AS (COALESCE(full_name, 'Anonymous')) STORED;

-- ---------- Jobs ----------
CREATE TABLE IF NOT EXISTS jobs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  company     TEXT NOT NULL,
  location    TEXT,
  description TEXT,
  fair_chance BOOLEAN NOT NULL DEFAULT TRUE,
  apply_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- Housing ----------
CREATE TABLE IF NOT EXISTS housing (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  type        TEXT CHECK (type IN ('transitional','rental','halfway','shelter')),
  location    TEXT,
  description TEXT,
  contact     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- Legal Aid Resources ----------
CREATE TABLE IF NOT EXISTS legal_resources (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  category    TEXT,
  location    TEXT,
  description TEXT,
  contact     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- Community Posts ----------
CREATE TABLE IF NOT EXISTS community_posts (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title     TEXT NOT NULL,
  body      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_replies (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id   UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  body      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- Job Applications ----------
CREATE TABLE IF NOT EXISTS job_applications (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  job_id    UUID REFERENCES jobs(id) ON DELETE CASCADE,
  status    TEXT NOT NULL DEFAULT 'interested'
            CHECK (status IN ('interested','applied','interviewing','hired','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, job_id)
);

-- ---------- Knowledge Base (pgvector RAG) ----------
CREATE TABLE IF NOT EXISTS knowledge_docs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title      TEXT,
  content    TEXT NOT NULL,
  embedding  vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS knowledge_docs_embedding_idx
  ON knowledge_docs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE OR REPLACE FUNCTION match_knowledge (
  query_embedding vector(1536),
  match_count     INT DEFAULT 4
) RETURNS TABLE (id UUID, title TEXT, content TEXT, similarity FLOAT)
LANGUAGE sql STABLE AS $$
  SELECT id, title, content, 1 - (embedding <=> query_embedding) AS similarity
  FROM knowledge_docs
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ---------- Resident Dashboard ----------
CREATE TABLE IF NOT EXISTS daily_check_ins (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'steady'
                  CHECK (status IN ('steady','needs_support','urgent')),
  mood_score      INTEGER NOT NULL DEFAULT 3 CHECK (mood_score BETWEEN 1 AND 5),
  support_needed  BOOLEAN NOT NULL DEFAULT FALSE,
  notes           TEXT,
  points_awarded  INTEGER NOT NULL DEFAULT 10,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT daily_check_ins_user_day_unique UNIQUE (user_id, (created_at::DATE))
);

CREATE TABLE IF NOT EXISTS positive_behavior_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  points      INTEGER NOT NULL DEFAULT 0,
  source_id   UUID,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supervision_assignments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  supervisor_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  supervisor_name  TEXT NOT NULL,
  supervisor_role  TEXT NOT NULL DEFAULT 'case_manager'
                   CHECK (supervisor_role IN ('case_manager','observer','moderator','admin')),
  visibility_note  TEXT,
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------- Notifications ----------
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE profiles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE housing                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_resources           ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_replies         ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_check_ins           ENABLE ROW LEVEL SECURITY;
ALTER TABLE positive_behavior_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervision_assignments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications             ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY IF NOT EXISTS "profiles readable"    ON profiles FOR SELECT USING (TRUE);
CREATE POLICY IF NOT EXISTS "profiles self-insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "profiles self-update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Public resources (jobs, housing, legal) — read-only; writes via service role
CREATE POLICY IF NOT EXISTS "jobs readable"    ON jobs            FOR SELECT USING (TRUE);
CREATE POLICY IF NOT EXISTS "housing readable" ON housing         FOR SELECT USING (TRUE);
CREATE POLICY IF NOT EXISTS "legal readable"   ON legal_resources FOR SELECT USING (TRUE);

-- Community
CREATE POLICY IF NOT EXISTS "posts readable"    ON community_posts FOR SELECT USING (TRUE);
CREATE POLICY IF NOT EXISTS "posts insert own"  ON community_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY IF NOT EXISTS "posts update own"  ON community_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY IF NOT EXISTS "posts delete own"  ON community_posts FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY IF NOT EXISTS "replies readable"   ON community_replies FOR SELECT USING (TRUE);
CREATE POLICY IF NOT EXISTS "replies insert own" ON community_replies FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY IF NOT EXISTS "replies delete own" ON community_replies FOR DELETE USING (auth.uid() = author_id);

-- Job applications — strictly private
CREATE POLICY IF NOT EXISTS "apps select own" ON job_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "apps insert own" ON job_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "apps update own" ON job_applications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "apps delete own" ON job_applications FOR DELETE USING (auth.uid() = user_id);

-- Daily check-ins — own only
CREATE POLICY IF NOT EXISTS "check_ins own" ON daily_check_ins FOR ALL USING (auth.uid() = user_id);

-- Positive behavior events — own only
CREATE POLICY IF NOT EXISTS "pbe own" ON positive_behavior_events FOR ALL USING (auth.uid() = user_id);

-- Supervision assignments — participant or assigned supervisor
CREATE POLICY IF NOT EXISTS "supervision readable" ON supervision_assignments
  FOR SELECT USING (auth.uid() = participant_id OR auth.uid() = supervisor_id);

-- Notifications — own only
CREATE POLICY IF NOT EXISTS "notifications own" ON notifications FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Trigger: auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Seed Data
-- ============================================================
INSERT INTO jobs (title, company, location, description, fair_chance, apply_url) VALUES
('Warehouse Associate',    'Greenline Logistics',    'Boston, MA',   'Full-time warehouse role. No background restrictions. Training provided.',        TRUE, 'https://example.com/apply/1'),
('Line Cook',              'Second Plate Kitchen',   'Boston, MA',   'Busy kitchen seeking reliable cooks. Fair-chance employer, all welcome.',          TRUE, 'https://example.com/apply/2'),
('Construction Laborer',   'Rebuild Contracting',    'Cambridge, MA','Entry-level construction. Daily pay available, on-the-job training.',              TRUE, 'https://example.com/apply/3'),
('Customer Support Rep',   'Bright Path Telecom',    'Remote',       'Remote phone support. Quiet workspace and internet required.',                     TRUE, 'https://example.com/apply/4'),
('Landscaping Crew Member','Evergreen Grounds',      'Somerville, MA','Seasonal outdoor work. Valid license a plus but not required.',                   TRUE, 'https://example.com/apply/5'),
('Delivery Driver',        'City Express Courier',   'Boston, MA',   'Local deliveries, valid license required. Flexible hours, daily pay option.',      TRUE, 'https://example.com/apply/6'),
('Janitorial Staff',       'CleanFirst Services',    'Worcester, MA','Full benefits, no experience required. Background-friendly.',                      TRUE, 'https://example.com/apply/7'),
('Manufacturing Tech',     'ProMake Industries',     'Lowell, MA',   'Entry-level machine operator. On-the-job training and advancement path.',          TRUE, 'https://example.com/apply/8')
ON CONFLICT DO NOTHING;

INSERT INTO housing (name, type, location, description, contact) VALUES
('Fresh Start Transitional Home', 'transitional', 'Boston, MA',     'Up to 12 months supportive transitional housing with case management.',           'intake@freshstart.example.org'),
('Bridgeway Halfway House',        'halfway',      'Dorchester, MA', 'Structured halfway housing for individuals on supervised release.',                '(617) 555-0142'),
('Open Door Rentals',              'rental',       'Quincy, MA',     'Affordable studio and 1BR rentals, no background check on application.',           'rentals@opendoor.example.org'),
('Harbor Light Shelter',           'shelter',      'Boston, MA',     'Emergency overnight shelter with meals and referrals.',                            '(617) 555-0188'),
('New Path Housing Cooperative',   'transitional', 'Springfield, MA','Community-owned transitional co-op, 6–18 months, sliding-scale rent.',             'newpath@example.org'),
('Second Sunrise Rentals',         'rental',       'Lynn, MA',       'Fair-chance landlord, 1–3 BR units. References accepted in lieu of credit check.', '(781) 555-0230')
ON CONFLICT DO NOTHING;

INSERT INTO legal_resources (name, category, location, description, contact) VALUES
('Statewide Expungement Clinic',   'expungement',    'Massachusetts', 'Free help sealing or expunging eligible records. Monthly walk-in clinics.',          'clinic@legalaid.example.org'),
('Tenant Rights Hotline',          'housing rights', 'Massachusetts', 'Free advice on evictions, deposits, and discrimination in housing.',                  '(800) 555-0123'),
('Fair Employment Project',        'employment law', 'Boston, MA',    'Guidance on ban-the-box rights and workplace discrimination.',                        'help@fairemployment.example.org'),
('ID & Documents Assistance',      'documentation',  'Massachusetts', 'Help replacing birth certificates, IDs, and Social Security cards.',                  'docs@reentryhelp.example.org'),
('Reentry Legal Services',         'reentry',        'Nationwide',    'Comprehensive legal support for formerly incarcerated individuals.',                   '1-800-848-4450'),
('ACLU Criminal Law Reform',       'civil rights',   'Nationwide',    'Fighting discrimination against people with conviction records.',                      'aclu.org/criminal-law-reform'),
('Ban the Box Coalition',          'employment law', 'Nationwide',    'Know your rights — many states and cities restrict background check timing.',          'bantheboxcampaign.org'),
('Second Chance Act Programs',     'reentry',        'Nationwide',    'Federally-funded reentry programs providing housing, employment, and treatment help.', 'ojp.gov/programs/reentry')
ON CONFLICT DO NOTHING;
