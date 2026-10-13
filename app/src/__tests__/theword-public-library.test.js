// @vitest-environment node
//
// The Word — Migdal PUBLIC library client path (Darrell 2026-06-16). The library
// is public; prep/drafts are private. fetchPublicSermons() reads ONLY through the
// SECURITY DEFINER RPC theword_public_sermons() (0029) — which returns published
// (non-draft), colg-scoped rows.
//
// It now rides publicRpc (anon + hard deadline), NEVER the shared supabase client:
// the shared client's getSession() waits on a CROSS-TAB auth lock, so a wedged
// PoeTech tab hung the library forever on "Loading the Word…" with no Retry
// (2026-07-19). This pins the CLIENT contract: it calls publicRpc with the public
// RPC name, maps rows to the message shape, THROWS on a hard error/timeout so the
// caller shows its honest error+Retry state (never a false "No messages yet."), and
// resolves [] only for a genuinely empty library. Row-level filtering is enforced
// in SQL (0029) and verified against the live DB post-land.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const publicRpc = vi.fn();
vi.mock('../lib/public-rpc.js', () => ({ publicRpc: (...a) => publicRpc(...a) }));
vi.mock('../lib/supabase.js', () => ({ default: { rpc: vi.fn(), from: vi.fn() } }));
vi.mock('../lib/church-instance.js', () => ({ churchInstanceId: vi.fn(async () => 'instance-1') }));

import { fetchPublicSermons } from '../lib/choir-sync.js';
import { fetchPublicPoints } from '../lib/sermon-library-sync.js';

beforeEach(() => publicRpc.mockReset());

describe('fetchPublicSermons — the public library client', () => {
  it('calls the public RPC via publicRpc (anon, deadline) and maps rows to the message shape', async () => {
    publicRpc.mockResolvedValue({
      data: [
        { id: 's1', service_date: '2026-06-14', service_type: 'sunday', title: 'Sunday Service', speaker: 'Bishop Lloyd E. Gwin', youtube_url: 'https://youtu.be/ZAmmNGVxd1U', video_id: 'ZAmmNGVxd1U', start_seconds: null, service_slot: null, scripture_ref: null },
      ],
      error: null,
    });
    const out = await fetchPublicSermons();
    expect(publicRpc).toHaveBeenCalledWith('theword_public_sermons');
    expect(out).toHaveLength(1);
    expect(out[0].title).toBe('Sunday Service');
    expect(out[0].speaker).toBe('Bishop Lloyd E. Gwin');
    expect(out[0].youtubeUrl).toBe('https://youtu.be/ZAmmNGVxd1U');
  });

  it('THROWS on a hard error/timeout so the surface shows Retry, never a false empty', async () => {
    publicRpc.mockResolvedValue({ data: null, error: { message: 'theword_public_sermons-timeout', timedOut: true } });
    await expect(fetchPublicSermons()).rejects.toThrow();
  });

  it('resolves [] for a genuinely empty library (loaded, nothing published yet)', async () => {
    publicRpc.mockResolvedValue({ data: [], error: null });
    await expect(fetchPublicSermons()).resolves.toEqual([]);
  });
});

// The PUBLIC teaching outline (0101): everyone — signed in or not — gets the
// published messages' key POINTS + SCRIPTURES via the SECURITY DEFINER RPC, while
// the sermon_prep table itself is leadership-only. Pins the client contract: it
// reads the RPC (never the table), keys by sermon id, and NEVER carries notes.
describe('fetchPublicPoints — the public points/scriptures client', () => {
  it('reads the public RPC via publicRpc and keys the outline by sermon id (points + scriptures, no notes)', async () => {
    publicRpc.mockResolvedValue({
      data: [
        { sermon_id: 's1', theme: 'The Fear of the Lord', points: [{ n: 1, text: 'Reverence', scriptures: ['Prov 1:7'] }], scriptures: ['Prov 1:7', 'Ps 111:10'] },
      ],
      error: null,
    });
    const out = await fetchPublicPoints();
    expect(publicRpc).toHaveBeenCalledWith('theword_public_points');
    expect(out.s1.points).toHaveLength(1);
    expect(out.s1.scriptures).toEqual(['Prov 1:7', 'Ps 111:10']);
    expect(out.s1.theme).toBe('The Fear of the Lord');
    expect(out.s1.source).toBe('prep');
    // The public shape carries NO notes field — notes never leave the private prep.
    expect(out.s1).not.toHaveProperty('notes');
  });

  it('degrades to {} on error and on empty — enrichment never strands the surface', async () => {
    publicRpc.mockResolvedValue({ data: null, error: { message: 'theword_public_points-timeout', timedOut: true } });
    await expect(fetchPublicPoints()).resolves.toEqual({});
    publicRpc.mockResolvedValue({ data: [], error: null });
    await expect(fetchPublicPoints()).resolves.toEqual({});
  });
});
