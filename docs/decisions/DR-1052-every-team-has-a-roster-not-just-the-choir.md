# DR-1052: Every team has a roster, not just the choir — Media is a team, not a role inside the choir

**Date:** 2026-10-15
**Status:** accepted
**Tier:** B (church-facing access model; the primitive grants nothing today, the surfaces that read it come after)
**Type:** word
**Area:**
- `infra/supabase/migrations-auto/0296-every-team-has-a-roster-not-just-the-choir.sql` (new — `ministry_members`, `user_in_ministry`, RLS)
- `infra/supabase/tests/0296-every-team-smoke.sql` (new — the walls, proven on a real PostgreSQL)
- `.github/workflows/rls-isolation.yml` (new `church-teams` leg, so the smoke is run and not an orphan)

**Grounds:** Darrell, 2026-10-15, from his phone on the Choir tab at The Love Corner, after the Choir surface showed him the "ask the choir director to add you" empty state: **"Media?!!!!!!!!!! Other members of the other teams who should have access... DRs!!!!!!!"**
**Principles:** WORD-FIRST on his own words; DR-0060 (tenancy judgment encoded as a gate); DR-0076 §3 (proven-to-catch), §4 (measure, do not claim), §5 (characterize before you change), §6 (reality-trace); DR-0111 / DR-0236 (the direction is given — build it); DR-0225 (brakes gate activation, never building)

## Context

He sent a screenshot of the Choir tab and then the words above. The screenshot
is the Choir surface telling a signed-in person to ask the director to be added
to the roster. His point is not that one page is wrong. It is that **the church
runs many teams and the app knows how to seat exactly one of them.**

**Reality-trace, in the data, before any code (P15).** `ministry_ops` has named
the teams since 0023, in its own column comment:

```
ministry text NOT NULL DEFAULT 'general'   -- 'bus' | 'choir' | 'ushers'
                                           -- | 'media' | 'general' | ...
```

So the database has listed Media as a ministry for months. What it has never
had is a way for a person to be ON that ministry.

**And the one door that did exist is the wrong shape.** 0011 put media inside
the choir, as a role on the choir's own roster:

```
choir_role text NOT NULL DEFAULT 'member'
  CHECK (choir_role IN ('director','assistant','member','musician',
                        'sound','media','tech'))
```

with the reason recorded honestly at the time — Darrell, 2026-06-14: the
Technology Director, the soundboard engineer and the media team sync with the
choir, so they need the choir surface. **That was right for the choir's media
support and wrong as the only door.** It means a Media volunteer who does not
serve the choir is admitted by being added to a roster they are not on, and the
media team's own work has nowhere to live. A team is not a role inside another
team.

## What was measured

Every number here is a count on the real tree at `5da26a971`, not an estimate.

- **The membership predicates that exist in the entire system**, counted across
  every migration and every file in `app/src/lib`:

  | predicate | uses | what it means |
  |---|---|---|
  | `user_in_instance` | 115 | the whole house — not a team |
  | `user_in_choir` | 46 | the choir |
  | `user_in_security` | 4 | the security team |
  | `user_in_group` | 3 | small groups |

  There is **no `user_in_media`, no `user_in_bus`, no `user_in_ushers`**, and
  no table a member of those teams could be a row in. Not a policy that forgot
  them — no seat to put them in.
- **16 `choir_*` tables** carry the choir's content. The choir is not
  under-served; it is the only one served.
- **The surfaces that exist** are `Choir.jsx`, `BusMinistry.jsx`,
  `ChurchMinistries.jsx` — and Bus Ministry's own header says its access
  "mirrors Choir", so the pattern was already being copied per team rather than
  shared.
- **The empty state he photographed is the code working as written.**
  `getChoirAccess` calls `deriveAccess(role, inChoir)`, and since DR-1037 that
  returns `canSee` for any non-empty instance role. He saw the empty state, so
  the call resolved **no role for him in that instance** — either
  `join_church_instance` returned no tenant or `user_role_in_instance` returned
  null. That is a separate question about his own seat at The Love Corner and
  it is NOT answered here; this record is about the gap his question named.
  **`re-review: 2026-10-22`** — resolve his seat with a live read.

## Impact

**What it buys.** Every team can have members. Media, ushers, bus, kitchen,
youth — whatever the church starts next — gets the primitive the choir has had
since 0011, without minting a table per team.

