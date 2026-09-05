// =============================================================================
// yahweh-by-century — the verification gate
// =============================================================================
// Built from Darrell's messages of 2026-09-05 asking for what Yahweh did that
// was NEW in each century, why it was needed, how it was/is/will be used, what
// ended, the with-Him / without-Him puzzle, the provisions and their absence,
// the promises and where they were kept, and the backward 100-year reference.
//
// PROVEN-TO-CATCH (DR-0076 §3). Each block below was run against a deliberately
// broken copy of the catalog before being committed:
//   * a single altered word in an inline quotation  -> the verbatim sweep fails
//   * a BC century written onto a word-clock entry  -> the dating gate fails
//   * a promise pointing at a ref that does not exist -> the ledger gate fails
//   * a post-canon entry claiming new revelation    -> the canon fence fails
//   * a mis-typed book name in any anchor           -> the corpus gate fails
// A gate that cannot fail is theatre; these were made to fail first.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CENTURIES, THREADS, CANON_FENCE, NEEDED_MEANS, DATING_TIERS, CENTURY_GRID,
  DEDUCTION_DOCTRINE, allCenturyRefs, centuriesByTier, promiseLedger,
  openPromises, afterCanonEntries, endedLedger, verseText,
} from '../lib/yahweh-by-century.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');
const src = readFileSync(join(HERE, '..', 'lib', 'yahweh-by-century.js'), 'utf8');

const books = readdirSync(KJV_DIR).filter((f) => f.endsWith('.json') && f !== 'index.json');
const chaptersOf = (file) => JSON.parse(readFileSync(join(KJV_DIR, `${file}.json`), 'utf8')).chapters;

