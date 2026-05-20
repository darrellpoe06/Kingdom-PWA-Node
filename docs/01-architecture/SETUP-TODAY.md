# Setup Today — First Working Model in 2-3 Hours

This is the side-by-side checklist. Foundation reasoning lives in `INFRASTRUCTURE-PIPELINE.md`; this doc is the do-now sequence. Each step has an exact command + an expected output to confirm success before moving on.

---

## Before you start

- Laptop (Samsung Galaxy Book Pro)
- DS1621xs NAS reachable on the LAN — note its IP (Synology DSM → Control Panel → Network → Network Interface)
- Active Claude subscription (you already have this via Cowork)
- 60 min uninterrupted for Phase 1 + 2; another 30 min for Phase 3 + 4

---

## PHASE 1 · Laptop — Claude Code (15 min)

### 1.1 Verify Node

Open PowerShell, run:
```
node --version
```
Expected: `v18.x` or higher. If "command not found," install from [nodejs.org](https://nodejs.org/) (LTS version) then reopen PowerShell.

### 1.2 Install Claude Code

```
npm install -g @anthropic-ai/claude-code
```
Expected: succeeds in 30-60 seconds. If permission error, run PowerShell as Administrator.

### 1.3 Authenticate

```
cd C:\Users\dpoe\Kingdom-PWA-Node
claude
```
First run opens a browser; log in with your Claude account. Then in the Claude Code prompt:
```
help
```
Confirm you see the command list. Type `exit` to leave for now.

### 1.4 Run the first task card

```
cd C:\Users\dpoe\Kingdom-PWA-Node
claude
```
At the prompt, paste exactly:
```
Read /docs/01-architecture/AGENT-WORKFLOW.md and /CLAUDE.md.
Then execute the task card at /docs/01-architecture/task-cards/2026-05-18-white-screen-non-free-tier.md.
Report back per the "When done" section.
```

Claude Code will: read the foundations, diagnose the bug (likely needs to run `npm run dev` and check console errors), edit the offending file, run `npx vite build` to verify, and report back with `git diff --stat`, build output, and root cause.

### 1.5 Review + commit

Read the diff Claude Code shows. If it looks right:
```
git add -A
git commit -m "fix(about): white-screen on non-free tier (via Claude Code)"
git push
```

**Phase 1 success criteria:** task card executed, build green, commit pushed. You can now cycle in this loop indefinitely.

---

## PHASE 2 · NAS — Gitea (45 min)

### 2.1 SSH in

```
ssh admin@<your-nas-ip>
```
If SSH disabled: DSM → Control Panel → Terminal & SNMP → Enable SSH service, then retry.

### 2.2 Enable Container Manager

In DSM web UI: Package Center → search "Container Manager" → Install. Wait ~2 min.

### 2.3 Prepare folder

```
sudo mkdir -p /volume1/docker/gitea
sudo chown -R 1000:1000 /volume1/docker/gitea
```

### 2.4 Create the Gitea container

In Container Manager → Project → Create:
- Project name: `gitea`
- Path: `/volume1/docker/gitea`
- Source: Create docker-compose.yml
- Paste:

```yaml
version: '3'
services:
  gitea:
    image: gitea/gitea:latest
    container_name: gitea
    environment:
      - USER_UID=1000
      - USER_GID=1000
      - GITEA__database__DB_TYPE=sqlite3
    restart: always
    volumes:
      - /volume1/docker/gitea:/data
    ports:
      - "3000:3000"
      - "2222:22"
```

Click "Build" — pulls image, starts container. Wait ~3 min.

### 2.5 First-run setup

Browser → `http://<your-nas-ip>:3000`. Gitea setup wizard:
- Database: SQLite3 (default)
- Application URL: `http://<your-nas-ip>:3000/`
- Admin user: `darrellpoe06`, strong password (save to a password manager)
- Disable Self-Registration (you don't want random signups)
- Click "Install Gitea"

### 2.6 Create the mirror repo

In Gitea: + button (top right) → New Repository
- Name: `Kingdom-PWA-Node`
- Description: `PoeTech Family OS — local mirror`
- Visibility: Private
- Initialize: leave unchecked (will push from laptop)
- Create

Note the SSH or HTTPS URL Gitea shows (e.g., `http://<your-nas-ip>:3000/darrellpoe06/Kingdom-PWA-Node.git`).

### 2.7 Push to NAS Gitea from laptop

Back on the laptop:
```
cd C:\Users\dpoe\Kingdom-PWA-Node
git remote add nas http://<your-nas-ip>:3000/darrellpoe06/Kingdom-PWA-Node.git
git push nas docs/skos-foundations
git push nas main  (if main exists)
```
You'll be prompted for the Gitea credentials. Save to Windows Credential Manager when prompted.

**Phase 2 success criteria:** repo visible at `http://<your-nas-ip>:3000/darrellpoe06/Kingdom-PWA-Node` with all commits.

---

## PHASE 3 · NAS — Daily Snapshots (15 min)

### 3.1 Enable snapshots on the docker folder

DSM → Control Panel → Shared Folder → highlight `docker` → Action → Snapshot.
- Enable schedule
- Frequency: Daily, 2:00 AM
- Retention: 30 daily snapshots
- Save.

### 3.2 Verify

Tomorrow morning: DSM → Snapshot Replication → Snapshots → should see one snapshot from overnight.

**Phase 3 success criteria:** scheduled snapshot exists and will fire overnight.

---

## PHASE 4 · Off-site backup — Backblaze B2 (30 min)

### 4.1 Sign up at backblaze.com/b2

Free tier covers 10 GB; the entire repo + Gitea state is well under that. Past 10 GB: $6/TB/year.

### 4.2 Create a bucket

Name: `poetech-nas-backup-{your-initials}`. Private. Note the bucket ID, key ID, application key.

### 4.3 Install Hyper Backup

DSM → Package Center → Hyper Backup → Install.

### 4.4 Create the backup task

Hyper Backup → + → Data backup task → B2 Cloud Storage. Paste your Backblaze credentials.

- Source: `/volume1/docker` (the gitea folder + future docker volumes)
- Schedule: Weekly, Sunday 2 AM
- Retention: 4 weeks rolling
- Client-side encryption: ENABLE (choose a strong passphrase, save to password manager — without it the backup is unrestorable)

### 4.5 Run a test backup now

Hyper Backup → highlight your task → Back up now. Wait for first sync (depends on size; first run is the longest).

**Phase 4 success criteria:** B2 dashboard shows files received. You have a passphrase you've tested can decrypt (test with a single small file restore).

---

## PHASE 5 · Verification (10 min)

Quick end-to-end test:

```
cd C:\Users\dpoe\Kingdom-PWA-Node
echo "Pipeline verification ping" > docs/_pipeline-test.md
git add docs/_pipeline-test.md
git commit -m "test: pipeline ping"
git push origin
git push nas
```

Confirm:
1. Change visible on GitHub
2. Change visible on Gitea (`http://<nas-ip>:3000/darrellpoe06/Kingdom-PWA-Node`)
3. Tomorrow: snapshot includes the file
4. Next Sunday: B2 backup includes the file

Delete the test file when done:
```
git rm docs/_pipeline-test.md
git commit -m "test: cleanup pipeline ping"
git push origin
git push nas
```

---

## Done — what you have

- **Laptop**: Claude Code running, first task card executed (white-screen bug fixed if Claude Code's diagnosis was correct).
- **NAS**: private git mirror via Gitea, daily snapshots of the Gitea volume.
- **Off-site**: weekly encrypted backup to Backblaze B2.
- **Three redundant copies** of every commit: laptop working tree, GitHub remote, NAS Gitea remote, plus B2 archive.
- **Pipeline pattern proven** — you can now write task cards, hand off to Claude Code, review diffs, ship.

---

## Next sessions (not today)

- **Week 1**: Self-hosted GitHub Actions runner on the NAS (free unlimited build minutes); foundation-doc lint workflow.
- **Month 1**: Multi-instance staging containers; nightly scheduled Claude Code audits.
- **Quarter 1**: Local-LLM Ollama fallback; monitoring dashboard; customer-demo capability.

---

## If anything goes wrong

- Phase 1 fails (Claude Code install/auth): check `npm config get prefix` is writable; try `nvm` to install a fresh Node.
- Phase 2 fails (Gitea container won't start): check Container Manager logs; verify port 3000 isn't taken by another service on the NAS.
- Phase 3 fails (no snapshots): check that the volume's file system is Btrfs (not ext4); only Btrfs supports DSM snapshots.
- Phase 4 fails (Hyper Backup credential error): re-paste the B2 application key; common typo source.
- Phase 5 fails (push to NAS rejected): make sure Gitea repo init was empty when you created it; if it auto-created a README, force push: `git push nas --force docs/skos-foundations`.

If you hit any of these and want help, paste the exact error into Cowork. I'll write a corrective task card for Claude Code or walk you through manually.
