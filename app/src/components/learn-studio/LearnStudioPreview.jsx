// The redesigned Learn as an OWNER PREVIEW inside the real app (2026-11-24):
// ChurchLearn shows it only on a device that opted in (?learnStudio=1,
// remembered; ?learnStudio=0 turns it off). Every other member sees Learn as
// before. Read / Listen / an age chip hand the REAL lesson back to the reader.
//
// FAIL-SAFE (2026-11-24, post-incident): this is experimental, preview-only
// code reached from inside the live shell. LearnStudioErrorBoundary below
// means ANY render error here -- today's or a future one -- falls back to
// the classic Learn view and remembers "off" (so a reopen does not re-enter
// and re-crash), instead of taking the whole app's React tree down with it.
// Darrell's wife, 2026-11-24, with every button in the app frozen: this
// boundary is the fix for THAT CLASS of failure, whatever the exact cause.
import React, { useMemo, useState } from 'react';
import LearnStudio from './LearnStudio.jsx';
import { presentationIndex, isLearnStudioOn, STUDIO_FLAG_KEY } from '../../lib/learn-presentation/presentation.js';

export { isLearnStudioOn };
import RECORDS from '../../lib/learn-presentation/presentation-records.json';
import TOPICS from '../../lib/learn-presentation/presentation-topics.json';
import { PROTOTYPE_LESSON_ID } from './LessonExperience.jsx';
import LessonExperienceDoor, { isExperienceLesson } from './LessonExperienceDoor.jsx';

// Covers ship under public/learn-thumbs with base-relative paths; resolve them
// against the app's base (web /poetech-app/, native /).
const BASE = (import.meta.env && import.meta.env.BASE_URL) || '/';
const at = (s) => (typeof s === 'string' ? s.replace(/(^|, )learn-thumbs\//g, `$1${BASE}learn-thumbs/`) : s);
const image = (im) => im && im.src && { ...im, src: at(im.src), srcSet: im.srcSet && { webp: at(im.srcSet.webp) } };

export class LearnStudioErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { crashed: false };
  }
  static getDerivedStateFromError() {
    return { crashed: true };
  }
  componentDidCatch(error, info) {
    console.error('Learn Studio preview crashed; falling back to classic Learn.', error, info && info.componentStack);
    try {
      window.localStorage.setItem(STUDIO_FLAG_KEY, '0'); // never re-enter and re-crash on reopen
    } catch {
      /* no storage */
    }
    this.props.onExit(); // a lifecycle method, not render: safe to trigger the parent's state change here
  }
  render() {
    return this.state.crashed ? null : this.props.children;
  }
}

export default function LearnStudioPreview({ courses, onOpenLesson, onExit, ownerDevice = false, initialLessonId = null, initialCourseKey = null }) {
  const index = useMemo(() => presentationIndex(((RECORDS && RECORDS.records) || []).map((r) => ({ ...r, image: image(r.image) }))), []);
  const topics = useMemo(() => Object.fromEntries(Object.entries(TOPICS || {}).map(([k, v]) => [k, { ...v, image: image(v.image) }])), []);
  // THE LESSON EXPERIENCE (Darrell, 2026-11-25): the four-mode look opens for
  // every lesson with its OWN approved cover, through the same door classic
  // Learn uses for everyone (LessonExperienceDoor.jsx). Any other lesson hands
  // off to the classic reader exactly as before; department art never
  // launches a lesson into the new look.
  const [exp, setExp] = useState(null); // { courseKey, lessonId, mode, level }
  const byCourse = useMemo(() => {
    const m = new Map();
    for (const c of courses || []) {
      const key = c && (c.key || (c.meta && c.meta.key));
      if (key) m.set(key, c);
    }
    return m;
  }, [courses]);
  const findLesson = (courseKey, lessonId) => {
    const c = byCourse.get(courseKey);
    const row = c && (c.schedule || c.lessons || []).find((l) => l && l.id === lessonId);
    return row ? { course: c, lesson: row } : null;
  };
  const keyOf = (course) => course && (course.key || (course.meta && course.meta.key));
  const canExperience = (lesson, course) => {
    if (!ownerDevice || !lesson || !course) return false;
    const hit = findLesson(keyOf(course), lesson.id);
    return !!(hit && isExperienceLesson(hit.lesson, hit.course));
  };
  const openExp = (lesson, course, mode, level) => setExp({ courseKey: keyOf(course), lessonId: lesson.id, mode, level });
  // LearnStudio's own read/listen/version wrappers call this hand-off as
  // onRead(lesson, course, mode) / onListen(lesson, course) / onVersion(lesson,
  // course, v) -- see its doc comment.
  const toClassic = (lesson, course) => {
    const courseKey = keyOf(course);
    return lesson && courseKey && onOpenLesson(courseKey, lesson.id);
  };
  // Read / Watch Video / Listen / an age chip keep the new look all the way
  // through for an Experience lesson (Darrell, 2026-11-25).
  const openRead = (lesson, course, mode) =>
    canExperience(lesson, course) ? openExp(lesson, course, mode === 'video' ? 'watch' : 'read', 'adult') : toClassic(lesson, course);
  const openListen = (lesson, course) => (canExperience(lesson, course) ? openExp(lesson, course, 'listen', 'adult') : toClassic(lesson, course));
  const openVersion = (lesson, course, v) => (canExperience(lesson, course) ? openExp(lesson, course, 'read', v || 'adult') : toClassic(lesson, course));

  const current = exp && ownerDevice ? findLesson(exp.courseKey, exp.lessonId) : null;
  if (current && isExperienceLesson(current.lesson, current.course)) {
    const close = () => setExp(null);
    return (
      <LessonExperienceDoor
        key={`${exp.courseKey}/${exp.lessonId}`}
        lesson={current.lesson}
        course={current.course}
        onExit={close}
        initialMode={exp.mode}
        initialLevel={exp.level}
        onOpen={(courseKey, lessonId) => setExp({ courseKey, lessonId, mode: 'watch', level: 'adult' })}
        onClassic={() => {
          close();
          onOpenLesson(exp.courseKey, exp.lessonId);
        }}
      />
    );
  }

  return (
    <section className="w-full" aria-label="Learn">
      {ownerDevice && byCourse.has('living-lessons') && (
        <button
          type="button"
          onClick={() => setExp({ courseKey: 'living-lessons', lessonId: PROTOTYPE_LESSON_ID, mode: 'watch', level: 'adult' })}
          style={{
            display: 'block',
            width: '100%',
            margin: '0 0 12px',
            padding: '12px 16px',
            borderRadius: 14,
            border: '1px solid #f2bf2e',
            background: 'rgba(242,191,46,0.1)',
            color: '#f2bf2e',
            fontWeight: 700,
            fontSize: '0.9375rem',
            textAlign: 'left',
          }}
        >
          ✦ Try the new lesson experience (prototype) — Not with Eyeservice
        </button>
      )}
      <LearnStudioErrorBoundary onExit={onExit}>
        <LearnStudio
          courses={courses}
          index={index}
          preview
          topicCovers={topics}
          onRead={openRead}
          onListen={openListen}
          onVersion={openVersion}
          onExit={onExit}
          initialLesson={initialLessonId}
          initialCourse={initialCourseKey}
        />
      </LearnStudioErrorBoundary>
    </section>
  );
}
