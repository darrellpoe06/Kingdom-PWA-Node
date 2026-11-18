# DR-1560 — The porter and the course: sov93 from one word over a Level Up Coding issue on gateways and load balancers

**Date:** 2026-11-18 · **Status:** accepted · **Tier:** A · **Area:** Sovereign A.I. week 93; the lesson lane
**Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, THREE-TIERS, TEACH-NOT-DEBATE, FOUR-BANDS, DECISION-RECORDS
**Reserved:** `refs/heads/reserve/dr-1560` and `refs/heads/reserve/sov93` on origin (empty-value lease), before a word was written.

## Context

Darrell forwarded Level Up Coding's *API Gateway vs Load Balancer: Do You Need Both?* (Nikki Siapno, 2026-11-11) with **one word** above it: *Lesson*. Gmail thread `1a1ca71b314895bf`. `lesson-already-built.mjs --thread` returned MAYBE on the source name only (Level Up Coding feeds many weeks). A grep of the catalogs, `docs/decisions` and open `claude/lesson-*` branches for gateway, load balancer, Kong and the thread id found no lesson on this story (DR-0610). sov92 (DR-1559) owns the agent that games its own test; this week owns the three questions in front of a request (allowed, which service, which server) and the two components built to answer them. A system-design teaching, so Sovereign A.I., built by the course's generator route (`scripts/sov93-fill.mjs`). Sponsor, images, links and the image-only comparison table are left out.

## What was measured

| claim | tier | how |
| --- | --- | --- |
| Gateway vs balancer; L4 vs L7; health checks; the gate does not replace the service's check | ESTABLISHED | standard; the newsletter teaches it correctly; stated plainly |
| One cloud's ALB signs users in / verifies JWTs; Kong balances, health-checks, breaks circuits | REPORTED | the newsletter only; not checked against vendor pages |
| One shared function carries every same-origin road; it exists because the Funnel throttled cross-origin browsers with 503 | MEASURED | `app/functions/_lib/funnel-proxy.js:2-14` |
| It refuses another origin's write and signs every answer | MEASURED | `funnel-proxy.js:72-85`, `:57-58` |
| Each Funnel path mounts ONE loopback port; `/sb` is Supabase's Kong gateway; `/` is n8n | MEASURED | `infra/nas-transport/RECORDED-STATE.md` public-Funnel table (13 rows) |
| Tax archive fails closed; photo server and voice forwarder check the bearer in constant time; voice caps at 2 in flight | MEASURED | `infra/nas-tax-ingest/tax_auth.py:11`; `infra/nas-property-photos/photo_server.py:992,1165`; `infra/voice-studio/voice_forwarder.py:74,101-106,194` |
| No load balancer: every path is one instance; voice → voice-lite is failover, not distribution | MEASURED | the same table; DR-1555 Impact |
| Three fall-throughs to a stranger: tax reads ~7 weeks to n8n; /voice/health to n8n's editor (3 days); /voice/health to the camera forwarder | MEASURED | `RECORDED-STATE.md:25`; `app/src/lib/voice-service.js:162-168`; DR-1555 |
| The probe now asks whose answer it is | MEASURED, run | `isVoiceAnswer` called in the test on the camera body (false) and a named engine (true) |
| How many Funnel requests land on an unintended service today | NOT MEASURED | nothing in the house counts fall-throughs |

Bands written by hand (DR-1306). The first build fell short on youth and teen shares and teen read above 6.0; teen's long sentences were split and youth, teen and child were extended with teaching. Landed: adult 2,362 prose words; shares 0.522 / 0.621 / 0.616 / 0.630; FK 1.83 < 4.35 < 5.38 < 8.49; worst overlap 0.086. 24 anchor references, every one generator-filled from the corpus.

## Impact

Word first on 2 Chronicles 23:19 (the porters set at the gates, admission) and 1 Chronicles 27:1 (the courses month by month, distribution), quoted before any gateway or balancer in all five teaching places; neither was carried by an earlier week (0 and 0). Then 1 Corinthians 12:5; the porters' office (1 Chronicles 9:22, 9:27, 26:13; Nehemiah 7:3); Jethro routing the great matter and spreading the small (Exodus 18:18, 18:22); John 10:3 for the check the gate does not replace; Proverbs 14:4 for the simplest arrangement; Acts 6:3 for separated responsibility; 2 Samuel 18:27-32 for the runner who answered first with no answer, which is DR-1555's lesson. Closes on John 10:9 with John 1:29, John 3:16, Hebrews 1:8 and Colossians 1:17: Jesus, the Door, the Lamb of Yahweh and the Eternal Son. Course-band baseline 317 → 318; `sovereign-ai-class.js` ceiling 15002 → 15190 (the 26th raise, with its reason in `scripts/file-budgets.json`).

## Decision

1. sov93 is placed in **Sovereign A.I.** (week 93): a household that runs its own server must know who keeps each door.
2. The product features stay **the newsletter's report**; the distinctions are taught as established.
3. The house section says plainly there is no load balancer and why that is right at this scale. `re-review: 2026-12-02` — count fall-throughs on the Funnel (a request answered by a service other than its path's), and say so in the lesson or record that it still is not counted.

## Verification

`app/src/__tests__/sovereign-ai-sov93-verses.test.js` (23 cases): the shared Living Lesson gate's pure checks all empty; anchor exact both ways; frame before the machines in every teaching place; the side verses in every place; week 92's benchmark absent; no links or sponsor; the tiers and the dated re-review in every teaching place; every house claim read back from its file, and `isVoiceAnswer` run; **proven-to-catch** for an altered quoted word, a bare-quoted newsletter line, the generic name in our voice and a capitalised adversary. Suites run and results in the commit body.
