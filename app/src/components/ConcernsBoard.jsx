// =============================================================================
// ConcernsBoard — Concerns & Solutions, in the open
// =============================================================================
// BuildBoard's sibling. BuildBoard shows what we're building; this shows what's
// wrong or worried-about and what we're doing about it — each row a real,
// dated CONCERN paired with the SOLUTION we intend, a TARGET DATE we hold
// ourselves to, and an honest STATUS (open / in-progress / done).
//
// TWO FEEDS compose here (see lib/concerns.js):
//   1. AUTO — every submitted feedback row renders as a concern automatically
//      (read-through, with its screenshot thumbnail), so the feedback loop
//      returns IN-APP without anyone routing it by hand.
//   2. CURATED — the dated seed baseline + DB-backed concerns the family /
//      Governor add, edit, re-date, and re-status (synced via concerns-sync).
//
// Consistency: full-width (space-y-4), themeable status classes (no inline
// color on the rendered chip — the per-[data-theme] contrast remap applies),
// SVG-free glyphs reused from BuildBoard, 36px tap targets, focus rings.
// =============================================================================
import React, { useState, useMemo } from 'react';
import {
  CONCERN_STATUS, CONCERN_STATUS_ORDER, statusMeta,
  daysLate, orderConcerns, composeConcerns,
} from '../lib/concerns.js';
import { deriveDataConcerns } from '../lib/derive-concerns.js';
import { rankConcerns, signalSummary, signalReason, concernSeverity } from '../lib/concern-signals.js';

// Auto-triage severity chip styling — reuses the board's themeable palette (no
// new color, so the per-theme contrast guard keeps holding). Critical is a
// filled chip so the worst feedback is unmistakable at a glance.
const SEV_STYLE = {
  critical: 'bg-[#B85838] text-white',
  high:     'text-[#B85838] border border-[#B85838]',
  normal:   'text-[#2A5A8E] border border-[#2A5A8E]',
  low:      'text-[#5A6E3D] border border-[#5A6E3D]',
  noise:    'text-[#5A5751] border border-[#5A5751]',
};

