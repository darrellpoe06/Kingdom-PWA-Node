// =============================================================================
// ChurchLearn — Church > Learn: the COLG youth "Learning A.I. The Way" class
// =============================================================================
// Darrell 2026-06-15: teach the kids of the church to use LLMs, in the app and at
// the church — giving them time through the app that he can't always give in
// person. Jayden asked for the timeline and how the curriculum goes. This surface
// publishes both, AND lets a SOLO learner finish all 8 weeks without Darrell
// present (launchable activities + a local-first A.I. tutor per week), while
// giving Darrell a facilitator guide he can teach from on paper.
//
// What is REAL here (DR-0061 / DR-0076 — nothing painted):
//   • Timeline — each week's date is COMPUTED from the cohort start (church-classes
//     .buildSchedule), and the weekday shown is the true day of that date. The
//     cohort the learner sees is RESOLVED (resolveCohort) so a learner outside the
//     Governor's instance gets the published confirmed date, not a stale proposal.
//   • Your progress — counted from YOUR real record (data.classProgress); "3 of 8"
//     is your actual completed modules, self-tracked.
//   • Interest — the "I want to join" button routes a REAL note to Darrell through
//     the existing church-voice pipe (addChurchVoice).
//   • The tutor — routes local-first to the family NAS (Ollama qwen2.5) via the
//     same-origin /n8n path; when it isn't connected it says so and the authored
//     walkthrough still carries the learner through (no fabricated answer).
//   • Export — the full curriculum (incl. the facilitator guide) as Markdown the
//     facilitator can print; built from the same source as the screen.
//
// Accessibility (WCAG 2.1 AA, verified against the rendered tokens): #1A1815 body
// on white (>=16:1), #5A5751 secondary (~7:1), #5A6E3D / #7A1F1F accents (>=4.5:1),
// every control keyboard-reachable with a visible #B85838 focus ring and >=36px
// touch targets, labelled inputs, aria-live on async confirmations.
import React, { useState, useRef } from 'react';
import {
  CLASS_META, PROPOSED_COHORT_START, SESSION_FLOW,
  buildSchedule, progressSummary, exportCurriculumMarkdown,
} from '../lib/church-classes.js';
import { askTutor } from '../lib/class-tutor.js';

const fmtDate = (d) => d
  ? d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  : null;

// A friendly label for a launch target so the button reads in plain words.
const launchLabel = (t) => {
  if (!t) return null;
  if (t.view === 'church' && t.churchView === 'home') return 'Open the Council Chamber';
  if (t.view === 'notes') return 'Open Thinking Space';
  if (t.view === 'about') return 'Open your privacy & settings';
  return 'Open the app surface';
};

