// =============================================================================
// BuildingTools — the building's own record and its own work, under its header
// in Real Estate (DR-1216)
// =============================================================================
// Darrell, 2026-10-22: "805 N Prospect Ave Champaign IL the building... not one
// of the apartments... we need work done in the foyer... and other basement
// activities", "There is only 4 apartments in the building", "We were
// splitting apt 4 after the current tenant moves", "I want to fix it now", and
// "We want the best sustainable solutions!!!".
//
// SUSTAINABLE MEANS FIXED AT THE RECORD. The building reads as one because its
// doors share an address (lib/building-group.js buildingResolver), but only one
// of 805's five door records carried the building name (building-probe). So
// the strip offers to write the name onto the doors that lack it, which makes
// every surface agree without inference; and it names a unit label on record
// twice (the Apt 4 split half), so the half can be named apart. Each write is
// the existing updateRental, one tap, confirmed by the person; nothing is
// renamed on its own.
//
// ONE BUILDING, FLEXIBLE DOORS (Darrell: "Our number of buildings dont change
// however the number of doors can because of our needs to have flexibility in
// our support for tenants and the community to have housing"). The building is
// the fixed record; its doors split (a unit into two, into rooms, into beds)
// and merge as the need changes. So the strip counts doors without calling a
// count wrong, and a building's work links to the building, not to a door, so
// it survives every split.
//
// THE BUILDING'S WORK. Open work orders linked to the building itself
// ({ type: 'building' }) are listed here, and one can be added for a part of
// the building (foyer, basement...) through the shell's addIncident, the same
// record the work order triage reads and acts on.
import React, { useState } from 'react';
import { buildingRecordGaps, splitHalfLabel, unitLabelOf } from '../lib/building-group.js';
import { BUILDING_AREAS, NEW_URGENCIES, newWorkOrder, isClosed } from '../lib/work-order-triage.js';

const MUTED = 'text-[#5A5751]';
const FOCUS_RING = 'focus:outline focus:outline-2 focus:outline-[#B85838]';
const BTN = `text-[0.6875rem] border border-[#B85838] text-[#B85838] bg-white px-2 min-h-[36px] disabled:opacity-50 ${FOCUS_RING}`;

function SplitHalf({ group, updateRental, onDone }) {
  // The half offered for a new name: the door with no rent being collected
  // (the one added for the split), else the last one listed.
  const target = group.doors.find((r) => r.status === 'unrented') || group.doors[group.doors.length - 1];
  const [name, setName] = useState(splitHalfLabel(group.label));
  const id = `bt-split-${target.id}`;
  return (
    <form className="flex flex-wrap items-center gap-1.5" data-testid="building-split-half"
      onSubmit={(e) => {
        e.preventDefault();
        const label = name.trim();
        if (!label) return;
        const base = String(target.address || '').trim();
        updateRental(target.id, { unitLabel: label, name: base ? `${base} ${label}` : label });
        onDone(`${group.label} (${target.status === 'unrented' ? 'not rented' : target.status || 'the second record'}) is now ${label}.`);
      }}>
      <span className="text-[0.6875rem]">
        {group.doors.length} doors are named <strong>{group.label}</strong>. Give the {target.status === 'unrented' ? 'unrented one (the split half)' : 'second one'} its own name:
      </span>
      <label className="sr-only" htmlFor={id}>New unit name</label>
      <input id={id} value={name} onChange={(e) => setName(e.target.value)} className={`text-xs border border-[#E8E4DC] px-2 min-h-[36px] w-28 ${FOCUS_RING}`} />
      <button type="submit" disabled={!name.trim()} className={BTN} data-testid="building-split-save">Save the name</button>
    </form>
  );
}

