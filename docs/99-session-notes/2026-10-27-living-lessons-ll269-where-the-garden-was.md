# 2026-10-27 — Living Lesson 269: where the garden was, and the gate the search keeps walking past

**Module id:** `ll269-where-the-garden-was-and-the-gate-the-search-walks-past`
**Record:** [DR-1260](../decisions/DR-1260-where-the-garden-was-and-the-gate-the-search-walks-past-ll269.md)
**Course:** Living Lessons, L269
**Row:** `agent_inbox` `b97aa626-fb49-4347-b75c-3040eade2344` · research item `572d9578-ba8d-4e09-ae4b-9193cc8dc625`

## What he sent

A video asking where the Garden of Eden was, under one word — **"Lesson,"** — with the note **"Maps timelines and connections to the Word and games."** The video argues Eden was the whole land of Mesopotamia, the garden lay in a valley now under the Persian Gulf, and its eastern door was roughly the Strait of Hormuz.

This is the **third and last** of the three rows that waited while the NAS builder was dark. `60972a31` became sov52 (DR-1258), `d56b9e85` became ll268 (DR-1259), and this one waited about twenty hours.

## The design problem was the opposite of ll268's

ll268 handled a sensational claim that flattered the account and had to be kept out of the evidence pile. **This source is good** — close to the text, honest about its weak points, ending by pointing the viewer to Christ. So the risk was not credulity but agreement: that the lesson would nod along, repeat a synthesis as if it were a finding, and never reach the verse that resets the question.

The verse is Genesis 3:24, and it is the reason the lesson exists. It does not call the garden **lost**. It calls it **kept** — a door on the east, a guard upon it, posted not to hide an address but *"to keep the way of the tree of life."* So every expedition hunts the exterior of a place Scripture says is guarded on the interior, and finding the valley would not open the gate. The hunt can be interesting; it can never be urgent. And the Word's own question is therefore not *where* but *whether the way is open*, which it answers without reticence at Luke 23:43, Hebrews 10:19-20 and Revelation 2:7, 22:2 and 22:14. A guarded garden at the front of the Book, an open city at the back, and the sword at the east answered by a veil torn down the middle.

## Measured

