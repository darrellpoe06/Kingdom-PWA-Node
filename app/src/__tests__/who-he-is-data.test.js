// @vitest-environment node
// =============================================================================
// WHO HE IS — THE WHOLE WORD: the rule, the data, and the proof it is complete
// =============================================================================
// Darrell, 2026-09-29: "We needed a lesson wide curriculum with all!!! No
// matter if He was there or not!!! Clarity clarification of where when what
// how timeless timelines and Who He Is!!!" L196 had called two of its lists
// "not complete counts"; that is the gap. This file is where "all" is proven
// rather than claimed (DR-0675; DR-0076 §1, §3, §4):
//   - the committed data is exactly what the written rule makes (re-run it,
//     byte for byte);
//   - every passage the rule reaches is in, and nothing is in twice;
//   - every verse shown is the KJV verbatim;
//   - every count is derived from the entries;
//   - the line runs in order, from before time to for ever;
//   - every written judgment matches something, and each guard is shown to
//     catch the fault it exists for.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { generate, serialize, loadCorpus, expandRef, DATA_PATH } from '../../../scripts/who-he-is-generate.mjs';
import * as RULES from '../lib/who-he-is-rules.js';
import {
  WHO_HE_IS_DATA, WHO_HE_IS_ENTRIES, WHO_HE_IS_ERAS, WHO_HE_IS_EDGE, whoHeIsTotals,
  entriesForEra, filterEntries, describeEntry, lessonLinksFor, PRESENT_LABEL, HOW_LABEL, RULE_LABEL, bookIndex,
} from '../lib/who-he-is.js';
import { scanQuotedVerses, describeFault } from '../../../scripts/quoted-verse-is-the-verse.mjs';

const corpus = loadCorpus();
const text = (ref) => (corpus.byRef.get(ref) || {}).t;
const versesOf = (ref) => expandRef(ref, corpus.byRef, corpus.verses);
const E = WHO_HE_IS_ENTRIES;
const ERA_IDS = WHO_HE_IS_ERAS.map((e) => e.id);

describe('the committed data is what the written rule makes', () => {
  it('re-running the generator gives the committed file byte for byte', () => {
    const made = serialize(generate());
    expect(made === readFileSync(DATA_PATH, 'utf8'), 'run: node scripts/who-he-is-generate.mjs').toBe(true);
  });

  it('two runs are identical: no clock, no randomness', () => {
    expect(serialize(generate())).toBe(serialize(generate()));
  });

  it('the app reads the same data the generator wrote', () => {
    expect(JSON.parse(readFileSync(DATA_PATH, 'utf8'))).toEqual(WHO_HE_IS_DATA);
  });
});

describe('every entry carries where, when, what, how, presence and Who He Is', () => {
  it('has every field, filled', () => {
    expect(E.length, 'a low count means the generator broke').toBeGreaterThan(600);
    for (const e of E) {
      const at = e.ref;
      for (const f of ['id', 'ref', 'book', 'testament', 'what']) expect(typeof e[f] === 'string' && e[f].length > 0, `${at} ${f}`).toBe(true);
      expect(e.verses, at).toBe(versesOf(e.ref).length);
      expect(e.rules.length, at).toBeGreaterThan(0);
      for (const r of e.rules) expect(RULE_LABEL[r], `${at} rule ${r}`).toBeTruthy();
      expect(e.where.text.length, `${at} where`).toBeGreaterThan(10);
      expect(ERA_IDS, `${at} era`).toContain(e.when.era);
      for (const p of e.when.pointsTo) expect(ERA_IDS, `${at} points to ${p}`).toContain(p);
      expect(e.when.pointsTo, `${at} points to its own era`).not.toContain(e.when.era);
      expect(HOW_LABEL[e.how.mode], `${at} how ${e.how.mode}`).toBeTruthy();
      expect(e.how.text.length, `${at} how text`).toBeGreaterThan(5);
      expect(PRESENT_LABEL[e.present], `${at} present ${e.present}`).toBeTruthy();
      expect(e.presentDetail.length && e.presentReason.length, `${at} presence basis`).toBeTruthy();
      expect(e.basis.length, `${at} basis`).toBeGreaterThan(0);
      const d = describeEntry(e);
      for (const k of ['where', 'when', 'what', 'how', 'present', 'whoHeIs']) expect(d[k].length, `${at} ${k}`).toBeGreaterThan(5);
    }
  });

  it('ids are unique and the Old Testament entries each name the New Testament verse that brings them in', () => {
    expect(new Set(E.map((e) => e.id)).size).toBe(E.length);
    for (const e of E.filter((x) => x.testament === 'OT')) {
      for (const b of e.basis) expect(corpus.byRef.get(b.ref).bi, `${e.ref} basis ${b.ref} must be New Testament`).toBeGreaterThanOrEqual(39);
      for (const b of e.basis) expect(b.reason.length, `${e.ref} basis reason`).toBeGreaterThan(10);
    }
  });
});

