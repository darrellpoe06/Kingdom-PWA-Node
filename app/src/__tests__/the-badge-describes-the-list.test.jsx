// =============================================================================
// THE WORD OVER THE CARD IS TRUE OF WHAT IS IN THE CARD (2026-10-19)
// =============================================================================
// Found while paying DR-1000's `re-review: 2026-10-20`, which asked whether
// the "a 200 is not an answer" shape sat on any other sovereign surface. It
// did — and one of them was not a probe at all but a LABEL.
//
// AriReview's Binding Ways card chose its LIST and its BADGE from two
// different conditions. The list fell back to the build-time snapshot unless
// the live brain actually carried principles; the badge read "live" from the
// fetch having returned at all. So a brain that answered with an EMPTY
// principles list — which its own producer writes whenever PRINCIPLES.md
// parses to zero rows (infra/nas-ways/ways_ingest.py) — printed
// "live · N open re-reviews" directly above the BUILD's principles. Nobody
// reading that card could tell they were looking at deploy-time data.
//
// It is the same class as the probe fixes beside it: a claim made from the
// fact that something answered, rather than from what it said. One condition
// now decides both, and these two cases hold it there.
//
// This file is separate from ari-review-render.test.jsx for a mechanical
// reason worth writing down: the snapshot comes from the build-injected
// `__DR_PRINCIPLES__` global, read at MODULE scope. The bug is only visible
// when that snapshot is non-empty, as it is on the real site and is not under
// vitest — so the global must be set BEFORE the component module is imported,
// which means a dynamic import, which means its own file.
// =============================================================================
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// The build's own snapshot, as vite.config.js:423 injects it. Two rows is
// enough to tell "from this build" apart from a live read.
const SNAPSHOT = {
  items: [
    { id: 'THREE-BRAKES', summary: 'No timer automation without the brakes.', source: 'CLAUDE.md' },
    { id: 'WORD-FIRST', summary: 'The Word is the authority, not man-agreement.', source: 'CLAUDE.md' },
    { id: 'DRIVE-DONT-DELEGATE', summary: 'The agent does the clicking.', source: 'CLAUDE.md' },
  ],
};

let AriReview;
beforeAll(async () => {
  vi.stubGlobal('__DR_PRINCIPLES__', SNAPSHOT);
  AriReview = (await import('../components/AriReview.jsx')).default;
});

const realFetch = globalThis.fetch;
beforeEach(() => { document.body.innerHTML = ''; try { window.localStorage.clear(); } catch { /* noop */ } });
afterEach(() => { globalThis.fetch = realFetch; });

// A brain exactly as ways_ingest.py writes it (ok + generated_at always
// stamped, infra/nas-ways/ways_ingest.py:129-131), carrying whatever list is
// handed in — including none.
const brainAnswering = (principles) => async () => ({
  ok: true,
  status: 200,
  json: async () => ({
    ok: true,
    generated_at: '2026-10-19T00:00:00Z',
    principles,
    counts: { principles: principles.length, decisions: 7, open_re_reviews: 3 },
  }),
});

async function mountAsync() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => { root.render(createElement(AriReview, { concerns: [], feedback: [] })); });
  return host;
}

describe('the Binding Ways badge describes the list underneath it', () => {
  it('the build snapshot is what is shown, and the badge says so, when the live brain carries no principles', async () => {
    globalThis.fetch = brainAnswering([]);
    const text = (await mountAsync()).textContent;
    // The card is there, over the BUILD's three principles...
    expect(text).toContain('Binding Ways');
    expect(text).toContain('3 principles');
    expect(text).toContain('DRIVE-DONT-DELEGATE');
    // ...so the badge must not claim a live read, and must not borrow the
    // live brain's re-review count to dress up build-time data.
    expect(text).toContain('from this build');
    expect(text).not.toMatch(/3 open re-reviews/);
  });

  it('the badge says live, with the open count, when the live brain really carried the list shown', async () => {
    globalThis.fetch = brainAnswering([
      { id: 'LIVE-ONE', summary: 'Read from the NAS this minute.', source: 'PRINCIPLES.md' },
      { id: 'LIVE-TWO', summary: 'Fresher than the deploy.', source: 'PRINCIPLES.md' },
    ]);
    const text = (await mountAsync()).textContent;
    expect(text).toContain('2 principles');
    expect(text).toContain('LIVE-ONE');
    expect(text).toMatch(/3 open re-reviews/);
    expect(text).not.toContain('from this build');
    // and the build's snapshot is no longer the list on screen
    expect(text).not.toContain('DRIVE-DONT-DELEGATE');
  });

  it('a dark road leaves the snapshot and says from this build', async () => {
    globalThis.fetch = async () => { throw new Error('no route'); };
    const text = (await mountAsync()).textContent;
    expect(text).toContain('3 principles');
    expect(text).toContain('from this build');
  });
});
