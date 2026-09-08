# Living Lesson L135 — They Called Every One of Them George

**Date:** 2026-09-08
**Module id:** `ll135-they-called-every-one-of-them-george-the-name-they-took-the-porter-at-the-door-and-the-wage-yahweh-legislated`
**Branch:** `claude/lesson-you-have-destiny-fabf09`
**Decision record:** DR-0337
**Input:** Darrell said **"lesson."** and brought in a telling about the Pullman porters — Labor Day 1894, men hired out of slavery to staff America's sleeping cars, and the one name a whole country used so it would not have to learn theirs.
**Rules in force:** CLAUDE.md "Spoken Teachings Are Build Input" · DR-0098 (teach the Word, do not debate it) · DR-0100 (speak established fact; false skepticism is not discernment) · DR-0076 (verify; no verse from memory; proven-to-catch) · DR-0210 (Yahweh in our voice, the KJV untouched inside quotes) · DR-0190 (attribute) · DR-0331 (quote him for meaning)

---

## The weld was found, not built

This is the part worth recording, because it is the reason the lesson exists in this shape.

The telling is history. The lesson had to be Scripture. So the first move was to fetch verses, not to write prose — and on the way through the naming texts, `John 10:3` came back from the corpus reading:

> "To him the porter openeth; and the sheep hear his voice: and he calleth his own sheep by name, and leadeth them out."

**The KJV word for the man at the door is PORTER.** In a sentence about the exact opposite of what a railway carriage did.

It got stronger the further it was pulled. In the house of Yahweh the porters are an **ordained Levitical office**: named in the permanent record — Shallum, Akkub, Talmon, Ahiman (1 Chronicles 9:17) — two hundred and twelve of them, "whom David and Samuel the seer did ordain in their set office." (1 Chronicles 9:22), over the treasuries (9:26), re-established the moment Nehemiah's wall stood (Nehemiah 7:1). A reigning king said he would take the job (Psalms 84:10). And Jesus hands the porter the watch, with authority (Mark 13:34).

Nobody engineered that. It was sitting in the text, and it is now gated so a later edit cannot quietly remove it.

## The inversion at the centre

The emotional centre is not the trains. It is **Genesis 16:13** — the first person Scripture records naming Yahweh is Hagar, a used and discarded slave woman, and the name she gives Him is that He **sees** her. An entire apparatus of custom existed so that nobody had to see anyone; here is the Person whose defining attribute, to the least-regarded woman in the story, is that He does.

## The two-track honesty rule (the decision this lesson forced)

A lesson whose occasion is documented history carries two kinds of claim, and the temptation is to let one borrow the other's certainty. So the rule was written down and gated:

- **Scripture** — fetched verbatim, checkable in the room. 198 spans, empty allowlist.
- **Established history** — stated **plainly, without hedging** (DR-0100: under-claiming a truth is its own way of lying).
- **Commonly cited ranges** — labelled as ranges (strike deaths, the size of the Great Migration).
- **A compression in the telling** — corrected gently, in our prose, with the reason. The Brotherhood was the first Black-led union **chartered by the AFL** and the first to win a contract with a major corporation; earlier Black labour organising existed. Offered in the lesson "the way you would want it offered to you," because accuracy makes the story **harder to dismiss, not smaller.**
- **Provenance named.** Scripture was verified against the corpus this session. The history is well-established knowledge and was **not fetched** — the sandbox is egress-blocked — and the lesson opens by saying so rather than implying both tracks were checked the same way (DR-0076 §8).

## Both fences, because this material wounds when preached bare

- **Under-claiming forbidden.** Exodus 21:16 sentences the man-stealer to death; 1 Timothy 1:10 lists **menstealers** among things contrary to sound doctrine. Many believers have never heard that read from their own Bible.
- **Over-claiming forbidden.** Genesis 50:20 holds *they thought evil* AND *Yahweh meant it unto good* as **two facts**. Collapsing them converts a comfort into a defence of the men who did it. Gated.
- **The edit is the tell.** Editions were produced for enslaved readers with portions removed. Had the text supported the institution, no editor would have needed a blade (Deuteronomy 4:2; Acts 20:27), and the suppressed half is restored: "Masters, give unto your servants that which is just and equal…" (Colossians 4:1). The transferable tool, worth more than the history: **when someone teaches you half a text, go find the other half.**
- **No partisan contest staged** (DR-0098) — asserted by absence.
- **It ends on the Son**, not on the grievance: looked away from (Isaiah 53:3), took the servant's form (Philippians 2:7), given the Name above every name (Philippians 2:9). Gated.

