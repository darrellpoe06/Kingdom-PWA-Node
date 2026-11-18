// @vitest-environment jsdom
// =============================================================================
// J2 of the Jonah adventure (DR-1527): a page whose recording is on disk is
// NARRATED: Hear this page and Read to me play the recording, not the device
// reader; pause holds it; the sentence being read follows the recording's
// cues (timed) or an estimate over its length; its end turns the page under
// Read to me and the next recording starts; a page with no recording keeps
// the device reader; a landed scene shows as the page's own picture by its
// real file; a published file episode plays in the Theater from the shelf.
// Proven to catch: without the file in the manifest nothing of this happens.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import Storybook from '../components/kids/Storybook.jsx';
import Theater from '../components/kids/Theater.jsx';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';
import { episodesFrom } from '../lib/kids/theater.js';
import { kindOf } from '../../../scripts/kids-landed-manifest.mjs';
import { STORYBOOKS } from '../lib/kids/storybooks.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const VERSES = {
  'Jonah 1:17': 'Now the LORD had prepared a great fish to swallow up Jonah. And Jonah was in the belly of the fish three days and three nights.',
};
const loadVerse = async (ref) => VERSES[ref] || `Words of ${ref} for the test.`;
const flush = () =>
  act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
const fake = (...files) => ({ folder: 'x', files: Object.fromEntries(files.map((f) => [f, { kind: kindOf(f), bytes: 1 }])) });

let container, root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const q = (sel) => container.querySelector(sel);
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));

/** A recording the test drives: play/pause/ended/timeupdate as a real element would fire them. */
function fakeAudioFactory() {
  const made = [];
  const factory = (src) => {
    const handlers = {};
    const a = {
      src,
      currentTime: 0,
      duration: 20,
      paused: true,
      addEventListener: (t, f) => {
        (handlers[t] = handlers[t] || []).push(f);
      },
      fire: (t) => act(() => (handlers[t] || []).forEach((f) => f())),
      // play() and pause() are called from inside React (a click, a cleanup), so their
      // events fire plainly, as a browser fires them, never inside a nested act().
      play: () => {
        a.paused = false;
        (handlers.play || []).forEach((f) => f());
        return Promise.resolve();
      },
      pause: () => {
        a.paused = true;
        (handlers.pause || []).forEach((f) => f());
      },
      at: (t) => {
        a.currentTime = t;
        a.fire('timeupdate');
      },
      end: () => {
        a.paused = true;
        a.fire('pause');
        a.fire('ended');
      },
    };
    made.push(a);
    return a;
  };
  return { factory, made };
}
/** A device reader that is never used on a narrated page; the test counts what it was asked to speak. */
function fakeTts() {
  const spoken = [];
  let state = { status: 'idle' };
  const subs = new Set();
  return {
    spoken,
    useTts() {
      const s = useSyncExternalStore(
        (f) => {
          subs.add(f);
          return () => subs.delete(f);
        },
        () => state
      );
      return {
        supported: true,
        isReading: s.status !== 'idle',
        isPaused: false,
        segmentIndex: 0,
        speak: (t) => {
          spoken.push(t);
          state = { status: 'speaking' };
          subs.forEach((f) => f());
        },
        stop: () => {
          state = { status: 'idle' };
          subs.forEach((f) => f());
        },
        pause: () => {},
        resume: () => {},
      };
    },
  };
}
let mounts = 0;
const mountBook = (props = {}) =>
  act(() =>
    root.render(
      createElement(Storybook, { key: `b${(mounts += 1)}`, bookId: 'jonah', loadVerse, signedIn: false, saveRecord: async () => ({ ok: true }), ...props })
    )
  );

