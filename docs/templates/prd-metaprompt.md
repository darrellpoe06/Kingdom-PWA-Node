# PRD Meta-Prompt

> **What this is.** A reusable meta-prompt for generating a build-ready PRD from a feature request. Paste it (or load it as context) when Darrell brings a feature idea. It produces a filled draft of `prd-template.md` -- pre-filling everything the LLM can infer, leaving only the genuine-judgment sections empty with a one-line callout. This kills the PRD-from-scratch-each-time pattern (per the Tina Huang research-review). It pairs with `prd-template.md` (the output shape) and `operating-instructions.md` (the posture).

---

## The meta-prompt

You are generating a Product Requirements Document for a PoeTech build. The output shape is the 10-section structure in `docs/templates/prd-template.md`. Follow this procedure exactly.

### Phase 0 -- Orient from memory first (do NOT ask yet)

Before asking Darrell anything, orient yourself per the Drive-Don't-Delegate rule:

1. Read `CLAUDE.md` (Layer 0), the relevant `docs/00-foundations/_root/*.md` (Layer 3), and the `memory/MEMORY.md` index plus any memory files whose descriptions match this feature.
2. Read any existing `docs/99-session-notes/*.md` research-reviews or audits that touch this feature area.
3. Identify which existing n8n workflow(s) in `docs/00-foundations/n8n-workflows/` the build rides on or extends (use their `meta.poetech` module + industry + tier tags).
4. Identify which sovereign-mesh Tier, which industry (Church / Therapy / online / Dev/Ops), and which module the build belongs to.

### Phase 1 -- Pre-fill every section you can infer

Fill in `prd-template.md` Sections 1 through 10 with your best inference. Be concrete, not hedged. Specifically:

- **Section 1 (Problem + who):** name the specific sufferer and what they cannot currently do.
- **Section 2 (Success + KPIs):** propose observable success criteria and the QoL sector served.
- **Section 3 (Scope):** propose in / out / deferred. Default to the smallest v1 that delivers Section 2.
- **Section 4 (Architecture + Tier):** sketch the architecture from the existing substrate. Label the sovereign-mesh Tier. Name the workflows/foundations/memories it rides on.
- **Section 5 (Phases):** propose v1 / v2 / v3.
- **Section 6 (Risks):** list the real risks and mitigations, including any adjacent governance bright line.
- **Section 7 (Test plan):** propose the test plan and acceptance criteria per build-test-report.
- **Section 9 (Cost screen):** propose the cost band and whether a sovereign $0-marginal path exists.
- **Section 10 (Religion AND Relationship + Phil 4:8):** run the screen and the Test on the spec.

### Phase 2 -- Leave ONLY genuine-judgment sections for Darrell

Section 8 (Open questions) and any sub-point inside other sections that is a true judgment call -- strategic, product, relational, tone, theological, or build-length -- gets left empty with a one-line callout in this exact form:

> **[FOR DARRELL TO DECIDE]** <the single question, phrased so a one-word or one-line answer resolves it>.

Do not leave a callout for anything you could have sourced from memory, the repo, or the foundations. Do not ask a question whose answer you already pre-filled. The one thing you almost always cannot guess is build length (3 / 5 / 8 hours) -- ask that if it is unclear.

### Phase 3 -- Recap and deliver

Deliver the filled PRD. Above it, give a 3-to-5-line recap of what you inferred and from where, so Darrell can correct any wrong inference in one pass. Then list the `[FOR DARRELL TO DECIDE]` callouts in one place so he can answer them in a single reply.

### Binding constraints on the output

- Run the Test (Phil 4:8) and the Religion-AND-Relationship screen on the PRD before delivering.
- Honor the typographic theology binding in all prose.
- Cite Scripture per `SCRIPTURE-REFERENCE-STANDARD` (ESV primary) if any verse appears; do not invent or paraphrase translations.
- If the feature is adjacent to a governance bright line, say so in Section 6 -- do not silently route around it.
