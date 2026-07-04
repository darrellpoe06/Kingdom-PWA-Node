// @vitest-environment node
//
// scripture-voice-cast — the dramatized reading: each speaker read in a distinct
// voice (Darrell 2026-07-04). Proves the cast reuses the tested voice-assignment
// engine to give each character a distinct, gender-correct device voice, and that
// the spoken SCRIPT is cast from the same quote-verified attribution that colors
// the text (so audio and color can never drift). Real KJV via the shipped assets.
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseRef, chapterVerses, __setBibleFetcher } from '../lib/bible-kjv.js';
import {
  CAST, CAST_CHARACTERS, buildCast, castVoiceURI, segmentByVoice, castScript, castPresent, castLabel,
} from '../lib/scripture-voice-cast.js';

const KJV_ASSETS = join(dirname(fileURLToPath(import.meta.url)), '../../public/bible/kjv');

beforeAll(() => {
  __setBibleFetcher(async (url) => {
    const file = String(url).split('/').pop();
    try {
      const body = readFileSync(join(KJV_ASSETS, file), 'utf8');
      return { ok: true, json: async () => JSON.parse(body) };
    } catch {
      return { ok: false, json: async () => null };
    }
  });
});

async function chapter(ref) {
  const p = parseRef(ref);
  const verses = await chapterVerses(p.book, p.chapter);
  return { verses, refOf: (v) => `${p.book} ${p.chapter}:${v}` };
}

// A device with several clearly-gendered voices so the cast can be distinct.
const DEVICE = [
  { name: 'Daniel', voiceURI: 'd', lang: 'en-GB' },   // male
  { name: 'Alex', voiceURI: 'a', lang: 'en-US' },     // male
  { name: 'Samantha', voiceURI: 's', lang: 'en-US' }, // female
  { name: 'Karen', voiceURI: 'k', lang: 'en-AU' },    // female
  { name: 'Google US English', voiceURI: 'g', lang: 'en-US' }, // unknown
];

describe('the cast assigns a distinct, gender-correct voice per speaker', () => {
  it('male characters get male device voices; characters differ from each other', () => {
    const cast = buildCast(DEVICE);
    // Jesus and the Father are male → male device voices (Daniel / Alex).
    const jesus = castVoiceURI(cast, 'jesus');
    const father = castVoiceURI(cast, 'father');
    expect(['d', 'a']).toContain(jesus);
    expect(['d', 'a']).toContain(father);
    expect(jesus).not.toBe(father);                 // two men, two voices
    // the narrator falls through to the reader's own voice (undefined here).
    expect(castVoiceURI(cast, 'narrator')).toBeUndefined();
    expect(castVoiceURI(cast, undefined)).toBeUndefined();
  });
  it('degrades safely when the device exposes no voices', () => {
    const cast = buildCast([]);
    expect(castVoiceURI(cast, 'jesus')).toBeUndefined();
    expect(CAST_CHARACTERS).toEqual(expect.arrayContaining(['jesus', 'father', 'adversary']));
    expect(CAST.find((c) => c.id === 'narrator').kind).toBe('synthetic');
  });
});

describe('the spoken script is cast from the verified attribution (audio == color)', () => {
  it('Matthew 4:3-4 splits into narrator + character runs, correctly voiced', async () => {
    const t4 = (await chapter('Matthew 4:4')).verses.find((v) => v.v === 4).text;
    const runs = segmentByVoice('Matthew 4:4', t4);
    // narration first ("But he answered and said,"), then Jesus' quote.
    expect(runs[0].voice).toBe('narrator');
    expect(runs.some((r) => r.voice === 'jesus' && /Man shall not live by bread alone/.test(r.text))).toBe(true);
  });
  it('castScript reads a chapter in order and merges adjacent same-voice runs', async () => {
    const { verses, refOf } = await chapter('Matthew 4:1');
    const script = castScript(verses, refOf);
    expect(script.length).toBeGreaterThan(0);
    // every line carries a real ref + a known cast voice + non-empty text
    const known = new Set(CAST.map((c) => c.id));
    for (const line of script) {
      expect(known.has(line.voice)).toBe(true);
      expect(line.text.length).toBeGreaterThan(0);
      expect(line.ref).toMatch(/^Matthew 4:\d+$/);
    }
    // no two consecutive lines share the same ref AND voice (they'd have merged)
    for (let i = 1; i < script.length; i += 1) {
      const a = script[i - 1]; const b = script[i];
      expect(a.ref === b.ref && a.voice === b.voice).toBe(false);
    }
    // the Temptation casts both Jesus and the adversary
    const voices = new Set(script.map((l) => l.voice));
    expect(voices.has('jesus')).toBe(true);
    expect(voices.has('adversary')).toBe(true);
    expect(voices.has('narrator')).toBe(true);
  });
  it('castPresent lists the characters heard, in cast order; castLabel names them', async () => {
    const { verses, refOf } = await chapter('Matthew 4:1');
    const present = castPresent(verses, refOf).map((c) => c.id);
    expect(present).toEqual(['jesus', 'adversary']);   // jesus before adversary in CAST
    expect(castLabel('jesus')).toBe('Jesus');
    expect(castLabel('adversary')).toBe('the adversary');
  });
});
