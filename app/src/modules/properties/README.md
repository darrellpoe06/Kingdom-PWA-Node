# properties — the Poe Properties module

The property-management workflows as **one module, mounted by two apps**.

- **PoeTech App** → `?view=properties` (the family manages from the app they already use).
- **Poe Properties App** → `/properties/app/` (its own installable icon, for tenants, their families, and 1099 workers).

Both mount the same `PropertiesApp`, read the same Supabase rows through the same RLS, and hold no
local copy of anything — so "keeping both with latest synced data" is structural, not a sync job that
can fall behind.

## Layout

| File | What |
| --- | --- |
| `model.js` | Pure engine: roles, the capability ceiling (mirrors migration 0075), face resolution, the merged history, job documentation, the rent→books mapper. No I/O. |
| `config.js` | The door identity + the launch plan + opportunities and constraints. `validateLaunchPlan()` fails a phase that claims "built" with no evidence or defers with no re-review date. |
| `cloud.js` | RLS-scoped I/O. **No instance filter** — the database scopes every read, which is what lets a non-member (a tenant, a family member, a 1099 worker) use the app at all. |
| `PropertiesApp.jsx` | The role-resolved workspace both doors render. |
| `readiness.js` | Pure engine for the guest-ready checklist: the 181-item template, the merge of template + real rows, the tallies and the row/patch builders. No I/O. |
| `ReadinessTab.jsx` | The checklist surface — dashboard, per-area progress, the three views, add/edit/delete, reset. |

## Who sees what

| | Tenant | Household member | 1099 worker | Manager | Landlord |
| --- | --- | --- | --- | --- | --- |
| Their door | ✔ | ✔ | job only | granted doors | all |
| Work orders | file + watch | file + watch | assigned, document | manage, assign | all |
| Thread | ✔ | ✔ | when the landlord enables the job | with `message.tenant` | ✔ |
| Notes (the relationship record) | write + read | write + read | write + read | all notes | all notes |
| Payment history | read | read | ✘ | with `rentroll.view` | ✔ |
| Report / confirm rent | report | ✘ | ✘ | with `rent.confirm` | ✔ |
| Post to the books | ✘ | ✘ | ✘ | ✘ | ✔ |

The database enforces every row of that table (migrations 0075 + 0150); this module decides what the
UI *offers*, and `properties-model.test.js` fails if the two ever disagree.

## Guest ready — the readiness checklist

Turning a unit into a listing is its own body of work, so it lives on the door: **Guest ready** in the
manager/landlord face. Nine areas, 181 tasks plus 16 per bedroom, each with a status, an optional cost
and a note; the header rolls up completion and what the remaining work still costs.

Two things about it are worth knowing before changing it:

- **Nothing is seeded.** The task list is a TEMPLATE in `readiness.js`; a `board_tasks` row (0059 — the
  same table, RLS and realtime sync the Project Boards ride) is written the moment a task is actually
  touched. An untouched door holds zero rows and still reads correctly, because Not Started is exactly
  what an untouched task is. The cost rides `links.readiness.cost`, which is why this needed no migration.
- **Bedrooms are not invented.** The bedroom groups are the door's real `property_rooms` rows
  (`kind === 'bedroom'`), named as the landlord named them. A door with no bedrooms recorded says so and
  sends him to the Rooms tab — it never paints a "Bedroom 1" nobody entered.

One board per door (`board_slug = airbnb-ready:<rental id>`), kept out of the Projects hub's program-board
list by `isProgramBoard()` in `lib/board.js`.

## Honest status (DR-0076)

Built and gated in CI: the module, both doors, the invite→claim seam, the tenant's-family arms, the
field-worker ceiling, the books-posting guard, and the isolation smoke that proves all of it against
the real database (`infra/supabase/tests/0150-poe-properties-isolation-smoke.sql`, run by the
`rls-isolation` workflow's `poe-properties` leg).

Not yet real: **there are no tenancies**. The 12 rental doors are live; `rental_tenancies` is empty
(measured 2026-08-26). Nobody can be invited to a door that has no tenancy row, so the first step
that is not the agent's is the landlord entering the real tenant records.
