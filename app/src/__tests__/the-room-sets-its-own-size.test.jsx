// @vitest-environment jsdom
// =============================================================================
// THE ROOM SETS ITS OWN SIZE, THE PANEL FOLDS, AND ONE PART IS ONE TAP AWAY
// =============================================================================
// Darrell 2026-09-17, from the presenting view on his phone, three reports in
// one breath:
//
//   "Need to be able to work the text sizes on the PowerPoint and the controls
//    are taking over the screen real-estate... also... each Lesson should be
//    able to present just the one that we want without having to scroll through
//    the whole list to get to the one lesson that we want to understand"
//
// Each named a real mechanism:
//   (1) every font size on the slide was clamp(px, vw, px) — viewport math that
//       answered the projector's width and nothing else. The app's own text-size
//       control could not touch it, and the presenting view is a full-screen
//       overlay so that control was not even on screen to try.
//   (2) the presenting bars held nine and ten always-on controls with rem-sized
//       words and flexWrap, outside the DR-0410 chrome cap — so they wrapped to
//       three and four rows and took the screen from the slide.
//   (3) a 163-scene deck had exactly two ways through it, ← and →. Reaching
//       week 45 in front of a room meant forty-four taps.
//
// PROVEN TO CATCH: the breaks are listed in DR-0451's verification table; each
// assertion below was run against the pre-fix code.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import Presenter from '../components/Presenter.jsx';
import AudienceSlide from '../components/AudienceSlide.jsx';
import {
  SLIDE_SIZE_STEPS, DEFAULT_SLIDE_SIZE, slideStepFor, isValidSlideSize,
  slideScaleFor, slideScaleStyle, stepSlideSize, loadSlideSize, saveSlideSize,
} from '../lib/slide-size.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const src = (file) => readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'components', file), 'utf8');

const scene = (i, total, title) => ({
  id: `s${i}`,
  indexLabel: `Week ${i + 1} of ${total}`,
  estimatedMin: 5,
  audience: { title, lead: 'A lead line for the room to read.' },
  notes: [],
});
// A deck long enough that stepping is the wrong answer — his was 163.
const LONG = {
  id: 'test:long',
  title: 'Living Lessons from the Word',
  targetMin: 75,
  scenes: Array.from({ length: 12 }, (_, i) => scene(i, 12, `Lesson ${i + 1} title`)),
};

function memStorage(seed = {}) {
  const m = { ...seed };
  return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = v; }, _store: m };
}

let container, root, store;
beforeEach(() => {
  window.localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  store = memStorage();
});
afterEach(() => { act(() => root.unmount()); container.remove(); window.localStorage.clear(); });

const byTestId = (id) => container.querySelector(`[data-testid="${id}"]`);
// onClose is passed because Exit is one of the controls that must NEVER fold,
// and a presenter mounted without it renders no Exit at all.
const mount = (props = {}) => act(() => root.render(createElement(Presenter, { presentable: LONG, storage: store, onClose: () => {}, ...props })));

