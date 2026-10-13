// =============================================================================
// A REPLAY MUST NOT RE-CREATE A CONSTRAINT A LATER MIGRATION DROPPED (DR-0982)
// =============================================================================
// 0269 creates door_stays with CREATE TABLE IF NOT EXISTS and two INLINE CHECK
// constraints capping a stay's length. 0276 dropped both at Darrell's word
// ("All number of nights accepted!!!!!!!!"). Three chains replay 0269 and none
// of them applied 0276:
//
//   * rls-isolation.yml's poe-properties leg runs against the LIVE database,
//     where the CREATE is a no-op — so the omission was INVISIBLE there, which
//     is why it survived.
//   * ci.yml's door-work leg and scripts/e2e/build-door-db.sh build a FRESH
//     database, so the CREATE runs and both caps come back.
//
// The booking smoke, fixed to assert the rule the owner actually asked for,
// then failed on the fresh-container leg — the product and the leg's database
// disagreeing about a rule that no longer exists.
//
// These tests pin the fix AND the gate that generalizes it, and they pin the
// one defect the gate's own first version had: an ADD-CONSTRAINT regex that
// reported zero adds on files that plainly add one.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  inlineConstraints, addedConstraints, droppedConstraints,
  goneByNewestWord, checkChain, constraintsByFile, e2eChain, check,
} from '../../../scripts/inline-constraint-replay-guard.mjs';
import { isolationLegs, shellLegs } from '../../../scripts/migration-replay-order-guard.mjs';

const ROOT = join(__dirname, '../../..');
const mig = (f) => readFileSync(join(ROOT, 'infra/supabase/migrations-auto', f), 'utf8');
const F269 = '0269-a-short-stay-door-has-a-booking-calendar.sql';
const F276 = '0276-a-guest-may-stay-as-long-as-they-like.sql';
const SMOKE = join(ROOT, 'infra/supabase/tests/0269-booking-calendar-smoke.sql');
const names = (a) => a.map((c) => `${c.table}.${c.name}`);

describe('the two caps, read from the files and not from memory', () => {
  it('0269 declares both length caps INLINE, where a re-created table brings them back', () => {
    const inline = names(inlineConstraints(mig(F269)));
    expect(inline).toContain('door_stays.door_stays_guest_asks_under_30_nights');
    expect(inline).toContain('door_stays.door_stays_at_most_a_year');
  });

  it('0276 drops exactly those two and adds nothing back', () => {
    expect(names(droppedConstraints(mig(F276))).sort()).toEqual([
      'door_stays.door_stays_at_most_a_year',
      'door_stays.door_stays_guest_asks_under_30_nights',
    ]);
    expect(addedConstraints(mig(F276))).toHaveLength(0);
  });

  it('the newest word in the repo says both are gone, and names 0276 as the file that said so', () => {
    const gone = goneByNewestWord();
    for (const k of ['door_stays.door_stays_guest_asks_under_30_nights', 'door_stays.door_stays_at_most_a_year']) {
      expect(gone.has(k)).toBe(true);
      expect(gone.get(k).file).toBe(F276);
    }
  });
});

