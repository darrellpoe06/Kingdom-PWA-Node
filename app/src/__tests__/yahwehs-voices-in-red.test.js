// @vitest-environment node
//
// Yahweh's voices in red, across the whole Bible (DR-1103). Darrell 2026-10-18,
// on Psalms 110 in the reader: "We need the voices of Yahweh in red to be
// accurate based on what we believe is all Yahweh's Voices." Before this, the
// red-letter set was ~40 hand-verified quotes and almost every chapter read "no
// voices verified in this chapter yet".
//
// What this gate holds:
//   1. HONESTY (DR-0076): every one of the ~5,500 shipped quotes is a verbatim
//      stretch of the shipped KJV verse it is filed under, in a known voice.
//   2. ACCURACY on passages read by hand: what is His is red, and what is a
//      man's (Eve misquoting Him, David speaking of Him, Simeon praying to Him,
//      Paul's "it is written") is not.
//   3. The rules themselves, on small fixtures, each PROVEN TO CATCH the miss
//      it exists for.
//   4. The reader's runtime: a book's voices load on demand, the hand-verified
//      quotes still win for their verse, and another edition's text is never
//      colored with KJV attributions.
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { __setBibleFetcher, BIBLE_INDEX } from '../lib/bible-kjv.js';
import {
  VOICES, GODHEAD_VOICES, voiceSpansFor, voicesPresent, refHasVoices, loadVoiceBook,
  voiceBookLoaded, __resetVoiceBooks, cssForVoice,
} from '../lib/scripture-voices.js';
import {
  tagGodheadSpeech, findOpener, jesusRuns, READ_BY_HAND, SOURCE_SHA256,
} from '../../../scripts/build-scripture-voices.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const KJV = join(HERE, '../../public/bible/kjv');
const VOICES_DIR = join(HERE, '../../public/bible/voices');
const kjv = (file) => JSON.parse(readFileSync(join(KJV, `${file}.json`), 'utf8')).chapters;
const voicesOf = (file) => JSON.parse(readFileSync(join(VOICES_DIR, `${file}.json`), 'utf8')).chapters;
const quotes = (file, c, v) => ((voicesOf(file)[String(c)] || {})[String(v)] || []);
const KNOWN = new Set(VOICES.map((v) => v.key));

describe('1. HONESTY: every shipped quote is the KJV verse, word for word', () => {
  it('all 66 books have a voices asset, and nothing else sits in the folder but the manifest', () => {
    const files = readdirSync(VOICES_DIR).sort();
    expect(files).toEqual([...BIBLE_INDEX.map((b) => `${b.file}.json`), 'manifest.json'].sort());
  });

  it('every quote is found verbatim in the verse it is filed under, in a Godhead voice', () => {
    let n = 0;
    for (const b of BIBLE_INDEX) {
      const text = kjv(b.file);
      for (const [c, verses] of Object.entries(voicesOf(b.file))) {
        for (const [v, list] of Object.entries(verses)) {
          const verse = (text[Number(c) - 1] || [])[Number(v) - 1];
          expect(verse, `${b.name} ${c}:${v} is not a verse`).toBeTruthy();
          for (const [voice, quote] of list) {
            expect(GODHEAD_VOICES, `${b.name} ${c}:${v} voice ${voice}`).toContain(voice);
            expect(quote.length, `${b.name} ${c}:${v} empty quote`).toBeGreaterThan(1);
            expect(verse.includes(quote), `${b.name} ${c}:${v} not verbatim: "${quote}"`).toBe(true);
            n += 1;
          }
        }
      }
    }
    // the whole Bible, not a sample: thousands of spans, each checked above
    expect(n).toBeGreaterThan(5000);
  });

  it('the manifest counts are the assets’ own counts, and the source is pinned', () => {
    const m = JSON.parse(readFileSync(join(VOICES_DIR, 'manifest.json'), 'utf8'));
    expect(m.sourceSha256).toBe(SOURCE_SHA256);
    for (const b of BIBLE_INDEX) {
      const counts = { jesus: 0, father: 0, spirit: 0 };
      for (const vs of Object.values(voicesOf(b.file))) for (const list of Object.values(vs)) for (const [k] of list) counts[k] += 1;
      expect(m.books[b.file], b.name).toEqual(counts);
    }
  });

  it('the Son’s words cover the Gospels (eBible.org red-letter KJV, aligned onto our text)', () => {
    const m = JSON.parse(readFileSync(join(VOICES_DIR, 'manifest.json'), 'utf8'));
    for (const g of ['Matthew', 'Mark', 'Luke', 'John']) expect(m.books[g].jesus, g).toBeGreaterThan(250);
    expect(quotes('John', 14, 6)).toEqual([['jesus', 'I am the way, the truth, and the life: no man cometh unto the Father, but by me.']]);
    // our KJV's own spelling is kept inside the quote: "satan", never the source's capital
    expect(quotes('Matthew', 4, 10)[0][1]).toMatch(/^Get thee hence, satan:/);
  });
});

