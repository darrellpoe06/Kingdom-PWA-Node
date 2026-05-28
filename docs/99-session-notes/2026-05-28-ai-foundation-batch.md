# AI Foundation batch — what shipped + what you set up

Per the new `AI-FOUNDATION-INTERNAL-OPERATIONS` foundation and your follow-on direction that n8n should be the persistent memory bridge between Claude sessions and trigger Claude on its own when you're asleep / away — four new workflows landed in this push.

## What shipped

**Workflow 20 — Health-check + ntfy alerts.** Every 10 min, checks: n8n /healthz, workflow 15 freshness (<24h), workflow 16 freshness (<2h), disk writability. Records each run to `/data/finance-events/_health/`. Pushes ntfy on failure transitions and re-alerts every 6h while still failing. Topic defaults to `poetech-health`.

**Workflow 23 — Project briefing.** `GET /webhook/briefing` returns the AI Foundation read-out for any Claude session that boots cold. Inbox FIRST (your thoughts from Synology Chat + direct webhook), then binding principles, then operational state, then queued briefs. A new session reads this before doing anything else — no need to ask you "what's the state."

**Workflow 26 — Thought inbox.** `POST /webhook/thought` accepts a thought from anywhere (curl, phone, future PWA quick-capture). Stored at `/data/poetech-briefing/inbox/<id>.json`. `POST /webhook/thought-ack` lets a session mark a thought as read once acted on. Pairs with workflow 08 which is already capturing Synology Chat `@nas` messages to `/data/chatin/`.

**Workflow 27 — Foundation Agent.** Runs on schedule (7am · 12pm · 5pm · 9pm) AND on-demand via `POST /webhook/agent-fire`. Reads unacked thoughts, classifies each (info-only, ollama-handleable, needs-claude, TLC-firewalled), routes appropriately. Ollama-handleable goes through local Ollama for an immediate response. Claude-required gets queued for the next Dispatch session to pick up. Posts a digest back to Synology Chat (when chat-out is wired) AND pushes a ntfy notification. This is the heartbeat that runs whether or not you're at the keyboard.

## How they fit together

```
You drop thought in Synology Chat @nas
         ↓
Workflow 08 captures it to /data/chatin/
         ↓
Workflow 27 (cron OR fire-on-demand) reads inbox
         ↓ classifies
         ├─ TLC/clinical → Ollama only (sovereign, NAS-local)
         ├─ Ollama-handleable → Ollama responds, written to /responses/
         ├─ Needs Claude → queued in /queued-for-claude/
         └─ Info-only → noted
         ↓
Digest pushed to ntfy + Synology Chat
         ↓
You wake up, see digest, open Dispatch when ready
         ↓
Next Claude session calls /webhook/briefing
         ↓
Briefing returns: unread thoughts FIRST, queued-for-claude tasks, state
         ↓
Claude picks up the queue and starts working
```

## What you set up (when you have time)

These unlock progressively more autonomy. Pick whichever fits the energy you have:

### 1. Import the four new workflows in n8n (5 min)

n8n editor → Workflows → for each of 20, 23, 26, 27:
- Three-dot menu → Import from File → pick the matching JSON from `docs/00-foundations/n8n-workflows/`
- Activate the workflow toggle
- (Optional) Delete the old workflow if duplicate

After import, smoke-test the briefing:

```
cd C:\Users\dpoe\Kingdom-PWA-Node
curl.exe -sS "https://poetech.tail5a2f35.ts.net/webhook/briefing" | findstr unread_count
```

Should return JSON with `"unread_count": N` reflecting your Synology Chat @nas messages.

### 2. Synology Chat outbound webhook (5 min)

In Synology Chat → settings (your channel `#PoeTech-PWA`) → Integration → Incoming Webhook → Create. Synology gives you a URL like `https://192.168.1.26:5001/...?api=SYNO.Chat.External...`. Copy it.