**What it obligates.** The surfaces come next, each behind its own gate, and
each one is a separate merge from this one. Nothing reads `user_in_ministry`
yet on purpose.

**What it grants today: nothing.** The table ships empty and the predicate is
referenced by no policy anywhere. An empty roster makes no one a member of
anything. No choir object is altered, dropped or re-created; `user_in_choir`
still answers exactly as it did, off `choir_members`.

**The risk this carries, named.** A generic roster is one careless edit away
from being worse than the gap it closes: a predicate that ignored its own
`ministry` column would silently make every team one team. That is why the
smoke's loudest assertions are the walls between teams, in both directions, and
why two of the three mutations below are exactly that mistake.

## Decision

1. **A team is first-class.** `ministry_members (instance_id, ministry,
   user_id, display_name, team_role)` — one row per person per team, with
   `user_id` nullable so a director can build a roster before the people have
   accounts, exactly as the choir does.
2. **`user_in_ministry(instance_uuid, ministry_in)`** carries `user_in_choir`'s
   contract verbatim — SQL, STABLE, SECURITY DEFINER, `search_path` pinned,
   owner/admin **or** a roster row — so a reader who knows one knows the other.
3. **No CHECK list of team names.** The church names its own teams; a CHECK
   here would mean a migration every time they start one. `ministry` is the
   same free text `ministry_ops` already uses, so the two line up without a
   second vocabulary to keep in sync.
4. **Team membership never leaks across teams**, in the predicate and in the
   roster's own RLS.
5. **The choir is not migrated in this merge.** It keeps `choir_members` and
   `user_in_choir`. Folding the choir into the general model is a later,
   separate decision with its own proof.

## Verification

- **Run against a real PostgreSQL 16.15**, not reasoned about: the migration
  applied, then `infra/supabase/tests/0296-every-team-smoke.sql` printed
  **`EVERY TEAM SMOKE: PASS`**. The dependencies were stood up from their own
  verbatim definitions in this repo (`user_in_instance`,
  `user_role_in_instance` out of `schema-v2.1-infra.sql`; `choir_members` and
  `user_in_choir` out of `0011`), so the test is faithful and not a stand-in.
- **Proven to catch, three mutations, each with its own message:**
  1. predicate ignores its `ministry` column → **`TEAMS LEAK: media member
     reads as bus`**
  2. predicate widened to "any church member" (`user_in_instance`) → **`TEAMS
     LEAK: media member reads as bus`**
  3. roster read policy widened to any seated member → **`TEAMS LEAK: media
     read 1 bus roster row(s)`**

  Restored after each: **PASS**.
- **The smoke also pins** that a plain church seat is not a team seat, that a
  stranger is neither, that a member cannot add themselves to a roster, and —
  the regression that would matter most — that **the choir is untouched**: the
  choir member still reads `user_in_choir` true, a media seat grants no choir,
  and `choir_members` is not being read as every team's roster.
- **A guard refused this first and was right.** `rls-isolation-matrix-guard`
  failed with *"ORPHAN SMOKE — 0296-every-team-smoke.sql exists and NO leg runs
  it, so it proves nothing"* until the `church-teams` leg was added. All
  migration guards then green: matrix, smoke-sql-language, replay-order,
  replay-completeness, return-type, constraint-allow-list.
- **One real omission caught by running it:** the first smoke used
  `SET LOCAL request.jwt.claims = (expr)`, which is not valid SQL. Rewritten on
  the `pg_temp` helper pattern 0294 uses.
- **`GRANT EXECUTE ... TO authenticated`** added for the new predicate.
  `user_in_choir` has worked since 0011 with no grant because PostgreSQL grants
  function EXECUTE to PUBLIC by default, but `user_role_in_instance` is granted
  explicitly in `schema-v2.1-infra.sql`, and being explicit about a predicate
  the browser invokes costs nothing and survives anyone revoking PUBLIC.

## What this does not do

- **No surface reads it yet**, deliberately. The Media team still has no page;
  this is the seat, not the room. Each surface is its own merge behind its own
  gate, so the access change and the primitive are never the same deploy.
- **The choir is not folded in.** Its 16 tables and its own predicate stand.
- **Darrell's own seat at The Love Corner is not resolved here** — the empty
  state he photographed means his role resolved null in that instance, which is
  a live-data question this record does not answer. **`re-review: 2026-10-22`.**
- **Who leads each team, and what each team's room contains**, is undecided.
  The roster carries a free-text `team_role` so a director can say it without
  waiting for a schema.
