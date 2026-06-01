# EXECUTION-OUTCOME-OBSERVABILITY

**Declared:** 2026-06-01
**Declared by:** Darrell
**Status:** Binding foundation principle

---

## The principle

Every workflow execution outcome must be observable AND alerted on, not just stored. A pipeline that fails silently while reporting "200 OK" to its caller is not stewardship — it is the inverse of stewardship.

Per Darrell, 2026-06-01 (mid-NAS-debug from Maui, after the wf30 silent-failure cost ~4 hours of debugging):

> "These are the types of reviews that the n8n should be continuously doing for the whole project and really as many processes as possible for the highest quality outputs."

## Why this matters

PoeTech is a system that helps the Poe family steward what Yahweh has given them. A pipeline that silently fails for hours while reporting success to its callers fails that mandate. The Excellence Standard and PERPETUAL-PIPELINE-HEALTH foundation docs already imply this, but it must be named explicitly as a binding rule.

The concrete failure that triggered the naming: wf30 (family feedback intake) errored on 6 consecutive executions throughout the afternoon of 2026-06-01 with the same error — `process is not defined [line 27]` in the Capture feedback Code node. n8n stored every error in the Executions tab but no alert fired, no log line appeared in `docker logs`, no ntfy push happened. The bug was only discovered by manually opening the n8n web UI and clicking the Executions tab. The wasted debugging time was the cost of NOT having this principle implemented.

## How to apply

1. **Every n8n workflow has its execution outcomes monitored.** Use `saveDataErrorExecution: all` plus a periodic poller (or a hook on execution-finish) that fires an ntfy push when:
   - A workflow errors 3+ consecutive times on the same error string
   - A workflow with a webhook trigger has zero successful executions in 24h after activation
   - A workflow with a cron trigger fails to fire at its expected cadence (no execution within window)
2. **Alerts route to the family-feedback ntfy topic** so the Governor (Darrell, then anyone monitoring) sees them within minutes — never wait for the next batch digest.
3. **The same observability extends to every process the system runs** — not just n8n workflows but Ollama responses, ntfy delivery, Synology Chat posts, GitHub API calls, Supabase writes. Anywhere a thing can silently fail, there must be a watcher that escalates.
4. **The Quality Gatekeeper (wf36) is the natural home** for the implementation — extend its scope from PR-time quality checks to ongoing pipeline-execution checks.
5. **Health summaries roll up into the 7am daily digest (wf31).** Add a section: "Pipelines healthy: X/Y. Failed in last 24h: Z." So the family sees system health alongside family voices.

## Pairs with

- [PERPETUAL-PIPELINE-HEALTH](./PERPETUAL-PIPELINE-HEALTH.md) — names "monitoring" as one of the 13 binding rules. This principle is the specific implementation of that rule for execution outcomes.
- [QUALITY-OF-LIFE-AS-NORTH-STAR](./QUALITY-OF-LIFE-AS-NORTH-STAR.md) — the system-as-mirror-never-judge frame applies: surface what's actually happening, don't editorialize.
- [AI-FOUNDATION-INTERNAL-OPERATIONS](./AI-FOUNDATION-INTERNAL-OPERATIONS.md) — the AI Foundation operates the system; it is also responsible for telling the family when its own organs are sick.
- [BUSINESS-PROCESS-CONNECTIONS](./BUSINESS-PROCESS-CONNECTIONS.md) — every visible surface should be wired. Add: every wiring should be monitored.
- [INPUT-VISIBILITY-TO-CLAUDE](./INPUT-VISIBILITY-TO-CLAUDE.md) — the input-side mirror of this principle.
- [INSTITUTIONAL-MEMORY-EVENTS](./INSTITUTIONAL-MEMORY-EVENTS.md) — execution outcomes become Event records in the institutional memory layer.

## Open buildout

1. Wire wf36 (Quality Gatekeeper) to enforce execution-outcome observability on every active workflow.
2. Extend wf20 (Health-check + ntfy alerts) to include execution-outcome alerts in its periodic sweep.
3. Add a health-summary section to the wf31 daily digest.
4. Add execution-outcome observability to the SYSTEM-SKILLS-INVENTORY and the AI-TEAM-DISTRIBUTION (likely a Role-10 / Quality Gatekeeper extension).

## Cost of not building this

Every silent failure costs an entire debugging session. 2026-06-01 paid that cost. Building this prevents the next one.