## Verification (DR-0076)

- **198 quoted spans, every one letter-for-letter KJV**, read from `app/public/bible/kjv/` **before** any prose was written. A small fetch helper was used so no verse could come from memory.
- **`living-lessons-l135-verses.test.js` — 31 tests.** `NOT_SCRIPTURE` is **empty**: our emphasis wears capitals, never quotation marks.
- **Proven-to-catch against two real defects this authoring produced**, each deliberately re-introduced and each turning the suite red:
  1. **A shortened quotation.** The first draft wrote *"…for so had God commanded."* for 2 Chronicles 8:14; the verse reads *"…for so had David the man of God commanded."* Three words trimmed so it read better — which is editing Scripture, and the shortened form is not in the corpus at all. Two assertions went red.
  2. **Six generic "God" in our authored voice** — a child-level paraphrase, one talking point, four quiz options. The check **strips quoted spans first**, because DR-0210 governs our prose only; a check that did not strip would demand we corrupt the text we are required to reproduce.
- **The complement assertion is new and worth keeping**: the KJV's own "God" / "the LORD" must still be **present** inside quotations. Without it, a blind find-replace would have satisfied the original rule while corrupting Scripture — the exact thing DR-0210 forbids.
- **Typography:** 0 generic "God" in our voice; 82 × Yahweh; no capitalised adversary name.
- **Register measured:** child **1.30** / teen **6.70** / adult **8.00** / senior **12.30**. Not inverted, child under the 7.0 ceiling. Shrink-only baseline gained **no new offenders** (30 inverted / 17 over-ceiling unchanged; count 132 → 133).
- **The id-collision claim above is MEASURED, not asserted.** The duplicate was reconstructed against the real catalog — this lesson re-labelled `ll134` beside main's `ll134-divers-weights` — and `living-lessons-id-collision.test.js` went red, naming both ids: *"L134: ll134-divers-weights… AND ll134-they-called-every-one-of-them-george…"*. That is the silent auto-merge case (the one git would NOT have flagged had the test filenames differed), caught on the PR, before `main` is touched.
- **Full suite green**; lint clean at `--max-warnings 0`; real `npm run build` clean.

## The collisions — TWO of them, and a correction I owe my own first account

Authored as **L131**. Renumbered to **L134** when a fetch of `main` showed L131–L133 had been merged mid-authoring. Then, while PR #1483's CI was running, **main merged its own L134** ("Divers Weights", #1482) and the PR went `dirty`. Shipped as **L135**.

**Two collisions, one afternoon, one branch.** That is the measurement, and it changes the conclusion below.

### The correction

My first write-up said the first collision was "caught by habit, not by a gate," and opened a re-review to decide whether a lesson-id gate was worth building. **That was false.** `app/src/__tests__/living-lessons-id-collision.test.js` has existed since **2026-09-02**, built after three sessions raced and two independently claimed L114. It asserts precisely this — a lesson number is claimed at most once — with a shrink-only ratchet on numbering gaps and its own proven-to-catch replay.

Claiming a gap without grepping for the gate that closes it is the DR-0107 cited-but-unread failure in miniature, and it stays in the record instead of being edited away.

### What the second collision actually proves

The second one is the more useful data point, because it shows **where the real catch lives**.

It surfaced as a git **add/add conflict on the test filename** — both branches had written `living-lessons-l134-verses.test.js`. That is exactly the mechanism the id-gate's own header calls out about the 2026-09-02 incident: *"That was luck, not a check."* Had I named my test file differently, git would have auto-merged both modules into the array without complaint.

**And that is precisely the case the gate exists for.** Merging `main` into the PR head is when both claims first live in one tree, so the gate fires **on the PR, in CI, before `main` is ever touched**. Proven below rather than asserted: the duplicate was reconstructed and the suite went red on it.

So the standing answer is not a new gate and not a date. It is: **the gate is the check and it fires at merge; fetching `main` first is a courtesy that saves a cycle, not the safety.** Two collisions in one afternoon say the courtesy will keep being needed — concurrent lesson sessions are now normal — but nothing was ever unprotected.

## Files

- `app/src/lib/living-lessons-class.js` — L135 added; `weeks` 132 → 133
- `app/src/__tests__/living-lessons-l135-verses.test.js` — new, 31 tests
- `app/src/lib/reading-level-baseline.json` — count only; no new offenders
- `docs/decisions/DR-0337-*.md` + `docs/decisions/INDEX.md`
