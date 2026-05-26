# =============================================================================
# commit-n8n-rollout-2026-05-26-phase-1d.ps1  (ASCII-only)
# =============================================================================
# Phase 1d: docker-compose.yml gap fix - add PUSHOVER_* env var pass-through
# to the n8n service so workflows can resolve $env.PUSHOVER_USER_KEY,
# $env.PUSHOVER_APP_TOKEN, $env.PUSHOVER_EMAIL_GATEWAY, $env.PUSHOVER_DEVICE_NAME
# at runtime. Without this, all 5 workflow Path-A HTTP nodes would post
# empty token/user fields and Path-B email recipient would be blank.
#
# This was an oversight in Phase 1c - the env var names were documented and
# referenced in workflow JSONs but the n8n container didn't have them in its
# environment block. Caught at container-state check 2026-05-26.
#
# Touched files:
#   infra/n8n/docker-compose.yml
#   commit-n8n-rollout-2026-05-26-phase-1d.ps1
#
# Run from PowerShell:
#   cd C:\Users\dpoe\Kingdom-PWA-Node
#   .\commit-n8n-rollout-2026-05-26-phase-1d.ps1
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
Write-Host ("=== Phase 1d compose fix -> " + $branch + " ===") -ForegroundColor Cyan

$files = @(
    'infra/n8n/docker-compose.yml',
    'commit-n8n-rollout-2026-05-26-phase-1d.ps1'
)
foreach ($f in $files) {
    $abs = Join-Path $repo $f
    if (Test-Path $abs) {
        Invoke-GitRetry -Label ("add " + $f) -Action { & git -C $repo add -- $f }
    }
}

$staged = & git -C $repo diff --cached --name-only
if (-not $staged) {
    Write-Host "Nothing to commit." -ForegroundColor Green
    exit 0
}

& git -C $repo diff --cached --stat

$msgPath = Join-Path $env:TEMP ('n8n-phase-1d-msg-' + [Guid]::NewGuid().ToString('N') + '.txt')
$msg = @'
fix(n8n): Phase 1d - add PUSHOVER_* env var pass-through to n8n container

The Phase 1c workflows reference $env.PUSHOVER_USER_KEY,
$env.PUSHOVER_APP_TOKEN, $env.PUSHOVER_EMAIL_GATEWAY, and
$env.PUSHOVER_DEVICE_NAME in HTTP Request body parameters (Path A) and
Email Send recipient (Path B), but the n8n service block in
docker-compose.yml was only passing through the OLLAMA_* vars. Without
this fix, every workflow would post empty token/user fields to the
Pushover API and Path B would have a blank recipient.

Caught at the container-state check after Darrell ran docker compose up
2026-05-26 and verified n8n + ntfy + ollama all return HTTP 200.

Action needed on the Synology after this commit lands:
  1. SCP the updated docker-compose.yml to /volume1/docker/n8n-stack/
  2. Append PUSHOVER_USER_KEY, PUSHOVER_EMAIL_GATEWAY, PUSHOVER_DEVICE_NAME
     to /volume1/docker/n8n-stack/.env from .pushover-creds.local
  3. docker compose up -d n8n to recreate the n8n container with the
     new env vars

PUSHOVER_APP_TOKEN stays empty until Darrell pastes the token from the
PoeTechApp application he created at pushover.net. With it empty, all
notification traffic routes to Path B (email-to-push). The moment the
token is added, the If node in every workflow flips to Path A.
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
Write-Host "Phase 1d committed and pushed." -ForegroundColor Green
& git -C $repo log --oneline -3
