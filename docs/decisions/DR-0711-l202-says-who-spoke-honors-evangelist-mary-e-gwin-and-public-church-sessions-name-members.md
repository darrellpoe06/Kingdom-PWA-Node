# DR-0711 — L202 says who spoke (BG, DP, and the members as Bishop Gwin calls them), honors Evangelist Mary E. Gwin, and a church session the church posts publicly names its members

- **Status:** accepted
- **Tier:** B (a lesson, a formatter fix, and a bounded privacy exception to DR-0333 §6)
- **Type:** word + reader + privacy
- **Date:** 2026-09-30
- **Scope:** `app/src/lib/living-lessons-class.js` (L202: the full lesson, all four bands, the first facilitator point); `app/src/__tests__/living-lessons-l202-verses.test.js` (speaker pins, the tribute, the three witnesses); `app/src/lib/lesson-format.js` + `app/src/lib/learn-framework.js` (a spelled movement number stays with its title); `app/src/__tests__/spelled-movement-numbers-stay-with-their-titles.test.js` (new).
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), SPOKEN-TEACHINGS-ARE-BUILD-INPUT, WORD-FIRST, DECISION-RECORDS; DR-0331 (render for meaning, never guess); DR-0690 (L202); DR-0712 (the witnesses); the public-session rule below.
- **Grounds:** Darrell, 2026-09-30, verbatim: *"Differentiate between speakers... Bishop Gwin is BG... Darrell Poe is DP... etc..."* / *"Other congregation members are called by BG..."* / *"I'm building the App of course... I said that in the class"* / *"I'm DP of course...."*; on the youth band's steps 13-14: *"BG said the first part... I... DP said the neuroplasticity part... makes sense?"*; and *"Make sure Bishop Gwin and my wife Christina's mother BG's late wife is named in this lesson she made sure I went back to school to get my degree and also sent me and my wife on my first development training to build the church website etc..."* / *"Mary Gwin the churches south campus building is named after her...."* And, deciding the privacy question: *"the recordings are online and members already know they are public so this is an exception because we already by action know it's public so we use names to further personalise our collective experience... also I believe people will be more engaged because of these workflows..."*


## Context

L202 (DR-0690) was built from a Whisper transcript that marks no speakers, and said so by leaving every voice unnamed ("a class member", "another"). Darrell asked for the speakers to be told apart, named the two he knows (BG, DP), directed that members be called by the names Bishop Gwin uses, and asked that Bishop Gwin's late wife be honored.

DR-0333 §6 keeps congregation members named in services out of lessons, and DR-0639 names a member only when the member chooses. L202 is a Bible study the church itself records and posts publicly, and Darrell directed that its members be called by the names Bishop Gwin uses. His first line ("Other congregation members are called by BG...") was ambiguous; he then decided the question in the words above.

## What was measured

The transcript (agent_inbox `aed9557b-333e-4152-adbc-de0f9e695793`, the voice-transcript row `of:d2f21ba3-ab40-496d-ae62-e4a3e2ff8298`, read through `inbox-lesson-body.yml` run 36770368206; the dotted base64 decoded to 16,511 bytes, md5 `a30e4942e161b7833c6cef051b8ab6fd`; line numbers below are that text's) was read line by line. Who said what, and on what evidence:

| words (transcript line) | speaker | evidence |
|---|---|---|
| the numbered points, the Scripture read aloud, "Are you with me?" (throughout) | BG | Bishop Gwin's own notes (DR-0712) give the same points in the same order |
| "Now get this... at orientation... one of the three of you won't make it" (L14-L24) | BG | runs straight on from his point about the university, in his own recurring "get this" |
| "I always wanted to succeed the way I wanted to... until I got in the Word... two steps and then come back... maybe I should just trust God" (L316-L336) | BG | Darrell's own account; the lesson ties it to "the same plan yesterday is the same plan today" (L343-L345, Hebrews 13:8) |
| "You better get busy then"; "That's a beautiful day" (L96, L84, L106) | BG | the teacher answering the room |
| "I'm actually in technology... building the application... 50 courses... 750 lessons" (L98-L105) | DP | Darrell's own account ("I'm building the App... I said that in the class"); the numbers match PoeTech |
| "AI tells you I make mistakes. You have to check AI... You still use AI" (L120-L130) | DP | Darrell's own account: the check-every-source-by-the-Word part is his |
| "they used to think the brain couldn't grow... neuroplasty... not just in the third dimension, in the fourth dimension" (L381-L405) | DP | Darrell's own account; the fourth-dimension frame is his (CLAUDE.md, DR-0097) |
| "you have to stay in it... a year later" (L408-L412) | DP | Darrell's own account: the STAY IN THE WORD part (Romans 12:2) is his; the lines run on from his with no break |
| "let God be right and let us be liars" (L406-L407; Romans 3:4) | a member of the congregation, name not shown | Darrell's account names a congregation member; the recording carries no name, so none is given |
| the chancellor who wanted to be "a good ancestor" (L72-L83) | Janelle | "Janelle." stands alone immediately before she speaks (L71) |
| "Elder Mosley", "Evangelist Queen" (L31-L33) | named as ones who came before, not speakers | said in answer to "somebody came before us" (L28) |
| "Christiana... at the University of Illinois" (L108-L118) | **not marked** | the teller is not shown; the lesson says so |
| "I'm going to call in my wife's name"; "the best knowledge... is in the graveyard"; "I wasn't in the church until I was grown" (L39, L89, L63-L70) | **not marked** | said so in the lesson |

Names the transcript carries, and how the lesson uses them: **Janelle** (the chancellor account); **Elder Mosley** (named among those who came before); **"Evangelist Queen"**, most likely *Evangelist Gwin* misheard, rendered "as best the recording can be read" with the machine's spelling beside it; **"Osia Mama"**, garbled, not rendered and not guessed (the test fails if it appears); **"Christiana"**, rendered **Christina, Darrell's wife** at the coordinator's direction from Darrell's context, with the machine's spelling kept in the full lesson; Darrell confirmed the reading (the transcript's "Christiana" is Christina, his wife).

