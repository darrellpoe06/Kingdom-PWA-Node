// =============================================================================
// JobsLedgerStrip — the jobs, by their actual names, on the OpsBoard (DR-1189)
// =============================================================================
// Darrell 2026-10-21: "Actual job names... Number of jobs, last ran, never
// ran... sequence of things, logs... Cyclical calendars... Reminders." Every
// row is a scheduled GitHub workflow read live (lib/jobs-ledger.js): its name,
// its cycle with the next fire times, when it last ran and how it ended, the
// link to its logs, and a reminder when a cycle was missed. A workflow with no
// run in the window says exactly that, with the window's reach; a failed read
// says unknown with its reason. Nothing here is painted (DR-0076 §4, §8).
//
// UX-PATTERNS: progressive disclosure (Pattern 3) — the default view is what
// needs a look (missed, no run in the window); "Show every job" opens the full
// list IN PLACE (Pattern 2e, nothing flies); the surface never goes blank
// (P15 / DR-0381): a failed read says what it could not read and what the
// registry still knows; the toggle clears the 36px floor and shows focus
// (Pattern 2g).
import React, { useState } from 'react';
import { KpiDot } from './KpiDot.jsx';
import { stateWords, ledgerLine, periodWords, fmtUtc } from '../lib/jobs-ledger.js';

const STATE_KPI = {
  missed: { status: 'attention', label: 'missed a cycle' },
  'no-run-in-window': { status: 'idle', label: 'no run in window' },
  ran: { status: 'good', label: 'on cycle' },
};

function cronList(crons) {
  return crons.map((c, i) => (
    <React.Fragment key={c}>{i ? ' / ' : ''}<span className="font-mono">{c}</span></React.Fragment>
  ));
}

export function JobsLedgerStrip({ jobs }) {
  const [open, setOpen] = useState(false);
  if (!jobs) return null;
  const ledger = jobs.ledger;
  const headKpi = !jobs.ok
    ? { status: 'idle', label: 'unknown' }
    : ledger.counts.missed
      ? { status: 'attention', label: `${ledger.counts.missed} missed` }
      : { status: 'good', label: 'every job on cycle' };
  const shown = !ledger ? [] : (open ? ledger.rows : ledger.rows.filter((r) => r.state !== 'ran'));
  return (
    <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-2 mb-3 text-[0.6875rem]" data-testid="jobs-ledger-strip">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-semibold text-[#1A1815]">Jobs — every clocked workflow, by name</span>
        <KpiDot status={headKpi.status} label={headKpi.label} />
      </div>
      {!jobs.ok ? (
        <p className="text-[0.625rem] text-[#5A5751] mt-1" data-testid="jobs-ledger-notice">
          State unknown: {jobs.notice} The registry knows {jobs.registry.scheduled} scheduled workflows (derived from {jobs.registry.derivedFrom}); none is drawn as run or missed without a read.
        </p>
      ) : (
        <>
          <p className="text-[0.625rem] text-[#5A5751] mt-1" data-testid="jobs-ledger-line">
            {ledgerLine(ledger)}. Read from the newest {ledger.window.size} scheduled runs ({ledger.window.runs} returned{ledger.window.oldest ? `, back to ${fmtUtc(ledger.window.oldest).slice(0, 10)}` : ''}). A cron is a request and GitHub throttles it, so a cycle counts as missed only past two cycles or an hour.
          </p>
          <div className="mt-1 flex justify-end">
            <button
              type="button"
              data-testid="jobs-ledger-toggle"
              aria-expanded={open ? 'true' : 'false'}
              onClick={() => setOpen((v) => !v)}
              className="px-2 py-1 min-h-[36px] text-[0.625rem] uppercase tracking-wider border border-[#C9BFA8] text-[#5A5751] hover:text-[#1A1815] hover:border-[#1A1815] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
            >
              {open ? `Show only what needs a look · ${ledger.counts.missed + ledger.counts.noRunInWindow}` : `Show every job · ${ledger.counts.scheduled}`}
            </button>
          </div>
          {shown.length === 0 ? (
            <p className="text-[0.625rem] text-[#5A6E3D] mt-1" data-testid="jobs-ledger-all-clear">Every scheduled job ran within its cycle.</p>
          ) : (
            <ol className="mt-1 divide-y divide-[#E8E4DC]" data-testid="jobs-ledger-rows">
              {shown.map((r) => {
                const k = STATE_KPI[r.state] || STATE_KPI['no-run-in-window'];
                return (
                  <li key={r.file} className="py-1.5" data-job={r.file} data-state={r.state}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[#1A1815] font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>{r.name}</span>
                      <KpiDot status={k.status} label={k.label} />
                    </div>
                    <div className="text-[0.625rem] text-[#5A5751]">
                      <span className="font-mono">{r.file}</span> · {cronList(r.crons)} · {periodWords(r.period)}
                      {r.nextFires.length ? <> · next {r.nextFires.slice(0, 2).map(fmtUtc).join(', ')}</> : null}
                    </div>
                    <div className="text-[0.625rem] text-[#5A5751]" data-testid="jobs-ledger-state">
                      {stateWords(r, ledger)}
                      {r.last && r.last.url ? <>{' '}· <a href={r.last.url} target="_blank" rel="noopener noreferrer" className="text-[#B85838] underline">logs</a></> : null}
                      {r.logsUrl ? <>{' '}· <a href={r.logsUrl} target="_blank" rel="noopener noreferrer" className="text-[#B85838] underline">all runs</a></> : null}
                      {r.runs.length > 1 ? <>{' '}· sequence: {r.runs.slice(0, 5).map((x) => `${fmtUtc(Date.parse(x.at)).slice(5, 16)} ${x.conclusion || x.status || ''}`).join(' → ')}</> : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </>
      )}
    </div>
  );
}

export default JobsLedgerStrip;
