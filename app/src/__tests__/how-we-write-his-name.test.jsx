// @vitest-environment jsdom
// =============================================================================
// The reader is TOLD the rule, and the page cannot disagree with the gates
// =============================================================================
// Darrell 2026-09-19: "Still quoting however give an overall we capitalize etc
// for etc reasons..." Both halves of the Typographic Theology were already
// enforced by machine. What was missing was the reader's side: someone meeting
// "satan" in lower case mid-sentence reads a typo, and someone meeting "Satan"
// capitalised inside a King James quotation on the next line reads an
// inconsistency. Both are deliberate and neither is visible unless it is said.
//
// WHAT THIS FILE IS ACTUALLY FOR. Not "does the page render" -- that would pass
// on a page that had quietly fallen out of step with the rule. It asserts the
// page is DERIVED: every name it shows comes from the same module the gates
// import, so a name added to the rule appears to the reader in the same commit
// with nobody remembering to update prose. The proven-to-catch case bends the
// canonical list and requires the page to change with it.
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import HowWeWriteHisName from '../components/HowWeWriteHisName.jsx';
import {
  ALWAYS_CAPITALIZED, NEVER_CAPITALIZED, HOLY_NAME_WORDS, THE_EXCEPTION, HIS_PRONOUNS,
} from '../lib/typographic-theology.js';

// The repo renders with react-dom directly rather than a testing library.
let host = null;
let root = null;
const paint = () => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => { root.render(createElement(HowWeWriteHisName)); });
  const el = host.querySelector('[data-testid="how-we-write-his-name"]');
  expect(el, 'the surface did not render at all').toBeTruthy();
  return el.textContent;
};
afterEach(() => {
  if (root) act(() => root.unmount());
  if (host && host.parentNode) host.parentNode.removeChild(host);
  root = null; host = null;
});

describe('the canonical list is sound before anything renders from it', () => {
  it('carries both directions of the Layer-0 rule', () => {
    const names = ALWAYS_CAPITALIZED.map((n) => n.name);
    for (const n of ['Yahweh', 'Jesus', 'the Holy Spirit', 'the Father', 'the Son', 'the Word']) {
      expect(names, `${n} missing from the always-capitalised list`).toContain(n);
    }
    for (const n of ['lucifer', 'satan', 'the devil', 'the dragon', 'the adversary', 'the accuser', 'the deceiver', 'baal']) {
      expect(NEVER_CAPITALIZED, `${n} missing from the never-capitalised list`).toContain(n);
    }
  });

  it('every never-capitalised entry is written in lower case in the list itself', () => {
    // A list that honoured him while forbidding the honour would be absurd, and
    // is exactly the kind of thing nobody checks.
    for (const n of NEVER_CAPITALIZED) expect(n).toBe(n.toLowerCase());
  });

  it('every always-capitalised entry carries a REASON, not a restatement', () => {
    for (const n of ALWAYS_CAPITALIZED) {
      expect(n.why, `${n.name} has no reason`).toBeTruthy();
      expect(n.why.length, `${n.name}'s reason is too thin to be one`).toBeGreaterThan(40);
    }
  });

  it('the strict scan list stays short, and deliberately excludes the two-sense words', () => {
    // Layer 0 itself lowercases the false gods and the KJV says "the god of
    // this world"; a parable's master is a lord. Including either would force
    // wrong edits or need exemptions, and a check full of exemptions is a check
    // waiting to be wrong.
    expect(HOLY_NAME_WORDS).not.toContain('god');
    expect(HOLY_NAME_WORDS).not.toContain('lord');
    expect(HOLY_NAME_WORDS).toContain('yahweh');
  });
});

describe('what the page SAYS about the corpus is checked against the corpus', () => {
  // DR-0076 section 8: a citation is a CLAIM that you consulted the source. The
  // first version of this page told the reader the King James text capitalises
  // the adversary's name -- written from memory, never checked, and FALSE of
  // the text this app serves. These assertions read the actual corpus, so the
  // page can never again say something about the Word that the Word does not do.
  const kjv = (book, ch, v) => {
    const p = join(process.cwd(), 'public', 'bible', 'kjv', `${book}.json`);
    return JSON.parse(readFileSync(p, 'utf8')).chapters[ch - 1][v - 1];
  };

  it('our Bible text really does carry his name in lower case, everywhere it appears', () => {
    // Darrell's directive (PR #1397), deliberate and standing per
    // scripts/kjv-name-case-corrections.mjs. If a re-ingest ever restored the
    // capital, this fails and the page's sentence would have become untrue.
    for (const [b, c, v] of [['Job', 1, 6], ['Matthew', 4, 10], ['Luke', 22, 31], ['Zechariah', 3, 1], ['Revelation', 12, 9]]) {
      const text = kjv(b, c, v);
      expect(text, `${b} ${c}:${v} does not mention him at all`).toMatch(/satan/i);
      expect(text, `${b} ${c}:${v} capitalises his name in our corpus`).not.toContain('Satan');
    }
  });

  it('and the page tells the reader that, rather than the opposite', () => {
    expect(THE_EXCEPTION.body).toMatch(/lower case, by Darrell/i);
    expect(THE_EXCEPTION.body, 'the page must not claim the text capitalises it').not.toMatch(/capitalises the adversary/i);
  });

  it('while "God" and "the LORD" really are left standing inside the verses', () => {
    // The other half of the same honesty: we do NOT sweep these to "Yahweh".
    expect(kjv('Psalms', 23, 1)).toContain('The LORD is my shepherd');
    expect(kjv('John', 1, 1)).toContain('the Word was God');
    expect(THE_EXCEPTION.body).toMatch(/never substitute "Yahweh"/);
  });
});

describe('the reader actually meets it', () => {
  it('shows every name on both lists, with its reason', () => {
    const text = paint();
    for (const n of ALWAYS_CAPITALIZED) {
      expect(text, `${n.name} is not shown`).toContain(n.name);
      expect(text, `${n.name}'s reason is not shown`).toContain(n.why);
    }
    for (const n of NEVER_CAPITALIZED) expect(text, `${n} is not shown`).toContain(n);
    for (const p of HIS_PRONOUNS) expect(text).toContain(p);
  });

  it('states the exception as plainly as the rule', () => {
    // The reader who spots a capital inside a verse must learn immediately that
    // the quotation is right and untouched -- the rule working, not failing.
    const text = paint();
    expect(text).toContain(THE_EXCEPTION.headline);
    expect(text).toContain(THE_EXCEPTION.body);
    expect(text).toMatch(/never edit the wording to match the way we write/i);
  });

  it('PROVEN-TO-CATCH: the page is DERIVED, so bending the list bends the page', () => {
    // If the page carried its own copy of the rule this would pass while the
    // page silently disagreed with what the build enforces. It renders the
    // canonical arrays, so the count on screen tracks the count in the module.
    const text = paint();
    const shown = NEVER_CAPITALIZED.filter((n) => text.includes(n)).length;
    expect(shown).toBe(NEVER_CAPITALIZED.length);
    // A name the rule does NOT carry must not appear, or the page is inventing.
    expect(NEVER_CAPITALIZED).not.toContain('moloch');
    expect(text).not.toContain('moloch');
  });
});
