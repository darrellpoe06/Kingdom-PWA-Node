# =============================================================
#  deploy-to-synology.ps1
#  Builds the React PWA and pushes it to the Synology DS1621xs.
#
#  Run from PowerShell in the repo root:
#     .\deploy-to-synology.ps1
#
#  Synology share : \\PoeTech\poetech-app
#  Live URL       : https://192-168-1-26.poetech.direct.quickconnect.to/poetech-app/
# =============================================================

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSCommandPath
$appDir   = Join-Path $repoRoot 'app'
$destSmb  = '\\PoeTech\poetech-app\'

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
Write-Host "[2/2] Pushing dist\ to $destSmb ..." -ForegroundColor Cyan
Write-Host ""

$distSrc = Join-Path $appDir 'dist'
if (-not (Test-Path $distSrc)) {
    Write-Host "ERROR: dist folder not found at $distSrc" -ForegroundColor Red
    exit 1
}

try {
    Copy-Item -Path (Join-Path $distSrc '*') -Destination $destSmb -Recurse -Force
}
catch {
    Write-Host ""
    Write-Host "COPY FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Try opening $destSmb in File Explorer first to confirm credentials." -ForegroundColor Yellow
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
