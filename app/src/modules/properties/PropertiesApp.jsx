// =============================================================================
// PropertiesApp — the Poe Properties workspace, mounted by BOTH apps
// =============================================================================
// Darrell, 2026-08-26: "keep that as another Module/s so we can use the PoeTech
// App or the Poe Properties App for management ... 1099 workers and tenants and
// their families will use the Poe Properties App ... Both Apps should be able to
// work together or separate ... keeping both with latest Synced data."
//
// So this is ONE component with no door-specific branch: the PoeTech shell mounts
// it at ?view=properties, and the Poe Properties door mounts it at /properties/app/.
// Same module, same tables, same RLS — the two faces cannot drift because there is
// nothing to drift FROM.
//
// WHAT RENDERS IS DERIVED FROM WHAT THE PERSON REALLY HOLDS (DR-0061/DR-0076):
// the face comes from their claimed role + their actual capability grants; a tab
// they were not granted renders LOCKED with the reason, never silently missing;
// an empty spine says it is empty rather than showing a painted example.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  resolveFace, buildHistory, newestFirst, buildJobDoc, buildTenancyNote,
  DOC_FOLLOWUPS, FOLLOWUP_LABELS, CAPABILITY_LABELS, ROLE_CEILING,
  canPostToBooks, rentRecordToBookEntry, unpostedRent,
} from './model.js';
import {
  claimPropertyAccess, loadMyDoors, loadMyGrants, loadMyHousehold, loadDoorRecord,
  fileWorkOrder, setWorkOrderStatus, assignWorkOrder, postMessage, postNote,
  postJobDoc, recordRent, confirmRent, markRentPosted, inviteToProperties, createTenancy,
} from './cloud.js';
import { MAINTENANCE_TRANSITIONS, PRIORITY, buildMaintenanceRequest } from '../../lib/tenant-portal.js';
import { smsHref, telHref, buildDispatchMessage } from '../../lib/dispatch.js';
import { stageFromRecord, confirmDraft, tenancyRowFromDraft } from './staging.js';
import { availableDocuments, buildDocument } from './documents.js';
import { phoneLoginEmail } from '../../lib/supabase.js';
import { POE_PROPERTIES, LAUNCH_PLAN, OPPORTUNITIES, CONSTRAINTS } from './config.js';

const ACCENT = '#2F5D50';
const serif = { fontFamily: '"Fraunces", serif' };

