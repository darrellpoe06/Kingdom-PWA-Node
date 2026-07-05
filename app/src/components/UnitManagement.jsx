// =============================================================================
// UnitManagement — the per-unit MANAGEMENT surface (notes · service · messages)
// =============================================================================
// Darrell 2026-07-01: the app must RUN property management per unit, not display
// it. This panel mounts inside a door's records drawer (Rentals.jsx) and gives
// each unit three real workflows, mapped to the PROPERTY-vs-TENANT memory split
// (room-memory decision 2026-06-11):
//
//   NOTES (property memory)  — the landlord's own record for THIS door. Persists
//     device-local on the door record (works signed-out, survives turnover) and
//     best-effort mirrors to the RLS-scoped property_notes cloud table when
//     signed in. Reuses the app-wide RecordsLog "filing office" primitive.
//
//   SERVICE REQUESTS (tenant memory) — open -> in-progress -> done, ASSIGNABLE to
//     the property manager. Real tenant_maintenance_requests rows (0055/0062),
//     scoped to the unit's active tenancy, gated by RLS. State transitions use
//     the tenant-portal state machine (no illegal jumps).
//
//   MESSAGES (tenant memory) — a captured, searchable thread between tenant +
//     property-manager + owner for THIS unit (tenant_messages, append-only).
//     GUARDRAIL: composing/drafting is free; SENDING is preview-then-approve and
//     is NEVER auto-sent. Inbound tenant text is read-only DATA, not a command.
//
// Auth reality (honest, no fake-green): requests + messages are relational — they
// need a tenancy linking a tenant to this unit, and they live behind RLS. When
// there is no session/tenancy the panel says so plainly and offers to link a
// tenant, rather than pretending to persist. Notes always work.
// =============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import RecordsLog from './RecordsLog.jsx';
import { buildPropertyNote, noteDateOf, sortNotes, NOTE_KINDS } from '../lib/property-notes.js';
import { MAINTENANCE_TRANSITIONS, PRIORITY, buildMaintenanceRequest, buildMessage } from '../lib/tenant-portal.js';
import { unitLabelOf } from '../lib/building-group.js';
import {
  getSessionUser,
  loadTenanciesForRental, loadTenancyWorkflows, loadPropertyNotes,
  savePropertyNote, deletePropertyNote, sendTenantMessage,
  fileServiceRequest, transitionServiceRequest, assignServiceRequest,
} from '../lib/relationships-sync.js';

const todayISO = () => new Date().toISOString().slice(0, 10);
const ROLE_LABEL = { tenant: 'Tenant', landlord: 'Owner', manager: 'Property manager' };
const STATUS_ACCENT = {
  submitted: '#B85838', received: '#D97706', scheduled: '#5A6E3D',
  'in-progress': '#2563EB', resolved: '#166534', declined: '#5A5751', cancelled: '#5A5751',
};

