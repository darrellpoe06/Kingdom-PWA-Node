// =============================================================================
// ChurchLearn — Church > Learn: the COLG youth "Learning A.I. The Way" class
// =============================================================================
// Darrell 2026-06-15: teach the kids of the church to use LLMs, in the app and at
// the church — giving them time through the app that he can't always give in
// person. Jayden asked for the timeline and how the curriculum goes. This surface
// publishes both.
//
// What is REAL here (DR-0061 / DR-0076 — nothing painted):
//   • Timeline — each week's date is COMPUTED from the cohort start (church-classes
//     .buildSchedule), and the weekday shown is the true day of that date.
//   • Your progress — counted from YOUR real record (data.classProgress), persisted
//     with the rest of your data; "3 of 8" is your actual completed modules.
//   • Interest — the "I want to join" button routes a REAL note to Darrell through
//     the existing church-voice pipe (addChurchVoice), the same lane he already
//     reviews. It is a wired connection, not a dead button.
// The curriculum MODULES are authored content (a published syllabus).
//
// Accessibility (WCAG 2.1 AA, verified against the rendered tokens): #1A1815 body
// on white (>=16:1), #5A5751 secondary (~7:1), #5A6E3D / #7A1F1F accents (>=4.5:1),
// every control keyboard-reachable with a visible #B85838 focus ring and >=36px
// touch targets, labelled inputs, aria-live on the interest confirmation.
import React, { useState } from 'react';
import { CLASS_META, PROPOSED_COHORT_START, buildSchedule, progressSummary } from '../lib/church-classes.js';

const fmtDate = (d) => d
  ? d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  : null;

