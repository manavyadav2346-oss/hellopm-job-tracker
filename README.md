# Job Tracker — HelloPM Buildathon MVP

A calm, focused web MVP built to help active job seekers keep **application information**, **latest interactions**, and **their own next actions** unified in one place.

---

## Research Context & Scope

Discovery conversations with four active job seekers highlighted two core frustrations:
1. **Prolonged employer silence:** Applicants frequently felt uncertain about their status and wondered if lack of response meant rejection.
2. **Scattered records across channels:** Applications made through referrals, job boards, and direct recruiter messages quickly fell out of sync without dated updates and clear next steps.

> **Validation Note:**  
> This MVP is an initial exploration based on four discovery conversations and is **not yet validated**.  
> The product cannot discover hidden hiring statuses or compel recruiters to respond. Instead, it empowers applicants to stay in control of their own process.

**Out of scope for this MVP:** Inbox syncing, browser extensions, automated outreach, recruiter discovery, AI resume generation, or hiring probability predictions.

---

## Key Product Rules

- **Independent Application Stages & Actions:** Completing a task (e.g. sending a note) does not artificially change the application stage. Advancing a stage does not prematurely check off pending tasks.
- **"No update received" Is Not Rejection:** Communication state is distinct from application stage. Silence is represented neutrally as `"No update received"` and is never inferred as rejection.
- **User-Confirmed Deadlines:** No universal follow-up interval is forced. Applicants choose their own dates and actions.
- **Recruiter Follow-up Validation Guardrail:** Setting a *"Recruiter follow-up"* action strictly requires a contact person or communication channel. If missing, the app prompts you to add one or choose a different action (e.g. check portal, prepare materials).
- **Task History Retention:** Completing a task preserves full history with completion timestamps and outcome notes.
- **Closed Application Cleanliness:** Closing an application removes its pending tasks from the *"Needs attention"* dashboard while preserving the entire historical log.
- **Local Timezone Consistency:** Deadlines are date-only (`YYYY-MM-DD`) and evaluated in the user's local timezone to prevent UTC midnight date-shifting bugs.

---

## Quick Start (Sample Preview Mode)

The application includes an **isolated Sample Preview mode** pre-populated with realistic fictional data. You can launch and test the full MVP immediately on your local machine without creating a Supabase account or configuring environment variables:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the local development server:**
   ```bash
   npm run dev
   ```

3. **Open the app in your browser:**
   ```
   http://localhost:3000
   ```
   The app will load in **Sample Preview Mode** with an informative banner. You can:
   - Browse due and overdue actions on **Needs attention**.
   - Complete or reschedule an action.
   - Search and filter applications on **Applications**.
   - Add a new application with optional progressive disclosure.
   - View dated interaction histories and log updates.
   - Reset the fictional preview data at any time via the top banner.

---

## Connecting Supabase (Cloud Persistence & Auth)

To switch from Sample Preview mode to persistent user accounts with strict Row-Level Security:

### Step 1: Create a Supabase Project
1. Sign up for free at [supabase.com](https://supabase.com) and create a new project.

### Step 2: Run the Database Migration
1. In your Supabase dashboard, navigate to the **SQL Editor**.
2. Open the file `supabase/migrations/0001_initial_schema.sql` from this repository.
3. Paste the contents into the SQL Editor and click **Run**.  
   *This creates the `applications`, `interactions`, and `next_actions` tables and enables Row-Level Security (RLS) policies enforcing ownership by `auth.uid()`.*

### Step 3: Configure Environment Variables
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. In Supabase, go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Paste these values into `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
4. Restart your development server (`npm run dev`).
5. Navigate to `/auth` to register your account. Real accounts start completely empty and persist securely in the cloud.

---

## Automated Checks & Verification

A suite of 20 automated tests covers the core rules, user isolation, and data operations:

```bash
# Run unit and integration tests
npm test

# Run Next.js production build check
npm run build
```

### Checks Implemented:
- **`tests/dates.test.ts` (7 checks):** Date-only deadline formatting, local timezone parsing without UTC midnight shift, relative day calculations, overdue/today/upcoming categorization.
- **`tests/product-rules.test.ts` (5 checks):** Separation of application stage from task completion, task removal on application close, history retention on task completion, reschedule count incrementing, "No update received" separation from rejection.
- **`tests/isolation-and-rls.test.ts` (3 checks):** Multi-user isolation logic, verified SQL Row-Level Security policies on all 3 tables with cascade constraints, sample preview isolation to fictional user ID.
- **`tests/crud-and-persistence.test.ts` (5 checks):** Core journey verification (Add application → record interaction & action → see due action → complete action → return to saved record), creation with required and custom sources, updating records, deleting records.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5 (Strict Mode)
- **Styling:** Tailwind CSS (Warm stone `#FAF9F5` surface with restrained indigo accent)
- **Database & Auth:** Supabase PostgreSQL with Row-Level Security (RLS)
- **Testing:** Vitest
- **Icons:** Lucide React
