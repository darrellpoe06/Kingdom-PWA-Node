# The Torah Pattern Map — all the visible patterns, so we can see (2026-09-08)

**Spoken into the app by Darrell**, in four passes:

1. *"Are there more patterns in the first 5 books... we want ALL of the visible patterns of these relationships so we can See!!!!"*
2. *"Rigorous analysis"*
3. *"what did Yahweh mean like Us... give their lives for Love?!!!"*
4. *"the most competent beings got tricked by this guy and they believe there is another Way other than the Words Ways... and they know Yahweh"* — then, correcting himself: *"Or they didn't get tricked they are just as evil..."*

Passes 3 and 4 each became a **pattern family**, because each was a real question the Torah answers.

## What shipped

- **`app/src/lib/torah-patterns.js`** — 78 patterns, 12 families, **124 distinct verses**, every one inside Genesis–Deuteronomy and verified against the in-repo KJV.
- **`app/src/components/TorahPatternMap.jsx`** — the seeing surface, mounted as a section in `EternalAlgorithmsStudy.jsx` (Church → Eternal Algorithms).
- **`torah-patterns.test.js`** (27) and **`torah-pattern-map-render.test.jsx`** (15).

## The map

| family | n | what it holds |
|---|---|---|
| Yahweh speaks as Us | 5 | Gen 1:26, 3:22, 11:7 — and Gen 19:24, where one verse names the LORD twice, as two |
| The Spirit in the Torah | 7 | Every explicit mention: 1:2, 6:3, 41:38, Ex 31:3/35:31, Num 11, 24:2, 27:18, Deut 34:9 |
| The likeness is self-giving | 8 | *Darrell's question 3* |
| The One who is seen | 9 | Hagar, Moriah, Bethel, Peniel, the redeeming Angel, the bush, "my name is in him", the drawn sword |
| The Word that does | 2 | Speaking as the mechanism; the Name that is a sentence |
| The Coming One promised | 5 | Seed, all families, Shiloh, Star and Sceptre, the Prophet |
| Something dies in the place of someone | 7 | Skins → firstlings → the ram *in the stead of* → Passover → hand on the head → two goats → lifted on a pole |
| Someone stands between | 4 | Abraham, Moses, held-up hands, Aaron between the dead and the living |
| The enemies, named | 11 | 17 distinct enemies named by the Torah itself |
| How the enemy works | 6 | Question · contradiction · promotion · counterfeit · a working sign from a mouth that leads away · seduction |
| **Knowing Yahweh did not prevent it** | 9 | *Darrell's question 4* |
| All of it running at once | 5 | Garden · exodus · wilderness · balaam · the calf |

**Coverage (derived):** Genesis 32 · Exodus 17 · Leviticus 5 · Numbers 13 · Deuteronomy 13. **Persons:** Father 43 · Son 24 · Spirit 17. **21 patterns show two or more Persons in one account; 9 show all Three.**

## The two questions, answered from the text

**"What did Yahweh mean by like Us?"** The Torah answers three ways and all three land where the question landed. The image is stated of *them* — *"male and female created he them"* (1:27), and *"they shall be one flesh"* (2:24): a likeness of the Us is a communion, not a solitary. Likeness is **father-to-son** language — Adam *"begat a son in his own likeness, after his image"* (5:3), the exact pair from 1:26. And the resemblance shows as **self-giving**: Yahweh loves first and says so (Deut 7:7-8), covers at the cost of a life before anyone is asked to give anything (3:21) — and the men who most look like Him are the ones who offer their own lives. **Judah**: *"let thy servant abide instead of the lad"* (44:33) — and the sceptre goes to Judah (49:10). **Moses**: *"blot me, I pray thee, out of thy book"* (Ex 32:32). **Aaron**: *"he stood between the dead and the living"* (Num 16:48).

**"Tricked, or just as evil?"** The Torah **distinguishes the cases, and the distinction runs one way: the more direct the access, the less the text calls it deception.**

- **Eve** — *"The serpent beguiled me"* (3:13). Deception named once, for the party with the word secondhand.
- **Adam** — *"Because thou hast hearkened unto the voice of thy wife"* (3:17). No beguiling alleged; he had the command directly.
- **The serpent** — quotes the word accurately enough to twist it. The deceiver was not himself deceived.
- **The sons of God** — *"saw... took... chose"* (6:2). All volitional verbs; no deception in the sentence.
- **Balaam** — told outright *"thou shalt not go... for they are blessed"* (22:12), asks again (22:19), sees the Angel (22:31), has the Spirit come on him (24:2) — and then engineers by counsel the ruin he was forbidden to curse (31:16).
- **Nadab and Abihu** — *"which he commanded them not"* (Lev 10:1). A variation on a pattern they knew.
- **Korah** — brought *near* (16:9-10); nearness became the platform for the grab.
- **Israel** — *"for all the signs which I have shewed among them"* (14:11); *"before your eyes"* (Deut 29:2).

So the second message is what the record supports for the well-informed. But Deuteronomy 29:4 keeps it from becoming a lecture: *"Yet the LORD hath not given you an heart to perceive."* Seeing and perceiving are different faculties. The map holds both halves and **does not resolve the tension**, because the Torah does not.

## Rigour, enforced (DR-0076)

Every claim in the module header is a test, not a promise:

1. **Two tiers, never blurred.** Every pattern declares `basis: 'named' | 'shown'`. A `shown` pattern **must** carry a `confession` marked as ours; a `named` pattern **must not** smuggle one in. 68 named, 10 confessed.
2. **Nothing outside the first five books** — 124/124 refs verified at their exact address in the in-repo KJV.
3. **Books derived, never typed** — a hand-typed `books` field fails the build (DR-0121).
4. **Every count is a recount** — family, book, person and enemy coverage are each re-derived in the gate; an enemy cannot appear in the roll without a pattern behind it.
5. **Where the text is reticent, we stop** (DR-0098) — Genesis 6 names the sons of God without explaining them, and the map says so rather than picking a school.

### Proven-to-catch (6 mutations, each confirmed to fail)

a ref reaching outside the Torah · a ref that does not resolve · a confessed reading relabelled `named` · a `shown` pattern losing its confession · Genesis 6 losing its reticence note · a family removed from the taxonomy.

### The theme guard caught me, and it was right

Four bespoke dark text colours for the Person chips failed AA on the midnight theme (ratios **1.95–3.14**). Fixed by distinguishing the Persons with **borders** and keeping text on palette tokens already proven in both themes. Recorded in the component so the next author does not retry it.

**Full suite: 12,543 passing.** Lint clean at `--max-warnings 0`.
