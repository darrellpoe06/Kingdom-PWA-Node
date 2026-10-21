// =============================================================================
// CourseChoiceList — the one list you choose a course from (DR-1183)
// =============================================================================
// Darrell, 2026-10-21: "It's like a title page saying your inside living
// lessons... we need one list when choosing a course... with all options to
// sort that one list... only have that sortable list when it is chosen!!!!"
//
// Shown INSTEAD of a course, while no course has been chosen. Every row is one
// tap that opens that course, and the whole list carries the order the sort
// control sets — one list, not one list per department.
//
// Nothing here is painted. The count, the lesson totals, the codes, the
// departments, the levels and this device's standing all come from
// lib/learn-course-choice.js, which derives them from the mounted catalog.
import React from 'react';
import { courseChoiceRows, standingWords, choiceWords } from '../lib/learn-course-choice.js';

const STATE_TONE = {
  completed: 'text-[#5A6E3D]',
  'in-progress': 'text-[#B85838]',
  'not-started': 'text-[#5A5751]',
};

export function CourseChoiceList({
  courses = [], catalog = null, sortKey = 'authored', sortLabel = '', ctx = {},
  departmentLabel = '', onChoose,
}) {
  const rows = React.useMemo(
    () => courseChoiceRows({ courses, catalog, sortKey, ctx }),
    // `ctx` and the course descriptors are rebuilt every render by design
    // (DR-0121: live derivation), so the memo keys on what actually changes.
    [courses, catalog, sortKey], // eslint-disable-line react-hooks/exhaustive-deps
  );
  return (
    <div data-testid="course-choice-list">
      <p className="text-[0.75rem] text-[#1A1815] mb-3" data-testid="course-choice-words" role="status">
        {choiceWords(rows, { sortLabel, departmentLabel })}
      </p>
      {rows.length > 0 && (
        <ul className="border-t border-[#E8E4DC]">
          {rows.map((r) => (
            <li key={r.key} className="border-b border-[#E8E4DC]">
              <button
                type="button"
                onClick={() => onChoose && onChoose(r.key)}
                data-course={r.key}
                className="w-full text-left px-3 py-3 min-h-[56px] bg-white hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
              >
                <span className="flex items-baseline justify-between gap-3 flex-wrap">
                  <span className="text-[0.9375rem] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>
                    {r.title}
                  </span>
                  <span className={`text-[0.625rem] uppercase tracking-wider ${STATE_TONE[r.state] || STATE_TONE['not-started']}`}>
                    {standingWords(r)}
                  </span>
                </span>
                <span className="block text-[0.625rem] uppercase tracking-wider text-[#5A5751] mt-0.5">
                  {[r.code, r.department, r.level, `${r.lessons} ${r.lessons === 1 ? 'lesson' : 'lessons'}`].filter(Boolean).join(' · ')}
                </span>
                {r.plainWords && (
                  <span className="block text-[0.75rem] text-[#5A6E3D] mt-1">
                    <span className="uppercase tracking-wider text-[0.5625rem] text-[#5A5751] mr-1.5">In plain words</span>
                    {r.plainWords}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CourseChoiceList;
