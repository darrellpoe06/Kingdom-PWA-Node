# DR-0142 — A door that names the Chamber opens the Chamber

- **Status:** accepted
- **Tier:** A — a documented navigation bug-class fix; no schema, no money, no new external face
- **Scope:** `components/ChurchHome.jsx` (initialSection), the host's launch resolver + `churchHomeSection` state, `components/Library.jsx` resolver, six chamber-intent launch targets (church-classes wk1, ai-legal ×2, broadcast captions, sovereign-ai tutor, book-engine testimony), `components/ChurchLearn.jsx` launchLabel, `__tests__/council-chamber-launch.test.js`
- **Date:** 2026-07-10
- **Principles:** REALITY-TRACE (DR-0061), VERIFICATION-DOCTRINE (DR-0076), COUNCIL-CHAMBER, MODE-ROUTING, ANXIETY-CLARITY, NO-STATIC-DATA

## Directive

Darrell, 2026-07-10, with a screenshot of the Worship video: *"Council Chamber goes to the video for church latest instead of the chamber… etc."* Plus the standing frame: Ways/docs/O&C/Ari updated with the feature, in-app, no static data.

## The verified trace

The Learn lessons' launch button says **"Open the Council Chamber"** but its target was `{view:'church', churchView:'home'}` — and the church home's section tabs default to **Worship**, which autoplays the latest message. The learner lands on a video after being promised the Chamber. The Chamber is real and live — it is the church home's **Speak** section (the one-voice input, DR-0131: "Yahweh Hears You · Speak · Type · Link") — but no launch target could name a section, so every "chamber" door actually opened the video. Six doors carried this premise: the youth AI class week 1 ("Send your very first prompt in the app's Council Chamber"), both AI-Legal sovereignty exercises ("Open our own A.I."), the broadcast captions drill, the sovereign-AI tutor exercise, and the book-engine's testimony link (a testimony is *spoken*). The label function then blessed the wrong door: any `church/home` target read "Open the Council Chamber."

## Decision

1. **Launch targets can name the section.** A target may carry `churchSection`; the host resolves it into the church home's section tabs (`initialSection`), remounting on change so the named door always opens. Both resolvers (the Learn launcher and the Library's link navigator) honor it; the Live-Worship bar explicitly resets to the Worship default because that shortcut IS the stream.
2. **Every chamber-intent door opens the Speak section.** The six targets above carry `churchSection:'speak'`. The OBS switching lesson keeps plain home — a streaming lesson wants the stream.
3. **The label never claims a door it doesn't open.** `launchLabel` says "Open the Council Chamber" ONLY for a speak-section target; plain church home reads "Open the church home."
4. **The class is pinned structurally, not per-instance:** the test sweeps EVERY course module and requires any lesson whose in-app activity mentions the Chamber / "our own A.I." to launch into the speak section — a future lesson that forgets fails the build, not the learner.

## Opportunities and constraints

- **Opportunity:** the section could ride the URL (`?view=church&sub=home&sec=speak`) so a texted link can open the Chamber directly; fold into the existing param routing. `re-review: 2026-07-24`.
- **Opportunity:** the Chamber's own header could say "Council Chamber" alongside "Yahweh Hears You" so the arriving learner knows they've landed where the lesson pointed. `re-review: 2026-07-24`.
- **Constraint (held):** a launch to a section remounts the church home surface (transient form state resets); acceptable because launches always arrive from another tab.

## Supersedes / pairs

Pairs with DR-0131 (the chamber this opens), COUNCIL-CHAMBER.md / MODE-ROUTING.md (the doctrine), DR-0139 (same night's boots-is-the-bar), REALITY-TRACE (the label claimed a surface it never showed). Supersedes the home-means-chamber label mapping.
