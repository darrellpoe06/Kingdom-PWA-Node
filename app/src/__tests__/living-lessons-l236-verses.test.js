// @vitest-environment node
//
// L236 — "The Bill You Cannot Read". Darrell forwarded a utility-trade
// newsletter into the app by email on 2026-10-08 with one word on top, Lesson,
// and his own teaching under it: owning solar panels rather than renting power,
// twenty years or less at two percent interest against an ever-increasing
// electric cost, and the clause he put last — there is risk in all things, and
// following His Wisdom is most important. An earlier lesson from that same
// email took up the ownership arithmetic and the risk. This one takes up the
// article that sat underneath it, which turns out to be step one of his own
// sum: a meter is a weight (Proverbs 16:11), a false balance touches Yahweh
// (Proverbs 11:1), a reckoning is meant to be legible at speed (Habakkuk 2:2),
// and you cannot count a cost you cannot read (Luke 14:28). The vendor survey
// figures in the article are named as that vendor's claim and never repeated as
// established fact (DR-0100); the interest rate, the payback period and the
// rate trend are held as assumptions and nothing is promised. DR-0860.
//
// Every double-quoted span must be verbatim KJV from the in-repo corpus under a
// STRICT comparison: whitespace normalised ONLY, never apostrophes (the corpus
// carries curly ones) and never case. DR-0076. The last block proves the
// comparison can fail — an altered word, a straightened apostrophe and a
// changed case must each be rejected, or every green here is theatre.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { proseWords, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { ourProseOnly, fleschKincaidGrade, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { hasAllThreeEverywhere, placesMissingDirections } from '../lib/talk-together.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');

const ID = 'll236-the-bill-you-cannot-read-honest-weights-a-plain-reckoning-and-whose-wisdom-governs-the-meter';
const L = LIVING_LESSONS_MODULES.find((m) => m.id === ID);
const BANDS = ['child', 'youth', 'teen', 'senior'];

const chapters = {};
for (const f of readdirSync(KJV)) {
  chapters[f.replace(/\.json$/, '').toLowerCase()] = JSON.parse(readFileSync(join(KJV, f), 'utf8')).chapters;
}
// WHITESPACE ONLY. Not apostrophes (the corpus uses curly ones and a straight
// one is a real difference), not case, not punctuation.
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const bookKey = (name) => String(name).replace(/\s+/g, '').toLowerCase();
const flow = (name, ch) => {
  const c = chapters[bookKey(name)];
  if (!c) return null;
  const v = c[Number(ch) - 1];
  return v ? norm(v.join(' ')) : null;
};

const FLAT = [];
(function flatten(node, path) {
  if (typeof node === 'string') { FLAT.push([path, node]); return; }
  if (Array.isArray(node)) { node.forEach((v, i) => flatten(v, `${path}[${i}]`)); return; }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) flatten(v, path ? `${path}.${k}` : k);
  }
}(L, ''));

const SPAN_WITH_REF = /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+)\s+(\d+):([\d\-,\s]+)\)/g;
const ALL_SPANS = /"[^"]+"/g;
const band = (b) => String(L.levels[b]);
const grown = `${L.lesson} ${band('teen')} ${band('senior')}`;

// The spine every band carries, verbatim-gated below.
const EVERY_BAND = [
  'Proverbs 16:11', 'Proverbs 11:1', 'Proverbs 20:10', 'Leviticus 19:36',
  'Deuteronomy 25:15', 'Micah 6:11', 'Habakkuk 2:2', 'Luke 16:2', 'Luke 16:10',
  'Luke 16:11', 'Luke 14:28', 'Proverbs 24:27', 'Proverbs 27:1',
  'Proverbs 22:7', 'Psalms 118:8', 'Psalms 24:1', 'Romans 12:17',
  'Proverbs 15:22', 'Proverbs 28:20', 'Proverbs 2:6',
  'Deuteronomy 6:7', 'Proverbs 27:17',
];
// The rest of the spine, carried by the lesson and the grown bands.
const GROWN = [
  '(Proverbs 20:23)', '(Amos 8:5)', '(Micah 6:10)', '(Proverbs 18:13)',
  '(Proverbs 14:15)', '(Proverbs 27:12)', '(Proverbs 21:5)', '(Proverbs 3:5)',
  '(2 Corinthians 8:21)', '(James 1:5)', '(Proverbs 23:23)', '(Proverbs 13:16)',
  '(Malachi 4:6)',
];