describe('2. ACCURACY on passages read by hand', () => {
  it('Psalms 110 (Darrell’s screenshot): only verses 1 and 4, and only His words in them', () => {
    expect(Object.keys(voicesOf('Psalms')['110'])).toEqual(['1', '4']);
    expect(quotes('Psalms', 110, 1)).toEqual([['father', 'Sit thou at my right hand, until I make thine enemies thy footstool.']]);
    expect(quotes('Psalms', 110, 4)).toEqual([['father', 'Thou art a priest for ever after the order of Melchizedek.']]);
  });

  it('the Ten Commandments are His, and the people’s fear after them is not (Exodus 20)', () => {
    for (let v = 2; v <= 17; v += 1) expect(quotes('Exodus', 20, v).length, `Exodus 20:${v}`).toBeGreaterThan(0);
    for (const v of [1, 18, 19, 20, 21]) expect(quotes('Exodus', 20, v), `Exodus 20:${v}`).toEqual([]);
  });

  it('Eve’s misquote of Him is never colored as His word (Genesis 3:3)', () => {
    expect(quotes('Genesis', 3, 3)).toEqual([]);
    expect(quotes('Genesis', 3, 9)).toEqual([['father', 'Where art thou?']]);
    expect(quotes('Genesis', 3, 10)).toEqual([]); // Adam answers
    expect(quotes('Genesis', 3, 23)).toEqual([]); // narration: "Therefore the LORD God sent him forth"
  });

  it('the burning bush: His words, Moses’ answers plain (Exodus 3)', () => {
    expect(quotes('Exodus', 3, 4)).toEqual([['father', 'Moses, Moses.']]);
    expect(quotes('Exodus', 3, 5)[0][1]).toMatch(/^Draw not nigh hither/);
    expect(quotes('Exodus', 3, 11)).toEqual([]);
    expect(quotes('Exodus', 3, 14).map((q) => q[1])).toEqual(['I AM THAT I AM', 'Thus shalt thou say unto the children of Israel, I AM hath sent me unto you.']);
  });

  it('the Father from heaven over the Son, the Spirit in Acts, and Simeon’s prayer left as his', () => {
    expect(quotes('Matthew', 3, 17)).toEqual([['father', 'This is my beloved Son, in whom I am well pleased.']]);
    expect(quotes('Matthew', 17, 5)[0]).toEqual(['father', 'This is my beloved Son, in whom I am well pleased; hear ye him.']);
    expect(quotes('John', 12, 28)).toEqual([['jesus', 'Father, glorify thy name.'], ['father', 'I have both glorified it, and will glorify it again.']]);
    expect(quotes('Acts', 13, 2)).toEqual([['spirit', 'Separate me Barnabas and Saul for the work whereunto I have called them.']]);
    expect(quotes('Luke', 2, 29)).toEqual([]);
    expect(quotes('Luke', 2, 30)).toEqual([]);
  });

  it('where the New Testament names Old Testament words the Son’s, they are the Son’s (the Word explains the Word)', () => {
    // Luke 4:21 "This day is this scripture fulfilled in your ears" — Isaiah 61:1
    expect(quotes('Isaiah', 61, 1)[0]).toEqual(['jesus', kjv('Isaiah')[60][0].replace(/;$/, '')]);
    // Hebrews 10:5-7 "when he cometh into the world, he saith" — Psalms 40:6-8
    for (const v of [6, 7, 8]) expect(quotes('Psalms', 40, v)[0][0], `Psalms 40:${v}`).toBe('jesus');
    // Matthew 27:46, Hebrews 2:12 — Psalms 22:1 and 22:22; Hebrews 2:13 — Isaiah 8:18
    expect(quotes('Psalms', 22, 1)[0][0]).toBe('jesus');
    expect(quotes('Psalms', 22, 22)[0][0]).toBe('jesus');
    expect(quotes('Isaiah', 8, 18)[0][0]).toBe('jesus');
    // Hebrews 1:8 "unto the Son he saith, Thy throne, O God" — the Father to the Son
    expect(quotes('Psalms', 45, 6)).toEqual([['father', 'Thy throne, O God, is for ever and ever: the sceptre of thy kingdom is a right sceptre.']]);
    // the Servant's own words that the New Testament does not name as His stay plain
    expect(quotes('Isaiah', 50, 6)).toEqual([]);
    expect(quotes('Isaiah', 53, 5)).toEqual([]);
  });

  it('Isaiah 40-55 carries His words where no formula marks them (41:10, 43:11, 55:1), and not the prophet’s hymns (42:10, 52:7)', () => {
    expect(quotes('Isaiah', 41, 10)[0][1]).toMatch(/^Fear thou not; for I am with thee/);
    expect(quotes('Isaiah', 43, 11)).toEqual([['father', 'I, even I, am the LORD; and beside me there is no saviour.']]);
    expect(quotes('Isaiah', 55, 1)[0][1]).toMatch(/^Ho, every one that thirsteth/);
    expect(quotes('Isaiah', 42, 10)).toEqual([]);
    expect(quotes('Isaiah', 52, 7)).toEqual([]);
    expect(quotes('Isaiah', 54, 8)[0][1]).not.toMatch(/Redeemer/);
  });

  it('an apostle’s frame is his: "For it is written," is not colored, the oracle is (Romans 14:11)', () => {
    const q = quotes('Romans', 14, 11).map((x) => x[1]);
    expect(q[0]).toBe('As I live');
    expect(q.join(' ')).not.toMatch(/it is written/);
  });

  it('the prophet’s frame is his: "Thus saith the LORD, thy Redeemer…" is not colored (Isaiah 48:17, 1:24)', () => {
    expect(quotes('Isaiah', 48, 17)).toEqual([['father', 'I am the LORD thy God which teacheth thee to profit, which leadeth thee by the way that thou shouldest go.']]);
    expect(quotes('Isaiah', 1, 24)[0][1]).toMatch(/^Ah, I will ease me/);
    expect(quotes('Isaiah', 1, 4)).toEqual([]); // the prophet speaks of Him: "they have forsaken the LORD"
  });

  it('every passage read by hand is in its verse and shipped in its voice; Psalms 95:7-11 is the Holy Ghost by Hebrews 3:7', () => {
    for (const [file, list] of Object.entries(READ_BY_HAND)) {
      const text = kjv(file);
      for (const [ref, from, voice = 'father'] of list) {
        const [c, range] = ref.split(':');
        const [a, b = a] = range.split('-').map(Number);
        for (let v = a; v <= b; v += 1) {
          if (from) expect(text[Number(c) - 1][v - 1].includes(from), `${file} ${c}:${v}`).toBe(true);
          const got = quotes(file, c, v);
          expect(got.length, `${file} ${c}:${v}`).toBe(1);
          expect(got[0][0], `${file} ${c}:${v}`).toBe(voice);
        }
      }
    }
    expect(quotes('Psalms', 95, 8)[0][0]).toBe('spirit');
    expect(quotes('Hebrews', 3, 7)[0][0]).toBe('spirit');
    // David speaking, not Him: the question after the oracle and the prayer to Him
    expect(quotes('Psalms', 60, 9)).toEqual([]);
    expect(quotes('Psalms', 68, 28)).toEqual([]);
  });
});

