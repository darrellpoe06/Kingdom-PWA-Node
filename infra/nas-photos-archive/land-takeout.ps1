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
# TRANSPORT IS SSH, NOT SMB (corrected 2026-08-11). The first version of this
# script copied over the SMB share and died on the NAS with "CANNOT REACH
# \\192.168.1.26\PoeTech". That was a known-broken path: deploy-to-synology.ps1
# recorded on 2026-06-12 that "SMB auth was failing (DSM auto-block after
# repeated attempts made the right password look wrong); SSH is the auth path
# that works on this NAS and is passwordless once the desktop key is in
# ~/.ssh/authorized_keys." Shipping SMB ignored the repo's own history and cost
# a round-trip. This version rides scp/ssh - the transport already proven on
# this exact NAS, and the one that needs NO interactive login.
#
# THE CHROOT TRAP (also from deploy-to-synology.ps1, verified 2026-06-12):
# scp rides Synology's SFTP service, which chroots to a SHARE-ROOTED view. The
# folder that ls shows at /volume1/PoeTech/... is addressed by scp as
# /PoeTech/... - while ssh commands use the REAL /volume1/... path. Both forms
# appear below on purpose; they are not a typo.
#
# It watches the Downloads folder, waits for each takeout-*.zip to STOP growing
# and be released by the browser (a half-downloaded zip landed on the NAS is a
# corrupt archive that verifies NO-GO hours later), routes it by reading the
# zip's own table of contents (Mail vs Photos), confirms the landed byte count
# over ssh, and skips anything already landed. Safe to re-run and safe to
# Ctrl-C: nothing is deleted from Downloads, ever.
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
    [string]$NasUser = "dpoe",
    [string]$NasHost = "192.168.1.26",
    [int]$IdleMinutes = 45,
    [switch]$Once
)

$ErrorActionPreference = "Continue"

$target = "$NasUser@$NasHost"

# Real paths (used by ssh) and chrooted paths (used by scp). See the note above.
$photosReal = "/volume1/PoeTech/photos-archive/takeout"
$mailReal = "/volume1/PoeTech/mail-archive/takeout"
$photosScp = "/PoeTech/photos-archive/takeout"
$mailScp = "/PoeTech/mail-archive/takeout"

function Write-Step($msg) {
    $stamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$stamp] $msg"
}

function Invoke-Nas($remoteCommand) {
    # -o BatchMode=yes: never sit at a password prompt. If the key is missing we
    # want a fast, clear failure, not a script hanging on a hidden prompt.
    $out = ssh -o BatchMode=yes -o ConnectTimeout=20 -o StrictHostKeyChecking=accept-new $target $remoteCommand 2>&1
    return @{ Ok = ($LASTEXITCODE -eq 0); Out = ($out | Out-String).Trim() }
}

function Test-NasReady {
    Write-Step "Checking SSH to $target ..."
    if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
        Write-Host ""
        Write-Host "NO ssh CLIENT ON THIS MACHINE" -ForegroundColor Red
        Write-Host "Install it once (admin PowerShell):"
        Write-Host "  Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0"
        return $false
    }
    $probe = Invoke-Nas "echo nas-ok"
    if (-not $probe.Ok) {
        Write-Host ""
        Write-Host "CANNOT REACH $target OVER SSH" -ForegroundColor Red
        Write-Host $probe.Out
        Write-Host ""
        Write-Host "Most likely causes, in order:"
        Write-Host "  1. The NAS is asleep. Open http://$NasHost`:5000 in a browser to wake it."
        Write-Host "  2. This laptop's SSH key is not in the NAS ~/.ssh/authorized_keys."
        Write-Host "     Check with:  ssh $target"
        Write-Host "     If that asks for a password, the key is missing - one careful"
        Write-Host "     password entry is safe, or re-install the key (deploy-to-synology.ps1"
        Write-Host "     header documents the 2026-06-12 install via ConnectBot)."
        Write-Host "  3. You are on a different network (VPN / guest wifi)."
        Write-Host ""
        Write-Host "Nothing was copied."
        return $false
    }
    $mk = Invoke-Nas "mkdir -p '$photosReal' '$mailReal'; echo made"
    if (-not $mk.Ok) {
        Write-Host "Could not create the target folders on the NAS:" -ForegroundColor Red
        Write-Host $mk.Out
        return $false
    }
    Write-Step "SSH OK. Targets ready:"
    Write-Step "  Photos -> $target`:$photosReal"
    Write-Step "  Mail   -> $target`:$mailReal"
    return $true
}

