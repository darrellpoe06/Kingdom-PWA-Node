# Network Infrastructure Project — Seed (2026-07-03)

**Directive (Darrell, 2026-07-03, on site):** "You will also help with the network
infrastructure project asap." This note is the project's starting spine: every
fact below is verified from tonight's session; every unknown is named as an
unknown. The plan gets drafted against the real map, not guesses.

## Foundation — identity + mission (declared by Darrell, 2026-07-05)

**Who this serves — declared by Darrell:**

> "The Tribe Of Judah Love Corner Nation Kingdom Of Yahweh — seekers and doers."

**Why this project exists — declared by Darrell:**

> "The network infrastructure project will allow us to have a data driven
> understanding without guessing or speculating."

This is the **Verification Doctrine (DR-0076)** applied to the network: the design
is drafted against the **real map** — a measured inventory, live probes, actual
device state — never a guess. Today proved the need in the negative: all morning
the cloud session had to *infer* the booth from photos because it could not see
the church LAN. The network-infrastructure project is what removes that blindness
— **the system sees itself** (AI-FOUNDATION-INTERNAL-OPERATIONS: the network gets
inventoried into the device register so nothing about it is speculated). Data
first; then act on what the data shows. No guessing, no speculating.

**The Word under the name** (verbatim; fetched from the in-repo KJV, DR-0076):

- *seekers* — **KJV — Matthew 6:33:** *"But seek ye first the kingdom of God, and
  his righteousness; and all these things shall be added unto you."* — the Kingdom
  Of Yahweh, sought first.
- *doers* — **KJV — James 1:22:** *"But be ye doers of the word, and not hearers
  only, deceiving your own selves."* — doers act on what is real, not on hearing-
  only speculation.

**Seekers AND doers** is the posture the whole project runs on: seek the real
data, then do the work it shows. That is the opposite of guessing — and it is why
the network infrastructure is a Kingdom concern, not just an IT chore.

## Verified tonight (receipts)

### The tailnet (from `tailscale status` on the church tower)

| Node | Address | OS | State 2026-07-03 |
|---|---|---|---|
| livestream-main-pc (church CUDA tower) | 100.72.5.90 | Windows 11 Home 26200 | online |
| poetech (NAS — the sovereign core) | 100.70.190.47 | Linux (Synology) | online |
| kingdom-home | 100.74.53.117 | Windows | online |
| darrells-z-fold7 | 100.86.238.88 | Android | offline (toggle off) |
| tlcrackstation | 100.66.173.22 | Linux | offline 23 days |

### Church LAN facts

- NAS LAN address: `192.168.1.26` (n8n :5678, Supabase self-hosted — the sovereign rail).
- The LED wall's 8 Cat runs are a **dedicated point-to-point star** from the VX1000
  Pro's output ports to the cabinet columns — NOT on the LAN (no switch between;
  keep it that way).
- VX1000 Pro control is **USB from the booth laptop**; its network jack has no IP
  yet (DHCP/static not configured — optional, only needed for V-Can over LAN).
- The control-room tower carries a **Tactical RMM agent** (remote-management tool,
  operator unknown) which was observed updating Tailscale via winget.

## Open unknowns (the walk-through list)

- [ ] Internet ingress: ISP, modem, router make/model, speed tier.
- [ ] Switch inventory: how many, where, managed vs dumb, port speeds (are the
      camera/booth runs gigabit?).
- [ ] Rack/closet photos (requested; pending).
- [ ] Wi-Fi: AP count/placement, SSIDs, guest separation.
- [ ] **Who operates the Tactical RMM agent** — a prior vendor with remote access
      to church machines is a security-posture question, not just a curiosity.
- [ ] Camera/streaming path bandwidth needs (ATEM + livestream box).
- [ ] `tlcrackstation` — what is it, why offline 23 days?

## Principles already binding on the design

- **PERPETUAL-PIPELINE-HEALTH:** unbreakable standard — health checks, monitoring,
  backups, auto-restart on boot.
- **Sovereignty:** internal surfaces ride the NAS + tailnet, never public exposure;
  no port-forwarding; Tailscale (or Funnel where already established) is the only
  remote door.
- **AI-FOUNDATION-INTERNAL-OPERATIONS:** anything that is a click today should be
  an API call tomorrow — the network must be inventoried into the device register
  (church-devices) so the system can see itself.
- **Community-first:** the network serves COLG's elderly, tech-novice staff — the
  design goal is *nobody has to understand it for it to work on Sunday.*

## Next actions (in order)

1. Tower Claude runs the network-map command (ipconfig /all, arp -a, adapters,
   NAS ping) → `network-map.txt` → feeds this doc.
2. Rack/closet photos from Darrell → switch/router inventory into church-devices.
3. Resolve the RMM question with the Governor.
4. Draft the phased plan (document → stabilize → segment → monitor) with costs,
   against the real map.
