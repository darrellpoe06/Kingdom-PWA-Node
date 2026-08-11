# =============================================================================
# land-takeout.ps1 - hands-off landing of Google Takeout zips onto the NAS.
# DR-0291 / DR-0238. ASCII only, Windows PowerShell 5.x, self-contained.
# =============================================================================
# WHY: the Takeout order is Darrell's hand (his Google session). Everything
# AFTER it is machine work that was costing him a babysitting session: watch
# Downloads, notice a 50 GB part finished, copy it to the NAS, check it landed
# whole, repeat for every part, remember which ones are done. This script does
# all of that unattended so the pass costs him one paste and no waiting.
#
# It watches the Downloads folder, waits for each takeout-*.zip to STOP growing
# (a half-downloaded zip copied to the NAS is a corrupt archive), copies it to
# the right NAS folder by kind (Mail vs Photos), verifies the landed size
# matches byte-for-byte, and skips anything already landed. Safe to re-run and
# safe to Ctrl-C: nothing is deleted from Downloads, ever.
#
# RUN IT:
#   cd C:\Users\dpoe\Kingdom-PWA-Node
#   powershell -ExecutionPolicy Bypass -File infra\nas-photos-archive\land-takeout.ps1
#
# Then walk away. It prints a line per part and exits when the downloads stop
# arriving (default 45 min of quiet), or run with -Once to do a single sweep.
# =============================================================================

param(
    [string]$DownloadsPath = "$env:USERPROFILE\Downloads",
    [string]$NasHost = "192.168.1.26",
    [int]$IdleMinutes = 45,
    [switch]$Once
)

$ErrorActionPreference = "Stop"

$photosDir = "\\$NasHost\PoeTech\photos-archive\takeout"
$mailDir = "\\$NasHost\PoeTech\mail-archive\takeout"

function Write-Step($msg) {
    $stamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$stamp] $msg"
}

function Test-NasReady {
    Write-Step "Checking the NAS share at \\$NasHost\PoeTech ..."
    if (-not (Test-Path "\\$NasHost\PoeTech")) {
        Write-Host ""
        Write-Host "CANNOT REACH \\$NasHost\PoeTech" -ForegroundColor Red
        Write-Host "Open File Explorer, browse to \\$NasHost\PoeTech once to authenticate,"
        Write-Host "then run this script again. Nothing was copied."
        return $false
    }
    foreach ($d in @($photosDir, $mailDir)) {
        if (-not (Test-Path $d)) {
            New-Item -ItemType Directory -Path $d -Force | Out-Null
            Write-Step "Created $d"
        }
    }
    return $true
}

# A Takeout part is only safe to copy once its size has stopped changing.
function Test-DownloadComplete($file) {
    if ($file.Name -like "*.crdownload") { return $false }
    if ($file.Name -like "*.part") { return $false }
    $sizeA = $file.Length
    Start-Sleep -Seconds 6
    $fresh = Get-Item $file.FullName -ErrorAction SilentlyContinue
    if ($null -eq $fresh) { return $false }
    if ($fresh.Length -ne $sizeA) { return $false }
    # A file still held open by the browser cannot be opened for read/write.
    try {
        $stream = [System.IO.File]::Open($fresh.FullName, 'Open', 'Read', 'None')
        $stream.Close()
        $stream.Dispose()
    } catch {
        return $false
    }
    return $true
}

# Mail Takeouts carry Mail/ inside; Photos carry Google Photos/. Reading the
# zip's own table of contents beats guessing from the filename.
function Get-TakeoutKind($zipPath) {
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction SilentlyContinue
        $zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
        $kind = "photos"
        $checked = 0
        foreach ($entry in $zip.Entries) {
            $n = $entry.FullName
            if ($n -like "*Google Photos/*") { $kind = "photos"; break }
            if ($n -like "*/Mail/*") { $kind = "mail"; break }
            if ($n -like "Takeout/Mail*") { $kind = "mail"; break }
            $checked = $checked + 1
            if ($checked -gt 400) { break }
        }
        $zip.Dispose()
        return $kind
    } catch {
        # Unreadable table of contents (multi-part split): fall back to the name.
        if ($zipPath -match "mail") { return "mail" }
        return "photos"
    }
}

function Move-OnePart($file) {
    $kind = Get-TakeoutKind $file.FullName
    $dest = $photosDir
    if ($kind -eq "mail") { $dest = $mailDir }
    $target = Join-Path $dest $file.Name

    if (Test-Path $target) {
        $existing = Get-Item $target
        if ($existing.Length -eq $file.Length) {
            Write-Step "SKIP  $($file.Name) - already landed whole ($kind)"
            return $true
        }
        Write-Step "REDO  $($file.Name) - partial copy on the NAS, recopying"
    }

    $gb = [math]::Round($file.Length / 1GB, 2)
    Write-Step "COPY  $($file.Name) -> $kind ($gb GB). This takes a while; leave it running."
    $started = Get-Date
    Copy-Item -LiteralPath $file.FullName -Destination $target -Force

    $landed = Get-Item $target -ErrorAction SilentlyContinue
    if ($null -eq $landed) {
        Write-Step "FAIL  $($file.Name) - did not appear on the NAS"
        return $false
    }
    if ($landed.Length -ne $file.Length) {
        Write-Step "FAIL  $($file.Name) - landed $($landed.Length) of $($file.Length) bytes"
        return $false
    }
    $mins = [math]::Round(((Get-Date) - $started).TotalMinutes, 1)
    Write-Step "OK    $($file.Name) landed whole in $mins min"
    return $true
}

# ----------------------------------------------------------------------------- main

Write-Host ""
Write-Host "Takeout landing - Downloads -> NAS (DR-0291)" -ForegroundColor Cyan
Write-Host "Downloads: $DownloadsPath"
Write-Host "Photos ->  $photosDir"
Write-Host "Mail   ->  $mailDir"
Write-Host ""

if (-not (Test-NasReady)) { exit 1 }

$landed = @{}
$failed = 0
$lastActivity = Get-Date

while ($true) {
    $zips = @()
    if (Test-Path $DownloadsPath) {
        $zips = Get-ChildItem -Path $DownloadsPath -Filter "takeout-*.zip" -File -ErrorAction SilentlyContinue
    }

    foreach ($z in $zips) {
        if ($landed.ContainsKey($z.Name)) { continue }
        if (-not (Test-DownloadComplete $z)) {
            Write-Step "WAIT  $($z.Name) is still downloading"
            continue
        }
        $ok = Move-OnePart $z
        if ($ok) {
            $landed[$z.Name] = $true
        } else {
            $failed = $failed + 1
        }
        $lastActivity = Get-Date
    }

    if ($Once) { break }

    $quiet = ((Get-Date) - $lastActivity).TotalMinutes
    if ($quiet -ge $IdleMinutes) {
        Write-Step "No new parts for $IdleMinutes minutes. Stopping."
        break
    }
    Start-Sleep -Seconds 60
}

Write-Host ""
Write-Host "Landed $($landed.Count) part(s). Failures: $failed" -ForegroundColor Cyan
Write-Host ""
Write-Host "NEXT - in the NAS shell (ConnectBot, prompt reads dpoe@PoeTech:~$):"
Write-Host ""
Write-Host "  bash /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-photos-archive/run-archive.sh"
Write-Host ""
Write-Host "That archives whatever landed and prints the GO / NO-GO gate."
Write-Host "Nothing gets deleted from Google until it prints GO."
Write-Host ""
if ($failed -gt 0) { exit 1 }
exit 0
