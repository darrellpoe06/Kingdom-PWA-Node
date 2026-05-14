# Scripture Reference Standard
> *"With all thy getting get understanding."* — Proverbs 4:7 (KJV)
## What This Document Is
This document establishes how scripture is cited across all SKOS materials — documentation, product copy, teaching content, and user-facing features. The standard is uniform so that anyone walking through any SKOS document or screen encounters scripture in a consistent, comprehensible, deepening way.
## The Principle
Different translations are tools for understanding. No single translation captures every nuance of the underlying Hebrew (Tanakh) and Greek (New Testament) texts. Comparing translations reveals what the original language is doing.
Most readers anchor in the translation they grew up with. SKOS honors that anchor while opening the door to deeper understanding through comparison.
The product UX reflects this: the user sees their reading translation by default (set globally to ESV unless overridden); deeper translations are available on expand without cluttering the default view. This is progressive disclosure for scripture.
> *"With all thy getting get understanding."* — Proverbs 4:7 (KJV). Getting one translation is good. Getting **understanding** requires comparison.
## The Translation Set
SKOS standardizes on these translations:
### Primary
**ESV — English Standard Version (2001).** Modern formal equivalence. Word-for-word accuracy in contemporary English. Scholarly precision without archaic language. This is the default translation shown to all SKOS users unless they explicitly change their preference.
### Secondary
**KJV — King James Version (1611).** The translation most older Black church traditions hold authoritative. Cultural and historical anchor for many SKOS users. Elizabethan English requires more reading work but is poetic, memorable, and load-bearing in countless sermons, hymns, and family memories. Always available as a comparison voice.
### Clarification
**NIV — New International Version.** Balanced word-for-word and thought-for-thought. The most-read modern translation worldwide. Useful when the goal is communicative clarity for readers new to scripture.
**AMP — Amplified Bible.** Expands key Hebrew and Greek words inline with bracketed clarifications. Reveals the multiple senses of a single original word. Excellent for teaching and study.
### Word-study
**Strong's Concordance.** Provides Hebrew and Greek word references (G#### for Greek, H#### for Hebrew). Used when a specific word's etymology, range of meaning, or original sense matters.
## The Citation Pattern
When a scripture grounds a foundation, module, or teaching, the pattern is:

```
**ESV — [Book Chapter:Verse]:** *"[verse text]"*
```


When multiple translations clarify, the pattern expands:

```
**ESV — [Book Chapter:Verse]:** *"[verse text]"*
**KJV — [Book Chapter:Verse]:** *"[verse text]"*
**AMP — [Book Chapter:Verse]:** *"[verse text]"*
> Greek/Hebrew: *[word]* ([Strong's #####]). [Brief gloss.]
```


The ESV citation comes first. Other translations follow when they add clarity. Word-study comes last when relevant.
## Worked Example
**ESV — Philippians 4:8:** *"Finally, brothers, whatever is true, whatever is honorable, whatever is just, whatever is pure, whatever is lovely, whatever is commendable, if there is any excellence, if there is anything worthy of praise, think about these things."*
**KJV — Philippians 4:8:** *"Finally, brethren, whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely, whatsoever things are of good report; if there be any virtue, and if there be any praise, think on these things."*
**NIV — Philippians 4:8:** *"Finally, brothers and sisters, whatever is true, whatever is noble, whatever is right, whatever is pure, whatever is lovely, whatever is admirable—if anything is excellent or praiseworthy—think about such things."*
**AMP — Philippians 4:8:** *"Finally, believers, whatever is true, whatever is honorable and worthy of respect, whatever is right and confirmed by God's word, whatever is pure and wholesome, whatever is lovely and brings peace, whatever is admirable and of good repute; if there is any excellence, if there is anything worthy of praise, think continually on these things [center your mind on them, and implant them in your heart]."*
> Greek: *logizomai* (G3049) — accounting/reckoning. "Think" here is not passive musing. The mind is actively calculating, weighing, totaling these inputs.
This pattern: ESV anchor, KJV continuity, NIV/AMP for nuance, word-study for depth.
## Capitalization Bindings
SKOS uses these capitalization rules consistently — including in all scripture citations:
**Always Capitalized:**
- Yahweh, God, the Lord
- Jesus, Christ, Yahshua, Messiah
- Holy Spirit, the Spirit
- All pronouns referring to the above (He, Him, His, You, Your, etc., when referring to God)
**Never Capitalized:**
- lucifer, satan, the devil, the adversary
- All pronouns referring to the above
These bindings appear in `CLAUDE.md` at repo root and govern all SKOS-generated text. When a translation natively lowercases divine pronouns (some modern translations do), SKOS does NOT alter the quoted verse text. The bindings apply to SKOS-authored prose around the verses.
## UX Implementation Reference
In the SKOS PWA:
- Every scripture reference displays ESV by default (or user's chosen primary translation)
- A subtle expand control reveals the other translations and word-study
- The user is never overwhelmed by parallel columns; depth is opt-in
- Audio playback (TTS) is available on every verse and every cited passage with per-content speed control
- App-wide reading and audio speed preferences let faster thinkers move faster
See `UX-PATTERNS.md` for the technical UX spec of the Scripture component.
## Why Multiple Translations Matter
Some readers grew up on KJV and find ESV unfamiliar. Some are new to scripture entirely and need NIV's accessibility. Some are teachers who need AMP's clarification. Some are researchers who need Strong's precision.
By holding all five in the standard, SKOS serves all five readers — without forcing anyone out of their comfort, while offering everyone a path to deeper understanding.
The Holy Spirit speaks to different people through different translations. SKOS refuses to make any one translation an idol. The Word breathes through all faithful translations.
## Religion AND Relationship in This Standard
**Religion-side:** Disciplined, consistent citation. Honoring the textual scholarship of multiple translation committees. Treating scripture with the rigor it deserves.
**Relationship-side:** Recognizing that the Holy Spirit speaks personally to readers through whichever translation lands in their heart. The Word is a Person (John 1:1), and a Person speaks differently in different rooms.
Both.
---
*See also:* `THE-WAY.md` (meta-frame), `MIND-OF-CHRIST.md` (where this standard is heavily applied), `UX-PATTERNS.md` (technical implementation of the Scripture component), `EXCELLENCE-STANDARD.md` (consistency in scripture citation as one expression of excellence).
