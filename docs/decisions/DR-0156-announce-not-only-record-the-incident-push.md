# DR-0156 — Announce, not only record: an incident rings the family's phones through the sovereign relay

- **Status:** accepted
- **Tier:** A shipped through the lane (a fail-soft notification added to existing instruments; no schema, no money; the NAS import is the one hands-on step and it is Darrell's by nature — a credential binding)
- **Scope:** `infra/n8n/wf-ops-announce.json` (the relay), `infra/n8n/README-ops-announce.md` (the runbook), `.github/workflows/site-health.yml` + `.github/workflows/deploy-cloudflare-pages.yml` (the announce calls)
- **Date:** 2026-07-10
- **Principles:** PERPETUAL-PIPELINE-HEALTH (alerts, not silence), ANXIETY-CLARITY (the family knows without visiting a screen), AI-FOUNDATION-INTERNAL-OPERATIONS (sovereign NAS surface), WAYS-REVIEW / DR-0108 (the runner is the team's reach), DR-0125 (the follow-up this closes)

## Directive lineage

The 2026-07-06 follow-up, carried open on DR-0125 / DR-0135 / DR-0139 with `re-review: 2026-07-15`: *"Announce, not only record. A push alert when the probe files an incident — the heal is automatic; the family's awareness shouldn't wait for a screen visit."*

## Decision

1. **When an incident files, a phone push fires.** Both incident filers — the site-health probe and the deploy's verify-boot — now POST to `/webhook/ops-announce` on the Funnel after writing the ledger. The GitHub issue remains the record; the push is the bell. The call is **fail-soft in both directions**: an unreachable relay logs a warning and never fails a probe run; a failed ntfy push never errors the webhook (the record already exists).
2. **The relay is sovereign and pinned.** A three-node n8n workflow (webhook, bearer-gated → code → ntfy) pushes to the NAS ntfy container on the topic the family phones already subscribe to (`darrell`). The topic is pinned SERVER-side so the bearer can only ever ring the family's own bell; caller-supplied title/message/url/priority are capped and validated (only `github.com`/`poetech.us` tap-throughs accepted). `this.helpers.httpRequest` per LESSONS P17.
3. **Zero new secrets.** The runner authenticates with `VITE_N8N_BEARER`, already present in Actions; the webhook's header-auth credential binds to the same value at import. When the bearer rotates (the n8n-base.js transition plan), this relay rotates with it — one secret, one rotation.
4. **The one-time NAS step is documented and testable end-to-end** (`README-ops-announce.md`): import, bind, activate, then a paste-ready proof call that must buzz the phone. Until imported, CI logs `announce relay unreachable` warnings and everything else behaves exactly as today — the change is safe shipped ahead of the import.

## Not chosen

- **ntfy.sh (hosted):** works instantly with no NAS step, but routes the family's incident stream through a third party — against DATA-AS-EMPOWERMENT for zero structural gain when the sovereign container already runs.
- **GitHub mobile notifications:** requires each steward to watch the repo and correctly filter; the family's alerting already lives on ntfy topics.

## Verification

Deterministic tests can't reach the NAS from CI; the proof is the runbook's end-to-end test call (a real buzz on a real phone) plus the standing evidence that every announce failure surfaces as a `::warning` in the run log rather than silence. The workflow JSON follows the exact export shape the NAS's other webhooks import from (`wf-link-title.json` pattern).

## Supersedes / pairs

Closes the announce follow-up in DR-0125 (`re-review: 2026-07-15`) and the same line in DR-0135/DR-0139. Pairs with DR-0155 (same lane, same PR — the window fix and its bell), P31 (the probe is the witness; now it speaks), and the governance ntfy-topic registry in `pre-authorized-policies.yaml`. No supersession.
