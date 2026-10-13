# DR-0476 — L86's Luke survey drained, and a caps emphasis pinned as a survey answer

- **Status:** accepted
- **Tier:** B (a learner-facing lesson at every age band)
- **Date:** 2026-09-18
- **Type:** content
- **Scope:** `app/src/lib/living-lessons-class.js` (L86's four bands rewritten, youth created, seven elisions replaced, one generic name corrected in our own voice), `app/src/__tests__/living-lessons-l86-verses.test.js` (21 → 48 checks, five of them tightened after a break harness proved they could not fail), all four shrink-only baselines (all four shrank)
- **Principles:** EVERY-BAND-IS-THE-WHOLE-MESSAGE (DR-0418), VERIFICATION-DOCTRINE (DR-0076 §3, §4), WORD-FIRST (DR-0097), COVENANT-NAME-IN-OUR-VOICE (DR-0210), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** DR-0473 (the quotation ratchet this drains further), DR-0475 (L87, whose section-break finding is now checked here), DR-0459 (no elision inside a quotation), DR-0471 (the pooled-scope finding this repeats)

## Why this exists

L86 is the Luke survey Darrell teaches through, and the full-levels pass reached it with **all four bands short and the youth band absent**.

| band | before | floor | after |
|---|---|---|---|
| child | 140 words, **0.24** | 0.50 | 587 words, **1.02** |
| youth | **absent entirely** | 0.60 | 642 words, **1.11** |
| teen | 178 words, **0.31** | 0.60 | 628 words, **1.09** |
| senior | 296 words, **0.51** | 0.60 | 680 words, **1.18** |

And the registers were wrong in a way a reader feels immediately: **the child band read at FK 11.15 and the teen band at 12.64, while the adult lesson read at 6.35.** The versions written for children and teenagers were harder than the one written for adults. The ladder is now **2.72 / 4.15 / 5.88 / 7.16**, monotone, with the child band far under the 7.0 ceiling.

## The decision

### a. SEVEN ELISIONS REPLACED WITH THE SENTENCE ITSELF

Three spans were elided in the adult lesson and the same three in `bigIdea`, plus one in the senior band. Every one had a contiguous verbatim span sitting right there:

| verse | what the elision cut | what the reader now gets |
|---|---|---|
| Luke 1:27 | Joseph's lineage | "of the house of David" — the Davidic claim the gospel is standing on |
| Luke 4:25-26 | the famine itself | "when the heaven was shut up three years and six months, when great famine was throughout all the land" — the severity that makes the mercy mean something |
| Luke 4:29 | the whole mob | "And rose up, and thrust him out of the city, and led him unto the brow of the hill whereon their city was built" — the elision saved seventeen words and cut the part that shows it was a crowd walking Him to an edge |
| Luke 2:31-32 | the seam of Simeon's song | the two lines joined, as he sang them |

The remedy for a long quotation is never a shorter elision. It is to quote it.

### b. THE COVENANT NAME, IN OUR VOICE ONLY — AND THE BRIGHT LINE BOTH WAYS

`bigIdea` said **"Religion that owns God for its own circle"** while the adult lesson said **"owns Yahweh"** in the same sentence. Our own voice, two different names for Him, in one lesson — exactly the ambiguity DR-0210 exists to remove. Corrected to Yahweh.

The bright line runs the other way too, and is now checked as such: Gabriel says he stands **"in the presence of God"**, and that is His Word, fetched verbatim. A check requires that quotation to stay letter-for-letter, so a future sweep that "fixed" it would fail the build rather than corrupt the text.

### c. THE SENIOR BAND STOPS RECITING A RECORD ID

The senior band's prologue note closed with a DR number. A teacher reading that band to a room has no way to open a decision record, and the reader in the pew certainly does not. The claim it was carrying is worth keeping, so it is now said in words: *the testimony is tested, the provenance is named, and trust is therefore earned rather than demanded, which is exactly the standard this house holds its own work to.*

### d. FIVE MOVEMENTS, HELD PER BAND — AND CHECKED WHERE DR-0475 BIT

L87's finding was that `formatLessonText` numbers a marker only when the marker is in a form it knows **and** the text before it ends in a sentence period, so L87 shipped for months rendering three of its six written movements. L86's own texts were measured first: the adult lesson renders 7 of 7 and the old senior band 3 of 3, so L86 was not carrying that defect. The four new bands are written with ordinal markers after sentence periods, **all four render 1 through 5**, and a check holds it — so the property is now guarded here whether or not it was ever broken here.

Each band carries all five: the method as *steps* (five declared, not a mood); the Son of man portrait with the reason for the birth detail; the whole cast with the tax decree read as providence's own logistics; Nazareth with **both** Gentile receipts and the cause of the wrath; and the mirror turned on the reader rather than outward.

## The finding

**A CAPS EMPHASIS PINNED AS A SURVEY ANSWER.** The existing gate had one check claiming the lesson "answers the survey questions." It read the whole lesson block for three fragments, so any single field could answer for all three — the pooled-scope defect DR-0471 already recorded. Worse, one of the three fragments it pinned was **`'Naaman the SYRIAN'`** — a capitalised emphasis inside the old teen band, not a survey answer at all. The check was pinning a typographic accident and calling it curriculum.

It surfaced because rewriting the teen band removed the caps and the check failed. Had the rewrite happened to keep that emphasis, the check would have gone on passing while establishing nothing.

Now: the framework citation is checked on its own, and the two study answers are checked **in the senior band's own prose** — the band a facilitator actually reads standing up, and therefore the band that owes them. That is the nineteen-faced finding again, in its twentieth face: **check the property in the place it is supposed to be doing its job**, and a claim check that cannot say *where* something is taught does not establish that it is taught.

Two further gaps the checks found in my own senior draft, both real content and both fixed in the text rather than by widening a regex: the band never refused the leap-past-evidence reading of faith, and it said He gave *Himself* to the smaller company without ever saying where His **depth** went — which is the whole force of the sorting.

## Evidence

- Fullness: `shortBands` returns `[]`; shares 1.02 / 1.11 / 1.09 / 1.18 against floors 0.50 / 0.60 / 0.60 / 0.60.
- Reading: ladder 2.72 / 4.15 / 5.88 / 7.16, monotone across every present band; child under the 7.0 ceiling.
- Quotations: 48 quoted spans across the four bands, **every one verbatim under strict comparison, 0 unreferenced, 0 ellipses**; 0 generic uses of the name in our own prose in any reader field, Yahweh named in each band's own voice.
- Sections: all four bands render `[1,2,3,4,5]`, no chunk over the house's 420-character wall limit.
- All four shrink-only baselines shrank and none gained an entry: short **86 → 85**, inverted **20 → 19**, child-over-ceiling **15 → 14**, title-unnamed **152 → 151** (bands 457 → 454), quotation **111 → 110** lessons and **732 → 725** spans, reported as 0 fresh and 4 healed.
- Gate: 48 checks, up from 21.

## And five checks that could not have failed

The break harness ran 37 breaks against the L86 block. 25 were caught first time. Of the rest, three were my own breaks being too narrow to land and three were the harness's expected test-name strings not matching (both bookkeeping errors on my side, already-caught gate behaviour) — **but five were real: checks that would have gone on passing while the thing they claimed to guard was deleted.** Every one is the same face of the finding this house keeps meeting:

| the check | what answered for it | fix |
|---|---|---|
| research and inspiration sit in the same document | the word **inspiration** in the naming line of every band — the tagline answering the claim (DR-0471) | branch removed; each band must now SAY the two belong together |
| the birth detail is tied to the portrait | **"a son of man has"** — the *humanity* check's own evidence, one line below | branch removed from the reason alternation |
| the wrath answered the Word He spoke | **"The room stopped smiling"** — a reaction standing in for a cause | branch removed; causation is now required |
| the mirror sentence is stated | **"loves outsiders"**, which appears in the Nazareth narration of every band | narrowed to the cliff claim itself |
| both receipts were outsiders | a bare **"outsider"**, which the mirror sentence later in the same movement supplies | narrowed to `both (of them) (were\|are) (outsiders\|Gentiles)` — the claim, not a word near it |

Four of the five are an **alternation whose widest branch is true somewhere else in the text being searched.** That is now a known-enough failure mode to be worth stating as a rule for writing these checks: *when a claim check is an alternation, every branch has to be a statement of THAT claim — a branch that is merely a word the passage happens to contain turns the check into a spell-check.*

One structural fix came with them. The child band's "Checking and believing are friends, not enemies" was answering BOTH the togetherness check and the leap-past-evidence refusal — one sentence carrying two checks, so either claim could be deleted and a green gate would report the other. The band now says the togetherness in its own clause (*"Careful checking and real believing came out of the same man, in the same book"*), and the two checks read two different sentences.

After the fixes, all five caught, plus the strengthened breaks: **36 of 37, with the one remaining a no-op string that never matched.**

## Consequences

- The full-levels pass has 85 lessons left carrying a short band. Next is L85, downward.
- The DR-0473 elision debt is at 110 lessons / 725 spans, still under its own `re-review: 2026-11-18`.
- L86's anchor list is still narrower than the verses the lesson now teaches from (1 Kings 17 and 2 Kings 5 are cited in every band but not anchored). Same deferral as L89 and L88 — **re-review: 2026-10-24**.
