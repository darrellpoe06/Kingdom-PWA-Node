// =============================================================================
// voice-assignment — map each picker option to a DISTINCT, gender-correct device
// voice (the labeled stand-in mapping)
// =============================================================================
// Darrell: "all the voices are the same female even when choosing a man." Cause:
// the System voice and every personal STAND-IN fell through to the one device
// default voice, so a man, a woman, and the default all sounded identical. This
// module fixes that WITHOUT a real clone (the GPU endpoint is still pending — see
// voice-registry bright line 2): it enumerates the device's actual speechSynthesis
// voices and assigns a different, gender-appropriate one to each catalog option, so
//   • a male person (Darrell, Bishop Gwin) reads in a MALE device voice,
//   • a female person (Christina) reads in a FEMALE device voice,
//   • two different people get two DIFFERENT voices when the device has enough.
// Everything stays clearly labeled AI / stand-in; this only chooses WHICH preset
// timbre stands in until the real cloned voice is live.
//
// Pure + unit-tested. Platforms expose different voice sets (iOS: Samantha/Daniel/
// Aaron…, Android: locale-named, Windows: Microsoft David/Mark/Zira, Chrome: Google
// … Male/Female), so gender is inferred from the explicit "male"/"female" token when
// present and a cross-platform name table otherwise; unknown-gender voices are still
// used to keep options DISTINCT.
import { pickDefaultVoice } from './tts.js';
import { KIND } from './voice-registry.js';

// Known male/female first names across the common TTS engines. Lowercased; matched
// on word boundaries so "male" inside "female" never misfires (and we test the
// explicit female/male token first regardless).
const MALE_NAMES = /\b(david|mark|guy|davis|alex|daniel|fred|tom|thomas|aaron|arthur|george|james|oliver|gordon|reed|rocko|eddy|albert|bruce|junior|diego|jorge|carlos|paul|richard|liam|nathan|ryan|brian|eric|rishi|ravi|prabhat|hemant|lee|oliver|william|henry|jacques|thomas|matteo|luca)\b/;
const FEMALE_NAMES = /\b(zira|jenny|aria|michelle|samantha|victoria|karen|moira|tessa|fiona|susan|allison|ava|serena|kate|catherine|nora|veena|heera|sandy|shelley|linda|hazel|amelie|anna|joana|luciana|paulina|monica|marie|amira|nicky|emily|olivia|sophia|emma|mia|raveena|kalpana|swara|isha|neerja|elsa|paloma|alice|kanya|yuna|sora)\b/;

/**
 * Classify a SpeechSynthesisVoice (or any { name, voiceURI }) as 'male' | 'female' |
 * 'unknown'. Explicit male/female/man/woman tokens win; then the name table.
 */
export function classifyVoiceGender(voice) {
  const s = `${(voice && voice.name) || ''} ${(voice && voice.voiceURI) || ''}`.toLowerCase();
  if (/\b(female|woman|women|girl)\b/.test(s)) return 'female';
  if (/\b(male|man|men|boy|guy)\b/.test(s)) return 'male';
  if (FEMALE_NAMES.test(s)) return 'female';
  if (MALE_NAMES.test(s)) return 'male';
  return 'unknown';
}

/** English voices first (the app reads English), preserving the rest after them. */
function englishFirst(voices) {
  const list = (Array.isArray(voices) ? voices : []).filter(Boolean);
  const en = list.filter((v) => /^en/i.test((v && v.lang) || ''));
  return en.length ? en.concat(list.filter((v) => !/^en/i.test((v && v.lang) || ''))) : list;
}

function dedupeByUri(voices) {
  const seen = new Set();
  const out = [];
  for (const v of voices) {
    const uri = v && v.voiceURI;
    if (uri == null || seen.has(uri)) continue;
    seen.add(uri); out.push(v);
  }
  return out;
}

/**
 * Build a { [catalogVoiceId]: SpeechSynthesisVoice } assignment for a merged voice
 * catalog (System + personal voices from voice-registry) against the device's
 * available voices. Deterministic so the same device + catalog always map the same
 * way. Priority: (1) gender correctness, (2) distinctness.
 *
 * @param {Array} catalog  - mergeVoiceCatalog() output: [{ id, kind, gender, ... }]
 * @param {Array} available - speechSynthesis.getVoices() (or compatible)
 * @returns {Object} map of catalog id -> chosen voice (omitted when none available)
 */
