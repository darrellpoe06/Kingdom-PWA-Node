// @vitest-environment node
// =============================================================================
// Co-living: the dual operating model, and the gate that must refuse
// =============================================================================
// Source: the spec Darrell commissioned (2026-06-09, DR-026…DR-030). Two of its
// clauses are binding in a way prose cannot enforce, so they are code here and
// pinned here:
//   DR-029 — a property MUST NOT switch to by-room until a per-property legal /
//            zoning / licensing checklist is cleared and recorded.
//   DR-028 — locks and logs at the door; NO surveillance inside a room, ever.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import {
  OPERATING_MODES, ROOM_DEFAULTS, COMPLIANCE_CHECKLIST, CHECKLIST_IDS,
  clearanceRecord, outstandingItems, canSwitchToByRoom, setOperatingMode,
  buildRoom, assertNoRoomSurveillance, accessLogEntry,
  SUPPORTIVE_HOUSING, supportiveHousingAllows,
} from '../modules/properties/coliving.js';

const here = dirname(fileURLToPath(import.meta.url));
const clearAll = () => CHECKLIST_IDS.map((id) =>
  clearanceRecord({ itemId: id, clearedBy: 'Trevor (real-estate counsel)', clearedAt: '2026-09-01' }).record);

describe('two modes, chosen per door (DR-026)', () => {
  it('offers exactly whole-unit and by-room', () => {
    expect([...OPERATING_MODES]).toEqual(['whole-unit', 'by-room']);
  });

  it('whole-unit is always allowed — it is the safer direction', () => {
    expect(setOperatingMode('whole-unit')).toEqual({ ok: true, mode: 'whole-unit', reason: '' });
  });

  it('an unknown mode is refused outright', () => {
    expect(setOperatingMode('whatever').ok).toBe(false);
  });
});

describe('THE GATE — by-room is refused until a person clears every item (DR-029)', () => {
  it('refuses with nothing cleared, and names what is outstanding', () => {
    const r = setOperatingMode('by-room');
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('checklist-incomplete');
    expect(r.outstanding).toEqual(CHECKLIST_IDS);
    expect(r.message).toMatch(/different legal regime for this parcel/i);
  });

  it('refuses when even ONE item is missing — five of six is not cleared', () => {
    const partial = clearAll().slice(0, CHECKLIST_IDS.length - 1);
    const r = setOperatingMode('by-room', { clearances: partial });
    expect(r.ok).toBe(false);
    expect(r.outstanding).toHaveLength(1);
  });

  it('allows the switch only when all six are cleared and recorded', () => {
    expect(setOperatingMode('by-room', { clearances: clearAll() })).toEqual({ ok: true, mode: 'by-room', reason: '' });
  });

  it('covers the six regimes the spec names', () => {
    expect(CHECKLIST_IDS).toEqual(['zoning', 'licensing', 'occupancy', 'fire-code', 'insurance', 'per-room-law']);
    const fire = COMPLIANCE_CHECKLIST.find((c) => c.id === 'fire-code');
    expect(fire.question).toMatch(/smoke and CO detectors per room/i);
  });

  it('a clearance must name WHO cleared it and WHEN — the module records that, not the determination', () => {
    expect(clearanceRecord({ itemId: 'zoning', clearedAt: '2026-09-01' })).toEqual({ ok: false, reason: 'no-one-named' });
    expect(clearanceRecord({ itemId: 'zoning', clearedBy: 'Trevor' })).toEqual({ ok: false, reason: 'no-date' });
    expect(clearanceRecord({ itemId: 'made-up', clearedBy: 'x', clearedAt: 'y' })).toEqual({ ok: false, reason: 'unknown-item' });
    const ok = clearanceRecord({ itemId: 'zoning', clearedBy: 'Trevor', clearedAt: '2026-09-01', reference: 'letter 4/12' });
    expect(ok.record).toMatchObject({ item_id: 'zoning', cleared_by: 'Trevor', reference: 'letter 4/12' });
  });

  it('routes each question to a human, per the spec', () => {
    expect(COMPLIANCE_CHECKLIST.every((c) => !!c.routesTo)).toBe(true);
    expect(COMPLIANCE_CHECKLIST.find((c) => c.id === 'insurance').routesTo).toMatch(/insurer/i);
  });
});