const Btn = ({ children, onClick, tone = 'ghost', disabled, ...rest }) => (
  <button
    type="button" onClick={onClick} disabled={disabled}
    className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#2F5D50] disabled:opacity-40 ${
      tone === 'primary' ? 'bg-[#2F5D50] text-white border-[#2F5D50] hover:bg-[#1A1815] hover:border-[#1A1815]'
        : 'bg-white text-[#1A1815] border-[#E8E4DC] hover:border-[#1A1815]'}`}
    {...rest}
  >{children}</button>
);

const Card = ({ title, children, right }) => (
  <section className="bg-white border border-[#E8E4DC] p-3 sm:p-4 mb-3">
    {(title || right) && (
      <div className="flex items-baseline justify-between gap-3 mb-2">
        {title && <h3 className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold" style={{ color: ACCENT }}>{title}</h3>}
        {right}
      </div>
    )}
    {children}
  </section>
);

const Empty = ({ children }) => (
  <p className="text-xs text-[#5A5751]" style={serif}>{children}</p>
);

const when = (iso, undated) => {
  if (undated || !iso) return 'undated';
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
};

const KIND_LABEL = {
  'work-order': 'Work order', 'work-order-closed': 'Closed', message: 'Message',
  note: 'Note', 'job-doc': 'Job documentation', rent: 'Payment', notice: 'Notice',
  'property-note': 'Landlord note',
};

/**
 * @param {object}   props
 * @param {'door'|'poetech'} props.surface  which app mounted us (labels only)
 * @param {object=}  props.books            { postEntry(entry) } — present ONLY in
 *                   the PoeTech shell, where the family's books actually live.
 *                   Absent in the Poe Properties door: the money river runs
 *                   books-side by design (0150's posting trigger enforces it).
 */
export default function PropertiesApp({ surface = 'poetech', books = null, records = [] }) {
  const [loading, setLoading] = useState(true);
  const [doors, setDoors] = useState([]);
  const [grants, setGrants] = useState([]);
  const [household, setHousehold] = useState([]);
  const [claim, setClaim] = useState(null);
  const [activeId, setActiveId] = useState('');
  const [record, setRecord] = useState({ requests: [], messages: [], notes: [], docs: [], rent: [], notices: [] });
  const [tab, setTab] = useState('');
  const [busy, setBusy] = useState('');
  // Drafts the caller read from the family's own records (Drive/Gmail). The
  // module never fetches them itself — the shell hands them in, so this surface
  // has no opinion about WHERE a record lives, only about not asserting it.
  const [staged, setStaged] = useState(() => records.map((r) => stageFromRecord(r)).filter(Boolean));
  const [notice, setNotice] = useState('');

  // 1. Claim any waiting invitation, THEN read. Claiming is idempotent, so this
  //    is safe on every open and is what turns "invited" into "recognized".
  const boot = useCallback(async () => {
    setLoading(true);
    const claimed = await claimPropertyAccess();
    setClaim(claimed);
    const [d, g, h] = await Promise.all([loadMyDoors(), loadMyGrants(), loadMyHousehold()]);
    setDoors(d.ok ? d.doors : []);
    setGrants(g.ok ? g.grants : []);
    setHousehold(h.ok ? h.memberships : []);
    setLoading(false);
  }, []);
  useEffect(() => { boot(); }, [boot]);

  const activeDoor = useMemo(
    () => doors.find((x) => x.id === activeId) || doors[0] || null,
    [doors, activeId]
  );

  useEffect(() => {
    if (!activeDoor) { setRecord({ requests: [], messages: [], notes: [], docs: [], rent: [], notices: [] }); return; }
    let live = true;
    loadDoorRecord(activeDoor.id).then((r) => { if (live && r.ok) setRecord(r); });
    return () => { live = false; };
  }, [activeDoor, busy]);

  // 2. The role. Derived from what the database actually returned for THIS person:
  //    a household membership, a capability grant, or (the family's own session)
  //    the fact that they can see doors with no delegated grant at all.
  const role = useMemo(() => {
    if (household.some((m) => m.tenancy_id === activeDoor?.id)) return 'household';
    if (grants.includes('request.manage') || grants.includes('rentroll.view')) return 'manager';
    if (grants.includes('docs.add') || grants.includes('property.history')) return 'field_worker';
    if (activeDoor && !grants.length && household.length === 0) {
      // Either the tenant of this door, or the landlord looking at their own
      // portfolio. The tenancy's own tenant fields answer it without guessing.
      return surface === 'poetech' ? 'owner' : 'tenant';
    }
    return 'tenant';
  }, [grants, household, activeDoor, surface]);

  const face = useMemo(() => resolveFace(role, grants), [role, grants]);
  const activeTab = tab || face.tabs.find((t) => !t.locked)?.id || face.tabs[0]?.id || '';

  const history = useMemo(() => newestFirst(buildHistory(record)), [record]);
  const openWork = useMemo(
    () => (record.requests || []).filter((r) => !['resolved', 'declined', 'cancelled'].includes(r.status)),
    [record.requests]
  );

  const refresh = () => setBusy(`r-${Date.now()}`);
  const say = (m) => { setNotice(m); setTimeout(() => setNotice(''), 6000); };

  // ---- actions -------------------------------------------------------------
  const submitWorkOrder = async (form) => {
    if (!activeDoor) return;
    const built = buildMaintenanceRequest({ ...form, tenancyId: activeDoor.id, byRole: role });
    const res = await fileWorkOrder({
      instance_id: activeDoor.instance_id, tenancy_id: activeDoor.id,
      created_by_role: role === 'owner' ? 'landlord' : role === 'field_worker' ? 'worker' : role,
      title: built.title || form.title, detail: built.detail || form.detail || null,
      area: form.area || null, priority: built.priority || 'normal', status: 'submitted',
    });
    say(res.ok ? 'Work order filed.' : `Could not file it: ${res.reason}`);
    refresh();
  };

  const sendMessage = async (body) => {
    if (!activeDoor || !body.trim()) return;
    const res = await postMessage({
      instanceId: activeDoor.instance_id, tenancyId: activeDoor.id, body: body.trim(),
      fromRole: role === 'owner' ? 'landlord' : role === 'field_worker' ? 'worker' : role,
    });
    say(res.ok ? 'Sent.' : `Not sent: ${res.reason}`);
    refresh();
  };

  const addNote = async (body) => {
    if (!activeDoor || !body.trim()) return;
    const res = await postNote(buildTenancyNote({
      instanceId: activeDoor.instance_id, tenancyId: activeDoor.id, authorRole: role, body,
    }));
    say(res.ok ? 'Note added to the record.' : `Not saved: ${res.reason}`);
    refresh();
  };

  const documentJob = async (requestId, outcome, followup, note) => {
    if (!activeDoor) return;
    const res = await postJobDoc(buildJobDoc({
      instanceId: activeDoor.instance_id, requestId, tenancyId: activeDoor.id, outcome, followup, note,
    }));
    if (res.ok && outcome === 'fixed') await setWorkOrderStatus(requestId, 'resolved');
    say(res.ok ? 'Documented.' : `Not saved: ${res.reason}`);
    refresh();
  };

  const confirmStaged = async (draft, rentalRef) => {
    const door = doors.find((d) => (d.rental_ref || d.id) === rentalRef);
    const built = tenancyRowFromDraft(confirmDraft(draft), {
      instanceId: door?.instance_id || activeDoor?.instance_id,
      rentalRef, propertyLabel: door?.property_label, unitLabel: door?.unit_label, confirmed: true,
    });
    if (!built.ok) { say(`Not saved: ${built.reason}`); return; }
    const res = await createTenancy(built.row);
    if (res.ok) setStaged((prev) => prev.filter((s) => s !== draft));
    say(res.ok ? `${built.row.tenant_name} is on the door now.` : `Not saved: ${res.reason}`);
    refresh();
  };

  const postRentToBooks = async (rentRow) => {
    const gate = canPostToBooks(rentRow);
    if (!gate.ok) { say(`Not posted: ${gate.reason}`); return; }
    if (!books || typeof books.postEntry !== 'function') {
      say('Posting to the books happens in the PoeTech app, where the books live.');
      return;
    }
    const entry = rentRecordToBookEntry(rentRow, {
      propertyLabel: activeDoor?.property_label, unitLabel: activeDoor?.unit_label,
    });
    books.postEntry(entry);
    const res = await markRentPosted(rentRow.id, entry.id);
    say(res.ok ? 'Posted to the books.' : `The books entry was made but the record could not be stamped: ${res.reason}`);
    refresh();
  };

  // ---- render --------------------------------------------------------------
  if (loading) return <div className="p-4 text-xs text-[#5A5751]" style={serif}>Opening your properties…</div>;

  if (!doors.length) {
    return (
      <div className="p-1">
        <Card title="Poe Properties">
          <p className="text-sm text-[#1A1815] mb-2" style={serif}>
            You are signed in, and there is no door assigned to you yet.
          </p>
          <Empty>
            {claim && claim.ok === false && claim.reason === 'not-enabled-yet'
              ? 'The invitation system is not switched on for this database yet. Nothing is missing on your end.'
              : 'A landlord invites you by your email address or your cell phone number. When they do, open this app again and your place will be here — nothing to enter, nothing to set up.'}
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-1">
      {notice && <div className="mb-2 px-3 py-2 border text-xs" style={{ ...serif, borderColor: ACCENT, color: ACCENT }} role="status">{notice}</div>}

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold" style={{ color: ACCENT }}>{face.label}</span>
        {doors.length > 1 ? (
          <select
            value={activeDoor?.id || ''} onChange={(e) => { setActiveId(e.target.value); setTab(''); }}
            className="text-xs border border-[#E8E4DC] px-2 py-1 bg-white" style={serif} aria-label="Choose a door"
          >
            {doors.map((d) => (
              <option key={d.id} value={d.id}>{[d.property_label, d.unit_label].filter(Boolean).join(' · ') || d.rental_ref}</option>
            ))}
          </select>
        ) : (
          <span className="text-xs text-[#1A1815]" style={serif}>
            {[activeDoor?.property_label, activeDoor?.unit_label].filter(Boolean).join(' · ') || activeDoor?.rental_ref}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {face.tabs.map((t) => (
          <Btn key={t.id} tone={activeTab === t.id ? 'primary' : 'ghost'} onClick={() => setTab(t.id)}>
            {t.label}{t.locked ? ' · locked' : ''}
          </Btn>
        ))}
      </div>

      {(() => {
        const current = face.tabs.find((t) => t.id === activeTab);
        if (current?.locked) {
          return <Card title={current.label}><Empty>{current.lockReason}</Empty></Card>;
        }
        switch (activeTab) {
          case 'door': return <DoorCard door={activeDoor} />;
          case 'doors': return (
            <DoorsTab
              doors={doors} staged={staged}
              onPick={(id) => { setActiveId(id); setTab('history'); }}
              onConfirmDraft={confirmStaged}
            />
          );
          case 'work': case 'jobs': case 'board':
            return (
              <WorkTab
                door={activeDoor} requests={record.requests} open={openWork} docs={record.docs} role={role}
                canFile={role !== 'field_worker'} canManage={role === 'owner' || role === 'manager'}
                onFile={submitWorkOrder} onStatus={async (id, s) => { await setWorkOrderStatus(id, s); refresh(); }}
                onAssign={async (id, label) => { await assignWorkOrder(id, { assignedToLabel: label }); refresh(); }}
                onDocument={documentJob}
              />
            );
          case 'document':
            return <DocumentTab requests={openWork} onDocument={documentJob} />;
          case 'dispatch':
            return <DispatchTab door={activeDoor} open={openWork} />;
          case 'thread':
            return <ThreadTab messages={record.messages} onSend={sendMessage} />;
          case 'history':
            return <HistoryTab history={history} onNote={addNote} />;
          case 'rent':
            return (
              <RentTab
                rent={record.rent} door={activeDoor} role={role} face={face} booksAvailable={!!books}
                onReport={async (amount, period, method) => {
                  await recordRent({ instanceId: activeDoor.instance_id, tenancyId: activeDoor.id, amount, forPeriod: period, method, role: 'tenant', status: 'reported' });
                  refresh();
                }}
                onConfirm={async (id) => { await confirmRent(id); refresh(); }}
                onPost={postRentToBooks}
              />
            );
          case 'notices':
            return (
              <Card title="Notices">
                {record.notices.length === 0 ? <Empty>Nothing posted.</Empty> : record.notices.map((n) => (
                  <div key={n.id} className="border-b border-[#F0EDE6] py-2">
                    <div className="text-sm text-[#1A1815]" style={serif}>{n.title}</div>
                    {n.body && <div className="text-xs text-[#5A5751]" style={serif}>{n.body}</div>}
                    <div className="text-[0.625rem] text-[#8A867E]">{when(n.posted_at)}</div>
                  </div>
                ))}
              </Card>
            );
          case 'documents':
            return <DocumentsTab door={activeDoor} tenancy={activeDoor} />;
          case 'plan':
            return <PlanTab />;
          case 'people':
            return <PeopleTab door={activeDoor} onInvite={async (payload) => {
              const res = await inviteToProperties({ instanceId: activeDoor.instance_id, ...payload });
              say(res.ok ? `Invitation written for ${payload.email}. They get access the moment they sign in to that address.` : `Not written: ${res.reason}`);
            }} />;
          default:
            return null;
        }
      })()}
    </div>
  );
}

// --- tabs -------------------------------------------------------------------

function DoorCard({ door }) {
  if (!door) return null;
  return (
    <Card title="My place">
      <dl className="text-xs" style={serif}>
        <div className="flex justify-between border-b border-[#F0EDE6] py-1"><dt className="text-[#5A5751]">Address</dt><dd className="text-[#1A1815]">{[door.property_label, door.unit_label].filter(Boolean).join(' · ')}</dd></div>
        <div className="flex justify-between border-b border-[#F0EDE6] py-1"><dt className="text-[#5A5751]">Lease</dt><dd className="text-[#1A1815]">{door.lease_start || '—'} → {door.lease_end || '—'}</dd></div>
        <div className="flex justify-between border-b border-[#F0EDE6] py-1"><dt className="text-[#5A5751]">Monthly rent</dt><dd className="text-[#1A1815]">${Number(door.monthly_rent || 0).toFixed(2)}</dd></div>
        <div className="flex justify-between py-1"><dt className="text-[#5A5751]">Status</dt><dd className="text-[#1A1815]">{door.status}</dd></div>
      </dl>
    </Card>
  );
}

/**
 * Drafts read from the family's OWN records, waiting on a human. Every value
 * shows where it came from, and nothing here has been written: confirming is
 * what writes a tenancy (staging.js refuses an unconfirmed draft outright).
 */
function StagedDrafts({ staged, doors, onConfirm }) {
  const [chosen, setChosen] = useState({});
  if (!staged || !staged.length) return null;
  return (
    <Card title={`From your records (${staged.length})`}>
      <Empty>Read from your own files — nothing is saved until you confirm it, and a blank field means the record did not say.</Empty>
      {staged.map((s, i) => (
        <div key={`${s.draft.tenantName}-${i}`} className="border-b border-[#F0EDE6] py-2">
          <div className="text-sm text-[#1A1815]" style={serif}>{s.draft.tenantName}</div>
          <div className="text-xs text-[#5A5751]" style={serif}>
            {s.draft.leaseStart || 'no start date'} → {s.draft.leaseEnd || 'no end date'}
            {s.draft.monthlyRent ? ` · $${s.draft.monthlyRent}/mo` : ' · rent not stated'}
          </div>
          {s.missing.length > 0 && (
            <div className="text-[0.625rem] text-[#8A867E]">Not in the record: {s.missing.join(', ')}</div>
          )}
          {s.notes.map((n, j) => (
            <div key={j} className="text-[0.625rem] text-[#8A867E]">{n}</div>
          ))}
          <div className="flex flex-wrap items-center gap-1 mt-2">
            <select
              value={chosen[i] || ''} onChange={(e) => setChosen((p) => ({ ...p, [i]: e.target.value }))}
              aria-label={`Which door is ${s.draft.tenantName}'s?`}
              className="text-xs border border-[#E8E4DC] px-2 py-1 bg-white" style={serif}
            >
              <option value="">Which door?</option>
              {doors.map((d) => (
                <option key={d.id} value={d.rental_ref || d.id}>{[d.property_label, d.unit_label].filter(Boolean).join(' · ') || d.rental_ref}</option>
              ))}
            </select>
            <Btn tone="primary" disabled={!chosen[i]} onClick={() => onConfirm(s, chosen[i])}>Confirm</Btn>
          </div>
        </div>
      ))}
    </Card>
  );
}

