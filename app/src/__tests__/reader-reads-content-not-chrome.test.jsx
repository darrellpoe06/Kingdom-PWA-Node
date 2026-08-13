// @vitest-environment jsdom
// =============================================================================
// The reader reads the CONTENT — it does not read the buttons, and it does not
// press them
// =============================================================================
// Darrell 2026-08-13, from the Scripture tab with the reader running:
//   "The reader reads the Highlight Up Arrow... etc... I want the content."
//   "also the color tab pops up on its own after a while... fix bugs."
//
// Two reports, and tracing them found ONE family: the reader was treating
// interactive chrome as reading material. It SPOKE control labels, and it
// CLICKED controls to "reveal" them.
//
//  1. `readablePageText()` cloned <main> and stripped only `.tts-controls`,
//     `.feedback-modal` and `[aria-hidden="true"]`. Everything else went to the
//     voice — so a listener on Scripture heard "↑ HIDE OTHER TRANSLATIONS",
//     "ESV", "NIV", "CLEAR HIGHLIGHT", "GIVE", "FEEDBACK" threaded through the
//     Word. Scripture hits this path because it registers no read target.
//
//  2. `revealForReading()` opens collapsed disclosures by clicking every
//     `[aria-expanded="false"]` in the reading root. VerseHighlighter's swatch
//     is exactly that shape — and it opens a `role="menu"`. So the reader
//     popped a colour palette open on every verse on screen. The module's own
//     header already said it must never touch menus (`[aria-haspopup]`); the
//     component simply never carried the attribute the guard looks for.
//
// That last part is the shape worth naming: a guard that only works if every
// future author remembers one attribute is a comment, not a mechanism. So this
// pins BOTH halves — the component now declares itself, AND the reveal pass
// refuses a button that owns a popup even when the attribute is absent.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { revealForReading } from '../lib/read-reveal.js';
import VerseHighlighter from '../components/VerseHighlighter.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const HERE = dirname(fileURLToPath(import.meta.url));
const TTS_SRC = readFileSync(join(HERE, '..', 'components', 'TTSControl.jsx'), 'utf8');

let container, root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = null;
});

// ── 2. The reader must not PRESS the colour palette open ────────────────────

describe('revealForReading never opens a menu', () => {
  const mount = (props = {}) => act(() => root.render(
    createElement(VerseHighlighter, { value: 'none', onPick: () => {}, refLabel: 'Romans 10:13', ...props }),
  ));

  it('the swatch declares itself a menu button', () => {
    mount();
    const btn = container.querySelector('button');
    expect(btn.getAttribute('aria-haspopup')).toBe('menu');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });

  it('THE BUG: a reveal pass leaves the palette closed', () => {
    mount();
    expect(container.querySelector('[role="menu"]')).toBeNull();
    act(() => { revealForReading(container); });
    expect(
      container.querySelector('[role="menu"]'),
      'the reader popped the colour palette open on a verse',
    ).toBeNull();
  });

  it('and leaves it closed for EVERY verse on the page, not just the first', () => {
    // Darrell's screenshot showed two palettes open at once — the reveal loop
    // walking down the page, one verse after another, up to its budget.
    act(() => root.render(createElement('div', null,
      createElement(VerseHighlighter, { key: 'a', refLabel: 'Romans 10:13', onPick: () => {} }),
      createElement(VerseHighlighter, { key: 'b', refLabel: 'John 3:17', onPick: () => {} }),
      createElement(VerseHighlighter, { key: 'c', refLabel: 'John 3:16', onPick: () => {} }),
    )));
    act(() => { revealForReading(container); });
    expect(container.querySelectorAll('[role="menu"]').length).toBe(0);
  });

  it('a human tapping the swatch still opens it — the control is not broken', () => {
    mount();
    const btn = container.querySelector('button');
    act(() => { btn.click(); });
    expect(container.querySelector('[role="menu"]')).toBeTruthy();
  });
});

