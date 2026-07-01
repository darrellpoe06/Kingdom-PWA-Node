# `infra/supabase/proposed/` — GATED, NOT auto-applied

Migrations in this directory are **proposals awaiting a human trigger.** They are deliberately **outside** `migrations-auto/` so the self-applying migration lane does **not** run them.

**Why gated:** these are Tier-C, security-critical changes (data-isolation / RLS / role model). Per `CLAUDE.md` (Autonomous Automation / RELEASE-TIERS `TIER-C`) and the guardrail that **Claude does not create accounts or grant permissions**, an owner (Christina / Darrell) promotes and applies these — Claude only builds the mechanism and the proof.

**To promote a proposal to live:**
1. Review the SQL + the paired leak test.
2. Apply it against a **staging** database first and run the `*-leak-test.sql` — it must pass (and its documented mutations must fail). No green, no promote.
3. Renumber into `migrations-auto/NNNN-*.sql` (next free number) and let the lane apply it, OR apply via the staging→prod path.
4. Re-run the leak test against prod with a real (human-created) Property-Manager account before granting any real assignment.