# A Takeout part is only safe to copy once its size has stopped changing AND the
# browser has released the handle.
function Test-DownloadComplete($file) {
    if ($file.Name -like "*.crdownload") { return $false }
    if ($file.Name -like "*.part") { return $false }
    $sizeA = $file.Length
    Start-Sleep -Seconds 6
    $fresh = Get-Item $file.FullName -ErrorAction SilentlyContinue
    if ($null -eq $fresh) { return $false }
    if ($fresh.Length -ne $sizeA) { return $false }
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
        if ($zipPath -match "mail") { return "mail" }
        return "photos"
    }
}

function Get-RemoteSize($realDir, $name) {
    # ssh returns the REMOTE command's exit code, so a missing file already
    # comes back as Ok=false. No shell fallback needed (and none written - the
    # repo's PowerShell rule keeps || out of these files).
    $probe = Invoke-Nas "stat -c %s '$realDir/$name'"
    if (-not $probe.Ok) { return -1 }
    $parsed = 0
    if ([int64]::TryParse($probe.Out.Trim(), [ref]$parsed)) { return $parsed }
    return -1
}

function Move-OnePart($file) {
    $kind = Get-TakeoutKind $file.FullName
    $realDir = $photosReal
    $scpDir = $photosScp
    if ($kind -eq "mail") {
        $realDir = $mailReal
        $scpDir = $mailScp
    }

    $already = Get-RemoteSize $realDir $file.Name
    if ($already -eq $file.Length) {
        Write-Step "SKIP  $($file.Name) - already landed whole ($kind)"
        return $true
    }
    if ($already -ge 0) {
        Write-Step "REDO  $($file.Name) - partial copy on the NAS ($already of $($file.Length)), recopying"
    }

    $gb = [math]::Round($file.Length / 1GB, 2)
    Write-Step "COPY  $($file.Name) -> $kind ($gb GB) over scp. This takes a while; leave it running."
    $started = Get-Date

    scp -o BatchMode=yes -o ConnectTimeout=20 -o StrictHostKeyChecking=accept-new $file.FullName "$target`:$scpDir/"
    if ($LASTEXITCODE -ne 0) {
        Write-Step "FAIL  $($file.Name) - scp exit $LASTEXITCODE"
        return $false
    }

    $landed = Get-RemoteSize $realDir $file.Name
    if ($landed -lt 0) {
        Write-Step "FAIL  $($file.Name) - not found on the NAS after copy"
        return $false
    }
    if ($landed -ne $file.Length) {
        Write-Step "FAIL  $($file.Name) - landed $landed of $($file.Length) bytes"
        return $false
    }
    $mins = [math]::Round(((Get-Date) - $started).TotalMinutes, 1)
    Write-Step "OK    $($file.Name) landed whole in $mins min"
    return $true
}

# ----------------------------------------------------------------------------- main

Write-Host ""
Write-Host "Takeout landing - Downloads -> NAS over SSH (DR-0291)" -ForegroundColor Cyan
Write-Host "Downloads: $DownloadsPath"
Write-Host "NAS:       $target (scp/ssh - no Windows login, no SMB)"
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
Write-Host "NEXT - archive and run the gate. From THIS laptop, one line:"
Write-Host ""
Write-Host "  ssh $target ""bash /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-photos-archive/run-archive.sh"""
Write-Host ""
Write-Host "(or the same command inside ConnectBot on the phone.)"
Write-Host "Nothing gets deleted from Google until it prints GO."
Write-Host ""
if ($failed -gt 0) { exit 1 }
exit 0
