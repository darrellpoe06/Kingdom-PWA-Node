// A man was a stranger to his own consent record.
//
// Darrell, 2026-09-22, on the Voice tab with a sample already saved on the
// device and the studio answering:
//
//   "I also couldn't record and hear my voice... it didn't work..."
//   new row violates row-level security policy (USING expression)
//                                            for table "voice_profiles"
//
// THE ERROR NAMED ITS OWN CAUSE, and the phrase that does it is "(USING
// expression)" on what the app calls an insert. `enrollMyVoice` UPSERTS on
// (instance_id, person_key). When a row already exists for that person Postgres
// takes the UPDATE path, and the UPDATE path evaluates `voice_profiles_update`'s
// USING clause — which read `created_by = auth.uid()`.
//
// The single row in that table (measured: ever_inserted = 1, stats never reset)
// was created by ONE of his doors. Signed in on the OTHER door the same man is a
// different uuid, so his own row refused him, and every re-record hit the same
// wall. That is why the table has exactly one row and no second enrolment ever
// landed: not indifference, a lock.
//
// THE FIX IS THIS HOUSE'S OWN, ALREADY BUILT. Migration 0141 (DR-0311) created
// `same_person(uuid)` for precisely this class and substituted it into
// study_entries, study_spaces, eternal_algorithms and tv_watch so one library
// serves both doors. voice_profiles was never included. 0224 includes it.
//
// AND THE BRIGHT LINE DOES NOT MOVE. person_links joins a person's OWN two
// doors and nothing else, so `same_person(created_by)` still means "this is my
// row". Nobody gains the ability to create, move or revoke consent on another
// human being's voice. These cases hold that distinction in place, because a
// future edit that widened it would be the one edit in this file that matters.

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '../../..');
const M0224 = resolve(ROOT, 'infra/supabase/migrations-auto/0224-one-person-two-doors-may-enrol-one-voice.sql');
const M0141 = resolve(ROOT, 'infra/supabase/migrations-auto/0141-account-unification-person-links.sql');
const M0047 = resolve(ROOT, 'infra/supabase/migrations-auto/0047-voice-profiles.sql');
const sql = () => readFileSync(M0224, 'utf8');

describe('the migration exists and stands on the ones it needs', () => {
  it('0224 is in the repo', () => {
    expect(existsSync(M0224)).toBe(true);
  });

  it('the two migrations it depends on are really there', () => {
    // A migration that names a dependency it cannot point at is a migration
    // that fails at 3am on a fresh database.
    expect(existsSync(M0141)).toBe(true);
    expect(existsSync(M0047)).toBe(true);
  });

  it('same_person actually comes from 0141, rather than being assumed', () => {
    expect(readFileSync(M0141, 'utf8')).toMatch(/CREATE OR REPLACE FUNCTION public\.same_person\(other uuid\)/);
  });

  it('it refuses to run rather than half-apply when a dependency is absent', () => {
    const s = sql();
    expect(s).toMatch(/RAISE EXCEPTION '0224 requires public\.same_person/);
    expect(s).toMatch(/RAISE EXCEPTION '0224 requires voice_profiles/);
  });
});

describe('the three policies that refused him now recognise both of his doors', () => {
  it('UPDATE — the one the upsert actually hit — tests same_person on BOTH halves', () => {
    const s = sql();
    const block = s.slice(s.indexOf('CREATE POLICY voice_profiles_update'), s.indexOf('CREATE POLICY voice_profiles_update') + 320);
    expect(block).toMatch(/USING\s+\(same_person\(created_by\)\)/);
    expect(block).toMatch(/WITH CHECK \(same_person\(created_by\)\)/);
  });

  it('REPRODUCES THE DEFECT: the old rule was a raw uuid equality', () => {
    // 0047's own text, which is what refused him. Kept as the thing this
    // migration replaces, so the diff is legible years from now.
    const old = readFileSync(M0047, 'utf8');
    expect(old).toMatch(/USING\s+\(created_by = auth\.uid\(\)\)/);
    // And it is gone from the new POLICY BODY. Scoped to the statements rather
    // than the whole file on purpose: the migration's own header QUOTES the old
    // rule so the diff stays legible, and a first pass had this assertion fail
    // on that explanation — a gate catching the prose that describes it, which
    // is the third time today a pin has been written too wide.
    const s = sql();
    const policies = s.slice(s.indexOf('DROP POLICY IF EXISTS voice_profiles_insert'));
    expect(policies).not.toMatch(/USING\s+\(created_by = auth\.uid\(\)\)/);
  });

  it('INSERT keeps 0047s instance-membership test verbatim', () => {
    // Widening WHO is me must not quietly widen WHERE I may enrol.
    expect(sql()).toMatch(/user_role_in_instance\(instance_id\) IN \('owner','admin','member'\)/);
  });

  it('DELETE keeps the governor clause 0047 wrote', () => {
    expect(sql()).toMatch(/same_person\(created_by\) OR user_role_in_instance\(instance_id\) = 'owner'/);
  });

  it('SELECT is deliberately untouched', () => {
    // Reading who is enrolled was never the problem, and a migration that
    // widens more than it was asked to is how a fix becomes an incident.
    expect(sql()).not.toMatch(/CREATE POLICY voice_profiles_read/);
    expect(sql()).toMatch(/SELECT is unchanged \(0047\)/);
  });
});

describe('the self-consent bright line does not move', () => {
  it('no policy here tests membership ALONE for a write', () => {
    // The failure mode to fear is someone "fixing" this by dropping the person
    // test and leaving only instance membership — which would let any member
    // enrol or revoke anybody's voice.
    const s = sql();
    for (const m of ['voice_profiles_insert', 'voice_profiles_update', 'voice_profiles_delete']) {
      const block = s.slice(s.indexOf(`CREATE POLICY ${m}`), s.indexOf(`CREATE POLICY ${m}`) + 340);
      expect(block, m).toMatch(/same_person\(created_by\)/);
    }
  });

  it('the widening is to a person OWN other door, and the file says why that is not a widening', () => {
    expect(sql()).toMatch(/person_links joins a PERSON'S OWN two doors and nothing else/);
  });

  it('the restrictive overlays are named as untouched, because they are the other half of what enforces', () => {
    const s = sql();
    expect(s).toMatch(/assistant_scope_\* and viewer_readonly_\*/);
    expect(s).toMatch(/RESTRICTIVE/);
  });

  it('it reloads PostgREST, or the app keeps talking to the old schema cache', () => {
    expect(sql()).toMatch(/NOTIFY pgrst, 'reload schema'/);
  });
});
