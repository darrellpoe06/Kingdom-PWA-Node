// =============================================================================
// SecurityPanel — "report to security" (anyone) + triage (security team only).
// =============================================================================
// Declared by Darrell 2026-07-12: "anyone can report to security who has access
// to the Observation tab with all the camera feeds in the building including the
// broadcast." So this panel gives EVERY signed-in member a fast report form, and
// the security team (owner/admin OR security_team roster) a live triage list.
// RLS is the real gate (0096-direct-messages-security.sql); amISecurity() only
// decides whether to render the triage view.
//
// This is the comms end of the Observation surface: reports raised here are what
// the camera-feed holders act on. (Wiring the report feed INTO the Observation
// tab itself is the documented follow-up in SOVEREIGN-COMMS-AND-MEETINGS.md.)
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import { onAuthChange } from '../lib/supabase.js';
import {
  subscribeSecurityReports, reportToSecurity, setSecurityReportStatus, amISecurity,
  openSecurityReports, securityStatusLabel, isSendableBody,
} from '../lib/direct-messages-sync.js';

const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';
const FIELD = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
const LABEL = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1';
const fmtTime = (iso) => { try { return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch { return ''; } };

export default function SecurityPanel({ displayName = '' }) {
  const [signedIn, setSignedIn] = useState(false);
  const [isSecurity, setIsSecurity] = useState(false);
  const [reports, setReports] = useState([]);
  const [body, setBody] = useState('');
  const [location, setLocation] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => onAuthChange((s) => setSignedIn(!!s)), []);
  useEffect(() => {
    if (!signedIn) { setIsSecurity(false); setReports([]); return undefined; }
    let alive = true;
    amISecurity(displayName).then((v) => { if (alive) setIsSecurity(!!v); });
    const unsub = subscribeSecurityReports(setReports);
    return () => { alive = false; if (unsub) unsub(); };
  }, [signedIn, displayName]);

  const open = useMemo(() => openSecurityReports(reports), [reports]);

  const submit = async () => {
    if (!isSendableBody(body)) return;
    setBusy(true);
    const r = await reportToSecurity(body, location, displayName);
    setBusy(false);
    if (r?.sent) { setBody(''); setLocation(''); setMsg('Sent to security. They can see the building feeds and will respond.'); }
    else setMsg(`Could not send (${r?.skipped || 'error'}). Try again.`);
  };

  if (!signedIn) return <p className="text-sm text-[#5A5751]">Sign in to report to security.</p>;

  return (
    <div className="space-y-4">
      {/* Report form — available to everyone */}
      <div className="border border-[#E8E4DC] bg-white p-3 space-y-2">
        <h4 className="text-sm font-medium text-[#1A1815]">Report to security</h4>
        <p className="text-xs text-[#5A5751]">Anyone can send this. It goes to the security team watching the building.</p>
        <label className="block">
          <span className={LABEL}>What's happening</span>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} className={FIELD} placeholder="e.g. Someone needs help at the west door" />
        </label>
        <label className="block">
          <span className={LABEL}>Where (optional)</span>
          <input value={location} onChange={(e) => setLocation(e.target.value)} className={FIELD} placeholder="Lobby, Van 2, sanctuary…" />
        </label>
        {msg && <p className="text-xs text-[#5A6E3D]" role="status">{msg}</p>}
        <div className="flex justify-end">
          <button type="button" disabled={busy || !isSendableBody(body)} onClick={submit} className={`${BTN} bg-[#991B1B] text-white disabled:opacity-50`}>
            {busy ? 'Sending…' : 'Send to security'}
          </button>
        </div>
      </div>

      {/* Triage — security team only (RLS also enforces read) */}
      {isSecurity && (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h4 className="text-sm font-medium text-[#1A1815]">Open reports</h4>
            <span className="text-[0.625rem] text-[#5A5751]">{open.length} open</span>
          </div>
          {open.length === 0 && <p className="text-sm text-[#5A5751]">Nothing open. All clear.</p>}
          {open.map((r) => (
            <div key={r.id} className="border border-[#E8E4DC] bg-white p-3 space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm text-[#1A1815]">{r.body}</span>
                <span className="text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 border border-[#C9BFA8] text-[#5A5751]">{securityStatusLabel(r.status)}</span>
              </div>
              <div className="text-[0.625rem] text-[#5A5751]">
                {r.reporterName}{r.location ? ` · ${r.location}` : ''} · {fmtTime(r.createdAt)}
              </div>
              <div className="flex gap-1.5 pt-1">
                {r.status === 'new' && <button type="button" onClick={() => setSecurityReportStatus(r.id, 'acknowledged')} className={`${BTN} text-[#B85838] hover:text-[#1A1815]`}>Acknowledge</button>}
                <button type="button" onClick={() => setSecurityReportStatus(r.id, 'resolved')} className={`${BTN} text-[#5A6E3D] hover:text-[#1A1815]`}>Resolve</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
