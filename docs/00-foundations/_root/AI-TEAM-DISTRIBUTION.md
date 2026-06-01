# AI Team Distribution

**Companion to SYSTEM-SKILLS-INVENTORY.md.** That doc describes what each tool CAN do. This one names which tool DOES each kind of work, with explicit fallbacks and the criteria for when to escalate.

Per GOVERNANCE-EXECUTION-ADVISORY: this is how the Foundation distributes its own labor. Darrell as Governor approves the routing model itself (this document); the Foundation as Executor follows it; Claude as Advisor refines it when the matrix needs updating.

## The team

Ten functional roles. Some are filled by the same underlying tool; that's fine — the role describes the job, not the model.

### Role 1 — Inbox Sorter

**Job:** Receive thoughts from Darrell (via @nas or `/webhook/thought`). Classify by tag, content, urgency. Decide where the thought goes next.

**Default tool:** Ollama 3b (fast, free, low-stakes classification).
**Fallback:** Ollama 14b if the 3b model produces ambiguous classification.
**Escalate to:** Foundation Agent meta-decision if both Ollama models disagree.

**Standing authority:** Routes without asking. Reading + routing is always safe.

### Role 2 — Conversational Responder

**Job:** Answer the user's short questions, give status updates, summarize state, draft notes. Whatever a competent assistant would do for a thought that doesn't need code or substantive change.

**Default tool:** Ollama 14b.
**Fallback:** Ollama 3b if 14b is busy or slow.
**Escalate to:** Claude via workflow 27's queue if the user's question requires cross-document reasoning beyond Ollama's reliable range, or if response includes `ESCALATE_TO_CLAUDE` marker.

**Standing authority:** Responds without asking. Posts replies to Synology Chat via outbound webhook OR ntfy notification.

### Role 3 — Code Generator / Refactorer

**Job:** Write or modify source files in the repo. Includes React components, n8n workflow JSONs, foundation docs, scripts.

**Default tool:** Claude in a Dispatch / Code session.
**Why not Ollama:** Code work at this scale (multi-file edits, careful regex, JSX correctness) benefits significantly from frontier capability. Cost is justified by review time saved.
**Why not Gemini:** Could work; routes here when a workflow explicitly requests Gemini for cost reasons. Claude is the default for code in this repo.

**Standing authority:** None for direct push. Drafts the change, Foundation queues for Governor approval (Governance-Execution-Advisory binds), Foundation executes the push after approval.

### Role 4 — Cross-Document Reasoner

**Job:** Hold multiple foundation docs + session notes + current code state simultaneously and reason across them. Examples: deciding which foundation principle applies to a new feature, drafting a brief that ties together past decisions.

**Default tool:** Claude in a Dispatch session with file read access.
**Why not Ollama:** Context window + reliable instruction-following at this complexity favors Claude.
**Why not Gemini:** Could work; the call is made by workflow 17 when sovereignty isn't required. Default to Claude when an active session is available.

**Standing authority:** Reads anything in the repo. Writes drafts. Does not commit.

### Role 5 — Bulk Reasoner

**Job:** Long-form research, summarization of large public docs, planning across many inputs.

**Default tool:** Gemini via workflow 17 (cheaper for bulk, fine for non-sensitive).
**Fallback:** Claude if Gemini is unavailable or refuses (TLC firewall classifier).
**TLC firewall:** never sends clinical / family-private content.

**Standing authority:** Reads + summarizes. Output goes to a workflow that decides what to do with it.

### Role 6 — Browser Operator

**Job:** Drive web UI when no API exists. OAuth grants, captcha confirmations, console-only admin panels.

**Default tool:** Claude in a Dispatch session via Chrome MCP.
**Why not autonomous:** Browser driving is slow and brittle; AI-FOUNDATION-INTERNAL-OPERATIONS principle says prefer API. Browser is the exception, not the default.
**Authority limit:** Cannot type passwords. Cannot accept TOS. Cannot send money. Per the safety rules in every Claude system prompt.

**Standing authority:** Reads pages, clicks buttons that don't trigger irreversible action. Stops at any credential or financial form.

### Role 7 — Connection-Thinker (added 2026-05-28)

**Job:** For any proposed visible surface — demo, screenshot, button, link, public page, marketing copy, public mention of a real business or person — audit the obligation it generates. Apply the five-question test from BUSINESS-PROCESS-CONNECTIONS:

1. What does this surface invite?
2. What pipeline carries that action?
3. Who is the Governor for the incoming volume?
4. What's the visible promise we're making?
5. What's the timeline commitment? (How long to set up to handle this audience, and how confident is the estimate?)

Surface the answer to each. Where any answer is missing or "we'll figure it out", name the gap as a blocker before any code ships or any marketing happens. Marketing surfaces follow pipeline readiness AND credible timeline commitments; the Connection-Thinker is the role that enforces the ordering. The Connection-Thinker also drafts the timeline estimates the Governor commits to — honest low/medium/high confidence bands based on foundation docs + session notes + code state, never optimistic, never padded.