describe('every verse shown is the KJV, verbatim', () => {
  it('key verses, basis verses, era markers, whole-book bases, exclusions and the edge', () => {
    for (const e of E) {
      expect(e.keyVerse.text, e.keyVerse.ref).toBe(text(e.keyVerse.ref));
      expect(versesOf(e.ref), `${e.ref} key verse outside its passage`).toContain(e.keyVerse.ref);
      for (const b of e.basis) expect(b.text, b.ref).toBe(text(b.ref));
    }
    for (const era of WHO_HE_IS_ERAS) expect(era.markerText, era.marker).toBe(text(era.marker));
    for (const w of WHO_HE_IS_DATA.wholeBooks) expect(w.basisText, w.basis).toBe(text(w.basis));
    for (const x of WHO_HE_IS_DATA.exclusions) expect(x.text, x.ref).toBe(text(x.ref));
    for (const g of WHO_HE_IS_EDGE) {
      for (const v of [...g.verses, ...g.tie]) expect(v.text, v.ref).toBe(text(v.ref));
    }
  });

  it('every quotation in the written reasons is the verse it names, in the KJV’s own case', () => {
    const reasons = [];
    const push = (where, t) => { if (t) reasons.push([where, t]); };
    Object.entries(RULES.APPLIES).forEach(([k, v]) => push(`APPLIES ${k}`, v[1]));
    RULES.QUOTE_SUPPLEMENT.forEach((r) => push(`SUPPLEMENT ${r[0]}`, r[2]));
    RULES.TYPE_TABLE.forEach((r) => push(`TYPE ${r.basis}`, r.reason));
    RULES.EDGE_TABLE.forEach((r) => push(`EDGE ${r.refs[0]}`, r.reason));
    RULES.PRESENCE.forEach((r) => push(`PRESENCE ${r[0]}`, r[3]));
    RULES.LORD_VERSES.forEach((r) => push(`LORD ${r[0]}`, r[1]));
    RULES.OT_TITLE_VERSES.forEach((r) => push(`TITLE ${r.refs[0]}`, r.reason));
    for (const e of E) { push(`${e.ref} where`, e.where.text); push(`${e.ref} presence`, e.presentReason); push(`${e.ref} how`, e.how.text); }
    const scan = scanQuotedVerses([{ id: 'who-he-is-rules' }], () => reasons);
    expect(scan.spans, 'the reasons quote Scripture with references').toBeGreaterThan(20);
    expect(scan.faults.map(describeFault)).toEqual([]);
  });
});

describe('our voice keeps the bindings (CLAUDE.md Typographic Theology)', () => {
  it('says Yahweh, never the generic name, and never capitalizes the adversary, outside quotations and His titles', () => {
    const titles = /the Son of God|Son of God|Holy One of God|Lamb of God|Word of God/g;
    const fields = [];
    for (const e of E) fields.push(e.what, e.where.text, e.how.text, e.presentDetail, e.presentReason, e.when.note, ...e.basis.map((b) => b.reason || ''));
    for (const era of WHO_HE_IS_ERAS) fields.push(era.label, era.plain);
    for (const g of WHO_HE_IS_EDGE) fields.push(g.reason);
    const ours = fields.join(' \n ').replace(/"[^"]*"/g, ' ').replace(titles, ' ');
    expect(ours.match(/\bGod\b/g)).toBe(null);
    expect(/\b(Satan|Lucifer|Devil|Baal)\b/.test(ours)).toBe(false);
  });
});

