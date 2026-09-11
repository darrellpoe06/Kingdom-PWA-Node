// =============================================================================
// Obligations — Books · Owed. What is owed, what was paid, and the paper.
// (DR-0358 + DR-0359; migrations 0202 + 0203)
// =============================================================================
// Both decision records said "no surface yet". This is that surface: the ledger,
// the walls, the arithmetic and the per-door gap engine already live in the
// database, and until now nothing showed them.
//
// REALITY-TRACE (DR-0061), run before a line was written:
//   * Real rows: `obligations`, `obligation_settlements`, `obligation_lines`,
//     `obligation_documents`, `family_documents`, `rentals` — all confirmed
//     present in the live database.
//   * Read through RLS: the books wall (0082/0100, kept by 0202/0203) denies
//     'child' and 'assistant'. This surface does not re-implement that wall; it
//     reports honestly when the rows do not come back.
//   * Today there are ZERO obligations and, of the 12 doors, 1 carries a rent
//     figure and 1 a mortgage payment. So the EMPTY path is the common path,
//     and it says what is missing rather than drawing zeros (DR-0076).
//
// Every number on this surface is a sum of rows a person can open. Nothing here
// is painted. Where we have not been told something, it says so.
//
// The strip: no panel here is a long read-down (the 2026-07-04 sliding-tabs Way,
// swept across the app 2026-09-11).
// =============================================================================
import React, { useEffect, useState, useMemo } from 'react';
import SectionTabs from './SectionTabs.jsx';
import { listObligations } from '../lib/obligations-sync.js';
import {
  DIRECTIONS, AGING_BUCKETS, money, agingReport, netPosition, dueWithin,
  obligationStatus, STATUS_WORDS, balanceCents, settledCents, dueDateFor,
  daysPastDue, ACCOUNTING_TERMS,
} from '../lib/obligations.js';
import { LINE_KINDS, DOOR_TERMS } from '../lib/door-economics.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const MONO = { fontFamily: '"JetBrains Mono", monospace' };
const CARD = 'bg-white border border-[#1A1815] p-4 sm:p-5';
const SUBCARD = 'bg-white border border-[#E8E4DC] p-3';
const LABEL = 'text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold';

const todayIso = () => new Date().toISOString().slice(0, 10);

/** A number we do not have is a dash, never a zero. */
function Amount({ cents, accent = null, big = false }) {
  const tone = accent === 'owe' ? 'text-[#B85838]' : accent === 'due' ? 'text-[#5A6E3D]' : 'text-[#1A1815]';
  return (
    <span className={`${big ? 'text-2xl' : 'text-sm'} ${tone}`} style={MONO}>
      {cents == null ? '—' : money(cents)}
    </span>
  );
}

/**
 * The honest empty state. It names what is missing and what would fill it —
 * never a zero that would read as a fact about the money.
 */
