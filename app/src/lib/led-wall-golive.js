// =============================================================================
// led-wall-golive — the 2026-07-05 FIRST FULL LIVE SERVICE on the COLG wall
// =============================================================================
// Pure data (single source: the in-app Video Wall project card + the doc + the
// proven-to-catch test all read from here so a fact stated on the screen and in
// a test can never drift). This is the go-live record: the wall carried its
// first complete Sunday service, the booth device layout as observed on site,
// the Blackmagic switcher-software resolution, and the lower-thirds open item.
//
// VERIFY-NOT-CLAIM (DR-0076): every line below is either OBSERVED on site
// 2026-07-05 (from Darrell's photos, guided live) or marked `confirm:true` where
// it was inferred and still needs an on-site check. Nothing is painted. The two
// questions that gate the lower-thirds build are recorded as OPEN, not guessed.
//
// PRIVACY (binding; repo is PUBLIC): non-financial engineering + operations
// facts only. No dollar figures, no donation amounts, no credentials.
// =============================================================================

// The milestone EVENT — first full live service carried on the wall.
export const LIVE_SERVICE = {
  observedOn: '2026-07-05',
  service: 'Sunday service — "The Church of Celebrate" (Giver\'s Creed for July)',
  source: 'On-site observation + photos, Darrell — 2026-07-05, guided live from the cloud session',
  milestone:
    'First FULL live service carried on the sanctuary LED wall: the wall ran the ' +
    '"Celebrate" service graphic AND live IMAG of the stage, the two side ' +
    'projection screens magnified the speaker, cameras cut live, and the service ' +
    'streamed to YouTube and Facebook — two days after first-light commissioning.',
  // OBSERVED on site (confirmed from the photos this session).
  confirmed: [
    'Wall live: "Celebrate" full-frame service graphic + live IMAG of the stage.',
    'Two side projection screens magnifying the speaker (camera IMAG), in sync with the room.',
    'PTZOptics cameras cutting live; congregation gathered, service in full flow.',
    'Streaming live to YouTube (YouTube Studio) and Facebook Live simultaneously.',
    'Proclaim running the service order "Giver\'s Creed for July" (the giving segment).',
  ],
};

