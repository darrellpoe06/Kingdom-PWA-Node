# DR-1541: The open-source chest is filled from PoeTech+ income, so the giving starts by itself

**Date:** 2026-11-18
**Status:** Accepted
**Tier:** B (a giving rule with no money moving today; no code, no schema)
**Type:** decision
**Area:** the packages the app ships; PoeTech+ income
**Pairs with:** DR-1501 (sov87, which found the gap and set it before Darrell), DR-1360 (nothing waits on a hand)

## Context

DR-1501 decision 3 found that nothing in the repository records support given to any of the 161 installed packages that ask for it, and set a recommendation before Darrell: a small yearly chest for the five single-keeper packages we ship. On 2026-11-18 he handed it back as the agent's decision, inside his word that day: fix it so we don't need anything.

## What was measured

- From DR-1501, read 2026-11-13: `app/package.json` names 11 dependencies; 578 packages installed, 161 carrying a `funding` field. Five of the 11 list one maintainer on the registry: libheif-js, libsodium-wrappers, phonemizer, qrcode.react, xlsx.
- PoeTech+ checkout exists (per-person subscription, webhook-written); its enforcement is off, so today it brings in no income to share.

## Impact

No money moves today, and none waits on anyone's hand. The day PoeTech+ brings in income, the chest has a size and a list without a new decision.

## Decision

1. **The source is PoeTech+ income, never the household's.** One percent of each year's PoeTech+ subscription receipts is set aside as the open-source chest. A small, fixed share, sized to what the work actually earns: the laborer is worthy of his reward (1 Timothy 5:18), and a gift from income does not borrow against the family.
2. **The list is the single-keeper packages we ship,** read fresh from the registry each January (five today, named above), split evenly, each paid through that project's own funding link.
3. **Until there is income, the chest is $0, and that is the whole action.** Nothing is promised, nothing is pledged, and no card is asked for.
4. **The first payout is a person's act with a card,** made only when the chest is above zero. It is recorded beside this decision when it happens.
5. **In kind meanwhile:** every package keeps its license and attribution in the build as today, and a bug we find in one of them is reported upstream, not only worked around.

## Verification

- A rule, not code: no test is added. What can be checked is checked by the existing gates. `dependency-audit-guard` keeps the shipped list measured; the five names come from DR-1501's own pinned test.
- `re-review: 2027-01-05`: read the year's PoeTech+ receipts, size the chest, refresh the single-keeper list from the registry, and record the payout or the $0.
