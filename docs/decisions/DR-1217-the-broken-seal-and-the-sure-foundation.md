# DR-1217: World Issues 22 — the broken seal and the sure foundation

**Date:** 2026-10-22
**Status:** accepted
**Tier:** A (one lesson in the existing World Issues course; no schema; every verse verbatim from the repo KJV)
**Type:** curriculum (WORD-FIRST, VERIFICATION-DOCTRINE)
**Area:**
- `app/src/lib/world-issues-class.js`: `BROKEN_SEAL_ISSUE`, appended to `WORLD_ISSUES`
- `app/src/__tests__/world-issues-verse-integrity.test.js`: `BROKEN_SEAL_QUOTES` and the Issue 22 gate

**Grounds:** Darrell, 2026-10-22, pasting a developer-forum post ("Critical PHP Update Releasing Today - and Compromised Certificates in the wild") with one word on it: *"Lesson."*

**Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, SPEC-CONFORMANCE-REVIEW, APP-IS-PRIMARY

## Context

The post carried two warnings from one day: PHP's critical security release and the compromise of an issuer of intermediate certificates. It linked the PHP news archive and a news story, and named no one. Lessons follow FROM-A-LINK-TO-WHAT-IT-WAS-SENT-FOR.md: Word first, one lesson told once, every claim checked past the intermediary.

## What was measured

- **Checked by live search on 2026-10-22.** php.net, the php.announce list, the Mozilla blog and the news sites could not be opened from this sandbox (DNS); the limits say so.
- **Documented:**
  - **The PHP release.** Advance notice on php.announce (message 509) and from the PHP Foundation: two critical flaws rated 9.2, released 2026-10-21 at 14:00 UTC. The CISA alert of 2026-10-21 and the analyses by Rapid7 and Tenable give CVE-2026-109618/109619, the fixed versions 8.5.12/8.4.27/8.3.36/8.2.35, and unauthenticated remote code execution.
  - **The eMudhra keys.** Eight intermediates with keys reported as P-384 values below 256, recoverable from the public certificate (Mozilla bug 2083449, Mozilla's post, eMudhra's own statement, CERT-In CIAD-2026-0050, independent coverage).
  - **The browser blocks.** Firefox and Chrome from October 17, Apple October 19, Microsoft October 20; Chrome removed the emSign ECC Root CA – G3 root.
  - **Our own house.** No PHP and no WordPress in the repository or the NAS service images; Node 20 in thirteen workflows and one service (moved the same day, DR-1218).
- **Partly documented:**
  - The analysts' description of the two flaws' mechanism, and one firm's report of exploitation attempts from October 17.
  - The trust-store fix versions (Python certifi 2026.10.19; Node.js 22.23.4/24.22.1/26.12.1).
- **Open, flagged narrowly:**
  - The cause of the weak keys (too little randomness, or eMudhra's April 2025 key ceremony).
  - The report date (17 or 18).
  - Any malicious use of the keys (none found as of October 21).
- **The Word:** 43 references, 90 quoted spans, each read from `app/public/bible/kjv/*.json`.

## Impact

- **Unresolved:** a second-hand warning is either ignored or forwarded in alarm. The Word on seals, trust and the watchman stays untaught at the moment the family meets it.
- **The call obligates:**
  - facts checked with their owners
  - the open flagged narrowly
  - our own wall looked at first
  - both slogans corrected while every fact stands

## Decision

- **World Issues 22** is published, Word first:
  - a seal is the hand that holds it (Esther 8:8; Daniel 6:17; Jeremiah 32:10; Haggai 2:23)
  - the seal that cannot be forged (2 Timothy 2:19; Ephesians 1:13; Revelation 5:9; Revelation 3:7; Isaiah 22:22)
  - where trust belongs (Psalms 118:8-9; Jeremiah 17:5-8)
  - the watchman's duty both ways (Ezekiel 33:4-6; Nehemiah 4:9; Psalms 127:1)
  - prudence, not fear (Proverbs 27:12; Matthew 24:43; 2 Timothy 1:7)
  - prove all things (1 Thessalonians 5:21; Proverbs 14:15)
  - the lot (Proverbs 16:33)
  - the rock (Matthew 7:24-27; Isaiah 28:16; Psalms 11:3)
  - the Resources (Proverbs 24:3-4; 1 Corinthians 13:2)
  - the two slogans corrected (Proverbs 14:23; Jeremiah 6:14)
- **The rest of the lesson:**
  - five perspectives steelmanned
  - a grace note naming no one for condemnation
  - all four bands
  - a quiz and a reflection
- **The poster is not named**, because the post names no one.

## Verification

- **Issue 22 gate:** 9/9.
  - Every fragment is verbatim.
  - Every "..." (Ref) span is verbatim (90 spans).
  - There are no stale fragments.
  - The tiers, the limits, the Word-first headings, the voice and the four bands are all asserted.
- **Proven to catch:** the module was corrupted twice (warning→counsel in Ezekiel 33:5, sure→strong in 2 Timothy 2:19). The span scan failed each time and passed on restore.
- **Lesson lints:** all clean (claims, sources, evenhanded, persuasion, age, faith-label, Word first / one lesson).
- **Bands:** 377, 461, 572 and 865 words, ascending.
