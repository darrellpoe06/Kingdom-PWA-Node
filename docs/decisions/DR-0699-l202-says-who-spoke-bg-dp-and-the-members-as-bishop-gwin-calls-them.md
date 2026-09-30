# DR-0699 — L202 says who spoke: BG, DP, and the members as Bishop Gwin calls them

- **Status:** accepted
- **Tier:** B
- **Type:** word + reader
- **Date:** 2026-09-30
- **Scope:** `app/src/lib/living-lessons-class.js` (L202: the full lesson, all four bands, the first facilitator point); `app/src/__tests__/living-lessons-l202-verses.test.js` (speaker pins, the tribute, the three witnesses); `app/src/lib/lesson-format.js` + `app/src/lib/learn-framework.js` (a spelled movement number stays with its title); `app/src/__tests__/spelled-movement-numbers-stay-with-their-titles.test.js` (new).
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), SPOKEN-TEACHINGS-ARE-BUILD-INPUT, WORD-FIRST, DECISION-RECORDS; DR-0331 (render for meaning, never guess); DR-0690 (L202); DR-0698 (the witnesses); DR-0700 (members named in public church sessions).
- **Grounds:** Darrell, 2026-09-30, verbatim: *"Differentiate between speakers... Bishop Gwin is BG... Darrell Poe is DP... etc..."* / *"Other congregation members are called by BG..."* / *"I'm building the App of course... I said that in the class"* / *"I'm DP of course...."*; on the youth band's steps 13-14: *"BG said the first part... I... DP said the neuroplasticity part... makes sense?"*; and *"Make sure Bishop Gwin and my wife Christina's mother BG's late wife is named in this lesson she made sure I went back to school to get my degree and also sent me and my wife on my first development training to build the church website etc..."* / *"Mary Gwin the churches south campus building is named after her...."*

## Context

L202 (DR-0690) was built from a Whisper transcript that marks no speakers, and said so by leaving every voice unnamed ("a class member", "another"). Darrell asked for the speakers to be told apart, named the two he knows (BG, DP), directed that members be called by the names Bishop Gwin uses, and asked that Bishop Gwin's late wife be honored.

## What was measured

The transcript (agent_inbox `aed9557b-333e-4152-adbc-de0f9e695793`, read through `inbox-lesson-body.yml` run 36770368206; the dotted base64 decoded to 16,511 bytes, the row's length) was read line by line. Who said what, and on what evidence:

| words | speaker | evidence |
|---|---|---|
| the numbered points, the Scripture read aloud, "Are you with me?" | BG | the notes (DR-0698) give the same points in the same order |
| "Now get this... at orientation... one of the three of you won't make it" | BG | runs straight on from his point about the university, in his own recurring "get this" |
| "I always wanted to succeed the way I wanted to... until I got in the Word... trust God" | BG | Darrell's own account (youth steps 13-14) |
| "You better get busy then"; "That's a beautiful day" | BG | the teacher answering the room |
| "I'm actually in technology... building the application... 50 courses... 750 lessons" | DP | Darrell's own account ("I said that in the class"); the numbers match PoeTech |
| "they used to think the brain couldn't grow... neuroplasty... not just in the third dimension, in the fourth dimension" | DP | Darrell's own account; the fourth-dimension frame is his (CLAUDE.md, DR-0097) |
| the chancellor who wanted to be "a good ancestor" | Janelle | "Janelle." stands alone immediately before she speaks |
| "Elder Mosley", "Evangelist Queen" | named as ones who came before, not speakers | said in answer to "somebody came before us" |
| "Christiana... at the University of Illinois... AI tells you I make mistakes. You have to check AI" | **not marked** | the lesson says the recording does not mark who told it or who gave the rule |
| "let God be right and let us be liars" (Romans 3:4) | **not marked** | runs on from DP's words with no break; not assigned |
| "I'm going to call my wife's name"; "the best knowledge... is in the graveyard"; "a year later you see so many more"; "I wasn't in the church until I was grown" | **not marked** | said so in the lesson |

Names the transcript carries, and how the lesson uses them: **Janelle** (the chancellor account); **Elder Mosley** (named among those who came before); **"Evangelist Queen"**, most likely *Evangelist Gwin* misheard, rendered "as best the recording can be read" with the machine's spelling beside it; **"Osia Mama"**, garbled, not rendered and not guessed (the test fails if it appears); **"Christiana"**, rendered **Christina, Darrell's wife** at the coordinator's direction from Darrell's context, with the machine's spelling kept in the full lesson; this identification is the one reading here that rests on context rather than the recording, and is flagged for Darrell to confirm.

**The tribute.** Bishop Gwin's late wife is named from Darrell's word and the church's own site: **Evangelist Mary E. Gwin**, Christina's mother, who made sure Darrell went back to school for his degree and sent Darrell and Christina to his first development training to build the church's website; the church's south campus building is the **E-MEG Christian Center** (Evangelist Mary E. Gwin Christian Center), which hosts teaching including business and IT education. It sits in the legacy movement, in every band.

**The number Darrell saw ("5STAY IN THE WORD").** Measured on the youth band before the fix: the sentence cutter split the author's "SEVEN." from its title, the caps-heading pass numbered only the five titles it recognised (so STAY IN THE WORD rendered as 5), and "SEVEN." dangled at the end of step 13. The pacer could also end a step on a bare number, or open one on `" (Romans 8:35).` After the fix the youth band renders ONE to NINE as 1 to 9, and no step of any Living Lesson ends on a bare movement number or opens on a quotation's tail.

## Impact

The lesson now says who taught, who testified, and who built the app, and says plainly where the recording does not show a speaker. The formatter fix reaches every lesson written with spelled movement numbers (24 Living Lessons use them) and the "PIECE FIVE." / "PATTERN TWO." form; no word of any lesson changes.

## Decision

L202 names BG and DP where the transcript and Darrell's account place them, names members only as the recording shows them (DR-0700), leaves unmarked lines unassigned, adds Bishop Gwin's own title and five points as the third witness, and honors Evangelist Mary E. Gwin in all four bands and the full lesson. The provenance lines that said the class stays unnamed now say the speakers were identified from the recording's context and Darrell's own account. The formatter and the pacer keep a spelled movement number with its title.

## Verification

- `living-lessons-l202-verses.test.js` 24/24: 21 speaker pins across the lesson and all four bands; a name may not wander off its words; the machine's spellings appear only beside "the machine wrote"; the tribute in every text (name, relationship, school, website, E-MEG Christian Center); the three witnesses. **Proven to catch** in the suite: Janelle moved onto Bishop Gwin's testimony, DP dropped from the teen band, and a guessed "Osia Mama" each fire.
- `spelled-movement-numbers-stay-with-their-titles.test.js` 8/8: L202's nine movements carry the author's numbers in every band; no step anywhere ends on a bare number or opens on a quotation's tail; pacing drops and reorders no character (L197 to L202, every band). Before the fix the youth band rendered 6 badges numbered 1 to 6 (STAY IN THE WORD as 5).
- Unchanged: `lesson-format`, `the-points-are-numbered-once-per-lesson`, `age-adaptive`, `lesson-flow`, `course-bands-reach-the-reader`, `lesson-walk`, `surface-hollow-guard`, `presenter-notes-carry-the-lesson`, `lesson-127-is-the-standard`, `learn-flow-reads-clean-refs-below`, `read-all-reads-every-step` all green.
- `re-review: 2026-10-07` — the church's video (DR-0698) as the second recording: confirm or correct each unmarked line and the Christina reading.
