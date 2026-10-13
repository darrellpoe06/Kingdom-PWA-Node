# =============================================================================
# verify-colg-fix.ps1 - prove a network fix actually landed
# =============================================================================
# Re-probes ONLY the specific ports a remediation step was supposed to close, and
# says PASS or FAIL per device. Read-only; tries no credentials.
#
# Why this exists: "I disabled telnet" is a claim. A closed port is evidence.
# DR-0076 - no claim without evidence, and a fix is not done until something
# independent says so.
#
# Usage (from a machine on the church LAN):
#   powershell -ExecutionPolicy Bypass -File scripts\verify-colg-fix.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\verify-colg-fix.ps1 -Step telnet
#
# ASCII only. Windows PowerShell 5.1 safe.
# =============================================================================

param(
  [string]$Step = "telnet"
)

$ErrorActionPreference = "Continue"

# What each step is supposed to have CLOSED. Expect = 'closed' means the check
# passes only when the port refuses a connection.
$checks = @{
  "telnet" = @(
    @{ ip = "192.168.0.100"; port = 23; device = "Synology RackStation (member + financial records)"; expect = "closed" },
    @{ ip = "192.168.0.155"; port = 23; device = "Yamaha FOH console";                                expect = "closed" },
    @{ ip = "192.168.0.200"; port = 23; device = "Printer / MFP 1";                                   expect = "closed" }
  )
  "nas-plaintext" = @(
    @{ ip = "192.168.0.100"; port = 5000; device = "Synology DSM over HTTP (plaintext admin)"; expect = "closed" },
    @{ ip = "192.168.0.100"; port = 5001; device = "Synology DSM over HTTPS (must STAY open)";  expect = "open"   }
  )
  "bridge" = @(
    @{ ip = "192.168.0.44";  port = 8080; device = "livestream-main-pc Wi-Fi interface (should be disabled)"; expect = "closed" },
    @{ ip = "192.168.1.73";  port = 8080; device = "livestream-main-pc wired interface (must STAY up)";       expect = "open"   }
  )
}

if (-not $checks.ContainsKey($Step)) {
  Write-Host "Unknown step '$Step'. Known steps: telnet, nas-plaintext, bridge"
  exit 1
}

function Test-Port($ip, $port) {
  $client = New-Object System.Net.Sockets.TcpClient
  $conn = $client.BeginConnect($ip, $port, $null, $null)
  $ok = $conn.AsyncWaitHandle.WaitOne(1200, $false)
  $open = $false
  if ($ok -eq $true) {
    try { $client.EndConnect($conn); $open = $true } catch { $open = $false }
  }
  $client.Close()
  return $open
}

Write-Host ""
Write-Host "VERIFYING step: $Step"
Write-Host ("-" * 70)

$pass = 0
$fail = 0
foreach ($c in $checks[$Step]) {
  $isOpen = Test-Port $c.ip $c.port
  $state = "closed"
  if ($isOpen -eq $true) { $state = "open" }

  if ($state -eq $c.expect) {
    Write-Host ("  PASS  " + $c.ip + ":" + $c.port + "  " + $state.ToUpper().PadRight(6) + "  " + $c.device)
    $pass = $pass + 1
  } else {
    Write-Host ("  FAIL  " + $c.ip + ":" + $c.port + "  " + $state.ToUpper().PadRight(6) + "  " + $c.device)
    Write-Host ("        expected " + $c.expect.ToUpper())
    $fail = $fail + 1
  }
}

Write-Host ("-" * 70)
Write-Host ("$pass passed, $fail failed.")
if ($fail -gt 0) {
  Write-Host "NOT DONE. A port that did not change state means the setting did not take,"
  Write-Host "or it was changed on a different device than intended."
  exit 1
}
Write-Host "Step verified. The ports say so, not the operator."
exit 0
