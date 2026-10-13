// @vitest-environment node
// =============================================================================
// scripture-chronology — the years are the WORD'S years, and the sums are OURS
// =============================================================================
// Two failure modes, two gates. (1) A quoted figure that drifts from the verse
// that states it — caught by re-reading the in-repo KJV corpus for every quote.
// (2) Arithmetic that claims more than the stated numbers support — caught by
// re-deriving the spine here instead of trusting the module's own output.
// Plus the honesty invariants: stated vs computed never blur, and the two real
// forks name BOTH sides (DR-0281 — the 400/430 collapse this repo has shipped
// once already and now gates against).
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import {
  GENESIS_5_CHAIN, GENESIS_11_CHAIN, FLOOD_AT_NOAHS_AGE, CHRONOLOGY_MARKERS,
  FORKS, CHRONOLOGY_LIMITS, annoMundiSpine, floodYearAM, markersForEpoch,
  allChronologyQuotes,
} from '../lib/scripture-chronology.js';
import { TIMELINE_EPOCHS } from '../lib/biblical-timeline.js';

const here = dirname(fileURLToPath(import.meta.url));
const IDX = JSON.parse(readFileSync(join(here, '../lib/bible-kjv-index.json'), 'utf8'));
const byName = new Map(IDX.map((b) => [b.name.toLowerCase(), b.file]));

