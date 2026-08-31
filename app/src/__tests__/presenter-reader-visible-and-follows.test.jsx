// @vitest-environment jsdom
// =============================================================================
// The reader is REACHABLE over the presenting screen, and it FOLLOWS the words
// =============================================================================
// Darrell 2026-08-31, from the live presenter console (poetech.us, Week 2 / Week
// 6 of 111): "When we click on a Read It Out Loud.... it doesn't follow the text
// as it reads... fix it... also we dont have control over the voice... the
// controls dont show on the screen to even have a chance of adjustment."
//
// Two separate defects, both structural, both pinned here.
//
// 1. THE CONTROLS WERE PAINTED UNDERNEATH THE PRESENTER. TTSControl sits at a
//    fixed z-index; Presenter paints its console at zIndex 60 and its
//    full-screen presenting mode at zIndex 70. The reader was z-40 — so on the
//    one surface that offers a "Read it aloud" button, pressing it started a
//    reading the speaker could then neither re-voice, slow down, pause nor
//    stop. Audible and unreachable.
//
// 2. FOLLOW-ALONG HAD NO ELEMENT TO MAP. The presenter registers
//    `elementId: 'presenter-slide'`, but that id existed ONLY in the
//    full-screen presenting branch. In the console — the screen in Darrell's
//    screenshots — getElementById returned null, so the reader skipped its
//    mapped path and fell back to page-level sentence alignment: it spoke fine
//    and highlighted nothing. The console now renders the class mirror as that
//    element, and supplies prepare() so a collapsed mirror is opened before the
//    read (and restored after).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { getReadTarget, clearReadTarget } from '../lib/read-target.js';
import Presenter from '../components/Presenter.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const HERE = dirname(fileURLToPath(import.meta.url));
const readSrc = (f) => readFileSync(join(HERE, '..', 'components', f), 'utf8');

const PRESENTABLE = {
  id: 'msg-follow',
  title: 'A message the reader should follow',
  kicker: 'Sunday',
  targetMin: 45,
  scenes: [
    {
      id: 's1',
      audience: {
        title: 'The Energy You Were Given',
        lead: 'You run on a real, finite daily energy.',
        points: ['Rest is not laziness; it is how He repairs you.'],
      },
      notes: [{ kind: 'body', heading: 'Speaker note', body: 'SECRET-PRESENTER-NOTE never spoken to the room' }],
      minutes: 10,
    },
    { id: 's2', audience: { title: 'Send', lead: 'The last part.' }, minutes: 10 },
  ],
};

let container, root;
beforeEach(() => {
  window.localStorage.clear();
  const t = getReadTarget();
  if (t) clearReadTarget(t.owner);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  window.localStorage.clear();
});

const mount = () => act(() => root.render(createElement(Presenter, { presentable: PRESENTABLE, canEdit: false })));
const mirrorToggle = () => [...container.querySelectorAll('button')]
  .find((b) => /hide mirror|show what the room sees/i.test(b.textContent || ''));

