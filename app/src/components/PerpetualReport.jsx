// =============================================================================
// PerpetualReport — the portable cross-system history (Books-ledger pattern,
// generalized) + the failures & fixes coverage lens
// =============================================================================
// "Perpetual reports, like the Books section's historical, for everything we
// want to keep track of in our projects and other systems — portable, and able
// to sort multiple business systems' processes, for adaptability." (Darrell,
// 2026-07-07.) One surface where every record stream reads as one sortable,
// filterable, paginated, EXPORTABLE timeline: projects, board work + its
// append-only history events, concerns (seed/DB/feedback/audit), discussions,
// the decision ledger, the review registry, and the lessons incidents.
//
// NO STATIC DATA (DR-0121): every row projects a live record (lib/
// perpetual-report.js); the failures & fixes strip is the derived answer to
// "are we implementing fixes for all the failures recorded?" — it moves the
// moment the underlying records do.
import React, { useEffect, useMemo, useState } from 'react';
import { useBoardTasks } from '../lib/use-board-tasks.js';
import { composeConcerns } from '../lib/concerns.js';
import { triggerDownload } from '../lib/creation-workspace.js';
import {
  REPORT_SYSTEMS, buildReportRows, filterReport, sortReport, reportStatuses,
  reportToCsv, failureCoverage,
} from '../lib/perpetual-report.js';

const DR_LEDGER = (typeof __DR_LEDGER__ !== 'undefined') ? __DR_LEDGER__ : { ok: false, count: 0, items: [] };
const UIUX_REVIEWS = (typeof __UIUX_REVIEWS__ !== 'undefined') ? __UIUX_REVIEWS__ : { ok: false, count: 0, items: [] };
const LESSONS = (typeof __LESSONS_PRINCIPLES__ !== 'undefined') ? __LESSONS_PRINCIPLES__ : { ok: false, principles: [], incidents: [] };

const SYSTEM_LABEL = Object.fromEntries(REPORT_SYSTEMS);

const STREAM_TONE = {
  open: 'text-[#B85838]',
  working: 'text-[#2A5A8E]',
  closed: 'text-[#5A6E3D]',
};

