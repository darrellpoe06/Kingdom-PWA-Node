// =============================================================================
// onsite-session — the TURNKEY, sequenced COLG on-site buildout (2026-07-01)
// =============================================================================
// Execute-not-figure-out. One on-site session in the control/server room stands
// up THREE things as ONE technique (two birds): (1) the network backbone, (2) the
// LED wall (lit + mapped), and (3) the church TOWER as the PoeTech app BUILD NODE
// on the network (interim host until local LLMs come online on the infra).
//
// Every step has an ACTION (what to plug where) and a PROOF (how you KNOW it
// worked) so nothing advances on a guess. Values still SME-pending (tower specs,
// exact circuits/IPs, the vendor .rcfgx) are flagged, not fabricated.
//
// Coordinates as ONE technique with the sibling lanes:
//   - local_2afc8728 (GPU / sovereign-LLM): adds Ollama / local LLM to the SAME
//     tower AFTER it is a build node (infra/church-gpu-node compose). Needs the
//     tower's static IP + Tailscale name from Phase 4.
//   - local_0c6134f0 (NAS always-on driver): the deterministic nas-loops driver
//     drives build/work to the tower when the vendor AI is offline. Needs the
//     tower reachable (static IP / Tailscale) + the build node serving.
// Cross-refs the wall wiring/first-light detail in lib/led-wall-signal-chain.js.
// =============================================================================

export const SESSION_GOAL =
  'One on-site session: network backbone up -> LED wall lit + mapped -> church tower on the network as the PoeTech build node. Two birds, one technique.';

// The get-it-working-first subset. If time is short, do THESE step ids in order:
// wall lit + tower on the network as the build node (Darrell's priority).
export const PRIORITY_PATH = [
  's1-switch', 's1-reach',        // network backbone
  's2-power', 's2-led-data', 's2-video', 's3-proof', // wall lit (proof of life)
  's4-power', 's4-net', 's4-tailscale', 's4-buildnode', // tower as build node
];

