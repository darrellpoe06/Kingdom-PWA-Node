// =============================================================================
// The reader FOLLOWS on a page with no <main> — DR-0304
// =============================================================================
// Darrell 2026-08-14: "this page just reads without a reader highlighting the
// words and following the word we currently read... comprehensive review of the
// reader and pages to make sure it's working."
//
// The cause: `readablePageText()` fell back to `document.body` when a surface
// renders no <main>, but the FOLLOW MAP did not — it was built only when
// `querySelector('main')` returned an element and left null otherwise. Only six
// files in this app render a <main>. On every other surface the reader spoke
// the page perfectly and highlighted nothing, because there was no map to
// highlight from. Two halves of one feature reading off different roots.
//
// This is the same shape as SKIP_SELECTOR vs CHROME_SELECTOR (DR-0299) — two
// places that must agree, kept in agreement by nobody. So the last case here is
// DERIVED: it fails if ANY root lookup in TTSControl re-diverges, not only the
// three that were wrong today.
//
// PROVEN-TO-CATCH (DR-0076 §3): restoring `querySelector('main') || null` at
// any of the read paths fails the derived case; making `readingRoot` skip the
// body fallback fails the behavioural cases.
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readingRoot } from '../components/TTSControl.jsx';
import { buildFollowMap } from '../lib/read-follow.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(HERE, '../components/TTSControl.jsx'), 'utf8');

afterEach(() => { document.body.innerHTML = ''; });

describe('readingRoot — the one root both halves use', () => {
  it('prefers <main> when the surface has one', () => {
    document.body.innerHTML = '<main id="m"><p>Yahweh is my shepherd.</p></main>';
    expect(readingRoot().id).toBe('m');
  });

  it('falls back to body when the surface renders no <main>', () => {
    // This is the case that broke. Most surfaces in this app are here.
    document.body.innerHTML = '<div><p>Yahweh is my shepherd.</p></div>';
    expect(readingRoot()).toBe(document.body);
  });

  it('returns null with no document rather than throwing', () => {
    expect(readingRoot(null)).toBeNull();
  });
});

describe('a page with no <main> still produces a follow map', () => {
  it('maps its sentences, so the words can be highlighted', () => {
    document.body.innerHTML = `
      <div>
        <p>The Word of Yahweh is settled in heaven.</p>
        <p>His mercy endures for ever.</p>
      </div>`;
    const follow = buildFollowMap(readingRoot());
    expect(follow, 'no map means the reader speaks and highlights nothing').toBeTruthy();
    expect(follow.text).toContain('settled in heaven');
    expect(follow.text).toContain('endures for ever');
  });

  it('produces the same text the spoken extractor would speak', () => {
    // If these two ever diverge, the highlight lands on the wrong sentence —
    // follow-along is alignment-by-construction and depends on one root.
    document.body.innerHTML = '<div><p>One sentence here.</p><button>Read aloud</button></div>';
    const follow = buildFollowMap(readingRoot());
    expect(follow.text).toContain('One sentence here');
    // The button is chrome; it must not become part of the reading.
    expect(follow.text).not.toContain('Read aloud');
  });
});

// The class-level guard. Today three call sites were wrong; this fails if a
// fourth appears.
describe('no read path looks up the root on its own', () => {
  it('every <main> lookup outside readingRoot is gone', () => {
    const lines = SRC.split('\n');
    const offenders = [];
    lines.forEach((line, i) => {
      if (!line.includes("querySelector('main')")) return;
      // The definition itself, and prose explaining the bug, are allowed.
      const trimmed = line.trim();
      if (trimmed.startsWith('//')) return;
      if (trimmed.includes('doc.querySelector')) return;
      offenders.push(`${i + 1}: ${trimmed}`);
    });
    expect(
      offenders,
      `these lookups bypass readingRoot() and will drift from it:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('readingRoot is the exported single source', () => {
    expect(SRC).toMatch(/export function readingRoot\(/);
    expect(SRC).toMatch(/doc\.querySelector\('main'\) \|\| doc\.body \|\| null/);
  });
});
