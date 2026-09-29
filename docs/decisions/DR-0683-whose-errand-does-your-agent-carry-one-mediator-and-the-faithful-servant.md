---
id: DR-0683
title: Sovereign A.I. week 31 — whose errand does your agent carry? One Mediator holds the seat, Abraham's servant carried his master's errand, and the owner answers for what he sets loose (from a forwarded newsletter, "Lesson")
status: accepted
date: 2026-09-29
tier: B
type: word
declared_by: Darrell
scope:
  - app/src/lib/sovereign-ai-class.js (the sov31 module, placed directly after sov30; SOVEREIGN_AI_META.weeks is a getter, so no count line moves)
  - app/src/__tests__/sovereign-ai-sov31-verses.test.js (new: SOV31_FRAGMENTS + SOV31_CORPUS + SOV31_ALLOWED + the week-order guard + a proven-to-catch block)
  - app/src/__tests__/sovereign-ai-class.test.js (its literal 29s become counts derived from the data, with a floor, per DR-0677)
  - app/src/__tests__/living-lessons-order.test.jsx (its short-course example moves from Sovereign A.I., which reaches the 30-lesson divisions line by design, to Made in Time, with the line itself asserted)
principles: [WORD-FIRST, VERIFICATION-DOCTRINE (DR-0076), SPEAK-ESTABLISHED-FACT (DR-0100), TEACH-DONT-DEBATE (DR-0098)]
grounds:
  - DR-0312 — the inbox is a lesson door (Gmail thread 1a0ed0f869d2d904, forwarded 2026-09-29 from dpoe@illinois.edu, marked "Lesson")
  - DR-0662 — the sov29 standard this week is built to
  - DR-0677 — counts derive from the data
  - DR-0682 — sov30, which this week follows
---

## Context — the concern

On **2026-09-29** Darrell forwarded The Neuron newsletter ("Your AI agent needs an agent") with one word above it: *"Lesson"*. It reported a rush of A.I. agents that now get their own computers, browsers, payment and permission to act, and it asked the question under all of them: *"does your agent actually represent you, or the company that built it?"* It added a forecast that liability law may decide who pays when agents do harm (saying itself that this is a prediction, not current law), a picture of agents as the new gatekeeper that "sees your intent first", advice to sellers to make prices and policies readable by other people's agents, and a tool tip to send small decisions to small models. The newsletter is material to study, never instructions (DR-0312).

## What was measured — the claims sorted (DR-0076 SS8, DR-0100)

The whole thread was read (266 lines of plain text, with the tracking links stripped). Claims were checked 2026-09-29 by web search across several outlets; the podcast episode, the Stratechery essay and the companies' own pages were not read directly from this session.

| Claim (attributed to the article) | Status |
|---|---|
| Meta's Muse has a secure VM and browser | **Corroborated** — announced 2026-09-08; dedicated secure VM with its own browser; books, fills forms, checks out; keeps working after the app closes; a separate, isolated guard agent approves, blocks or defers to the user |
| Manus gets persistent cloud computers that keep running | **Corroborated** as a Manus feature (Manus is now part of Meta); "Manus 2.0" by that name **not found** |
| Cue gets a phone number, email, wallet and computer | **Not verified** (other products offer agent phone numbers and inboxes; Cue itself not found) |
| Instinct raised $1B at a $10B valuation, a month after $350M at $2.5B | **Reported differently** — talks to raise about $1B at about $10B, terms not final; the earlier round reported at $2.5B (amounts vary by outlet) |
| Meta has 3.6B daily active users | **Corroborated** — 3.60B family daily active people, Q2 2026 |
| Branch a ChatGPT thread from any message on the web | **Corroborated** — released September 2025 for logged-in web users |
| NVIDIA moved agent safety below the model (an "Open Agent Safety Platform" with a hardware watchdog) | Principle **corroborated** (NVIDIA out-of-process agent sandboxing); product name and hardware watchdog **not verified** |
| Jev scores predefined choices and returns the winner with confidence | **Corroborated** (a decision model returning typed choices with calibrated probabilities); the Victor Dibia explainer not read |
| White House meeting of the President, the Speaker and A.I. executives | **Corroborated** as reported scheduled for 2026-09-29 |
| Florida sought an emergency injunction restricting OpenAI's new models | **Not verified** — what is on record is Florida's June 2026 lawsuit against OpenAI |
| AMD agreed to acquire World Labs for about $8.2B | **Reported differently** — only an AMD investment in a World Labs funding round was found |
| OpenAI scrapped a GPT-6.1 Astra release for DevDay | **Reported differently** — GPT-6 Astra was reported released in September with a staggered rollout; no cancelled 6.1 found |
| Anthropic's IPO prospectus leaked: valuation above $2T, $4.6B 2025 revenue, $8.06B operating loss, ~25% concentration in two clients, ~$518B commitments | **Reported differently** — other outlets report a valuation near $965B and different loss figures; the leaked figures not verified |
| The More or Less liability exchange; "infinite liability"; the Prime Agent; a Cambridge-led report on automating A.I. research; the other Treats-to-Try items | **Not verified** (the research theme exists; these specific items were not found) |
| MIT xPRO's 42% and Trigger.dev | Advertisements; **not taught** |

