// =============================================================================
// voice-registry — the SOVEREIGN VOICE LAYER: which voice reads the content
// =============================================================================
// "Listen to anything" needs two things the browser-TTS primitive (lib/tts.js)
// does not decide: WHICH voice, and WHETHER we are allowed to use it. This module
// is that decision layer — pure, testable, and built around two bright lines the
// rest of the app must not cross:
//
//   1. CONSENT GATE — a real person's voice is NEVER cloneable/usable until that
//      person has explicitly consented (in-app self-consent). Darrell's own voice
//      is consented (building circle); BG / Christina / anyone else stays a mere
//      "invite to enroll" until they themselves opt in. (Binding rule, the
//      voice-clone consent record: infra/nas-sme-pipeline/intake-voice-clone-CONSENT.md)
//
//   2. NO-LIE PROVIDER GATE — we never play a browser/preset voice while CLAIMING
//      it is someone's real cloned voice. The actual cloned timbre needs the local
//      sovereign voice service (Voicebox / XTTS on the GPU box), which is a pending
//      spike — see docs/99-session-notes/2026-06-24-voicebox-sovereign-voice-layer-
//      research-review.md. Until that service is live, a personal voice resolves to
//      a STAND-IN preset voice, explicitly labeled as a stand-in. resolveVoiceProvider
//      is structurally incapable of returning real:true for a personal voice before
//      the service exists (DR-0076 verification doctrine — no claim without evidence).
//
// Voice as a SUBSCRIBER feature: personal (cloned) voices carry an entitlement;
// the free synthetic/system voice is always available. The owner / building circle
// is entitled; other users get personal voices with their subscription. The actual
// billing signal is injected (no billing engine is fabricated here) — isVoiceEntitled
// takes { subscribed, isOwner } so it slots onto real entitlement when it lands.
//
// This lane OWNS voice + cloning + consent + entitlement. PLAYBACK/controls stay in
// lib/tts.js + TTSControl.jsx (the TTS lane). The two meet at resolveVoiceProvider:
// it returns which engine + voice the player should drive, and the honest label.

export const KIND = { SYNTHETIC: 'synthetic', PERSONAL: 'personal' };

// Consent state machine for a personal voice. Self-consent only (a person enrolls
// their OWN voice). 'granted' is the ONLY state that unlocks cloning/use.
export const CONSENT = {
  NONE: 'none',           // never asked / not enrolled — "invite to enroll"
  REQUESTED: 'requested', // invited, awaiting their answer
  GRANTED: 'granted',     // they said yes — the only usable state
  DECLINED: 'declined',   // they said no
  REVOKED: 'revoked',     // previously granted, withdrawn (profile to be deleted)
};

export const ENTITLEMENT = { FREE: 'free', SUBSCRIBER: 'subscriber' };

// Where the timbre comes from when this voice is USED.
export const PROVIDER = {
  BROWSER: 'browser',           // Web Speech / preset (free, works today)
  SOVEREIGN_CLONE: 'sovereign-clone', // the real cloned timbre (needs the GPU service)
  NONE: 'none',                 // blocked (consent missing) — nothing plays
};

// -----------------------------------------------------------------------------
// Seed catalog. The system (free) voice plus the named candidate people whose
// voices are present in the COLG Wednesday Bible-study YouTube source + other
// discussions. CRUCIALLY: every personal seed starts at consent 'none'. No voice
// is pre-marked granted here — a 'granted' state ONLY ever comes from a real
// persisted enrollment row (a real consent action), never from this seed.
// -----------------------------------------------------------------------------
export const SYSTEM_VOICE = Object.freeze({
  id: 'system-default',
  kind: KIND.SYNTHETIC,
  personKey: null,
  name: 'System voice',
  description: 'The built-in reading voice — free, works on every device.',
  consentState: CONSENT.GRANTED, // synthetic: no person, nothing to consent to
  entitlement: ENTITLEMENT.FREE,
  providerHint: PROVIDER.BROWSER,
});