describe('a real disclosure is still revealed — the fix did not disarm the feature', () => {
  it('a plain aria-expanded=false disclosure is still clicked open', () => {
    const host = document.createElement('div');
    let clicked = 0;
    const b = document.createElement('button');
    b.setAttribute('aria-expanded', 'false');
    b.textContent = 'About this';
    b.addEventListener('click', () => { clicked += 1; });
    host.appendChild(b);
    document.body.appendChild(host);
    const out = revealForReading(host);
    expect(clicked, 'a genuine disclosure must still open, or "deeper" stops being read').toBe(1);
    expect(out.buttons).toBe(1);
    host.remove();
  });

  it('a <details> is still opened', () => {
    const host = document.createElement('div');
    host.innerHTML = '<details><summary>More</summary><p>the deeper part</p></details>';
    document.body.appendChild(host);
    revealForReading(host);
    expect(host.querySelector('details').open).toBe(true);
    host.remove();
  });

  it('a popup declared only by aria-controls is refused too', () => {
    const host = document.createElement('div');
    host.innerHTML = '<button aria-expanded="false" aria-controls="m1">Pick</button>'
      + '<div id="m1" role="menu">colors</div>';
    document.body.appendChild(host);
    let clicked = 0;
    host.querySelector('button').addEventListener('click', () => { clicked += 1; });
    revealForReading(host);
    expect(clicked).toBe(0);
    host.remove();
  });
});

// ── 1. The reader must not SPEAK the buttons ────────────────────────────────

describe('the page-read fallback strips chrome', () => {
  // readablePageText is module-private to TTSControl (it touches document
  // directly and the component is heavy to mount), so the rule is pinned on the
  // selector it uses. The behavioural half is the DOM check below.
  it('the chrome selector covers what Darrell actually heard', () => {
    for (const sel of ['nav', 'button', 'select', '[role="menu"]', '[role="tablist"]', '[role="dialog"]']) {
      expect(TTS_SRC, `${sel} must be stripped from the page read`).toContain(`'${sel}'`);
    }
  });

  it('opt-in and opt-out both exist, so a real reading is never silently cut', () => {
    expect(TTS_SRC).toContain('[data-read-skip]');
    expect(TTS_SRC).toContain('data-read-keep');
  });

  it('THE BUG, held still: the old selector would have spoken the buttons', () => {
    // The exact page shape from the screenshot, run through the OLD rule and
    // the NEW one, so the assertion measures the change rather than restating it.
    const page = document.createElement('main');
    page.innerHTML = `
      <nav><button>Church</button><button>Scripture</button></nav>
      <section>
        <h3>Romans 10:13</h3>
        <p>"For whosoever shall call upon the name of the Lord shall be saved." KJV</p>
        <button>↑ HIDE OTHER TRANSLATIONS</button>
        <button>ESV</button><button>NIV</button>
        <button aria-expanded="false" aria-haspopup="menu">Highlight</button>
        <button>CLEAR HIGHLIGHT</button>
      </section>
      <button>GIVE</button><button>FEEDBACK</button>`;
    document.body.appendChild(page);

    const OLD = '.tts-controls, .feedback-modal, [aria-hidden="true"]';
    const NEW = [
      '.tts-controls', '.feedback-modal', '[aria-hidden="true"]', '[data-read-skip]',
      'nav', 'button', 'select', 'input', 'textarea',
      '[role="menu"]', '[role="menubar"]', '[role="tablist"]', '[role="dialog"]',
      '[role="listbox"]', '[role="toolbar"]', '[role="navigation"]',
    ].join(', ');

    const textWith = (sel) => {
      const c = page.cloneNode(true);
      c.querySelectorAll(sel).forEach((el) => el.remove());
      return (c.textContent || '').replace(/\s+/g, ' ').trim();
    };

    const before = textWith(OLD);
    const after = textWith(NEW);

    // The witness: the old rule really did carry the furniture.
    expect(before).toContain('HIDE OTHER TRANSLATIONS');
    expect(before).toContain('FEEDBACK');

    // The fix: the Word survives, the furniture does not.
    expect(after).toContain('Romans 10:13');
    expect(after).toContain('For whosoever shall call upon the name of the Lord shall be saved.');
    for (const junk of ['HIDE OTHER TRANSLATIONS', 'CLEAR HIGHLIGHT', 'GIVE', 'FEEDBACK', 'ESV', 'NIV']) {
      expect(after, `the reader would still say "${junk}"`).not.toContain(junk);
    }
    page.remove();
  });
});