| measure | value |
| --- | --- |
| referenced quoted spans / corpus faults | **168 / 0** (every string at any depth; the sweep asserts its own count) |
| lesson · bands (chars) | 17,941 · 9,316 / 16,317 / 19,329 / 18,580 (bands unchanged; the anchor pass went into adult) |
| prose-word shares (floors 0.50 / 0.60 / 0.60 / 0.60) | **0.55 · 0.89 · 1.00 · 1.02** (each lower than before the anchor pass — adult prose is the denominator; child's margin is 0.05) |
| authored grades (adult 8.5) | **1.8 · 7.8 · 11.5 · 12.2**, not inverted |
| worst band overlap | **0.12** (ceiling 0.5) |
| heading numbers | **1..13** contiguous |
| elisions · colour spellings · drifted terminal marks · generic names in our voice · Yahweh in a quote | 0 · 0 · 0 · 0 · 0 |
| `anchor.ref` | 42, all resolving — and all 42 **named in the lesson**; three were not, which is what reddened the first push |
| stories · quiz · cases | 2 (254 / 296 words) · 9 · **29** |

## What the previous two builds bought

**Every gate that cost ll268 a red push is pre-run inside this lesson's own spec** — elided quotations, the British colour family, quoted spans carrying the host sentence's punctuation, generic naming in our voice. ll268 took three pushes to discover those three classes. **ll269 took none of those three** — and then took one red push anyway, on a fourth class nobody had recorded yet: an anchor gate I never loaded, because I ran eleven gate files instead of the suite. That is the honest return: recording a class buys you that class, and nothing else. The next one always arrives from the direction you were not looking.

## Three things that went wrong here, and were fixed

**The senior band was a reworded teen band, and the gate caught it at exactly the ceiling.** I wrote senior by lengthening teen's sentences; `teen~senior` measured **0.50**, and `duplicatedBands` fails on `>=`. That is the ll173 defect the gate was built for, committed fresh. Rewritten with its own material — what to say when a grandchild brings this home, the teacher's need for the vocabulary before the geography, a reader who has watched this cycle turn before — the pair fell to **0.06**. Then the ladder inverted, because the new register was plainer, so the sentences were made periodic again without going back to teen's wording, and senior rose to 12.2 above teen's 11.5.

**Five assertions in my own spec were wrong before they were right, and all five were the spec's fault, not the lesson's.** A pinned Genesis 10:10 span stricter than the text; three regexes for phrasings the lesson does not use; and an `expect(a) || expect(b)` written as though it were an either/or, which it is not — the first assertion throws before the second is reached. That last one is the dangerous shape, because in the other direction it passes silently and proves nothing.

**I wrote estimates into the decision record and had to correct them.** The first draft of DR-1260's measured paragraph said 192 referenced spans and gave four band character counts, none of which was right; the measured values are 165 and 9,316 / 16,317 / 19,329 / 18,580. Measuring found something worth keeping, too: the senior band is *shorter* in characters than teen while carrying a *larger* share, because the share counts authored prose and teen quotes more Scripture.

**A fourth, and the sharpest: ll268's own gate was a time bomb, and this lesson set it off within the day.** ll268's spec asserted that ll268 is the HIGHEST Living Lesson. True for about an hour. ll269 falsified it, reddening this branch, and it would have reddened `main` the moment ll269 merged. That is precisely the DR-1256 defect — a check handing a permanent role to whichever lesson is newest — committed again in a lesson spec one day after recording it. Both specs now assert only that each lesson claims its own number exactly once, and "which is newest" is left to `living-lessons-order.test.jsx`, which owns that question. The rule worth keeping: **a lesson's own gate asserts what stays true about that lesson, never its position in a growing list.**

## The one that actually cost a red push: I ran eleven gate files and called it "the gates"

The suite has **432 files**. I picked the eleven I judged relevant to a lesson, they went 186/186 green, and I reported the merged tree verified. CI then failed on a gate I had not picked — `every-anchor-is-named-in-the-lesson.test.js` — which found **three anchors listed in `anchor.ref` and discussed nowhere in the lesson**: Genesis 2:9, Genesis 2:15, Joshua 24:2, missing from every band, youth included. That gate exists because Darrell said *"Keep all anchors just spread out in the lessons!!!!! ... Just sit where they were discussed!!!"* A subset run cannot honour a rule it never loads, and **choosing the subset is itself a claim about which gates matter — not my claim to make.** The full suite is the only run whose green means what it says.

The three were real teaching, not padding, so none was dropped from the list to quiet the gate:

- **Genesis 2:9** — the tree of life *"in the midst of the garden"*, which is precisely what Genesis 3:24 posts the guard over.
- **Genesis 2:15** — the man put there *"to dress it and to keep it"*; keeping is the verb the cherubim inherit from him, and the lesson's whole spine is *kept*, not *lost*.
- **Joshua 24:2** — the fathers *"on the other side of the flood in old time, even Terah"*: the Mesopotamian homeland the geographic claim rests on, named without flattery, since the same verse says they *"served other gods."*

Each went into the adult band at the point that thought was already being taught (+799 characters). **Fetching Joshua 24:2 rather than trusting memory also caught that it reads "in old time"** — my recollection had dropped three words from a verse I was about to quote. That is DR-0076's whole reason for existing, and it paid for itself in one line.

One finding about the gate itself, recorded rather than quietly patched: its `lessonText` omits the **youth** band (`every-anchor-is-named-in-the-lesson.test.js:57`), so an anchor taught only to youth reads as unnamed. Fixing it widens the haystack for all 266 lessons and would trip the deliberate "owed list is exact, not padded" check until each allowance is lowered by hand — correct behaviour, and not a change to make inside a lesson PR. `re-review: 2026-11-10`.

## The games ask is half answered, and that is recorded rather than implied

He asked for games. What shipped is three playable drills in the lesson and in all four bands — **FOUR RIVERS** (match each river to its land, and notice the one that needed no explanation), **FIVE EDENS** (name which of the five senses each of five verses means), **TWO PILES** (sort claims into established or asserted and defend the sort) — with the facilitator told to run FOUR RIVERS with the children while the adults are still arguing. That is real, and it is what a lesson can carry.

**What does not exist is an in-app surface**: no interactive map, no timeline component, no playable drill. This is his second request in two rows for maps and timelines, so it is written into DR-1260 as a dated open item — `re-review: 2026-11-10` — rather than left as an implication.

## The queue is empty

All three teachings that were waiting while the builder was dark are built: sov52, ll268, ll269.
