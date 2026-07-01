# COLG on-site session — TURNKEY sequence (2026-07-01)

> Execute-not-figure-out. For when you're standing in the control/server room today/tomorrow.
> **Two birds, one technique:** one session stands up (1) the network backbone, (2) the LED wall (lit + mapped), and (3) the church **tower as the PoeTech build node** on the network — the interim build/host node until local LLMs come online on the infra.
> Every step has an **ACTION** (what to plug where) and a **PROOF** (how you KNOW it worked). SME-pending items are flagged, not guessed. Also rendered in-app on the LED-wall project record ("On-site session · turnkey sequence").

## Priority path (if time is short — do these, in order)
**Wall lit + tower on the network as the build node.**
`server switch up → wall power → 8 LED lines → wall lit (proof of life) → tower on network → Tailscale → build node serving.`

---

## 0 · Stage + power safety
1. **Circuits.** ACTION: identify + label circuits — the **wall** on its dedicated run (6× 15 A, or 3× 20 A per the power math); the **tower + network gear** on a **separate circuit + UPS**, never on the wall circuits. **PROOF:** wall breakers + tower/UPS breaker identified + labeled. *(SME: exact panel circuit numbers — read the panel.)*
2. **Stage the gear.** ACTION: NovaStar VX1000 Pro **at the wall**; the network switch + the tower in the **control/server room**. **PROOF:** placed so the planned runs reach (LED data direct to the wall; network/video over the switches).

## 1 · Network backbone (do FIRST — everything rides it)
3. **Server switch.** ACTION: power the server-room switch; link it to the upstairs switch over the **120 ft Cat6** (network path — through switches is fine here). **PROOF:** uplink LED solid; a laptop on the switch pulls an IP.
4. **Reachability.** ACTION: from a control-room laptop, check the LAN. **PROOF:** ping the gateway, ping the NAS **192.168.1.26**, ping **8.8.8.8** — all reply.

## 2 · Wall: power → LED data → control → video
5. **Power.** ACTION: energize the NovaStar + cabinets on the wall circuits; **STAGGER the power-on** (not the whole wall at once — inrush). **PROOF:** NovaStar LCD boots; cabinets show standby.
6. **LED data (the 8 lines).** ACTION: one line **per COLUMN** — NovaStar LED-out port → the **top cabinet** of that column → daisy-chain **down its 6**. **DIRECT shielded Cat6, NEVER through a switch.** **PROOF:** each cabinet's receiving-card data LED lights; no dark cabinet in a chain.
7. **Control.** ACTION: NovaStar control port → Cat6 → the server-room switch (this one IS network). **PROOF:** NovaLCT / an IP scan on the laptop detects the VX1000 control port.
8. **Video in.** ACTION: program source HDMI → **KEQINX 1×8** (HDMI IN) → CAT OUT 1 → Cat6 (**≤ 70 m**) → receiver at the wall → HDMI → NovaStar HDMI input. **PROOF:** the NovaStar reports the HDMI input present + valid (shows a resolution).

## 3 · First light → map
9. **Proof of life.** ACTION: play a video on a laptop (VLC, full-screen) into the HDMI/KEQINX path → select that input on the VX1000. **PROOF:** the wall **LIGHTS**. Scrambled / repeated / partial is **expected and a WIN** — power + LED data + source are all live.
10. **Map it (NovaLCT).** ACTION: Windows laptop + NovaLCT + control-port cable → load the vendor **.rcfgx** → **Screen Connection** (8 cols × 6 rows; assign each port to its column in cable order) → Send → Save. Brightness ~50–70%. **PROOF:** the wall shows the **coherent, correctly-tiled** image; walk the face — no cabinet out of order. *(SME: the vendor .rcfgx from LED Nation — send the ask if not in hand.)*

## 4 · Church tower = the PoeTech BUILD NODE (same session)
11. **Power.** ACTION: rack + power the tower on its **OWN circuit + UPS** (not the wall circuits). **PROOF:** boots to OS. *(SME: tower OS + specs — lane `local_2afc8728`.)*
12. **Network.** ACTION: patch the tower → server-room switch; give it a **static IP** (or DHCP reservation). **PROOF:** tower pings gateway + NAS + internet; another LAN device pings the tower's IP.
13. **Tailscale.** ACTION: install/join Tailscale on the tower (church tailnet) — the RDP-over-Tailscale build access. **PROOF:** `tailscale status` lists the tower; from **off-site** you can reach it over Tailscale (ping / RDP).
14. **Build node.** ACTION: install git + Node LTS, clone the PoeTech repo, `npm ci && npm run build`, and **serve** the built app (a static server). The tower is now the interim **build + host** node *(the NAS Caddy host is currently down — see note — so this is the live host)*. **PROOF:** the PoeTech app **loads from the tower over the LAN AND over Tailscale**.
15. **Handoff / roles.** ACTION: write down the tower's roles + leave headroom for the **local-LLM add-on** (Ollama / whisper / voice via `infra/church-gpu-node` compose — lane `local_2afc8728`), and register the tower with the **NAS always-on driver** (`nas-loops` — lane `local_0c6134f0`). Keep roles separated: live-media ≠ build/AI-worker. **PROOF:** roles written down; the compose + the driver have the tower's static IP + Tailscale name.

## 5 · Label + lock-in (survives a reboot)
16. **Label.** ACTION: label every LED line (port # → column), the circuits, the control + video Cat6, and the tower's static IP + Tailscale name. Write a one-page as-built. **PROOF:** labels on; as-built exists.
17. **Reboot test.** ACTION: reboot the tower — confirm Tailscale + the app service **auto-start** on boot. **PROOF:** after a reboot the app + Tailscale come back with no hands.

---

## One technique — coordinated lanes (not separate tracks)
| Lane | Role | After | Adds |
|---|---|---|---|
| `local_2afc8728` | GPU / sovereign local-LLM on the **same tower** | Phase 4: tower on the network (static IP + Tailscale) + build node up | Ollama / whisper / voice via `infra/church-gpu-node` compose, on top of the build-node role |
| `local_0c6134f0` | NAS always-on deterministic driver (`nas-loops`) | Tower reachable (static IP / Tailscale) + build node serving | Drives build/work to the tower when the vendor AI is offline; **INERT** until armed |

## Notes / open items
- **NAS Caddy host is currently DOWN** (Tailscale Funnel `:8443` → `502`; the `poetech-web` container isn't answering; port held but no reply). That is exactly why the **tower as build/host node** matters now — bring the tower up as the live host, and separately restart the NAS `poetech-web` container (DSM → Container Manager) when convenient.
- **The 14 install photos** are safely stored on the NAS (`/volume1/PoeTech/church-media/led-wall-install/`) awaiting the serving-model + people-photo decision (separate task).
- Cross-refs: LED wiring + first-light detail in `app/src/lib/led-wall-signal-chain.js`; power/data math in `app/src/lib/video-wall-spec.js`; signal chain / placement in `app/src/lib/church-av-devices.js`; the tower compose in `infra/church-gpu-node/`.
- **SME-pending to lock:** exact circuits, tower OS/specs + static IPs, the vendor `.rcfgx`.
