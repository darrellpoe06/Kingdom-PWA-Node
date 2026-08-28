// =============================================================================
// SystemsTab — the mechanical history of a property, on the property
// =============================================================================
// Darrell, 2026-08-28: "...keeping a mechanical history of the system's and
// issues like all our properties etc..."
//
// REALITY-TRACE (DR-0061), before the code as the rule requires:
//   Reads property_systems and property_system_events (both new in 0156), keyed
//   by rentals.id — the UUID, never the slug. Writes through cloud.addSystem /
//   patchSystem / addSystemEvent, all RLS-scoped: management writes, everyone
//   with standing at the door reads.
//   NOTHING IS PAINTED. Age comes from installed_on; "next due" comes from the
//   newest servicing EVENT; the header counts are counted from the rows on
//   screen. A system nobody has dated reports UNKNOWN — never "ok", never 0
//   years old — because a capital plan built on an invented age is worse than
//   one that admits the gap.
//
// This tab is identical for a rental door and for our own home. That is the
// point: "like all our properties."
// =============================================================================
import React, { useMemo, useState } from 'react';
import {
  systemBoard, buildSystem, buildSystemEvent, retireSystem, defaultsFor,
  inferSystemKind, sortEvents, SYSTEM_KINDS, EVENT_KINDS, KIND_LABEL, EVENT_LABEL,
  seedSystems, STARTER_SYSTEMS,
} from './systems.js';

const ACCENT = '#2F5D50';

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

const field = 'w-full border border-[#E8E4DC] px-2 py-2 text-[0.875rem] focus:outline focus:outline-2 focus:outline-[#2F5D50]';
const lbl = 'block text-[0.625rem] uppercase tracking-wider text-[#6B665E] mb-1';

// One colour vocabulary for the two health readings, so a person learns it once.
// Amber for "unknown" on purpose: a gap in the record is a thing to go and find
// out, not a neutral state to scroll past.
const TONE = {
  ok: { color: '#2F5D50', word: 'OK' },
  due: { color: '#B8860B', word: 'Due' },
  'near-end': { color: '#B8860B', word: 'Ageing' },
  unknown: { color: '#8A6D1F', word: 'Unknown' },
  overdue: { color: '#B23A2E', word: 'Overdue' },
  'past-life': { color: '#B23A2E', word: 'Past life' },
  none: { color: '#6B665E', word: '—' },
};

const Pill = ({ state, children }) => {
  const t = TONE[state] || TONE.none;
  return (
    <span className="text-[0.5625rem] uppercase tracking-wider font-semibold border px-1.5 py-0.5"
      style={{ color: t.color, borderColor: t.color }}>
      {children || t.word}
    </span>
  );
};

const money = (n) => (n === null || n === undefined ? null : `$${Number(n).toFixed(2).replace(/\.00$/, '')}`);
const today = () => new Date().toISOString().slice(0, 10);

