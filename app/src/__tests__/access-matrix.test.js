// =============================================================================
// Who sees what, by role — the evaluated access matrix (DR-1198)
// =============================================================================
// Darrell, 2026-10-21: "All access to the different options per user needs to
// be evaluated for correct access and flexibility that gives us options to do
// what we want." The matrix is the evaluation; these pins hold it to the walls
// it describes (the policy text, the forwarder's grammar, the smoke), and keep
// the 1099 worker's camera cell saying what he asked for: any cameras, by
// name, more than the door offers its tenants.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROLES, ACCESS_MATRIX, accessFor, whoReads, widerThanTenant } from '../modules/properties/access-matrix.js';
import { badCameraIds, CAMERA_ID } from '../lib/cameras.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (...p) => readFileSync(join(ROOT, ...p), 'utf8');

describe('the matrix is whole', () => {
  it('every row has a cell for every face, and every cell says what is read', () => {
    for (const row of ACCESS_MATRIX) {
      for (const r of ROLES) {
        const c = row.cells[r.id];
        expect(c, `${row.id} has no cell for ${r.id}`).toBeTruthy();
        expect(typeof c.reads).toBe('string');
        expect(c.reads.length, `${row.id}/${r.id} reads is empty`).toBeGreaterThan(0);
      }
    }
    expect(accessFor('worker')).toHaveLength(ACCESS_MATRIX.length);
  });
  it('names the walls: every family and tenant cell that reads anything cites where the rule lives', () => {
    for (const row of ACCESS_MATRIX) {
      for (const id of ['family', 'tenant']) {
        const c = row.cells[id];
        if (c.reads !== 'none') expect(c.wall.length, `${row.id}/${id} cites no wall`).toBeGreaterThan(0);
      }
    }
  });
});

describe('the 1099 worker is given more than a tenant where the family chooses', () => {
  it('cameras: any cameras, by name, not limited to the door\'s menu; and the smoke proves the database takes it', () => {
    const c = ACCESS_MATRIX.find((r) => r.id === 'cameras').cells.worker;
    expect(c.reads).toMatch(/any cameras/);
    expect(c.reads).toMatch(/not limited to what the door offers tenants/);
    expect(c.hand).toMatch(/as 1099 worker/);
    const smoke = read('infra', 'supabase', 'tests', '0266-door-camera-access-smoke.sql');
    expect(smoke).toMatch(/gives a 1099 worker five cameras, three of them off the door''s menu/);
    expect(smoke).toMatch(/cardinality\(cameras\) FROM door_camera_access WHERE id = giftW\) <> 5/);
    // The trigger only ever checks the MENU for an ask, never for a gift.
    const mig = read('infra', 'supabase', 'migrations-auto', '0266-a-door-camera-is-asked-for-and-given-to-whoever-the-family-chooses.sql');
    const fn = mig.slice(mig.indexOf('FUNCTION public.door_camera_access_on_insert'), mig.indexOf('REVOKE ALL ON FUNCTION public.door_camera_access_on_insert'));
    const ask = fn.slice(fn.indexOf("IF NEW.kind = 'request' THEN"), fn.indexOf('  ELSE'));
    expect(ask).toMatch(/only the cameras offered on this door can be asked for/);
    const gift = fn.slice(fn.indexOf('  ELSE'), fn.indexOf('  SELECT array_agg'));
    expect(gift).not.toMatch(/door_camera_menu/);
    expect(gift).toMatch(/only the family gives camera access/);
  });
  it('widerThanTenant names cameras and condition pictures for the worker, with the family\'s hand on each', () => {
    const ids = widerThanTenant('worker').map((w) => w.id);
    expect(ids).toContain('cameras');
    expect(ids).toContain('pictures-condition');
    expect(ids).toContain('door');
    for (const w of widerThanTenant('worker')) expect(w.hand.length).toBeGreaterThan(0);
  });
  it('the worker never reads rent or the landlord\'s private notes; a tenant never reads another tenancy\'s condition pictures', () => {
    expect(ACCESS_MATRIX.find((r) => r.id === 'rent').cells.worker.reads).toBe('none');
    expect(ACCESS_MATRIX.find((r) => r.id === 'notes').cells.worker.reads).toBe('none');
    expect(whoReads('notes')).toEqual(['family', 'manager']);
    expect(ACCESS_MATRIX.find((r) => r.id === 'pictures-condition').cells.tenant.reads).toMatch(/only their own tenancy/);
  });
});

describe('a camera-gift refusal names its cause (DR-0076 §8)', () => {
  it('the ids the NAS would refuse are named before anything is sent, by the forwarder\'s own grammar', () => {
    const fwd = read('infra', 'nas-cameras', 'cams_forwarder.py');
    const m = fwd.match(/^CAMERA_ID = re\.compile\(r"(.+)"\)/m);
    expect(m, 'the forwarder\'s CAMERA_ID moved').toBeTruthy();
    expect(new RegExp(m[1]).source).toBe(CAMERA_ID.source);
    expect(badCameraIds(['805_porch', '805 basement', 'poebasement', ''])).toEqual(['805 basement', '']);
    expect(badCameraIds(['front_yard'])).toEqual([]);
  });
  it('the app names the NAS\'s code and says what the database said, never a bare "pick at least one"', () => {
    const lib = read('app', 'src', 'lib', 'cameras.js');
    expect(lib).toMatch(/bad-cameras\)\.'/);
    expect(lib).not.toMatch(/'Pick at least one camera, or every camera\.'/);
    const desk = read('app', 'src', 'modules', 'properties', 'CameraAccess.jsx');
    expect(desk).toMatch(/badCameraIds\(cams\)/);
    expect(desk).toMatch(/the record was not written \(\$\{w\.reason\}/);
  });
});
