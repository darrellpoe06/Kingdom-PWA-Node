// @vitest-environment node
// =============================================================================
// The landed manifest (DR-1527, J2): what is on disk under the kids folder
// decides what is landed, narrated, published or in production, with no
// hand-kept status anywhere. The committed manifest equals a fresh scan
// (stale → red), every file it names exists, and the derivations are shown
// to catch: a scene file flips its shot to landed; a recording flips its
// page to narrated; a video publishes its episode; a poster alone reads in
// production; nothing is published by a status string.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scan, serialize, kindOf, KIDS_DIR, MANIFEST } from '../../../scripts/kids-landed-manifest.mjs';
import landed from '../lib/kids/landed.json';
import { landedFile, onDisk, SHOT_LIST, LANDED } from '../lib/kids/guides.js';
import { episodesFrom, SERIES, EPISODES, watchable, shelfLabel, mediaKind } from '../lib/kids/theater.js';
import { narrationFor, narratedPages, narrationSentences, estimateCues, sentenceAt } from '../lib/kids/narration.js';
import { storybookById } from '../lib/kids/storybooks.js';
import { trailFor } from '../lib/kids/trail.js';

const HERE = dirname(fileURLToPath(import.meta.url));

describe('the manifest is the folder', () => {
  it('the committed manifest equals a fresh scan of the kids folder, and every file it names is there', () => {
    expect(serialize(scan(KIDS_DIR))).toBe(readFileSync(MANIFEST, 'utf8'));
    expect(LANDED).toEqual(landed);
    for (const [file, meta] of Object.entries(landed.files)) {
      expect(existsSync(join(KIDS_DIR, file)), file).toBe(true);
      expect(['image', 'audio', 'video', 'captions']).toContain(meta.kind);
      expect(meta.bytes).toBeGreaterThan(0);
    }
    expect(MANIFEST.endsWith(join('app', 'src', 'lib', 'kids', 'landed.json'))).toBe(true);
    expect(existsSync(join(HERE, '..', 'lib', 'kids', 'landed.json'))).toBe(true);
  });
  it('kinds by extension; anything else is ignored, never listed', () => {
    expect(kindOf('jonah-1.png')).toBe('image');
    expect(kindOf('narration/jonah-p1.m4a')).toBe('audio');
    expect(kindOf('episodes/jonah.mp4')).toBe('video');
    expect(kindOf('episodes/jonah.en.vtt')).toBe('captions');
    expect(kindOf('notes.txt')).toBeNull();
    expect(kindOf('Thumbs.db')).toBeNull();
  });
});

const fake = (...files) => ({ folder: 'x', files: Object.fromEntries(files.map((f) => [f, { kind: kindOf(f), bytes: 1 }])) });

describe('a file on disk is the only thing that lands a render', () => {
  it('each Jonah page is landed exactly when its scene file is in the folder; a scene file flips exactly its shot', () => {
    // The folder decides (DR-1527): scenes 1 and 2 landed 2026-11-18; the rest wait.
    const folder = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'lovecorner', 'kids');
    for (let n = 1; n <= 8; n += 1) {
      const png = existsSync(join(folder, `jonah-${n}.png`));
      const jpg = existsSync(join(folder, `jonah-${n}.jpg`));
      const want = png ? `jonah-${n}.png` : jpg ? `jonah-${n}.jpg` : null;
      expect(landedFile(`jonah-${n}`), `jonah-${n}`).toBe(want);
      expect(SHOT_LIST.find((s) => s.id === `jonah-${n}`).status).toBe(want ? 'landed' : 'needed');
    }
    expect(landedFile('jonah-1')).toBe('jonah-1.jpg');
    expect(landedFile('jonah-2')).toBe('jonah-2.jpg');
    const m = fake('jonah-3.png', 'jonah-4.jpg');
    expect(landedFile('jonah-3', m)).toBe('jonah-3.png');
    expect(landedFile('jonah-4', m)).toBe('jonah-4.jpg');
    expect(landedFile('jonah-5', m)).toBeNull();
    expect(onDisk('jonah-3.png', m)).toBe(true);
    expect(onDisk('jonah-3.png', fake())).toBe(false);
  });
});

