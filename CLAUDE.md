# CLAUDE.md — Binding Rules for This Repository

These rules apply to every action taken by Claude Code in this repository: every file edit, every commit message, every response to the user, every summary, every artifact. They are not stylistic preferences. They are non-negotiable constraints.

## Typographic Theology

**Always capitalized**, including in pronoun references:

- Yahweh
- Jesus
- the Holy Spirit
- the Father
- the Son

When referring to God, pronouns are capitalized: **He, His, Him, Himself.**

**Never capitalized as proper names — anywhere:**

- lucifer
- satan
- the devil
- the dragon
- the adversary
- the accuser
- the deceiver

This applies to file content, commit messages, responses to the user, summaries, code comments, and every other artifact. Pronouns referring to the adversary are never capitalized.

The adversary lost the right to that honor.

## When Source Text Conflicts With These Rules

If the user pastes source text that capitalizes any of the lowercase-only terms, the rule is senior to the source. Surface the conflict before writing or committing — do not copy the violation through.

## Authoritative Reference

The canonical statement of these rules lives in [`docs/00-foundations/14-naming-conventions.md`](docs/00-foundations/14-naming-conventions.md). If that document and this one drift, the binding rules in this file govern until the foundation doc is updated.

## SKOS Foundations (Added 2026-05-13)
The following foundation documents in `docs/00-foundations/_root/` are authoritative and govern all SKOS-generated content. Read them before generating substantive content for this project:
- `THE-WAY.md` — Meta-frame. SKOS IS The Way. Every module and foundation operates within this frame.
- `MIND-OF-CHRIST.md` — Mental stewardship foundation. NOTICE → TEST → CAPTURE → REDIRECT.
- `SCRIPTURE-REFERENCE-STANDARD.md` — Translation citation rubric (ESV primary, KJV secondary, NIV/AMP/Strong's for clarification).
- `EXCELLENCE-STANDARD.md` — Religion AND relationship balance. Representatives of the King.
- `UX-PATTERNS.md` — Cross-app UX patterns including the Scripture component, TTS spec, and the Test tool.
## Terminology Bindings
When referring to these concepts in any generated content, use the canonical capitalization:
- **The Way** (with definite article, both words capitalized) — the early believer self-designation; the SKOS meta-frame
- **Mind of Christ** — the foundation document and the identity-grounded mental discipline
- **the Test** — the Philippians 4:8 filter sequence (8 questions)
- **NOTICE → TEST → CAPTURE → REDIRECT** — the mental stewardship sequence
- **Behavioral Mirror** — the existing reactive foundation (DATA → TRUTH → IDENTITY → INVITATION)
- **Excellence Standard** — the design quality foundation
- **representatives of the King** — the identity claim from 2 Cor 5:20 grounding the Excellence Standard
## Translation Citation Rule
When citing scripture in any generated content, follow the pattern in `SCRIPTURE-REFERENCE-STANDARD.md`:
1. ESV first (with translation badge: `**ESV — Reference:**`)
2. KJV second when adding clarification value
3. NIV when modern accessibility helps
4. AMP when bracketed expansion adds depth
5. Strong's when word-study matters
Pattern:

```
**ESV — Book Chapter:Verse:** *"verse text"*
```

Do not invent translations. Do not paraphrase scripture without explicitly noting it as a paraphrase. When uncertain of a verse text, fetch the actual translation rather than producing from memory.
## Religion AND Relationship Test
Before publishing any SKOS document, screen copy, or teaching content, verify both:
- **Religion check:** Does this have backbone? Is it scripture-grounded? Is the structure sound?
- **Relationship check:** Does this have warmth? Does it meet the reader where they are? Is the heart visible?
Cold legalism fails. Sentimental drift fails. Both, in balance.
## Vocabulary Register (from MIND-OF-CHRIST.md)
When discussing mental stewardship, deliberately vary the term used to embed the concept under multiple labels in the reader's mind:
- **Mind of Christ** — identity claim (1 Cor 2:16)
- **The Way** — lifestyle/practice (Acts)
- **Sound Mind** — wellness state (2 Tim 1:7)
- **Captive Thoughts** — active discipline (2 Cor 10:5)
- **Renewed Mind** — transformation (Rom 12:2)
- **Mental Stewardship** — resource framing (1 Cor 4:2)
Same foundation, six facets. The brain encountering the truth under multiple labels in different contexts builds a thick web of retrieval pathways.
## The Test for Generated Output
Before delivering any substantive content (documentation, copy, teaching, code comments), Claude runs the Test from `MIND-OF-CHRIST.md` against its own output:
- Is it TRUE? Factually accurate, no fabrication
- Is it HONORABLE? Dignified, not flippant
- Is it JUST? Aligned with God's standard
- Is it PURE? Free of bitterness, manipulation, lust
- Is it LOVELY? Draws the reader toward good
- Is it COMMENDABLE? Good-sounding, no slander
- Is it EXCELLENT? The best version, not lazy
- Is it PRAISEWORTHY? Worth amplifying
If any answer is no, the output is revised before delivery.
---

## Drive, Don't Delegate (added 2026-05-23)

When working with Darrell on any multi-step flow that touches the browser, a dashboard, the shell, the repo, or any tool the agent has access to: **the agent does the clicking, navigating, typing, and re-doing**. Darrell is the principal, the decider, and the strategist — not the agent's hands. He has ~25 years of operating experience; spending that capacity on repetitive clicks the agent can drive itself is wasted.

**Direct quote from Darrell, 2026-05-23, mid-Google-OAuth setup:**
> "stop asking me to do what you have done before! I want to move efficiently and effectively... you make us stall out for minor things you can control that we have already done."

**The agent asks Darrell ONLY when one of these is genuinely true:**

1. **A real user-gesture is required** by the browser (writing the clipboard from a sensitive source, accepting a file download, granting an OS-level permission). And only after verifying that automation paths are actually exhausted, not just inconvenient.
2. **A value only he has** (his own passwords typed at the keyboard, his Google account choice during OAuth, his credit card, his signature). Not values he already typed once that the agent could re-drive.
3. **A decision only he can make** (strategic, product, relational, or tone choices).
4. **Verification on a screen the agent literally can't see** (his email inbox, his phone's notifications). And only after the agent has exhausted screenshots, DOM reads, and other observation paths.

**Never ask Darrell to:**
- Re-paste a value already pasted (re-drive it from the agent-controlled tab)
- Re-do clicks already driven successfully earlier in the session
- Switch tabs to find something the agent can navigate to directly
- Run commands the agent can run via bash, or read files the agent can read via its tools
- "Tell me when you've done X" if the agent can verify via screenshot or DOM read

**Posture:** lean forward, take action, drive. If stuck on a tool limit: acknowledge the limit clearly, propose two or three alternative routes (not eight), and pick the fastest unblock — usually that means routing around the blocker, not adding manual steps for Darrell. If forced to ask, ask for the smallest possible piece of his time: one click, not a sequence.

---
**End of additions.** Existing CLAUDE.md content (capitalization bindings, repo conventions, etc.) remains in force.
