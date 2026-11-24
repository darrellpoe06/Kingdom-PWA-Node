// The redesigned Learn as an OWNER PREVIEW inside the real app (2026-11-24):
// ChurchLearn shows it only on a device that opted in (?learnStudio=1,
// remembered; ?learnStudio=0 turns it off). Every other member sees Learn as
// before. Read / Listen / an age chip hand the REAL lesson back to the reader.
import React, { useMemo } from 'react';
import LearnStudio from './LearnStudio.jsx';
import { presentationIndex, isLearnStudioOn } from '../../lib/learn-presentation/presentation.js';

export { isLearnStudioOn };
import RECORDS from '../../lib/learn-presentation/presentation-records.json';
import TOPICS from '../../lib/learn-presentation/presentation-topics.json';

// Covers ship under public/learn-thumbs with base-relative paths; resolve them
// against the app's base (web /poetech-app/, native /).
const BASE = (import.meta.env && import.meta.env.BASE_URL) || '/';
const at = (s) => (typeof s === 'string' ? s.replace(/(^|, )learn-thumbs\//g, `$1${BASE}learn-thumbs/`) : s);
const image = (im) => im && im.src && { ...im, src: at(im.src), srcSet: im.srcSet && { webp: at(im.srcSet.webp) } };

export default function LearnStudioPreview({ courses, onOpenLesson, onExit }) {
  const index = useMemo(() => presentationIndex(((RECORDS && RECORDS.records) || []).map((r) => ({ ...r, image: image(r.image) }))), []);
  const topics = useMemo(() => Object.fromEntries(Object.entries(TOPICS || {}).map(([k, v]) => [k, { ...v, image: image(v.image) }])), []);
  const open = (x) => x && x.p && onOpenLesson(x.p.courseKey, x.p.lessonId);
  return (
    <section className="w-full" aria-label="Learn">
      <LearnStudio courses={courses} index={index} preview topicCovers={topics} onRead={open} onListen={open} onVersion={open} onExit={onExit} />
    </section>
  );
}
