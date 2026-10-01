# DR-0727 — L202 carries Evangelist Mary E. Gwin's service, by Darrell's own account

- **Status:** accepted
- **Tier:** B (lesson content naming a church elder, by her family's own word)
- **Type:** word
- **Date:** 2026-10-01
- **Scope:** `app/src/lib/living-lessons-class.js` (L202: the lesson body and all four bands, in the legacy movement); `app/src/__tests__/living-lessons-l202-verses.test.js` (the pin).
- **Principles:** SPOKEN-TEACHINGS-ARE-BUILD-INPUT, VERIFICATION-DOCTRINE (DR-0076), YAHWEH-IN-OUR-VOICE (DR-0210), DECISION-RECORDS; DR-0331 (render for meaning); DR-0711 (L202's tribute and the public-session naming rule).
- **Grounds:** Darrell, 2026-10-01, verbatim: *"Mary Gwin was also the choir director and taught Christina who is now the director... she was also an adult education teacher and that is how she also served the body of Christ and the community... I was running rent to own stores and she thought I could be more based on our interactions and had my wife enroll me into Parkland College to get my associates degree etc... I ended up getting my MBA-IT and am certified in a lot of areas such as PMP, ITIL, A-Plus etc... all because of her influence she has been and will continue to be a source of inspiration for me and my family members... we pray we can make her appreciate our service on earth like we appreciate hers..."* And later the same day: *"explain in the lesson... how the lesson is also captured in the video format and how the PoeTech App build also gets the transcription from YouTube and cross-referenced with the recording at the Bible Study session today... just to describe how Yahweh helps us help us and it automatically adds to our Love Corner App... The sound steps so it's known... so it can spark a person to get involved and or help build... Or explain the build and what it does vs what we want and we expect and will make sure it's accomplished and He is pleased..."*

## Context

DR-0711 honors Evangelist Mary E. Gwin in L202's legacy movement: Bishop Gwin's late wife, Christina's mother, the one who sent Darrell back to school and to his first development training, and the woman the E-MEG Christian Center is named for. On 2026-10-01 Darrell added more of her service and of what it did in his life.

## What was measured

These words are Darrell's own account, given after the class. They are not in the class recording, and the lesson says so ("Darrell's own account, given after the class", "Darrell added more after the class"). The facts are carried exactly as he gave them, rendered for meaning (DR-0331):

- She was the choir director, and she taught Christina, who now directs the choir.
- She was an adult education teacher. That is how she served the body of Christ and the community.
- While Darrell was running rent-to-own stores, she saw he could be more and had Christina enroll him at Parkland College. He went on to an associate degree, then an MBA in IT, then certifications such as PMP, ITIL and A+. In his words, all of it came from her influence.
- She is still an inspiration to his family, and they pray their service honors hers as they honor it.

No date, place or detail was added beyond his words. No verse was added. In our voice, Yahweh is thanked as the One who placed her (DR-0210).

**The sound's steps, and the build as it is.** The church-video-witness run for 2026-09-30 (run 36798050879, 01:00 UTC) listed the channel's newest service dates (2026-09-27 the latest) and found **0 rows for 2026-09-30**: the class video was not posted, or not yet pulled in, when the lesson was built. So the cross-reference Darrell describes is a real part of the build (DR-0333 pass two, DR-0712 the second witness) that had not yet run for this class. The lesson says that plainly in every reading, and never says the check happened. What did happen for this class, and is stated: the recording inside the app, the words made on our own machine, the three witnesses laid side by side, the Word checked verbatim, the five readings, and the lesson appearing in both the PoeTech app and The Love Corner (Church > Learn's default course is Living Lessons, `ChurchLearn.jsx`), without a copy step. Voice-marked speakers (DR-0712) landed on main after this class was recorded, so the lesson says its speakers were worked out from the recording and Darrell's account.

## Impact

The tribute now shows what her preparing looked like: a choir passed to the next director, adults taught, and one man moved from a store counter to a degree. That is the lesson's own thesis, prepared before the position, lived by a person the class knew. A reader searching for her (DR-0711's title and tags) finds the whole account.

## Decision

L202's lesson body and all four bands carry Darrell's account of Evangelist Mary E. Gwin's service, attributed to him and not to the recording. The account sits in the legacy movement, right after the E-MEG Christian Center. It is warm and brief, it keeps his facts unchanged, and it gives thanks to Yahweh for her.

Each of the five readings closes with **HOW THIS LESSON CAME TO YOU, AND WHAT WE ARE BUILDING**: the sound's steps as they happened for this class; what we want and expect (the channel's words read by our own machine and laid beside the recording as a second witness; speakers told apart by voice); the plain truth that the video had not been posted yet so that check still waits and runs on its own when it lands; that none of it is finished and we will make sure it is accomplished in a way that pleases Him; Yahweh helping us help one another, grounded in Galatians 6:2 (KJV, verbatim); and the invitation to get involved or help build. Each reading also says what house this lesson is one room of: the Word-first digital learning center Darrell is building (his words, 2026-10-01: *"explain I'm building a Word first digit learn center... with all subjects... list the current ones... so it sparks curiosity"*), with the departments named and a dated count read from the live registry that day (`learnDepartments(buildCatalogCourseDescriptors())`: 12 departments, 43 courses, 593 lessons), each reading saying "when this was written" so growth never makes it a lie. Rendered for meaning from Darrell's words (DR-0331). **re-review: 2026-10-08** — when the channel row for 2026-09-30 exists, run the witness with the text printed and record in a new DR what the second witness corrected.

## Verification

- `living-lessons-l202-verses.test.js` 36/36 (three more pin the learning center: the dated count and "More is added" in every reading, ten department names in the adult, youth, teen and senior readings, the subjects in a child's words in the child reading). Before those, 33/33 (four added for the closing passage: the steps in every reading; the truth about the video, including that no reading claims the check ran; what we want, that it will be accomplished, that He is pleased, the invitation; Galatians 6:2 verbatim against the corpus). Each fails against a reading without the passage. The earlier 29 pass unchanged.
- `living-lessons-l202-verses.test.js` 29/29. The new pin requires every band and the lesson to carry "choir director", "Christina, who now directs the choir", "adult education", "Parkland College", "MBA" and "rent-to-own stores", the attribution to Darrell's account, and thanks to Yahweh. A text missing any one of these fails. The speaker-pin check still holds a sentence that names Christina to her own words.
- Green: `reading-level-gate`, `living-lessons-full-levels`, `band-differentiation-gate`, `living-lessons-age-appropriateness`, `american-spelling`, `doubled-word-guard`, `the-intro-reads-at-the-learners-level`, `presenter-notes-carry-the-lesson`.
