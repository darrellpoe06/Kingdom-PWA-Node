# PRD: [BUILD NAME] - [one-line outcome]

**Layer 4 (working artifact) per the ICM hierarchy declared in `CLAUDE.md`.** This is the fill-in template for an autonomous-builder PRD. Copy it to `builds/pending/NN-build-name.md`, fill every bracketed placeholder, run the Section 0 binding screen, and only then move it to the pending queue for pickup. Added 2026-06-02 (Maui). Format is Tina Huang's 10-section PRD (her 2.10 autonomous-builder pattern) with PoeTech's Section 0 binding screen added on top per the Tina review §7.5.

> **How to use this template.** Replace every `[bracketed prompt]` with real content. Do not ship a PRD with brackets left in - the builder treats an unfilled bracket as an incomplete PRD and will route it to `failed/` with a "PRD not filled in" event. Keep it concrete: real file paths, real values (NAS `192.168.1.26`, SSH user `dpoe`, project root `C:\Users\dpoe\Kingdom-PWA-Node`, Ollama at `http://ollama:11434`, n8n same-origin `/n8n` rewrite). The PRD is the contract the per-industry sovereign team executes against; vagueness here becomes rework downstream.

---

## Section 0 - Binding-principle screen + alignment check

**This section is senior to everything below it.** It is filled in and checked BEFORE the build is approved into `pending/`. If any check fails, the build does not enter the queue. This is the Tina review §7.5 requirement: no PRD reaches an executor without first passing the foundation-principle and TLC-firewall screens.

### 0.1 Foundation-principle alignment check

Name the foundation docs this build touches and confirm alignment with each. Reference docs by path in `docs/00-foundations/_root/`.

- [ ] **Foundation docs this build touches:** [list the relevant docs, e.g. `COMMUNITY-FIRST-MISSION.md`, `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`, `QUALITY-OF-LIFE-AS-NORTH-STAR.md`, `CLAUDE-TOOL-ROUTING.md`]
- [ ] **Lift-and-create test (GOVERNANCE-EXECUTION-ADVISORY):** does this build lift the family AND community AND create rather than extract? [one sentence: how]
- [ ] **Quality-of-life north star (QUALITY-OF-LIFE-AS-NORTH-STAR):** which sector(s) does this improve, and how is improvement measured? [financial / physical / relational / spiritual / mental / community / education / vocational / environmental - name them]
- [ ] **Data posture (DATA-AS-EMPOWERMENT-NOT-EXTRACTION):** confirm no advertising model, no engagement optimization, no data lock-in; data stays family-owned and exportable. [confirm or name the exception and why]
- [ ] **Connection readiness (BUSINESS-PROCESS-CONNECTIONS):** if this build adds a visible surface, name the pipeline that carries it, who governs incoming volume, and the visible promise. [fill or mark N/A with reason]

### 0.2 TLC-firewall check (absolute)

- [ ] **Does this build touch clinical / counseling / therapy / TLC data?** [YES / NO]
- [ ] **If YES:** this build is **sovereign-only**. It routes to Ollama on the NAS exclusively. No cloud reasoner (not Claude, not Gemini), no vendor API round-trip, no prompt caching of the content, no Batch API. `allowed_providers` for the executing team is `[ollama]` and nothing else. Fail closed. Confirm: [confirm the sovereign-only constraint is encoded in the build plan below, OR confirm NO above]
- [ ] **If uncertain whether content is clinical:** treat it as clinical and stay sovereign. [confirm the uncertain-defaults-to-sovereign rule is honored]

### 0.3 Sovereign-mesh-tier label

Label this build's reliance on the sovereign mesh. This tells the builder how to route execution and how much vendor exposure the build carries.

- [ ] **Tier 1 - mesh-native:** runs entirely on the sovereign stack (Ollama on the NAS); zero vendor dependency. The default and the goal.
- [ ] **Tier 2 - swappable:** may use a vendor reasoner for a heavy moment but is written so the vendor is swappable for a sovereign model without redesign; no vendor lock-in. Name the swappable seam: [where the vendor call is isolated]
- [ ] **Tier 3 - vendor-escape-hatch:** genuinely needs a vendor capability (e.g. long-context burst, Google-Search grounding) for this build. Justify why sovereign cannot do it and confirm the content is non-clinical and non-sensitive: [justification]

**Selected tier:** [ 1 / 2 / 3 ]

### 0.4 Industry / team routing

- [ ] **Industry this build belongs to:** [e.g. Family-Finance / Dev-Ops / Church / Counseling / Media-Production / Education]
- [ ] **Per-industry sovereign team that executes the build:** [the team brain that owns this build; the builder routes execution here, NOT to vendor-Cowork as sole executor - per Tina review §7.2]

---

## 1. Executive summary

