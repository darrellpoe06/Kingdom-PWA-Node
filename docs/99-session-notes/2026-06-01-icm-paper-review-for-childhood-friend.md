# Review: Van Clief & McDermott, "Interpretable Context Methodology: Folder Structure as Agentic Architecture" (arXiv:2603.16021v2, March 2026)

**Reviewer:** Claude (PoeTech AI Foundation), at Darrell Poe's request
**Date:** 2026-06-01 evening
**For:** Darrell's childhood friend, who forwarded the paper
**Paper:** https://arxiv.org/pdf/2603.16021
**Authors' repo:** https://github.com/RinDig/Interpretable-Context-Methodology-ICM-
**Authors' affiliation:** Eduba / University of Edinburgh (Palm Coast, Florida)

---

## TL;DR

This is a solid, well-cited, intellectually honest paper. It proposes that for sequential AI workflows with human review at each step, the file system itself can replace orchestration frameworks like LangChain / CrewAI / AutoGen. The architecture: numbered folders for stages, markdown files for prompts + context, local Python scripts for mechanical work, a single orchestrating agent reading the right files at the right time. It is grounded in real Unix engineering tradition (McIlroy, Kernighan, Pike, Parnas, Dijkstra, Raymond, Plan 9, Make, multi-pass compilers) and real human-AI interaction research (Horvitz, Shneiderman, Rudin, Amershi, Liu's "lost in the middle"). The authors are appropriately humble about scope -- they explicitly name where this does NOT work (real-time multi-agent collaboration, high-concurrency, automated branching).

**My honest take:** the contribution is real but narrow. ICM is correct that a meaningful class of AI workflows is currently over-engineered with framework code that should be folder structure. The five-layer context hierarchy (Layer 0: identity / Layer 1: routing / Layer 2: stage contract / Layer 3: reference / Layer 4: working) is a useful taxonomy that I will steal for our own work. The Layer 3 vs Layer 4 distinction (factory vs product, internalize-as-constraint vs process-as-input) is the paper's most original move and probably its most durable contribution. The biggest blind spot is concurrency and real-time signal handling -- the paper handles this by declaring it out of scope, which is academically honest but leaves a real gap for production systems.

## What the paper gets right

1. **The five-layer hierarchy is a real cognitive aid.** Naming the layers makes the implicit explicit. Most teams using Claude Code / Cursor / Codex are already doing something like this (a CLAUDE.md at the root, a per-project README, stage notes, conventions docs, working files), but they are doing it ad hoc. Naming it lets you debug the layering when output is wrong.

2. **Layer 3 / Layer 4 separation is the standout insight.** Practitioner intuition has long been that "instructions and examples should be separate from the data being processed," but the paper grounds this in Liu et al.'s "lost in the middle" findings and gives it a concrete folder-level expression (`references/` vs `output/`). The factory / product analogy is teachable.

3. **The Unix lineage is well-earned, not name-dropped.** Citations to McIlroy 1978, Ritchie & Thompson 1974, Parnas 1972, Dijkstra 1974, Knuth 1984 are not decorative -- the authors actually argue from those primitives. The Make / Plan 9 / pipe-and-filter analogies are accurate. Knuth's literate programming framing of "the markdown files are simultaneously the instruction set AND the documentation" is exactly right.

4. **The portability argument is unanswerable.** A workspace is a folder. Copy it, email it, commit it, sync it through any cloud. No server, no environment, no deployment. This is a real win over framework-based solutions whose hand-off requires documentation + dependency management + ongoing technical support.

5. **The honest acknowledgement of where this does not work.** Section 5.2 names three categories ICM is wrong for (real-time multi-agent, high-concurrency, automated branching). Most architecture papers do not name their failure modes this clearly. This is intellectually honest and protects the reader from over-application.

6. **Practitioner observations, not just designer claims.** Section 4.5's U-shaped intervention pattern (heavy editing at stage 1 for direction-setting, light at middle stages, heavy at final stage for alignment) is consistent with what we would expect from Parasuraman / Sheridan / Wickens's automation taxonomy. The note that three non-coders built workspaces using only markdown editing is a small but meaningful data point.

7. **Section 4.6 explicitly catalogs threats to validity.** Self-selection bias, informal data collection, single-model-family testing, no controlled comparison against monolithic prompting. The paper does not hide its limitations. This is what an honest practitioner paper looks like.

## What the paper gets wrong or under-argues

1. **Concurrency is hand-waved.** "ICM is local-first by design. Scaling it to concurrent users would require building the infrastructure ICM was designed to avoid." That is true, but it leaves a major class of production systems unaddressed, AND it understates the difficulty of concurrent edits even on a single user's machine. We hit this exact failure mode today in our own work -- two Claude sessions writing to the same `.git` directory caused a torn-index that took ~10 minutes to recover from. A real ICM deployment with two agents running in parallel on the same workspace will hit similar problems. The paper should at minimum cite Plan 9's per-process namespaces (which it mentions in passing) as a partial solution and name file locking, atomic writes, and write-ahead logs as open work.

2. **Real-time signal handling has no answer.** ICM's stage-to-stage handoffs are batched: stage N writes a file, stage N+1 reads it. For workflows where input arrives event-driven (a webhook fires, a chat message lands, a sensor reports), polling a directory is fundamentally less efficient than a webhook-to-handler subscription. The paper does not say "use a hybrid" or "ICM is for the batch layer of a Lambda architecture" -- it just declines to address the question. For practitioners with real-time requirements, this gap is load-bearing.

3. **Pre-authorized governance is missing.** The paper assumes a human reviews at every stage boundary. For systems that need autonomous execution under pre-approved policy (e.g., "you may auto-patch security holes in known bug classes without asking; you may not move money without asking"), ICM has no native pattern. The closest the paper gets is Section 6.3's "edit source not output" direction, which is about improving the system over time, not about authorizing actions in real time.

4. **The "single orchestrating agent" assumption is doing more work than acknowledged.** Section 4.1 notes that Claude Opus 4.6 delegates to Sonnet 4.6 sub-agents through Anthropic's Agent Teams. That delegation is multi-agent orchestration -- the paper claims it is filesystem-driven (the folder structure determines what each sub-agent receives), but the actual delegation mechanism is vendor proprietary. A real ICM-on-open-source-models would have to rebuild that delegation layer. The paper acknowledges model-agnosticism as an unverified design goal but does not work out what the open-model implementation costs.

5. **The "edit source not output" direction (Section 6.3) is the most important future work, and it is buried.** The argument that recurring output edits should propagate back into the CONTEXT.md / reference files as durable system improvements is exactly right -- it is the difference between a tool and a system. But the paper relegates this to "future work" instead of putting it at the top of the architecture. Without it, ICM workspaces are only as good as the last human edit, which fails the compounding-value test.

6. **Empirical claims rest on theoretical scaffolding.** "Stage-specific context loading improves output quality" cites Liu et al.'s "lost in the middle" but never measures the effect on ICM workspaces directly. The 33-practitioner U-shape finding is self-report through conversation, not instrumented measurement. The paper is honest about this (Section 4.6) but the headline architectural claims would land harder with even one controlled comparison.

7. **The compiler analogy in Section 6.1 is the strongest argument in the paper, and it deserves more than three paragraphs.** Multi-pass compilation has 50 years of solved problems (intermediate representation design, dependency tracking, incremental recompilation, debug symbols / source maps, error recovery, optimization passes) that ICM should be inheriting wholesale. The paper points at this but does not commit to it. A future paper that takes the compiler analogy seriously could fill in: how ICM tracks dependencies, how it handles partial re-runs, how it produces source-map-equivalent provenance traces. Section 6 hints at all of this; it should be the spine of v3.

## Where this lands for PoeTech specifically (Darrell's frame)

PoeTech is ALREADY doing a meaningful subset of ICM, mostly by accident:

- `CLAUDE.md` at the repo root is Layer 0 (identity + binding rules) -- exact match for the paper's pattern.
- `docs/00-foundations/_root/*.md` is Layer 3 (reference material / "the factory") -- stable binding principles that persist across every project.
- `docs/99-session-notes/YYYY-MM-DD-*.md` is Layer 4 (working artifacts / "the product") -- per-run captures of what we did and learned.
- `scripts/nas-*.sh` are the local-scripts pattern -- mechanical work that does not need an AI.
- `docs/00-foundations/n8n-workflows/` holds workflow definitions as plain JSON files, copyable, diffable, Git-friendly.
- The Workflow Module Library principle (declared today, 2026-06-01) IS the workspace-builder pattern: build the substrate so a new family or community gets their system as a folder copy.
- The Institutional-Memory-Events principle (declared today) maps directly to the Layer 4 "every output is a file the human can read" architecture.

Where PoeTech is NOT YET doing ICM and where the paper's framework adds real value:

- **Per-industry workspaces.** The "sovereign LLM teams per industry" direction (declared today) is naturally expressed as one ICM workspace per industry. Family-Finance workspace, Counseling workspace, Church-Ops workspace, etc. Each is a folder with its own CLAUDE.md (industry-specific binding rules), per-stage CONTEXT.md, reference material, and output folders. Copyable to any family or community that wants the same industry team.
- **Per-skill stages within a workspace.** The "best ways for each skill to be effectively involved in each industry" frame Darrell named today maps to the per-stage decomposition: each skill becomes a stage with its own contract (inputs, process, outputs). New skills get added by creating new numbered folders.
- **Per-business-culture customization.** The Layer 3 reference material is where business-culture-specific conventions live (style guide, voice, decision rules). A COLG workspace inherits the same family-OS module library but customizes Layer 3 to match the Church's culture.

What ICM does NOT solve for PoeTech (where we need to keep the existing stack):

- **n8n workflows that handle real-time webhooks** (wf08 chat capture, wf30 Suggest button, wf18 imported transactions API). These need event-driven signals that file polling cannot provide at the required latency.
- **The PWA's live UI** (poetech.us). Browser surfaces are not folders.
- **The TLC firewall** (clinical data never leaves NAS, never to cloud LLMs). Needs hard policy enforcement, not just markdown convention.
- **Pre-authorized governance for the sovereign LLM teams.** The "yes you may auto-patch a known bug class, no you may not move money" policy needs runtime enforcement beyond what ICM addresses.

## The take I would send Darrell's friend

> The paper is good. It names a pattern that working AI engineers already half-do, gives it a vocabulary, and grounds it in 50 years of solid software engineering tradition. The five-layer hierarchy and the Layer 3 / Layer 4 distinction are worth stealing for any team that builds AI workflows. The honest acknowledgement of where ICM does not work (real-time, high-concurrency, automated branching) is what separates a useful paper from an over-claimed one.
>
> Where it under-delivers: concurrency, real-time signals, pre-authorized governance, and the compiler analogy that would have been v2's spine. The "edit source not output" direction in Section 6.3 should have been the headline; instead it is buried as future work. Empirical claims could use one controlled comparison.
>
> Practical recommendation: adopt the ICM pattern wherever your workflow is sequential + reviewable + repeatable. Keep your existing frameworks (LangChain / CrewAI / n8n / etc.) wherever your workflow is real-time, concurrent, branching, or compliance-gated. The two are complementary, not substitutes. The paper says this; some readers might miss it.
>
> For Eduba's next step: a controlled comparison of ICM vs. monolithic-prompt vs. framework-based on the same workflow class would settle the architectural claim with measurement, and v3 should put the multi-pass compiler analogy at the spine instead of the appendix.

## How this changes PoeTech work going forward

1. **Adopt the explicit 5-layer naming in our own docs.** Update `CLAUDE.md` to note: this is Layer 0. Update `docs/00-foundations/_root/` to note: this is Layer 3. Make the layering legible to any future contributor.
2. **Refactor the Workflow Module Library specification to use ICM workspace structure.** Each module = a workspace = a folder. Each stage in a module = a numbered subfolder with its own CONTEXT.md. This makes the library copyable per family or community.
3. **Pair ICM with n8n, do not replace it.** n8n handles the real-time / event-driven / concurrent layer. ICM handles the sequential / reviewable / repeatable batch layer. Together they cover the workflow surface.
4. **Build the "edit source not output" pattern into the Events module.** When a Governor edits the output of a stage repeatedly in the same way, surface that as a candidate amendment to the stage's CONTEXT.md or Layer 3 reference. This closes the loop the paper points at but does not implement.
5. **Use ICM workspaces as the per-industry-team substrate.** The sovereign-LLM-teams-per-industry direction shipped earlier today gets a concrete architectural shape from this paper.

Religion AND Relationship test on this review: backbone (specific technical criticisms grounded in the paper's own evidence) + warmth (the authors did real work, named their limits, and shipped open-source under MIT -- that posture is honored throughout).

Phil 4:8 Test: TRUE (every claim traces back to the paper's text), HONORABLE (no straw-man, no dismissal), JUST (gives credit where due, surfaces gaps cleanly), PURE (no manipulation toward a predetermined conclusion), LOVELY (the closing recommendation is constructive), COMMENDABLE (the authors are named and respected), EXCELLENT (the review pulls cited specifics, not vibes), PRAISEWORTHY (Darrell's friend gets a real read, not a polite nod).
