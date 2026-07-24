// =============================================================================
// DeviceInventory — the church device asset register + idle-GPU compute pool
// =============================================================================
// The real ASSET REGISTER for church infrastructure (church_devices, 0056): the
// NAS, the GPU nodes, the NovaStar VX1000, the LED video wall, network gear,
// cameras, the sound board, media rigs. Self-contained like <ChurchVideoWall /> —
// owns its own church-devices-sync subscription, no parent props. Staff-gated:
// the render switch shows it to isChurchStaff only, and getDeviceAccess gates the
// sensitive fields (serial / IP) to editors.
//
// Two sections:
//   Registry     — every device by type: status, steward, specs, capabilities,
//                  link to the LED-wall capital project, honest SME-needed flags.
//                  Governors (canEdit) get the WRITER: an Add-device form + a
//                  per-device Edit affordance through saveDevice — a DB-backed
//                  row updates in place; editing a seed device writes a row
//                  whose slug overrides the seed twin on merge (the documented
//                  church-devices.js path). Members/visitors see no controls.
//   Compute Pool — the capability index (which node can run which job) that feeds
//                  the deterministic idle-GPU router (gpu-scheduler.js), plus the
//                  live INERT brake state. Read-only observability; nothing runs.
//
// REALITY-TRACE (P15): the register shows the REAL known infrastructure (seed,
// grounded in the research-review) merged with confirmed DB rows. Unconfirmed
// specs are flagged, not painted. The compute pool shows the scheduler is wired
// and OFF — it never claims a job ran.
// =============================================================================
import React, { useState, useEffect, useMemo } from 'react';
import { KpiDot } from './KpiDot.jsx';
import UiIcon from './UiIcon.jsx';
import SectionTabs from './SectionTabs.jsx';
import {
  SEED_DEVICES, DEVICE_TYPES, DEVICE_STATUSES, CAPABILITIES, GPU_JOB_CAPABILITIES,
  typeLabel, typeIcon, statusTone, statusLabel, capabilityLabel,
  summarizeDevices, devicesByType, capabilityIndex, mergeSeedAndRows,
  makeDevice, validateDevice,
} from '../lib/church-devices.js';
import {
  planRun, makeInertState, JOB_TYPES, DEFAULT_IDLE_WINDOWS,
} from '../lib/gpu-scheduler.js';
import { getDeviceAccess, subscribeDevices, saveDevice } from '../lib/church-devices-sync.js';

// Shared visual tokens — identical to the Video Wall / conference surfaces
// (already passing contrast-guard + legibility).
const card = 'bg-white border border-[#1A1815] p-4 sm:p-5';
const labelCls = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751]';
const serif = { fontFamily: '"Fraunces", serif' };
const chip = 'inline-flex items-center gap-1 px-2 py-0.5 text-[0.6875rem] border border-[#C9C2B6] bg-[#FAF8F4] text-[#1A1815]';
const fieldCls = 'w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]';

function StatusBadge({ status }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">
      <KpiDot status={statusTone(status)} /> {statusLabel(status)}
    </span>
  );
}