**The tribute.** Bishop Gwin's late wife is named from Darrell's word and the church's own site: **Evangelist Mary E. Gwin**, Christina's mother, who made sure Darrell went back to school for his degree and sent Darrell and Christina to his first development training to build the church's website; the church's south campus building is the **E-MEG Christian Center** (Evangelist Mary E. Gwin Christian Center), which hosts teaching including business and IT education. It sits in the legacy movement, in every band.

**The number Darrell saw ("5STAY IN THE WORD").** Measured on the youth band before the fix: the sentence cutter split the author's "SEVEN." from its title, the caps-heading pass numbered only the five titles it recognised (so STAY IN THE WORD rendered as 5), and "SEVEN." dangled at the end of step 13. The pacer could also end a step on a bare number, or open one on `" (Romans 8:35).` After the fix the youth band renders ONE to NINE as 1 to 9, and no step of any Living Lesson ends on a bare movement number or opens on a quotation's tail.

**Public posting.** The church posts its services and weekly studies to its public channel (DR-0333, `choir_sermons` rows with `source = youtube`), and the members speak knowing the session is recorded and posted. The names in L202's transcript are listed in DR-0711.

## Impact

The lesson now says who taught, who testified, and who built the app, and says plainly where the recording does not show a speaker. The formatter fix reaches every lesson written with spelled movement numbers (24 Living Lessons use them) and the "PIECE FIVE." / "PATTERN TWO." form; no word of any lesson changes.

Named members make the lesson the church's own record of its study, and Darrell expects more engagement from it. The risk is exposure of something a person would not want in a lesson; the limits below hold that.

## Decision

**L202.** L202 names BG and DP where the transcript and Darrell's account place them, names members only as the recording shows them (below), leaves unmarked lines unassigned, adds Bishop Gwin's own title and five points as the third witness, and honors Evangelist Mary E. Gwin in all four bands and the full lesson. The provenance lines that said the class stays unnamed now say the speakers were identified from the recording's context and Darrell's own account. The formatter and the pacer keep a spelled movement number with its title.

**Members named in a public church session** (an exception to DR-0333 §6, scoped to sessions the church itself posts publicly):

1. **The exception.** For a church session the church itself posts publicly (the class recording and its video), members are named as the teacher calls them in the recording. The public posting is the members' consent by action.
2. **Only names the recording shows.** A name is attached only to the words the recording attaches it to. A name is never guessed onto a voice; a garbled name is not rendered; where the recording does not show who spoke, the lesson says so.
3. **Sensitive details stay out, even for a named person:** health and sick lists, giving amounts, family trouble, and anything said in confidence. Naming a person never carries these with it.
4. **Sessions not posted publicly keep the old rule:** DR-0333 §6 and DR-0639 apply unchanged.
5. **Darrell and Bishop Gwin** are named as DP and BG, as directed.

**The title carries her name** (Darrell, 2026-09-30, "so people can find it easily"): L202 is now *Prepared Before the Position — Homecoming, Mary Gwin's Legacy, Good Success, and Represent*. The lesson id is unchanged, so saved places, progress, shares and dates keep working. Its tags (Mary Gwin, Evangelist Mary E. Gwin, E-MEG Christian Center, Bishop Gwin) let the Learn finder (`searchLessons`) find it by "Mary Gwin", "Gwin", "E-MEG" or "Evangelist Mary E. Gwin".

## Verification

- `living-lessons-l202-verses.test.js` 26/26: the finder returns L202 for all four searches, "Mary Gwin" ranks it first, and without the tags "E-MEG" finds nothing (proven to catch); 29 speaker pins across the lesson and all four bands; a name may not wander off its words; the machine's spellings appear only beside "the machine wrote"; the tribute in every text (name, relationship, school, website, E-MEG Christian Center); the three witnesses. **Proven to catch** in the suite: Janelle moved onto Bishop Gwin's testimony, DP dropped from the teen band, and a guessed "Osia Mama" each fire.
- `spelled-movement-numbers-stay-with-their-titles.test.js` 8/8: L202's nine movements carry the author's numbers in every band; no step anywhere ends on a bare number or opens on a quotation's tail; pacing drops and reorders no character (L197 to L202, every band). Before the fix the youth band rendered 6 badges numbered 1 to 6 (STAY IN THE WORD as 5).
- Unchanged: `lesson-format`, `the-points-are-numbered-once-per-lesson`, `age-adaptive`, `lesson-flow`, `course-bands-reach-the-reader`, `lesson-walk`, `surface-hollow-guard`, `presenter-notes-carry-the-lesson`, `lesson-127-is-the-standard`, `learn-flow-reads-clean-refs-below`, `read-all-reads-every-step` all green.
- `re-review: 2026-10-07` — the church's video (DR-0712) as the second recording: confirm or correct each unmarked line, and name the member who read Romans 3:4 if the video shows it.
- L202's test pins each name to its words and fails when a name moves onto other words or a garbled name is guessed (below).
- The speaker-labeling rules in DR-0712 carry the same limits into the pipeline.