[Two to four sentences. What is being built, for whom, and what changes once it exists. State the outcome in plain language a non-engineer on the family team could read and approve.]

---

## 2. Quick start (moving into Cowork or Code Task)

[The first move once this PRD is picked up. State whether the dominant activity is repo+git (route to a Code Task) or web+research+synthesis (route to a Cowork sub-task), per CLAUDE-TOOL-ROUTING.md Section 4. Give the exact opening prompt the executor receives.]

- **Executor:** [ Code Task / Cowork sub-task ] - [why this one]
- **Opening prompt:** [the ready-to-paste prompt that kicks off the build]
- **Repo root:** `C:\Users\dpoe\Kingdom-PWA-Node`
- **Branch:** [target branch; default `main` unless this is foundation work]

---

## 3. Goals and non-goals

**Goals**
- [concrete, testable goal 1]
- [concrete, testable goal 2]
- [concrete, testable goal 3]

**Non-goals (explicitly out of THIS build)**
- [thing a reader might assume is included but is not]
- [thing deferred to a later build]

---

## 4. Architecture overview

[How the pieces fit. Name the surfaces (PWA component, n8n workflow, NAS service, bind-mount path). Note the same-origin `/n8n` Vercel rewrite if the PWA talks to n8n. Reference the sovereign stack: Ollama at `http://ollama:11434`, Qwen 2.5 14B daily-driver, nomic-embed for embeddings, Qdrant for vectors. A small diagram-in-prose is fine.]

---

## 5. The data layer

[What data this build reads and writes. Where it lives: NAS bind mount path under `/data/`, Qdrant collection, n8n static data, a PWA local-storage key, a git-tracked file. State retention, ownership (family-owned per DATA-AS-EMPOWERMENT-NOT-EXTRACTION), and exportability. If clinical, restate the sovereign-only constraint from Section 0.2.]

---

## 6. Component specifications

[One subsection per component. For each: its responsibility, its inputs, its outputs, its failure mode, and which sovereign-mesh tier it sits in. Be specific enough that the executor does not have to guess.]

### 6.1 [Component name]
- **Responsibility:** [...]
- **Inputs:** [...]
- **Outputs:** [...]
- **Failure mode + handling:** [try-catch every external I/O per PERPETUAL-PIPELINE-HEALTH; standard error envelope]

### 6.2 [Component name]
- [...]

---

## 7. The build plan (Block 0 setup + hour-sized Blocks 1..N)

Each block is hour-sized and independently checkpointable. Block 0 is setup; Blocks 1..N are the build. The executor commits at the end of each block so a failure rolls back to a clean checkpoint, not to zero.

- **Block 0 - Setup.** [environment prep, dependency install, bind-mount confirmation, branch creation, reading the named foundation docs]
- **Block 1 - [title].** [hour-sized unit of work] - [acceptance check]
- **Block 2 - [title].** [...] - [acceptance check]
- **Block N - [title].** [...] - [acceptance check]
- **Final block - Verify + audit.** [run the tests; the audit ships WITH the implementation per the binding work-posture memory; emit the done/failed state transition]

---

## 8. Setup details + copy-paste prompts

[The exact, ready-to-paste prompts and commands the executor needs. PowerShell commands handed to a human follow the CLAUDE.md self-contained-from-anywhere law: prefixed with `cd C:\Users\dpoe\Kingdom-PWA-Node`, one command per line, no `&&`/`||`, no PS7+ features, ASCII only, real literal values. n8n workflow JSON goes in `docs/00-foundations/n8n-workflows/`.]

```
[copy-paste block 1]
```

```
[copy-paste block 2]
```

---

## 9. Decision log (8-15 rows)

Record the decisions made while writing this PRD so the executor inherits the reasoning, not just the conclusion. Eight to fifteen rows.

| # | Decision | Options considered | Choice + why |
|---|---|---|---|
| 1 | [decision] | [options] | [choice and reason] |
| 2 | [decision] | [options] | [choice and reason] |
| 3 | [...] | [...] | [...] |
| 4 | [...] | [...] | [...] |
| 5 | [...] | [...] | [...] |
| 6 | [...] | [...] | [...] |
| 7 | [...] | [...] | [...] |
| 8 | [...] | [...] | [...] |

---

## 10. Out of scope

[Everything explicitly NOT in this build, so the executor does not scope-creep. Name the follow-on builds that pick up the deferred pieces, each as its own future PRD.]

- [out-of-scope item] -> future PRD: [name]
- [out-of-scope item] -> future PRD: [name]

---

*A build that passes the binding screen before it is queued is a build that cannot drift from the family's why. Fill every bracket, name every foundation, stay sovereign where the data is sacred, and let the per-industry team do the work the human governs. We all win. We create. Amen.*
