export type ApplicationStage =
  | "Draft"
  | "Applied"
  | "Screening"
  | "Interviewing"
  | "Offer"
  | "Closed";

export type ClosedReason =
  | "Rejected"
  | "Withdrawn"
  | "Offer Accepted"
  | "Offer Declined"
  | "Position Cancelled"
  | "Other";

export type CommunicationState =
  | "No update received"
  | "Awaiting reply"
  | "Update received"
  | "Discussion ongoing";

export type ApplicationSource =
  | "LinkedIn"
  | "Company Website"
  | "Referral"
  | "Job Board"
  | "Recruiter Outreach"
  | "Other";

export type ActionType =
  | "recruiter_follow_up"
  | "check_portal"
  | "prepare_materials"
  | "send_update"
  | "custom";

export type ActionStatus = "pending" | "completed" | "cancelled";

export type DueCategory = "overdue" | "due_today" | "upcoming";

export type InteractionType =
  | "Application Submitted"
  | "Email Received"
  | "Email Sent"
  | "Recruiter Call"
  | "Technical Interview"
  | "Behavioral Interview"
  | "Take-home Assessment"
  | "Offer Discussion"
  | "Status Check"
  | "Note / Update"
  | "Action Completed";

export interface NextAction {
  id: string;
  application_id: string;
  user_id: string;
  title: string;
  action_type: ActionType;
  due_date: string; // ISO date string: YYYY-MM-DD
  status: ActionStatus;
  completed_at?: string | null;
  rescheduled_count: number;
  last_rescheduled_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Joined convenience fields
  company?: string;
  role?: string;
}

export interface Interaction {
  id: string;
  application_id: string;
  user_id: string;
  interaction_date: string; // ISO date string: YYYY-MM-DD
  type: InteractionType;
  summary: string;
  details?: string | null;
  created_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  company: string;
  role: string;
  application_date: string; // ISO date string: YYYY-MM-DD
  stage: ApplicationStage;
  closed_reason?: ClosedReason | null;
  communication_state: CommunicationState;
  source: ApplicationSource;
  source_details?: string | null;
  job_url?: string | null;
  contact_name?: string | null;
  contact_channel?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Joined or calculated fields
  active_action?: NextAction | null;
  interactions?: Interaction[];
}

export interface ApplicationFormData {
  company: string;
  role: string;
  application_date: string;
  stage: ApplicationStage;
  communication_state: CommunicationState;
  source: ApplicationSource;
  source_details?: string;
  job_url?: string;
  contact_name?: string;
  contact_channel?: string;
  notes?: string;
  // Optional initial interaction
  include_initial_interaction?: boolean;
  initial_interaction_type?: InteractionType;
  initial_interaction_summary?: string;
  // Optional next action
  include_next_action?: boolean;
  next_action_title?: string;
  next_action_type?: ActionType;
  next_action_due_date?: string;
}

export interface ActionFilter {
  status?: ActionStatus;
  dueCategory?: "all" | "due_overdue" | "upcoming";
}

export interface ApplicationFilter {
  searchQuery?: string;
  stage?: ApplicationStage | "All";
  communicationState?: CommunicationState | "All";
}
