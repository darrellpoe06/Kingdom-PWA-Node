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

export default function OpsBoard() {
  const [state, setState] = useState({ phase: 'loading', data: null });

  const load = useCallback(async () => {
    setState((s) => ({ phase: 'loading', data: s.data }));
    const data = await fetchOps();
    setState({ phase: 'ready', data });
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
            className="text-[10px] uppercase tracking-wider px-2 py-1 border border-[#1A1815] hover:bg-[#FAF8F4] disabled:opacity-50"
          >
            {state.phase === 'loading' ? 'Reading…' : 'Refresh'}
          </button>
        </div>
      </div>

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
              <div className="text-[9px] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">
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
                <p className="text-[10px] text-[#5A5751] mt-1">
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
              <div className="text-[9px] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Recently landed</div>
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
            <p className="text-[10px] text-[#B85838] mt-1">{data.notice}</p>
          )}
          <p className="text-[9px] text-[#5A5751] mt-2">
            Live from <span className="font-mono">github.com/{GITHUB_SLUG}</span> · public repo, read-only, no token in the app.
          </p>
        </>
      )}
    </section>
  );
}
