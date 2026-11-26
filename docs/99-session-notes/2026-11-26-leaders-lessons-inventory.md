# Leaders' lessons inventory: teaching WHAT they said, not only ABOUT them

**Date:** 2026-11-26 · **Layer 4 (working)** · Step 1 of Darrell's directive: *"Do the same for all our leaders lessons!!!!"*. The bar is the one the Malcolm X lesson (DR-1599) is being held to: a lesson built around a named person's message should teach **what that person actually said**. That means his argument, his evidence, his own lines from fetched sources, and his call to action. Biography, praise or a summary of him is not enough.

## What was scanned

- **Every mounted Learn course.** All 1,005 lesson rows were read live through `LEARN_CATALOG` (`app/src/lib/learn-catalog.js`) and the six Eternal Algorithms courses (`app/src/lib/eternal-algorithms-course.js`), loaded with `vite-node` so each row is exactly what the app mounts. That is 51 course keys.
- **Fields checked on each row:** `voice` / `voices` / `figures` / `sources` / `video` / `issue.source`, the title, and the adult `lesson` text. That text was searched for titled names (Dr., Pastor, Bishop, Apostle, Professor), for names that repeat through the text, and for provenance phrases ("teaching by", "interview", "video", "essay", "lecture", "conversation with").
- **Also read:** `app/src/lib/learn-crosslist.js` (pointers only, no lesson text of its own; its leader rows are `pv-price/diop/obenga/williams/inventions`, all covered below), `app/src/lib/economics-class.js` (Priestley, Price), and `app/src/lib/learn-presentation/presentation-records.json` (promotional titles and thumbnails only, no lesson text, so nothing to judge).
- **Working tree:** this read is of the checked-out branch `claude/prophetic-voices-lessons`, which has uncommitted edits in `app/src/lib/prophetic-voices/{diop,munroe-1,munroe-2,obenga,williams}.js` from the session rewriting that course. The Prophetic Voices rows reflect those edits.

## What is in scope, and what was left out (with the reason)

**In:** lessons whose subject is one named person's teaching or message: modern or historical teachers, preachers, scholars, scientists, activists and authors. A two-voice conversation counts as one row under its main voice.

