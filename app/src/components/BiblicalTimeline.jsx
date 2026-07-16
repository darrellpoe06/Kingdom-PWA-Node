// =============================================================================
// BiblicalTimeline — the interactive timeline surface (the app view for the spine)
// =============================================================================
// Darrell 2026-07-15: "Add a timeline feature ... from the Word[']s perspectives
// ... Yahweh and humans[']  relationship before, during and end of time ...
// highlighting where we are on the timeline in context of the Word." This is the
// VISIBLE feature that walks the redemptive record as one relationship. It reads
// the verified spine lib/biblical-timeline.js (one source, DR-0079) -- every
// verse is KJV-verbatim there (guarded by biblical-timeline.test.js, DR-0076) --
// and maps each epoch's lesson ids to the real Living Lesson titles so the
// "ties in all the other lessons in their respective places" is live, not drawn.
//
// Three timeframes (before / during / end); each epoch opens to its Scripture,
// the lessons anchored there, and -- where believers differ -- the "all
// possibilities" block (plumb line / views / open / confidence), the house's way
// (DR-0098 / DR-0100), deferring contested doctrine to the SME. A clear YOU ARE
// HERE marker sits on the Church Age. Advisory, honest-empty by construction.
// =============================================================================
import React, { useState } from 'react';
import { TIMELINE_FRAME_ANCHORS, epochsByPhase, currentEpoch } from '../lib/biblical-timeline.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

const PHASE_LABEL = {
  before: 'Before Time',
  during: 'During Time — the biblical record',
  end: 'The End of Time',
};

const REL_LABEL = {
  purposed: 'Purposed', fellowship: 'Fellowship', broken: 'Broken',
  pursued: 'Pursued', restored: 'Restored', consummated: 'Consummated',
};

function lessonTitle(id) {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === id);
  return m ? m.title : null;
}

function Anchor({ a }) {
  return (
    <p className="text-[0.8125rem] text-[#1A1815] mt-1.5" style={{ fontFamily: '"Fraunces", serif' }}>
      <span className="text-[#5A6E3D] font-semibold">{a.ref}</span>{' — '}
      <span className="italic">{a.text}</span>
    </p>
  );
}

function Possibilities({ p }) {
  return (
    <div className="mt-2 border-l-4 border-[#B85838] bg-[#B85838]/[0.06] pl-3 py-2">
      <div className="text-[0.625rem] uppercase tracking-wider text-[#B85838] font-semibold mb-1">
        All the possibilities — {p.question}
      </div>
      <p className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
        <strong>What is settled:</strong> {p.plumbLine}
      </p>
      <ul className="list-disc pl-4 mt-1.5 space-y-1">
        {p.views.map((v, i) => (
          <li key={i} className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
            <strong>{v.view}</strong> — {v.tie}
          </li>
        ))}
      </ul>
      <p className="text-xs text-[#5A5751] mt-1.5" style={{ fontFamily: '"Fraunces", serif' }}>
        <strong className="text-[#1A1815]">Held open:</strong> {p.open}
      </p>
      <p className="text-[0.6875rem] text-[#5A5751] mt-1" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
        {p.confidence} · {p.source}
      </p>
    </div>
  );
}

export default function BiblicalTimeline() {
  const here = currentEpoch();
  const [openId, setOpenId] = useState(here ? here.id : null);
  const phases = epochsByPhase();

  return (
    <div className="max-w-3xl mx-auto px-1">
      <p className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Church · The Word</p>
      <h1 className="text-3xl sm:text-4xl font-bold text-[#1A1815] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
        The Whole Story
      </h1>
      <p className="text-sm text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
        Yahweh and humanity, from before time to the end of time — one relationship:
        fellowship, broken, pursued, restored, and made complete. He walked with them in the
        garden (Genesis 3:8), and the end is the same picture — “the tabernacle of God is with
        men” (Revelation 21:3). Tap any era to open its Scripture, the lessons that live there,
        and — where believers differ — all the possibilities, held the Word’s way.
      </p>

      {/* The frame verses — Yahweh spans the whole line. */}
      <div className="mt-3 border border-[#E8E4DC] bg-[#FAF8F4] p-3">
        <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">Over the whole line</div>
        {TIMELINE_FRAME_ANCHORS.map((a) => <Anchor key={a.ref} a={a} />)}
      </div>

      {phases.map((group) => (
        <section key={group.phase} className="mt-5" aria-label={PHASE_LABEL[group.phase]}>
          <h2 className="text-[0.6875rem] uppercase tracking-[0.2em] text-[#5A5751] font-semibold border-b border-[#E8E4DC] pb-1">
            {PHASE_LABEL[group.phase]}
          </h2>
          <ol className="mt-2 space-y-2">
            {group.epochs.map((e) => {
              const isOpen = openId === e.id;
              const youAreHere = e.youAreHere === true;
              return (
                <li key={e.id} className={`border p-3 ${youAreHere ? 'border-[#B85838] border-2 bg-[#B85838]/[0.04]' : 'border-[#E8E4DC] bg-white'}`}>
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : e.id)}
                    aria-expanded={isOpen}
                    className="w-full text-left focus:outline focus:outline-2 focus:outline-[#B85838]"
                  >
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <span className="text-base font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                        {e.era}
                      </span>
                      {youAreHere && (
                        <span className="text-[0.5625rem] uppercase tracking-widest bg-[#B85838] text-white px-2 py-0.5 font-semibold">
                          You are here
                        </span>
                      )}
                    </div>
                    <div className="text-[0.6875rem] text-[#5A5751] mt-0.5" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                      {e.when} · {REL_LABEL[e.relationship.state] || e.relationship.state}
                    </div>
                    <p className="text-sm text-[#1A1815] mt-1.5" style={{ fontFamily: '"Fraunces", serif' }}>
                      {e.relationship.line}
                    </p>
                  </button>

                  {isOpen && (
                    <div className="mt-2">
                      <p className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{e.summary}</p>

                      <div className="mt-2">
                        <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">Scripture</div>
                        {e.anchors.map((a) => <Anchor key={a.ref} a={a} />)}
                      </div>

                      {Array.isArray(e.lessons) && e.lessons.length > 0 && (
                        <div className="mt-2">
                          <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">Lessons that live here</div>
                          <ul className="list-disc pl-4 mt-1 space-y-0.5">
                            {e.lessons.map((id) => {
                              const t = lessonTitle(id);
                              return t ? (
                                <li key={id} className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{t}</li>
                              ) : null;
                            })}
                          </ul>
                        </div>
                      )}

                      {Array.isArray(e.possibilities) && e.possibilities.map((p, i) => <Possibilities key={i} p={p} />)}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      <p className="text-[0.6875rem] text-[#5A5751] mt-6 mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
        Word-first. Every verse is KJV, fetched verbatim. Where the Word leaves a matter open,
        it is named — and the settling of doctrine is left to the elders the house has set over it.
      </p>
    </div>
  );
}
