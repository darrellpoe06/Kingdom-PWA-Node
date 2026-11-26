// =============================================================================
// Every presented lesson answers the question its title asks (DR-1687)
// =============================================================================
// A lesson that wears a reader-facing title (presentation-records.json) must
// either carry an audited entry in lib/lesson-title-answers/<course>.json, or
// open with the answer in its own source (THE QUESTION IN THE TITLE.). So a new
// title can never again ship over a lesson that does not answer it.
//
// PENDING_COURSES is the ratchet while the courses land one batch at a time:
// it may only shrink, and a course leaves it when its file is complete.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import RECORDS from '../lib/learn-presentation/presentation-records.json';
import { learnInventory } from '../lib/learn-presentation/integrity.js';
import {
  TITLE_ANSWERS,
  TITLE_LEAD,
  CLOSE_LEAD,
  ADULT_FALLBACK,
  titleAnswerFor,
  withTitleAnswer,
  withTitleAnswers,
  breakAtLeads,
  entryProblems,
  titleClosingFor,
} from '../lib/lesson-title-answers.js';
import { readingTextFor } from '../components/learn-studio/LessonExperience.jsx';
import { buildLessonArc, readAloudTextFromArc } from '../lib/lesson-flow.js';

const PENDING_COURSES = new Set([
  // every course is answered
]);

const own = (v) => (typeof v === 'string' && v.trim() ? v : null);
const authorAdult = (l) => own(l.lesson) || ADULT_FALLBACK.map((k) => l.levels && own(l.levels[k])).find(Boolean) || '';
const squash = (s) => String(s).replace(/\s+/g, ' ').trim();

const raw = new Map();
for (const c of learnInventory()) for (const l of c.lessons) raw.set(`${c.key}::${l.id}`, l);
const records = RECORDS.records;

