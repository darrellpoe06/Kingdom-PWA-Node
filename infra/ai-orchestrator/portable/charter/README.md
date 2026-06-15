# Charter — the orchestrator's policy as mounted config

The orchestrator reads its policy from this directory at runtime (mounted
read-only at `/charter`). **The policy is data, not code.** You change what the
orchestrator is allowed to do by editing `charter.yml` — no rebuild, no code
edit, no image change.

## `charter.yml` is a SKELETON

`charter.yml` here is a **placeholder** so the bundle is complete and runnable
out of the box. It ships in the safest posture possible:

- `autonomy.default: disarmed`
- `autonomy.self_drive_implemented: false` ← the hard gate the supervisor honors
- `brakes.kill_switch.engaged_by_default: true`
- budgets set to `0.00` (an unset budget is treated as a *missing brake* → inert)

The **canonical Charter** — the real ask-vs-act rules and standing rules — is
approved by Darrell separately. Until that lands, this skeleton governs.

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
