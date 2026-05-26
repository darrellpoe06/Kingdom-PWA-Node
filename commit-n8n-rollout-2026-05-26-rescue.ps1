# =============================================================================
# commit-n8n-rollout-2026-05-26-rescue.ps1  (ASCII-only)
# =============================================================================
# Rescue + single-commit version of:
#   commit-n8n-rollout-2026-05-26.ps1            (Phase 1)
#   commit-n8n-rollout-2026-05-26-followup.ps1   (Phase 1b dual-model)
#
# Why this exists: Windows PowerShell 5.x mis-passes commit messages with
# embedded double-quotes through `git commit -m '...'` even when single-quoted
# at the PS layer - the resulting argv reaches git as multiple tokens and git
# treats the trailing words as pathspecs. Two earlier scripts hit this.
#
# This script writes the commit message to a temp file and uses `git commit -F`
# which bypasses PS argument parsing entirely. ASCII only, no embedded quotes
# in the script body.
#
# Idempotent. Safe to run even if some files from earlier attempts already
# committed:
#   - git add is a no-op on unchanged files
#   - If nothing is staged after the add batch, the script reports "nothing
#     to commit" and exits 0 (success, not error)
#   - If something is staged, it commits + pushes
#
# Run from PowerShell:
#   cd C:\Users\dpoe\Kingdom-PWA-Node
#   .\commit-n8n-rollout-2026-05-26-rescue.ps1
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
    param([string]$Label, [scriptblock]$Action, [switch]$AllowFailure)
    Clear-AllGitLocks
    & $Action
    if ($LASTEXITCODE -ne 0) {
        Clear-AllGitLocks; Start-Sleep -Milliseconds 400
        & $Action
        if ($LASTEXITCODE -ne 0) {
            if ($AllowFailure) { return }
            throw "$Label failed"
        }
    }
}

# Resolve current branch -----------------------------------------------------
$branch = (& git -C $repo rev-parse --abbrev-ref HEAD).Trim()
if (-not $branch -or $branch -eq 'HEAD') {
    throw "Cannot resolve current branch. Check: git -C $repo status"
}
Write-Host ""
Write-Host ("=== n8n rollout rescue commit -> branch: " + $branch + " ===") -ForegroundColor Cyan
Write-Host ""

# List of every file the two earlier scripts intended to commit ---------------
$files = @(
    '.gitignore',
    'docs/00-foundations/n8n-workflows/01-supabase-cycle-item-webhook.json',
    'docs/00-foundations/n8n-workflows/02-daily-reports-cron.json',
    'docs/00-foundations/n8n-workflows/03-github-event-to-phone.json',
    'docs/00-foundations/n8n-workflows/04-poe-morning-standup.json',
    'docs/00-foundations/n8n-workflows/05-end-of-day-reflection.json',
    'docs/00-foundations/n8n-workflows/README.md',
    'infra/n8n/docker-compose.yml',
    'infra/n8n/INSTALL.md',
    'infra/n8n/backup/restic-cron.sh',
    'commit-n8n-rollout-2026-05-26.ps1',
    'commit-n8n-rollout-2026-05-26-followup.ps1',
    'commit-n8n-rollout-2026-05-26-rescue.ps1'
)
# Force-add list: files that match gitignore patterns but are templates we
# DO want to commit. The root .gitignore exception added 2026-05-26 covers
# .env.example, but use -f as belt-and-suspenders against future gitignore
# regressions.
$filesForce = @(
    'infra/n8n/.env.example'
)

# Stage each. Skip missing files quietly so the script is forward-safe -------
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