export const SEED_PERSONAL_VOICES = Object.freeze([
  {
    id: 'voice-dp', kind: KIND.PERSONAL, personKey: 'darrell',
    name: 'Darrell Poe', description: 'Darrell reading in his own voice.',
    circle: true, // building circle — he may enroll himself with one tap (already consented)
    consentState: CONSENT.NONE, entitlement: ENTITLEMENT.SUBSCRIBER,
    providerHint: PROVIDER.SOVEREIGN_CLONE,
  },
  {
    id: 'voice-cp', kind: KIND.PERSONAL, personKey: 'christina',
    name: 'Christina Poe', description: 'Christina reading in her own voice.',
    circle: true,
    consentState: CONSENT.NONE, entitlement: ENTITLEMENT.SUBSCRIBER,
    providerHint: PROVIDER.SOVEREIGN_CLONE,
  },
  {
    id: 'voice-bg', kind: KIND.PERSONAL, personKey: 'bishop-gwin',
    name: 'Bishop Lloyd E. Gwin', description: 'Bishop Gwin reading in his own voice.',
    circle: true,
    consentState: CONSENT.NONE, entitlement: ENTITLEMENT.SUBSCRIBER,
    providerHint: PROVIDER.SOVEREIGN_CLONE,
  },
]);

/**
 * Merge persisted enrollment profiles onto the seed catalog. A profile (a real
 * voice_profiles row) is authoritative for consent + entitlement of its personKey;
 * an enrolled person whose personKey is not in the seed is appended as a personal
 * voice. The seed's display fields are kept when the profile omits them.
 *
 * @param {Array} profiles - [{ personKey, displayName, consentState, entitlement,
 *                              providerHint, consentScope, consentAt, remoteId }]
 * @returns {Array} the full voice list (system first, then personal)
 */
export function mergeVoiceCatalog(profiles = []) {
  const byKey = new Map();
  for (const p of Array.isArray(profiles) ? profiles : []) {
    if (p && p.personKey) byKey.set(p.personKey, p);
  }
  const personal = SEED_PERSONAL_VOICES.map((seed) => {
    const p = byKey.get(seed.personKey);
    if (!p) return { ...seed };
    byKey.delete(seed.personKey);
    return {
      ...seed,
      name: p.displayName || seed.name,
      consentState: p.consentState || seed.consentState,
      entitlement: p.entitlement || seed.entitlement,
      providerHint: p.providerHint || seed.providerHint,
      consentScope: p.consentScope || null,
      consentAt: p.consentAt || null,
      remoteId: p.remoteId || null,
    };
  });
  // Enrolled people not in the seed (future voices: other family, future SMEs).
  for (const p of byKey.values()) {
    personal.push({
      id: `voice-${p.personKey}`,
      kind: KIND.PERSONAL,
      personKey: p.personKey,
      name: p.displayName || p.personKey,
      description: `${p.displayName || p.personKey} reading in their own voice.`,
      circle: false,
      consentState: p.consentState || CONSENT.NONE,
      entitlement: p.entitlement || ENTITLEMENT.SUBSCRIBER,
      providerHint: p.providerHint || PROVIDER.SOVEREIGN_CLONE,
      consentScope: p.consentScope || null,
      consentAt: p.consentAt || null,
      remoteId: p.remoteId || null,
    });
  }
  return [{ ...SYSTEM_VOICE }, ...personal];
}

// -----------------------------------------------------------------------------
// BRIGHT LINE 1 — consent. canCloneVoice is the single source of truth for "are
// we allowed to make/use a clone of this voice." Synthetic voices have no person,
// so they are always allowed; personal voices require GRANTED, nothing less.
// -----------------------------------------------------------------------------
export function canCloneVoice(voice) {
  if (!voice) return false;
  if (voice.kind === KIND.SYNTHETIC) return true;
  return voice.consentState === CONSENT.GRANTED;
}

/** Entitlement gate (voice as a subscriber feature). Free voices always pass. */
export function isVoiceEntitled(voice, { subscribed = false, isOwner = false } = {}) {
  if (!voice) return false;
  if (voice.entitlement === ENTITLEMENT.FREE) return true;
  return !!subscribed || !!isOwner; // owner / building circle entitled; others subscribe
}

/** A voice is selectable for reading only when BOTH gates pass. */
export function isVoiceSelectable(voice, ctx = {}) {
  if (!voice) return false;
  if (voice.kind === KIND.SYNTHETIC) return true;
  return canCloneVoice(voice) && isVoiceEntitled(voice, ctx);
}