// ── THE DEFECT THE GATE ITSELF HAD. The first version used one lazy regex,
// `alter table … (.*?) add constraint`, which matched from a DROP statement
// straight into the ADD that followed it; rejecting that match for containing a
// `;` threw away the ADD it had already consumed, and lastIndex had moved past
// it. Measured: 0269 and 0279 both reported ZERO added constraints while both
// plainly add one, which made door_events_subject_check read as permanently
// dropped and inflated the "gone" set from 5 to 14. These tests fail if anyone
// goes back to a single-regex read.
describe('ADD CONSTRAINT is seen even when a DROP of the same name precedes it', () => {
  it('0269 both drops and adds door_events_subject_check', () => {
    const sql = mig(F269);
    expect(names(droppedConstraints(sql))).toContain('door_events.door_events_subject_check');
    expect(names(addedConstraints(sql))).toContain('door_events.door_events_subject_check');
  });

  it('0279 both drops and adds it too — the allow-list pattern', () => {
    const sql = mig('0279-an-allow-list-is-added-to-never-rewritten.sql');
    expect(names(droppedConstraints(sql))).toContain('door_events.door_events_subject_check');
    expect(names(addedConstraints(sql))).toContain('door_events.door_events_subject_check');
  });

  it('a drop-then-add in one file therefore does NOT read as gone', () => {
    expect(goneByNewestWord().has('door_events.door_events_subject_check')).toBe(false);
  });

  it('reads the pair back to back, the exact shape that defeated the regex', () => {
    const sql = `
      ALTER TABLE public.t DROP CONSTRAINT IF EXISTS c_one;
      ALTER TABLE public.t ADD  CONSTRAINT c_one CHECK (x IN ('a', 'b'));
    `;
    expect(names(addedConstraints(sql))).toEqual(['t.c_one']);
    expect(names(droppedConstraints(sql))).toEqual(['t.c_one']);
  });

  it('prose quoting a constraint is not read as code', () => {
    const sql = '-- ALTER TABLE public.t DROP CONSTRAINT c_two;\nSELECT 1;';
    expect(droppedConstraints(sql)).toHaveLength(0);
  });

  it('a CONSTRAINT written after the CREATE TABLE block is not counted as inline', () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS public.t (
        id uuid PRIMARY KEY,
        CONSTRAINT c_inline CHECK (id IS NOT NULL)
      );
      ALTER TABLE public.t ADD CONSTRAINT c_later CHECK (true);
    `;
    expect(names(inlineConstraints(sql))).toEqual(['t.c_inline']);
    expect(names(addedConstraints(sql))).toEqual(['t.c_later']);
  });
});

describe('every chain that replays 0269 also applies 0276', () => {
  it('the rls-isolation poe-properties leg lists 0276 after 0269', () => {
    const leg = isolationLegs().find((l) => l.feature === 'poe-properties');
    expect(leg).toBeTruthy();
    expect(leg.migrations).toContain(F276);
    expect(leg.migrations.indexOf(F276)).toBeGreaterThan(leg.migrations.indexOf(F269));
  });

  it("ci.yml's door-work leg applies 0276 after 0269 and before the smokes", () => {
    const leg = shellLegs().find((l) => l.job === 'door-work');
    expect(leg).toBeTruthy();
    const files = leg.steps.filter((s) => s.kind === 'apply').map((s) => s.file);
    expect(files).toContain(F276);
    expect(files.lastIndexOf(F276)).toBeGreaterThan(files.indexOf(F269));
    const ci = readFileSync(join(ROOT, '.github/workflows/ci.yml'), 'utf8');
    expect(ci.indexOf(F276)).toBeLessThan(ci.indexOf('tests/0269-booking-calendar-smoke.sql'));
  });

  it('the e2e door-database builder applies 0276, and its loop still expands to every file', () => {
    const chain = e2eChain();
    expect(chain).toContain(F276);
    expect(chain.indexOf(F276)).toBeGreaterThan(chain.indexOf(F269));
    // A `#` comment placed BETWEEN backslash-continued words would comment out
    // the rest of the logical line and silently drop every file after it along
    // with the `; do`. These three are the ones that would vanish.
    for (const f of [F276, '0278-a-bed-is-not-a-bedroom.sql', '0280-the-address-shows-unless-the-family-holds-it.sql']) {
      expect(chain).toContain(f);
    }
  });

  it('the guard passes across every chain in the repository', () => {
    expect(check()).toEqual([]);
  });

  // PROVEN TO CATCH (DR-0076 §3). A gate that cannot fail is not a gate.
  it('FAILS each of the three chains the moment 0276 is taken back out', () => {
    const byFile = constraintsByFile();
    const gone = goneByNewestWord(byFile);
    const without = (a) => a.filter((f) => f !== F276);
    const chains = [
      ['rls-isolation', without(isolationLegs().find((l) => l.feature === 'poe-properties').migrations)],
      ['ci.yml', without(shellLegs().find((l) => l.job === 'door-work').steps.filter((s) => s.kind === 'apply').map((s) => s.file))],
      ['e2e', without(e2eChain())],
    ];
    for (const [label, files] of chains) {
      const problems = checkChain(files, label, byFile, gone);
      expect(problems).toHaveLength(2);
      expect(problems.join('\n')).toContain('door_stays_guest_asks_under_30_nights');
      expect(problems.join('\n')).toContain('door_stays_at_most_a_year');
      expect(problems.join('\n')).toContain(F276);
    }
  });
});