describe('3. the rules, on small fixtures, each proven to catch', () => {
  const tag = (file, verses) => tagGodheadSpeech(file, [verses]);

  it('a speech carries into the next verse in the law, and stops at narration', () => {
    const r = tag('Exodus', [
      'And God spake all these words, saying,',
      'Thou shalt have no other gods before me.',
      'And all the people saw the thunderings, and stood afar off.',
    ]);
    expect([...r.keys()]).toEqual(['1:2']);
  });

  it('a human already speaking: a "God hath said" inside their speech is their quotation', () => {
    const r = tag('Genesis', [
      'And the woman said unto the serpent, We may eat of the fruit of the trees of the garden:',
      'But of the fruit of the tree which is in the midst of the garden, God hath said, Ye shall not eat of it, neither shall ye touch it, lest ye die.',
    ]);
    expect(r.has('1:2')).toBe(false);
    // proven to catch: the same verse with no human speech before it IS tagged
    const alone = tag('Genesis', ['But of the fruit of the tree which is in the midst of the garden, God hath said, Ye shall not eat of it.']);
    expect(alone.has('1:1')).toBe(true);
  });

  it('in the Psalms and the prophets, a verse that speaks of Him in the third person ends His speech', () => {
    const r = tag('Psalms', [
      'The LORD said unto my Lord, Sit thou at my right hand, until I make thine enemies thy footstool.',
      'The LORD shall send the rod of thy strength out of Zion: rule thou in the midst of thine enemies.',
    ]);
    expect([...r.keys()]).toEqual(['1:1']);
  });

  it('"saith the LORD" verses color everything but the formula and the frame', () => {
    const text = 'Thus saith the LORD, thy Redeemer, the Holy One of Israel; I am the LORD thy God which teacheth thee to profit.';
    const op = findOpener(text);
    expect(text.slice(op.start)).toBe('I am the LORD thy God which teacheth thee to profit.');
  });

  it('"And he said" is His only when He spoke within the last few verses', () => {
    const near = tag('Genesis', [
      'And God said unto him, Abraham: and he said, Behold, here I am.',
      'And he said, Take now thy son.',
    ]);
    expect(near.has('1:2')).toBe(true);
    const far = tag('Genesis', [
      'And God said unto him, Go.',
      'And Abraham went.', 'And Isaac came.', 'And the servant said unto him, Here.', 'And Lot went.',
      'And he said, Take now thy son.',
    ]);
    expect(far.has('1:6')).toBe(false);
  });

  it('the Son’s words carry from the source onto OUR spelling, word by word', () => {
    const src = [
      { word: 'Then', jesus: false }, { word: 'saith', jesus: false }, { word: 'Jesus', jesus: false },
      { word: 'Get', jesus: true }, { word: 'thee', jesus: true }, { word: 'hence,', jesus: true }, { word: 'Satan', jesus: true },
    ];
    const ours = 'Then saith Jesus, Get thee hence, satan';
    const [[s, e]] = jesusRuns(ours, src);
    expect(ours.slice(s, e)).toBe('Get thee hence, satan');
  });
});

