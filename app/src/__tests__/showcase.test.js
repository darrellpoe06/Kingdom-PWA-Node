// @vitest-environment node
// showcase (0092) — pinned: steward-only writes, anon read via the definer
// only, and the "whatever makes sense" sort (pinned favorites first, newest
// next) that survives local pin toggles.
import { vi, describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

vi.mock('../lib/supabase.js', () => ({
  default: {
    rpc: vi.fn(async () => ({ data: [], error: null })),
    storage: { from: vi.fn(() => ({ getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://cdn/x.jpg' } })), upload: vi.fn(async () => ({ error: null })) })) },
  },
}));
import { sortPieces, showcaseImageUrl } from '../lib/showcase.js';

const sql = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../infra/supabase/migrations-auto/0092-moore-showcase.sql'), 'utf8');

describe('the 0092 contract', () => {
  it('every write RPC checks steward membership; delete is owner/admin only', () => {
    expect((sql.match(/NOT IN \('owner','admin','member'\) THEN RAISE EXCEPTION 'not a steward/g) || []).length).toBe(2);
    expect(sql).toMatch(/delete_showcase_piece[\s\S]*?NOT IN \('owner','admin'\) THEN RAISE EXCEPTION 'owner\/admin only'/);
  });
  it('anon reads ONLY through the definer; write RPCs are revoked from anon', () => {
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.moore_showcase\(text\) TO anon/);
    expect(sql).toMatch(/REVOKE EXECUTE ON FUNCTION public\.add_showcase_piece[\s\S]*?FROM anon/);
    expect(sql).not.toMatch(/GRANT[^;]*ON showcase_pieces TO anon/);
    // no direct-table write policies exist — RPCs are the only write path
    expect(sql).not.toMatch(/CREATE POLICY[^;]*FOR (INSERT|UPDATE|DELETE)[\s\S]{0,80}ON showcase_pieces/);
  });
  it('seeds never reach the public gallery; pinned-first order is server-side too', () => {
    expect(sql).toMatch(/s\.seed IS NOT TRUE/);
    expect(sql).toMatch(/ORDER BY s\.pinned DESC, s\.created_at DESC/);
  });
});

describe('sortPieces — pinned favorites first, then newest', () => {
  it('sorts the gallery the way that makes sense', () => {
    const out = sortPieces([
      { slug: 'old', created_at: '2026-06-01', pinned: false },
      { slug: 'fav', created_at: '2026-05-01', pinned: true },
      { slug: 'new', created_at: '2026-07-01', pinned: false },
    ]);
    expect(out.map((p) => p.slug)).toEqual(['fav', 'new', 'old']);
  });
  it('empty stays empty', () => { expect(sortPieces([])).toEqual([]); });
});

describe('showcaseImageUrl', () => {
  it('passes through absolute urls and resolves storage paths', () => {
    expect(showcaseImageUrl('https://x/y.jpg')).toBe('https://x/y.jpg');
    expect(showcaseImageUrl('moore-divahs/sp-1.jpg')).toBe('https://cdn/x.jpg');
    expect(showcaseImageUrl('')).toBeNull();
  });
});
