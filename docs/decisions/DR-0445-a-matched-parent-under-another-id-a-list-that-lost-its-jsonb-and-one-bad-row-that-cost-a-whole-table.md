# DR-0445 — a matched parent under another id, a list that lost its jsonb, and one bad row that cost a whole table

- **status:** accepted
- **date:** 2026-09-16
- **extends:** DR-0443 (the sync arms itself; the row was already there under another id), DR-0442 (the repoint moved the readers, not the writers), DR-0076 (verification doctrine), DR-0236 (nothing buildable waits)

## What the armed run measured, and what it could not

Run 35103193708 on `main@e9be9ac0`, `mode=apply`. Nine of the eleven content
tables reached parity, and the big one closed: **`video_transcripts` 872 rows,
563 copied, 52 updated, `missing_after=0`** under its natural key. `instances`
carried correctly with sovereign-only rows untouched (hosted 24, sovereign 28).
The run also re-proved the writer repoint on the box: `loaders now resolve to:
sovereign http://127.0.0.1:8800`, sovereign REST `HTTP 200`.

Three tables stayed UNMEASURABLE, and reading the actual errors gave **two
distinct causes** rather than one:

| table | the database's own words |
|---|---|
| `entities` | `entities_tenant_id_fkey`, Key `(instance_id)=(3f222e86-…)` — the poe-properties instance |
| `tlc_onboarding_invites` | `tlc_onboarding_invites_instance_id_fkey`, the same shape |
| `tlc_jobs` | `tlc_jobs_requirements_check` |

## Cause 1 — a matched parent held under a different primary key

`instances` matches by its natural key (`slug`), which is what DR-0443 built.
But a natural-key match means the two sides can hold that row under **different
primary keys** — and every child pointing at it carries the *hosted* id. So the
child's `instance_id` referenced an id the sovereign database has never had, and
the FK correctly refused it. The fix DR-0443 made for the *row* had to be made
for the row's *references*.

**Decision: a natural-key match implies an id translation for every row that
points at that parent.** `FK_COLUMNS` is the foreign-key catalogue read from the
live database on 2026-09-16 (child → {column: parent}); `build_remap` produces
`{hosted id: sovereign id}` for exactly the rows the two sides hold under the
same key and a different id; `remap_row` translates on insert and on update.
Three properties keep it honest:

1. **A value with no translation passes through unchanged.** An unknown parent
   then fails its FK, which is correct — it is never silently re-pointed at
   something else.
2. **The map is read by whatever key the parent is actually planned by**, so the
   translation and the plan can never disagree about what identifies a row.
3. **A self-reference is computed BEFORE that table's own insert loop**
   (`entities.parent_entity_id`, `instances.parent_instance_id`,
   `choir_sermons.source_sermon_id`), so it reflects rows that already matched
   and not the ones this run is about to add — whose ids need no translation.

A selftest also asserts every FK child is carried after its parent, so the
`CONTENT_TABLES` order cannot drift out from under the remap.

## Cause 2 — a list that stopped being jsonb crossing the wire

`tlc_jobs_requirements_check` is `jsonb_typeof(requirements) = 'array' AND
jsonb_array_length(requirements) <= 20`, and the single hosted row holds `[]` —
which satisfies it. So the value was **changing on the way across**: pg8000
sends a Python list as a POSTGRES ARRAY literal, so `[]` arrived in a jsonb
column as `{}` — an empty **object** — and the check refused it, correctly.

**Decision: a json/jsonb column is bound as JSON TEXT with an explicit cast, and
which columns those are is READ from the catalogue, never listed by hand.**
`table_columns_typed` reads `data_type`; `json_placeholder` casts to the
column's own type (`::json` or `::jsonb`, not coerced to one); `bind_value`
encodes a dict or list and **passes text through rather than encoding it twice**.
A non-json column is never encoded, so a real `text[]` stays an array. Reading
the type is deliberate: a second hand-kept list of "which columns are json" is
the same shape as the drift that cost this repo months on `crm_capture_lead`.

## Cause 3, which was mine — one bad row cost a whole table's measurement

