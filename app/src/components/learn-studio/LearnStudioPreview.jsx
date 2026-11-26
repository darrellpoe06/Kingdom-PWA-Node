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
import { neighborLessons } from './LessonNav.jsx';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import LearnDashboard from './LearnDashboard.jsx';
import { recordUse } from '../../lib/ux-signals.js';
import { useHistoryValue } from '../../lib/nav-history.js';
import { ensureLearnTheme } from '../../lib/learn-theme.js';
import { listPlaces, placeInProgress } from '../../lib/learn-resume.js';
import { studioWitness } from '../../lib/lesson-progress.js';
import LearnStudio from './LearnStudio.jsx';
import { presentationIndex, isLearnStudioOn, STUDIO_FLAG_KEY, allLessons } from '../../lib/learn-presentation/presentation.js';

export { isLearnStudioOn };
import RECORDS from '../../lib/learn-presentation/presentation-records.json';
import TOPICS from '../../lib/learn-presentation/presentation-topics.json';
import LessonExperience, { LessonExperienceBoundary, textFor } from './LessonExperience.jsx';

// The new look follows the chosen theme (DR-1679).
ensureLearnTheme();

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

const NO_PLACES = Object.freeze([]);
const NO_DONE = new Set();
const NO_CTX = Object.freeze({ places: NO_PLACES, progress: {} });

