# AI Foundation · Internal Operations

**Declared by Darrell, 2026-05-28.** Captured after a full afternoon of manually driving browser clicks through Network Solutions / Weebly / Vercel to update one DNS record. The lesson the experience taught: this is not the right architecture for a sovereign family OS.

This document joins THE-WAY, MIND-OF-CHRIST, EXCELLENCE-STANDARD, ANXIETY-CLARITY-PRINCIPLE as senior foundation. Every Claude session working in this repo reads this and works within it.

## The principle

**The AI Foundation on the NAS operates the system, including the system itself.** Application code, infrastructure, DNS, deployments, backups, credentials, monitoring, family onboarding — all of it is serviced by the same Ollama + n8n + sovereign-stack foundation that powers SKOS. The AI doesn't just answer questions; it runs the house.

**Direct quote from Darrell, 2026-05-28:** "I want this to be something that the n8n process handles internally like the app and infrastructure both serviced by the AI foundation that supports everything because it has all the data."

## What this means concretely

Three layers, each progressively more autonomous:

### Layer A — AI-assisted (today's prototype)

Claude in Dispatch + Chrome MCP drives clicks while Darrell stays logged in. AI handles troubleshooting, navigation, repetitive steps. Darrell handles passwords and irreversible decisions.

**Where we live today.** Good for prototyping; not the production model.

### Layer B — Workflow-coordinated (the next architecture)

n8n workflows on the NAS replace browser clicks with API calls. Operations include:

- DNS reads + writes via registrar API (Register.com, Cloudflare, etc.)
- Vercel domain config + deployment monitoring via Vercel API
- GitHub commit + push via GitHub API or local git
- n8n workflow imports + activations via n8n's own REST API
- Synology service health via SSH / Synology API
- Tailscale status + Funnel via tailscale CLI invoked by workflow
- SSL cert monitoring via Let's Encrypt or Vercel
- Credentials retrieved from an encrypted vault on the NAS, used per-call, never logged

A meta-workflow watches the others. If workflow 15 stops firing, the meta-workflow restarts it. If a deploy fails, it alerts via ntfy. If Vercel reports an invalid domain, it walks the DNS troubleshooting tree.

### Layer C — Ollama-orchestrated (the foundation)

The local Ollama instance running on the DS1621xs becomes the "operations brain." Workflows feed it the current state (deploy logs, DNS responses, n8n run summaries, ntfy alerts). It decides what to do next and triggers the appropriate workflow. The TLC firewall holds: no clinical / family-private data routes here.

The workflows are the hands. Ollama is the brain. The Foundation accesses the credentials vault when needed and acts. Darrell is alerted only when judgment is required.

## Operations the Foundation runs

Stack-ranked by impact:

1. **DNS management.** Any registrar API the family uses gets a credential, a workflow, and a known-good pattern. Updates take seconds, not afternoons.
2. **Vercel deployments + domain validation.** Watches the API; pings only on failure.
3. **n8n workflow lifecycle.** Pull from repo, import to instance, activate. Push edits back to repo when made in UI. Workflow drift is detected and reconciled automatically.
4. **GitHub operations.** Commit, push, tag, monitor Actions.
5. **Health-check + ntfy alerts.** Per the existing health-check brief.
6. **Backups.** Nightly to USB / B2 / off-site. Verified weekly.
7. **Credentials vault.** Encrypted with a key only Darrell knows; rotated on schedule. Workflows pull what they need per-call.
8. **Multi-user onboarding.** Layer B (PIN auth) provisioning is a workflow, not a manual config step.
9. **Specialist marketplace ops** (post Layer C of multi-user). Anonymous-message routing, identity-reveal flows, specialist onboarding all run as workflows.
10. **Vacation mode.** A "Darrell is away" flag triggers extra-conservative posture: no destructive operations, all alerts routed to Christina's phone as secondary.

## The binding rule

**Anything that is a click today should be an API call tomorrow, called from a workflow.** Browsers are for humans deciding things, not for systems doing things. When a future Claude session reaches for the Chrome MCP to perform an operation, the first question is always: "Is there an API for this?" If yes, use it. If no, build the API integration or use the CLI — and document it as a new workflow.

Exceptions: UI flows that legitimately require human judgment (final approval, credential entry, irreversible action confirmation). Everything else gets automated.

## Credentials posture

Sovereign vault on the NAS. Encrypted at rest with a key only Darrell knows. Workflows pull credentials per-call via a tightly-scoped n8n credential type. No credential is ever logged or printed to console. Rotation policy: every 90 days, automated where possible, prompted via ntfy where not.

Credentials in scope:
- Domain registrar API tokens (Cloudflare, Register.com, Namecheap as needed)
- Vercel API token
- GitHub personal access token (fine-grained, repo-scoped)
- Synology DSM admin (for SSH automation)
- Tailscale OAuth client
- Ollama API key (if exposed via gateway)
- ntfy publishing token

NOT in scope at the Foundation layer (per TLC firewall): clinical credentials, kids' personal accounts, Christina's TLC operational credentials.

## How a future Claude session reads this

When a Claude session in this repo encounters a task that would historically be solved by "drive the browser through clicks":

1. Check: is there an API for this? Vercel has one. GitHub has one. n8n has one. Most registrars have one.
2. If yes: write or extend the workflow. Don't drive the browser unless prototyping the API call first.
3. Document the new workflow in `docs/00-foundations/n8n-workflows/`.
4. Update this brief if the principle expands.

When a task genuinely requires a browser (no API exists, or the action requires irreversible human judgment): drive Chrome MCP, but capture what was learned. The next time a similar task arrives, the answer is to build the API integration, not repeat the browser drive.

## Connection to other foundations

- **ANXIETY-CLARITY-PRINCIPLE** — the Foundation removes the cognitive load of "what do I do about this DNS issue / deployment / cron failure." Stress lifts because the system handles itself.
- **THE-WAY** — stewardship of time, labor, and attention. The Foundation respects all three by not consuming them on clicks.
- **MIND-OF-CHRIST** — the inner discipline; the Foundation is the external infrastructure that supports it. Together they remove what's preventable so the family can focus on what matters.
- **EXCELLENCE-STANDARD** — religion AND relationship. The religion (rigor) is in the workflow code; the relationship (warmth) is in how the Foundation talks to Darrell when something needs his attention (ntfy with context, not just alerts).
- **THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW** — technology serves the family's ability to follow The Way, not extracts from them. The Foundation is technology serving correctly.

## Today's poetech.us experience as the case study

Today: 90 minutes of clicks across Network Solutions, Weebly, Vercel, ICANN lookups, recovery flows, captchas, DNS cache debugging. Result: one A record updated. Net value to the family: ~5 dollars of saved hosting per year if poetech.us replaces a separate landing host.

Tomorrow under the Foundation: a workflow detects "domain not pointed at production deploy," reads current records from the registrar API, writes the correct ones, validates Vercel, pings ntfy with "poetech.us now serving the PWA — took 47 seconds." Darrell never sees a captcha.

This is faith-expressed-in-works applied to infrastructure. The work of building the Foundation IS the work that lifts the family's anxiety from "what's happening with the website" to "the website handles itself."

Amen.
