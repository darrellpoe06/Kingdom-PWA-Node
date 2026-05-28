# Vacation Buddy Laptop — 24/7 Tailscale node + Synology backup target

> **Purpose:** Darrell's current laptop is staying home during the
> 2026-05-31 → 2026-06-07 vacation as a 24/7 Tailscale presence (so the
> tailnet stays addressable from any other Tailscale device) and a backup
> target for the DS1621xs (so the home cluster has off-NAS recovery if
> something goes sideways while he's gone).
>
> **Hostname:** `kingdom-home` (set in Tailscale; matches DNS naming
> elsewhere in the stack).
>
> **Time to set up:** ~25 minutes end-to-end if you have admin on the
> laptop and SSH keys in place.

## What it is and isn't

It IS:
- A Windows laptop, lid closed, plugged in, on the home network 24/7.
- A Tailscale node named `kingdom-home` that other Tailscale devices can
  reach for forwarding, file pulls, and as a fallback `tailscale ping` target.
- A backup target — the Synology rsyncs `/volume1/backups` to a folder on
  the laptop nightly so there's an off-NAS copy of the operational data.
- Optionally: a warm-spare n8n host via Docker Desktop or WSL, ready to
  spin up if the DS1621xs goes down while Darrell is away.

It is NOT:
- A primary failover. The Synology stays primary. If it dies, Darrell or
  Christina can manually start the warm spare; the spare doesn't auto-fail-over.
- A trusted secret store. No `.env` files with API tokens land here unless
  they were already in the Synology backup payload they replicate.
- A user laptop during vacation. Once configured, it lives on a side
  table and waits.

## Pre-flight checklist (before leaving)

A live checklist Darrell can run at a glance before walking out the door.
Every box is something this setup script puts in place.

```
  [ ] Laptop is plugged in, AC light is on
  [ ] Lid is closed; the laptop did NOT sleep (test: ping from phone over Tailscale)
  [ ] Tailscale tray icon is green; "kingdom-home" is the device name
  [ ] Synology can reach kingdom-home over Tailscale
       ssh dpoe@192.168.1.26 'tailscale ping kingdom-home'
  [ ] Last night's rsync run completed (check the laptop's rsync log)
  [ ] (Optional warm spare) Docker Desktop is running with the kingdom-pwa
       backup compose stack down but ready
```

## Section 1 — Power settings (3 minutes)

The single most-common failure mode for "always-on laptop" is the OS
silently sleeping it. Windows ships sane-looking power profiles that still
sleep on lid-close. We change three settings.

### 1.1 — Open the power tuning panel

`Win+R` → `powercfg.cpl` → enter. (Or Settings → System → Power & battery →
"Additional power settings".)

### 1.2 — Set the active plan to High performance

Click "Show additional plans" if the High-performance row isn't visible.
Select it. Then click "Change plan settings" next to High performance.

### 1.3 — Set: never sleep / never hibernate / never turn off display when plugged in

In the "Change plan settings" panel, set these for "Plugged in":
- Turn off the display: **Never**
- Put the computer to sleep: **Never**
- Hibernate after: **Never** (you may need "Change advanced power settings"
  → Sleep → Hibernate after → Plugged in → Never)
- USB selective suspend: **Disabled** (advanced settings → USB settings)

### 1.4 — Set lid-close = do nothing

In the left sidebar of the Power Options window, click "Choose what
closing the lid does". Set:
- When I close the lid → Plugged in → **Do nothing**
- (On battery you can leave it as-is; this machine won't be on battery.)

The setup PowerShell script (`infra/vacation/setup-buddy-laptop.ps1`)
applies all four of these settings programmatically via `powercfg`, so you
don't have to click them manually unless you prefer the UI confirmation.

## Section 2 — Tailscale (5 minutes)

Tailscale is the mesh. The laptop joins under Darrell's existing identity,
so the same SSH and `tailscale ping` flows that work for the Synology work
here.

### 2.1 — Install Tailscale

Download from https://tailscale.com/download/windows. Install with the
defaults. Reboot is NOT required; the service starts immediately.

### 2.2 — Sign in with the existing identity

Right-click the Tailscale tray icon → Sign in. Browser opens; pick the
same Google/Microsoft account Darrell already uses for the rest of the
tailnet (so the new device joins the existing org, not a new one).

### 2.3 — Rename the device to kingdom-home

In the Tailscale admin console (https://login.tailscale.com/admin/machines)
find the new machine (it'll come in with whatever Windows host name is set)
and rename it to `kingdom-home`. This makes downstream commands stable.

Alternatively, from the laptop PowerShell:

```powershell
tailscale set --hostname kingdom-home
```

### 2.4 — Confirm reachability from the Synology

```
ssh dpoe@192.168.1.26 'tailscale status | grep kingdom-home'
```

You should see one line with `kingdom-home` and a `100.x.y.z` Tailscale IP.

## Section 3 — rsync nightly backup target (10 minutes)

The Synology runs a nightly cron that rsyncs `/volume1/backups` to the
laptop's `D:\synology-backups` folder (or wherever you choose). The laptop
side is an SSH server with Darrell's public key authorized.

### 3.1 — Install OpenSSH Server on the laptop (Windows feature)

`Settings → System → Optional features → Add an optional feature →
OpenSSH Server → Install`.

Then start it:

```powershell
Start-Service sshd
Set-Service -Name sshd -StartupType Automatic
New-NetFirewallRule -Name sshd -DisplayName 'OpenSSH Server (sshd)' -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22
```

The setup script automates this block.

### 3.2 — Authorize the Synology's public key

On the Synology:

```
ssh dpoe@192.168.1.26
cat ~/.ssh/id_ed25519.pub      # or id_rsa.pub
```

Copy that line. On the laptop, create or append to
`C:\Users\dpoe\.ssh\authorized_keys` with the Synology's public key.

Test from the Synology:

```
ssh -o StrictHostKeyChecking=accept-new dpoe@kingdom-home 'whoami'
```

Should print `dpoe`. If it prompts for a password, the key isn't picked up —
check the file permissions on the laptop side (Windows OpenSSH is strict;
the `authorized_keys` file must NOT be world-readable).

### 3.3 — Pick the backup folder

```powershell
New-Item -ItemType Directory -Force -Path D:\synology-backups
```

(The setup script defaults to `D:\synology-backups`; pass `-BackupRoot`
to override.)

### 3.4 — Schedule the rsync on the Synology

SSH to the Synology and add this to root's crontab (Synology cron is at
`/etc/crontab`, or use the DSM Task Scheduler GUI):

```cron
# Synology cron — nightly off-NAS rsync to kingdom-home, 02:00 local
0 2 * * * /usr/bin/rsync -avz --delete /volume1/backups/ dpoe@kingdom-home:/d/synology-backups/ >> /var/log/rsync-kingdom-home.log 2>&1
```

DSM-GUI path (cleaner — survives DSM updates better than `/etc/crontab`
edits):

`DSM → Control Panel → Task Scheduler → Create → Scheduled Task → User-defined script`.

- General → User: `root`
- Schedule → Daily at 02:00
- Task Settings → Run command:

```
/usr/bin/rsync -avz --delete /volume1/backups/ dpoe@kingdom-home:/d/synology-backups/ >> /var/log/rsync-kingdom-home.log 2>&1
```

### 3.5 — Test the rsync end-to-end before leaving

```
ssh dpoe@192.168.1.26 \
  '/usr/bin/rsync -avz --delete /volume1/backups/ dpoe@kingdom-home:/d/synology-backups/'
```

Watch the file count tick. After the first full sync, subsequent nightly
runs will only transfer deltas.

## Section 4 — Optional warm spare (Docker Desktop or WSL2)

If a future Dispatch session promotes this from "backup target" to
"can run n8n if the Synology dies," the warm-spare prep is small.

### 4.1 — Install Docker Desktop OR WSL2 with Docker engine

**Docker Desktop path:** download from https://docs.docker.com/desktop/install/windows/.
Easier; UI surface. Costs nothing for personal use under their license.

**WSL2 path:** `wsl --install` in elevated PowerShell, reboot, install
Ubuntu, then `sudo apt install docker.io docker-compose`. Lighter on the
laptop's resources; no GUI.

### 4.2 — Stage a copy of the n8n compose stack

Clone the repo to the laptop (`C:\Users\dpoe\Kingdom-PWA-Node` matches the
existing path) and `cd infra/n8n`. Run:

```
docker compose pull           # pre-fetch the images so a cold start is fast
```

Do NOT `docker compose up -d` on the laptop while the Synology is also
running n8n — you'll have two n8n instances trying to claim the same webhook
URLs and inserting duplicate cycle_items. The warm spare exists for failover
only.

### 4.3 — Document the failover trigger

If, while Darrell is away, the Synology becomes unreachable for > 30
minutes (Christina pings `tailscale ping kingdom-ds1621xs` and gets no
response), the laptop spare is started:

```powershell
cd C:\Users\dpoe\Kingdom-PWA-Node\infra\n8n
docker compose up -d
```

Christina (or Dispatch over Tailscale) then re-points the Supabase webhook
URL from `192.168.1.26:5678` to `kingdom-home.<tailnet>.ts.net:5678` and
n8n continues. When the Synology comes back, the laptop spare is `docker
compose down`'d and the webhook URL is pointed back.

This is the manual fail-over path; an automated one is a future workflow
not in scope for this batch.

## Section 5 — What the setup script does

`infra/vacation/setup-buddy-laptop.ps1` automates Sections 1, 2 (install
prompt only — the sign-in still needs Darrell's eyes), and 3 (OpenSSH +
firewall + folder + authorized_keys append). It does NOT touch Section 4
(warm spare) — that's an explicit decision left to the moment.

Run from an elevated PowerShell on the laptop:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\infra\vacation\setup-buddy-laptop.ps1
```

The script is idempotent (re-running is safe) and prints a summary at the
end with every step's status.

## Cross-references

- `docs/00-foundations/SOVEREIGNTY-FIRST-INSTALL-PATTERN.md` — the
  "what works when the user walks away" principle that motivated this
- `docs/00-foundations/PROJECT-TIMELINE.md` — vacation_start: 2026-05-31,
  vacation_end: 2026-06-07
- `infra/vacation/setup-buddy-laptop.ps1` — the automation
- `infra/n8n/INSTALL.md` — the n8n stack on the Synology this laptop backs up
- `infra/n8n/docker-compose.yml` — the compose stack the warm spare would
  start if needed

## Revision history

- 2026-05-26 — Pre-staged 2026-05-26 (Dispatch overnight) so Darrell can
  run the script once before leaving and not think about it again.
