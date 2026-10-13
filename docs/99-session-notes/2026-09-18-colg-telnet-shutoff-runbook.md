# COLG telnet shutoff — the first patch step

**Runbook.** Closes the three CRITICAL exposures found on the 2026-09-18 church LAN
scan. Reversible in seconds, no service impact, no maintenance window.

## What is open, and why it is first

Telnet carries the administrator password across the network **in readable text**.
Anyone with a foothold on the segment — including any of the consumer cloud devices
sharing it — can read those credentials off the wire. Three devices answer on port 23:

| Device | Address | What it holds |
|---|---|---|
| **Synology RackStation** | `192.168.0.100:23` | Church Plus, member records, monthly financial reports |
| Yamaha FOH console | `192.168.0.155:23` | Live sound configuration |
| Printer / MFP 1 | `192.168.0.200:23` | Print queue; a classic quiet foothold |

This runs first — ahead of the closet walk and well ahead of segmentation — because
it is minutes of work, reverts instantly, cannot interrupt a service, and closes the
most severe thing currently open on the network.

**Credentials are Darrell's** — the agent cannot log into these devices. The steps
below are what a person does at the admin page; the verification afterwards is what
proves it landed.

## 1. Synology RackStation (`192.168.0.100`) — do this one first

It holds the member and financial records, so it carries the most risk per minute.

1. Open `https://192.168.0.100:5001` — **the HTTPS port, deliberately.** Do not use
   `http://192.168.0.100:5000`; that is the plaintext admin port this session also
   flagged, and logging into it leaks the password the same way telnet does.
2. **Control Panel → Terminal & SNMP → Terminal**.
3. **Uncheck "Enable Telnet service".** Leave SSH as it is for now — SSH is
   encrypted and is a separate decision.
4. Apply.

While on this box, two things worth reading and reporting back:

- **Is Surveillance Station storing video on the same volume as member and financial
  data?** The scan found RTSP (`:554`) answering here. DR-0050 decided surveillance
  gets a **dedicated volume, separate from financial/member volumes**. This is the
  place to confirm that decision was actually implemented.
- **Can DSM be set to HTTPS-only?** Control Panel → Login Portal → enable
  "Automatically redirect HTTP to HTTPS". That closes the `:5000` plaintext finding
  without closing the port.

## 2. Yamaha FOH console (`192.168.0.155`)

Yamaha consoles expose telnet for legacy remote control. Some integrations genuinely
use it.

1. Ask the media team whether anything remote-controls this console. If something
   does, **do not disable it blind** — note it and bring it into the segmentation
   plan instead, where the console ends up on the production VLAN with access
   restricted to the booth.
2. If nothing uses it: disable remote control / telnet in the console's network
   setup menu, or via its web interface at `http://192.168.0.155`.

There is a second Yamaha device on the network at `192.168.0.135` that the register
does not know about. Identify it while standing there — it may resolve the long-open
"QL or TF5?" question.

## 3. Printer / MFP 1 (`192.168.0.200`)

1. Open `http://192.168.0.200` and find the network/protocol settings.
2. Disable **Telnet**. Disable **FTP** too if present, for the same reason.
3. Change the admin password if it is still the factory default — printers are
   almost never re-credentialed after install.

Printer / MFP 2 at `192.168.0.205` did **not** show telnet, but it serves plaintext
HTTP admin. Worth the same password check while the panel is open.

## Verify — the ports say so, not the operator

From a machine on the church LAN:

```
cd C:\Users\itdepartment\Kingdom-PWA-Node
powershell -ExecutionPolicy Bypass -File C:\Users\itdepartment\Kingdom-PWA-Node\scripts\verify-colg-fix.ps1 -Step telnet
```

Expect three PASS lines. A FAIL means the setting did not take, or it was changed on
a different device than intended — not that the check is wrong.

Then confirm the NAS did not lose its encrypted admin path:

```
cd C:\Users\itdepartment\Kingdom-PWA-Node
powershell -ExecutionPolicy Bypass -File C:\Users\itdepartment\Kingdom-PWA-Node\scripts\verify-colg-fix.ps1 -Step nas-plaintext
```

That one deliberately expects `:5001` to stay **open** — closing the encrypted admin
port would be a self-inflicted outage, so the check fails if it disappears.

## Rollback

Every step is one checkbox. Re-check "Enable Telnet service", or re-enable remote
control, and the previous state is back within seconds. Nothing here touches
routing, addressing, or cabling.

## What this does NOT fix

Telnet is the most severe thing open, not the only thing. Still outstanding after
this step:

- The flat segment carrying member/financial storage beside consumer cloud IoT.
- `192.168.1.120` running **Boa 0.94.13**, a web server end-of-life since 2005.
- 23 devices live on the network that the register has never heard of.
- RTSP answering unauthenticated-by-default on five cameras.

Those are steps 2 through 6 of the plan in Church → Infra Plan → Network posture.

## Related

- `docs/99-session-notes/2026-09-18-love-corner-network-topology-and-exposure.md`
- `docs/99-session-notes/scans/colg-network-scan-2026-09-18-1301.json` — the reading
- `app/src/lib/church-network-remediation.js` — the ordered plan this is step 1 of
- DR-0050 (volume isolation) · DR-0003 (ISO-2) · DR-0076 (no claim without evidence)
