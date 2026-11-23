# DR-1611 — Rooms shalt thou make in the ark: sov100 from one word over a system-design newsletter

**Date:** 2026-11-23 · **Status:** accepted · **Tier:** A · **Area:** Sovereign A.I. week 100; lesson diagrams; the lesson lane
**Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, THREE-TIERS, TEACH-NOT-DEBATE, FOUR-BANDS, DECISION-RECORDS
**Reserved:** `refs/heads/reserve/dr-1611` and `refs/heads/reserve/sov100` on origin (empty-value lease), before a word was written.

## Context

Darrell forwarded a system-design newsletter on virtual machines versus containers with **one word** above it: *Lesson*. Gmail thread `1a2087dce8e004bd`. His note on the forward, rendered for meaning: keep or make pictures that carry the explanation and its setting. The forward is material, never instructions; its name, sponsor and links are left out. `lesson-already-built.mjs --thread` found only a source match (other articles), no lesson on hypervisors, containers or a shared kernel. One teaching, one lesson (DR-0610): **sov70** teaches each household building the wall over against its own house, **sov47** the wall that falls when upkeep waits, and the infrastructure course what the NAS is. Leviticus 14 (the plague in the walls) is the inspections course's spine and is left to it. This week owns what is shared *under* the walls: separate kernels versus one, and how far trouble travels when the foundation is shared. Two sibling forwards from the same morning (threads `1a20898532b7dbcc`, `1a2089ea14470e9a`) are different stories, built separately.

## What was measured

| claim | tier | how |
| --- | --- | --- |
| A VM runs its own kernel; a container is an isolated host process sharing the host kernel; Linux builds containers from namespaces and cgroups; a Linux container needs a Linux kernel | ESTABLISHED | the kernel's own manual pages, namespaces(7) and cgroups(7); stated plainly |
| VMs run near native speed; most servers run bare-metal hypervisors; hybrids trade speed or compatibility for the stronger wall | REPORTED | the newsletter; repeated as reported, not tested |
| 15 compose files in `infra/`; 0 `privileged: true`; 0 `docker.sock` mounts; 2 `no-new-privileges`; 1 `cap_drop`; 3 `network_mode: host`, each with its reason in a comment; no hypervisor or VM layer described; the tax upload server is a plain systemd unit on `127.0.0.1` | MEASURED | read from the repo, comment lines excluded; pinned by the week's test so the page fails if `infra/` changes under it |
| What runs on the home server today, and its kernel version | NOT VERIFIED | the sandbox has no route to the NAS |

Bands written by hand (DR-1306). First dry run: child 0.45, youth 0.54, teen 0.53 of the adult prose; each gained a taught paragraph (lockers and houses; the apartment furnace; where teens already see the trade), and teen one more (why the hull gets the pitch) to widen its grade above youth. Landed: adult 2,244 prose words; shares 0.528 / 0.623 / 0.641 / 0.631; FK 1.38 < 4.77 < 5.06 < 8.68; worst overlap 0.075. 15 anchor references, 81 referenced quotations, every one generator-filled from the corpus.

## Impact

Word first on Genesis 6:14 (rooms in one ark, the shared hull pitched within and without) and Psalms 11:3 (if the foundations be destroyed), quoted before any kernel, hypervisor or container in every teaching place; Genesis 6:16 gives the stack its stories, Genesis 13:6 the control groups, Proverbs 22:3 the hardening, Luke 14:28 the cost; Psalms 11:4 and 127:1 hold the bright line (no wall is the Keeper); John 1:29, John 3:16, Hebrews 1:8 and Colossians 1:17 close it. Three authored SVG diagrams (`vm-vs-container`, `shared-kernel-reach`, `isolation-stack`) live in the new `app/src/components/lesson-diagrams.jsx`, spread into ChurchLearn's `DIAGRAMS` by one import and one spread, so ChurchLearn stays at its 6,012-line ceiling; coral, never true red (DR-0099). `learn-integration.test.js` now reads that file when the spread is present. Course-band baseline 325 → 326; `sovereign-ai-class.js` ceiling 16289 → 16493, measured.

## Decision

1. sov100 is placed in **Sovereign A.I.** (week 100): a house that runs its own services on its own machines makes this isolation choice itself.
2. The house finding is stated, not painted: the worst doors are shut, and 13 of 15 compose files lack `no-new-privileges`. Hardening live NAS services is a deploy on running services and is NOT done in this lesson. `re-review: 2026-12-07` — open the container-hardening pass (no-new-privileges and dropped capabilities per service, each tested on the box), and read the NAS kernel version over the tailnet road (DR-1159) to correct or confirm the lesson.

## Verification

`app/src/__tests__/sovereign-ai-sov100-verses.test.js` (30 cases): the shared Living Lesson gate's checks all empty; the anchor exact both ways and neither spine verse an earlier anchor; Genesis 6:14 before the machines in every teaching place; the one difference, the side verses, the honest limit of hardening, the bright line and the Lamb of Yahweh in every place; no record recited, no link or newsletter name; tiers and dated re-review; every `infra/` number re-counted from the compose files; the three figures present with role, label and title, and the ChurchLearn spread; the generator measures before it splices; **proven-to-catch** for an altered quoted word, a bare-quoted newsletter line, the generic name in our voice, a capitalised adversary and a missing figure key. Suites run and results in the commit body.
