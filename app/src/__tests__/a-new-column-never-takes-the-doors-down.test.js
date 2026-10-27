// =============================================================================
// A new column never takes the doors down (DR-1199)
// =============================================================================
// The app deploys on merge; a migration applies on its own lane. On
// 2026-10-21 the door-journeys leg built its database without 0309, the
// rentals read asked for pictures_shared_with_door, PostgREST refused the WHOLE
// read, and the Properties board said it could not be reached. loadMyRentals
// now drops a missing OPTIONAL column and asks again; any other refusal is
// still a refusal. PROVEN TO CATCH: with the fallback removed, the first case
// reads the doors as failed.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadMyRentals, missingOptionalColumns, RENTAL_COLUMNS, RENTAL_OPTIONAL_COLUMNS } from '../modules/properties/cloud.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

// A PostgREST stand-in: refuses any select naming a column the "database" lacks.
function fakeClient({ has = [], refuse = null } = {}) {
  const asked = [];
  const q = (cols) => ({
    order() { return this; },
    then(resolve) {
      asked.push(cols);
      if (refuse) return resolve({ data: null, error: refuse });
      const missing = RENTAL_OPTIONAL_COLUMNS.find((c) => cols.includes(c) && !has.includes(c));
      if (missing) return resolve({ data: null, error: { message: `column rentals.${missing} does not exist` } });
      return resolve({ data: [{ id: 'r1', slug: 's1' }], error: null });
    },
  });
  return { asked, from: () => ({ select: (cols) => q(cols) }) };
}

describe('the rentals read', () => {
  it('PROVEN TO CATCH: a database without the new column still returns the doors, and says which column it lacked', async () => {
    const c = fakeClient({ has: [] });
    const r = await loadMyRentals(c);
    expect(r.ok, 'the doors were lost to a missing optional column').toBe(true);
    expect(r.rentals).toHaveLength(1);
    expect(r.missingColumns).toEqual(['pictures_shared_with_door']);
    expect(c.asked).toHaveLength(2);
    expect(c.asked[1]).toBe(RENTAL_COLUMNS);
  });
  it('a database with the column is asked once, with it', async () => {
    const c = fakeClient({ has: ['pictures_shared_with_door'] });
    const r = await loadMyRentals(c);
    expect(r.ok).toBe(true);
    expect(r.missingColumns).toEqual([]);
    expect(c.asked).toEqual([`${RENTAL_COLUMNS}, pictures_shared_with_door`]);
  });
  it('any other refusal is still a refusal (RLS, a missing core column, the network)', async () => {
    const r = await loadMyRentals(fakeClient({ refuse: { message: 'permission denied for table rentals' } }));
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('read-failed');
    const core = await loadMyRentals(fakeClient({ refuse: { message: 'column rentals.showcase_order does not exist' } }));
    expect(core.ok, 'a missing CORE column must never be quietly dropped').toBe(false);
  });
  it('only a named optional column is ever dropped', () => {
    expect(missingOptionalColumns({ message: 'column rentals.pictures_shared_with_door does not exist' })).toEqual(['pictures_shared_with_door']);
    expect(missingOptionalColumns({ message: 'column rentals.showcase_order does not exist' })).toEqual([]);
    expect(missingOptionalColumns({ message: 'permission denied' })).toEqual([]);
    expect(missingOptionalColumns(null)).toEqual([]);
  });
  it('the end-to-end chain replays 0309, so the journeys run where production is', () => {
    const sh = readFileSync(join(ROOT, 'scripts', 'e2e', 'build-door-db.sh'), 'utf8');
    expect(sh).toMatch(/0291-borrowing-goes-both-ways\.sql \\\n\s+0309-a-door-shows-its-pictures-to-its-people\.sql \\\n\s+0310-a-work-order-keeps-its-pictures-and-a-name-typed-once-is-offered-after\.sql; do/);
  });
});
