# UX Patterns
> *"Let all things be done decently and in order."* — 1 Corinthians 14:40 (KJV)
## What This Document Is
This document specifies the user experience patterns used consistently across the SKOS PWA. It is the bridge between the theological foundations (`THE-WAY.md`, `MIND-OF-CHRIST.md`, `EXCELLENCE-STANDARD.md`, `SCRIPTURE-REFERENCE-STANDARD.md`) and the technical implementation in the platform layer.
When a developer implements a new feature in SKOS, this document tells them how scripture should render, how audio should play, how depth should be revealed, and what consistency to maintain.
## Design Principles (Derived from Foundations)
These principles cascade from `EXCELLENCE-STANDARD.md`:
1. **Progressive disclosure.** Default views are clean. Depth is available on expand.
2. **Religion AND relationship.** Every screen has both backbone and warmth.
3. **Comprehensive but uncluttered.** Hide depth without removing it.
4. **Speed serves the user, not the developer.** The product is built to be fast for the user's brain, not fast for the developer's convenience.
5. **Accessibility is non-negotiable.** Screen readers, keyboard navigation, color contrast, and reduced motion are first-class.
## Pattern 1: Scripture Component
### Specification
Every scripture reference in the SKOS PWA renders through a unified `<Scripture>` component.
### Default State

```
[ESV] Philippians 4:8                                  [⌃]
"Finally, brothers, whatever is true, whatever is 
honorable, whatever is just, whatever is pure..."
                                                  [▷ 1.0x]
```


