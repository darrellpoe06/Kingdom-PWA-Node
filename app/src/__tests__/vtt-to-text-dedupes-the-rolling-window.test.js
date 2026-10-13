// A caption track is a ROLLING DISPLAY, and a naive strip of it lies.
//
// YouTube's auto-generated captions repeat the tail of the previous cue so the
// words scroll on screen. Strip the timestamps naively and most of the talk
// appears two or three times. That is not a cosmetic defect: a lesson quoting a
// man from such a file would quote a duplicated fragment, and the duplication
// would read as emphasis he never gave. Since the whole point of fetching a
// transcript (source-transcript.yml, DR-0108 — the runner reaches what this
// sandbox cannot) is to quote the SPEAKER rather than a summary of him, the
// de-duplication IS the provenance guarantee, not a tidying step.
//
// These cases run the real script as the workflow runs it, over a VTT shaped
// exactly like the rolling window, and hold the guarantees the workflow relies
// on before it will commit a file.

import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const SCRIPT = resolve(__dirname, '../../../scripts/vtt-to-text.mjs');

function flatten(vtt) {
  const dir = mkdtempSync(join(tmpdir(), 'vtt-'));
  const file = join(dir, 'cap.vtt');
  writeFileSync(file, vtt);
  return execFileSync('node', [SCRIPT, file], { encoding: 'utf8' });
}

function body(out) {
  // Drop the provenance header comment lines; assert on the prose only.
  return out.split('\n').filter((l) => !l.startsWith('#')).join('\n');
}

// The rolling window, written the way the real endpoint emits it.
const ROLLING = `WEBVTT

00:00:01.000 --> 00:00:03.000
we have been misled about

00:00:03.000 --> 00:00:05.000
we have been misled about biology for

00:00:05.000 --> 00:00:07.000
biology for eighty years and the reason

00:00:35.000 --> 00:00:37.000
eighty years and the reason is a model

00:01:10.000 --> 00:01:12.000
is a model that ignores the living cell
`;

describe('vtt-to-text — the rolling window is de-duplicated, because a duplicated quote is a false quote', () => {
  it('says each phrase exactly ONCE even though the cues repeat it three times', () => {
    const text = body(flatten(ROLLING));
    // "we have been misled about" appears in 2 cues, "biology for" in 2,
    // "eighty years and the reason" in 2, "is a model" in 2.
    for (const phrase of ['we have been misled about', 'biology for', 'eighty years and the reason', 'is a model']) {
      const hits = text.split(phrase).length - 1;
      expect(hits, `"${phrase}" should appear once, not ${hits} times`).toBe(1);
    }
  });

  it('keeps the words in spoken order, so a quotation read off it is the sentence he said', () => {
    const text = body(flatten(ROLLING)).replace(/\[\d+:\d+\]/g, ' ').replace(/\s+/g, ' ').trim();
    expect(text).toContain('we have been misled about biology for eighty years and the reason is a model that ignores the living cell');
  });

  it('carries a timestamp marker so a quotation can still be cited to a point in the talk', () => {
    const text = body(flatten(ROLLING));
    expect(text).toMatch(/\[00:01\]/);
    expect(text).toMatch(/\[00:35\]/);
    expect(text).toMatch(/\[01:10\]/);
  });

  it('does not mark every cue — a marker every few seconds would be noise, not a citation', () => {
    const marks = body(flatten(ROLLING)).match(/\[\d+:\d+\]/g) || [];
    // 5 cues, but only 3 crossings of the ~30s spacing.
    expect(marks.length).toBe(3);
    expect(marks.length).toBeLessThan(5);
  });

  it('strips the inline word-timing tags and HTML entities the endpoint emits', () => {
    const text = body(flatten(`WEBVTT

00:00:01.000 --> 00:00:03.000
<00:00:01.500><c>the</c> cell &amp; the gene &#39;consist&#39;
`));
    expect(text).not.toMatch(/<[^>]+>/);
    expect(text).not.toContain('&amp;');
    expect(text).not.toContain('&#39;');
    expect(text).toContain("the cell & the gene 'consist'");
  });

  it('is not fooled by a case change in the repeated tail', () => {
    const text = body(flatten(`WEBVTT

00:00:01.000 --> 00:00:03.000
the living cell

00:00:03.000 --> 00:00:05.000
The Living Cell corrects its own errors
`));
    expect((text.match(/living cell/gi) || []).length).toBe(1);
  });

  it('PROVEN TO CATCH: without de-duplication the same input triples the text', () => {
    // The naive implementation this script exists to replace — strip the cue
    // lines and join. If the real script ever regressed to this, the case above
    // would fail; this pins WHY, so the guarantee is not mistaken for tidying.
    const naive = ROLLING
      .split(/\r?\n/)
      .filter((l) => l && l !== 'WEBVTT' && !l.includes('-->'))
      .join(' ');
    expect((naive.match(/we have been misled about/g) || []).length).toBe(2);
    expect((naive.match(/is a model/g) || []).length).toBe(2);
    // and the real one does not
    const text = body(flatten(ROLLING));
    expect((text.match(/we have been misled about/g) || []).length).toBe(1);
  });

  it('an empty or header-only track flattens to nothing, so the workflow refuses to commit it', () => {
    const out = flatten('WEBVTT\n\nNOTE this track has no cues\n');
    expect(body(out).trim()).toBe('');
    // The workflow's own guard is a >500-byte floor on the whole file; the
    // header alone is well under it, so an empty fetch cannot reach a commit.
    expect(out.length).toBeLessThan(500);
  });

  it('names the honest limit in the file itself — auto-captions are a machine hearing a man', () => {
    const out = flatten(ROLLING);
    expect(out).toMatch(/machine's hearing, not the speaker's text/);
    expect(out).toMatch(/verify any wording before quoting a person/);
  });
});
