# =============================================================
#  deploy-to-synology.ps1
#  Builds the React PWA and pushes it to the Synology DS1621xs.
#
#  Run from PowerShell in the repo root:
#     .\deploy-to-synology.ps1
#
#  Destination    : dpoe@192.168.1.26:/volume1/poetech-app/  (over SSH)
#  Live URL       : https://192-168-1-26.poetech.direct.quickconnect.to/poetech-app/
#
#  2026-06-12: copy moved from the SMB share (\\PoeTech\poetech-app) to
#  scp over SSH. SMB auth was failing (DSM auto-block after repeated
#  attempts made the right password look wrong); SSH is the auth path that
#  works on this NAS and is passwordless once the desktop key is in
#  ~/.ssh/authorized_keys (installed 2026-06-12 via ConnectBot).
# =============================================================

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSCommandPath
$appDir   = Join-Path $repoRoot 'app'
# NOTE: scp transfers ride Synology's SFTP service, which CHROOTS to a
# share-rooted view: the folder ls shows at /volume1/poetech-app is
# addressed as /poetech-app here. Verified working 2026-06-12 01:49.
$destSsh  = 'dpoe@192.168.1.26:/poetech-app/'

Write-Host ""
Write-Host "[1/2] Building React app..." -ForegroundColor Cyan
Write-Host ""

Push-Location $appDir
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "BUILD FAILED. Fix the error above, then re-run this script." -ForegroundColor Red
        exit 1
    }
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "[2/2] Pushing dist\ to $destSsh ..." -ForegroundColor Cyan
Write-Host ""

$distSrc = Join-Path $appDir 'dist'
if (-not (Test-Path $distSrc)) {
    Write-Host "ERROR: dist folder not found at $distSrc" -ForegroundColor Red
    exit 1
}

scp -r (Join-Path $distSrc '*') $destSsh
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "COPY FAILED (scp exit $LASTEXITCODE)." -ForegroundColor Red
    Write-Host "If it asked for a password, the desktop key is not in the NAS" -ForegroundColor Yellow
    Write-Host "~/.ssh/authorized_keys yet - one careful password entry is safe," -ForegroundColor Yellow
    Write-Host "or re-install the key (see docs: ssh-keygen + authorized_keys)." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Done. The PoeTech Family OS app is live at:" -ForegroundColor Green
Write-Host ""
Write-Host "  https://192-168-1-26.poetech.direct.quickconnect.to/poetech-app/" -ForegroundColor White
Write-Host ""
Write-Host "First-time install on each device:" -ForegroundColor Cyan
Write-Host "  1. Open the URL above in Chrome (laptop) or Safari/Chrome (phone)."
Write-Host "  2. Click the Install icon in Chrome's address bar"
Write-Host "     (on iPhone: Share - Add to Home Screen)."
Write-Host "  3. The icon appears as a regular app."
Write-Host ""
Write-Host "Anyone who already installed will see the new build on their next refresh." -ForegroundColor DarkGray
Write-Host ""
