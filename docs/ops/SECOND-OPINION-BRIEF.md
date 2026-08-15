# The Second-Opinion Brief — DR-0066's ensemble, run through the seam that already works

Darrell 2026-08-15: *"The same way gemini and claude ... help clarify the
situation how do we use both within and in the build pipelines?"*

The Ways already decided the architecture — **DR-0066** (2026-06-13, declared by
Darrell): all vendor LLMs connect through a local-anchored ensemble, every
answer is compared, the final is synthesized from the field, and the local AI
retains the documentation. What was missing is the *operational seam*. The
2026-08-15 Supabase incident supplied it, measured: a brief carried by Darrell
between Claude and Gemini produced two real corrections in two directions
(Gemini rejected Claude's transactions give-up; measurement then rejected
Gemini's soft-delete prescription), and the arbiter both times was **a query,
not a model**.

## The protocol (what today proved, made repeatable)

1. **The executor model** (in-repo, tools, measurement) assembles the brief.
2. **The reviewer model** (no repo access — the blindness is the feature: it
   cannot inherit our assumptions) answers the questions.
3. **Disagreement becomes a measurement task.** Neither model wins an argument;
   whichever claim can be settled by a query/probe gets settled that way, and
   the loser's correction is recorded.
4. **The round is retained** (DR-0066 §4). Until the local hub is stood up, the
   round lives in the repo: link the brief + the verdicts in the relevant DR or
   REVIEWS entry. The repo is family-owned storage; the sovereign hub inherits
   the format when it exists.

## The brief format (all five sections, every time)

```
SITUATION: <one line — what broke / what is being decided>

SETUP: <the system, scale, ids, plan — enough to reason without the repo>

MEASURED FACTS (not inferred):
  - <each fact with its source: query, dashboard, log, run id>

INFERRED (labeled as such):
  - <each inference, with what it is inferred FROM>

THE QUESTIONS I WANT CHECKED:
  1. <decisive question first — the one that changes the decision>
  ...

WHERE I HAVE BEEN WRONG SO FAR: <every error already caught this incident,
  so the reviewer knows what to re-check rather than trusting the narrative>
```

The last section is load-bearing, not humility theater: the 2026-08-15 brief
listed six errors, and the reviewer's value came precisely from re-checking the
claims adjacent to them.

## Where each model sits in the build pipeline

| Seam | Who | Binding rule |
| --- | --- | --- |
| Execution (code, measurement, gates) | Claude, in-repo | the gates referee, not the model |
| Incident/plan second opinion | Gemini via this brief | disagreement → measurement |
| Tier B/C design review | both, independently, then compare | DR-0066 compare-the-field |
| Merge decision | **neither — deterministic gates only** | DR-0076 §3: an LLM judge is non-deterministic; a gate that can pass what it failed an hour ago protects nothing. Models are finders and reviewers, never merge gates. |

## Constraints, named

- **Privacy line is absolute:** briefs carry measurements and code shapes, never
  family/clinical/private data (the TLC firewall; DR-0073 private → local-only).
  A brief that needs private data to make sense is a brief for the local model.
- **Vendor spend:** the paste-transport costs $0 and is the default. A
  `gemini-review.yml` API seam is buildable but gated on DR-0237 §5 — and
  whether the household's Google AI Plus includes CI-usable API quota is
  UNVERIFIED; do not assume it.
- **The reviewer's confident claims get the same treatment ours do.** Measured
  today: the reviewer asserted business context it could not know and a
  cached/uncached split the dashboard showed differently. Second opinions are
  inputs to measurement, not verdicts.
