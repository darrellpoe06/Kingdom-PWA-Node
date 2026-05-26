# =============================================================================
# commit-n8n-rollout-2026-05-26-phase-1c.ps1  (ASCII-only)
# =============================================================================
# Phase 1c: Pushover dual-path (Path A Direct API + Path B email-to-push)
# applied across all 5 production workflows, plus reconciliation with the
# parallel session's quad-model Ollama expansion and the workflow numbering
# collision flag.
#
# Decision 2026-05-26: pomail.net address is Pushover's INPUT endpoint (email
# gateway), NOT a signup email. Sending an email to it creates a push. This
# means Path B works the moment any SMTP source lands - no Pushover app
# token needed. Path A goes live the moment the app token is created at
# https://pushover.net/apps/build.
#
# Touched files:
#   infra/n8n/.env.example                    (added PUSHOVER_* dual-path env vars)
#   infra/n8n/INSTALL.md                      (Locked decisions aligned with quad-model
#                                               + 62 GB RAM finding; Step 6 reworked
#                                               for Path A + Path B; license deadline)
#   docs/00-foundations/n8n-workflows/01-supabase-cycle-item-webhook.json
#   docs/00-foundations/n8n-workflows/02-daily-reports-cron.json
#   docs/00-foundations/n8n-workflows/03-github-event-to-phone.json
#   docs/00-foundations/n8n-workflows/04-poe-morning-standup.json
#   docs/00-foundations/n8n-workflows/05-end-of-day-reflection.json
#   docs/00-foundations/n8n-workflows/README.md   (dual-path table + collision note)
#   docs/00-foundations/SEED-PROJECTS-2026-05-25.md  (Pushover license countdown + RAM resolved)
#
# Run from PowerShell:
#   cd C:\Users\dpoe\Kingdom-PWA-Node
#   .\commit-n8n-rollout-2026-05-26-phase-1c.ps1
#
# Uses git commit -F messagefile so PowerShell quoting is irrelevant.
# Idempotent: re-running after the commit lands is a no-op.
# =============================================================================

$repo = 'C:\Users\dpoe\Kingdom-PWA-Node'
$ErrorActionPreference = 'Stop'

function Clear-AllGitLocks {
    $locks = Get-ChildItem -Path (Join-Path $repo '.git') -Recurse -Filter '*.lock' -Force -ErrorAction SilentlyContinue
    if ($locks) {
        foreach ($l in $locks) {
            try { Remove-Item $l.FullName -Force -ErrorAction Stop; Write-Host ("  cleared: " + $l.FullName.Substring($repo.Length+1)) -ForegroundColor Yellow }
            catch { Write-Host ("  COULD NOT CLEAR: " + $l.FullName) -ForegroundColor Red }
        }
    }
}

function Invoke-GitRetry {
    param([string]$Label, [scriptblock]$Action)
    Clear-AllGitLocks
    & $Action
    if ($LASTEXITCODE -ne 0) {
        Clear-AllGitLocks; Start-Sleep -Milliseconds 400
        & $Action
        if ($LASTEXITCODE -ne 0) { throw "$Label failed" }
    }
}

# Resolve current branch -----------------------------------------------------
$branch = (& git -C $repo rev-parse --abbrev-ref HEAD).Trim()
if (-not $branch -or $branch -eq 'HEAD') {
    throw "Cannot resolve current branch. Check: git -C $repo status"
}
Write-Host ""
Write-Host ("=== Committing Phase 1c (Pushover dual-path) to branch: " + $branch + " ===") -ForegroundColor Cyan
Write-Host ""

# Files Phase 1c touches -----------------------------------------------------
$files = @(
    '.gitignore',
    'infra/n8n/INSTALL.md',
    'docs/00-foundations/n8n-workflows/01-supabase-cycle-item-webhook.json',
    'docs/00-foundations/n8n-workflows/02-daily-reports-cron.json',
    'docs/00-foundations/n8n-workflows/03-github-event-to-phone.json',
    'docs/00-foundations/n8n-workflows/04-poe-morning-standup.json',
    'docs/00-foundations/n8n-workflows/05-end-of-day-reflection.json',
    'docs/00-foundations/n8n-workflows/README.md',
    'docs/00-foundations/SEED-PROJECTS-2026-05-25.md',
    'commit-n8n-rollout-2026-05-26-phase-1c.ps1'
)
# Force-add list (gitignored templates we DO want to commit) -----------------
$filesForce = @(
    'infra/n8n/.env.example'
)

Write-Host "[1/4] Staging files..." -ForegroundColor Cyan
foreach ($f in $files) {
    $abs = Join-Path $repo $f
    if (Test-Path $abs) {
        Invoke-GitRetry -Label ("add " + $f) -Action { & git -C $repo add -- $f }
    }
    else {
        Write-Host ("  skip (missing): " + $f) -ForegroundColor DarkGray
    }
}
foreach ($f in $filesForce) {
    $abs = Join-Path $repo $f
    if (Test-Path $abs) {
        Invoke-GitRetry -Label ("add -f " + $f) -Action { & git -C $repo add -f -- $f }
    }
    else {
        Write-Host ("  skip (missing): " + $f) -ForegroundColor DarkGray
    }
}

$staged = & git -C $repo diff --cached --name-only
if (-not $staged) {
    Write-Host ""
    Write-Host "Nothing to commit - all files appear already committed." -ForegroundColor Green
    & git -C $repo log --oneline -3
    exit 0
}

Write-Host ""
Write-Host "[2/4] Staged changes:" -ForegroundColor Cyan
& git -C $repo diff --cached --stat
Write-Host ""

