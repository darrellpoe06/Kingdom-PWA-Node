// PLAY READS THE LESSON. IT DOES NOT OPEN THE POWERPOINT.
// =============================================================================
// Darrell 2026-09-14, in capitals and for the THIRD time: "Play Button reads
// the lesson!!!!! Does not open the PowerPoint!!! Understand!!!??????!!!!! Reads
// the lesson front to back... make sense?!!!!"
//
// Why he had to say it three times, which is the finding: both earlier attempts
// changed only WHICH DECK VIEW Play opened. First it landed on the presenter
// CONSOLE (a setup screen with its own Start), then #1567 made it land on the
// deck ALREADY PRESENTING and I reported that as done. Neither is reading. The
// button called Play never once read the lesson.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  clearReadTarget, requestRead, pendingRead, takeRead, clearRead, subscribeRead,
} from '../lib/read-target.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

describe('the read request channel', () => {
  beforeEach(() => { clearRead(); clearReadTarget('ll1'); clearReadTarget('ll2'); });

  it('records a want and hands it back', () => {
    requestRead('ll1');
    expect(pendingRead().owner).toBe('ll1');
  });

  it('is consumed once, so a reading never starts twice', () => {
    requestRead('ll1');
    expect(takeRead('ll1')).toBe(true);
    expect(takeRead('ll1')).toBe(false);
    expect(pendingRead()).toBeNull();
  });

  it('WILL NOT hand lesson A’s want to lesson B', () => {
    // Press Play on A, then B before A mounts. Reading A would be wrong.
    requestRead('ll1');
    expect(takeRead('ll2')).toBe(false);
    requestRead('ll2');
    expect(pendingRead().owner).toBe('ll2');
    expect(takeRead('ll1')).toBe(false);
  });

  it('expires, so a stale want cannot start speech nobody asked for', () => {
    requestRead('ll1');
    const later = Date.now() + 60000;
    expect(pendingRead(later)).toBeNull();
    expect(takeRead('ll1', later)).toBe(false);
  });

  it('notifies subscribers when a want arrives', () => {
    let seen = null;
    const off = subscribeRead((w) => { seen = w; });
    requestRead('ll1');
    expect(seen && seen.owner).toBe('ll1');
    off();
  });

  it('ignores an empty request rather than arming a bad want', () => {
    requestRead('');
    requestRead(null);
    expect(pendingRead()).toBeNull();
  });
});

describe('Play is wired to the reader, not to the deck', () => {
  it('the Play button no longer opens the presenter', () => {
    // The exact shape of the defect, three times over.
    const src = read('components/ChurchLearn.jsx');
    const i = src.indexOf('PLAY READS THE LESSON');
    expect(i).toBeGreaterThan(-1);
    const btn = src.slice(i, i + 1400);
    expect(btn).not.toMatch(/setPresentLesson\(m\)/);
    expect(btn).toMatch(/requestRead\(m\.id\)/);
  });

  it('Play opens the guide, because the lesson registers its own reading', () => {
    // Without this the want would have nothing to attach to and Play would
    // silently do nothing — which is worse than opening the deck.
    const src = read('components/ChurchLearn.jsx');
    const i = src.indexOf('PLAY READS THE LESSON');
    const btn = src.slice(i, i + 1400);
    expect(btn).toMatch(/openLesson\(m\.id\)/);
    expect(btn).toMatch(/setOpenTutorId\(m\.id\)/);
  });

  it('its title says reading, not a big view', () => {
    const src = read('components/ChurchLearn.jsx');
    const i = src.indexOf('PLAY READS THE LESSON');
    expect(src.slice(i, i + 1400)).toMatch(/Read this \$\{U\.noun\} aloud, start to finish/);
  });

  it('the reader starts the want on whichever of the two arrives second', () => {
    // The want and the target race: Play records the want, then the lesson
    // mounts and registers. Subscribing to only one would drop half the cases.
    const src = read('components/TTSControl.jsx');
    const i = src.indexOf('PLAY MEANS READ IT');
    expect(i).toBeGreaterThan(-1);
    const block = src.slice(i, i + 900);
    expect(block).toMatch(/subscribeRead\(tryStart\)/);
    expect(block).toMatch(/subscribeReadTarget\(tryStart\)/);
    expect(block).toMatch(/t\.owner !== w\.owner\) return;/);
  });
});