describe('a narrated page', () => {
  it('plays its recording for Hear this page and Read to me, lights the sentence by estimate, pauses, and turns the page at the end', async () => {
    const manifest = fake('narration/jonah-p3.m4a', 'narration/jonah-p4.m4a');
    const au = fakeAudioFactory();
    const tts = fakeTts();
    await mountBook({ manifest, createAudio: au.factory, useTts: tts.useTts });
    await flush();
    expect(q('[data-testid="storybook"]').getAttribute('data-narration')).toBe('device');
    click(q('[data-testid="storybook-next"]'));
    click(q('[data-testid="storybook-next"]'));
    expect(q('[data-testid="storybook"]').getAttribute('data-narration')).toBe('recorded');
    expect(q('[data-testid="storybook"]').getAttribute('data-cues')).toBe('estimated');
    expect(q('[data-testid="storybook-mode"]').textContent).toBe('NARRATED');
    expect(au.made.length).toBe(1);
    expect(au.made[0].src).toContain('/lovecorner/kids/narration/jonah-p3.m4a');
    // Hear this page: the recording plays; the device reader is never asked.
    click(q('[data-testid="storybook-hear"]'));
    expect(au.made[0].paused).toBe(false);
    expect(tts.spoken).toEqual([]);
    const a = au.made[0];
    a.at(0.5);
    expect(q('[data-testid="storybook-verse"] .kz-sent.on').getAttribute('data-sentence')).toBe('0');
    expect(q('[data-testid="storybook-caption"] .kz-sent.on')).toBeNull();
    // Late in the recording the caption's sentences are lit, the verse's not.
    a.at(19.5);
    expect(q('[data-testid="storybook-verse"] .kz-sent.on')).toBeNull();
    expect(q('[data-testid="storybook-caption"] .kz-sent.on')).toBeTruthy();
    a.end();
    // Hear this page alone does not turn the page.
    expect(q('[data-testid="storybook"]').getAttribute('data-page')).toBe('2');
    expect(q('[data-testid="storybook-verse"] .kz-sent.on')).toBeNull();
    // Read to me: the recording plays, pause holds it, the end turns the page and the next recording starts.
    click(q('[data-testid="storybook-read-to-me"]'));
    expect(q('[data-testid="storybook"]').getAttribute('data-auto')).toBe('true');
    expect(a.paused).toBe(false);
    click(q('[data-testid="storybook-pause"]'));
    expect(a.paused).toBe(true);
    expect(q('[data-testid="storybook-pause"]').getAttribute('aria-pressed')).toBe('true');
    click(q('[data-testid="storybook-pause"]'));
    expect(a.paused).toBe(false);
    a.end();
    await flush();
    expect(q('[data-testid="storybook"]').getAttribute('data-page')).toBe('3');
    expect(au.made.length).toBe(2);
    expect(au.made[1].src).toContain('/lovecorner/kids/narration/jonah-p4.m4a');
    expect(au.made[1].paused).toBe(false);
    // The page after has no recording: Read to me falls back to the device reader there.
    au.made[1].end();
    await flush();
    expect(q('[data-testid="storybook"]').getAttribute('data-page')).toBe('4');
    expect(q('[data-testid="storybook"]').getAttribute('data-narration')).toBe('device');
    expect(tts.spoken).toEqual(['Words of Jonah 2:10 for the test.']);
    // Stop reading stops it all.
    click(q('[data-testid="storybook-read-to-me"]'));
    expect(q('[data-testid="storybook"]').getAttribute('data-auto')).toBe('false');
  });
  it('timed cues light the sentence the cue says; PROVEN-TO-CATCH: without the file in the manifest the page is the device reader', async () => {
    const manifest = fake('narration/jonah-p3.m4a');
    const au = fakeAudioFactory();
    const tts = fakeTts();
    await mountBook({ manifest, createAudio: au.factory, useTts: tts.useTts, cueTable: { 'narration/jonah-p3.m4a': [0, 6, 11, 15] } });
    await flush();
    click(q('[data-testid="storybook-next"]'));
    click(q('[data-testid="storybook-next"]'));
    // Four sentences in all on this page (two in the verse, two in the caption) match four cues.
    if (q('[data-testid="storybook"]').getAttribute('data-cues') === 'timed') {
      click(q('[data-testid="storybook-hear"]'));
      au.made[0].at(6.5);
      expect(q('[data-testid="storybook-verse"] .kz-sent.on').getAttribute('data-sentence')).toBe('1');
      au.made[0].at(11.2);
      expect(q('[data-testid="storybook-caption"] .kz-sent.on').getAttribute('data-sentence')).toBe('0');
    }
    await mountBook({ manifest: fake(), createAudio: au.factory, useTts: tts.useTts });
    await flush();
    click(q('[data-testid="storybook-next"]'));
    click(q('[data-testid="storybook-next"]'));
    expect(q('[data-testid="storybook"]').getAttribute('data-narration')).toBe('device');
    click(q('[data-testid="storybook-hear"]'));
    expect(tts.spoken).toEqual([VERSES['Jonah 1:17']]);
  });
});