describe('the booking smoke asks for the rule he asked for, without breaking its own arithmetic', () => {
  const smoke = () => readFileSync(SMOKE, 'utf8');

  it('asserts both constraint names are ABSENT from the catalog, scoped to door_stays', () => {
    const s = smoke();
    for (const name of ['door_stays_guest_asks_under_30_nights', 'door_stays_at_most_a_year']) {
      expect(s).toContain(`AND conname = '${name}'`);
    }
    expect(s).toContain("conrelid = 'public.door_stays'::regclass");
  });

  it('no longer expects a guest\'s long ask to be refused', () => {
    expect(smoke()).not.toMatch(/thirty nights on their own', false/);
  });

  // THE THREE WAYS THE FIRST FIX BROKE THIS FILE. Each is pinned by position,
  // because every one of them was an ORDERING mistake: a row added too early.
  it('adds no row before the count of six, so the family still sees exactly six', () => {
    const s = smoke();
    const count = s.indexOf('::int <> 6 THEN');
    expect(count).toBeGreaterThan(0);
    // The one long behavioural ask sits after the count, after the fourth-ask
    // case, and after the clock assertions.
    const longAsk = s.indexOf('four hundred nights');
    expect(longAsk).toBeGreaterThan(count);
    expect(longAsk).toBeGreaterThan(s.indexOf('a fourth open ask from the same contact'));
    expect(longAsk).toBeGreaterThan(s.indexOf('is not on the clock in order'));
    // lastIndexOf: the header comment names the PASS string too.
    expect(longAsk).toBeLessThan(s.lastIndexOf("RAISE NOTICE 'BOOKING CALENDAR SMOKE: PASS'"));
  });

  it('spends no open-ask budget: the long ask uses a contact nothing else uses', () => {
    const s = smoke();
    const phone = '217-555-0177';
    expect(s.split(phone).length - 1).toBeGreaterThanOrEqual(2);   // the ask and its assertion
    expect(s.indexOf(phone)).toBeGreaterThan(s.indexOf('a fourth open ask from the same contact'));
  });

  it('starts the long ask past every other window, so no check_in lookup can find it', () => {
    const s = smoke();
    expect(s).toContain('doorA, d0 + 600, d0 + 1000');
    const windows = [...s.matchAll(/d0 \+ (\d+), d0 \+ (\d+)/g)].map((m) => Number(m[2]));
    expect(Math.max(...windows)).toBe(1000);                        // nothing reaches past it
    expect(windows.filter((w) => w === 1000)).toHaveLength(1);       // and it is the only one
  });

  it('proves four hundred nights — past the old 29 AND past the old 365', () => {
    const s = smoke();
    expect(s).toMatch(/check_out - check_in FROM door_stays WHERE rental_id = doorA::uuid AND guest_phone = '217-555-0177'\) <> 400/);
    expect(600 + 400).toBe(1000);
  });

  it('carries his own words, so the next reader finds the instruction beside the assertion', () => {
    const s = smoke();
    expect(s).toContain('All number of nights accepted!!!!!!!!');
    expect(s).toContain('0276');
  });
});
