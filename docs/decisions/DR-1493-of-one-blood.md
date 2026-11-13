# DR-1493: L315 — Of One Blood

**Date:** 2026-11-13
**Status:** Accepted
**Tier:** A (one Living Lesson; content only)
**Type:** lesson
**Area:** Living Lessons (`app/src/lib/living-lessons/ll315-of-one-blood.js`, its own file per DR-1468)
**Sent by:** Darrell, typed into the Claude conversation, one word above it: Lesson
**Pairs with:** DR-1468 / DR-1477 (the parallel pipeline), DR-0098, DR-0100, DR-0076, DR-0099, DR-0331

## Context

On Fri 2026-11-13 at about 9:15 AM Central, Darrell typed one word, Lesson, above a YouTube video, Is the Spanish Inquisition & Blood Purity Laws against Judah linked to modern racism?, by the channel Eternal Citizens (https://youtu.be/y5_FOrhrDnA), with the channel's disclaimer, its source list and his summary of the video. It came by chat, so there is no Gmail thread. The video was not watched in this build; the lesson works from his summary. Placement: a Living Lesson. It is Word-first teaching on a life question, partiality by blood and colour, with history as its evidence; INTAKE-AND-FIT does not place it clearly in World Issues or Economics, and the economics side is already built (econ9) and is linked, not repeated. L311-L314 were reserved by other sessions, so `new-lesson.mjs` gave L315.

## What was measured

| what | measured |
| --- | --- |
| verses | 28 anchor references; 134 quoted spans over 45 references, every one filled by `fill-verses.mjs` from `app/public/bible/kjv`; Acts 17:26 read as the KJV prints it (hath made of one blood all nations of men); 0 verse faults; 0 double-quoted spans without a reference |
| length | adult 2,437 words; child 1,095 |
| band shares | child 0.54, youth 0.62, teen 0.64, senior 0.73 |
| reading ladder | child 2.1, youth 5.3, teen 6.9, senior 9.0 |
| band overlap | worst pair 0.02 (ceiling 0.5) |
| history, tier 1, stated with its source | Toledo Sentencia-Estatuto 1449 (scholarship incl. Tritle, Philologia Hispalensis 2023); Nicholas V's bull, 24 September 1449; statutes' spread and Toledo cathedral 1547 (Britannica); Alhambra Decree, 31 March 1492 (HISTORY.com, OUP blog); casta series from about 1720, Cabrera 1763 (LACMA); tribute exemption for mestizos, not mulattoes (Encyclopedia.com); Code Noir 1685, which also expelled Jews (Library of Congress); Jim Crow, late 1870s to 1964-65 (Britannica); Population Registration Act 1950-1991 (Britannica) |
| tier 2, named as the video's claims | Sephardic Jews and Moors were Black; Portugal's 128 categories (no source found); the first legalized racial exclusion law (disputed: Tritle); the Church and crowns as inventors of all later racism (the video's thesis; the documented part, enactment and enforcement, plus opposition within the church, is stated) |
| left out | the video's claim about present-day policy in one country (contested, outside this lesson) |
| not read | www.britannica.com, en.wikipedia.org and kbwolf.sites.pomona.edu did not resolve from the sandbox; every fact came through search results naming their sources; the video itself (re-review 2026-11-27) |

## Impact

A learner meets the purity-of-blood laws taught Word first: one blood (Acts 17:26), no respect of persons, the wall down (Ephesians 2:14), Numbers 12 for what it shows, and the turn, a law that let lineage overrule baptism answered by the Lamb's Blood that cleanses and includes (1 John 1:7; Revelation 5:9; Acts 8:36). Hatred of Jews and of Black people is condemned alike. The ladder of castes is answered by the body (1 Corinthians 12) and the house that will not divide (Mark 3:25), applied at the church door (James 2:1-4). The adult lesson, the teen and senior bands and inApp send the reader to Kingdom Economics, The engine and the reserve (`app/src/lib/economics-class.js:472`), and repeat none of its figures. No colour marking is used, so true red stays with His Blood (DR-0099). Content only: one new file and one new test.

## Decision

`ll315-of-one-blood`, ORDER 315, ADDED 2026-11-13: the Word at the root, then the record sorted into what is documented, what is only claimed, and what is left out. The child band teaches one blood and that Yahweh does not rank people by skin or family, with no graphic content. Two parables with invented people (a sock-colour seating chart in Houston; purity papers in a trunk in Seville); a ten-question quiz.

## Verification

`living-lessons-ll315-of-one-blood.test.js`: 17 cases. The shared gate (DR-1477) runs on 8 spine spans quoted in every text. Six dangers are each proven to catch with a planted defect: a video claim stated as fact; a present-day political claim carried in; red used as a marker; graphic content in the child band; history taught without its source; the economics session repeated instead of linked. A seventh check pins the provenance (the video URL, the day, the channel). `export const UNCHECKED` names what was not read. `re-review: 2026-11-27`: open the Britannica and Pomona pages from a runner, and watch the video for any claim the summary missed.
