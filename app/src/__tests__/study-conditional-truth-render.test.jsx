// =============================================================================
// Darrell's Study — "Conditional truth" live render proof (Verification Doctrine
// DR-0076: observe the REAL surface, not just the data). Mounts the actual Study
// component as a circle member would see it and proves two things a pure unit
// test cannot:
//   1. a first-time reader (empty store) sees the teaching card render, in his
//      words, with his close ("Salute, love, respect, study");
//   2. a returning reader who ALREADY had the earlier seven seeds on their device
//      still sees the new eighth card appear — the mergeMissingSeeds path, proven
//      on the rendered surface (this is the exact case seedIfEmpty cannot fix).
// The deep-source layer is behind a disclosure button by design, so we open it
// and assert the fetched-verbatim Scripture + his thesis are actually shown.
// =============================================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import Study from '../components/Study.jsx';
import { emptyStudy, seedIfEmpty, saveStudy, studyKey, SEED_THEMES, normalizeEntry } from '../lib/study-space.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const EMAIL = 'darrellpoe06@gmail.com';
let container, root;
const clickEl = async (el) => { await act(async () => { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); }); };
const btnByText = (re) => [...container.querySelectorAll('button')].find((b) => re.test((b.textContent || '').trim()));

beforeEach(() => { try { localStorage.clear(); } catch { /* no storage */ } });

async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(Study, { email: EMAIL }));
  });
}

describe('Study surface — the Conditional-truth teaching renders faithfully', () => {
  it('a first-time reader sees the card, his thesis, and his close on the surface', async () => {
    await mount();
    // The title + plain layer (his words) are on the surface for a fresh study.
    expect(container.textContent).toMatch(/Conditional truth/i);
    expect(container.textContent).toMatch(/if \/ then/i);
    expect(container.textContent).toMatch(/Salute, love, respect, study/); // his close, exact (plain layer)

    // Open the deep source WITHIN the conditional-truth card (not a neighbour's),
    // then confirm his thesis + the fetched-verbatim ESV are actually rendered.
    const cardOf = (re) => [...container.querySelectorAll('div')]
      .filter((d) => re.test(d.textContent || '') && [...d.querySelectorAll('button')].some((b) => /deep source/i.test(b.textContent || '')))
      .sort((a, b) => (a.textContent || '').length - (b.textContent || '').length)[0];
    const card = cardOf(/Conditional truth — if \/ then/);
    expect(card).toBeTruthy();
    const open = [...card.querySelectorAll('button')].find((b) => /Open the deep source/i.test(b.textContent || ''));
    await clickEl(open);
    const text = card.textContent || '';
    expect(text).toMatch(/be doers of the word, and not hearers only/); // James 1:22 ESV verbatim
    expect(text).toMatch(/Examine yourselves, to see whether you are in the faith/); // 2 Cor 13:5 ESV verbatim
    expect(text).toMatch(/no one was found worthy/); // Rev 5:4 ESV verbatim
    expect(text).toMatch(/canceling the record of debt that stood against us/); // Col 2:14 ESV verbatim
  });

  it('a returning reader who already had the earlier seeds STILL sees the new card (merge path, on the surface)', async () => {
    // Simulate a device seeded before this teaching existed: the earlier seven,
    // minus the conditional-truth theme, already persisted for this identity.
    const older = SEED_THEMES.filter((t) => !t.title.toLowerCase().includes('conditional truth'));
    const stale = { ...emptyStudy(), entries: older.map((t, i) => normalizeEntry({ ...t, seed: true }, 1, i)) };
    saveStudy(EMAIL, stale);

    await mount();
    // Without mergeMissingSeeds this assertion fails — seedIfEmpty would leave the
    // returning reader on the old seven and the new teaching would be invisible.
    expect(container.textContent).toMatch(/Conditional truth/i);
  });
});
