// =============================================================================
// GuestReport — the guest's page and the landlord's card (DR-0898, 0261)
// =============================================================================
// Darrell, 2026-10-10: "even a person walking through an Airbnb or short-term
// rental works great for getting work done or issues with systems or cleaning
// done asap".
//
// TWO SURFACES, ONE KEY.
//   * GuestLinkCard sits on a door's Work board for the family. It opens the
//     door's card (the database mints the key), shows the code to print and
//     the link to copy, replaces it (every old copy stops working) and closes
//     it. Nothing is on until he opens it, one door at a time.
//   * GuestReportPage is what the code opens, with or without an account. It
//     names the door, takes the report and says it was sent. It reads nothing
//     back: there is nothing a guest can see of the board, by design (0261).
// =============================================================================
import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { boundedRead } from '../../lib/bounded-read.js';
import { loadGuestLink, openGuestLink, closeGuestLink, loadGuestDoor, submitGuestReport } from './cloud.js';
import { reportUrl, validateGuestReport, guestCardCaption, GUEST_LIMITS } from './guest-report.js';

const serif = { fontFamily: '"Fraunces", Georgia, serif' };
const READ_MS = 8000;

const Btn = ({ children, onClick, tone = 'ghost', disabled, ...rest }) => (
  <button
    type="button" onClick={onClick} disabled={disabled}
    className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#2F5D50] disabled:opacity-40 ${
      tone === 'primary' ? 'bg-[#2F5D50] text-white border-[#2F5D50] hover:bg-[#1A1815] hover:border-[#1A1815]'
        : 'bg-white text-[#1A1815] border-[#E8E4DC] hover:border-[#1A1815]'}`}
    {...rest}
  >{children}</button>
);

/** The family's card on a door: open, print, replace, close. */
export function GuestLinkCard({ rental }) {
  const rentalId = rental?.id || null;
  const label = [rental?.display_name || rental?.address, rental?.unit].filter(Boolean).join(' · ');
  const [state, setState] = useState({ loading: true, token: null, error: '' });
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    if (!rentalId) { setState({ loading: false, token: null, error: '' }); return undefined; }
    boundedRead(loadGuestLink(rentalId), READ_MS).then((r) => {
      if (!live) return;
      setState({ loading: false, token: r.ok ? r.token : null, error: r.ok ? '' : 'Could not read this door’s guest card right now.' });
    });
    return () => { live = false; };
  }, [rentalId]);

  if (!rentalId) return null;
  const url = reportUrl(state.token);
  const act = async (fn, after) => {
    setBusy(true);
    const r = await fn(rentalId);
    setBusy(false);
    if (!r.ok) { setState((s) => ({ ...s, error: `Not done: ${r.reason}` })); return; }
    setState({ loading: false, token: after(r), error: '' });
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { setCopied(false); }
  };

  return (
    <section className="bg-white border border-[#E8E4DC] p-3 sm:p-4 mb-3" data-testid="guest-link-card">
      <h3 className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold text-[#2F5D50] mb-2">Guests can report a problem</h3>
      {state.loading ? (
        <p className="text-xs text-[#5A5751]" style={serif}>Reading this door’s guest card…</p>
      ) : url ? (
        <div className="flex flex-wrap items-start gap-3">
          <div className="bg-white p-2 border border-[#E8E4DC]">
            <QRCodeSVG value={url} size={148} level="M" marginSize={2} />
          </div>
          <div className="min-w-[12rem] flex-1">
            <p className="text-[0.875rem] text-[#1A1815] leading-relaxed" style={serif}>{guestCardCaption(label)}</p>
            <p className="text-[0.75rem] text-[#5A5751] break-all mt-1" data-testid="guest-link-url">{url.replace(/^https?:\/\//, '')}</p>
            <p className="text-[0.75rem] text-[#6B665E] leading-relaxed mt-1" style={serif}>
              Print this and leave it inside the unit. A guest who scans it says what is wrong, with no account, and it lands
              here on this door&apos;s Work board and tells you. A guest sees nothing of the board. A new card stops every old copy;
              closing it stops them all.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Btn onClick={copy}>{copied ? 'Copied' : 'Copy the link'}</Btn>
              <Btn disabled={busy} onClick={() => act(openGuestLink, (r) => r.token)}>New card</Btn>
              <Btn disabled={busy} onClick={() => act(closeGuestLink, () => null)}>Close it</Btn>
            </div>
            <span aria-live="polite" className="sr-only">{copied ? 'Link copied' : ''}</span>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-[0.8125rem] text-[#1A1815] leading-relaxed" style={serif}>
            A short stay or a guest between tenants: give them a card to scan that reports a problem straight to this board,
            no account needed. Off until you open it, one door at a time.
          </p>
          <div className="mt-2"><Btn tone="primary" disabled={busy} onClick={() => act(openGuestLink, (r) => r.token)}>Open a guest card</Btn></div>
        </div>
      )}
      {state.error && <p className="text-xs text-[#B85838] mt-2" role="alert">{state.error}</p>}
    </section>
  );
}

/** What the code opens: say what is wrong, with no account. */
export function GuestReportPage({ token }) {
  const [door, setDoor] = useState(undefined); // undefined = asking; null = dead card
  const [form, setForm] = useState({ title: '', detail: '', name: '', contact: '', urgent: false });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [refused, setRefused] = useState('');

  useEffect(() => {
    let live = true;
    boundedRead(loadGuestDoor(token), READ_MS).then((r) => { if (live) setDoor(r.ok ? r.door : null); });
    return () => { live = false; };
  }, [token]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: k === 'urgent' ? e.target.checked : e.target.value }));
  const send = async () => {
    const v = validateGuestReport(form);
    setErrors(v.errors);
    if (!v.ok) return;
    setSending(true); setRefused('');
    const r = await submitGuestReport({ token, ...form });
    setSending(false);
    if (r.ok) setSent(true);
    else setRefused(r.reason && r.reason !== 'unexpected' ? r.reason : 'It did not send. Please try again, or call or text your host.');
  };

  const where = door ? [door.label, door.unit].filter(Boolean).join(' · ') : '';
  const field = 'w-full text-sm border border-[#E8E4DC] px-2 py-2 bg-white text-[#1A1815]';
  return (
    <div className="bg-white border border-[#E8E4DC] p-4 max-w-xl" data-testid="guest-report-page">
      {door === undefined && <p className="text-xs text-[#5A5751]" style={serif}>Opening the report form…</p>}
      {door === null && (
        <>
          <h2 className="text-lg text-[#1A1815] mb-1" style={serif}>This card is not active</h2>
          <p className="text-sm text-[#5A5751]" style={serif}>The host has replaced or closed it. Please call or text your host directly.</p>
        </>
      )}
      {door && sent && (
        <>
          <h2 className="text-lg text-[#1A1815] mb-1" style={serif}>Thank you, it is sent</h2>
          <p className="text-sm text-[#5A5751]" style={serif}>
            Your host has it on the work board for {where}. If it is an emergency (fire, gas, flooding), call 911 first.
          </p>
        </>
      )}
      {door && !sent && (
        <>
          <p className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold text-[#2F5D50] mb-1">Report a problem</p>
          <h2 className="text-lg text-[#1A1815] mb-3" style={serif}>{where}</h2>
          <label className="block text-xs text-[#5A5751] mb-1" htmlFor="gr-title">What is wrong?</label>
          <input id="gr-title" value={form.title} onChange={set('title')} maxLength={GUEST_LIMITS.title} className={field} style={serif}
            placeholder="The bathroom fan rattles" aria-invalid={Boolean(errors.title)} />
          {errors.title && <p className="text-xs text-[#B85838] mt-1">{errors.title}</p>}
          <label className="block text-xs text-[#5A5751] mt-3 mb-1" htmlFor="gr-detail">Anything that helps (optional)</label>
          <textarea id="gr-detail" value={form.detail} onChange={set('detail')} rows={3} maxLength={GUEST_LIMITS.detail} className={field} style={serif} />
          {errors.detail && <p className="text-xs text-[#B85838] mt-1">{errors.detail}</p>}
          <div className="grid sm:grid-cols-2 gap-2 mt-3">
            <div>
              <label className="block text-xs text-[#5A5751] mb-1" htmlFor="gr-name">Your name (optional)</label>
              <input id="gr-name" value={form.name} onChange={set('name')} maxLength={GUEST_LIMITS.name} className={field} style={serif} />
            </div>
            <div>
              <label className="block text-xs text-[#5A5751] mb-1" htmlFor="gr-contact">Phone or email, if you want a reply</label>
              <input id="gr-contact" value={form.contact} onChange={set('contact')} maxLength={GUEST_LIMITS.contact} className={field} style={serif} />
            </div>
          </div>
          <label className="flex items-center gap-2 mt-3 text-sm text-[#1A1815]" style={serif}>
            <input type="checkbox" checked={form.urgent} onChange={set('urgent')} />
            It is urgent (no heat, water leaking, locked out)
          </label>
          <div className="mt-3"><Btn tone="primary" disabled={sending} onClick={send}>{sending ? 'Sending…' : 'Send it to the host'}</Btn></div>
          {refused && <p className="text-xs text-[#B85838] mt-2" role="alert">{refused}</p>}
          <p className="text-[0.6875rem] text-[#6B665E] mt-3" style={serif}>
            No account needed. Your host sees what you write here; you will not see their board. For fire, gas or flooding, call 911 first.
          </p>
        </>
      )}
    </div>
  );
}
