// @vitest-environment node
// =============================================================================
// world-issues-verse-integrity — the verse-verbatim gate for the World Issues
// track (DR-0076: fetch verbatim, never from memory; DR-0259: gate-the-class).
// =============================================================================
// The Godhead Study catalog has had this protection since it shipped
// (fetch-godhead-verses.mjs + godhead-study.test.js); World Issues quoted
// Scripture inline with NO machine check that the quoted words match the
// actual KJV text — a "looked-fine-but-wasn't" class waiting to bite. This
// gate closes it for the prison-industrial-complex issue (the first authored
// under the gate) by asserting every quoted fragment below appears VERBATIM
// in the repo's own KJV (app/public/bible/kjv). New issues add their
// (ref, fragment) pairs here as part of authoring.
//
// Proven-to-catch: mutate any word of a fragment (or point a ref at the wrong
// verse) and the test fails naming the fragment. A fragment is an exact
// substring of the cited verse text — elisions are represented by SPLITTING
// into multiple fragments, never by paraphrase.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { WORLD_ISSUES } from '../lib/world-issues-class.js';

const KJV_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'bible', 'kjv');

function kjvVerse(book, chapter, verse) {
  const data = JSON.parse(readFileSync(join(KJV_DIR, `${book}.json`), 'utf8'));
  return data.chapters[chapter - 1][verse - 1];
}

// Every Scripture fragment the prison-industrial-complex issue quotes, with
// the verse it cites. Multi-verse quotes list one entry per verse; elided
// quotes ("A... B") list each side as its own fragment.
const PRISON_ISSUE_QUOTES = [
  { ref: 'Exodus 21:16', book: 'Exodus', ch: 21, v: 16, fragments: [
    'he that stealeth a man, and selleth him, or if he be found in his hand, he shall surely be put to death',
  ] },
  { ref: 'Exodus 22:1', book: 'Exodus', ch: 22, v: 1, fragments: [
    'he shall restore five oxen for an ox, and four sheep for a sheep',
  ] },
  { ref: 'Leviticus 25:10', book: 'Leviticus', ch: 25, v: 10, fragments: [
    'proclaim liberty throughout all the land unto all the inhabitants thereof',
  ] },
  { ref: 'Deuteronomy 16:20', book: 'Deuteronomy', ch: 16, v: 20, fragments: [
    'That which is altogether just shalt thou follow',
  ] },
  { ref: 'Proverbs 17:15', book: 'Proverbs', ch: 17, v: 15, fragments: [
    'He that justifieth the wicked, and he that condemneth the just, even they both are abomination to the LORD',
  ] },
  { ref: 'Proverbs 22:22', book: 'Proverbs', ch: 22, v: 22, fragments: [
    'Rob not the poor, because he is poor',
  ] },
  { ref: 'Proverbs 22:23', book: 'Proverbs', ch: 22, v: 23, fragments: [
    'For the LORD will plead their cause, and spoil the soul of those that spoiled them',
  ] },
  { ref: 'Ecclesiastes 5:8', book: 'Ecclesiastes', ch: 5, v: 8, fragments: [
    'If thou seest the oppression of the poor, and violent perverting of judgment and justice in a province, marvel not at the matter: for he that is higher than the highest regardeth',
  ] },
  { ref: 'Ecclesiastes 12:14', book: 'Ecclesiastes', ch: 12, v: 14, fragments: [
    'God shall bring every work into judgment, with every secret thing',
  ] },
  { ref: 'Isaiah 10:1', book: 'Isaiah', ch: 10, v: 1, fragments: [
    'Woe unto them that decree unrighteous decrees, and that write grievousness which they have prescribed',
  ] },
  { ref: 'Isaiah 10:2', book: 'Isaiah', ch: 10, v: 2, fragments: [
    'To turn aside the needy from judgment, and to take away the right from the poor of my people',
  ] },
  { ref: 'Isaiah 58:6', book: 'Isaiah', ch: 58, v: 6, fragments: [
    'to loose the bands of wickedness',
    'and to let the oppressed go free',
  ] },
  { ref: 'Isaiah 61:1', book: 'Isaiah', ch: 61, v: 1, fragments: [
    'to proclaim liberty to the captives, and the opening of the prison to them that are bound',
  ] },
  { ref: 'Jeremiah 22:13', book: 'Jeremiah', ch: 22, v: 13, fragments: [
    'Woe unto him that buildeth his house by unrighteousness',
    'that useth his neighbour’s service without wages',
  ] },
  { ref: 'Amos 2:6', book: 'Amos', ch: 2, v: 6, fragments: [
    'they sold the righteous for silver, and the poor for a pair of shoes',
  ] },
  { ref: 'Micah 3:11', book: 'Micah', ch: 3, v: 11, fragments: [
    'The heads thereof judge for reward',
  ] },
  { ref: 'Matthew 25:36', book: 'Matthew', ch: 25, v: 36, fragments: [
    'I was in prison, and ye came unto me',
  ] },
  { ref: 'Luke 19:8', book: 'Luke', ch: 19, v: 8, fragments: [
    'I restore him fourfold',
  ] },
  { ref: 'Romans 13:4', book: 'Romans', ch: 13, v: 4, fragments: [
    'he beareth not the sword in vain: for he is the minister of God, a revenger to execute wrath upon him that doeth evil',
  ] },
  { ref: 'Ephesians 4:28', book: 'Ephesians', ch: 4, v: 28, fragments: [
    'let him labour',
    'that he may have to give to him that needeth',
  ] },
  { ref: 'Hebrews 13:3', book: 'Hebrews', ch: 13, v: 3, fragments: [
    'Remember them that are in bonds, as bound with them',
  ] },
];

describe('the prison-industrial-complex issue quotes the KJV verbatim (DR-0076)', () => {
  const issue = WORLD_ISSUES.find((i) => i.id === 'wi-prison-industrial-complex');

  it('the issue is published in the track', () => {
    expect(issue).toBeTruthy();
  });

  it('every quoted fragment is an exact substring of the cited KJV verse', () => {
    const failures = [];
    for (const q of PRISON_ISSUE_QUOTES) {
      const text = kjvVerse(q.book, q.ch, q.v);
      for (const frag of q.fragments) {
        // The issue's prose uses typographic apostrophes; the KJV files do too —
        // compare with both normalized so punctuation style never masks a
        // wording mismatch (wording is what the gate protects).
        const norm = (s) => s.replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
        if (!norm(text).includes(norm(frag))) {
          failures.push(`${q.ref}: fragment not found verbatim — "${frag}" (verse reads: "${text}")`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('every fragment actually appears in the issue content (the gate covers real quotes, not a stale list)', () => {
    const blob = JSON.stringify(issue);
    const norm = (s) => s.replace(/[’‘]/g, "'");
    const missing = PRISON_ISSUE_QUOTES.flatMap((q) =>
      q.fragments.filter((frag) => !norm(blob).includes(norm(frag))).map((frag) => `${q.ref}: "${frag}"`));
    expect(missing).toEqual([]);
  });
});
