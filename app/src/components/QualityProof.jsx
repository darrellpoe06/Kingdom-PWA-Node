// =============================================================================
// QualityProof — the proof and the reviews, returned and shown INSIDE the app.
// =============================================================================
// Darrell, 2026-06-16: "proof should show up inside the app somewhere, and our
// app UI/UX reviews -- are they in there?" They weren't (they lived in CI, review
// docs, and the local-LLM output). This closes that loop: QA and reviews report
// their own real results in-app, where the work lives.
//
// TWO sections, all REAL data, nothing painted (Verification Doctrine, DR-0076):
//
//   PROOF
//     - the deterministic / adversarial "break-it" GATES + the closed-loop TESTS
//       (build-time manifest, every row file-verified). A row is green ONLY when
//       the live CI run on the SERVED build SHA passed -- existence is not a pass.
//       A failing CI run turns rows amber and the headline says a check failed
//       (the "loop silently failed" signal).
//     - build-freshness: served SHA vs live main HEAD (green = latest, red = old)
//       and the landed commit SHA, live from the repo.
//     - the measured WCAG 2.1 AA contrast result (numbers from scanContrast).
//
//   UI/UX REVIEWS
//     - the WCAG measurement again as a reviewable record;
//     - the UI/UX & accessibility review registry (docs/reviews/REVIEWS.md);
//     - a pointer to the LIVE local-LLM diff review panel rendered just below
//       (LlmReview) -- referenced, not duplicated.
//
// Governor-gated at the mount (BuildBoard), like the orchestration board: this is
// dev/ops proof, public data but noise for a family user. Reuses KpiDot + the
// shared KPI palette so it can never re-pick colors.
import React, { useCallback, useEffect, useState } from 'react';
import { KpiDot } from './KpiDot.jsx';
import { kpiColor } from '../lib/kpi-status.js';
import SectionTabs from './SectionTabs.jsx';
import { fetchOps, GITHUB_SLUG } from '../lib/github-ops.js';
import {
  normalizeManifest, normalizeReviews, freshnessVerdict, ciVerdict,
  rowStatus, contrastStatus, reviewStatus, reviewFreshness,
} from '../lib/quality-proof.js';
import { normalizeInterconnect, loopRowStatus, interconnectHeadline } from '../lib/interconnect-loops.js';
import { extractReReviews, sortReReviews, reReviewStatus, reReviewSummary } from '../lib/re-reviews.js';

const MANIFEST = normalizeManifest(typeof __QUALITY_PROOF__ !== 'undefined' ? __QUALITY_PROOF__ : null);
const INTERCONNECT = normalizeInterconnect(typeof __INTERCONNECT_LOOPS__ !== 'undefined' ? __INTERCONNECT_LOOPS__ : null);
const REVIEWS = normalizeReviews(typeof __UIUX_REVIEWS__ !== 'undefined' ? __UIUX_REVIEWS__ : null);
// The DR ledger is already injected for the Governor board; re-review dates live
// in both it and the review findings, so the backlog reads from both (raw guard
// pattern — degrade to empty rather than crash if the global is absent).
const DR_LEDGER = (typeof __DR_LEDGER__ !== 'undefined') ? __DR_LEDGER__ : null;
const BUILD_SHA = (typeof __BUILD_SHA__ !== 'undefined') ? __BUILD_SHA__ : 'dev';

// orchestration deliberately carries no emoji: the consistency guard (DR-0079)
// ratchets emoji-as-icon down from the frozen baseline; the existing four are
// grandfathered, new ones fail the build.
const TYPE_LABEL = { accessibility: '♿ Accessibility', 'ui-ux': '🎨 UI/UX', security: '🔒 Security', 'code-review': '🔍 Code review', orchestration: 'Orchestration' };

function Row({ name, detail, status, label }) {
  return (
    <li className="px-2 py-1.5 border-b border-[#F2EEE6] last:border-b-0">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{name}</span>
        <KpiDot status={status} label={label} className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] shrink-0" />
      </div>
      {detail && <p className="text-[0.6875rem] text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{detail}</p>}
    </li>
  );
}