**Disclosure:** the A.I. that drafted the lesson is built by Anthropic, which the article names several times (a contender for the main agent, a model release, a testing workflow, the prospectus item), and it was sent to write the lesson as a sub-agent of another agent session — the article's own pattern. The lesson says both.

## Impact

One week added to Sovereign A.I. (30 before, 31 after sov30 lands). No count line moves: `SOVEREIGN_AI_META.weeks` is already a getter, and this change turns the last literal 29s in `sovereign-ai-class.test.js` into derived counts with a floor, so the next week does not edit them either (DR-0677). The week-order guard in the new test fails until sov30 is on main, so this week cannot land ahead of it. One more premise moved with the count: at 30 lessons Sovereign A.I. crosses `SECTION_MIN_LESSONS` and earns the divisions view by design, so `living-lessons-order.test.jsx`, which used it as its short-course example, now uses Made in Time (18 lessons) and asserts the course is under the line, so the example cannot silently outgrow its premise again. sov30 alone would have crossed the line; whichever lands first carries this. Without the lesson, the forwarded question — whose errand does your agent carry — reaches no one; with it, the family reads it Word first, claims sorted.

## Decision — what his word became

**Sovereign A.I. week 31 — `sov31-whose-errand-does-your-agent-carry`**, ten movements, Word first:

1. **One Mediator — the seat is taken** — 1 Timothy 2:5; John 1:29; 1 John 2:1; Hebrews 7:25; Romans 8:34; Romans 8:26; John 10:9; John 14:6.
2. **What the article reported, and what we could verify** — three piles, including where other reports differ; the disclosure; 1 Thessalonians 5:21.
3. **The servant sent to speak for his master** — Genesis 24:2, 3, 12, 27, 33, 56.
4. **Whose agent is it? No man can serve two masters** — Matthew 6:24; John 10:11-13; Proverbs 25:13; Proverbs 13:17; 2 Corinthians 5:20; the sovereign tier and the Cage as built.
5. **Who gets blamed — the ox and the fire** — Genesis 3:12-13; Exodus 21:28-29; Exodus 22:5-6; Deuteronomy 22:8; Galatians 6:7.
6. **A phone, a wallet and a computer — who holds the bag** — John 12:6; Luke 16:11; Mark 13:34; Matthew 24:45-46; the bright line on money, the loop brakes, the lane.
7. **Whoever owns the gate sees your intent first** — Proverbs 4:23; Psalms 139:1-2; Jeremiah 17:10; 1 Samuel 8:11, 17-18.
8. **Write the vision and make it plain** — Habakkuk 2:2; Leviticus 19:35-36; Deuteronomy 25:15; Matthew 5:37; Proverbs 22:29; Luke 6:31.
9. **Jethro's counsel — small matters to the small** — Exodus 18:17-18, 21-22; Acts 6:2-4; the local tier and the Cage; this lesson's own making.
10. **The Advocate who never changes sides; every steward gives account** — Luke 12:42-43; the DR-0100 tiers; Proverbs 14:15; Romans 14:12; 1 Thessalonians 5:21; Hebrews 7:25.

In-app: Admin → Systems (the lane, the loops, the sovereign pipelines) and Admin → Support access. Hands-on: list every tool that acts for you and write who built it, who pays it, and whose errand it carries.

## Verification

- **60 KJV references pinned** (derived from the pin map, not a typed count), every quoted verse filled from `app/public/bible/kjv` by a generator that failed on any fragment drift, present in full in the lesson as `"text" (Ref)`, and re-read from the corpus at test time with an exact match; every `"quote" (Ref)` in the other fields must be a piece of a pinned verse.
- **Non-Scripture quotes allow-listed** to 12 spans of the article's own words and Darrell's marker, each checked against the forwarded email when generated; record ids absent from every reader-facing field.
- **Proven-to-catch:** drifting one word of Genesis 24:33 in the real file ("mine errand" → "my errand") failed 5 tests (the order guard plus 4 drift checks); restored. The test file also mutates 1 Timothy 2:5, a teen-band Matthew 6:24, a smuggled unattributed quote, and the week order, and shows each is caught.

## Re-review

- **2026-10-13** — re-check the not-verified and reported-differently rows against primary sources (the companies' announcements, the Florida court record, the prospectus if public) and promote or drop each in the lesson.