export default function ChurchLearn({
  cohortStart = PROPOSED_COHORT_START,
  cohortConfirmed = false,
  setCohortStart = null,
  confirmCohort = null,
  progress = {},
  toggleModule = null,
  addChurchVoice = null,
  isGovernor = false,
  currentUserName = '',
}) {
  const [interestSent, setInterestSent] = useState(false);
  const schedule = buildSchedule(cohortStart);
  const prog = progressSummary(progress);

  const sendInterest = () => {
    if (!addChurchVoice) return;
    const who = (currentUserName || '').trim() || 'A parishioner';
    addChurchVoice({
      id: `class-${Date.now()}`,
      kind: 'class-interest',
      text: `${who} wants to join the "${CLASS_META.title}" A.I. class for the youth.`,
      from: who,
      at: new Date().toISOString(),
    });
    setInterestSent(true);
  };

  return (
    <section className="max-w-3xl" aria-labelledby="learn-h">
      <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">Church · Learn</div>
      <h2 id="learn-h" className="text-2xl sm:text-3xl mt-1 mb-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>
        {CLASS_META.title}
      </h2>
      <p className="text-sm text-[#1A1815] mb-1" style={{ fontFamily: '"Fraunces", serif' }}>{CLASS_META.tagline}</p>
      <p className="text-xs text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
        For {CLASS_META.audience}. {CLASS_META.format}.
      </p>

      {/* Interest — a real connection to Darrell */}
      <div className="bg-[#FAF8F4] border-2 border-[#1A1815] p-4 mb-5">
        <h3 className="text-base font-semibold text-[#1A1815] mb-1" style={{ fontFamily: '"Fraunces", serif' }}>Want in?</h3>
        <p className="text-xs text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          Tell Darrell you’re interested and he’ll save you a spot in Cohort 1. Your name goes straight to his review — no form, no email.
        </p>
        {interestSent ? (
          <div className="text-sm text-[#5A6E3D] font-semibold" style={{ fontFamily: '"Fraunces", serif' }} aria-live="polite">
            ✓ Sent — Darrell will see your interest. See you in class.
          </div>
        ) : (
          <button
            type="button"
            onClick={sendInterest}
            disabled={!addChurchVoice}
            className="text-xs uppercase tracking-wider px-4 py-2.5 min-h-[40px] border-2 border-[#1A1815] text-white bg-[#1A1815] hover:bg-[#3a352f] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
          >
            I want to join →
          </button>
        )}
        {!addChurchVoice && (
          <p className="text-[11px] text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>Sign in to send your interest.</p>
        )}
      </div>

      {/* Your progress — real, from the signed-in record */}
      {toggleModule && (
        <div className="border border-[#E8E4DC] p-4 mb-5">
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <h3 className="text-base font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>Your progress</h3>
            <span className="text-xs text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{prog.done} of {prog.total} · {prog.pct}%</span>
          </div>
          <div className="h-2 bg-[#E8E4DC] overflow-hidden" role="progressbar" aria-valuenow={prog.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Class progress">
            <div className="h-full bg-[#5A6E3D]" style={{ width: `${prog.pct}%` }} />
          </div>
          <p className="text-[11px] text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
            Check off each week as you finish it — this is counted from your own record, just for you.
          </p>
        </div>
      )}

      {/* The timeline + curriculum */}
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <h3 className="text-lg font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>The {CLASS_META.weeks} weeks</h3>
        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border ${cohortConfirmed ? 'text-[#5A6E3D] border-[#5A6E3D]' : 'text-[#B85838] border-[#B85838]'}`}>
          {cohortConfirmed ? 'Cohort 1 · confirmed' : 'Cohort 1 · proposed'}
        </span>
      </div>
      <p className="text-xs text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
        {schedule[0]?.date
          ? <>Starts <strong>{fmtDate(schedule[0].date)}</strong>, then weekly. {cohortConfirmed ? '' : 'Dates are proposed until Darrell confirms.'}</>
          : 'A start date will be set soon.'}
      </p>

      {/* Governor-only: set / confirm the real start date */}
      {isGovernor && setCohortStart && (
        <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-3 mb-4">
          <label htmlFor="cohort-start" className="block text-[10px] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Governor · cohort 1 start date</label>
          <div className="flex flex-wrap gap-2 items-center">
            <input
              id="cohort-start"
              type="date"
              value={cohortStart}
              onChange={(e) => setCohortStart(e.target.value)}
              className="text-sm border border-[#1A1815] px-2 py-1.5 min-h-[36px] bg-white text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]"
            />
            {confirmCohort && (
              <button
                type="button"
                onClick={() => confirmCohort(!cohortConfirmed)}
                className="text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
              >
                {cohortConfirmed ? 'Mark proposed' : 'Confirm dates'}
              </button>
            )}
          </div>
          <p className="text-[11px] text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
            Class-interest notes show up in your Church voice review.
          </p>
        </div>
      )}

      <ol className="space-y-3">
        {schedule.map((m) => {
          const done = !!progress[m.id];
          return (
            <li key={m.id} className="border border-[#E8E4DC] p-4">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <span className="text-sm font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                  Week {m.week} · {m.title}
                </span>
                <span className="text-[11px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  {m.date ? fmtDate(m.date) : 'date TBD'}
                </span>
              </div>
              <p className="text-sm text-[#1A1815] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>{m.bigIdea}</p>
              <p className="text-xs text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
                <strong className="text-[#1A1815]">In the app:</strong> {m.inApp}
              </p>
              <p className="text-[11px] text-[#5A6E3D] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
                <strong>Anchor — {m.anchor.ref}:</strong> {m.anchor.theme}
              </p>
              {toggleModule && (
                <button
                  type="button"
                  onClick={() => toggleModule(m.id)}
                  aria-pressed={done}
                  className={`mt-3 text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#B85838] ${done ? 'border-[#5A6E3D] bg-[#5A6E3D] text-white' : 'border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white'}`}
                >
                  {done ? '✓ Done' : 'Mark this week done'}
                </button>
              )}
            </li>
          );
        })}
      </ol>

      <p className="text-[11px] text-[#5A5751] mt-5" style={{ fontFamily: '"Fraunces", serif' }}>
        Taught by Darrell Poe · The Church of the Living God · built on PoeTech. The first community we serve, the way we serve every community after.
      </p>
    </section>
  );
}