**Default tool:** Claude in a Dispatch / Code session.
**Why Claude:** Cross-document reasoning — the role has to hold the foundation principles + the current code state + the implied promise of the surface + the available pipelines simultaneously. This is the same capability profile as Role 4 (Cross-Document Reasoner) but applied to a different question.
**Why not Ollama:** Ollama can run the four-question test mechanically on a known surface — that's a fine use of workflow 27's Ollama 14b for periodic audits of shipped state — but the *generative* version (deciding what to ship next) needs Claude.
**Fallback for periodic audits only:** Ollama 14b can re-run the four-question test against shipped surfaces on a weekly cron, flagging anything that drifts.

**Standing authority:** Names connection gaps and refuses to draft visible-surface code until the four questions have answers (or until the gap is explicitly accepted by the Governor as "ship anyway, accept the exposure"). Does NOT have authority to ship the surface; that remains with Foundation execution + Governor approval.

**Why this is a distinct role and not just Role 4 (Cross-Document Reasoner):**

Role 4 is about *reasoning across documents to answer a question*. Role 7 is about *auditing an outward-facing artifact against its implied obligations*. They share a tool (Claude) but the questions are different:

- Role 4 answers: "what does the system know about this?"
- Role 7 answers: "what is the system promising by showing this, and is the promise wired?"

A session where Darrell asks "what do our foundation docs say about X" is Role 4. A session where Darrell proposes "ship a public roadmap page" is Role 7 — Claude's first move should be the four-question audit, not the page itself.

**Companion to Role 6 (Browser Operator):** when Role 6 is asked to drive a browser to ship something public, Role 7 runs the four-question test first. If the answer is "this surface is not wired", Role 6 does not ship and instead surfaces the gap to the Governor.

### Role 8 — Test Author (added 2026-05-29)

**Job:** After every Code Generator (Role 3) session, generate the unit + integration + end-to-end tests for the new code. Test fixtures use synthetic data for all six baseline personas per SEED-DATA-AS-ASPIRATION (Family of 4, Separated, Solo Practice, Landlord, Church-Connected, Region-Anchored). Output: failing tests committed alongside the implementation PR; passing tests after implementation lands.

**Default tool:** Claude. Test authoring requires frontier capability — bad tests are worse than no tests because they create false confidence.
**Fallback:** Gemini for bulk fixture generation when sovereignty isn't required and the test shape is mechanical (e.g., 100 variants of valid bank export data).
**Why not Ollama:** Ollama 14b can write SIMPLE tests, but the discriminating taste required to test the right things — edge cases, foundation-principle compliance, persona-specific assertions — favors Claude.

**Standing authority:** Writes tests. Does not implement. Cannot bypass tests for any code that touches a visible surface or a persistence layer.

**Companion to Role 3 (Code Generator):** Test Author runs IN PARALLEL with Code Generator. Same Dispatch session can hold both roles — Code Generator writes implementation in one worktree while Test Author writes tests in another, both reviewing each other's work before the combined PR.

### Role 9 — Test Runner / Failure Triage (added 2026-05-29)

**Job:** CI runs the test suite on every PR. When tests fail, this role reads the output, classifies the failure (real bug / flaky / environmental), and either proposes a fix patch or escalates back to Code Generator (Role 3).

**Default tool:** Ollama 14b for triage and classification (free, fast, runs on every PR without cost concerns).
**Escalate to:** Claude for fix patches when the failure is a real bug, especially when the fix requires cross-document reasoning about why the test exists.
**Fallback:** Gemini via workflow 17 if Ollama 14b is unavailable.

**Standing authority:** Triage + classification + escalation. Does not merge. Cannot mark a test "flaky" without recording the triage rationale on the PR.

### Role 10 — Quality Gatekeeper (added 2026-05-29)

**Job:** Pre-merge gate. For any PR that touches a visible surface (PWA component, public endpoint, marketing copy, demo data), run the binding-foundation checks: Foundation-screen (F.1) + EXCELLENCE-STANDARD religion-and-relationship + BUSINESS-PROCESS-CONNECTIONS five-question test + SEED-DATA-AS-ASPIRATION four-question test (if seed data changes) + typographic-theology compliance (CLAUDE.md). Refuses merge if any check fails. Records the decision rationale on the PR.

**Default tool:** Ollama 14b on NAS. Free per call, runs in seconds, doesn't slow PRs.
**Why Ollama and not Claude:** at the volume of PRs this gate would run (potentially dozens per week), per-token cost matters. Ollama 14b is adequate for the binary "does this artifact pass the foundation checks" question — the checks are explicit, not generative.
**Escalate to:** Claude when Ollama 14b reports a borderline pass/fail and human-grade judgment is needed.

