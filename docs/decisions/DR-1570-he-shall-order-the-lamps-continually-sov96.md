# DR-1570 — He shall order the lamps continually: sov96 from one word over a system design newsletter

**Date:** 2026-11-19 · **Status:** accepted · **Tier:** A · **Area:** Sovereign A.I. week 96; the lesson lane
**Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, THREE-TIERS, TEACH-NOT-DEBATE, FOUR-BANDS, SERVICE-COMES-HOME, DECISION-RECORDS
**Reserved:** `refs/heads/reserve/dr-1570` and `refs/heads/reserve/sov96` on origin (empty-value lease), before a word was written.

## Context

Darrell forwarded a ByteByteGo system design refresher (EP233: Kubernetes for busy engineers, plus four shorter pieces) with **one word** above it: *Lesson*. Gmail thread `1a1daf286df06d06`. A newsletter, not a personal email; no link or sponsor is carried. `lesson-already-built.mjs --thread` returned NOTHING FOUND. One teaching, one lesson (DR-0610): this week takes only Kubernetes' declared desired state and the controllers that keep pulling the actual state back to it. Exodus 25:40 is already in the course and is named, not re-taught: **sov86** reads the pattern that came in writing, **sov91** uses a written pattern as a grading rubric (and sov17 as a plumbline). This week owns the KEEPING: the keeper who returns every cycle (Leviticus 24:3-4) and the copy that must be fresh (2 Kings 22). The newsletter's other four pieces are left to their own weeks; sov91-sov95 are not re-taught.

## What was measured

| claim | tier | how |
| --- | --- | --- |
| The newsletter's tour of Kubernetes parts (API server, etcd, scheduler, kubelet) | REPORTED | the forwarded issue only; no cluster was run |
| A controller is a non-terminating control loop; the thermostat; a cluster may never be stable, and that is fine while controllers run | DOCUMENTED | kubernetes/website `content/en/docs/concepts/architecture/controller.md`, read 2026-11-19 |
| One services list; merging it is the deploy; `enabled` is the greenlight; installers idempotent | MEASURED | `infra/nas-loops/services.json` `_comment`; 36 services, 34 enabled on this tree (the lesson claims no count) |
| services-sync: enabled, every 15 minutes, runs every enabled installer, skips the rest by name | MEASURED | `infra/nas-loops/registry.json`; `infra/nas-loops/loops/services-sync.sh` |
| The fresh copy: pull first (2026-08-04), pull as the owner and say why on both channels (2026-08-15); reason captured (2026-08-14); degraded exit 3 (2026-09-23); the 13-hour-old camera code (2026-10-07) | MEASURED | the loop's own dated comments; registry description |
| The restart follows the code on every path; the witness shows running beside repo | MEASURED | `THE-WAY-A-SERVICE-COMES-HOME.md` steps 4 and 6 (DR-1119) |
| Whether the loop's clock fires on the home server today, and which commit its mirror holds | NOT VERIFIED | this session has no road to the NAS |

Bands written by hand (DR-1306). First build had child 0.45, youth 0.54, teen 0.54 of the adult lesson; each gained one taught paragraph (child: doing it once vs keeping it done; youth and teen: say why, the loop's captured reason and degraded exit). Landed: adult 2,124 prose words; shares 0.511 / 0.614 / 0.609 / 0.658; FK 1.73 < 4.40 < 4.87 < 8.55; worst overlap 0.098 (youth~teen). 27 anchor references, every one generator-filled from the corpus by `scripts/sov96-fill.mjs`.

## Impact

Word first on Exodus 25:40 with 25:9 and Hebrews 8:5 (the pattern shown before the build), Exodus 39:42-43 (the first inspection: what is, beside what was commanded) and Leviticus 24:3-4 with Exodus 27:20 and 30:7-8 (the lamps ordered evening and morning, continually), quoted before any machine in every teaching place. Then 2 Kings 22:8, 11, 13 (the book lost inside the house; kept by habit, not the copy) and James 1:23-25 (look and continue therein), closing on Hebrews 8:1-2, 7:25 and 13:8 with John 1:29, John 3:16, Hebrews 1:8 and Colossians 1:17. Neither frame verse is the first anchor of an earlier week. Course-band baseline 320 → 321; `sovereign-ai-class.js` ceiling 15561 → 15744 (the 29th raise), both measured on the spliced tree.

## Decision

1. sov96 is placed in **Sovereign A.I.** (week 96): a house that runs its own machines keeps them to a declared pattern, not to a memory.
2. The newsletter stays **reported**; the controller loop is **documented** from the project's own page; every house claim is pinned to the files, never to the live machine.
3. `re-review: 2026-12-03` — read the home server's services-sync events from a road that reaches it (the runner over the tailnet, DR-1159) and record whether the loop fired and which commit the mirror held.

## Verification

`app/src/__tests__/sovereign-ai-sov96-verses.test.js` (26 cases): the shared Living Lesson gate's checks all empty; anchor exact both ways, first two refs pinned, neither an earlier first anchor; the pattern and the lamps before the machine in every teaching place; the inspection, lost book, mirror, intercession, repeat-safe keeping, fresh copy and thermostat in every place; tiers and dated re-review in every teaching place; every house claim read back from `services.json`, `registry.json`, `services-sync.sh` and the Way; **proven-to-catch** for an altered quoted word, a bare-quoted newsletter line, the generic name in our voice and a capitalized adversary. Suites run and results in the commit body.
