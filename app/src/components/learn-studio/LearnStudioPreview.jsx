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
import { presentationIndex, isLearnStudioOn, STUDIO_FLAG_KEY, allLessons } from '../../lib/learn-presentation/presentation.js';

export { isLearnStudioOn };
import RECORDS from '../../lib/learn-presentation/presentation-records.json';
import TOPICS from '../../lib/learn-presentation/presentation-topics.json';
import LessonExperience, { LessonExperienceBoundary, PROTOTYPE_LESSON_ID, textFor } from './LessonExperience.jsx';
import PROTOTYPE_LESSON from '../../lib/living-lessons/ll338-not-with-eyeservice.js';

// Covers ship under public/learn-thumbs with base-relative paths; resolve them
// against the app's base (web /poetech-app/, native /).
const courseKeyOf = (course) => (course && (course.key || (course.meta && course.meta.key))) || null;
// The Experience reads the lesson's own words (adult text, or an age version
// when that is all a lesson carries; see textFor). Every one of the 994 has one.
const hasOwnText = (lesson) => !!lesson && !!textFor(lesson, 'adult').trim();
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
  // The Lesson Experience (Watch / Read / Listen / Study). Built as a ONE-lesson
  // prototype (ll338) for Darrell's approval; approved 2026-11-25: "Update them
  // to our new look?!!!!!! Yet?!!!!" Every lesson now opens here (all 994 have
  // their own words), on the SAME owner-device signal that defaults Learn
  // Studio on. Only a lesson with no words at all would go to the classic
  // reader, so nothing is ever opened empty.
  const [active, setActive] = useState(null); // { lesson, course } open in the Experience, or null
  const [experienceMode, setExperienceMode] = useState('watch');
  const [experienceLevel, setExperienceLevel] = useState('adult');
  const catalog = useMemo(() => allLessons(courses), [courses]);
  const prototypeRecord = index.get(PROTOTYPE_LESSON_ID) || null;
  const activeRecord = active ? index.get(active.lesson.id) || null : null;
  const activeCourseKey = active ? courseKeyOf(active.course) : null;
  // Darrell, 2026-11-25: "the all listed should populate like YouTube... so
  // all available can be seen in a list of options." Other real lessons of the
  // SAME course, each with its real approved cover; no new art.
  const moreLessons = useMemo(() => {
    if (!active) return [];
    return [...index.values()].filter((r) => r.courseKey === activeCourseKey && r.lessonId !== active.lesson.id && r.image && r.image.src).slice(0, 12);
  }, [index, active, activeCourseKey]);
  // LearnStudio's own read/listen/version wrappers call this hand-off as
  // onRead(lesson, course, mode) / onListen(lesson, course) / onVersion(lesson,
  // course, v) -- see its doc comment. A single-argument (x) here (checking
  // x.p) was a shape mismatch: it silently received the bare lesson object,
  // found no .p, and no-op'd -- Read Lesson / Listen / an age chip did nothing
  // while the rest of the app kept working (Darrell's wife, 2026-11-24: "They
  // were just static images without functionality added... the app still
  // moved"). courseKey mirrors presentationIndex's own derivation.
  const toClassic = (lesson, course) => {
    const courseKey = courseKeyOf(course);
    return lesson && courseKey && onOpenLesson(courseKey, lesson.id);
  };
  const opens = (lesson) => ownerDevice && hasOwnText(lesson);
  const open = (lesson, course, mode, level) => {
    setExperienceLevel(level);
    setExperienceMode(mode);
    setActive({ lesson, course });
  };
  // Darrell, 2026-11-25: "I like the new look until a user chooses the play or
  // read button -- they should keep the new look of the system." Read / Watch
  // Video / Listen / an age chip open the Experience in the matching mode.
  const openRead = (lesson, course, mode) => (opens(lesson) ? open(lesson, course, mode === 'video' ? 'watch' : 'read', 'adult') : toClassic(lesson, course));
  const openListen = (lesson, course) => (opens(lesson) ? open(lesson, course, 'listen', 'adult') : toClassic(lesson, course));
  const openVersion = (lesson, course, v) => (opens(lesson) ? open(lesson, course, 'read', v || 'adult') : toClassic(lesson, course));
  // A More Lessons row stays in the new look too; only a lesson with no text
  // of its own (or one not in this catalog) goes to the classic reader.
  const openOther = (courseKey, lessonId) => {
    const hit = catalog.find((x) => x.lesson.id === lessonId && courseKeyOf(x.course) === courseKey);
    if (hit && opens(hit.lesson)) return open(hit.lesson, hit.course, 'watch', 'adult');
    setActive(null);
    return onOpenLesson(courseKey, lessonId);
  };
  if (active && ownerDevice) {
    return (
      <LessonExperienceBoundary onExit={() => setActive(null)}>
        <LessonExperience
          key={active.lesson.id}
          lesson={active.lesson}
          record={activeRecord}
          onExit={() => setActive(null)}
          initialMode={experienceMode}
          initialLevel={experienceLevel}
          moreLessons={moreLessons}
          onOpenOther={openOther}
          onFullPage={() => {
            setActive(null);
            toClassic(active.lesson, active.course);
          }}
        />
      </LessonExperienceBoundary>
    );
  }

  return (
    <section className="w-full" aria-label="Learn">
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
      {ownerDevice && prototypeRecord && (
        <button
          type="button"
          onClick={() => open(PROTOTYPE_LESSON, catalog.find((x) => x.lesson.id === PROTOTYPE_LESSON_ID)?.course || null, 'watch', 'adult')}
          style={{
            display: 'block',
            width: '100%',
            margin: '12px 0 0',
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
    </section>
  );
}