describe('rooms carry the spec\'s own economics (DR-027)', () => {
  it('$1,000 a room, utilities included, one or two people', () => {
    expect(ROOM_DEFAULTS.monthlyRent).toBe(1000);
    expect(ROOM_DEFAULTS.utilitiesIncluded).toBe(true);
    expect(buildRoom({ name: 'Front bedroom' }).monthly_rent).toBe(1000);
  });

  it('occupancy is clamped to the 1–2 the spec sets, whatever a caller asks for', () => {
    expect(buildRoom({ occupancy: 5 }).occupancy).toBe(2);
    expect(buildRoom({ occupancy: 0 }).occupancy).toBe(1);
  });
});

describe('THE PRIVACY LINE — no surveillance inside a room, ever (DR-028)', () => {
  it('refuses a camera, a microphone, or a sensor that watches a room', () => {
    for (const cfg of [{ camera: true }, { room: { cctv: 'x' } }, { devices: [{ type: 'microphone' }] }, { occupancy_sensor: 1 }]) {
      const r = assertNoRoomSurveillance(cfg);
      expect(r.ok, `${JSON.stringify(cfg)} was allowed`).toBe(false);
      expect(r.message).toMatch(/no surveillance inside a room, ever/i);
    }
  });

  it('allows the lock and its log, which live at the door', () => {
    expect(assertNoRoomSurveillance({ smart_lock: true, access_log: true }).ok).toBe(true);
    expect(accessLogEntry({ roomId: 'r1', personId: 'p1', action: 'entered', at: '2026-09-01T10:00:00Z' }))
      .toEqual({ room_id: 'r1', person_id: 'p1', action: 'entered', at: '2026-09-01T10:00:00Z' });
  });

  it('an unknown action degrades to granted rather than inventing a verb', () => {
    expect(accessLogEntry({ action: 'watched' }).action).toBe('granted');
  });
});

describe('supportive housing keeps its wall (DR-030)', () => {
  it('housing and wraparound are in scope; clinical is not', () => {
    expect(supportiveHousingAllows('case management').ok).toBe(true);
    expect(supportiveHousingAllows('1099 work').ok).toBe(true);
    expect(supportiveHousingAllows('SUD treatment').ok).toBe(false);
    expect(supportiveHousingAllows('therapy notes').ok).toBe(false);
    expect(supportiveHousingAllows('diagnosis').message).toMatch(/ISO-1 \/ HIPAA/);
  });

  it('the default posture is the spec\'s, and says whose call changing it is', () => {
    expect(SUPPORTIVE_HOUSING.status).toMatch(/housing-only, clinical-walled/);
    expect(SUPPORTIVE_HOUSING.status).toMatch(/Governor/);
  });
});

describe('the code and the spec do not drift apart', () => {
  const spec = readFileSync(join(here, '../../../docs/99-session-notes/2026-06-09-poe-properties-dual-model-coliving-supportive-housing-spec.md'), 'utf8');

  it('the room price and occupancy match the source document', () => {
    expect(spec).toMatch(/\$1,000 \/ room \/ month, utilities included/);
    expect(spec).toMatch(/occupancy configurable 1-2 per room/);
  });

  it('the binding gate and the privacy line are the spec\'s words, not mine', () => {
    expect(spec).toMatch(/MUST NOT let a property switch to room-rental until a per-property legal\/zoning\/licensing checklist is cleared/);
    expect(spec).toMatch(/NO surveillance inside rooms \u2014 ever/);
  });
});
