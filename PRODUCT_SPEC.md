# Job Tracker — Product Specification & Screen Flow

**Working Name:** Job Tracker  
**Buildathon:** HelloPM Buildathon MVP  
**Role / Viewpoint:** Senior Product Engineer & UX Designer  

---

## 1. Problem Statement & Research Context

Four initial discovery conversations with active job seekers surfaced two primary points of friction:
1. **Uncertainty around employer communication:** Applicants struggle to track what stage an application is in, frequently conflating prolonged silence with rejection.
2. **Scattered, incomplete records across channels:** Applications submitted via referral, company portals, direct outreach, and third-party boards quickly lose context without dated interaction logs and next actions.

> **Research Validation Note:**  
> This product is an MVP based on initial discovery interviews; it is **not yet validated at scale**. Job Tracker cannot discover hidden hiring statuses or compel recruiters to respond, but it provides a calm, centralized control center for applicants to track what *they* control: their records, interactions, and next actions.

---

## 2. Product Rules & Principles

1. **Application Stage vs. Task Completion Are Separate:**  
   Completing an action (e.g. *"Send thank-you email"*) does not artificially mutate the application stage (*"Interviewing"*). Conversely, progressing an application to a new stage does not prematurely check off pending commitments.
2. **"No Update Received" Is Not Rejection:**  
   Prolonged silence is represented neutrally as `"No update received"` under communication states, distinct from application stages. The system never infers or guesses rejection based on time.
3. **User-Governed Action Scheduling:**  
   The application intentionally avoids rigid automated universal follow-up algorithms (e.g. "always email every 3 days"). Applicants choose and confirm their own actions and deadlines.
4. **Recruiter Follow-up Validation Guardrail:**  
   Setting an action of type *"Recruiter follow-up"* strictly requires a contact person or communication channel. If neither exists, the interface gently prompts the user to add contact info or select an alternate action (such as checking the portal or reviewing notes) or save with no action.
5. **Task Completion Retains History:**  
   Completing a task records completion timestamps and optional outcome reflections, preserving the full historical audit trail in both the task list and the dated interaction timeline.
6. **Closing an Application Cleans Attention View While Preserving History:**  
   When an application is closed (e.g. Withdrawn, Rejected, Offer Accepted), all pending actions for that application are removed from the *"Needs attention"* dashboard, but all records and past interactions remain permanently accessible.
7. **Timezone-Consistent Date Deadlines:**  
   Date-only deadlines are handled without UTC midnight shift bugs. Comparisons occur strictly in the user's local timezone.

---

## 3. Core Screen Flows

### View 1: Needs Attention (`/`)
- **Primary Goal:** Surface immediate commitments so nothing slips through the cracks.
- **Components:**
  - **Due & Overdue Actions Section:** Lists pending actions with due dates earlier than or equal to today in the applicant's local timezone.
  - **Upcoming Actions Section:** Chronological list of future scheduled actions.
  - **Quick Card Actions:** Direct *"Complete"* and *"Reschedule"* buttons on each action card, plus a *"View"* link returning directly to the application record.
  - **Empty State:** Calm confirmation when all tasks are up to date, with a prominent *"Add application"* primary button.

### View 2: Applications (`/applications`)
- **Primary Goal:** High-level registry across all application channels.
- **Components:**
  - **Search Bar:** Real-time search across company names and role titles.
  - **Stage Filter:** Filter between All, Applied, Screening, Interviewing, Offer, Draft, and Closed.
  - **Communication State Filter:** Filter between All, "No update received", "Awaiting reply", "Update received", and "Discussion ongoing".
  - **Application Cards:** Shows company, role, stage badge, neutral communication badge, source, applied date, and active next action pill.
  - **Card Actions:** Open record, Edit details, Delete application.

### View 3: Application Details (`/applications/[id]`)
- **Primary Goal:** Complete historical context for a single employer relationship.
- **Components:**
  - **Header:** Company, role, stage, communication state, applied date, recruiter/channel, job posting link, application notes.
  - **Primary Action:** Prominent *"Log update"* button to append dated interactions.
  - **Secondary Actions:** *"Edit"*, *"Close application"* (prompts for reason and archives pending tasks), *"Delete"*.
  - **Current Next Action Card:** Displays active task with due date, reschedule count, Complete button, Reschedule button, or *"Set next action"* modal.
  - **Dated Interaction Timeline:** Chronological timeline of emails, calls, notes, interviews, and completed actions with relative dates.
  - **Completed Actions History:** Preserved log of past finished tasks.

### View 4: Add / Edit Application Form (`/applications/new` & `/applications/[id]/edit`)
- **Primary Goal:** Low-friction data entry with progressive disclosure.
- **Components:**
  - **Core Required Fields:** Company, Role, Application Date, Stage, Communication State, Source.
  - **Source with "Other":** Selecting "Other" reveals a specific custom source input.
  - **Progressive Disclosure 1:** Contact person, contact channel, job URL, notes.
  - **Progressive Disclosure 2:** Optional immediate next action with type and date (requires date only when an action is entered; enforces contact requirement for recruiter follow-up).

### View 5: Account & Setup (`/auth`)
- **Primary Goal:** Clear isolation between Sample Preview mode and persistent Supabase Cloud persistence.
- **Components:**
  - **Sample Preview Toggle:** Explains that preview mode operates with fictional data in memory and allows immediate exploration without cloud configuration.
  - **Supabase Authentication:** Email and password sign-in / sign-up.
  - **Step-by-step Setup Guide:** Instructions to run `0001_initial_schema.sql` and provide `.env.local` keys.

---

## 4. Technical Architecture

- **Framework:** Next.js 14 App Router, TypeScript, React 18, Tailwind CSS.
- **Styling & Aesthetics:** Warm off-white canvas (`#FAF9F5`), readable dark text (`stone-900`), restrained indigo accents (`indigo-600`), subtle borders (`stone-200`).
- **Database & Auth:** Supabase PostgreSQL with strict Row-Level Security (RLS) on `applications`, `interactions`, and `next_actions`.
- **Sample Preview Layer:** Isolated in-memory store pre-populated with realistic fictional job seeker data, completely detached from production user databases.