Worth stating separately because it is the tool's own defect, not the data's.
The first apply run lost **every** number for `video_transcripts` because one
conflicting row raised out of the whole table. A tool whose job is measurement
must not lose the measurement to a single row.

**Decision: a refused row is caught, counted, and named; the rest are carried;
and a refusal is never GO.** The per-table line prints `refused=N` and the first
reason, and `verdict()` returns NO-GO on any refusal — including the case the
key-based re-count cannot see, where a refused UPDATE leaves the row present but
stale by content. Nothing is rounded to zero in either direction (DR-0076).

## Receipts

47 selftests (was 26). Each new group was shown to fail against the defect it
closes, by re-applying the defect:

| mutation | cases that went red |
|---|---|
| `remap_row` stops translating | 2 |
| `bind_value` stops encoding json | 3 |
| the `::jsonb` cast dropped from the placeholder | 3 |

Measured, not asserted: the numbers above are from the run's own per-table
lines, and the next armed run's verdict is the test of this change.

## The live run: two of three closed, and the third exposed one level deeper

Run **35111252952** on `main@8c8651f4`, `mode=apply`, dispatched the minute the
fix merged. Against the advance expectation written above:

| table | before | result |
|---|---|---|
| `tlc_onboarding_invites` | UNMEASURABLE (FK refused) | **copied 5, `missing_after=0`** — the id translation worked |
| `tlc_jobs` | UNMEASURABLE (check refused) | **copied 1, sovereign 1 → 2, `missing_after=0`** — the jsonb binding worked |
| `entities` | UNMEASURABLE (FK refused) | `copied=2` but `sovereign_after` still 6 and **`missing_after=2`** |

Every other table held parity, and the run re-proved the box: `loaders now
resolve to: sovereign http://127.0.0.1:8800`, REST `HTTP 200`. So the FK error
is gone — but `entities` had a second defect underneath it, and the numbers say
exactly which: an insert that raised no error and wrote nothing.

**The cause: a natural key that CONTAINS a foreign key was compared
untranslated.** `entities` is keyed `(instance_id, slug)`. Hosted's key reads
`(hosted_inst | slug)`, sovereign's reads `(sov_inst | slug)` — so they never
match, the row reads as missing for ever, and the insert (whose *row* was
correctly translated) then collided on `entities_tenant_id_slug_key` and was
discarded by `ON CONFLICT DO NOTHING`. **This is the same false-permanent-gap
DR-0443 closed, one level up:** it is not enough to translate the row, the KEY
must be translated too.

**Decision: the plan is computed in the DESTINATION'S key terms.** Key
components are read separately rather than pre-joined, each foreign-key
component is translated through its parent's map, and the plan carries a map
back to the hosted key each row is fetched by — so the fetch and the UPDATE's
WHERE can never drift apart. The parents' maps are therefore computed BEFORE
the plan rather than before the write, which also means a DRY RUN now reports
the real gap instead of a phantom one. One renderer (`join_key`) matches
`concat_ws` exactly, which fixes a latent mismatch on the way: the old update
path joined a NULL component as `''`, and could never have matched the row it
meant.

**And a defect of mine that the run's own numbers exposed: `copied` was a false
number.** It counted rows `ON CONFLICT DO NOTHING` had thrown away — which is
precisely the looks-right-and-is-wrong class this tool exists to prevent, in the
tool itself. The insert now carries `RETURNING 1`, so a real write is
distinguished from a conflict skip and reported as `skipped_existing`. The
verdict was still correctly NO-GO throughout, because `missing_after` never
lied — the guard held while the count did not.

55 selftests (was 47). Re-applying each defect goes red: the key translation
removed → 3 cases; `RETURNING 1` dropped → 1.

## What is still not proven

The second pass has not yet run live either. The advance expectation, again:
`entities` reaches `missing_after=0` with its two rows actually written (or
`skipped_existing=2` if sovereign already holds them under the translated key —
in which case there was never a gap, only a mis-comparison, and the verdict
turns GO). **re-review: 2026-09-23** if the next run is not GO.

The content-parity row in `nas-health` (DR-0443's other open item — the witness
that counts `auth.users` on both sides should count `choir_sermons` too) is
still open and not parked behind a question. **re-review: 2026-09-23.**
