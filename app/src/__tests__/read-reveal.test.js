// @vitest-environment jsdom
// =============================================================================
// read-reveal — open what is collapsed BEFORE reading it (DR-0285)
// =============================================================================
// Darrell 2026-08-10: "deeper doesn't get read at all" and "dropdown
// information need to be understood.... too." This app's disclosures are
// conditionally rendered, so a collapsed panel has no text in the document —
// the reader was not skipping those words, they did not exist. These pin what
// the reveal will open and, just as importantly, what it must never touch.
import { describe, it, expect, vi } from 'vitest';
import { revealForReading, settled } from '../lib/read-reveal.js';

const mount = (html) => {
  const root = document.createElement('div');
  root.innerHTML = html;
  document.body.appendChild(root);
  return root;
};

describe('what the reveal opens', () => {
  it('opens a closed <details> — content the screen hid while the voice read it', () => {
    const root = mount('<details><summary>More</summary><p>the deeper words</p></details>');
    expect(revealForReading(root).details).toBe(1);
    expect(root.querySelector('details').open).toBe(true);
  });

  it('clicks a collapsed disclosure — the only way a conditionally-rendered panel exists', () => {
    const root = mount('<button aria-expanded="false">About this</button>');
    const btn = root.querySelector('button');
    const onClick = vi.fn();
    btn.addEventListener('click', onClick);
    expect(revealForReading(root).buttons).toBe(1);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('leaves an already-open disclosure alone — revealing twice never closes anything', () => {
    const root = mount('<details open><summary>More</summary><p>x</p></details><button aria-expanded="true">Open</button>');
    const opened = revealForReading(root);
    expect(opened.details).toBe(0);
    expect(opened.buttons).toBe(0);
    expect(root.querySelector('details').open).toBe(true);
  });
});

describe('what the reveal must NEVER touch', () => {
  it('the reader’s own controls', () => {
    const root = mount('<div class="tts-controls"><button aria-expanded="false">Speed</button></div>');
    expect(revealForReading(root).buttons).toBe(0);
  });

  it('menus and dialogs — a reveal must not open a modal over the page', () => {
    const root = mount('<button aria-haspopup="menu" aria-expanded="false">Menu</button><div role="dialog"><button aria-expanded="false">x</button></div>');
    expect(revealForReading(root).buttons).toBe(0);
  });

  it('tabs — a tab SWITCHES content, it does not reveal more of it', () => {
    const root = mount('<button role="tab" aria-expanded="false">Second study</button>');
    expect(revealForReading(root).buttons).toBe(0);
  });

  it('anything a surface marks off-limits', () => {
    const root = mount('<div data-read-no-expand><button aria-expanded="false">Danger</button></div>');
    expect(revealForReading(root).buttons).toBe(0);
  });

  it('is bounded — a pathological page cannot spin the reader', () => {
    const root = mount(Array.from({ length: 60 }, (_, i) => `<button aria-expanded="false">${i}</button>`).join(''));
    const opened = revealForReading(root, { max: 5 });
    expect(opened.buttons).toBe(5);
  });

  it('a throwing click never stops the rest of the reveal', () => {
    const root = mount('<button id="bad" aria-expanded="false">bad</button><details><summary>s</summary><p>p</p></details>');
    root.querySelector('#bad').click = () => { throw new Error('boom'); };
    expect(() => revealForReading(root)).not.toThrow();
    expect(root.querySelector('details').open).toBe(true);
  });

  it('no root at all: a safe zero, never a crash', () => {
    expect(revealForReading(null)).toEqual({ details: 0, buttons: 0 });
  });
});

describe('settled — knowing the reveal has finished, without guessing a frame count', () => {
  it('returns once the element stops growing', async () => {
    const root = mount('<p>short</p>');
    const len = await settled(root);
    expect(len).toBe(root.textContent.length);
  });

  it('with requireChange it waits for the content that was asked for', async () => {
    const root = mount('<p>short</p>');
    setTimeout(() => { root.innerHTML = '<p>short</p><p>and the rest of the lesson</p>'; }, 30);
    const len = await settled(root, { requireChange: true });
    expect(len).toBe(root.textContent.length);
    expect(len).toBeGreaterThan(5);
  });

  it('gives up rather than hanging a read when nothing ever changes', async () => {
    const root = mount('<p>short</p>');
    const len = await settled(root, { requireChange: true, tries: 3 });
    expect(len).toBe(root.textContent.length);
  });
});
