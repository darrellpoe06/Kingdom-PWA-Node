// =============================================================================
// MooreDoor — the Moore Divahs public app (/?moore=1), customer-facing
// =============================================================================
// The branded door Shay shows clients in the Quad Cities (Darrell 2026-07-07):
// HER brand first — classes with real seats-left + an order inquiry — then the
// family of businesses PoeTech supports, and PoeTech itself with visible,
// price-out-able pricing. PUBLIC FACES ONLY: no steward data, no auth required;
// every interaction goes through forced-safe seams (moore_public_classes RPC,
// crm_capture_lead RPC, app_interest capture) — never direct tables. Every
// capture carries source='moore-divahs-app' so the union's inbound is visible
// on the CRM from day one.
// =============================================================================
import React, { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import supabase from '../lib/supabase.js';
import { publicRpc } from '../lib/public-rpc.js';
import { THEME_CSS, THEMES, readThemePref, saveThemePref } from '../lib/theme-css.js';
import { useTextSize } from '../lib/text-size.js';
import PasswordAuth from './PasswordAuth.jsx';

// The steward board renders IN-DOOR for an owner/admin (Darrell 2026-07-07:
// "she as an admin login on her front screen of her app, others say user
// login"). Lazy so customers never download the steward chunk.
const StewardBoard = lazy(() => import('./MooreDivahs.jsx'));
import { captureLead } from '../lib/crm-sync.js';
import { MOORE_BRAND, CLASS_FORMATS, orderStageMeta, orderClock, MOORE_POLICIES } from '../lib/moore-divahs.js';
import { DOOR_TABS, POETECH_TIERS, PRICE_OUT_NEEDS, priceOut, DOOR_SOURCE, buildReorderNote, doorView } from '../lib/moore-door.js';
import AppInterestCapture from './AppInterestCapture.jsx';
import UiIcon from './UiIcon.jsx';
import { TLC_TEAM, TLC_INSURANCE } from '../lib/tlc-practice.js';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';
import { liveStatus, liveStreamEmbedUrl, latestUploadEmbedUrl } from '../lib/church-live.js';
import { TabScroll } from './shared.jsx';
import { osmLink } from './AddressField.jsx';
import { isInAppBrowser, IN_APP_BROWSER_HINT } from '../lib/session-handoff.js';
import { fetchMessages, sendMessage } from '../lib/business-messages.js';
import { fetchShowcase, showcaseImageUrl, sortPieces } from '../lib/showcase.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const fmt$ = (cents) => `$${(cents / 100).toFixed(2)}`;

// ---- shared: a public capture form that lands a forced-safe CRM lead --------
function ContactCaptureForm({ pipeline, instanceSlug, promptLabel, notePlaceholder, okMessage, prefillNotes = '' }) {
  const [f, setF] = useState({ name: '', contactValue: '', notes: '' });
  const [state, setState] = useState('idle'); // idle | sending | ok | error
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  // One-click reorder drops the prior piece into the note — editable, and a
  // fresh reorder resets a sent form so "again" is one tap, not a page hunt.
  useEffect(() => {
    if (prefillNotes) { setF((cur) => ({ ...cur, notes: prefillNotes })); setState('idle'); }
  }, [prefillNotes]);
  const submit = async (e) => {
    e.preventDefault();
    if (!f.name.trim() || !f.contactValue.trim()) return;
    setState('sending');
    const res = await captureLead(pipeline, instanceSlug, {
      name: f.name, contactMethod: 'email', contactValue: f.contactValue,
      source: DOOR_SOURCE, sourceDetail: 'Moore Divahs app', notes: f.notes,
      consentOutreachOk: true, consentChannels: ['email'], consentNote: 'Asked to be contacted via the Moore Divahs app',
    });
    setState(res && res.captured ? 'ok' : 'error');
  };
  if (state === 'ok') {
    return <div className="rounded-xl border border-[#5A6E3D] bg-white p-3 text-sm text-[#5A6E3D]">✓ {okMessage}</div>;
  }
  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-2 rounded-xl border border-[#E8E2D8] bg-white p-3 text-sm sm:grid-cols-3">
      <input aria-label="Your name" required placeholder="Your name" className="rounded border border-[#E8E2D8] px-2 py-1.5" value={f.name} onChange={set('name')} />
      <input aria-label="Your email or handle" required placeholder="Email or @handle" className="rounded border border-[#E8E2D8] px-2 py-1.5" value={f.contactValue} onChange={set('contactValue')} />
      <input aria-label="Details" placeholder={notePlaceholder} className="rounded border border-[#E8E2D8] px-2 py-1.5" value={f.notes} onChange={set('notes')} />
      <button type="submit" disabled={state === 'sending'} className="rounded-lg bg-[#B85838] px-3 py-1.5 font-semibold text-white sm:col-span-3">
        {state === 'sending' ? 'Sending…' : promptLabel}
      </button>
      {state === 'error' && <p className="text-xs text-[#B85838] sm:col-span-3">Could not send right now — please try again in a moment.</p>}
      <p className="text-xs text-[#5A5751] sm:col-span-3">Contact info only — you choose how we reach you. Never sold, ever.</p>
    </form>
  );
}

// ---- Moore Divahs tab --------------------------------------------------------
function PublicClasses() {
  const [state, setState] = useState({ phase: 'loading', rows: [] });
  useEffect(() => {
    let on = true;
    // publicRpc, NOT the shared client: anon read with a hard deadline — a
    // wedged auth lock in another PoeTech window can never hang this again.
    publicRpc('moore_public_classes', { p_instance_slug: 'poe-family' })
      .then(({ data, error }) => { if (on) setState({ phase: error ? 'error' : 'ready', rows: data || [] }); });
    return () => { on = false; };
  }, []);
  if (state.phase === 'loading') return <p className="text-sm text-[#5A5751]">Loading classes…</p>;
  if (state.phase === 'error' || state.rows.length === 0) {
    return <p className="text-sm text-[#5A5751]">New class dates post about a month ahead — send an order inquiry above and ask to hear about the next one first.</p>;
  }
  return (
    <div className="space-y-2">
      {state.rows.map((c) => (
        <div key={c.slug} className="flex items-start justify-between gap-2 rounded-xl border border-[#E8E2D8] bg-white p-3">
          <div>
            <div className="font-semibold text-[#1A1815]" style={SERIF}>
              {(CLASS_FORMATS[c.format] || {}).label || c.format}{c.project ? ` — ${c.project}` : ''}
            </div>
            <div className="text-xs text-[#5A5751]">
              {c.date_iso ? new Date(c.date_iso).toLocaleString() : ''}{c.location ? ` · ${c.location}` : ''} · {fmt$(c.price_cents)}
              {c.format === 'one-on-one' ? ' · 2.5-hour private session · Mon-Fri, 9 AM-1 PM' : ''}
              {osmLink(c.location_lat, c.location_lon) && (
                <> · <a className="underline" href={osmLink(c.location_lat, c.location_lon)} target="_blank" rel="noreferrer">map</a></>
              )}
            </div>
            <div className="text-xs text-[#5A5751]">Machines + materials provided — just show up and create.</div>
          </div>
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${c.seats_left > 0 ? 'text-[#5A6E3D] border-[#5A6E3D]' : 'text-[#B85838] border-[#B85838]'}`}>
            {c.seats_left > 0 ? `${c.seats_left} seats left` : 'Full'}
          </span>
        </div>
      ))}
      <p className="text-xs text-[#5A5751]">A seat is held when it&rsquo;s paid — send an inquiry above to book yours and Shay will reach out.</p>
    </div>
  );
}

// ---- My Orders — the signed-in client's OWN history (0087 read-own lane) ----
function MyOrders({ onReorder = null }) {
  const [state, setState] = useState({ phase: 'checking', rows: [] });
  useEffect(() => {
    let on = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!on) return;
      if (!data?.session) { setState({ phase: 'signed-out', rows: [] }); return; }
      supabase.rpc('my_moore_orders')
        .then(({ data: rows, error }) => { if (on) setState({ phase: error ? 'error' : 'ready', rows: rows || [] }); })
        .catch(() => { if (on) setState({ phase: 'error', rows: [] }); });
    }).catch(() => { if (on) setState({ phase: 'signed-out', rows: [] }); });
    return () => { on = false; };
  }, []);
  if (state.phase === 'checking') return null;
  if (state.phase === 'signed-out') {
    return (
      <div className="text-xs text-[#5A5751]">
        <p>
          Have an account? <a className="underline" href="/?login=1">Sign in</a> and come back — your orders and class seats show up here.
        </p>
        {isInAppBrowser() && <p className="mt-1 text-[#B85838]">{IN_APP_BROWSER_HINT}</p>}
      </div>
    );
  }
  if (state.phase === 'error' || state.rows.length === 0) {
    return <p className="text-xs text-[#5A5751]">No orders on your account yet — your history appears here the moment your first order is in.</p>;
  }
  return (
    <div className="space-y-2">
      {state.rows.map((o) => {
        const meta = orderStageMeta(o.stage);
        const clock = orderClock({ stage: o.stage, paidAt: o.paid_at, turnaroundDays: o.turnaround_days });
        return (
          <div key={o.slug} className="flex items-start justify-between gap-2 rounded-xl border border-[#E8E2D8] bg-white p-3">
            <div>
              <div className="text-sm font-semibold text-[#1A1815]" style={SERIF}>{o.description || o.product_type}</div>
              <div className="text-xs text-[#5A5751]">
                {o.quote_cents ? `${fmt$(o.quote_cents)} · ` : ''}
                {o.paid_at ? 'paid' : 'awaiting payment'} · {o.delivery === 'pickup' ? 'pickup' : 'ships to you'}
                {clock.running && clock.daysLeft != null ? ` · ${clock.overdue ? 'finishing up' : `about ${clock.daysLeft} days to go`}` : ''}
              </div>
            </div>
            <span className="shrink-0 rounded-full border border-[#5A6E3D] px-2 py-0.5 text-xs text-[#5A6E3D]">{meta.symbol} {meta.label}</span>
            {onReorder && (
              <button
                type="button"
                className="shrink-0 rounded-lg border border-[#B85838] px-2 py-0.5 text-xs text-[#B85838]"
                onClick={() => onReorder(o)}
              >
                ↺ Order again
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---- Messages — the customer's own thread with Shay (0091 lane) -------------
function MyMessages() {
  const [state, setState] = useState({ phase: 'checking', rows: [] });
  const [draft, setDraft] = useState('');
  const load = () => fetchMessages('moore-divahs').then((r) => setState({ phase: r.ok ? 'ready' : 'error', rows: r.rows }));
  useEffect(() => {
    let on = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!on) return;
      if (!data?.session) { setState({ phase: 'signed-out', rows: [] }); return; }
      load();
    }).catch(() => { if (on) setState({ phase: 'signed-out', rows: [] }); });
    return () => { on = false; };
  }, []);
  if (state.phase === 'checking') return null;
  if (state.phase === 'signed-out') {
    return <p className="text-xs text-[#5A5751]">Sign in above and your conversation with Shay lives right here — no more DM digging.</p>;
  }
  const send = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    const r = await sendMessage('moore-divahs', draft);
    if (r.ok) { setDraft(''); load(); }
  };
  return (
    <div>
      {state.rows.length === 0
        ? <p className="text-xs text-[#5A5751]">No messages yet — say hello and Shay gets it on her board.</p>
        : (
          <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-xl border border-[#E8E2D8] bg-white p-2">
            {state.rows.map((m, i) => (
              <div key={i} className={`max-w-[85%] rounded-lg px-2 py-1 text-sm ${m.sender === 'customer' ? 'ml-auto border border-[#B85838] text-[#1A1815]' : 'border border-[#E8E2D8] text-[#1A1815]'}`}>
                <span className="block text-xs text-[#5A5751]">{m.sender === 'customer' ? 'You' : 'Moore Divahs'} · {new Date(m.created_at).toLocaleString()}</span>
                {m.body}
              </div>
            ))}
          </div>
        )}
      <form onSubmit={send} className="mt-2 flex gap-2">
        <input aria-label="Message Shay" placeholder="Message Shay…" className="flex-1 rounded border border-[#E8E2D8] bg-white px-2 py-1.5 text-sm" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button type="submit" className="rounded-lg bg-[#B85838] px-3 py-1.5 text-sm font-semibold text-white">Send</button>
      </form>
    </div>
  );
}

// ---- Gallery — her work greets everyone who enters (0092) -------------------
function Gallery({ onInspired }) {
  const [state, setState] = useState({ phase: 'loading', pieces: [] });
  useEffect(() => {
    let on = true;
    fetchShowcase('moore-divahs').then((r) => { if (on) setState({ phase: 'ready', pieces: sortPieces(r.pieces) }); });
    return () => { on = false; };
  }, []);
  if (state.phase === 'loading') return null;
  if (state.pieces.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[#B85838] p-4 text-center text-sm text-[#5A5751]" style={SERIF}>
        The gallery is being curated — Shay&rsquo;s favorite pieces post here soon.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      {state.pieces.map((p) => {
        const url = showcaseImageUrl(p.image_path);
        return (
          <figure key={p.slug} className="overflow-hidden rounded-2xl border border-[#E8E2D8] bg-white">
            {url && <img src={url} alt={p.title} loading="lazy" className="aspect-square w-full object-cover" />}
            <figcaption className="p-2">
              <div className="text-sm font-semibold text-[#1A1815]" style={SERIF}>{p.title}{p.pinned ? ' ✦' : ''}</div>
              {p.description && <div className="text-xs text-[#5A5751]">{p.description}</div>}
              <button
                type="button"
                className="mt-1.5 w-full rounded-lg border border-[#B85838] px-2 py-1 text-xs font-semibold text-[#B85838]"
                onClick={() => onInspired?.(p)}
              >
                Order inspired by this
              </button>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

function MooreTab() {
  // One-click reorder: a tap on a past order pre-fills the inquiry note below
  // (editable before sending — she quotes fresh; her flyer policies hold).
  const [reorderNote, setReorderNote] = useState('');
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#1A1815]" style={SERIF}>Her work</h2>
        <div className="mt-2">
          <Gallery onInspired={(p) => { setReorderNote(`Inspired by "${p.title}" in the gallery — I want my own (she creates her way).`); try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { /* no-op */ } }} />
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold text-[#1A1815]" style={SERIF}>Custom work, made for you</h2>
        <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
          {['Custom clothing', 'Scrub caps', 'Custom shoes', 'Team & group apparel'].map((s) => (
            <span key={s} className="rounded-full border border-[#B85838] px-2 py-0.5 text-[#B85838]">{s}</span>
          ))}
        </div>
        <p className="mt-2 text-sm text-[#5A5751]">
          Tell her what you want, send inspiration pictures, share your size — she quotes each piece
          (materials included), payment books it, and your piece is made within three weeks.
        </p>
      </div>
      <div>
        <h3 className="font-semibold text-[#1A1815]" style={SERIF}>Start an order</h3>
        <div className="mt-2">
          <ContactCaptureForm
            pipeline="moore-orders"
            instanceSlug="poe-family"
            promptLabel="Send my order inquiry"
            notePlaceholder="What do you want made?"
            okMessage="Sent! Shay will reach out to talk through your piece."
            prefillNotes={reorderNote}
          />
        </div>
        {/* Her house rules — her own flyer's words, agreed at the point of order. */}
        <ul className="mt-2 list-disc pl-4 text-xs text-[#5A5751]">
          <li>{MOORE_POLICIES.leadTime} No rush orders.</li>
          <li>{MOORE_POLICIES.paymentUpfront} {MOORE_POLICIES.nonRefundable}</li>
          <li>{MOORE_POLICIES.inspoHerWay}</li>
          <li>{MOORE_POLICIES.finalFitting}</li>
          <li>{MOORE_POLICIES.madeWithLove}</li>
        </ul>
      </div>
      <div>
        <h3 className="font-semibold text-[#1A1815]" style={SERIF}>Sewing classes</h3>
        <div className="mt-2"><PublicClasses /></div>
      </div>
      <div>
        <h3 className="font-semibold text-[#1A1815]" style={SERIF}>Messages</h3>
        <div className="mt-2"><MyMessages /></div>
      </div>
      <div>
        <h3 className="font-semibold text-[#1A1815]" style={SERIF}>My orders</h3>
        <div className="mt-2"><MyOrders onReorder={(o) => { setReorderNote(buildReorderNote(o)); try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch { /* no-op */ } }} /></div>
      </div>
    </div>
  );
}

// ---- family-of-businesses tabs -------------------------------------------------
// The Practice tab shows the REAL clinical team (Darrell 2026-07-07) — the same
// TLC_TEAM record the main app's Practice tab renders (one source, no drift).
// Public marketing facts only; the capture form stays contact-info-only.
function PracticeTab() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-[#1A1815]" style={SERIF}>TLC Therapy Solutions</h2>
      <p className="text-sm text-[#5A5751]">
        Faith-aware counseling and wellness. Ask for a call about fit — contact info only here; everything
        clinical stays in the counseling room where it belongs.
      </p>
      <div>
        <h3 className="font-semibold text-[#1A1815]" style={SERIF}>Meet the therapists</h3>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {TLC_TEAM.map((t) => (
            <a key={t.name} href={t.url} target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-3 rounded-xl border border-[#E8E2D8] bg-white p-3">
              <img src={t.photo} alt={t.name} loading="lazy" className="h-16 w-16 shrink-0 rounded-lg border border-[#E8E2D8] object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-[#1A1815]" style={SERIF}>{t.name}</span>
                  <span className="shrink-0 text-[0.625rem] uppercase tracking-wider text-[#B85838]">View →</span>
                </div>
                <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">{t.role}</div>
                <p className="mt-1 text-xs leading-snug text-[#5A5751]">{t.specialty}</p>
              </div>
            </a>
          ))}
        </div>
        <p className="mt-2 text-xs text-[#5A5751]"><span className="font-semibold text-[#B85838]">Insurance accepted:</span> {TLC_INSURANCE}</p>
      </div>
      <ContactCaptureForm
        pipeline="tlc-client-intake"
        instanceSlug="tlc"
        promptLabel="Request a call about counseling"
        notePlaceholder="Anything you want us to know (optional)"
        okMessage="Received. The practice will reach out about fit and scheduling."
      />
    </div>
  );
}

// The Church tab plays the latest live service (Darrell 2026-07-07) — the same
// no-API-key rolling-latest player the main app's Church tab uses: live embed
// inside a service window, the channel's latest upload otherwise.
function ChurchTab() {
  const c = COLG_DEFAULT_CHURCH;
  const { live } = liveStatus(c.services);
  const embed = live ? liveStreamEmbedUrl(c.youtubeChannelId) : latestUploadEmbedUrl(c.youtubeChannelId);
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-[#1A1815]" style={SERIF}>The Church of the Living God</h2>
      <p className="text-sm text-[#5A5751]">
        The Poe family&rsquo;s home church in Champaign-Urbana — worship, community, and a place at the table.
        {live ? ' Streaming live right now — join in below.' : ' Between services the most recent message plays here; the next live stream rolls in on its own.'}
      </p>
      {embed && (
        <iframe
          src={embed}
          title={live ? `${c.name} — live service` : `${c.name} — latest message`}
          loading="lazy"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full rounded-xl border border-[#E8E2D8] bg-black"
        />
      )}
      <p className="text-xs text-[#5A5751]">
        <span className="font-semibold text-[#B85838]">Service times:</span>{' '}
        {c.services.map((s) => `${s.day} ${s.time}`).join(' · ')}
      </p>
      <div className="flex flex-wrap gap-2">
        {c.media?.youtube && (
          <a className="inline-block rounded-lg border border-[#5A5751] px-3 py-1.5 text-sm text-[#5A5751]" href={c.media.youtube} target="_blank" rel="noopener noreferrer">
            Watch on YouTube
          </a>
        )}
        <a className="inline-block rounded-lg border border-[#2A5A8E] px-3 py-1.5 text-sm font-semibold text-[#2A5A8E]" href="/?join=1">
          Get connected →
        </a>
      </div>
    </div>
  );
}

function PoeTechTab() {
  const [picked, setPicked] = useState([]);
  const quote = useMemo(() => priceOut(picked), [picked]);
  const toggle = (k) => setPicked((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#1A1815]" style={SERIF}>The platform behind this app</h2>
        <p className="mt-1 text-sm text-[#5A5751]">
          This Moore Divahs app runs on PoeTech — one platform for a family&rsquo;s money, projects, church life,
          and businesses. Built to serve, never to extract: your data is yours, exportable, never sold.
        </p>
      </div>
      <div>
        <h3 className="font-semibold text-[#1A1815]" style={SERIF}>Pricing</h3>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {POETECH_TIERS.map((t) => (
            <div key={t.key} className="rounded-xl border border-[#E8E2D8] bg-white p-3">
              <div className="flex items-baseline justify-between">
                <span className="font-semibold text-[#1A1815]" style={SERIF}>{t.label}</span>
                <span className="text-[#1A1815]">{t.monthly === 0 ? 'Free' : `$${t.monthly}/mo`}</span>
              </div>
              <p className="mt-1 text-xs text-[#5A5751]">{t.blurb}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-[#1A1815]" style={SERIF}>Price it out</h3>
        <p className="text-xs text-[#5A5751]">Pick what you need — the price follows.</p>
        <div className="mt-2 space-y-1.5">
          {PRICE_OUT_NEEDS.map((n) => (
            <label key={n.key} className="flex items-center gap-2 text-sm text-[#1A1815]">
              <input type="checkbox" checked={picked.includes(n.key)} onChange={() => toggle(n.key)} />
              {n.label}
            </label>
          ))}
        </div>
        <div className="mt-2 rounded-xl border border-[#E8E2D8] bg-white p-3 text-sm text-[#1A1815]">
          {quote.tier
            ? <><strong>{quote.label}{quote.monthly != null ? ` — ${quote.monthly === 0 ? 'Free' : `$${quote.monthly}/mo`}` : ''}</strong>{quote.customQuote ? ' + build from $2,000' : ''}<div className="mt-1 text-xs text-[#5A5751]">{quote.note}</div></>
            : <span className="text-[#5A5751]">{quote.note}</span>}
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-[#1A1815]" style={SERIF}>Want in?</h3>
        <div className="mt-2"><AppInterestCapture source={DOOR_SOURCE} /></div>
      </div>
    </div>
  );
}

// ---- Admin login / User login — one auth, role decides ----------------------
// The buttons are honest signage; my_business_role() (0090, definer, signed-in
// only) is the gate's input, and table RLS remains the real wall.
function DoorAuth({ role, onRole }) {
  const [open, setOpen] = useState(null); // null | 'admin' | 'user'
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    let on = true;
    // Hard deadline on the whole check: getSession() waits on a CROSS-TAB auth
    // lock a wedged PoeTech window can hold forever (the 2026-07-07 "no login
    // buttons on the front page" hang). If the check can't answer in time, the
    // door defaults to signed-out — the honest state that always shows the
    // User/Admin login buttons instead of a blank header.
    const deadline = new Promise((resolve) => setTimeout(() => resolve({ timedOut: true }), 5000));
    (async () => {
      const s = await Promise.race([supabase.auth.getSession(), deadline]);
      if (!on) return;
      if (s?.timedOut || !s?.data?.session) { setChecking(false); onRole('signed-out'); return; }
      const r = await Promise.race([
        supabase.rpc('my_business_role', { p_instance_slug: 'moore-divahs' }),
        deadline,
      ]);
      if (!on) return;
      if (r?.timedOut) { setChecking(false); onRole('signed-out'); return; }
      onRole(r?.error ? 'none' : (r?.data || 'none'));
      setChecking(false);
    })().catch(() => { if (on) { setChecking(false); onRole('signed-out'); } });
    return () => { on = false; };
  }, [onRole]);
  if (checking) return null;
  if (role === 'owner' || role === 'admin') {
    return <p className="text-xs text-[#5A6E3D]">Signed in as the shop — your board is below. <button type="button" className="underline" onClick={() => supabase.auth.signOut().then(() => window.location.reload())}>Sign out</button></p>;
  }
  // 'customer-view' = a real steward looking through the customer lens: render
  // exactly what a signed-in customer gets here (nothing) — the strip above the
  // header is the only tell.
  if (role !== 'signed-out') return null; // signed-in customer — My Orders shows in the Moore tab
  if (open) {
    return (
      <div className="mx-auto max-w-sm">
        <PasswordAuth mode="signin" embedded onSignedIn={() => window.location.reload()} />
        <button type="button" className="mt-1 text-xs text-[#5A5751] underline" onClick={() => setOpen(null)}>Close</button>
      </div>
    );
  }
  return (
    <div className="flex justify-center gap-2">
      <button type="button" className="rounded-lg border border-[#B85838] px-3 py-1.5 text-sm font-semibold text-[#B85838]" onClick={() => setOpen('user')}>User login</button>
      <button type="button" className="rounded-lg border border-[#5A5751] px-3 py-1.5 text-sm text-[#5A5751]" onClick={() => setOpen('admin')}>Admin login</button>
    </div>
  );
}

// ---- the door ------------------------------------------------------------------
export default function MooreDoor() {
  const [tab, setTab] = useState('moore'); // Moore Divahs first, always
  const [role, setRole] = useState('signed-out');
  // Comfort controls — the SAME theme + text-size the PoeTech app uses (shared
  // libs; the per-device choice follows the user between shells).
  const [theme, setTheme] = useState(() => readThemePref('cream'));
  useEffect(() => { saveThemePref(theme); }, [theme]);
  const [sizeKey, setSizeKey, sizeSteps] = useTextSize();
  // View-as-customer — the door's reviewer lens (session-only on purpose: a
  // reload always boots Shay back to her own board, never stuck in the lens).
  // Strictly narrowing (doorView): it can only HIDE the steward board.
  const [customerView, setCustomerView] = useState(false);
  const view = doorView(role, customerView);
  const isSteward = view.isSteward;
  // Install-to-home-screen carries HER name: swap the document's manifest to the
  // Moore Divahs one (and title/theme to match) while the door is mounted. Icon
  // artwork still reuses the platform icons until Shay supplies hers (md-handles
  // sibling — an asset only she holds).
  useEffect(() => {
    document.title = `${MOORE_BRAND.label} — ${MOORE_BRAND.tagline}`;
    let link = document.querySelector('link[rel="manifest"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.href = '/manifest-moore.webmanifest';
  }, []);
  return (
    <div data-theme={theme === 'cream' ? undefined : theme} className="min-h-screen overflow-x-clip bg-[#FAF8F4] text-[#1A1815]">
      <style>{THEME_CSS}</style>
      <div className="mx-auto max-w-2xl px-4 pb-16">
        {view.customerView && (
          <div className="sticky top-0 z-40 -mx-4 flex items-center justify-between gap-2 border-b border-[#B85838] bg-[#FAF8F4] px-4 py-2 text-xs text-[#1A1815]">
            <span className="flex items-center gap-1.5"><UiIcon name="eye" className="h-4 w-4 shrink-0" /><span><strong>Viewing as a customer</strong> — this is exactly what your customers see. Anything you submit here is real.</span></span>
            <button type="button" className="whitespace-nowrap rounded-lg border border-[#B85838] px-2 py-1 font-semibold text-[#B85838]" onClick={() => setCustomerView(false)}>Exit</button>
          </div>
        )}
        <header className="pt-6 text-center">
          <h1 className="text-3xl font-bold text-[#1A1815]" style={SERIF}>{MOORE_BRAND.label}</h1>
          <p className="mt-1 text-sm text-[#5A5751]">{MOORE_BRAND.tagline}</p>
          <div className="mt-2 flex items-center justify-center gap-2" role="group" aria-label="Comfort controls">
            {THEMES.map((t) => (
              <button key={t.key} type="button" aria-label={`${t.label} theme`} title={t.label}
                className={`h-5 w-5 rounded-full ${theme === t.key ? 'ring-2 ring-[#B85838] ring-offset-1' : 'opacity-70'}`}
                style={{ backgroundColor: t.color, border: `1.5px solid ${t.border}` }}
                onClick={() => setTheme(t.key)} />
            ))}
            <span className="mx-1 h-4 border-l border-[#E8E2D8]" aria-hidden="true" />
            {sizeSteps.map((s) => (
              <button key={s.key} type="button" aria-label={`Text size ${s.label}`}
                className={`rounded border px-1.5 text-xs ${sizeKey === s.key ? 'border-[#B85838] text-[#B85838] font-semibold' : 'border-[#E8E2D8] text-[#5A5751]'}`}
                onClick={() => setSizeKey(s.key)}>A</button>
            ))}
          </div>
          <div className="mt-3"><DoorAuth role={view.authRole} onRole={setRole} /></div>
        </header>
        {isSteward && (
          <Suspense fallback={<p className="mt-4 text-center text-xs text-[#5A5751]">Loading your board…</p>}>
            <div className="mt-2 rounded-2xl border border-[#B85838] p-2">
              <div className="flex justify-end px-1 pt-1">
                <button type="button" className="flex items-center gap-1.5 rounded-lg border border-[#E8E2D8] px-2 py-1 text-xs text-[#5A5751]"
                  onClick={() => setCustomerView(true)}><UiIcon name="eye" className="h-3.5 w-3.5" /> View as customer</button>
              </div>
              <StewardBoard />
            </div>
          </Suspense>
        )}
        <TabScroll className="mt-4 border-b border-[#E8E2D8]" label="Moore Divahs sections">
          {DOOR_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors ${tab === t.id ? 'border-[#B85838] font-medium text-[#1A1815]' : 'border-transparent text-[#5A5751]'}`}
            >
              {t.label}
            </button>
          ))}
        </TabScroll>
        <main className="mt-4">
          {tab === 'moore' && <MooreTab />}
          {tab === 'practice' && <PracticeTab />}
          {tab === 'church' && <ChurchTab />}
          {tab === 'poetech' && <PoeTechTab />}
        </main>
        <footer className="mt-10 text-center text-xs text-[#5A5751]">
          A family of businesses · Powered by PoeTech
        </footer>
      </div>
    </div>
  );
}