function corpusText(ref) {
  const m = ref.match(/^((?:[1-3]\s)?[A-Za-z ]+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!m) return null;
  const [, book, ch, v1, v2] = m;
  const file = byName.get(book.toLowerCase().trim());
  if (!file) return null;
  const data = JSON.parse(readFileSync(join(here, `../../public/bible/kjv/${file}.json`), 'utf8'));
  const chapter = data.chapters[+ch - 1];
  if (!chapter) return null;
  const out = [];
  for (let v = +v1; v <= +(v2 || v1); v += 1) {
    if (chapter[v - 1] == null) return null;
    out.push(chapter[v - 1]);
  }
  return out.join(' ');
}

const norm = (s) => String(s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();

describe('every quoted figure is KJV-verbatim from the in-repo corpus (DR-0076)', () => {
  it.each(allChronologyQuotes())('$ref matches the corpus exactly', ({ ref, text }) => {
    const actual = corpusText(ref);
    expect(actual, `${ref} not found in corpus`).toBeTruthy();
    expect(norm(text)).toBe(norm(actual));
  });
});

describe('the arithmetic is re-derived, not trusted', () => {
  it('the flood year is the Genesis 5 chain plus Noah’s 600 — independently summed here', () => {
    const expected = [130, 105, 90, 70, 65, 162, 65, 187, 182].reduce((a, b) => a + b, 0) + 600;
    expect(floodYearAM()).toBe(expected);
    expect(expected).toBe(1656);
  });

  it('every chain age in the module matches the number written in its own verse', () => {
    // The KJV spells numbers out, so assert the digits are backed by the words.
    const WORDS = {
      130: 'an hundred and thirty', 105: 'an hundred and five', 90: 'ninety', 70: 'seventy',
      65: 'sixty and five', 162: 'an hundred sixty and two', 187: 'an hundred eighty and seven',
      182: 'an hundred eighty and two', 100: 'an hundred', 35: 'five and thirty', 30: 'thirty',
      34: 'four and thirty', 32: 'two and thirty', 29: 'nine and twenty',
    };
    for (const link of [...GENESIS_5_CHAIN, ...GENESIS_11_CHAIN]) {
      expect(WORDS[link.age], `no word-form pinned for ${link.age}`).toBeTruthy();
      expect(norm(link.text).toLowerCase(), `${link.ref} must contain "${WORDS[link.age]}"`).toContain(WORDS[link.age]);
    }
    expect(norm(FLOOD_AT_NOAHS_AGE.text).toLowerCase()).toContain('six hundred years old');
  });

  it('the spine rises monotonically and lands the flood at its computed year', () => {
    const spine = annoMundiSpine();
    for (let i = 1; i < spine.length; i += 1) {
      expect(spine[i].am, `${spine[i].event} must not go backwards`).toBeGreaterThanOrEqual(spine[i - 1].am);
    }
    expect(spine.find((s) => s.event.startsWith('The flood')).am).toBe(floodYearAM());
  });

  it('Arphaxad is timed from the FLOOD, not from his father’s running total', () => {
    const spine = annoMundiSpine();
    expect(spine.find((s) => s.event.startsWith('Arphaxad')).am).toBe(floodYearAM() + 2);
  });

  it('the spine stops at Terah — it does not compute past the fork', () => {
    const spine = annoMundiSpine();
    expect(spine[spine.length - 1].event).toContain('Terah');
    expect(spine.some((s) => /Abram/.test(s.event))).toBe(false);
  });
});

describe('stated and computed are never blurred', () => {
  it('every marker is labeled "stated" and carries a real verse', () => {
    for (const m of CHRONOLOGY_MARKERS) {
      expect(m.kind, `${m.id}`).toBe('stated');
      expect(m.ref).toBeTruthy();
      expect(m.text).toBeTruthy();
    }
  });

  it('every running total is labeled computed, never quoted as Scripture', () => {
    for (const s of annoMundiSpine().filter((x) => x.event !== 'Adam — the beginning of the counted record')) {
      expect(s.kind).toBe('computed');
    }
  });

  it('the limits refuse absolute BC dates and refuse to date the end', () => {
    expect(CHRONOLOGY_LIMITS.noAbsoluteDates).toMatch(/reconstruction/i);
    expect(CHRONOLOGY_LIMITS.theEndIsUndated).toMatch(/Acts 1:7/);
    expect(CHRONOLOGY_LIMITS.computedNotQuoted).toMatch(/computed/i);
  });
});

describe('the forks name BOTH sides (DR-0281)', () => {
  it('each fork carries a question, at least two sides, and what each rests on', () => {
    expect(FORKS.length).toBeGreaterThanOrEqual(2);
    for (const f of FORKS) {
      expect(f.question).toBeTruthy();
      expect(f.sides.length).toBeGreaterThanOrEqual(2);
      for (const s of f.sides) {
        expect(s.reading).toBeTruthy();
        expect(s.restsOn).toBeTruthy();
      }
      expect(f.effect).toBeTruthy();
    }
  });

  it('the Egypt fork names the AFFLICTION and the SOJOURNING as different measures', () => {
    const egypt = FORKS.find((f) => f.id === 'four-hundred-vs-four-thirty');
    const all = JSON.stringify(egypt).toLowerCase();
    expect(all).toContain('afflict');
    expect(all).toContain('sojourn');
    expect(all).toContain('400');
    expect(all).toContain('430');
  });

  it('the 400 and 430 markers are carried separately, each with its own verse', () => {
    const four = CHRONOLOGY_MARKERS.find((m) => m.id === 'affliction-400');
    const fourThirty = CHRONOLOGY_MARKERS.find((m) => m.id === 'sojourning-430');
    expect(four.ref).toBe('Genesis 15:13');
    expect(fourThirty.ref).toBe('Exodus 12:40');
    expect(four.label.toLowerCase()).toContain('affliction');
    expect(fourThirty.label.toLowerCase()).toContain('sojourning');
  });
});

describe('the chronology binds to the real timeline', () => {
  it('every marker points at an epoch that actually exists (no dead refs)', () => {
    const ids = new Set(TIMELINE_EPOCHS.map((e) => e.id));
    for (const m of CHRONOLOGY_MARKERS) {
      expect(ids.has(m.epochId), `${m.id} -> unknown epoch "${m.epochId}"`).toBe(true);
    }
  });

  it('the record runs from the beginning of counted time through to Revelation', () => {
    const refs = CHRONOLOGY_MARKERS.map((m) => m.ref);
    expect(refs.some((r) => r.startsWith('Genesis'))).toBe(true);
    expect(refs.some((r) => r.startsWith('Revelation'))).toBe(true);
    expect(markersForEpoch('eternity').length).toBeGreaterThan(0);
  });
});
