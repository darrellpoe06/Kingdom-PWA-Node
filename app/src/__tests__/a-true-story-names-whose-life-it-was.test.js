// @vitest-environment node
// =============================================================================
// "A true story" names whose life it was (DR-0811, DR-0550, DR-1123)
// =============================================================================
// DR-0550's re-review, due today, asked for the lessons built from Darrell's
// lived accounts to be swept for other checkable details -- days, counts, names,
// places -- and for each to be put "in front of him rather than in front of a
// gate", because no test can know what day a rehearsal was. That stands, and the
// list is docs/99-session-notes/2026-10-20-whose-life-is-this.md.
//
// The sweep found something before it reached the days and counts. MEASURED
// 2026-10-20 on main 4ef997c44: 93 shipped `kind: 'testimony'` blocks, and FIVE
// carry a source -- all five Darrell's, all in living-lessons-class.js. The
// other 88 carry none. 52 are in the first person ("I found out what a deposit
// was the hard way"; "My father ran money out to men in our neighbourhood for
// thirty years") and 36 report an unnamed person ("A man who had lent four
// thousand pounds to a friend for a van said...").
//
// WHY THAT IS NOT A TIDINESS PROBLEM. story-truth.js renders a testimony with a
// footnote in words: "A true story: this happened, told with [source]'s
// consent." With no source it still says it, substituting "the person's" for a
// name. So the page tells a reader that a real person lived this and consented
// to its telling, while the data records neither who nor that they did.
// PARABLE-AND-TESTIMONY-METHOD.md: a testimony "Requires: it actually happened
// (no embellishment), explicit consent, privacy / minor protection", and "What a
// real person actually said or lived is a testimony with its source, or it stays
// out."
//
// WHAT THIS GATE DOES AND DOES NOT DECIDE. Whether a source EXISTS is
// structural: the method doc demands it and a machine can see it, so it is
// gated, pinned at the 88 that exist so no NINETIETH can land and the number can
// only fall. Whether any of the 88 is Darrell's account, someone else's, or
// written to teach is NOT a machine's call and is not guessed at here -- not one
// word of any story is changed by this commit. That is his, by DR-0550's own
// instruction, and the list is how it reaches him.
import { describe, it, expect } from 'vitest';

import {
  allTestimonies, unattributedTestimonies, storyBlocks, checkableDetails,
} from '../../../scripts/testimony-carries-its-source.mjs';
import { storyFootnote, storyHeading, storiesInSource } from '../lib/story-truth.js';

// Measured, not chosen. Lower it when a story gains its source; it may never rise.
const UNATTRIBUTED = 88;
const ATTRIBUTED = 5;

describe('what the page tells a reader about a story with no source', () => {
  it('claims it happened, and claims consent, naming nobody', () => {
    // The whole reason the count above is a defect and not an untidiness.
    const bare = { kind: 'testimony', title: 'Ten Days', body: 'I found out…' };
    expect(storyFootnote(bare)).toBe("A true story: this happened, told with the person's consent.");
    expect(storyHeading(bare)).toBe('A true story, lived — Ten Days');   // no "· source"
  });

  it('and names the person when the source is there, which is the pattern the 88 need', () => {
    const sourced = { kind: 'testimony', title: 'He Has Covered Me', source: 'Darrell Poe', body: 'x' };
    expect(storyFootnote(sourced)).toBe("A true story: this happened, told with Darrell Poe's consent.");
    expect(storyHeading(sourced)).toBe('A true story, lived — He Has Covered Me · Darrell Poe');
  });

  it('a parable makes no such claim, so the label is the whole difference', () => {
    expect(storyFootnote({ kind: 'parable', title: 'The Coat', body: 'x' })).toMatch(/not a record/);
    expect(storyFootnote({ kind: 'parable', title: 'The Coat', body: 'x' })).toMatch(/are not real/);
  });
});

