// =============================================================================
// WhoHeIsRegister — every passage a "Who He Is" lesson carries, made plain
// =============================================================================
// Darrell, 2026-09-29: "Clarity clarification of where when what how timeless
// timelines and Who He Is!!!!!!" A lesson of the Who He Is course declares its
// part of the line (`module.whoHeIs`); this renders EVERY passage in it, from
// who-he-is-data.json via registerFor (DR-0675): where, when (the era it sits
// in and the times it points to), what it says of Him, how it was given,
// whether He was there, and Who He Is, with its key verse verbatim and the
// whole passage one tap away (VerseChips opens the KJV in place, nothing
// navigates).
//
// Counts shown here are the lengths of the lists shown here; nothing is typed.
// Groups start closed so a long register (the ministry, the letters) opens
// fast and a D-pad can walk the book headings; each heading is a real button.
// No inner scroll container, so the page scrolls as one on the Firestick.
// =============================================================================
import React, { useMemo, useState } from 'react';
import {
  registerFor, byBook, eraLabel, WHO_HE_IS_EDGE, WHO_HE_IS_ENTRIES, lessonLinksFor,
} from '../lib/who-he-is.js';
import { requestOpenLesson } from '../lib/learn-open.js';
import { useOpenWithTheWord } from '../lib/show-the-word.js';
import ShowTheWordToggle from './ShowTheWordToggle.jsx';
import VerseChips from './VerseChips.jsx';
import { EntryCard } from './WhoHeIsEntryCard.jsx';
import WhoHeIsTimeline from './WhoHeIsTimeline.jsx';

export { EntryCard };

/** Open a lesson of the Who He Is course from anywhere in Learn. */
export const openWhoHeIsLesson = (lessonId) => requestOpenLesson({ lessonId, courseKey: 'who-he-is' });

const serif = { fontFamily: '"Fraunces", serif' };
const mono = { fontFamily: '"JetBrains Mono", monospace' };
const btn = 'text-[0.6875rem] px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';

/** The whole line, opened in place from any lesson that carries a register. */
export function TimelineToggle({ initialEra = null }) {
  // Navigation (open the whole line), not a fold of this lesson's Word: it
  // keeps its own state, named exempt in show-the-word.test.jsx.
  const [timelineOpen, setTimelineOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        type="button"
        aria-expanded={timelineOpen}
        onClick={() => setTimelineOpen((v) => !v)}
        className={`${btn} border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white`}
      >
        {timelineOpen ? 'Close the timeline' : 'Open the whole timeline: every passage, before time to for ever →'}
      </button>
      {timelineOpen && (
        <div className="mt-2 border border-[#E8E4DC] bg-[#FAF8F4] p-3">
          <WhoHeIsTimeline initialEra={initialEra} onOpenLesson={openWhoHeIsLesson} />
        </div>
      )}
    </div>
  );
}

// L191, L194 and L196 counted the occasions in the Gospels (and the rest the
// rule set aside). Each now points to the whole-Word curriculum, and says how
// many of its own passages sit on the line, derived from its own references.
export function WhoHeIsLinkCard({ module }) {
  const counted = useMemo(() => WHO_HE_IS_ENTRIES.filter((e) => lessonLinksFor(e, [module]).length > 0), [module]);
  return (
    <div className="mt-3 border-l-4 border-[#5A6E3D] bg-[#5A6E3D]/[0.06] pl-3 py-2" data-who-he-is-link={module.id}>
      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold" style={mono}>
        Who He Is: the whole Word
      </div>
      <p className="text-[0.75rem] text-[#1A1815] mt-1" style={serif}>
        The passages this lesson names sit in {counted.length} {counted.length === 1 ? 'passage' : 'passages'} of the whole-Word curriculum. It holds all {WHO_HE_IS_ENTRIES.length} passages that tell Who He Is, whether He was there or not, each with where, when, what and how, on one line from before time to for ever.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => openWhoHeIsLesson('whohe1-all-of-them-the-rule-the-line-and-the-edge')} className={`${btn} mt-2 border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white`}>
          Open the course →
        </button>
      </div>
      <TimelineToggle />
    </div>
  );
}

