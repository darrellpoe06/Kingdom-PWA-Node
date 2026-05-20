# Infrastructure Pipeline — Hybrid laptop + NAS, agent-driven, zero recurring spend

> **Founder direction (2026-05-18):** *"I want to get this implemented today within the next few hours. Set up and the first working model."*

Binding architecture for how PoeTech builds and ships from now on. Replaces the historical "everything on the laptop" model with a hybrid that uses each machine for what it's best at, runs multiple agents in parallel, and makes the human role narrower and sharper. Operates alongside `AGENT-WORKFLOW.md`, `MODULAR-EXTENSIBILITY.md`, and `MULTI-INSTANCE-STRATEGY.md`.

---

## The model in one paragraph

The **laptop** (Samsung Galaxy Book Pro · i7-1165G7 · 16 GB) is for active development — fast per-core CPU, portable, where the founder's attention is. The **DS1621xs NAS** (Xeon D-1527 · 64 GB · always-on) is for persistence, automation, backup, CI/CD, and multi-instance staging. **Cloudflare** (free tier) hosts production. **Cowork (Claude in chat)** owns strategy, foundation docs, and task-card specs. **Claude Code (local CLI)** owns execution. **The founder** is the arbiter and the only irreplaceable human in the loop.

---

## Why hybrid, not single-machine

| Need | Best fit | Reason |
|---|---|---|
| Active dev (Claude Code interactive, vite builds, your edits) | **Laptop** | Higher single-core clocks; portable; where your eyes are |
| Git remote mirror, code archive | **NAS (Gitea/Forgejo)** | Local-first; no GitHub dependency for private work; survives outages |
| CI/CD on every commit (build + a11y + foundation-rule check) | **NAS (self-hosted Actions runner)** | Free unlimited minutes vs. GitHub's caps; runs while you sleep |
| Daily snapshots + version history | **NAS (Btrfs snapshots)** | Built-in to DSM; protects against ransomware + your own mistakes |
| Off-site backup (fire / theft) | **Backblaze B2** ($6/TB/yr) | Honest "no recurring spend" exception — this one is non-negotiable |
| Multi-instance staging (per-template Docker containers) | **NAS** | RAM-heavy; runs all templates at once for SME / family review |
| Production PWA + Worker | **Cloudflare** | Free tier; global edge; nothing to maintain |
| Scheduled background agents (nightly audits, weekly link checks) | **NAS cron + Claude Code headless** | Always-on; runs when you're not at the laptop |
| Local-LLM fallback during outages | **NAS (Ollama)** | Free; reduces dependency on Anthropic uptime |

---

## Role replacement — agents take what they can; you keep what only you can

Traditional companies hire three departments. Here's how each role gets replaced:

