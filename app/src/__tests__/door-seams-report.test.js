// @vitest-environment node
// =============================================================================
// The door reports itself on EVERY seam, not just the order form (DR-0377 → 0397)
// =============================================================================
// DR-0377 made the order form file its own fault, and named the open half: the
// same door's other RPC seams — classes, messages, showcase — still failed
// quietly. Sterling's order proved what a silent seam costs: months of loss the
// office only learned of by a customer's kindness. This widens the instrument to
// the whole door through ONE guard (`reportIfFailed`), so a new seam is covered
// by wrapping and a gate holds every seam to it — the "one registry, not two"
// discipline (0216 / DR-0376), machinery over memory (DR-0239).
//
// PROVEN-TO-CATCH: a failed seam must file a system fault. Remove the filing from
// the guard and the first test fails; drop the wrap from a seam and the source-
// gate count falls below three.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rpcCalls = [];
vi.mock('../lib/supabase.js', () => ({
  default: { rpc: async (name, args) => { rpcCalls.push({ name, args }); return { data: 'fault-id', error: null }; } },
}));

const { reportIfFailed } = await import('../lib/door-feedback-sync.js');
const flush = () => new Promise((r) => setTimeout(r, 0));
beforeEach(() => { rpcCalls.length = 0; });

describe('reportIfFailed — a failed door seam files itself', () => {
  it('files a system fault on ok:false, naming the seam and the real reason', async () => {
    reportIfFailed('moore-divahs', 'moore-divahs', 'gallery', 'The gallery', {
      ok: false, pieces: [], error: { message: 'permission denied for moore_showcase' },
    });
    await flush();
    const fault = rpcCalls.find((c) => c.name === 'door_fault_report');
    expect(fault, 'a failed seam must file a door_fault_report').toBeTruthy();
    expect(fault.args.p_payload.area).toBe('gallery');
    expect(fault.args.p_payload.body).toMatch(/The gallery is failing for customers/);
    expect(fault.args.p_payload.body).toMatch(/permission denied for moore_showcase/);
  });

  it('files NOTHING on a successful result (ok:true)', async () => {
    reportIfFailed('moore-divahs', 'moore-divahs', 'messages', 'The message thread', { ok: true, rows: [] });
    await flush();
    expect(rpcCalls.find((c) => c.name === 'door_fault_report')).toBeFalsy();
  });

  it('passes the result through unchanged — never swallows the caller\'s data', () => {
    const r = { ok: false, pieces: [], error: { message: 'x' } };
    expect(reportIfFailed('a', 'b', 'gallery', 'The gallery', r)).toBe(r);
  });

  it('is inert on a null/absent result — never turns one break into two', async () => {
    expect(() => reportIfFailed('a', 'b', 'other', 'x', null)).not.toThrow();
    await flush();
    expect(rpcCalls.find((c) => c.name === 'door_fault_report')).toBeFalsy();
  });
});

// Source-gate: every customer-facing RPC seam on the door is wrapped, so a future
// edit cannot silently drop the instrumentation DR-0377 opened.
describe('MooreDoor — every customer-facing RPC seam routes through the guard', () => {
  const HERE = dirname(fileURLToPath(import.meta.url));
  const src = readFileSync(join(HERE, '..', 'components', 'MooreDoor.jsx'), 'utf8');

  it('the order form still self-reports (DR-0377, unchanged)', () => {
    expect(src).toMatch(/reportDoorFault\(BIZ\.slug, BIZ\.instanceSlug, \{/);
  });

  it('messages (load + send) and the gallery each wrap their result', () => {
    expect((src.match(/reportIfFailed\(/g) || []).length).toBeGreaterThanOrEqual(3);
    // the guard wraps a REAL seam call, not nothing
    expect(src).toMatch(/fetchMessages\(BIZ\.instanceSlug\)/);
    expect(src).toMatch(/sendMessage\(BIZ\.instanceSlug/);
    expect(src).toMatch(/fetchShowcase\(BIZ\.instanceSlug\)/);
  });
});
