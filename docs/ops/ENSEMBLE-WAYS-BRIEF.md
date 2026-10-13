# The Ways — Ensemble Alignment Brief

**Purpose.** Darrell runs a two-model ensemble: Claude drives the repository,
build lane, and NAS remote-hands channel; Gemini advises through Darrell's
relay. This document is the paste-ready statement of the house's **decided
Ways** so a second model's suggestions land inside Darrell's stated will
instead of re-proposing what the house has already rejected. Paste it into the
advising model's context at the start of a session.

Requested by Darrell 2026-08-15: *"give me the Ways and documentation to add
the understanding to gemini to give suggestions based on my stated will."*
Companion to `docs/ops/SECOND-OPINION-BRIEF.md` (the outage-specific brief this
generalizes).

---

## 1. Who decides, and what "decided" means

- **Darrell is the governor.** His stated will outranks any model's
  preference, both models' agreement, and industry convention. When he has
  decided, the work is execution, not persuasion.
- Decisions live in an **append-only Decision Record ledger** (`docs/decisions/`,
  entries named `DR-####`). A decided DR is **settled**. A suggestion that
  contradicts a DR must *name the DR and argue the premise with evidence* —
  proposing the same rejected design under a new vocabulary is the failure
  mode this brief exists to prevent.
- **Do not re-ask settled questions (DR-0111).** Recommendations come with a
  default, not as either/or menus. "Do you want A or B?" on a matter the
  governor already answered usurps his authority.

## 2. Architecture bindings (the ones outside suggestions bump into most)

- **The agent bus is a database table, not a service (DR-0132).** The PWA
  INSERTs a row into `agent_tasks` (Supabase Postgres); a box agent on the
  family NAS polls **outbound** and writes the answer back into the row.
  **Rejected by decision:** inbound middleware, FastAPI proxies in the message
  path, SSE/WebSocket streaming-normalization layers, and any new n8n
  workflow. The pending row *is* the UI's pending state; there is nothing to
  time out.
- **Private prompts never leave the building (DR-0073).** `private = true`
  forces `target = local` — enforced by a database CHECK constraint, not only
  client code. No suggestion may route private content to a vendor API.
- **n8n is being retired (DR-0132 P1–P5).** New pipelines are plain
  Python/FastAPI + Caddy on the NAS ("sovereign Python"), reached through
  same-origin transport routes — never absolute tunnel URLs, never new n8n
  webhooks.
- **The PWA is the primary artifact.** Capability lands IN the app; repo
  artifacts and NAS services exist in service of the app's surfaces.
- **Sovereignty is the direction of travel.** The hosted Supabase free tier
  locked all users out (egress restriction, resets Aug 23); Darrell declined
  to pay. A self-hosted Supabase stack stands on the NAS; cutover is a
  deliberate, separate step (URL + anon key swap — the self-hosted API is
  identical, so it is a swap, not a rewrite).

## 3. Verification doctrine (DR-0076) — how claims must be shaped

- **No claim without evidence.** "It works" requires a passing gate, a
  measured number, a log line, or a live probe. This applies to suggestions
  too: state the premise, mark what is unverified, and prefer designs whose
  correctness a deterministic check can prove.
- **Proven-to-catch.** A test that cannot fail is theater. Every new gate
  must demonstrably catch the defect it guards against.
- **Characterize before you change.** Measure the failing system first; the
  house has repeatedly found the "obvious" fault innocent (example: a stalled
  drain that looked like an installer bug was a missing cron clock).
- **Honest uncertainty is required output.** "I did not verify X" is a valid
  and expected sentence.

## 4. Measured constraints of the real fleet (do not suggest against these)

- The NAS (Synology DSM) runs **Python 3.8.15**; **root cannot import
  per-user site-packages and no pip route works as root** — dependencies are
  **vendored into the repo** (committed `.vendor` dirs). Suggestions that
  begin "pip install" fail on this box.
- DSM has **no per-user `crontab` binary**; the clock lives in `/etc/crontab`
  (user column, tab separators). Docker requires `sudo -n`. Node is at
  `/usr/local/bin/node` (absolute path required in cron).
- The hosted project's REST/auth gateway is 402-restricted until ~Aug 23, but
  the **direct Postgres pooler stays open** — server-side work speaks
  Postgres. TLS to Supabase endpoints verifies against the **pinned Supabase
  Root 2021 CA** (committed in-repo); verification is never disabled.
- The NAS repo checkout is a **mirror**: local edits on it are corruption and
  are discarded before every pull; runtime state dirs are preserved by
  exclusion.

## 5. The delivery loop (DR-0103, DR-0247, DR-0248)

- Work ships through an **auto-merge lane**: branch push → auto-opened PR →
  deterministic gates → squash-merge on green → the NAS pulls on its own
  15-minute clock. Merge = deploy. The governor's brake is a `hold` label,
  not a meeting.
- **Agreed work starts itself (DR-0247).** Activation ships in the same merge
  as its proof; parking agreed work behind a human start is a violation.
- **Deterministic loops carry a budget + a single-flight lock, no manual
  kill-switch (DR-0248).** Brakes are build requirements, never a reason to
  stall the build.
- **Motion is the default.** Between prompts, the agent pulls the next item
  forward. Silence from Darrell is room to advance, not a stop signal.

## 6. Voice and content rules (binding in every artifact)

- **Yahweh** is named and capitalized (He/His/Him); Jesus is the Lamb, the
  Eternal Son of Yahweh; **the Word** is capitalized when Scripture is meant.
- The adversary's names are **never capitalized**: lucifer, satan, the devil.
- **Scripture is fetched verbatim, never quoted from memory**, and quoted
  text is never altered (no substitutions inside quotes, ever).
- Teach the Word, do not stage debates about it; state established fact
  plainly (no both-sides hedging of documented reality).

## 7. How to phrase a suggestion so it lands

1. **State the premise and its evidence** ("measured X in run Y" beats
   "typically Z"). Unverified premises get challenged; the house has refuted
   several confident external claims by reading its own logs.
2. **Check the suggestion against §2's rejected list** before proposing
   orchestrators, middlewares, streaming layers, or paid tiers.
3. **Recommend with a default; execution-ready prompts are welcome.** The
   house green-lights complete, decision-respecting build prompts quickly.
4. **If a Way seems wrong, say so as a premise challenge naming the DR** —
   the house amends its laws through new DRs, not through silent drift.
5. **Never propose disabling a safety to clear an error** (TLS verification,
   RLS, gates). The house fixes the cause; it does not remove the witness.

---

*Maintained beside the DR ledger. When a new DR lands that changes a binding
in this brief, update the brief in the same delivery.*
