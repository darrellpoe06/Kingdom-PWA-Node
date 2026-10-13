// =============================================================================
// WhoHeIsTimeline — "timeless timelines": every passage, one line, before time
// to for ever
// =============================================================================
// Darrell, 2026-09-29: "Clarity clarification of where when what how timeless
// timelines and Who He Is!!!!!!" One navigable line of every passage in the
// Who He Is data (DR-0675), era by era, read two ways:
//   - WHERE IT SITS: when it happened, or when it was spoken or written;
//   - WHAT IT POINTS TO: the times its own words name (a letter written in the
//     church age that points back to the cross, or ahead to His coming).
// That second reading is what makes the line timeless: the last two eras hold
// nothing yet, and they fill with every passage that points to them.
//
// Filters: was He there, how it was given, testament, book. Every number on
// screen is the length of the list on screen (DR-0076). Tapping a passage opens
// it in place: where, when, what, how, presence, Who He Is, the whole passage
// (read in place, nothing navigates), the lesson that carries it, and the L191 /
// L194 / L196 lessons that count it (derived from their own references).
//
// Mobile and Firestick: every control is a real button or a native select, the
// page scrolls as one (no inner scroll box to trap the D-pad), and nothing
// depends on hover.
// =============================================================================
import React, { useMemo, useState } from 'react';
import {
  WHO_HE_IS_ERAS, WHO_HE_IS_ENTRIES, WHO_HE_IS_EDGE, filterEntries, booksInOrder, lessonLinksFor,
  PRESENT_LABEL, HOW_LABEL,
} from '../lib/who-he-is.js';
import { whoHeIsLessonFor, WHO_HE_IS_MODULES } from '../lib/who-he-is-course.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { EntryCard } from './WhoHeIsEntryCard.jsx';

const serif = { fontFamily: '"Fraunces", serif' };
const mono = { fontFamily: '"JetBrains Mono", monospace' };
const chip = (on) => `text-[0.6875rem] px-3 py-2 min-h-[36px] border ${on ? 'bg-[#5A6E3D] text-white border-[#5A6E3D]' : 'bg-white text-[#1A1815] border-[#E8E4DC] hover:border-[#5A6E3D]'}`;

const LESSON_TITLE = new Map(WHO_HE_IS_MODULES.map((m, k) => [m.id, `Lesson ${k + 1}: ${m.title}`]));
const MODES = [...new Set(WHO_HE_IS_ENTRIES.map((e) => e.how.mode))];

export function timelineGroups({ axis = 'sits', present = '', how = '', book = '', testament = '' } = {}) {
  const list = filterEntries({ present, how, book, testament });
  return WHO_HE_IS_ERAS.map((era) => ({
    era,
    entries: axis === 'points' ? list.filter((e) => e.when.pointsTo.includes(era.id)) : list.filter((e) => e.when.era === era.id),
  }));
}

