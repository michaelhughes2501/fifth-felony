-- Legal Case Tracker: each resident's private list of cases and hearing dates.
-- Every query is scoped by user_id in src/models/case.model.ts.
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
