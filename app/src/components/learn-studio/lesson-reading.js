// =============================================================================
// lesson-reading — what the lesson reading carries beyond the teaching text:
// the lesson's stories, and the reader's own highlighter marks. Split out of
// LessonExperience.jsx (file-budget guard: a file stays under 1500 lines).
// Pure functions plus two fail-soft localStorage helpers.
// =============================================================================
import { storyFootnote, isTeachingSection } from '../../lib/story-truth.js';

// THE STORIES ARE PART OF THE LESSON (Darrell 2026-11-25, from the live build: "What happened to
// the stories, both of them being read?" and "Also displayed... they may end up being the most
// looked forward to... sometimes it's hard to understand a lesson so these help us"). The classic
// reader speaks every story after the teaching (lesson-flow.js readAloudTextFromArc); the new look
// narrated only the teaching and left the stories one tap deep in Study. They now follow the
// teaching in the same reading, so Watch, Read and Listen all show AND speak them. Each story is
// its own words verbatim; the lead says what it is (a parable is never called a record, DR-0811)
// in the same capitals the lesson's own section leads use, so it gets the same ornament, bold
// lead and chapter jump; its truth footnote follows it, as on the classic page.
export function storiesTextFor(lesson) {
  const stories = lesson && Array.isArray(lesson.stories) ? lesson.stories : [];
  const parts = [];
  for (const st of stories) {
    if (!st || typeof st.body !== 'string' || !st.body.trim()) continue;
    const kind = isTeachingSection(st) ? 'MORE ON THIS LESSON' : st.kind === 'testimony' ? 'A TRUE STORY' : 'A PARABLE';
    const name = String(st.title || st.heading || '')
      .toUpperCase()
      .replace(/[^A-Z ,':-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    parts.push(`${name ? `${kind}: ${name}` : kind}. ${st.body.trim()}`);
    // A bare reference ("Luke 16:10") gets its full stop, so the voice ends it there and
    // never runs it into the truth line that follows.
    if (typeof st.verse === 'string' && st.verse.trim()) parts.push(/[.!?"”)]$/.test(st.verse.trim()) ? st.verse.trim() : `${st.verse.trim()}.`);
    parts.push(storyFootnote(st));
  }
  return parts.join('\n\n');
}

// THE HIGHLIGHTER PEN (Darrell 2026-11-25: "also the ability to highlight when possible"). The
// reader turns the pen on and taps a paragraph: it is marked, tapped again it takes the next
// color, and after the last it is clear. Marks are the reader's own: kept on this device only,
// per lesson, as a fingerprint of the paragraph (learn-resume's sentenceKeyOf, never its text),
// so a mark follows its paragraph across reading levels. No true red in the pen: red is
// reserved for the Blood wherever Scripture is marked (DR-0099), and lessons quote Scripture.
export const HIGHLIGHT_KEY = (id) => `poe-lesson-experience:${id}:highlights`;
export const HIGHLIGHT_PENS = ['gold', 'green', 'blue'];
export function nextPen(current) {
  const i = HIGHLIGHT_PENS.indexOf(current);
  return i < 0 ? HIGHLIGHT_PENS[0] : HIGHLIGHT_PENS[i + 1] || null;
}
export function readHighlights(id) {
  try {
    const v = JSON.parse(window.localStorage.getItem(HIGHLIGHT_KEY(id)) || '{}');
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}
export function saveHighlights(id, marks) {
  try {
    window.localStorage.setItem(HIGHLIGHT_KEY(id), JSON.stringify(marks));
  } catch {
    /* no storage: the marks hold for this visit */
  }
}