function SeverityBadge({ evaluation }) {
  if (!evaluation) return null;
  const cls = SEV_STYLE[evaluation.severity] || SEV_STYLE.normal;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 text-[0.5625rem] uppercase tracking-wider ${cls}`}
      title={`Auto-triaged: ${evaluation.categoryLabel} · ${evaluation.severityLabel}`}>
      {evaluation.severityLabel} · {evaluation.categoryLabel}
    </span>
  );
}

// One row. Curated rows (not read-only) expand to a manage panel for the
// family/Governor; feedback rows are read-through with a thumbnail.
function ConcernRow({ c, isLast, canEdit, onUpdate, onDelete, showDecisionLink = false }) {
  const [open, setOpen] = useState(false);
  const sm = statusMeta(c.status);
  const late = daysLate(c);
  const editable = canEdit && !c.readOnly;
  // A resolved concern IS a decision (deriveAppDecisions turns every 'done'
  // concern into a resolution record whose rationale is its solution) — surface
  // the closed loop so a steward can see the concern → decision link in one place.
  const recordedAsDecision = showDecisionLink && c.status === 'done' && !!c.solution;

  return (
    <div className={isLast ? '' : 'border-b border-[#E8E4DC]'}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? `Hide details for: ${c.concern}` : `Show details for: ${c.concern}`}
        className="w-full text-left p-3 hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]"
      >
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <span className="flex-1 min-w-0" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{c.concern}</span>
          <span className="text-[10px] uppercase tracking-wider flex items-center gap-2 flex-wrap shrink-0" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
            <span className={`inline-flex items-center gap-1 ${sm.text}`}>
              <span aria-hidden="true">{sm.symbol}</span>{sm.label}
            </span>
            <span className="text-[#5A5751]">
              {c.status === 'done'
                ? (c.targetDate ? `done ${c.targetDate}` : 'done')
                : (c.targetDate ? `target ${c.targetDate}` : (c.whenNote ? c.whenNote : 'no date'))}
            </span>
            {late > 0 && <span className="font-semibold text-[#B85838]">⚠ {late} {late === 1 ? 'day' : 'days'} late</span>}
            {c.source === 'feedback' && <span className="text-[#7A5A8E]">↩ feedback</span>}
            {(c.source === 'coverage' || c.source === 'reconciliation') && (
              <span className="text-[#5A6E3D] uppercase" title={c.detectedBy ? `Auto-detected by ${c.detectedBy}` : 'Auto-detected by a process'}>process-found</span>
            )}
            {c.severity && !c.evaluation && (
              <span className={`inline-flex items-center px-1.5 py-0.5 text-[0.5625rem] uppercase tracking-wider ${SEV_STYLE[c.severity] || SEV_STYLE.normal}`}>{c.severity}</span>
            )}
            {c.evaluation && <SeverityBadge evaluation={c.evaluation} />}
          </span>
        </div>
        <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mt-0.5" aria-hidden="true">
          {open ? '▲ hide' : '▼ details'}{c.area ? ` · ${c.area}` : ''}
        </div>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2">
          {/* Read-through feedback thumbnail */}
          {c.thumbnail && (
            <img
              src={c.thumbnail}
              alt={`Screenshot submitted with this feedback${c.screenshotCount > 1 ? ` (1 of ${c.screenshotCount})` : ''}`}
              className="max-h-40 border border-[#E8E4DC]"
              loading="lazy"
            />
          )}
          {/* Auto-triage — every feedback item is evaluated on arrival (category,
              severity, routed area, a concrete next step) so it lands actionable
              instead of "awaiting evaluation". The human solution is set below. */}
          {c.evaluation && (
            <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-2 space-y-1">
              <p className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold">
                Auto-triage: <span className="text-[#1A1815]">{c.evaluation.categoryLabel}</span> · {c.evaluation.severityLabel} · routes to {c.evaluation.routeArea}
              </p>
              <p className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                <span className="text-[#5A6E3D] font-semibold uppercase tracking-wider text-[0.625rem] mr-1">Suggested next step</span>{c.evaluation.suggestedAction}
              </p>
            </div>
          )}
          {/* Solution */}
          {c.solution
            ? <p className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}><span className="text-[#5A6E3D] font-semibold uppercase tracking-wider text-[10px] mr-1">Solution</span>{c.solution}</p>
            : <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>{c.source === 'feedback' ? 'Auto-triaged above. A human solution/target hasn’t been set yet.' : 'No solution captured yet.'}</p>}
          {c.whenNote && c.status !== 'done' && !c.targetDate && (
            <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>When: {c.whenNote}</p>
          )}
          {recordedAsDecision && (
            <p className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              Recorded in Decisions — its resolution is the rationale
            </p>
          )}
          {(c.author || c.deviceLabel) && (
            <p className="text-[10px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              {c.author ? `from ${c.author}` : ''}{c.deviceLabel ? ` · ${c.deviceLabel}` : ''}{c.created ? ` · ${c.created}` : ''}
            </p>
          )}

          {editable && (
            <div className="pt-2 border-t border-[#E8E4DC] space-y-2">
              {/* Status */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-[#5A5751] font-semibold mr-1">Status</span>
                {CONCERN_STATUS_ORDER.map((k) => {
                  const st = CONCERN_STATUS[k];
                  const active = c.status === k;
                  return (
                    <button key={k} type="button" aria-pressed={active}
                      onClick={() => onUpdate(c.id, { status: k })}
                      className={`text-[10px] uppercase tracking-wider px-2.5 py-1.5 border min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838] ${st.border} ${active ? `${st.bg} text-white` : st.text}`}>
                      <span aria-hidden="true" className="mr-1">{st.symbol}</span>{st.label}
                    </button>
                  );
                })}
              </div>
              {/* Target date + solution edit */}
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-[10px] uppercase tracking-wider text-[#5A5751] font-semibold">Target
                  <input type="date" value={c.targetDate || ''}
                    onChange={(e) => onUpdate(c.id, { targetDate: e.target.value || null })}
                    aria-label={`Target date for: ${c.concern}`}
                    className="ml-2 p-1.5 border border-[#E8E4DC] text-xs bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" />
                </label>
              </div>
              <textarea defaultValue={c.solution || ''}
                onBlur={(e) => { const v = e.target.value.trim(); if (v !== (c.solution || '')) onUpdate(c.id, { solution: v || null }); }}
                placeholder="The solution we intend (saved when you tap away)"
                aria-label={`Solution for: ${c.concern}`} rows={2}
                className="w-full p-1.5 border border-[#E8E4DC] text-xs bg-white focus:outline focus:outline-2 focus:outline-[#5A6E3D]" style={{ fontFamily: '"Fraunces", serif' }} />
              {onDelete && c.source !== 'seed' && (
                <button type="button" onClick={() => { if (confirm('Delete this concern? It is removed for everyone.')) onDelete(c.id); }}
                  className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] border border-[#E8E4DC] hover:border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">
                  Delete
                </button>
              )}
              {c.source === 'seed' && (
                <p className="text-[9px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
                  Baseline concern (defined in code, like the Build board roadmap). Status / date / solution edits sync; it can’t be deleted.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ConcernsBoard({ concerns = [], feedback = [], transactions = [], rentals = [], debts = [], addConcern = null, updateConcern = null, deleteConcern = null, isGovernor = false, currentUserId = null }) {
  const [tab, setTab] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ concern: '', solution: '', targetDate: '', status: 'open', area: '' });
  const [err, setErr] = useState('');

  const canEdit = !!(isGovernor || currentUserId);

  // The app's own processes flag real-data gaps (coverage / reconciliation /
  // shape) deterministically from the live ledger, portfolio, and debts — so a
  // concern like a thin-import month or a collapsed multi-unit door appears the
  // moment the process finds it, with no one naming it (lib/derive-concerns.js).
  const derived = useMemo(() => deriveDataConcerns({ transactions, rentals, debts }), [transactions, rentals, debts]);

  // The full board list: curated (DB concerns supersede same-id seeds) + the
  // dated baseline + feedback read-through + the process-derived cards.
  const all = useMemo(() => composeConcerns({ dbConcerns: concerns, feedback, derived }), [concerns, feedback, derived]);

  // Self-organizing: rank every signal worst-first so the few that need a human
  // NOW lead, and the rest stay one tap away — no death-scroll (lib/concern-signals).
  const summary = useMemo(() => signalSummary(all), [all]);
  const topSignals = useMemo(() => rankConcerns(all, { limit: 5 }), [all]);

  // Past Due — anything past its committed target but unresolved. Leads the
  // tabs when something slipped, so a missed date is the first thing seen.
  const overdue = useMemo(() => all.filter((c) => daysLate(c) > 0).sort((a, b) => daysLate(b) - daysLate(a)), [all]);

  const counts = useMemo(() => {
    const c = Object.fromEntries(CONCERN_STATUS_ORDER.map((k) => [k, all.filter((x) => x.status === k).length]));
    c.overdue = overdue.length;
    return c;
  }, [all, overdue]);

  const TABS = overdue.length ? ['overdue', ...CONCERN_STATUS_ORDER] : CONCERN_STATUS_ORDER;
  const firstTab = overdue.length ? 'overdue' : (CONCERN_STATUS_ORDER.find((k) => counts[k] > 0) || 'open');
  const activeTab = tab || firstTab;

  const OVERDUE = { label: 'Past Due', color: '#B85838', text: 'text-[#B85838]', bg: 'bg-[#B85838]', border: 'border-[#B85838]', symbol: '⚠', blurb: 'Past target, still unresolved' };
  const meta = (k) => (k === 'overdue' ? OVERDUE : CONCERN_STATUS[k]);
  const s = meta(activeTab);
  const items = activeTab === 'overdue'
    ? overdue
    : orderConcerns(all.filter((c) => c.status === activeTab), activeTab === 'done' ? 'desc' : 'asc');

  const submitAdd = () => {
    if (!draft.concern.trim()) { setErr('Describe the concern first.'); return; }
    setErr('');
    if (addConcern) {
      addConcern({
        concern: draft.concern.trim(),
        solution: draft.solution.trim() || null,
        targetDate: draft.targetDate || null,
        status: draft.status,
        area: draft.area.trim() || null,
        source: 'manual',
      });
    }
    setDraft({ concern: '', solution: '', targetDate: '', status: 'open', area: '' });
    setShowAdd(false);
  };

  const openCount = counts.open + counts['in-progress'];

  return (
    <div className="space-y-4">
      <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">⚠ Concerns &amp; Solutions</div>
        <p className="text-sm mt-1 text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
          Every concern, in the open — paired with the solution we intend, a target date we hold ourselves to, and an honest status. Your feedback shows up here automatically, and the app&apos;s own checks (a thin-import month, a collapsed multi-unit door, a mislabeled debt) file themselves here the moment a process finds them — so nothing gets lost, and no one has to type it.
        </p>
        <div className="text-[10px] uppercase tracking-wider font-semibold mt-2">
          <span className="text-[#2A5A8E]">○ {counts.open} open</span>
          <span className="text-[#B85838]"> · ◐ {counts['in-progress']} in progress</span>
          <span className="text-[#5A6E3D]"> · ✓ {counts.done} done</span>
          {counts.overdue > 0 && <span className="text-[#B85838]"> · ⚠ {counts.overdue} past target</span>}
        </div>
        <div className="text-[10px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
          Auto-fed: your submitted feedback + the app&apos;s own process checks (marked &ldquo;process-found&rdquo;) — both read-through, no typing. Plus the dated concerns the family curates. {openCount} still need attention.
        </div>
        {canEdit && addConcern && (
          <button type="button" onClick={() => { setShowAdd(!showAdd); setErr(''); }}
            className="mt-2 inline-flex items-center text-[10px] uppercase tracking-wider text-[#B85838] hover:text-white hover:bg-[#B85838] border border-[#B85838] px-2.5 py-1 min-h-[32px] focus:outline focus:outline-2 focus:outline-[#B85838]">
            {showAdd ? '× Cancel' : '+ Add a concern'}
          </button>
        )}
        {showAdd && canEdit && addConcern && (
          <div className="mt-2 bg-[#FAF8F4] border border-[#B85838] p-3 space-y-1.5">
            <input value={draft.concern} onChange={(e) => setDraft({ ...draft, concern: e.target.value })}
              placeholder="The concern — state it plainly" aria-label="Concern"
              className="w-full p-1.5 border border-[#E8E4DC] text-xs bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" />
            <textarea value={draft.solution} onChange={(e) => setDraft({ ...draft, solution: e.target.value })}
              placeholder="The solution we intend (optional)" aria-label="Solution" rows={2}
              className="w-full p-1.5 border border-[#E8E4DC] text-xs bg-white focus:outline focus:outline-2 focus:outline-[#5A6E3D]" />
            <div className="grid grid-cols-2 gap-1.5">
              <label className="text-[10px] uppercase tracking-wider text-[#5A5751]">Target date
                <input type="date" value={draft.targetDate} onChange={(e) => setDraft({ ...draft, targetDate: e.target.value })}
                  aria-label="Target date"
                  className="w-full mt-0.5 p-1.5 border border-[#E8E4DC] text-xs bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" />
              </label>
              <label className="text-[10px] uppercase tracking-wider text-[#5A5751]">Status
                <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                  aria-label="Status"
                  className="w-full mt-0.5 p-1.5 border border-[#E8E4DC] text-xs bg-white focus:outline focus:outline-2 focus:outline-[#B85838]">
                  {CONCERN_STATUS_ORDER.map((k) => <option key={k} value={k}>{CONCERN_STATUS[k].label}</option>)}
                </select>
              </label>
            </div>
            <input value={draft.area} onChange={(e) => setDraft({ ...draft, area: e.target.value })}
              placeholder="Area (optional — e.g. Finance, Church, PWA)" aria-label="Area"
              className="w-full p-1.5 border border-[#E8E4DC] text-xs bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" />
            {err && <p className="text-[10px] text-[#B85838]" role="alert">{err}</p>}
            <button type="button" onClick={submitAdd}
              className="w-full bg-[#1A1815] text-white py-1.5 text-[10px] uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">
              Save concern
            </button>
          </div>
        )}
      </section>

      {/* Needs attention now — the self-organizing lead. The board ranks every
          signal (overdue, then severity, then how open) so a human sees the few
          that matter first instead of scrolling the whole list. Each row jumps to
          its status tab. Hidden when nothing is active (an empty board is calm). */}
      {topSignals.length > 0 && (
        <section className="bg-white border border-[#B85838] p-3 sm:p-4">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Needs attention now</div>
            <div className="text-[0.625rem] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{summary.needsAttention} flagged · {summary.total} signals</div>
          </div>
          <p className="text-[0.625rem] text-[#5A5751] italic mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
            Ranked worst-first — overdue, then severity — so the few that matter lead, not a scroll.
          </p>
          <ul className="mt-2 border-t border-[#E8E4DC]">
            {topSignals.map((c) => {
              const sev = concernSeverity(c);
              const sm = statusMeta(c.status);
              return (
                <li key={c.id} className="border-b border-[#E8E4DC]">
                  <button
                    type="button"
                    onClick={() => setTab(c.status)}
                    aria-label={`${c.concern} — ${signalReason(c)}. Jump to ${sm.label}.`}
                    className="w-full text-left py-2 flex items-baseline gap-2 hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]"
                  >
                    <span className={`inline-flex items-center px-1.5 py-0.5 text-[0.5625rem] uppercase tracking-wider shrink-0 ${SEV_STYLE[sev] || SEV_STYLE.normal}`}>{sev}</span>
                    <span className="flex-1 min-w-0 text-xs text-[#1A1815] truncate" style={{ fontFamily: '"Fraunces", serif' }}>{c.concern}</span>
                    <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] shrink-0" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{signalReason(c)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mt-2" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
            {summary.feedback} feedback · {summary.process} process · {summary.audit} audit · {summary.curated} curated
          </div>
        </section>
      )}

      {/* Status sub-tabs — Past Due leads when anything slipped */}
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Concern status">
        {TABS.map((k) => {
          if (k !== 'overdue' && !counts[k]) return null;
          const st = meta(k);
          const active = activeTab === k;
          return (
            <button key={k} type="button" role="tab" aria-selected={active}
              onClick={() => setTab(k)}
              className={`text-xs uppercase tracking-wider px-3 py-1.5 border min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838] ${st.border} ${active ? `${st.bg} text-white` : st.text}`}>
              <span aria-hidden="true" className="mr-1">{st.symbol}</span>{st.label} ({k === 'overdue' ? counts.overdue : counts[k]})
            </button>
          );
        })}
      </div>

      <section>
        <h3 className={`text-[10px] uppercase tracking-[0.25em] font-semibold mb-2 ${s.text}`}>
          <span aria-hidden="true" className="mr-1">{s.symbol}</span>{s.label} · {s.blurb} ({items.length})
        </h3>
        {items.length === 0 ? (
          <div className="bg-white border border-[#1A1815] p-4">
            <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>Nothing here right now.</p>
          </div>
        ) : (
          <div className="bg-white border border-[#1A1815]">
            {items.map((c, i) => (
              <ConcernRow key={c.id} c={c} isLast={i === items.length - 1}
                canEdit={canEdit} onUpdate={updateConcern} onDelete={deleteConcern} showDecisionLink={isGovernor} />
            ))}
          </div>
        )}
      </section>

      <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
        Dates are honest commitments and move as we learn — that&apos;s the point of showing them. No blame, just the work.
      </p>
    </div>
  );
}

export default ConcernsBoard;
