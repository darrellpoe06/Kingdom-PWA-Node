// =============================================================================
// ChoirSongbook populates from the real source — live render guard.
// =============================================================================
// The reported bug: the choir song list is EMPTY. This proves the inverse can't
// regress silently: given real sourced choir_songs rows (as the repertoire
// pipeline / archive seed produces), the Songbook renders POPULATED — the songs,
// their cross-reference, and the honest "archive / needs review" flags — with no
// white screen, and it stays populated across a remount (a reload). The empty
// state only shows when there genuinely are no songs. Network-free: supabase is
// mocked (no session, empty side tables) exactly like the renditions render test.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../lib/supabase.js', () => {
  const query = {
    select: () => query,
    order: () => Promise.resolve({ data: [], error: null }),
    then: (res) => Promise.resolve({ data: [], error: null }).then(res),
  };
  const supabase = {
    auth: { getSession: () => Promise.resolve({ data: { session: null } }) },
    from: () => query,
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: () => {},
    rpc: () => Promise.resolve({ data: null, error: null }),
  };
  return { default: supabase, supabase };
});

import ChoirSongbook from '../components/ChoirSongbook.jsx';

// Real-shaped rows as the archive seed writes them (source='archive', a confidence,
// a needs_review flag) — two distinct songs, one sung twice.
const sourcedSongs = [
  { id: 'a1', title: 'Total Praise', serviceDate: '2026-05-10', serviceType: 'sunday', status: 'active',
    youtubeUrl: 'https://youtu.be/abcdefghijk', startSeconds: 612, scriptureRef: 'Psalm 121',
    source: 'archive', videoId: 'abcdefghijk', confidence: 'high', needsReview: false, themes: ['praise'] },
  { id: 'a2', title: 'Total Praise', serviceDate: '2026-06-14', serviceType: 'sunday', status: 'active',
    source: 'archive', videoId: 'zyxwvutsrqp', confidence: 'low', needsReview: true, themes: [] },
  { id: 'a3', title: 'Way Maker', serviceDate: '2026-05-31', serviceType: 'sunday', status: 'active',
    source: 'archive', videoId: 'mnopqrstuvw', confidence: 'med', needsReview: true, themes: ['worship'] },
];

let container, root;
async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(ChoirSongbook, props));
  });
}
function unmount() {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
}

beforeEach(() => { try { localStorage.clear(); } catch { /* noop */ } });
afterEach(() => unmount());

describe('ChoirSongbook renders populated from sourced rows', () => {
  it('lists the sourced songs — not the empty state — with their archive flags', async () => {
    await mount({ songs: sourcedSongs, access: { canSee: true, canEdit: false } });
    const text = container.textContent;
    expect(text).toMatch(/Total Praise/);
    expect(text).toMatch(/Way Maker/);
    expect(text).toMatch(/needs review/i);   // honest provenance, not a painted list
    expect(text).toMatch(/archive/i);
    expect(text).not.toMatch(/No songs yet/i);
  });

  it('survives a reload (remount with the same rows stays populated — no white screen)', async () => {
    await mount({ songs: sourcedSongs, access: { canSee: true, canEdit: false } });
    expect(container.textContent).toMatch(/Total Praise/);
    unmount();
    await mount({ songs: sourcedSongs, access: { canSee: true, canEdit: false } });
    expect(container.textContent).toMatch(/Total Praise/);
    expect(container.textContent).toMatch(/Way Maker/);
  });

  it('PROVEN-TO-CATCH: with no songs it shows the honest empty state, not a fake list', async () => {
    await mount({ songs: [], access: { canSee: true, canEdit: false } });
    expect(container.textContent).toMatch(/No songs yet/i);
    expect(container.textContent).not.toMatch(/Total Praise/);
  });
});
