# DR-0560 — Anyone signed in may enrol their own voice, and the app shows its own dependency chain

- **Status:** accepted
- **Tier:** B
- **Type:** product
- **Date:** 2026-09-22
- **Scope:** `app/src/lib/voice-sync.js` (`personKeyFor`, `displayNameFor`); `app/src/components/VoiceStudio.jsx` (the gate, the enrolment key, the honest save message, the new "Does it work?" tab); `app/src/poe-financial-mvp-v28.jsx` (persona is a name, reviewer mode is its own prop); `app/src/lib/voice-system-check.js` (new); `app/src/__tests__/anyone-signed-in-can-enroll-a-voice.test.js` (new)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 — measured, and unknown never reads as fine), REALITY-TRACE (DR-0061), THE-APP-IS-THE-PRIMARY-ARTIFACT (DR-0065), DRIVE-DONT-DELEGATE, DECISION-RECORDS (DR-0011)
- **Grounds:** Darrell 2026-09-22 ("fix the recorder so anyone signed in can enroll"; "I want to be able to review it myself within the PoeTech App build"); migration 0047; the `sovereign-read` probes run the same day

---

## The measurement that started it

`sovereign-read` against the sovereign database, 2026-09-22:

```
voice_profiles   RLS on · 11 policies · rows 1 · ever_inserted 1 · ever_deleted 0
stats_reset      never
```

**One enrolment row had ever existed**, in the whole life of that database.

## The trace, end to end

```
shell    personaKey = authSession && !reviewerMode ? personaOf(email) : null
           personaOf -> FAMILY_EMAIL_PROFILES: five emails -> darrell | christina | family
studio   showRecorder = !!(personaKey && PERSONA_NAME[personaKey])
           PERSONA_NAME = { darrell, christina, bishop-gwin }
```

The Record section rendered for **two** reachable people. Not hidden behind the nav overflow — **not rendered**. `bishop-gwin` sits in the name map with no email mapping to it, so the Bishop could never reach it; `family` maps from an email and is absent from the name map, so Darrell Jr saw nothing. And `reviewerMode` nulled the persona, so the recorder vanished for Darrell himself whenever he was reviewing a production push — which is very likely why *he* could not find it.

**The wall was in the wrong layer.** A read of all eleven live policies (same probe, extended in DR-0562) shows `voice_profiles_insert` enforces `created_by = auth.uid()` AND instance membership — any member may enrol, only for themselves. The database had the doctrine right the whole time. The app was stricter than the rule it was enforcing.

## What shipped

**The gate is being signed in.** A named persona keeps its historical key so no existing enrolment is orphaned; everyone else is keyed `user:<auth uuid>` — stable across devices, unique per person, which is exactly what the `(instance_id, person_key)` unique index needs. Both from pure helpers, so who may enrol is decided in a test rather than inside a component.

**The display name never leaks an address.** `voice_profiles` is readable by every member of the instance, so: the account's own chosen name, then the email local-part, then a neutral fallback — and a phone-door account, whose local-part is a phone number, gets the fallback rather than its number.

**Reviewer mode is its own prop.** Expressing it by nulling the persona meant the studio could not tell "reviewing" from "nobody", and rendered an empty tab for both. It is now named on screen as the reason.

**The silent skip is gone.** The consent row was best-effort AND silent: no instance id meant no row, the sample still saved, and the person was told *"Saved on this device"* — true, and hiding that no consent record existed anywhere. That silence is the mechanism behind a table with one row in it. It now says which link failed and that the sample will not follow them to another device.

**And the app shows its own dependency chain.** A "Does it work?" tab renders seven checks — signed in, not reviewing, browser can record, instance exists, sample on device, consent row, studio answers — each PASS / FAIL / **unknown**, each failing row carrying the fix in the person's own words, each row printing the file or migration that decides it. That last part is the answer to "documentation of this system is where?": a citation on the row, in the app, rather than a document that drifts.

## Verification

- 19 new checks green; lint clean; the enrolment-identity rules are pure and tested without a browser.
- The defect is reproduced rather than described: the old expression evaluated falsy for an ordinary signed-in person, and the new one returns a real key for the same person.
- Measured, not assumed: the eleven live policies were read by name off the sovereign database before this record claimed what they enforce.

## The freeze caught me, and it was right

The shell is frozen to bug-fixes only (DR-0078), and my first version of the mount site added a seven-line comment explaining why `personaKey` had stopped being a gate. `monolith-budget-guard` failed it: **5362 lines against a frozen budget of 5355, +7**.

Every one of those seven lines was prose. The reasoning belongs where a reader actually looks — in `VoiceStudio.jsx` beside the code it explains, and in this record — not in the file the house has frozen. The comment came out and `reviewerMode` rides the `personaKey` line, so the mount costs **zero** lines. That left the shell one line UNDER, so the ratchet was re-frozen DOWN to 5354 and the dashboard's own copy of the number (`persistent-share.json`) moved with it, because the guard and the surface that displays it must never disagree.

Raising a frozen budget to fit my own explanatory comment is the move this house forbids, and it is the second time today a frozen baseline caught me trying it.

## Limits, stated

1. **A consent row can exist with no sample behind it.** The sample stays in device IndexedDB by design (`voice-reference.js`), so a new phone has the row and not the audio. The check tab shows those as two separate rows for exactly this reason. Cross-device sample sync is unbuilt. `re-review: 2026-10-22`.
2. **`user:<uuid>` keys are opaque in a member-facing list.** The display name carries the meaning; the key is machinery. If a persona is later added for someone already enrolled under a uuid key, their old row stays under the old key rather than migrating. `re-review: 2026-11-22`.
3. **The studio row can read `unknown`** on a screen that has not finished probing. That is deliberate and is not the same as "down" (DR-0440).
