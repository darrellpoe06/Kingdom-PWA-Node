// =============================================================================
// ConferenceModule — the conference FRONT DOOR (identity + open registration)
// =============================================================================
// Restructured 2026-06-16 (Darrell, deadline: the Assembly is THIS July): for a
// real congregation this is now ONE clear, simple front door —
//   1. Identity — name / theme / host / location / dates / livestream / site.
//      SYNCED from the conferences table (shared, so a leader's edit shows for
//      everyone); falls back to the COLG identity constant when signed out.
//   2. Register — the SINGLE, open, no-login registration (ConferenceRegisterForm
//      → conference_public_registrations, migration 0027). This REPLACES the old
//      device-only RSVP that falsely showed "✓ Received" and never reached
//      organizers (the named ship-gate failure). Works signed-out, on mobile.
//   3. Share — organizers get the ?register=1 link to text to the congregation.
//   4. Bishop's feedback — the direct line onto the build list (wf30, unchanged).
//
// The operational system (buildings / rooms / sessions / capacity / breakouts +
// the organizer registration roll) lives BELOW in EventCenterModule, gated to
// owner/admin so congregants aren't buried in leadership tooling.
import React, { useEffect, useState } from 'react';
import { getConferenceAccess, subscribeConferences, saveConference } from '../lib/conference-sync.js';
import { uploadFeedback } from '../lib/feedback-sync.js';
import { CONFERENCE_IDENTITY } from '../lib/conference-identity.js';
import ConferenceRegisterForm from './ConferenceRegisterForm.jsx';
import SectionBoundary from './SectionBoundary.jsx';

// Back-compat export (was the local seed); identity now lives in conference-identity.js.
export const CONFERENCE_SEED = CONFERENCE_IDENTITY;

const card = 'bg-white border border-[#1A1815] p-4 sm:p-5';
const labelCls = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751]';
const fieldCls = 'w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]';
const btnDark = 'bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] min-h-[36px]';
const btnGhost = 'text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]';

