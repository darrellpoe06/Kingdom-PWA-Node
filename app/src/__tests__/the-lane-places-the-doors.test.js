// =============================================================================
// THE LANE PLACES THE DOORS (DR-1015)
// =============================================================================
// Darrell, 2026-10-14: "What's nearby should be on all of them!!! Just not
// the address!!!" The held bed drew the town and no amenities because no
// door at 805 was ever placed: the in-app placement (DR-0998) runs in a phone
// session and fails silently. The lane now places doors from a runner with
// the app's own placement, and writes SQL the trigger still validates.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { doorsFromJson, placeDoors, updatesSql, UA } from '../../../scripts/place-doors.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const APT2 = { id: '11111111-2222-4333-8444-555555555555', instance_id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', address: '805 North Prospect Avenue', unit: 'Apt 2', city: 'Champaign', state: 'Illinois' };
const BED = { ...APT2, id: '66666666-7777-4888-8999-000000000000', address: '805 North Prospect Avenue Apt 4', unit: 'Bed B' };
const POINT = { lat: 40.123364, lng: -88.25828 };

describe('the doors the database hands over', () => {
  it('keeps only rows that are doors: a uuid and an address', () => {
    const doors = doorsFromJson(JSON.stringify([APT2, { id: 'nope', address: '1 Main' }, { id: APT2.id, address: '  ' }, null]));
    expect(doors).toHaveLength(1);
    expect(doors[0]).toEqual({ ...APT2, had_area: false });
    expect(doorsFromJson('not json')).toEqual([]);
    expect(doorsFromJson('{}')).toEqual([]);
  });
});

describe('placement with the app\'s own rules', () => {
  it('looks a building up ONCE, places every door in it, and never writes the exact point', async () => {
    const asked = [];
    const find = async (q) => { asked.push(q); return { ok: true, point: POINT, matched: '805 N PROSPECT AVE, CHAMPAIGN, IL, 61820' }; };
    const around = async () => ({ ok: true, lines: [
      { label: 'City bus stop (routes 7, 30)', miles: 0.1 }, { label: 'Schnucks (grocery)', miles: 1.2 },
      { label: 'Target on North Prospect Avenue', miles: 1.3 }, // names the street: dropped for EVERY door in the building, the bed included
    ] });
    const r = await placeDoors([APT2, BED], { find, around, wait: async () => {} });
    expect(asked).toEqual(['805 North Prospect Avenue, Champaign, Illinois']);
    expect(r.placed.sort()).toEqual([APT2.id, BED.id].sort());
    expect(r.placements).toHaveLength(2);
    for (const p of r.placements) {
      expect(p.area_lat).toBe(40.125); expect(p.area_lng).toBe(-88.26); // rounded, never 40.123364
      expect(p.nearby.map((l) => l.label)).toEqual(['City bus stop (routes 7, 30)', 'Schnucks (grocery)']);
    }
    const sql = updatesSql(r.placements, { today: '2026-10-14' });
    expect(sql).not.toMatch(/40\.1233|88\.2582/);
    expect(sql).toContain(`WHERE id = '${APT2.id}' AND area_lat IS NULL;`);
    expect(sql).toContain('[2026-10-14] Edited — Placed on the map from its address (automatic): the area and 2 nearby lines');
    expect(sql).toContain('$j$[{"label":"City bus stop (routes 7, 30)","miles":0.1},{"label":"Schnucks (grocery)","miles":1.2}]$j$::jsonb');
    expect(sql.split('\n').filter(Boolean)).toHaveLength(2);
    expect(sql).not.toContain('North Prospect Avenue'); // the street never reaches SQL
  });

  it('a nearby read that failed writes the area with NULL for the list (asked again), and nothing at all for a door that already had its area', async () => {
    const find = async () => ({ ok: true, point: POINT, matched: '805 N PROSPECT AVE, CHAMPAIGN, IL, 61820' });
    const around = async () => ({ ok: false, reason: 'What is nearby took too long to answer.' });
    const r = await placeDoors([APT2], { find, around, wait: async () => {} });
    expect(r.placed).toEqual([APT2.id]);
    const sql = updatesSql(r.placements, { today: '2026-10-14' });
    expect(sql).toContain('nearby = NULL');
    expect(sql).not.toContain("'[]'::jsonb");
    expect(sql).toContain('what is nearby could not be read (What is nearby took too long to answer.) and will be asked again');
    const again = await placeDoors(doorsFromJson(JSON.stringify([{ ...APT2, had_area: true }])), { find, around, wait: async () => {} });
    expect(updatesSql(again.placements)).toBe('');
  });

  it('a house the lookup cannot confirm is left as it is', async () => {
    const find = async () => ({ ok: true, point: POINT, matched: 'North Prospect Avenue, Champaign' }); // no house number
    const r = await placeDoors([APT2], { find, around: async () => ({ ok: true, lines: [] }), wait: async () => {} });
    expect(r.placed).toEqual([]);
    expect(r.missed).toEqual([APT2.id]);
    expect(updatesSql(r.placements)).toBe('');
  });

  it('PROVEN-TO-CATCH: nothing but a uuid, finite coordinates and the line shape reaches SQL', () => {
    const base = { id: APT2.id, area_lat: 40.125, area_lng: -88.26, nearby: [{ label: 'x', miles: 1 }], summary: 's' };
    expect(updatesSql([{ ...base, id: "'; drop table rentals; --" }])).toBe('');
    expect(updatesSql([{ ...base, area_lat: 'abc' }])).toBe('');
    expect(updatesSql([{ ...base, area_lat: 91 }])).toBe('');
    const sql = updatesSql([{ ...base, nearby: [{ label: 'ok', miles: 1 }, { label: '', miles: 1 }, { label: 'far', miles: 101 }, { label: 'x'.repeat(200), miles: 2 }], summary: "it's $n$ not" }]);
    expect(sql).toBe(''); // a note that could close the quote is refused outright
    const sql2 = updatesSql([{ ...base, nearby: [{ label: 'ok', miles: 1 }, { label: '', miles: 1 }, { label: 'far', miles: 101 }, { label: 'x'.repeat(200), miles: 2 }], summary: "it's fine" }], { today: '2026-10-14' });
    expect(sql2).toContain('{"label":"ok","miles":1}');
    expect(sql2).not.toContain('"far"');
    expect(sql2).toContain(`"${'x'.repeat(80)}"`);
    expect(sql2).toContain("$n$[2026-10-14] Edited — it's fine$n$");
    // An honest empty answer is an ANSWER ([]), so NULL keeps meaning "never asked" (DR-1019).
    expect(updatesSql([{ ...base, nearby: [] }])).toContain("nearby = '[]'::jsonb");
    expect(updatesSql([{ ...base, nearby: [] }])).not.toContain('nearby = NULL');
    expect(updatesSql([{ ...base, nearby: null }])).toContain('nearby = NULL'); // a read that failed: never asked
  });
});