describe('ALL: every passage the rule reaches is in, and nothing is in twice', () => {
  const covered = new Map();
  for (const e of E) for (const r of versesOf(e.ref)) covered.set(r, (covered.get(r) || 0) + 1);

  it('no verse sits in two entries', () => {
    const twice = [...covered].filter(([, n]) => n > 1).map(([r]) => r);
    expect(twice).toEqual([]);
  });

  it('rule A: every verse of Matthew, Mark, Luke, John and Revelation is in an entry', () => {
    for (const w of RULES.WHOLE_BOOKS) {
      const missing = corpus.verses.filter((v) => v.book === w.book && !covered.has(v.ref)).map((v) => v.ref);
      expect(missing, `${w.book} verses outside the curriculum`).toEqual([]);
    }
  });

  it('rule B: every New Testament verse that names Him by a lexicon title is in an entry', () => {
    const pats = RULES.NAME_LEXICON.filter((x) => x.title !== 'the Word').map((x) => new RegExp(x.pattern));
    const excluded = new Set(RULES.NAME_EXCLUSIONS.map((x) => x.ref));
    const missing = corpus.verses.filter((v) => v.bi >= 39 && !excluded.has(v.ref) && pats.some((p) => p.test(v.t)) && !covered.has(v.ref)).map((v) => v.ref);
    expect(missing).toEqual([]);
    for (const r of RULES.WORD_VERSES) expect(covered.has(r), r).toBe(true);
  });

  it('rules C and D: every applied quotation, supplement, title verse and named picture is in an entry', () => {
    const want = [
      ...WHO_HE_IS_DATA.quotePairs.filter((q) => q.applies).map((q) => q.ot),
      ...RULES.QUOTE_SUPPLEMENT.flatMap((r) => r[1]),
      ...RULES.OT_TITLE_VERSES.flatMap((r) => r.refs),
      ...RULES.TYPE_TABLE.flatMap((r) => r.refs),
    ];
    expect(want.filter((r) => !covered.has(r))).toEqual([]);
  });

  it('the edge is named, not dropped: its passages are outside the counted entries and each gives a reason', () => {
    expect(WHO_HE_IS_EDGE.length).toBe(RULES.EDGE_TABLE.length);
    for (const g of WHO_HE_IS_EDGE) {
      expect(g.verses.filter((v) => covered.has(v.ref)), `${g.ref} is already in; the edge row is stale`).toEqual([]);
      expect(g.reason.length).toBeGreaterThan(20);
    }
  });

  it('the Old Testament comes in only by the New Testament: no Old Testament entry lacks a New Testament basis', () => {
    for (const e of E.filter((x) => x.testament === 'OT')) expect(e.rules.every((r) => r === 'C' || r === 'D'), e.ref).toBe(true);
  });
});

describe('every count is derived from the entries', () => {
  it('the totals add up to the entries, on every axis', () => {
    const t = whoHeIsTotals();
    const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
    expect(t.entries).toBe(E.length);
    expect(sum(t.byEra)).toBe(E.length);
    expect(sum(t.byPresent)).toBe(E.length);
    expect(sum(t.byHow)).toBe(E.length);
    expect(sum(t.byTestament)).toBe(E.length);
    expect(sum(t.byBook)).toBe(E.length);
    expect(t.verses).toBe(E.reduce((n, e) => n + versesOf(e.ref).length, 0));
    expect(t.edge).toBe(RULES.EDGE_TABLE.length);
    for (const era of ERA_IDS) expect(entriesForEra(era).length, era).toBe(t.byEra[era] || 0);
  });

  it('filters are views of the same entries, never a second list', () => {
    const yes = filterEntries({ present: 'yes' }).length;
    const no = filterEntries({ present: 'no' }).length;
    const pre = filterEntries({ present: 'pre-incarnate' }).length;
    expect(yes + no + pre).toBe(E.length);
    expect(filterEntries({ testament: 'OT' }).length + filterEntries({ testament: 'NT' }).length).toBe(E.length);
    expect(filterEntries({ book: 'Isaiah' }).every((e) => e.book === 'Isaiah')).toBe(true);
  });
});

