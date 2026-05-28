# =====================================================================
# setup-buddy-laptop.ps1
# Vacation buddy laptop bootstrap. Run from an elevated PowerShell on the
# laptop that will stay home (kingdom-home).
#
# What it does:
#   1. Sets power settings: never sleep, never hibernate, lid-close = do nothing
#   2. Prompts to install Tailscale (manual sign-in step — Darrell's eyes)
#   3. Renames the Tailscale device to `kingdom-home` (if Tailscale is signed in)
#   4. Installs OpenSSH Server feature, starts the service, opens the firewall
#   5. Creates the backup folder at $BackupRoot (default D:\synology-backups)
#   6. Appends the Synology's public key to authorized_keys
#      (caller provides the key as the -SynologyPublicKey parameter,
#       or the script prompts interactively)
#   7. Prints a summary checklist matching VACATION-BUDDY-LAPTOP-SETUP.md
#
# Run from repo root in elevated PowerShell:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   .\infra\vacation\setup-buddy-laptop.ps1
# =====================================================================

[CmdletBinding()]
param(
  [string]$BackupRoot = 'D:\synology-backups',
  [string]$SynologyPublicKey,
  [string]$DesiredHostname = 'kingdom-home',
  [switch]$SkipPowerSettings,
  [switch]$SkipOpenSSH,
  [switch]$SkipBackupFolder,
  [switch]$SkipAuthorizedKey
)

$ErrorActionPreference = 'Stop'

function Write-Step($n, $text) {
  Write-Host ''
  Write-Host "=== [$n] $text ===" -ForegroundColor Cyan
}

function Write-Ok($text)   { Write-Host ("  OK    " + $text) -ForegroundColor Green }
function Write-Warn2($text) { Write-Host ("  WARN  " + $text) -ForegroundColor Yellow }
function Write-Skip($text) { Write-Host ("  SKIP  " + $text) -ForegroundColor DarkGray }

# Track results so we can print a summary at the end.
$results = [ordered]@{}

function Test-Admin {
  $id  = [Security.Principal.WindowsIdentity]::GetCurrent()
  $pri = New-Object Security.Principal.WindowsPrincipal($id)
  return $pri.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Admin)) {
  Write-Error 'This script must run in an ELEVATED PowerShell (Run as administrator).'
  exit 1
}

Write-Host ''
Write-Host '======================================================================' -ForegroundColor Cyan
Write-Host '  Vacation buddy laptop setup — kingdom-home' -ForegroundColor Cyan
Write-Host '======================================================================' -ForegroundColor Cyan
Write-Host "  backup root:      $BackupRoot"
Write-Host "  desired hostname: $DesiredHostname"
Write-Host ''

# -----------------------------------------------------------------------
# Step 1 — Power settings
# -----------------------------------------------------------------------
Write-Step 1 'Power settings (never sleep / never hibernate / lid = do nothing)'
if ($SkipPowerSettings) {
  Write-Skip '(-SkipPowerSettings passed)'
  $results['power'] = 'skipped'
} else {
  try {
    # Switch to High performance plan.
    $highPerf = (powercfg -list | Select-String -Pattern 'High performance').ToString()
    if ($highPerf) {
      $highPerfGuid = ($highPerf -split '\s+')[3]
      powercfg -setactive $highPerfGuid | Out-Null
      Write-Ok 'High performance plan activated'
    } else {
      Write-Warn2 'High performance plan not found; staying on current plan'
    }

    # Never sleep / display off / hibernate on AC.
    powercfg -change -standby-timeout-ac 0
    powercfg -change -monitor-timeout-ac 0
    powercfg -change -hibernate-timeout-ac 0
    Write-Ok 'sleep / monitor / hibernate set to NEVER on AC'

    # Lid-close action = do nothing on AC.
    # GUID for "Lid close action" = 5ca83367-6e45-459f-a27b-476b1d01c936
    # Subgroup "Power buttons and lid" = 4f971e89-eebd-4455-a8de-9e59040e7347
    powercfg -setacvalueindex SCHEME_CURRENT 4f971e89-eebd-4455-a8de-9e59040e7347 5ca83367-6e45-459f-a27b-476b1d01c936 0
    powercfg -setactive SCHEME_CURRENT
    Write-Ok 'lid-close action set to DO NOTHING on AC'

    # USB selective suspend disabled.
    # Subgroup "USB" = 2a737441-1930-4402-8d77-b2bebba308a3
    # Setting     = 48e6b7a6-50f5-4782-a5d4-53bb8f07e226
    powercfg -setacvalueindex SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba308a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0
    powercfg -setactive SCHEME_CURRENT
    Write-Ok 'USB selective suspend disabled on AC'

    $results['power'] = 'ok'
  } catch {
    Write-Warn2 ("power settings: " + $_.Exception.Message)
    $results['power'] = 'partial'
  }
}

