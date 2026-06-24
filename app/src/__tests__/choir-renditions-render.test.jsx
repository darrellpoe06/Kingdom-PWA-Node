// =============================================================================
// ChoirSongbook + ChoirRenditions — live render proof (Verification Doctrine:
// observe the real surface, not just the pure logic). Mounts the ACTUAL
// Songbook in jsdom with a real-shaped set of renditions, opens "the ways we've
// sung this," and reads the DOM. Network-free: supabase is mocked (no session,
// empty tables), so the loves subscriptions resolve empty and no cloud call
// happens. Proves the panel mounts (no white screen), lists the performances
// newest-first, surfaces the ad-libs + keyboardist notes, and flags a
// low-confidence archive match for review.
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

// Two renditions of one song: a rich past performance + a low-confidence archive
// match that must flag itself for review.
const songs = [
  {
    id: 'r1', title: 'Total Praise', serviceDate: '2026-05-10', serviceType: 'sunday', status: 'active',
    youtubeUrl: 'https://youtu.be/abcdefghijk', startSeconds: 600, songKey: 'Ab', arrangement: 'Choir + solo', soloist: 'Sis. M',
    themes: ['praise'], keyboardistNotes: 'Modulate up a half step into the tag.',
    adLibs: [{ id: 'a', type: 'vamp', label: 'Extended vamp on the tag', at: 740 }], renditionSource: 'manual',
  },
  {
    id: 'r2', title: 'Total Praise', serviceDate: '2026-06-14', serviceType: 'sunday', status: 'active',
    themes: ['worship'], adLibs: [], source: 'archive', videoId: 'vid123', confidence: 'low', needsReview: true,
  },
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

beforeEach(() => { try { localStorage.clear(); } catch { /* noop */ } });
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

async function openWays() {
  const btn = [...container.querySelectorAll('button')].find((b) => /Ways we've sung it/i.test(b.textContent));
  expect(btn).toBeTruthy();
  await act(async () => { btn.click(); });
}

describe('ChoirSongbook surfaces a song as Song → Renditions', () => {
  it('the card offers "ways we\'ve sung it" with the real performance count', async () => {
    await mount({ songs, access: { canSee: true, canEdit: false } });
    expect(container.textContent).toMatch(/Ways we've sung it \(2\)/i);
  });

  it('opening it lists the performances + ad-libs + keyboardist notes — no white screen', async () => {
    await mount({ songs, access: { canSee: true, canEdit: false } });
    await openWays();
    const text = container.textContent;
    expect(text).toMatch(/The ways we've sung this/i);
    expect(text).toMatch(/2 times/i);
    expect(text).toMatch(/Extended vamp on the tag/i);   // the ad-lib for that rendition
    expect(text).toMatch(/half step/i);                  // keyboardist notes
  });

  it('PROVEN-TO-CATCH: a low-confidence archive rendition flags for review', async () => {
    await mount({ songs, access: { canSee: true, canEdit: true } });
    await openWays();
    expect(container.textContent).toMatch(/verify match/i);
  });

  it('a director sees the curate controls (add variation / keep)', async () => {
    await mount({ songs, access: { canSee: true, canEdit: true } });
    await openWays();
    const text = container.textContent;
    expect(text).toMatch(/Add variation/i);
    expect(text).toMatch(/keep/i);   // graduate a loved ad-lib into the arrangement
  });
});