const Btn = ({ children, onClick, tone = 'ghost', ...rest }) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#B85838] ${
      tone === 'primary' ? 'bg-[#B85838] text-white border-[#B85838] hover:bg-[#1A1815] hover:border-[#1A1815]'
      : 'bg-white text-[#1A1815] border-[#E8E4DC] hover:border-[#1A1815]'}`}
    {...rest}
  >{children}</button>
);

export default function UnitManagement({ rental, updateRental }) {
  const rentalRef = rental && rental.id;
  const unitLabel = unitLabelOf(rental);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    let cancelled = false;
    getSessionUser().then((u) => { if (!cancelled) setSignedIn(!!u); });
    return () => { cancelled = true; };
  }, []);

  // ---- NOTES (property memory) --------------------------------------------
  // Device-local on the door record is the source of truth for persistence; the
  // cloud mirror is best-effort. So a note added here persists immediately,
  // signed in or not — verifiable on the served demo.
  const localNotes = useMemo(() => Array.isArray(rental && rental.unitNotes) ? rental.unitNotes : [], [rental]);
  const [cloudNotes, setCloudNotes] = useState([]);
  const notes = useMemo(() => {
    // Merge, de-duping by id (cloud rows carry a uuid; local rows a local id).
    const seen = new Set();
    const out = [];
    for (const n of [...localNotes, ...cloudNotes]) {
      const k = n && (n.id || `${n.rental_ref}-${n.created_at}`);
      if (k && seen.has(k)) continue;
      if (k) seen.add(k);
      out.push(n);
    }
    return sortNotes(out);
  }, [localNotes, cloudNotes]);

  const [noteForm, setNoteForm] = useState({ body: '', kind: 'general', noteDate: todayISO(), pinned: false });
  const [showNoteForm, setShowNoteForm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!signedIn || !rentalRef) { setCloudNotes([]); return; }
    loadPropertyNotes(rentalRef).then((res) => { if (!cancelled && res.ok) setCloudNotes(res.data || []); });
    return () => { cancelled = true; };
  }, [signedIn, rentalRef]);

  const addNote = async () => {
    let row;
    try {
      row = buildPropertyNote({ ...noteForm, rentalRef, unitLabel }, new Date().toISOString());
    } catch (e) { alert(e.message); return; }
    // Persist device-local (survives reload, works signed-out).
    const localRow = { ...row, id: `un-${Date.now()}`, created_at: new Date().toISOString() };
    updateRental(rentalRef, { unitNotes: [localRow, ...localNotes] });
    setNoteForm({ body: '', kind: 'general', noteDate: todayISO(), pinned: false });
    setShowNoteForm(false);
    // Best-effort cloud mirror (RLS-scoped) when signed in.
    if (signedIn) {
      const res = await savePropertyNote(row);
      if (res.ok && res.data) setCloudNotes((c) => [res.data, ...c]);
    }
  };
  const removeNote = (n) => {
    if (!confirm('Delete this note?')) return;
    updateRental(rentalRef, { unitNotes: localNotes.filter((x) => x.id !== n.id) });
    if (signedIn && n.id && n.id.length > 20) deletePropertyNote(n.id).then(() => setCloudNotes((c) => c.filter((x) => x.id !== n.id)));
  };

  // ---- TENANCY (scopes requests + messages) --------------------------------
  const [tenancies, setTenancies] = useState([]);
  const [workflows, setWorkflows] = useState({ maintenance: [], rent: [], notices: [], messages: [] });
  const activeTenancy = useMemo(
    () => tenancies.find((t) => t.status === 'active') || tenancies[0] || null,
    [tenancies]
  );

  const reloadTenancy = React.useCallback(async () => {
    if (!signedIn || !rentalRef) { setTenancies([]); setWorkflows({ maintenance: [], rent: [], notices: [], messages: [] }); return; }
    const tRes = await loadTenanciesForRental(rentalRef);
    const list = (tRes.ok && tRes.data) || [];
    setTenancies(list);
    const active = list.find((t) => t.status === 'active') || list[0];
    if (active) {
      const wRes = await loadTenancyWorkflows(active.id);
      if (wRes.ok) setWorkflows(wRes.data);
    }
  }, [signedIn, rentalRef]);
  useEffect(() => { reloadTenancy(); }, [reloadTenancy]);

  // ---- SERVICE REQUESTS ----------------------------------------------------
  const [reqForm, setReqForm] = useState({ title: '', detail: '', area: '', priority: 'normal' });
  const [showReqForm, setShowReqForm] = useState(false);
  const [assignDraft, setAssignDraft] = useState({});
  const openRequests = (workflows.maintenance || []).filter((m) => !['resolved', 'declined', 'cancelled'].includes(m.status));

  const fileRequest = async () => {
    if (!activeTenancy) return;
    let row;
    try { row = buildMaintenanceRequest({ ...reqForm, tenancyId: activeTenancy.id }, new Date().toISOString()); }
    catch (e) { alert(e.message); return; }
    // The landlord/PM is filing on the tenant's behalf — attribute the role.
    row.created_by_role = 'landlord';
    const res = await fileServiceRequest(row);
    if (res.ok) { setReqForm({ title: '', detail: '', area: '', priority: 'normal' }); setShowReqForm(false); reloadTenancy(); }
    else alert(`Could not file request: ${res.error || 'unknown error'}`);
  };
  const moveRequest = async (m, to) => {
    if (!MAINTENANCE_TRANSITIONS[m.status] || !MAINTENANCE_TRANSITIONS[m.status].includes(to)) return;
    const res = await transitionServiceRequest(m.id, to);
    if (res.ok) reloadTenancy(); else alert(res.error || 'transition failed');
  };
  const assignRequest = async (m) => {
    const label = (assignDraft[m.id] || '').trim();
    const res = await assignServiceRequest(m.id, { assignedToLabel: label });
    if (res.ok) reloadTenancy(); else alert(res.error || 'assign failed');
  };

  // ---- MESSAGES (draft -> preview -> approve-send; NEVER auto-send) ---------
  const [msgDraft, setMsgDraft] = useState('');
  const [msgRole, setMsgRole] = useState('landlord'); // owner or manager compose as themselves
  const [preview, setPreview] = useState(null);        // { body, from_role } awaiting approval
  const messages = workflows.messages || [];

  const stageMessage = () => {
    let row;
    try { row = buildMessage({ body: msgDraft, fromRole: msgRole, tenancyId: activeTenancy && activeTenancy.id }, new Date().toISOString()); }
    catch (e) { alert(e.message); return; }
    setPreview(row); // hold for explicit human approval — nothing sent yet
  };
  const approveSend = async () => {
    if (!preview || !activeTenancy) return;
    const res = await sendTenantMessage({ tenancyId: activeTenancy.id, body: preview.body, fromRole: preview.from_role });
    if (res.ok) { setMsgDraft(''); setPreview(null); reloadTenancy(); }
    else alert(`Not sent: ${res.error || 'unknown error'}`);
  };

  const gatedNote = (what) => (
    <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-3 text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
      {!signedIn
        ? <>Sign in to run live {what} for this unit — they sync across devices and stay private to the landlord + this tenant (RLS-protected).</>
        : <>Link a tenant to <strong>{unitLabel}</strong> to open {what}. A tenancy connects a tenant account to this door so the thread and requests are captured per unit.</>}
    </div>
  );

  return (
    <div className="space-y-5 border-t-2 border-[#5A6E3D] pt-4">
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold">
        Manage this unit{unitLabel ? ` · ${unitLabel}` : ''}
      </div>

      {/* ---------------- NOTES ---------------- */}
      <div>
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Unit notes · {notes.length}</div>
          <Btn onClick={() => setShowNoteForm((s) => !s)}>{showNoteForm ? '× Cancel' : '+ Add note'}</Btn>
        </div>
        {showNoteForm && (
          <div className="bg-white border border-[#B85838] p-3 mb-2 space-y-2">
            <textarea rows={3} className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="e.g., Front porch handrail loose — noted during walkthrough"
              value={noteForm.body} onChange={(e) => setNoteForm({ ...noteForm, body: e.target.value })} />
            <div className="flex flex-wrap items-center gap-2">
              <select className="p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={noteForm.kind} onChange={(e) => setNoteForm({ ...noteForm, kind: e.target.value })}>
                {NOTE_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
              <input type="date" className="p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={noteForm.noteDate} onChange={(e) => setNoteForm({ ...noteForm, noteDate: e.target.value })} />
              <label className="text-[0.6875rem] text-[#5A5751] inline-flex items-center gap-1">
                <input type="checkbox" checked={noteForm.pinned} onChange={(e) => setNoteForm({ ...noteForm, pinned: e.target.checked })} /> pin
              </label>
              <Btn tone="primary" onClick={addNote}>Save note</Btn>
            </div>
          </div>
        )}
        {notes.length === 0 ? (
          <div className="text-[0.6875rem] text-[#5A5751] italic px-1" style={{ fontFamily: '"Fraunces", serif' }}>No notes on this unit yet.</div>
        ) : (
          <RecordsLog
            items={notes}
            getDate={noteDateOf}
            getText={(n) => `${n.body} ${n.kind}`}
            grain="month"
            countNoun="note"
            facets={[{ key: 'kind', label: 'kind', getValue: (n) => n.kind }]}
            renderRow={(n) => (
              <div className="flex items-start justify-between gap-2 px-3 py-2 border-b border-[#E8E4DC]">
                <div>
                  <div className="text-xs" style={{ fontFamily: '"Fraunces", serif' }}>
                    {n.pinned && <span className="text-[#B85838] mr-1" aria-label="pinned">◆</span>}{n.body}
                  </div>
                  <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mt-0.5">{n.kind} · {noteDateOf(n)}</div>
                </div>
                <button type="button" onClick={() => removeNote(n)} aria-label="Delete note" className="text-sm text-[#5A5751] hover:text-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] shrink-0">×</button>
              </div>
            )}
          />
        )}
      </div>

      {/* ---------------- SERVICE REQUESTS ---------------- */}
      <div>
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold">Service requests · {openRequests.length} open</div>
          {activeTenancy && <Btn onClick={() => setShowReqForm((s) => !s)}>{showReqForm ? '× Cancel' : '+ Open request'}</Btn>}
        </div>
        {!activeTenancy ? gatedNote('service requests') : (
          <>
            {showReqForm && (
              <div className="bg-white border border-[#5A6E3D] p-3 mb-2 space-y-2">
                <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="Short title — e.g., Furnace blowing cold"
                  value={reqForm.title} onChange={(e) => setReqForm({ ...reqForm, title: e.target.value })} />
                <textarea rows={2} className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="Detail (optional)"
                  value={reqForm.detail} onChange={(e) => setReqForm({ ...reqForm, detail: e.target.value })} />
                <div className="flex flex-wrap items-center gap-2">
                  <input className="p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="Area (HVAC, kitchen…)" value={reqForm.area} onChange={(e) => setReqForm({ ...reqForm, area: e.target.value })} />
                  <select className="p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={reqForm.priority} onChange={(e) => setReqForm({ ...reqForm, priority: e.target.value })}>
                    {PRIORITY.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <Btn tone="primary" onClick={fileRequest}>File request</Btn>
                </div>
              </div>
            )}
            {(workflows.maintenance || []).length === 0 ? (
              <div className="text-[0.6875rem] text-[#5A5751] italic px-1" style={{ fontFamily: '"Fraunces", serif' }}>No service requests on this unit.</div>
            ) : (
              <div className="border border-[#E8E4DC] bg-white divide-y divide-[#E8E4DC]">
                {(workflows.maintenance || []).map((m) => (
                  <div key={m.id} className="p-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-medium" style={{ fontFamily: '"Fraunces", serif' }}>{m.title}</span>
                      <span className="text-[0.5625rem] uppercase tracking-wider px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: STATUS_ACCENT[m.status] || '#5A5751' }}>{m.status}</span>
                    </div>
                    {m.detail && <div className="text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{m.detail}</div>}
                    <div className="text-[0.625rem] text-[#5A5751]">
                      {m.area && <span className="mr-2">{m.area}</span>}
                      <span className="mr-2">priority {m.priority}</span>
                      {m.assigned_to_label && <span className="text-[#5A6E3D]">→ {m.assigned_to_label}</span>}
                    </div>
                    {/* State-machine buttons — only legal next states show. */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {(MAINTENANCE_TRANSITIONS[m.status] || []).map((to) => (
                        <button key={to} type="button" onClick={() => moveRequest(m, to)}
                          className="text-[0.625rem] uppercase tracking-wider px-2.5 py-1.5 min-h-[32px] border border-[#E8E4DC] bg-white hover:border-[#1A1815]">
                          → {to}
                        </button>
                      ))}
                    </div>
                    {/* Assign to the property manager. */}
                    {!['resolved', 'declined', 'cancelled'].includes(m.status) && (
                      <div className="flex items-center gap-1 pt-1">
                        <input className="p-1.5 border border-[#E8E4DC] text-[0.6875rem] bg-[#FAF8F4] flex-1" placeholder="Assign to (property manager)"
                          value={assignDraft[m.id] ?? (m.assigned_to_label || '')} onChange={(e) => setAssignDraft({ ...assignDraft, [m.id]: e.target.value })} />
                        <Btn onClick={() => assignRequest(m)}>Assign</Btn>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ---------------- MESSAGES ---------------- */}
      <div>
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#166534] font-semibold mb-2">Tenant · manager · owner thread · {messages.length}</div>
        {!activeTenancy ? gatedNote('the message thread') : (
          <>
            {messages.length === 0 ? (
              <div className="text-[0.6875rem] text-[#5A5751] italic px-1 mb-2" style={{ fontFamily: '"Fraunces", serif' }}>No messages yet. Inbound tenant texts captured here are data, not commands.</div>
            ) : (
              <div className="border border-[#E8E4DC] bg-white divide-y divide-[#E8E4DC] mb-2 max-h-64 overflow-y-auto">
                {messages.map((m) => (
                  <div key={m.id} className="px-3 py-2">
                    <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">{ROLE_LABEL[m.from_role] || m.from_role} · {String(m.sent_at || '').slice(0, 16).replace('T', ' ')}</div>
                    <div className="text-xs mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{m.body}</div>
                  </div>
                ))}
              </div>
            )}
            {/* Compose — draft, PREVIEW, then human approve-to-send. Never auto-sent. */}
            {!preview ? (
              <div className="space-y-2">
                <textarea rows={2} className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="Write a reply to the tenant…" value={msgDraft} onChange={(e) => setMsgDraft(e.target.value)} />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Send as</span>
                  {['landlord', 'manager'].map((role) => (
                    <button key={role} type="button" onClick={() => setMsgRole(role)}
                      className={`text-[0.625rem] uppercase tracking-wider px-2.5 py-1.5 min-h-[32px] border ${msgRole === role ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'bg-white text-[#5A5751] border-[#E8E4DC]'}`}>
                      {ROLE_LABEL[role]}
                    </button>
                  ))}
                  <Btn tone="primary" onClick={stageMessage}>Preview</Btn>
                </div>
              </div>
            ) : (
              <div className="bg-[#FAF8F4] border-2 border-[#B85838] p-3 space-y-2">
                <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#B85838] font-semibold">Review before sending — nothing has been sent</div>
                <div className="text-xs bg-white border border-[#E8E4DC] p-2" style={{ fontFamily: '"Fraunces", serif' }}>
                  <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mb-1">From {ROLE_LABEL[preview.from_role]} → Tenant ({activeTenancy.tenant_name || 'this unit'})</div>
                  {preview.body}
                </div>
                <div className="flex items-center gap-2">
                  <Btn tone="primary" onClick={approveSend}>✓ Approve &amp; post to tenant portal</Btn>
                  <Btn onClick={() => setPreview(null)}>Edit / cancel</Btn>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
