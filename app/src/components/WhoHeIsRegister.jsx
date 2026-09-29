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
import React from 'react';
import {
  registerFor, byBook, describeEntry, eraLabel, readableRefs, WHO_HE_IS_EDGE, PRESENT_LABEL, HOW_LABEL,
} from '../lib/who-he-is.js';
import { verseCount } from '../lib/bible-kjv.js';
import { useOpenWithTheWord } from '../lib/show-the-word.js';
import ShowTheWordToggle from './ShowTheWordToggle.jsx';
import VerseChips from './VerseChips.jsx';

const serif = { fontFamily: '"Fraunces", serif' };
const mono = { fontFamily: '"JetBrains Mono", monospace' };
const btn = 'text-[0.6875rem] px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';

function Row({ label, children }) {
  return (
    <p className="text-[0.75rem] text-[#1A1815] mt-1" style={serif}>
      <strong className="text-[#5A6E3D]">{label}:</strong> {children}
    </p>
  );
}

export function EntryCard({ entry, onOpenLesson = null, lessonLabel = null }) {
  const d = describeEntry(entry);
  const refs = readableRefs(entry.ref, (book, c) => verseCount(book, c));
  return (
    <li className="border border-[#E8E4DC] bg-white p-3" data-entry={entry.id}>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-[0.8125rem] font-semibold text-[#1A1815]" style={serif}>{entry.ref}</span>
        <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]" style={mono}>
          {HOW_LABEL[entry.how.mode]} · {PRESENT_LABEL[entry.present]}
        </span>
      </div>
      <p className="text-[0.8125rem] italic text-[#1A1815] mt-1" style={serif}>
        <span className="not-italic text-[#5A6E3D] font-semibold">{d.keyVerse.ref}</span>{' — '}{d.keyVerse.text}
      </p>
      <Row label="Where">{d.where}</Row>
      <Row label="When">{d.when}</Row>
      <Row label="What">{d.what}</Row>
      <Row label="How">{d.how}</Row>
      <Row label="Was He there">{`${PRESENT_LABEL[entry.present]}: ${entry.presentDetail}. ${entry.presentReason}`}</Row>
      <Row label="Who He Is">{d.whoHeIs}</Row>
      {entry.parallels.length > 0 && <Row label="Also told in">{entry.parallels.join('; ')}</Row>}
      <div className="mt-2">
        <VerseChips refs={refs} />
      </div>
      {onOpenLesson && lessonLabel && (
        <button type="button" onClick={onOpenLesson} className={`${btn} mt-2 border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white`}>
          {lessonLabel} →
        </button>
      )}
    </li>
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
  if (spec.edge) return <div className="mt-3"><Edge /></div>;
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
