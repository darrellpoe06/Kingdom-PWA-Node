// =============================================================================
// ShelfLedger — every document on a shelf, at a glance, sorted the way you need
// =============================================================================
// Darrell, 2026-10-17: "Can't we find a way to visualize the documents and sort
// the necessary information as required?" (DR-1087).
//
// It draws the SAME report model the shelf's Download / Print buttons export
// (shelfReport in lib/document-record.js), so what you see, what you sort and
// what you print are one set of facts. Each line shows where the document
// lives and whether it was filed before the move; tapping a title opens it in
// the shelf's own viewer. A blank cell means the app never kept that fact.
// =============================================================================

import React, { useState } from 'react';

const SERIF = { fontFamily: '"Fraunces", serif' };
const SORTS = [
  ['dated', 'Dated'],
  ['filed', 'Filed here'],
  ['type', 'Type'],
  ['title', 'Name'],
];

/** Rows sorted by `key`; newest first for dates, A to Z otherwise; blanks last. */
export function sortLedger(rows, key) {
  const dated = key === 'dated' || key === 'filed';
  const val = (r) => (r.row[key] === 'not recorded' ? '' : String(r.row[key] || ''));
  return [...rows].sort((a, b) => {
    const x = val(a); const y = val(b);
    if (!x && !y) return 0;
    if (!x) return 1;
    if (!y) return -1;
    return dated ? y.localeCompare(x) : x.localeCompare(y);
  });
}

export default function ShelfLedger({ model, items = [], onOpen, label = 'See them all' }) {
  const [open, setOpen] = useState(false);
  const [sortKey, setSortKey] = useState('dated');
  const [onlyMissing, setOnlyMissing] = useState(false);
  const rows = (model && model.groups[0] && model.groups[0].rows) || [];
  if (!rows.length) return null;
  const all = rows.map((row, i) => ({ row, item: items[i] }));
  const lines = sortLedger(onlyMissing ? all.filter((l) => l.row.move.startsWith('Yes')) : all, sortKey);
  const before = rows.filter((r) => r.move.startsWith('Yes')).length;

  return (
    <div className="mb-2">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="text-[0.6875rem] uppercase tracking-wider text-[#5A6E3D] hover:text-[#1A1815]">
        {open ? '▾' : '▸'} {label} · {rows.length}{before ? ` · ${before} filed before the move` : ''}
      </button>
      {open && (
        <div className="mt-2 border border-[#E8E4DC] bg-white">
          <div className="flex flex-wrap items-center gap-2 px-2 py-1.5 border-b border-[#E8E4DC] text-[0.625rem] uppercase tracking-wider text-[#5A5751]">
            <span>Sort by</span>
            {SORTS.map(([k, l]) => (
              <button key={k} type="button" onClick={() => setSortKey(k)} aria-pressed={sortKey === k}
                className={`px-1.5 py-0.5 rounded border ${sortKey === k ? 'border-[#1A1815] text-[#1A1815]' : 'border-[#E8E4DC]'}`}>{l}</button>
            ))}
            {before > 0 && (
              <label className="flex items-center gap-1 ml-auto normal-case tracking-normal text-[0.6875rem]">
                <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />
                Only those filed before the move
              </label>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[0.6875rem]" style={SERIF}>
              <thead>
                <tr className="text-left text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">
                  {model.columns.map((c) => <th key={c.key} scope="col" className="px-2 py-1 font-semibold whitespace-nowrap">{c.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {lines.map(({ row, item }, i) => (
                  <tr key={i} className={`border-t border-[#F0ECE4] ${row.move.startsWith('Yes') ? 'bg-[#FAF8F4]' : ''}`}>
                    {model.columns.map((c) => (
                      <td key={c.key} className={`px-2 py-1 align-top ${c.key === 'title' ? 'min-w-[10rem]' : 'whitespace-nowrap'}`}>
                        {c.key === 'title' && onOpen && item
                          ? <button type="button" onClick={() => onOpen(item)} className="text-left underline decoration-[#E8E4DC] hover:decoration-[#1A1815]">{row.title || 'Untitled'}</button>
                          : (row[c.key] || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-2 py-1 text-[0.625rem] text-[#5A5751] italic border-t border-[#E8E4DC]" style={SERIF}>{model.note}</p>
        </div>
      )}
    </div>
  );
}