**Out:**
- **Bible figures as subjects.** These are taught from the Word itself: all six Eternal Algorithms courses (156 rows), Little Learners, Who He Is, Handed Forward, and the Real Estate and finance courses built on Scripture narratives.
- **Principle-centered research lessons whose `voices` card already carries a verbatim, fetched line.** These are History: Truth (8), Historical Research 1619 (8), Who Invented the Car (6) and Business Research Wars (9). Each lesson teaches a method (the standard, the record, two or three witnesses), and the speaker is a witness to it, not the subject. They already meet the "own words, fetched" bar.
- **News and newsletter sends where no leader's teaching is the subject.** These include Morning Brew and NPR items in World Issues, `sov30/54/55/74`, and the Jensen Huang and Palmer Luckey business news in `ll239/310/319/321`.
- **Commentary creators critiqued as a discernment exercise.** These are `wi-musk-creator-critique` (DAT BOY WILL), `wi-musk-prophetic-lens` (Nick Jones), `wi-tuition-and-the-1965-act` (Learning with Lindsay) and `wi-the-way-was-45-minutes-long` (Monte Mader). Each already lays out the creator's claims in `issue.claims`. Add them in step 2 if Darrell wants them held to the same bar.
- **Sends with no named speaker:** `ll117` (unnamed podcast clip), `ll187` (gaokao video), `ll257` (unidentified street interview), `ll290` (unnamed science video), `ll199` (an email invitation only), and `ll12` (roundtable, with no name in the adult text).
- **The house's own voices captured first-hand.** These are Darrell's spoken teachings (most of Living Lessons) and `ll42` (Christina Poe's testimony). Their words are captured directly, so there is nothing to fetch. Also left out are incidental Bishop Gwin mentions (`ll205/206/257`, `sov32`, `dsi14`).
- **Sayings and collective records:** `ll302/303` (the Burke saying) and `ll134` (a record of several inventors, not one teacher).

## How each lesson was judged

The judgment comes from reading the adult `lesson` text, helped by counts of quotes attributed to the leader and of provenance phrases ("as summarized", "not reproduced", "the occasion", "rendered for meaning", "captions", "transcript").

- **WHAT:** the lesson lays out the person's argument and quotes their own lines from a fetched or cited source (book page, paper, essay, transcript).
- **PARTIAL:** the person's points are laid out, but in our paraphrase. The source is usually a handed-in summary, an uncited interview, or captions "rendered for meaning", so few or none of the person's own lines appear. The structure is there; the person's own words are not.
- **ABOUT:** the person is only the occasion, a biography, a single supporting quote, or a one-claim springboard. Sometimes the lesson says outright that the message is "not reproduced". Their message is not taught.

## Counts

- **92 rows** across 7 courses: Living Lessons 48, Prophetic Voices 16, Healthy Living 11, Made in Time 6, Sovereign A.I. 4, World Issues 5, Kingdom Economics 2.
- **ABOUT-only: 15.** 12 of these are live lessons. The other 3 are Prophetic Voices openers already being rewritten.
- **PARTIAL: 66**, 3 of them in-progress openers.
- **WHAT: 11.** These are the 10 Prophetic Voices message lessons built from fetched books and UNESCO papers, plus `sov10` (Andrey Mir's essay).
- The **six Prophetic Voices openers** (`pv-price`, `pv-darby`, `pv-diop`, `pv-obenga`, `pv-williams`, `pv-inventions`) are marked **(in progress)**. They are listed for completeness, and step 2 should not redo them.
- **Pattern:** the "send a link, get a lesson" lane (Living Lessons from about L60 on, Sovereign A.I., World Issues) mostly worked from **summaries**, not transcripts. So the speaker's argument usually survives as paraphrase while his own lines do not. Most fixes are therefore a captions fetch (NAS route) plus re-teaching from the person's words. One fix is already half done: the Denis Noble captions sit in `docs/99-session-notes/sources/denis-noble-misled-about-biology/`.

## Sources

"YouTube captions (NAS route)" means `.github/workflows/source-transcript-nas.yml`: one video per run, pushed to `docs/99-session-notes/sources/<slug>/`. YouTube itself needs no new host. A host marked "(likely)" is the speaker's known home on the web and has not been fetched or verified in this session. "none (own NAS)" means a house recording that is already transcribed on our own server.

## The inventory (thinnest first: ABOUT, then PARTIAL, then WHAT; word count ascending within each)

| # | lesson id | course key | leader | adult `lesson` words | WHAT vs ABOUT | best source road | likely hosts |
|---|---|---|---|---:|---|---|---|
| 1 | `pv-price` (in progress) | prophetic-voices | Dr. Frederick K.C. Price | 280 | **ABOUT**: In progress (opener). 280 words: a profile and a one-line thesis of the 1997 series; none of his own lines. | YouTube captions (NAS route) (youtu.be/Nx44eoRK8z8 already linked) | crenshawchristiancenter.net (likely) |
| 2 | `pv-inventions` (in progress) | prophetic-voices | Uncredited Black inventors (Latimer, Woods, Montgomery, Jennings) | 385 | **ABOUT**: In progress (opener). A collective record (Latimer, Woods, Montgomery, Jennings); no single voice's words. | Public record (patents, court records) | patents.google.com; archive.org |
| 3 | `pv-darby` (in progress) | prophetic-voices | Pastor Stephen Darby | 444 | **ABOUT**: In progress (opener). 444 words: identity and ministry profile; his teaching is named, not laid out. | YouTube captions (NAS route) | none beyond YouTube |
| 4 | `ll7-let-peace-be-the-umpire` | living-lessons | Dr. Martin Picard | 628 | **ABOUT**: Borrows his word 'mitoception' and moves on; his teaching is not laid out. | YouTube captions (NAS route) | pubmed.ncbi.nlm.nih.gov |
| 5 | `econ6-accountability-and-judgment` | kingdom-economics | Dr. Frederick K.C. Price (supporting voice) | 703 | **ABOUT**: Price is a single supporting witness (one line) inside an accountability lesson; his series is not taught. | YouTube captions (NAS route) (Nx44eoRK8z8) | none beyond YouTube |
| 6 | `ll3-bodybuilding-christ` | living-lessons | Dr. Martin Picard | 765 | **ABOUT**: One claim from 'the interview' (mitochondrial origin) used as a springboard; his argument is not laid out. | YouTube captions (NAS route) | pubmed.ncbi.nlm.nih.gov |
| 7 | `ll4-dying-to-live` | living-lessons | Dr. Martin Picard | 776 | **ABOUT**: One claim (mitochondrial veto, apoptosis) as springboard; no lines of his, no source. | YouTube captions (NAS route) | pubmed.ncbi.nlm.nih.gov |
| 8 | `ll5-take-no-thought-for-tomorrow` | living-lessons | Dr. Martin Picard | 940 | **ABOUT**: One stress-cost figure attributed to his research; the lesson is the Word on worry. | YouTube captions (NAS route) | pubmed.ncbi.nlm.nih.gov |
| 9 | `ll44-safe-to-speak-psychological-safety` | living-lessons | Prof. Amy Edmondson | 1129 | **ABOUT**: Her concept is named and defined in one line beside Google's study; her argument and evidence are not taught. | Journal article + Google re:Work | journals.sagepub.com; rework.withgoogle.com |
| 10 | `ll56-the-person-of-the-holy-spirit-seek-the-deliverer-not-deliverance` | living-lessons | Apostle Enrique Pascal (with Ezekiel Azonwu) | 1453 | **ABOUT**: 'Take it as the occasion, not the authority'; one of his points ('spirit of rush') before the Word takes over. | YouTube captions (NAS route) | none beyond YouTube |
| 11 | `ll337-not-far-from-the-kingdom` | living-lessons | Malcolm X | 2437 | **ABOUT**: Read only from summaries ('as summarized'); his points are reduced to one-line paraphrase and the body is the Word on each topic. None of his own words. | YouTube captions (NAS route) for the 1964 interview + public-record speech texts | archive.org; americanradioworks.publicradio.org (likely) |
| 12 | `sov91-know-the-state-of-thy-flocks` | sovereign-ai | Shreya Shankar & Hamel Husain | 2600 | **ABOUT**: 'The excerpt is only the occasion'; the book's method is not taught in its words. | Book excerpt text | blog.bytebytego.com; hamel.dev |
| 13 | `ll124-equipped-to-win-the-hour-you-are-losing-the-word-again-and-the-man-who-did-not-want-the-job` | living-lessons | Bishop Lloyd E. Gwin | 4117 | **ABOUT**: States outright that 'the message itself is not reproduced'; the lesson is our prose from the verses his study opened. | House recording (Wednesday study, NAS Whisper) | none (own NAS) |
| 14 | `ll188-the-acceptable-year-and-the-whole-counsel` | living-lessons | Dr. Tony Evans (with Benjamin Watson) | 4318 | **ABOUT**: 'The brief is the occasion'; Darrell's two shouts are the lesson. One Evans point is referenced. | YouTube captions (NAS route) (The Just Life episode) | tonyevans.org (likely) |
| 15 | `ll129-you-have-a-destiny-the-giver-the-window-covenant-authority-the-heart-of-flesh-and-the-me-that-has-to-die` | living-lessons | Joseph Prince | 4710 | **ABOUT**: 'Credited by name, treated as the occasion, and not reproduced.' | YouTube captions (NAS route) | josephprince.com (likely) |
| 16 | `ll14-ten-healed-one-whole` | living-lessons | Bishop Lloyd E. Gwin | 438 | **PARTIAL**: Retells where his sermon went (Luke 17), but none of his own sentences; the recording is not cited. | House recording (Thinking Space/NAS Whisper) | none (own NAS) |
| 17 | `mit13-the-reward-is-in-the-race` | made-in-time | Erin Meryl | 555 | **PARTIAL**: 555 words: her dopamine-as-pursuit point paraphrased; no source. | YouTube captions (NAS route) | none beyond YouTube |
| 18 | `ll10-strength-and-honour-are-her-clothing` | living-lessons | Drs. Haver, Wright, Crawford, Sims (panel) | 650 | **PARTIAL**: A four-expert roundtable's points summarized together; no single argument and no lines. | YouTube captions (NAS route) | none beyond YouTube |
| 19 | `mit9-power-into-knowledge` | made-in-time | Phillip Ackerman | 690 | **PARTIAL**: PPIK theory summarized with two coined terms; no paper cited. | Journal papers | pubmed.ncbi.nlm.nih.gov |
| 20 | `mit6-effort-attention-and-rest` | made-in-time | Dr. Andrew Huberman | 755 | **PARTIAL**: His change mechanism paraphrased in a short lesson; no source cited. | YouTube captions (NAS route) (Huberman Lab) | hubermanlab.com |
| 21 | `ll62-the-age-of-counterfeits-meekness-over-manipulation` | living-lessons | Taylor Welch | 774 | **PARTIAL**: The spine of his discussion paraphrased; 774 words, no lines. | YouTube captions (NAS route) | none beyond YouTube |
| 22 | `mit7-systems-over-willpower` | made-in-time | Dr. Justin Sung | 786 | **PARTIAL**: His systems-over-willpower case paraphrased; no source or lines. | YouTube captions (NAS route) | none beyond YouTube |
| 23 | `mit16-doers-not-hearers-only` | made-in-time | Dr. Terry Sejnowski | 809 | **PARTIAL**: His two-modes-of-learning claim paraphrased; no source. | YouTube captions (NAS route) | none beyond YouTube |
| 24 | `econ8-test-build-multiply` | kingdom-economics | Daniel Priestley | 817 | **PARTIAL**: Test, build, multiply frameworks paraphrased with short phrases; no source cited, no lines of his. | YouTube captions (NAS route) (his long-form talks) | dent.global (likely) |
| 25 | `ll32-salt-light-and-anchor-the-church-in-the-city` | living-lessons | Dr. Carolyn Randolph-Kato | 822 | **PARTIAL**: Her three roles (anchor, asset, ...) listed; no source, none of her lines. | YouTube captions (NAS route) | none beyond YouTube |
| 26 | `mit12-predictive-brain-body-budget` | made-in-time | Dr. Lisa Feldman Barrett | 933 | **PARTIAL**: Predictive-brain and body-budget ideas paraphrased with one line; no source. | YouTube captions (NAS route) + her books | lisafeldmanbarrett.com |
| 27 | `ll35-sovereign-and-small` | living-lessons | Manolo Remiddi | 947 | **PARTIAL**: His local-AI 'digital sovereignty' build described; the talk is the occasion. | YouTube captions (NAS route) | none beyond YouTube |
| 28 | `ll15-seasoned-with-salt` | living-lessons | Prof. Alison Wood Brooks | 999 | **PARTIAL**: Her TALK framework laid out letter by letter; no source cited, none of her lines. | Book/article text + talks | hbr.org (likely) |
| 29 | `ll18-the-flinch-comes-first` | living-lessons | Dr. Tracey Marks | 1053 | **PARTIAL**: Her two-speed-brain teaching paraphrased; one quoted prompt; no source cited. | YouTube captions (NAS route) | none beyond YouTube |
| 30 | `ll60-fearfully-and-wonderfully-maintained-thyroid-hair-temple` | living-lessons | Dr. Samantha Jean & Dr. Gerdie Jean-Smith | 1167 | **PARTIAL**: Their thyroid teaching reported as theirs (four causes); no lines, no source. | YouTube captions (NAS route) | none beyond YouTube |
| 31 | `sov12-the-engineering-disaster` | sovereign-ai | Ayana (Center for Democratic AI) | 1207 | **PARTIAL**: Her argument summarized; only the Atlantic headline is quoted. | YouTube captions (NAS route) + the Atlantic essay | theatlantic.com |
| 32 | `ll29-the-unseen-realm-and-the-nations` | living-lessons | Dr. Michael Heiser | 1209 | **PARTIAL**: The Unseen Realm thesis summarized; no lines from the book. | Book text + his podcast transcripts | nakedbiblepodcast.com |
| 33 | `pv-diop` (in progress) | prophetic-voices | Dr. Cheikh Anta Diop | 1368 | **PARTIAL**: In progress (opener). Bio plus thesis, with a few lines from the fetched book; argument only sketched. | Book text (The African Origin of Civilization) + UNESCO record | archive.org; unesdoc.unesco.org |
| 34 | `ll19-not-ignorant-of-his-devices` | living-lessons | Chase Hughes | 1374 | **PARTIAL**: His influence playbook paraphrased point by point; no transcript and no lines. | YouTube captions (NAS route) | none beyond YouTube |
| 35 | `ll34-the-tower-the-race-and-the-sovereign` | living-lessons | Daniel Kokotajlo | 1406 | **PARTIAL**: His scaling and race warning paraphrased; no lines. | YouTube captions (NAS route) + his written scenario | ai-2027.com |
| 36 | `ll33-from-good-intentions-to-lasting-impact` | living-lessons | Dr. Carolyn Randolph-Kato | 1423 | **PARTIAL**: Her four-step roadmap laid out; paraphrase only. | YouTube captions (NAS route) | none beyond YouTube |
| 37 | `pv-williams` (in progress) | prophetic-voices | Dr. Chancellor Williams | 1438 | **PARTIAL**: In progress (opener). Framing questions quoted from the book; the argument itself is summarized. | Book text (The Destruction of Black Civilization) | archive.org |
| 38 | `ll2-the-energy-you-were-given` | living-lessons | Dr. Martin Picard | 1442 | **PARTIAL**: His energy-budget argument paraphrased with short phrases; the interview is not named or cited. | YouTube captions (NAS route) | pubmed.ncbi.nlm.nih.gov |
| 39 | `hl-w3-fasting-timeline` | healthy-living | Kait Malthaner | 1516 | **PARTIAL**: Timestamped one-line paraphrases of her hour-by-hour video. | YouTube captions (NAS route) | none beyond YouTube |
| 40 | `ll68-out-of-the-way-consecration-and-the-broken-bread` | living-lessons | Ezekiel Azonwu (with Taylor Welch) | 1573 | **PARTIAL**: Azonwu's 'get out of the way' discipline paraphrased; no lines. | YouTube captions (NAS route) | none beyond YouTube |
| 41 | `hl-w3-fasting-brain` | healthy-living | Dr. Jason Fung | 1587 | **PARTIAL**: Timestamped one-line paraphrases of his lecture. | YouTube captions (NAS route) | none beyond YouTube |
| 42 | `ll325-god-is-able` | living-lessons | Bishop Lloyd E. Gwin | 1602 | **PARTIAL**: Follows his written proclamation's four places and his chosen verses; his own sentences are not quoted. | House document (his written proclamation) | none (house source) |
| 43 | `hl-w3-sleep-memory` | healthy-living | Shai Marcu | 1626 | **PARTIAL**: Timestamped paraphrases of a TED-Ed lesson. | TED-Ed lesson transcript | ed.ted.com |
| 44 | `hl-w3-tre-circadian` | healthy-living | Dr. Andrew Huberman | 1639 | **PARTIAL**: Timestamped one-line paraphrases of his episode. | YouTube captions (NAS route) (Huberman Lab) | hubermanlab.com |
| 45 | `hl-w3-women-fueling-counter` | healthy-living | Dr. Stacy Sims | 1647 | **PARTIAL**: Timestamped one-line paraphrases of her interview. | YouTube captions (NAS route) | drstacysims.com |
| 46 | `hl-w3-water-fasting-supervised` | healthy-living | Dr. Alan Goldhamer | 1704 | **PARTIAL**: Timestamped paraphrases; one quoted phrase ('pills, potions, and powders'). | YouTube captions (NAS route) | healthpromoting.com |
| 47 | `pv-obenga` (in progress) | prophetic-voices | Dr. Théophile Obenga | 1711 | **PARTIAL**: In progress (opener). Method and claim described, with some of his Cairo-paper lines. | Public record (UNESCO Cairo symposium proceedings) | unesdoc.unesco.org; archive.org |
| 48 | `hl-w3-therapeutic-fasting` | healthy-living | Dr. Pradip Jamnadas | 1714 | **PARTIAL**: Timestamped one-line paraphrases of his lecture. | YouTube captions (NAS route) | none beyond YouTube |
| 49 | `hl-w3-learning-mastery` | healthy-living | Dr. Andrew Huberman | 1714 | **PARTIAL**: Timestamped one-line paraphrases of his episode. | YouTube captions (NAS route) (Huberman Lab) | hubermanlab.com |
| 50 | `ll328-faithful-in-that-which-is-least-trust-is-earned-again` | living-lessons | Dr. Geovanny Ponce | 1730 | **PARTIAL**: His letter's spine 'rendered for meaning' in two sentences; thin. | Public record (district newsletter) | champaignschools.org (likely) |
| 51 | `ll48-world-class-as-unto-the-lord-work-ownership-resilience` | living-lessons | Chris Gardner | 1779 | **PARTIAL**: His counsel to the young laid out with phrases; the talk is named but not fetched. | YouTube captions (NAS route) | none beyond YouTube |
| 52 | `ll20-the-ladder-and-the-door` | living-lessons | Chase Hughes | 1845 | **PARTIAL**: His DMT claims stated as quoted paraphrase and answered; no verbatim transcript. | YouTube captions (NAS route) | none beyond YouTube |
| 53 | `hl-w3-women-midlife-strength` | healthy-living | Drs. Sims, Wright, Haver, Crawford (roundtable) | 1895 | **PARTIAL**: A four-expert roundtable paraphrased together, with timestamps. | YouTube captions (NAS route) | drstacysims.com |
| 54 | `ll47-navigating-the-age-faith-critical-thinking-identity` | living-lessons | Pastor A.R. Bernard | 1901 | **PARTIAL**: His five truths laid out with a few phrases ('rigged'); no source cited. | YouTube captions (NAS route) | none beyond YouTube |
| 55 | `hl-w-haver-midlife-fasting` | healthy-living | Dr. Mary Claire Haver | 1949 | **PARTIAL**: Her roundtable segment paraphrased with timestamps; one quoted phrase. | YouTube captions (NAS route) | none beyond YouTube |
| 56 | `hl-w3-setback-neuroscience` | healthy-living | Dr. Tracey Marks | 2066 | **PARTIAL**: Her points cited with video timestamps but as one-line paraphrases; no verbatim lines. | YouTube captions (NAS route) | none beyond YouTube |
| 57 | `sov75-safely-a-tool-and-not-a-friend` | sovereign-ai | Sinead Bovell (with Natalie Monbiot) | 2075 | **PARTIAL**: Her points paraphrased from a timestamped summary; the video was not watched. | YouTube captions (NAS route) | none beyond YouTube |
| 58 | `ll61-the-audit-fruit-not-photographs-accountable-shepherds` | living-lessons | Dave Anderson | 2126 | **PARTIAL**: His 'audit' thesis laid out from a summary with some of his terms; no transcript. | YouTube captions (NAS route) | none beyond YouTube |
| 59 | `ll314-will-my-work-live-on` | living-lessons | Anna Gát (essay) | 2157 | **PARTIAL**: The essay's report held 'as Big Think reports it'; paraphrase. | Essay text | bigthink.com |
| 60 | `wi-law-of-assumption` | world-issues | Neville Goddard (via an unnamed teacher) | 2188 | **PARTIAL**: The unnamed teacher's transcript is worked, but none of Goddard's own lines are quoted. | Transcript (pasted) + Goddard's lecture texts | archive.org |
| 61 | `ll36-fruit-root-and-the-empty-house` | living-lessons | Robert Halwell | 2525 | **PARTIAL**: Several of his points and images ('FDA' of heaven) paraphrased; the source is not named. | YouTube captions (NAS route) | none beyond YouTube |
| 62 | `wi-medical-establishment` | world-issues | Dr. Stella Immanuel | 2539 | **PARTIAL**: Her claims laid out and tiered; paraphrase, no verbatim lines (source is the show title). | YouTube captions (NAS route) (youtu.be/jiRPhN-lPcs) | none beyond YouTube |
| 63 | `ll317-who-judges-greatness` | living-lessons | Anna Gát (essay) | 2710 | **PARTIAL**: Second claim of the same essay, paraphrased. | Essay text | bigthink.com |
| 64 | `ll49-mastery-without-manipulation-lifes-task-envy-sober-mind` | living-lessons | Robert Greene | 2756 | **PARTIAL**: His mastery counsel laid out with many short quoted phrases; no fetched transcript or book cited. | YouTube captions (NAS route) + book text | none beyond YouTube |
| 65 | `ll262-nicaea-did-not-invent-him-the-word-said-it-first` | living-lessons | Wesley Huff & Andy Steiger | 2775 | **PARTIAL**: Read from fetched captions, but the hosts' case is carried in paraphrase, not their lines. | YouTube captions (NAS route) (captions already read once) | none beyond YouTube |
| 66 | `ll286-where-do-you-run-when-the-market-shakes` | living-lessons | Priya Misra | 2891 | **PARTIAL**: Her view laid out as one item among several; paraphrase, no lines. | YouTube captions (NAS route) | am.jpmorgan.com |
| 67 | `ll254-laziness-is-a-character-matter-the-four-domains-and-the-five-marks-of-the-sluggard` | living-lessons | Jonny Ardavanis & Hank Bowen | 3079 | **PARTIAL**: 'Their points are reported below as theirs' from a third-party summary; no lines. | YouTube captions (NAS route) | none beyond YouTube |
| 68 | `ll287-spoken-in-the-break-heard-in-the-light` | living-lessons | Chelli Goldenberg & Owen Jones | 3126 | **PARTIAL**: Both voices named with what they said, from a summary; paraphrase, few lines. | YouTube captions (NAS route) | theguardian.com |
| 69 | `wi-victorious-emotions` | world-issues | Wendy Backlund | 3240 | **PARTIAL**: Her teaching sorted from a handed-in summary; no lines. | YouTube captions (NAS route) | ignitinghope.com (likely) |
| 70 | `ll261-add-not-diminish-not-the-giants-and-the-edge-of-what-is-written` | living-lessons | Tim Alberino (with Michael Knowles) | 3287 | **PARTIAL**: Alberino's Enoch cosmology described in paraphrase; few or no lines. | YouTube captions (NAS route) | dailywire.com (if members-only); archive.org (1 Enoch text) |
| 71 | `ll198-the-goldilocks-zone-of-curiosity-what-he-hides-the-gap-he-shows-and-the-question-that-matters` | living-lessons | Anne-Laure Le Cunff | 3431 | **PARTIAL**: The article's claims 'in its own terms', paraphrased; no lines from the essay. | Essay text | bigthink.com; nesslabs.com |
| 72 | `ll289-why-the-oppressed-still-call-on-him` | living-lessons | Garrison Hayes & Dr. Anthony B. Pinn | 3491 | **PARTIAL**: Hayes' video and Dr. Pinn's case reported from a summary; Word-dominant, almost no lines of either. | YouTube captions (NAS route) + Dr. Pinn's books | archive.org |
| 73 | `ll193-what-it-costs-to-keep-your-soul-the-morsel-the-son-the-snare-and-the-finished-work` | living-lessons | David Henrie (with Bryce Crawford) | 3530 | **PARTIAL**: His account paraphrased from a timestamped summary; the only quotes are from that summary. | YouTube captions (NAS route) | none beyond YouTube |
| 74 | `wi-ai-empire` | world-issues | Karen Hao | 3756 | **PARTIAL**: Her central thesis laid out, but the video URL is blank and no lines of hers or her book are quoted. | YouTube captions (NAS route) + book text | penguinrandomhouse.com (likely) |
| 75 | `ll251-that-rock-was-christ-identity-not-of-blood` | living-lessons | Lecrae (The Deep End) | 3960 | **PARTIAL**: Zadok and Jerome Gay Jr.'s positions laid out from an episode summary; no lines. | YouTube captions (NAS route) | none beyond YouTube |
| 76 | `ll266-the-manuscripts-and-the-names-the-word-testified-first` | living-lessons | Wes Huff | 4135 | **PARTIAL**: Fetched captions 'rendered here for meaning'; his claims are paraphrased, not quoted. | YouTube captions (NAS route) (captions already read once) | apologeticscanada.com |
| 77 | `ll202-prepared-before-the-position-homecoming-legacy-good-success-and-represent` | living-lessons | Bishop Lloyd E. Gwin | 4218 | **PARTIAL**: Built from the class's Whisper transcript, but his message is carried in our words (rendered for meaning), not his lines. | House recording (Thinking Space/NAS Whisper, transcript in hand) | none (own NAS) |
| 78 | `ll79-justice-and-righteousness-travel-together` | living-lessons | Dr. Manny Scott (relaying Dr. Bruce Fields) | 4886 | **PARTIAL**: His and Dr. Fields' case relayed in our words; no attributed lines. | YouTube captions (NAS route) | none beyond YouTube |
| 79 | `ll244-the-heavens-declare-and-the-timetable-is-held-open` | living-lessons | Dr. Hugh Ross & Dr. Fuz Rana (with Taylor Welch) | 5591 | **PARTIAL**: Their claims sorted from a summary with timestamps (no transcript). | YouTube captions (NAS route) | reasons.org |
| 80 | `ll77-the-king-over-the-children-of-pride` | living-lessons | William Jackson | 6368 | **PARTIAL**: Built from a summary with timestamps, not the transcript; his substance carried in paraphrase. | YouTube captions (NAS route) | none beyond YouTube |
| 81 | `wi-biology-walked-back-and-the-word-on-the-worlds` | world-issues | Prof. Denis Noble | 7322 | **PARTIAL**: His points are 'reported' from auto-captions, not quoted. The captions are already in docs/99-session-notes/sources/denis-noble-misled-about-biology/. | YouTube captions (NAS route) (already fetched) | physoc.onlinelibrary.wiley.com |
| 82 | `pv-munroe-purpose` | prophetic-voices | Dr. Myles Munroe | 1413 | **WHAT**: Purpose/priorities argument in his chapter-1 lines; call to ask the Manufacturer. | Book text | archive.org |
| 83 | `pv-diop-african-origin` | prophetic-voices | Dr. Cheikh Anta Diop | 1441 | **WHAT**: Thesis and call laid out with his own lines from the fetched book. | Book text | archive.org |
| 84 | `pv-munroe-die-empty` | prophetic-voices | Dr. Myles Munroe | 1451 | **WHAT**: Releasing Your Potential argued from his page-cited lines; call to die empty stated. | Book text | archive.org |
| 85 | `pv-diop-unesco-chapter` | prophetic-voices | Dr. Cheikh Anta Diop | 1457 | **WHAT**: Evidence chain from his UNESCO chapter, quoted. | Public record (UNESCO General History of Africa vol. II) | unesdoc.unesco.org |
| 86 | `pv-williams-ethiopias-oldest-daughter` | prophetic-voices | Dr. Chancellor Williams | 1483 | **WHAT**: Ch. II 'Great Deception' argument with quoted lines and page cites. | Book text | archive.org |
| 87 | `pv-williams-lost-their-history` | prophetic-voices | Dr. Chancellor Williams | 1543 | **WHAT**: Question, method and 'race of nobodies' line from the book, quoted. | Book text | archive.org |
| 88 | `pv-munroe-the-source` | prophetic-voices | Dr. Myles Munroe | 1562 | **WHAT**: Argument walked step by step with his chapter lines ('Life is not possible when a thing is separated from its source'). | Book text | archive.org |
| 89 | `sov10-the-settled-word` | sovereign-ai | Andrey Mir | 1599 | **WHAT**: The essay's argument laid out step by step, with its own lines quoted (truth 'yet to be determined', Havelock, Eisenstein). | Essay text | bigthink.com |
| 90 | `pv-munroe-kingdom-not-religion` | prophetic-voices | Dr. Myles Munroe | 1640 | **WHAT**: Lays out his Kingdom-vs-religion argument in his words (colonization definition etc.), sourced. | Book text | archive.org |
| 91 | `pv-obenga-sound-laws` | prophetic-voices | Dr. Théophile Obenga | 1801 | **WHAT**: His Cairo paper's method (sound-laws) quoted and walked. | Public record (UNESCO symposium paper) | unesdoc.unesco.org |
| 92 | `pv-munroe` | prophetic-voices | Dr. Myles Munroe | 1857 | **WHAT**: Opener built from his books: his own lines quoted with page cites (colony, dominion), sources[] attached. | Book text | archive.org |

## Hostnames needed (consolidated, deduplicated)

YouTube is already covered by the NAS route. House recordings need no host. Hosts marked * are inferred (the speaker's or publisher's known site), not fetched in this session. Confirm each one on its first fetch.

- `ai-2027.com`
- `am.jpmorgan.com`
- `americanradioworks.publicradio.org` *
- `apologeticscanada.com`
- `archive.org`
- `bigthink.com`
- `blog.bytebytego.com`
- `champaignschools.org` *
- `crenshawchristiancenter.net` *
- `dailywire.com` *
- `dent.global` *
- `drstacysims.com`
- `ed.ted.com`
- `hamel.dev`
- `hbr.org` *
- `healthpromoting.com`
- `hubermanlab.com`
- `ignitinghope.com` *
- `josephprince.com` *
- `journals.sagepub.com`
- `lisafeldmanbarrett.com`
- `nakedbiblepodcast.com`
- `nesslabs.com`
- `patents.google.com`
- `penguinrandomhouse.com` *
- `physoc.onlinelibrary.wiley.com`
- `pubmed.ncbi.nlm.nih.gov`
- `reasons.org`
- `rework.withgoogle.com`
- `theatlantic.com`
- `theguardian.com`
- `tonyevans.org` *

Thirty-three hosts in all. The heaviest use: `archive.org` (book texts: Munroe, Diop, Williams, Goddard, Pinn, 1 Enoch, Malcolm X public record), `unesdoc.unesco.org` (Diop and Obenga at the UNESCO Cairo symposium and General History of Africa), `bigthink.com` (Mir, Le Cunff, Gát), `hubermanlab.com` (three Huberman lessons) and `pubmed.ncbi.nlm.nih.gov` (Picard, Ackerman).