export function buildStandInAssignments(catalog, available) {
  const out = {};
  const voices = dedupeByUri(englishFirst(available));
  if (!voices.length || !Array.isArray(catalog)) return out;

  const male = voices.filter((v) => classifyVoiceGender(v) === 'male');
  const female = voices.filter((v) => classifyVoiceGender(v) === 'female');
  const neutral = voices.filter((v) => classifyVoiceGender(v) === 'unknown');

  // The System voice is the most natural overall; people are offset away from it.
  const sys = pickDefaultVoice(voices, null);
  const sysUri = sys && sys.voiceURI;

  const norm = (g) => (g === 'male' || g === 'female' ? g : 'unknown');

  // Candidate device voices for a wanted gender: same-gender first, then the
  // gender-ambiguous voices. Cross-gender voices are used ONLY when the device has
  // none of the wanted gender at all (so a man never gets a clearly-female voice
  // while a male voice exists). Gender correctness is the hard rule; distinctness is
  // achieved by cycling within the pool.
  const candidatesFor = (g) => {
    const same = g === 'female' ? female : g === 'male' ? male : neutral;
    const pool = dedupeByUri([...same, ...neutral]);
    return pool.length ? pool : voices; // device lacks this gender → best-effort, still labeled stand-in
  };

  // Assign a group of same-gender people across the pool, cycling so different people
  // get different voices. Start one past the System voice when possible, so the first
  // person doesn't echo the System voice.
  const assignGroup = (items, pool) => {
    if (!items.length || !pool.length) return;
    const start = pool.length > 1 && pool[0] && pool[0].voiceURI === sysUri ? 1 : 0;
    items.forEach((item, i) => { out[item.id] = pool[(start + i) % pool.length]; });
  };

  const groups = { male: [], female: [], unknown: [] };
  for (const item of catalog) {
    if (!item) continue;
    if (item.kind === KIND.SYNTHETIC) { out[item.id] = sys || voices[0] || null; continue; }
    groups[norm(item.gender)].push(item);
  }
  assignGroup(groups.male, candidatesFor('male'));
  assignGroup(groups.female, candidatesFor('female'));
  assignGroup(groups.unknown, candidatesFor('unknown'));
  return out;
}

/**
 * Resolve the device voice to actually SPEAK with for a chosen catalog option,
 * returning its voiceURI (or undefined to let the engine use its default). Used by
 * the play paths so a stand-in is heard in its assigned, gender-correct voice.
 */
export function standInVoiceURI(assignments, catalogId) {
  const v = assignments && catalogId != null ? assignments[catalogId] : null;
  return v && v.voiceURI ? v.voiceURI : undefined;
}

/**
 * Pick a device voice that matches a wanted ACCENT/locale (e.g. 'en-GB', 'en-IN',
 * 'en-NG') and, where possible, a wanted gender — so the accent dropdown actually
 * changes the accent. Falls back to language-family, then gender-only, then null.
 */
export function voiceForLocale(available, localeWanted, gender = 'unknown') {
  const voices = dedupeByUri(englishFirst(available));
  if (!voices.length) return null;
  const want = String(localeWanted || '').toLowerCase().replace('_', '-');
  const langOf = (v) => String((v && v.lang) || '').toLowerCase().replace('_', '-');
  const family = want.split('-')[0];
  const genderOk = (v) => gender === 'unknown' || classifyVoiceGender(v) === gender;

  const exactGender = voices.filter((v) => langOf(v) === want && genderOk(v));
  if (exactGender.length) return exactGender[0];
  const exact = voices.filter((v) => langOf(v) === want);
  if (exact.length) return exact[0];
  const famGender = voices.filter((v) => langOf(v).split('-')[0] === family && genderOk(v));
  if (famGender.length) return famGender[0];
  const fam = voices.filter((v) => langOf(v).split('-')[0] === family);
  if (fam.length) return fam[0];
  return null;
}
