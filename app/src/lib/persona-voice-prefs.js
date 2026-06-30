// =============================================================================
// persona-voice-prefs — per-persona DEVICE-VOICE override (persisted, per device)
// =============================================================================
// WHY (root-caused 2026-07-01 from Darrell's report): "it still only plays a female
// voice for Darrell" and "does everything except save the voice for use." The auto
// gender-mapping (lib/voice-assignment.js) picks a male device voice for a male
// persona — BUT only when this device's speechSynthesis voices are name-classifiable
// as male. On some phones the male voices other apps use aren't named in a way our
// heuristic recognizes, so Darrell's stand-in fell back to the default (female)
// voice, and re-guessing it on every read-aloud meant the choice never "stuck."
//
// This module lets the user PIN the exact device voice for a persona (chosen from
// the real speechSynthesis.getVoices() list, the same voices other apps use). The
// pin is the source of truth on read: deterministic, persisted, and APPLIED on every
// read-aloud — not re-derived each time. Auto-mapping remains the default; the pin
// only overrides it when set.
//
// Persistence is PER DEVICE (localStorage), on purpose: a voiceURI is specific to the
// device's installed voices (a URI on the phone may not exist on the laptop), so a
// per-device pin is the correct scope. The PERSONA SELECTION itself (which voice you
// chose) still syncs to the account via lib/reading-voice.js; this only refines which
// concrete device voice that selection speaks in, here. Pure + null-safe; every
// function degrades quietly (private mode / quota) rather than throwing.

const KEY = 'poe-persona-voice-overrides';

function store(injected) {
  if (injected) return injected;
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch (_) { return null; }
}

/** Load the { [catalogId]: voiceURI } pin map. Never throws; always an object. */
export function loadPersonaVoiceMap(injected) {
  const s = store(injected);
  if (!s) return {};
  try {
    const raw = s.getItem(KEY);
    if (!raw) return {};
    const m = JSON.parse(raw);
    if (!m || typeof m !== 'object') return {};
    const out = {};
    for (const [k, v] of Object.entries(m)) {
      if (typeof k === 'string' && typeof v === 'string' && v) out[k] = v;
    }
    return out;
  } catch (_) {
    return {};
  }
}

/**
 * Pin a device voiceURI for a catalog id (e.g. 'voice-dp' → 'Microsoft Mark …').
 * Passing a falsy voiceURI CLEARS the pin (reverts that persona to auto-mapping).
 * Returns the updated map. Never throws.
 */
export function savePersonaVoice(catalogId, voiceURI, injected) {
  const s = store(injected);
  const map = loadPersonaVoiceMap(injected);
  if (!catalogId) return map;
  if (voiceURI) map[catalogId] = String(voiceURI);
  else delete map[catalogId];
  if (s) {
    try { s.setItem(KEY, JSON.stringify(map)); } catch (_) { /* private mode / quota — non-fatal */ }
  }
  return map;
}

/** The pinned voiceURI for a catalog id, or null. Pure. */
export function personaVoiceOverride(map, catalogId) {
  return map && catalogId != null && typeof map[catalogId] === 'string' ? map[catalogId] : null;
}