export function SystemsTab({
  door, systems = [], events = [], rooms = [], canManage = false, busy = false,
  propertyType = 'house', onAdd, onPatch, onEvent, onSeed,
}) {
  const [adding, setAdding] = useState(false);
  const [openFor, setOpenFor] = useState(null);   // which system's history is expanded
  const [loggingFor, setLoggingFor] = useState(null);
  const [error, setError] = useState('');

  const board = useMemo(() => systemBoard(systems, events), [systems, events]);

  if (!door?.id) {
    return (
      <Card title="Mechanical history">
        <p className="text-[0.8125rem] text-[#6B665E] leading-relaxed">
          Pick a property first. Equipment belongs to a building, not to a tenancy — which is why
          this record survives every tenant the door ever has.
        </p>
      </Card>
    );
  }

  const submitSystem = (form) => {
    setError('');
    try {
      const row = buildSystem({ ...form, instanceId: door.instance_id, rentalRef: door.id }, systems);
      onAdd?.(row);
      setAdding(false);
    } catch (e) { setError(e.message); }
  };

  const submitEvent = (systemId, form) => {
    setError('');
    try {
      const row = buildSystemEvent({
        ...form, instanceId: door.instance_id, systemRef: systemId, rentalRef: door.id,
      });
      onEvent?.(row);
      setLoggingFor(null);
    } catch (e) { setError(e.message); }
  };

  const retire = (system) => {
    const { patch } = retireSystem(system);
    onPatch?.(system.id, patch);
  };

  return (
    <>
      <Card
        title="Mechanical history"
        right={
          <span className="text-[0.6875rem] text-[#6B665E]">
            {board.count} system{board.count === 1 ? '' : 's'}
            {board.attention > 0 ? ` · ${board.attention} need attention` : ''}
            {board.unknown > 0 ? ` · ${board.unknown} unrecorded` : ''}
          </span>
        }
      >
        <p className="text-[0.8125rem] text-[#6B665E] leading-relaxed mb-2">
          What is installed here, how old it is, and everything that has happened to it. A blank
          install date stays blank — an age nobody recorded is reported as unknown rather than
          guessed, because a replacement plan built on a guess is worse than one that admits the gap.
        </p>

        {error && <p className="text-[0.8125rem] text-[#B23A2E] leading-relaxed mb-2">{error}</p>}

        {board.count === 0 && (
          <div>
            <p className="text-[0.8125rem] text-[#6B665E] leading-relaxed">
              Nothing recorded yet for this property.
            </p>
            {canManage && (
              <div className="flex flex-wrap gap-1 mt-2">
                <Btn tone="primary" disabled={busy} onClick={() => setAdding(true)}>Add a system</Btn>
                <Btn
                  disabled={busy}
                  onClick={() => onSeed?.(seedSystems({ instanceId: door.instance_id, rentalRef: door.id, propertyType }, systems))}
                >
                  Start with the usual {(STARTER_SYSTEMS[propertyType] || STARTER_SYSTEMS.house).length}
                </Btn>
              </div>
            )}
          </div>
        )}

        {board.count > 0 && (
          <ul>
            {board.rows.map((r) => (
              <li key={r.system.id} className="border-b border-[#F0EDE6] py-2 last:border-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenFor(openFor === r.system.id ? null : r.system.id)}
                    className="text-left flex-1 min-w-[10rem] hover:underline"
                  >
                    <div className="text-[0.875rem] text-[#1A1815]">
                      {r.label}
                      <span className="text-[0.6875rem] text-[#6B665E]"> · {KIND_LABEL[r.system.kind] || r.system.kind}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <Pill state={r.life.state} />
                      <span className="text-[0.75rem] text-[#5A5751]">
                        {r.life.age === null ? 'age not recorded' : `${r.life.age}y old`} · {r.life.say}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <Pill state={r.service.state} />
                      <span className="text-[0.75rem] text-[#5A5751]">Service: {r.service.say}</span>
                    </div>
                    <div className="text-[0.75rem] text-[#6B665E] mt-0.5">
                      {r.eventCount} record{r.eventCount === 1 ? '' : 's'}
                      {r.openIssues > 0 ? ` · ${r.openIssues} issue${r.openIssues === 1 ? '' : 's'}` : ''}
                      {r.spend > 0 ? ` · ${money(r.spend)} spent` : ''}
                      {r.system.location_note ? ` · ${r.system.location_note}` : ''}
                    </div>
                  </button>
                  {canManage && (
                    <div className="flex flex-wrap gap-1">
                      <Btn disabled={busy} onClick={() => setLoggingFor(loggingFor === r.system.id ? null : r.system.id)}>
                        {loggingFor === r.system.id ? 'Close' : 'Record'}
                      </Btn>
                      <Btn disabled={busy} onClick={() => retire(r.system)}>Retire</Btn>
                    </div>
                  )}
                </div>

                {loggingFor === r.system.id && (
                  <LogEvent busy={busy} onSave={(f) => submitEvent(r.system.id, f)} />
                )}

                {openFor === r.system.id && (
                  <div className="mt-2 pl-2 border-l-2" style={{ borderColor: ACCENT }}>
                    <Detail system={r.system} rooms={rooms} />
                    {r.events.length === 0 ? (
                      <p className="text-[0.8125rem] text-[#6B665E] leading-relaxed">
                        Nothing has been recorded against this one yet.
                      </p>
                    ) : (
                      <ul>
                        {sortEvents(r.events).map((e) => (
                          <li key={e.id || `${e.event_date}-${e.summary}`} className="py-1.5">
                            <div className="flex flex-wrap items-baseline gap-x-2">
                              <span className="text-[0.625rem] uppercase tracking-wider font-semibold" style={{ color: ACCENT }}>
                                {EVENT_LABEL[e.kind] || e.kind}
                              </span>
                              <span className="text-[0.6875rem] text-[#6B665E]">{e.event_date}</span>
                              {e.vendor_name && <span className="text-[0.6875rem] text-[#6B665E]">· {e.vendor_name}</span>}
                              {e.cost !== null && e.cost !== undefined && (
                                <span className="text-[0.6875rem] text-[#6B665E]">· {money(e.cost)}</span>
                              )}
                            </div>
                            <div className="text-[0.8125rem] text-[#1A1815]">{e.summary}</div>
                            {e.notes && <div className="text-[0.75rem] text-[#6B665E]">{e.notes}</div>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {canManage && board.count > 0 && !adding && (
          <div className="mt-2"><Btn tone="primary" disabled={busy} onClick={() => setAdding(true)}>Add a system</Btn></div>
        )}
        {adding && <AddSystem rooms={rooms} busy={busy} onSave={submitSystem} onCancel={() => setAdding(false)} />}
      </Card>

      {board.retired.length > 0 && (
        <Card title={`Retired (${board.retired.length})`}>
          <p className="text-[0.8125rem] text-[#6B665E] leading-relaxed mb-2">
            Taken out or replaced. Their records stay: what a replaced furnace cost and how often it
            failed is exactly what tells you whether the replacement was overdue.
          </p>
          <ul>
            {board.retired.map((s) => (
              <li key={s.id} className="text-[0.8125rem] text-[#5A5751] py-1">
                {s.name} · {KIND_LABEL[s.kind] || s.kind}
                {canManage && (
                  <Btn disabled={busy} onClick={() => onPatch?.(s.id, { archived_at: null, archived_by: null })}>
                    Put back
                  </Btn>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

/** The equipment's own details, shown when a system is opened. */
function Detail({ system, rooms = [] }) {
  const room = rooms.find((r) => r.id === system.room_id);
  const bits = [
    system.make && `Make: ${system.make}`,
    system.model && `Model: ${system.model}`,
    system.serial && `Serial: ${system.serial}`,
    room && `Room: ${room.name}`,
    system.installed_on ? `Installed: ${system.installed_on}` : 'Installed: not recorded',
    system.warranty_until && `Warranty to: ${system.warranty_until}`,
    system.expected_life_years && `Usual life: ${system.expected_life_years}y`,
    system.service_interval_months && `Serviced every ${system.service_interval_months} months`,
  ].filter(Boolean);
  return (
    <div className="mb-2">
      <div className="text-[0.75rem] text-[#5A5751]">{bits.join(' · ')}</div>
      {system.notes && <div className="text-[0.75rem] text-[#6B665E] mt-0.5">{system.notes}</div>}
    </div>
  );
}

/**
 * Add a system. Every field is optional except the name, because a landlord
 * standing in a basement knows "Furnace" long before he knows its serial — and
 * a form that demands the serial gets no furnace recorded at all.
 * EDITABLE-EVERYWHERE: what goes in blank comes back and gets filled later.
 */
function AddSystem({ rooms = [], busy, onSave, onCancel }) {
  const [f, setF] = useState({
    name: '', kind: '', make: '', model: '', serial: '', roomId: '',
    locationNote: '', installedOn: '', expectedLifeYears: '', warrantyUntil: '',
    serviceIntervalMonths: '', notes: '',
  });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  // The kind follows the name until somebody chooses one, and choosing one
  // prefills the usual life and interval — figures the landlord then overwrites
  // with what this building's actual equipment is.
  const kind = f.kind || inferSystemKind(f.name);
  const applyKind = (k) => {
    const d = defaultsFor(k);
    setF((p) => ({
      ...p, kind: k,
      expectedLifeYears: d.expectedLifeYears === null ? '' : String(d.expectedLifeYears),
      serviceIntervalMonths: d.serviceIntervalMonths === null ? '' : String(d.serviceIntervalMonths),
    }));
  };

  return (
    <div className="mt-2 pl-2 border-l-2" style={{ borderColor: ACCENT }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label><span className={lbl}>What is it</span>
          <input type="text" className={field} value={f.name} onChange={set('name')} placeholder="Furnace, water heater, roof…" />
        </label>
        <label><span className={lbl}>Kind</span>
          <select className={field} value={kind} onChange={(e) => applyKind(e.target.value)}>
            {SYSTEM_KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k] || k}</option>)}
          </select>
        </label>
        <label><span className={lbl}>Make</span>
          <input type="text" className={field} value={f.make} onChange={set('make')} />
        </label>
        <label><span className={lbl}>Model</span>
          <input type="text" className={field} value={f.model} onChange={set('model')} />
        </label>
        <label><span className={lbl}>Serial</span>
          <input type="text" className={field} value={f.serial} onChange={set('serial')} />
        </label>
        <label><span className={lbl}>Where it is</span>
          <input type="text" className={field} value={f.locationNote} onChange={set('locationNote')} placeholder="Basement, north wall" />
        </label>
        <label><span className={lbl}>Installed on</span>
          <input type="date" className={field} value={f.installedOn} onChange={set('installedOn')} />
        </label>
        <label><span className={lbl}>Warranty until</span>
          <input type="date" className={field} value={f.warrantyUntil} onChange={set('warrantyUntil')} />
        </label>
        <label><span className={lbl}>Usual life (years)</span>
          <input type="text" inputMode="numeric" className={field} value={f.expectedLifeYears} onChange={set('expectedLifeYears')} />
        </label>
        <label><span className={lbl}>Service every (months)</span>
          <input type="text" inputMode="numeric" className={field} value={f.serviceIntervalMonths} onChange={set('serviceIntervalMonths')} />
        </label>
        {rooms.length > 0 && (
          <label><span className={lbl}>Room</span>
            <select className={field} value={f.roomId} onChange={set('roomId')}>
              <option value="">Not tied to a room</option>
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
        )}
        <label className="sm:col-span-2"><span className={lbl}>Notes</span>
          <input type="text" className={field} value={f.notes} onChange={set('notes')} />
        </label>
      </div>
      <p className="text-[0.8125rem] text-[#6B665E] leading-relaxed mt-2">
        Only the name is required. Leave the install date blank if nobody knows it — it will read
        &ldquo;unknown&rdquo;, which is true, and can be filled in the day somebody finds the sticker.
      </p>
      <div className="mt-2 flex gap-1">
        <Btn tone="primary" disabled={busy} onClick={() => onSave({ ...f, kind })}>Save the system</Btn>
        <Btn disabled={busy} onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  );
}

/** Record what happened. The date and a plain sentence are the requirement. */
function LogEvent({ busy, onSave }) {
  const [f, setF] = useState({
    kind: 'serviced', eventDate: today(), summary: '', vendorName: '', cost: '', notes: '',
  });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  return (
    <div className="mt-2 pl-2 border-l-2" style={{ borderColor: ACCENT }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label><span className={lbl}>What happened</span>
          <select className={field} value={f.kind} onChange={set('kind')}>
            {EVENT_KINDS.map((k) => <option key={k} value={k}>{EVENT_LABEL[k] || k}</option>)}
          </select>
        </label>
        <label><span className={lbl}>When</span>
          <input type="date" className={field} value={f.eventDate} onChange={set('eventDate')} />
        </label>
        <label className="sm:col-span-2"><span className={lbl}>In a sentence</span>
          <input type="text" className={field} value={f.summary} onChange={set('summary')} placeholder="Annual service, replaced the igniter" />
        </label>
        <label><span className={lbl}>Who did it</span>
          <input type="text" className={field} value={f.vendorName} onChange={set('vendorName')} />
        </label>
        <label><span className={lbl}>Cost</span>
          <input type="text" inputMode="decimal" className={field} value={f.cost} onChange={set('cost')} />
        </label>
        <label className="sm:col-span-2"><span className={lbl}>Notes</span>
          <input type="text" className={field} value={f.notes} onChange={set('notes')} />
        </label>
      </div>
      <p className="text-[0.8125rem] text-[#6B665E] leading-relaxed mt-2">
        Records are kept, not edited — a date is corrected by recording what is true now, the same
        way this app treats every other piece of evidence.
      </p>
      <div className="mt-2"><Btn tone="primary" disabled={busy} onClick={() => onSave(f)}>Record it</Btn></div>
    </div>
  );
}

export default SystemsTab;