# Commit message via -F file (PS quoting irrelevant) -------------------------
Write-Host "[3/4] Writing commit message..." -ForegroundColor Cyan
$msgPath = Join-Path $env:TEMP ('n8n-phase-1c-msg-' + [Guid]::NewGuid().ToString('N') + '.txt')

$msg = @'
feat(n8n): Phase 1c - Pushover dual-path (Path A Direct API + Path B email-to-push)

Decision 2026-05-26 (after Darrell shared his Pushover Settings screenshot):
pomail.net address ikzf7xijr4@pomail.net is NOT a signup email - it is
Pushover INPUT endpoint. Pushover label: "Pushover E-Mail Address - E-mails
to this address will create Pushover notifications." Any SMTP source that
sends to it creates a push to Darrell's PoeTech device. This unlocks Path B
for Day-1 notifications without the app token (which has not been created
yet).

Dual-path architecture (every Pushover-emitting workflow):

  Format notification (Code) -> If: PUSHOVER_APP_TOKEN set?
                                ├─ true  -> Path A · Pushover Direct API
                                └─ false -> Path B · Email Send -> pomail.net

Both branches converge to the same Respond / Continue node. Switching
between paths is a one-env-var edit and a docker compose up -d. Zero
workflow JSON edits to flip the switch.

Path A (richer): user_key + app_token POST to api.pushover.net. Supports
priorities, sounds, attachments, custom URLs, target-device routing. Active
when PUSHOVER_APP_TOKEN is non-empty.

Path B (always available): SMTP send to PUSHOVER_EMAIL_GATEWAY. Subject
becomes the push title, body becomes the message. Less rich but works the
moment any SMTP credential lands on the Email Send node - Gmail app
password takes 2 minutes, Resend lands when Darrell completes signup.

Values staged in infra/n8n/.pushover-creds.local (gitignored):
- PUSHOVER_USER_KEY=upan72gdukpvmo49uet2jfyjgrrf3v (confirmed from
  Pushover Settings screenshot - label "Pushover User Key - Supply this
  to any Pushover-enabled software")
- PUSHOVER_EMAIL_GATEWAY=ikzf7xijr4@pomail.net (Pushover INPUT endpoint)
- PUSHOVER_DEVICE_NAME=PoeTech (Darrell's configured target device)
- PUSHOVER_APP_TOKEN=TODO (create at https://pushover.net/apps/build)

Rotate-after-install warning is in INSTALL.md Step 6 since both values
passed through chat logs during handoff.

Workflows updated (all 5 now dual-path tagged):
- 01-supabase-cycle-item-webhook.json - dual-path on Darrell branch only;
  family branch still uses ntfy (no change)
- 02-daily-reports-cron.json - dual-path inline before terminal node
- 03-github-event-to-phone.json - dual-path inline before Respond
- 04-poe-morning-standup.json - dual-path inline before terminal node
- 05-end-of-day-reflection.json - dual-path runs in parallel with the
  cycle_items insert (both fan out from Compose reflection prompt)

Workflows README updated: dual-path table, env var documentation, license
countdown note, numbering-collision flag (parallel session shipped four
workflows in the same folder with overlapping 01-04 numeric prefixes -
01-project-timeline-daily, 02-workflow-failure-alert, 03-b2-backup-status,
04-pushover-smoke-test - both sets coexist for now, Darrell to decide
whether to renumber when he reviews).

INSTALL.md updates:
- Locked Decisions section aligned with quad-model architecture (62 GB
  RAM confirmed on Darrell's unit, OLLAMA_MAX_LOADED_MODELS=4, 24 GB cap,
  four models: Qwen 3B + DeepSeek 8B + Qwen 14B + nomic-embed-text)
- Step 6 reworked for dual-path with Path A and Path B subsections,
  rotate-after-install warning, license countdown 2026-06-25
- Inputs needed section adds Resend / Gmail app password as Path B SMTP
  options (any one unblocks Path B)
- RAM verification line updated from 32 GB to 62 GB expected

Seed file (docs/00-foundations/SEED-PROJECTS-2026-05-25.md):
- Pushover license priority bumped 9.4 -> 9.7 with countdown-bound
  annotation (deadline 2026-06-25); workflow 04 will surface it daily
- Synology RAM upgrade change_request marked RESOLVED (62 GB confirmed,
  disposition deferred-next-cycle, note "already populated past 32 GB
  target - verified 2026-05-26")
- Darrell notifications row updated with real user key + email gateway
  (Phase 4 task: flip notification_channels.status from paused to active
  after end-to-end verification)

POE binding upheld in every updated workflow: dispositions stay
pending/approved/deferred-next-cycle, never rejected. Notification copy is
invitations not commands (ready for your prayer, your call not the
system math).

Next: Darrell answers Phase 2 inputs (Tailscale IP, DSM URL, optional app
token, SMTP source choice for Path B), then Phase 3 drives the Synology
deploy via Chrome MCP.
'@

Set-Content -Path $msgPath -Value $msg -Encoding ASCII
Write-Host ("  wrote: " + $msgPath) -ForegroundColor DarkGray

Write-Host ""
Write-Host "[4/4] Committing + pushing..." -ForegroundColor Cyan
Invoke-GitRetry -Label 'commit' -Action {
    & git -C $repo commit -F $msgPath
}
Invoke-GitRetry -Label 'push' -Action {
    & git -C $repo push origin $branch
}

Remove-Item $msgPath -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host ("Phase 1c committed and pushed to " + $branch + ".") -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
& git -C $repo log --oneline -3