function DoorsTab({ doors, onPick, staged, onConfirmDraft }) {
  return (
    <>
    <StagedDrafts staged={staged} doors={doors} onConfirm={onConfirmDraft} />
    <Card title={`Doors (${doors.length})`}>
      {doors.map((d) => (
        <button key={d.id} type="button" onClick={() => onPick(d.id)}
          className="w-full text-left border-b border-[#F0EDE6] py-2 hover:bg-[#FAF8F4]">
          <div className="text-sm text-[#1A1815]" style={serif}>{[d.property_label, d.unit_label].filter(Boolean).join(' · ')}</div>
          <div className="text-xs text-[#5A5751]" style={serif}>{d.tenant_name || 'No tenant on record'} · ${Number(d.monthly_rent || 0).toFixed(0)}/mo · {d.status}</div>
        </button>
      ))}
    </Card>
    </>
  );
}

function WorkTab({ door, requests, open, docs, role, canFile, canManage, onFile, onStatus, onAssign, onDocument }) {
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [priority, setPriority] = useState('normal');
  const docsFor = (id) => (docs || []).filter((d) => d.request_id === id);
  return (
    <>
      {canFile && (
        <Card title="Report something">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What is wrong?" aria-label="What is wrong"
            className="w-full text-sm border border-[#E8E4DC] px-2 py-2 mb-2" style={serif} />
          <textarea value={detail} onChange={(e) => setDetail(e.target.value)} rows={2} placeholder="Anything that helps (optional)" aria-label="Detail"
            className="w-full text-sm border border-[#E8E4DC] px-2 py-2 mb-2" style={serif} />
          <div className="flex flex-wrap items-center gap-2">
            <select value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="How urgent"
              className="text-xs border border-[#E8E4DC] px-2 py-1 bg-white" style={serif}>
              {PRIORITY.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <Btn tone="primary" disabled={!title.trim() || !door}
              onClick={() => { onFile({ title, detail, priority }); setTitle(''); setDetail(''); setPriority('normal'); }}>
              File it
            </Btn>
          </div>
        </Card>
      )}
      <Card title={`Open (${open.length})`}>
        {open.length === 0 ? <Empty>Nothing open right now.</Empty> : open.map((r) => (
          <div key={r.id} className="border-b border-[#F0EDE6] py-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm text-[#1A1815]" style={serif}>{r.title}</span>
              <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">{r.status}</span>
            </div>
            {r.detail && <div className="text-xs text-[#5A5751]" style={serif}>{r.detail}</div>}
            <div className="text-[0.625rem] text-[#8A867E]">{when(r.created_at)}{r.assigned_to_label ? ` · assigned to ${r.assigned_to_label}` : ''}</div>
            {docsFor(r.id).map((d) => (
              <div key={d.id} className="text-xs text-[#5A5751] pl-2 border-l-2 border-[#E8E4DC] mt-1" style={serif}>
                {d.outcome === 'fixed' ? 'Fixed' : `Not fixed — ${FOLLOWUP_LABELS[d.followup] || 'follow-up'}`}{d.note ? `: ${d.note}` : ''}
              </div>
            ))}
            {canManage && (
              <div className="flex flex-wrap gap-1 mt-2">
                {(MAINTENANCE_TRANSITIONS[r.status] || []).map((next) => (
                  <Btn key={next} onClick={() => onStatus(r.id, next)}>{next}</Btn>
                ))}
                <AssignRow current={r.assigned_to_label} onAssign={(who) => onAssign(r.id, who)} />
              </div>
            )}
            {role === 'field_worker' && <DocRow requestId={r.id} onDocument={onDocument} />}
          </div>
        ))}
      </Card>
    </>
  );
}

function AssignRow({ current, onAssign }) {
  const [open, setOpen] = useState(false);
  const [who, setWho] = useState(current || '');
  if (!open) return <Btn onClick={() => setOpen(true)}>{current ? 'Reassign' : 'Assign'}</Btn>;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <input
        value={who} onChange={(e) => setWho(e.target.value)} autoFocus
        placeholder="Worker's name" aria-label="Assign to which worker"
        className="text-xs border border-[#E8E4DC] px-2 py-1 w-36" style={serif}
      />
      <Btn tone="primary" disabled={!who.trim()} onClick={() => { onAssign(who.trim()); setOpen(false); }}>Save</Btn>
      <Btn onClick={() => { setWho(current || ''); setOpen(false); }}>Cancel</Btn>
    </span>
  );
}