// -----------------------------------------------------------------------------
// TutorPanel — the per-week solo guide. Authored walkthrough is ALWAYS shown
// (so a learner can finish offline); the chat enriches it when the local LLM is
// reachable, and degrades honestly when it is not.
// -----------------------------------------------------------------------------
function TutorPanel({ module, onLaunch }) {
  const [messages, setMessages] = useState([]); // [{ role, content, source? }]
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const liveRef = useRef(null);

  const send = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setDraft('');
    setBusy(true);
    setOffline(false);
    const res = await askTutor(module, next);
    setBusy(false);
    if (res.ok) {
      setMessages((m) => [...m, { role: 'assistant', content: res.reply, source: res.source }]);
    } else {
      setOffline(true);
    }
  };

  return (
    <div className="mt-3 border border-[#E8E4DC] bg-[#FAF8F4] p-3">
      <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-2">
        🧭 Your guide for this week
      </div>

      {/* Authored walkthrough — always available, never a dead end */}
      {module.lesson && (
        <p className="text-xs text-[#1A1815] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>{module.lesson}</p>
      )}
      <p className="text-xs text-[#1A1815] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
        <strong>Do this:</strong> {module.inApp}
      </p>
      {module.launch && onLaunch && (
        <button
          type="button"
          onClick={() => onLaunch(module.launch)}
          className="text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
        >
          {launchLabel(module.launch)} →
        </button>
      )}
      {Array.isArray(module.facilitator?.discussionPrompts) && module.facilitator.discussionPrompts.length > 0 && (
        <div className="mt-3">
          <div className="text-[10px] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Think about</div>
          <ul className="list-disc pl-5 space-y-1">
            {module.facilitator.discussionPrompts.map((q, i) => (
              <li key={i} className="text-[11px] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {/* The chat with the local tutor */}
      <div className="mt-3 border-t border-[#E8E4DC] pt-3">
        {messages.length > 0 && (
          <div className="space-y-2 mb-2" aria-live="polite" ref={liveRef}>
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <span
                  className={`inline-block text-xs px-2.5 py-1.5 max-w-[90%] ${m.role === 'user'
                    ? 'bg-[#1A1815] text-white'
                    : 'bg-white border border-[#E8E4DC] text-[#1A1815]'}`}
                  style={{ fontFamily: '"Fraunces", serif' }}
                >
                  {m.content}
                  {m.role === 'assistant' && (
                    <span className="block text-[9px] uppercase tracking-wider text-[#5A6E3D] mt-1">
                      Local tutor · test what it tells you
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}

        {offline && (
          <p className="text-[11px] text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }} aria-live="polite">
            The live tutor isn’t connected right now — but you can still finish this week on your own: follow <strong>“Do this”</strong> above and the questions to think about. Try the tutor again later.
          </p>
        )}

        <label htmlFor={`tutor-${module.id}`} className="sr-only">Ask the tutor about this week</label>
        <div className="flex gap-2 items-end">
          <textarea
            id={`tutor-${module.id}`}
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } }}
            placeholder="Ask the tutor anything about this week…"
            className="flex-1 text-sm p-2 border border-[#E8E4DC] bg-white text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]"
          />
          <button
            type="button"
            onClick={send}
            disabled={busy || !draft.trim()}
            className="text-xs uppercase tracking-wider px-3 py-2 min-h-[40px] border-2 border-[#1A1815] text-white bg-[#1A1815] hover:bg-[#3a352f] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
          >
            {busy ? '…' : 'Ask'}
          </button>
        </div>
        <p className="text-[10px] text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
          The tutor runs on the church’s own A.I. (sovereign, not sold). It can be wrong — verify what matters.
        </p>
      </div>
    </div>
  );
}

export default function ChurchLearn({
  cohortStart = PROPOSED_COHORT_START,
  cohortConfirmed = false,
  setCohortStart = null,
  confirmCohort = null,
  progress = {},
  toggleModule = null,
  addChurchVoice = null,
  submitClassInterest = null, // (name) => void — routes interest CROSS-TENANT via the feedback pipe
  classRoster = null,         // Governor-only: [{ text, who, at }] of everyone who tapped "I want to join"
  isGovernor = false,
  currentUserName = '',
  onLaunch = null, // (target:{view,churchView?}) => void — host maps to setView/setChurchView
}) {
  const [interestSent, setInterestSent] = useState(false);
  const [showFacilitator, setShowFacilitator] = useState(false);
  const [openTutorId, setOpenTutorId] = useState(null);
  const [exportNote, setExportNote] = useState('');
  const schedule = buildSchedule(cohortStart);
  const prog = progressSummary(progress);

  const canSendInterest = !!(submitClassInterest || addChurchVoice);
  const sendInterest = () => {
    if (!canSendInterest) return;
    const who = (currentUserName || '').trim() || 'A parishioner';
    // Cross-tenant first: route through the feedback pipe so a parishioner on
    // their OWN instance still reaches Darrell's review (a same-instance
    // churchVoice note never would). Fall back to the local note if that
    // handler isn't wired.
    if (submitClassInterest) {
      submitClassInterest(who);
    } else {
      addChurchVoice({
        id: `class-${Date.now()}`,
        kind: 'class-interest',
        text: `${who} wants to join the "${CLASS_META.title}" A.I. class for the youth.`,
        from: who,
        at: new Date().toISOString(),
      });
    }
    setInterestSent(true);
  };

  const curriculumMd = () => exportCurriculumMarkdown(cohortStart);

  const copyCurriculum = async () => {
    try {
      await navigator.clipboard.writeText(curriculumMd());
      setExportNote('Copied the full curriculum to your clipboard.');
    } catch (e) {
      setExportNote('Couldn’t copy automatically — use Download instead.');
    }
  };

  const downloadCurriculum = () => {
    try {
      const blob = new Blob([curriculumMd()], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'learning-ai-the-way-curriculum.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportNote('Downloaded learning-ai-the-way-curriculum.md.');
    } catch (e) {
      setExportNote('Download failed — try Copy instead.');
    }
  };

  const printCurriculum = () => {
    try { window.print(); } catch (e) { /* no-op */ }
  };

  return (
    <section className="max-w-3xl" aria-labelledby="learn-h">
      {/* ===== Screen UI (hidden when printing) ===== */}
      <div className="print:hidden">
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
            disabled={!canSendInterest}
            className="text-xs uppercase tracking-wider px-4 py-2.5 min-h-[40px] border-2 border-[#1A1815] text-white bg-[#1A1815] hover:bg-[#3a352f] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
          >
            I want to join →
          </button>
        )}
        {!canSendInterest && (
          <p className="text-[11px] text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>Sign in to send your interest.</p>
        )}
      </div>

      {/* Governor-only roster — who has asked to join, ACROSS instances. Fed from
          the cross-tenant feedback pipe, so a parishioner on their own device
          shows up here, not just same-instance members. */}
      {isGovernor && Array.isArray(classRoster) && (
        <div className="border border-[#E8E4DC] p-4 mb-5">
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <h3 className="text-base font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>Who wants in</h3>
            <span className="text-xs text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{classRoster.length} interested</span>
          </div>
          {classRoster.length === 0 ? (
            <p className="text-[11px] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
              No one has tapped “I want to join” yet. When they do — from any device, on any instance — they appear here.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {classRoster.map((r, i) => (
                <li key={r.id || i} className="text-xs text-[#1A1815] flex items-baseline justify-between gap-2" style={{ fontFamily: '"Fraunces", serif' }}>
                  <span>{r.who || r.displayName || 'A parishioner'}</span>
                  <span className="text-[10px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{(r.at || r.createdAt || '').slice(0, 10)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

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

      {/* Export — Darrell trusts paper; same source as the screen */}
      <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-3 mb-4">
        <div className="text-[10px] uppercase tracking-wider text-[#5A5751] font-semibold mb-2">Teach from paper — export the whole curriculum</div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={copyCurriculum} className="text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">Copy markdown</button>
          <button type="button" onClick={downloadCurriculum} className="text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">Download .md</button>
          <button type="button" onClick={printCurriculum} className="text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">Print</button>
        </div>
        {exportNote && <p className="text-[11px] text-[#5A6E3D] mt-2" style={{ fontFamily: '"Fraunces", serif' }} aria-live="polite">{exportNote}</p>}
      </div>

      {/* Governor-only: set / confirm the real start date + reveal the facilitator guide */}
      {isGovernor && (
        <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-3 mb-4">
          {setCohortStart && (
            <>
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
              <p className="text-[11px] text-[#5A5751] mt-2 mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
                Confirming sets it for your instance; publish the date to every learner by setting <span className="font-mono">CONFIRMED_COHORT</span> in <span className="font-mono">church-classes.js</span>. Class-interest notes show up in your Church voice review.
              </p>
            </>
          )}
          <button
            type="button"
            onClick={() => setShowFacilitator((v) => !v)}
            aria-pressed={showFacilitator}
            className={`text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${showFacilitator ? 'border-[#5A6E3D] bg-[#5A6E3D] text-white' : 'border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white'}`}
          >
            {showFacilitator ? '✓ Facilitator guide showing' : 'Show facilitator guide'}
          </button>
        </div>
      )}

      <ol className="space-y-3">
        {schedule.map((m) => {
          const done = !!progress[m.id];
          const tutorOpen = openTutorId === m.id;
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

              {/* Actions: start the week (tutor + launch), and mark done */}
              <div className="flex flex-wrap gap-2 mt-3 items-center">
                <button
                  type="button"
                  onClick={() => setOpenTutorId(tutorOpen ? null : m.id)}
                  aria-expanded={tutorOpen}
                  aria-controls={`tutor-panel-${m.id}`}
                  className={`text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${tutorOpen ? 'border-[#B85838] text-[#B85838]' : 'border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white'}`}
                >
                  {tutorOpen ? 'Close the guide' : 'Start this week →'}
                </button>
                {m.launch && onLaunch && !tutorOpen && (
                  <button
                    type="button"
                    onClick={() => onLaunch(m.launch)}
                    className="text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
                  >
                    {launchLabel(m.launch)} →
                  </button>
                )}
                {toggleModule && (
                  <button
                    type="button"
                    onClick={() => toggleModule(m.id)}
                    aria-pressed={done}
                    className={`text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${done ? 'border-[#5A6E3D] bg-[#5A6E3D] text-white' : 'border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white'}`}
                  >
                    {done ? '✓ Done' : 'Mark this week done'}
                  </button>
                )}
              </div>

              {/* The solo tutor for this week */}
              {tutorOpen && (
                <div id={`tutor-panel-${m.id}`}>
                  <TutorPanel module={m} onLaunch={onLaunch} />
                </div>
              )}

              {/* Facilitator guide (Governor-revealed) */}
              {isGovernor && showFacilitator && m.facilitator && (
                <div className="mt-3 border-l-4 border-[#7A1F1F] bg-[#FAF8F4] p-3">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-[#7A1F1F] font-semibold mb-2">Facilitator guide</div>
                  {m.lesson && (
                    <p className="text-xs text-[#1A1815] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>{m.lesson}</p>
                  )}
                  {m.facilitator.talkingPoints?.length > 0 && (
                    <>
                      <div className="text-[10px] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Talking points</div>
                      <ul className="list-disc pl-5 space-y-1 mb-2">
                        {m.facilitator.talkingPoints.map((t, i) => (
                          <li key={i} className="text-[11px] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{t}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {m.facilitator.howToRun && (
                    <>
                      <div className="text-[10px] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">How to run the 75 minutes</div>
                      <ul className="list-disc pl-5 space-y-1 mb-2">
                        {m.facilitator.howToRun.split('|').map((s) => s.trim()).filter(Boolean).map((seg, i) => (
                          <li key={i} className="text-[11px] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{seg}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {m.facilitator.discussionPrompts?.length > 0 && (
                    <>
                      <div className="text-[10px] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Discussion prompts</div>
                      <ul className="list-disc pl-5 space-y-1">
                        {m.facilitator.discussionPrompts.map((d, i) => (
                          <li key={i} className="text-[11px] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{d}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <p className="text-[11px] text-[#5A5751] mt-5" style={{ fontFamily: '"Fraunces", serif' }}>
        Taught by Darrell Poe · The Church of the Living God · built on PoeTech. The first community we serve, the way we serve every community after.
      </p>
      </div>

      {/* ===== Print-only full curriculum (paper) ===== */}
      <div className="hidden print:block text-black">
        <h1 style={{ fontSize: '20px', fontWeight: 700 }}>{CLASS_META.title}</h1>
        <p><em>{CLASS_META.tagline}</em></p>
        <p>For {CLASS_META.audience}. {CLASS_META.format}.</p>
        <p><strong>Every session:</strong> {SESSION_FLOW.map((s) => `${s.name} (${s.minutes})`).join(' · ')}</p>
        <hr />
        {schedule.map((m) => (
          <div key={m.id} style={{ pageBreakInside: 'avoid', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700 }}>Week {m.week} — {m.title}{m.date ? ` · ${fmtDate(m.date)}` : ''}</h2>
            <p><strong>Big idea.</strong> {m.bigIdea}</p>
            {m.lesson && <p><strong>Lesson.</strong> {m.lesson}</p>}
            <p><strong>In the app.</strong> {m.inApp}</p>
            <p><strong>Anchor — {m.anchor.ref}.</strong> {m.anchor.theme}</p>
            {m.facilitator && (
              <div>
                {m.facilitator.talkingPoints?.length > 0 && (
                  <><p><strong>Talking points</strong></p>
                  <ul>{m.facilitator.talkingPoints.map((t, i) => <li key={i}>{t}</li>)}</ul></>
                )}
                {m.facilitator.howToRun && (
                  <><p><strong>How to run the 75 minutes</strong></p>
                  <ul>{m.facilitator.howToRun.split('|').map((s) => s.trim()).filter(Boolean).map((seg, i) => <li key={i}>{seg}</li>)}</ul></>
                )}
                {m.facilitator.discussionPrompts?.length > 0 && (
                  <><p><strong>Discussion prompts</strong></p>
                  <ul>{m.facilitator.discussionPrompts.map((d, i) => <li key={i}>{d}</li>)}</ul></>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
