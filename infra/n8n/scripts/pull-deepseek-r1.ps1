# =====================================================================
# pull-deepseek-r1.ps1
# PowerShell wrapper that SSHes into the Synology and pipes the bash
# script `pull-deepseek-r1.sh` into a remote bash. Result is echoed back
# to the local console. Designed to be a one-click pull for Darrell.
#
# Usage (from repo root):
#   .\infra\n8n\scripts\pull-deepseek-r1.ps1
# Optional parameters:
#   .\infra\n8n\scripts\pull-deepseek-r1.ps1 -SynologyHost dpoe@192.168.1.26
#   .\infra\n8n\scripts\pull-deepseek-r1.ps1 -PullTimeoutSec 3600
# =====================================================================

[CmdletBinding()]
param(
  [string]$SynologyHost = 'dpoe@192.168.1.26',
  [int]$PullTimeoutSec  = 1800,
  [string]$OllamaContainer = 'ollama'
)

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BashScript = Join-Path $ScriptDir 'pull-deepseek-r1.sh'

if (-not (Test-Path $BashScript)) {
  Write-Error "Bash script not found at $BashScript"
  exit 1
}

Write-Host '=== DeepSeek R1 Distill 8B pull (remote) ===' -ForegroundColor Cyan
Write-Host "host:      $SynologyHost"
Write-Host "container: $OllamaContainer"
Write-Host "timeout:   ${PullTimeoutSec}s"
Write-Host "bash src:  $BashScript"
Write-Host ''

# Pipe the bash script into a remote `bash -s` so we don't need to copy
# the file to the Synology. Env vars are forwarded via the command prefix.
$EnvPrefix = "export PULL_TIMEOUT_SEC=$PullTimeoutSec; export OLLAMA_CONTAINER=$OllamaContainer;"

# `Get-Content -Raw` keeps the script as a single string; pipe through ssh.
$ScriptContent = Get-Content -Raw -Path $BashScript

$RemoteCommand = "$EnvPrefix bash -s"

Write-Host "--- streaming remote output ---" -ForegroundColor DarkGray

# Use a temp file for the input so we can stream stderr+stdout cleanly.
$tempIn = New-TemporaryFile
try {
  Set-Content -Path $tempIn.FullName -Value $ScriptContent -NoNewline
  Get-Content -Raw $tempIn.FullName | & ssh -o StrictHostKeyChecking=accept-new $SynologyHost $RemoteCommand
  $ExitCode = $LASTEXITCODE
} finally {
  Remove-Item $tempIn.FullName -ErrorAction SilentlyContinue
}

Write-Host "--- remote exit code: $ExitCode ---" -ForegroundColor DarkGray
Write-Host ''

if ($ExitCode -eq 0) {
  Write-Host 'DeepSeek R1 Distill 8B is loaded on the Synology Ollama.' -ForegroundColor Green
  Write-Host 'n8n workflows can now call $env.OLLAMA_SECONDARY_MODEL for chain-of-thought.'
  exit 0
} else {
  Write-Host "Remote pull failed with exit code $ExitCode." -ForegroundColor Yellow
  Write-Host 'Common causes:'
  Write-Host '  - SSH key not set up. Try: ssh dpoe@192.168.1.26 echo ok'
  Write-Host '  - Ollama container not running. Try: ssh dpoe@192.168.1.26 docker ps'
  Write-Host '  - Disk space on /volume1. Try: ssh dpoe@192.168.1.26 df -h /volume1'
  Write-Host '  - Timeout. Re-run with -PullTimeoutSec 3600'
  exit $ExitCode
}
