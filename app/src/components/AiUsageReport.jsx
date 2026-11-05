// =============================================================================
// AiUsageReport — what the AI cost, per task, beside what the same work would
// have cost without it (DR-1338, DR-1330 D8)
// =============================================================================
// Renders lib/ai-usage-ledger.json; every number derived on read by rollup(),
// nothing painted. Where no meter exists the tile SAYS so ("not metered")
// rather than showing a zero that reads as free (P15; DR-0076 §8). Mounted
// under Admin → Proving our ways, beside the measure of whether the ways
// serve the people, because this is the measure of what the ways cost.
import React from 'react';
import { loadAiUsageLedger, rollup } from '../lib/ai-usage-ledger.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const MONO = { fontFamily: '"JetBrains Mono", monospace' };

function Tile({ label, value, sub, testid }) {
  return (
    <div className="rounded-xl border border-[#E8E2D8] bg-white px-3 py-2" data-testid={testid}>
      <div className="text-xs uppercase tracking-wide text-[#5A5751]">{label}</div>
      <div className="text-lg font-semibold text-[#1A1815]" style={SERIF}>
        {value}
      </div>
      {sub && <div className="text-xs text-[#5A5751]">{sub}</div>}
    </div>
  );
}

export default function AiUsageReport({ ledger = loadAiUsageLedger() }) {
  const r = rollup(ledger);
  const entries = ledger.entries || [];
  if (!entries.length) {
    return (
      <p className="mt-4 text-sm text-[#5A5751]" data-testid="ai-usage-empty">
        No task has been ledgered yet. Every decision record from DR-1331 on must carry a line here (scripts/ai-usage-ledger.mjs --add), and the build refuses
        one that does not.
      </p>
    );
  }
  return (
    <div className="mt-6 space-y-4" data-testid="ai-usage-report">
      <div>
        <h2 className="text-xl font-bold text-[#1A1815]" style={SERIF}>
          What the AI cost, per task
        </h2>
        <p className="text-xs text-[#5A5751]">
          Wall clock is measured from the previous push to the task&rsquo;s push. &ldquo;Without AI&rdquo; is an engineer&rsquo;s estimate and is labelled one.
          Tokens and dollars appear only where a meter exists; where none does, the tile says so.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Tile testid="ai-tasks" label="Tasks" value={r.tasks} />
        <Tile testid="ai-wall" label="Took, with AI" value={`${r.wallClockHours} h`} sub="measured from commits" />
        <Tile
          testid="ai-estimate"
          label="Estimated without AI"
          value={`${r.estimateWithoutAiHours} h`}
          sub={r.ratio ? `about ${r.ratio}× the wall clock` : ''}
        />
        <Tile
          testid="ai-cost"
          label="Metered cost"
          value={r.meteredTasks ? `$${r.meteredUsd.toFixed(2)}` : 'not metered'}
          sub={
            r.unmeteredTasks
              ? `${r.unmeteredTasks} task${r.unmeteredTasks === 1 ? '' : 's'} with no meter; ${r.sessionTokensObserved.toLocaleString()} session tokens read from the harness counter`
              : `${r.meteredTasks} metered`
          }
        />
      </div>
      <table className="w-full text-left text-[0.75rem]" data-testid="ai-usage-table">
        <thead>
          <tr className="border-b border-[#1A1815]">
            <th scope="col" className="py-1 pr-2">
              Task
            </th>
            <th scope="col" className="py-1 pr-2">
              Record
            </th>
            <th scope="col" className="py-1 pr-2">
              Model
            </th>
            <th scope="col" className="py-1 pr-2">
              Took
            </th>
            <th scope="col" className="py-1 pr-2">
              Without AI (est.)
            </th>
            <th scope="col" className="py-1 pr-2">
              Cost
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-b border-[#E8E4DC] align-top">
              <td className="py-1 pr-2">{e.task}</td>
              <td className="py-1 pr-2" style={MONO}>
                {e.drs.join(' ')}
              </td>
              <td className="py-1 pr-2" style={MONO}>
                {e.model}
              </td>
              <td className="py-1 pr-2">{e.wallClockHours} h</td>
              <td className="py-1 pr-2">{e.estimateWithoutAiHours} h</td>
              <td className="py-1 pr-2">
                {e.tokens === null
                  ? 'not metered'
                  : `$${(e.costUsd || 0).toFixed(2)} (${e.tokens.in.toLocaleString()} in / ${e.tokens.out.toLocaleString()} out)`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
