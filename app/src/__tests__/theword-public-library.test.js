// @vitest-environment node
//
// The Word — Migdal PUBLIC library client path (Darrell 2026-06-16). The library
// is public; prep/drafts are private. fetchPublicSermons() reads ONLY through the
// SECURITY DEFINER RPC theword_public_sermons() (0029) — which returns published
// (non-draft), colg-scoped rows. This pins the CLIENT contract: it maps the RPC
// rows to the message shape and degrades to [] on error (the public surface never
// throws). The row-level filtering itself is enforced in SQL (0029) and verified
// against the live DB post-land.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const rpc = vi.fn();
vi.mock('../lib/supabase.js', () => ({ default: { rpc: (...a) => rpc(...a) } }));
vi.mock('../lib/church-instance.js', () => ({ churchInstanceId: vi.fn(async () => 'instance-1') }));

import { fetchPublicSermons } from '../lib/choir-sync.js';
import { fetchPublicPoints } from '../lib/sermon-library-sync.js';

beforeEach(() => rpc.mockReset());

describe('fetchPublicSermons — the public library client', () => {
  it('calls the public RPC (not the table) and maps rows to the message shape', async () => {
    rpc.mockResolvedValue({
      data: [
        { id: 's1', service_date: '2026-06-14', service_type: 'sunday', title: 'Sunday Service', speaker: 'Bishop Lloyd E. Gwin', youtube_url: 'https://youtu.be/ZAmmNGVxd1U', video_id: 'ZAmmNGVxd1U', start_seconds: null, service_slot: null, scripture_ref: null },
      ],
      error: null,
    });
    const out = await fetchPublicSermons();
    expect(rpc).toHaveBeenCalledWith('theword_public_sermons');
    expect(out).toHaveLength(1);
    expect(out[0].title).toBe('Sunday Service');
    expect(out[0].speaker).toBe('Bishop Lloyd E. Gwin');
    expect(out[0].youtubeUrl).toBe('https://youtu.be/ZAmmNGVxd1U');
  });

  it('degrades to [] on error — the public surface never throws', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } });
    await expect(fetchPublicSermons()).resolves.toEqual([]);
  });

  it('returns [] for an empty library', async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    await expect(fetchPublicSermons()).resolves.toEqual([]);
  });
});

// The PUBLIC teaching outline (0101): everyone — signed in or not — gets the
// published messages' key POINTS + SCRIPTURES via the SECURITY DEFINER RPC, while
// the sermon_prep table itself is leadership-only. Pins the client contract: it
// reads the RPC (never the table), keys by sermon id, and NEVER carries notes.
describe('fetchPublicPoints — the public points/scriptures client', () => {
  it('reads the public RPC and keys the outline by sermon id (points + scriptures, no notes)', async () => {
    rpc.mockResolvedValue({
      data: [
        { sermon_id: 's1', theme: 'The Fear of the Lord', points: [{ n: 1, text: 'Reverence', scriptures: ['Prov 1:7'] }], scriptures: ['Prov 1:7', 'Ps 111:10'] },
      ],
      error: null,
    });
    const out = await fetchPublicPoints();
    expect(rpc).toHaveBeenCalledWith('theword_public_points');
    expect(out.s1.points).toHaveLength(1);
    expect(out.s1.scriptures).toEqual(['Prov 1:7', 'Ps 111:10']);
    expect(out.s1.theme).toBe('The Fear of the Lord');
    expect(out.s1.source).toBe('prep');
    // The public shape carries NO notes field — notes never leave the private prep.
    expect(out.s1).not.toHaveProperty('notes');
  });

  it('degrades to {} on error and on empty — never throws', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } });
    await expect(fetchPublicPoints()).resolves.toEqual({});
    rpc.mockResolvedValue({ data: [], error: null });
    await expect(fetchPublicPoints()).resolves.toEqual({});
  });
});
