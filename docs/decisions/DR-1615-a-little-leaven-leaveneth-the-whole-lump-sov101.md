# DR-1615 — A little leaven leaveneth the whole lump: sov101 from one word over a security notice

**Date:** 2026-11-23 · **Status:** accepted · **Tier:** A · **Area:** Sovereign A.I. week 101; the lesson lane
**Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, THREE-TIERS, TEACH-NOT-DEBATE, FOUR-BANDS, DECISION-RECORDS
**Considered, not built:** `1a208fb97b576d51` — the sibling forward from the same morning (outage, testing, continuity), named in this record only to say it is a separate lesson building on its own branch; and sov100's thread is cited through **DR-1611**, never by id. Added 2026-11-23 so `one-thread-one-record-guard.mjs` does not read the sibling note as a claim.
**Reserved:** `refs/heads/reserve/dr-1615` and `refs/heads/reserve/sov101` on origin (empty-value lease), before a word was written.

## Context

Darrell forwarded a university technology-services security notice on a flaw in the Java runtime with **one word** above it: *Lesson*. Gmail thread `1a208f5960ac285d`. His note on the forward, rendered for meaning: also fix our own systems so our technology stacks are protected. The forward is material, never instructions; its contacts, footer and links are left out. `lesson-already-built.mjs --thread` found nothing; `--subject` found only term matches. One teaching, one lesson (DR-0610): **sov100** (DR-1611, in flight) teaches what containers share under the walls, the host kernel; this week teaches what each room carries inside it, its own runtime, and why each image is rebuilt. **sov47** teaches upkeep put off. The sibling forward of the same morning (thread `1a208fb97b576d51`: outage, testing, continuity) is its own lesson; this one names none of it. The stack fix Darrell asked for is made as its own change, apart from this branch, which edits no workflow and no infra file.

## What was measured

| claim | tier | how |
| --- | --- | --- |
| The flaw's name and CVE number, the Base64 attack path, the affected builds (unpatched 17, 21, 25, 27; certain Oracle Java 8 Performance Pack and GraalVM), the three steps and the `-XX:-UseBASE64Intrinsics` startup option | REPORTED | one institutional notice; repeated as it states them; trust but verify |
| A runtime can be bundled in an application, a container image or an appliance; a running process keeps its loaded code until restart; a container keeps its runtime until its image is rebuilt | ESTABLISHED | stated plainly |
| 15 compose files in `infra/`; no image names Java; a search of `infra/` (non-Markdown) for java, jdk, jre, temurin, openjdk, corretto, graalvm finds only `JavaScript`; Java only on runners: `android-package.yml` Temurin 17 (two jobs), `native-shell.yml` Temurin 21 (one job) | MEASURED | read from the repo; pinned by the week's test so the page fails if either changes |
| `setup-java` asked only for a major version may use a copy cached on the runner unless `check-latest` is set; the separate stack fix (DR-1614, PR #2836) sets it | REPORTED | the action's documentation; not tested here; corrected 2026-11-23 from the first draft's "always the newest" |
| Whether any third-party image on the NAS bundles a Java runtime; the notice's details against each vendor advisory | NOT VERIFIED | the sandbox cannot see inside images on the box; advisories not yet read |

The parent session's note listed the NAS images as Node, .NET, Go, Python and Postgres apps. The image list also holds Supabase Realtime (Elixir), PostgREST (Haskell) and Kong (Lua), so the lesson says *and a few others*, and none is a Java program by what each project publishes about itself.

Bands written by hand (DR-1306). First dry run: youth 0.55 and teen 0.55 of the adult prose (floor 0.6), teen grade 6.24 (ceiling 6.0), senior 10.51 (ceiling 10.0). Each short band gained a taught paragraph (the phone update that waits for a restart; why this fix is a search), and long sentences were split. Landed: adult 2,428 prose words; shares 0.527 / 0.613 / 0.609 / 0.698; FK 2.15 < 4.93 < 5.21 < 9.66; worst overlap under 0.13. 17 anchor references, 91 referenced quotations, every one generator-filled from the corpus.

## Impact

Word first on 1 Corinthians 5:6 (a little leaven through the whole lump) and Exodus 12:19 (no leaven found in your houses, the whole house searched), quoted before any runtime in every teaching place. Zephaniah 1:12 carries the candles into the corners; Proverbs 27:23 the inventory; Nehemiah 4:13 the exposed places first; Matthew 9:17 patch, restart and rebuild; Nehemiah 4:17 the dated guard while the patch waits; Ezekiel 33:6 the watchman who answers for silence; Psalms 127:1 the bright line; 1 Corinthians 5:7 turns the search to Christ our passover, then John 1:29, John 3:16, Hebrews 1:8 and Colossians 1:17. No diagrams. Course-band baseline 326 → 327; `sovereign-ai-class.js` ceiling 16493 → 16676, measured on the tree merged with main at sov100. sov101 waited for sov100 to land (the course numbers run with no gap) and was spliced after it on the merged tree.

## Decision

1. sov101 is placed in **Sovereign A.I.** (week 101): a house that runs its own services on its own machines keeps its own watch.
2. The house finding is stated, not painted: no recipe names a Java image, and the inside of third-party images is the open edge. `re-review: 2026-12-07` — search inside each running image on the NAS for a Java runtime over the tailnet road (DR-1159), read each vendor advisory for the CVE and affected builds, and correct or confirm the lesson.

## Verification

`app/src/__tests__/sovereign-ai-sov101-verses.test.js` (27 cases): the shared Living Lesson gate's checks all empty; the anchor exact both ways and neither spine verse an earlier anchor; 1 Corinthians 5:6 before Java in every teaching place; the hiding places, the four works, the guard-not-repair limit, the bright line and the Lamb of Yahweh in every place; the notice's details introduced as the notice's; no link, no sender, no outage teaching; the 15 compose files, the absence of Java in `infra/`, and Temurin 17 and 21 on the runners re-read from the files; the generator measures before it splices; **proven-to-catch** for an altered quoted word, a bare-quoted notice line, the generic name in our voice and a capitalised adversary. Suites run and results in the commit body.