# -----------------------------------------------------------------------
# Step 2 — Tailscale
# -----------------------------------------------------------------------
Write-Step 2 'Tailscale (install + sign-in + hostname)'
$tsExe = Get-Command tailscale.exe -ErrorAction SilentlyContinue
if (-not $tsExe) {
  Write-Warn2 'tailscale.exe not on PATH. Install from https://tailscale.com/download/windows then re-run this script.'
  Write-Warn2 'After install: right-click the tray icon -> Sign in -> use the same account as the Synology.'
  $results['tailscale'] = 'install-required'
} else {
  Write-Ok ("tailscale found: " + $tsExe.Path)
  try {
    $tsStatus = & tailscale.exe status --json 2>$null | ConvertFrom-Json
    $self = $tsStatus.Self
    if (-not $self) {
      Write-Warn2 'Tailscale is installed but not signed in. Sign in via the tray icon, then re-run.'
      $results['tailscale'] = 'signin-required'
    } else {
      Write-Ok ("signed in as: " + $self.UserID + " (DNSName: " + $self.DNSName + ")")
      if ($self.HostName -ne $DesiredHostname) {
        try {
          & tailscale.exe set --hostname $DesiredHostname
          Write-Ok ("hostname set to " + $DesiredHostname)
        } catch {
          Write-Warn2 ("could not set hostname automatically; do it in admin console: " + $_.Exception.Message)
        }
      } else {
        Write-Ok ("hostname already " + $DesiredHostname)
      }
      $results['tailscale'] = 'ok'
    }
  } catch {
    Write-Warn2 ("tailscale status failed: " + $_.Exception.Message)
    $results['tailscale'] = 'unknown'
  }
}

# -----------------------------------------------------------------------
# Step 3 — OpenSSH Server
# -----------------------------------------------------------------------
Write-Step 3 'OpenSSH Server (feature + service + firewall)'
if ($SkipOpenSSH) {
  Write-Skip '(-SkipOpenSSH passed)'
  $results['openssh'] = 'skipped'
} else {
  try {
    $cap = Get-WindowsCapability -Online -Name OpenSSH.Server* | Select-Object -First 1
    if ($cap -and $cap.State -ne 'Installed') {
      Write-Host '  installing OpenSSH.Server capability (may take 1-2 minutes)...'
      Add-WindowsCapability -Online -Name $cap.Name | Out-Null
      Write-Ok 'OpenSSH.Server capability installed'
    } else {
      Write-Ok 'OpenSSH.Server capability already installed'
    }

    if ((Get-Service sshd -ErrorAction SilentlyContinue).Status -ne 'Running') {
      Start-Service sshd
      Write-Ok 'sshd service started'
    } else {
      Write-Ok 'sshd service already running'
    }
    Set-Service -Name sshd -StartupType Automatic
    Write-Ok 'sshd startup type set to Automatic'

    if (-not (Get-NetFirewallRule -Name 'sshd' -ErrorAction SilentlyContinue)) {
      New-NetFirewallRule -Name sshd -DisplayName 'OpenSSH Server (sshd)' -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22 | Out-Null
      Write-Ok 'firewall rule for TCP/22 created'
    } else {
      Write-Ok 'firewall rule for TCP/22 already exists'
    }

    $results['openssh'] = 'ok'
  } catch {
    Write-Warn2 ("OpenSSH setup: " + $_.Exception.Message)
    $results['openssh'] = 'partial'
  }
}

