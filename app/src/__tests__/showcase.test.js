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
import { sortPieces, showcaseImageUrl, updatePiece, priceInputToCents } from '../lib/showcase.js';
import supabase from '../lib/supabase.js';

const sql = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../infra/supabase/migrations-auto/0092-moore-showcase.sql'), 'utf8');
const sql94 = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../infra/supabase/migrations-auto/0094-showcase-prices-and-edit.sql'), 'utf8');

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

describe('the 0094 contract — prices + edit-in-place (Shay 2026-07-08)', () => {
  it('the public read now carries price_cents; edits stay steward-gated, never anon', () => {
    expect(sql94).toMatch(/RETURNS TABLE \([^)]*price_cents integer[^)]*\)/);
    expect(sql94).toMatch(/update_showcase_piece[\s\S]*?NOT IN \('owner','admin','member'\) THEN RAISE EXCEPTION 'not a steward/);
    expect(sql94).toMatch(/REVOKE EXECUTE ON FUNCTION public\.update_showcase_piece[\s\S]*?FROM anon/);
    // The 0088 lesson holds: signature changes DROP first, grants re-issued.
    expect(sql94).toMatch(/DROP FUNCTION IF EXISTS public\.moore_showcase\(text\)/);
    expect(sql94).toMatch(/DROP FUNCTION IF EXISTS public\.add_showcase_piece\(text,text,text,text,text,text\)/);
    expect(sql94).toMatch(/GRANT EXECUTE ON FUNCTION public\.moore_showcase\(text\) TO anon/);
  });
  it('updatePiece rides the RPC with the exact steward args', async () => {
    supabase.rpc.mockResolvedValueOnce({ data: true, error: null });
    const r = await updatePiece({ instanceSlug: 'moore-divahs', slug: 'sp-1', title: 'Tutu set', description: 'Yellow + pink', priceCents: 4500 });
    expect(r.ok).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith('update_showcase_piece', {
      p_instance_slug: 'moore-divahs', p_slug: 'sp-1', p_title: 'Tutu set',
      p_description: 'Yellow + pink', p_price_cents: 4500,
    });
  });
  it('a title is still required; an RPC error settles honestly', async () => {
    expect((await updatePiece({ instanceSlug: 'moore-divahs', slug: 'sp-1', title: '  ' })).ok).toBe(false);
    supabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'not a steward of this business' } });
    const r = await updatePiece({ instanceSlug: 'moore-divahs', slug: 'sp-1', title: 'X' });
    expect(r.ok).toBe(false);
    expect(r.error).toBe('not a steward of this business');
  });
});

describe('priceInputToCents — her keyboard to honest cents', () => {
  it('parses real prices, strips $ and commas', () => {
    expect(priceInputToCents('45')).toBe(4500);
    expect(priceInputToCents('$1,250.50')).toBe(125050);
    expect(priceInputToCents(' 40.00 ')).toBe(4000);
  });
  it('blank or garbage means NO price — null, never a painted zero', () => {
    expect(priceInputToCents('')).toBeNull();
    expect(priceInputToCents('call me')).toBeNull();
    expect(priceInputToCents('0')).toBeNull();
    expect(priceInputToCents('-5')).toBeNull();
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
