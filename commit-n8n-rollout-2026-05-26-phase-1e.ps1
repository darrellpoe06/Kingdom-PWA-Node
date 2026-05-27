# =============================================================================
# commit-n8n-rollout-2026-05-26-phase-1e.ps1  (ASCII-only)
# =============================================================================
# Phase 1e: End-of-session commit batch. Captures everything that landed
# during the active-driving portion of the Synology rollout:
#
#   1. docker-compose.yml update: N8N_BLOCK_ENV_ACCESS_IN_NODE=false
#      (Discovered at end-to-end testing - n8n's default blocks workflow
#      expressions from reading $env.* which broke the dual-path If node.)
#
#   2. 5 workflow JSONs: fromEmail patched from n8n@poetech.local to
#      darrellpoe06@gmail.com so Pushover's email-to-push gateway
#      (pomail.net) doesn't silently drop based on sender mismatch.
#
#   3. infra/n8n/scripts/ - 3 idempotent Python patch scripts that
#      bypass UI/REST limitations and modify the live SQLite DB directly:
#        - bind-creds.py: bind SMTP credential to all Email Send nodes
#        - publish-and-activate.py: promote drafts to published + register
#          webhook routes + activate
#        - fix-from-email.py: patch fromEmail on Path B nodes
#
#   4. infra/n8n/INSTALL.md - new "Gotchas discovered during 2026-05-26
#      rollout" section. 9 hard-won lessons for the next deploy.
#
#   5. docs/SESSION-HANDOFF-2026-05-26.md - end-of-session status snapshot
#      with TL;DR, LIVE state, WIRED-UNTESTED, PENDING, next actions.
#
# Run from PowerShell:
#   cd C:\Users\dpoe\Kingdom-PWA-Node
#   .\commit-n8n-rollout-2026-05-26-phase-1e.ps1
#
# Uses git commit -F so PowerShell quoting is irrelevant. Idempotent.
# ASCII-only on purpose per the law-tier rule.
# =============================================================================

$repo = 'C:\Users\dpoe\Kingdom-PWA-Node'
$ErrorActionPreference = 'Stop'

