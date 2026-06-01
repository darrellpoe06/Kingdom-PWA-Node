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

## Camera infrastructure (added 2026-05-29 per Darrell)

The home has multiple existing camera brands deployed for security + family awareness:

- **Wyze cameras** — multiple units around the home (front yard area where Christyn plays basketball, others). Affordable, established, RTSP capability on some V3 firmware. Currently the primary camera fleet.
- **Ring cameras** — at least one (doorbell or wired). AWS-cloud-tied by default; sovereignty story weaker than Wyze; works for the "front-door visitor awareness" use case.
- **One additional brand (name TBD — Darrell to confirm)** — third camera fleet on the property. Pending identification.

All three brands currently run on the flat home network (VLAN to be established at IoT VLAN 40 per the topology above). Each brand has its own cloud dependency, each has its own quirks.

### The upgrade trajectory

**Eventual target: Ubiquiti 4K AI cameras (hardwired).** Same vendor family as the UCG-Max. Benefits:

- Hardwired PoE — no wireless dropouts, no battery management
- 4K resolution — better for AI vision analysis (Christyn's basketball coaching, etc.)
- Built-in AI features (person/vehicle/package detection without cloud roundtrip)
- Native UniFi Protect integration — local storage on the UCG-Max or Synology, no cloud dependency
- Eliminates Wyze/Ring/3rd-party clouds entirely — one ecosystem, one sovereign storage path
- Better evidence quality for any security incidents

**The transition strategy** (post-vacation, paced over months not days):

1. **Phase 0 (now):** Inventory all existing cameras. Brand, model, location, current footage destination. Identify the unnamed third brand.
2. **Phase 1:** Add all current cameras to VLAN 40 (IoT) when the VLAN ships. Walled off from family laptops + NAS internals; can write to a designated `/volume1/PoeTech/camera-footage/<brand>/<camera>/` share.
3. **Phase 2:** For Wyze specifically, evaluate the RTSP-firmware path so footage flows to NAS in real time. Same for Ring if their API allows.
4. **Phase 3:** First Ubiquiti AI camera purchased — typically a high-value angle (front door, driveway, basketball area). Wired in. Validates the workflow.
5. **Phase 4:** Old cameras replaced one-by-one as each Ubiquiti unit ships. Old units retire (or get repurposed elsewhere — garage, shop, away-property).
6. **Phase 5:** Single-vendor camera fleet. UniFi Protect manages everything. Backup to Synology continues.

### Bridge layer (multi-brand period — months, not weeks)

While multiple brands coexist, a bridge workflow normalizes their footage into a single shape the AI pipeline can consume:

**New workflow proposal (post-vacation): workflow 40 — Camera bridge.**

POST `/webhook/camera-event` accepting events from any brand (Wyze webhook, Ring webhook, third-brand webhook). Workflow normalizes the payload into a standard shape:

```
{
  brand: 'wyze' | 'ring' | '<third>' | 'ubiquiti',
  camera_id: '<brand-specific-id>',
  camera_label: 'front-yard' | 'doorbell' | etc.,
  event_type: 'motion' | 'person' | 'package' | 'sound' | etc.,
  captured_at: '<ISO>',
  clip_path: '/volume1/PoeTech/camera-footage/<brand>/<camera>/<timestamp>.mp4' | null,
  thumbnail_path: '...' | null,
  raw_event: <original>
}
```

Downstream workflows (basketball coaching, security alerting, visitor recognition) consume the normalized shape regardless of brand. When Ubiquiti replaces a Wyze, no downstream workflow changes — only the bridge entry updates.

### Camera privacy + family-voice integration

Per `PERPETUAL-PIPELINE-HEALTH.md` and the TLC firewall logic extended to family privacy:

- Camera footage stays on the NAS. Never auto-uploaded to cloud vision unless cropped + de-identified.
- AI analysis of footage (basketball coaching, security tagging) runs on local Ollama with LLaVA or Qwen-VL.
- Family members can OPT OUT of AI analysis of their own footage. Christyn agrees to coaching; Christian or Christina could decline.
- No facial recognition, no biometric tracking, no medical-adjacent inference.
- Parental visibility on all minor-attributed footage.
- Quarterly camera audit: what's recording, where it goes, who has access. Read by family.

### Storage budget

Estimated camera footage volume:

- 8 cameras × 1080p × motion-only recording × 30-day retention = ~500-800 GB
- 8 Ubiquiti 4K AI cameras × motion-only × 30-day retention = ~1.5-2.5 TB

The NAS has 15 TB available per the n8n rollout plan. Camera footage fits comfortably. Retention can extend to 90 days for the Ubiquiti tier if storage allows.

### Connection to Christyn's basketball coaching (workflow 38/39)

The basketball coaching spec (`docs/99-session-notes/2026-05-29-christyn-basketball-coaching-spec.md`) currently assumes Wyze cameras. Once the camera bridge (workflow 40) ships, the coaching workflow becomes brand-agnostic — it just consumes the normalized event stream + the clip path, regardless of which camera captured the play. When Ubiquiti replaces Wyze, basketball coaching keeps working without any change to workflows 38/39.

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
