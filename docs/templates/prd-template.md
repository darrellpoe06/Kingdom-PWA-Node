# PRD Template

> **How to use this template.** Copy this file to `docs/99-session-notes/YYYY-MM-DD-prd-<feature-slug>.md` and fill it in. Generate the first draft with `prd-metaprompt.md` so every section the LLM can infer is pre-filled and only genuine-judgment sections are left for Darrell. This is the canonical PRD shape for PoeTech product specs (per the Tina Huang Cowork research-review, surfaced as Rank #4 in the consolidated extract). Research-reviews stay separate from PRDs.

---

## 1. Problem statement + who has it

State the problem in one or two sentences. Name the specific person or community who has it (the family member, the COLG staffer, the tenant, the developer). Per `ANXIETY-CLARITY-PRINCIPLE`, name what they currently do not know how to do. A problem without a named sufferer is not a problem yet.

## 2. Success criteria + KPIs the build serves

What does "done and working" look like, observably? List the KPIs this build serves and how each is measured. Per `QUALITY-OF-LIFE-AS-NORTH-STAR`: which sector of quality of life does this measurably improve, and how would the family or community know it improved?

## 3. Scope -- in / out / explicitly deferred

- **In scope (v1):** what ships in this build.
- **Out of scope:** what this build will not do, on purpose.
- **Explicitly deferred:** what is real and wanted but waits for a later version. Name the trigger that promotes it.

## 4. Architectural overview + sovereign-mesh Tier label

Sketch the architecture: components, data flow, where it runs. Label the **sovereign-mesh Tier**:

- **Tier 1** -- natively mesh-aligned (open-source, runs on owned hardware, no structural lock-in).
- **Tier 2** -- swappable (vendor at v1, documented escape hatch, exportable data).
- **Tier 3** -- vendor escape-hatch (used only when sovereign cannot meet the bar; documented evolution path).
- **Tier 4** -- vendor cloud-only (avoid; flag explicitly if proposed).

Note which existing workflow(s), foundation doc(s), and memory binding(s) this build rides on or extends.

## 5. Phased implementation -- v1 / v2 / v3

- **v1:** the minimum that delivers the success criteria in Section 2.
- **v2:** the next increment, with its trigger.
- **v3:** the longer arc.

Size each phase honestly (the one thing the LLM cannot guess is build length -- ask if unknown).

## 6. Risks + mitigations

List the real risks (technical, relational, theological, cost, reversibility). For each, the mitigation. Per `PERPETUAL-PIPELINE-HEALTH`: name the failure modes and the recovery path. If any bright line from `docs/governance/pre-authorized-policies.yaml` is adjacent, say so here.

## 7. Test plan + acceptance criteria

How this build is tested before it ships (per the build-test-report binding). The explicit acceptance criteria: the observable checks that must pass. Name who validates and how.

## 8. Open questions for the user

Only the genuine judgment calls -- strategic, product, relational, tone, or theological -- that the LLM cannot and should not decide. Do not list questions whose answers could be sourced from memory, the repo, or the foundation docs. One line each.

## 9. Cost-efficiency screen

Per `project_cost_discipline_with_growth_permission`: the marginal cost band (`$0` / `$` / `$$` / `$$$`), the break-even or growth-justification, and whether a sovereign $0-marginal path exists or is deferred. Discipline is the default; growth spend is permitted when justified and named.

## 10. Religion AND Relationship + Phil 4:8 check

- **Religion check:** is the build scripture-grounded, structurally sound, does it have backbone?
- **Relationship check:** does it have warmth, meet the person where they are, serve rather than extract?
- **The Test (Phil 4:8):** is the spec TRUE, HONORABLE, JUST, PURE, LOVELY, COMMENDABLE, EXCELLENT, PRAISEWORTHY? Revise any "no" before the PRD is delivered.
