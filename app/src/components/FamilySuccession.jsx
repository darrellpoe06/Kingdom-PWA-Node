// =============================================================================
// FamilySuccession — the succession & asset-transfer PLANNING surface
// =============================================================================
// Darrell, 2026-06-30: the multi-generational, multi-entity business model has
// to WORK to protect the family and plan the transfer of assets across the
// generations. This surface DOCUMENTS, MODELS, and ORGANIZES that plan — for
// each real asset it maps  asset -> owning entity -> intended beneficiary ->
// the transfer INSTRUMENT that applies (Illinois TODI / trust / LLC succession /
// POD / TOD) — flags any asset with no plan (probate exposure), and produces an
// organized package a licensed Illinois estate attorney can execute from.
//
// BINDING (CLAUDE.md + the not-legal-advice framing):
//   - This is NOT legal advice and it does NOT execute any transfer. The actual
//     documents are drafted and filed by a licensed Illinois estate attorney.
//     A single honest disclaimer sits at the top (once, not moralizing).
//   - Reality-trace (DR-0061/0076): the asset inventory is DERIVED from the live
//     `data` (real entities/rentals/accounts for signed-in family), never a
//     painted list. Unknown values show "value unknown", never a fabricated one.
//   - Family/Governor only. The plan (who inherits what) is the most sensitive
//     data in the app; a non-family session sees a lock, never the plan. The
//     plan is stored device-local (localStorage) — no cloud, no leak — with a
//     shared-cloud store flagged as a follow-up.
//   - Legal reference content is factual + cited to the Illinois statute, every
//     fact-specific point flagged ATTORNEY-CONFIRM (see lib/family-succession.js).
//     The engine is unit-tested; this file renders it.
//   - Legibility (WCAG 2.1 AA, per-theme): neutral text/background use the
//     remapped palette token classes; semantic accents (red/green/amber) are
//     applied via inline style (the cockpit convention, e.g. Forecast) so they
//     stay readable and the midnight theme remap holds. Font sizes are rem at the
//     16px baseline so the global text-size control scales them.
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import SectionBoundary from './SectionBoundary.jsx';
import HelpButton from './HelpButton.jsx';
import UiIcon from './UiIcon.jsx';
import { TabScroll } from './shared.jsx';
import {
  NOT_LEGAL_ADVICE, SMALL_ESTATE_THRESHOLD, INSTRUMENTS, instrumentById,
  ASSET_CLASSES, PLAN_STATUS, assetMapRows, gapAnalysis,
  buildAttorneyPackage, renderAttorneyPackageText,
} from '../lib/family-succession.js';

// Shared tokens — remapped palette classes (identical to the other family
// surfaces, already contrast-gated). Accents below are inline (per-theme safe).
const card = 'bg-white border border-[#1A1815] p-4 sm:p-5';
const labelCls = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751]';
const sectionH = 'text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold';
const serif = { fontFamily: '"Fraunces", serif' };
// Semantic accent colors — applied via inline style (readable on every theme).
const RED = '#9B2C2C';
const GREEN = '#2F6B3A';
const AMBER = '#8A5A12';
const money = (n) => (n == null ? '—' : `${n < 0 ? '-' : ''}$${Math.abs(Math.round(Number(n) || 0)).toLocaleString()}`);

const LS_PLAN = 'poe.succession.plan.v1';
const LS_META = 'poe.succession.meta.v1';
function loadLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; }
}
function saveLS(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* no storage */ }
}

const TABS = [
  ['map', 'Asset Map'],
  ['gaps', 'Gaps'],
  ['instruments', 'Instruments'],
  ['export', 'Attorney Package'],
];

// The plan-status pill (a real derived state, not legal status). Neutral bg +
// inline-colored text/border so it reads on every theme.
function StatusPill({ status }) {
  const tone = status === 'planned'
    ? { fg: GREEN, label: 'Planned' }
    : status === 'partial'
      ? { fg: AMBER, label: 'Partial' }
      : { fg: RED, label: 'No plan' };
  return (
    <span
      className="text-[0.5625rem] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-[#FAF8F4] border"
      style={{ color: tone.fg, borderColor: tone.fg }}
    >
      {tone.label}
    </span>
  );
}

