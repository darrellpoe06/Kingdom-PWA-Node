# DR-0705 — A church session the church posts publicly names its members as the teacher calls them

- **Status:** accepted
- **Tier:** B (a privacy rule; an exception to DR-0333 §6, bounded)
- **Type:** ways + privacy
- **Date:** 2026-09-30
- **Scope:** every lesson built from a church session; L202 first (DR-0704); the speaker-labeling pipeline and the lesson-builder rules (DR-0706).
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), DECISION-RECORDS; DR-0333 §6 (private individuals never enter a lesson); DR-0639 (a member is named only by choice); DR-0331.
- **Grounds:** Darrell, 2026-09-30, verbatim: *"the recordings are online and members already know they are public so this is an exception because we already by action know it's public so we use names to further personalise our collective experience... also I believe people will be more engaged because of these workflows..."*

## Context

DR-0333 §6 keeps congregation members named in services out of lessons, and DR-0639 names a member only when the member chooses. L202 is a Bible study the church itself records and posts publicly, and Darrell directed that its members be called by the names Bishop Gwin uses. His first line ("Other congregation members are called by BG...") was ambiguous; he then decided the question in the words above.

## What was measured

The church posts its services and weekly studies to its public channel (DR-0333, `choir_sermons` rows with `source = youtube`), and the members speak knowing the session is recorded and posted. The names in L202's transcript are listed in DR-0704.

## Impact

Named members make the lesson the church's own record of its study, and Darrell expects more engagement from it. The risk is exposure of something a person would not want in a lesson; the limits below hold that.

## Decision

1. **The exception.** For a church session the church itself posts publicly (the class recording and its video), members are named as the teacher calls them in the recording. The public posting is the members' consent by action.
2. **Only names the recording shows.** A name is attached only to the words the recording attaches it to. A name is never guessed onto a voice; a garbled name is not rendered; where the recording does not show who spoke, the lesson says so.
3. **Sensitive details stay out, even for a named person:** health and sick lists, giving amounts, family trouble, and anything said in confidence. Naming a person never carries these with it.
4. **Sessions not posted publicly keep the old rule:** DR-0333 §6 and DR-0639 apply unchanged.
5. **Darrell and Bishop Gwin** are named as DP and BG, as directed.

## Verification

- L202's test pins each name to its words and fails when a name moves onto other words or a garbled name is guessed (DR-0704).
- The speaker-labeling rules in DR-0706 carry the same limits into the pipeline.