describe('L236 exists and is whole', () => {
  it('is registered with its own id and title', () => {
    expect(L).toBeTruthy();
    expect(L.title).toBe('The Bill You Cannot Read — Honest Weights, a Plain Reckoning, and Whose Wisdom Governs the Meter');
  });

  it('carries all four bands, a quiz, benefits and facilitator notes', () => {
    for (const b of BANDS) expect(typeof L.levels[b]).toBe('string');
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(9);
    expect(L.benefits.length).toBeGreaterThanOrEqual(10);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    for (const q of L.quiz.questions) {
      expect(q.options.length).toBe(3);
      expect(q.options[q.answer]).toBeTruthy();
      expect(q.explain.length).toBeGreaterThan(40);
    }
  });

  it('every band carries the FULL message, measured against the adult prose', () => {
    const adult = proseWords(L.lesson);
    expect(adult).toBeGreaterThan(1000);
    for (const b of BANDS) {
      const ratio = proseWords(L.levels[b]) / adult;
      expect(ratio, `${b} ratio ${ratio.toFixed(3)}`).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
    }
  });

  it('the reading ladder rises across all four bands and the child band clears the NEW-lesson ceiling', () => {
    const fk = {};
    for (const b of BANDS) fk[b] = fleschKincaidGrade(ourProseOnly(L.levels[b]));
    expect(fk.child, `child ${fk.child.toFixed(2)}`).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    expect(fk.child, `child ${fk.child.toFixed(2)} youth ${fk.youth.toFixed(2)}`).toBeLessThanOrEqual(fk.youth);
    expect(fk.youth, `youth ${fk.youth.toFixed(2)} teen ${fk.teen.toFixed(2)}`).toBeLessThanOrEqual(fk.teen);
    expect(fk.teen, `teen ${fk.teen.toFixed(2)} senior ${fk.senior.toFixed(2)}`).toBeLessThanOrEqual(fk.senior);
  });

  it('every band names its own lesson near the start', () => {
    expect(unnamedBands(L)).toEqual([]);
  });

  it('the lesson and every band send the reader to someone: parents to children, children to parents, friend to friend (DR-0733)', () => {
    expect(placesMissingDirections(L)).toEqual([]);
    expect(hasAllThreeEverywhere(L)).toBe(true);
  });

  it('says where it came from: an email forwarded on 2026-10-08 with one word on top', () => {
    const where = `${L.bigIdea} ${L.lesson}`;
    expect(where).toMatch(/2026-10-08/);
    expect(where).toMatch(/forwarded/);
    expect(where).toMatch(/one word on top, Lesson/);
  });

  it('recites no decision record by id inside the reader-facing prose', () => {
    for (const [path, text] of FLAT) expect(text, `${path} recites a DR id`).not.toMatch(/\bDR-\d{4}\b/);
  });
});