function DocRow({ requestId, onDocument }) {
  const [followup, setFollowup] = useState('needs_parts');
  const [note, setNote] = useState('');
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1">
      <Btn tone="primary" onClick={() => onDocument(requestId, 'fixed', null, note)}>Fixed</Btn>
      <select value={followup} onChange={(e) => setFollowup(e.target.value)} aria-label="Why it is not fixed"
        className="text-xs border border-[#E8E4DC] px-2 py-1 bg-white" style={serif}>
        {DOC_FOLLOWUPS.map((f) => <option key={f} value={f}>{FOLLOWUP_LABELS[f]}</option>)}
      </select>
      <Btn onClick={() => onDocument(requestId, 'not_fixed', followup, note)}>Not fixed</Btn>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" aria-label="Note"
        className="text-xs border border-[#E8E4DC] px-2 py-1 flex-1 min-w-[8rem]" style={serif} />
    </div>
  );
}

function DocumentTab({ requests, onDocument }) {
  return (
    <Card title="Document a job">
      {requests.length === 0 ? <Empty>No open jobs to document.</Empty> : requests.map((r) => (
        <div key={r.id} className="border-b border-[#F0EDE6] py-2">
          <div className="text-sm text-[#1A1815]" style={serif}>{r.title}</div>
          <DocRow requestId={r.id} onDocument={onDocument} />
        </div>
      ))}
    </Card>
  );
}

