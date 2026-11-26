// The classic Learn tools, with their pictures, inside the new look (Darrell
// 2026-11-26: "We have pictures. Why are we showing words all the time?" and,
// of the classic panel, "looking like the old system? When is that update coming?").
//
// The new look's tools panel (LearnStudio's ToolsPanel) provides this context;
// the classic page never does. A classic tool asks useStudioTools(): null means
// it is on the classic page and renders exactly as it always has; a value means
// it is inside the new look and shows each lesson's and course's real cover
// (the presentation records -- the same approved art the new look's cards use,
// never new art) with the lesson's own progress bar. Never blank: a lesson with
// no cover yet shows its number on a panel (MiniThumb), a course its initials.
import React from 'react';
import { MiniThumb } from './LessonsInOrder.jsx';
import { LessonProgressFor } from '../LessonProgressBar.jsx';

export const StudioToolsContext = React.createContext(null);

/** The new look's picture lookups, or null on the classic page. */
export function useStudioTools() {
  return React.useContext(StudioToolsContext);
}

/**
 * The lookups for a presentation index (Map lessonId -> record) and the topic
 * covers ({ shelfId: { image } }). Pure, so the test reads it without a render.
 * lessonCover: the lesson's own approved cover, or null.
 * courseCover: the course's first lesson cover, else its department's topic art, else null.
 */
export function studioToolsFor(index, topicCovers = {}, shelfOf = () => null) {
  const byCourse = new Map();
  for (const r of index ? index.values() : []) {
    if (r && r.courseKey && r.image && r.image.src && !byCourse.has(r.courseKey)) byCourse.set(r.courseKey, r.image);
  }
  const lessonCover = (courseKey, lessonId) => {
    const r = index && index.get(lessonId);
    return r && r.image && r.image.src && (!courseKey || !r.courseKey || r.courseKey === courseKey) ? r.image : null;
  };
  const departmentCover = (label) => {
    const c = topicCovers && topicCovers[shelfOf(label) || 'none'];
    return (c && c.image && c.image.src && c.image) || null;
  };
  const courseCover = (courseKey, departmentLabel) => byCourse.get(courseKey) || departmentCover(departmentLabel) || null;
  return { lessonCover, courseCover, departmentCover };
}

/** A lesson's cover and how far it is read (bar=false where the row already carries its bar), for a classic row in the new look. */
export function StudioLessonThumb({ tools, courseKey, lessonId, label = '', bar = true }) {
  if (!tools) return null;
  const image = tools.lessonCover(courseKey, lessonId);
  return (
    <span className="ls-tool-thumb" data-testid="ls-tool-thumb" data-has-cover={image ? 'true' : 'false'}>
      <MiniThumb image={image} label={label} />
      {bar && <LessonProgressFor courseKey={courseKey} lessonId={lessonId} look="studio" />}
    </span>
  );
}

/** A course's cover for a picture card: its art, or its initials on a panel. Never blank. */
export function StudioCourseCover({ tools, courseKey, department = '', title = '' }) {
  if (!tools) return null;
  const image = tools.courseCover(courseKey, department);
  const initials = String(title || courseKey || '')
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  return (
    <span className="ls-course-cover" aria-hidden="true" data-testid="ls-course-cover" data-has-cover={image ? 'true' : 'false'}>
      {image ? <img src={image.src} alt="" loading="lazy" decoding="async" /> : <span className="ls-mini-code">{initials || '·'}</span>}
    </span>
  );
}