describe('L236 — every quoted span is the Word, verbatim, with its reference', () => {
  it('no quoted span anywhere in the lesson lacks a reference', () => {
    let quoted = 0; let referenced = 0;
    for (const [, text] of FLAT) {
      quoted += (text.match(ALL_SPANS) || []).length;
      referenced += [...text.matchAll(SPAN_WITH_REF)].length;
    }
    expect(quoted).toBeGreaterThan(150);
    expect(quoted - referenced, `${quoted - referenced} unreferenced span(s)`).toBe(0);
  });

  it('every referenced span is verbatim in the KJV corpus, strictly', () => {
    const bad = [];
    let checked = 0;
    for (const [path, text] of FLAT) {
      for (const m of text.matchAll(SPAN_WITH_REF)) {
        checked += 1;
        const [, span, book, ch] = m;
        const f = flow(book, ch);
        if (!f) { bad.push(`${path}: no such book ${book}`); continue; }
        if (!f.includes(norm(span))) bad.push(`${path}: ${book} ${ch} — ${norm(span).slice(0, 70)}`);
      }
    }
    expect(checked).toBeGreaterThan(150);
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('no quotation is elided — a span is one contiguous run of the verse (DR-0459)', () => {
    for (const [path, text] of FLAT) {
      for (const m of text.matchAll(SPAN_WITH_REF)) {
        expect(m[1], `${path} elides a quotation`).not.toMatch(/\.\.\.|…|\[/);
      }
    }
  });

  it("DARRELL'S OWN WORDS are never dressed as Scripture", () => {
    const his = ['solar panel', 'night and day', 'His Wisdom is most important', 'risk in all things', 'two percent'];
    const offences = [];
    for (const [path, text] of FLAT) {
      for (const span of text.match(ALL_SPANS) || []) {
        const inner = norm(span).replace(/^"|"$/g, '').toLowerCase();
        for (const phrase of his) if (inner.includes(phrase.toLowerCase())) offences.push(`${path}: ${phrase}`);
      }
    }
    expect(offences, offences.join('\n')).toEqual([]);
  });

  it('Yahweh in our voice, never the generic name outside a quotation (DR-0210)', () => {
    for (const [path, text] of FLAT) {
      const ours = ourProseOnly(text).replace(/\((?:[1-3] )?[A-Za-z]+ \d+:[\d\-,]+\)/g, '');
      expect(ours, `${path} uses the generic name in our voice`).not.toMatch(/\bGod\b/);
    }
  });

  it('the adversary is never capitalised as a name (Layer 0)', () => {
    for (const [path, text] of FLAT) {
      expect(text, `${path} capitalises an adversary name`).not.toMatch(/\b(Satan|Lucifer|The Devil|The Adversary|The Accuser|The Deceiver|Baal)\b/);
    }
  });

  it('anchor.ref names every verse the lesson stands on, and nothing it does not teach (DR-0734)', () => {
    const taught = new Set();
    for (const [, text] of FLAT) {
      for (const m of text.matchAll(SPAN_WITH_REF)) taught.add(`${m[2]} ${m[3]}:${m[4]}`.replace(/\s+/g, ' ').trim());
    }
    const listed = L.anchor.ref.split(';').map((x) => x.trim()).filter(Boolean);
    expect(new Set(listed).size, 'a reference is listed twice').toBe(listed.length);
    expect(listed.filter((r) => !taught.has(r)), 'listed but never taught').toEqual([]);
    expect([...taught].filter((r) => !listed.includes(r)), 'taught but not listed').toEqual([]);
  });

  it('the anchor theme is itself verbatim Word', () => {
    const theme = String(L.anchor.theme);
    const spans = [...theme.matchAll(SPAN_WITH_REF)];
    expect(spans.length).toBeGreaterThanOrEqual(4);
    for (const m of spans) expect(flow(m[2], m[3])).toContain(norm(m[1]));
  });
});

describe('L236 — the whole spine, in every band', () => {
  it('every band carries every reference of the spine', () => {
    const missing = [];
    for (const b of BANDS) for (const r of EVERY_BAND) if (!band(b).includes(`(${r})`)) missing.push(`${b}: ${r}`);
    expect(missing, missing.join('\n')).toEqual([]);
  });

  it('the lesson carries every reference of the spine too', () => {
    const missing = EVERY_BAND.filter((r) => !L.lesson.includes(`(${r})`));
    expect(missing, missing.join('\n')).toEqual([]);
  });

  it('the grown bands carry the rest', () => {
    const missing = GROWN.filter((r) => !grown.includes(r));
    expect(missing, missing.join('\n')).toEqual([]);
  });

  it('carries its two stories, one light and one solemn, each a parable labelled as one (DR-0855)', () => {
    const st = (L.stories || []).filter((s) => s.kind === 'parable' || s.kind === 'testimony');
    expect(st.length).toBeGreaterThanOrEqual(2);
    expect(new Set(st.map((s) => s.tone))).toEqual(new Set(['light', 'solemn']));
  });

  it('every band teaches that the scale itself is His, so a bent measure touches Him', () => {
    for (const b of BANDS) {
      expect(band(b), `${b}`).toMatch(/all the weights of the bag are his work\." \(Proverbs 16:11\)/);
      expect(band(b), `${b}`).toMatch(/A false balance is abomination to the LORD: but a just weight is his delight\." \(Proverbs 11:1\)/);
    }
  });

  it('every band teaches that a reckoning is meant to be plain, and that you cannot count what you cannot read', () => {
    for (const b of BANDS) {
      expect(band(b), `${b}`).toMatch(/make it plain upon tables, that he may run that readeth it\." \(Habakkuk 2:2\)/);
      expect(band(b), `${b}`).toMatch(/counteth the cost, whether he have sufficient to finish it\?" \(Luke 14:28\)/);
    }
  });

  it('every band names the one number an ownership decision starts from, and where it lives', () => {
    for (const b of BANDS) expect(band(b), `${b}`).toMatch(/your own bill|on your bill/i);
  });

  it('the survey figures are named as the publisher’s own claim, never as established fact (DR-0100)', () => {
    for (const place of [L.lesson, band('youth'), band('teen'), band('senior')]) {
      expect(place).toMatch(/sponsored|seller's own|own numbers|own figures|its claim/);
      expect(place).toMatch(/method|questionnaire|sample/);
    }
    expect(L.lesson).toMatch(/does not vouch for a single percentage/);
  });

  it('the economics are held as assumptions and nothing is promised', () => {
    for (const place of [L.lesson, band('child'), band('youth'), band('teen'), band('senior')]) {
      expect(place).toMatch(/assumption|guess|not promises|forecast/i);
    }
    expect(L.lesson).toMatch(/It argues against promising\./);
    expect(L.lesson).toMatch(/This lesson will not promise it/);
  });

  it('the standard is turned back on our own billing of anyone else', () => {
    for (const b of BANDS) expect(band(b), `${b}`).toMatch(/Provide things honest in the sight of all men\." \(Romans 12:17\)/);
  });
});

// ── PROVEN-TO-CATCH (DR-0076 §3) ────────────────────────────────────────────
// A gate that always passes is itself a lie. Each case below takes a real span
// from this lesson and breaks exactly one thing; the comparison must reject it.
describe('the verbatim comparison can fail', () => {
  const verbatim = (span, book, ch) => {
    const f = flow(book, ch);
    return !!f && f.includes(norm(span));
  };

  it('accepts the real spans it is pointed at (otherwise every catch below is theatre)', () => {
    expect(verbatim('A false balance is abomination to the LORD: but a just weight is his delight.', 'Proverbs', 11)).toBe(true);
    expect(verbatim('A just weight and balance are the LORD’s: all the weights of the bag are his work.', 'Proverbs', 16)).toBe(true);
    expect(verbatim('Write the vision, and make it plain upon tables, that he may run that readeth it.', 'Habakkuk', 2)).toBe(true);
  });

  it('rejects an altered word', () => {
    expect(verbatim('A false balance is abomination to the LORD: but a just scale is his delight.', 'Proverbs', 11)).toBe(false);
    expect(verbatim('Write the vision, and make it clear upon tables, that he may run that readeth it.', 'Habakkuk', 2)).toBe(false);
  });

  it('rejects a straightened apostrophe — the corpus carries the curly one', () => {
    expect(verbatim("A just weight and balance are the LORD's: all the weights of the bag are his work.", 'Proverbs', 16)).toBe(false);
    expect(verbatim("The earth is the LORD's, and the fulness thereof", 'Psalms', 24)).toBe(false);
    expect(verbatim('The earth is the LORD’s, and the fulness thereof', 'Psalms', 24)).toBe(true);
  });

  it('rejects changed case', () => {
    expect(verbatim('A false balance is abomination to the Lord: but a just weight is his delight.', 'Proverbs', 11)).toBe(false);
    expect(verbatim('a false balance is abomination to the LORD: but a just weight is his delight.', 'Proverbs', 11)).toBe(false);
  });

  it('rejects an elided quotation stitched from two ends of a verse', () => {
    expect(verbatim('A false balance is abomination to the LORD: a just weight is his delight.', 'Proverbs', 11)).toBe(false);
  });

  it('still accepts a span whose only difference is collapsed whitespace', () => {
    expect(verbatim('A false  balance is abomination to the LORD:   but a just weight is his delight.', 'Proverbs', 11)).toBe(true);
  });

  it('rejects a span attributed to the wrong chapter', () => {
    expect(verbatim('A false balance is abomination to the LORD: but a just weight is his delight.', 'Proverbs', 12)).toBe(false);
  });
});