export default function PerpetualReport({ projects = [], concerns = [], feedback = [], discussions = [] }) {
  const tasks = useBoardTasks();
  const [system, setSystem] = useState('all');
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);
  const pageSize = 25;

  // The full concern set — the SAME composition the Concerns board renders
  // (seeds + DB + feedback read-through + audit findings), so this report and
  // that board can never disagree.
  const allConcerns = useMemo(
    () => composeConcerns({ dbConcerns: concerns, feedback }),
    [concerns, feedback]
  );

  const rows = useMemo(() => buildReportRows({
    projects, tasks, concerns: allConcerns, discussions,
    ledger: DR_LEDGER, reviews: UIUX_REVIEWS, lessons: LESSONS,
  }), [projects, tasks, allConcerns, discussions]);

  const statuses = useMemo(() => reportStatuses(rows), [rows]);
  const filtered = useMemo(
    () => sortReport(filterReport(rows, { system, status, query }), { key: sortKey, dir: sortDir }),
    [rows, system, status, query, sortKey, sortDir]
  );
  useEffect(() => { setPage(0); }, [system, status, query, sortKey, sortDir]);

  const coverage = useMemo(() => failureCoverage(rows), [rows]);
  const newest = useMemo(() => rows.reduce((m, r) => (r.date && r.date > m ? r.date : m), ''), [rows]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const startIdx = safePage * pageSize;
  const pageItems = filtered.slice(startIdx, startIdx + pageSize);

  const exportCsv = () => {
    const csv = reportToCsv(filtered);
    const day = new Date().toISOString().slice(0, 10);
    triggerDownload(new Blob([csv], { type: 'text/csv' }), `poetech-perpetual-report-${day}.csv`);
  };

  const sortBtn = (key, label) => (
    <button type="button" onClick={() => {
      if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      else { setSortKey(key); setSortDir(key === 'date' ? 'desc' : 'asc'); }
    }}
      aria-label={`Sort by ${label}`}
      className={`text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 border focus:outline focus:outline-2 focus:outline-[#B85838] ${sortKey === key ? 'border-[#1A1815] text-[#1A1815] font-semibold' : 'border-[#E8E4DC] text-[#5A5751]'}`}>
      {label}{sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
    </button>
  );

  return (
    <div className="space-y-4">
      <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">∞ Perpetual Report · every record stream, one history</div>
        <p className="text-sm mt-1 text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
          The Books-ledger pattern for everything we track: projects, board work and its recorded events, concerns, discussions, the decision ledger, reviews, and lessons — one sortable timeline you can filter by system and carry anywhere as CSV.
        </p>
        <p className="text-[0.625rem] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
          {rows.length.toLocaleString()} records, all derived from live sources — nothing on this page is hand-typed (DR-0121).{newest ? ` Newest record: ${newest}.` : ''}
        </p>
      </section>

      {/* Failures & fixes — the coverage answer, derived. */}
      <section className="bg-white border border-[#1A1815] p-3">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#1A1815] font-semibold mb-1.5">Failures &amp; fixes — is everything recorded being worked?</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {coverage.map((c) => (
            <div key={c.system} className="border border-[#E8E4DC] bg-[#FAF8F4] p-2.5">
              <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold">{SYSTEM_LABEL[c.system] || c.system} · {c.total}</div>
              <div className="text-xs mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
                <span className={STREAM_TONE.open}>{c.open} open</span>
                {' · '}<span className={STREAM_TONE.working}>{c.working} working</span>
                {' · '}<span className={STREAM_TONE.closed}>{c.closed} closed</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[0.625rem] text-[#5A5751] italic mt-1.5" style={{ fontFamily: '"Fraunces", serif' }}>
          Counted from the records themselves — an open count here is a work item, not a decoration. Concerns include the seed baseline, the family&apos;s rows, feedback read-through, and the machine audit.
        </p>
      </section>

      {/* Filters + sort + export */}
      <section className="bg-white border border-[#E8E4DC] p-3 space-y-2">
        <div className="flex flex-wrap gap-1.5 items-center">
          <button type="button" onClick={() => setSystem('all')} aria-pressed={system === 'all'}
            className={`text-[0.625rem] uppercase tracking-wider px-2 py-1.5 border min-h-[32px] focus:outline focus:outline-2 focus:outline-[#B85838] ${system === 'all' ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'text-[#5A5751] border-[#E8E4DC]'}`}>
            All systems
          </button>
          {REPORT_SYSTEMS.map(([key, label]) => (
            <button key={key} type="button" onClick={() => setSystem(key)} aria-pressed={system === key}
              className={`text-[0.625rem] uppercase tracking-wider px-2 py-1.5 border min-h-[32px] focus:outline focus:outline-2 focus:outline-[#B85838] ${system === key ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'text-[#5A5751] border-[#E8E4DC]'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the history…"
            aria-label="Search all records"
            className="flex-1 min-w-[10rem] p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status"
            className="text-xs p-2 border border-[#E8E4DC] bg-[#FAF8F4]">
            <option value="all">All statuses</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Sort:</span>
          {sortBtn('date', 'Date')}
          {sortBtn('system', 'System')}
          {sortBtn('status', 'Status')}
          {sortBtn('title', 'Title')}
          <button type="button" onClick={exportCsv}
            className="text-[0.625rem] uppercase tracking-wider px-3 py-2 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">
            ⇩ Export CSV ({filtered.length})
          </button>
        </div>
      </section>

      {/* The history */}
      <section>
        {pageItems.length === 0 ? (
          <div className="bg-white border border-[#E8E4DC] p-6 text-center">
            <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
              No records match — clear a filter, or the streams on this device are honestly empty (board rows and concerns sync on sign-in).
            </p>
          </div>
        ) : (
          <div className="bg-white border border-[#1A1815]">
            {pageItems.map((r, i) => (
              <div key={r.id} className={`p-3 ${i < pageItems.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <span className="text-sm" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{r.title}</span>
                  <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    {r.date || 'undated'} · {SYSTEM_LABEL[r.system] || r.system} · {r.kind}{r.status ? ` · ${r.status}` : ''}
                  </span>
                </div>
                {r.detail && <p className="text-xs text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{r.detail}</p>}
                <div className="text-[0.5625rem] text-[#5A5751] mt-1" style={{ fontFamily: '"JetBrains Mono", monospace' }}>from {r.source}</div>
              </div>
            ))}
          </div>
        )}
        {filtered.length > pageSize && (
          <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
            <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={safePage === 0}
              className="text-[0.625rem] uppercase tracking-wider px-3 py-1.5 border border-[#1A1815] bg-white text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-30 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">« Previous</button>
            <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">
              page {safePage + 1} of {totalPages} · showing {startIdx + 1}–{Math.min(startIdx + pageSize, filtered.length)} of {filtered.length}
            </span>
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1}
              className="text-[0.625rem] uppercase tracking-wider px-3 py-1.5 border border-[#1A1815] bg-white text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-30 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Next »</button>
          </div>
        )}
      </section>

      <p className="text-[0.625rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
        Portable by design: the CSV carries date · system · kind · title · detail · status · source, so any other business system can sort the same history. Board rows, concerns, and discussions sync per family instance; repo records (decisions, reviews, lessons) re-parse on every build.
      </p>
    </div>
  );
}
