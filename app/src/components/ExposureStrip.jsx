// =============================================================================
// ExposureStrip — what an attacker would actually use, ranked, on the board
// (DR-1408)
// =============================================================================
// The conditions, before any fix: .github/workflows/exposure-report.yml ranks
// every known vulnerability in what we ship by the four elements (threat
// intelligence, asset context, exploitability, control validation) and this
// strip reads that report live (lib/exposure-report.js). It changes nothing;
// mobilizing a fix is a separate step through the normal lane. Act now and
// Plan are listed with all four elements; Watch is counted.
// =============================================================================
import React, { useEffect, useState } from 'react';
import { KpiDot } from './KpiDot.jsx';
import { fetchExposureReport, TIER_LABEL } from '../lib/exposure-report.js';

const DOT = { ok: 'good', warn: 'attention', bad: 'problem', unknown: 'idle' };

export default function ExposureStrip({ load = fetchExposureReport }) {
  const [exp, setExp] = useState(null);
  useEffect(() => {
    let live = true;
    Promise.resolve(load())
      .then((r) => {
        if (live) setExp(r);
      })
      .catch(() => {
        if (live) setExp({ ok: false, verdict: { tone: 'unknown', line: 'the exposure report could not be read' } });
      });
    return () => {
      live = false;
    };
  }, [load]);
  if (!exp) return null;
  const v = exp.verdict || { tone: 'unknown', line: 'no verdict' };
  const report = exp.parsed && exp.parsed.ok ? exp.parsed.report : null;
  const shown = report ? report.items.filter((i) => i.tier !== 'watch') : [];
  return (
    <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-2 mb-3 text-[0.6875rem]" data-testid="exposure-strip" data-tone={v.tone}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-semibold text-[#1A1815]">Exposure — what an attacker would use, ranked before any fix</span>
        <KpiDot status={DOT[v.tone] || 'idle'} label={v.line} />
      </div>
      <p className="text-[0.625rem] text-[#5A5751] mt-1">
        Report only: this check changes nothing. {report ? `Read ${String(report.readAt).slice(0, 10)}.` : exp.notice || ''}{' '}
        {exp.reportUrl && (
          <a href={exp.reportUrl} target="_blank" rel="noopener noreferrer" className="underline">
            The full report
          </a>
        )}
      </p>
      {shown.length > 0 && (
        <ul className="mt-1 space-y-1" data-testid="exposure-items">
          {shown.map((i) => (
            <li key={i.name} data-testid="exposure-item" data-tier={i.tier}>
              <span className="font-semibold">
                {TIER_LABEL[i.tier] || i.tier}: {i.name}
              </span>{' '}
              <span className="text-[#5A5751]">
                ({i.scope === 'prod' ? 'ships' : 'build tool'}, {i.severity})
              </span>
              <span className="block text-[0.625rem] text-[#5A5751]">
                Threat: {i.elements.threat}. Reach: {i.elements.exploit}. Holds it: {i.elements.control}.
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
