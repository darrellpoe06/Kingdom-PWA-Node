# Device availability — obstacles to a pipeline node going dark

Darrell 2026-08-14: *"we need to come up with obstacles to turning off anything
or device we use for this pipeline including creating master accounts on each
cpu and using administrative procedures etc..."*

The pipeline's weakest link is not compute. It is **a box that is simply off.**
On the day this was written the tailnet showed `livestream-main-pc` and
`tlcrackstation` dark, and nothing anywhere measured that or recorded when it
started. This runbook is the set of obstacles, in the order they actually pay.

---

## The line we do not cross (read this before anything below)

**An obstacle to turning a device OFF must never become an obstacle to
PREEMPTING it.** Those are different things and confusing them would break a
service:

- *Turning the box off* — the whole node leaves the pipeline. This is what we
  harden against.
- *Preempting the GPU* — a person needs the card for Premiere, Cinema 4D, OBS,
  or a live service, and the reasoner yields instantly. **DR-0012 §3 gives that
  person absolute priority, and nothing here may slow it down.**

This is why `OLLAMA_KEEP_ALIVE=0` (landed 2026-08-14, `gpu-preemption-guard`)
is the **precondition** for hardening, not a side note. Before that fix a 14B
model squatted on 12 GB for 5–15 minutes after its last call. That is exactly
the frustration that makes an operator kill the container — or the box. **Harden
a machine that steals the GPU and you have not prevented shutdowns, you have
armed the reason for them.** Fix the contention first; then make the box durable.

**The corollary, stated plainly: `livestream-main-pc` is declared
`required: false` / `expected_always_on: false` in `pipeline-nodes.json`.** An
operator powering down the box that feeds the wall is CORRECT BEHAVIOUR, never
an incident. It is hardened for unattended *recovery*, never against a human.

---

## What PowerShell can and cannot reach

Verified, not assumed:

| Node | Shell | Basis |
| --- | --- | --- |
| `tlcmediadpt` (100.69.19.13) | **PowerShell** over SSH as `creed` | build PASS 2026-07-08 |
| `livestream-main-pc` (100.72.5.90) | **PowerShell** over SSH as `itdepartment` | build PASS 2026-07-08 |
| `poetech` NAS (100.70.190.47) | **`sh` only — no PowerShell** | DSM/Linux; `python3 3.8.15`, systemctl. nas-health run 31817289739 |
| `tlc-tech-team` (100.92.143.124) | **UNVERIFIED** | OS never confirmed |
| `tlcrackstation` (100.66.173.22) | **UNVERIFIED** | OS never confirmed, dark 2026-08-14 |
| `kingdom-home` (100.74.53.117) | **UNVERIFIED** | not a declared pipeline node |

Two dialects, not one. And **step 0 is identifying the three unknowns** — a
device nobody can name is a device nobody can harden.

---

## Layer 1 — A master service account on each tower

**The problem it solves.** Today the towers are reached as `creed` and
`itdepartment` — *people's* accounts. When a volunteer leaves, a password is
reset, or IT disables a leaver's login, the pipeline's access dies with it, and
nothing announces that. A service tied to a person is a service with an expiry
date nobody wrote down.

**The obstacle.** A dedicated local administrator account on each tower —
`poetech-svc` — that belongs to the pipeline, never to a person, is never used
for daily work, and whose password Darrell holds.

Plain instructions: create the account, put it in Administrators, set the
password to never expire, and hide it from the sign-in screen so it does not
confuse anyone at the church.

```powershell
cd C:\Windows\System32
$svcPass = Read-Host -AsSecureString "New poetech-svc password (Darrell holds this)"
New-LocalUser -Name "poetech-svc" -Password $svcPass -FullName "PoeTech Service Account" -Description "Pipeline service account. Not a person. Do not use for daily work." -PasswordNeverExpires
Add-LocalGroupMember -Group "Administrators" -Member "poetech-svc"
New-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon\SpecialAccounts\UserList" -Name "poetech-svc" -Value 0 -PropertyType DWord -Force
Get-LocalUser -Name "poetech-svc"
```

If the `UserList` key does not exist yet, create it first, then re-run the block
above:

```powershell
cd C:\Windows\System32
New-Item -Path "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon\SpecialAccounts" -Force
New-Item -Path "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon\SpecialAccounts\UserList" -Force
```

**Constraint, stated plainly:** a hidden admin account on a church-building
machine is a real security tradeoff. It is defensible because the tailnet is the
access boundary and the box is physically inside the building; it would NOT be
defensible on a public-facing machine.

---

## Layer 2 — Run as a SERVICE, not as somebody's session

**The problem it solves, and it is probably the actual cause of the dark boxes.**
Docker Desktop on Windows runs **inside a user's login session**. When the
staffer logs out — or Windows signs them out on idle — every container stops.
Nobody "turned the machine off"; the session simply ended. `restart: always` in
a compose file cannot save a daemon that is no longer running.

**The obstacle.** Anything the pipeline needs runs as a Windows service set to
Automatic, surviving logout, with recovery actions so a crash restarts itself.

Tailscale already installs as a system service. Confirm it, force Automatic
start, and set it to restart itself on failure:

```powershell
cd C:\Windows\System32
Set-Service -Name "Tailscale" -StartupType Automatic
sc.exe failure "Tailscale" reset= 86400 actions= restart/5000/restart/10000/restart/30000
sc.exe qc "Tailscale"
sc.exe qfailure "Tailscale"
```

Same for the OpenSSH server, which is how anything reaches the box at all:

