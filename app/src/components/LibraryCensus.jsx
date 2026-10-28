// =============================================================================
// LibraryCensus — the library, counted: what every course holds, what each
// lesson still waits for, and how the library is managed (DR-1266)
// =============================================================================
// Darrell 2026-10-27: "Make sure we are filling the course library perpetually
// with all levels and necessary components and information and understanding
// make sense of the management of the course records and strategies that will
// help with learning content."
//
// Lives in the Record area under the Class record: the record says what a
// learner has done, this says what there is to do it with, and the queue says
// what is still being written — three answers, one place. Every number comes
// from lib/library-census.js over the MOUNTED catalog; nothing is painted.
// =============================================================================
import React from 'react';
import { censusLibrary, censusLine, waitsFor, VERSION_IDS } from '../lib/library-census.js';
import { READING_VERSIONS } from '../lib/learn-organize.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const MONO = { fontFamily: '"JetBrains Mono", monospace' };
const LABEL = Object.fromEntries(READING_VERSIONS.map((b) => [b.id, b.label]));
const n = (x) => Number(x || 0).toLocaleString('en-US');

function Figure({ label, value, hint, testid }) {
  return (
    <div className="border border-[#E8E4DC] p-3" data-testid={testid}>
      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold">{label}</div>
      <div className="text-lg text-[#1A1815]" style={SERIF}>{value}</div>
      {hint ? <div className="text-[0.6875rem] text-[#5A5751]">{hint}</div> : null}
    </div>
  );
}

export default function LibraryCensus({ courses, queueHead = 12 }) {
  const census = React.useMemo(() => censusLibrary(courses), [courses]);
  const { totals, courses: rows, queue } = census;
  if (!totals.lessons) return null;
  const missingV = VERSION_IDS.filter((v) => totals.missingByVersion[v] > 0);
  return (
    <div data-testid="library-census" data-lessons={totals.lessons} data-waiting={totals.waiting}>
      <p className="text-xs text-[#5A5751] mb-3" style={SERIF} data-testid="library-census-line">{censusLine(census)}.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <Figure label="Lessons" value={n(totals.lessons)} hint={`in ${n(totals.courses)} courses`} />
        <Figure label="Readings written" value={`${n(totals.readings)} of ${n(totals.readingsPossible)}`} hint="five versions of every lesson" />
        <Figure label="Whole" value={n(totals.whole)} hint="every version and every part" testid="library-whole" />
        <Figure label="Waiting" value={n(totals.waiting)} hint={missingV.length ? `most for ${missingV.map((v) => `${LABEL[v]} (${n(totals.missingByVersion[v])})`).join(', ')}` : 'nothing waits'} testid="library-waiting" />
      </div>

      <table className="w-full text-xs">
        <caption className="sr-only">Course by course: what each holds and what waits</caption>
        <thead>
          <tr className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">
            <th scope="col" className="text-left py-1">Course</th>
            <th scope="col" className="text-right py-1">Lessons</th>
            <th scope="col" className="text-right py-1">Whole</th>
            <th scope="col" className="text-right py-1">Waiting</th>
            <th scope="col" className="text-left py-1 pl-2">For</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const mv = VERSION_IDS.filter((v) => c.missingByVersion[v] > 0).map((v) => `${LABEL[v]} ×${c.missingByVersion[v]}`);
            const mc = Object.entries(c.missingByComponent).filter(([, k]) => k > 0).map(([id, k]) => `${id} ×${k}`);
            return (
              <tr key={c.key} className="border-t border-[#E8E4DC]" data-course={c.key} data-waiting={c.waiting}>
                <th scope="row" className="text-left py-1 font-normal text-[#1A1815]" style={SERIF}>{c.title}</th>
                <td className="text-right py-1 text-[#1A1815]" style={MONO}>{c.lessons}</td>
                <td className="text-right py-1 text-[#1A1815]" style={MONO}>{c.whole}</td>
                <td className="text-right py-1 text-[#1A1815]" style={MONO}>{c.waiting}</td>
                <td className="text-left py-1 pl-2 text-[#5A5751]">{[...mv, ...mc].join(' · ') || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {queue.length ? (
        <div className="mt-3" data-testid="library-queue">
          <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-1">
            Being written next · {n(queue.length)} waiting, newest first
          </div>
          <ol className="space-y-0.5">
            {queue.slice(0, queueHead).map((q) => (
              <li key={`${q.courseKey}:${q.lessonId}`} className="text-xs text-[#1A1815]" data-lesson-id={q.lessonId}>
                <span style={SERIF}>{q.title}</span>
                <span className="text-[#5A5751]"> · {q.courseTitle} · waits for {waitsFor(q)}</span>
              </li>
            ))}
          </ol>
          {queue.length > queueHead ? <p className="text-[0.6875rem] text-[#5A5751] mt-1" style={SERIF}>…and {n(queue.length - queueHead)} more, in the same order.</p> : null}
        </div>
      ) : null}

      <div className="mt-3 text-[0.6875rem] text-[#5A5751] space-y-1" style={SERIF} data-testid="library-how">
        <p><strong className="text-[#1A1815]">How the library is managed.</strong> Every lesson is written in five versions of the one message — Child, Youth, Teen, Adult, Senior — each the full lesson in that reader's words, never a fragment; and every lesson carries its anchor Scripture, its big idea, its exam, its benefits, its talking points and its run of show. A new lesson cannot land without them: the build refuses a short or missing version. What the older lessons still wait for is this queue, worked newest first, and this count can only fall.</p>
        <p><strong className="text-[#1A1815]">How learning is measured.</strong> Your record counts a lesson read when it is read or heard to its end, in whichever version, on any device you sign in on; the exam, at the 70% line, is what proves the reading; the versions you have read are counted of five; and the record strip at the top of Learn always offers the one next step.</p>
      </div>
    </div>
  );
}
