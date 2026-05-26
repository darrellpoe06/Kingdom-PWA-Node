# =============================================================================
# commit-n8n-rollout-2026-05-26.ps1  (ASCII-only)
# =============================================================================
# Commits Phase 1 of the Synology n8n Stack B install:
#   - 5 n8n workflow JSONs (docs/00-foundations/n8n-workflows/)
#   - infra/n8n/INSTALL.md (operator-driven runbook with locked decisions)
#   - infra/n8n/backup/restic-cron.sh (daily backup, $0/mo perpetual)
#   - docs/00-foundations/n8n-workflows/README.md (updated index)
#
# Then pushes to the current branch (whatever HEAD says).
#
# Run from PowerShell:
#   cd C:\Users\dpoe\Kingdom-PWA-Node
#   .\commit-n8n-rollout-2026-05-26.ps1
#
# ASCII-only on purpose (Windows PowerShell 5.x mis-decodes UTF-8 punctuation).
# See memory/feedback_powershell-ascii-only.md.
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
    throw "Cannot resolve current branch. Check 'git -C $repo status'."
}
Write-Host ""
Write-Host ("=== Committing n8n rollout Phase 1 to branch: " + $branch + " ===") -ForegroundColor Cyan
Write-Host ""

# Stage every file in the rollout --------------------------------------------
Invoke-GitRetry -Label 'add' -Action {
    & git -C $repo add `
        docs/00-foundations/n8n-workflows/01-supabase-cycle-item-webhook.json `
        docs/00-foundations/n8n-workflows/02-daily-reports-cron.json `
        docs/00-foundations/n8n-workflows/03-github-event-to-phone.json `
        docs/00-foundations/n8n-workflows/04-poe-morning-standup.json `
        docs/00-foundations/n8n-workflows/05-end-of-day-reflection.json `
        docs/00-foundations/n8n-workflows/README.md `
        infra/n8n/INSTALL.md `
        infra/n8n/backup/restic-cron.sh `
        commit-n8n-rollout-2026-05-26.ps1
}

# Show what's staged so the user can sanity-check ----------------------------
Write-Host "Staged changes:" -ForegroundColor Cyan
& git -C $repo diff --cached --stat
Write-Host ""

# Commit ---------------------------------------------------------------------
Invoke-GitRetry -Label 'commit' -Action {
    & git -C $repo commit `
        -m 'feat(n8n): Stack B Phase 1 - 5 workflows + INSTALL.md + Restic backup' `
        -m 'Per docs/00-foundations/PARALLEL-FRAMEWORKS-EVAL.md Stack B (ratified 2026-05-25). Phase 1 lands all artifacts the install needs before any DSM step.' `
        -m 'Workflows (docs/00-foundations/n8n-workflows/): 01 Supabase cycle_item webhook (POE-bound notification routing - Pushover for Darrell, ntfy family-ops for everyone else); 02 Daily reports cron 6 AM CDT (query report_runs last 24h + disposition counts); 03 GitHub events webhook to Pushover (push, pull_request, ping); 04 POE morning standup 7 AM CDT (top 5 high-priority change_requests where user_priority_override IS NULL, single non-spammy digest); 05 End-of-day reflection 9 PM CDT (Pushover prompt + queues cycle_items row for next morning report).' `
        -m 'Runbook (infra/n8n/INSTALL.md): operator-driven, paste-ready. Locked decisions baked in (Tailscale-only, isolated SQLite, qwen2.5:3b-instruct-q4_K_M, Pushover+ntfy dual channel). 13 numbered steps from DSM prep through end-to-end test through Restic install through updating the seeded Synology n8n rollout project to shipped.' `
        -m 'Backup (infra/n8n/backup/restic-cron.sh): daily Restic snapshot to /volume1/backups/restic-n8n with retention 14d/8w/12m, integrity check on 1% subset, monthly USB rotate documented in header. Self-installs restic, auto-generates repo password on first run, $0/mo perpetual.' `
        -m 'POE binding upheld in every workflow: dispositions stay pending/approved/deferred-next-cycle (never rejected); priority_score is the system math, user_priority_override is the last word; notification copy is invitations not commands ("ready for your prayer", "your call not the system''s"). All 5 workflows tagged poe-binding in n8n.' `
        -m 'Next: Phase 2 - Darrell answers deploy-time inputs (DSM URL, installed RAM, Pushover token, Tailscale auth). Phase 3 - Claude drives Synology DSM via Chrome MCP to deploy the stack.'
}

# Push -----------------------------------------------------------------------
Invoke-GitRetry -Label 'push' -Action {
    & git -C $repo push origin $branch
}

# Show the new SHA -----------------------------------------------------------
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host ("Phase 1 committed and pushed to " + $branch + ".") -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
& git -C $repo log --oneline -3