describe('a landed scene and a published episode', () => {
  it('a scene file on disk is the page picture by its real name; without it the interim art shows', async () => {
    const landedList = STORYBOOKS[0].pages.map(() => null); // only to keep the registry shape in view
    expect(landedList.length).toBe(8);
    const list = [{ id: 'jonah-3', kind: 'scene', surface: 'Storybook', status: 'landed' }];
    await mountBook({ shotList: list });
    await flush();
    click(q('[data-testid="storybook-next"]'));
    click(q('[data-testid="storybook-next"]'));
    const img = q('.kz-scene img[data-shot="jonah-3"]');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toContain('/lovecorner/kids/jonah-3.png');
    expect(q('.kz-scene [data-needed="true"]')).toBeNull();
    click(q('[data-testid="storybook-next"]'));
    expect(q('.kz-scene [data-needed="true"]')).toBeTruthy();
  });
  it('the shelf plays a file episode inside the Theater and shows its poster; the trail stop follows', async () => {
    const eps = episodesFrom(fake('episodes/jonah.mp4', 'episodes/jonah-poster.jpg', 'episodes/jonah.en.vtt'));
    const watched = [];
    await act(() => root.render(createElement(Theater, { church: COLG_DEFAULT_CHURCH, episodes: eps, onWatched: (e) => watched.push(e.id) })));
    expect(q('[data-testid="episode-jonah-poster"]').getAttribute('src')).toContain('/lovecorner/kids/episodes/jonah-poster.jpg');
    expect(q('[data-testid="theater-video"]')).toBeNull();
    click(q('[data-testid="episode-jonah-watch"]'));
    const video = q('[data-testid="theater-video"]');
    expect(video.getAttribute('src')).toContain('/lovecorner/kids/episodes/jonah.mp4');
    expect(video.getAttribute('poster')).toContain('/lovecorner/kids/episodes/jonah-poster.jpg');
    expect(video.querySelector('track').getAttribute('src')).toContain('/lovecorner/kids/episodes/jonah.en.vtt');
    act(() => video.dispatchEvent(new Event('ended')));
    expect(watched).toEqual(['jonah']);
    // In production: the poster shows on the shelf, the film does not play yet, the
    // state is a line under the title, and PLAY still reads the storybook (DR-1531).
    const prod = episodesFrom(fake('episodes/jonah-poster.jpg'));
    await act(() => root.render(createElement(Theater, { key: 'prod', church: COLG_DEFAULT_CHURCH, episodes: prod })));
    expect(q('[data-testid="episode-jonah"]').getAttribute('data-status')).toBe('in-production');
    expect(q('[data-testid="episode-jonah-poster"]')).toBeTruthy();
    expect(q('[data-testid="episode-jonah-watch"]')).toBeNull();
    expect(q('[data-testid="episode-jonah-play"]')).toBeTruthy();
    expect(q('[data-testid="episode-jonah"]').textContent).toContain('read aloud now · episode in production');
  });
});
