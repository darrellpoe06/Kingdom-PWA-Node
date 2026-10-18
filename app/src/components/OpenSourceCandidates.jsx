// =============================================================================
// OpenSourceCandidates — the open-source tools weighed against our own stack
// =============================================================================
// Rendered on the Infra Plan, beside the machines these tools would run on.
// Reads open-source-candidates.js (DR-1099) and nothing else: every line is a
// field of that register, and the gaps panel reads sovereignty-gaps.js live, so
// a passed re-review shows the day it passes. Nothing is painted: a pilot says
// "bring home next", never "running".
//
// UX-PATTERNS 3 (progressive disclosure) and 2e (the still screen): each tool's
// essential view is its verdict, why, machine and next step; the licences,
// egress, opportunities and constraints open IN PLACE under that tool's own
// button, never on another screen. The constraint that decided a verdict is
// already in its "why", so nothing a reader must see is behind the toggle.
// =============================================================================
import React, { useState } from 'react';
import {
  OPEN_SOURCE_CANDIDATES, CANDIDATES_RECORDED, CANDIDATES_DR, VERDICTS, PLACES, COMMERCIAL_USE,
  summarizeCandidates, touchedGaps, pinnedUrl,
} from '../lib/open-source-candidates.js';

const card = 'bg-white border border-[#1A1815] p-4 sm:p-5';
const labelCls = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751]';
const serif = { fontFamily: '"Fraunces", serif' };
const chip = 'inline-flex items-center gap-1 px-2 py-0.5 text-[0.6875rem] border border-[#C9C2B6] bg-[#FAF8F4] text-[#1A1815]';

const VERDICT_CLS = {
  pilot: 'border-[#1A1815] text-[#1A1815]',
  hold: 'border-[#B85838] text-[#B85838]',
  decline: 'border-[#C9C2B6] text-[#5A5751]',
};

const todayIso = () => new Date().toISOString().slice(0, 10);

function Candidate({ c }) {
  const [open, setOpen] = useState(false);
  const detailId = `oss-${c.id}-detail`;
  return (
    <article className="border border-[#E8E4DC] p-3" aria-label={`${c.name}: ${VERDICTS[c.verdict]}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-sm text-[#1A1815]" style={serif}>{c.name}</h4>
          <p className="text-[0.6875rem] text-[#5A5751]">In place of {c.replaces} · {c.capability}</p>
        </div>
        <span className={`text-[0.625rem] uppercase tracking-wider px-2 py-0.5 border ${VERDICT_CLS[c.verdict]}`}>{VERDICTS[c.verdict]}</span>
      </div>
      <p className="mt-2 text-[0.8125rem] text-[#1A1815]">{c.why}</p>
      <p className="mt-1 text-[0.75rem] text-[#1A1815]"><span className={labelCls}>Would run on</span> {PLACES[c.placement]}</p>
      <p className="mt-1 text-[0.75rem] text-[#1A1815]"><span className={labelCls}>Next</span> {c.nextStep}</p>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={detailId}
        onClick={() => setOpen((v) => !v)}
        className="mt-2 min-h-[36px] px-3 text-[0.6875rem] uppercase tracking-wider border border-[#C9C2B6] bg-white text-[#1A1815] hover:border-[#1A1815] focus:outline focus:outline-2 focus:outline-[#1A1815]"
      >
        {open ? 'Show less' : `Show the ${c.opportunities.length} opportunities and ${c.constraints.length} constraints`}
      </button>
      {open && (
        <div id={detailId} className="mt-2 border-t border-[#E8E4DC] pt-2">
          <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-2 text-[0.6875rem] text-[#5A5751]">
            <div><dt className={labelCls}>Licence</dt><dd className="text-[#1A1815]">{c.codeLicense}</dd></div>
            <div><dt className={labelCls}>Model weights</dt><dd className="text-[#1A1815]">{c.weightsLicense}</dd></div>
            <div><dt className={labelCls}>Use</dt><dd className="text-[#1A1815]">{COMMERCIAL_USE[c.commercialUse]}</dd></div>
            <div><dt className={labelCls}>Login</dt><dd className="text-[#1A1815]">{c.auth}</dd></div>
            <div className="sm:col-span-2"><dt className={labelCls}>Leaves our network</dt><dd className="text-[#1A1815]">{c.egress}</dd></div>
            <div className="sm:col-span-2"><dt className={labelCls}>Hardware</dt><dd className="text-[#1A1815]">{c.hardware}</dd></div>
          </dl>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div>
              <div className={labelCls}>Opportunities</div>
              <ul className="mt-1 space-y-0.5 text-[0.75rem] text-[#1A1815]">
                {c.opportunities.map((o) => <li key={o}>· {o}</li>)}
              </ul>
            </div>
            <div>
              <div className={labelCls}>Constraints</div>
              <ul className="mt-1 space-y-0.5 text-[0.75rem] text-[#1A1815]">
                {c.constraints.map((o) => <li key={o}>· {o}</li>)}
              </ul>
            </div>
          </div>
          <p className="mt-2 text-[0.6875rem] text-[#5A5751]">
            Read at{' '}
            <a href={pinnedUrl(c)} target="_blank" rel="noopener noreferrer" className="underline text-[#1A1815]">{c.repo} {c.pin.ref}</a>
            {' '}· re-review {c.reReview}
          </p>
        </div>
      )}
    </article>
  );
}

export default function OpenSourceCandidates({ today = todayIso(), list = OPEN_SOURCE_CANDIDATES }) {
  const sum = summarizeCandidates(list);
  const gaps = touchedGaps(today, list);
  const groups = ['pilot', 'hold', 'decline'];
  return (
    <section className={card} aria-labelledby="oss-candidates-title">
      <h3 id="oss-candidates-title" className="text-base sm:text-lg text-[#1A1815]" style={serif}>Open-source tools, weighed</h3>
      <p className="mt-1 text-sm text-[#5A5751]">
        {sum.total} tools offered as replacements for paid services, each read at an exact release on {CANDIDATES_RECORDED} ({CANDIDATES_DR}).
        None of them is installed yet. A tool that can run code needs a budget, a lock and a kill switch before it is piloted.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {groups.map((v) => <span key={v} className={chip}>{sum.byVerdict[v] || 0} {VERDICTS[v].toLowerCase()}</span>)}
        {Object.entries(sum.byPlace).map(([p, n]) => <span key={p} className={chip}>{n} on {PLACES[p]}</span>)}
      </div>

      {gaps.length > 0 && (
        <div className="mt-3 border border-[#E8E4DC] p-3">
          <div className={labelCls}>Sovereignty gaps these touch</div>
          <ul className="mt-1 space-y-1 text-[0.75rem] text-[#1A1815]">
            {gaps.map((g) => (
              <li key={g.id}>
                {g.capability}: {g.candidates.join(', ')}.{' '}
                <span className={g.overdue ? 'text-[#B85838]' : 'text-[#5A5751]'}>
                  {g.overdue ? `Its re-review (${g.reReview}) has passed.` : `Re-review ${g.reReview}.`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {groups.map((v) => {
        const items = list.filter((c) => c.verdict === v);
        if (!items.length) return null;
        return (
          <div key={v} className="mt-4">
            <div className={labelCls}>{VERDICTS[v]} ({items.length})</div>
            <div className="mt-2 space-y-2">
              {items.map((c) => <Candidate key={c.id} c={c} />)}
            </div>
          </div>
        );
      })}
    </section>
  );
}