export default function LearnStudioPreview({
  lessonToolsFor = null,
  courses,
  onOpenLesson,
  onExit,
  ownerDevice = false,
  initialLessonId = null,
  initialCourseKey = null,
  // DR-1662: every classic Learn function, in the new look.
  tools = null,
  registerOpener = null,
  onCourse = null,
  onDepartment = null,
  onTool = null,
  ctx = NO_CTX,
  places = NO_PLACES,
  done = NO_DONE,
  continueCount = 0,
  recordCount = 0,
  markFor = null,
  quiz = null, // { saves, saved(id), record(courseKey, id, result) }: the Study quiz files to the member's record (DR-1669)
}) {
  const [courseRequest, setCourseRequest] = useState(null);
  const index = useMemo(() => presentationIndex(((RECORDS && RECORDS.records) || []).map((r) => ({ ...r, image: image(r.image) }))), []);
  const topics = useMemo(() => Object.fromEntries(Object.entries(TOPICS || {}).map(([k, v]) => [k, { ...v, image: image(v.image) }])), []);
  // The Lesson Experience (Watch / Read / Listen / Study). Built as a ONE-lesson
  // prototype (ll338) for Darrell's approval; approved 2026-11-25: "Update them
  // to our new look?!!!!!! Yet?!!!!" Every lesson now opens here (all 994 have
  // their own words), on the SAME owner-device signal that defaults Learn
  // Studio on. Only a lesson with no words at all would go to the classic
  // reader, so nothing is ever opened empty.
  const [active, setActive] = useState(null); // { lesson, course } open in the Experience, or null
  // Back closes the open lesson and lands where the reader was (DR-1674), never out of the app.
  const closeActive = React.useCallback((v) => {
    if (v == null) {
      setActive(null);
      setClosed((n) => n + 1); // Back re-reads the places too (DR-1684)
    }
  }, []);
  useHistoryValue(active ? active.lesson.id : null, closeActive, { base: null, key: 'ls-lesson' });
  const [experienceMode, setExperienceMode] = useState('watch');
  const [experienceLevel, setExperienceLevel] = useState('adult');
  const catalog = useMemo(() => allLessons(courses), [courses]);
  const activeRecord = active ? index.get(active.lesson.id) || null : null;
  const activeCourseKey = active ? courseKeyOf(active.course) : null;
  // THE PLACES, FRESH WHEN A LESSON CLOSES (DR-1684). The parent's places are
  // read once and refreshed only on a finish, so a lesson read halfway in the
  // Experience came back to a grid that did not know it. Each close re-reads
  // the device's places: the bars, Continue and Closest to Finished say now.
  const [closed, setClosed] = useState(0);
  const livePlaces = useMemo(() => (closed ? listPlaces() : ctx.places || NO_PLACES), [closed, ctx.places]);
  const liveBegun = useMemo(() => (closed ? livePlaces.filter(placeInProgress) : places), [closed, livePlaces, places]);
  const closeLesson = () => {
    setActive(null);
    setClosed((n) => n + 1);
  };
  // The Experience's witnesses write the lesson's own place (DR-1684; before,
  // onSeen/onHeard were no-ops here and a reading in the new look recorded nothing).
  const witness = useMemo(() => (active ? studioWitness(activeCourseKey, active.lesson.id) : null), [active, activeCourseKey]);
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
    // Recently opened is shared with the classic page (lib/ux-signals.js): a lesson opened here counts there too.
    try {
      recordUse(lesson && lesson.id);
    } catch {
      /* no storage */
    }
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
    closeLesson();
    return onOpenLesson(courseKey, lessonId);
  };
  // A lesson chosen in the classic tools on this page (Continue, Latest, Find,
  // Record, Play...) opens in the Experience too. Returns false when it cannot
  // (not the owner device, or no words), so the classic path runs instead.
  const openerRef = useRef(null);
  openerRef.current = (courseKey, lessonId, { mode = 'read', level = 'adult' } = {}) => {
    const hit = catalog.find((x) => x.lesson.id === lessonId && courseKeyOf(x.course) === courseKey);
    if (!hit || !opens(hit.lesson)) return false;
    const lv = ['child', 'youth', 'teen', 'adult', 'senior'].includes(level) ? level : 'adult';
    open(hit.lesson, hit.course, mode === 'listen' ? 'listen' : mode === 'watch' ? 'watch' : 'read', lv);
    return true;
  };
  useEffect(() => {
    if (!registerOpener) return undefined;
    registerOpener((...a) => openerRef.current(...a));
    return () => registerOpener(null);
    // registered once per mount; the ref always holds the current opener
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (active && ownerDevice) {
    return (
      <LessonExperienceBoundary onExit={closeLesson}>
        <LessonExperience
          key={active.lesson.id}
          lesson={active.lesson}
          record={activeRecord}
          onExit={closeLesson}
          lessonTools={
            // The classic space's full tools when the Learn page hands them over (DR-1674): reading
            // credit, place, downloads, age first. Else the lesson's own place witness (DR-1684) and the quiz.
            lessonToolsFor
              ? lessonToolsFor(active.lesson, active.course)
              : {
                  place: witness.place,
                  onLevel: witness.onLevel,
                  onHeard: witness.onHeard,
                  onSeen: witness.onSeen,
                  ...(quiz
                    ? {
                        quizSaves: !!quiz.saves,
                        quizSaved: quiz.saved(active.lesson.id),
                        onRecordQuiz: (id, r) => quiz.record(activeCourseKey, id, r),
                      }
                    : {}),
                }
          }
          initialMode={experienceMode}
          initialLevel={experienceLevel}
          moreLessons={moreLessons}
          prevLesson={neighborLessons(active.lesson, active.course, activeCourseKey).prev}
          nextLesson={neighborLessons(active.lesson, active.course, activeCourseKey).next}
          onOpenOther={openOther}
          onFullPage={() => {
            closeLesson();
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
          places={liveBegun}
          allPlaces={livePlaces}
          progress={ctx.progress || {}}
          done={done}
          markFor={markFor}
          tools={tools}
          onCourse={onCourse}
          onDepartment={onDepartment}
          courseRequest={courseRequest}
          dashboard={
            <LearnDashboard
              courses={courses}
              index={index}
              preview
              ctx={ctx}
              onOpenCourse={(key) => setCourseRequest({ key, nonce: Date.now() })}
              onTool={onTool}
              continueCount={continueCount}
              recordCount={recordCount}
            />
          }
        />
      </LearnStudioErrorBoundary>
    </section>
  );
}