describe('4. the reader’s runtime', () => {
  beforeAll(() => {
    __setBibleFetcher(async (url) => {
      const u = String(url);
      const dir = /\/voices\//.test(u) ? VOICES_DIR : KJV;
      try {
        const body = readFileSync(join(dir, u.split('/').pop()), 'utf8');
        return { ok: true, json: async () => JSON.parse(body) };
      } catch { return { ok: false, json: async () => null }; }
    });
  });
  afterEach(() => __resetVoiceBooks());

  it('a book’s voices load on demand and color the verse', async () => {
    const t = kjv('Psalms')[109][0];
    expect(voiceSpansFor('Psalms 110:1', t)).toEqual([]); // not loaded yet
    expect(await loadVoiceBook('Psalms')).toBe(true);
    expect(voiceBookLoaded('Psalms')).toBe(true);
    const [sp] = voiceSpansFor('Psalms 110:1', t);
    expect(t.slice(sp.start, sp.end)).toBe('Sit thou at my right hand, until I make thine enemies thy footstool.');
    expect(cssForVoice(sp.style).color.toLowerCase()).toBe('#b01e1e');
    expect(refHasVoices('Psalms 110:2')).toBe(false);
    expect(voicesPresent(['Psalms 110:1', 'Psalms 110:2'])).toEqual(['father']);
  });

  it('the hand-verified quotes still win for their verse (Genesis 1:3 stays "Let there be light")', async () => {
    await loadVoiceBook('Genesis');
    const t = kjv('Genesis')[0][2];
    const spans = voiceSpansFor('Genesis 1:3', t);
    expect(spans.map((s) => t.slice(s.start, s.end))).toEqual(['Let there be light']);
  });

  it('another edition’s text is never colored with the KJV’s attributions', async () => {
    await loadVoiceBook('Psalms');
    expect(voiceSpansFor('Psalms 110:1', 'The LORD says to my Lord, “Sit at my right hand…”')).toEqual([]);
  });

  it('a voices fetch that returns the text’s chapter array is refused, never read as voices', async () => {
    __setBibleFetcher(async () => ({ ok: true, json: async () => ({ name: 'Psalms', chapters: [['text']] }) }));
    expect(await loadVoiceBook('Psalms')).toBe(false);
    expect(KNOWN.has('father')).toBe(true);
  });
});