function Disclaimer() {
  return (
    <div className="border border-[#C9B7A0] bg-[#FBF6EE] p-3 sm:p-4 flex gap-3 items-start" role="note">
      <div className="shrink-0 mt-0.5" style={{ color: AMBER }} aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>
      </div>
      <p className="text-xs leading-relaxed text-[#5A5751]">
        <span className="font-semibold text-[#1A1815]">This organizes your plan — it is not legal advice.</span>{' '}
        {NOT_LEGAL_ADVICE.replace(/^This is a planning and organizing tool — not legal advice\.\s*/, '')}
      </p>
    </div>
  );
}

function Locked() {
  return (
    <div className="max-w-2xl mx-auto bg-white border border-[#1A1815] p-6 mt-6 text-center" style={serif}>
      <div className="mb-1 flex justify-center text-[#1A1815]" aria-hidden="true"><UiIcon name="lock" /></div>
      <p className="text-sm text-[#1A1815] font-semibold">Family succession is a stewardship space.</p>
      <p className="text-xs text-[#5A5751] mt-1.5 leading-relaxed">
        This maps who receives what across the family’s entities — the most sensitive plan in the app. Sign in with a family / governor account to view and edit it.
      </p>
    </div>
  );
}

// ── The asset-map row editor ────────────────────────────────────────────────
function AssetRow({ row, onChange }) {
  const suggested = row.suggestion && row.suggestion.primary ? instrumentById[row.suggestion.primary] : null;
  const blocked = (row.suggestion && row.suggestion.blocked) || [];
  return (
    <div className="border border-[#E3DDD2] bg-white p-3" data-talk-fact={`asset ${row.label}`} data-talk-value={`${row.beneficiary || 'no beneficiary'}, ${row.instrument ? (instrumentById[row.instrument] ? instrumentById[row.instrument].shortName : row.instrument) : 'no instrument'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[#1A1815] truncate" style={serif}>{row.label}</div>
          <div className="text-[0.625rem] text-[#5A5751] mt-0.5">
            {ASSET_CLASSES[row.assetClass] ? ASSET_CLASSES[row.assetClass].label : row.assetClass}
            {' · '}{row.owningEntityName}
            {' · '}{row.heldBy === 'personal' ? 'held personally' : 'held in entity'}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-semibold tabular-nums text-[#1A1815]">{row.valueKnown ? money(row.value) : <span className="text-[0.625rem] font-normal" style={{ color: AMBER }}>value unknown</span>}</div>
          <div className="mt-1"><StatusPill status={row.planStatus} /></div>
        </div>
      </div>

      {/* the suggestion + any blocked instrument (the legal-correctness surface) */}
      <div className="mt-2 text-[0.625rem] leading-relaxed text-[#5A5751]">
        {suggested && (
          <span><span className="text-[#5A5751]">Typically applies:</span> <span className="font-semibold text-[#1A1815]">{suggested.shortName}</span> <span className="text-[#8A7F70]">({suggested.statute})</span>. </span>
        )}
        {row.suggestion && row.suggestion.note}
      </div>
      {blocked.map((b) => (
        <div key={b.id} className="mt-1.5 text-[0.625rem] leading-relaxed bg-[#FBF6EE] border border-[#E6C9C2] px-2 py-1" style={{ color: RED }}>
          <span className="font-semibold">Does not apply — {instrumentById[b.id] ? instrumentById[b.id].shortName : b.id}:</span> {b.reason}
        </div>
      ))}

      {/* the editable plan overlay */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <label className="block">
          <span className={labelCls}>Intended beneficiary</span>
          <input
            type="text"
            value={row.beneficiary}
            onChange={(e) => onChange(row.assetId, { beneficiary: e.target.value })}
            placeholder="Who receives this"
            className="mt-0.5 w-full border border-[#C9C2B6] bg-white px-2 py-1 text-xs text-[#1A1815]"
          />
        </label>
        <label className="block">
          <span className={labelCls}>Instrument</span>
          <select
            value={row.instrument}
            onChange={(e) => onChange(row.assetId, { instrument: e.target.value })}
            className="mt-0.5 w-full border border-[#C9C2B6] bg-white px-2 py-1 text-xs text-[#1A1815]"
          >
            <option value="">— choose —</option>
            {INSTRUMENTS.filter((i) => i.appliesTo.includes(row.assetClass) && !blocked.some((b) => b.id === i.id)).map((i) => (
              <option key={i.id} value={i.id}>{i.shortName}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelCls}>Status</span>
          <select
            value={row.status}
            onChange={(e) => onChange(row.assetId, { status: e.target.value })}
            className="mt-0.5 w-full border border-[#C9C2B6] bg-white px-2 py-1 text-xs text-[#1A1815]"
          >
            {Object.values(PLAN_STATUS).map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="block mt-2">
        <span className={labelCls}>Notes for the attorney</span>
        <input
          type="text"
          value={row.notes}
          onChange={(e) => onChange(row.assetId, { notes: e.target.value })}
          placeholder="Anything the attorney should know about this asset"
          className="mt-0.5 w-full border border-[#C9C2B6] bg-white px-2 py-1 text-xs text-[#1A1815]"
        />
      </label>
    </div>
  );
}

function InstrumentCard({ i }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={card}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-[#1A1815]" style={serif}>{i.name}</div>
          <div className="text-[0.625rem] text-[#8A7F70] mt-0.5">{i.statute}</div>
        </div>
        <a href={i.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[0.625rem] text-[#B85838] underline shrink-0">statute ↗</a>
      </div>
      <p className="text-xs leading-relaxed text-[#1A1815] mt-2">{i.summary}</p>
      <button onClick={() => setOpen((v) => !v)} className="mt-2 text-[0.625rem] uppercase tracking-wider text-[#B85838] font-semibold">
        {open ? 'Hide details' : 'Key points + attorney-confirm'}
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          <ul className="list-disc pl-4 space-y-1 text-[0.6875rem] leading-relaxed text-[#1A1815]">
            {i.keyPoints.map((k, idx) => <li key={idx}>{k}</li>)}
          </ul>
          <div className="border-t border-[#E3DDD2] pt-2">
            <div className={labelCls}>Attorney confirms</div>
            <ul className="list-disc pl-4 space-y-1 text-[0.6875rem] leading-relaxed text-[#5A5751] mt-1">
              {i.attorneyConfirm.map((k, idx) => <li key={idx}>{k}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function FamilySuccessionInner({ data, email = '', isFamilyMember = false, currentDate }) {
  const [tab, setTab] = useState('map');
  const [plan, setPlan] = useState(() => loadLS(LS_PLAN, {}));
  const [meta, setMeta] = useState(() => loadLS(LS_META, { familyName: '' }));
  const [copied, setCopied] = useState(false);

  useEffect(() => { saveLS(LS_PLAN, plan); }, [plan]);
  useEffect(() => { saveLS(LS_META, meta); }, [meta]);

  const asOf = useMemo(() => (currentDate ? new Date(currentDate) : new Date()), [currentDate]);
  const rows = useMemo(() => assetMapRows(data, plan, asOf), [data, plan, asOf]);
  const gaps = useMemo(() => gapAnalysis(rows), [rows]);

  const updateAsset = useCallback((assetId, patch) => {
    setPlan((prev) => ({ ...prev, [assetId]: { ...(prev[assetId] || {}), ...patch } }));
  }, []);

  const pkgText = useMemo(() => {
    const stamp = asOf.toISOString().slice(0, 10);
    const pkg = buildAttorneyPackage(data, plan, { generatedAt: stamp, familyName: meta.familyName || null, asOf: asOf.toISOString() });
    return renderAttorneyPackageText(pkg);
  }, [data, plan, meta.familyName, asOf]);

  const copyPkg = useCallback(async () => {
    try { await navigator.clipboard.writeText(pkgText); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ }
  }, [pkgText]);

  const downloadPkg = useCallback(() => {
    try {
      const blob = new Blob([pkgText], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'family-succession-attorney-package.md';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { /* download blocked */ }
  }, [pkgText]);

  if (!isFamilyMember) return <Locked />;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 pb-16">
      <div className="flex items-center justify-between mt-4 mb-1">
        <h1 className="text-xl sm:text-2xl font-semibold text-[#1A1815]" style={serif}>Family Succession</h1>
        <HelpButton variant="inline" topic="succession" />
      </div>
      <p className="text-xs text-[#5A5751] leading-relaxed mb-3">
        Protect the family and plan the transfer of every asset across the generations. Map who receives what, by which instrument — then hand your attorney an organized package to make it binding.
      </p>

      <Disclaimer />

      <div className="mt-4">
        <TabScroll label="Succession sections">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-current={tab === id ? 'page' : undefined}
              className={`px-3 py-1.5 text-xs font-semibold whitespace-nowrap border-b-2 ${tab === id ? 'border-[#B85838] text-[#1A1815]' : 'border-transparent text-[#8A7F70]'}`}
            >
              {label}
              {id === 'gaps' && gaps.counts.unplanned + gaps.counts.partial > 0 && (
                <span className="ml-1 text-[0.5625rem] px-1 rounded-sm bg-[#FAF8F4] border" style={{ color: RED, borderColor: RED }}>{gaps.counts.unplanned + gaps.counts.partial}</span>
              )}
            </button>
          ))}
        </TabScroll>
      </div>

      {/* coverage strip — a real derived figure, exposed to Talk-about */}
      <div className="mt-3 flex flex-wrap gap-2" data-talk-fact="succession coverage" data-talk-value={`${gaps.coverage}% of ${gaps.total} assets fully planned`}>
        <div className="border border-[#E3DDD2] bg-[#FAF8F4] px-3 py-2">
          <div className={labelCls}>Coverage</div>
          <div className="text-lg font-semibold tabular-nums text-[#1A1815]">{gaps.coverage}%</div>
        </div>
        <div className="border border-[#E3DDD2] bg-[#FAF8F4] px-3 py-2">
          <div className={labelCls}>Assets</div>
          <div className="text-lg font-semibold tabular-nums text-[#1A1815]">{gaps.total}</div>
        </div>
        <div className="border border-[#E3DDD2] bg-[#FAF8F4] px-3 py-2">
          <div className={labelCls}>Planned</div>
          <div className="text-lg font-semibold tabular-nums" style={{ color: GREEN }}>{gaps.counts.planned}</div>
        </div>
        <div className="border border-[#E3DDD2] bg-[#FAF8F4] px-3 py-2">
          <div className={labelCls}>Needs a plan</div>
          <div className="text-lg font-semibold tabular-nums" style={{ color: RED }}>{gaps.counts.unplanned + gaps.counts.partial}</div>
        </div>
      </div>

      {/* ── MAP ── */}
      {tab === 'map' && (
        <div className="mt-4 space-y-2">
          {rows.length === 0 && (
            <div className={`${card} text-center`}>
              <p className="text-sm text-[#1A1815] font-semibold" style={serif}>No assets found yet.</p>
              <p className="text-xs text-[#5A5751] mt-1">This map is built from your real entities, properties, and accounts. As those load, they appear here to plan.</p>
            </div>
          )}
          {rows.map((r) => <AssetRow key={r.assetId} row={r} onChange={updateAsset} />)}
        </div>
      )}

      {/* ── GAPS ── */}
      {tab === 'gaps' && (
        <div className="mt-4 space-y-3">
          {gaps.probateRisk.length > 0 && (
            <div className="border border-[#E6C9C2] bg-[#FBF6EE] p-3">
              <div className="text-xs font-semibold" style={{ color: RED }}>Real property with no instrument — sharpest probate risk</div>
              <p className="text-[0.625rem] mt-1 leading-relaxed" style={{ color: RED }}>Real estate can never pass by small-estate affidavit ({SMALL_ESTATE_THRESHOLD.statute}); with no instrument it goes through probate — public, slow, costly.</p>
              <ul className="mt-2 space-y-1">
                {gaps.probateRisk.map((r) => (
                  <li key={r.assetId} className="text-xs text-[#1A1815] flex items-center justify-between gap-2">
                    <span className="truncate">{r.label} <span className="text-[0.625rem] text-[#8A7F70]">· {r.owningEntityName}</span></span>
                    <button onClick={() => setTab('map')} className="text-[0.625rem] text-[#B85838] underline shrink-0">plan it</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {gaps.exposure.length === 0 ? (
            <div className={`${card} text-center`}>
              <p className="text-sm font-semibold" style={{ ...serif, color: GREEN }}>Every asset has an intended beneficiary and an instrument.</p>
              <p className="text-xs text-[#5A5751] mt-1">Take the Attorney Package to your Illinois estate attorney to make it binding.</p>
            </div>
          ) : (
            <div className={card}>
              <div className={sectionH}>Assets needing attention ({gaps.exposure.length})</div>
              <ul className="mt-2 divide-y divide-[#EEE9E0]">
                {gaps.exposure.map((r) => (
                  <li key={r.assetId} className="py-2 flex items-center justify-between gap-2">
                    <span className="min-w-0">
                      <span className="text-xs font-semibold text-[#1A1815] truncate block">{r.label}</span>
                      <span className="text-[0.625rem] text-[#5A5751]">{ASSET_CLASSES[r.assetClass] ? ASSET_CLASSES[r.assetClass].label : r.assetClass} · {r.owningEntityName}</span>
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      <StatusPill status={r.planStatus} />
                      <button onClick={() => setTab('map')} className="text-[0.625rem] text-[#B85838] underline">edit</button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── INSTRUMENTS ── */}
      {tab === 'instruments' && (
        <div className="mt-4 space-y-3">
          <div className="border border-[#E3DDD2] bg-[#FAF8F4] p-3 text-[0.6875rem] leading-relaxed text-[#5A5751]">
            Illinois transfer instruments — factual, cited to the statute. Which one applies to which asset depends on how the asset is held; your attorney confirms the specifics.
          </div>
          {INSTRUMENTS.map((i) => <InstrumentCard key={i.id} i={i} />)}
          <div className="border border-[#E3DDD2] bg-white p-3">
            <div className="text-xs font-semibold text-[#1A1815]" style={serif}>If nothing applies: probate</div>
            <p className="text-[0.6875rem] leading-relaxed text-[#1A1815] mt-1">
              An asset with no instrument, no joint owner, and no beneficiary falls into probate. Illinois allows a small-estate affidavit up to{' '}
              <span className="font-semibold">{money(SMALL_ESTATE_THRESHOLD.amount)}</span> of personal property ({SMALL_ESTATE_THRESHOLD.statute}, {SMALL_ESTATE_THRESHOLD.publicAct}, eff. {SMALL_ESTATE_THRESHOLD.effective}) — but it never transfers real estate.
            </p>
            <a href={SMALL_ESTATE_THRESHOLD.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[0.625rem] text-[#B85838] underline">statute ↗</a>
          </div>
        </div>
      )}

      {/* ── EXPORT ── */}
      {tab === 'export' && (
        <div className="mt-4 space-y-3">
          <div className={card}>
            <label className="block">
              <span className={labelCls}>Family / plan name (optional)</span>
              <input
                type="text"
                value={meta.familyName || ''}
                onChange={(e) => setMeta((m) => ({ ...m, familyName: e.target.value }))}
                placeholder="e.g. Poe Family"
                className="mt-0.5 w-full sm:w-72 border border-[#C9C2B6] bg-white px-2 py-1 text-xs text-[#1A1815]"
              />
            </label>
            <div className="mt-3 flex gap-2">
              <button onClick={copyPkg} className="px-3 py-1.5 text-xs font-semibold bg-[#1A1815] text-white">{copied ? 'Copied ✓' : 'Copy package'}</button>
              <button onClick={downloadPkg} className="px-3 py-1.5 text-xs font-semibold border border-[#1A1815] text-[#1A1815]">Download .md</button>
            </div>
            <p className="text-[0.625rem] text-[#8A7F70] mt-2 leading-relaxed">An organized summary your attorney executes from — entities, each asset’s intended beneficiary + instrument, the gaps, and the cited statutes. It carries the not-legal-advice framing.</p>
          </div>
          <div className={card}>
            <div className={sectionH}>Preview</div>
            <pre className="mt-2 text-[0.625rem] leading-relaxed text-[#1A1815] whitespace-pre-wrap break-words max-h-[420px] overflow-auto bg-[#FAF8F4] border border-[#EEE9E0] p-2">{pkgText}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FamilySuccession(props) {
  return (
    <SectionBoundary name="Family Succession">
      <FamilySuccessionInner {...props} />
    </SectionBoundary>
  );
}
