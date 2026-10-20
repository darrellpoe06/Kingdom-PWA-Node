// =============================================================================
// prompt-words — the words come back WHERE THE LINE WAS MADE (DR-1135)
// =============================================================================
// Darrell, 2026-10-20, a screenshot of Your prompts with six rows reading
// "Spoken lesson, 28:24 (the words come back from Whisper)" from 09-30 to
// 10-09, and two words: "Not working...".
//
// MEASURED FIRST (DR-0076 §4), on the live database by voice-intake-health
// run 39479627269: all ten spoken lessons HAVE their transcript, every one
// written by whisper:nas-cpu, the 28:24 one 51 minutes after it was sent and
// the newest on 2026-10-09 at 14:01. The road works. What does not work is
// the promise: the line the recorder wrote into the box says the words come
// back, and the row that keeps that line never changes when they do. The
// words land under Your lessons (LessonInbox); the row he was looking at
// keeps saying "come back" eleven days later. A surface that keeps a promise
// it has no way to keep is the DR-0636 loop left open on one screen.
//
// This joins the two. A prompt row holds no recording id (saved_prompts was
// built for typed words), so the join is by the two facts both rows carry:
// the CLOCK in the line ("28:24", which the voice row's body repeats as
// "(28:24)") and the TIME it was sent (the prompt is remembered in the same
// send). Nearest by time wins, inside a window wide enough for a slow
// upload and never wide enough to reach another day's recording.
//
// Pure; the data layer is injected. PromptHistory renders the answer.
// =============================================================================
import { transcriptWords } from './lesson-inbox.js';

/** The line the recorder writes for a spoken lesson with no typed words (OneVoiceInput). */
const SPOKEN_LINE = /^Spoken lesson, (\d+:\d\d) \(the words come back from Whisper\)$/;

/** A prompt's send and its recording's row are minutes apart, never hours. */
export const MATCH_WINDOW_MS = 30 * 60 * 1000;

/** The clock inside a spoken-lesson line ("28:24"), or '' for any other prompt. */
export function spokenLessonClock(body) {
  const m = SPOKEN_LINE.exec(String(body || '').trim());
  return m ? m[1] : '';
}

/**
 * The recording this prompt row stands for, and where its words are.
 * @param {{body:string, created_at?:string}} prompt  a saved_prompts row
 * @param {Array} items  lessonItems() from lesson-inbox.js (the person's own rows)
 * @returns {null | {state:'written'|'waiting'|'failed'|'unmatched', clock:string, item:object|null, words:string, at:string, rung:string, why:string}}
 *   null when the prompt is not a spoken-lesson line at all.
 */
export function wordsForPrompt(prompt, items) {
  const clock = spokenLessonClock(prompt && prompt.body);
  if (!clock) return null;
  const sentAt = Date.parse((prompt && prompt.created_at) || '');
  const marker = `(${clock})`;
  let best = null; let bestGap = Infinity;
  for (const it of Array.isArray(items) ? items : []) {
    if (!it || !it.spoken || !String(it.body || '').includes(marker)) continue;
    const at = Date.parse(it.createdAt || '');
    const gap = Number.isFinite(sentAt) && Number.isFinite(at) ? Math.abs(at - sentAt) : MATCH_WINDOW_MS;
    if (gap <= MATCH_WINDOW_MS && gap < bestGap) { best = it; bestGap = gap; }
  }
  if (!best) return { state: 'unmatched', clock, item: null, words: '', at: '', rung: '', why: '' };
  const state = best.state === 'written' || best.state === 'failed' ? best.state : 'waiting';
  return {
    state,
    clock,
    item: best,
    words: state === 'written' ? transcriptWords(best.words) : '',
    at: state === 'written' ? best.transcriptAt || '' : state === 'failed' ? best.failedAt || '' : best.createdAt || '',
    rung: best.rung || '',
    why: state === 'failed' ? String(best.why || '') : '',
  };
}

/** Whether any row in a prompt list is a spoken-lesson line (so the lessons are worth reading at all). */
export function anySpokenLine(rows) {
  return (Array.isArray(rows) ? rows : []).some((r) => !!spokenLessonClock(r && r.body));
}
