// @vitest-environment node
// =============================================================================
// A reading says so when it is recorded, so nobody decides it twice (DR-0810)
// =============================================================================
// DR-0768 named this gap and dated it 2026-10-08: a child's homework reading
// arrived as a lesson row, the NAS builder's own gate refused it five times,
// and a human had to go tag it `not-a-lesson` by hand — "the recorder still
// offers no choice at record time between a teaching and a reading, so the
// next homework reading will arrive as a lesson row again and need the same
// verdict by hand."
//
// The recorder now asks once, before Send. A reading rides the SAME road and
// still gets its words back from Whisper; it simply carries the verdict
// DR-0768 built, from the start.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  RECORDING_KINDS, DEFAULT_RECORDING_KIND, RECORDING_KIND_LABELS, READING_REASON,
  normalizeRecordingKind, recordingKindTags, alreadyDecidedNotALesson,
  voiceLessonBody, voiceLessonTags,
} from '../lib/lesson-voice.js';

const REPO = join(process.cwd(), '..');
const SRC = (rel) => readFileSync(join(REPO, rel), 'utf8');

describe('the two kinds, and what each one carries', () => {
  it('two kinds, teaching is the default, each with a word and a line', () => {
    expect(RECORDING_KINDS).toEqual(['teaching', 'reading']);
    expect(DEFAULT_RECORDING_KIND).toBe('teaching');
    for (const k of RECORDING_KINDS) {
      expect(RECORDING_KIND_LABELS[k].label, k).toBeTruthy();
      expect(RECORDING_KIND_LABELS[k].help.length, k).toBeGreaterThan(20);
    }
  });

  it('anything that is not one of the two reads as a teaching — the road\'s old assumption', () => {
    for (const bad of ['sermon', '', null, undefined, 42, {}]) {
      expect(normalizeRecordingKind(bad), String(bad)).toBe('teaching');
    }
    expect(normalizeRecordingKind('reading')).toBe('reading');
  });

  it('a teaching adds nothing; a reading carries the DR-0768 verdict from the start', () => {
    expect(recordingKindTags('teaching')).toEqual([]);
    expect(recordingKindTags()).toEqual([]);
    expect(recordingKindTags('reading')).toEqual([
      'reading-aloud', 'not-a-lesson', `not-a-lesson-reason:${READING_REASON}`,
    ]);
  });

  it('a reading still rides the same road: it keeps lesson and voice, so Whisper still transcribes it', () => {
    const base = voiceLessonTags('x/y.webm');
    expect(base).toContain('lesson');
    expect(base).toContain('voice');
    const whole = [...base, ...recordingKindTags('reading')];
    expect(whole, 'the transcription road keys on these').toEqual(expect.arrayContaining(['lesson', 'voice']));
    expect(whole).toContain('not-a-lesson');
  });

  it('the body says which it is, and a reading says no lesson is built', () => {
    expect(voiceLessonBody('', 65, 'teaching')).toMatch(/^Lesson\. A spoken lesson \(1:05\)/);
    const reading = voiceLessonBody('', 65, 'reading');
    expect(reading).toMatch(/^Reading aloud\./);
    expect(reading).toMatch(/no lesson is built from it/);
    expect(reading).toMatch(/1:05/);
    // the typed note still rides along, either way
    expect(voiceLessonBody('for school', 10, 'reading')).toMatch(/Typed with it: for school/);
    // and an unspecified kind is still the old wording, byte for byte
    expect(voiceLessonBody('', 65)).toBe(voiceLessonBody('', 65, 'teaching'));
  });

  it('a row that was already decided is recognised, however it was decided', () => {
    expect(alreadyDecidedNotALesson(recordingKindTags('reading'))).toBe(true);
    // the hand verdict DR-0768 built writes the same tag
    expect(alreadyDecidedNotALesson(['lesson-captured', 'not-a-lesson', 'not-a-lesson-reason:a child reading homework'])).toBe(true);
    expect(alreadyDecidedNotALesson(['lesson', 'voice'])).toBe(false);
    expect(alreadyDecidedNotALesson(null)).toBe(false);
  });
});

describe('nothing downstream asks again', () => {
  it('PROVEN TO CATCH: the shared waiting query skips a decided row', () => {
    const sql = SRC('scripts/lesson-inbox-waiting.sql');
    expect(sql, 'the one definition of waiting, shared by the list and the bell')
      .toMatch(/AND NOT \(tags \? 'not-a-lesson'\)/);
    // and it still skips everything it skipped before
    for (const t of ['lesson-captured', 'lesson-building', 'awaiting-review']) {
      expect(sql).toContain(`AND NOT (tags ? '${t}')`);
    }
  });

  it('PROVEN TO CATCH: the NAS builder refuses to claim a decided row, by name', () => {
    const py = SRC('infra/nas-lesson-builder/lesson_builder.py');
    expect(py).toMatch(/if "not-a-lesson" in tags:\s*\n(\s*#.*\n)*\s*return False, "marked not a lesson"/);
  });

  it('the recorder asks before Send, and the answer reaches the send', () => {
    const jsx = SRC('app/src/components/OneVoiceInput.jsx');
    expect(jsx, 'the chooser is on the screen').toMatch(/data-testid="recording-kind"/);
    // the buttons are mapped from RECORDING_KINDS, so the testid is a template
    expect(jsx, 'one button per kind, from the one list').toMatch(/RECORDING_KINDS\.map\(/);
    expect(jsx).toMatch(/data-testid=\{`recording-kind-\$\{k\}`\}/);
    expect(jsx, 'it is a radio group, so a remote and a screen reader both work').toMatch(/role="radiogroup"/);
    expect(jsx, 'the chosen kind is handed to the send').toMatch(/sendVoiceLesson\(\{[^}]*kind: recordingKind/);
  });
});
