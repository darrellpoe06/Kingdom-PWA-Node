// =============================================================================
// The sweep asks the ledger twice (2026-10-29, DR-1288)
// =============================================================================
// MEASURED, twice in one night, both times after a builder had done most of a
// lesson's work. `lesson-row-shipped-sweep.mjs` asks the ledger ONE question:
// does any decision record name this row id.
//
//   1a10bf98e21775dd -> sov55 / DR-1273. The id check catches this one. It was
//                       never run; the backlog was built from a Gmail search.
//   1a112049320caa4a -> L213 / DR-0763, which names its source in PROSE --
//                       "a Big Think piece by Dirk Schulze-Makuch and Tony
//                       Reichhardt, 'The leading theory of how life began just
//                       hit a snag'" -- and writes the thread id NOWHERE.
//                       `grep -c` for that id on that record is 0. The sweep
//                       answered `unknown`, correctly about the id and wrongly
//                       about the teaching.
//
// L213 had itself run a one-teaching check before shipping, by ANCHORS: "no
// lesson in any catalog anchors on Hebrews 11:3, Romans 1:20 or Genesis 1:1".
// So two sound checks existed and a teaching walked between them, because
// neither asked the question the other answered.
//
// THE SECOND QUESTION IS CHEAP: does any record TALK ABOUT this subject. What
// makes it usable rather than noise is that rarity is WEIGHTED, not counted --
// see the test below that measures what counting would have done.
import { describe, it, expect } from 'vitest';
import {
  sweep, anyShipped, readLedger, subjectWords, sweepSubject,
  SUBJECT_STOPWORDS, RARITY_BAR, COMMON_SHARE, MIN_ID,
} from '../../../scripts/lesson-row-shipped-sweep.mjs';

const LIVE = readLedger();

// The thread and subject that defeated the single-question sweep.
const L213_THREAD = '1a112049320caa4a';
const L213_SUBJECT = 'The leading theory of how life began just hit a snag';

const rec = (dr, text) => ({ dr, file: `${dr}-x.md`, text });

describe('the id question still answers exactly as it did', () => {
  it('a thread a record names is SHIPPED, and one none names is unknown', () => {
    const shipped = sweep(['1a10bf98e21775dd'], LIVE);
    expect(anyShipped(shipped)).toBe(true);
    expect(shipped.get('1a10bf98e21775dd').drs).toContain('DR-1273');
    expect(shipped.get('1a10bf98e21775dd').exact).toBe(true);
  });

  it('the defect is that DR-0763 never writes the id, and that is what is pinned', () => {
    // THIS ASSERTION USED TO READ `anyShipped(sweep([L213_THREAD])) === false`
    // -- the sweep is blind to this thread -- and DR-1288 BROKE IT, because
    // DR-1288 names the thread in its own table of what went wrong. Writing the
    // record closed the hole for this one thread.
    //
    // That is worth more than the assertion it replaced. Pinning "the sweep
    // cannot see this" pinned a SYMPTOM that any later record mentioning the
    // id would erase. The cause is that the record which BUILT the teaching
    // does not name its source by id, and that is still true and still the
    // reason the second question has to exist. It is also the whole premise of
    // the sequenced other half: make records name their thread, and the id
    // check stops having holes -- demonstrated here by accident, on itself.
    const built = LIVE.find((r) => r.dr === 'DR-0763');
    expect(built, 'DR-0763 must be in the ledger for this to measure anything').toBeTruthy();
    expect(built.text, 'the record that built L213 names its source in prose, not by id')
      .not.toContain(L213_THREAD);
    expect(built.text, 'and it does name the source in prose, which is what the subject probe reads')
      .toMatch(/snag/i);
    // So an id-only sweep, given only that record, is blind to the teaching.
    const idOnly = sweep([L213_THREAD], [built]);
    expect(anyShipped(idOnly), 'the id question cannot answer from the record that built it').toBe(false);
  });

  it('it still refuses a prefix too short to search safely', () => {
    expect(() => sweep(['abc'], LIVE)).toThrow(/too short/);
    expect(MIN_ID).toBe(8);
  });

  it('the ledger it reads is genuinely the ledger', () => {
    // Anti-vacuity: every measurement below is a share of this number.
    expect(LIVE.length).toBeGreaterThan(900);
  });
});

