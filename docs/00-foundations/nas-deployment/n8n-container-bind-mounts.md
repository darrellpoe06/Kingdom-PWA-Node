# n8n Container Bind Mounts (Synology Container Manager)

**Layer 4 working / Layer 3 reference — NAS deployment.** Authoritative inventory of the
Docker bind mounts the n8n container needs, why each one exists, and the safe procedure to
add the two that are currently missing (master-list items **L2** and **L3**).

Opened 2026-06-03 as part of the continuous-commissioning loop. Pairs with
`scripts/nas-update-n8n-bind-mounts.sh`.

---

## TL;DR

The n8n container reads and writes the family's data through host-path bind mounts. One mount
is present and working; two are missing, and their absence is silently breaking real workflows:

| Host path | Container path | Status | Depends on it |
|-----------|----------------|--------|---------------|
| `/volume1/PoeTech/finance-events` | `/data/finance-events` | ✅ present | wf14, wf18, wf29, wf30/31/32, wf12 telemetry |
| `/volume1/PoeTech/ChatIn` | `/data/chatin` | ❌ **missing (L2)** | wf08 (write), wf09 (read), wf27 (read) |
| `/volume1/PoeTech/poetech-briefing` | `/data/poetech-briefing` | ❌ **missing (L3)** | wf27 (read inbox + write responses/queue/log) |

The fix adds the two missing rows. It is **not** a workflow-code change — the workflow JSON
already targets the correct container paths. It is a container-configuration change.

---

## The load-bearing correction: a bind mount needs a container RECREATE, not a restart

This is the single most important fact on this page, and it corrects the intuitive-but-wrong
"stop the container, edit the config, start it again" mental model:

> **Docker fixes a container's mounts at *creation* time. You cannot add a bind mount to an
> existing container by stopping it, editing config, and `docker start`-ing it. `docker start`
> re-runs the *same* container spec — the new mount will not appear. The container must be
> *recreated*.**

There are two supported ways to recreate it on this Synology, depending on how n8n was deployed:

- **If n8n is a Container Manager *Project* (docker-compose):** edit the project's
  `docker-compose.yml` to add the two `volumes:` entries, then `docker-compose up -d`. Compose
  detects the changed spec and recreates *only* the n8n service, preserving everything else.
  This is the automatable, safe path the apply script drives.
- **If n8n is a standalone *Container* (created from an image, no compose):** there is no YAML
  to edit. Synology's UI path is: stop the container → **Action → Duplicate settings** → add
  the two volume mappings in the wizard → create the new container → delete the old one. The
  apply script detects this case and does **not** try to auto-recreate (reconstructing every
  original `docker run` flag by hand risks dropping one); it backs up the full container spec
  and prints these manual steps instead.

The apply script discovers which case applies by reading the container's own Docker labels
(`com.docker.compose.project.config_files`) rather than guessing a path by DSM version.

---

## The two missing mounts, in detail

### L2 — `/volume1/PoeTech/ChatIn → /data/chatin`

**Workflow that depends on it:** `08-synology-chat-inbound-capture.json` ("Write to ChatIn"
Code node). The node's own comment is the spec:

> *"writes the payload as a timestamped JSON file in `/data/chatin` (which is bind-mounted to
> `/volume1/PoeTech/ChatIn` on the Synology — SMB-accessible at `\\192.168.1.26\PoeTech\ChatIn`
> from any LAN client). Path B — sovereign loop, no MCP, no external services."*

It runs `fs.mkdirSync('/data/chatin', {recursive:true})` then
`fs.writeFileSync('/data/chatin/<ts>__<sender>.json', ...)`. With no mount, `/data/chatin`
exists only *inside* the container's ephemeral layer — the file lands nowhere the host (or any
other workflow, or Claude) can see it, and it evaporates on the next container restart. That is
the **silent input-visibility gap**: wf08 returns 200 OK, the Code node "succeeds," but the
family voice it captured is invisible. Last host-visible capture was 2026-05-29 22:47:58.

Two other workflows *read* this same path and have been quietly starved:
- `09-chat-digest-30min.json` — "Scan /data/chatin (last 30 min)".
- `27-foundation-agent.json` — collects unacked thoughts from `/data/chatin`.

The D11 workaround (scheduled-checkin Step 0.5 Synology Chat UI scrape) was itself blocked by
the DSM cert interstitial on 2026-06-03, so the workaround is not reliable. This mount is the
real fix.

### L3 — `/volume1/PoeTech/poetech-briefing → /data/poetech-briefing`

**Workflow that depends on it:** `27-foundation-agent.json` ("Process inbox + route" Code
node). It uses four subpaths under the briefing root:

| Container subpath | Role |
|-------------------|------|
| `/data/poetech-briefing/inbox` | reads direct `/webhook/thought` submissions |
| `/data/poetech-briefing/responses` | writes Ollama-drafted replies for the next session |
| `/data/poetech-briefing/queued-for-claude` | writes structured tasks the next Dispatch session executes |
| `/data/poetech-briefing/agent-log` | writes a per-run JSON log |

Without the mount, the Foundation Agent cannot read its operating context (the inbox) and its
outputs (responses, queued tasks, logs) vanish on restart — the Foundation's heartbeat beats
into the void. Per `AI-FOUNDATION-INTERNAL-OPERATIONS`, this is the recurring brain-check that
must run whether or not Darrell is at the keyboard; it needs durable storage to do that.

