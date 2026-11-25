// =============================================================================
// Lesson Experience door -- WHICH lessons open in the new four-mode look, for
// everyone (Darrell, 2026-11-25): "only ... the lessons that already have their
// own completed custom thumbnail images ... publicly available to everyone ...
// Leave the remaining lessons in their existing format until their individual
// artwork is completed. Do not use temporary department images to launch
// additional lessons. Automatically enable the new four-mode experience for
// additional lessons as their custom artwork is completed and approved."
//
// One rule, used by classic Learn (everyone) and Learn Studio (owner device):
//   a lesson opens in the Experience  <=>  its presentation record is approved
//   (VISIBLE_STATUSES, or listed in experience-approved.json -- Darrell's
//   2026-11-25 approval of the 150 finished covers) AND it has its OWN image
//   AND the lesson's original title is unchanged since approval (presentLesson's
//   stale check). Department art never qualifies a lesson.
// Everything else keeps its existing reader, untouched.
// =============================================================================
import React, { useMemo } from 'react';
import LessonExperience, { LessonExperienceBoundary } from './LessonExperience.jsx';
import RECORDS from '../../lib/learn-presentation/presentation-records.json';
import APPROVED from '../../lib/learn-presentation/experience-approved.json';
import { presentationIndex, presentLesson, VISIBLE_STATUSES } from '../../lib/learn-presentation/presentation.js';
import { lessonVersions } from '../../lib/learn-organize.js';

const BASE = (import.meta.env && import.meta.env.BASE_URL) || '/';
const at = (s) => (typeof s === 'string' ? s.replace(/(^|, )learn-thumbs\//g, `$1${BASE}learn-thumbs/`) : s);
const withBase = (im) => im && im.src && { ...im, src: at(im.src), srcSet: im.srcSet && { webp: at(im.srcSet.webp) } };

const APPROVED_IDS = new Set((APPROVED && APPROVED.lessonIds) || []);
const INDEX = presentationIndex(
  ((RECORDS && RECORDS.records) || []).map((r) => (APPROVED_IDS.has(r.lessonId) && !VISIBLE_STATUSES.includes(r.status) ? { ...r, status: 'approved' } : r))
);

const keyOf = (course) => course && (course.key || (course.meta && course.meta.key));

/** The lesson's approved presentation with its OWN cover, or null. */
export function experienceRecord(lesson, course) {
  if (!lesson || !course) return null;
  const p = presentLesson(lesson, course, INDEX, { preview: false, lite: true });
  if (!p || !p.hasPresentation || !p.image || !p.image.src) return null;
  if (!lessonVersions(lesson).length) return null;
  return {
    lessonId: lesson.id,
    courseKey: keyOf(course),
    displayTitle: p.displayTitle,
    thumbHeadline: p.thumbHeadline,
    courseTitle: (course.meta && course.meta.title) || course.title || keyOf(course),
    image: withBase(p.image),
    imageAlt: p.imageAlt,
  };
}

export const isExperienceLesson = (lesson, course) => !!experienceRecord(lesson, course);

/** Up next: the following lessons in the same course that are ALSO live in the Experience. */
export function moreExperienceLessons(lesson, course, limit = 12) {
  const rows = (course && (course.schedule || course.lessons)) || [];
  const from = rows.findIndex((l) => l && l.id === lesson.id);
  const out = [];
  for (let i = 1; i < rows.length && out.length < limit; i += 1) {
    const l = rows[(from + i) % rows.length];
    const rec = l && l.id !== lesson.id ? experienceRecord(l, course) : null;
    if (rec) out.push(rec);
  }
  return out;
}

/**
 * The Experience for one approved lesson. onOpen(courseKey, lessonId) moves to
 * another lesson of the same course; onFullPage shows this lesson's full
 * classic page (share, media, every existing tool) -- also where a crash lands.
 * lessonTools carries the classic space's own progress, download, resume and
 * screen-awake hooks into the Experience (see LessonExperienceTools.jsx).
 */
export default function LessonExperienceDoor({
  lesson,
  course,
  onExit,
  onOpen,
  onFullPage,
  lessonTools = null,
  initialMode = 'watch',
  initialLevel = 'adult',
}) {
  const record = useMemo(() => experienceRecord(lesson, course), [lesson, course]);
  const more = useMemo(() => moreExperienceLessons(lesson, course), [lesson, course]);
  if (!record) return null;
  return (
    <LessonExperienceBoundary onExit={onFullPage || onExit}>
      <LessonExperience
        key={`${record.courseKey}/${lesson.id}`}
        lesson={lesson}
        record={record}
        onExit={onExit}
        initialMode={initialMode}
        initialLevel={initialLevel}
        moreLessons={more}
        onOpenOther={(courseKey, lessonId) => onOpen && onOpen(courseKey, lessonId)}
        onFullPage={onFullPage}
        lessonTools={lessonTools}
      />
    </LessonExperienceBoundary>
  );
}
