// =============================================================================
// broadcast-adjustments — Christina's live-broadcast review (COLG livestream)
// =============================================================================
// Pure data (single source: the in-app Broadcast surface + the doc + the
// proven-to-catch test read from here). This is a REVIEWER'S punch list for the
// COLG online broadcast (YouTube + Facebook), captured from Christina Poe's
// critique of a live service and relayed by Darrell 2026-07-14.
//
// WHY THIS EXISTS: Christina reviews the broadcast the way a viewer at home
// meets it (the DR-0104 "review the live production push" posture, applied to a
// weekly service). Her notes are two kinds: an AUDIO MIX correction (relative
// levels the front-of-house operator sets on the Yamaha TF5) and a VIDEO CUE
// convention (when the switch operator reveals the choir on the program). Both
// are recurring STANDARDS for the team, not one-off wall-install notes — so
// they live beside the booth as-built, addressed to the operator's station.
//
// STATION MAP (from led-wall-golive.js BOOTH_AS_BUILT, verified 2026-07-05):
//   • Audio  -> Yamaha TF5 digital console (front-of-house), the audio operator.
//   • Video  -> the ONLINE-broadcast program on the RIGHT CUDA tower (OBS, and/
//     or the ATEM once its software is back). The switch operator holds/reveals
//     scenes there. The "fire / holding graphic" is a full-frame program SCENE
//     on that path — NOT the LED-wall Freeze (a separate surface).
//
// VERIFY-NOT-CLAIM (DR-0076): these are the reviewer's DIRECTIVES (what she
// asked for), not a claim that the mix has been changed. `status: 'requested'`
// until an operator confirms it was set and a reviewer signs off — then the
// history line records who/when. Nothing here says "done."
// =============================================================================

export const BROADCAST_REVIEW = {
  reviewer: 'Christina Poe',
  relayedBy: 'Darrell',
  capturedOn: '2026-07-14',
  service: 'The Church of the Living God — Sunday online broadcast (YouTube + Facebook)',
  posture:
    'Reviewed as a viewer meets it at home (DR-0104). The notes are relative ' +
    'targets and a switching convention for the team — recurring standards, ' +
    'addressed to the operator at each station.',
  source: 'Christina Poe\'s critique of the live broadcast, relayed by Darrell — 2026-07-14.',
};

// --- AUDIO MIX — relative levels on the Yamaha TF5 (front-of-house) -----------
// Christina's words: "turn the saxophone down"; "bring the choir up to match a
// little lower than the lead singer — right now the choir is way lower than the
// lead singer." So the target is a RELATIVE relationship (choir sits just under
// the lead vocal), not an absolute fader number — the operator dials to the
// target by ear, service to service.
export const AUDIO_ADJUSTMENTS = [
  {
    id: 'sax-down',
    station: 'Yamaha TF5 — front-of-house audio',
    change: 'Turn the saxophone DOWN.',
    target: 'The sax sits under the vocals — present, not dominating the mix.',
    why: 'It is currently too hot on the broadcast; it competes with the lead and the choir.',
    how: 'Lower the saxophone channel fader (and check it in the broadcast/monitor bus, not only the room) until it supports rather than leads.',
    status: 'requested',
  },
  {
    id: 'choir-up',
    station: 'Yamaha TF5 — front-of-house audio',
    change: 'Bring the CHOIR UP — to sit just a little BELOW the lead singer.',
    target:
      'Choir a little lower than the lead vocal (lead still on top, choir full ' +
      'and present right under it). NOT level with the lead, and NOT the way ' +
      'it is now — the choir is currently WAY lower than the lead.',
    why: 'The choir is buried under the lead right now; it should read full behind the lead, not distant.',
    how: 'Raise the choir mics / choir group on the broadcast bus until the choir sits just under the lead vocal — a relative target set by ear, not a fixed number.',
    status: 'requested',
  },
];

// --- VIDEO CUE — the choir walk-in reveal convention --------------------------
// Christina's words: while the choir walks in, KEEP whatever is on the screen up
// so you cannot see the choir walking in; do NOT put the choir back on the
// broadcast visually as a choir until the choir is ALL in place and ready; THEN
// take the graphic down. "So once you see the choir, it looks like we've always
// been in place, ready to go." A hold-then-reveal cut on the PROGRAM path.
export const CHOIR_WALKIN_CUE = {
  id: 'choir-walkin-reveal',
  station: 'Online-broadcast program (right CUDA tower — OBS / ATEM) — the switch operator',
  principle:
    'The congregation at home should never see the choir walking in and getting ' +
    'set. Hold the full-frame holding graphic over the whole entrance; reveal the ' +
    'choir on the program ONLY when they are fully in place and ready — so the ' +
    'first time viewers see the choir, it looks like they were always set and ready to go.',
  // The ordered cue the operator runs, start to finish.
  steps: [
    'BEFORE the walk-in: on the broadcast program, come up on the full-frame holding graphic (the "fire" / motion background scene) — a full-frame program SCENE on the online path, not a lower-third and not the LED-wall Freeze.',
    'DURING the walk-in: HOLD that graphic full-frame. Do NOT cut to the choir while they are walking in or getting set — no wide shot, no IMAG of the entrance.',
    'WATCH the stage (off-program / preview or the room monitor), not the broadcast, to know when the choir is ALL in place and ready.',
    'ONLY WHEN the choir is fully set and ready: cut the choir onto the program and take the holding graphic DOWN — so the reveal shows them already in place, as if they had always been ready.',
  ],
  why:
    'A clean reveal protects the worship moment — viewers meet the choir composed ' +
    'and ready, not mid-shuffle. Same "decently and in order" posture the ' +
    'broadcast course teaches for switching (1 Corinthians 14:40).',
  guard:
    'The reveal is gated on the CHOIR being set, observed off-program — never on a ' +
    'timer. If in doubt, hold the graphic longer; an extra beat on the graphic ' +
    'always beats catching the choir not ready.',
  status: 'requested',
};

// Everything the surface + test read as one record.
export const BROADCAST_ADJUSTMENTS = {
  review: BROADCAST_REVIEW,
  audio: AUDIO_ADJUSTMENTS,
  video: [CHOIR_WALKIN_CUE],
};
