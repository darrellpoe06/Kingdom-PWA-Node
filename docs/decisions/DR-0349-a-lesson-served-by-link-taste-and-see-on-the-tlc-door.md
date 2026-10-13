# DR-0349 — A lesson served by link: taste and see on the TLC door

**Date:** 2026-09-10 · **Status:** accepted · **Tier:** B · **Area:** tlc · **Principles:** VERIFICATION-DOCTRINE, APP-IS-PRIMARY, REALITY-TRACE, TLC-FIREWALL, DATA-AS-EMPOWERMENT, DECISION-RECORDS

## Directive, in Darrell's words (2026-09-10)

*"how do we assign or share outside the app? Like a link to serve the lessons like the Love Corner App does... so people can taste and see what type of therapy and training TLC Therapy Solutions App has to offer.."*

## Finding (DR-0219)

**SHOULD.** The Love Corner already serves one exact lesson by link (`lib/lesson-links.js`, DR of 2026-08-10): a canonical URL for a course and lesson, read once on open, handed to the device's own share sheet, with copy as the fallback. **ARE.** The TLC app had the assignment seam (DR-0345 §7, a therapist to a signed-in client) and the QR that opens the door, but no link that opened a lesson, no share control on a lesson, and nothing a visitor could read before signing in: the door served the booking page only. **GAP.** A prospective client or therapist could be told about the training but never shown it. **CLOSE.** Below.

## Decisions

1. **One link opens one lesson on TLC's own door.** `lib/tlc-lesson-links.js` is the pure module: `tlcLessonQuery` / `tlcLessonUrl` build `https://poetech.us/tlc/app/?tlc=1&course=<library course id or lesson track key>&lesson=<module id>` (the door marker first, so the shell routes to the TLC door; the installable entry the onboarding link already proved live, DR-0344); `parseTlcLessonLink` reads it back; `resolveTlcLesson` resolves it against the mounted curriculum (a lesson track serves as the client audience, the clinician track as therapist, a library course as Training & Hours) and returns null for a stale link so the door opens normally, never a dead screen. Every lesson id across the tracks and the library is unique, gated, so a link is never ambiguous.
2. **Every lesson, track and course can be handed on from where it is read.** `ShareButton` (the Love Corner's own, `lib/lesson-links.js` `shareLink`) on every lesson ("Share this lesson"), every track and every library course, with an honest face: shared, or copied where the device has no share sheet, or "press and hold" where neither works (DR-0076). The payload is short on purpose: the lesson's title, its big idea, the course and the practice named, the link.
3. **Signed out, the door serves the lesson as a taste.** `TlcPublicDoor` reads the link once at first render (the same rule as the onboarding token) and, for a visitor, renders `PracticeLearn` in guest mode above the booking page: the "Shared with you" note (educational support only, not treatment or diagnosis), then ONLY the linked track or course with the lesson open. No audience switcher, no areas, no hours ledger, no CE renewal, no assignments, no SME gate, and no internal review: the "For Christina to evaluate" block and the approval label render for staff only. The booking door follows beneath, so the taste ends at the way in.
4. **Signed in, the link opens Training on that lesson.** The door starts on Training; `PracticeLearn` takes the link's audience, area (Lessons or Course library) and lesson, and a course card opens itself when it holds the linked lesson.
5. **What a link may never carry.** No client health information, no name, no assignment: only a course id and a module id. Assignment stays the signed-in seam (DR-0345 §7); the link is the public invitation.

## Proven-to-catch (DR-0076 §3)

- `tlc-lesson-links.test.js` (10, node): the query carries the door marker and round-trips; the URL is absolute on the canonical TLC entry; every lesson id is unique; a client-track, whole-situation, clinician-track, library and session-script link each resolve to the right audience and module; a lesson id alone is found; stale links are null; the lesson and course payloads name the practice and carry the link; the visitor's note says what it is and is not.
- `tlc-public-door-render.test.jsx` (+3): signed out, a client-track link serves that lesson open above "Match a Preferred Provider" with none of nine operator strings; a library link serves the course with the lesson open and the internal review inside; a stale link opens the door normally.
- `practice-learn-render.test.jsx` (+1): "Share this course" and "Share this lesson" hand the device's share sheet the exact TLC URL, the honest lesson count, and the practice's name; the button reports "Shared ✓".

## Honest limits (DR-0100)

The URL is proven by test against the same entry the onboarding link uses in production; the first real share from a phone is the live proof, and it is Christina's or Darrell's tap. `re-review: 2026-09-17` with DR-0345's: confirm a shared link opens the lesson on a phone that has never installed the app.

## Amendment (2026-09-10, the first share from a phone) — the link carries whether the Word was open

Darrell, sharing "What is anxiety" from his phone (the live proof of §2): *"The link should be with or without the Word depending on if the Word is open..."*

6. **`word=1` rides along when the sharer had the Word open.** `tlcLessonQuery` / `parseTlcLessonLink` / `resolveTlcLesson` carry it; the lesson's fold state lives in the lesson so the share can read it; a link that arrives with `word=1` opens that one lesson's fold on mount (the corpus text verbatim), and never flips the recipient's own page-wide switch. Shared plain, it opens plain. Proof: `tlc-lesson-links.test.js` (+1), `practice-learn-render` (share plain, open the Word, share again: `&word=1`), door render (+1: served with the Word open, verbatim; plain otherwise). Live: deploy run 1012 on `8c7ab73` served the first shared link; the share text arrived exactly as designed.

