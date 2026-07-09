// =============================================================================
// OpsBoard — the orchestration loop, returned and shown INSIDE the app.
// =============================================================================
// Darrell, 2026-06-16: "inside the poetech app as well — actual proof inside the
// app, all loops return and inform inside." This renders the REAL state of the
// branch/merge orchestration from GitHub (lib/github-ops.js): what merged into
// main + its SHA, which PRs are in flight, which lane each is in (PARALLEL-SAFE
// vs MUST-SERIALIZE), whether auto-merge is armed or the PR is `hold`, and the
// trunk's CI health. No mock data — when the live read fails it says so.
//
// Reads the PUBLIC repo's API unauthenticated (no token in the client), on
// mount + manual refresh only (60/hr budget). Matches the WorkflowStatus /
// LlmHealth live-status pattern and the shared KpiDot palette.
import React, { useEffect, useState, useCallback } from 'react';
import { KpiDot } from './KpiDot.jsx';
import { fetchOps, landOrder, GITHUB_SLUG } from '../lib/github-ops.js';
import { fetchSiteHealth } from '../lib/site-health.js';

function laneBadge(lane) {
  if (lane === 'parallel-safe') return { status: 'good', label: 'parallel-safe' };
  if (lane === 'must-serialize') return { status: 'attention', label: 'must-serialize' };
  return { status: 'idle', label: 'lane unknown' };
}

function prKpi(p) {
  if (p.hold) return { status: 'idle', label: 'hold (parked)' };
  if (p.draft) return { status: 'idle', label: 'draft' };
  if (p.autoMerge) return { status: 'good', label: 'auto-merge armed' };
  return { status: 'attention', label: 'open — no auto-merge' };
}

// The uptime verdict, from the outside-in probe's real runs (DR-0125). Deploy
// green is NOT site-up (2026-07-08; LESSONS P26) — this is the site's own line.
function UptimeStrip({ health }) {
  if (!health) return null;
  if (!health.ok) {
    return (
      <p className="text-[0.625rem] text-[#5A5751] mb-2">
        Uptime record unreadable right now — {health.notice}
      </p>
    );
  }
  const { probe, incidents, freshness: fr } = health;
  const openIncident = incidents.find((i) => i.state === 'open');
  const up = openIncident ? false : (probe.latest ? probe.latest.verdict === 'up' : null);
  const kpi = up === null
    ? { status: 'idle', label: 'not yet measured' }
    : up
      ? { status: 'good', label: 'site up (probed from outside)' }
      : { status: 'problem', label: 'site failing the probe' };
  return (
    <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-2 mb-3 text-[0.6875rem]">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-semibold text-[#1A1815]">poetech.us — live site</span>
        <span className="flex items-center gap-2">
          <KpiDot status={kpi.status} label={kpi.label} />
          {fr && fr.known && (
            <KpiDot
              status={fr.fresh ? 'good' : 'attention'}
              label={fr.fresh ? `serving main (${fr.deployedSha})` : `stale: serving ${fr.deployedSha}, main is ${fr.mainSha}`}
            />
          )}
        </span>
      </div>
      <p className="text-[0.625rem] text-[#5A5751] mt-1">
        {probe.measured
          ? <>Today: {probe.checksToday} outside-in checks, {probe.downToday} failing.{' '}</>
          : <>The probe has not completed a run yet — the record starts measuring on its first fire.{' '}</>}
        {openIncident ? (
          <a href={openIncident.url} target="_blank" rel="noreferrer" className="underline decoration-dotted font-semibold">
            Open incident #{openIncident.number} ({openIncident.observations} observations)
          </a>
        ) : (
          incidents.length > 0
            ? <>Downtime ledger: {incidents.length} recorded incident{incidents.length === 1 ? '' : 's'}, none open.</>
            : <>No recorded incidents yet.</>
        )}
      </p>
    </div>
  );
}