// Ordered phases. steps run top-to-bottom; a phase is done when its steps prove out.
export const PHASES = [
  {
    id: 'stage',
    title: '0 · Stage + power safety',
    steps: [
      { id: 's0-circuits', action: 'Identify + label circuits: the WALL on its dedicated run (6x 15 A, or 3x 20 A per the power math); the TOWER + network gear on a SEPARATE circuit + UPS — never on the wall circuits.', proof: 'Wall breakers + the tower/UPS breaker identified and labeled.', sme: 'Exact panel circuit numbers (read the panel — see the breaker-panel photo).' },
      { id: 's0-stage', action: 'Position the gear: NovaStar VX1000 Pro AT the wall; the network switch + the tower in the control/server room.', proof: 'Gear placed so the planned cable runs reach (LED data direct to the wall; network/video over the switches).' },
    ],
  },
  {
    id: 'network',
    title: '1 · Network backbone (do FIRST — everything rides it)',
    steps: [
      { id: 's1-switch', action: 'Power the server-room switch. Link it to the upstairs switch over the 120 ft Cat6 (this is the NETWORK path — through switches is fine here).', proof: 'Switch uplink LED solid; a laptop patched into the switch pulls an IP.' },
      { id: 's1-reach', action: 'From a control-room laptop on the LAN, confirm reachability.', proof: 'ping the gateway, ping the NAS 192.168.1.26, ping 8.8.8.8 — all reply.' },
    ],
  },
  {
    id: 'wall',
    title: '2 · Wall: power -> LED data -> control -> video',
    steps: [
      { id: 's2-power', action: 'Energize the NovaStar + cabinets on the wall circuits. STAGGER the power-on (do NOT switch the whole wall at once — inrush).', proof: 'NovaStar LCD boots; cabinets show standby indicators.' },
      { id: 's2-led-data', action: 'Run the 8 LED lines — ONE per COLUMN: NovaStar LED-out port -> the TOP cabinet of that column -> daisy-chain DOWN its 6. DIRECT shielded Cat6, NEVER through a switch.', proof: 'Each cabinet’s receiving-card data-link LED lights; no dark cabinet in a chain.' },
      { id: 's2-control', action: 'NovaStar control port -> Cat6 -> the server-room switch (this one IS network).', proof: 'From the control-room laptop, NovaLCT (or an IP scan) detects the VX1000 control port.' },
      { id: 's2-video', action: 'Program source HDMI -> KEQINX 1x8 (HDMI IN) -> CAT OUT 1 -> Cat6 (<= 70 m) -> receiver at the wall -> HDMI -> NovaStar HDMI input.', proof: 'The NovaStar reports the HDMI input present + valid (shows a resolution).' },
    ],
  },
  {
    id: 'firstlight',
    title: '3 · First light -> map',
    steps: [
      { id: 's3-proof', action: 'Play a video on a laptop (VLC, full-screen) into the HDMI/KEQINX path -> select that input on the VX1000 front panel.', proof: 'The wall LIGHTS. Scrambled / repeated / partial is EXPECTED and is a WIN — it proves power + LED data + source are all live.' },
      { id: 's3-map', action: 'Windows laptop + NovaLCT + the control-port cable: load the vendor .rcfgx -> Screen Connection (8 cols x 6 rows; assign each port to its column in cable order) -> Send to hardware -> Save. Set brightness ~50-70%.', proof: 'The wall shows the COHERENT, correctly-tiled image; walk the face — no cabinet out of order/rotated.', sme: 'The vendor .rcfgx / receiving-card config from LED Nation (send the ask if not in hand).' },
    ],
  },
  {
    id: 'tower',
    title: '4 · Church tower = the PoeTech BUILD NODE (same session)',
    steps: [
      { id: 's4-power', action: 'Rack + power the church tower on its OWN circuit + UPS (NOT the wall circuits).', proof: 'Tower powers on and boots to its OS.', sme: 'Tower OS + specs (CPU/GPU/RAM) — lane local_2afc8728.' },
      { id: 's4-net', action: 'Patch the tower -> server-room switch. Give it a STATIC IP (or a DHCP reservation) on the church LAN.', proof: 'Tower pings the gateway + NAS + internet; another LAN device pings the tower’s static IP.' },
      { id: 's4-tailscale', action: 'Install / join Tailscale on the tower (church tailnet). This is the RDP-over-Tailscale build access.', proof: '`tailscale status` lists the tower; from OFF-site you can reach it over Tailscale (ping / RDP).' },
      { id: 's4-buildnode', action: 'Install the build toolchain (git + Node LTS), clone the PoeTech repo, `npm ci` && `npm run build`, and SERVE the built app (a static server). The tower is now the interim BUILD + HOST node (the NAS Caddy host is currently down, so this is the live host).', proof: 'The PoeTech app LOADS from the tower over the LAN AND over Tailscale.' },
      { id: 's4-handoff', action: 'Mark the tower’s roles and leave headroom for the local-LLM add-on (Ollama / whisper / voice via infra/church-gpu-node compose — lane local_2afc8728) and register the tower with the NAS always-on driver (nas-loops — lane local_0c6134f0). Keep roles separated: live-media != build / AI-worker.', proof: 'Roles written down; the compose + the driver have the tower’s static IP + Tailscale name.' },
    ],
  },
  {
    id: 'lockin',
    title: '5 · Label + lock-in (survives a reboot)',
    steps: [
      { id: 's5-label', action: 'Label every LED line (port # -> column), the circuits, the control + video Cat6, and the tower’s static IP + Tailscale name. Write a one-page as-built.', proof: 'Labels on; the as-built note exists.' },
      { id: 's5-reboot', action: 'Reboot-test the tower: confirm Tailscale + the app service auto-start (services set to start on boot).', proof: 'After a reboot the app + Tailscale come back with no hands.' },
    ],
  },
];

// The lane-coordination map — this session is ONE technique with the siblings.
export const LANES = [
  { lane: 'local_2afc8728', role: 'GPU / sovereign local-LLM on the SAME tower', dependsOn: 'Phase 4 tower on the network (static IP + Tailscale) + build node up', adds: 'Ollama / whisper / voice via infra/church-gpu-node compose, AFTER the build-node role.' },
  { lane: 'local_0c6134f0', role: 'NAS always-on deterministic driver (nas-loops)', dependsOn: 'The tower reachable (static IP / Tailscale) + the build node serving', adds: 'Drives build/work to the tower when the vendor AI is offline; INERT until armed.' },
];

// --- Pure derivations (shared by the doc + component + tests) -----------------

// Flatten the phases into an ordered step list (id-keyed), preserving phase.
export function allSteps(phases = PHASES) {
  const out = [];
  for (const p of phases) for (const s of p.steps) out.push({ ...s, phase: p.id, phaseTitle: p.title });
  return out;
}

// Is a step on the get-it-working-first priority path?
export function isPriority(stepId, path = PRIORITY_PATH) {
  return path.includes(stepId);
}

// Progress from a {stepId: bool} done-map.
export function sessionProgress(doneMap = {}, phases = PHASES) {
  const steps = allSteps(phases);
  const total = steps.length;
  const done = steps.filter((s) => doneMap[s.id]).length;
  const priorityTotal = PRIORITY_PATH.length;
  const priorityDone = PRIORITY_PATH.filter((id) => doneMap[id]).length;
  return { total, done, priorityTotal, priorityDone, allDone: done === total };
}