// -----------------------------------------------------------------------------
// BRIGHT LINE 2 — the no-lie provider gate. Returns which engine + voice the
// player should drive AND an honest description. A personal voice can ONLY be
// real:true (cloned timbre) when consent is granted AND the sovereign service is
// live. Before that it is a labeled STAND-IN; with no consent it is BLOCKED.
// -----------------------------------------------------------------------------
export function resolveVoiceProvider(voice, { sovereignVoiceReady = false } = {}) {
  if (!voice || voice.kind === KIND.SYNTHETIC) {
    return { provider: PROVIDER.BROWSER, timbre: 'preset', real: true, standIn: false, blocked: false };
  }
  if (voice.consentState !== CONSENT.GRANTED) {
    return {
      provider: PROVIDER.NONE, timbre: 'none', real: false, standIn: false, blocked: true,
      reason: 'consent-required',
      note: 'This voice is not enrolled — it cannot be used until the person consents.',
    };
  }
  if (sovereignVoiceReady) {
    return { provider: PROVIDER.SOVEREIGN_CLONE, timbre: 'cloned', real: true, standIn: false, blocked: false };
  }
  // Consented, but the local voice studio is not live yet → honest stand-in.
  return {
    provider: PROVIDER.BROWSER, timbre: 'preset', real: false, standIn: true, blocked: false,
    note: 'Playing a stand-in preset voice (AI) — the cloned voice activates when the local voice studio is live.',
  };
}

/** The "AI-generated voice" label every personal voice must visibly carry. */
export function aiVoiceLabel(voice) {
  return voice && voice.kind === KIND.PERSONAL ? 'AI-generated voice' : null;
}

/** Human enrollment status for the UI. */
export function enrollmentStatus(voice) {
  if (!voice || voice.kind === KIND.SYNTHETIC) return { label: 'Always available', tone: 'ok' };
  switch (voice.consentState) {
    case CONSENT.GRANTED:  return { label: 'Enrolled · consent granted', tone: 'ok' };
    case CONSENT.REQUESTED:return { label: 'Invited · awaiting their consent', tone: 'pending' };
    case CONSENT.DECLINED: return { label: 'Declined', tone: 'off' };
    case CONSENT.REVOKED:  return { label: 'Consent withdrawn', tone: 'off' };
    default:               return { label: 'Not enrolled · invite to enroll', tone: 'pending' };
  }
}

// -----------------------------------------------------------------------------
// Consent transitions (pure). Self-consent: the WRITE side (voice-sync) enforces
// created_by = the acting user, so a person can only move their OWN voice. These
// validate the state machine; an illegal transition returns the voice unchanged
// with { ok:false }.
// -----------------------------------------------------------------------------
const TRANSITIONS = {
  request: { from: [CONSENT.NONE, CONSENT.DECLINED, CONSENT.REVOKED], to: CONSENT.REQUESTED },
  grant:   { from: [CONSENT.NONE, CONSENT.REQUESTED, CONSENT.DECLINED, CONSENT.REVOKED], to: CONSENT.GRANTED },
  decline: { from: [CONSENT.NONE, CONSENT.REQUESTED], to: CONSENT.DECLINED },
  revoke:  { from: [CONSENT.GRANTED], to: CONSENT.REVOKED },
};

export function applyConsent(voice, action, { by = null, at = null, scope = null } = {}) {
  const t = TRANSITIONS[action];
  if (!voice || voice.kind !== KIND.PERSONAL || !t) return { ok: false, voice };
  if (!t.from.includes(voice.consentState)) return { ok: false, voice };
  const next = { ...voice, consentState: t.to };
  if (action === 'grant') {
    next.consentBy = by; next.consentAt = at; next.consentScope = scope || 'read-aloud-narration';
  }
  return { ok: true, voice: next };
}

// -----------------------------------------------------------------------------
// Per-device selected-voice preference (mirrors lib/tts.js prefs). Stores the
// chosen app-voice id so "listen to anything" remembers the reader you picked.
// -----------------------------------------------------------------------------
const CHOICE_KEY = 'poe-voice-choice';

export function loadVoiceChoice(store = (typeof localStorage !== 'undefined' ? localStorage : undefined)) {
  try {
    const raw = store && store.getItem(CHOICE_KEY);
    if (!raw) return SYSTEM_VOICE.id;
    const v = JSON.parse(raw);
    return v && typeof v.voiceId === 'string' ? v.voiceId : SYSTEM_VOICE.id;
  } catch (_) { return SYSTEM_VOICE.id; }
}

export function saveVoiceChoice(voiceId, store = (typeof localStorage !== 'undefined' ? localStorage : undefined)) {
  try { if (store) store.setItem(CHOICE_KEY, JSON.stringify({ voiceId: String(voiceId || SYSTEM_VOICE.id) })); }
  catch (_) { /* private mode / quota — non-fatal */ }
}
