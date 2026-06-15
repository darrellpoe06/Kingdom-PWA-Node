# Charter — the orchestrator's policy as mounted config

The orchestrator reads its policy from this directory at runtime (mounted
read-only at `/charter`). **The policy is data, not code.** You change what the
orchestrator is allowed to do by editing the Charter — no rebuild, no code edit,
no image change.

## `CHARTER.md` is the source; `charter.yml` is GENERATED

- **`CHARTER.md`** is the single, human-approved **source of truth** — the
  canonical policy (prime directive, ask-vs-act, the eighteen standing rules,
  sovereignty, the three brakes, resource caps). Read and edit policy here.
- **`charter.yml`** is the machine config the orchestrator reads. It is
  **generated from `CHARTER.md`** — do not hand-edit it.

Change policy in `CHARTER.md`, then regenerate:

```
npm run charter:gen      # from app/, or: node scripts/generate-charter.mjs
```

The portable-bundle freshness gate (`app/src/__tests__/portable-bundle-fresh.test.js`)
**fails the build** if `charter.yml` ever drifts from `CHARTER.md` — the source
and the config can never silently disagree (DR-0075 / DR-0076).

## Safest posture, carried through generation

The generated `charter.yml` ships inert:

- `autonomy.default: disarmed`
- `autonomy.self_drive_implemented: false` ← the hard gate the supervisor honors
- `brakes.kill_switch: true` (and `state/KILL_SWITCH` ships present)
- budget ceilings are marked `# DEFAULT — pending Darrell confirmation`

Generation never flips `self_drive_implemented` true (a freshness-gate test
asserts this), so regenerating the config can never arm autonomy.

## What the supervisor actually enforces from this file today

One value: `autonomy.self_drive_implemented`. The skeleton ships it `false`, and
the supervisor treats it as a gate **above** the ARM flag — so even a stray
`state/ARMED` file can never trip autonomy that does not exist. Everything else
in `charter.yml` (the ask/act/forbidden lists, the standing rules) is the policy
contract the live Cage will enforce when autonomy is armed; in the skeleton it is
documentation of intent.

## Editing the Charter

1. Edit `charter.yml`.
2. Restart the container so the new policy is read: `docker compose restart`.

The Charter never holds secrets — those live in `.env`. Keep it readable; it is
meant to be reviewed by a human (Religion **and** Relationship: backbone and
warmth both visible).