# Check if anything is actually staged ---------------------------------------
$staged = & git -C $repo diff --cached --name-only
if (-not $staged) {
    Write-Host ""
    Write-Host "Nothing to commit - all files appear already committed." -ForegroundColor Green
    Write-Host "Last 3 commits on this branch:" -ForegroundColor Cyan
    & git -C $repo log --oneline -3
    Write-Host ""
    Write-Host "If you expected new commits, check: git -C $repo log --all --oneline -10" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "[2/4] Staged changes:" -ForegroundColor Cyan
& git -C $repo diff --cached --stat
Write-Host ""

# Write commit message to a temp file ----------------------------------------
# Multi-paragraph message (blank lines between -m equivalents). No quoting
# tricks needed - git -F reads the file verbatim as the commit body.
Write-Host "[3/4] Writing commit message..." -ForegroundColor Cyan
$msgPath = Join-Path $env:TEMP ('n8n-rollout-rescue-msg-' + [Guid]::NewGuid().ToString('N') + '.txt')

$msg = @'
feat(n8n): Stack B Phase 1 + dual-model Ollama follow-up

Per docs/00-foundations/PARALLEL-FRAMEWORKS-EVAL.md Stack B (ratified
2026-05-25). Phase 1 lands every artifact the install needs before any
DSM step; the follow-up adds a secondary Ollama model alongside the
primary for reasoning-focused workloads. Both decisions green-lit by
Darrell 2026-05-26.

Workflows (docs/00-foundations/n8n-workflows/):
- 01-supabase-cycle-item-webhook.json - Supabase INSERT routes to
  Pushover (Darrell) or ntfy family-ops topic per assignment
- 02-daily-reports-cron.json - 6 AM CDT, queries report_runs + cycle_item
  disposition counts, Pushover digest
- 03-github-event-to-phone.json - GitHub push/PR/ping webhook to Pushover
- 04-poe-morning-standup.json - 7 AM CDT, top 5 high-priority
  change_requests where user_priority_override IS NULL, single
  non-spammy digest
- 05-end-of-day-reflection.json - 9 PM CDT, Pushover prompt + queues a
  cycle_items row for next morning report
- README.md - workflow index with full table + cron summary +
  dual-model architecture + DeepSeek think-tag handling note

Runbook (infra/n8n/INSTALL.md):
13-step operator-driven, paste-ready runbook. Locked decisions baked in
(Tailscale-only, isolated SQLite, dual-model Ollama, Pushover+ntfy dual
channel). Step 5 pulls both models in parallel SSH terminals
(max-forward-motion principle) with when-to-use-which guidance in POE
invitation-not-command tone.

Backup (infra/n8n/backup/restic-cron.sh):
Daily Restic snapshot to /volume1/backups/restic-n8n with retention
14d/8w/12m, integrity check on 1 percent subset, monthly USB rotate
documented in header. Self-installs restic, auto-generates repo
password on first run. Zero dollars per month perpetual.

Dual-model Ollama (decision 2026-05-26):
- PRIMARY qwen2.5:3b-instruct-q4_K_M, ~2 GB resident, 10-15 tok/sec CPU
  for fast/general (summary, classification, latency-sensitive routing)
- SECONDARY deepseek-r1:8b-llama-distill-q4_K_M, ~5 GB resident, 3-5
  tok/sec CPU for reasoning (chain-of-thought analysis of
  change_requests, trade-off weighing in projects, multi-step reasoning
  over Scripture-grounded prompts)
- Container changes: OLLAMA_MAX_LOADED_MODELS 1 to 2 so both stay
  resident with no cold-load penalty; memory cap 8g to 12g to fit both
  models plus Ollama runtime with a 3 GB cushion (Supabase Postgres is
  cloud-hosted so the previously-reserved 4 GB Postgres budget freed up);
  n8n service now pass-through OLLAMA_BASE_URL +
  OLLAMA_PRIMARY_MODEL + OLLAMA_SECONDARY_MODEL so workflows read
  model selection from env vars instead of hardcoding the tag
- Workflows current state: none of 01-05 call Ollama yet (they are
  notification/cron/webhook plumbing). The dual-model scaffolding is in
  place so the next LLM-calling workflow uses the env vars via the
  documented pattern in n8n-workflows/README.md
- DeepSeek-R1 emits visible chain-of-thought between think tags;
  workflows surfacing output to users must strip the think block first
  (one-liner Code node pattern documented in README.md)

POE binding upheld in every workflow: dispositions stay
pending/approved/deferred-next-cycle and never rejected; priority_score
is the system math, user_priority_override is the last word;
notification copy is invitations not commands (ready for your prayer,
your call not the system math). All 5 workflows tagged poe-binding in
n8n.

Memory budget at full load (DS1621xs, 32 GB target): Ollama 12 GB cap +
n8n 1-2 GB + ntfy 0.5 GB + DSM ~4 GB = ~18-20 GB. Fits with headroom.
Tight on 16 GB - INSTALL.md flags this risk.

Next: Phase 2 - Darrell answers deploy-time inputs (DSM URL, installed
RAM, Pushover token, Tailscale auth). Phase 3 - drive Synology DSM via
Chrome MCP to deploy the stack.
'@

Set-Content -Path $msgPath -Value $msg -Encoding ASCII
Write-Host ("  wrote: " + $msgPath) -ForegroundColor DarkGray

# Commit using -F so PS quoting is irrelevant --------------------------------
Write-Host ""
Write-Host "[4/4] Committing + pushing..." -ForegroundColor Cyan
Invoke-GitRetry -Label 'commit' -Action {
    & git -C $repo commit -F $msgPath
}
Invoke-GitRetry -Label 'push' -Action {
    & git -C $repo push origin $branch
}

Remove-Item $msgPath -Force -ErrorAction SilentlyContinue

# Show the new SHA -----------------------------------------------------------
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host ("Rollout committed and pushed to " + $branch + ".") -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
& git -C $repo log --oneline -3
