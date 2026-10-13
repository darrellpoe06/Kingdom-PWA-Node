// @vitest-environment node
// business-messages (0091) — pinned: the migration contract (forced sender,
// own-thread-only writes, no anon, append-only) and the pure thread grouping.
import { vi, describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

vi.mock('../lib/supabase.js', () => ({
  default: { rpc: vi.fn(async () => ({ data: [], error: null })) },
}));
import { groupThreads } from '../lib/business-messages.js';

const sql = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../infra/supabase/migrations-auto/0091-business-messages.sql'), 'utf8');

describe('the 0091 contract', () => {
  it('sender is FORCED server-side on both write paths — never client-claimed', () => {
    expect(sql).toMatch(/VALUES \(v_inst, p_customer, 'steward', auth\.uid\(\)/);
    expect(sql).toMatch(/VALUES \(v_inst, auth\.uid\(\), 'customer', auth\.uid\(\)/);
  });
  it('a customer writes only their own thread, whatever they passed', () => {
    expect(sql).toContain("-- A customer writes only their OWN thread, whatever they passed.");
    expect(sql).toMatch(/business_messages_insert_own[\s\S]*?customer_user_id = auth\.uid\(\)/);
  });
  it('anon can never execute or read; the thread is append-only', () => {
    expect(sql).toMatch(/REVOKE EXECUTE ON FUNCTION public\.fetch_business_messages[\s\S]*?FROM anon/);
    expect(sql).toMatch(/REVOKE EXECUTE ON FUNCTION public\.send_business_message[\s\S]*?FROM anon/);
    expect(sql).not.toMatch(/GRANT[^;]*UPDATE[^;]*ON business_messages/);
    expect(sql).not.toMatch(/GRANT[^;]*DELETE[^;]*ON business_messages/);
    expect(sql).not.toMatch(/CREATE POLICY[^;]*FOR (UPDATE|DELETE)[^;]*ON business_messages/);
  });
});

describe('groupThreads — the steward inbox math', () => {
  const M = (cust, sender, at, body = 'x') => ({ customer_user_id: cust, sender, created_at: at, body });
  it('one thread per customer, newest activity first, unanswered flagged', () => {
    const threads = groupThreads([
      M('cust-a', 'customer', '2026-07-07T10:00:00Z'),
      M('cust-b', 'customer', '2026-07-07T12:00:00Z'),
      M('cust-a', 'steward', '2026-07-07T11:00:00Z'),
    ]);
    expect(threads.length).toBe(2);
    expect(threads[0].customerUserId).toBe('cust-b');       // newest first
    expect(threads[0].unansweredFromCustomer).toBe(true);   // waiting on Shay
    expect(threads[1].unansweredFromCustomer).toBe(false);  // she replied
    expect(threads[1].messages.map((m) => m.sender)).toEqual(['customer', 'steward']);
  });
  it('empty input = empty threads, never painted', () => {
    expect(groupThreads([])).toEqual([]);
    expect(groupThreads(null)).toEqual([]);
  });
});
