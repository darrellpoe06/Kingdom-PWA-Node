// =============================================================================
// RecordsLog — the app-wide "filing office" list primitive
// =============================================================================
// Darrell 2026-07-01: "sort most data-driven spaces organized office-like so we
// can go directly to the date or time in question ... so they are not death
// scrolls." Proven first on Books → Imported; this is the ONE reusable surface
// every data-driven space adopts instead of a bespoke list per tab. Give it
// records + a getDate accessor + a renderRow, and it delivers:
//   · newest-first by default (toggle to oldest);
//   · a familiar period control (This Month / Last Month / This Week / 30D / 90D
//     / All / Custom) + a ‹ month › stepper + a Jump-to-date box, so a human
//     lands on the exact month/date instantly instead of scrolling;
//   · sticky date headers (month or day) that index the list like file folders,
//     each carrying its count (and in/out/net when the records carry amounts);
//   · recognizable search + tappable facet chips;
//   · a TWO-TIER self-explaining layer (Darrell 2026-07-01): a LIGHT inline
//     what / where / how right on the surface, with a "Learn more" that routes
//     to the Help space for the fuller version — so every adopting surface
//     explains itself and lets a human see under the hood, for free.
//
// Layout-agnostic: the surface supplies renderRow (a card, a row, anything), so
// The Word, Choir, Harvest, and the finance feed all reuse this one component.
// All windowing/sort/grouping is the pure lib/records-log.js (pinned by
// records-log.test.js); a real-mount render test pins this component.
// =============================================================================

import React, { useMemo, useState } from 'react';
import HelpButton from './HelpButton.jsx';
import {
  sortRecords, filterRecordsByRange, groupRecords, recordTotals, resolvePeriod,
  isMonthKey, monthKeyOf, monthLabelOf, shiftMonthKey, recordMs,
} from '../lib/records-log.js';

const fmtMoney = (n) => (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n || 0)).toLocaleString();

// Colored money totals (green in / red out) read at AA in EVERY theme only when
// the dark ink sits on an inline LIGHT background — an un-themed cream chip that
// stays cream in midnight, so the color never lands dark-on-dark. Mirrors the
// church surfaces' status-color pattern and keeps the legibility guard green.
const amtStyle = (color) => ({ color, backgroundColor: '#FAF8F4', borderRadius: '0.25rem', padding: '0 0.25rem' });

const PERIOD_SEGMENTS = [
  ['month', 'This Month'],
  ['lastMonth', 'Last Month'],
  ['week', 'This Week'],
  ['30d', '30D'],
  ['90d', '90D'],
  ['all', 'All'],
  ['custom', 'Custom'],
];

const chipCls = (active) =>
  `px-2.5 py-1 text-[0.6875rem] rounded-full border whitespace-nowrap ${active
    ? 'bg-[#1A1815] text-white border-[#1A1815]'
    : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:border-[#1A1815]'}`;

