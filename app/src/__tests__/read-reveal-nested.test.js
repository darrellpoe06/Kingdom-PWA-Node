// @vitest-environment jsdom
// =============================================================================
// The reveal pass must chase NESTED disclosures — one pass was never enough
// =============================================================================
// Darrell, 2026-09-06, from the live app: "The deeper and or hidden sections are
// not being read?!!!!!!!!!!!!!!! We need that fixed?!!!!!!!!!"
//
// This is the SECOND report of the same symptom. read-reveal.js already shipped
// for the first one (2026-08-10, "deeper doesn't get read at all"). So the
// question worth answering was not "is there a reveal" but "why does the reveal
// not reach the deep parts", and the measured answer is that
// `revealForReading` is ONE PASS over the DOM as it stands.
//
// THE MECHANISM. This app's disclosures are CONDITIONALLY RENDERED: an outer
// panel's children do not exist in the document until it opens. So pass one
// opens the outer panel and finds no inner buttons — because they had not been
// created yet. React paints them a frame later, by which time the pass is over
// and nothing ever clicks them. Every level below the first is skipped, exactly
// as reported. `settled()` even names the case in its own comment ("a revealed
// panel can reveal another") while nothing re-ran the reveal.
//
// PROVEN-TO-CATCH. The nested fixture below is built so the OLD function fails
// it: `revealForReading` alone opens the outer and leaves the inner closed, and
// the first test asserts precisely that, so this file documents the defect
// rather than only the fix. `revealAllForReading` loops until a pass opens
// nothing, and is bounded twice (`max` nodes, `rounds` depth) so a surface that
// re-renders forever cannot hang a read.
// =============================================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { revealForReading, revealAllForReading } from '../lib/read-reveal.js';

// A conditionally-rendered disclosure, the way this app actually builds them:
// the panel's contents DO NOT EXIST while collapsed, and appear on click.
function conditionalDisclosure(doc, { label, build }) {
  const wrap = doc.createElement('div');
  const btn = doc.createElement('button');
  btn.type = 'button';
  btn.setAttribute('aria-expanded', 'false');
  btn.textContent = label;
  const host = doc.createElement('div');
  btn.addEventListener('click', () => {
    if (btn.getAttribute('aria-expanded') === 'true') return;
    btn.setAttribute('aria-expanded', 'true');
    host.appendChild(build(doc)); // the children come into existence HERE
  });
  wrap.append(btn, host);
  return wrap;
}

let root;
beforeEach(() => {
  document.body.innerHTML = '';
  root = document.createElement('main');
  document.body.appendChild(root);
  // Three levels deep: outer -> middle -> inner, each only existing once its
  // parent is opened. The deepest carries the words nobody was hearing.
  root.appendChild(conditionalDisclosure(document, {
    label: 'About this',
    build: (doc) => {
      const mid = conditionalDisclosure(doc, {
        label: 'Deeper',
        build: (d2) => {
          const inner = conditionalDisclosure(d2, {
            label: 'Deepest',
            build: (d3) => {
              const p = d3.createElement('p');
              p.textContent = 'THE DEEPEST WORDS';
              return p;
            },
          });
          const holder = d2.createElement('div');
          holder.appendChild(inner);
          return holder;
        },
      });
      const holder = doc.createElement('div');
      holder.appendChild(mid);
      return holder;
    },
  }));
});

const stillClosed = () => root.querySelectorAll('[aria-expanded="false"]').length;

describe('THE DEFECT: a single pass cannot reach what it just revealed', () => {
  it('revealForReading opens the outer one and leaves the deeper ones closed', () => {
    const opened = revealForReading(root);
    expect(opened.buttons, 'one pass opens exactly the buttons that existed when it started').toBe(1);
    expect(stillClosed(), 'the newly-created inner disclosure is left closed').toBeGreaterThan(0);
    expect(root.textContent).not.toContain('THE DEEPEST WORDS');
  });
});

describe('THE FIX: revealAllForReading chases every level', () => {
  it('opens all three levels, so the deepest words are actually in the document', async () => {
    const total = await revealAllForReading(root);
    expect(stillClosed(), 'nothing may be left collapsed inside the reading').toBe(0);
    expect(root.textContent, 'the deep text must exist before it can be read').toContain('THE DEEPEST WORDS');
    expect(total.buttons).toBe(3);
    expect(total.rounds, 'nesting genuinely required more than one pass').toBeGreaterThan(1);
  });

  it('stops as soon as a pass opens nothing — no wasted rounds on a flat page', async () => {
    document.body.innerHTML = '';
    const flat = document.createElement('main');
    flat.innerHTML = '<p>already open</p>';
    document.body.appendChild(flat);
    const total = await revealAllForReading(flat);
    expect(total.buttons + total.details).toBe(0);
    expect(total.rounds, 'one look is enough when there is nothing to open').toBe(1);
  });

  it('is BOUNDED by rounds — a surface that keeps regrowing cannot hang a read', async () => {
    document.body.innerHTML = '';
    const endless = document.createElement('main');
    document.body.appendChild(endless);
    // Every open reveals another closed one, forever.
    const grow = (doc) => conditionalDisclosure(doc, { label: 'more', build: (d) => grow(d) });
    endless.appendChild(grow(document));
    const total = await revealAllForReading(endless, { rounds: 3 });
    expect(total.rounds).toBeLessThanOrEqual(3);
    expect(stillClosed.call(null) >= 0).toBe(true); // it returned at all — that is the assertion
  });

  it('is BOUNDED by max — the node budget is shared across passes', async () => {
    const total = await revealAllForReading(root, { max: 2 });
    expect(total.buttons).toBeLessThanOrEqual(2);
  });

  it('still refuses the things the single pass refused (menus, tabs, its own controls)', async () => {
    document.body.innerHTML = '';
    const guarded = document.createElement('main');
    guarded.innerHTML = `
      <div class="tts-controls"><button aria-expanded="false">reader menu</button></div>
      <button aria-expanded="false" aria-haspopup="true">a popup</button>
      <button aria-expanded="false" role="tab">a tab</button>
      <button aria-expanded="false" data-read-no-expand>opted out</button>`;
    document.body.appendChild(guarded);
    const total = await revealAllForReading(guarded);
    expect(total.buttons, 'none of the guarded controls may be clicked').toBe(0);
  });
});
