// =============================================================================
// ChurchGiving — the "Give to the church" floater + panel (Church surfaces).
// =============================================================================
// Mirrors the persistent 💬 Feedback floater pattern (a fixed pill button that
// opens a clean panel), but is its OWN distinct surface: a "Give" floater that
// shows only on the Church tab, sits bottom-RIGHT (Feedback owns bottom-left),
// and carries a giving-green pill instead of the rust feedback one.
//
// What it does:
//   - Links OUT to the congregation's OWN confirmed giving destination
//     (resolveGiveDestination, lib/giving.js). LINK SAFETY: it never invents a
//     giving/payment URL, and no payment data touches this app — we point at the
//     church's existing secure page. If no link is configured it shows a clearly
//     marked "needs the church's giving URL" state, never a guessed link.
//   - Presents the BENEFITS OF GIVING ACCORDING TO THE WORD — the scripture,
//     drawn faithfully (GIVING_SCRIPTURES + GIVING_DOCTRINE, lib/giving.js):
//     10% tithe baseline, generosity above it, the cheerful-giver heart, and the
//     bright line against prosperity gospel (worship/stewardship, not a promised
//     return).
//
// UNBREAKABLE + accessible by construction:
//   - Cross-device icon: an INLINE SVG gift (stroke=currentColor), never an
//     emoji — same lesson as the tofu fix (UiIcon.jsx). It renders identically
//     on every device and is automatically contrast-correct in every theme.
//   - Theme-safe: themeable Tailwind classes only (no inline color styles), so
//     the contrast guard's per-theme AA holds in light AND midnight — no
//     white-on-white, no black-on-dark.
//   - Text-size: rem-based classes + a 1em icon scale with the global
//     large-print primitive (lib/text-size.js) for free.
//   - Keyboard: Escape closes; focus moves to the panel on open; the overlay
//     click and an explicit Close button both dismiss.
// =============================================================================
import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { resolveGiveDestination, GIVING_CHANNELS, GIVING_SCRIPTURES, GIVING_DOCTRINE } from '../lib/giving.js';
import { useIdleReveal } from '../lib/use-idle-reveal.js';
import { callToGiveCoverage, TRANSCRIPT_PIPELINE_NOTE, LINKED_SERVICE_VIDEO } from '../lib/call-to-give.js';
import { fetchCallToGiveArchive } from '../lib/call-to-give-sync.js';
import {
  fetchMyGiving, recordGiving, removeGiving,
  GIVING_FUNDS, GIVING_METHODS, RECORD_PROVENANCE, RECORD_PRIVACY,
  blankDraft, validateGivingDraft, localToday,
  fundLabel, methodLabel, formatMoney,
  yearsOf, recordsInYear, summarizeGiving, sortByDateDesc,
} from '../lib/giving-records-sync.js';

// Inline gift icon — wrapped box + ribbon + bow. 24x24 grid, stroke currentColor
// so it inherits the surrounding text color (contrast-correct in every theme)
// and 1em so it tracks the global text size. Decorative; the text label carries
// the meaning, so it is aria-hidden.
function GiftIcon({ className = '', strokeWidth = 1.9 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`inline-block shrink-0 ${className}`}
      style={{ verticalAlign: '-0.125em' }}
    >
      <rect x="4" y="10" width="16" height="10.5" rx="1" />
      <rect x="3" y="6.5" width="18" height="3.5" rx="0.5" />
      <line x1="12" y1="6.5" x2="12" y2="20.5" />
      <path d="M12 6.5S10.6 3.2 8.4 4c-1.6.6-1.1 2.9.8 2.5 1-.2 2.8 0 2.8 0Z" />
      <path d="M12 6.5S13.4 3.2 15.6 4c1.6.6 1.1 2.9-.8 2.5-1-.2-2.8 0-2.8 0Z" />
    </svg>
  );
}

