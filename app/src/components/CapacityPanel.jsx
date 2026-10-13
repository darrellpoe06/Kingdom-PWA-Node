// =============================================================================
// CapacityPanel — Big Picture → Now → Capacity (DR-0690).
// =============================================================================
// Darrell 2026-09-30, over a phone screenshot of a completely empty Capacity
// tab: "Capacity workflows work?" The meter rendered only when a skill profile
// carried weekly hours; with none it rendered NOTHING, so the tab read as
// broken and the question could not be answered from the screen.
//
// The panel now answers it in every state, from real rows only (DR-0061):
//   measured    — the meter (committed vs available hrs/wk), as before
//   no-profiles — says capacity is NOT being checked and why, shows what it CAN
//                 measure (committed hours from active projects), and sends the
//                 reader to where weekly hours are set (Dev/Ops → My skills)
//   no-hours    — profiles exist but every one reads 0 hrs/wk: same honesty
// In every state it lists the active projects the committed number is summed
// from, and names the flows that actually run the check.
// Colors reuse the meter's existing classes, which the theme layer remaps.
// =============================================================================
import React from 'react';
import { CAPACITY_CHECKED_FLOWS } from '../lib/opportunity-capacity.js';

const TOP_N = 5;
const hrs = (n) => `${Math.round(n * 10) / 10}`;

