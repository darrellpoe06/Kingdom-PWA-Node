# =============================================================================
# colg-network-scan.ps1 - Love Corner (COLG) network topology scan
# =============================================================================
# Runs ON a machine that is ON the church LAN (either CUDA tower, or the booth
# laptop). The cloud Claude session has NO route to this network, so this script
# is the eye: it reads the real network and writes the result into the repo, where
# the topology map and the security assessment read it.
#
# ASCII only. Windows PowerShell 5.1 safe: no ternaries, no PS7 operators,
# no -Parallel, no && or ||.
#
# WHAT IT READS (and why each one matters):
#   1. Local identity           - which box this scan was run from.
#   2. Live host sweep, both /24 - who is actually up right now.
#   3. ARP table with MAC + OUI - THE prize. A MAC's vendor prefix identifies the
#                                 gear the last scan had to leave UNSURE: the
#                                 Netgear units, the possible UniFi APs, the
#                                 cameras, the printers, the Yamaha console.
#   4. TCP service probe        - what each host is actually serving, which is how
#                                 an access point, a switch and a camera are told
#                                 apart without touching them.
#   5. HTTP banners             - admin interfaces answering unauthenticated.
#   6. Gateway + route table    - the pfSense interface on each segment.
#
# IT ONLY READS. No configuration is changed, no credential is tried, nothing is
# written to any device on the network.
# =============================================================================

$ErrorActionPreference = "Continue"
$stamp = Get-Date -Format "yyyy-MM-dd-HHmm"
$outDir = Join-Path $PSScriptRoot "..\docs\99-session-notes\scans"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }
$outFile = Join-Path $outDir ("colg-network-scan-" + $stamp + ".json")

Write-Host "COLG network scan starting. Read-only. Output:" $outFile

# --- 1. Local identity -------------------------------------------------------
Write-Host "[1/6] Local identity..."
$local = @{
  hostname = $env:COMPUTERNAME
  user     = $env:USERNAME
  scannedAt = (Get-Date).ToString("o")
  adapters = @()
}
$adapters = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -ne "127.0.0.1" }
foreach ($a in $adapters) {
  $local.adapters += @{
    ip          = $a.IPAddress
    prefix      = $a.PrefixLength
    interface   = $a.InterfaceAlias
    origin      = $a.PrefixOrigin.ToString()
  }
}

# --- 2. Live host sweep on both church subnets -------------------------------
Write-Host "[2/6] Sweeping 192.168.0.0/24 and 192.168.1.0/24..."
$targets = @()
foreach ($net in @("192.168.0", "192.168.1")) {
  foreach ($h in 1..254) { $targets += ($net + "." + $h) }
}
$tasks = @()
foreach ($ip in $targets) {
  $p = New-Object System.Net.NetworkInformation.Ping
  $tasks += [PSCustomObject]@{ Ip = $ip; Task = $p.SendPingAsync($ip, 1000) }
}
Start-Sleep -Milliseconds 2500
$live = @()
foreach ($t in $tasks) {
  if ($t.Task.IsCompleted -eq $true) {
    if ($t.Task.Result -ne $null) {
      if ($t.Task.Result.Status -eq "Success") { $live += $t.Ip }
    }
  }
}
Write-Host ("      live hosts answering ICMP: " + $live.Count)

# --- 3. ARP table: MAC addresses and vendor prefixes -------------------------
# This is what identifies the gear the previous scan had to leave UNSURE.
Write-Host "[3/6] Reading ARP table for MAC addresses..."
$arp = @()
$arpRaw = arp -a
foreach ($line in $arpRaw) {
  $m = [regex]::Match($line, "(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s+([0-9a-fA-F\-]{17})\s+(\w+)")
  if ($m.Success -eq $true) {
    $mac = $m.Groups[2].Value.ToUpper()
    $arp += @{
      ip   = $m.Groups[1].Value
      mac  = $mac
      oui  = $mac.Substring(0,8)
      type = $m.Groups[3].Value
    }
  }
}
Write-Host ("      ARP entries with MAC: " + $arp.Count)

# --- 4. TCP service probe on live hosts --------------------------------------
Write-Host "[4/6] Probing services on live hosts..."
$ports = @(22,23,53,80,81,443,554,1723,3389,5000,5001,8000,8080,8443,9000,11434,32400)
$services = @()
foreach ($ip in $live) {
  $open = @()
  foreach ($port in $ports) {
    $client = New-Object System.Net.Sockets.TcpClient
    $conn = $client.BeginConnect($ip, $port, $null, $null)
    $ok = $conn.AsyncWaitHandle.WaitOne(350, $false)
    if ($ok -eq $true) {
      try { $client.EndConnect($conn); $open += $port } catch { }
    }
    $client.Close()
  }
  if ($open.Count -gt 0) {
    $services += @{ ip = $ip; openPorts = $open }
    Write-Host ("      " + $ip + " -> " + ($open -join ", "))
  }
}

# --- 5. HTTP banners on anything serving a web admin -------------------------
Write-Host "[5/6] Reading HTTP banners (identifies admin interfaces)..."
$banners = @()
foreach ($s in $services) {
  foreach ($port in $s.openPorts) {
    if ($port -eq 80 -or $port -eq 8080 -or $port -eq 81 -or $port -eq 8000) {
      $url = "http://" + $s.ip + ":" + $port + "/"
      try {
        $resp = Invoke-WebRequest -Uri $url -TimeoutSec 4 -UseBasicParsing -ErrorAction Stop
        $title = ""
        $tm = [regex]::Match($resp.Content, "<title>(.*?)</title>", "IgnoreCase")
        if ($tm.Success -eq $true) { $title = $tm.Groups[1].Value.Trim() }
        $banners += @{
          ip     = $s.ip
          port   = $port
          status = $resp.StatusCode
          server = $resp.Headers["Server"]
          title  = $title
        }
      } catch {
        $banners += @{ ip = $s.ip; port = $port; status = "error"; server = ""; title = $_.Exception.Message }
      }
    }
  }
}

# --- 6. Gateway and routing ---------------------------------------------------
Write-Host "[6/6] Reading gateway and route table..."
$routes = @()
$rt = Get-NetRoute -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.NextHop -ne "0.0.0.0" }
foreach ($r in $rt) {
  $routes += @{ destination = $r.DestinationPrefix; nextHop = $r.NextHop; interface = $r.InterfaceAlias; metric = $r.RouteMetric }
}

# --- Write the result ---------------------------------------------------------
$result = @{
  scan = @{
    version   = "1"
    stamp     = $stamp
    scannedAt = (Get-Date).ToString("o")
    method    = "ICMP sweep + ARP/MAC + TCP probe + HTTP banner + route table. Read-only."
    subnets   = @("192.168.0.0/24", "192.168.1.0/24")
  }
  local    = $local
  liveHosts = $live
  arp      = $arp
  services = $services
  banners  = $banners
  routes   = $routes
}
$result | ConvertTo-Json -Depth 6 | Out-File -FilePath $outFile -Encoding ascii

Write-Host ""
Write-Host "SCAN COMPLETE."
Write-Host ("Live hosts:   " + $live.Count)
Write-Host ("MAC entries:  " + $arp.Count)
Write-Host ("Hosts w/ open ports: " + $services.Count)
Write-Host ("Written to:   " + $outFile)
Write-Host ""
Write-Host "Next: commit and push this file so the session can read it."