// CallToGiveArchive — the church's own Call to Give, sourced from OUR services
// (DR-0134). Derived live: the same choir_sermons corpus + the same
// video_transcripts rows the sermon library reads; detected segments always
// carry needs-review until the church confirms them. Signed-out visitors (RLS)
// get the honest signed-in note, never a painted archive.
export function CallToGiveArchive() {
  const [state, setState] = useState({ loading: true, archive: [], error: false });
  const load = React.useCallback(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: false }));
    fetchCallToGiveArchive()
      .then(({ archive }) => { if (alive) setState({ loading: false, archive, error: false }); })
      // A real fetch/RLS FAILURE is NOT the same as "no rows" — don't tell a
      // signed-in member to "sign in" when the read errored (DR-0076 honest states).
      .catch(() => { if (alive) setState({ loading: false, archive: [], error: true }); });
    return () => { alive = false; };
  }, []);
  useEffect(() => load(), [load]);

  const cov = callToGiveCoverage(state.archive);
  const detected = state.archive.filter((r) => r.segment).slice(0, 5);

  return (
    <div className="mt-6 pt-5 border-t border-[#E8E4DC]">
      <h4 className="text-base sm:text-lg text-[#1A1815] mb-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>
        The Call to Give — from our own services
      </h4>
      <p className="text-xs text-[#5A5751] leading-relaxed mb-2">
        Sourced from the same service videos and transcripts the sermon library reads — measured, never assumed.
        {' '}{TRANSCRIPT_PIPELINE_NOTE.answer}
      </p>

      {state.loading ? (
        <p className="text-xs text-[#5A5751]" role="status">Reading the service archive…</p>
      ) : state.error ? (
        <div className="border border-[#B85838] bg-[#FAF8F4] p-3" role="alert">
          <p className="text-xs text-[#1A1815] leading-relaxed">
            Couldn&rsquo;t load the service archive just now — this is a connection hiccup, not a sign-in problem.{' '}
            <button type="button" onClick={load} className="underline underline-offset-2 text-[#B85838] hover:text-[#1A1815]">Try again</button>.
          </p>
        </div>
      ) : state.archive.length === 0 ? (
        <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3" role="status">
          <p className="text-xs text-[#5A5751] leading-relaxed">
            No service rows are readable from here — sign in as a church member to see the archive. Nothing is shown that isn&rsquo;t real.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-2 py-0.5 text-[0.6875rem] border border-[#C9C2B6] bg-[#FAF8F4] text-[#1A1815]">{cov.corpus} service videos</span>
            <span className="px-2 py-0.5 text-[0.6875rem] border border-[#C9C2B6] bg-[#FAF8F4] text-[#1A1815]">{cov.withTranscript} transcribed</span>
            <span className="px-2 py-0.5 text-[0.6875rem] border border-[#C9C2B6] bg-[#FAF8F4] text-[#1A1815]">{cov.detected} Call-to-Give segments found</span>
            <span className="px-2 py-0.5 text-[0.6875rem] border border-[#C9C2B6] bg-[#FAF8F4] text-[#5A5751]">{cov.awaiting} awaiting transcript</span>
          </div>
          {detected.length === 0 ? (
            <p className="text-xs text-[#5A5751] leading-relaxed">
              No giving-appeal segments detected in the transcribed services yet — detection only runs where a real transcript exists, and it proposes; the church confirms.
            </p>
          ) : (
            <ul className="space-y-3">
              {detected.map((r) => (
                <li key={r.videoId} className="border-l-2 border-[#5A6E3D] pl-3">
                  <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold">
                    {r.serviceDate || 'undated'}{r.title ? ` — ${r.title}` : ''}
                  </div>
                  <p className="text-sm text-[#1A1815] leading-relaxed italic" style={{ fontFamily: '"Fraunces", serif' }}>
                    “{r.segment.excerpt}”
                  </p>
                  <p className="text-[0.6875rem] text-[#5A5751] mt-1">
                    confidence: {r.segment.confidence} · needs church review ·{' '}
                    <a href={r.youtubeUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-[#1A1815]">watch the service</a>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <p className="text-[0.6875rem] text-[#5A5751] mt-3 leading-relaxed">
        Latest linked service:{' '}
        <a href={LINKED_SERVICE_VIDEO.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-[#1A1815]">
          youtube.com/live/{LINKED_SERVICE_VIDEO.videoId}
        </a>
        {' '}— {LINKED_SERVICE_VIDEO.provenance}.
      </p>
    </div>
  );
}

// MyGivingRecord — the parishioner's OWN giving history (DR-0184 table).
// Darrell 2026-09-08: "parishioners can give tithes offerings and gifts... also
// keep their history."
//
// WHAT THIS IS, AND WHAT IT REFUSES TO PRETEND TO BE. The app never touches
// payment data (link-safety, lib/giving.js) — so this cannot be a feed of what
// the church received. It is the giver's own ledger of gifts they made, and the
// surface says exactly that (RECORD_PROVENANCE) above every total, so no one
// mistakes it for a church-issued contribution statement.
//
// HONEST STATES (DR-0076): signed-out, no-church, a failed read, and an empty
// record each render a DIFFERENT true thing. A read that errored never tells a
// signed-in member to sign in, and an empty ledger is never a painted $0 total.
function MyGivingRecord() {
  const [state, setState] = useState({ loading: true, records: [], reason: null });
  const [draft, setDraft] = useState(() => blankDraft());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [justSaved, setJustSaved] = useState(false);
  const [year, setYear] = useState('all');
  const [formOpen, setFormOpen] = useState(false);

  const load = React.useCallback(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    fetchMyGiving()
      .then((res) => { if (alive) setState({ loading: false, records: res.records || [], reason: res.ok ? null : res.reason }); })
      .catch(() => { if (alive) setState({ loading: false, records: [], reason: 'error' }); });
    return () => { alive = false; };
  }, []);
  useEffect(() => load(), [load]);

  const years = yearsOf(state.records);
  const shown = sortByDateDesc(recordsInYear(state.records, year));
  const summary = summarizeGiving(shown);

  async function submit(e) {
    e.preventDefault();
    setSaveError('');
    const check = validateGivingDraft(draft);
    setErrors(check.errors);
    if (!check.ok) return;
    setSaving(true);
    const res = await recordGiving(draft);
    setSaving(false);
    if (res.ok) {
      setState((s) => ({ ...s, records: [res.record, ...s.records] }));
      setDraft(blankDraft());
      setErrors({});
      setJustSaved(true);
      setFormOpen(false);
      setTimeout(() => setJustSaved(false), 4000);
      return;
    }
    if (res.reason === 'invalid') { setErrors(res.errors || {}); return; }
    setSaveError(
      res.reason === 'signed-out' ? 'Sign in to keep your giving record — it is saved to your account, not this device.'
      : res.reason === 'no-church' ? 'Your account isn’t linked to the church yet, so there’s nowhere to file this. Ask the church office to add you.'
      : 'That didn’t save — a connection problem, not something you did. Try again.',
    );
  }

  async function remove(rec) {
    const ok = typeof window !== 'undefined' && window.confirm
      ? window.confirm(`Remove your ${formatMoney(rec.cents)} ${fundLabel(rec.fund).toLowerCase()} from ${rec.givenOn}? This only removes YOUR record of it.`)
      : true;
    if (!ok) return;
    const res = await removeGiving(rec.remoteUuid);
    if (res.ok) setState((s) => ({ ...s, records: s.records.filter((r) => r.remoteUuid !== rec.remoteUuid) }));
    else setSaveError('Couldn’t remove that entry just now. Try again.');
  }

  // Download the shown record as CSV — a person's giving record is theirs to
  // keep, and tax season is the reason they kept it. Built from the SAME rows
  // rendered above, so the file can never disagree with the screen.
  function downloadCsv() {
    const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const header = ['Date', 'Amount', 'Fund', 'Designation', 'How', 'Reference', 'Note'];
    const lines = [header.map(esc).join(',')].concat(
      shown.map((r) => [r.givenOn, (r.cents / 100).toFixed(2), fundLabel(r.fund), r.fundNote, methodLabel(r.method), r.reference, r.note].map(esc).join(',')),
    );
    lines.push([`Total (${year === 'all' ? 'all years' : year})`, (summary.totalCents / 100).toFixed(2), '', '', '', '', 'Giver’s own record — not a church-issued statement'].map(esc).join(','));
    try {
      const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-giving-record-${year === 'all' ? 'all' : year}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setSaveError('This device blocked the download. Your record is still safe in your account.');
    }
  }

  const fieldErr = (k) => (errors[k] ? <span className="block text-[0.6875rem] text-[#B85838] mt-0.5">{errors[k]}</span> : null);
  const inputCls = 'w-full border border-[#C9C2B6] bg-white text-[#1A1815] px-2 py-2 text-sm min-h-[44px] focus:outline focus:outline-2 focus:outline-[#5A6E3D]';
  const labelCls = 'block text-[0.625rem] uppercase tracking-[0.2em] text-[#5A5751] font-semibold mb-1';

  return (
    <div className="mt-6 pt-5 border-t border-[#E8E4DC]">
      <h4 className="text-base sm:text-lg text-[#1A1815] mb-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>
        My giving record
      </h4>
      <p className="text-xs text-[#5A5751] leading-relaxed mb-3">{RECORD_PROVENANCE}</p>

      {state.loading ? (
        <p className="text-xs text-[#5A5751]" role="status">Opening your giving record…</p>
      ) : state.reason === 'signed-out' ? (
        <div className="border border-[#C9C2B6] bg-[#FAF8F4] p-3" role="status">
          <p className="text-xs text-[#5A5751] leading-relaxed">
            Sign in to keep a record of your tithes, offerings and gifts. It saves to your account, so it follows you to any device — and it stays private to you.
          </p>
        </div>
      ) : state.reason === 'no-church' ? (
        <div className="border border-[#C9C2B6] bg-[#FAF8F4] p-3" role="status">
          <p className="text-xs text-[#5A5751] leading-relaxed">
            Your account isn’t linked to the church yet, so there’s nowhere to file a record. Ask the church office to add you — giving itself works right now through the channels above.
          </p>
        </div>
      ) : state.reason === 'error' ? (
        <div className="border border-[#B85838] bg-[#FAF8F4] p-3" role="alert">
          <p className="text-xs text-[#1A1815] leading-relaxed">
            Couldn’t open your giving record just now — a connection problem, not a sign-in problem.{' '}
            <button type="button" onClick={load} className="underline underline-offset-2 text-[#B85838] hover:text-[#1A1815]">Try again</button>.
          </p>
        </div>
      ) : (
        <>
          {/* THE TOTALS — derived from the rows below, never stored, so a total
              can never disagree with the gifts under it. */}
          {summary.count > 0 && (
            <div className="border-2 border-[#5A6E3D] bg-[#FAF8F4] p-3 mb-3">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold">
                    {year === 'all' ? 'All years' : year} · you recorded
                  </div>
                  <div className="text-2xl text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>
                    {formatMoney(summary.totalCents)}
                  </div>
                  <div className="text-[0.6875rem] text-[#5A5751]">
                    {summary.count} {summary.count === 1 ? 'gift' : 'gifts'}
                    {summary.firstDate ? ` · ${summary.firstDate} to ${summary.lastDate}` : ''}
                  </div>
                </div>
                {years.length > 0 && (
                  <div>
                    <label className={labelCls} htmlFor="giving-year">Year</label>
                    <select id="giving-year" value={year} onChange={(e) => setYear(e.target.value)} className="border border-[#C9C2B6] bg-white text-[#1A1815] px-2 py-2 text-sm min-h-[44px] focus:outline focus:outline-2 focus:outline-[#5A6E3D]">
                      <option value="all">All years</option>
                      {years.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                )}
              </div>
              {summary.byFund.length > 0 && (
                <ul className="flex flex-wrap gap-2 mt-2">
                  {summary.byFund.map((f) => (
                    <li key={f.id} className="px-2 py-0.5 text-[0.6875rem] border border-[#C9C2B6] bg-white text-[#1A1815]">
                      {f.label}: {formatMoney(f.cents)} <span className="text-[#5A5751]">({f.count})</span>
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" onClick={downloadCsv} className="mt-2 text-[0.6875rem] uppercase tracking-wider underline underline-offset-2 text-[#5A6E3D] hover:text-[#1A1815] min-h-[44px] focus:outline focus:outline-2 focus:outline-[#1A1815]">
                Download this record (CSV)
              </button>
            </div>
          )}

          {justSaved && (
            <p className="text-xs text-[#5A6E3D] font-semibold mb-2" role="status">Recorded. Thank you for your faithfulness.</p>
          )}

          {/* RECORD A GIFT — collapsed by default so the Word and the channels
              keep the top of the panel; one tap opens the form. */}
          {!formOpen ? (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#5A6E3D] bg-white text-[#5A6E3D] text-sm uppercase tracking-wider font-semibold hover:bg-[#5A6E3D] hover:text-white min-h-[48px] focus:outline focus:outline-2 focus:outline-[#1A1815]"
            >
              <GiftIcon /> Record a gift I gave
            </button>
          ) : (
            <form onSubmit={submit} className="border border-[#C9C2B6] bg-[#FAF8F4] p-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="giving-amount">Amount</label>
                  <input id="giving-amount" inputMode="decimal" autoComplete="off" placeholder="$0.00" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} className={inputCls} />
                  {fieldErr('amount')}
                </div>
                <div>
                  <label className={labelCls} htmlFor="giving-date">Day you gave</label>
                  <input id="giving-date" type="date" max={localToday()} value={draft.givenOn} onChange={(e) => setDraft({ ...draft, givenOn: e.target.value })} className={inputCls} />
                  {fieldErr('givenOn')}
                </div>
                <div>
                  <label className={labelCls} htmlFor="giving-fund">What it was for</label>
                  <select id="giving-fund" value={draft.fund} onChange={(e) => setDraft({ ...draft, fund: e.target.value })} className={inputCls}>
                    {GIVING_FUNDS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>
                  {fieldErr('fund')}
                </div>
                <div>
                  <label className={labelCls} htmlFor="giving-method">How you gave</label>
                  <select id="giving-method" value={draft.method} onChange={(e) => setDraft({ ...draft, method: e.target.value })} className={inputCls}>
                    {GIVING_METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                  {fieldErr('method')}
                </div>
              </div>
              {draft.fund === 'other' && (
                <div>
                  <label className={labelCls} htmlFor="giving-fundnote">Name it in your own words</label>
                  <input id="giving-fundnote" value={draft.fundNote} onChange={(e) => setDraft({ ...draft, fundNote: e.target.value })} className={inputCls} />
                  {fieldErr('fundNote')}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="giving-ref">Reference <span className="normal-case tracking-normal text-[#5A5751]">(optional)</span></label>
                  <input id="giving-ref" placeholder="check no., confirmation" value={draft.reference} onChange={(e) => setDraft({ ...draft, reference: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="giving-note">Note <span className="normal-case tracking-normal text-[#5A5751]">(optional)</span></label>
                  <input id="giving-note" placeholder="harvest offering, in memory of…" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} className={inputCls} />
                </div>
              </div>
              {saveError && <p className="text-xs text-[#B85838] leading-relaxed" role="alert">{saveError}</p>}
              <div className="flex gap-2 flex-wrap">
                <button type="submit" disabled={saving} className="px-4 py-3 bg-[#5A6E3D] text-white text-sm uppercase tracking-wider font-semibold border-2 border-[#5A6E3D] hover:bg-[#1A1815] hover:border-[#1A1815] min-h-[48px] disabled:opacity-60 focus:outline focus:outline-2 focus:outline-[#1A1815]">
                  {saving ? 'Saving…' : 'Save to my record'}
                </button>
                <button type="button" onClick={() => { setFormOpen(false); setErrors({}); setSaveError(''); }} className="px-4 py-3 border-2 border-[#C9C2B6] text-[#1A1815] text-sm uppercase tracking-wider font-semibold hover:border-[#1A1815] min-h-[48px] focus:outline focus:outline-2 focus:outline-[#1A1815]">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* THE HISTORY. An empty record says so plainly — it never paints a $0. */}
          {shown.length === 0 ? (
            <p className="text-xs text-[#5A5751] leading-relaxed mt-3">
              {state.records.length === 0
                ? 'Nothing recorded yet. Give through one of the channels above, then record it here so you keep your own history.'
                : `No gifts recorded in ${year}.`}
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {shown.map((r) => (
                <li key={r.remoteUuid || r.id} className="flex items-baseline justify-between gap-3 border-l-2 border-[#5A6E3D] pl-3 py-1">
                  <div className="min-w-0">
                    <div className="text-sm text-[#1A1815]">
                      <span className="font-semibold">{formatMoney(r.cents)}</span>{' '}
                      <span className="text-[#5A5751]">— {fundLabel(r.fund)}{r.fund === 'other' && r.fundNote ? `: ${r.fundNote}` : ''}</span>
                    </div>
                    <div className="text-[0.6875rem] text-[#5A5751]">
                      {r.givenOn} · {methodLabel(r.method)}{r.reference ? ` · ${r.reference}` : ''}{r.note ? ` · ${r.note}` : ''}
                    </div>
                  </div>
                  <button type="button" onClick={() => remove(r)} aria-label={`Remove your record of ${formatMoney(r.cents)} given on ${r.givenOn}`} className="shrink-0 text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-[#5A6E3D]">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* WHY IT IS PRIVATE — doctrine, not a settings default. */}
          <div className="mt-4 border-l-2 border-[#5A6E3D] pl-3">
            <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold">
              {RECORD_PRIVACY.translation} — {RECORD_PRIVACY.ref}
            </div>
            <p className="text-sm text-[#1A1815] leading-relaxed italic" style={{ fontFamily: '"Fraunces", serif' }}>
              “{RECORD_PRIVACY.text}”
            </p>
            <p className="text-[0.6875rem] text-[#5A5751] leading-relaxed mt-1">{RECORD_PRIVACY.note}</p>
          </div>
        </>
      )}
    </div>
  );
}

export function ChurchGivePanel({ church, onClose }) {
  const panelRef = useRef(null);
  const dest = resolveGiveDestination(church);

  // Escape closes; focus the panel on open (accessible dialog behavior).
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    try { panelRef.current?.focus(); } catch (_) { /* ignore */ }
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      data-read-skip className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 print:hidden"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="give-panel-title"
        className="bg-white border-2 border-[#1A1815] max-w-2xl w-full max-h-[90vh] overflow-y-auto focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <div>
              <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#5A6E3D] font-semibold mb-1 flex items-center gap-1.5">
                <GiftIcon /> Give to the church
              </div>
              <h3 id="give-panel-title" className="text-xl sm:text-2xl text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>
                {church?.name || 'Give to the church'}
              </h3>
            </div>
            <button type="button" onClick={onClose} className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#5A6E3D]">× Close</button>
          </div>

          {/* THE WORD FIRST (Darrell 2026-07-27): the popup gives priority to
              the Word of Yahweh — the teaching leads, the channels follow. */}
          <div className="mb-4 border-l-2 border-[#5A6E3D] pl-3">
            <h4 className="text-base sm:text-lg text-[#1A1815] mb-1.5" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>
              {GIVING_DOCTRINE.heading}
            </h4>
            <div className="space-y-1.5">
              <p className="text-sm text-[#5A5751] leading-relaxed">{GIVING_DOCTRINE.tithe}</p>
              <p className="text-sm text-[#5A5751] leading-relaxed">{GIVING_DOCTRINE.heart}</p>
              <p className="text-sm text-[#1A1815] leading-relaxed font-medium">{GIVING_DOCTRINE.brightLine}</p>
            </div>
          </div>

          {/* THE CHURCH'S OWN GIVING CHANNELS (DR-0136) — decoded verbatim from
              the church's GIVE ONLINE slide. One tap on a phone opens the
              channel; the QR is there for a second device to scan. Slide order
              kept: Zelle, Cash App, Givelify, PayPal. */}
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold mb-2">Where to give</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            {GIVING_CHANNELS.map((ch) => (
              <a
                key={ch.id}
                href={ch.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 border-2 border-[#5A6E3D] bg-[#FAF8F4] p-3 min-h-[64px] hover:bg-white focus:outline focus:outline-2 focus:outline-[#1A1815]"
              >
                <span className="shrink-0 bg-white p-1 border border-[#E8E4DC]" aria-hidden="true">
                  <QRCodeSVG value={ch.url} size={52} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[#1A1815]">{ch.label}</span>
                  <span className="block text-[0.6875rem] text-[#5A6E3D] truncate">{ch.display}</span>
                  <span className="block text-[0.6875rem] text-[#5A5751] leading-snug">{ch.how}</span>
                </span>
              </a>
            ))}
          </div>
          <p className="text-[0.6875rem] text-[#5A5751] mb-3 leading-relaxed">
            These are the church&rsquo;s own published channels, taken exactly from its GIVE ONLINE slide.
            The app only opens them — no payment information is collected here.
          </p>

          {/* MY GIVING RECORD — the history Darrell asked for (2026-09-08),
              placed directly under the channels so the flow reads the way a
              parishioner actually moves: give through the church's own channel,
              then record it here. */}
          <MyGivingRecord />

          {/* SECONDARY — the church's website, where giving is also published.
              Never an invented URL; if none is configured, a flagged state. */}
          {dest.url ? (
            <>
              <a
                href={dest.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#5A6E3D] text-white text-sm uppercase tracking-wider font-semibold border-2 border-[#5A6E3D] hover:bg-[#1A1815] hover:border-[#1A1815] min-h-[48px] focus:outline focus:outline-2 focus:outline-[#1A1815]"
              >
                <GiftIcon /> {dest.confirmed ? 'Give on the church website' : 'Church website — giving page is one step in'}
              </a>
              <p className="text-[0.6875rem] text-[#5A5751] mt-2 leading-relaxed">{dest.note}</p>
              {/* Landing someone on a homepage with no directions is what cost
                  Darrell the flow in front of the COLG leadership, 2026-09-11:
                  "is this the pay page? No... we wanted the actual Menu, Tithes
                  and Offering guest page." Until the office hands over that
                  deep-link, the app says the two taps rather than guessing a URL
                  (never invent a giving address — lib/giving.js). */}
              {!dest.confirmed && dest.hint && (
                <p className="text-[0.6875rem] text-[#1A1815] mt-1 leading-relaxed font-medium border-l-2 border-[#5A6E3D] pl-2">
                  {dest.hint}
                </p>
              )}
              {!dest.confirmed && (
                <p className="text-[0.6875rem] text-[#B85838] mt-1 leading-relaxed">
                  This opens the church website, not the giving page itself. Once the office gives us the direct link to that page, this button will open it in one tap.
                </p>
              )}
            </>
          ) : (
            <div className="border-2 border-[#B85838] bg-[#FAF8F4] p-3" role="status">
              <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">Giving link needed</div>
              <p className="text-xs text-[#5A5751] leading-relaxed">
                This church’s online giving link has not been provided yet. Add the church’s own secure giving URL in Settings, and this button will open it. We never link to a guessed address, and no payment information is collected by this app.
              </p>
            </div>
          )}

          {/* THE WORD — the anchor scriptures, drawn faithfully. (The doctrine
              summary leads the panel above; the full witnesses live here.) */}
          <div className="mt-6 pt-5 border-t border-[#E8E4DC]">
            <h4 className="text-base sm:text-lg text-[#1A1815] mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>
              The anchor scriptures
            </h4>
            <ul className="space-y-3">
              {GIVING_SCRIPTURES.map((s) => (
                <li key={s.ref} className="border-l-2 border-[#5A6E3D] pl-3">
                  <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold">
                    {s.translation} — {s.ref}
                  </div>
                  <p className="text-sm text-[#1A1815] leading-relaxed italic" style={{ fontFamily: '"Fraunces", serif' }}>
                    “{s.text}”
                  </p>
                  <p className="text-xs text-[#5A5751] leading-relaxed mt-1">{s.benefit}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* The Call to Give, sourced from our own services (DR-0134) */}
          <CallToGiveArchive />
        </div>
      </div>
    </div>
  );
}

// ChurchGiveFloater — the persistent pill on Church surfaces. Distinct from the
// Give floater: bottom-RIGHT, stacked ABOVE the TTS floater (bottom-20 vs the
// TTS bar's bottom-4) so the two never pile on one corner — giving-green, gift
// icon. Manages its own open state so the monolith wiring is a single mount.
//
// THE WORD GETS PRIORITY (Darrell 2026-07-27, from live screenshots of L58: the
// pill sat on top of the lesson text). This floater now conforms to the standing
// floater Way — Darrell 2026-07-14 ("move out the way after a certain amount of
// time and come up when the users move the screen as gentle reminders") +
// REV-0235 compact-when-idle, the exact behavior the Feedback pill already has:
// at rest it settles to a dim 48px icon-only circle so it stops occluding the
// Word beneath; any scroll/touch re-reveals the full labeled pill as the gentle
// "you know where to give" reminder. Same idle hook, same motion, same tap
// target minimums — one Way, every floater.
export function ChurchGiveFloater({ church }) {
  const [open, setOpen] = React.useState(false);
  const reveal = useIdleReveal(); // idle-dim + reveal-on-scroll (Pattern 2d)
  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Give to the church"
          title="Give to the church — and the blessing of giving according to the Word"
          className={`ts-chrome-region fixed bottom-20 right-4 z-30 inline-flex items-center justify-center gap-1.5 bg-[#5A6E3D] text-white text-xs uppercase tracking-wider font-semibold border-2 border-[#5A6E3D] hover:bg-[#1A1815] hover:border-[#1A1815] shadow-lg min-h-[48px] min-w-[48px] focus:outline focus:outline-2 focus:outline-[#1A1815] print:hidden transition-all duration-500 hover:opacity-100 focus:opacity-100 ${reveal ? 'px-4 py-3 opacity-100 translate-y-0' : 'p-0 w-12 h-12 opacity-40 translate-y-1'}`}
          style={{ borderRadius: '999px' }}
        >
          <GiftIcon />{reveal ? <span>Give</span> : null}
        </button>
      )}
      {open && <ChurchGivePanel church={church} onClose={() => setOpen(false)} />}
    </>
  );
}

// ChurchGiveHeaderButton — GIVE, ALWAYS AT THE TOP (Darrell 2026-09-08, from
// the live Love Corner door): "always have a give button at the top so it's
// always there... not just the floating button." Clarified minutes later: "at
// the top of the App in the area that's always there... except when it folds
// away with the header etc" — so this rides the header control row beside
// Subscribe / Install, and folding away with the header is exactly right.
//
// WHY BOTH THIS AND THE FLOATER, not one or the other. They answer different
// moments and neither replaces the other: the floater is the gentle reminder
// that surfaces where a member is already reading (and dims out of the Word's
// way when idle, DR-0235); this is the FIXED, findable, always-in-the-same-place
// door a parishioner can point another parishioner to — "it's at the top." A
// reminder you have to notice is not the same as a place you can always find.
//
// Same panel, same channels, same record — one surface, two entrances.
//
// WHERE IT MOUNTS, and why the scope is what it is. It rides FIRST in the
// header control row (poe-financial-mvp-v28.jsx, beside Subscribe / Install),
// so it is the most findable control on the church door. Its scope matches the
// floater's EXACTLY — the Love Corner door (churchBrand) OR the Church tab
// inside the family app — so the two entrances can never disagree about where
// giving is available, and neither appears on Books/Properties where a Give
// button would be noise. The monolith carries a one-line mount and a pointer
// here; it is under a line freeze (monolith-budget-guard) and this rationale
// belongs with the component anyway.
//
// Built to the header's own conventions so it can't drift from its neighbors:
// .ts-chrome-region (the text-size chrome cap the whole row shares), the
// 0.625rem uppercase control type, a 44px minimum tap target, and the giving
// green that already names this action everywhere else in the app. The label
// stays visible at every width rather than collapsing to a bare icon — the
// word "Give" is only four characters and the row already wraps, so the label
// always stays: a button you can find by name is the whole request.
export function ChurchGiveHeaderButton({ church }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Give to the church — tithes, offerings and gifts"
        title="Give to the church — tithes, offerings, gifts, and your own giving record"
        className="ts-chrome-region text-[0.625rem] uppercase tracking-wider px-2 py-1.5 bg-[#5A6E3D] text-white border border-[#5A6E3D] hover:bg-[#1A1815] hover:border-[#1A1815] font-semibold whitespace-nowrap inline-flex items-center gap-1.5 min-h-[44px] focus:outline focus:outline-2 focus:outline-[#1A1815] print:hidden"
      >
        <GiftIcon /><span>Give</span>
      </button>
      {open && <ChurchGivePanel church={church} onClose={() => setOpen(false)} />}
    </>
  );
}

export default ChurchGiveFloater;
