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
import { TimelineTab, RoomsTab, DoorsBoard, GalleryTab, FilesTab } from './DoorTabs.jsx';
import { SystemsTab } from './SystemsTab.jsx';
import { toTimelineEvents } from './systems.js';
import { isOwnHome, offerRefusal } from './homes.js';
import { VacancyCard } from './Storefront.jsx';
import {
  loadRooms, addRoom, patchRoom, loadDoorPhotos, loadDoorTenancies,
  loadMyRentals, updateTenancy, updateRental, loadAllPhotos,
  addPhoto, patchPhoto, loadDocuments, addDocument, patchDocument,
  loadPublicVacancies,
  loadSystems, loadSystemEvents, addSystem, patchSystem, addSystemEvent,
} from './cloud.js';
import { tenancyRowForDoor } from './staging.js';
import { phoneLoginEmail } from '../../lib/supabase.js';
import { POE_PROPERTIES, LAUNCH_PLAN, OPPORTUNITIES, CONSTRAINTS } from './config.js';

const ACCENT = '#2F5D50';

/**
 * The tabs whose content belongs to ONE property. Everything here reads the
 * selected door, so every one of them owes the reader its name.
 */
const DOOR_SCOPED = new Set([
  'timeline', 'rooms', 'gallery', 'files', 'systems', 'documents', 'door', 'history', 'rent', 'thread',
]);

/**
 * The property you are in, with its details and what each tab actually holds
 * for it. Darrell, 2026-08-28: "I want to see the details of that property
 * after the initial selection... the other tabs should populate information
 * about the property I selected... make sense?"
 *
 * It made sense, and both halves were real. The tabs DID read the selected
 * door — they simply never said which, and never showed that they had anything.
 * So this is not decoration: the counts are read from the SAME doorData the
 * tabs render, so a number here that disagrees with the tab beneath it is
 * impossible. A door with three rooms and no pictures says exactly that, and
 * tapping the count is how you get there.
 *
 * Deliberately in ONE place above every door-scoped tab rather than a heading
 * inside each: in the same spot every time, it becomes something you stop
 * having to look for.
 */
