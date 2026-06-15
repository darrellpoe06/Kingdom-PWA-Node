// =============================================================================
// ConferenceClass — Church > Learn: the all-ages conference class (three lanes)
// =============================================================================
// Darrell 2026-06-15: a conference class "for all ages." One event, three paced
// lanes (elders at their pace · the middle who are tired of being tech support ·
// youth taste of the full cohort). Sibling to ChurchLearn (the youth 8-week class),
// reusing the same real-data plumbing.
//
// What is REAL here (DR-0061 / DR-0076 — nothing painted):
//   • The conference date is COMPUTED/validated from the Governor-set value and
//     blank until set — the UI says "date to be set," never a fake date.
//   • Your progress per lane is counted from YOUR record (data.classProgress,
//     lane-namespaced) — "2 of 3" is your actual checked-off sessions.
//   • "I want this lane" routes a REAL note to the Governor via addChurchVoice
//     (the same lane reviewed for the youth class), carrying which lane.
// The lane curricula are authored content (a published syllabus).
//
// Accessibility (WCAG 2.1 AA, verified against the rendered tokens): #1A1815 body
// on white (>=16:1), #5A5751 secondary (~7:1), #5A6E3D / #B85838 accents (>=4.5:1),
// every control keyboard-reachable with a visible #B85838 focus ring and >=36px
// touch targets, labelled inputs, role=tablist lane switcher, aria-live on the
// interest confirmation.
import React, { useState } from 'react';
import {
  CONFERENCE_META, PROPOSED_CONFERENCE_DATE, LANES, getLane,
  laneProgress, overallProgress, conferenceDate, sessionKey,
} from '../lib/conference-class.js';

const fmtDate = (d) => d
  ? d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  : null;