// -----------------------------------------------------------------------------
// 1. The room's size is its own dial
// -----------------------------------------------------------------------------
describe('the room has its own text size, separate from the reader s own', () => {
  it('the steps run from snug to true large print, with the normal projected size as the default', () => {
    expect(SLIDE_SIZE_STEPS.length).toBeGreaterThanOrEqual(4);
    expect(isValidSlideSize(DEFAULT_SLIDE_SIZE)).toBe(true);
    expect(slideScaleFor(DEFAULT_SLIDE_SIZE)).toBe(1);
    const scales = SLIDE_SIZE_STEPS.map((s) => s.scale);
    expect(scales).toEqual([...scales].sort((a, b) => a - b)); // ascending, no surprises
    expect(Math.max(...scales)).toBeGreaterThanOrEqual(2);
    expect(Math.min(...scales)).toBeLessThan(1); // a step DOWN exists, to fit more on a slide
  });

  it('the normal size publishes NO custom property — an unset surface is untouched', () => {
    expect(slideScaleStyle('room')).toEqual({});
    expect(slideScaleStyle('bigger')).toEqual({ '--slide-scale': '1.5' });
  });

  it('unknown, missing and malformed choices all resolve to the normal projected size', () => {
    expect(slideStepFor('nonsense').key).toBe(DEFAULT_SLIDE_SIZE);
    expect(slideScaleFor(undefined)).toBe(1);
    expect(loadSlideSize(memStorage())).toBe(DEFAULT_SLIDE_SIZE);
    expect(loadSlideSize(memStorage({ 'poe-slide-size': 'junk' }))).toBe(DEFAULT_SLIDE_SIZE);
    // A storage that throws never breaks a presentation.
    const hostile = { getItem: () => { throw new Error('private mode'); }, setItem: () => { throw new Error('quota'); } };
    expect(loadSlideSize(hostile)).toBe(DEFAULT_SLIDE_SIZE);
    expect(() => saveSlideSize('big', hostile)).not.toThrow();
  });

  it('stepping stops at both ends instead of falling off', () => {
    const first = SLIDE_SIZE_STEPS[0].key;
    const last = SLIDE_SIZE_STEPS[SLIDE_SIZE_STEPS.length - 1].key;
    expect(stepSlideSize(first, -1)).toBe(first);
    expect(stepSlideSize(last, +1)).toBe(last);
    expect(stepSlideSize(DEFAULT_SLIDE_SIZE, +1)).not.toBe(DEFAULT_SLIDE_SIZE);
    expect(stepSlideSize('nonsense', 0)).toBe(DEFAULT_SLIDE_SIZE);
  });

  it('round-trips through storage', () => {
    const s = memStorage();
    saveSlideSize('biggest', s);
    expect(loadSlideSize(s)).toBe('biggest');
  });
});

// -----------------------------------------------------------------------------
// 2. Every size on the slide answers that dial
// -----------------------------------------------------------------------------
describe('the slide reads the room s size', () => {
  it('EVERY font size on the slide rides the multiplier — none is left as raw viewport math', () => {
    const s = src('AudienceSlide.jsx');
    const sizes = s.match(/fontSize: [^,\n]+/g) || [];
    expect(sizes.length).toBeGreaterThan(10);
    for (const decl of sizes) {
      expect(decl).toContain('SLIDE_FS(');
    }
    // The helper multiplies, and defaults to 1 so an unset ancestor is a no-op.
    expect(s).toMatch(/calc\(\$\{clampExpr\} \* var\(--slide-scale, 1\)\)/);
    // The responsive floor and ceiling survive — the slide still answers the screen.
    expect(s).toMatch(/SLIDE_FS\('clamp\(36px, 6vw, 96px\)'\)/);
  });

  it('a rendered slide carries the multiplier in its own font sizes', () => {
    act(() => root.render(createElement(AudienceSlide, {
      slide: { indexLabel: 'Week 2 of 12', title: 'The Energy You Were Given', lead: 'You run on a real, finite daily energy.' },
    })));
    const h1 = container.querySelector('h1');
    expect(h1).toBeTruthy();
    expect(h1.style.fontSize).toContain('var(--slide-scale');
    expect(h1.style.fontSize).toContain('clamp(');
  });
});

