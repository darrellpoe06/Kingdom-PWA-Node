// THE EXACT LOCATION IS KEPT, AND ARRIVAL NO LONGER THROWS IT AWAY.
// =============================================================================
// Darrell 2026-09-14: "Lessons keep being interrupted and I'm loosing my exact
// location!!!!!!!!!!!!!????? Fix it!!!!!!!!!!!!"
//
// THE FINDING IS THAT THE FIX ALREADY EXISTED AND LESSONS WERE NEVER WIRED TO
// IT. lib/reading-position.js was built 2026-06-25 for exactly this -- "the
// user should start reading wherever they are reading from... not have to start
// from the top" -- and it persists on scroll, on visibilitychange and on
// unmount, then restores after two frames through a stable anchor with a
// scrollY fallback. The book Reader (Library) and the Pulpit both use it.
// LESSONS DID NOT. That is why the place survived in those surfaces and was
// lost here, and it is why the first attempt at this (a second implementation)
// was the wrong move: I overwrote that module before noticing it existed.
//
// Two further causes, both real and both fixed here:
//   * ONLY THE DEVICE VOICE recorded a sentence. The cloud/cloned-voice path
//     tracks its own sentence by playback fraction and was never wired, so
//     listening in the sovereign voice -- the picker's default -- saved nothing.
//   * ARRIVAL CALLED scrollTo({top: 0}), throwing the view away even when the
//     record was perfect. That is the half felt on every single return.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

describe('lessons keep ONE place record — the sentence, not a second scroll record (DR-0631)', () => {
  // 2026-09-14 wired lessons to reading-position.js (a scroll offset kept
  // BESIDE the lesson's place record). Measured 2026-09-24 in a real browser:
  // after a reload, a tab away or a course switch the lesson came back at the
  // right step and scrollY 0 — the two records disagreed, which is the very
  // drift the "no parallel implementation" pin below exists to prevent. The
  // eye now writes the sentence into the same record the voice writes.
  it('ChurchLearn no longer keeps a separate scroll record for lessons', () => {
    const src = read('components/ChurchLearn.jsx');
    expect(src).not.toMatch(/useReadingResume\(\{ userKey: 'learn', surface: 'lesson'/);
  });

  it("the reader's eye records the sentence into the lesson's own place", () => {
    const src = read('components/ChurchLearn.jsx');
    expect(src).toMatch(/const cur = currentSentence\(root\);/);
    expect(src).toMatch(/savePlace\(\{ lessonId: focusId, sentence: cur\.index, sentenceKey: cur\.key \}\)/);
  });

  it('a tap is not a scroll: only wheel, touch-drag and scroll keys count as the reader moving', () => {
    // Measured in the browser journeys: with pointerdown counted, tapping the
    // Scripture tab to leave recorded the view under the finger over the
    // sentence the read-aloud had saved.
    const src = read('components/ChurchLearn.jsx');
    const i = src.indexOf('A TAP IS NOT A SCROLL');
    expect(i).toBeGreaterThan(-1);
    const block = src.slice(i, i + 1400);
    expect(block).toMatch(/addEventListener\('wheel'/);
    expect(block).toMatch(/addEventListener\('touchmove'/);
    expect(block).not.toMatch(/addEventListener\('pointerdown'/);
  });

  it('keys the position to the LESSON, so lessons do not blur together', () => {
    // the record is per lesson (learn-resume placeKey), read back per lesson
    expect(read('lib/learn-resume.js')).toMatch(/export function getPlaceFor\(courseKey, lessonId/);
    expect(read('components/ChurchLearn.jsx')).toMatch(/getPlaceFor\(course\.key, focusId\)/);
  });

  it('no parallel implementation was left behind', () => {
    // The first attempt wrote lib/use-reading-position.jsx and a renamed
    // reading-line.js. Both are gone; a duplicate place-keeper is how two
    // records drift apart and neither is trusted.
    const src = read('components/ChurchLearn.jsx');
    expect(src).not.toMatch(/use-reading-position/);
    expect(src).not.toMatch(/reading-line/);
  });

  it('the original primitive is intact, not replaced', () => {
    // It was overwritten once. These are its shipped exports.
    const src = read('lib/reading-position.js');
    expect(src).toMatch(/export function useReadingResume/);
    expect(src).toMatch(/export function restorePosition/);
    expect(src).toMatch(/export function captureAnchor/);
    expect(src).toMatch(/READING_ATTR/);
  });
});

describe('arrival no longer discards the place', () => {
  it('skips the top-scroll when a place exists — and LANDS on it instead (DR-0631)', () => {
    const src = read('components/ChurchLearn.jsx');
    const i = src.indexOf('ARRIVAL NO LONGER JUMPS TO THE TOP');
    expect(i).toBeGreaterThan(-1);
    const block = src.slice(i, i + 1400);
    expect(block).toMatch(/if \(hasPlace\) \{ landAt\(resumeLessonId\); return undefined; \}/);
  });

  it('still scrolls to the top for a genuinely fresh open', () => {
    // A lesson with no saved sentence SHOULD start at the top; the fix is
    // conditional, not the removal of the behaviour.
    const src = read('components/ChurchLearn.jsx');
    const i = src.indexOf('ARRIVAL NO LONGER JUMPS TO THE TOP');
    expect(src.slice(i, i + 1400)).toMatch(/window\.scrollTo\(\{ top: 0/);
  });
});

describe('both voices record the sentence', () => {
  it('the DEVICE voice records it', () => {
    expect(read('components/TTSControl.jsx')).toMatch(/rememberSentence\(st\.base \+ segmentIndex, seg\.text\)/);
  });

  it('the CLOUD voice records it too (it never did)', () => {
    const src = read('components/TTSControl.jsx');
    const cloud = src.slice(src.indexOf('CLOUD (cloned-voice) sentence-follow'));
    const effect = cloud.slice(0, cloud.indexOf('}, [cloudProgress'));
    expect(effect).toMatch(/rememberSentence\(st\.base \+ idx, seg\.text\)/);
  });

  it('both use the ABSOLUTE index, so resuming does not creep earlier', () => {
    // A run that started mid-lesson has base > 0; a relative index would move
    // the saved place backwards every time the reader resumed.
    const src = read('components/TTSControl.jsx');
    expect(src).not.toMatch(/rememberSentence\(segmentIndex,/);
    expect(src).not.toMatch(/rememberSentence\(idx,/);
  });
});