export default function BuildingTools({ entry, incidents = [], addIncident = null, updateRental = null, readOnly = false }) {
  const [adding, setAdding] = useState(false);
  const [area, setArea] = useState(BUILDING_AREAS[0]);
  const [words, setWords] = useState('');
  const [urgency, setUrgency] = useState('incident');
  const [said, setSaid] = useState(null);
  if (!entry || entry.type !== 'building') return null;
  const gaps = buildingRecordGaps(entry.units, entry.key);
  const open = (incidents || []).filter((i) => i && i.linkedTo && i.linkedTo.type === 'building' && i.linkedTo.id === entry.key && !isClosed(i.status));
  const canWrite = !readOnly && typeof updateRental === 'function';
  const field = `text-xs border border-[#E8E4DC] bg-white px-2 min-h-[36px] ${FOCUS_RING}`;
  // A building's name has spaces and commas; an element id must not.
  const idKey = String(entry.key).replace(/[^A-Za-z0-9_-]+/g, '-');

  const save = (e) => {
    e.preventDefault();
    const made = newWorkOrder({ where: { kind: 'building', key: entry.key }, area, words, urgency });
    if (made.error) { setSaid({ ok: false, text: made.error }); return; }
    try {
      addIncident(made.item);
      setWords(''); setAdding(false);
      setSaid({ ok: true, text: `Saved: ${made.item.description.slice(0, 80)}. It is in the work order triage (Life Hub and Big Picture) to give to a worker.` });
    } catch (err) {
      setSaid({ ok: false, text: `Not saved: ${(err && err.message) || 'unexpected'}.` });
    }
  };

  return (
    <div className="px-3 py-2 border-b border-[#E8E4DC] space-y-1.5 bg-white" data-testid="building-tools">
      {/* One building, as many doors as the housing needs (Darrell 2026-10-22:
          "Our number of buildings dont change however the number of doors can").
          A door count above the named units is allowed; two doors sharing one
          name is the only thing flagged, because then no one can tell them apart. */}
      <p className={`text-[0.625rem] ${MUTED}`} data-testid="building-count">
        {gaps.records} {gaps.records === 1 ? 'door' : 'doors'}
        {gaps.duplicates.length ? ` · ${gaps.duplicates.map((d) => `${d.doors.length} named ${d.label}`).join(', ')}` : ''}
        {` · ${open.length} open building work order${open.length === 1 ? '' : 's'}`}
      </p>
      {canWrite && gaps.missingLabel.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5" data-testid="building-fill-name">
          <span className="text-[0.6875rem]">{gaps.missingLabel.length} of {gaps.records} doors are missing the building name ({gaps.missingLabel.map(unitLabelOf).join(', ')}).</span>
          <button type="button" className={BTN} data-testid="building-fill-go" onClick={() => {
            for (const r of gaps.missingLabel) updateRental(r.id, { building: entry.key });
            setSaid({ ok: true, text: `Building name written on ${gaps.missingLabel.length} doors.` });
          }}>Write it on them</button>
        </div>
      )}
      {canWrite && gaps.duplicates.map((g) => (
        <SplitHalf key={g.label} group={g} updateRental={updateRental} onDone={(text) => setSaid({ ok: true, text })} />
      ))}
      {open.length > 0 && (
        <ul className="space-y-0.5" aria-label="Open work orders for the building" data-testid="building-work-orders">
          {open.map((i) => <li key={i.id} className="text-[0.6875rem] line-clamp-2"><span aria-hidden="true">•</span> {i.description}</li>)}
        </ul>
      )}
      {!readOnly && typeof addIncident === 'function' && !adding && (
        <button type="button" className={BTN} onClick={() => setAdding(true)} data-testid="building-work-order-new">+ Work order for the building</button>
      )}
      {adding && (
        <form onSubmit={save} className="flex flex-col gap-1.5" data-testid="building-work-order-form">
          <label className="text-[0.625rem] uppercase tracking-wider" htmlFor={`bt-area-${idKey}`}>Which part of the building?</label>
          <select id={`bt-area-${idKey}`} value={area} onChange={(e) => setArea(e.target.value)} className={field}>
            {BUILDING_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <label className="text-[0.625rem] uppercase tracking-wider" htmlFor={`bt-words-${idKey}`}>What needs doing?</label>
          <textarea id={`bt-words-${idKey}`} rows={2} value={words} onChange={(e) => setWords(e.target.value)} className={`${field} py-1`} placeholder="e.g. Clear and seal the basement floor drain" />
          <label className="text-[0.625rem] uppercase tracking-wider" htmlFor={`bt-urg-${idKey}`}>How soon?</label>
          <select id={`bt-urg-${idKey}`} value={urgency} onChange={(e) => setUrgency(e.target.value)} className={field}>
            {NEW_URGENCIES.map((u) => <option key={u.key} value={u.key}>{u.label}</option>)}
          </select>
          <div className="flex gap-1.5">
            <button type="submit" className={`text-[0.6875rem] bg-[#1A1815] text-white px-3 min-h-[36px] ${FOCUS_RING}`} data-testid="building-work-order-save">Save the work order</button>
            <button type="button" className={BTN} onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </form>
      )}
      {said && <p role="status" className={`text-[0.625rem] ${said.ok ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`} data-testid="building-said">{said.text}</p>}
    </div>
  );
}