// -----------------------------------------------------------------------------
// 3. The speaker's panel does not take the screen
// -----------------------------------------------------------------------------
describe('the presenting controls stop taking the screen', () => {
  it('both bars are inside the capped chrome region, so Big Print grows the SLIDE and not the frame', () => {
    const s = src('Presenter.jsx');
    expect(s).toMatch(/className="ts-chrome-region" data-testid="presenting-bar"/);
    expect(s).toMatch(/className="ts-chrome-region ts-safe-sticky" data-testid="present-setup-bar"/);
  });

  it('the sticky bar can never exceed the viewport — DR-0276 rule 2, which the presenter had never taken', () => {
    // .ts-safe-sticky caps a sticky header to 100dvh and scrolls within itself,
    // so every control it holds stays reachable at every text step. The
    // presenter was the largest chrome surface in the app that this rule had
    // never reached.
    expect(src('Presenter.jsx')).toContain('ts-safe-sticky');
  });

  it('the setup bar holds the essentials and folds the rest behind More', () => {
    mount();
    const bar = byTestId('present-setup-bar');
    expect(bar).toBeTruthy();
    const more = byTestId('present-setup-bar-more');
    expect(more).toBeTruthy();
    // Folded: the secondary controls are gone from the DOM, not merely hidden.
    act(() => { more.click(); });
    expect(byTestId('present-setup-bar-rest')).toBeNull();
    // The way out and the way through never fold away.
    expect(bar.querySelector('[aria-label="Previous"]')).toBeTruthy();
    expect(bar.querySelector('[aria-label="Next"]')).toBeTruthy();
    expect([...bar.querySelectorAll('button')].some((b) => /Exit/.test(b.textContent))).toBe(true);
    // And More brings them back.
    act(() => { byTestId('present-setup-bar-more').click(); });
    expect(byTestId('present-setup-bar-rest')).toBeTruthy();
  });

  it('the room-size control lives ON the presenting screen, where he asked for it', () => {
    mount({ startOnScreen: true });
    const rs = byTestId('presenting-room-size');
    expect(rs).toBeTruthy();
    const [smaller, bigger] = [...rs.querySelectorAll('button')];
    expect(smaller.getAttribute('aria-label')).toMatch(/smaller/i);
    expect(bigger.getAttribute('aria-label')).toMatch(/bigger/i);
    // It publishes the multiplier onto the slide's own container, and only there.
    const slide = container.querySelector('#presenter-slide');
    expect(slide).toBeTruthy();
    act(() => { bigger.click(); });
    const holder = container.querySelector('[style*="--slide-scale"]');
    expect(holder).toBeTruthy();
    expect(holder.contains(container.querySelector('#presenter-slide'))).toBe(true);
    // The bar is NOT inside it — the panel does not grow with the room's words.
    expect(holder.contains(byTestId('presenting-bar'))).toBe(false);
  });

  it('the choice is remembered, so a speaker sets it once', () => {
    mount({ startOnScreen: true });
    act(() => { [...byTestId('presenting-room-size').querySelectorAll('button')][1].click(); });
    expect(window.localStorage.getItem('poe-slide-size')).toBeTruthy();
    expect(isValidSlideSize(window.localStorage.getItem('poe-slide-size'))).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// 4. One part, one tap
// -----------------------------------------------------------------------------
describe('present just the one we want', () => {
  it('a long deck offers a jump that names every part', () => {
    mount({ startOnScreen: true });
    const jump = byTestId('presenting-jump');
    expect(jump).toBeTruthy();
    expect(jump.tagName).toBe('SELECT');
    expect(jump.options.length).toBe(LONG.scenes.length);
    // Named by position AND title, so a speaker recognises the one they want.
    expect(jump.options[4].textContent).toContain('Week 5 of 12');
    expect(jump.options[4].textContent).toContain('Lesson 5 title');
  });

  it('choosing one lands on it directly — not forty taps of the arrow', () => {
    mount({ startOnScreen: true });
    const jump = byTestId('presenting-jump');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
    act(() => { setter.call(jump, '9'); jump.dispatchEvent(new window.Event('change', { bubbles: true })); });
    expect(container.textContent).toContain('Lesson 10 title');
    expect(byTestId('presenting-jump').value).toBe('9');
  });

  it('a landed part arrives WHOLE — every point already revealed, as if you had walked in', () => {
    const s = src('Presenter.jsx');
    expect(s).toMatch(/const goTo = useCallback\(\(n\) => \{/);
    expect(s).toMatch(/setReveal\(pointsCountAt\(target\)\);/);
    // Clamped at both ends and never NaN.
    expect(s).toMatch(/Math\.max\(0, Math\.min\(last, Math\.floor\(Number\(n\)\)\)\)/);
  });

  it('a two-scene deck is left alone — a jump would be noise where the arrows suffice', () => {
    const short = { id: 'test:short', title: 'Short', targetMin: 10, scenes: [scene(0, 2, 'One'), scene(1, 2, 'Two')] };
    act(() => root.render(createElement(Presenter, { presentable: short, storage: store, startOnScreen: true })));
    expect(byTestId('presenting-jump')).toBeNull();
  });

  it('the setup view carries the same jump, so the part is chosen before the room is watching', () => {
    mount();
    expect(byTestId('present-setup-jump')).toBeTruthy();
  });
});

// -----------------------------------------------------------------------------
// 5. The door that was promised: present THIS one
// -----------------------------------------------------------------------------
describe('a lesson can be presented on its own', () => {
  const learn = () => readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'components', 'ChurchLearn.jsx'), 'utf8');

  it('the single-lesson deck is REACHABLE — setPresentLesson finally has a caller', () => {
    const s = learn();
    // Before this the branch existed and nothing set the state: lessonPresentable
    // was dead code and the only way into a deck was all 163 at week one.
    expect(s).toMatch(/setPresentAutoStart\(true\); setPresentLesson\(m\);/);
    expect(s).toMatch(/data-testid=\{`present-one-\$\{m\.id\}`\}/);
    // It opens the lesson's OWN deck, timed to itself.
    expect(s).toMatch(/presentable=\{lessonPresentable\(presentLesson/);
  });

  it('Present is NOT Play — the distinction Darrell set in capitals still holds', () => {
    const s = learn();
    // Play reads the lesson aloud and opens no deck.
    expect(s).toMatch(/openLesson\(m\.id\); setOpenTutorId\(m\.id\); requestRead\(m\.id\);/);
    // The two are separate controls with separate words.
    expect(s).toContain('▶ Play');
    expect(s).toMatch(/UiIcon name="monitor"[^>]*\/> Present/);
    // And Play's handler never reaches the deck.
    const playIdx = s.indexOf('title={`Read this ${U.noun} aloud, start to finish`}');
    const playStart = s.lastIndexOf('<button', playIdx);
    expect(s.slice(playStart, playIdx)).not.toContain('setPresentLesson');
  });

  it('it arrives already presenting, which is what DR-0392 built startOnScreen for', () => {
    expect(learn()).toMatch(/startOnScreen=\{presentAutoStart\}/);
  });
});

// -----------------------------------------------------------------------------
// 6. The projector follows the one dial (DR-0453)
// -----------------------------------------------------------------------------
// DR-0451 put the room's size on the presenting screen and left the SECOND
// display on the default — backwards, because a projector across a hall is
// exactly where a big step matters. Nobody stands at the projector, so it gets
// no control of its own: the size rides the slide it is already following.
describe('the second display carries the room s size too', () => {
  const window_ = () => readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'components', 'AudienceWindow.jsx'), 'utf8');

  it('the broadcast payload carries the scale, and a size change re-sends at once', () => {
    const s = src('Presenter.jsx');
    expect(s).toMatch(/slideScale: slideScaleRef\.current,/);
    // Read through a ref so sendCurrent is not re-created by a size change...
    expect(s).toMatch(/const slideScaleRef = useRef\(slideSize\.scale\);/);
    // ...and named in the broadcast effect so the change does not wait for the
    // next slide. A speaker enlarges the words because the back row cannot read
    // THIS one.
    expect(s).toMatch(/\[idx, age, reveal, slideSize\.scale, sendCurrent\]/);
  });

  it('the projector applies it, and a slide without one renders exactly as before', () => {
    const s = window_();
    expect(s).toMatch(/'--slide-scale': String\(slideScale\)/);
    // Only published when it is a real, positive, non-default number.
    expect(s).toMatch(/slideScale && slideScale !== 1/);
    expect(s).toMatch(/Number\.isFinite\(Number\(slide\.slideScale\)\) && Number\(slide\.slideScale\) > 0/);
  });

  it('blanking the screen does not snap the room back to the default size', () => {
    // The choice belongs to the session, not to one slide: a hold carries no
    // scale, so the last one told is held.
    const s = window_();
    expect(s).toMatch(/lastScaleRef/);
    expect(s).toMatch(/: lastScaleRef\.current;/);
  });
});