export default function OpsBoard() {
  const [state, setState] = useState({ phase: 'loading', data: null });
  const [health, setHealth] = useState(null);

  const load = useCallback(async () => {
    setState((s) => ({ phase: 'loading', data: s.data }));
    const [data, sh] = await Promise.all([
      fetchOps(),
      fetchSiteHealth().catch(() => null),
    ]);
    setState({ phase: 'ready', data });
    setHealth(sh);
  }, []);

  useEffect(() => { load(); }, [load]);

  const data = state.data;
  const ordered = data && data.pulls ? landOrder(data.pulls) : [];

  return (
    <section className="bg-white border border-[#5A6E3D] p-3 mt-4">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
        <h3 className="text-sm font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>
          🛰️ Orchestration — live from the repo
        </h3>
        <div className="flex items-center gap-2">
          {data && data.mainCi && <KpiDot status={data.mainCi.status} label={data.mainCi.label} />}
          <button
            type="button"
            onClick={load}
            disabled={state.phase === 'loading'}
            className="text-[0.625rem] uppercase tracking-wider px-2 py-1 border border-[#1A1815] hover:bg-[#FAF8F4] disabled:opacity-50"
          >
            {state.phase === 'loading' ? 'Reading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* The model, documented beside its live proof (DR-0103 / DR-0065). This
          is static-by-design operating documentation; the state BELOW it is the
          live proof it's true. */}
      <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-2 mb-3 text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
        <span className="font-semibold text-[#1A1815]">The delivery lane.</span>{' '}
        Work lands on green without a manual merge: an agent (<span className="font-mono">claude/*</span>)
        or release-lane branch opens a PR and auto-merges the instant the gates pass
        (lint · full test suite · tenancy/contrast/isolation guards · real build) — merge = deploy.
        The gate is the brake; the <span className="font-semibold">hold</span> label is the
        governor's hand to park a PR for a soak or review. Cadence is minutes, not a reflexive hour.
        <span className="block mt-1 text-[0.625rem]">
          Governed by{' '}
          <a
            href={`https://github.com/${GITHUB_SLUG}/blob/main/docs/decisions/DR-0103-streamlined-delivery-loop-agent-prs-auto-merge-on-green.md`}
            target="_blank" rel="noreferrer"
            className="font-mono underline decoration-dotted"
          >DR-0103</a>. The live lane below is the proof.
        </span>
      </div>

      {/* The site's own line — up + fresh, measured from outside (DR-0125). */}
      <UptimeStrip health={health} />

      {state.phase === 'loading' && !data && (
        <p className="text-xs text-[#5A5751]">Reading live state from GitHub…</p>
      )}

      {data && (
        <>
          {/* What main actually is right now — the real merged SHA. */}
          {data.main ? (
            <p className="text-xs text-[#1A1815] mb-2">
              <span className="text-[#5A5751]">main HEAD</span>{' '}
              <a
                href={`https://github.com/${GITHUB_SLUG}/commit/${data.main.sha}`}
                target="_blank" rel="noreferrer"
                className="font-mono font-semibold underline decoration-dotted"
              >{data.main.shortSha}</a>{' '}
              — {data.main.title}
            </p>
          ) : null}

          {/* In-flight PRs, in suggested land order. */}
          {ordered.length > 0 ? (
            <div className="mb-2">
              <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">
                In flight — suggested land order ({ordered.length})
              </div>
              <ul className="space-y-1">
                {ordered.map((p) => {
                  const lb = laneBadge(p.lane);
                  const k = prKpi(p);
                  return (
                    <li key={p.number} className="text-xs border-b border-[#E8E4DC] pb-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <a
                          href={`https://github.com/${GITHUB_SLUG}/pull/${p.number}`}
                          target="_blank" rel="noreferrer"
                          className="font-semibold underline decoration-dotted"
                        >#{p.number}</a>
                        <span className="flex items-center gap-2">
                          <KpiDot status={lb.status} label={lb.label} />
                          <KpiDot status={k.status} label={k.label} />
                        </span>
                      </div>
                      <div className="text-[#5A5751]">
                        <span className="font-mono">{p.branch}</span> — {p.title}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {/* Held PRs are deliberately parked out of the lane. */}
              {data.pulls.filter((p) => p.hold).length > 0 && (
                <p className="text-[0.625rem] text-[#5A5751] mt-1">
                  Parked (<span className="font-semibold">hold</span>):{' '}
                  {data.pulls.filter((p) => p.hold).map((p) => `#${p.number}`).join(', ')} — awaiting review, won't auto-merge.
                </p>
              )}
            </div>
          ) : (
            data.ok && <p className="text-xs text-[#5A5751] mb-2">No PRs in flight — main is the latest.</p>
          )}

          {/* Recently merged into main, with real SHAs. */}
          {data.recentMerges && data.recentMerges.length > 0 && (
            <div className="mb-1">
              <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Recently landed</div>
              <ul className="space-y-0.5">
                {data.recentMerges.slice(0, 6).map((c) => (
                  <li key={c.sha} className="text-xs text-[#5A5751]">
                    <a
                      href={`https://github.com/${GITHUB_SLUG}/commit/${c.sha}`}
                      target="_blank" rel="noreferrer"
                      className="font-mono underline decoration-dotted"
                    >{c.shortSha}</a>{' '}
                    {c.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.notice && (
            <p className="text-[0.625rem] text-[#B85838] mt-1">{data.notice}</p>
          )}
          <p className="text-[0.5625rem] text-[#5A5751] mt-2">
            Live from <span className="font-mono">github.com/{GITHUB_SLUG}</span> · public repo, read-only, no token in the app.
          </p>
        </>
      )}
    </section>
  );
}
