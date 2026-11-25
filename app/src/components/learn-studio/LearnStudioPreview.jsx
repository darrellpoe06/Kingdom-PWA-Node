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
import LessonExperience, { LessonExperienceBoundary, PROTOTYPE_LESSON_ID } from './LessonExperience.jsx';
import PROTOTYPE_LESSON from '../../lib/living-lessons/ll338-not-with-eyeservice.js';

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

export default function LearnStudioPreview({ courses, onOpenLesson, onExit, ownerDevice = false }) {
  const index = useMemo(() => presentationIndex(((RECORDS && RECORDS.records) || []).map((r) => ({ ...r, image: image(r.image) }))), []);
  const topics = useMemo(() => Object.fromEntries(Object.entries(TOPICS || {}).map(([k, v]) => [k, { ...v, image: image(v.image) }])), []);
  // PRIVATE PROTOTYPE (Darrell, 2026-11-25): one lesson, four modes (Watch /
  // Read / Listen / Study), for his approval before any wider build. Gated to
  // the SAME owner-device signal that already defaults Learn Studio itself on
  // -- no one else's app ever shows this card.
  const [showExperience, setShowExperience] = useState(false);
  const [experienceMode, setExperienceMode] = useState('watch');
  const [experienceLevel, setExperienceLevel] = useState('adult');
  const prototypeRecord = index.get(PROTOTYPE_LESSON_ID) || null;
  // Darrell, 2026-11-25: "the all listed should populate like YouTube... so
  // all available can be seen in a list of options." A YouTube-style queue of
  // other real lessons (same course, real cinematic cover each) -- reuses the
  // SAME approved images already indexed, no new art. Tapping a DIFFERENT
  // lesson exits the overlay and opens it the normal way (classic reader);
  // only the one prototype lesson has the new Experience so far.
  const moreLessons = useMemo(() => {
    if (!prototypeRecord) return [];
    return [...index.values()]
      .filter((r) => r.courseKey === prototypeRecord.courseKey && r.lessonId !== PROTOTYPE_LESSON_ID && r.image && r.image.src)
      .slice(0, 12);
  }, [index, prototypeRecord]);
  // LearnStudio's own read/listen/version wrappers call this hand-off as
  // onRead(lesson, course, mode) / onListen(lesson, course) / onVersion(lesson,
  // course, v) -- see its doc comment. A single-argument (x) here (checking
  // x.p) was a shape mismatch: it silently received the bare lesson object,
  // found no .p, and no-op'd -- Read Lesson / Listen / an age chip did nothing
  // while the rest of the app kept working (Darrell's wife, 2026-11-24: "They
  // were just static images without functionality added... the app still
  // moved"). courseKey mirrors presentationIndex's own derivation.
  const toClassic = (lesson, course) => {
    const courseKey = course && (course.key || (course.meta && course.meta.key));
    return lesson && courseKey && onOpenLesson(courseKey, lesson.id);
  };
  const isPrototypeLesson = (lesson) => ownerDevice && lesson && lesson.id === PROTOTYPE_LESSON_ID;
  // Darrell, 2026-11-25: "I like the new look until a user chooses the play
  // or read button -- they should keep the new look of the system." For the
  // one prototype lesson, Read / Watch Video / Listen / an age chip now open
  // the new Experience directly (in the matching mode/level) instead of
  // dropping into the classic reader -- the cinematic look carries all the
  // way through, not just on the cover. Every other lesson is unaffected: it
  // still hands off to the real, unmodified classic reader exactly as before.
  const openRead = (lesson, course, mode) => {
    if (isPrototypeLesson(lesson)) {
      setExperienceLevel('adult'); // the plain Read Lesson button is the full reading, whatever age chip was tapped before
      setExperienceMode(mode === 'video' ? 'watch' : 'read');
      setShowExperience(true);
      return undefined;
    }
    return toClassic(lesson, course);
  };
  const openListen = (lesson, course) => {
    if (isPrototypeLesson(lesson)) {
      setExperienceLevel('adult');
      setExperienceMode('listen');
      setShowExperience(true);
      return undefined;
    }
    return toClassic(lesson, course);
  };
  const openVersion = (lesson, course, v) => {
    if (isPrototypeLesson(lesson)) {
      setExperienceLevel(v || 'adult');
      setExperienceMode('read');
      setShowExperience(true);
      return undefined;
    }
    return toClassic(lesson, course);
  };
  const openOther = (courseKey, lessonId) => {
    setShowExperience(false);
    onOpenLesson(courseKey, lessonId);
  };
  if (showExperience && ownerDevice) {
    return (
      <LessonExperienceBoundary onExit={() => setShowExperience(false)}>
        <LessonExperience
          lesson={PROTOTYPE_LESSON}
          record={prototypeRecord}
          onExit={() => setShowExperience(false)}
          initialMode={experienceMode}
          initialLevel={experienceLevel}
          moreLessons={moreLessons}
          onOpenOther={openOther}
        />
      </LessonExperienceBoundary>
    );
  }

  return (
    <section className="w-full" aria-label="Learn">
      {ownerDevice && prototypeRecord && (
        <button
          type="button"
          onClick={() => setShowExperience(true)}
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
        <LearnStudio courses={courses} index={index} preview topicCovers={topics} onRead={openRead} onListen={openListen} onVersion={openVersion} onExit={onExit} />
      </LearnStudioErrorBoundary>
    </section>
  );
}