function BookGroup({ book, entries }) {
  // A fold that holds the Word follows the page's Show the Word switch; a tap
  // flips this one book on top of it (lib/show-the-word.js).
  const [bookOpen, toggleBook] = useOpenWithTheWord();
  return (
    <div className="mt-2">
      <button
        type="button"
        aria-expanded={bookOpen}
        onClick={toggleBook}
        className={`${btn} w-full text-left border-[#E8E4DC] text-[#1A1815] bg-[#FAF8F4] hover:border-[#5A6E3D]`}
        style={serif}
      >
        {bookOpen ? '▾' : '▸'} {book} — {entries.length} {entries.length === 1 ? 'passage' : 'passages'}
      </button>
      {bookOpen && (
        <ul className="mt-2 space-y-2">
          {entries.map((e) => <EntryCard key={e.id} entry={e} />)}
        </ul>
      )}
    </div>
  );
}

function Pointing({ pointing }) {
  const [pointingOpen, togglePointing] = useOpenWithTheWord();
  const byEra = [];
  for (const e of pointing) {
    let g = byEra.find((x) => x.era === e.when.era);
    if (!g) { g = { era: e.when.era, entries: [] }; byEra.push(g); }
    g.entries.push(e);
  }
  return (
    <div className="mt-4">
      <button
        type="button"
        aria-expanded={pointingOpen}
        onClick={togglePointing}
        className={`${btn} w-full text-left border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white`}
        style={serif}
      >
        {pointingOpen ? '▾' : '▸'} Passages from other times that point here — {pointing.length}
      </button>
      {pointingOpen && byEra.map((g) => (
        <div key={g.era} className="mt-2">
          <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]" style={mono}>
            Given in: {eraLabel(g.era)} — {g.entries.length}
          </div>
          <ul className="mt-1 space-y-2">
            {g.entries.map((e) => <EntryCard key={e.id} entry={e} />)}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Edge() {
  return (
    <div className="border-l-4 border-[#B85838] bg-[#B85838]/[0.06] pl-3 py-2">
      <div className="text-[0.625rem] uppercase tracking-wider text-[#B85838] font-semibold mb-1" style={mono}>
        The edge — named, not dropped ({WHO_HE_IS_EDGE.length})
      </div>
      <p className="text-[0.75rem] text-[#1A1815]" style={serif}>
        These passages are widely read of Him, but no New Testament verse quotes or names them, so the rule does not reach them. Each waits for the elders’ word.
      </p>
      <ul className="mt-2 space-y-2">
        {WHO_HE_IS_EDGE.map((g) => (
          <li key={g.ref} className="border border-[#E8E4DC] bg-white p-3">
            <div className="text-[0.8125rem] font-semibold text-[#1A1815]" style={serif}>{g.ref} <span className="font-normal text-[#5A5751]">· {eraLabel(g.era)}</span></div>
            <p className="text-[0.75rem] text-[#1A1815] mt-1" style={serif}>{g.reason}</p>
            <div className="mt-2"><VerseChips refs={[...g.verses.map((v) => v.ref), ...g.tie.map((v) => v.ref)]} /></div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function WhoHeIsRegister({ spec }) {
  if (!spec) return null;
  if (spec.edge) return <div className="mt-3"><TimelineToggle /><div className="mt-3"><Edge /></div></div>;
  const { primary, pointing } = registerFor(spec);
  const groups = byBook(primary);
  return (
    <section className="mt-3 border-t border-[#E8E4DC] pt-3" aria-label="Every passage in this lesson">
      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold" style={mono}>
        Every passage set here — {primary.length}
      </div>
      <p className="text-[0.75rem] text-[#5A5751] mt-1" style={serif}>
        Each shows where, when, what, how, whether He was there, and Who He Is. Tap a book to open it, or show the Word to open every one; tap a reference to read the whole passage.
      </p>
      <TimelineToggle initialEra={(spec.sits && spec.sits[0]) || (spec.points && spec.points[0]) || null} />
      <div className="mt-2"><ShowTheWordToggle /></div>
      {primary.length === 0 && (
        <p className="text-[0.75rem] text-[#1A1815] mt-2" style={serif}>
          No passage is set in this part of the line. The passages below point here from other times.
        </p>
      )}
      {groups.map((g) => <BookGroup key={g.book} book={g.book} entries={g.entries} />)}
      {pointing.length > 0 && <Pointing pointing={pointing} />}
    </section>
  );
}
