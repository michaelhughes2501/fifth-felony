// Central domain types shared across models, controllers, and views.

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  description: string | null;
  fair_chance: boolean;
  apply_url: string | null;
  created_at: string;
}

export interface Housing {
  id: string;
  name: string;
  type: "transitional" | "rental" | "halfway" | "shelter" | null;
  location: string | null;
  description: string | null;
  contact: string | null;
  created_at: string;
}

export interface LegalResource {
  id: string;
  name: string;
  category: string | null;
  location: string | null;
  description: string | null;
  contact: string | null;
  created_at: string;
}

export interface CommunityPost {
  id: string;
  author_id: string | null;
  title: string;
  body: string;
  created_at: string;
  profiles?: { full_name: string | null } | null;
}

export interface JobApplication {
  id: string;
  user_id: string;
  job_id: string;
  status: "interested" | "applied" | "interviewing" | "hired" | "closed";
  created_at: string;
  jobs?: {
    title: string;
    company: string;
    location: string | null;
    apply_url: string | null;
  } | null;
}

export type CheckInStatus = "steady" | "needs_support" | "urgent";

export interface DailyCheckIn {
  id: string;
  user_id: string;
  status: CheckInStatus;
  mood_score: number;
  support_needed: boolean;
  notes: string | null;
  points_awarded: number;
  created_at: string;
}

export interface PositiveBehaviorEvent {
  id: string;
  user_id: string;
  event_type: string;
  points: number;
  source_id: string | null;
  note: string | null;
  created_at: string;
}

export interface SupervisionAssignment {
  id: string;
  participant_id: string;
  supervisor_id: string | null;
  supervisor_name: string;
  supervisor_role: "case_manager" | "observer" | "moderator" | "admin";
  visibility_note: string | null;
  active: boolean;
  created_at: string;
}

export interface DashboardSummary {
  todayCheckIn: DailyCheckIn | null;
  goodTime: {
    total: number;
    thisWeek: number;
    streak: number;
    tier: number;
  };
  supervision: SupervisionAssignment | null;
  recentEvents: PositiveBehaviorEvent[];
}

export interface Profile {
  id: string;
  full_name: string | null;
  city: string | null;
  bio: string | null;
  goals: string | null;
  role: "member" | "provider" | "admin";
  created_at: string;
}

// A consistent result shape so controllers can signal success/failure
// without throwing across the serverless boundary.
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number };
