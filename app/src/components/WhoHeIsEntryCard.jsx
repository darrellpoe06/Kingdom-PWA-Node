// =============================================================================
// WhoHeIsEntryCard — one passage of the Who He Is data, made plain (DR-0675)
// =============================================================================
// Where, when, what, how, whether He was there, and Who He Is, from the
// entry's own fields (describeEntry); the key verse verbatim; the whole
// passage one tap away (VerseChips opens the KJV in place; a passage that
// crosses a chapter opens one range per chapter). Shared by the lesson
// register and the timeline.
// =============================================================================
import React from 'react';
import { describeEntry, readableRefs, PRESENT_LABEL, HOW_LABEL } from '../lib/who-he-is.js';
import { verseCount } from '../lib/bible-kjv.js';
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

