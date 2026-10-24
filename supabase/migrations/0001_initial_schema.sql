-- Schema for Job Tracker (HelloPM Buildathon)
-- Enables strict Row-Level Security (RLS) across all tables

-- 1. Applications table
create table if not exists public.applications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    company text not null,
    role text not null,
    application_date date not null,
    stage text not null check (stage in ('Draft', 'Applied', 'Screening', 'Interviewing', 'Offer', 'Closed')),
    closed_reason text check (closed_reason in ('Rejected', 'Withdrawn', 'Offer Accepted', 'Offer Declined', 'Position Cancelled', 'Other') or closed_reason is null),
    communication_state text not null default 'No update received' check (communication_state in ('No update received', 'Awaiting reply', 'Update received', 'Discussion ongoing')),
    source text not null default 'Other' check (source in ('LinkedIn', 'Company Website', 'Referral', 'Job Board', 'Recruiter Outreach', 'Other')),
    source_details text,
    job_url text,
    contact_name text,
    contact_channel text,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Index for fast user queries and status filtering
create index if not exists idx_applications_user_id on public.applications(user_id);
create index if not exists idx_applications_stage on public.applications(stage);
create index if not exists idx_applications_company_role on public.applications(user_id, company, role);

-- Enable RLS for applications
alter table public.applications enable row level security;

create policy "Users can view their own applications"
    on public.applications for select
    using (auth.uid() = user_id);

create policy "Users can insert their own applications"
    on public.applications for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own applications"
    on public.applications for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own applications"
    on public.applications for delete
    using (auth.uid() = user_id);


-- 2. Interactions table (Dated chronological history)
create table if not exists public.interactions (
    id uuid primary key default gen_random_uuid(),
    application_id uuid not null references public.applications(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    interaction_date date not null,
    type text not null check (type in ('Application Submitted', 'Email Received', 'Email Sent', 'Recruiter Call', 'Technical Interview', 'Behavioral Interview', 'Take-home Assessment', 'Offer Discussion', 'Status Check', 'Note / Update', 'Action Completed')),
    summary text not null,
    details text,
    created_at timestamptz not null default now()
);

-- Index for querying interactions by application
create index if not exists idx_interactions_application_id on public.interactions(application_id);
create index if not exists idx_interactions_user_id on public.interactions(user_id);

-- Enable RLS for interactions
alter table public.interactions enable row level security;

create policy "Users can view their own interactions"
    on public.interactions for select
    using (auth.uid() = user_id);

create policy "Users can insert their own interactions"
    on public.interactions for insert
    with check (
        auth.uid() = user_id and
        exists (
            select 1 from public.applications a
            where a.id = application_id and a.user_id = auth.uid()
        )
    );

create policy "Users can update their own interactions"
    on public.interactions for update
    using (auth.uid() = user_id)
    with check (
        auth.uid() = user_id and
        exists (
            select 1 from public.applications a
            where a.id = application_id and a.user_id = auth.uid()
        )
    );

create policy "Users can delete their own interactions"
    on public.interactions for delete
    using (auth.uid() = user_id);


-- 3. Next Actions table (Tasks / Reminders)
create table if not exists public.next_actions (
    id uuid primary key default gen_random_uuid(),
    application_id uuid not null references public.applications(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    action_type text not null check (action_type in ('recruiter_follow_up', 'check_portal', 'prepare_materials', 'send_update', 'custom')),
    due_date date not null,
    status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
    completed_at timestamptz,
    rescheduled_count integer not null default 0,
    last_rescheduled_at timestamptz,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Index for quick lookups of pending actions and due dates
create index if not exists idx_next_actions_user_status_due on public.next_actions(user_id, status, due_date);
create index if not exists idx_next_actions_application_id on public.next_actions(application_id);

-- Enable RLS for next actions
alter table public.next_actions enable row level security;

create policy "Users can view their own next actions"
    on public.next_actions for select
    using (auth.uid() = user_id);

create policy "Users can insert their own next actions"
    on public.next_actions for insert
    with check (
        auth.uid() = user_id and
        exists (
            select 1 from public.applications a
            where a.id = application_id and a.user_id = auth.uid()
        )
    );

create policy "Users can update their own next actions"
    on public.next_actions for update
    using (auth.uid() = user_id)
    with check (
        auth.uid() = user_id and
        exists (
            select 1 from public.applications a
            where a.id = application_id and a.user_id = auth.uid()
        )
    );

create policy "Users can delete their own next actions"
    on public.next_actions for delete
    using (auth.uid() = user_id);

-- Optional updated_at trigger helper
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger handle_applications_updated_at
    before update on public.applications
    for each row execute function public.handle_updated_at();

create trigger handle_next_actions_updated_at
    before update on public.next_actions
    for each row execute function public.handle_updated_at();
