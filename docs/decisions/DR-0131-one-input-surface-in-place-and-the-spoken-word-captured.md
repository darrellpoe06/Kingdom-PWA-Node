# DR-0131 — One input surface per tab, acting in place; every spoken word lands in a governed stream

- **Status:** accepted
- **Tier:** A/B (consolidation of existing input surfaces + a motion-safety rule + a captured teaching; no new data class)
- **Scope:** `components/ChurchHome.jsx` (the duplicate widget retired), `components/ChurchOneVoice.jsx` + `components/OneVoiceInput.jsx` (the one surface, retitled, with the explicit email-copy secondary), `components/InputCenter.jsx` (deleted — duplicate primitive), `lib/godhead-study.js` + `godhead-study-verses.json` (the Door algorithm), `lib/eternal-algorithms-course.js` (the declared purpose), the church-home render gate
- **Date:** 2026-07-09
- **Principles:** APP-IS-PRIMARY, NO-STATIC-DATA (DR-0121), MODE-ROUTING, COUNCIL-CHAMBER, SPOKEN-TEACHINGS-ARE-BUILD-INPUT, VERIFICATION-DOCTRINE (DR-0076), ANXIETY-CLARITY

## Directive

Darrell, 2026-07-09, after speaking a teaching into the church tab's second input widget: *"What happened when I input or spoke this into the input inside the PoeTech App?"* — then: *"I also don't like how the input shifts fast to another page on the app surface this needs to open inplace and not move fast from that location because humans can get dizzy"* — then: *"Also only have one input surface from PoeTech on any and all tabs relevant to receive input so Ari can transcribe and enter the information for the user filling up their responses on any page they want also feedback should be deciphered and also updated from these exchanges."*

## The verified trace (the answer to "what happened")

The church tab stacked TWO input surfaces. The master box (`OneVoiceInput`) routes every entry to a real persistent stream — church voice, prayer, conference, incidents, counseling intake, and PoeTech build directives that relay to the NAS thought-inbox. The SECOND widget ("Yahweh Hears You", an inlined fork of the old InputCenter) held its log in **React memory only** ("local-only until v2.7 sync wires up") — a reload erased it — and its "Send →" was a **raw `mailto:` with `target="_self"`** that navigated the whole app surface into the mail client (the fast shift). "✓ sent" recorded only that the link was tapped. Darrell's spoken teaching therefore reached (a) a volatile in-memory list and (b) an email draft — and NO governed stream. It reached the build only because he pasted it into the build session by hand.

## Decision

1. **One input surface per tab.** `OneVoiceInput` is THE input primitive. The church tab now mounts exactly one — retitled with the surface's true name, **"Yahweh Hears You · Speak · Type · Link"** — carrying both promises (the classifier's routing AND the old widget's sermon-note/link/thought invitation). The duplicate widget and the parallel `InputCenter.jsx` primitive are deleted. The render gate asserts exactly one input surface on the Speak tab.
2. **Input acts in place — the motion rule.** Submitting never navigates, never auto-switches tabs, never auto-scrolls (extends MODE-ROUTING's never-auto-switch to motion). External hand-offs (emailing the office) are explicit, secondary, clearly labeled links opening a NEW context (`target="_blank"`) — the gate asserts no in-place `mailto:` remains. Fast surface shifts are a vestibular accessibility harm, not a style choice.
3. **Every entry lands in a governed, persistent stream.** The one box's routes are the streams Ari already tends (DR-0120): church voice (synced instance data, shown as the box's own "Recently heard" log), prayer requests, PoeTech build directives (`appDirectives` + the wf26 NAS thought-inbox relay), incidents, inquiries. "Feedback deciphered and updated from these exchanges" is satisfied structurally: the exchanges ARE stream rows, visible to the tending lanes — nothing lands in a dead end.
4. **The spoken teaching is captured (SPOKEN-TEACHINGS-ARE-BUILD-INPUT).** The word Darrell spoke into the widget — *"the only way for us to listen to Him is to analyze His algorithms, His ways... if you don't come through Christ you can't get to the eternity — these are the algorithms we want to process and understand"* — ships as the Godhead catalog pattern **`gh-door-christ` — "The Door (no way to eternity but through Christ)"** (John 10:9; John 14:6; Matthew 7:13-14; Acts 4:12 — all fetched verbatim into the verse artifact), and it auto-joins the derived Gospels processing course (DR-0126's engine — nothing re-typed). His declared purpose is woven into the processing courses' own audience line.

## Opportunities and constraints

- **Opportunity (the program this DR starts):** roll the one-primitive rule across every input-receiving tab (Books notes, Practice intake, Projects capture) — each conversion mounts `OneVoiceInput` with a surface config, never a new fork. `re-review: 2026-07-22`.
- **Opportunity (Ari transcribe-and-fill):** "Ari can transcribe and enter the information for the user, filling up their responses on any page" is the credentialed tending-lane capability — Tier C, three brakes (DR-0120 §3); the one-surface + governed-streams work here is its prerequisite plumbing. `re-review: 2026-07-22`.
- **Opportunity:** surface `appDirectives` + church-voice as Perpetual Report streams so spoken input is queryable history (DR-0122 §3). `re-review: 2026-07-22`.
- **Constraint (held):** the retired widget's log was never persisted, so there was nothing to migrate; the one teaching it held was captured into the catalog by hand this session — the class of loss it represented is what this DR closes.
- **Constraint (held):** `mailto:` on mobile inherently hands off to the mail app; the rule is not "no email" but "never as the primary path, never in place, always labeled."

## Supersedes / pairs

Pairs with DR-0126/DR-0129 (derived courses — the captured pattern auto-joins), DR-0120 (tending lanes receive the streams), DR-0121 (no static/memory-only data), COUNCIL-CHAMBER + MODE-ROUTING (the one-input doctrine this makes physical). Retires the InputCenter duplicate (2026-05-25 era) in favor of the 2026-06-15 master.
