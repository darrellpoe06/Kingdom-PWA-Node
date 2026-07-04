// @vitest-environment node
//
// scripture-voices — the red-letter "who is speaking" color code (Darrell
// 2026-07-04). The load-bearing test is HONESTY (DR-0076): every attributed quote
// must exist VERBATIM in the shipped KJV verse — we never put words in a speaker's
// mouth. Also pins the color theology: Jesus is red (the Blood, DR-0099) and
// nothing else in the voice palette draws in red.
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseRef, chapterVerses, __setBibleFetcher } from '../lib/bible-kjv.js';
import {
  VOICES, VOICE_QUOTES, cssForVoice, voiceSpansFor, voicesPresent, refHasVoices, VOICES_SOURCE,
} from '../lib/scripture-voices.js';

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

async function verseText(ref) {
  const p = parseRef(ref);
  const verses = await chapterVerses(p.book, p.chapter);
  return (verses.find((v) => v.v === p.v1) || {}).text || '';
}

describe('the voices palette is well-formed + red is reserved for the Son', () => {
  it('each voice has a label, meaning, swatch, and visible css', () => {
    const seen = new Set();
    for (const v of VOICES) {
      expect(v.key).toBeTruthy();
      expect(seen.has(v.key), `duplicate voice ${v.key}`).toBe(false);
      seen.add(v.key);
      expect(v.label, `${v.key} label`).toBeTruthy();
      expect(v.meaning, `${v.key} meaning`).toBeTruthy();
      expect(v.swatch, `${v.key} swatch`).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(v.css.color, `${v.key} color`).toBeTruthy();
    }
  });
  it('only Jesus draws in red (#B01E1E) — the Blood / the Son (DR-0099)', () => {
    const RED = '#b01e1e';
    for (const v of VOICES) {
      const red = (v.swatch || '').toLowerCase() === RED
        || Object.values(v.css).some((x) => typeof x === 'string' && x.toLowerCase() === RED);
      if (red) expect(v.key, `${v.key} is red but is not Jesus`).toBe('jesus');
    }
    expect(cssForVoice('jesus').color.toLowerCase()).toBe('#b01e1e');   // red-letter
    expect(cssForVoice('nobody')).toEqual({});
  });
  it('the adversary is dishonored — a cold color, set apart by italic too', () => {
    const adv = VOICES.find((v) => v.key === 'adversary');
    expect(adv.css.fontStyle).toBe('italic');         // legible even without color
    expect(adv.label).toBe('the adversary');          // lowercase — never honored
  });
});

describe('HONESTY: every attributed quote exists verbatim in the shipped KJV', () => {
  it('finds each quote in its real verse and spans it exactly', async () => {
    for (const q of VOICE_QUOTES) {
      const text = await verseText(q.ref);            // eslint hint: sequential is fine in a test
      expect(text, `${q.ref} — verse missing`).toBeTruthy();
      expect(text.includes(q.quote), `${q.ref} — quote not verbatim: "${q.quote}"`).toBe(true);
      const spans = voiceSpansFor(q.ref, text);
      const hit = spans.find((s) => s.style === q.voice && text.slice(s.start, s.end) === q.quote);
      expect(hit, `${q.ref} — span for ${q.voice} not produced`).toBeTruthy();
    }
  });
});

describe('the red-letter Temptation reads Jesus-red vs adversary-cold', () => {
  it('Matthew 4: the tempter is cold, Jesus is red', async () => {
    const t3 = await verseText('Matthew 4:3');
    const t4 = await verseText('Matthew 4:4');
    expect(voiceSpansFor('Matthew 4:3', t3).every((s) => s.style === 'adversary')).toBe(true);
    expect(voiceSpansFor('Matthew 4:4', t4).every((s) => s.style === 'jesus')).toBe(true);
    // the narration before Jesus' quote ("But he answered and said,") stays plain
    const span = voiceSpansFor('Matthew 4:4', t4)[0];
    expect(t4.slice(0, span.start)).toMatch(/answered and said/);
  });
  it('voicesPresent lists voices in palette order; refHasVoices is honest', () => {
    const present = voicesPresent(['Matthew 4:3', 'Matthew 4:4']);
    expect(present).toEqual(['jesus', 'adversary']);   // jesus before adversary in the palette
    expect(refHasVoices('Matthew 4:4')).toBe(true);
    expect(refHasVoices('Matthew 4:5')).toBe(false);   // narration verse — not attributed
    expect(VOICES_SOURCE.name).toMatch(/red-letter/);
  });
});