Then in n8n → Settings → Environment Variables → add `SYNOLOGY_CHAT_INCOMING_URL` with that value. Workflow 27 reads it and posts digests back to chat.

(If you don't want chat-out yet, ntfy alone is enough — the agent still works, you just get phone notifications instead of chat replies.)

### 3. Verify Ollama is reachable from n8n (1 min)

Workflow 27 calls Ollama at `http://ollama:11434/api/generate` by default. If your docker-compose uses different hostnames or ports, set the env vars `OLLAMA_HOST` and `OLLAMA_PORT`. Defaults match the existing memory note.

Smoke test from inside the n8n container:

```
ssh dpoe@192.168.1.26 "sudo /var/packages/ContainerManager/target/usr/bin/docker exec n8n wget -qO- http://ollama:11434/api/tags"
```

Should list your installed models. The agent uses `qwen2.5:14b-instruct-q4_K_M` by default; set `OLLAMA_MODEL` to override.

### 4. Briefing-source sync (optional, 5 min)

For workflow 23 to surface foundation docs + session notes by title, the `/data/poetech-briefing/` directory needs the markdown files. Simplest path: rsync from your laptop into the NAS share.

```
cd C:\Users\dpoe\Kingdom-PWA-Node
scp docs\00-foundations\_root\*.md dpoe@192.168.1.26:/volume1/PoeTech/briefing/foundations/
scp docs\99-session-notes\*.md dpoe@192.168.1.26:/volume1/PoeTech/briefing/session-notes/
```

(Assumes `/volume1/PoeTech/briefing/` exists and is bind-mounted at `/data/poetech-briefing/` in n8n. If not, the briefing still returns the hard-coded fast facts — just without the doc titles.)

A future workflow 25 (briefing-sync) can pull these automatically from GitHub on every commit, eliminating this manual rsync. That's the next iteration once the basics work.

## Test the loop end-to-end

1. Open Synology Chat, post in `#PoeTech-PWA`: `@nas test thought — what's the buffer fund balance per Big Picture?`
2. Wait for the next scheduled tick (or curl `https://poetech.tail5a2f35.ts.net/webhook/agent-fire` to fire immediately).
3. Should hit your phone via ntfy with a digest.
4. Should also surface in `GET /webhook/briefing` under `inbox.thoughts`.
5. Open Dispatch. A new Claude session, on its first turn, can call the briefing endpoint and read your thought + Ollama's draft response.

## Commit batch

```
cd C:\Users\dpoe\Kingdom-PWA-Node
git add docs/00-foundations/n8n-workflows/20-health-check.json docs/00-foundations/n8n-workflows/23-project-briefing.json docs/00-foundations/n8n-workflows/26-thought-inbox.json docs/00-foundations/n8n-workflows/27-foundation-agent.json docs/99-session-notes/2026-05-28-ai-foundation-batch.md
git commit -m "AI Foundation batch: health-check 20, project briefing 23, thought inbox 26, Foundation Agent 27. n8n becomes the persistent memory bridge between Claude sessions and runs the inbox processor 4x daily on cron."
git push
```

## What's still queued

- **Workflow 21 — Login + session token (Multi-user Layer B)** — security layer for the profile picker
- **Workflow 22 — TLC data API (Layer C)** — only when Christina opts in
- **Workflow 24 — Specialist access router** — the marketplace heart (post-Layer C)
- **Workflow 25 — Briefing sync from GitHub** — kills the manual rsync step
- **Vercel API integration** — automated domain validation, deploy monitoring
- **Power awareness** — UPS status reads, graceful shutdown thresholds (per your direction)
- **DNS via registrar API** — Cloudflare migration plan so workflow can manage DNS without browser clicks

Per the AI-FOUNDATION-INTERNAL-OPERATIONS principle, the order matters: every new piece should kill a manual workflow. The next layer (Workflow 25 briefing-sync) eliminates one click; workflow 21 eliminates per-device profile reconfiguration; the Cloudflare migration eliminates today's poetech.us afternoon entirely.

Iteratively better. Amen.