function DeviceCard({ device, canEdit, onEdit }) {
  const specEntries = Object.entries(device.specs || {});
  return (
    <div className="border border-[#E8E4DC] p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[#B85838]" aria-hidden="true"><UiIcon name={typeIcon(device.deviceType)} /></span>
          <span className="text-sm text-[#1A1815] truncate" style={serif}>{device.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={device.status} />
          {/* Editors only — the register's per-device writer (saveDevice). */}
          {canEdit && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(device)}
              className="text-[0.6875rem] uppercase tracking-wider px-2 py-0.5 border border-[#C9C2B6] text-[#5A5751] hover:border-[#B85838] hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] text-[#5A5751]">
        <span>{typeLabel(device.deviceType)}</span>
        {device.makeModel && <span style={serif} className="text-[#1A1815]">{device.makeModel}</span>}
        {device.location && <span>· {device.location}</span>}
        {device.steward && <span>· steward: {device.steward}</span>}
      </div>

      {/* Capabilities — the tokens the idle-GPU router matches jobs against */}
      {(device.capabilities || []).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {device.capabilities.map((c) => (
            <span key={c} className={chip} title={GPU_JOB_CAPABILITIES.includes(c) ? 'dispatchable GPU job capability' : 'operational capability'}>
              {GPU_JOB_CAPABILITIES.includes(c) && <span className="text-[#B85838]" aria-hidden="true">·</span>}
              {capabilityLabel(c)}
            </span>
          ))}
        </div>
      )}

      {/* Specs — key/value bag (no fabricated values) */}
      {specEntries.length > 0 && (
        <dl className="mt-2 space-y-1">
          {specEntries.map(([k, v]) => (
            <div key={k} className="flex gap-2 text-[0.6875rem]">
              <dt className="text-[#5A5751] capitalize whitespace-nowrap">{k}</dt>
              <dd className="text-[#1A1815]">{String(v)}</dd>
            </div>
          ))}
        </dl>
      )}

      {/* Sensitive fields — editors only */}
      {canEdit && (device.serial || device.ipAddress) && (
        <div className="mt-2 flex flex-wrap gap-x-3 text-[0.6875rem] text-[#5A5751]">
          {device.ipAddress && <span>IP: <span className="text-[#1A1815] tabular-nums">{device.ipAddress}</span></span>}
          {device.serial && <span>S/N: <span className="text-[#1A1815]">{device.serial}</span></span>}
        </div>
      )}

      {device.capitalProjectSlug && (
        <div className="mt-2 text-[0.6875rem] text-[#5A5751]">
          Linked capital project: <span className="text-[#1A1815]">{device.capitalProjectSlug}</span> — see the Video Wall surface for budget &amp; timeline.
        </div>
      )}

      {device.notes && <p className="mt-2 text-[0.75rem] text-[#5A5751]">{device.notes}</p>}

      {/* Honesty flags (Verification Doctrine) */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {device.smeNeeded && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[0.6875rem] border border-[#B85838] text-[#B85838]">
            <UiIcon name="pin" /> Needs Darrell&rsquo;s confirmation
          </span>
        )}
        <span className={`text-[0.625rem] uppercase tracking-wider ${device.confirmed ? 'text-[#5A5751]' : 'text-[#B85838]'}`}>
          {device.confirmed ? 'Confirmed' : 'Unverified spec'}
        </span>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// DeviceEditor — the register's minimal steward writer (governors only; the
// render gate is access.canEdit and RLS enforces owner/admin regardless).
// Add = a blank draft; Edit = the existing device prefilled, so untouched
// fields (specs, capabilities, flags, sort order) survive the write. Saves via
// saveDevice: a DB-backed row (remoteUuid) UPDATEs in place; a seed-only or
// brand-new device INSERTs a row whose slug overrides/append on the merge. No
// optimistic paint — the register refreshes when the realtime stream returns
// the real row (DR-0076: the screen shows what the DB actually holds).
// -----------------------------------------------------------------------------
function DeviceEditor({ target, onClose }) {
  const [form, setForm] = useState({
    name: target?.name || '',
    deviceType: target?.deviceType || 'other',
    location: target?.location || '',
    status: target?.status || 'planned',
    steward: target?.steward || '',
    notes: target?.notes || '',
    confirmed: target?.confirmed === true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    const device = makeDevice({
      ...(target || {}),
      name: form.name,
      deviceType: form.deviceType,
      location: form.location.trim() || null,
      status: form.status,
      steward: form.steward.trim() || null,
      notes: form.notes.trim() || null,
      confirmed: form.confirmed,
    });
    const check = validateDevice(device);
    if (!check.ok) { setError(check.errors.join('; ')); return; }
    setBusy(true);
    const payload = target?.remoteUuid ? { ...device, remoteUuid: target.remoteUuid } : device;
    const res = await saveDevice(payload);
    setBusy(false);
    if (res?.uploaded || res?.updated) { onClose(); return; }
    // Honest failure: name the skip reason; the register was not changed.
    setError(`Could not save (${res?.skipped || 'error'}) — the register was not changed.`);
  }

  return (
    <div className={card}>
      <div className={labelCls}>{target ? `Edit device · ${target.name}` : 'Add device'}</div>
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label htmlFor="dev-ed-name" className={labelCls}>Name</label>
          <input id="dev-ed-name" className={fieldCls} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g., Booth streaming PC" />
        </div>
        <div>
          <label htmlFor="dev-ed-type" className={labelCls}>Category</label>
          <select id="dev-ed-type" className={fieldCls} value={form.deviceType} onChange={(e) => set('deviceType', e.target.value)}>
            {DEVICE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="dev-ed-location" className={labelCls}>Location</label>
          <input id="dev-ed-location" className={fieldCls} value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g., Sanctuary AV booth" />
        </div>
        <div>
          <label htmlFor="dev-ed-status" className={labelCls}>Status</label>
          <select id="dev-ed-status" className={fieldCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
            {DEVICE_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="dev-ed-steward" className={labelCls}>Steward</label>
          <input id="dev-ed-steward" className={fieldCls} value={form.steward} onChange={(e) => set('steward', e.target.value)} placeholder="Who keeps this device" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="dev-ed-notes" className={labelCls}>Notes</label>
          <textarea id="dev-ed-notes" rows="2" className={fieldCls} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>
      </div>
      {/* Honesty flag stays a human declaration: checked = read off the hardware. */}
      <label className="mt-2 flex items-baseline gap-2 text-[0.75rem] text-[#1A1815]">
        <input type="checkbox" checked={form.confirmed} onChange={(e) => set('confirmed', e.target.checked)} className="accent-[#B85838]" />
        Confirmed — these details were read off the real hardware
      </label>
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="text-xs uppercase tracking-wider px-3 py-2 bg-[#1A1815] text-white hover:bg-[#B85838] disabled:opacity-50 disabled:cursor-not-allowed focus:outline focus:outline-2 focus:outline-[#B85838]"
        >
          {busy ? 'Saving…' : (target ? 'Save changes' : 'Add to register')}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="text-xs uppercase tracking-wider px-3 py-2 border border-[#C9C2B6] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]"
        >
          Cancel
        </button>
        {error && <span role="alert" className="text-[0.75rem] text-[#B85838]">{error}</span>}
      </div>
    </div>
  );
}

export default function DeviceInventory() {
  const [access, setAccess] = useState({ signedIn: false, canSee: false, canEdit: false });
  const [rows, setRows] = useState(null); // null = loading / not subscribed
  // editor: null = closed; { target: null } = add form; { target: device } = edit.
  const [editor, setEditor] = useState(null);

  useEffect(() => {
    let alive = true;
    getDeviceAccess().then((a) => { if (alive) setAccess(a); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!access.canSee) return undefined;
    const unsub = subscribeDevices((list) => setRows(list));
    return () => { unsub(); };
  }, [access.canSee]);

  // The register = the known seed (real infra, honestly flagged) merged with any
  // confirmed DB rows (DB wins on slug). Non-staff still see the seed baseline so
  // the page is never an empty void — but no sensitive fields render for them.
  const devices = useMemo(() => mergeSeedAndRows(SEED_DEVICES, rows || []), [rows]);
  const summary = useMemo(() => summarizeDevices(devices), [devices]);
  const grouped = useMemo(() => devicesByType(devices), [devices]);
  const capIndex = useMemo(() => capabilityIndex(devices), [devices]);

  // The idle-GPU plan: INERT by default (makeInertState). Empty queue — nothing
  // is armed. This is observability: it shows the router is wired to the register
  // and OFF. nowMs is read once for a stable render (no live clock churn).
  const plan = useMemo(() => {
    const nowMs = Date.UTC(2026, 5, 29, 4, 0, 0); // representative overnight instant for the window readout
    return planRun({ items: [] }, devices, makeInertState(), nowMs, { utcOffsetMinutes: -300, windows: DEFAULT_IDLE_WINDOWS });
  }, [devices]);

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className={card}>
        <div className={labelCls}>Inventory Control · Church Infrastructure</div>
        <h2 className="mt-1 text-xl sm:text-2xl text-[#1A1815]" style={serif}>Device Inventory</h2>
        <p className="mt-1 text-sm text-[#5A5751]">
          The asset register for every church device — type, location, specs, status, steward, and the job capabilities each can run. The capability fields feed the idle-GPU compute pool.
        </p>
        {!access.signedIn && (
          <p className="mt-2 text-[0.75rem] text-[#5A5751]">Showing the known infrastructure baseline. Sign in with a church staff account to see live status and sensitive fields.</p>
        )}
        {access.signedIn && access.canSee && !access.canEdit && (
          <p className="mt-2 text-[0.75rem] text-[#5A5751]">Read-only view — adding or editing devices is reserved for the register&rsquo;s governors (owner/admin).</p>
        )}
        {access.canEdit && (
          <button
            type="button"
            onClick={() => setEditor({ target: null })}
            className="mt-3 text-xs uppercase tracking-wider px-3 py-2 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
          >
            + Add device
          </button>
        )}
      </div>

      {/* STEWARD EDITOR — governors only; keyed so switching target resets the
          form. PINNED above the section strip so the form stays visible (and
          survives a tab switch) no matter which section the steward is on. */}
      {access.canEdit && editor && (
        <DeviceEditor
          key={editor.target ? editor.target.id : 'dev-ed-new'}
          target={editor.target}
          onClose={() => setEditor(null)}
        />
      )}

      {/* SUMMARY KPIs — pinned above the section strip (2026-07-07: "no more
          down scrolling to see a surface with KPIs"; the numbers stay visible
          whichever section is open). */}
      <div className={card}>
        <div className={labelCls}>At a glance</div>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ['Devices', summary.total],
            ['Online (steward-set)', summary.online],
            ['Compute nodes', summary.computeNodes],
            ['Need confirmation', summary.smeNeeded],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-2xl text-[#1A1815] tabular-nums" style={serif}>{v}</div>
              <div className="text-[0.6875rem] text-[#5A5751]">{k}</div>
            </div>
          ))}
        </div>
        {summary.smeNeeded > 0 && (
          <p className="mt-3 text-[0.75rem] text-[#B85838]">
            {summary.smeNeeded} device(s) carry specs not yet read off the hardware — flagged for Darrell rather than fabricated.
          </p>
        )}
      </div>

      {/* SECTION TABS — the shared sliding-tabs primitive ("sliding tabs for
          all tabs instead of a long scroll", Darrell 2026-07-04). Same two
          sections as the old hand-rolled strip; each block moved verbatim. */}
      <SectionTabs
        ariaLabel="Device Inventory sections"
        idBase="devinv"
        defaultId="registry"
        sections={[
          {
            id: 'registry',
            label: 'Registry',
            icon: 'monitor',
            render: () => (
              <div className="space-y-4">
                {/* DEVICES BY TYPE */}
                {DEVICE_TYPES.filter((t) => (grouped[t.id] || []).length > 0).map((t) => (
                  <div key={t.id} className={card}>
                    <div className={`${labelCls} flex items-center gap-1.5`}>
                      <span className="text-[#B85838]" aria-hidden="true"><UiIcon name={t.icon} /></span> {t.label}
                      <span className="text-[#C9C2B6]">· {grouped[t.id].length}</span>
                    </div>
                    <div className="mt-2 space-y-2.5">
                      {grouped[t.id].map((d) => (
                        <DeviceCard key={d.id} device={d} canEdit={access.canEdit} onEdit={(dev) => setEditor({ target: dev })} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ),
          },
          {
            id: 'compute',
            label: 'Compute Pool',
            icon: 'chart',
            render: () => (
              <div className="space-y-4">
          {/* SCHEDULER STATE — INERT */}
          <div className={card}>
            <div className="flex items-center justify-between">
              <div className={labelCls}>Idle-GPU compute pool · scheduler</div>
              <span className="inline-flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-wider text-[#B85838]">
                <KpiDot status="problem" /> Inert — not armed
              </span>
            </div>
            <p className="mt-2 text-[0.75rem] text-[#5A5751]">
              A deterministic router (plain code, no AI) that would queue heavy jobs — voice clone, transcription, batch LLM — to run only when a capable node is free, the idle window is open, and every brake is go. It ships OFF; arming is reserved for Darrell, attended.
            </p>
            <div className="mt-3">
              <div className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">Brakes holding it inert</div>
              <ul className="mt-1.5 space-y-1">
                {plan.gate.reasons.map((r, i) => (
                  <li key={i} className="flex gap-2 text-[0.75rem] text-[#1A1815]"><span className="text-[#B85838]" aria-hidden="true">·</span><span>{r}</span></li>
                ))}
              </ul>
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[0.6875rem]">
              {[
                ['Kill-switch', plan.gate.brakes.killEngaged ? 'Engaged' : 'Clear'],
                ['Armed', plan.gate.brakes.armed ? 'Yes' : 'No'],
                ['Scheduler arm', plan.gate.brakes.schedArmed ? 'Yes' : 'No'],
                ['Budget', plan.gate.brakes.budgetOk ? 'Set' : 'Unset (0)'],
              ].map(([k, v]) => (
                <div key={k} className="border border-[#E8E4DC] px-2 py-1.5">
                  <div className="text-[#5A5751]">{k}</div>
                  <div className="text-[#1A1815]" style={serif}>{v}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[0.75rem] text-[#5A5751]">
              Would run now: <span className="text-[#1A1815]">{plan.wouldRun.length}</span> job(s) — the queue is empty and the brakes are engaged, so nothing dispatches.
            </p>
          </div>

          {/* IDLE WINDOWS */}
          <div className={card}>
            <div className={labelCls}>Idle windows (when batch work may run, once armed)</div>
            <ul className="mt-2 space-y-1 text-[0.75rem] text-[#1A1815]">
              <li className="flex gap-2"><span className="text-[#B85838]" aria-hidden="true">·</span><span>22:00 → 06:00 — overnight</span></li>
              <li className="flex gap-2"><span className="text-[#B85838]" aria-hidden="true">·</span><span>13:00 → 15:00 — the between-services lull</span></li>
            </ul>
            <p className="mt-2 text-[0.6875rem] text-[#5A5751]">DR-0012: inference never runs on the box encoding a live stream during a service.</p>
          </div>

          {/* CAPABILITY INDEX — which node can take which job */}
          <div className={card}>
            <div className={labelCls}>Which node can take which job (capability index)</div>
            <p className="mt-1 text-[0.75rem] text-[#5A5751]">Routed jobs are matched to nodes by the capability tokens in the register — this is the single source the router reads.</p>
            <div className="mt-2 space-y-2">
              {JOB_TYPES.map((jt) => {
                const nodes = capIndex[jt.requires] || [];
                return (
                  <div key={jt.id} className="flex items-start justify-between gap-3 border-b border-[#E8E4DC] pb-2 last:border-0">
                    <div>
                      <div className="text-sm text-[#1A1815]" style={serif}>{jt.id}</div>
                      <div className="text-[0.6875rem] text-[#5A5751]">requires “{capabilityLabel(jt.requires)}”</div>
                    </div>
                    <div className="text-right text-[0.75rem]">
                      {nodes.length > 0
                        ? nodes.map((n) => <div key={n.id} className="text-[#1A1815]">{n.name}</div>)
                        : <span className="text-[#B85838]">no capable node</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ALL CAPABILITIES COVERAGE */}
          <div className={card}>
            <div className={labelCls}>Capability coverage</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {CAPABILITIES.map((c) => {
                const n = (capIndex[c.token] || []).length;
                return (
                  <span key={c.token} className={chip} title={`${n} device(s)`}>
                    {c.gpuJob && <span className="text-[#B85838]" aria-hidden="true">·</span>}
                    {c.label} <span className="text-[#5A5751]">{n}</span>
                  </span>
                );
              })}
            </div>
          </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