function ConferenceModuleInner() {
  // SYNCED identity (shared). access.canEdit = owner/admin may edit the front door.
  const [access, setAccess] = useState({ signedIn: false, canSee: false, canEdit: false });
  const [conf, setConf] = useState(null); // active synced conference, or null
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(CONFERENCE_IDENTITY);
  const [fbText, setFbText] = useState('');
  const [fbSent, setFbSent] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let unsub = () => {};
    (async () => {
      const acc = await getConferenceAccess();
      if (cancelled) return;
      setAccess(acc);
      if (acc.signedIn && acc.canSee) {
        unsub = subscribeConferences((rows) => {
          if (cancelled) return;
          const active = (rows || []).find((c) => c.status !== 'archived') || (rows || [])[0] || null;
          setConf(active);
        });
      }
    })();
    return () => { cancelled = true; try { unsub(); } catch { /* noop */ } };
  }, []);

  // The identity actually shown: the synced conference if present, else the COLG
  // constant (so signed-out visitors + an un-set-up instance still see a real face).
  const view = {
    name: conf?.name || CONFERENCE_IDENTITY.name,
    theme: conf?.theme ?? CONFERENCE_IDENTITY.theme,
    host: conf?.host || CONFERENCE_IDENTITY.host,
    location: conf?.location || CONFERENCE_IDENTITY.location,
    dates: conf?.datesLabel || CONFERENCE_IDENTITY.dates,
    livestreamUrl: conf?.livestreamUrl || CONFERENCE_IDENTITY.livestreamUrl,
    siteUrl: conf?.siteUrl || CONFERENCE_IDENTITY.siteUrl,
  };

  const openEdit = () => {
    setForm({
      name: view.name, theme: view.theme, host: view.host, location: view.location,
      dates: view.dates, livestreamUrl: view.livestreamUrl, siteUrl: view.siteUrl,
    });
    setEditing(true);
  };
  const saveDetails = async () => {
    // Write to the SHARED conference record (create one if none exists yet).
    const payload = {
      id: conf?.id,
      name: form.name, theme: form.theme, host: form.host, location: form.location,
      datesLabel: form.dates, livestreamUrl: form.livestreamUrl, siteUrl: form.siteUrl,
      status: 'active',
    };
    const res = await saveConference(payload);
    if (res && res.skipped) { setEditing(false); return; } // RLS / signed-out: no-op
    setEditing(false);
  };

  const shareUrl = (typeof window !== 'undefined')
    ? `${window.location.origin}${window.location.pathname}?register=1`
    : '/?register=1';
  const copyShare = async () => {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* clipboard blocked; the link is shown for manual copy */ }
  };

  const sendFeedback = async () => {
    const t = fbText.trim();
    if (!t) return;
    setFbText('');
    // SOVEREIGN (DR-0218 zero-n8n): write straight to the Supabase `feedback`
    // table via the family's own tested sync path (RLS-gated, cross-device,
    // fires the Synology Chat notify) — no n8n webhook. Signed-out is a clean
    // no-op ('offline'), matching this surface's own saveConference posture.
    try {
      const res = await uploadFeedback(
        { text: t, currentView: `Conference · ${view.name}` },
        { activeTab: 'conference' },
      );
      setFbSent(res && res.uploaded ? 'sent' : 'offline');
    } catch (_) {
      setFbSent('offline');
    }
  };

  return (
    <section className={card} aria-labelledby="conference-h">
      {/* FRONT DOOR — identity */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">⛪ Conference</div>
          <h2 id="conference-h" className="text-xl sm:text-2xl mt-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{view.name}</h2>
          {view.theme && <p className="text-sm text-[#5A6E3D] font-semibold mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>“{view.theme}”</p>}
          <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
            {view.host} · {view.location}{view.dates ? ` · ${view.dates}` : ''}
          </p>
          {!view.dates && <p className="text-[0.625rem] text-[#B85838] italic mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>Dates not set yet{access.canEdit ? ' — tap Edit and add them when they’re confirmed.' : ' — check back soon.'}</p>}
        </div>
        <div className="flex gap-2 shrink-0">
          {view.livestreamUrl && <a href={view.livestreamUrl} target="_blank" rel="noopener noreferrer" className="text-[0.625rem] uppercase tracking-wider px-3 py-1.5 min-h-[36px] inline-flex items-center border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white no-underline">▶ Livestream</a>}
          {view.siteUrl && <a href={view.siteUrl} target="_blank" rel="noopener noreferrer" className="text-[0.625rem] uppercase tracking-wider px-3 py-1.5 min-h-[36px] inline-flex items-center border border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815] no-underline">Site</a>}
          {access.canEdit && <button type="button" onClick={() => (editing ? setEditing(false) : openEdit())} className={btnGhost}>{editing ? '× Cancel' : '✎ Edit'}</button>}
        </div>
      </div>
      {access.canEdit && editing && (
        <div className="bg-[#FAF8F4] border border-[#B85838] p-3 mt-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div><label className={labelCls}>Conference name</label><input className={fieldCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className={labelCls}>Theme</label><input className={fieldCls} value={form.theme} onChange={e => setForm({ ...form, theme: e.target.value })} /></div>
            <div><label className={labelCls}>Dates (e.g., July 14–18, 2026)</label><input className={fieldCls} value={form.dates} onChange={e => setForm({ ...form, dates: e.target.value })} /></div>
            <div><label className={labelCls}>Location</label><input className={fieldCls} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
            <div><label className={labelCls}>Livestream link</label><input className={fieldCls} value={form.livestreamUrl} onChange={e => setForm({ ...form, livestreamUrl: e.target.value })} /></div>
            <div><label className={labelCls}>Website page</label><input className={fieldCls} value={form.siteUrl} onChange={e => setForm({ ...form, siteUrl: e.target.value })} /></div>
          </div>
          <button type="button" onClick={saveDetails} className={btnDark}>Save conference details</button>
          <p className="text-[0.625rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>Shared with everyone in the church instance.</p>
        </div>
      )}

      {/* REGISTER — the ONE simple, open, no-login registration */}
      <div className="mt-4 pt-3 border-t border-[#E8E4DC]">
        <h3 className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-1">🙋 Register for the Assembly</h3>
        <p className="text-[0.6875rem] text-[#5A5751] italic mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
          Let us know you’re coming so we can plan seating and meals — no account needed.
        </p>
        <ConferenceRegisterForm conferenceName={view.name} source="in-app" />
      </div>

      {/* SHARE — organizers text the open link to the congregation */}
      {access.canEdit && (
        <div className="mt-4 pt-3 border-t border-[#E8E4DC]">
          <h3 className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-1">🔗 Share registration with the congregation</h3>
          <p className="text-[0.6875rem] text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>Text or post this link — anyone can register in seconds, no app or account required:</p>
          <div className="flex gap-2 flex-wrap items-center">
            <code className="text-[0.6875rem] bg-[#FAF8F4] border border-[#E8E4DC] px-2 py-1.5 break-all flex-1 min-w-[200px]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{shareUrl}</code>
            <button type="button" onClick={copyShare} className={btnDark}>{copied ? '✓ Copied' : 'Copy link'}</button>
          </div>
        </div>
      )}

      {/* BISHOP'S FEEDBACK — the direct line that shapes this module (wf30) */}
      <div className="mt-4 pt-3 border-t border-[#E8E4DC]">
        <h3 className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold mb-1">📣 Bishop’s feedback · shapes what we build next</h3>
        <p className="text-[0.6875rem] text-[#5A5751] italic mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
          What’s missing? What would actually help the Assembly run well? Say it plainly — it goes straight onto the build list.
        </p>
        <textarea className={fieldCls} rows="2" placeholder="e.g., We need a printable program · hotel block info · a kids’ track…" value={fbText} onChange={e => setFbText(e.target.value)} aria-label="Feedback for the build team" />
        <div className="flex items-center gap-2 mt-1.5">
          <button type="button" onClick={sendFeedback} className={btnDark}>Send feedback</button>
          {fbSent === 'sent' && <span className="text-[0.6875rem] text-[#5A6E3D] font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>✓ Received — thank you, Bishop.</span>}
          {fbSent === 'offline' && <span className="text-[0.6875rem] text-[#8A6E1F] font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>Couldn’t reach PoeTech just now — please mention it to Darrell directly.</span>}
        </div>
      </div>
    </section>
  );
}

// Props kept for back-compat with the monolith call site; identity is now synced,
// so the local conference/updateConference props are no longer used here.
export function ConferenceModule() {
  return (
    <SectionBoundary name="Conference">
      <ConferenceModuleInner />
    </SectionBoundary>
  );
}

export default ConferenceModule;