| Traditional role | Replaced by | Where it lives | What stays human |
|---|---|---|---|
| **Business Analyst** (gather reqs, write specs) | Cowork | Foundation docs + task cards | Founder validates the "why" |
| **Software Architect** | Cowork + foundation precedence rules | `/docs/00-foundations/_root/` | Founder approves binding patterns |
| **Developer** | Claude Code | Laptop | Founder reviews diffs |
| **QA / Tester** | Automated: vite build + a11y audit + visual regression | NAS CI runner | Founder spot-checks shipped UI |
| **DevOps / SRE** | Cloudflare Workers + Pages + Wrangler | Cloudflare free tier | Founder authorizes production deploy |
| **Technical Writer** | Cowork (post-merge foundation updates) | Git-versioned docs | Founder approves doc precedence |
| **Project Manager** | Task list (Cowork's TaskCreate / TaskUpdate) | This session + persistent through MEMORY.md | Founder sets priorities |
| **Product Owner** | **Founder. Irreplaceable.** | Founder | All of it |
| **Compliance / Ethics** | Foundation docs (LEGAL-PRIVACY-BOUNDARY, IDENTITY-ROLES-AUDIT, etc.) | `/docs/00-foundations/_root/` | Founder is final word on values |

The narrowing of the human role is the point. Founder spends time on: vision, prioritization, customer empathy, ethics, ambiguous-judgment calls. Everything else gets specified, executed, verified by agents.

---

## Pipeline — how a change flows from idea to production

```
[Founder thought, often messy]
         ↓
[Cowork interprets → produces foundation update OR task card]
         ↓
[Founder approves spec]
         ↓
[Claude Code on laptop executes the task card locally]
         ↓
[Claude Code reports diff + build status]
         ↓
[Founder reviews diff in chat or terminal]
         ↓
[If approved: founder commits + pushes to NAS Gitea (or GitHub)]
         ↓
[NAS CI runner triggers: build + a11y check + foundation-rule lint]
         ↓
[If green: artifact deployed to Cloudflare Pages (PWA) or Workers (backend)]
         ↓
[Production users see the change]
         ↓
[Lifecycle log + audit trail captures who did what when]
```

Every step is monitored. Every step has a fallback (e.g., if CI fails, the artifact is held; if production deploys break, Cloudflare rollback is one command). Every step writes to the audit log per `IDENTITY-ROLES-AUDIT.md`.

---

## Today's setup checklist — first working model in a few hours

**Goal:** End the day with Claude Code installed on the laptop, the first task card executed cleanly, and the NAS holding a git mirror + daily snapshot of the repo.

### Phase 1 — Laptop (15 min)

1. Open PowerShell as Administrator.
2. Verify Node ≥ 18: `node --version`. If missing, install from nodejs.org.
3. Install Claude Code: `npm install -g @anthropic-ai/claude-code`
4. Authenticate: `cd C:\Users\dpoe\Kingdom-PWA-Node` then `claude`. Follow the browser prompt to log in with your Claude account.
5. In the Claude Code prompt, paste:
   ```
   Read /docs/01-architecture/AGENT-WORKFLOW.md and /CLAUDE.md.
   Then execute the task card at /docs/01-architecture/task-cards/2026-05-18-white-screen-non-free-tier.md.
   Report back per the "When done" section.
   ```
6. Wait for Claude Code to diagnose, fix, build, report. Review the diff.
7. If approved: `git add -A && git commit -m "fix(about): white-screen on non-free tier (via Claude Code)" && git push`

### Phase 2 — NAS setup (60-90 min)

8. SSH into NAS: `ssh admin@<nas-ip>`
9. Enable Container Manager (formerly Docker) in Synology Package Center.
10. Create a docker-compose project for **Gitea** (self-hosted git):
    ```yaml
    version: '3'
    services:
      gitea:
        image: gitea/gitea:latest
        container_name: gitea
        environment:
          - USER_UID=1000
          - USER_GID=1000
        restart: always
        volumes:
          - /volume1/docker/gitea:/data
        ports:
          - "3000:3000"
          - "2222:22"
    ```
11. Launch via Container Manager. Browse to `http://<nas-ip>:3000`, complete setup wizard.
12. Create user `darrellpoe06`, create repo `Kingdom-PWA-Node`.
13. On laptop: add NAS as a second git remote:
    ```
    cd C:\Users\dpoe\Kingdom-PWA-Node
    git remote add nas http://<nas-ip>:3000/darrellpoe06/Kingdom-PWA-Node.git
    git push nas docs/skos-foundations
    ```
14. Set up daily snapshot in DSM: Control Panel → Shared Folder → docker → Snapshot, schedule daily, retain 30 days.

### Phase 3 — Off-site backup (30 min)

15. Sign up for Backblaze B2 (free tier covers first 10 GB; current repo + assets fit easily).
16. Install **Hyper Backup** package in DSM Package Center.
17. Create task: source = `/volume1/docker/gitea`, destination = B2, schedule = weekly Sunday 2am.
18. Test restore on a throwaway folder before trusting it.

### Phase 4 — Verification (15 min)

19. From laptop, make a trivial change to a markdown doc.
20. `git push origin && git push nas` — pushes to both GitHub and NAS Gitea.
21. Confirm change appears in both remotes via browser.
22. Confirm NAS snapshot captures the change overnight (verify tomorrow morning).

**End of day result:** Claude Code working locally + git mirror on NAS + daily snapshots + weekly off-site. The foundation is in place. CI runner + multi-instance staging + scheduled agents are subsequent rounds.

---

## Week 1 follow-ups

23. Install **self-hosted GitHub Actions runner** on NAS (Docker container, runs `actions-runner-controller` or simpler `myoung34/github-runner` image). Configure to listen on the repo's Actions tab. Free unlimited build minutes.
24. Add `.github/workflows/build.yml` that runs `cd app && npx vite build` on every push. Catches breakage before it propagates.
25. Add `.github/workflows/foundation-lint.yml` that greps the diff for violations of binding rules (e.g., "is anyone using Edit tool patterns we banned?"). Cheap, effective.

## Month 1 follow-ups

26. Multi-instance staging: Docker container per template (family, trades, church, therapy, nonprofit, small-business). Each runs the PWA on a unique port, with a different `data.instance` seed. SMEs can poke at every template in isolation.
27. Scheduled Claude Code agent: NAS cron triggers `claude --headless --task /path/to/weekly-audit.md` every Sunday. Reports back with a structured changelog. Runs while you rest.

## Quarter 1 follow-ups

28. Local-LLM fallback: install Ollama on NAS with Llama 3.1 or similar. Configure Claude Code to fall through to local model when Anthropic is unreachable. Accuracy drops; velocity doesn't crash.
29. Monitoring dashboard: Cloudflare Worker metrics + uptime check + NAS health → single Grafana page on the NAS. Family or PoeTech staff can glance at it any time.
30. Customer-facing demo: when first paying customer is signing up, demo the system from NAS over screen-share with realistic data. No production touch.

---

## Safety practices — non-negotiable

1. **Never expose NAS to public internet without VPN.** Use Tailscale (free) or Synology QuickConnect to reach the NAS from outside the LAN. Don't open ports.
2. **SSH keys, not passwords.** Disable password SSH on the NAS.
3. **MFA on all admin accounts** — DSM, GitHub, Cloudflare, Anthropic.
4. **Encrypted at rest.** DSM supports per-shared-folder encryption. Enable for: `/volume1/docker/gitea`, anything containing API keys, anything that mirrors Legal data (when that ships).
5. **Snapshot daily, off-site weekly, test-restore quarterly.** All three. RAID alone won't save you from ransomware or fire.
6. **Audit log on changes.** DSM logs all admin actions. Review monthly.
7. **Separate user accounts per family member** with least-privilege defaults. Christina has her own account with read-only on the dev folder.
8. **Secrets never in git.** All API keys via `wrangler secret put` (Cloudflare) or DSM Secret Store (NAS). `.env` files in `.gitignore`. Audit before every push.
9. **Power: UPS on NAS** ($150 one-time). Brief outages don't corrupt the volume; longer outages give time to shut down cleanly.
10. **Update discipline.** DSM, Docker images, Node, npm packages — weekly or biweekly checks. Most security incidents are unpatched known CVEs.

---

## Risk register + mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| NAS hardware failure | Medium (years) | High (work stops) | Daily snapshots + weekly off-site to B2; spare NAS or laptop fallback |
| Ransomware via family-member device on LAN | Low | Severe | NAS user-level permissions; immutable snapshots (Btrfs); off-site backup |
| GitHub outage | Medium (annual) | Low (Gitea mirror keeps working) | Gitea on NAS is independent |
| Cloudflare outage | Low | Medium (Workers down) | NAS-hosted backup Worker on standby (rare deploy) |
| Anthropic API rate limit / outage | Medium | Medium (Claude Code stalls) | Ollama local fallback on NAS |
| Founder's laptop stolen | Low | Medium (recent uncommitted work lost) | Push to NAS every commit; never let uncommitted go > 4 hours |
| Synology DSM 7→8 breaking change | Low (years) | Medium | Everything in Docker = portable; could move to a generic Linux NAS in a weekend |
| Family member accidentally deletes the dev folder | Medium | Low (snapshots restore in minutes) | DSM snapshots; least-privilege per-user accounts |
| Cost creep (B2 + UPS + occasional hardware) | Low | Low (~$10/year total) | Annual cost audit |

---

## What this changes about how we work

**Before:** Founder writes Cowork chat, Cowork tries to do everything (think + write + verify), truncation slows everything, single point of failure on the laptop.

**After:** Founder writes Cowork chat with intent. Cowork produces foundation docs + task cards. Claude Code on laptop executes against specs. NAS handles persistence, CI, scheduled work, backups. Cloudflare handles production. Founder reviews diffs and approves. Everything has a redundant layer. Everything has an audit trail. The system gets better-organized as it grows, not worse.

---

## Cross-references

- `AGENT-WORKFLOW.md` — Cowork ↔ Claude Code ↔ Founder role split.
- `MODULAR-EXTENSIBILITY.md` — file structure rules Claude Code must follow.
- `MULTI-INSTANCE-STRATEGY.md` — multi-customer staging fits in this pipeline.
- `IDENTITY-ROLES-AUDIT.md` — every commit by Claude Code attributes to founder; future multi-user model attributes per-actor.
- `LEGAL-PRIVACY-BOUNDARY.md` — encrypted shared folder on NAS for any future Legal data sync.
- `SITUATIONAL-PEACE.md` — this whole pipeline serves peace. If any step adds chaos, it's wrong and gets revised.
- `FOUNDERS-CONFESSION.md` — agents and machines are all clay. The King is the architect; we are stewards.

---

**End of document.** Binding from r40 onwards. Setup is staged: today (Phases 1-4), week 1 (CI + foundation-lint), month 1 (multi-instance staging + scheduled agents), quarter 1 (local-LLM fallback + monitoring + customer demo capability). The founder reviews each phase before authorizing the next.