export default function WhoHeIsTimeline({ initialEra = null, onOpenLesson = null }) {
  const [axis, setAxis] = useState('sits');
  const [present, setPresent] = useState('');
  const [how, setHow] = useState('');
  const [testament, setTestament] = useState('');
  const [book, setBook] = useState('');
  const [openEra, setOpenEra] = useState(initialEra);
  const [openEntry, setOpenEntry] = useState(null);
  const filtering = !!(present || how || book || testament);
  const groups = useMemo(() => timelineGroups({ axis, present, how, book, testament }), [axis, present, how, book, testament]);
  const shown = useMemo(() => new Set(groups.flatMap((g) => g.entries.map((e) => e.id))).size, [groups]);
  const books = useMemo(() => booksInOrder(), []);

  return (
    <section aria-label="Who He Is: the whole Word, on one line" className="text-[#1A1815]">
      <h3 className="text-base font-semibold" style={serif}>Who He Is: the whole Word, on one line</h3>
      <p className="text-[0.75rem] text-[#5A5751] mt-1" style={serif}>
        Every passage the rule reaches, from before time to for ever. Showing {shown} of {WHO_HE_IS_ENTRIES.length} passages.
      </p>

      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Read the line by">
        <button type="button" aria-pressed={axis === 'sits'} className={`focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${chip(axis === 'sits')}`} onClick={() => setAxis('sits')}>Where it sits</button>
        <button type="button" aria-pressed={axis === 'points'} className={`focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${chip(axis === 'points')}`} onClick={() => setAxis('points')}>What it points to</button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Was He there">
        <button type="button" aria-pressed={!present} className={`focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${chip(!present)}`} onClick={() => setPresent('')}>Any presence</button>
        {Object.entries(PRESENT_LABEL).map(([k, label]) => (
          <button key={k} type="button" aria-pressed={present === k} className={`focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${chip(present === k)}`} onClick={() => setPresent(k)}>{label}</button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="How it was given">
        <button type="button" aria-pressed={!how} className={`focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${chip(!how)}`} onClick={() => setHow('')}>Any way</button>
        {MODES.map((k) => (
          <button key={k} type="button" aria-pressed={how === k} className={`focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${chip(how === k)}`} onClick={() => setHow(k)}>{HOW_LABEL[k]}</button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="text-[0.6875rem]" style={mono} htmlFor="whohe-testament">Testament</label>
        <select id="whohe-testament" value={testament} onChange={(e) => setTestament(e.target.value)} className="min-h-[36px] border border-[#E8E4DC] px-2 text-[0.75rem] bg-white">
          <option value="">Both</option>
          <option value="OT">Old Testament</option>
          <option value="NT">New Testament</option>
        </select>
        <label className="text-[0.6875rem]" style={mono} htmlFor="whohe-book">Book</label>
        <select id="whohe-book" value={book} onChange={(e) => setBook(e.target.value)} className="min-h-[36px] border border-[#E8E4DC] px-2 text-[0.75rem] bg-white">
          <option value="">Every book</option>
          {books.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        {filtering && (
          <button type="button" className={`focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${chip(false)}`} onClick={() => { setPresent(''); setHow(''); setBook(''); setTestament(''); }}>Clear the filters</button>
        )}
      </div>

      <ol className="mt-3 border-l-4 border-[#5A6E3D] pl-3 space-y-2">
        {groups.map(({ era, entries }) => {
          const open = openEra === era.id;
          const edge = !filtering && axis === 'sits' ? WHO_HE_IS_EDGE.filter((g) => g.era === era.id) : [];
          return (
            <li key={era.id} data-era={era.id}>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenEra(open ? null : era.id)}
                className="w-full text-left px-3 py-2 min-h-[44px] border border-[#E8E4DC] bg-[#FAF8F4] hover:border-[#5A6E3D] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
              >
                <span className="block text-[0.8125rem] font-semibold" style={serif}>{open ? '▾' : '▸'} {era.label} — {entries.length}</span>
                <span className="block text-[0.6875rem] text-[#5A5751]" style={serif}>{era.plain}</span>
              </button>
              {open && (
                <div className="mt-2">
                  <p className="text-[0.75rem] italic" style={serif}>
                    <span className="not-italic text-[#5A6E3D] font-semibold">{era.marker}</span>{' — '}{era.markerText}
                  </p>
                  {entries.length === 0 && (
                    <p className="text-[0.75rem] mt-2" style={serif}>
                      {axis === 'sits'
                        ? 'No passage the rule reaches is set in this part of the line. Switch to "What it points to" to see the passages that speak of it.'
                        : 'No passage shown here points to this part of the line.'}
                    </p>
                  )}
                  <ul className="mt-2 space-y-1">
                    {entries.map((e) => {
                      const isOpen = openEntry === e.id;
                      const lessonId = whoHeIsLessonFor(e);
                      const links = isOpen ? lessonLinksFor(e, LIVING_LESSONS_MODULES) : [];
                      return (
                        <li key={e.id}>
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            onClick={() => setOpenEntry(isOpen ? null : e.id)}
                            className="w-full text-left px-2 py-2 min-h-[36px] border border-[#E8E4DC] bg-white hover:border-[#5A6E3D] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
                          >
                            <span className="text-[0.75rem] font-semibold" style={serif}>{e.ref}</span>
                            <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] ml-2" style={mono}>{HOW_LABEL[e.how.mode]} · {PRESENT_LABEL[e.present]}</span>
                            <span className="block text-[0.6875rem] text-[#5A5751] truncate" style={serif}>{e.keyVerse.text}</span>
                          </button>
                          {isOpen && (
                            <ul className="mt-1">
                              <EntryCard
                                entry={e}
                                lessonLabel={lessonId ? `Open ${LESSON_TITLE.get(lessonId)}` : null}
                                onOpenLesson={lessonId && onOpenLesson ? () => onOpenLesson(lessonId) : null}
                              />
                              {links.length > 0 && (
                                <li className="text-[0.6875rem] text-[#5A5751] mt-1 list-none" style={serif}>
                                  Also counted in: {links.map((l) => l.title).join('; ')}
                                </li>
                              )}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  {edge.length > 0 && (
                    <div className="mt-2 border-l-4 border-[#B85838] pl-2">
                      <div className="text-[0.625rem] uppercase tracking-wider text-[#B85838]" style={mono}>At the edge — {edge.length}</div>
                      <ul className="mt-1 space-y-1">
                        {edge.map((g) => (
                          <li key={g.ref} className="text-[0.75rem]" style={serif}><strong>{g.ref}</strong>. {g.reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
