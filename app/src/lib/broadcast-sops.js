// =============================================================================
// broadcast-sops — the POV Sequence / SOP Library for the broadcast team
// =============================================================================
// Darrell 2026-06-16: he ordered Meta smart glasses for POV (point-of-view, first-
// person) capture. Each station's REAL procedure gets recorded first-person and
// becomes course content: a per-station CLIP paired with a written STEP-CHECKLIST.
// Deacon Wright's founding sequences are captured too — turning tacit, in-his-head
// expertise into transferable, recorded SOPs (the "teach the next group" goal).
//
// REALITY-TRACE (DR-0076 — nothing painted): the clips do NOT exist yet. The
// glasses are newly ordered and the exact capture specs (clip length / resolution /
// whether it livestreams) are TBD until Darrell confirms the model. So every clip
// here carries clip.status === 'pending-capture' and NO fake media URL — the in-app
// library shows "not captured yet," honestly, until a real clip is pulled in. What
// IS real today is the written checklist (the authored procedure) and the reserved
// structure (one clip slot + one checklist per sequence). When a real clip lands on
// the sovereign store, set clip.status='captured' + clip.src and it lights up.
//
// SOVEREIGN PIPELINE (the Charter; AI-FOUNDATION-INTERNAL-OPERATIONS): the glasses
// are CAPTURE-ONLY. Raw media is pulled OFF the device into the family NAS /
// sovereign store, then transcribed, captioned, and indexed by the LOCAL LLM (the
// same Ollama-on-the-NAS path the rest of the app uses) — NOT Meta's cloud or
// Meta's A.I. Step-checklists are auto-drafted from the transcript, then a human
// corrects them. No raw POV media or transcript leaves the sovereign store.
//
// CONSENT / NO-SURVEIL (COMMUNITY-FIRST-MISSION; DATA-AS-EMPOWERMENT-NOT-EXTRACTION):
// the lens captures the TEAM and the PROCEDURES — the gear, the booth, the hands on
// the controls. It does NOT capture the congregation. This is a training-capture
// tool, never a surveillance one; that bright line is stated on the surface.
// =============================================================================

// The capture/processing contract — kept as data so the in-app surface and the
// facilitator export describe the SAME pipeline, and so the device specs can be
// filled in later without touching any rendering code (flexible by design).
export const SOP_CAPTURE_PIPELINE = {
  device: 'Ray-Ban Meta (Gen 2) smart glasses',
  captureOnly: true, // the glasses capture; they do not process or decide
  // Gen 2 specs VERIFIED 2026-06-16 (Meta Newsroom + Meta Store). The library
  // structure does not depend on exact numbers — they fill these fields flexibly.
  // (Note: Gen 2 captures up to 3K, higher than the ~1080p first estimate.)
  deviceSpec: {
    resolution: 'up to 3K Ultra HD — modes: 3K@30fps, 1440p@30fps, 1200p@60fps (12MP ultrawide)',
    clipLength: 'up to ~3 minutes per clip — chain multiple clips for a longer sequence',
    multiClip: true, // long procedures = several chained ~3-min clips, stitched on ingest
    audio: 'open-ear mics; hands-free "Hey Meta" voice command to start/stop capture',
    livestream: 'device supports IG/FB live, but that path is NOT used for the sovereign content pipeline (capture-only → NAS)',
    battery: 'up to ~8 hrs; ~50% in ~20 min; charging case adds ~48 hrs — charge between sequence sessions',
    verifiedAt: '2026-06-16',
    source: 'Meta Newsroom + Meta Store (Ray-Ban Meta Gen 2)',
  },
  steps: [
    'Capture first-person at the station with "Hey Meta" voice command — the team and the gear, never the congregation.',
    'For a long procedure, chain several ~3-min clips in order (the ~3-min cap means long sequences are multi-clip).',
    'Pull the raw media OFF the glasses into the family NAS / sovereign store (capture-only device; charge between sessions).',
    'The LOCAL LLM (Ollama on the NAS) transcribes + captions + indexes it — never Meta’s cloud or A.I. for content.',
    'Auto-draft a step-checklist from the transcript; a human corrects and approves it.',
    'Index the clips + checklist into this Sequence / SOP Library for the next operator.',
  ],
  sovereign: true,
  consent: 'Captures the team and the procedures only. Never the congregation. A training tool, not surveillance.',
};

// Stable clip-slot shape for a not-yet-captured sequence. No media URL is invented
// (DR-0076): the surface reads this and shows "not captured yet," not a fake clip.
const pendingClip = (note = '') => ({
  status: 'pending-capture',
  src: null,
  capturedAt: null,
  transcriptIndexed: false,
  note: note || 'POV clip not captured yet — pending the smart-glasses capture.',
});

