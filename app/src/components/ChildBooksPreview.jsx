// =============================================================================
// ChildBooksPreview — the guardian sees exactly what a granted child will see
// =============================================================================
// The visible face of the DR-0094 child money view, in the DR-0112 posture. There
// is no child-facing app SESSION yet (DR-0093 deferred it), so the first place this
// renders is HERE, guardian-side, on the Family Roster next to the "See family
// finances" toggle: the father previews — per child, both modes — what he is
// provoking them TOWARD. That makes the toggle tangible today AND is on-theme (a
// father sees the good works he invites his child into), while the child seeing it
// in their own session rides the child-account-linking work.
//
// Presentational + read-only: it renders the pure view-model from
// lib/child-books-view.js against the family's REAL books (passed in as `data`);
// it owns no data and mutates nothing. Themeable `text-[#hex]` classes only (never
// inline color), so it remaps in every theme (legibility guard, DR-0076).
import React, { useState } from 'react';
import { childBooksView, CHILD_VIEW_MODES } from '../lib/child-books-view.js';

const fmt = (n) => `$${Math.round(Number(n) || 0).toLocaleString('en-US')}`;
const MODE_LABEL = { teaching: 'Teaching view', raw: 'Real books' };

function Row({ label, amount, period, goodWork }) {
  return (
    <li className={`px-3 py-2 flex items-center justify-between gap-3 ${goodWork ? 'bg-[#F2F4EC]' : ''}`}>
      <span className="text-sm text-[#1A1815] flex items-center gap-1.5">
        {goodWork ? <span className="text-[0.5625rem] uppercase tracking-wider font-bold text-[#5A6E3D] border border-[#5A6E3D] px-1" title="a good work">good work</span> : null}
        {label}
        {period ? <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">· {period}</span> : null}
      </span>
      <span className="text-sm font-semibold text-[#1A1815] tabular-nums">{fmt(amount)}</span>
    </li>
  );
}

export default function ChildBooksPreview({ data, childLabel = 'this child', initialMode = 'teaching' }) {
  const [mode, setMode] = useState(CHILD_VIEW_MODES.includes(initialMode) ? initialMode : 'teaching');
  if (!data) return null;
  const view = childBooksView(data, { mode });

  return (
    <section className="border-2 border-[#5A6E3D] mt-3 bg-white">
      <div className="px-4 py-3 border-b border-[#E8E4DC] flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h4 className="text-sm font-bold text-[#1A1815]">Preview — what {childLabel} will see</h4>
          <p className="text-[0.6875rem] text-[#5A5751] mt-0.5">Read-only. The real numbers, arranged to provoke to good works (DR-0112) — never to shame.</p>
        </div>
        <div className="flex gap-1 shrink-0">
          {CHILD_VIEW_MODES.map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={`px-2.5 py-1 min-h-[36px] border text-xs font-semibold border-[#1A1815] ${mode === m ? 'bg-[#1A1815] text-white' : 'bg-white text-[#1A1815]'}`}>
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {view.mode === 'teaching' ? (
          <>
            <ul className="divide-y divide-[#E6E0D6] border border-[#1A1815] mb-3">
              {view.flow.map((f) => (
                <Row key={f.key} label={f.label} amount={f.amount} period={f.period} goodWork={f.goodWork} />
              ))}
            </ul>
            <p className="text-sm text-[#1A1815] mb-2">{view.invitation}</p>
            <div className="border-l-2 border-[#5A6E3D] pl-3 py-1">
              <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-0.5">A prayer to pray together</div>
              <p className="text-sm italic text-[#5A5751]">{view.prayerPrompt}</p>
            </div>
          </>
        ) : (
          <>
            <div className="grid sm:grid-cols-3 gap-2 mb-3">
              <div className="border border-[#1A1815] px-3 py-2"><div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">In / month</div><div className="text-sm font-semibold text-[#1A1815] tabular-nums">{fmt(view.monthly.income)}</div></div>
              <div className="border border-[#1A1815] px-3 py-2"><div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Giving / month</div><div className="text-sm font-semibold text-[#5A6E3D] tabular-nums">{fmt(view.monthly.giving)}</div></div>
              <div className="border border-[#1A1815] px-3 py-2"><div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Net / month</div><div className="text-sm font-semibold text-[#1A1815] tabular-nums">{fmt(view.monthly.net)}</div></div>
            </div>
            <ul className="divide-y divide-[#E6E0D6] border border-[#1A1815]">
              {view.accounts.map((a) => (
                <li key={a.id} className="px-3 py-2 flex items-center justify-between gap-3">
                  <span className="text-sm text-[#1A1815]">{a.name} <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">· {a.type}</span></span>
                  <span className="text-sm font-semibold text-[#1A1815] tabular-nums">{fmt(a.balance)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
