# 2026-06-11 — Opt-in training for melanin-accurate vision

Source: Darrell, 2026-06-11. This is VISION-FAIRNESS-STANDARD Rule 3 extended
from family-only to opt-in community contribution. Real opportunity, real
constraints (he asked for both) — and one coherence fix to a promise shipped
three turns ago. Advisory + capture per GOVERNANCE-EXECUTION-ADVISORY; NOT
built this session (see "why not built").

## What Darrell said

> "allow the users to opt into training our PoeTech App models for melanin
> accurate information from cameras so we can maybe own or use it,
> opportunities and constraints."

## It fits the mission — it's a foundation already written

VISION-FAIRNESS-STANDARD.md exists because commercial vision systems have
documented 10-100x error-rate disparities for melanated faces (Buolamwini +
Gebru 2018, NIST FRVT, ACLU). Rule 3 already sanctions **family-data-first
calibration where the family is willing AND consenting — sovereign
fine-tuning on the NAS, never leaves the family's infrastructure, never
uploaded to vendor model improvements.** Darrell's request opens that, by
explicit opt-in, to users — so the platform's cameras work accurately for the
communities mainstream tech failed (COMMUNITY-FIRST: COLG, the largest
African American community in Champaign-Urbana). Doing this RIGHT — consented,
community-benefiting, sovereign — is itself the differentiator from how big
tech built biased datasets by scraping without consent.

## Opportunities
- A genuine market + mission gap: vision that actually works on darker skin.
- A consented, sovereign, community-contributed calibration set is a real
  asset PoeTech could "own or use" — IF ownership/benefit is governed to
  serve the contributors, not extract from them.
- Rule 3's sovereign-fine-tune path already exists to build on.

## Constraints (Darrell asked for these — they are serious)

1. **ILLINOIS BIPA — the big one.** The Poe family + COLG are in Illinois.
   The Biometric Information Privacy Act is the strictest biometric law in
   the US: collecting/using face geometry (a biometric identifier) requires
   **informed, written consent BEFORE collection**, a **published retention +
   destruction schedule**, and **no sale/profit from biometric identifiers**.
   It carries a **private right of action with statutory damages** ($1,000-
   $5,000 per violation) — the reason class actions have hit Meta, Google,
   Clearview. A casual opt-in toggle does NOT meet BIPA. This needs a real
   BIPA-compliant consent flow (written consent, specific purpose, retention
   policy) and almost certainly legal review before ANY biometric training
   data is collected. This is THE gating constraint.

2. **Coherence with the photo-sovereignty promise (shipped 3 turns ago).**
   The Life Gallery now says "never used to train a model — there is no such
   pipeline here." That is TRUE today (no pipeline exists). The binding rule:
   **the opt-in training pipeline and the "never trained" copy CANNOT both
   ship.** When/if training ships, the copy must change to the honest opt-in
   form: "We never train on your data unless you specifically, in writing,
   choose to contribute to [melanin-accurate vision] — default off, granular,
   revocable, deletion removes your contribution from future training." Do
   NOT ship the training pipeline while the blanket "never trained" copy
   stands — that would make our own promise a lie. (Copy NOT changed now: a
   currently-true promise should not be pre-weakened for a feature that
   doesn't exist yet.)

3. **Minors.** VISION-FAIRNESS Rule 3 already flags minors require explicit
   per-use approval; DATA-AS-EMPOWERMENT mandates minor protections. For
   training contribution, the safe default is **exclude minors' faces
   entirely** — parental consent is legally and ethically insufficient for
   building a biometric training set from children.

4. **Real opt-in, never dark-pattern consent.** Default OFF, per-purpose
   granular (contributing to YOUR sovereign model ≠ contributing to a SHARED
   PoeTech model — separate explicit choices), revocable, and revocation +
   deletion must actually remove the contribution from future training.
   "Consent fatigue" and dark UX are themselves DATA-AS-EMPOWERMENT
   anti-patterns that never ship.

5. **Sovereign training storage.** Training data is the most sensitive data
   on the platform. It lives in sovereign storage (NAS / own instance / GPU
   box), never handed to a third-party ML cloud that becomes a new extraction
   vector. (Rule 3: "never leaves the family's infrastructure.")

6. **Model ownership governance ("maybe own").** If the dataset is
   community-contributed, "PoeTech owns the model" needs a governed answer
   that serves contributors: lean toward community-benefit / shared stewardship
   (the model serves the people who built it), not pure PoeTech IP capture.
   DR-worthy; Darrell governs.

## Why NOT built this session (deliberate)
- Shipping a biometric-consent collection flow casually, under BIPA, would be
  RECKLESS — worse than not building it. It needs BIPA-compliant consent
  language + likely legal review first.
- Changing the currently-true "never trained" promise now would pre-weaken a
  good, shipped promise for a feature that doesn't exist yet.
Both are governance/legal gates, not code gates. Correct move: advise, capture,
let Darrell govern the model-ownership + consent-approach decisions.

## Project (gated, not yet built)
| Step | What | Gate |
|---|---|---|
| 1. Consent architecture | BIPA-compliant written-consent flow: specific purpose, retention/destruction schedule, default-off, granular (own-model vs shared-model), revocable, deletion-effective | legal review; Darrell + Christina co-govern |
| 2. Sovereign fine-tune (own model) | Per-user/family fine-tune on their own infra (Rule 3, already sanctioned) — no aggregation, no BIPA aggregation exposure | extends existing Rule 3 |
| 3. Shared/community model (the "own or use") | Aggregated ONLY from explicit per-study opt-ins; minors excluded; governed ownership serving contributors | DR on ownership + BIPA consent ratified |
| 4. Parity evaluation | Every resulting model meets the 5-point parity bar + 6-month audit (Rules 2 + 5) before any deployment | VISION-FAIRNESS binding |

## Binding note for future sessions
The "never trained" copy and the opt-in training pipeline are mutually
exclusive until the copy is reconciled to the opt-in form. Whoever builds the
training pipeline MUST update the photo-sovereignty copy in the same change.