// defaultSection opens a specific sub-tab (tests + future deep links); the
// default stays 'gates' — the first thing a steward checks.
export default function QualityProof({ defaultSection = 'gates' }) {
  const [state, setState] = useState({ phase: 'loading', data: null });
  // Sortable backlog of dated re-review commitments (Darrell 2026-07-06: "keep a
  // sortable list inside the PoeTech App"). Default: date asc = overdue / soonest
  // first — the order you pull work in. Clickable headers flip like Imported.jsx.
  const [rrSort, setRrSort] = useState({ key: 'date', dir: 'asc' });
  const toggleRrSort = (key) => setRrSort((s) => (
    s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
  ));
  const rrArrow = (key) => (rrSort.key === key ? (rrSort.dir === 'asc' ? ' ↑' : ' ↓') : '');

  const load = useCallback(async () => {
    setState((s) => ({ phase: 'loading', data: s.data }));
    const data = await fetchOps();
    setState({ phase: 'ready', data });
  }, []);
  useEffect(() => { load(); }, [load]);

  const mainSha = state.data && state.data.main ? state.data.main.shortSha : null;
  const mainCi = state.data ? state.data.mainCi : null;
  const fresh = freshnessVerdict(BUILD_SHA, mainSha);
  const verdict = ciVerdict(mainCi, BUILD_SHA);
  const contrast = MANIFEST.contrast;
  const cStat = contrastStatus(contrast);

  return (
    <section className="bg-white border-2 border-[#1A1815] p-4">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">✅ Quality / Proof — the loops report on themselves</div>
        <button
          type="button"
          onClick={load}
          disabled={state.phase === 'loading'}
          className="text-[0.625rem] uppercase tracking-wider px-2 py-1 border border-[#1A1815] hover:bg-[#FAF8F4] disabled:opacity-50 min-h-[32px]"
        >
          {state.phase === 'loading' ? 'Reading…' : 'Refresh'}
        </button>
      </div>
      <p className="text-xs text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
        Real verification results, in the app: the checks that gate every merge, the closed loops that must return an outcome, the measured accessibility result, and what the live build actually is. Nothing here is painted — a check is green only with evidence.
      </p>

      {/* Live verdict + freshness + landed SHA — pinned above the sub-tabs: it is
          the context every section below reads against (a gate is only green
          because THIS run passed on THIS build). */}
      <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-2.5 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <KpiDot status={verdict.status} label={verdict.green ? 'CI green' : verdict.status === 'problem' ? 'CI failing' : 'CI unknown'} className="text-[0.625rem] uppercase tracking-wider font-semibold" />
          <span className="text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{verdict.headline}</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap mt-1.5">
          <KpiDot status={fresh.status} label={fresh.label} className="text-[0.625rem] uppercase tracking-wider" />
          {mainSha && (
            <a
              href={`https://github.com/${GITHUB_SLUG}/commit/${mainSha}`}
              target="_blank" rel="noreferrer"
              className="text-[0.625rem] text-[#5A5751] underline decoration-dotted"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >main HEAD {mainSha}</a>
          )}
        </div>
        {state.data && state.data.notice && (
          <p className="text-[0.625rem] text-[#B85838] mt-1">{state.data.notice}</p>
        )}
      </div>

      {/* THIRD-ROW sub-tabs (Darrell 2026-07-05): this panel was still a 25+ row
          scroll after the second row — gates, loops, contrast, interconnect, and
          reviews now each sit one chip away instead of a long read-down. */}
      <SectionTabs
        variant="sub"
        ariaLabel="Quality proof sections"
        idBase="qproof"
        defaultId={defaultSection}
        sections={[
          {
            id: 'gates',
            label: `Break-it gates (${MANIFEST.gates.length})`,
            render: () => (
              <>
                <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">
                  Adversarial "break-it" gates — run on every merge ({MANIFEST.gates.length})
                </div>
                <ul className="border border-[#E8E4DC]">
                  {MANIFEST.gates.map((g) => {
                    const rs = rowStatus(g, verdict);
                    return <Row key={g.id} name={g.name} detail={g.catches} status={rs.status} label={rs.label} />;
                  })}
                  {MANIFEST.gates.length === 0 && <li className="px-2 py-2 text-[0.6875rem] text-[#5A5751] italic">Manifest unavailable — showing nothing rather than guessing.</li>}
                </ul>
              </>
            ),
          },
          {
            id: 'loops',
            label: `Closed loops (${MANIFEST.loops.length})`,
            render: () => (
              <>
                <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">
                  Closed loops — the outcome must return in-app ({MANIFEST.loops.length})
                </div>
                <ul className="border border-[#E8E4DC]">
                  {MANIFEST.loops.map((l) => {
                    const rs = rowStatus(l, verdict);
                    return <Row key={l.id} name={l.name} detail={l.proves} status={rs.status} label={rs.label} />;
                  })}
                  {MANIFEST.loops.length === 0 && <li className="px-2 py-2 text-[0.6875rem] text-[#5A5751] italic">Manifest unavailable.</li>}
                </ul>
              </>
            ),
          },
          {
            id: 'contrast',
            label: 'Accessibility',
            render: () => (
              <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[0.625rem] uppercase tracking-wider text-[#1A1815] font-semibold">Measured: WCAG 2.1 AA contrast</span>
                  <KpiDot status={cStat.status} label={cStat.label} className="text-[0.5625rem] uppercase tracking-wider" />
                </div>
                {contrast.ok ? (
                  contrast.pass ? (
                    <p className="text-[0.6875rem] text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
                      Every theme ({contrast.themes.join(', ')}) meets AA for body text on its surfaces — measured from the real theme CSS, not claimed.
                    </p>
                  ) : (
                    <ul className="mt-1 space-y-0.5">
                      {contrast.violations.map((v, i) => (
                        <li key={i} className="text-[0.6875rem] text-[#DC2626]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                          [{v.theme}] {v.what}: {v.fg} on {v.bg} = {v.ratio || v.error}
                        </li>
                      ))}
                    </ul>
                  )
                ) : (
                  <p className="text-[0.6875rem] text-[#5A5751] mt-1 italic">Contrast not measured in this build.</p>
                )}
              </div>
            ),
          },
          {
            id: 'wiring',
            label: `Interconnect (${INTERCONNECT.loops.length})`,
            render: () => (
              <>
                <p className="text-[0.6875rem] text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
                  {interconnectHeadline(INTERCONNECT.summary)} Each loop names a real source and the destination that reads it; the wiring is file-verified at build. A loop that lost its wiring reads <span className="text-[#DC2626]">went static</span> — it can’t silently go dead.
                </p>
                <ul className="border border-[#E8E4DC]">
                  {INTERCONNECT.loops.map((l) => {
                    const rs = loopRowStatus(l);
                    const detail = l.broken
                      ? `Wiring missing: ${l.missing.join('; ')}`
                      : l.status === 'building'
                        ? (l.awaiting || l.proves)
                        : l.proves;
                    return (
                      <li key={l.id} className="px-2 py-1.5 border-b border-[#F2EEE6] last:border-b-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{l.name}</span>
                          <KpiDot status={rs.status} label={rs.label} className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] shrink-0" />
                        </div>
                        <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mt-0.5" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                          {l.from} → {l.to}
                        </div>
                        {detail && <p className="text-[0.6875rem] text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{detail}</p>}
                      </li>
                    );
                  })}
                  {INTERCONNECT.loops.length === 0 && <li className="px-2 py-2 text-[0.6875rem] text-[#5A5751] italic">Interconnect manifest unavailable — showing nothing rather than guessing.</li>}
                </ul>
              </>
            ),
          },
          {
            id: 'reviews',
            label: 'Reviews',
            render: () => {
              // Measured at render, never at build: the registry's own
              // freshness (DR-0102). Past 7 days the chip goes attention --
              // the registry says "stale" about itself instead of aging
              // silently.
              const fresh = reviewFreshness(REVIEWS, Date.now());
              return (
              <>
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5 px-2 py-1.5 border border-[#E8E4DC]">
                  <span className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Review freshness</span>
                  <KpiDot status={fresh.status} label={fresh.ok ? `${fresh.label} · last ${fresh.lastDate}` : fresh.label} className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] shrink-0" />
                </div>
                {REVIEWS.ok ? (
                  <ul className="border border-[#E8E4DC] mb-2">
                    {REVIEWS.items.map((r) => {
                      const rs = reviewStatus(r.status);
                      return (
                        <li key={r.id} className="px-2 py-2 border-b border-[#F2EEE6] last:border-b-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{r.title}</span>
                            <KpiDot status={rs.status} label={rs.label} className="text-[0.5625rem] uppercase tracking-wider shrink-0" />
                          </div>
                          <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mt-0.5" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                            {r.date} · {r.surface}{r.type ? ` · ${TYPE_LABEL[r.type] || r.type}` : ''}
                          </div>
                          {r.findings && <p className="text-[0.6875rem] text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{r.findings}</p>}
                          {r.source && <div className="text-[0.5625rem] text-[#5A5751] mt-1" style={{ fontFamily: '"JetBrains Mono", monospace' }}>source: {r.source}</div>}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-[0.6875rem] text-[#5A5751] italic mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
                    No structured review records yet — add them to <span className="font-mono">docs/reviews/REVIEWS.md</span> and they appear here.
                  </p>
                )}
                <p className="text-[0.6875rem] text-[#5A5751] mb-1" style={{ fontFamily: '"Fraunces", serif' }}>
                  <span aria-hidden="true" className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: kpiColor('idle') }} />
                  The live local-LLM diff review of the latest change is in the “🔍 Local-LLM code review” panel below — a second pair of eyes, advisory, never a gate.
                </p>
              </>
              );
            },
          },
          {
            id: 'rereviews',
            label: 'Re-reviews',
            render: () => {
              // The sortable backlog: every dated `re-review:` commitment pulled
              // from the review findings + the DR ledger (DR-0075). Real dates
              // only — nothing painted (DR-0076). Measured against now at render.
              const now = Date.now();
              const all = extractReReviews({ reviews: REVIEWS, decisions: DR_LEDGER }, now);
              const rows = sortReReviews(all, rrSort.key, rrSort.dir);
              const sum = reReviewSummary(all);
              const Th = ({ k, children, right }) => (
                <th className={`px-2 py-1 ${right ? 'text-right' : 'text-left'}`}>
                  <button type="button" onClick={() => toggleRrSort(k)} className="uppercase tracking-wider hover:text-[#B85838]">
                    {children}{rrArrow(k)}
                  </button>
                </th>
              );
              return (
                <>
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5 px-2 py-1.5 border border-[#E8E4DC]">
                    <span className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>
                      Re-review backlog
                    </span>
                    <KpiDot
                      status={sum.overdue > 0 ? 'problem' : sum.soon > 0 ? 'attention' : 'good'}
                      label={sum.overdue > 0 ? `${sum.overdue} overdue · ${sum.total} total` : sum.soon > 0 ? `${sum.soon} due soon · ${sum.total} total` : `${sum.total} scheduled`}
                      className="text-[0.5625rem] uppercase tracking-wider shrink-0"
                    />
                  </div>
                  {rows.length > 0 ? (
                    <div className="border border-[#E8E4DC] overflow-x-auto mb-2">
                      <table className="w-full text-[0.6875rem]" style={{ fontFamily: '"Fraunces", serif' }}>
                        <thead className="text-[0.5625rem] text-[#5A5751] border-b border-[#E8E4DC]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                          <tr>
                            <Th k="date">Due</Th>
                            <Th k="title">Item</Th>
                            <Th k="type">Type</Th>
                            <Th k="source">Source</Th>
                            <Th k="status" right>Status</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((it, i) => {
                            const rs = reReviewStatus(it);
                            return (
                              <tr key={`${it.origin}-${it.sourceId}-${it.date}-${i}`} className="border-b border-[#F2EEE6] last:border-b-0 align-top">
                                <td className="px-2 py-1.5 whitespace-nowrap" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{it.date}</td>
                                <td className="px-2 py-1.5 text-[#1A1815]">{it.title}</td>
                                <td className="px-2 py-1.5 text-[#5A5751]">{TYPE_LABEL[it.type] || it.type}</td>
                                <td className="px-2 py-1.5 text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{it.source}</td>
                                <td className="px-2 py-1.5 text-right">
                                  <KpiDot status={rs.status} label={rs.label} className="text-[0.5625rem] uppercase tracking-wider justify-end" />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-[0.6875rem] text-[#5A5751] italic mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
                      No dated re-review commitments yet — add a <span className="font-mono">re-review: YYYY-MM-DD</span> to a review finding or decision and it appears here, sortable.
                    </p>
                  )}
                  <p className="text-[0.5625rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
                    Every dated commitment we make (DR-0075) — pulled live from the review findings + the decision ledger, sortable by due date, type, source, or urgency. This is the list work is pulled from.
                  </p>
                </>
              );
            },
          },
        ]}
      />

      <p className="text-[0.5625rem] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
        Gates + loops are file-verified at build; pass/fail is the live CI run on the served build (from <span className="font-mono">github.com/{GITHUB_SLUG}</span>); contrast is measured from the theme CSS. A green here means evidence, not a claim.
      </p>
    </section>
  );
}
