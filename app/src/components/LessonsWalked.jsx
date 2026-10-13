// =============================================================================
// LessonsWalked — the lessons one person chose, how far, at what level (DR-0844)
// =============================================================================
// Read from learner_lesson_records (the governor reads every learner's, a
// learner reads their own); named from the build's own catalog. The goal that
// frames every number here is Darrell's: to be filled with Yahweh's
// perspectives, explicitly, the Highest Authority and Level, so it is easy to
// see from the deeper place His way of getting life done with Him. A count is
// never the goal; it is how far along the way a person has walked.
import React, { useEffect, useMemo, useState } from 'react';
import { fetchLearnerRecords } from '../lib/learner-records-sync.js';
import { findLessonInCatalog } from '../lib/lesson-pipeline.js';
import { lessonsWalked, walkedLine } from '../lib/lessons-walked.js';

const serif = { fontFamily: '"Fraunces", serif' };

export default function LessonsWalked({ userId, compact = false }) {
  const [st, setSt] = useState({ phase: 'loading', records: [], reason: '' });
  useEffect(() => {
    let alive = true;
    fetchLearnerRecords().then((r) => { if (alive) setSt({ phase: 'ready', records: r.records || [], reason: r.error ? String(r.error.message || r.error) : (r.skipped || '') }); })
      .catch((e) => { if (alive) setSt({ phase: 'ready', records: [], reason: String((e && e.message) || e) }); });
    return () => { alive = false; };
  }, [userId]);
  const titleOf = (id, course) => { const hit = findLessonInCatalog(course ? `${course}/${id}` : id) || findLessonInCatalog(id); return hit ? `${hit.number ? `${hit.number} ` : ''}${hit.title}` : null; };
  const w = useMemo(() => (st.phase === 'ready' ? lessonsWalked(st.records, userId, { titleOf }) : null), [st, userId]);
  return (
    <div className="mt-1 border-l-2 border-[#E8E4DC] pl-2" data-testid="lessons-walked">
      <div className="text-[0.5625rem] uppercase tracking-wider font-semibold text-[#5A5751]">Lessons walked</div>
      <p className="text-[0.625rem] text-[#5A5751]" style={serif}>
        The goal is to be filled with Yahweh&rsquo;s perspectives, explicitly, the Highest Authority and Level, so it is easy to see from the deeper place His way of getting life done with Him. These numbers say how far along that way; they are not the goal.
      </p>
      {st.phase === 'loading' ? <p className="text-[0.625rem] text-[#5A5751]">Reading their lessons…</p> : null}
      {st.phase === 'ready' && st.reason && st.records.length === 0 ? <p className="text-[0.625rem] text-[#B85838]" data-testid="lessons-walked-reason">The lesson records could not be read ({st.reason}).</p> : null}
      {w ? (
        <>
          <p className="text-[0.625rem] text-[#1A1815]" data-testid="lessons-walked-line">{walkedLine(w)}</p>
          {w.counts.lessons > 0 && !compact ? (
            <ul className="mt-0.5 space-y-0.5">
              {w.lessons.slice(0, 12).map((l) => (
                <li key={`${l.courseKey}/${l.lessonId}`} className="text-[0.625rem] text-[#1A1815]" data-testid="lessons-walked-row" data-band={l.band}>
                  <b>{l.title}</b> <span className="text-[#5A5751]">· {l.courseKey}{l.ageBand ? ` · ${l.ageBand}` : ''} · {l.completed ? 'completed' : 'open'} · {l.attempts > 0 ? `${l.bandLabel} (${l.quizPct}%, ${l.attempts} ${l.attempts === 1 ? 'attempt' : 'attempts'})` : 'not yet tested'}{l.lastAt ? ` · ${l.lastAt}` : ''}</span>
                </li>
              ))}
              {w.lessons.length > 12 ? <li className="text-[0.625rem] text-[#5A5751]">and {w.lessons.length - 12} more</li> : null}
            </ul>
          ) : null}
          <p className="text-[0.5625rem] text-[#8A867E] mt-0.5">Times here are times tested and completed; a lesson&rsquo;s opens are not recorded per lesson, only the Learn tab&rsquo;s, under Usage.</p>
        </>
      ) : null}
    </div>
  );
}