**Standing authority:** Refuses merge. The only role with merge-blocking authority beyond Darrell. Governor can override the Gatekeeper's refusal, but the override is recorded.

**Why three separate roles for testing instead of one:** Test Author writes the tests; Test Runner reads results and triages; Quality Gatekeeper enforces foundation compliance. Collapsing them into one role would either over-burden Claude (expensive on every PR) or under-deliver (Ollama can't write good tests, but it CAN triage and enforce). Splitting lets each role use its right-sized tool.

### Cross-role coordination for the testing roles

Code Generator (Role 3) writes implementation. Test Author (Role 8) writes tests for that implementation. They commit together in the same PR. CI runs tests. Test Runner (Role 9) triages any failures and either patches or escalates. Quality Gatekeeper (Role 10) runs foundation checks on the diff. If all checks pass, the PR is ready for Governor review.

The Governor (Darrell) reviews PRs with pre-attached: passing test results, Gatekeeper-passed badge, list of foundation principles applied, triage rationale for any flaky tests. The Governor's review becomes a quality decision, not a discovery process.

## Cross-role coordination

### When Inbox Sorter (Role 1) hands off to Code Generator (Role 3)

A thought like "rewrite the demo to lead with value":

1. Inbox Sorter classifies as `needs-claude` (matches keyword `rewrite` + scope analysis says "substantive code").
2. Writes the thought to `/data/poetech-briefing/queued-for-claude/<id>.json`.
3. Posts to Synology Chat: "Queued for Claude. Open Dispatch when ready."
4. Darrell opens Dispatch → fresh Claude session calls `/webhook/briefing` → sees the queued task → executes per Code Generator role.

The Inbox Sorter never tries to do code itself; doing so would route via Ollama and produce lower-quality work.

### When Conversational Responder (Role 2) escalates to Cross-Document Reasoner (Role 4)

A thought like "explain how the bank reconciliation works in plain language":

1. Inbox Sorter routes to Conversational Responder.
2. Ollama 14b drafts a response using the system prompt knowledge.
3. If the draft contains `ESCALATE_TO_CLAUDE` (because the model isn't sure about specifics), Foundation Agent moves it to Claude queue.
4. Otherwise, response goes back to Synology Chat directly.

### When Browser Operator (Role 6) hits a credential wall

Today's poetech.us DNS work is the canonical example:

1. Darrell drops a thought about a DNS issue.
2. Foundation Agent classifies as `needs-claude` (browser ops aren't autonomous).
3. Darrell opens Dispatch later; Claude reads the queue.
4. Claude drives Chrome MCP through the registrar UI as far as it can.
5. At every credential field, Claude stops and surfaces the field to Darrell.
6. Darrell types the credential; Claude continues.

Per AI-FOUNDATION-INTERNAL-OPERATIONS: this whole flow should be replaced by a workflow that uses the registrar API directly. That's tracked in the queued-workflows list (DNS-via-API integration).

### When Connection-Thinker (Role 7) intercepts a Code Generator (Role 3) request

A request like "add a 'Book a session with Christina' button to the demo":

1. Inbox Sorter routes to Code Generator on first read.
2. Code Generator's first move (per Role 7 binding) is to run the four-question test:
   - Invites: clicking books a clinical session with Christina at TLC Therapy Solutions.
   - Pipeline: TLC's actual booking system (Practice Better / whatever Christina uses). Is the system load-tested for traffic the PWA could route? Does Christina want this traffic? Is there clinical-intake capacity?
   - Governor for incoming volume: Christina (TLC operations), not Darrell. Has she approved this connection?
   - Visible promise: implies professional therapy availability and a working intake process.
3. If any answer is missing, Code Generator surfaces the gap to the user *before* writing the button code. The role explicitly does not "ship now, ask Christina later".
4. Only after the four questions have answers (or the user explicitly accepts the gap) does Code Generator proceed.

This is the binding pattern that prevents the system from shipping unwired marketing surfaces by accident.

## When to update this matrix

When any of these is true:

- A new tool joins the stack (e.g., a new local model, a new MCP server).
- An existing tool's capability profile changes (model upgrade, deprecation).
- A new workflow shifts the standing-authority lines.
- A Governor decision changes the default routing (e.g., "always use Claude for X").

The update process:

1. Drop a thought: `@nas update AI-TEAM-DISTRIBUTION: <change>`
2. Workflow 27 routes to Claude.
3. Claude drafts the edit as a PR.
4. Governor approves.
5. Foundation pushes.

## Closing posture

The team isn't fixed. As tools improve, more work moves down the stack — from Claude to Ollama, from manual operation to workflow. The direction is always toward sovereignty + autonomy + cost-efficiency, never away from them. The Foundation gets cheaper and more capable over time.

We all win. And we create. Amen.
