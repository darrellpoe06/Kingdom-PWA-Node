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