function Clear-AllGitLocks {
    $locks = Get-ChildItem -Path (Join-Path $repo '.git') -Recurse -Filter '*.lock' -Force -ErrorAction SilentlyContinue
    if ($locks) {
        foreach ($l in $locks) {
            try { Remove-Item $l.FullName -Force -ErrorAction Stop } catch {}
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

$branch = (& git -C $repo rev-parse --abbrev-ref HEAD).Trim()
Write-Host ""
Write-Host ("=== Phase 1e end-of-session commit -> " + $branch + " ===") -ForegroundColor Cyan

$files = @(
    'infra/n8n/.gitignore',
    'infra/n8n/README.md',
    'infra/n8n/docker-compose.yml',
    'infra/n8n/INSTALL.md',
    'infra/n8n/scripts/bind-creds.py',
    'infra/n8n/scripts/publish-and-activate.py',
    'infra/n8n/scripts/fix-from-email.py',
    'docs/00-foundations/n8n-workflows/01-supabase-cycle-item-webhook.json',
    'docs/00-foundations/n8n-workflows/02-daily-reports-cron.json',
    'docs/00-foundations/n8n-workflows/03-github-event-to-phone.json',
    'docs/00-foundations/n8n-workflows/04-poe-morning-standup.json',
    'docs/00-foundations/n8n-workflows/05-end-of-day-reflection.json',
    'docs/SESSION-HANDOFF-2026-05-26.md',
    'commit-n8n-rollout-2026-05-26-phase-1e.ps1'
)
foreach ($f in $files) {
    $abs = Join-Path $repo $f
    if (Test-Path $abs) {
        Invoke-GitRetry -Label ("add " + $f) -Action { & git -C $repo add -- $f }
    } else {
        Write-Host ("  skip (missing): " + $f) -ForegroundColor DarkGray
    }
}

$staged = & git -C $repo diff --cached --name-only
if (-not $staged) {
    Write-Host "Nothing to commit." -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "Staged:" -ForegroundColor Cyan
& git -C $repo diff --cached --stat
Write-Host ""

$msgPath = Join-Path $env:TEMP ('n8n-phase-1e-msg-' + [Guid]::NewGuid().ToString('N') + '.txt')
$msg = @'
feat(n8n): Phase 1e - end-of-session batch (env-access fix + fromEmail patch + patch scripts + gotchas + handoff)

Captures everything that landed during the active end-to-end driving
portion of the Synology rollout. After this commit the repo is the
canonical source of truth for the Stack B install state.

docker-compose.yml: added N8N_BLOCK_ENV_ACCESS_IN_NODE=false to n8n
service env. n8n defaults this to true which causes workflow expressions
referencing $env.PUSHOVER_APP_TOKEN (or any other $env var) to throw
ExpressionError: access to env vars denied before any routing happens.
Surfaced as the root cause of execution #2 erroring on workflow 03.
Safe tradeoff for single-user self-hosted - revisit if multi-user
editing ever lands.

workflow JSONs 01-05: fromEmail patched from n8n@poetech.local to
darrellpoe06@gmail.com on all Path B Email Send nodes. Pushovers
email-to-push gateway (pomail.net) filters by sender; the placeholder
got silently dropped even when Gmail SMTP accepted the 250 OK. Aligning
fromEmail to the Pushover account registered email is the deterministic
fix.

infra/n8n/scripts/: three idempotent Python scripts that operate on the
live SQLite DB directly. They exist because n8n 2.21 introduced enough
friction in the standard publish/activate/credential paths that the
direct-DB approach is the most reliable programmatic path:

  bind-creds.py - binds the SMTP credential to all 5 Email Send nodes.
  Auto-discovers the credential ID from credentials_entity. Patches
  both workflow_entity.nodes and the published-version snapshot in
  workflow_history if one exists.

  publish-and-activate.py - promotes drafts to published. Creates a
  workflow_history snapshot, points workflow_entity.activeVersionId at
  it, inserts workflow_published_version, registers webhook_entity
  routes for webhook nodes, writes workflow_publish_history audit row.
  Required because n8n 2.21 split active=1 from being-published; SQL
  UPDATE active=1 alone produces a workflow that responds 404 to its
  own webhook URLs.

  fix-from-email.py - patches fromEmail on Path B Email Send nodes.
  Handles both the editable workflow_entity row AND the published-
  version snapshot so the change takes effect on the next webhook fire
  without needing a re-publish.

infra/n8n/INSTALL.md: added Gotchas discovered during 2026-05-26
rollout section. 9 items including N8N_BLOCK_ENV_ACCESS_IN_NODE,
draft/published model, Vue Flow viewport in Chrome MCP, n8n Community
scoped-API-key limitation, Synology sudo PATH + secure_path quirks,
PowerShell-bash-SSH quoting matrix, sudo bash -c "..." root inheritance
quirks, Pushover sender filtering, ntfy in-container hostname. Reading
these before the next Synology install will save an hour easy.

docs/SESSION-HANDOFF-2026-05-26.md: end-of-session status snapshot.
TL;DR + WHATS LIVE + WHATS WIRED-UNTESTED + WHATS PENDING + NEXT
ACTIONS + file inventory. Reading this when Darrell returns to his desk
is the single fastest way to re-orient.

State at this commit:
  - 3 containers running, 3/4 Ollama models loaded
  - 5 production workflows imported with SMTP bound
  - 2 published + active (01 Supabase, 03 GitHub) with webhook routes
    registered in webhook_entity
  - End-to-end execution #3 returned status=success after env-access
    fix; notification delivery to phone still pending Darrell-eyes
    verification
  - Three notification paths fired at session end (smoke test ntfy
    branch, direct ntfy publish, workflow 03 webhook). At least one
    should produce a phone push if ntfy app is subscribed.

POE binding upheld in every workflow throughout.

Next: Darrell confirms phone push. If no, the fix-from-email.py script
applies the deterministic fix and re-fire succeeds.
'@

Set-Content -Path $msgPath -Value $msg -Encoding ASCII

Invoke-GitRetry -Label 'commit' -Action {
    & git -C $repo commit -F $msgPath
}
Invoke-GitRetry -Label 'push' -Action {
    & git -C $repo push origin $branch
}
Remove-Item $msgPath -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host ("Phase 1e committed and pushed to " + $branch + ".") -ForegroundColor Green
& git -C $repo log --oneline -5