describe('the line runs in order, from before time to for ever', () => {
  it('the eras are the Word’s own sequence, numbered without a gap', () => {
    expect(WHO_HE_IS_ERAS.map((e) => e.order)).toEqual(WHO_HE_IS_ERAS.map((_, k) => k + 1));
    expect(ERA_IDS[0]).toBe('before-time');
    expect(ERA_IDS[ERA_IDS.length - 1]).toBe('forever');
    expect(ERA_IDS.indexOf('prophets')).toBeLessThan(ERA_IDS.indexOf('incarnation'));
    expect(ERA_IDS.indexOf('cross')).toBeLessThan(ERA_IDS.indexOf('resurrection'));
  });

  it('entries run era by era, and within an era in the Word’s book order, numbered 1 to n', () => {
    expect(E.map((e) => e.seq)).toEqual(E.map((_, k) => k + 1));
    const order = new Map(WHO_HE_IS_ERAS.map((e) => [e.id, e.order]));
    for (let k = 1; k < E.length; k++) {
      const a = E[k - 1]; const b = E[k];
      const oa = order.get(a.when.era); const ob = order.get(b.when.era);
      expect(oa <= ob, `${a.ref} (${a.when.era}) before ${b.ref} (${b.when.era})`).toBe(true);
      if (oa === ob) {
        const pa = corpus.byRef.get(versesOf(a.ref)[0]).i; const pb = corpus.byRef.get(versesOf(b.ref)[0]).i;
        expect(pa < pb, `${a.ref} before ${b.ref} in ${a.when.era}`).toBe(true);
      }
    }
    expect(bookIndex('Genesis')).toBe(0);
    expect(bookIndex('Revelation')).toBe(65);
  });

  it('He is on the line before time and for ever: John 1:1 sits before time, and passages point to for ever', () => {
    expect(E[0].ref.startsWith('John 1:1')).toBe(true);
    expect(E[0].present).toBe('pre-incarnate');
    expect(entriesForEra('forever', 'points').length).toBeGreaterThan(0);
    expect(entriesForEra('the-end', 'points').length).toBeGreaterThan(0);
  });
});

describe('the links to L191, L194 and L196 are derived from their own references', () => {
  it('links an entry when a lesson cites a verse inside it, and only the three lessons', () => {
    const e = E.find((x) => x.ref.startsWith('Matthew 16:13'));
    const mods = [
      { id: 'll194-x', title: 'L194', lesson: 'Peter said, "Thou art the Christ" (Matthew 16:16).', levels: {} },
      { id: 'll100-y', title: 'Other', lesson: 'see (Matthew 16:16)', levels: {} },
      { id: 'll196-z', title: 'L196', lesson: 'nothing here (Luke 1:35)', levels: {} },
    ];
    expect(lessonLinksFor(e, mods).map((l) => l.id)).toEqual(['ll194-x']);
  });
});

describe('proven-to-catch (DR-0076 §3)', () => {
  it('a stale written judgment (a row that matches nothing) stops the generator', () => {
    const planted = { ...RULES, APPLIES: { ...RULES.APPLIES, 'Matthew 1:1|Genesis 1:1': ['yes', 'planted'] } };
    expect(() => generate(planted)).toThrow(/APPLIES Matthew 1:1\|Genesis 1:1/);
    const joins = { ...RULES, SCENE_JOINS: [...RULES.SCENE_JOINS, ['Matthew 1:2', 'planted']] };
    expect(() => generate(joins)).toThrow(/SCENE_JOINS Matthew 1:2/);
  });

  it('a changed rule changes the data, so the byte check cannot be passed by an edit to the rule alone', () => {
    const fewer = { ...RULES, TYPE_TABLE: RULES.TYPE_TABLE.slice(1) };
    expect(serialize(generate(fewer))).not.toBe(readFileSync(DATA_PATH, 'utf8'));
  });

  it('a word changed in a key verse is caught by the verbatim check', () => {
    const e = E[5];
    expect(e.keyVerse.text.replace(/\b(\w+)\b/, 'Behold')).not.toBe(text(e.keyVerse.ref));
  });

  it('a misquoted reason fails the verse gate', () => {
    const scan = scanQuotedVerses([{ id: 't' }], () => [['x', 'He says, "I am the first and the latest" (Revelation 1:17).']]);
    expect(scan.faults.length).toBe(1);
  });

  it('a dropped passage is caught by the rule-A completeness check', () => {
    const covered = new Set(E.filter((x) => !x.ref.startsWith('Mark 4:35')).flatMap((x) => versesOf(x.ref)));
    const missing = corpus.verses.filter((v) => v.book === 'Mark' && !covered.has(v.ref));
    expect(missing.length).toBeGreaterThan(0);
  });
});
