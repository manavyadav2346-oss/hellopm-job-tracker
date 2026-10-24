import { describe, it, expect, beforeEach } from "vitest";
import { previewStore } from "../src/lib/preview-store";
import { SAMPLE_USER_ID } from "../src/lib/sample-data";
import fs from "fs";
import path from "path";

/**
 * Security & RLS Test Suite
 *
 * NOTE ON TEST METHODOLOGY:
 * 1. [Static Schema Checks]: Verify that the SQL migration file contains the required
 *    Row-Level Security (RLS) clauses, ownership constraints, and strengthened WITH CHECK
 *    policies preventing foreign key reassignment across tenants.
 * 2. [Simulated RLS Authorization Checks]: Pure unit tests evaluating the exact logic of
 *    Supabase RLS policies (USING and WITH CHECK) against multi-tenant attack vectors.
 * 3. [Live Database Tests Note]: Live tests against a real PostgreSQL instance require
 *    an active Supabase cloud connection with NEXT_PUBLIC_SUPABASE_URL and service credentials.
 */

describe("User Isolation & Supabase RLS Schema Verification", () => {
  beforeEach(() => {
    previewStore.reset();
  });

  // ---------------------------------------------------------------------------
  // 1. Static Schema Checks (SQL DDL Inspection)
  // ---------------------------------------------------------------------------
  describe("[Static Schema Checks] Migration SQL DDL & Policy Inspection", () => {
    const sqlPath = path.join(
      process.cwd(),
      "supabase",
      "migrations",
      "0001_initial_schema.sql"
    );

    it("verifies migration SQL exists and enables RLS on all 3 tables", () => {
      expect(fs.existsSync(sqlPath)).toBe(true);
      const sql = fs.readFileSync(sqlPath, "utf-8");

      expect(sql).toContain("alter table public.applications enable row level security;");
      expect(sql).toContain("alter table public.interactions enable row level security;");
      expect(sql).toContain("alter table public.next_actions enable row level security;");
    });

    it("verifies applications table has CRUD policies checking auth.uid() = user_id", () => {
      const sql = fs.readFileSync(sqlPath, "utf-8");

      expect(sql).toContain('create policy "Users can view their own applications"');
      expect(sql).toContain('create policy "Users can insert their own applications"');
      expect(sql).toContain('create policy "Users can update their own applications"');
      expect(sql).toContain('create policy "Users can delete their own applications"');
    });

    it("verifies interactions table UPDATE policy has strengthened WITH CHECK protecting application_id reassignment", () => {
      const sql = fs.readFileSync(sqlPath, "utf-8");

      // Extract the update policy block for interactions
      const blockMatch = sql.match(
        /create policy "Users can update their own interactions"[\s\S]*?;/
      );
      expect(blockMatch).not.toBeNull();
      const policyBlock = blockMatch![0];

      // Check USING clause
      expect(policyBlock).toMatch(/using\s*\(\s*auth\.uid\(\)\s*=\s*user_id\s*\)/);

      // Check strengthened WITH CHECK clause
      expect(policyBlock).toContain("with check (");
      expect(policyBlock).toContain("auth.uid() = user_id");
      expect(policyBlock).toContain("exists (");
      expect(policyBlock).toContain("select 1 from public.applications a");
      expect(policyBlock).toContain("where a.id = application_id and a.user_id = auth.uid()");
    });

    it("verifies next_actions table UPDATE policy has strengthened WITH CHECK protecting application_id reassignment", () => {
      const sql = fs.readFileSync(sqlPath, "utf-8");

      // Extract the update policy block for next_actions
      const blockMatch = sql.match(
        /create policy "Users can update their own next actions"[\s\S]*?;/
      );
      expect(blockMatch).not.toBeNull();
      const policyBlock = blockMatch![0];

      // Check USING clause
      expect(policyBlock).toMatch(/using\s*\(\s*auth\.uid\(\)\s*=\s*user_id\s*\)/);

      // Check strengthened WITH CHECK clause
      expect(policyBlock).toContain("with check (");
      expect(policyBlock).toContain("auth.uid() = user_id");
      expect(policyBlock).toContain("exists (");
      expect(policyBlock).toContain("select 1 from public.applications a");
      expect(policyBlock).toContain("where a.id = application_id and a.user_id = auth.uid()");
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Simulated RLS Authorization Checks (Reassignment Attack Vector Tests)
  // ---------------------------------------------------------------------------
  describe("[Simulated RLS Policy Checks] Anti-Reassignment & Cross-Tenant Protection", () => {
    const userA_Id = "11111111-1111-1111-1111-111111111111";
    const userB_Id = "22222222-2222-2222-2222-222222222222";

    interface ApplicationRow {
      id: string;
      user_id: string;
      company: string;
      role: string;
    }

    interface InteractionRow {
      id: string;
      application_id: string;
      user_id: string;
      summary: string;
    }

    interface NextActionRow {
      id: string;
      application_id: string;
      user_id: string;
      title: string;
      due_date: string;
    }

    // Mock relational state
    let applications: ApplicationRow[];
    let interactions: InteractionRow[];
    let nextActions: NextActionRow[];

    beforeEach(() => {
      applications = [
        { id: "app-A1", user_id: userA_Id, company: "Company A", role: "Frontend Dev" },
        { id: "app-B1", user_id: userB_Id, company: "Company B", role: "Backend Dev" },
      ];

      interactions = [
        {
          id: "int-A1",
          application_id: "app-A1",
          user_id: userA_Id,
          summary: "Initial call with User A",
        },
      ];

      nextActions = [
        {
          id: "act-A1",
          application_id: "app-A1",
          user_id: userA_Id,
          title: "Follow up with User A recruiter",
          due_date: "2026-10-30",
        },
      ];
    });

    /**
     * Exact evaluation of PostgreSQL RLS UPDATE policy:
     * USING: determines which existing rows the user can see/target
     * WITH CHECK: validates that the row resulting from UPDATE conforms to policy
     */
    function evaluateUpdatePolicy<T extends { user_id: string; application_id: string }>(
      authUid: string,
      existingRow: T,
      proposedRow: T
    ): { allowed: boolean; reason?: string } {
      // 1. USING (auth.uid() = user_id)
      const usingPassed = authUid === existingRow.user_id;
      if (!usingPassed) {
        return { allowed: false, reason: "USING check failed: Target record not owned by current user" };
      }

      // 2. WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM applications WHERE id = application_id AND user_id = auth.uid()))
      const withCheckUidPassed = authUid === proposedRow.user_id;
      if (!withCheckUidPassed) {
        return { allowed: false, reason: "WITH CHECK failed: Cannot reassign record user_id" };
      }

      const parentAppExistsAndOwned = applications.some(
        (app) => app.id === proposedRow.application_id && app.user_id === authUid
      );

      if (!parentAppExistsAndOwned) {
        return {
          allowed: false,
          reason: "WITH CHECK failed: Target application does not exist or belongs to another user",
        };
      }

      return { allowed: true };
    }

    it("rejects attempt by User A to reassign an interaction to User B's application", () => {
      const existing = interactions.find((i) => i.id === "int-A1")!;

      // Attacker payload: User A tries to move int-A1 onto app-B1 (User B's application)
      const proposedPayload = {
        ...existing,
        application_id: "app-B1", // Malicious reassignment
      };

      const result = evaluateUpdatePolicy(userA_Id, existing, proposedPayload);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Target application does not exist or belongs to another user");
    });

    it("rejects attempt by User A to reassign a next action to User B's application", () => {
      const existing = nextActions.find((a) => a.id === "act-A1")!;

      // Attacker payload: User A tries to move act-A1 onto app-B1 (User B's application)
      const proposedPayload = {
        ...existing,
        application_id: "app-B1", // Malicious reassignment
      };

      const result = evaluateUpdatePolicy(userA_Id, existing, proposedPayload);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Target application does not exist or belongs to another user");
    });

    it("rejects attempt by User A to reassign an interaction's user_id to User B", () => {
      const existing = interactions.find((i) => i.id === "int-A1")!;

      const proposedPayload = {
        ...existing,
        user_id: userB_Id, // Malicious user reassignment
      };

      const result = evaluateUpdatePolicy(userA_Id, existing, proposedPayload);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Cannot reassign record user_id");
    });

    it("permits legitimate updates by User A on their own interaction and application", () => {
      const existing = interactions.find((i) => i.id === "int-A1")!;

      const proposedPayload = {
        ...existing,
        summary: "Updated notes after recruiter email",
      };

      const result = evaluateUpdatePolicy(userA_Id, existing, proposedPayload);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("permits legitimate updates by User A on their own next action (e.g. rescheduling)", () => {
      const existing = nextActions.find((a) => a.id === "act-A1")!;

      const proposedPayload = {
        ...existing,
        due_date: "2026-11-05", // Rescheduled
        title: "Rescheduled follow up",
      };

      const result = evaluateUpdatePolicy(userA_Id, existing, proposedPayload);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Fictional Preview Isolation Checks
  // ---------------------------------------------------------------------------
  describe("[Preview Isolation Checks]", () => {
    it("sample preview is isolated with designated fictional user id", () => {
      const apps = previewStore.getApplications();
      expect(apps.length).toBeGreaterThan(0);
      apps.forEach((app) => {
        expect(app.user_id).toBe(SAMPLE_USER_ID);
      });
    });
  });
});