describe('the lane', () => {
  it('runs on dispatch, is dispatched after a successful deploy, carries the brakes, and names itself to the servers', () => {
    expect(existsSync(join(ROOT, '.github/workflows/place-doors.yml'))).toBe(true);
    const wf = read('.github/workflows/place-doors.yml');
    expect(wf).toMatch(/workflow_dispatch/);
    expect(wf).not.toMatch(/cron:/);                                  // never on a clock
    expect(wf).toMatch(/group: place-doors/);                         // LOCK
    expect(wf).toMatch(/cancel-in-progress: false/);
    expect(wf).toMatch(/timeout-minutes: 20/);                        // BUDGET (8 lookups x up to 2 min, DR-1019)
    expect(wf).toMatch(/PLACE_DOORS_ENABLED != 'false'/);             // KILL
    expect(wf).toMatch(/tailscale\/github-action@v3/);
    expect(wf).toMatch(/bash scripts\/place-doors-over-tailnet\.sh/);
    const deploy = read('.github/workflows/deploy-cloudflare-pages.yml');
    expect(deploy).toMatch(/workflows\/place-doors\.yml\/dispatches/);
    expect(deploy).toMatch(/place-doors:\s*\n\s*name: dispatch the door placer \(after a successful deploy\)\s*\n\s*needs: deploy/);
    const sh = read('scripts/place-doors-over-tailnet.sh');
    expect(sh).toMatch(/area_lat is null or nearby is null/);          // doors not on the map, or never asked what is nearby (DR-1019)
    expect(sh).toMatch(/'had_area', area_lat is not null/);
    expect(sh).toMatch(/node scripts\/place-doors\.mjs/);
    expect(sh).toMatch(/MODE=write/);
    // Two different nothings (DR-1023): a door that had its area and could
    // not be read again is not "no house matched".
    expect(sh).toMatch(/matched their house but already had their area, and what is nearby could not be read again/);
    expect(sh).toMatch(/placed=\$\(grep -oE 'placed \[0-9\]\+' "\$WORK\/place\.log"/);
    expect(UA).toMatch(/^PoeTech door placer/);
  });
});

describe('a door that has its area but was never asked what is nearby (DR-1019)', () => {
  const base = { id: APT2.id, area_lat: 40.125, area_lng: -88.26, nearby: [{ label: 'x', miles: 1 }], summary: 's', had_area: true };

  it('keeps had_area through the JSON read, as the database prints it', () => {
    const doors = doorsFromJson(JSON.stringify([{ ...APT2, had_area: true }, { ...APT2, id: '11111111-1111-4111-8111-111111111111', had_area: 't' }, { ...APT2, id: '22222222-2222-4222-8222-222222222222' }]));
    expect(doors.map((d) => d.had_area)).toEqual([true, true, false]);
  });

  it('writes only the list, only where none was ever written, and leaves the area alone', () => {
    const sql = updatesSql([base], { today: '2026-10-14' });
    expect(sql).toMatch(/^UPDATE public\.rentals SET nearby = \$j\$/);
    expect(sql).not.toContain('area_lat =');
    expect(sql).toContain(`WHERE id = '${APT2.id}' AND nearby IS NULL;`);
    expect(sql).toContain('[2026-10-14] Edited — What is nearby, read from its address (automatic, by the lane): 1 nearby line');
  });

  it('nothing found is nothing to write: the door is asked again next run', () => {
    expect(updatesSql([{ ...base, nearby: [] }])).toBe('');
  });

  it('the placer carries had_area from the door onto what it would save', async () => {
    const doors = doorsFromJson(JSON.stringify([{ ...APT2, had_area: true }]));
    const find = async () => ({ ok: true, point: { lat: 40.1234, lng: -88.2583 }, matched: '805 N PROSPECT AVE, CHAMPAIGN, IL, 61820' });
    const around = async () => ({ ok: true, lines: [{ label: 'Schnucks (grocery)', miles: 1.2 }] });
    const r = await placeDoors(doors, { find, around, wait: async () => {} });
    expect(r.placements[0].had_area).toBe(true);
    expect(updatesSql(r.placements)).toContain('AND nearby IS NULL;');
  });
});
