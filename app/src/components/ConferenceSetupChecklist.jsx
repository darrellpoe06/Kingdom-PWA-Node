// =============================================================================
// ConferenceSetupChecklist — the config skeleton, surfaced in the setup flow
// =============================================================================
// The organizer's at-a-glance "what's set up / what's still blank" for the
// conference, driven entirely by REAL state (conferenceSetupSteps). The KNOWN
// facts (South Campus venue + its rooms, seeded by 0024) show as done; the BLANKS
// (dates, schedule) show amber with a one-line hint. No fabricated values — a
// blank reads "— not set —". Organizer-only (rendered inside the gated
// EventCenterModule). Pairs with the setup RUNBOOK in docs/99-session-notes.
import React from 'react';
import { KpiDot } from './KpiDot.jsx';
import { conferenceSetupSteps, setupProgress } from '../lib/conference-setup.js';

const TONE = { done: 'good', partial: 'attention', todo: 'attention', info: 'idle' };
const MARK = { done: '✓', partial: '◐', todo: '○', info: 'ℹ' };

export default function ConferenceSetupChecklist({ conference, venues, rooms, sessions, registrations, headCount }) {
  const steps = conferenceSetupSteps({ conference, venues, rooms, sessions, registrations, headCount });
  const progress = setupProgress(steps);

  return (
    <div className="bg-[#FAF8F4] border border-[#1A1815] p-3 sm:p-4">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <h3 className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">🛠 Conference setup</h3>
        <span className="text-[0.625rem] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{progress.done}/{progress.total} done</span>
      </div>
      <p className="text-[0.6875rem] text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
        {progress.complete
          ? 'Setup looks complete — review and open registration.'
          : `Still to fill: ${progress.remaining.join(' · ')}.`}
      </p>
      <ul className="space-y-1.5">
        {steps.map((s) => (
          <li key={s.key} className="flex items-start gap-2">
            <span className="shrink-0 mt-0.5"><KpiDot status={TONE[s.status]} label="" className="text-[0.625rem]" /></span>
            <span className="min-w-0 flex-1">
              <span className="text-[0.6875rem] font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                <span aria-hidden="true">{MARK[s.status]}</span> {s.title}
              </span>
              <span className="block text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{s.value}</span>
              {s.hint && <span className="block text-[0.625rem] text-[#8A6E1F] italic" style={{ fontFamily: '"Fraunces", serif' }}>→ {s.hint}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