function DoorContext({ rental, tenancy, data = {}, onChange, onGo, tabs = [], activeTab, canPick = true }) {
  const label = rental?.display_name || rental?.address || tenancy?.property_label || null;
  const where = rental
    ? [rental.address, rental.unit, rental.city, rental.state].filter(Boolean).join(', ')
    : [tenancy?.property_label, tenancy?.unit_label].filter(Boolean).join(' \u00b7 ');

  if (!label) {
    return (
      <div className="border-l-2 border-[#B8860B] bg-white px-3 py-2 mb-3">
        <p className="text-[0.8125rem] text-[#1A1815] leading-relaxed">
          <strong>No property selected.</strong> What is below is not empty \u2014 it is not pointed at
          anything yet.
          {canPick && ' Choose a door and this page fills in.'}
        </p>
        {canPick && (
          <button
            type="button"
            onClick={onChange}
            className="mt-1 text-[0.625rem] uppercase tracking-wider underline"
            style={{ color: ACCENT }}
          >Pick a property</button>
        )}
      </div>
    );
  }

  const live = (data.rooms || []).filter((r) => !r.archived_at);
  const shots = (data.photos || []).filter((p) => !p.archived_at);
  const papers = (data.documents || []).filter((d) => !d.archived_at);
  const kit = (data.systems || []).filter((x) => !x.archived_at);
  const active = (data.tenancies || []).find((t) => t.status === 'active') || tenancy || null;

  // Counted from the rows the tabs themselves render, never stored beside them.
  const counts = [
    { id: 'rooms', n: live.length, one: 'room', many: 'rooms' },
    { id: 'gallery', n: shots.length, one: 'picture', many: 'pictures' },
    { id: 'files', n: papers.length, one: 'file', many: 'files' },
    { id: 'systems', n: kit.length, one: 'system', many: 'systems' },
  ].filter((c) => tabs.some((t) => t.id === c.id && !t.locked));

  const rent = Number(active?.monthly_rent) || Number(rental?.listed_rent) || Number(rental?.monthly_rent) || 0;
  const facts = [
    rental?.property_type ? String(rental.property_type).replace(/-/g, ' ') : null,
    active ? `Rented \u2014 ${active.tenant_name || 'household not named'}` : (rental ? 'No tenancy on this door' : null),
    rent > 0 ? `$${rent.toFixed(0)}/mo` : 'no rent on record',
  ].filter(Boolean);

  return (
    <div className="border-l-2 bg-white px-3 py-2 mb-3" style={{ borderColor: ACCENT }}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="min-w-0">
          <span className="text-[0.5625rem] uppercase tracking-[0.2em] text-[#8A867E] block">You are in</span>
          <span className="text-[0.9375rem] text-[#1A1815]">{label}</span>
          {where && where !== label && (
            <span className="text-[0.75rem] text-[#5A5751] block leading-snug">{where}</span>
          )}
        </span>
        {canPick && (
          <button
            type="button"
            onClick={onChange}
            className="text-[0.625rem] uppercase tracking-wider underline shrink-0"
            style={{ color: ACCENT }}
          >Change property</button>
        )}
      </div>

      <div className="text-[0.75rem] text-[#5A5751] mt-1">{facts.join(' \u00b7 ')}</div>

      {counts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {counts.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onGo?.(c.id)}
              className={`text-[0.6875rem] px-2 py-1 border ${
                activeTab === c.id ? 'bg-[#2F5D50] text-white border-[#2F5D50]'
                  : 'bg-white text-[#1A1815] border-[#E8E4DC] hover:border-[#1A1815]'}`}
            >
              {/* Zero is said out loud. "no pictures" is a fact about this
                  property; a hidden chip reads as a broken tab. */}
              {c.n === 0 ? `no ${c.many}` : `${c.n} ${c.n === 1 ? c.one : c.many}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const [rentals, setRentals] = useState([]);
  // Every photo this person may see, for the board's cover thumbnails. RLS
  // scopes it, so a tenant's copy holds only their own tenancy's pictures.
  const [doorPhotos, setDoorPhotos] = useState([]);
  // The public listings anyone can see with no account (column-safe: no tenant
  // names, no mortgage — cloud.js). Shown when this person holds neither a
  // tenancy nor an owned door, so the front door is never a blank space.
  const [vacancies, setVacancies] = useState([]);
  const [notice, setNotice] = useState('');

  // 1. Claim any waiting invitation, THEN read. Claiming is idempotent, so this
  //    is safe on every open and is what turns "invited" into "recognized".
  const boot = useCallback(async () => {
    setLoading(true);
    const claimed = await claimPropertyAccess();
    setClaim(claimed);
    const [d, g, h, r] = await Promise.all([
      loadMyDoors(), loadMyGrants(), loadMyHousehold(), loadMyRentals(),
    ]);
    setDoors(d.ok ? d.doors : []);
    setGrants(g.ok ? g.grants : []);
    setHousehold(h.ok ? h.memberships : []);
    // The doors he OWNS, which outlive any tenancy on them. Reading a rentals
    // row is itself proof of instance membership (rentals_select USING
    // user_in_instance) — so this is also what tells us he is the landlord.
    setRentals(r.ok ? r.rentals : []);
    const [ph, vac] = await Promise.all([loadAllPhotos(), loadPublicVacancies()]);
    setDoorPhotos(ph.ok ? ph.photos : []);
    setVacancies(vac.ok ? vac.vacancies : []);
    setLoading(false);
  }, []);
  useEffect(() => { boot(); }, [boot]);

  const activeDoor = useMemo(
    () => doors.find((x) => x.id === activeId) || doors[0] || null,
    [doors, activeId]
  );

  // The DOOR's own records, which outlive any one tenancy.
  //
  // TWO KEYS, AND THEY ARE NOT INTERCHANGEABLE (measured from the live catalog
  // 2026-08-27, after passing the wrong one to both):
  //   rental_tenancies.rental_ref  is TEXT  — the rentals SLUG
  //   property_rooms.rental_ref    is UUID  — the rentals ID
  //   property_photos.rental_ref   is UUID  — the rentals ID
  // Handing the slug to the uuid columns matched nothing, so Rooms and Photos
  // were silently empty on every door. Resolve the rentals row once, then give
  // each loader the key its own column actually holds.
  const [doorData, setDoorData] = useState({ rooms: [], photos: [], tenancies: [], documents: [], systems: [], systemEvents: [] });
  const activeRental = useMemo(
    () => rentals.find((r) => r.slug && r.slug === activeDoor?.rental_ref)
      || rentals.find((r) => r.id === activeId)
      || null,
    [rentals, activeDoor, activeId],
  );
  const rentalId = activeRental?.id || null;          // uuid — rooms, photos
  const rentalRef = activeDoor?.rental_ref || activeRental?.slug || null; // text — tenancies
  const loadDoorData = useCallback(async () => {
    if (!rentalId && !rentalRef) {
      setDoorData({ rooms: [], photos: [], tenancies: [], documents: [], systems: [], systemEvents: [] });
      return;
    }
    const [rm, ph, tn, dc, sy, se] = await Promise.all([
      loadRooms(rentalId), loadDoorPhotos(rentalId), loadDoorTenancies(rentalRef), loadDocuments(rentalId),
      loadSystems(rentalId), loadSystemEvents(rentalId),
    ]);
    setDoorData({
      rooms: rm.ok ? rm.rooms : [],
      photos: ph.ok ? ph.photos : [],
      tenancies: tn.ok ? tn.tenancies : [],
      documents: dc.ok ? dc.documents : [],
      systems: sy.ok ? sy.systems : [],
      systemEvents: se.ok ? se.events : [],
    });
  }, [rentalId, rentalRef]);
  useEffect(() => { loadDoorData(); }, [loadDoorData]);

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
    // A LANDLORD IS A LANDLORD BEFORE HE HAS A TENANT (fixed 2026-08-27). This
    // branch used to require `activeDoor`, i.e. an existing TENANCY — so an
    // owner with 12 properties and no tenancy rows fell through to 'tenant' and
    // met an empty screen built for somebody else. Being able to read `rentals`
    // is the membership proof (RLS: user_in_instance), and it is true from the
    // moment he owns a door, which is the moment he needs the app.
    if (rentals.length > 0 && !grants.length && household.length === 0) return 'owner';
    if (activeDoor && !grants.length && household.length === 0) {
      return surface === 'poetech' ? 'owner' : 'tenant';
    }
    return 'tenant';
  }, [grants, household, activeDoor, surface, rentals]);

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

  // Put a tenant on a door. Whatever is known goes in; every field is editable
  // afterwards (EDITABLE-EVERYWHERE), so a blank is never a reason to refuse.
  const startTenancy = async (input) => {
    const r = input?.rental;
    // THE THIRD REFUSAL. The board does not offer this on a home, the database
    // will not publish one (0156), and this is the layer between them — so a
    // future caller that forgets the filter is told why instead of quietly
    // putting a tenant in the family's own house.
    if (isOwnHome(r)) { say(offerRefusal(r)); return; }
    const built = tenancyRowForDoor({
      instanceId: r?.instance_id,
      rentalRef: r?.slug,                 // TEXT — what rental_tenancies holds
      propertyLabel: r?.display_name || r?.address,
      unitLabel: r?.unit || null,
      tenantName: input.tenantName,
      tenantEmail: input.tenantEmail,
      tenantPhone: input.tenantPhone,
      leaseStart: input.leaseStart,
      monthlyRent: input.monthlyRent,
      subsidised: input.subsidised,
    });
    if (!built.ok) { say(`Not saved: ${built.reason}`); return; }
    const res = await createTenancy(built.row);
    if (!res.ok) { say(`Not saved: ${res.reason}`); return; }
    // A door that is now occupied stops advertising itself — "occupied when
    // they are" (Darrell), made structural instead of remembered.
    if (r?.listed_at) await updateRental(r.id, { listed_at: null }, { summary: 'tenancy started; listing withdrawn' });
    say(built.row.tenant_name
      ? `${built.row.tenant_name} is on ${built.row.property_label}.`
      : `Tenancy started on ${built.row.property_label}. Add the household name whenever you have it.`);
    boot();
    refresh();
  };

  // Advertise a door, or stop. The asking rent defaults to the door's own
  // figure — real data, not a guess — and is editable on the door.
  const setListing = async (rental, on) => {
    if (on && isOwnHome(rental)) { say(offerRefusal(rental)); return; }
    const res = await updateRental(rental.id, {
      listed_at: on ? new Date().toISOString() : null,
      listed_rent: on ? (Number(rental.listed_rent) || Number(rental.monthly_rent) || 0) : rental.listed_rent,
    }, { summary: on ? 'advertised' : 'listing withdrawn' });
    say(res.ok
      ? (on ? 'This door is advertised now.' : 'No longer advertised.')
      : `Not saved: ${res.reason}`);
    boot();
  };

  const editTenancy = async (id, patch, summary) => {
    const res = await updateTenancy(id, patch, { summary, instanceId: activeDoor?.instance_id });
    say(res.ok ? 'Saved.' : `Not saved: ${res.reason}`);
    boot();
    refresh();
  };

  const editRental = async (id, patch, summary) => {
    const res = await updateRental(id, patch, { summary });
    say(res.ok ? 'Saved.' : `Not saved: ${res.reason}`);
    boot();
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

  // The front door is NEVER a blank space (Darrell 2026-08-27: "No one, not even
  // a non-user, should see an empty space"). A person with a tenancy drops into
  // their door below. A LANDLORD with owned doors but no tenancy falls THROUGH to
  // the tabbed view, where the Doors board shows his apartments (photos,
  // availability) — the whole reason the app exists (d44484d fixed the role but
  // this render still dead-ended him before his own doors). Everyone else — a
  // prospective renter, a not-yet-invited visitor — sees the places to live.
  // ...AND SO DOES A MANAGER OR A WORKER WHOSE FIRST DOOR IS NOT ASSIGNED YET.
  // Found by walking the app as each account type (2026-08-28): someone holding
  // real capability grants — request.manage, docs.add — with no tenancy row yet
  // fell through to the prospective-renter card and was told "sign in and your
  // place will be here". They ARE signed in, and they are not looking for a
  // place; they are staff waiting on an assignment. Being handed a renter's
  // greeting is the same dead-end the landlord hit on d44484d, one role over:
  // the render asked what rows they HAVE instead of what they may DO.
  if (!doors.length && !rentals.length && !grants.length) {
    return <PlacesToLive vacancies={vacancies} claim={claim} />;
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

      {/* WHICH PROPERTY AM I IN? (Darrell, 2026-08-28: "I can't see which
          property I'm in after selecting a door... it doesn't tie into the
          other tabs or maybe it does.")

          It DID tie in — Rooms, Pictures, Files, Systems and Door history have
          been reading the selected door all along. Nothing on screen ever said
          so, which is the same failure either way: a surface that is right and
          cannot be trusted is not usable. Worse, with nothing named, a landlord
          with eleven doors cannot tell whether he is filing a photograph to
          1003 Koehn or to 805 Prospect — and a wrongly-filed condition photo is
          exactly the evidence a deposit argument turns on.

          So every door-scoped tab now carries the door's name, and says plainly
          when none is chosen instead of rendering an empty surface that looks
          like a property with no rooms. */}
      {DOOR_SCOPED.has(activeTab) && (
        <DoorContext
          rental={activeRental}
          tenancy={activeDoor}
          data={doorData}
          onChange={() => setTab('doors')}
          onGo={(id) => setTab(id)}
          tabs={face.tabs}
          activeTab={activeTab}
          canPick={face.tabs.some((t) => t.id === 'doors')}
        />
      )}

      {(() => {
        const current = face.tabs.find((t) => t.id === activeTab);
        if (current?.locked) {
          return <Card title={current.label}><Empty>{current.lockReason}</Empty></Card>;
        }
        switch (activeTab) {
          case 'door': return <DoorCard door={activeDoor} />;
          case 'timeline': return (
            <TimelineTab
              // The mechanical record joins the door's chronology rather than
              // living off to one side: a furnace replaced between two tenants
              // is part of the same story as the move-out photos around it.
              tenancies={doorData.tenancies}
              events={[...history, ...toTimelineEvents(doorData.systemEvents, doorData.systems)]}
              photos={doorData.photos}
              rent={record.rent} expectedRent={activeDoor?.monthly_rent ?? null}
            />
          );
          case 'gallery': return (
            <GalleryTab
              door={{ id: rentalId, instance_id: activeRental?.instance_id || activeDoor?.instance_id }}
              rooms={doorData.rooms} photos={doorData.photos} busy={Boolean(busy)}
              canManage={role === 'owner' || role === 'manager'}
              onAdd={async (row) => { const r = await addPhoto(row); say(r.ok ? 'Added.' : `Not saved: ${r.reason}`); loadDoorData(); boot(); }}
              onPatch={async (id, patch) => { const r = await patchPhoto(id, patch); say(r.ok ? 'Saved.' : `Not saved: ${r.reason}`); loadDoorData(); boot(); }}
            />
          );
          case 'files': return (
            <FilesTab
              door={{ id: rentalId, instance_id: activeRental?.instance_id || activeDoor?.instance_id }}
              tenancies={doorData.tenancies} documents={doorData.documents} busy={Boolean(busy)}
              canManage={role === 'owner' || role === 'manager'}
              onAdd={async (row) => { const r = await addDocument(row); say(r.ok ? 'Saved.' : `Not saved: ${r.reason}`); loadDoorData(); }}
              onPatch={async (id, patch) => { const r = await patchDocument(id, patch); say(r.ok ? 'Saved.' : `Not saved: ${r.reason}`); loadDoorData(); }}
            />
          );
          case 'systems': return (
            <SystemsTab
              door={{ id: rentalId, instance_id: activeRental?.instance_id || activeDoor?.instance_id }}
              systems={doorData.systems} events={doorData.systemEvents} rooms={doorData.rooms}
              propertyType={activeRental?.property_type === 'multi-family' ? 'apartment'
                : activeRental?.property_type === 'commercial' ? 'commercial' : 'house'}
              busy={Boolean(busy)}
              canManage={role === 'owner' || role === 'manager'}
              onAdd={async (row) => { const r = await addSystem(row); say(r.ok ? 'Saved.' : `Not saved: ${r.reason}`); loadDoorData(); }}
              onPatch={async (id, patch) => { const r = await patchSystem(id, patch); say(r.ok ? 'Saved.' : `Not saved: ${r.reason}`); loadDoorData(); }}
              onEvent={async (row) => { const r = await addSystemEvent(row); say(r.ok ? 'Recorded.' : `Not saved: ${r.reason}`); loadDoorData(); }}
              onSeed={async (rows) => { for (const row of rows) await addSystem(row); say(`Added ${rows.length}.`); loadDoorData(); }}
            />
          );
          case 'rooms': return (
            <RoomsTab
              door={{ id: rentalId, instance_id: activeRental?.instance_id || activeDoor?.instance_id }}
              rooms={doorData.rooms} photos={doorData.photos} busy={busy}
              canManage={role === 'owner' || role === 'manager'}
              onAdd={async (row) => { await addRoom(row); loadDoorData(); }}
              onPatch={async (id, patch) => { await patchRoom(id, patch); loadDoorData(); }}
            />
          );
          case 'doors': return (
            <>
              <DoorsBoard
                rentals={rentals} tenancies={doors} busy={Boolean(busy)}
                canManage={role === 'owner' || role === 'manager'}
                // A tenancy id opens the relationship record; a rentals id (a
                // door with nobody in it, which is every door on this account
                // today) opens the door's own chronology, which is the surface
                // that actually has something to show for it.
                onPick={(id) => { setActiveId(id); setTab(doors.some((d) => d.id === id) ? 'history' : 'timeline'); }}
                photos={doorPhotos}
                onStart={startTenancy}
                onListing={setListing}
                onEditTenancy={editTenancy}
                onEditRental={editRental}
              />
              <DoorsTab
                doors={doors} staged={staged}
                onPick={(id) => { setActiveId(id); setTab('history'); }}
                onConfirmDraft={confirmStaged}
              />
            </>
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

// The front-door listing shown to anyone who holds neither a tenancy nor an
// owned door — the "places to live," never a blank space (Darrell 2026-08-27).
// Address, unit, rent, and availability only; the public RPC is column-safe (no
// tenant name, no mortgage), so it is safe for a prospective renter and a
// non-user alike, and the street address is handed over by a person, not here.
function PlacesToLive({ vacancies = [], claim, onSignIn = null }) {
  // ==========================================================================
  // THE STOREFRONT. Darrell, 2026-08-28: "It should have the Apartments shown
  // in the Properties Tab... like the MooreDivahs App has except this is places
  // to live... without an account!!!!!!!!!"
  //
  // So: a browsable catalogue with PICTURES, the way a shop shows its goods —
  // not the text list this was. Someone looking for a place should be able to
  // look at the place.
  //
  // WITHOUT AN ACCOUNT IS THE WHOLE POINT and nothing here weakens it. Every
  // row comes from public_vacancies(), which anon may execute and which returns
  // no street address, no tenant, no mortgage. The photographs come from
  // public_vacancy_photos() (0154), which returns ONLY kind='listing' and only
  // for a door that is advertised and free — a move-out condition set of
  // somebody's home cannot come through it whatever it is asked for. Applying
  // still needs no account either (0152). The account is for taking the place,
  // never for looking at it.
  // ==========================================================================
  const notEnabled = claim && claim.ok === false && claim.reason === 'not-enabled-yet';
  const rows = (Array.isArray(vacancies) ? vacancies : [])
    .map((v) => {
      const address = String(v.address || v.label || v.property_label || v.name || '').trim();
      if (!address) return null;
      const cityState = [v.city, v.state].map((x) => String(x || '').trim()).filter(Boolean).join(', ');
      const rent = Number(v.monthly_rent ?? v.rent ?? v.listed_rent);
      const beds = Number(v.bedrooms);
      const baths = Number(v.bathrooms);
      const nightly = Number(v.nightly_rate);
      return {
        id: String(v.id || v.rental_id || address),
        rentalId: v.id || null,
        label: address,
        where: cityState,
        unit: String(v.unit || v.unit_label || '').trim(),
        rent: Number.isFinite(rent) && rent > 0 ? rent : null,
        beds: Number.isFinite(beds) && beds > 0 ? beds : null,
        baths: Number.isFinite(baths) && baths > 0 ? baths : null,
        offering: String(v.offering || 'long-term'),
        nightly: Number.isFinite(nightly) && nightly > 0 ? nightly : null,
        note: String(v.listed_note || v.note || v.blurb || '').trim(),
        // Undefined (an older RPC) reads as SHOWN, because that is what the old
        // behaviour actually was — claiming a door is protected when the
        // database has not been migrated yet would be the same lie in reverse.
        addressShown: v.address_shown === undefined ? true : Boolean(v.address_shown),
      };
    })
    .filter(Boolean);

  return (
    <div className="p-1">
      <Card title="Poe Properties — Places to Live">
        {rows.length > 0 ? (
          <>
            <p className="text-sm text-[#1A1815] mb-1" style={serif}>
              {rows.length} {rows.length === 1 ? 'place' : 'places'} available. No account needed to look.
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
              {rows.map((r) => <VacancyCard key={r.id} unit={r} />)}
            </ul>
            {/* The blanket claim is gone. It was false on every door (display_name
                IS the street), and it is now a per-card fact the database
                enforces, printed on the cards that actually hold it back. */}
            <p className="text-[0.625rem] text-[#8A867E] mt-3" style={serif}>
              Each card says whether its address is shown or shared when you apply.
            </p>
            <SignInInvite onSignIn={onSignIn} />
          </>
        ) : (
          <>
            <p className="text-sm text-[#1A1815] mb-2" style={serif}>Places to live, coming to this door.</p>
            <Empty>
              {notEnabled
                ? 'Listings turn on once this database is switched on. Nothing is missing on your end.'
                : 'Openings are posted here as they come available. If a landlord invited you by your email or cell number, sign in and your place will be here.'}
            </Empty>
            <SignInInvite onSignIn={onSignIn} />
          </>
        )}
      </Card>
    </div>
  );
}

/**
 * "login to create an account... so a login button so they know they can... no
 * need just to look through the possibilities" (Darrell, 2026-08-28).
 *
 * Two things at once, and the order matters. Looking is free and stays free —
 * nothing above this line asked anybody who they were. But a person who has
 * decided they want one of these places should not have to guess whether an
 * account is even possible; an invisible option is the same as no option. So
 * the way in is on the page, plainly, and plainly OPTIONAL.
 *
 * Renders nothing at all when there is no sign-in handler (inside PoeTech the
 * reader is already signed in, and a login button there is just noise).
 */
function SignInInvite({ onSignIn }) {
  if (!onSignIn) return null;
  return (
    <div className="mt-3 border-t border-[#F0EDE6] pt-3">
      <p className="text-[0.8125rem] text-[#1A1815] leading-relaxed" style={serif}>
        <strong>Looking is free — no account needed.</strong> You only need one to apply for a lease
        or a short stay, or to see your own place if you already live in one of ours.
      </p>
      <button
        type="button"
        onClick={onSignIn}
        className="mt-2 text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border bg-white"
        style={{ borderColor: ACCENT, color: ACCENT }}
      >Sign in or create an account</button>
    </div>
  );
}


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