// ---------------------------------------------------------------------------
// 1. The reader outranks the presenting overlays
// ---------------------------------------------------------------------------
describe('the reader controls are reachable over the presenting screen', () => {
  const tts = readSrc('TTSControl.jsx');
  const presenter = readSrc('Presenter.jsx');

  const zOf = (s) => {
    const m = s.match(/className="tts-controls[^"]*?\bz-\[?(\d+)\]?/);
    return m ? Number(m[1]) : null;
  };

  it('TTSControl declares a z-index ABOVE both presenter overlays', () => {
    const z = zOf(tts);
    expect(z, 'the tts-controls root must carry an explicit z-index').toBeTypeOf('number');
    // the two overlays this control has to clear, read from the real source
    const overlays = [...presenter.matchAll(/zIndex: (\d+)/g)]
      .map((m) => Number(m[1]))
      .filter((n) => n >= 50);
    expect(overlays.length, 'Presenter should still paint full-screen overlays').toBeGreaterThan(0);
    for (const o of overlays) {
      expect(z, `reader (z-${z}) must sit above the presenter overlay z-${o}`).toBeGreaterThan(o);
    }
  });

  it('but stays BELOW the true modal layer, which must keep covering it', () => {
    const z = zOf(tts);
    expect(z).toBeLessThan(110); // HelpWalkthrough
    expect(z).toBeLessThan(120); // Modal / Lightbox
  });

  it('is PROVEN-TO-CATCH — the shipped-before value would fail this gate', () => {
    // z-40 was the defect. Assert the gate rejects it rather than trusting that
    // it would: a guard that cannot fail the old code is decoration.
    const old = 40;
    const overlays = [...presenter.matchAll(/zIndex: (\d+)/g)].map((m) => Number(m[1])).filter((n) => n >= 50);
    expect(overlays.some((o) => old <= o), 'z-40 must be caught as too low').toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2. The console renders the element the reader follows
// ---------------------------------------------------------------------------
describe('the presenter console gives the reader something to follow', () => {
  it('renders #presenter-slide in the CONSOLE view, not only in full-screen mode', () => {
    mount();
    const el = document.getElementById('presenter-slide');
    expect(el, 'the console must render the mapped reading element').toBeTruthy();
    expect(container.contains(el)).toBe(true);
  });

  it('that element carries the words the ROOM hears — and never the private notes', () => {
    mount();
    const text = document.getElementById('presenter-slide').textContent || '';
    expect(text).toContain('The Energy You Were Given');
    expect(text).toContain('You run on a real, finite daily energy.');
    // the no-leak law: what is read aloud is what is projected
    expect(text).not.toContain('SECRET-PRESENTER-NOTE');
  });

  it('the registered target points at that element and supplies prepare()', () => {
    mount();
    const t = getReadTarget();
    expect(t.elementId).toBe('presenter-slide');
    expect(typeof t.prepare, 'prepare() is the follow-along contract').toBe('function');
  });

  it('prepare(true) OPENS a collapsed mirror so the element exists, and prepare(false) restores it', () => {
    mount();
    // collapse the mirror the way a speaker would (and the way a phone starts)
    act(() => mirrorToggle().click());
    expect(document.getElementById('presenter-slide'), 'collapsed: nothing to map').toBeNull();

    const t = getReadTarget();
    act(() => t.prepare(true));
    expect(document.getElementById('presenter-slide'), 'prepare(true) must render the reading').toBeTruthy();

    act(() => t.prepare(false));
    expect(document.getElementById('presenter-slide'), 'prepare(false) restores the speaker’s choice').toBeNull();
  });

  it('prepare(false) leaves an already-open mirror OPEN — it restores, it does not close', () => {
    mount();
    expect(document.getElementById('presenter-slide')).toBeTruthy(); // starts open at this width
    const t = getReadTarget();
    act(() => t.prepare(true));
    act(() => t.prepare(false));
    expect(document.getElementById('presenter-slide'), 'a reading must not close a mirror it did not open').toBeTruthy();
  });

  // MEASURED IN REAL CHROMIUM, not reasoned about (DR-0076 #4).
  //
  // With the shipped-before geometry (overflow:hidden + a fixed height:200% on
  // the scaled inner) a slide taller than 16:9 was clipped at the box and the
  // rest was unreachable: the user could not scroll it at all. With
  // overflow-y:auto + height:auto the scroll extent came out at 501px against a
  // natural inner height of 1001px — exactly content x 0.5, i.e. the whole
  // slide, the transform correctly accounted for — against 462px (truncated)
  // before. Those two properties are what make a followed line reachable, so
  // both are pinned.
  it('the mirror can scroll, so a followed line below the fold is reachable', () => {
    mount();
    const inner = document.getElementById('presenter-slide');
    const box = inner.parentElement;
    expect(box.style.overflowY, 'a clipped mirror can never show the spoken line').toBe('auto');
    expect(inner.style.height, 'a fixed height truncates the scrollable extent').toBe('auto');
  });
});

// ---------------------------------------------------------------------------
// 3. The reader re-resolves the element AFTER prepare() renders it
// ---------------------------------------------------------------------------
describe('the reader looks again after prepare() — the ordering fix', () => {
  it('resolves the element after prepare, not only before it', () => {
    const src = readSrc('TTSControl.jsx');
    const body = src.slice(src.indexOf('const readTargetNow'), src.indexOf('const readTargetNow') + 4000);
    const prepareAt = body.indexOf('t.prepare(true)');
    expect(prepareAt).toBeGreaterThan(-1);
    const after = body.slice(prepareAt);
    // the element must be looked up again on the far side of prepare()
    expect(after, 'el must be re-resolved after prepare() mounts the reading').toMatch(/el\s*=\s*resolveEl\(\)/);
    // and the mapped path must still be what decides follow-along
    expect(body).toContain('buildFollowMap(el)');
  });

  it('is PROVEN-TO-CATCH — a resolve-once implementation fails this check', () => {
    const resolveOnce = `
      const readTargetNow = async (t) => {
        let el = t.elementId ? document.getElementById(t.elementId) : null;
        if (t.prepare) { t.prepare(true); await settled(el, { requireChange: true }); }
        const follow = el ? buildFollowMap(el) : null;
      };`;
    const after = resolveOnce.slice(resolveOnce.indexOf('t.prepare(true)'));
    expect(/el\s*=\s*resolveEl\(\)/.test(after), 'the old resolve-once shape must be caught').toBe(false);
  });
});