# -----------------------------------------------------------------------
# Step 4 — Backup folder
# -----------------------------------------------------------------------
Write-Step 4 ("Backup folder ($BackupRoot)")
if ($SkipBackupFolder) {
  Write-Skip '(-SkipBackupFolder passed)'
  $results['backup_folder'] = 'skipped'
} else {
  try {
    if (-not (Test-Path $BackupRoot)) {
      New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null
      Write-Ok ("created " + $BackupRoot)
    } else {
      Write-Ok ($BackupRoot + " already exists")
    }
    $results['backup_folder'] = 'ok'
  } catch {
    Write-Warn2 ("backup folder: " + $_.Exception.Message)
    $results['backup_folder'] = 'failed'
  }
}

# -----------------------------------------------------------------------
# Step 5 — Authorized key for the Synology
# -----------------------------------------------------------------------
Write-Step 5 'Synology authorized_key for inbound rsync'
if ($SkipAuthorizedKey) {
  Write-Skip '(-SkipAuthorizedKey passed)'
  $results['authorized_key'] = 'skipped'
} else {
  try {
    $sshDir = Join-Path $env:USERPROFILE '.ssh'
    if (-not (Test-Path $sshDir)) { New-Item -ItemType Directory -Path $sshDir | Out-Null }
    $authFile = Join-Path $sshDir 'authorized_keys'

    if (-not $SynologyPublicKey) {
      Write-Host '  Paste the Synology public key (single line beginning with ssh-ed25519 or ssh-rsa).'
      Write-Host '  Get it on the Synology with: cat ~/.ssh/id_ed25519.pub'
      $SynologyPublicKey = Read-Host '  Public key'
    }
    $SynologyPublicKey = $SynologyPublicKey.Trim()

    if (-not $SynologyPublicKey -or -not ($SynologyPublicKey -match '^(ssh-(ed25519|rsa)|ecdsa-)')) {
      Write-Warn2 'no valid SSH public key provided; skipping authorized_keys append'
      $results['authorized_key'] = 'skipped'
    } else {
      $existing = if (Test-Path $authFile) { Get-Content $authFile } else { @() }
      if ($existing -contains $SynologyPublicKey) {
        Write-Ok 'Synology key already present in authorized_keys'
      } else {
        Add-Content -Path $authFile -Value $SynologyPublicKey
        Write-Ok 'Synology key appended to authorized_keys'
      }

      # Windows OpenSSH is strict — authorized_keys must NOT be world-readable.
      try {
        icacls $authFile /inheritance:r /grant:r "${env:USERNAME}:F" /grant:r "SYSTEM:F" /grant:r "Administrators:F" | Out-Null
        Write-Ok 'authorized_keys permissions tightened'
      } catch {
        Write-Warn2 ("icacls failed; if rsync still prompts for a password, run: icacls `"$authFile`" /inheritance:r /grant:r `"${env:USERNAME}:F`"")
      }
      $results['authorized_key'] = 'ok'
    }
  } catch {
    Write-Warn2 ("authorized_key: " + $_.Exception.Message)
    $results['authorized_key'] = 'failed'
  }
}

# -----------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------
Write-Host ''
Write-Host '======================================================================' -ForegroundColor Cyan
Write-Host '  Summary' -ForegroundColor Cyan
Write-Host '======================================================================' -ForegroundColor Cyan
foreach ($k in $results.Keys) {
  $v = $results[$k]
  $color = switch ($v) {
    'ok'              { 'Green' }
    'partial'         { 'Yellow' }
    'install-required'{ 'Yellow' }
    'signin-required' { 'Yellow' }
    'skipped'         { 'DarkGray' }
    'failed'          { 'Red' }
    default           { 'White' }
  }
  Write-Host ("  {0,-18} {1}" -f $k, $v) -ForegroundColor $color
}

Write-Host ''
Write-Host 'Pre-flight checks before leaving:' -ForegroundColor Cyan
Write-Host '  [ ] Laptop plugged in, AC light on'
Write-Host '  [ ] Lid closed; phone can still tailscale-ping kingdom-home'
Write-Host '  [ ] Tailscale tray icon is GREEN'
Write-Host '  [ ] From the Synology:  ssh dpoe@192.168.1.26 ''tailscale ping kingdom-home'''
Write-Host '  [ ] First rsync run completed (check ' + $BackupRoot + ' has files)'
Write-Host ''
Write-Host 'When you''re back, no action needed — script is idempotent.' -ForegroundColor Green
