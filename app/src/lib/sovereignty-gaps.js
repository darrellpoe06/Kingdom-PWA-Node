// =============================================================================
// sovereignty-gaps — the recorded ledger of what we still need a vendor for
// =============================================================================
// Declared by Darrell 2026-07-10 (DR-0138): sovereign first — "we want to use it
// outside of vendor time allotment or when offline" — AND "source the vendor AI
// for things we can't do, with a record of when we need to and what we need to
// build and/or purchase, including building a local device capable of whatever
// we need."
//
// So a vendor is never an unrecorded habit: every capability we cannot yet serve
// from our own hardware is an OPEN GAP here, carrying (a) what we have locally
// today, (b) the vendor we source meanwhile (or the honest stand-in when no
// vendor is armed either), (c) the BUILD path — what to arm or build, on which
// of our own devices, and (d) the PURCHASE path where hardware is genuinely
// missing. Every gap keeps a re-review date (DR-0075). Closing a gap = the local
// path armed and verified — then the entry flips closed with evidence, and the
// vendor use ends.
//
// DERIVED WHERE A LIVE SOURCE EXISTS (DR-0121): the voice gap's live state reads
// the real endpoint config (voice-service.js), and the big-LLM gap reads the
// PLANNED_RIG record the Infra Plan renders — nothing re-typed.
// PURE (no React). Rendered beside the voice/reading surfaces; validated by
// sovereignty-gaps.test.js (proven-to-catch).
// =============================================================================
import { activeVoiceEndpoint } from './voice-service.js';
import { PLANNED_RIG } from './church-infra-plan.js';

export const GAPS_RECORDED = '2026-07-10';

export const GAP_STATUSES = ['open', 'closing', 'closed'];

// The ledger. Each entry is a capability, not a product: the question is always
// "can OUR OWN hardware serve this yet, and if not, what brings it home?"
export const SOVEREIGNTY_GAPS = [
  {
    id: 'gap-voice-clone',
    capability: 'Real cloned voices (Darrell, Bishop Gwin, the family) for read-aloud',
    localToday: 'Browser device voices only — gender-correct stand-ins work on every device, offline. The XTTS studio code is written for our RTX 4070 (infra/voice-studio, :8770) but has never been armed or probed.',
    vendorMeanwhile: 'The /api/voice-speak bridge (XTTS-v2 via Replicate) MAY be armed as the recorded fallback (VITE_VOICE_BRIDGE=1 + server token). Not armed today — so today the stand-in speaks, honestly labeled.',
    buildPath: 'Arm infra/voice-studio on tlcmediadpt (the LEFT 4070): run the studio container, set VITE_VOICE_SERVICE_URL to it. The standup steps are already written (2026-06-25 session notes). No new hardware needed — the 4070 runs XTTS-v2.',
    purchasePath: 'None — the device is already owned.',
    status: 'open',
    neededSince: '2026-06-24',
    reReview: '2026-07-24',
    drRef: 'DR-0138',
  },
  {
    id: 'gap-big-llm',
    capability: 'A large local LLM (70B+ class) for deep study/counsel work',
    localToday: 'qwen2.5:14b runs live on the RIGHT 4070 tower (~45 tok/s) — real, sovereign, offline. 12 GB VRAM per tower caps model size at the 14B class.',
    vendorMeanwhile: 'Keyless vendor slots exist in the provider register (DR-0132, llm-providers.js) with the honesty gate — used only when a key is present and the router allows; private work routes local-only.',
    buildPath: 'The planned sovereign rig shards a 70-120B model across pooled VRAM (see the Infra Plan). Verify the rig-sizing research before purchase.',
    purchasePath: PLANNED_RIG.name,
    status: 'open',
    neededSince: '2026-06-24',
    reReview: '2026-08-07',
    drRef: 'DR-0132',
  },
  {
    id: 'gap-video-gen',
    capability: 'Life-like long-form video generation for the media platform',
    localToday: 'FLUX.1-schnell image generation is standing up on the LEFT 4070 (in progress, Infra Plan). Short/image work will be sovereign; cinematic video is beyond current local hardware.',
    vendorMeanwhile: 'Not armed — no vendor video path is wired. The need is recorded ahead of use, per the doctrine.',
    buildPath: 'The 5x3090 rig MAY serve short-form with multi-GPU inference; the honest caveat stands — per-card 24 GB bounds a single render, and cinematic quality is likely still a cloud frontier with 2026 open weights.',
    purchasePath: 'Rig purchase gated on the video/rig-sizing research (do not buy against an unverified plan — Infra Plan caveat).',
    status: 'open',
    neededSince: '2026-05-29',
    reReview: '2026-08-21',
    drRef: 'DR-0135',
  },
];

// The LIVE state of the voice path (derived — never a re-typed claim): which
// endpoint would speak a cloned voice right now, if any.
export function liveVoicePath() {
  const ep = activeVoiceEndpoint();
  if (!ep) return { kind: 'stand-in', label: 'Device stand-in voices (offline-capable; no endpoint armed)' };
  if (ep.kind === 'sovereign') return { kind: 'sovereign', label: 'Sovereign studio (our own hardware — unmetered, offline-capable)' };
  return { kind: 'vendor', label: 'Vendor bridge (a RECORDED sovereignty gap — the studio build path closes it)' };
}

// The honesty gate (proven-to-catch): a gap is only a gap if it carries the
// record the doctrine demands.
export function validateGaps(gaps = SOVEREIGNTY_GAPS) {
  const errors = [];
  for (const g of gaps) {
    if (!GAP_STATUSES.includes(g.status)) errors.push(`${g.id}: unknown status "${g.status}"`);
    for (const k of ['capability', 'localToday', 'vendorMeanwhile', 'buildPath', 'purchasePath']) {
      if (!g[k] || !String(g[k]).trim()) errors.push(`${g.id}: missing ${k} — a vendor need without its record is not permitted (DR-0138)`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(g.reReview || ''))) errors.push(`${g.id}: missing re-review date (DR-0075)`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(g.neededSince || ''))) errors.push(`${g.id}: missing neededSince — WHEN we needed it is part of the record`);
    if (!/^DR-\d{4}$/.test(String(g.drRef || ''))) errors.push(`${g.id}: missing DR ref`);
    if (g.status === 'closed' && !g.evidence) errors.push(`${g.id}: a closed gap needs evidence the local path is armed and verified (DR-0076)`);
  }
  return { ok: errors.length === 0, errors };
}
