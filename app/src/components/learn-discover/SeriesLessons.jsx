// =============================================================================
// SeriesLessons — a curated list of lessons, drawn by Learn's OWN lesson list
// =============================================================================
// Darrell 2026-11-26: the public Featured Series (and category) lists "should look and function like Darrell's existing
// lesson lists": Pictures / List, Show All / Not read / Read, numbered rows with thumbnails, Child..Senior, Play, read
// marks. So this does not draw rows of its own: it hands Learn Studio's LessonsInOrder a list whose lessons are the real
// lessons, in the curated order. Nothing is copied and no progress record is made: a lesson's place and read mark are the
// ones Learn already keeps (learn-resume.js), keyed by the lesson's REAL course.
// The mounted catalog is large, so it loads only when a list is opened (the discovery page itself stays light); until it
// arrives, and if it cannot, the caller's lighter cards show instead.
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import LessonsInOrder from '../learn-studio/LessonsInOrder.jsx';
import '../learn-studio/learn-studio.css';
import RECORDS from '../../lib/learn-presentation/presentation-records.json';
import { presentationIndex } from '../../lib/learn-presentation/presentation.js';
import { studioRecord, studioMarkFor } from '../../lib/learn-studio-bridge.js';
import { listPlaces } from '../../lib/learn-resume.js';

const BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
const at = (s) => (typeof s === 'string' ? s.replace(/(^|, )learn-thumbs\//g, `$1${BASE}learn-thumbs/`) : s);
const image = (im) => im && im.src && { ...im, src: at(im.src), srcSet: im.srcSet && { webp: at(im.srcSet.webp) } };

export default function SeriesLessons({
  listId,
  title,
  lessonIds,
  onOpen,
  renderPictures = null,
  fallback = null,
  done: doneProp = null,
  markFor: markForProp = null,
  ageBand,
}) {
  const [inv, setInv] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    import('../../lib/learn-presentation/integrity.js')
      .then((m) => {
        if (live) setInv(m.learnInventory());
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);
  const index = useMemo(() => presentationIndex(((RECORDS && RECORDS.records) || []).map((r) => ({ ...r, image: image(r.image) }))), []);
  const built = useMemo(() => {
    if (!inv) return null;
    const home = new Map(); // lessonId -> the lesson's REAL course
    for (const c of inv) for (const m of c.lessons) if (!home.has(m.id)) home.set(m.id, { course: c, lesson: m });
    const schedule = lessonIds.map((id) => (home.get(id) ? home.get(id).lesson : null)).filter(Boolean);
    return { home, course: { key: `series:${listId}`, meta: { title }, schedule } };
  }, [inv, lessonIds, listId, title]);
  const record = useMemo(() => studioRecord(listPlaces({}), {}), []);
  const done = doneProp || record.done;
  const markFor = useMemo(() => {
    if (markForProp) return markForProp;
    const places = listPlaces({});
    const mark = studioMarkFor({ places, recordFor: null, ageBand });
    // the list's own key is not a course: the mark is looked up under the lesson's real course
    return (lesson) => mark(lesson, built && built.home.get(lesson.id) ? built.home.get(lesson.id).course.key : null);
  }, [markForProp, built, ageBand]);
  if (failed || !built || !built.course.schedule.length) return fallback;
  const realOf = (x) => built.home.get(x.lesson.id).course.key;
  const courses = [built.course];
  return (
    <div className="ld-lessons-list ls-root" data-testid="ld-lessons-list">
      <LessonsInOrder
        courses={courses}
        index={index}
        preview
        fixedCourse={built.course.key}
        done={done}
        markFor={markFor}
        onOpen={(x) => onOpen(realOf(x), x.lesson.id)}
        onVersion={(x) => onOpen(realOf(x), x.lesson.id)}
        onListen={(x) => onOpen(realOf(x), x.lesson.id)}
        renderPictures={renderPictures}
      />
    </div>
  );
}
