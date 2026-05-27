# Network sovereignty layer — Ubiquiti UCG-Max

**Status:** owned, already connected to home infrastructure (confirmed by Darrell, 2026-05-27).

The UCG-Max sits alongside the Synology DS1621xs as the network sovereignty pillar of the SKOS / PoeTech stack. Together they cover the full sovereign infrastructure surface:

- **Synology DS1621xs** = compute + storage + apps (Chat, Drive, Photos, n8n, Ollama, etc.)
- **UCG-Max** = network + identity + security + access control

Both customer-owned hardware. No SaaS subscriptions. Aligns with the open-source + portable stack binding and the "from the nas to the nas" sovereign-loop principle.

## What the UCG-Max contributes

### VLAN segmentation (the highest-impact use)

The DS1621xs runs services for multiple stakeholder groups — family, COLG (church), TLC (clinical, HIPAA-adjacent), Poe Properties (rentals), and future PoeTech commercial customers. Without network segmentation, all of these share one broadcast domain. With the UCG-Max we give each its own VLAN, walled off at L2.

Recommended VLAN topology (post-vacation rollout):

- **VLAN 10 — Family** (laptops, phones, family IoT, casual devices)
- **VLAN 20 — TLC Clinical** (Christina's TLC laptop, clinical printer, any device touching client data). HIPAA-adjacent isolation. No IoT bridge. No family-device cross-traffic. Firewall rule allows only specific NAS volumes (TLC instance paths).
- **VLAN 30 — Poe Properties** (rental tenant Wi-Fi if/when offered; tenant smart-home devices). Tenant traffic reaches their unit's devices but never home LAN.
- **VLAN 40 — IoT** (cameras, sensors, smart appliances). Isolated so a compromised camera can't pivot to the NAS.
- **VLAN 50 — Guest** (visitors, contractors). Internet only, zero LAN.
- **VLAN 60 — Server** (NAS, future GPU box). Restricted access from designated admin devices only.
- **VLAN 70 — PoeTech Commercial** (reserved for future customer-isolated instances if you host any customer data on your hardware — but per the commercial-use research, recommended model is customer-owned hardware so this VLAN likely stays empty).

### WireGuard VPN

UCG-Max ships with built-in WireGuard server. This is a sovereign alternative or supplement to Tailscale. Trade-off:

- **Tailscale (current):** managed control plane, easy device onboarding, free for personal, third-party dependency.
- **UCG-Max WireGuard:** fully self-hosted, no third-party, slightly more setup per device (export config file).

Pragmatic path: keep Tailscale for personal admin convenience, add UCG-Max WireGuard as the VPN path for clients / 1099 contractors / tenants who shouldn't be on Tailscale. Eventually migrate fully to UCG-Max WireGuard (Headscale or native) to retire the Tailscale dependency.

### Reverse proxy + internal DNS

UCG-Max can host an internal reverse proxy and DNS records. Wire `n8n.poetech.local`, `chat.poetech.local`, `drive.poetech.local` to point at the Synology services via the UCG-Max reverse proxy. Internal access uses friendly names, never bare IPs.

### DNS filtering + threat protection

- DNS-level malware + phishing blocking for every device in the home (no per-device config needed)
- IPS/IDS catches anomalous traffic patterns — early warning if anything tries to attack the Synology
- Geo-IP blocking for known bad actor regions

### Identity (RADIUS)

UCG-Max has a built-in RADIUS server. Unifies authentication across VPN + Wi-Fi + UniFi devices. Family members and clients get single credentials per role.

### Backup redundancy

UCG-Max storage (if equipped) can be a Restic backup target for Synology snapshots. Cross-device redundancy without third-party cloud. Synology can also back up TO UCG-Max via SMB share.

## Layered architecture summary

```
                    +------------------------+
                    |   UCG-Max (network)    |
                    |   VLANs / VPN / DNS    |
                    |   IPS / RADIUS / proxy |
                    +-----------+------------+
                                |
                                | (segmented LAN)
                                |
            +-------------------+--------------------+
            |                   |                    |
   +--------+-------+  +--------+-------+   +--------+-------+
   | DS1621xs (NAS) |  | Family devices |   | TLC clinical   |
   | Compute+storage|  | (VLAN 10)      |   | (VLAN 20)      |
   | (VLAN 60)      |  +----------------+   +----------------+
   | Chat, Drive,   |
   | Photos, n8n,   |  (other VLANs as needed)
   | Ollama, etc.   |
   +----------------+
            |
            | (Tailscale + UCG-Max WireGuard for remote)
            |
        Phones, laptops, family on the road
```

## Vacation-prep priority (this week)

UCG-Max work is **deferred to post-vacation**. The Tailscale + Synology QuickConnect + Synology Chat stack is operating. UCG-Max upgrades are additive and non-blocking.

Single exception worth considering NOW: **DNS-level malware blocking** is a 10-minute toggle in the UniFi controller. Protects every family device immediately. Low risk, high value, no other changes.

## Post-vacation rollout sequence (recommended)

1. **DNS filtering** (10 min, immediate family safety win)
2. **TLC VLAN 20** (highest sovereignty + HIPAA value — segment Christina's clinical work before TLC scales)
3. **Server VLAN 60** (move NAS to its own VLAN, reduce attack surface from any compromised family device)
4. **WireGuard server** (add UCG-Max VPN alongside Tailscale, prepare to onboard 1099 clients without exposing them to Tailscale dependency)
5. **Reverse proxy + internal DNS** (.poetech.local hostnames for friendlier admin)
6. **IPS/IDS + threat protection** (paid UniFi feature, evaluate ROI when scaling)
7. **RADIUS identity** (when family/clients want SSO across services)
8. **Backup redundancy** (Synology → UCG-Max Restic target)

## Commercial story (PoeTech)

The UCG-Max + DS1621xs pair is a STRONG commercial differentiator. PoeTech's customer pitch:

> "Your business runs on YOUR hardware. Your network sovereignty lives on a Ubiquiti UCG-Max you own. Your data sovereignty lives on a Synology NAS you own. We deliver the software, workflows, and AI agents that integrate with that infrastructure — and you can fire us anytime without losing access to your own systems."

This is a structurally different value proposition from SaaS-everything competitors. Worth foregrounding in PoeTech marketing.

## See also

- [Open-source + portable stack](./OPEN-SOURCE-STACK.md) (if exists, otherwise this doc references the binding principle)
- [Sovereignty-first install pattern](./SOVEREIGNTY-FIRST-INSTALL-PATTERN.md)
- [Synology commercial-use findings](../SYNOLOGY-COMMERCIAL-USE-FINDINGS.md) (if landed)
- POE binding: People Over Everything — this architecture exists to serve family + clients, not vice versa.

---

Written 2026-05-27 after Darrell confirmed UCG-Max ownership + connected status. Foundation doc captures architecture, not implementation. Implementation deferred to post-vacation per priority sequence above.
