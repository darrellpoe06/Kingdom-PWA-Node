# DR-1622: No outside system is the only door

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** C for the new public road (a new way into the house; built and proven, activated with Darrell watching); A for the immediate restore
**Type:** decision + incident
**Area:** the NAS transport (`infra/nas-transport/RECORDED-STATE.md`), the Tailscale node `poetech`, a second NAS-initiated road (to build)
**Sent in by:** Darrell, 2026-11-24, 11:35-11:40 PM local: "Lost access to them because of a certificate!??!!! I don't want to rely on this type of technology stack!!!!!!? Fix it!!!!" and "DRs?!!!!! Too?!!!!"
**Pairs with:** DR-1360 (governs), DR-0776, DR-1068, DR-1180, DR-1374, DR-1526, DR-1159, DR-1617 to DR-1620

## Context

Sign-in had been down for hours: every road through the Tailscale Funnel answered 502 (DR-1619). Darrell's own Tailscale app, signed into a tailnet under `darrellpoe06@gmail.com` (not the family's tailnet; see the correction below), listed **two** devices, his phone and `tlcrackstation`. The NAS (`poetech`) and the 4070 tower were not on the list. On the home network the NAS's DSM sign-in page loaded at `192.168.1.26:5001`, but Synology Secure SignIn answered "Request denied" to approvals he allowed, and to codes, on several tries.

## DRs reviewed

- **DR-1360 governs.** "The NAS initiates every road"; "a system we do not control is support, never a necessity"; swapping one outside credential for another "changes which outside system the house depends on, not whether it depends."
- **DR-0776** answered "why Tailscale" in October: an HTTPS page cannot call the house's plain LAN address, and no router port is open, so the Funnel was the one road in. It named the direct road at home as the better one for the cameras.
- **DR-1068, DR-1180, DR-1286, DR-1291:** the parked "second door" is a Cloudflare zone Worker that still forwards to the Funnel. It is a second door into the same tunnel, not a second road to the house.
- **Corrected the same night:** a first draft of this record and the paste given to Darrell said `--reset` and warned of a password. Both were written without reading DR-1526 and the NAS install notes first. Darrell: "Don't need a password?!!!!! Re-review the DRs appropriately!!!!!!!!! Always!!!!!!!!!"
- **DR-1374, DR-1159, DR-1526:** name all three roads before calling anything a blocker. Here: road 1, the runner over the tailnet, is closed by a dead `TS_AUTHKEY`. Road 2, plain LAN SSH from Darrell's desktop, is open; DR-1526 proved it needs no key. Road 3, a hand, applies only to a value only he holds.

## What was measured

- **Observed in screenshots:** the NAS was absent from his tailnet device list. The DSM page answered on the LAN, so the box was powered and on the network. Secure SignIn denied allowed approvals.
- **Not verified:** whether the node expired, was removed or is listed under tags; why Secure SignIn denied. A wrong NAS clock would explain both the denial and the dead Tailscale connection; that is a hypothesis to measure, not a finding. The cause of "the compute keeps restarting" is unmeasured; DR-1619's report now carries `uptime_s` to measure it.

## Impact

One outside system, Tailscale, was the only door between the family's phones and their own server. Its node dropped and the whole family was locked out, which is exactly what DR-1360 says must never be true.

## Decision

1. **Restore now, by road 2.** Over LAN SSH from Darrell's desktop: no password (DR-1526: `ssh dpoe@192.168.1.26` is the proven road; `sudo -n` works on the box, `infra/nas-supabase/install.sh`), and plain `tailscale up`, never `--reset`. No up-flags are recorded for the NAS anywhere in the repository, so a reset could erase settings nothing can rebuild. Sign in with **GitHub** (the tailnet is `darrellpoe06.github`; **corrected 2026-11-24, DR-1624**: this record first said Google, a guess from his phone's Tailscale app, which is signed into a different, near-empty tailnet under his Gmail). Then **disable key expiry** on `poetech` in the admin console. DR-1619's watchdog re-mounts every recorded row once the node is back.
2. **No outside system is the only door.** The family's sign-in road gets a **second, NAS-initiated road** that does not involve Tailscale: a Cloudflare Tunnel (the NAS dials out; nothing at home accepts calls in). This does not make the house depend on Cloudflare instead. Cloudflare already serves poetech.us, and the point is that **either** road can fail without a lockout. Neither outside system is a necessity; each is support. Tier C: built with its brakes and proof, activated with Darrell watching. The tunnel token is a value only his Cloudflare account can mint (DR-1180), asked for once, with the exact clicks.
3. **At home, no outside system at all.** Following DR-0776's principle, the sign-in road also gets the direct home road, so a phone on the house Wi-Fi signs in even when every outside road is down. To design: `re-review: 2026-12-01`.
4. **The house reports its own state** (DR-1619, done): tailnet state, public probe codes, funnel status and uptime, sent by the NAS itself to GitHub.

## Verification

Done when four things are read, not inferred:

- the NAS listed green on the tailnet with key expiry disabled;
- site-health reading `poetech.us/sb` answering again;
- the NAS's own report on the funnel-incident ledger;
- for item 2, sign-in proven with the Funnel deliberately off.

`re-review: 2026-11-25`