function DispatchTab({ door, open }) {
  const [phone, setPhone] = useState('');
  return (
    <Card title="Dispatch a job">
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Worker's phone" aria-label="Worker's phone"
        className="w-full text-sm border border-[#E8E4DC] px-2 py-2 mb-2" style={serif} />
      <Empty>The text opens in your own messaging app with the job already written. The app sends nothing on its own — you press send.</Empty>
      {open.map((r) => {
        const body = buildDispatchMessage({
          propertyName: door?.property_label || '', address: door?.property_label || '',
          description: r.title, priority: r.priority,
        });
        return (
          <div key={r.id} className="border-b border-[#F0EDE6] py-2 flex flex-wrap items-center gap-2">
            <span className="text-sm text-[#1A1815] flex-1 min-w-[8rem]" style={serif}>{r.title}</span>
            <a href={smsHref(phone, body)} className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 border ${phone ? 'bg-[#2F5D50] text-white border-[#2F5D50]' : 'pointer-events-none opacity-40 border-[#E8E4DC]'}`}>Text it</a>
            <a href={telHref(phone)} className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 border ${phone ? 'border-[#E8E4DC] text-[#1A1815]' : 'pointer-events-none opacity-40 border-[#E8E4DC]'}`}>Call</a>
          </div>
        );
      })}
    </Card>
  );
}

