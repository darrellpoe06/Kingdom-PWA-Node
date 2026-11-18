# DR-1564 — He that taketh warning: sov95 from one word over an account security alert

**Date:** 2026-11-18 · **Status:** accepted · **Tier:** A · **Area:** Sovereign A.I. week 95; the lesson lane
**Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, THREE-TIERS, TEACH-NOT-DEBATE, FOUR-BANDS, DECISION-RECORDS
**Reserved:** `refs/heads/reserve/dr-1564` and `refs/heads/reserve/sov95` on origin (empty-value lease), before a word was written.

## Context

Darrell forwarded an account security alert with **one word** above it: *Lesson*. Gmail thread `1a1f08def44cc672`. It is a personal account email, so PRIVACY governs: the lesson tells it generically (a household's email account; an A.I. assistant app granted access to a linked drive) and no address, account, recovery address, app identity, link or date from it is written anywhere. `lesson-already-built.mjs --thread` returned NOTHING FOUND, and a grep of the catalog for oauth / granted access / consent found no week on app permissions. One teaching, one lesson (DR-0610): **sov46** owns whether to give a helper wide sight; **sov93** owns the porter at the gate. This week owns the after: the alert has sounded; check, do not ignore, do not panic, take back what you no longer use.

## What was measured

| claim | tier | how |
| --- | --- | --- |
| A household account was alerted that an A.I. assistant app was granted drive access | REPORTED | the forwarded alert only; the account was not seen |
| A grant stands until it ends or is revoked; answer an alert through the account, never its link | ESTABLISHED | standard account-security practice; stated plainly |
| The app's support door: one record, reason required, 60 min default, 1440 max, every read logged, revocable, PHI never offered | MEASURED | `infra/supabase/migrations-auto/0114-governed-support-door.sql:104-105,132`; `app/src/lib/support-access.js:27-30,66` |
| How many support grants exist in the live database | NOT MEASURED | not queried; the lesson claims no count |
| Whether the household made this grant; the provider's own help page | NOT VERIFIED | only the household can answer; the provider's help host is outside this session's network |

Bands written by hand (DR-1306). First build had youth at 0.595 of the adult lesson (floor 0.6); youth and teen each gained a taught paragraph (when it was you). Landed: adult 1,874 prose words; shares 0.566 / 0.629 / 0.632 / 0.657; FK 1.75 < 4.36 < 5.21 < 7.94; worst overlap 0.095 (youth~teen). 21 anchor references, every one generator-filled from the corpus.

## Impact

Word first on Ezekiel 33:4-5 (the hearer of the trumpet: he that taketh warning shall deliver his soul) and Nehemiah 13:4-9 (the chamber Eliashib prepared for Tobiah from the inside while Nehemiah was away; cast forth, cleansed, restored), quoted before any app in every teaching place. Neither is the anchor of an earlier week (0 and 0); Nehemiah 13:4-9 appears in no earlier week at all. Then Psalms 112:7 (not afraid of evil tidings), Proverbs 14:15 (the forged alert; never the link), Psalms 121:4 and John 17:12, closing with John 1:29, John 3:16, Hebrews 1:8 and Colossians 1:17. Course-band baseline 319 → 320; `sovereign-ai-class.js` ceiling 15378 → 15561 (the 28th raise), both measured on the spliced tree. Found while gating: sov94's test failed on main itself (427, not 429) because a bare `--since=2026-10-19` means that date at the current clock time; re-pinned to `2026-10-19T22:00:00Z`, which reproduces 429 / 0 / 4 / 12 on full history (any start 21:40:48Z-22:57:33Z does). Anchored, not loosened.

## Decision

1. sov95 is placed in **Sovereign A.I.** (week 95): a household that lets an assistant into its things must know how to answer the alert and take the key back.
2. The alert stays **reported**; the household and the app stay unnamed; the house section is pinned to code, not to the live database.
3. `re-review: 2026-12-02` — confirm the provider's own guidance page from a session whose network reaches it, or record that it still is not verified.

## Verification

`app/src/__tests__/sovereign-ai-sov95-verses.test.js` (22 cases): the shared Living Lesson gate's checks all empty; anchor exact both ways and neither frame verse an earlier anchor; the trumpet before the machines in every teaching place; side verses, never-the-link and take-back in every place; a privacy sweep (no address, link, thread id, provider or product name in any string); tiers and dated re-review in every teaching place; the support-door claims read back from the migration and the library; **proven-to-catch** for an altered quoted word, a bare-quoted alert line, the generic name in our voice and a capitalised adversary. Suites run and results in the commit body.
