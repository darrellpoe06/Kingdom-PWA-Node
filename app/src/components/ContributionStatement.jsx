// =============================================================================
// ContributionStatement — the office issues the annual statement (DR-1073)
// =============================================================================
// DR-1064 built the Pub 1771 statement and nothing rendered it; the giving book
// (migration 0214) already held what the church received. This is where a
// steward actually issues one, and every refusal is shown as words on the page
// rather than an empty document.
//
// REALITY-TRACE (DR-0061):
//   1. REAL DATA — `church_giving_claims` through `fetchClaims`, already loaded
//      by the giving book this renders inside; the church's own profile row for
//      the issuer's legal name, address and EIN.
//   2. END TO END — the signed-in office view, RLS-gated (a member calling the
//      book gets 'forbidden', not an empty book).
//   3. THE SURFACE — Church → Giving book → Reports, under the person selector
//      that already exists, because "one person's record" and "one person's tax
//      statement" are the same question asked twice.
//   4. ASSUMPTION STATED — a year is chosen explicitly. Deriving it from
//      today's date would issue last year's statement in January and this
//      year's in December without anyone saying which they meant.
import React, { useMemo, useState } from 'react';
import { statementFromClaims, statementToText, BASIS } from '../lib/giving-statement-source.js';
import { titheTaxNote, contemporaneousCheck } from '../lib/giving-statement.js';
import { downloadText } from '../lib/report-export.js';

const labelCls = 'block text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-1';
const fieldCls = 'w-full text-sm p-2 border border-[#1A1815] bg-white';
const serif = { fontFamily: '"Fraunces", serif' };
// A keyboard user has to be able to see where they are, and this button hands
// somebody a tax document — the last place to make it hard to tell.
const RING = 'focus:outline focus:outline-2 focus:outline-[#B85838]';

/** The years the book actually holds, newest first. Never a guessed range. */
export function yearsInClaims(claims = []) {
  const set = new Set();
  for (const c of claims) {
    const y = String((c && c.givenOn) || '').slice(0, 4);
    if (/^\d{4}$/.test(y)) set.add(y);
  }
  return [...set].sort().reverse();
}

export default function ContributionStatement({ claims = [], batches = [], church = {}, giverKey = '', giverLabel = '' }) {
  const years = useMemo(() => yearsInClaims(claims), [claims]);
  const [year, setYear] = useState(() => years[0] || '');
  // The one clock in this feature, read once per render of the panel.
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [kind, ...rest] = String(giverKey || '').split(':');
  const value = rest.join(':');
  const parishionerId = kind === 'id' ? value : null;
  const giverName = kind === 'raw' ? value : null;
  const memberName = giverLabel || giverName || '';

  const res = useMemo(() => {
    if (!giverKey || !year) return null;
    return statementFromClaims({
      claims, batches, church, year: Number(year),
      member: { name: memberName },
      // WHEN IT WAS ISSUED, stamped here rather than left blank: a statement
      // has to be in the giver's hands before they file, and
      // `contemporaneousCheck` can only say so if it knows the date (DR-1063 —
      // when it happened and when it was written down are different facts).
      // The clock lives in the component on purpose; the libraries stay pure.
      issuedOn: today,
      parishionerId, giverName,
    });
  }, [claims, batches, church, year, memberName, parishionerId, giverName, giverKey, today]);

  // IN TIME, OR LATE AND SAID SO. A statement handed over after the filing due
  // date is still the church's record, but the member needs to know.
  const timing = useMemo(() => contemporaneousCheck(Number(year), today), [year, today]);

  if (!giverKey) return null;

  const download = () => {
    if (!res || !res.ok) return;
    const name = `contribution-statement-${year}-${memberName.replace(/[^\w]+/g, '-').toLowerCase()}.txt`;
    downloadText(statementToText(res.statement, res.source), name, 'text/plain;charset=utf-8');
  };

  return (
    <section className="border border-[#1A1815] p-3 space-y-3" aria-labelledby="cs-h" data-testid="contribution-statement">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h4 id="cs-h" className={labelCls}>Annual contribution statement</h4>
          <p className="text-xs text-[#5A5751]" style={serif}>
            The document {memberName || 'this giver'} gives their tax preparer. Issued from the church’s own record of gifts received.
          </p>
        </div>
        <div>
          <label className={labelCls} htmlFor="cs-year">Tax year</label>
          <select id="cs-year" className={fieldCls} style={{ maxWidth: '8rem' }} value={year} onChange={(e) => setYear(e.target.value)}>
            {years.length === 0 && <option value="">—</option>}
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* WHY A NUMBER MIGHT LOOK SHORT, said before the number. */}
      {res && res.source && res.source.notices.map((n) => (
        <p key={n} className="text-xs text-[#1A1815] leading-relaxed" style={serif} data-testid="cs-notice">{n}</p>
      ))}

      {res && !res.ok && (
        <p className="text-sm text-[#1A1815] leading-relaxed" style={serif} role="status" data-testid="cs-refusal">
          {res.message}
        </p>
      )}

      {res && res.ok && (
        <>
          <dl className="text-sm" style={serif} data-testid="cs-body">
            <div className="flex justify-between gap-2 border-t border-[#E8E4DC] py-1">
              <dt className="text-[#5A5751]">Given in {res.statement.year}</dt>
              <dd className="font-semibold">{res.statement.total}</dd>
            </div>
            {res.statement.deductibleCents !== res.statement.totalCents && (
              <div className="flex justify-between gap-2 border-t border-[#E8E4DC] py-1">
                <dt className="text-[#5A5751]">Of that, deductible</dt>
                <dd>{res.statement.deductible}</dd>
              </div>
            )}
            <div className="flex justify-between gap-2 border-t border-[#E8E4DC] py-1">
              <dt className="text-[#5A5751]">Gifts counted</dt>
              <dd>{res.statement.gifts.length}</dd>
            </div>
            {res.statement.countOverThreshold > 0 && (
              <div className="flex justify-between gap-2 border-t border-[#E8E4DC] py-1">
                <dt className="text-[#5A5751]">Needing this written receipt</dt>
                <dd>{res.statement.countOverThreshold}</dd>
              </div>
            )}
          </dl>

          <p className="text-xs text-[#1A1815] leading-relaxed" style={serif}>{res.statement.goodsStatement}</p>

          {res.statement.warnings.length > 0 && (
            <ul className="text-xs text-[#1A1815] leading-relaxed list-disc pl-4 space-y-1" data-testid="cs-warnings">
              {res.statement.warnings.map((w) => <li key={w} style={serif}>{w}</li>)}
            </ul>
          )}

          {timing.message && (
            <p className="text-xs text-[#1A1815] leading-relaxed" style={serif} data-testid="cs-timing">{timing.message}</p>
          )}
          <p className="text-xs text-[#5A5751] leading-relaxed" style={serif}>{res.statement.provenance}</p>
          <p className="text-xs text-[#5A5751] leading-relaxed" style={serif} data-testid="cs-teaching">
            {titheTaxNote(res.statement)}
          </p>

          <button type="button" onClick={download} className={`text-[0.625rem] uppercase tracking-wider border border-[#1A1815] px-2 py-1 ${RING}`} data-testid="cs-download">
            Download the statement
          </button>
          {res.source.basis === BASIS.sender && (
            <p className="text-[0.625rem] text-[#8A857C]">Built from the sender’s name on the gift, not a member account.</p>
          )}
        </>
      )}
    </section>
  );
}
