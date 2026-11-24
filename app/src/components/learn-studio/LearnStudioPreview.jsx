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
import React, { useMemo } from 'react';
import LearnStudio from './LearnStudio.jsx';
import { presentationIndex, isLearnStudioOn, STUDIO_FLAG_KEY } from '../../lib/learn-presentation/presentation.js';

export { isLearnStudioOn };
import RECORDS from '../../lib/learn-presentation/presentation-records.json';
import TOPICS from '../../lib/learn-presentation/presentation-topics.json';

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

export default function LearnStudioPreview({ courses, onOpenLesson, onExit }) {
  const index = useMemo(() => presentationIndex(((RECORDS && RECORDS.records) || []).map((r) => ({ ...r, image: image(r.image) }))), []);
  const topics = useMemo(() => Object.fromEntries(Object.entries(TOPICS || {}).map(([k, v]) => [k, { ...v, image: image(v.image) }])), []);
  const open = (x) => x && x.p && onOpenLesson(x.p.courseKey, x.p.lessonId);
  return (
    <section className="w-full" aria-label="Learn">
      <LearnStudioErrorBoundary onExit={onExit}>
        <LearnStudio courses={courses} index={index} preview topicCovers={topics} onRead={open} onListen={open} onVersion={open} onExit={onExit} />
      </LearnStudioErrorBoundary>
    </section>
  );
}