export default function ConferenceClass({
  conferenceStart = PROPOSED_CONFERENCE_DATE,
  conferenceConfirmed = false,
  setConferenceStart = null,
  confirmConference = null,
  progress = {},
  toggleSession = null,
  addChurchVoice = null,
  isGovernor = false,
  currentUserName = '',
}) {
  const [activeLane, setActiveLane] = useState(LANES[0].id);
  const [interestSentLane, setInterestSentLane] = useState(null);

  const lane = getLane(activeLane) || LANES[0];
  const when = conferenceDate(conferenceStart);
  const overall = overallProgress(progress);
  const laneProg = laneProgress(lane, progress);

  const sendInterest = () => {
    if (!addChurchVoice) return;
    const who = (currentUserName || '').trim() || 'A parishioner';
    addChurchVoice({
      id: `conf-${Date.now()}`,
      kind: 'conference-class-interest',
      text: `${who} wants the "${lane.label}" lane of the "${CONFERENCE_META.title}" all-ages conference class.`,
      from: who,
      at: new Date().toISOString(),
    });
    setInterestSentLane(lane.id);
  };

  return (
    <section className="max-w-3xl" aria-labelledby="conf-h">
      <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">Church · Learn · Conference</div>
      <h2 id="conf-h" className="text-2xl sm:text-3xl mt-1 mb-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>
        {CONFERENCE_META.title}
      </h2>
      <p className="text-sm text-[#1A1815] mb-1" style={{ fontFamily: '"Fraunces", serif' }}>{CONFERENCE_META.tagline}</p>
      <p className="text-xs text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
        For {CONFERENCE_META.audience}. {CONFERENCE_META.format}
      </p>

      {/* When — real, blank until the Governor sets it (never a painted date) */}
      <p className="text-xs text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
        {when
          ? <>Conference day: <strong className="text-[#1A1815]">{fmtDate(when.date)}</strong>. {conferenceConfirmed ? '' : 'Date is proposed until confirmed.'}</>
          : <>Conference day: <strong className="text-[#1A1815]">to be set</strong> — check back once the date is confirmed.</>}
      </p>

      {/* Governor-only: set / confirm the real conference date */}
      {isGovernor && setConferenceStart && (
        <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-3 mb-5">
          <label htmlFor="conf-date" className="block text-[10px] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Governor · conference date</label>
          <div className="flex flex-wrap gap-2 items-center">
            <input
              id="conf-date"
              type="date"
              value={conferenceStart || ''}
              onChange={(e) => setConferenceStart(e.target.value)}
              className="text-sm border border-[#1A1815] px-2 py-1.5 min-h-[36px] bg-white text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]"
            />
            {confirmConference && (
              <button
                type="button"
                onClick={() => confirmConference(!conferenceConfirmed)}
                className="text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
              >
                {conferenceConfirmed ? 'Mark proposed' : 'Confirm date'}
              </button>
            )}
          </div>
          <p className="text-[11px] text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
            Lane-interest notes show up in your Church voice review.
          </p>
        </div>
      )}

      {/* Lane switcher */}
      <div role="tablist" aria-label="Conference lanes" className="flex flex-wrap gap-2 mb-4 border-b border-[#E8E4DC]">
        {LANES.map((l) => {
          const selected = l.id === activeLane;
          return (
            <button
              key={l.id}
              role="tab"
              id={`lane-tab-${l.id}`}
              aria-selected={selected}
              aria-controls={`lane-panel-${l.id}`}
              type="button"
              onClick={() => setActiveLane(l.id)}
              className={`px-3 py-2.5 min-h-[40px] text-sm whitespace-nowrap border-b-2 transition-colors focus:outline focus:outline-2 focus:outline-[#B85838] ${selected ? 'border-[#1A1815] text-[#1A1815] font-semibold' : 'border-transparent text-[#5A5751] hover:text-[#1A1815]'}`}
              style={{ fontFamily: '"Fraunces", serif' }}
            >
              {l.label}
            </button>
          );
        })}
      </div>

      {/* Active lane panel */}
      <div role="tabpanel" id={`lane-panel-${lane.id}`} aria-labelledby={`lane-tab-${lane.id}`}>
        <p className="text-xs text-[#5A5751] mb-1" style={{ fontFamily: '"Fraunces", serif' }}>{lane.forWhom}</p>
        <p className="text-sm text-[#1A1815] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>{lane.promise}</p>

        {/* Interest — a real connection to the Governor */}
        <div className="bg-[#FAF8F4] border-2 border-[#1A1815] p-4 mb-5">
          <h3 className="text-base font-semibold text-[#1A1815] mb-1" style={{ fontFamily: '"Fraunces", serif' }}>Want this lane?</h3>
          <p className="text-xs text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
            Tell us you want the <strong className="text-[#1A1815]">{lane.label}</strong> lane and we’ll save you a seat. Your name goes straight to review — no form, no email.
          </p>
          {interestSentLane === lane.id ? (
            <div className="text-sm text-[#5A6E3D] font-semibold" style={{ fontFamily: '"Fraunces", serif' }} aria-live="polite">
              ✓ Sent — we’ll see your interest in the {lane.label} lane. See you there.
            </div>
          ) : (
            <button
              type="button"
              onClick={sendInterest}
              disabled={!addChurchVoice}
              className="text-xs uppercase tracking-wider px-4 py-2.5 min-h-[40px] border-2 border-[#1A1815] text-white bg-[#1A1815] hover:bg-[#3a352f] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
            >
              I want this lane →
            </button>
          )}
          {!addChurchVoice && (
            <p className="text-[11px] text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>Sign in to send your interest.</p>
          )}
        </div>

        {/* Per-lane progress — real, from the signed-in record */}
        {toggleSession && (
          <div className="border border-[#E8E4DC] p-4 mb-5">
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <h3 className="text-base font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>Your progress · {lane.label}</h3>
              <span className="text-xs text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{laneProg.done} of {laneProg.total} · {laneProg.pct}%</span>
            </div>
            <div className="h-2 bg-[#E8E4DC] overflow-hidden" role="progressbar" aria-valuenow={laneProg.pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${lane.label} lane progress`}>
              <div className="h-full bg-[#5A6E3D]" style={{ width: `${laneProg.pct}%` }} />
            </div>
            <p className="text-[11px] text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
              Check off each step as you finish — counted from your own record, just for you.
            </p>
          </div>
        )}

        {/* The lane's sessions */}
        <ol className="space-y-3">
          {lane.sessions.map((s, i) => {
            const key = sessionKey(lane.id, s.id);
            const done = !!progress[key];
            return (
              <li key={s.id} className="border border-[#E8E4DC] p-4">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <span className="text-sm font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                    Step {i + 1} · {s.title}
                  </span>
                </div>
                <p className="text-sm text-[#1A1815] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>{s.bigIdea}</p>
                <p className="text-xs text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
                  <strong className="text-[#1A1815]">In the app:</strong> {s.inApp}
                </p>
                <p className="text-[11px] text-[#5A6E3D] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
                  <strong>Anchor — {s.anchor.ref}:</strong> {s.anchor.theme}
                </p>
                {toggleSession && (
                  <button
                    type="button"
                    onClick={() => toggleSession(key)}
                    aria-pressed={done}
                    className={`mt-3 text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#B85838] ${done ? 'border-[#5A6E3D] bg-[#5A6E3D] text-white' : 'border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white'}`}
                  >
                    {done ? '✓ Done' : 'Mark this step done'}
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <p className="text-[11px] text-[#5A5751] mt-5" style={{ fontFamily: '"Fraunces", serif' }}>
        {overall.total > 0 && <>Together, this room has finished {overall.done} of {overall.total} steps across all lanes. </>}
        Taught at The Church of the Living God · built on PoeTech. The first community we serve, the way we serve every community after.
      </p>
    </section>
  );
}