// The BOOTH as-built, observed on site 2026-07-05. Each row is what was actually
// on the desk; `confirm:true` flags anything inferred (IPs read off a screen at
// an angle, role assumptions) that a booth check should pin.
export const BOOTH_AS_BUILT = {
  observedOn: '2026-07-05',
  note:
    'Devices were MOVED this session to support the wall. This is the layout as it ' +
    'stood during the live service; the exact "what moved where" is an open item below.',
  devices: [
    {
      id: 'switcher-sw',
      device: 'Software switcher (Program/Preview multiview)',
      role: 'Live program switch + stream',
      detail:
        'Multiview labels its sources by NAME — "Proclaim", "Local Back Camera 1", ' +
        'Preview, Program — which reads like a software (NDI) switcher, not the ATEM ' +
        'hardware. Which one carries the live Program cut is [TO CONFIRM].',
      confirm: true,
    },
    {
      id: 'proclaim',
      device: 'Proclaim (presentation)',
      role: 'Lyrics / Scripture / giving slides -> wall + a switcher source',
      detail:
        'Runs the service order on the booth laptop; feeds the wall (HDMI -> VX ' +
        'HDMI-3 = Preset 1) and appears as a named source in the switcher multiview.',
      confirm: false,
    },
    {
      id: 'ptz',
      device: 'PTZOptics 4K cameras',
      role: 'Stage cameras (SDI + NDI)',
      detail:
        'Controlled from a browser PTZ page (Zoom/Focus/Snap Focus, Presets 1-9, ' +
        'Exposure/Image/Color tabs). Camera control IPs seen ~192.168.1.125 / .126.',
      confirm: true,
    },
    {
      id: 'cuda-4070',
      device: 'CUDA tower — GeForce RTX 4070',
      role: 'GPU worker / OBS-streaming class box',
      detail:
        'RTX 4070 tower at the booth (livestream / AI-worker class per DR-0012). ' +
        'The sovereign lower-third NDI bridge (OBS + DistroAV) would live on a box ' +
        'like this — confirm it is not the one repurposed for the wall.',
      confirm: true,
    },
    {
      id: 'legion',
      device: 'Lenovo Legion tower',
      role: 'GPU worker / former NDI->HDMI bridge',
      detail:
        'The Legion tower (the left box that historically bridged NDI -> HDMI into ' +
        'the ATEM; the DR-0082 incident). Present at the desk this session.',
      confirm: true,
    },
    {
      id: 'atem-hw',
      device: 'Blackmagic ATEM Production Studio 4K',
      role: 'Hardware switcher (legacy unit)',
      detail:
        'The hardware switcher. ATEM Software Control 8.1.1 was installed on the ' +
        'booth box (Windows user "creed") this session to drive it (see below).',
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

// The Blackmagic switcher-software resolution — what was grabbed wrong, what is
// right, and why the older version is the correct match for the legacy switcher.
// This documents a real "three-second rule" so the next person does not repeat it.
export const SWITCHER_SOFTWARE = {
  need: 'ATEM Software Control — the app that drives the ATEM Production Studio 4K.',
  installed: 'Blackmagic ATEM Switchers 8.1.1 ("Install ATEM v8.1.1"), on the booth box (user "creed").',
  // The wrong packages that were downloaded first (each a real dead-end this session).
  wrongPackages: [
    { name: 'Blackmagic Camera 8.1.1', why: 'Camera control/firmware for cinema cameras (URSA/Pocket/Studio) — nothing to do with the switcher.' },
    { name: 'ATEM Switchers SDK 8.1.1', why: 'A developer kit (~3 MB), not the control app. The word "SDK" and the tiny size are the tell.' },
  ],
  // The discriminator, stated so it is reusable.
  threeSecondRule: 'If the download says "Camera" or "SDK", or it is under ~100 MB, it is wrong. The real ATEM Software Control package is ~1+ GB and its folder ships the "Production Studio Switchers Manual".',
  versionNote:
    '8.1.1 is older than the current 10.2.1, but for the Production Studio 4K — a ' +
    'LEGACY unit — this version is a correct/safe match (its package includes the ' +
    'Production Studio Switchers Manual). Newer ATEM Software Control releases ' +
    'sometimes drop old switchers. Confirm the switcher connects before updating.',
  officialOnly: 'Download only from blackmagicdesign.com/support (ATEM Production Switchers). Never a third-party mirror.',
};

// LOWER THIRDS — the open build item. The PRINCIPLE is settled; the exact path
// is gated by two questions that MUST be answered on site (recorded as open, not
// guessed). Placed here so the after-service session starts from the real state.
export const LOWER_THIRDS = {
  status: 'OPEN — deferred to after service by Darrell 2026-07-05.',
  principle:
    'A lower-third is a KEYED OVERLAY on the PROGRAM/stream path — it rides over ' +
    'the camera and is composited by the switcher. It does NOT go on the LED wall ' +
    '(the wall is full-frame Proclaim graphics / IMAG). The lower-third lives ' +
    'wherever the Program/Preview switch lives.',
  // The two answers that pick the path. Until answered, the build cannot be final.
  openQuestions: [
    'What is doing the live Program cut right now — the ATEM hardware, or switcher software on a tower (the Legion or the RTX 4070 box)?',
    'What device MOVED where to support the wall? (If the moved box was running OBS + DistroAV, the sovereign NDI lower-third bridge may be down.)',
  ],
  paths: [
    {
      name: 'Software switcher (most likely, from the named-source multiview)',
      how: 'Add the lower-third as an overlay layer/input with alpha (a transparent PNG or a keyed NDI source) and toggle it on/off over program. No new gear.',
    },
    {
      name: 'ATEM hardware switcher',
      how: 'Use the Downstream Keyer (DSK): load the lower-third PNG (with alpha) into a Media Player, assign it to DSK1, and the DSK ON AIR button cuts it over the cameras.',
    },
    {
      name: 'Sovereign PoeTech route (already built — #322 / ndi-output.js)',
      how: 'The app renders a transparent keyed bar at ?output=1&kind=lower-third&name=...&role=... -> OBS Browser Source (transparent) -> DistroAV publishes NDI "POETECH (Lower-Third)" -> key it in the switcher. Needs OBS + DistroAV on a box not repurposed for the wall.',
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
  guardrail: 'DR-0012 + three-brakes: no autonomous AI load on the live switching box during service. Hands-on, operator-watched only.',
  confirm: true,
};