describe('the subject question, and why it weighs rarity instead of counting', () => {
  it('a subject line keeps only its content words', () => {
    const w = subjectWords("FW: The catch behind GPT-6's new calculators");
    expect(w).toContain('catch');
    expect(w).toContain('behind');
    expect(w).toContain('calculators');
    expect(w).not.toContain('the');   // stopword
    expect(w).not.toContain('new');   // stopword
    expect(w).not.toContain('fw');    // forward marker
    expect(SUBJECT_STOPWORDS.has('lessons')).toBe(true); // his own marker word
  });

  it('PROVEN TO CATCH on the LIVE ledger: the subject that slipped past the id check names DR-0763', () => {
    const { hits, words } = sweepSubject(L213_SUBJECT, LIVE);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].dr, 'the record that built this teaching must rank first').toBe('DR-0763');
    // And it ranks first for a readable reason: the rare word carries it.
    const snag = words.find((w) => w.word === 'snag');
    expect(snag.records, 'snag is rare, which is what makes it evidence').toBeLessThan(10);
    expect(hits[0].words).toContain('snag');
  });

  it('PROVEN TO CATCH the design error: counting words instead of weighing them floods the result', () => {
    // MEASURED on the live ledger when this probe counted shared words at >= 2:
    // DR-0763 was named AND six unrelated records with it, because `leading`
    // (36 records) and `theory` (18) both sat under the common ceiling. Seven
    // hits per probe is the crying-wolf failure, and the caller learns to skip
    // the check. Dropping the bar to near-zero reproduces that flood; the real
    // bar does not.
    const flooded = sweepSubject(L213_SUBJECT, LIVE, { rarityBar: 0.0001 });
    const focused = sweepSubject(L213_SUBJECT, LIVE, { rarityBar: RARITY_BAR });
    expect(flooded.hits.length).toBeGreaterThan(focused.hits.length + 2);
    expect(focused.hits.length).toBeLessThanOrEqual(3);
    // Both must still find the one that matters — the fix narrowed the noise,
    // not the signal.
    expect(flooded.hits.map((h) => h.dr)).toContain('DR-0763');
    expect(focused.hits.map((h) => h.dr)).toContain('DR-0763');
  });

  it('a word carried by much of the ledger is worth nothing, however long', () => {
    const ledger = [...Array(100)].map((_, i) => rec(`DR-${1000 + i}`, 'everywhere'));
    const { words } = sweepSubject('everywhere', ledger);
    expect(words[0].records).toBe(100);
    expect(words[0].distinctive, 'a word in every record cannot distinguish anything').toBe(false);
    expect(words[0].weight).toBe(0);
    expect(COMMON_SHARE).toBeLessThan(0.1);
  });

  it('one genuinely rare word is enough, and a pile of common ones is not', () => {
    const ledger = [
      ...[...Array(60)].map((_, i) => rec(`DR-${2000 + i}`, 'common frequent ordinary')),
      rec('DR-3001', 'quadrotriticale'),
      rec('DR-3002', 'common frequent ordinary'),
    ];
    const { hits } = sweepSubject('quadrotriticale common frequent ordinary', ledger);
    expect(hits.map((h) => h.dr), 'the rare word qualifies its record alone').toEqual(['DR-3001']);
  });

  it('a subject with nothing to say produces nothing, rather than a shrug', () => {
    expect(sweepSubject('', LIVE).hits).toEqual([]);
    expect(sweepSubject('of the and to', LIVE).words).toEqual([]);
    expect(sweepSubject('Zrinski quadrotriticale glockenspiel marzipan', LIVE).hits).toEqual([]);
  });

  it('every hit carries the words and the weight that earned it, so a reader can dismiss it', () => {
    // A probe that names a record without saying why is a probe people stop
    // reading. DR-0378 surfaces on this subject because it also contains the
    // word "snag" — a reader sees that in the output and dismisses it in a
    // moment, which is only possible because the reason is printed.
    const { hits } = sweepSubject(L213_SUBJECT, LIVE);
    for (const h of hits) {
      expect(h.words.length).toBeGreaterThan(0);
      expect(h.weight).toBeGreaterThanOrEqual(RARITY_BAR);
      expect(h.file).toMatch(/^DR-\d{4}/);
    }
  });
});