function ThreadTab({ messages, onSend }) {
  const [body, setBody] = useState('');
  return (
    <Card title="Messages">
      <div className="max-h-80 overflow-y-auto mb-2">
        {messages.length === 0 ? <Empty>No messages yet.</Empty> : messages.map((m) => (
          <div key={m.id} className="border-b border-[#F0EDE6] py-2">
            <div className="text-[0.625rem] uppercase tracking-wider text-[#8A867E]">{m.from_role} · {when(m.sent_at)}</div>
            <div className="text-sm text-[#1A1815]" style={serif}>{m.body}</div>
          </div>
        ))}
      </div>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} placeholder="Write a message" aria-label="Write a message"
        className="w-full text-sm border border-[#E8E4DC] px-2 py-2 mb-2" style={serif} />
      <Btn tone="primary" disabled={!body.trim()} onClick={() => { onSend(body); setBody(''); }}>Send</Btn>
    </Card>
  );
}

function HistoryTab({ history, onNote }) {
  const [body, setBody] = useState('');
  return (
    <>
      <Card title="Add to the record">
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} placeholder="A note anyone on this door can read later" aria-label="Add a note"
          className="w-full text-sm border border-[#E8E4DC] px-2 py-2 mb-2" style={serif} />
        <Btn tone="primary" disabled={!body.trim()} onClick={() => { onNote(body); setBody(''); }}>Add note</Btn>
      </Card>
      <Card title={`History (${history.length})`}>
        {history.length === 0 ? <Empty>Nothing has happened on this door yet.</Empty> : history.map((e) => (
          <div key={`${e.kind}-${e.id}`} className="border-b border-[#F0EDE6] py-2">
            <div className="text-[0.625rem] uppercase tracking-wider text-[#8A867E]">
              {KIND_LABEL[e.kind] || e.kind} · {when(e.at, e.undated)}{e.who ? ` · ${e.who}` : ''}
            </div>
            <div className="text-sm text-[#1A1815]" style={serif}>{e.summary}</div>
          </div>
        ))}
      </Card>
    </>
  );
}