describe('the episode is made of files', () => {
  it('today: every episode planned, nothing watchable, no poster, no captions', () => {
    expect(EPISODES.map((e) => e.status)).toEqual(['planned', 'planned', 'planned']);
    expect(EPISODES.some(watchable)).toBe(false);
    expect(EPISODES.every((e) => e.poster === null && e.captions === null && e.source === null)).toBe(true);
  });
  it('a video publishes the episode with its poster and captions; a poster alone reads in production; the others stay planned', () => {
    const full = episodesFrom(fake('episodes/jonah.mp4', 'episodes/jonah-poster.jpg', 'episodes/jonah.en.vtt'));
    expect(full[0]).toMatchObject({
      status: 'published',
      source: 'lovecorner/kids/episodes/jonah.mp4',
      poster: 'lovecorner/kids/episodes/jonah-poster.jpg',
      captions: 'lovecorner/kids/episodes/jonah.en.vtt',
    });
    expect(watchable(full[0])).toBe(true);
    expect(mediaKind(full[0].source)).toBe('file');
    expect(shelfLabel(full[0])).toBe('WATCH');
    expect(full[1].status).toBe('planned');
    const prod = episodesFrom(fake('episodes/jonah-poster.png'));
    expect(prod[0]).toMatchObject({ status: 'in-production', source: null, poster: 'lovecorner/kids/episodes/jonah-poster.png', captions: null });
    expect(watchable(prod[0])).toBe(false);
    expect(shelfLabel(prod[0])).toBe('IN PRODUCTION');
    // Captions never ride without the video; a webm is a video too.
    expect(episodesFrom(fake('episodes/jonah.en.vtt'))[0].status).toBe('planned');
    expect(episodesFrom(fake('episodes/jonah.webm'))[0].source).toBe('lovecorner/kids/episodes/jonah.webm');
    // The trail's last stop follows: available only when the video is there.
    expect(trailFor(storybookById('jonah'), full)[4].available).toBe(true);
    expect(trailFor(storybookById('jonah'), prod)[4].available).toBe(false);
    expect(SERIES.every((e) => e.status === 'planned')).toBe(true);
  });
});

describe('a recording on disk narrates its page', () => {
  const jonah = storybookById('jonah');
  it('today no page is narrated; a file names its page; the cues come from the table or are estimated', () => {
    expect(narratedPages(jonah)).toEqual([]);
    const m = fake('narration/jonah-p1.m4a', 'narration/jonah-p3.mp3');
    expect(narrationFor('jonah', 0, m)).toEqual({ file: 'narration/jonah-p1.m4a', cues: null });
    expect(narrationFor('jonah', 1, m)).toBeNull();
    expect(narrationFor('jonah', 2, m, { 'narration/jonah-p3.mp3': [0, 4.5, 9] })).toEqual({ file: 'narration/jonah-p3.mp3', cues: [0, 4.5, 9] });
    expect(narratedPages(jonah, m)).toEqual([0, 2]);
    expect(narrationFor('noah', 0, m)).toBeNull();
  });
  it('the sentences a recording reads are the verse then the caption; the estimate spreads them by their length; the time finds the sentence', () => {
    const s = narrationSentences(
      'Now the LORD had prepared a great fish to swallow up Jonah. And Jonah was in the belly of the fish three days and three nights.',
      'Three days inside a fish! Yahweh had a plan for Jonah even there.'
    );
    expect(s.verse.length).toBeGreaterThan(1);
    expect(s.caption.length).toBeGreaterThan(1);
    expect(s.all).toEqual(s.verse.concat(s.caption));
    const cues = estimateCues(s.all, 20);
    expect(cues[0]).toBe(0);
    expect(cues.length).toBe(s.all.length);
    for (let i = 1; i < cues.length; i += 1) expect(cues[i]).toBeGreaterThan(cues[i - 1]);
    expect(cues[cues.length - 1]).toBeLessThan(20);
    expect(sentenceAt(cues, 0)).toBe(0);
    expect(sentenceAt(cues, 19.9)).toBe(cues.length - 1);
    expect(sentenceAt([0, 5, 10], 7)).toBe(1);
    expect(sentenceAt([2, 5], 1)).toBe(-1);
    expect(estimateCues(['a', 'b'], 0)).toEqual([0, 0]);
  });
});
