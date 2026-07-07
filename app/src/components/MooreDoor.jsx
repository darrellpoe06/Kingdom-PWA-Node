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
import React, { useEffect, useMemo, useState } from 'react';
import supabase from '../lib/supabase.js';
import { captureLead } from '../lib/crm-sync.js';
import { MOORE_BRAND, CLASS_FORMATS, orderStageMeta, orderClock } from '../lib/moore-divahs.js';
import { DOOR_TABS, POETECH_TIERS, PRICE_OUT_NEEDS, priceOut, DOOR_SOURCE } from '../lib/moore-door.js';
import AppInterestCapture from './AppInterestCapture.jsx';
import { TabScroll } from './shared.jsx';

const SERIF = { fontFamily: '"Fraunces", serif' };
const fmt$ = (cents) => `$${(cents / 100).toFixed(2)}`;

// ---- shared: a public capture form that lands a forced-safe CRM lead --------
function ContactCaptureForm({ pipeline, instanceSlug, promptLabel, notePlaceholder, okMessage }) {
  const [f, setF] = useState({ name: '', contactValue: '', notes: '' });
  const [state, setState] = useState('idle'); // idle | sending | ok | error
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
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
      {state === 'error' && <p className="text-xs text-[#B85838] sm:col-span-3">Could not send right now — email {MOORE_BRAND.email} instead.</p>}
      <p className="text-xs text-[#5A5751] sm:col-span-3">Contact info only — you choose how we reach you. Never sold, ever.</p>
    </form>
  );
}

// ---- Moore Divahs tab --------------------------------------------------------
function PublicClasses() {
  const [state, setState] = useState({ phase: 'loading', rows: [] });
  useEffect(() => {
    let on = true;
    supabase.rpc('moore_public_classes', { p_instance_slug: 'poe-family' })
      .then(({ data, error }) => { if (on) setState({ phase: error ? 'error' : 'ready', rows: data || [] }); })
      .catch(() => { if (on) setState({ phase: 'error', rows: [] }); });
    return () => { on = false; };
  }, []);
  if (state.phase === 'loading') return <p className="text-sm text-[#5A5751]">Loading classes…</p>;
  if (state.phase === 'error' || state.rows.length === 0) {
    return <p className="text-sm text-[#5A5751]">New class dates post about a month ahead — message {MOORE_BRAND.email} to hear about the next one first.</p>;
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
              {c.format === 'one-on-one' ? ' · 2.5-hour private session' : ''}
            </div>
            <div className="text-xs text-[#5A5751]">Machines + materials provided — just show up and create.</div>
          </div>
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${c.seats_left > 0 ? 'text-[#5A6E3D] border-[#5A6E3D]' : 'text-[#B85838] border-[#B85838]'}`}>
            {c.seats_left > 0 ? `${c.seats_left} seats left` : 'Full'}
          </span>
        </div>
      ))}
      <p className="text-xs text-[#5A5751]">A seat is held when it&rsquo;s paid — message {MOORE_BRAND.email} to book yours.</p>
    </div>
  );
}

// ---- My Orders — the signed-in client's OWN history (0087 read-own lane) ----
function MyOrders() {
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
      <p className="text-xs text-[#5A5751]">
        Have an account? <a className="underline" href="/?login=1">Sign in</a> and come back — your orders and class seats show up here.
      </p>
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
          </div>
        );
      })}
    </div>
  );
}

function MooreTab() {
  return (
    <div className="space-y-5">
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
          />
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-[#1A1815]" style={SERIF}>Sewing classes</h3>
        <div className="mt-2"><PublicClasses /></div>
      </div>
      <div>
        <h3 className="font-semibold text-[#1A1815]" style={SERIF}>My orders</h3>
        <div className="mt-2"><MyOrders /></div>
      </div>
    </div>
  );
}

// ---- family-of-businesses tabs -------------------------------------------------
function PracticeTab() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-[#1A1815]" style={SERIF}>TLC Therapy Solutions</h2>
      <p className="text-sm text-[#5A5751]">
        Faith-aware counseling and wellness. Ask for a call about fit — contact info only here; everything
        clinical stays in the counseling room where it belongs.
      </p>
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

function ChurchTab() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-[#1A1815]" style={SERIF}>The Church of the Living God</h2>
      <p className="text-sm text-[#5A5751]">
        The Poe family&rsquo;s home church in Champaign-Urbana — worship, community, and a place at the table.
        The church side of the platform carries services, scripture study, and events.
      </p>
      <a className="inline-block rounded-lg border border-[#2A5A8E] px-3 py-1.5 text-sm font-semibold text-[#2A5A8E]" href="/?join=1">
        Get connected →
      </a>
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
            ? <><strong>{quote.label}{quote.monthly != null ? ` — ${quote.monthly === 0 ? 'Free' : `$${quote.monthly}/mo`}` : ''}</strong>{quote.customQuote ? ' + custom build quote' : ''}<div className="mt-1 text-xs text-[#5A5751]">{quote.note}</div></>
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

// ---- the door ------------------------------------------------------------------
export default function MooreDoor() {
  const [tab, setTab] = useState('moore'); // Moore Divahs first, always
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
    <div className="min-h-screen bg-[#FAF8F4]">
      <div className="mx-auto max-w-2xl px-4 pb-16">
        <header className="pt-6 text-center">
          <h1 className="text-3xl font-bold text-[#1A1815]" style={SERIF}>{MOORE_BRAND.label}</h1>
          <p className="mt-1 text-sm text-[#5A5751]">{MOORE_BRAND.tagline}</p>
          <p className="text-xs text-[#5A5751]">{MOORE_BRAND.email}</p>
        </header>
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
