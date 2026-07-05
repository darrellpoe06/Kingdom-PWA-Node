// =============================================================================
// led-wall-golive — the 2026-07-05 COLG on-site session (service + wall install)
// =============================================================================
// Pure data (single source: the in-app Video Wall project card + the doc + the
// proven-to-catch test read from here). This is the go-live record: the service
// that ran, the CORRECTED wall state (frozen holding graphic, not live), the
// booth device roles as Darrell stated them on site, the Blackmagic switcher-
// software status, and the lower-thirds open item.
//
// VERIFY-NOT-CLAIM (DR-0076): an earlier draft of this file read the LED wall as
// showing "live IMAG" from the session photos. That was an INFERENCE and it was
// WRONG. Darrell corrected it on site: the wall was FROZEN on a holding graphic
// (NovaStar Freeze) the whole service; the IMAG was on the SIDE screens. Every
// fact below is now his stated ground truth; inferred items carry `confirm:true`.
//
// PRIVACY (binding; repo is PUBLIC): non-financial engineering/operations facts
// only. No dollar figures, no donation amounts, no credentials.
// =============================================================================

// The service EVENT — corrected to ground truth (Darrell, on site 2026-07-05).
export const LIVE_SERVICE = {
  observedOn: '2026-07-05',
  service: 'Sunday service — "The Church of Celebrate" (Giver\'s Creed for July)',
  source: 'On-site ground truth, stated + corrected by Darrell — 2026-07-05 (his correction supersedes the photo inference).',
  // The honest milestone: the ONLINE broadcast was live; the wall was HELD frozen.
  milestone:
    'Sunday service ran with the ONLINE broadcast live (YouTube + Facebook). The ' +
    'sanctuary LED wall was held FROZEN on a holding graphic (a still from BG) via ' +
    'the NovaStar Freeze button for the whole service — NOT driven live — while the ' +
    'install continues toward running the wall from the CONTROL ROOM over the ' +
    'network. The IMAG the room saw was on the SIDE projection screens, not the wall.',
  confirmed: [
    'LED wall: FROZEN on a holding thumbnail (a still from BG) via the NovaStar Freeze button — held there until the network-control install is finished, so the wall can be run from the control room over the network. Not yet driven live.',
    'IMAG (the magnified stage) was on the two SIDE PROJECTION SCREENS — not on the LED wall.',
    'Online broadcast live to YouTube (YouTube Studio) and Facebook simultaneously.',
    'Proclaim ran the service order "Giver\'s Creed for July" (the giving segment).',
  ],
  // What an earlier version got wrong, kept visible so the correction is the record.
  corrected: 'An earlier draft claimed the wall showed live IMAG. It did not — the wall was frozen on a holding graphic the entire service (Darrell, on site).',
};

// The BOOTH device roles, AS STATED by Darrell on site 2026-07-05. Left vs right
// CUDA roles are his words; the physical model mapping (which tower is which) is
// `confirm:true` where not nailed down.
export const BOOTH_AS_BUILT = {
  observedOn: '2026-07-05',
  note:
    'Devices were MOVED this session to support the wall. Roles below are as ' +
    'Darrell stated them on site: the two CUDA towers split Proclaim (left) from ' +
    'the online broadcast (right); the wall is fed from a laptop and held on Freeze.',
  devices: [
    {
      id: 'left-cuda',
      device: 'Left CUDA tower — Proclaim host',
      role: 'Runs Proclaim; feeds the RIGHT tower for the ONLINE broadcast',
      detail:
        'Proclaim runs here. Its output goes to the right tower FOR THE ONLINE ' +
        'BROADCAST ONLY — NOT the local (side) screens, and NOT the LED wall.',
      confirm: false,
    },
    {
      id: 'right-cuda',
      device: 'Right CUDA tower — online broadcast',
      role: 'The online broadcast machine (stream to YouTube + Facebook)',
      detail:
        'Receives Proclaim from the left tower and streams the online broadcast. ' +
        'The Blackmagic ATEM software was MOVED to this box and then STOPPED ' +
        'WORKING — currently not functioning (troubleshoot pending).',
      confirm: false,
    },
    {
      id: 'wall-feed',
      device: 'LED wall feed — laptop -> NovaStar (FROZEN)',
      role: 'Holding graphic on the wall during the install',
      detail:
        'The wall is driven from a laptop device feed into the NovaStar and is ' +
        'currently held on the FREEZE button (a holding thumbnail). Goal: finish ' +
        'the install so the VX1000 is controlled from the CONTROL ROOM over the ' +
        'network — its control NIC has no IP yet (see the network-infrastructure ' +
        'project), which is exactly what "finish the install" unlocks.',
      confirm: false,
    },
    {
      id: 'atem-hw',
      device: 'Blackmagic ATEM Production Studio 4K',
      role: 'Hardware switcher (its control software is down)',
      detail:
        'The hardware switcher. Its ATEM Software Control was moved to the right ' +
        'CUDA tower and stopped working, so it is not driving anything right now.',
      confirm: true,
    },
    {
      id: 'ptz',
      device: 'PTZOptics 4K cameras',
      role: 'Stage cameras (SDI + NDI)',
      detail:
        'Controlled from a browser PTZ page (Zoom/Focus/Snap Focus, Presets 1-9). ' +
        'Camera control IPs seen ~192.168.1.125 / .126.',
      confirm: true,
    },
    {
      id: 'audio',
      device: 'Yamaha TF5 digital console',
      role: 'Front-of-house audio',
      detail: 'The audio mixer at the booth; separate from the video path.',
      confirm: false,
    },
  ],
};