// The library: one sequence per real station procedure. `steps` is the authored,
// real checklist that pairs with the (future) POV clip. `owner` is the team member
// whose station it is. `founding` marks Deacon Wright's originating sequences.
export const SOP_SEQUENCES = [
  {
    id: 'sop-service-open',
    station: 'Service open',
    owner: 'Clifton (with the Bishop)',
    title: 'Opening the broadcast — prayer and go-live',
    why: 'The broadcast opens the way the service opens: in prayer. Capture the exact go-live moment so the open is the same, reverent, every time.',
    steps: [
      'Confirm the whole chain is live and the stream is healthy before the call to begin.',
      'Clifton opens in prayer over the broadcast and the team.',
      'Signal the director (Bradley) that the service is beginning.',
      'Hold the opening shot steady; let the moment breathe before the first switch.',
    ],
    clip: pendingClip(),
  },
  {
    id: 'sop-obs-switching',
    station: 'OBS — switching & the look',
    owner: 'Bradley',
    title: 'Running OBS — scenes, switching, and the overall look',
    why: 'The director’s craft is mostly invisible judgment. Capturing it first-person turns "Bradley just knows when to cut" into something a new operator can learn.',
    steps: [
      'Load the service scene collection; verify each scene’s sources are live (camera, slides, lower-thirds, audio).',
      'Pre-build the next scene before it is needed (anticipate the run of service).',
      'Switch on natural beats; prefer a clean cut; resist over-cutting.',
      'Keep the look calm and intentional — the congregation should feel carried, not jostled.',
      'Watch the program output continuously; recover gracefully from any source drop.',
    ],
    clip: pendingClip(),
  },
  {
    id: 'sop-blackmagic-framing',
    station: 'Main 4K camera',
    owner: 'Chris',
    title: 'Framing & exposing the main Blackmagic 4K',
    why: 'The image is born here; nothing downstream can fix a soft or blown-out shot. Capture how Chris sets and holds the main pulpit frame.',
    steps: [
      'Power up and confirm the SDI feed reaches the switcher, the Sanctuary screens, and the Bishop’s monitor.',
      'Frame the pulpit; set and lock focus on the speaker.',
      'Set exposure so the face is clear and evenly lit — not crushed dark, not blown out.',
      'Hold the shot steady; make moves slow and deliberate.',
      'Coordinate with lighting before service — one verbal check that the face reads well on camera.',
    ],
    clip: pendingClip(),
  },
  {
    id: 'sop-lighting-scenes',
    station: 'Lighting',
    owner: 'Isaiah & Coreyon',
    title: 'Setting the lighting scenes for camera',
    why: 'The camera records light, not rooms. Capture the board moves that make the pulpit read clean and even on every screen.',
    steps: [
      'Bring up the pulpit wash; watch the main camera’s picture, not just the room.',
      'Set an even level on the speaker’s face — avoid hotspots and shadow on half the face.',
      'Set the scene presets the service uses (open, sermon, altar call, close).',
      'Do the verbal check with the camera op: "does the face read clean on camera?"',
      'Note any fixture that is out or uneven for follow-up — reliability over a one-time good look.',
    ],
    clip: pendingClip(),
  },
  {
    id: 'sop-videowall-powerup',
    station: 'Video wall / Sanctuary screens',
    owner: 'Video-wall team (left & right machines)',
    title: 'Powering up and installing the video wall',
    why: 'The left and right machines (RTX 4070 GPUs) drive the Sanctuary screens. Capture the power-up and install order so a newcomer brings it up correctly, every time.',
    steps: [
      'Power up in order: displays, then the left and right machines, then the signal source.',
      'Confirm each machine outputs to its screen and the GPU (not just the CPU) is carrying the display.',
      'Verify the main camera feed reaches the wall and matches what the room and the Bishop see.',
      'Check encoder/NVENC and network are healthy before relying on the wall live.',
      'For an install: document cabling (SDI vs network vs power) and label every run.',
    ],
    clip: pendingClip(),
  },
  {
    id: 'sop-founding-cameras',
    station: 'Founding sequences',
    owner: 'Deacon Wright',
    founding: true,
    title: 'The founding setup — how the cameras began with the Bishop',
    why: 'Deacon Wright started the video cameras for the TV broadcast with the Bishop. His originating knowledge is the most important to capture — record the founding sequences so this work outlasts any one of us and the next group can carry it.',
    steps: [
      'Walk the original camera placement and why each position was chosen.',
      'Capture the founding run-of-show: how the broadcast was opened, run, and closed from the start.',
      'Record the hard-won fixes — the problems solved over the years that live only in his memory.',
      'Name who he would hand each part to next, and what they must know.',
      'Pair the recording with a written checklist so the founding wisdom becomes a transferable SOP.',
    ],
    clip: pendingClip('Founding sequences — the priority capture for multiplication. Pending the smart-glasses capture.'),
  },
];

// Small live summary of the library for the surface header (real counts, not
// painted): how many sequences are reserved vs how many clips are actually
// captured. Today every clip is pending, so captured === 0 — and the surface
// says so honestly rather than implying a full library exists.
export function sopLibrarySummary(sequences = SOP_SEQUENCES) {
  const total = sequences.length;
  const captured = sequences.filter((s) => s.clip && s.clip.status === 'captured').length;
  return { total, captured, pending: total - captured };
}

// Append the SOP library to a course's facilitator export (Markdown), so the paper
// curriculum carries the reserved sequences + their real checklists + the pipeline
// + the consent line. Called by exportBroadcastCurriculumMarkdown.
export function sopLibraryMarkdown(sequences = SOP_SEQUENCES, pipeline = SOP_CAPTURE_PIPELINE) {
  const lines = [];
  lines.push('## Sequence / SOP Library — POV capture');
  lines.push('');
  lines.push('Each station’s real procedure is captured first-person (POV) and paired with a written step-checklist. The clips are captured with the smart glasses; until then, the checklists below stand on their own.');
  lines.push('');
  lines.push('**Sovereign pipeline.** ' + pipeline.steps.map((s, i) => `(${i + 1}) ${s}`).join(' '));
  lines.push('');
  lines.push('**Consent.** ' + pipeline.consent);
  lines.push('');
  sequences.forEach((s) => {
    lines.push(`### ${s.title}`);
    lines.push(`*${s.station} · ${s.owner}${s.founding ? ' · founding sequence' : ''}*`);
    lines.push('');
    if (s.why) { lines.push(`_${s.why}_`); lines.push(''); }
    lines.push(`**Clip:** ${s.clip.status === 'captured' ? 'captured' : 'not captured yet (pending POV capture)'}`);
    lines.push('');
    lines.push('**Checklist**');
    s.steps.forEach((st) => lines.push(`- ${st}`));
    lines.push('');
  });
  return lines.join('\n');
}