function RentTab({ rent, role, face, onReport, onConfirm, onPost, booksAvailable }) {
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [method, setMethod] = useState('zelle');
  const canReport = role === 'tenant';
  const canConfirm = role === 'owner' || face.canWriteRent;
  const waiting = unpostedRent(rent);
  return (
    <>
      {canReport && (
        <Card title="I paid the rent">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="Amount" aria-label="Amount"
              className="text-sm border border-[#E8E4DC] px-2 py-2 w-28" style={serif} />
            <input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="YYYY-MM" aria-label="For which month"
              className="text-sm border border-[#E8E4DC] px-2 py-2 w-28" style={serif} />
            <select value={method} onChange={(e) => setMethod(e.target.value)} aria-label="How you paid"
              className="text-xs border border-[#E8E4DC] px-2 py-2 bg-white" style={serif}>
              {['zelle', 'cash', 'check', 'ach', 'venmo', 'cashapp', 'other'].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <Btn tone="primary" disabled={!(Number(amount) > 0)} onClick={() => { onReport(Number(amount), period, method); setAmount(''); }}>Record it</Btn>
          </div>
          <Empty>This records what you already paid outside the app. No money moves here — your landlord confirms it when it lands.</Empty>
        </Card>
      )}
      <Card title="Payment history">
        {rent.length === 0 ? <Empty>No payments recorded yet.</Empty> : rent.map((r) => (
          <div key={r.id} className="border-b border-[#F0EDE6] py-2 flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm text-[#1A1815]" style={serif}>${Number(r.amount || 0).toFixed(2)}{r.for_period ? ` · ${r.for_period}` : ''} · {r.method}</span>
            <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">
              {r.status}{r.posted_tx_id ? ' · in the books' : ''} · {when(r.confirmed_at || r.reported_at)}
            </span>
            {canConfirm && r.status === 'reported' && <Btn onClick={() => onConfirm(r.id)}>Confirm received</Btn>}
          </div>
        ))}
      </Card>
      {face.canPostToBooks && (
        <Card title={`To the books (${waiting.length})`}>
          {waiting.length === 0 ? <Empty>Every confirmed payment has been posted.</Empty> : waiting.map((r) => (
            <div key={r.id} className="border-b border-[#F0EDE6] py-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-[#1A1815]" style={serif}>${Number(r.amount || 0).toFixed(2)}{r.for_period ? ` · ${r.for_period}` : ''}</span>
              <Btn tone="primary" onClick={() => onPost(r)}>{booksAvailable ? 'Post to books' : 'Post in PoeTech'}</Btn>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

function PeopleTab({ door, onInvite }) {
  // Email OR cell phone (Darrell, 2026-08-26). Many tenants and 1099 workers
  // have no email at all — that is the whole premise of the phone+PIN door
  // (DR-0172), and an invite that only accepts email locks those people out of
  // their own place.
  const [by, setBy] = useState('phone');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roleLabel, setRoleLabel] = useState('tenant');
  const [caps, setCaps] = useState([]);
  const ceiling = ROLE_CEILING[roleLabel] || [];
  const toggle = (c) => setCaps((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  const identified = by === 'phone' ? !!phoneLoginEmail(phone) : email.includes('@');
  // The invitation still has to REACH them. No gateway sends it (DR-0313): the
  // landlord's own messaging app does, with the door link already written.
  const inviteText = `You've been added to ${door?.property_label || 'your place'} on Poe Properties. Open ${POE_PROPERTIES.shareUrl} and sign in with this number to see your unit, report anything broken, and message us.`;
  return (
    <Card title="Invite someone to this door">
      <div className="flex gap-1 mb-2">
        <Btn tone={by === 'phone' ? 'primary' : 'ghost'} onClick={() => setBy('phone')}>By cell phone</Btn>
        <Btn tone={by === 'email' ? 'primary' : 'ghost'} onClick={() => setBy('email')}>By email</Btn>
      </div>
      {by === 'phone' ? (
        <>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" placeholder="(555) 555-5555" aria-label="Their cell phone"
            className="w-full text-sm border border-[#E8E4DC] px-2 py-2 mb-1" style={serif} />
          <p className="text-xs text-[#5A5751] mb-2" style={serif}>
            They sign in with this number and a 6-digit PIN they choose — no email needed. A phone is collected, not text-verified, so use a number you know is theirs.
          </p>
        </>
      ) : (
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="their email" aria-label="Their email"
          className="w-full text-sm border border-[#E8E4DC] px-2 py-2 mb-2" style={serif} />
      )}
      <select value={roleLabel} onChange={(e) => { setRoleLabel(e.target.value); setCaps([]); }} aria-label="What they are"
        className="text-xs border border-[#E8E4DC] px-2 py-2 bg-white mb-2" style={serif}>
        <option value="tenant">Tenant (the lease signer)</option>
        <option value="household">Household member (their family)</option>
        <option value="field_worker">1099 worker</option>
        <option value="manager">Property manager</option>
      </select>
      {ceiling.length > 0 && (
        <div className="mb-2">
          {ceiling.map((c) => (
            <label key={c} className="flex items-center gap-2 text-xs py-1" style={serif}>
              <input type="checkbox" checked={caps.includes(c)} onChange={() => toggle(c)} />
              <span>{CAPABILITY_LABELS[c] || c}</span>
            </label>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Btn tone="primary" disabled={!identified || !door}
          onClick={() => {
            onInvite({ email: by === 'email' ? email : '', phone: by === 'phone' ? phone : '', roleLabel, tenancyId: door.id, scopeRef: door.rental_ref, capabilities: caps });
            setEmail(''); setPhone(''); setCaps([]);
          }}>
          Write the invitation
        </Btn>
        {by === 'phone' && (
          <a
            href={identified ? smsHref(phone, inviteText) : undefined}
            className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 border ${identified ? 'border-[#E8E4DC] text-[#1A1815]' : 'pointer-events-none opacity-40 border-[#E8E4DC]'}`}
          >Text them the link</a>
        )}
      </div>
      <p className="text-xs text-[#5A5751] mt-2" style={serif}>
        The invitation grants nothing by itself. They get exactly what is checked here, only after they sign in to that same email address — and you can revoke any of it at any time.
      </p>
    </Card>
  );
}

// The rollout, read from the SAME record the repo carries (config.js) — the
// launch plan validates itself, so a phase cannot claim "built" here without
// naming the file that proves it (DR-0076/DR-0121: no painted status).
const STATE_LABEL = { built: 'Built', gated: 'Waiting on a gate', hand: 'Waiting on a hand', planned: 'Planned' };

function PlanTab() {
  return (
    <>
      <Card title="Where this app is">
        {LAUNCH_PLAN.map((p) => (
          <div key={p.id} className="border-b border-[#F0EDE6] py-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm text-[#1A1815]" style={serif}>{p.id} · {p.title}</span>
              <span className="text-[0.625rem] uppercase tracking-wider" style={{ color: p.state === 'built' ? ACCENT : '#8A867E' }}>{STATE_LABEL[p.state]}</span>
            </div>
            <div className="text-xs text-[#5A5751]" style={serif}>{p.detail}</div>
            <div className="text-[0.625rem] text-[#8A867E]">
              {p.evidence ? `proof: ${p.evidence}` : ''}
              {p.gate ? `gate: ${p.gate}` : ''}
              {p.whoseHand ? `whose hand: ${p.whoseHand}` : ''}
              {p.reReview ? ` · re-review ${p.reReview}` : ''}
            </div>
          </div>
        ))}
      </Card>
      <Card title="Opportunities">
        {OPPORTUNITIES.map((o) => (
          <div key={o.id} className="border-b border-[#F0EDE6] py-2">
            <div className="text-sm text-[#1A1815]" style={serif}>{o.title}</div>
            <div className="text-xs text-[#5A5751]" style={serif}>{o.detail}</div>
            <div className="text-[0.625rem] text-[#8A867E]">re-review {o.reReview}</div>
          </div>
        ))}
      </Card>
      <Card title="Constraints we have actually hit">
        {CONSTRAINTS.map((c) => (
          <div key={c.id} className="border-b border-[#F0EDE6] py-2">
            <div className="text-sm text-[#1A1815]" style={serif}>{c.title}</div>
            <div className="text-xs text-[#5A5751]" style={serif}>{c.detail}</div>
          </div>
        ))}
      </Card>
    </>
  );
}

/**
 * The paperwork, prefilled from THIS door's records (documents.js). Nothing is
 * "generated" in the sense of invented: a field the records cannot fill shows
 * as a named blank, a regulated document says which law governs it, and every
 * draft leads with the counsel-review line until an attorney signs it off.
 */
function DocumentsTab({ door, tenancy }) {
  const [openId, setOpenId] = useState(null);
  const records = { door, tenancy };
  const list = availableDocuments(records);
  const open = openId ? buildDocument(openId, records) : null;
  return (
    <>
      <Card title="Documents for this door">
        <Empty>
          Each one starts from what this door already knows. A blank means the record did not say it — never a guess.
          Every draft goes to counsel before anyone signs it.
        </Empty>
        {list.map((d) => (
          <div key={d.id} className="border-b border-[#F0EDE6] py-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm text-[#1A1815]" style={serif}>{d.title}</span>
              {d.ready
                ? <Btn onClick={() => setOpenId(openId === d.id ? null : d.id)}>{openId === d.id ? 'Close' : 'Open draft'}</Btn>
                : <span className="text-[0.625rem] uppercase tracking-wider text-[#8A867E]">needs {String(d.reason).replace('missing-', '')}</span>}
            </div>
            <div className="text-xs text-[#5A5751]" style={serif}>{d.why}</div>
            {d.regulated && <div className="text-[0.625rem] text-[#8A867E]">Regulated — {d.regulated}</div>}
            {d.ready && d.blanks.length > 0 && (
              <div className="text-[0.625rem] text-[#8A867E]">Still blank: {d.blanks.join(', ')}</div>
            )}
          </div>
        ))}
      </Card>
      {open && open.ok && (
        <Card title={open.title}>
          <pre className="text-xs whitespace-pre-wrap text-[#1A1815]" style={serif}>{open.lines.join('\n')}</pre>
        </Card>
      )}
      {open && !open.ok && (
        <Card title="Not available for this door">
          <Empty>{open.message || `This document needs a ${String(open.reason).replace('missing-', '')} first.`}</Empty>
        </Card>
      )}
    </>
  );
}
