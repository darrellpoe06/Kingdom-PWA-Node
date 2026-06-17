# Leverage evaluation: extract a conference-critical monolith slice NOW?

**Date:** 2026-06-17 · **Asked by:** Darrell · **Decision owner:** Darrell
**Verdict: NO — do not extract mid-sweep. Keep decomposition sequenced after the conference.**

This is the first real application of the conflict-evaluation loop's output ("decompose the
monolith") run through the leverage-prioritizer Darrell specified:

```
net leverage = [ impact on the CURRENT #1 GOAL  ×  ease (low-effort) ]  −  disruption
```

Current #1 goal = **land the July conference**. The question: would extracting just the
conference-critical surfaces into modules let conference PRs land in parallel and SPEED the
conference, net of the disruption of doing it mid-sweep?

## The premise check (reality-trace first)

The thing the slice would "extract" mostly **does not exist in the monolith** — it was already
built as modules:

| Conference surface | Lives in |
|---|---|
| `ConferenceModule` (front door) | `app/src/components/ConferenceModule.jsx` |
| `EventCenterModule` (multi-attendee/rooms) | `app/src/components/EventCenterModule.jsx` |
| Registration (open, no-login) | `ConferenceRegister.jsx` + `ConferenceRegisterForm.jsx` |
| Setup checklist | `ConferenceSetupChecklist.jsx` |
| Anticipated-vs-Actual / check-in | (its own module + migration 0031) |

What the monolith actually holds for conference is **mount-wiring only**, ~6 small sites:
2 imports (L71–72), 2 renders (L4878–79), a tab array (L4650), a nav-manifest row (L5585),
a `updateConference` state setter (L3575), and a Church-wrapper passthrough. There is **no
larger conference slice to peel** — the surfaces are already modules. The only thing left to
extract is the *shared* mount-wiring, which is the full `surface-mount registry` decomposition,
**not** a conference-specific slice.

## The leverage math

Scale 1–5. `ease` is high when effort is low.

| Factor | Score | Why (real evidence) |
|---|---|---|
| **Impact on conference** | **1** (low) | Conference surfaces are already modular; most conference PRs are **already merged** (#188/#190/#192/#214/#218/#221/#223). Remaining path is **single-owner** (the cloud session's signup-funnel branch) + the **serving/DNS cutover** — neither is unblocked by making the monolith parallel-safe. Single-owner serial work gets no benefit from parallel-safe extraction. |
| **Ease (low-effort)** | **1** (very hard) | The slice = rewriting the import block + render section + tab array of a **9,476-line** file — its single most-contended region. |
| **Disruption** | **5** (high) | The cloud session is *actively editing this same file* for conference right now (branches cycling: variance → signup-funnel). A registry rewrite mid-sweep collides with the very conference edits it claims to help — it would CAUSE the monolith collision, under live conference work. |

```
net leverage (now)  =  (impact 1  ×  ease 1)  −  disruption 5  =  1 − 5  =  −4   →  STRONGLY NEGATIVE
```

Counterfactual — the same extraction **after** the conference, queue drained:

```
net leverage (after) =  (impact 3  ×  ease 2)  −  disruption 1  =  6 − 1  =  +5   →  POSITIVE
```

Same fix, opposite sign — the only variable that flipped is **timing**. Mid-sweep it fights the
goal; post-sweep it serves it.

## Why the protection conference needs is ALREADY in place

The forward-looking guard — **new-surface = new-module** — is already preventing *fresh*
conference contention without any extraction: the recent conference adds that followed it
(#214 open registration, #218 setup checklist) touched the monolith **not at all** (`mono=false`).
The collisions the loop recorded were on surfaces that pre-dated the rule. So conference does not
need the disruptive cleanup to keep landing cleanly — it needs the rule it already has.

## Recommendation (paste-ready)

> **Do NOT extract the monolith mount-registry before the conference ships.** Net leverage is
> −4 (high disruption to the file the conference is actively editing, ~zero acceleration of the
> conference critical path, which is serving/DNS + a single-owner funnel, not monolith
> parallelism). Keep the `surface-mount registry` decomposition sequenced **after** the in-flight
> queue drains (consistent with the standing new-surface=new-module rule). Re-evaluate the day
> after the conference ships, when net leverage flips to +5.
>
> Meanwhile, keep doing the one thing that already works: **every new surface as its own module**
> (the loop's pre-spawn `--check` enforces it), so no new monolith collisions accrue.

**Trigger to revisit:** day after the conference ships → run
`node scripts/orchestration/conflict-analytics.mjs` (monolith will still be #1 hot file) and
promote the registry extraction then.