---

## Host directory pre-creation (a real correctness detail, not boilerplate)

The apply script pre-creates the host directories **and `chown`s them to `1000:1000`** before
recreating the container. This matters: if a bind-mount source directory does not exist when the
container starts, Docker auto-creates it owned by `root`. The n8n container runs as uid `1000`
(the `node` user) and would then be unable to write — reproducing the "succeeds but nothing
lands" symptom for a different reason. Pre-creating as `1000:1000` closes that.

Directories created:
```
/volume1/PoeTech/ChatIn
/volume1/PoeTech/poetech-briefing/inbox
/volume1/PoeTech/poetech-briefing/responses
/volume1/PoeTech/poetech-briefing/queued-for-claude
/volume1/PoeTech/poetech-briefing/agent-log
```

---

## Order of operations (what the apply script does)

1. **Resolve** the `docker` and `docker-compose` binaries (Container Manager paths first).
2. **Idempotency check** — `docker inspect n8n` for existing mounts. If both `/data/chatin` and
   `/data/poetech-briefing` are already mounted → report "already present" and exit 0. Nothing
   is stopped, edited, or recreated.
3. **Pre-create** the host directories as `1000:1000` (above).
4. **Back up** the full container spec (`docker inspect n8n`) and, if it is a compose project,
   the `docker-compose.yml`, into `/volume1/PoeTech/nas-backups/n8n-bind-mounts/<timestamp>/`.
   The backup happens **before** any mutation and is echoed to stdout so it is visible.
5. **Branch on topology** (read from the container's compose labels):
   - **Compose project:** insert the two `volumes:` entries into a *copy* of the YAML
     (anchored on the existing `…:/data/finance-events` line, matching its indentation),
     then **validate the edited copy with `docker-compose config -q`**. Only if validation
     passes does it swap the copy in and run `docker-compose up -d` (recreates the n8n service).
     If validation fails, the original is left untouched and the script aborts — **n8n never
     goes down from a bad edit.**
   - **Standalone container:** do not auto-recreate. Print the Synology "Duplicate settings"
     UI steps and the backup location, and exit. (Auto-reconstructing a `docker run` command
     from inspect risks dropping a flag; the UI duplicate-with-settings flow preserves them.)
6. **Wait** ~30s for n8n to boot.
7. **Verify** the mounts are active (`docker inspect n8n` again) and print the verification
   recipe (post in Synology Chat → `ls /volume1/PoeTech/ChatIn/`).

### Why validate-before-cutover is the safety invariant

The headline risk is a malformed YAML edit that prevents n8n from starting: if n8n is down, its
web UI at `192.168.1.26:5678` is unreachable and **all 23 workflows stop firing** — scheduled
checkins go silent, family-voice capture stops, finance ingest halts. The script makes that
outcome structurally hard to reach: the edit is validated on a copy *before* the running
container is touched, so an invalid edit aborts with the live container still up.

---

## Risk assessment + rollback

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Malformed YAML edit prevents n8n start → all workflows down | Low | `docker-compose config -q` validation **before** cutover; abort-with-original-intact on failure |
| Anchor line (`…:/data/finance-events`) not found in YAML | Low | Script falls back to writing the proposed YAML for manual review instead of guessing |
| n8n is standalone, not compose → no YAML to edit | Unknown | Detected via labels; script prints the Synology Duplicate-settings UI steps + backup; no destructive auto-action |
| Container recreate loses n8n's own data | Very low | n8n's persistent data (`/home/node/.n8n`, the DB) is on its own existing mount/volume that the recreate preserves; only the *spec* changes, and the full spec is backed up first |

**Rollback (compose case).** The pre-mutation backup is at
`/volume1/PoeTech/nas-backups/n8n-bind-mounts/<timestamp>/docker-compose.yml`. To roll back,
restore it over the project's compose file and `docker-compose up -d`:

```
LATEST=$(ls -1dt /volume1/PoeTech/nas-backups/n8n-bind-mounts/*/ | head -n1)
# Copy the backed-up compose file back over the live project file (path printed by the apply script),
# then: <docker-compose> -f <project compose path> up -d
```

The apply script prints the exact backup directory and the exact compose-file path it edited, so
the rollback command is concrete after a run rather than templated here.

**Rollback (standalone case).** Nothing was changed automatically; the old container is still
running. Discard the duplicate if the manual recreate misbehaves.

---

## Verification (TEST)

After the apply (compose case) or the manual recreate (standalone case):

1. **L2** — post a test message in Synology Chat `#PoeTech-PWA` (e.g. `@nas mount test`).
   Wait ~30s. Then on the NAS:
   ```
   ls -la /volume1/PoeTech/ChatIn/
   ```
   A new `…__<sender>.json` file with the message content confirms wf08 is now writing
   host-visible. The silent gap is closed.
2. **L3** — confirm the briefing path is readable from inside the container:
   ```
   <docker> exec n8n ls -la /data/poetech-briefing/
   ```
   It should list `inbox/ responses/ queued-for-claude/ agent-log/` (created by step 3 above and
   visible through the mount). The Foundation Agent can now read its operating context.

Per `EXECUTION-OUTCOME-OBSERVABILITY`: wf08's silent-failure pattern is replaced by actual
on-disk capture plus the existing family-voice ntfy push (wired in D4) — the input is visible
again.