const WHOLE_KJV = (() => {
  let all = '';
  for (const f of books) {
    let j;
    try { j = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8')); } catch { continue; }
    if (!j || !Array.isArray(j.chapters)) continue;
    for (const ch of j.chapters) all += `${ch.join('\n')}\n`;
  }
  return all;
})();

// The catalog is JavaScript, so a quotation may be wrapped across comment
// lines. Normalize the wrap before checking, then compare against the corpus.
const normalized = src.replace(/\\'/g, "'").replace(/\n\s*\/\/\s*/g, ' ');

// Quotations in the module that are NOT Scripture and must not be checked
// against the corpus: Darrell's own spoken words, our own field labels and
// emphasis, and named non-biblical ancient sources. Every entry here is
// deliberate — the sweep below fails on anything not on this list.
const NOT_SCRIPTURE = [
  'Research what Yahweh has done in each century',
  'why it was needed and how it was is and will be used',
  "if it wasn't in this century then etc",
  'so like a puzzle look at historical events',
  'provisions and without etc',
  'promises that were fulfilled etc',
  'Century by century',
  'Why it was needed',
  'why it was needed',
  'we can deduce that the 100 years are backwards compatible for reference',
  'We acknowledge that the lack of knowledge is real',
  'however we can deduct and use that type of knowledge',
  'Spoken Teachings Are Build Input',
  'subconscious',
  'through all the family times up and down',
  'House of David',           // Tel Dan Stele
  'like a bird in a cage',    // Sennacherib Prism
  'the brother of Jesus who was called Christ', // Josephus, Antiquities XX.200
  'as to a god',              // Pliny, Letters X.96
  'what is newly revealed',
  'what was delivered, and is it copied faithfully',
];

describe('every quotation in the module is KJV-verbatim from the in-repo corpus (DR-0076)', () => {
  it('has balanced quotation marks', () => {
    const count = (normalized.match(/"/g) || []).length;
    expect(count % 2, 'an unbalanced quotation mark would silently shift every span after it').toBe(0);
  });

  it('every quoted span is either in the corpus verbatim or a declared non-Scripture quotation', () => {
    const at = [...normalized.matchAll(/"/g)].map((m) => m.index);
    const misses = [];
    for (let i = 0; i + 1 < at.length; i += 2) {
      const span = normalized.slice(at[i] + 1, at[i + 1]);
      // Our own ellipses and em-dash joins stitch separate verse fragments.
      for (const raw of span.split(/\.\.\.|\s—\s|\s\|\s/)) {
        const s = raw.trim().replace(/^[,;:]\s*/, '').replace(/[.,;:!?]+$/, '');
        if (s.length < 12) continue;
        if (WHOLE_KJV.includes(s)) continue;
        if (NOT_SCRIPTURE.some((n) => s.includes(n) || n.includes(s))) continue;
        misses.push(s);
      }
    }
    expect(misses, `quotation(s) not found verbatim in the KJV corpus:\n${misses.join('\n')}`).toEqual([]);
  });

  it('every reference the module names resolves to real KJV text', () => {
    const refs = allCenturyRefs();
    expect(refs.length).toBeGreaterThan(200);
    const empty = refs.filter((r) => !verseText(r));
    expect(empty, `reference(s) with no materialized verse text: ${empty.join(', ')}`).toEqual([]);
  });

  it('the materialized verse text matches the corpus verse for verse', () => {
    const bad = [];
    for (const ref of allCenturyRefs()) {
      const m = /^((?:[123]\s)?[A-Za-z][A-Za-z ]*?)\s+(\d+):(\d+)$/.exec(ref);
      expect(m, `unparseable reference in the catalog: ${ref}`).toBeTruthy();
      let file = m[1].replace(/\s+/g, '');
      if (file === 'Psalm') file = 'Psalms';
      const verse = chaptersOf(file)[Number(m[2]) - 1]?.[Number(m[3]) - 1];
      if (verse !== verseText(ref)) bad.push(ref);
    }
    expect(bad, `materialized text drifted from the corpus for: ${bad.join(', ')}`).toEqual([]);
  });
});

describe('the three dating tiers stay honest (DR-0076 / DR-0100)', () => {
  it('no word-clock entry ever prints a BC century', () => {
    const offenders = centuriesByTier()['word-clock']
      .filter((c) => /\b\d{1,4}\s?BC\b/.test(c.era) || /^\s*\d{1,2}(st|nd|rd|th) century BC/.test(c.when));
    expect(
      offenders.map((c) => c.id),
      'Scripture assigns no BC date to the early record; printing one would over-claim',
    ).toEqual([]);
  });

  it('word-clock entries that give a computed position say so explicitly', () => {
    for (const c of centuriesByTier()['word-clock']) {
      if (/\d\s?BC\b/.test(c.when)) {
        expect(c.when, `${c.id} names BC without marking it computed`).toMatch(/[Cc]omputed reference position/);
      }
    }
  });

  it('every entry declares a tier the module defines', () => {
    for (const c of CENTURIES) expect(Object.keys(DATING_TIERS)).toContain(c.tier);
  });

  it('the backward grid shows its work and names its forks', () => {
    expect(CENTURY_GRID.anchors.length).toBeGreaterThanOrEqual(4);
    expect(CENTURY_GRID.worked.length).toBeGreaterThanOrEqual(3);
    for (const w of CENTURY_GRID.worked) {
      expect(w.stated, 'a worked deduction must cite the verse stating the interval').toMatch(/\d+:\d+/);
      expect(w.computed.length).toBeGreaterThan(40);
      expect(w.fork.length).toBeGreaterThan(10);
    }
    expect(CENTURY_GRID.honestLimit).toMatch(/stops/);
  });

  it('deduction is held as valid AND its limit is held as real', () => {
    expect(DEDUCTION_DOCTRINE.gapIsReal).toBeTruthy();
    expect(DEDUCTION_DOCTRINE.deductionIsValid).toBeTruthy();
    expect(DEDUCTION_DOCTRINE.refusalIsAlsoError, 'under-claiming is a failure too (DR-0100)').toMatch(/humility|withholds/);
    expect(DEDUCTION_DOCTRINE.precedent).toMatch(/Daniel 9:2/);
  });
});

describe('the canon fence — providence is never dressed as revelation', () => {
  it('post-canon entries are marked and are all AD', () => {
    const after = afterCanonEntries();
    expect(after.length).toBeGreaterThanOrEqual(6);
    for (const c of after) {
      expect(c.tier, `${c.id} sits after the canon and must be documented history`).toBe('documented');
      expect(c.when, `${c.id} must be an AD span`).toMatch(/AD/);
    }
  });

  it('no post-canon entry claims a new revelation', () => {
    for (const c of afterCanonEntries()) {
      const firsts = (c.firsts || []).join(' ');
      expect(
        /new revelation|newly revealed|revealed to us|God told/i.test(firsts),
        `${c.id} must not present providence as new revelation`,
      ).toBe(false);
    }
  });

  it('the first century is the last entry carrying firsts of revelation', () => {
    const idx = CENTURIES.findIndex((c) => c.id === 'ad-first-century');
    expect(idx).toBeGreaterThan(0);
    for (const c of CENTURIES.slice(0, idx)) expect(c.afterCanon).not.toBe(true);
    for (const c of CENTURIES.slice(idx + 1)) expect(c.afterCanon).toBe(true);
  });

  it('"why it was needed" never implies a lack in Yahweh', () => {
    expect(NEEDED_MEANS.rule).toMatch(/never a need in Yahweh/);
    expect(NEEDED_MEANS.anchors).toContain('Acts 17:25');
  });

  it('the fence itself states where revelation stops and what continues', () => {
    expect(CANON_FENCE.rule, 'the deposit is delivered, not still arriving')
      .toMatch(/once delivered/);
    expect(CANON_FENCE.rule, 'post-canon entries are documented history')
      .toMatch(/DOCUMENTED HISTORY/);
    expect(CANON_FENCE.rule, 'and are never dressed as a new word')
      .toMatch(/never presented as a new word/);
    expect(CANON_FENCE.whatContinues, 'what DOES continue is named, not left implied')
      .toMatch(/Hebrews 1:1-2/);
    // The fence must cite the texts it rests on, and each must resolve.
    expect(CANON_FENCE.anchors).toContain('Jude 1:3');
    expect(CANON_FENCE.anchors).toContain('Revelation 22:18');
    for (const ref of CANON_FENCE.anchors) {
      expect(verseText(ref), `the canon fence cites ${ref} with no corpus text`).toBeTruthy();
    }
  });
});

describe('Darrell’s eight questions are answered by EVERY entry', () => {
  it('each entry carries firsts, why, then/now/will, ended, provision, both readings and the piece', () => {
    for (const c of CENTURIES) {
      expect(Array.isArray(c.firsts) && c.firsts.length > 0, `${c.id}: firsts`).toBe(true);
      for (const key of ['whyNeeded', 'usedThen', 'usedNow', 'willBeUsed', 'ended', 'provision', 'withoutProvision', 'withoutHim', 'withHim', 'piece']) {
        expect(typeof c[key], `${c.id}: ${key} missing`).toBe('string');
        expect(c[key].length, `${c.id}: ${key} is too thin to be an answer`).toBeGreaterThan(40);
      }
      const counterfactual = c.ifNotThisCentury || c.ifNotThisEra;
      expect(counterfactual, `${c.id}: the "if it wasn't in this century" answer is missing`).toBeTruthy();
      expect(counterfactual.length).toBeGreaterThan(40);
    }
  });

  it('the without-Him reading is a fair account, never a strawman', () => {
    // A fair account names real evidence: sources, disciplines or documented
    // mechanisms. An entry whose without-Him column is only dismissal fails.
    const weak = CENTURIES.filter((c) => c.withoutHim.length < 120);
    expect(weak.map((c) => c.id), 'a one-line dismissal is not the ordinary historical account').toEqual([]);
  });

  it('every entry is read BOTH ways, and the piece names what the first reading leaves open', () => {
    for (const c of CENTURIES) {
      expect(c.withHim.length, `${c.id}: withHim`).toBeGreaterThan(60);
      expect(c.piece.length, `${c.id}: piece`).toBeGreaterThan(80);
    }
  });
});

describe('the promise ledger — made here, kept there, or still open', () => {
  const ledger = promiseLedger();

  it('has promises spanning the whole record', () => {
    expect(ledger.length).toBeGreaterThanOrEqual(20);
    expect(new Set(ledger.map((p) => p.madeIn)).size).toBeGreaterThanOrEqual(10);
  });

  it('every promise cites a real verse where it was MADE', () => {
    for (const p of ledger) {
      expect(p.made, `promise in ${p.madeIn} has no "made" reference`).toMatch(/\d+:\d+/);
      expect(verseText(p.made), `no corpus text for ${p.made}`).toBeTruthy();
    }
  });

  it('every FULFILLED promise points at a real verse or a labelled historical fulfilment', () => {
    for (const p of ledger) {
      if (p.status === 'outstanding' || p.status === 'in-progress') {
        expect(p.fulfilled, `${p.made} is open and must not claim a fulfilment`).toBe('');
        continue;
      }
      if (p.status === 'kept-continuously') { expect(p.fulfilledIn).toBe('ongoing'); continue; }
      if (p.status === 'fulfilled-in-history') {
        expect(p.note, 'a historical fulfilment must say it is history, not a verse').toMatch(/history|documented/i);
        continue;
      }
      expect(verseText(p.fulfilled), `no corpus text for the fulfilment ref ${p.fulfilled}`).toBeTruthy();
    }
  });

  it('what is STILL OPEN is stated as plainly as what was kept', () => {
    const open = openPromises();
    expect(open.length, 'the return and the completion are not yet fulfilled and must say so').toBeGreaterThanOrEqual(3);
    expect(open.some((p) => p.made === 'Acts 1:11' || p.made === 'John 14:3')).toBe(true);
    expect(open.some((p) => p.made === 'Matthew 24:14')).toBe(true);
  });

  it('no entry anywhere in the module prints a date for the return (Acts 1:7; Matthew 24:36)', () => {
    expect(/the end will come in \d{4}|return in \d{4}|by the year \d{4}/i.test(src)).toBe(false);
  });
});

describe('what ENDED is carried beside what began', () => {
  it('the ended ledger names real closures', () => {
    const ended = endedLedger();
    expect(ended.length).toBeGreaterThanOrEqual(10);
    const all = ended.map((e) => e.ended).join(' ');
    expect(all, 'the sacrificial system ended and did not resume').toMatch(/sacrific/i);
    expect(all, 'the prophetic voice ceased before the silence').toMatch(/[Pp]rophecy ceased|prophetic voice/);
  });
});

describe('the four spoken teachings of 2026-09-05 are carried, not summarised away', () => {
  const byId = Object.fromEntries(THREADS.map((t) => [t.id, t]));

  it('all four threads are present with Darrell’s own words preserved', () => {
    for (const id of ['the-normal', 'integrity-cannot-be-faked', 'blind-until', 'the-wilderness']) {
      expect(byId[id], `thread ${id} missing`).toBeTruthy();
      expect(byId[id].spoken.length, `${id}: his words must be kept verbatim`).toBeGreaterThan(40);
      expect(byId[id].anchors.length).toBeGreaterThanOrEqual(8);
    }
  });

  it('THE NORMAL says the firsts are repair and the goal is the ordinary walk', () => {
    const t = byId['the-normal'];
    expect(t.teaching).toMatch(/REPAIR, not the goal/);
    expect(t.teaching).toContain('walking in the garden in the cool of the day');
    expect(t.whyItMatters, 'love cannot be compelled — that is why the history looks like this').toMatch(/cannot produce love|freely given/);
    expect(t.andThisToo, 'He is not lacking — the invitation is INTO existing fellowship').toMatch(/not lonely and He is not lacking/);
    expect(t.andHisWont).toContain('And a stranger will they not follow');
  });

  it('INTEGRITY names the instrument, the division, and the WHY', () => {
    const t = byId['integrity-cannot-be-faked'];
    expect(t.teaching).toContain('piercing even to the dividing asunder of soul and spirit');
    expect(t.teaching, 'Jesus made the same division in person').toContain('This people honoureth me with their lips, but their heart is far from me');
    expect(t.whyItMatters, 'the WHY is the covenant change').toMatch(/Jeremiah 31:33/);
    expect(t.honestNote, '"subconscious" is a modern pointer, not a biblical term').toMatch(/does not use the word/);
  });

  it('BLIND UNTIL fences the puzzle so it is offered, never brandished', () => {
    const t = byId['blind-until'];
    expect(t.teaching).toMatch(/UNTIL/);
    expect(t.teaching, 'the without-Him column is a condition, not a verdict').toMatch(/TEMPORARY condition/);
    expect(t.andThenTheyThrive).toMatch(/whereas I was blind, now I see/);
    expect(t.whyItMatters).toMatch(/teaching and gloating/);
  });

  it('THE WILDERNESS keeps the cost in the sentence rather than editing it out', () => {
    const t = byId['the-wilderness'];
    expect(t.teaching).toContain('to humble thee, and to prove thee, to know what was in thine heart');
    expect(t.heSaidItWouldCost).toContain('a man’s foes shall be they of his own household');
    expect(t.andWeStillLove, 'honour is not conditional on their conduct').toMatch(/not conditional/);
    expect(t.andWeStillLove).toMatch(/with persecutions/);
  });
});

describe('contested doctrine is deferred to the SME, never asserted (DR-0098)', () => {
  it('each possibilities block carries a plumb line, fair views, what stays open, and a confidence', () => {
    const withPoss = CENTURIES.filter((c) => c.possibilities);
    expect(withPoss.length).toBeGreaterThanOrEqual(2);
    for (const c of withPoss) {
      const p = c.possibilities;
      expect(p.question).toBeTruthy();
      expect(p.plumbLine.length).toBeGreaterThan(40);
      expect(p.views.length).toBeGreaterThanOrEqual(2);
      for (const v of p.views) expect(v.ties.length).toBeGreaterThan(30);
      expect(p.open).toBeTruthy();
      expect(p.confidence).toBeTruthy();
    }
  });

  it('the 1948 entry states the history and declines to assign the prophecy', () => {
    const c = CENTURIES.find((x) => x.id === 'ad-20th');
    expect(c.possibilities.confidence).toMatch(/SME/);
    expect(c.possibilities.plumbLine).toMatch(/not in dispute|documented/);
  });
});

describe('typographic theology holds in our own voice (CLAUDE.md)', () => {
  it('adversary and false-god names are never capitalized in our prose', () => {
    // Scripture quotations are exempt — the in-repo corpus already carries the
    // house lowercase, so a capitalized instance here would be OUR voice.
    for (const bad of ['Satan', 'Lucifer', 'Baal']) {
      expect(src.includes(bad), `${bad} must not be capitalized anywhere in this module`).toBe(false);
    }
  });

  it('Yahweh is named rather than defaulting to the generic in our own voice', () => {
    expect((src.match(/Yahweh/g) || []).length).toBeGreaterThan(15);
  });
});
