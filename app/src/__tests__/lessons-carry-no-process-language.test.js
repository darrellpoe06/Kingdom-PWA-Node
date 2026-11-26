// @vitest-environment node
// =============================================================================
// lessons-carry-no-process-language — a lesson teaches the subject; it does not
// hand the reader our research errand (DR-1689)
// =============================================================================
// Darrell, 2026-11-26: "I'm annoyed by lessons saying they didn't research!!!!"
// then "How about old ones?!!!" and "Not necessarily... just still gets it
// done..." Lessons were telling the reader "we did not read the full article",
// "the video could not be fetched from the cloud", "recurly.com did not resolve
// on our network". The rule: do the research, state what the record shows,
// name a genuine dispute and who holds it, leave out what cannot be supported.
//
// THE GATE. Every reader-facing field of every mounted lesson (the catalog and
// the Eternal Algorithms courses) is scanned sentence by sentence
// (lib/process-language.js). A lesson NOT on the debt list that carries process
// language fails the build, so no new lesson ships with it.
//
// THE RATCHET. The lessons carrying it on 2026-11-26 are listed in
// lib/process-language-debt.json. The list may only shrink: a listed lesson
// that is now clean must come off the list (so cleaned work cannot silently
// regress), and the list may never grow past its ceiling.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { buildEternalProcessingCourses } from '../lib/eternal-algorithms-course.js';
import { processLanguage, PROCESS_RE, TEACHING_RE } from '../lib/process-language.js';

const DEBT = JSON.parse(readFileSync(join(process.cwd(), 'src/lib/process-language-debt.json'), 'utf8'));
const CEILING = DEBT.ceiling;

function everyMountedLesson() {
  const out = [];
  for (const c of buildCatalogCourseDescriptors()) for (const l of c.schedule) out.push(l);
  for (const c of buildEternalProcessingCourses()) for (const l of c.schedule) out.push(l);
  return out;
}

describe('lessons carry no research-process language in reader-facing fields', () => {
  const all = everyMountedLesson();
  const dirty = new Map(all.map((l) => [l.id, processLanguage(l)]).filter(([, h]) => h.length));
  const listed = new Set(DEBT.lessons);

  it('walks the whole Learn space', () => {
    expect(all.length).toBeGreaterThanOrEqual(900);
  });

  it('no lesson outside the dated debt list carries process language', () => {
    const fresh = [...dirty].filter(([id]) => !listed.has(id)).map(([id, h]) => ({ id, first: h[0] }));
    expect(fresh).toEqual([]);
  });

  it('the debt list only shrinks: a cleaned lesson comes off it, and it never passes its ceiling', () => {
    const cleaned = [...listed].filter((id) => all.some((l) => l.id === id) && !dirty.has(id));
    expect(cleaned).toEqual([]);
    expect(DEBT.lessons.length).toBeLessThanOrEqual(CEILING);
  });

  it('PROVEN TO CATCH: each shape that shipped is named, and the teaching sentences are kept', () => {
    const lesson = (t) => ({ id: 'probe', levels: { teen: t } });
    for (const t of [
      'We did not read the full article, because it sat behind a link.',
      'Unverified: recurly.com did not resolve on our network, failing with getaddrinfo ENOTFOUND.',
      'The video could not be fetched from the cloud, so his words rest on the summary.',
      'cisa.gov was not fetched, so it is carried as search-verified, not as read.',
      'WHAT WE DID NOT CHECK. Nobody here opened the index documents.',
      'We could not read the company papers ourselves.',
    ])
      expect(processLanguage(lesson(t)).length, t).toBeGreaterThan(0);
    for (const t of [
      'Under-claiming a verified truth is as much a failure of truth as over-claiming an unverified one.',
      'Against an elder receive not an accusation; Paul guards him from unverified accusation.',
      'Write what remains unverified, put a date beside each item, and set that against the closing date.',
      'Those who searched his writings report the sentence is not there, so treat the attribution as unverified.',
    ])
      expect(processLanguage(lesson(t)), t).toEqual([]);
    expect(PROCESS_RE.test('we did not read the full article')).toBe(true);
    expect(TEACHING_RE.test('we did not read the full article')).toBe(false);
  });
});