function Nothing({ what, how }) {
  return (
    <div className="border border-dashed border-[#E8E4DC] p-4 text-center">
      <p className="text-sm" style={SERIF}><strong>{what}</strong></p>
      {how && <p className="text-xs text-[#5A5751] mt-1" style={SERIF}>{how}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The two columns — what we owe, what is owed to us, and the net both ways.
// ---------------------------------------------------------------------------
function TwoColumns({ rows, today }) {
  const report = useMemo(() => agingReport(rows, { today }), [rows, today]);
  const net = useMemo(() => netPosition(rows, { today }), [rows, today]);
  const soon = useMemo(() => dueWithin(rows, 14, { today }), [rows, today]);

  if (!rows.length) {
    return (
      <Nothing
        what="Nothing is recorded as owed, in either direction."
        how="A bill you have agreed to pay is a payable; rent or an invoice someone owes you is a receivable. Recording one puts it here, in its aging bucket, with the paper attached."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        {DIRECTIONS.map((d) => {
          const r = report[d.id];
          return (
            <section key={d.id} className={CARD}>
              <h3 className={LABEL}>{d.business}</h3>
              <p className="text-xs text-[#5A5751] mt-0.5" style={SERIF}>{d.plain}</p>
              <div className="mt-3">
                <Amount cents={r.outstandingCents} accent={d.id === 'payable' ? 'owe' : 'due'} big />
                <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mt-1">
                  {r.count} open{r.pastDueCents > 0 ? ` · ${money(r.pastDueCents)} past due` : ' · none past due'}
                </div>
              </div>
              <p className="text-xs text-[#5A5751] mt-3 pt-3 border-t border-[#E8E4DC]" style={SERIF}>
                <strong>A child would say:</strong> {d.childExplains}
              </p>
            </section>
          );
        })}
      </div>

      {/* Net position, with BOTH halves beside it — never one number that hides
          which direction it came from (DR-0358). */}
      <section className={CARD}>
        <h3 className={LABEL}>If everything settled today</h3>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">We owe</div><Amount cents={net.weOweCents} accent="owe" /></div>
          <div><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Owed to us</div><Amount cents={net.owedToUsCents} accent="due" /></div>
          <div><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Net</div><Amount cents={net.netCents} /></div>
        </div>
        <p className="text-xs text-[#5A5751] mt-2" style={SERIF}>
          {net.favours === 'even'
            ? 'The two sides are exactly even.'
            : net.favours === 'us'
              ? 'More is owed to us than we owe — but only what actually arrives counts.'
              : 'We owe more than is owed to us.'}
        </p>
      </section>

      <section className={CARD}>
        <h3 className={LABEL}>Due in the next two weeks</h3>
        {soon.length === 0 ? (
          <p className="text-sm mt-2" style={SERIF}>Nothing falls due in the next fourteen days.</p>
        ) : (
          <ul className="mt-2 divide-y divide-[#E8E4DC]">
            {soon.map((o) => {
              const status = obligationStatus(o, { today });
              const late = daysPastDue(o, { today });
              return (
                <li key={o.id} className="py-2 flex items-baseline justify-between gap-2 flex-wrap">
                  <span className="text-sm" style={SERIF}>
                    {o.counterparty} · {o.description}
                    {o.place ? <span className="text-xs text-[#5A5751]"> · {o.place}</span> : null}
                  </span>
                  <span className="text-right">
                    <Amount cents={balanceCents(o)} accent={o.direction === 'payable' ? 'owe' : 'due'} />
                    <span className="block text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">
                      {dueDateFor(o)} · {(STATUS_WORDS[status] || {}).business || status}{late > 0 ? ` · ${late}d` : ''}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The aging ladder — the standard business buckets, every total a sum of rows.
// ---------------------------------------------------------------------------
function Aging({ rows, today }) {
  const report = useMemo(() => agingReport(rows, { today }), [rows, today]);
  if (!rows.length) {
    return <Nothing what="Nothing to age yet." how="Aging counts from a due date. Every obligation carries one, because the database refuses one without it." />;
  }
  return (
    <div className="space-y-3">
      {DIRECTIONS.map((d) => (
        <section key={d.id} className={CARD}>
          <h3 className={LABEL}>{d.business} · aging</h3>
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-sm">
              <caption className="sr-only">{d.business} by age</caption>
              <thead>
                <tr className="text-left border-b border-[#1A1815]">
                  <th scope="col" className="py-1 pr-2 text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold">Bucket</th>
                  <th scope="col" className="py-1 pr-2 text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold">What it means</th>
                  <th scope="col" className="py-1 pr-2 text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold">Count</th>
                  <th scope="col" className="py-1 text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {AGING_BUCKETS.map((b) => {
                  const cell = report[d.id].buckets[b.id];
                  return (
                    <tr key={b.id} className="border-b border-[#E8E4DC]">
                      <td className="py-1.5 pr-2" style={SERIF}>{b.business}</td>
                      <td className="py-1.5 pr-2 text-xs text-[#5A5751]" style={SERIF}>{b.plain}</td>
                      <td className="py-1.5 pr-2" style={MONO}>{cell.count}</td>
                      <td className="py-1.5 text-right"><Amount cents={cell.cents} /></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td className="py-1.5 pr-2 font-semibold" style={SERIF}>Total</td>
                  <td />
                  <td className="py-1.5 pr-2" style={MONO}>{report[d.id].count}</td>
                  <td className="py-1.5 text-right"><Amount cents={report[d.id].outstandingCents} /></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="text-xs text-[#5A5751] mt-2" style={SERIF}>
            Due today is not late. One day past is the first late bucket.
          </p>
        </section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Each door — what it cost, what arrived, and the gap. Not entered is not zero.
// ---------------------------------------------------------------------------
function Doors({ rows, lines, today }) {
  const month = `${today.slice(0, 7)}-01`;
  const byDoor = useMemo(() => {
    const map = new Map();
    for (const o of rows) {
      if (!o.rentalId || o.periodMonth !== month) continue;
      if (!map.has(o.rentalId)) map.set(o.rentalId, { place: o.place || o.rentalId, payables: [], receivables: [], settled: 0 });
      const bucket = map.get(o.rentalId);
      if (o.direction === 'payable') bucket.payables.push(o);
      else { bucket.receivables.push(o); bucket.settled += settledCents(o); }
      if (o.place) bucket.place = o.place;
    }
    return map;
  }, [rows, month]);

  if (byDoor.size === 0) {
    return (
      <Nothing
        what={`No door has anything recorded for ${month.slice(0, 7)}.`}
        how="A door's month is its cost (the mortgage and its parts, plus anything else it owes) against what the tenant actually paid. Until both are entered, this stays empty rather than showing a zero that would read as 'this door costs nothing'."
      />
    );
  }

  return (
    <div className="space-y-3">
      {[...byDoor.entries()].map(([id, d]) => {
        const cost = d.payables.reduce((t, o) => t + o.amountCents, 0);
        const billed = d.receivables.reduce((t, o) => t + o.amountCents, 0);
        const gap = d.settled - cost;
        const parts = {};
        for (const o of d.payables) for (const l of (lines[o.id] || [])) parts[l.kind] = (parts[l.kind] || 0) + l.amountCents;
        const hasParts = Object.keys(parts).length > 0;
        return (
          <section key={id} className={CARD}>
            <h3 className={LABEL}>{d.place}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              <div><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Cost</div><Amount cents={cost} accent="owe" /></div>
              <div><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Billed</div><Amount cents={billed} /></div>
              <div><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Collected</div><Amount cents={d.settled} accent="due" /></div>
              <div><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Gap</div><Amount cents={gap} accent={gap < 0 ? 'owe' : 'due'} big /></div>
            </div>
            <p className="text-xs text-[#5A5751] mt-2" style={SERIF}>
              {gap > 0 ? `The rent covered the costs and ${money(gap)} was left over.`
                : gap === 0 ? 'The rent covered the costs exactly, with nothing left over.'
                  : `The costs were ${money(Math.abs(gap))} more than what came in.`}
              {' '}The gap is measured against money that actually arrived, not what was billed.
            </p>
            {hasParts && (
              <div className="mt-3 pt-3 border-t border-[#E8E4DC]">
                <div className={LABEL}>What the payment is made of</div>
                <ul className="mt-1 grid sm:grid-cols-2 gap-1">
                  {LINE_KINDS.filter((k) => parts[k.key] != null).map((k) => (
                    <li key={k.key} className="flex items-baseline justify-between gap-2 text-sm">
                      <span style={SERIF}>{k.business}</span>
                      <Amount cents={parts[k.key]} />
                    </li>
                  ))}
                </ul>
                <p className="text-[0.625rem] text-[#5A5751] mt-1" style={SERIF}>
                  These add up to the payment exactly — the database refuses a breakdown that does not.
                </p>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The words — the business phrase, the household phrase, the child's sentence.
// ---------------------------------------------------------------------------
function Words() {
  const all = [
    ...ACCOUNTING_TERMS.map((t) => ({ name: t.term, business: t.business, household: t.household, child: t.childExplains, where: t.where })),
    ...DOOR_TERMS.map((t) => ({ name: t.business, business: t.business, household: t.household, child: t.childExplains, where: t.where })),
    ...LINE_KINDS.map((k) => ({ name: k.business, business: k.business, household: k.plain, child: k.childExplains, where: 'A line on the house payment.' })),
  ];
  return (
    <div className="space-y-3">
      <p className="text-sm" style={SERIF}>
        The business word and the household word are the same thing said twice. The third line is how
        a child is told — against this household&rsquo;s own bills, not a textbook&rsquo;s.
      </p>
      {all.map((t) => (
        <section key={t.name} className={SUBCARD}>
          <h3 className="text-sm font-semibold" style={SERIF}>{t.name}</h3>
          <p className="text-xs text-[#5A5751] mt-1" style={SERIF}><strong>In business:</strong> {t.business}</p>
          <p className="text-xs mt-0.5" style={SERIF}><strong>Here:</strong> {t.household}</p>
          <p className="text-xs mt-0.5 text-[#3F5226]" style={SERIF}><strong>A child is told:</strong> {t.child}</p>
          {t.where && <p className="text-[0.625rem] text-[#5A5751] mt-1" style={SERIF}>Where: {t.where}</p>}
        </section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
export default function Obligations() {
  const [state, setState] = useState({ loading: true, rows: [], lines: {}, error: null });
  const today = todayIso();

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await listObligations();
      if (!alive) return;
      if (!res.ok) { setState({ loading: false, rows: [], lines: {}, error: res.message }); return; }
      const lines = {};
      for (const o of res.rows) if (o.lines) lines[o.id] = o.lines;
      setState({ loading: false, rows: res.rows, lines, error: null });
    })();
    return () => { alive = false; };
  }, []);

  if (state.loading) return <div className="text-xs text-[#5A5751] p-4" style={SERIF}>Reading the ledger…</div>;

  if (state.error) {
    // Honest about WHY it is empty. The books wall denies a child and an
    // assistant by design; that is not a fault to hide behind a blank page.
    return (
      <section className={CARD}>
        <h2 className={LABEL}>Owed</h2>
        <p className="text-sm text-[#B85838] mt-2" style={SERIF}>The ledger could not be read: {state.error}</p>
        <p className="text-xs text-[#5A5751] mt-1" style={SERIF}>
          These are the books. They are kept by the owner and the admins of this household.
        </p>
      </section>
    );
  }

  const sections = [
    { id: 'owed', label: 'What is owed', icon: 'coins', render: () => <TwoColumns rows={state.rows} today={today} /> },
    { id: 'aging', label: 'Aging', icon: 'calendar', render: () => <Aging rows={state.rows} today={today} /> },
    { id: 'doors', label: 'Each door', icon: 'home', render: () => <Doors rows={state.rows} lines={state.lines} today={today} /> },
    { id: 'words', label: 'The words', icon: 'book', render: () => <Words /> },
  ];

  return (
    <div className="space-y-4">
      <section className={SUBCARD}>
        <h2 className={LABEL}>Owed · what is owed, what was paid, and the paper that proves it</h2>
        <p className="text-xs text-[#5A5751] mt-1" style={SERIF}>
          Every number here is a sum of rows you can open. A payment is never rewritten — a correction is
          recorded, not edited. Where nothing has been entered, it says so instead of showing a zero.
        </p>
      </section>
      <SectionTabs sections={sections} ariaLabel="Ledger sections" idBase="owed" defaultId="owed" />
    </div>
  );
}
