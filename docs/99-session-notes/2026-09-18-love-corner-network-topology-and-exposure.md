# 2026-09-18 — The Love Corner network: topology derived, exposure assessed

**Layer 4 working note.** What changed, why, and what is still open. Records the
session where the COLG (Church of the Living God / Love Corner) network stopped
being a list of devices and became a map with a measured security posture.

## The ask

"Network Topology The Church of the Living God aka Love Corner", then, mid-session,
"find any potential security breaches" and a correction on placement:

> Church infrastructure plan / Facilities & Infra - IT / facilities / Network,
> devices, and the media/AI node plan. Inside the Love Corner project section ?!!!!!!!!

## Reality-trace, run first (DR-0061 / P15)

1. **Real data** — `SEED_DEVICES` (`app/src/lib/church-devices.js`) merged with live
   `church_devices` rows. Addresses were read off the real 2026-07-08 LAN scan.
2. **Real screen** — Church > Devices, and Church > Infra Plan (both staff-gated).
3. **The gap** — the register groups by device TYPE. It answered *what we own* and
   never *how it is connected*. `church-devices.js:415` said so in its own words:
   "switch make/model + **topology** to document."
4. **Stated assumption** — `192.168.0.0/24` and `192.168.1.0/24` are scan-RECORDED
   masks. Anything else groups by /24 marked `maskAssumed`. And the standing limit:
   this is a **layer-3 address map, not a layer-1 wiring map**.

## What was built

| File | What it is |
|---|---|
| `app/src/lib/church-network-topology.js` | Derives segments, routing spine, overlay plane, bridges, and map integrity findings from recorded addresses. Pure. |
| `app/src/lib/church-network-security.js` | Measures that topology against DR-0003 and DR-0050; produces ranked exposure findings + remediation order. Pure. |
| `app/src/lib/oui-vendors.js` | Curated MAC OUI table. Names the MAKER only. |
| `app/src/lib/church-scan-ingest.js` | Reconciles a real scan against the register. Pure. |
| `app/src/components/ChurchNetworkPosture.jsx` | The plan-level view, in Church > Infra Plan. |
| `app/src/components/NetworkTopology.jsx` | The per-device view, Church > Devices > Topology. |
| `scripts/colg-network-scan.ps1` | Read-only LAN scan, run from a machine on the church network. |
| `scripts/read-colg-scan.mjs` | Reads a scan back and prints the reconciliation. |

## Two defects the work caught in itself

Both were found by running the derivation against the REAL register before trusting
it — the characterize-before-you-change step (DR-0076 §5), not a code review.

1. **Prose harvesting.** Reading IPv4 out of any `specs` string meant
   `dev-network-core` — a documentation row whose `subnets` / `tailnet` /
   `unconfirmedGear` keys quote NINE other devices — landed on both segments, became
   the gateway, and produced **nine phantom address collisions**. A documentation
   note is not a network interface. Fixed by reading address FIELDS only.
2. **Group rows called dual-homed.** One register row covering three AirPlay
   speakers, spread across two segments, is a spread of physical UNITS — not a
   machine with two NICs. Calling it dual-homed fabricates hardware.

A third defect was caught by the infra-plan render test: a group row emitted the
same finding twice, and the duplicate React key silently drops a render. Collapsing
to one finding per device **revealed a worse truth** — the possible UniFi pair
answers on BOTH segments, which is strictly more serious than the same gear on one.

## What the map found that the list could not

- **`livestream-main-pc` bridges both segments** (wired `192.168.1.73`, Wi-Fi
  `192.168.0.44`). Every firewall rule the pfSense enforces between the two segments
  is bypassed by that one host — which is also the livestream box.
- **The router interface on `192.168.1.0/24` was never read.** Reported as
  unrecorded rather than painting a plausible `.1`.
- **The NDI cameras and the ATEM are on opposite segments** — live production
  traffic crosses the firewall every service.

## The security posture

Measured against **DR-0003** (church = ISO-2, Cage as floor) and **DR-0050**
(isolation decided at the storage VOLUME; sovereign ONVIF backbone; cloud-tied Wyze
supplementary only). The conformance gap, stated plainly: **both decisions hold, and
neither isolates the network.** On a flat segment, volume-level isolation never sees
lateral movement toward the storage front door.

Three criticals, all from recorded data:

1. Member/financial storage shares `192.168.0.0/24` with consumer cloud IoT.
2. The same on `192.168.1.0/24`.
3. Unidentified possible-UniFi gear answers on BOTH segments.

Plus high findings: the bridge host, four consumer cloud rows, unidentified Netgear
gear, and seven camera/printer/security endpoints in the vendor-default class.