// The Blackmagic switcher-software status — what was grabbed wrong, what is right,
// and the CURRENT state (installed, moved to the right tower, then stopped working).
export const SWITCHER_SOFTWARE = {
  need: 'ATEM Software Control — the app that drives the ATEM Production Studio 4K.',
  installed: 'Blackmagic ATEM Switchers 8.1.1 ("Install ATEM v8.1.1") was installed.',
  currentState:
    'It was moved to the RIGHT CUDA tower and then STOPPED WORKING — not ' +
    'functioning right now. Troubleshoot after service (verify the switcher is ' +
    'seen: USB/LAN connection, ATEM Setup discovery, firmware match, and that no ' +
    'other app on the right tower is holding the device).',
  wrongPackages: [
    { name: 'Blackmagic Camera 8.1.1', why: 'Camera control/firmware for cinema cameras (URSA/Pocket/Studio) — nothing to do with the switcher.' },
    { name: 'ATEM Switchers SDK 8.1.1', why: 'A developer kit (~3 MB), not the control app. The word "SDK" and the tiny size are the tell.' },
  ],
  threeSecondRule: 'If the download says "Camera" or "SDK", or it is under ~100 MB, it is wrong. The real ATEM Software Control package is ~1+ GB and its folder ships the "Production Studio Switchers Manual".',
  versionNote:
    '8.1.1 is older than the current 10.2.1, but for the Production Studio 4K (a ' +
    'LEGACY unit) this version is a correct/safe match (its package includes the ' +
    'Production Studio Switchers Manual). Newer releases sometimes drop old ' +
    'switchers. Confirm the switcher connects before updating.',
  officialOnly: 'Download only from blackmagicdesign.com/support (ATEM Production Switchers). Never a third-party mirror.',
};

// LOWER THIRDS — the open build item. Principle settled; path gated by the real
// switch. With the corrected roles, the ONLINE-broadcast keyer lives on the right
// CUDA tower; the local screens + wall are a separate path (the wall is frozen).
export const LOWER_THIRDS = {
  status: 'OPEN — deferred to after service by Darrell 2026-07-05.',
  principle:
    'A lower-third is a KEYED OVERLAY on the PROGRAM/stream path — it rides over ' +
    'the camera and is composited by whatever switches that program. It does NOT ' +
    'go on the LED wall (the wall is a full-frame holding graphic / future ' +
    'Proclaim + IMAG). For the ONLINE broadcast it keys on the right CUDA tower.',
  openQuestions: [
    'For the ONLINE broadcast: what composites it on the right CUDA tower — OBS, or the ATEM software (currently down)? The lower-third keys there.',
    'For the LOCAL screens / wall (separate from the online path): what will drive them once the wall is on network control, and does a lower-third belong there at all?',
  ],
  paths: [
    {
      name: 'Online broadcast (right CUDA tower) — software overlay',
      how: 'If OBS composites the stream, add the lower-third as an overlay input with alpha (transparent PNG or keyed NDI) and toggle it over program. If the ATEM software is the compositor, use its keyer once it is working again.',
    },
    {
      name: 'ATEM hardware switcher (once its software is back)',
      how: 'Downstream Keyer (DSK): load the lower-third PNG (with alpha) into a Media Player, assign DSK1, cut with the DSK ON AIR button.',
    },
    {
      name: 'Sovereign PoeTech route (already built — #322 / ndi-output.js)',
      how: 'The app renders a transparent keyed bar at ?output=1&kind=lower-third&name=...&role=... -> OBS Browser Source (transparent) -> DistroAV publishes NDI "POETECH (Lower-Third)" -> key it in the broadcast compositor.',
    },
  ],
};

// A Claude Code resident was installed on the booth box this session so future
// setup can be driven ON the machine (the cloud session cannot reach the church
// LAN). Recorded as a follow-through note, not a live-service claim.
export const BOOTH_RESIDENT = {
  box: 'Booth Windows box (user "creed") — no Node/Claude present at start.',
  installed: 'Claude Code native Windows installer (irm https://claude.ai/install.ps1 | iex); signed in with Claude Max.',
  why: 'The cloud session has no network path to the church LAN; a resident ON the box can look inside it and drive terminal-side setup (including remotely over Tailscale).',
  guardrail: 'DR-0012 + three-brakes: no autonomous AI load on the live switching/broadcast box during service. Hands-on, operator-watched only.',
  confirm: true,
};
