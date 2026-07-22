// =============================================================================
// SupportAccess — the Governed Support Door surface (DR-0223 / DR-0220 Phase 6)
// =============================================================================
// How the technology team fixes issues WITHOUT ambient access to data. Two halves:
//   - GRANT (owner/admin): give a Dev/Ops Specialist a scoped, time-boxed grant to
//     ONE non-PHI record, with a required reason. Clinical/PHI is never offered.
//   - USE (the specialist): read only the granted record while the grant is live;
//     every read is logged to the audit trail (the owner always has a receipt).
// The real enforcement is the 0114 RPCs; this surface just drives them.
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import { listInstanceMembers, listMyAdminInstances } from '../lib/member-roles.js';
import {
  SUPPORTABLE_TYPES, canReceiveBreakglass,
  grantSupportAccess, supportRead, listMySupportGrants, revokeSupportAccess,
  requestSupportAccess, listSupportSpecialists, mySupportableRecords,
} from '../lib/support-access.js';

const serif = { fontFamily: '"Fraunces", serif' };
const FIELD = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white';
const LABEL = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1';
const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';

function GrantForm({ instanceId }) {
  const [members, setMembers] = useState([]);
  const [f, setF] = useState({ grantee: '', type: 'transaction', resourceId: '', reason: '', minutes: 60 });
  const [msg, setMsg] = useState('');
  useEffect(() => {
    let alive = true;
    if (!instanceId) { setMembers([]); return undefined; }
    listInstanceMembers(instanceId).then((rows) => { if (alive) setMembers(rows.filter((m) => canReceiveBreakglass(m.role) && m.userId)); });
    return () => { alive = false; };
  }, [instanceId]);
  const submit = async () => {
    setMsg('Granting…');
    const r = await grantSupportAccess(instanceId, f.grantee, f.type, f.resourceId.trim(), f.reason, f.minutes);
    if (r.ok) { setMsg('Granted — the specialist can read that one record until it expires. The read is logged.'); setF((p) => ({ ...p, resourceId: '', reason: '' })); }
    else setMsg(`Couldn't grant (${r.reason || 'error'})${r.error ? `: ${r.error}` : ''}.`);
  };
  return (
    <div className="bg-[#FAF8F4] border border-[#5A6E3D] p-3">
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold mb-1">Grant break-glass access</div>
      <p className="text-[0.6875rem] text-[#5A5751] mb-2 leading-relaxed" style={serif}>
        Give a support specialist time-boxed access to ONE record to fix an issue. Clinical/health data is never available here. Every read is logged.
      </p>
      {members.length === 0 ? (
        <p className="text-[0.6875rem] text-[#5A5751]" style={serif}>No specialist in this space yet — set someone’s role to “specialist” in Role &amp; stewards first.</p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className={LABEL} htmlFor="sa-grantee">Specialist</label>
              <select id="sa-grantee" className={FIELD} value={f.grantee} onChange={(e) => setF((p) => ({ ...p, grantee: e.target.value }))}>
                <option value="">Choose…</option>
                {members.map((m) => <option key={m.userId} value={m.userId}>{m.displayName || m.email}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="sa-type">Record type</label>
              <select id="sa-type" className={FIELD} value={f.type} onChange={(e) => setF((p) => ({ ...p, type: e.target.value }))}>
                {SUPPORTABLE_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={LABEL} htmlFor="sa-rid">Record ID (from the reported issue)</label>
            <input id="sa-rid" className={`${FIELD} font-mono`} value={f.resourceId} onChange={(e) => setF((p) => ({ ...p, resourceId: e.target.value }))} placeholder="00000000-0000-…" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2">
              <label className={LABEL} htmlFor="sa-reason">Reason (required — on the record)</label>
              <input id="sa-reason" className={FIELD} value={f.reason} onChange={(e) => setF((p) => ({ ...p, reason: e.target.value }))} placeholder="e.g. wrong name on their roster row" />
            </div>
            <div>
              <label className={LABEL} htmlFor="sa-min">Minutes</label>
              <input id="sa-min" type="number" min="1" max="1440" className={FIELD} value={f.minutes} onChange={(e) => setF((p) => ({ ...p, minutes: e.target.value }))} />
            </div>
          </div>
          <button type="button" disabled={!f.grantee || !f.resourceId.trim() || !f.reason.trim()}
            onClick={submit} className={`${BTN} bg-[#5A6E3D] text-white font-semibold disabled:opacity-50`}>Grant</button>
          {msg && <p className="text-[0.6875rem] text-[#1A1815] mt-1" style={serif}>{msg}</p>}
        </div>
      )}
    </div>
  );
}

function MyGrants() {
  const [grants, setGrants] = useState([]);
  const [reads, setReads] = useState({});   // grantId -> read result
  const load = () => listMySupportGrants().then(setGrants);
  useEffect(() => { load(); }, []);
  const doRead = async (g) => {
    setReads((p) => ({ ...p, [g.grantId]: { status: 'loading' } }));
    const r = await supportRead(g.grantId);
    setReads((p) => ({ ...p, [g.grantId]: r }));
  };
  const doRevoke = async (g) => { await revokeSupportAccess(g.grantId); load(); setReads((p) => ({ ...p, [g.grantId]: undefined })); };
  if (grants.length === 0) {
    return <p className="text-[0.6875rem] text-[#5A5751] mt-2" style={serif}>No active support grants. When a steward grants you access to a record, it shows here.</p>;
  }
  return (
    <ul className="mt-2 space-y-2">
      {grants.map((g) => {
        const r = reads[g.grantId];
        return (
          <li key={g.grantId} className="bg-white border border-[#E8E4DC] p-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-[#1A1815]" style={serif}>{g.resourceType.replace('_', ' ')} · <span className="font-mono text-[0.625rem] break-all">{g.resourceId}</span></span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => doRead(g)} className={`${BTN} text-[#5A6E3D] hover:text-[#1A1815]`}>Read</button>
                <button type="button" onClick={() => doRevoke(g)} className={`${BTN} text-[#991B1B] hover:underline`}>End</button>
              </div>
            </div>
            <div className="text-[0.625rem] text-[#5A5751]">{g.reason}</div>
            {r && r.status === 'ok' && (
              <pre className="mt-1 text-[0.625rem] bg-[#FAF8F4] border border-[#E8E4DC] p-2 overflow-x-auto">{JSON.stringify(r.data, null, 2)}</pre>
            )}
            {r && r.status === 'expired' && <p className="text-[0.625rem] text-[#7A1F1F] mt-1">This grant has expired.</p>}
            {r && r.skipped && <p className="text-[0.625rem] text-[#7A1F1F] mt-1">Couldn’t read ({r.skipped}).</p>}
          </li>
        );
      })}
    </ul>
  );
}

// The user-initiated half (0115): a member opens a specialist's access to THEIR
// OWN record — "I need help with this." Lists the caller's own records + the
// support staff; no raw ids, no steward needed (it's their own data).
function GetHelp({ instanceId }) {
  const [records, setRecords] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [f, setF] = useState({ record: '', grantee: '', reason: '', minutes: 60 });
  const [msg, setMsg] = useState('');
  useEffect(() => {
    let alive = true;
    if (!instanceId) { setRecords([]); setSpecialists([]); return undefined; }
    mySupportableRecords(instanceId).then((r) => { if (alive) setRecords(r); });
    listSupportSpecialists(instanceId).then((s) => { if (alive) setSpecialists(s); });
    return () => { alive = false; };
  }, [instanceId]);
  const submit = async () => {
    const rec = records.find((r) => r.resourceId === f.record);
    if (!rec) { setMsg('Pick one of your records.'); return; }
    setMsg('Opening access…');
    const r = await requestSupportAccess(instanceId, f.grantee, rec.resourceType, rec.resourceId, f.reason, f.minutes);
    if (r.ok) { setMsg('Done — the specialist can see just that record until it expires, and every look is logged. You can end it anytime.'); setF((p) => ({ ...p, reason: '' })); }
    else setMsg(`Couldn't open access (${r.reason || 'error'})${r.error ? `: ${r.error}` : ''}.`);
  };
  if (records.length === 0 && specialists.length === 0) return null;
  return (
    <div className="bg-[#FAF8F4] border border-[#B85838] p-3">
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">Get help with your data</div>
      <p className="text-[0.6875rem] text-[#5A5751] mb-2 leading-relaxed" style={serif}>
        Let a support specialist see ONE of your own records to fix an issue. They see only that record, only for a short time, and every look is logged — you can end it anytime.
      </p>
      {records.length === 0 ? (
        <p className="text-[0.6875rem] text-[#5A5751]" style={serif}>No records here to share yet.</p>
      ) : specialists.length === 0 ? (
        <p className="text-[0.6875rem] text-[#5A5751]" style={serif}>No support specialist is set up in this space yet.</p>
      ) : (
        <div className="space-y-2">
          <div>
            <label className={LABEL} htmlFor="gh-record">Your record</label>
            <select id="gh-record" className={FIELD} value={f.record} onChange={(e) => setF((p) => ({ ...p, record: e.target.value }))}>
              <option value="">Choose…</option>
              {records.map((r) => <option key={r.resourceId} value={r.resourceId}>{r.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className={LABEL} htmlFor="gh-spec">Support specialist</label>
              <select id="gh-spec" className={FIELD} value={f.grantee} onChange={(e) => setF((p) => ({ ...p, grantee: e.target.value }))}>
                <option value="">Choose…</option>
                {specialists.map((s) => <option key={s.userId} value={s.userId}>{s.displayName}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="gh-min">Minutes</label>
              <input id="gh-min" type="number" min="1" max="1440" className={FIELD} value={f.minutes} onChange={(e) => setF((p) => ({ ...p, minutes: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className={LABEL} htmlFor="gh-reason">What's wrong?</label>
            <input id="gh-reason" className={FIELD} value={f.reason} onChange={(e) => setF((p) => ({ ...p, reason: e.target.value }))} placeholder="e.g. my name is misspelled" />
          </div>
          <button type="button" disabled={!f.record || !f.grantee || !f.reason.trim()}
            onClick={submit} className={`${BTN} bg-[#B85838] text-white font-semibold disabled:opacity-50`}>Open access</button>
          {msg && <p className="text-[0.6875rem] text-[#1A1815] mt-1" style={serif}>{msg}</p>}
        </div>
      )}
    </div>
  );
}

export default function SupportAccess({ instanceId = null }) {
  const [adminInstances, setAdminInstances] = useState([]);
  const [scope, setScope] = useState(instanceId);
  useEffect(() => {
    let alive = true;
    listMyAdminInstances().then((rows) => {
      if (!alive) return;
      setAdminInstances(rows);
      setScope((s) => s || (rows.find((r) => r.instanceId === instanceId) ? instanceId : rows[0]?.instanceId) || instanceId);
    });
    return () => { alive = false; };
  }, [instanceId]);
  const canGrant = useMemo(() => adminInstances.some((s) => s.instanceId === scope), [adminInstances, scope]);

  return (
    <section className="bg-white border border-[#1A1815] p-4 space-y-3">
      <div>
        <div className="text-sm font-semibold text-[#1A1815]" style={serif}>Support access</div>
        <p className="text-xs text-[#5A5751] mt-0.5 leading-relaxed" style={serif}>
          Fix issues without ambient access to data. Grant a specialist time-boxed access to one record; they read only that record while it’s live, and every read is logged. Clinical/health data is never available here.
        </p>
      </div>

      {canGrant && (
        <>
          {adminInstances.length > 1 && (
            <label className="flex items-center gap-2 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">
              Space
              <select className="text-xs p-1 border border-[#E8E4DC] bg-white normal-case tracking-normal" value={scope || ''} onChange={(e) => setScope(e.target.value)}>
                {adminInstances.map((s) => <option key={s.instanceId} value={s.instanceId}>{s.displayName || s.instanceId}{s.instanceType === 'church' ? ' (church)' : ''}</option>)}
              </select>
            </label>
          )}
          <GrantForm instanceId={scope} />
        </>
      )}

      <div className="pt-2 border-t border-[#E8E4DC]">
        <GetHelp instanceId={scope || instanceId} />
      </div>

      <div className="pt-2 border-t border-[#E8E4DC]">
        <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold">Your active grants</div>
        <MyGrants />
      </div>
    </section>
  );
}