**What this is NOT.** It reads an asset register and open ports. It does not read
traffic, logs or authentication attempts. It shows where the network is OPEN; it
cannot show whether anyone walked through. **No intrusion is recorded.** Under-claiming
a real exposure and over-claiming a breach are both failures (DR-0100 / DR-0076).

## The access constraint, verified not assumed

The cloud session has **no route to the church LAN**: no `ssh` or `tailscale`
binary, an empty `~/.ssh`, and TCP 22 unreachable on both `100.69.19.13` (tailnet)
and `192.168.1.75` (LAN). DR-0108 says challenge a stated "can't" — so it was
probed rather than declared. The unblock was Darrell installing Claude Code directly
on the CUDA towers, which ARE on the church LAN. The scan script is what those
machines run; the repo is the transport back.

First real run reported **41 live hosts against a register holding 23 rows.** That
gap is itself the finding.

## Open — needs eyes-on at the network closet

1. Identify the Netgear units (`192.168.0.136/.137`) — switch, AP, or router?
2. Identify the possible UniFi pair (`192.168.0.245`, `192.168.1.200`) — and whether
   either bridges the two segments over the air.
3. Read the pfSense interface address on `192.168.1.0/24`.
4. Read or assign the NovaStar VX1000 LAN management address.
5. Confirm the FOH Yamaha console (QL vs TF5) and its address.
6. Credential + firmware sweep on every camera, printer and security endpoint.

## Verification

- 56 tests across 4 files; three breaks reintroduced and confirmed caught before the
  gates were kept (DR-0076 §3).
- One gate caught real lazy data entry — a 13-character port note. The data was
  fixed; the gate was kept.
- eslint clean on every changed file.

## Related

- PR #1683 · DR-0003 · DR-0012 · DR-0050 · DR-0076 · DR-0100 · DR-0108 · DR-0219
- `docs/99-session-notes/2026-07-08-church-lan-device-inventory.md` — the prior scan
  this work derives structure from.

---

## CORRECTION, same day — it is ONE /23, not two /24s

**Everything above that speaks of "two segments" was wrong, and the error is kept
here rather than edited away.**

The 2026-07-08 note recorded *"two subnets `192.168.0.0/24` and `192.168.1.0/24`"*.
**No netmask was ever read.** Someone saw addresses in two ranges and assumed /24
each. This session then inherited that assumption and shipped it marked
`maskAssumed: false` — an assumption wearing a measurement's provenance, which is
precisely the failure DR-0076 exists to prevent.

The 2026-09-18 scan had the answer in it the whole time, in a field nobody read:

```
LIVESTREAM-MAIN · Ethernet · 192.168.1.73 · prefix 23 · origin Dhcp
route table: 0.0.0.0/0 -> 192.168.0.1 (Ethernet). No inter-subnet route.
```

A /23 at that address spans `192.168.0.0`–`192.168.1.255`. So `192.168.0.x` and
`192.168.1.x` are **one layer-2 broadcast domain**, and the pfSense is not routing
between them because there is nothing to route.

### What that inverts

| Claimed above | Actually |
|---|---|
| Two segments, routed by the pfSense | **One flat /23**; the pfSense is the edge only |
| Cameras and ATEM on opposite segments — "a routed hop every service" | **Same wire.** Switched, never routed |
| `livestream-main-pc` bridges the segments | **No bridge exists** — both addresses are in the same /23 |
| UniFi pair spans both segments → CRITICAL | Spans nothing → **HIGH** |
| Router interface on `192.168.1.0/24` unrecorded | **No such network.** One gateway, recorded |

### What it makes worse

The flat-network finding was already CRITICAL and is now both **more certain and
more severe**. This is not two segments that happen to share risk — it is 42 devices
on a single broadcast domain with **no filtering anywhere inside it**: the NAS
holding member and financial records, consumer cloud IoT, cameras, printers and the
production chain, all able to reach each other without passing a firewall.

Segmentation was already step 5 of the plan. It is now the only structural fix, and
the "close the bridge first" prerequisite is gone because there is no bridge.

### The defects this exposed in our own code

1. **`maskAssumed` was derived from "is this CIDR in our list", not from an actual
   netmask reading.** Fixed: a mask is `maskObserved` only when one was read.
2. **A dangling plan dependency.** `segment-vlans` named `close-bridge`
   unconditionally; when that step stopped being generated, the plan told an
   operator to wait for a step that was not in it. `validatePlan` ignored that case
   entirely. Both fixed, and the validator now catches it.
3. **Gates pinned to live data asserted fictions.** Three tests demanded a bridge, a
   spanning group row and an opposite-segment placement — all artifacts of the false
   split. Rewritten to test the behaviour on synthetic networks, with direct
   assertions that the real church network has none of them.

### Standing lesson

The scan captured the netmask on its very first run. Nobody read that field for two
months, and a security assessment was built on an assumed topology instead. **Read
the mask; never infer it from which addresses you happen to see.**