describe('the count is measured, pinned, and open about itself', () => {
  it(`exactly ${UNATTRIBUTED} shipped true stories name no source`, () => {
    const bare = unattributedTestimonies();
    if (bare.length === UNATTRIBUTED) {
      expect(bare.length).toBe(UNATTRIBUTED);
      return;
    }
    const verdict = bare.length > UNATTRIBUTED
      ? `${bare.length} true stories name no source, pinned at ${UNATTRIBUTED} -- a NEW one landed. A testimony carries its source, or it is a parable (PARABLE-AND-TESTIMONY-METHOD).`
      : `${bare.length} true stories name no source, pinned at ${UNATTRIBUTED} -- one gained its source; lower the pin to ${bare.length} so the ledger stays true.`;
    expect(
      bare.slice(0, 12).map((b) => `${b.file}: ${b.title || '(untitled)'}`).join('\n'),
      verdict,
    ).toBe(`(expected exactly ${UNATTRIBUTED})`);
  });

  it(`the ${ATTRIBUTED} that DO name a source keep it`, () => {
    // Pinned in its own right: a source silently deleted is the same defect
    // arriving from the other direction, and the count above would not move.
    const sourced = allTestimonies().filter((b) => b.source.trim());
    expect(sourced).toHaveLength(ATTRIBUTED);
    for (const b of sourced) {
      expect(b.file, `${b.title} should be a Living Lesson`).toBe('living-lessons-class.js');
      expect(b.source, `${b.title} names no person`).toMatch(/Darrell Poe/);
    }
  });

  it('scans a real corpus, so a pass means something', () => {
    // Anti-theater (DR-0076 section 3). If the parse broke, every pin above
    // would pass on an empty list.
    expect(allTestimonies().length).toBe(UNATTRIBUTED + ATTRIBUTED);
    expect(allTestimonies().every((b) => b.body.trim().length > 40)).toBe(true);
  });
});

describe('the parse agrees with the one story-truth.js uses', () => {
  it('both find the same blocks in the same text, so they cannot drift apart', () => {
    // Two parsers reading one file differently is how a gate ends up guarding
    // something other than what the page renders.
    const src = `
      stories: [
        { kind: 'parable', tone: 'light', title: 'A', body: 'imagined' },
        { kind: 'testimony', tone: 'serious', title: 'B', body: 'lived', source: 'Someone' },
      ],`;
    const mine = storyBlocks(src);
    const theirs = storiesInSource(src);
    expect(mine.map((b) => [b.kind, b.title])).toEqual(theirs.map((b) => [b.kind, b.title]));
    expect(mine[1].source).toBe('Someone');     // and mine reads the field theirs does not
  });

  it('a code default is not a story, which is what put my first count one too high', () => {
    // perspectiveDraftFor() returns { kind: 'testimony', title: '', body: '',
    // source: '', consent: false } -- the empty form a member fills in. I counted
    // it as an eighty-ninth unattributed story until I opened the file.
    const draft = `return { kind: 'testimony', tone: 'solemn', title: '', verse: '', body: '', source: '', consent: false };`;
    expect(storyBlocks(draft)).toHaveLength(1);                 // the block is there
    expect(allTestimonies().some((b) => b.file === 'story-library.js')).toBe(false);
  });
});

describe('PROVEN-TO-CATCH, on the shapes a new story would actually arrive in', () => {
  const file = (body) => `stories: [{ kind: 'testimony', tone: 'serious', title: 'New', body: '${body}' }]`;

  it('a new true story with no source is seen', () => {
    const blocks = storyBlocks(file('I did this thing, on a real day, and it cost me.'));
    expect(blocks).toHaveLength(1);
    expect(blocks[0].source).toBe('');
  });

  it('a new true story WITH a source is seen as sound', () => {
    const src = `stories: [{ kind: 'testimony', title: 'New', body: 'I did this.', source: 'Darrell Poe' }]`;
    expect(storyBlocks(src)[0].source).toBe('Darrell Poe');
  });

  it('the JSON row shape the courses also use is read, not only the object literal', () => {
    const src = '{"kind":"testimony","title":"Row","body":"I did this.","source":""}';
    const blocks = storyBlocks(src);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].title).toBe('Row');
    expect(blocks[0].source).toBe('');
  });
});

describe('the checkable details DR-0550 asked to be put in front of him', () => {
  it('pulls out what only the person who lived it can confirm', () => {
    // A weekday is the detail DR-0550 was written about: L181 said Tuesday for
    // four fields when the rehearsal was a Thursday, and no test could know.
    const d = checkableDetails('It was a Thursday. Eleven years of documents, four thousand pounds, sixteen units, in 2008.');
    expect(d.days).toEqual(['Thursday']);
    expect(d.spans).toContain('Eleven years');
    expect(d.counts).toContain('2008');
    expect(d.money.join(' ')).toMatch(/pounds/);
    expect(d.places.join(' ')).toMatch(/units/);
  });

  it('and finds them in the real stories, so the list is not empty prose', () => {
    const withDetail = unattributedTestimonies()
      .filter((b) => Object.values(checkableDetails(b.body)).some((v) => v.length));
    expect(withDetail.length).toBeGreaterThan(40);
  });

  it('a weekday inside a true story is surfaced, because that is the DR-0550 case exactly', () => {
    const days = unattributedTestimonies()
      .flatMap((b) => checkableDetails(b.body).days.map((d) => `${b.file}:${b.title}:${d}`));
    // Not pinned to a number -- pinned to the property that they are FOUND. A
    // sweep that reported no weekday anywhere would be the lie this guards.
    expect(days.length).toBeGreaterThan(0);
  });
});