```powershell
cd C:\Windows\System32
Set-Service -Name "sshd" -StartupType Automatic
sc.exe failure "sshd" reset= 86400 actions= restart/5000/restart/10000/restart/30000
Start-Service -Name "sshd"
Get-Service -Name "sshd" | Format-List Name,Status,StartType
```

**For Docker specifically:** Docker Desktop is the wrong tool for an unattended
node precisely because of the session coupling. The durable answer on a tower
that must serve headless is to run the containers under a service-managed
engine, or to launch the stack from a boot-time scheduled task running as
`poetech-svc` with "run whether user is logged on or not" (Layer 4). Do not
rely on "someone left it logged in."

---

## Layer 3 — The box must not put itself to sleep

**The problem it solves.** A node that sleeps is indistinguishable from a node
someone switched off, and it is far more common. Nobody decided to end the
service; a power plan did.

```powershell
cd C:\Windows\System32
powercfg /change standby-timeout-ac 0
powercfg /change hibernate-timeout-ac 0
powercfg /change monitor-timeout-ac 15
powercfg /change disk-timeout-ac 0
powercfg /hibernate off
powercfg /query SCHEME_CURRENT SUB_SLEEP
```

Turn off Fast Startup — it makes a "shutdown" a hybrid hibernate, which leaves
services in a state that does not cleanly resume:

```powershell
cd C:\Windows\System32
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Power" -Name "HiberbootEnabled" -Value 0
Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Power" -Name "HiberbootEnabled"
```

Stop the network card from being powered down (this one silently kills the
tailnet while the box stays on — the failure that looks most like a mystery):

```powershell
cd C:\Windows\System32
Get-NetAdapter -Physical | ForEach-Object { Disable-NetAdapterPowerManagement -Name $_.Name -ErrorAction SilentlyContinue }
Get-NetAdapter -Physical | Format-Table Name,Status,LinkSpeed
```

---

## Layer 4 — Come back by itself after a reboot

**The problem it solves.** Windows Update reboots. Power blips. Neither should
need a human to walk to the church.

Enable Wake-on-LAN at the adapter (BIOS must also allow it — that half is
his-hand, on-site):

```powershell
cd C:\Windows\System32
Get-NetAdapter -Physical | ForEach-Object { Enable-NetAdapterPowerManagement -Name $_.Name -WakeOnMagicPacket -ErrorAction SilentlyContinue }
Get-NetAdapterPowerManagement -Name (Get-NetAdapter -Physical | Select-Object -First 1 -ExpandProperty Name)
```

Give Windows Update an active-hours window so it never reboots during a service:

```powershell
cd C:\Windows\System32
New-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings" -Name "ActiveHoursStart" -Value 7 -PropertyType DWord -Force
New-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings" -Name "ActiveHoursEnd" -Value 22 -PropertyType DWord -Force
Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings" | Select-Object ActiveHoursStart,ActiveHoursEnd
```

---

## Layer 5 — Administrative procedure, not just configuration

Technical locks are the weakest layer, and it is worth being honest about why:
**a staffer who cannot stop a service will unplug the machine.** A lockout that
makes someone feel fought produces the exact outcome we are preventing. So the
procedure is mostly social, and deliberately so.

1. **Label the physical box.** A printed card on each tower: what it runs, who
   owns it, what breaks if it is powered off, and Darrell's number. Most
   shutdowns are somebody being helpful with a machine they could not identify.
2. **Name a steward per device** in the church device register
   (`app/src/lib/church-devices.js` already carries a `steward` field). A device
   with no name attached is everybody's to turn off.
3. **Write down the one legitimate reason to power a tower down** — the live
   service needs it (DR-0012) — and make clear that this reason never needs
   permission. Legitimising the real case is what keeps the illegitimate ones
   rare.
4. **Announce before hardening.** Doing this quietly to a machine other people
   use creates an adversary. Doing it announced, with the card on the box,
   creates a colleague.

The one technical restriction worth applying — deny service-stop to
non-administrators, so an ordinary account cannot casually stop Tailscale — is
recorded here **deliberately unapplied**:

> `sc.exe sdset` on the Tailscale/sshd services can remove STOP rights from
> non-admins. It is NOT in this runbook as a paste-ready block, because on a
> shared church machine the failure mode (a media volunteer locked out mid-service,
> reaching for the power button instead) is worse than the thing it prevents, and
> a malformed SDDL string can make a service unmanageable until safe mode.
> **re-review: 2026-10-15** — revisit once the steward labels are on the boxes
> and we have measured how often a node actually goes dark. Measure first.

---

## Layer 6 — Measure it, or none of the above is verifiable

Every layer here is a claim until something watches. `pipeline-nodes.json` is
the declared fleet; the availability witness probes it from **outside** the
failure domain (a GitHub runner joining the tailnet — the same proven path
`nas-health.yml` uses), so a node going dark is recorded with a timestamp
instead of noticed by accident weeks later.

Unknown reachability never reads as reachable (DR-0076). A node declared
`expected_always_on: false` going dark is reported as normal, not as an
incident — that is what keeps the witness worth listening to.

---

## Order of operations

1. **Identify the three unknown boxes** (`tlc-tech-team`, `tlcrackstation`,
   `kingdom-home`). Nothing can be hardened that nobody can name.
2. **Apply Layers 1–4 to `tlcmediadpt` first.** It is the designated AI worker,
   it is online now, and no live service depends on its screen — so a mistake
   there costs nothing on a Sunday.
3. **Print and attach the steward cards** (Layer 5) before touching
   `livestream-main-pc`.
4. **Apply Layers 1–4 to `livestream-main-pc` only when it is up and no service
   is near** — and never the service-stop restriction.
5. **Let the witness run for a fortnight and read the actual numbers** before
   adding any further restriction.