function Contributors({ capacity }) {
  const { contributors = [], unhoured = 0, activeCount = 0 } = capacity;
  const shown = contributors.slice(0, TOP_N);
  const more = contributors.length - shown.length;
  return (
    <div className="mt-3" data-testid="capacity-contributors">
      <h3 className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A5751] font-semibold mb-1">
        Where the committed hours come from · {activeCount} active project{activeCount === 1 ? '' : 's'}
      </h3>
      {activeCount === 0 ? (
        <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
          No active projects (planning, active or ending soon), so nothing is committed yet.
        </p>
      ) : (
        <>
          {shown.length > 0 && (
            <ul className="divide-y divide-[#E8E4DC] border border-[#E8E4DC]">
              {shown.map((p) => (
                <li key={p.id || p.title} className="flex items-baseline justify-between gap-2 px-2 py-1.5 text-sm">
                  <span className="min-w-0 truncate" style={{ fontFamily: '"Fraunces", serif' }}>{p.title}</span>
                  <span className="shrink-0 text-xs text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{hrs(p.hoursPerWeek)} hrs/wk</span>
                </li>
              ))}
            </ul>
          )}
          {more > 0 && (
            <p className="text-xs text-[#5A5751] mt-1">+ {more} more project{more === 1 ? '' : 's'} carrying hours.</p>
          )}
          {unhoured > 0 && (
            <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
              {unhoured} active project{unhoured === 1 ? ' has' : 's have'} no hrs/wk set, so {unhoured === 1 ? 'it counts' : 'they count'} as 0.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function CheckedFlows({ enforced }) {
  return (
    <p className="text-xs text-[#5A5751] mt-3" style={{ fontFamily: '"Fraunces", serif' }}>
      {enforced ? 'Checked before a new project is added: ' : 'Once hours are set, these flows check before adding a project: '}
      {CAPACITY_CHECKED_FLOWS.join('; ')}. Projects added straight on the Projects tab are not checked.
    </p>
  );
}

export function CapacityPanel({ capacity, projects = [], setView }) {
  const openSkills = () => { if (setView) setView('opportunities'); };
  const tbdCount = projects.filter((p) => p && p.status === 'tbd').length;

  if (capacity.state !== 'measured') {
    const missing = capacity.state === 'no-profiles'
      ? "No one's weekly hours are set yet, so capacity isn't being checked. New projects are added without a capacity check."
      : `${capacity.profileCount} skill profile${capacity.profileCount === 1 ? '' : 's'} exist${capacity.profileCount === 1 ? 's' : ''}, but none has weekly hours set (all read 0 hrs/wk), so capacity isn't being checked.`;
    return (
      <section aria-labelledby="capacity-h" data-capacity-state={capacity.state} className="bg-white border border-[#1A1815] p-4 sm:p-5">
        <h2 id="capacity-h" className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">Family Capacity · not being checked yet</h2>
        <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
          What it measures: the hours per week your active projects need, against the hours per week each person on a skill profile has available.
        </p>
        <p className="text-sm mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
          <strong>What's missing:</strong> {missing}
        </p>
        <div className="mt-3 flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 700 }}>{hrs(capacity.committed)}</span>
          <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>hrs/wk committed · available not set</span>
        </div>
        <button
          type="button"
          onClick={openSkills}
          className="mt-3 text-xs uppercase tracking-wider px-3 py-2 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white min-h-[44px] focus:outline focus:outline-2 focus:outline-[#B85838]"
        >
          Set weekly hours · Dev/Ops → My skills ↗
        </button>
        <Contributors capacity={capacity} />
        <CheckedFlows enforced={false} />
      </section>
    );
  }

  return (
    <section aria-labelledby="capacity-h" data-capacity-state="measured" className="bg-white border border-[#1A1815] p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-2 flex-wrap mb-2">
        <div>
          <h2 id="capacity-h" className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">Family Capacity · this week</h2>
          <p className="text-xs text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
            Sum of all active projects' hrs/wk vs sum of skill-profile hrs/wk ({capacity.profilesWithHours} of {capacity.profileCount} profile{capacity.profileCount === 1 ? '' : 's'} with hours set). Healthy zone: under 80%. New projects past this line get parked as TBD by default.
          </p>
        </div>
        <div className="text-right">
          <div className={`text-2xl ${capacity.pct >= 100 ? 'text-[#B85838]' : capacity.pct >= 80 ? 'text-[#D97706]' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"Fraunces", serif', fontWeight: 700 }}>
            {capacity.pct}%
          </div>
          <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
            {hrs(capacity.committed)} / {hrs(capacity.available)} hrs/wk · {hrs(capacity.remaining)} free
          </div>
        </div>
      </div>
      <div role="progressbar" aria-labelledby="capacity-h" aria-valuenow={capacity.pct} aria-valuemin="0" aria-valuemax="100">
        <div className="w-full bg-[#FAF8F4] h-3 border border-[#E8E4DC]">
          <div
            className="h-full transition-all"
            style={{
              width: `${Math.min(100, capacity.pct)}%`,
              backgroundColor: capacity.pct >= 100 ? '#B85838' : capacity.pct >= 80 ? '#D97706' : '#5A6E3D',
            }}
          />
        </div>
        <div className="flex justify-between text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mt-1">
          <span>0%</span><span>healthy ≤80%</span><span>tight ≤100%</span><span>over</span>
        </div>
      </div>
      {capacity.pct >= 80 && (
        <p className={`text-xs mt-2 ${capacity.pct >= 100 ? 'text-[#B85838]' : 'text-[#D97706]'}`} style={{ fontFamily: '"Fraunces", serif' }}>
          <strong>{capacity.pct >= 100 ? 'Over-committed.' : 'Tight.'}</strong> New projects from the checked flows below will prompt before adding.{tbdCount > 0 && <> {tbdCount} project{tbdCount === 1 ? '' : 's'} already parked as TBD.</>}
        </p>
      )}
      <Contributors capacity={capacity} />
      <CheckedFlows enforced />
      <button
        type="button"
        onClick={openSkills}
        className="mt-2 text-xs uppercase tracking-wider px-3 py-2 text-[#5A5751] hover:text-[#1A1815] min-h-[44px] focus:outline focus:outline-2 focus:outline-[#B85838]"
      >
        Change weekly hours · Dev/Ops → My skills ↗
      </button>
    </section>
  );
}

export default CapacityPanel;