The default shows:
- Translation badge (user's primary, default ESV)
- Reference (book chapter:verse)
- Verse text in user's chosen translation
- Expand control (chevron)
- Audio playback control with current speed
### Expanded State (after user taps chevron)

```
[ESV] Philippians 4:8                                  [⌄]
"Finally, brothers, whatever is true..."
                                                  [▷ 1.0x]
────────────────────────────────────────────────────────
[KJV] "Finally, brethren, whatsoever things are 
true, whatsoever things are honest..."            [▷ 1.0x]
[NIV] "Finally, brothers and sisters, whatever is 
true, whatever is noble..."                       [▷ 1.0x]
[AMP] "Finally, believers, whatever is true, 
whatever is honorable and worthy of respect..."   [▷ 1.0x]
> Greek: logizomai (G3049) — accounting/reckoning.
  "Think" here is active calculation, not passive 
  musing.
```


The expand reveals:
- KJV (always shown when expanded)
- NIV (always shown when expanded)
- AMP (always shown when expanded)
- Strong's word-study (when annotated by content author)
- Per-translation audio playback
### User Preference Override
In Settings → Reading, the user can:
- Change their primary translation (which shows by default)
- Choose which secondary translations appear in the expand
- Disable Strong's annotations if desired
- Set default expand behavior (always collapsed, always expanded, remember last state per content)
### Component API (Implementation Reference)

```typescript
interface ScriptureProps {
  reference: string;          // e.g., "Philippians 4:8"
  primaryText: string;        // ESV by default, or user's chosen primary
  alternateTexts?: {
    kjv?: string;
    niv?: string;
    amp?: string;
  };
  wordStudy?: WordStudy[];    // Strong's annotations from content author
  initiallyExpanded?: boolean;
}
```


## Pattern 2: Audio (TTS) Component
### Specification
Every piece of readable content in SKOS — scriptures, foundation docs, module copy, teaching content — has a play button.
### Implementation Approach (Phase 1)
**Voice provider: Browser default (Web Speech API).** Works everywhere, free, no per-character cost. Voice quality is acceptable; speed and pause control are excellent.
**Architecture:** The TTS implementation is wrapped behind an interface (`ITTSProvider`). The browser implementation is one provider. A premium provider (ElevenLabs, AWS Polly Neural, Google Cloud TTS, etc.) can be swapped in later without touching feature code.

```typescript
interface ITTSProvider {
  speak(text: string, options: TTSOptions): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  setRate(rate: number): void;
  getVoices(): Voice[];
}
interface TTSOptions {
  rate: number;       // 0.5 to 3.0
  voice?: string;     // voice identifier
  onEnd?: () => void;
}
```


When SKOS later upgrades to a premium voice provider, only the provider class changes. All feature code that calls `tts.speak(...)` continues to work.
### Per-Content Controls
Every play button has:
- **Play / Pause toggle**
- **Speed indicator and slider** (default app-wide preference, override per content)
- **Voice selector** (when multiple voices are available)
Speed slider range: **0.5x to 3.0x**, in 0.1x increments. Default app-wide: **1.0x**.
### App-Wide Speed Preference
In Settings → Reading & Audio:
- **Default reading speed** (slider, 0.5x to 3.0x)
- **Default voice** (dropdown of available browser voices)
- **Auto-play scripture** (toggle — when a scripture component renders, should it auto-play? Default: off)
### Why Speed Control Matters
People process language at different speeds. A reader who thinks fast can absorb a passage at 1.5x or 2x in less time without losing comprehension. A reader who needs more time can drop to 0.8x or 0.7x. Both should be served.
This is `EXCELLENCE-STANDARD.md` enacted: the product respects the user's cognition.
## Pattern 3: Progressive Disclosure
### When to Use
Anywhere SKOS has both a simple essential view AND deeper informational/comparative content:
- Scripture (ESV default; KJV, NIV, AMP, Strong's on expand)
- Module dashboard tiles (summary number visible; detail on tap)
- Decision tools (the recommended option visible; the reasoning and alternatives on expand)
- Glossary terms (definition visible; etymology, scripture cross-references, and history on expand)
### Implementation Pattern

```
[Essential View]
  [▾ Show more]
(Expanded:)
[Essential View]
  [▴ Show less]
  ──────────────
  [Detailed Content]
```


### What Progressive Disclosure Is NOT
Not for hiding important information that the user must see (warnings, decisions they must make, consents).
Not for adding friction to common tasks (the most-used action should not be hidden behind an expand).
Not for content that's purely promotional — SKOS does not have promotional content.
## Pattern 4: The Test (Mental Stewardship Tool)
### Specification
A user can invoke the Test (from `MIND-OF-CHRIST.md`) on any thought, content, decision, or piece of writing at any time.
### Entry Points
- Global navigation: "Run the Test"
- Within a journal entry: "Test this thought"
- Within content reading: "Test this content"
- Within scripture study: "Test my response to this verse"
### Flow
1. User invokes the Test
2. User enters or selects the thought/content to test
3. The eight questions appear (Phil 4:8 filter), Adult or Kids version selectable
4. The user answers each Yes/No, optionally with notes
5. Result: PASS (all 8 yes) or FAIL (any 1 no) with the specific criterion that failed
6. If FAIL: capture and redirect workflow appears
### Output
- A timestamped record in the user's journal
- The captured thought (if it failed) is stored in a "captive thoughts log" for the user to review patterns over time
- The redirection chosen (scripture, prayer, action) is also logged
### AI Coaching Mode
In Settings, a user can enable "AI-coached Test" which uses Claude (or the configured AI provider) to walk through each criterion with the user, explain reasoning, and suggest redirections. This is `MIND-OF-CHRIST.md` Mode B.
## Pattern 5: Religion / Relationship Dual Framing
### Specification
Throughout the app, where SKOS provides advice, the response should show both a structured (religion) and a personal (relationship) angle when applicable.
### Example
In a financial module's recommendation:
**Structured (Religion):** *"Based on the avalanche method, prioritize the 24% APR credit card. Mathematically optimal."*
**Personal (Relationship):** *"Some families benefit from quick wins for momentum. If the smallest debt would feel like a victory and keep you going, the snowball method is also faithful stewardship."*
Both. The user is empowered to choose the path that holds both biblical wisdom (structure) and personal fit (life context).
### When NOT to Use
When the choice is unambiguous (e.g., "don't lie"), do not artificially create a "relationship-flavored" alternative. The dual framing serves discernment within a faithful range, not relativism.
## Accessibility (A11y) Requirements
These apply to every pattern above:
- All controls keyboard-accessible
- All non-text content has text alternatives
- Color contrast meets WCAG AA minimum (AAA where feasible)
- Audio playback has visual transcript fallback
- Reduced motion mode respected (no auto-animation)
- Screen reader semantics correct (proper headings, ARIA where needed)
- Touch targets minimum 44×44pt on mobile
## Religion AND Relationship in This Standard
**Religion-side:** Disciplined consistency. Every scripture component renders the same way. Every play button works the same way. Every progressive disclosure follows the same pattern.
**Relationship-side:** The user is met where they are — at their reading speed, in their primary translation, with the depth they want available but not forced. The product breathes with the user, not against them.
Both.
---
*See also:* `EXCELLENCE-STANDARD.md` (the principles these patterns enact), `SCRIPTURE-REFERENCE-STANDARD.md` (the translation citation pattern these UX patterns implement), `MIND-OF-CHRIST.md` (the foundation that the Test pattern serves), `THE-WAY.md` (the meta-frame).