describe('every presented lesson answers its title', () => {
  it('every presented lesson is answered: an audited entry, or the answer written into its own source', () => {
    const unanswered = records
      .filter((r) => !PENDING_COURSES.has(r.courseKey))
      .filter((r) => !titleAnswerFor(r.courseKey, r.lessonId) && !authorAdult(raw.get(`${r.courseKey}::${r.lessonId}`) || {}).startsWith(TITLE_LEAD))
      .map((r) => `${r.courseKey}::${r.lessonId} "${r.displayTitle}"`);
    expect(unanswered).toEqual([]);
  });

  it('a pending course is a real presented course (the ratchet only shrinks)', () => {
    const presented = new Set(records.map((r) => r.courseKey));
    expect([...PENDING_COURSES].filter((k) => !presented.has(k))).toEqual([]);
    expect([...PENDING_COURSES].filter((k) => TITLE_ANSWERS[k])).toEqual([]);
  });

  it('every entry is for a presented lesson, and is sound against the author’s own text', () => {
    const presented = new Set(records.map((r) => `${r.courseKey}::${r.lessonId}`));
    const bad = [];
    for (const [course, table] of Object.entries(TITLE_ANSWERS)) {
      for (const [id, entry] of Object.entries(table)) {
        const key = `${course}::${id}`;
        if (!presented.has(key) || !raw.has(key)) {
          bad.push(`${key}: not a presented lesson`);
          continue;
        }
        for (const p of entryProblems(entry, authorAdult(raw.get(key)))) bad.push(`${key}: ${p}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('as read (adult, teen, senior): opens on the answer, keeps every word of the author and the stories, ENDS on the answer after the stories', () => {
    const bad = [];
    for (const [course, table] of Object.entries(TITLE_ANSWERS)) {
      for (const [id, entry] of Object.entries(table)) {
        const l = raw.get(`${course}::${id}`);
        if (!l || entry.verdict === 'ANSWERS-CLEARLY') continue;
        const author = authorAdult(l);
        if (author.startsWith(TITLE_LEAD)) continue;
        const m = withTitleAnswer(l, entry);
        const read = readingTextFor(m, 'adult');
        if (entry.open && !read.startsWith(`${TITLE_LEAD} `)) bad.push(`${id}: does not open on the answer`);
        if (!read.endsWith(entry.close)) bad.push(`${id}: the last thing read is not the answer`);
        if (!squash(read).includes(squash(author))) bad.push(`${id}: the author's text is not intact`);
        if (squash(readingTextFor(l, 'adult')).length && !squash(read).includes(squash(readingTextFor(l, 'adult')).replace(squash(author), '').trim()))
          bad.push(`${id}: a story changed`);
        for (const band of ['teen', 'senior']) {
          if (!own(l.levels && l.levels[band]) || !entry[band] || band === ADULT_FALLBACK.find((k) => !own(l.lesson) && own(l.levels && l.levels[k]))) continue;
          const r = readingTextFor(m, band);
          if (entry[band].close && !r.endsWith(entry[band].close)) bad.push(`${id}: ${band} does not end on the answer`);
          if (!squash(r).includes(squash(l.levels[band]))) bad.push(`${id}: ${band} text is not intact`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('the audit table is the data, not a copy of it', () => {
  it('docs/99-session-notes/2026-11-26-lessons-answer-their-titles-audit.md is current', () => {
    expect(() => execFileSync('node', ['../scripts/lesson-title-answers-audit.mjs', '--check'], { stdio: 'pipe' })).not.toThrow();
  });
});

describe('the gate is proven to catch', () => {
  const lesson = {
    id: 'x1',
    lesson: 'Opening words. THE FIRST SECTION. Body here, "WITHIN A QUOTE. Still quoted" ends. LAST PART.',
    levels: { teen: 'Teen text.', senior: 'Senior text.' },
  };
  const good = {
    verdict: 'DOES-NOT-ANSWER',
    reason: 'Teaches around the question and never states the answer.',
    open: `${TITLE_LEAD} Does this test catch a gap? Yes, it does, and it says plainly where the lesson falls short so the fix can be made before it ships to a reader.`,
    close: `${CLOSE_LEAD} Does this test catch a gap? It does: a lesson without an answer cannot pass, and a quotation the lesson never held cannot slip into the additions unseen.`,
    teen: { open: 'Here is the short answer first, in plain and simple words.', close: 'So now you know the plain answer to the title.' },
    senior: { open: 'The title asks a fair question, and the answer is plain.', close: 'So the question in the title is answered by the lesson.' },
  };

  it('a sound entry passes, and the reading opens and ends on the answer', () => {
    expect(entryProblems(good, lesson.lesson)).toEqual([]);
    const read = withTitleAnswer(lesson, good);
    expect(read.lesson.startsWith(TITLE_LEAD)).toBe(true);
    expect(read.lesson.includes(good.close)).toBe(false);
    expect(readingTextFor(read, 'adult').endsWith(good.close)).toBe(true);
    expect(read.levels.teen.startsWith(good.teen.open)).toBe(true);
    expect(readingTextFor(read, 'senior').endsWith(good.senior.close)).toBe(true);
    expect(titleClosingFor(read, 'teen')).toBe(good.teen.close);
  });

  it('catches a quotation the lesson does not hold', () => {
    const bad = {
      ...good,
      close: `${CLOSE_LEAD} The answer is "words that were never in this lesson at all" and that must be caught before any reader sees it in the app.`,
    };
    expect(entryProblems(bad, lesson.lesson).join()).toMatch(/quotes words the lesson does not hold/);
  });

  it('catches a missing close, a missing lead, "God" in our voice and a capitalized adversary name', () => {
    expect(entryProblems({ ...good, close: undefined }, lesson.lesson).join()).toMatch(/close missing/);
    expect(entryProblems({ ...good, open: good.open.replace(TITLE_LEAD, 'ANSWER.') }, lesson.lesson).join()).toMatch(/must open/);
    expect(entryProblems({ ...good, open: `${good.open} God sees it.` }, lesson.lesson).join()).toMatch(/Yahweh/);
    expect(entryProblems({ ...good, close: `${good.close} Satan lost.` }, lesson.lesson).join()).toMatch(/adversary/);
  });

  it('the closing is read after the stories, in both readers and in the voice', () => {
    const withStory = { ...lesson, stories: [{ kind: 'parable', title: 'The Lamp', body: 'A lamp was lit and set on a stand.' }] };
    const read = withTitleAnswer(withStory, good);
    const text = readingTextFor(read, 'adult');
    expect(text.indexOf('A lamp was lit')).toBeGreaterThan(-1);
    expect(text.indexOf(good.close)).toBeGreaterThan(text.indexOf('A lamp was lit'));
    const spoken = readAloudTextFromArc(buildLessonArc(read));
    expect(spoken.indexOf(good.close.slice(0, 40))).toBeGreaterThan(spoken.indexOf('A lamp was lit'));
  });

  it('catches a lesson left unanswered', () => {
    const table = { demo: {} };
    expect(titleAnswerFor('demo', 'x1', table)).toBe(null);
    expect(withTitleAnswers([{ key: 'demo', schedule: [lesson] }], table)[0].schedule[0]).toBe(lesson);
  });

  it('breaks only before the author’s own leads, never inside a quotation, and changes no word', () => {
    const text = 'Opening words. THE FIRST SECTION. Body, "AND THE LORD SAID UNTO HIM. Go" ends. THEN THE SECOND PART. More.';
    const out = breakAtLeads(text);
    expect(out).toContain('\n\nTHE FIRST SECTION.');
    expect(out).toContain('\n\nTHEN THE SECOND PART.');
    expect(out).not.toContain('\n\nAND THE LORD');
    expect(squash(out)).toBe(squash(text));
  });

  it('never doubles an answer the author wrote into the source', () => {
    const written = { ...lesson, lesson: `${TITLE_LEAD} Already answered in the source.` };
    expect(withTitleAnswer(written, good)).toBe(written);
  });
});
