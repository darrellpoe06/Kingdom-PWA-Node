# PORTFOLIO BRIEF — sample run

**Generated 2026-06-13 by hand (v0.0) as the acceptance-test sample for the
PM-AI spec.** This is the shape the Synthesizer emits each run — a view over the
DR ledger, BUILD-ROADMAP, and GitHub, never the source of truth itself.

---

## 1. State of play

**Shipped & live (this session):** the release lane (CI gate, `main-lane`
ruleset), the NAS deploy over SSH, seed/demo/duplicate provenance walls with
regression tests (suite at 76), the family snapshot sync, the recovered
Engagement feature, the family-allowlist security patch, and the **DB migration
lane — proven green (run #6)**. Christina is live; auth delivers via custom Gmail
SMTP. ~15 PRs merged, zero red merges.

## 2. Blocker chains — what waits on what, and on whom

| Item | Blocked on | Who unblocks |
|---|---|---|
| **R4** Cage + local LLM runner | real-infra values (UniFi / pfSense / mesh / VLAN IDs) — NOT procurement (DR-0053) | **Darrell** (supply values) |
| **R5/R6** church + farm builds | procurement greenlight + BOM docs | **Darrell** (greenlight) + Claude (BOMs) |
| **R8** home n8n enable | home-n8n login/API access | **Darrell** (access) |
| **R16** branch ruleset | — | **DONE** this session (prune) |
| **R17** family snapshot activation | one Studio run + one publish sign-in | **Darrell** (already has the SQL) |
| Tenant voicemail (Phase 1) | Twilio account + ~$20 + Studio flows | **Darrell** (account/pay) + Claude (deploy) |
| Christina full readiness | nothing — **live** | — |
| BG / church multi-user | church-instance onboarding (Tier C) | **Darrell** greenlight (separate build) |

## 3. Next-best item

**Sovereign photo write-path (R15).** Rationale: it's the one item that (a) the
family will *feel* immediately — shared galleries, memories that survive a lost
phone — (b) is already half-built (the property-photos NAS bridge shipped this
morning; the read path exists), and (c) has no external dependency or cost. It
converts "photos live on one device" into "photos live on the NAS, every device
sees them." Clarifying questions it needs answered first:

- **What** — which folders on the NAS are the family-photo roots (one shared, or
  per-property + a family root)?
- **Where** — write path: phone → existing NAS bridge (extend wf-property-photos
  to accept uploads), or a new dedicated upload workflow?
- **Who** — does a photo uploaded by Christina land in the shared family gallery
  immediately, or in a per-person staging the other spouse confirms?
- **How** — keep the live-from-NAS display (no device copies) the morning's work
  established, so quota stays untouched.

## 4. Stale watch

- `desktop-local-backup-2026-06-12` branch — the rescued engagement work;
  recovered + merged (PR #30). Safe to delete now.
- Resend SMTP (domain-verified `links@poetech.us` sender) — surfaced twice,
  deferred twice; not stale yet, but the next time email is touched it's the
  upgrade from the Gmail stopgap.

## 5. Open decisions for Darrell (input-only, no build)

1. **Build PM-AI v0.1?** (the manual-trigger Action + `ANTHROPIC_API_KEY`) — or
   keep v0.0 (Claude-on-demand) for now.
2. **R4 infra values** — the four values unlock the whole Cage chain.
3. **Twilio go** — already said GO; needs the account + payment to proceed.
4. **Church multi-user** — when to start the church-instance onboarding (Tier C).