export default function RecordsLog({
  items = [],
  getDate,
  renderRow,
  getText = null,
  getAmount = null,
  grain = 'month',
  facets = [],          // [{ key, label, getValue }]
  countNoun = 'record',
  about = null,         // { what, where, how, helpTopic }
  helpNav = null,       // optional { view, churchView, booksView, setView, ... } forwarded to HelpButton
  defaultSort = 'desc',
  className = '',
}) {
  const [period, setPeriod] = useState(null); // null = auto (newest group)
  const [range, setRange] = useState({ from: '', to: '' });
  const [sortDir, setSortDir] = useState(defaultSort);
  const [search, setSearch] = useState('');
  const [facetSel, setFacetSel] = useState({}); // key -> value ('' = all)
  const [aboutOpen, setAboutOpen] = useState(false);

  const all = useMemo(() => (Array.isArray(items) ? items : []), [items]);

  // Auto default period = the month of the newest record, so the surface opens on
  // the latest activity instead of an empty current month.
  const newestMs = useMemo(() => {
    let mx = null;
    for (const it of all) { const ms = recordMs(it, getDate); if (ms != null && (mx == null || ms > mx)) mx = ms; }
    return mx;
  }, [all, getDate]);
  const autoPeriod = newestMs != null ? monthKeyOf(newestMs) : 'all';
  const activePeriod = period ?? autoPeriod;
  const stepperMonth = isMonthKey(activePeriod)
    ? activePeriod
    : (isMonthKey(autoPeriod) ? autoPeriod : monthKeyOf(Date.now()));

  // Distinct facet values (tappable chips), computed from the full set.
  const facetOptions = useMemo(() => facets.map((f) => {
    const vals = [...new Set(all.map((it) => f.getValue(it)).filter((v) => v != null && v !== ''))].sort();
    return { ...f, values: vals };
  }), [facets, all]);

  const { sinceMs, untilMs } = useMemo(
    () => resolvePeriod(activePeriod, range, Date.now()),
    [activePeriod, range],
  );

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = all;
    if (q && getText) rows = rows.filter((it) => String(getText(it) || '').toLowerCase().includes(q));
    for (const f of facets) {
      const sel = facetSel[f.key];
      if (sel) rows = rows.filter((it) => String(f.getValue(it) ?? '') === sel);
    }
    const windowed = filterRecordsByRange(rows, getDate, sinceMs, untilMs);
    const sorted = sortRecords(windowed, getDate, sortDir);
    return {
      groups: groupRecords(sorted, getDate, { grain, getAmount }),
      totals: recordTotals(windowed, getAmount),
      matched: windowed.length,
      scanned: rows.length,
    };
  }, [all, getText, getDate, getAmount, grain, sinceMs, untilMs, sortDir, search, facets, facetSel]);

  const periodLabel = (range.from || range.to)
    ? 'range'
    : (PERIOD_SEGMENTS.find(([k]) => k === activePeriod)?.[1]
       || (isMonthKey(activePeriod) ? monthLabelOf(activePeriod) : 'All'));

  const jumpTo = (dateStr) => {
    if (dateStr && dateStr.length === 10) { setPeriod(dateStr.slice(0, 7)); setRange({ from: '', to: '' }); }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Self-explaining layer — LIGHT inline (what / where / how) with a
          "Learn more" that routes to the Help space for the deep version. */}
      {about && (
        <div className="border border-[#E8E4DC] bg-[#FAF8F4]">
          <button
            type="button"
            onClick={() => setAboutOpen((o) => !o)}
            aria-expanded={aboutOpen}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-[0.6875rem] text-[#5A5751] hover:text-[#1A1815]"
          >
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-[#5A5751] text-[0.625rem] leading-none">i</span>
            <span className="uppercase tracking-[0.2em]">About this{aboutOpen ? '' : ' — what it is, where the data comes from, how it works'}</span>
            <span className="ml-auto">{aboutOpen ? '▾' : '▸'}</span>
          </button>
          {aboutOpen && (
            <div className="px-3 pb-2 space-y-1 text-[0.75rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
              {about.what && <p>{about.what}</p>}
              {about.where && <p><span className="uppercase tracking-wider text-[0.625rem] text-[#5A6E3D]">Source</span> — {about.where}</p>}
              {about.how && <p><span className="uppercase tracking-wider text-[0.625rem] text-[#5A6E3D]">How it's built</span> — {about.how}</p>}
              {about.helpTopic && (
                <div className="pt-0.5 inline-flex items-center gap-1 text-[0.6875rem] text-[#B85838]">
                  <span>Learn more</span>
                  <HelpButton variant="inline" topic={about.helpTopic} {...(helpNav || {})} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Period control + ‹ month › stepper + jump-to-date + sort. */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex flex-wrap rounded-md border border-[#E8E4DC] overflow-hidden" role="group" aria-label="Time period">
          {PERIOD_SEGMENTS.map(([key, label], i) => (
            <button
              key={key}
              type="button"
              onClick={() => setPeriod(key)}
              aria-pressed={activePeriod === key}
              className={`px-3 py-1 text-[0.6875rem] uppercase tracking-wider ${i > 0 ? 'border-l border-[#E8E4DC]' : ''} ${activePeriod === key ? 'bg-[#1A1815] text-white' : 'bg-white text-[#5A5751] hover:bg-[#FAF8F4]'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="inline-flex items-center rounded-md border border-[#E8E4DC] bg-white">
          <button type="button" aria-label="Previous month" onClick={() => setPeriod(shiftMonthKey(stepperMonth, -1))} className="px-2 py-1 text-[#5A5751] hover:bg-[#FAF8F4]">‹</button>
          <button type="button" onClick={() => setPeriod(stepperMonth)} aria-pressed={isMonthKey(activePeriod)} className={`px-2 py-1 text-[0.6875rem] min-w-[6.5rem] text-center ${isMonthKey(activePeriod) ? 'text-[#1A1815] font-medium' : 'text-[#5A5751]'}`} style={{ fontFamily: '"Fraunces", serif' }}>{monthLabelOf(stepperMonth)}</button>
          <button type="button" aria-label="Next month" onClick={() => setPeriod(shiftMonthKey(stepperMonth, 1))} className="px-2 py-1 text-[#5A5751] hover:bg-[#FAF8F4]">›</button>
        </div>
        <label className="inline-flex items-center gap-1 text-[0.625rem] text-[#5A5751]">
          <span className="uppercase tracking-wider">Jump to</span>
          <input type="date" onChange={(e) => jumpTo(e.target.value)} className="border border-[#1A1815] px-2 py-1 text-xs bg-white" aria-label="Jump to date" />
        </label>
        <button
          type="button"
          onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
          className="px-2.5 py-1 text-[0.6875rem] uppercase tracking-wider border border-[#E8E4DC] bg-white text-[#1A1815] hover:bg-[#FAF8F4] rounded-md"
          aria-label="Toggle date sort order"
          title={sortDir === 'desc' ? 'Newest first (tap for oldest first)' : 'Oldest first (tap for newest first)'}
        >
          {sortDir === 'desc' ? '↓ Newest' : '↑ Oldest'}
        </button>
      </div>

      {activePeriod === 'custom' && (
        <div className="flex flex-wrap items-center gap-1 text-[0.625rem] text-[#5A5751]">
          <label className="uppercase tracking-wider">From</label>
          <input type="date" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} className="border border-[#1A1815] px-2 py-1 text-xs bg-white" aria-label="Custom range from" />
          <label className="uppercase tracking-wider">To</label>
          <input type="date" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} className="border border-[#1A1815] px-2 py-1 text-xs bg-white" aria-label="Custom range to" />
          {(range.from || range.to) && <button type="button" onClick={() => setRange({ from: '', to: '' })} className="px-2 py-1 uppercase tracking-wider border border-[#E8E4DC] hover:border-[#1A1815]">Clear</button>}
        </div>
      )}

      {getText && (
        <input
          type="search"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-[#1A1815] px-2 py-1 text-xs bg-white w-full"
          aria-label="Search records"
        />
      )}

      {facetOptions.map((f) => f.values.length > 1 && (
        <div key={f.key} className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label={`Filter by ${f.label}`}>
          <button type="button" onClick={() => setFacetSel((s) => ({ ...s, [f.key]: '' }))} className={chipCls(!facetSel[f.key])}>All {f.label}</button>
          {f.values.map((v) => (
            <button key={v} type="button" onClick={() => setFacetSel((s) => ({ ...s, [f.key]: v }))} className={chipCls(facetSel[f.key] === v)}>{v}</button>
          ))}
        </div>
      ))}

      <div className="text-[0.625rem] text-[#5A5751]">
        Showing {grouped.matched.toLocaleString()} of {all.length.toLocaleString()} {countNoun}{all.length === 1 ? '' : 's'} · {periodLabel}
        {getAmount && grouped.totals.hasAmount && (
          <>
            {' · '}<span style={amtStyle('#166534')}>in {fmtMoney(grouped.totals.in)}</span>
            {' · '}<span style={amtStyle('#B85838')}>out {fmtMoney(grouped.totals.out)}</span>
            {' · '}<span style={amtStyle(grouped.totals.net < 0 ? '#B85838' : '#166534')}>net {fmtMoney(grouped.totals.net)}</span>
          </>
        )}
      </div>

      {grouped.matched === 0 ? (
        <div className="border border-[#E8E4DC] bg-white px-2 py-6 text-center text-[0.75rem] text-[#5A5751]">
          No {countNoun}s in this period. Try “All”, step to another month, or clear the filters.
        </div>
      ) : (
        <div className="border border-[#E8E4DC] bg-white">
          {grouped.groups.map((g) => (
            <div key={g.key}>
              <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-3 py-2 bg-[#FAF8F4] border-y border-[#E8E4DC]">
                <span className="flex items-baseline gap-2">
                  <span className="text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{g.label}</span>
                  <span className="text-[0.625rem] text-[#5A5751]">{g.totals.count.toLocaleString()} {countNoun}{g.totals.count === 1 ? '' : 's'}</span>
                </span>
                {getAmount && g.totals.hasAmount && (
                  <span className="flex items-center gap-2 text-[0.6875rem]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    <span style={amtStyle('#166534')}>in {fmtMoney(g.totals.in)}</span>
                    <span style={amtStyle('#B85838')}>out {fmtMoney(g.totals.out)}</span>
                    <span style={amtStyle(g.totals.net < 0 ? '#B85838' : '#166534')}>net {fmtMoney(g.totals.net)}</span>
                  </span>
                )}
              </div>
              <div>
                {g.records.map((it, i) => (
                  <React.Fragment key={it.id ?? i}>{renderRow(it)}</React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
