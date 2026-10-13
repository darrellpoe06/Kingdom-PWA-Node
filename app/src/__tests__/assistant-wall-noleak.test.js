// Assistant wall — the 1099 assistant is walled out of the core books at the DB
// (Darrell 2026-07-13: "never our personal data, business data etc."). The proof
// is structural + deterministic, the repo's accepted RLS standard (same shape as
// conference-rls-noleak): the guard reads migration 0100 and proves the assistant
// role is excluded from the books' read AND write policies. Run here inside the
// required `app — lint + vitest` check so it gates every merge. DR-0076 (prove it)
// + DR-0074 (a client gate is not a data gate) + DR-0060 (proven-to-catch).
import { describe, it, expect } from 'vitest';
import { scanAssistantWall, BOOKS_TABLES } from '../../../scripts/assistant-wall-guard.mjs';

const RLS_ENABLE = BOOKS_TABLES.map((t) => `ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY;`).join('\n');
const ROLE_CHECK = `ALTER TABLE instance_members ADD CONSTRAINT instance_members_role_check CHECK (
  role IN ('owner','admin','member','viewer','specialist','child','successor','assistant'));`;

// A correct wall over every books table (the shape 0100 ships).
function goodWall() {
  const perTable = BOOKS_TABLES.map((t) => `
    CREATE POLICY ${t}_member_read ON ${t} FOR SELECT TO authenticated
      USING (user_role_in_instance(instance_id) NOT IN ('child','assistant'));
    CREATE POLICY ${t}_member_insert ON ${t} FOR INSERT TO authenticated
      WITH CHECK (user_role_in_instance(instance_id) NOT IN ('child','successor','assistant') AND created_by = auth.uid());
    CREATE POLICY ${t}_member_update ON ${t} FOR UPDATE TO authenticated
      USING (user_role_in_instance(instance_id) NOT IN ('child','successor','assistant'));`).join('\n');
  return `${ROLE_CHECK}\n${RLS_ENABLE}\n${perTable}`;
}

describe('assistant wall — the assistant is walled out of the core books (migration 0100)', () => {
  it('PASSES on the real migration 0100 as shipped', () => {
    const { ok, problems } = scanAssistantWall();
    expect(ok, problems.join('; ')).toBe(true);
  });

  it('PASSES the correct wall shape (not just always-failing)', () => {
    const { ok, problems } = scanAssistantWall(goodWall());
    expect(ok, problems.join('; ')).toBe(true);
  });

  // --- Proven-to-catch (DR-0060): the guard must FAIL the real leak shapes. ---

  it("CATCHES a READ policy that forgets 'assistant' (assistant would read the books)", () => {
    // remove the read wall from EVERY table (the 0082 form: excludes child only)
    const leak = goodWall().replaceAll("NOT IN ('child','assistant')", "<> 'child'");
    const { ok, problems } = scanAssistantWall(leak);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/READ policy does not wall out the assistant/i);
  });

  it("CATCHES a WRITE policy that forgets 'assistant' (assistant could write the books)", () => {
    const leak = goodWall().replaceAll("NOT IN ('child','successor','assistant')", "NOT IN ('child','successor')");
    const { ok, problems } = scanAssistantWall(leak);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/WRITE policies do not wall out the assistant/i);
  });

  it('CATCHES membership-only gating (the 0082 child gap — a member assistant slips in)', () => {
    const leak = BOOKS_TABLES.map((t) => `
      CREATE POLICY ${t}_member_read ON ${t} FOR SELECT USING (user_in_instance(instance_id));
      CREATE POLICY ${t}_member_insert ON ${t} FOR INSERT WITH CHECK (user_in_instance(instance_id));
      CREATE POLICY ${t}_member_update ON ${t} FOR UPDATE USING (user_in_instance(instance_id));`).join('\n');
    const { ok, problems } = scanAssistantWall(`${ROLE_CHECK}\n${leak}`);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/role-gated|wall out the assistant/i);
  });

  it("CATCHES the 'assistant' role never being added to the membership check", () => {
    const leak = goodWall().replace(/,'assistant'\)\);/, '));'); // drop it from the enum
    const { ok, problems } = scanAssistantWall(leak);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/role is not added to the instance_members role check/i);
  });
});
