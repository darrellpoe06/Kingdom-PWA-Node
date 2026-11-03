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

  it('it still refuses a prefix too short to search safely', () => {
    expect(() => sweep(['abc'], LIVE)).toThrow(/too short/);
    expect(MIN_ID).toBe(8);
  });

  it('the ledger it reads is genuinely the ledger', () => {
    // ANTI-VACUITY, and this assertion was deleted by accident once already:
    // a careless slice while rewriting the test above removed it along with the
    // short-prefix refusal, and `lint` caught the orphaned MIN_ID import rather
    // than any test noticing its own anti-vacuity guard had gone. Without this,
    // every rarity measurement below would pass on an empty ledger.
    expect(LIVE.length).toBeGreaterThan(900);
  });

  it('DR-0763 now names its thread id, and this assertion has been rewritten twice to say so', () => {
    // THIS ONE ASSERTION HAS BEEN WRITTEN THREE TIMES IN ONE SESSION, each time
    // because the thing it described stopped being true -- which is what a test
    // pinned to a defect rather than to a behaviour always does:
    //
    //   1. "the sweep is blind to this thread" -- broken by DR-1288 itself,
    //      which names the thread in its own table of what went wrong.
    //   2. "DR-0763's text does not contain the id" -- the CAUSE, which was the
    //      right thing to pin while it held, and broken by this commit
    //      recovering the id into that record.
    //   3. This: DR-0763 NAMES its thread id. That is the repair, it is
    //      durable, and a regression would be a record losing its provenance.
    //
    // The history stays in this comment because the lesson is about tests, not
    // about DR-0763: pin the behaviour you want, and keep the defect in prose.
    const built = LIVE.find((r) => r.dr === 'DR-0763');
    expect(built, 'DR-0763 must be in the ledger for this to measure anything').toBeTruthy();
    expect(built.text, 'the record that built L213 must name the thread it was built from')
      .toContain(L213_THREAD);
    // And the id question can now answer from that record alone, which is the
    // whole point of recovering it rather than widening a detector around it.
    expect(anyShipped(sweep([L213_THREAD], [built]))).toBe(true);
  });

  it('the subject probe stands on its own, not on DR-0763 being unfixed', () => {
    // The capability must not depend on one record's state. On a synthetic
    // ledger whose only record names its source in prose and no id, the id
    // question is blind and the subject question is not.
    const prose = [{
      dr: 'DR-9001',
      file: 'DR-9001-x.md',
      text: 'Grounds: forwarded by email, a Big Think piece titled "quadrotriticale harvests of Sherman" with no id anywhere.',
    }];
    expect(anyShipped(sweep(['1a99999999999999'], prose)), 'the id question cannot see it').toBe(false);
    const { hits } = sweepSubject('quadrotriticale harvests of Sherman', prose);
    expect(hits.map((h) => h.dr), 'the subject question can').toEqual(['DR-9001']);
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
