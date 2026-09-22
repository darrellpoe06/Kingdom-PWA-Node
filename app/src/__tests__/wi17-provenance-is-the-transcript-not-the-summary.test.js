// Issue 17 shipped on a SUMMARY. The speaker's own words arrived afterwards.
//
// DR-0555 shipped `wi-biology-walked-back-and-the-word-on-the-worlds` written
// from six summary blocks Darrell pasted, because youtube.com is blocked to CI
// and to this sandbox. It carried `re-review: 2026-10-20` for the day a
// transcript existed. That day came early: source-transcript-nas.yml ran green
// on 2026-09-22 and committed 9,927 words of auto-generated captions, fetched
// from the NAS's residential IP, to
// docs/99-session-notes/sources/denis-noble-misled-about-biology/transcript.txt.
//
// Re-checking the lesson against it held every attributed position AND corrected
// two places where the summary was thinner than the speaker:
//
//   1. THE SENSES. The summary said silicon "cannot see, feel, hear, or touch"
//      — four. The transcript has Noble asking FIVE, as five questions: "can it
//      see? ... feel? ... hear? ... touch? ... smell?" The dropped one is
//      SMELL, and smell is the very sense Psalms 115:6 denies an idol ("noses
//      have they, but they smell not"). The summary had quietly removed the
//      tightest point of contact between the claim and the Psalm the lesson is
//      built on. That is why this is a provenance gate and not a typo fix.
//   2. THE MONKEYS. The summary framed the calculation loosely. The transcript
//      has him naming the FINITE monkeys theorem, published by two
//      mathematicians about three years earlier, and citing it AGAINST a
//      19th-century assumption — so it is an argument he invokes, not one he
//      advances. The lesson now says so, which keeps the Tier-2 handling honest.
//
// These cases hold the upgrade in place. A future edit that reverts the lesson
// to the summary's four senses, or drops the transcript's path from the
// provenance note, fails here.

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { WORLD_ISSUES } from '../lib/world-issues-class.js';

const ISSUE = WORLD_ISSUES.find((x) => x.id === 'wi-biology-walked-back-and-the-word-on-the-worlds');
const TRANSCRIPT = resolve(__dirname, '../../../docs/99-session-notes/sources/denis-noble-misled-about-biology/transcript.txt');
const whole = JSON.stringify(ISSUE);

describe('issue 17 exists and its provenance names the transcript', () => {
  it('the issue is in the catalog', () => {
    expect(ISSUE).toBeTruthy();
  });

  it('the transcript is actually IN the repo — the note may not claim a file that is absent', () => {
    // The note asserts a path. An assertion about our own repo is the cheapest
    // possible thing to verify, so it is verified rather than trusted.
    expect(existsSync(TRANSCRIPT)).toBe(true);
    const t = readFileSync(TRANSCRIPT, 'utf8');
    expect(t.length).toBeGreaterThan(20000);
    expect(t).toMatch(/We have been misled for 80 years/);
  });

  it('source.note points at that exact path', () => {
    expect(ISSUE.source.note).toContain('docs/99-session-notes/sources/denis-noble-misled-about-biology/transcript.txt');
  });

  it('source.note still says the recording itself was not watched', () => {
    // The upgrade must not quietly become a claim we watched it.
    expect(ISSUE.source.note).toMatch(/has not been watched/);
  });

  it('source.note keeps BOTH remaining limits: machine hearing, and no timestamps', () => {
    expect(ISSUE.source.note).toMatch(/AUTO-GENERATED captions/);
    expect(ISSUE.source.note).toMatch(/machine’s hearing/);
    expect(ISSUE.source.note).toMatch(/not a warrant for putting any living man’s sentence inside quotation marks/);
    expect(ISSUE.source.note).toMatch(/cannot be cited to a minute mark|nothing here can be cited to a minute mark/);
  });
});

describe('the five senses, because the summary dropped the one that mattered most', () => {
  it('the lesson names all five, smell included', () => {
    expect(whole).toMatch(/touch or smell/);
  });

  it('the summary’s four-sense phrasing is GONE from the issue', () => {
    // This is the regression that would silently loosen the Psalm parallel.
    expect(whole).not.toMatch(/see, feel, hear, or touch\./);
    expect(whole).not.toMatch(/see, feel, hear or touch\./);
  });

  it('smell is in the transcript, which is why the correction is real and not a flourish', () => {
    const t = readFileSync(TRANSCRIPT, 'utf8').replace(/\s+/g, ' ');
    expect(t).toMatch(/[Cc]an it smell\?/);
    expect(t).toMatch(/[Cc]an it see\?/);
    expect(t).toMatch(/[Cc]an it touch\?/);
  });

  it('the reflection prompt points the reader at Psalms 115:6 for the smell overlap', () => {
    const prompts = JSON.stringify(ISSUE.reflection);
    expect(prompts).toMatch(/smell included \(verse 6\)/);
  });
});

describe('the finite monkeys theorem is attributed as he attributes it', () => {
  it('named as the FINITE theorem, published by two mathematicians, cited against a 19th-century assumption', () => {
    expect(whole).toMatch(/FINITE monkeys theorem/);
    expect(whole).toMatch(/two mathematicians published/);
    expect(whole).toMatch(/19th-century assumption/);
  });

  it('the transcript supports that attribution', () => {
    const t = readFileSync(TRANSCRIPT, 'utf8').replace(/\s+/g, ' ');
    expect(t).toMatch(/finite monkeys theorem/i);
    expect(t).toMatch(/[Tt]wo mathematicians did a calculation/);
  });

  it('it is still carried WITH its objection, never as a proof', () => {
    // Tier 2 discipline: selection is not a pure random search, and the lesson
    // must say so in the same breath or it hands a critic the easy win.
    const ids = (ISSUE.verifiable || []).map((v) => v.id);
    expect(ids).toContain('f-finite-monkeys-objection');
  });
});

describe('the disagreement is collegial, from the speaker’s own mouth', () => {
  it('the note records that he calls Dawkins his friend', () => {
    expect(ISSUE.source.note).toMatch(/my friend/i);
  });

  it('the transcript is where that comes from', () => {
    const t = readFileSync(TRANSCRIPT, 'utf8').replace(/\s+/g, ' ');
    expect(t).toMatch(/My friend Richard Dawkins/);
  });

  it('the grace note still names all four living men', () => {
    const g = ISSUE.lens.graceNote;
    for (const who of ['Noble', 'Dawkins', 'Metaxas', 'Collins']) {
      expect(g).toContain(who);
    }
  });
});
