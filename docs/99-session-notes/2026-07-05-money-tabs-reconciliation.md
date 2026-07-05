# 2026-07-05 — Money tabs reconciliation: the "+$1k over $0 entities" fix + the Tx white screen

**Reported by Darrell (screenshots from the fold, poetech.us, signed in, BUILD A7CB994):**
"Money tabs need reviewed, under money we get net cash and these numbers don't seem to
match the other tabs and Tx made the screen white."

## What the screenshots proved

- Big Picture → Money: **NET CASH FLOW +$1k** · all four entity cards (Personal, Poe
  Properties, PoeTech, TLC Therapy Solutions) **$0 inflow**.
- Header badge: **SAMPLE · FAMILY OF 4** — the Reeves demo's `meta.releaseLabel` —
  sitting above HIS entities. Two worlds mixed on one screen.
- The arithmetic identified the polluting dataset exactly: the Family-of-4 demo's money
  spine is salaries 3,200 + 1,400 = 4,600/mo against outflows 1,800 + 1,500 + 200 =
  3,500/mo → net **+1,100** → `fmtCompact` renders **"+$1k"**. Those salaries are tagged
  to the demo-only `e-family`, which none of his entities match → every card $0.

## Root cause (verified in code, file:line at time of fix)

1. **Merge-over-demo:** on a public host the boot mounts `DEMO_DATA_FAMILY_OF_4` for
   anonymous safety (`poe-financial-mvp-v28.jsx`, boot effect). The signed-in hydration
   then merged the owner's saved snapshot **over the mounted demo**
   (`loadSavedSnapshot` → `setData(d => ({...d, ...parsed.data}))`) — every key the
   snapshot lacked kept the demo's value. `inflows`/`outflows`/`meta` are not
   table-synced, so demo money rode in, was counted in the all-entities total, was
   invisible on every per-entity card, and was then **persisted back** as owner data by
   the save effect.
2. **Half-fixed sibling:** `stripSeedScaffolding` filtered `inflows.rentals` but not
   `inflows.salaries`.
3. **Tx white screen:** matches the documented deploy-skew signature (2026-06-30
   chunk-heal root-cause) — a stale shell requests a replaced lazy-chunk hash, the heal
   silently `location.reload()`s, and the in-between state is a bare blank page.

## What shipped

| Fix | Where | Proof |
|---|---|---|
| Merge over the OWNER'S baseline (family SEED / EMPTY_WORLD), never the mounted demo | `lib/snapshot-hydration.js` (extracted merge) + `loadSavedSnapshot(base)` + the signed-in hydration call | `snapshot-hydration.test.js` reproduces the incident against the old base, asserts the fix |
| Demo-residue scrub on load: provenance-marked rows dropped from every list (both inflow lists); a demo `releaseLabel` resets meta/outflows to the baseline — heals already-polluted snapshots | `lib/snapshot-hydration.js` `scrubDemoResidue`, wired in `loadSavedSnapshot` | same test file |
| `stripSeedScaffolding` filters `inflows.salaries` like rentals | shell | `snapshot-hydration.test.js` |
| New ledger-integrity check `entity-linkage`: any money row tagged to a nonexistent entity → named REVIEW with receipts | `lib/ledger-integrity.js`, surfaces on Books → Tx → Proof of the math | `ledger-integrity.test.js` |
| Money-tab reconciliation note: names the orphaned $/mo and the fix path whenever the total and the entity cards can disagree | `components/BigPictureDashboard.jsx` | `big-picture-render.test.jsx` |
| Chunk-heal paints a visible "getting the latest version" notice before its reload — the skew recovery is never a bare white screen | `lib/chunk-reload-heal.js` `paintHealNotice` | `chunk-reload-heal.test.js` (paint-before-reload order) |

Monolith re-froze DOWNWARD 5907 → 5885 (−22; the merge extraction). LESSONS-LEARNED
entry added (P24: a defensive merge inherits its BASE). Verified end-to-end in the
running app: the incident-shaped snapshot renders the reconciliation note + the
entity-linkage REVIEW; a demo-polluted snapshot loads scrubbed (no Reeves label, no
+$1k residue). Full gates: eslint 0 warnings, vitest green, module-boundary,
monolith-budget, interconnect, surface-audit, vite build.

## What Darrell sees after this deploys

On next load of poetech.us his device's polluted snapshot self-heals: the Reeves money
spine is scrubbed, the money numbers derive from one world, and if ANY row still points
at a missing entity the Money tab says so in one orange sentence with the fix path —
the tabs can no longer silently disagree. If a deploy lands between his taps again, the
Tx tap shows "a newer version just shipped — getting it now" instead of a blank screen.
