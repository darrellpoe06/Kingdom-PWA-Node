// =============================================================================
// voice-system-check — the voice system, checked in front of the person using it
// =============================================================================
// Darrell, 2026-09-22: "I want to use it asap and make sure it actually works
// be verified independently and dependencies be sure and documentation of this
// system is where? I want to be able to review it myself within the PoeTech App
// build."
//
// So this is not a status badge. It is the DEPENDENCY CHAIN of recording and
// playing a voice -- every link stated as a separate row with its own verdict, so he
// can see exactly which link is the one that is broken rather than being told
// "voice is unavailable" and left to guess.
//
// WHY IT EXISTS AT ALL. On 2026-09-22 a probe of the sovereign database found
// voice_profiles with ever_inserted = 1 -- one enrolment row in the entire life
// of that database -- while the app cheerfully said "Saved on this device" to
// anyone who recorded. Three separate links were failing silently:
//
//   * the Record control did not render for anyone outside a three-name map,
//   * the consent row was skipped when there was no instance id, with no word
//     said about it,
//   * and the studio endpoint could be dark while the copy promised a voice.
//
// Every one of those was invisible from inside the app. A person could not tell
// a system that was working from one that was not, which is the same class of
// defect as a surface that paints a number it cannot trace (DR-0061).
//
// THE RULES THIS FILE KEEPS:
//   1. Three verdicts, never two. 'pass' / 'fail' / 'unknown'. An UNKNOWN is a
//      real answer and never renders as fine (DR-0076 §8) -- "we have not asked
//      the studio yet" is different from "the studio is down", and a person
//      reading this needs to be able to tell them apart.
//   2. Every failing row carries a FIX in the person's own terms. A diagnosis
//      he cannot act on is a diagnosis that wasted his time.
//   3. Every row names WHERE IT IS DECIDED -- a file, a migration, a decision
//      record. That is the answer to "documentation of this system is where?":
//      it is not a separate document that drifts, it is a citation on the row
//      itself, rendered in the app beside the verdict.
//
// Pure. No React, no DOM, no network -- the caller measures, this decides.
// =============================================================================

export const PASS = 'pass';
export const FAIL = 'fail';
export const UNKNOWN = 'unknown';

/**
 * buildVoiceChecks — the dependency chain, in the order it actually runs.
 *
 * Every argument is something the CALLER measured this render. Nothing in here
 * asks the network or the database; it turns measurements into verdicts, which
 * is what makes the whole thing testable without a microphone or a server.
 *
 * @param {object}  m
 * @param {boolean} m.signedIn        an auth session exists on this device
 * @param {string}  m.enrolKey        the person_key enrolment would use ('' = none)
 * @param {string|null} m.instanceId  the family/church space, or null
 * @param {boolean} m.reviewerMode    reviewing production as a visitor
 * @param {boolean} m.recorderSupported  MediaRecorder + getUserMedia present
 * @param {boolean} m.sampleOnDevice  a saved reference exists in IndexedDB here
 * @param {boolean} m.consentRow      a voice_profiles row exists for this person
 * @param {'up'|'down'|'unknown'} m.studioHealth   what the studio ANSWERED
 * @param {boolean} m.bridgeKey      this device holds the bearer /speak requires
 * @param {'present'|'provisioned'|'none'|'unknown'} m.bridgeProvision  what
 *        asking the family for the key returned (bridge-provision.js): the
 *        device already had it, fetched it just now, got nothing (signed out,
 *        not a family member, or no steward has published it yet), or has not
 *        asked yet
 */
export function buildVoiceChecks(m = {}) {
  const {
    signedIn = false, enrolKey = '', instanceId = null, reviewerMode = false,
    recorderSupported = false, sampleOnDevice = false, consentRow = false,
    studioHealth = 'unknown', bridgeKey = false, bridgeProvision = 'unknown',
  } = m;

  const rows = [];

  rows.push({
    id: 'signed-in',
    label: 'You are signed in on this device',
    state: signedIn ? PASS : FAIL,
    detail: signedIn
      ? `Enrolment would use the key ${enrolKey || '(none)'}.`
      : 'A voice belongs to a person, so there is nobody to attach one to yet.',
    fix: signedIn ? '' : 'Sign in, then come back to this tab.',
    where: 'poe-financial-mvp-v28.jsx (personaOf) · lib/voice-sync.js (personKeyFor)',
  });

  rows.push({
    id: 'not-reviewing',
    label: 'You are not in reviewer mode',
    state: reviewerMode ? FAIL : PASS,
    detail: reviewerMode
      ? 'Reviewer mode looks at the app as a visitor, so recording is turned off on purpose — a review must never write a real consent record.'
      : 'Recording writes a real consent record, which is correct here.',
    fix: reviewerMode ? 'Turn reviewer mode off in Admin → Actions to record your own voice.' : '',
    where: 'DR-0104 · lib/reviewer-mode.jsx',
  });

  rows.push({
    id: 'browser',
    label: 'This browser can record audio',
    state: recorderSupported ? PASS : FAIL,
    detail: recorderSupported
      ? 'MediaRecorder and microphone access are available.'
      : 'This browser does not expose audio recording to a web page.',
    fix: recorderSupported ? '' : 'Try Chrome or Safari — on a phone, the built-in browser usually works.',
    where: 'lib/voice-recording.js',
  });

  rows.push({
    id: 'instance',
    label: 'Your account belongs to a family or church space',
    state: instanceId ? PASS : FAIL,
    detail: instanceId
      ? 'Your consent record has somewhere to live.'
      : 'Without a space, the consent record CANNOT be written — this is the link that used to fail in silence, leaving a sample on the device and nothing in the database.',
    fix: instanceId ? '' : 'Ask the Governor to add this account to a space; until then a recording stays on this device only.',
    where: 'migration 0047 (instance_id NOT NULL) · lib/table-sync.js (getInstanceId)',
  });

  rows.push({
    id: 'sample',
    label: 'A voice sample is saved on THIS device',
    state: sampleOnDevice ? PASS : FAIL,
    detail: sampleOnDevice
      ? 'The recording lives in this browser’s own storage. It never left the device.'
      : 'Nothing has been recorded in this browser yet.',
    fix: sampleOnDevice ? '' : 'Use the Record tab — about thirty seconds of reading.',
    where: 'lib/voice-reference.js (IndexedDB poe-voice/references)',
  });

  rows.push({
    id: 'consent-row',
    label: 'Your consent is recorded in the database',
    state: consentRow ? PASS : (signedIn ? FAIL : UNKNOWN),
    detail: consentRow
      ? 'An auditable row says you agreed, and it follows you to other devices.'
      : signedIn
        ? 'No row for you yet. The sample on a device is not a consent record, and only the row crosses devices.'
        : 'Cannot be checked until you are signed in.',
    fix: consentRow ? '' : 'Record and save in the Record tab; saving writes the row in the same gesture.',
    where: 'migration 0047 (voice_profiles, self-consent RLS) · lib/voice-sync.js',
  });

  rows.push({
    // THE LINK THIS CHAIN WAS MISSING (Darrell 2026-09-22: "Didn't work!!!!!!"
    // with this very panel showing All 7 checks pass).
    //
    // The panel probed GET /health, which takes no authentication, and called
    // the studio good. The read calls POST /speak, which the NAS-side forwarder
    // gates on the family bridge bearer. That token lives in localStorage and
    // is PER-DEVICE BY DESIGN (nas-photos.js: "a device credential, never
    // synced"), so a device that was never provisioned answers the probe
    // perfectly and is refused at the door -- and the chain built to name the
    // broken link had no row for the link that was broken.
    //
    // AND THE FIX IS NOT A CHORE (DR-0574). The key provisions ITSELF on a
    // signed-in family device through the RLS-deny-all + SECURITY DEFINER RPC
    // pair (migration 0128; bridge-provision.js). The first version of this
    // row told the person to "provision this device" by hand while that
    // machine path existed and only Real Estate ever ran it. The studio and
    // the read now ask for the key themselves; this row reports what came
    // back, and names the one human step that remains -- a steward publishes
    // the key once -- only when the family genuinely has none published.
    id: 'bridge-key',
    label: 'This device holds the family key the studio requires',
    state: bridgeKey ? PASS : FAIL,
    detail: bridgeKey
      ? (bridgeProvision === 'provisioned'
        ? 'This device asked the family for the key and received it just now. POST /speak will be sent with it.'
        : 'POST /speak will be sent with this device\u2019s key.')
      : 'The studio can answer its health check and still refuse to read, because /speak is gated on a key this device does not have. The key never syncs between devices, so having it on your phone says nothing about this browser.',
    fix: bridgeKey ? ''
      : !signedIn ? 'Sign in. A signed-in family device asks the family for the key itself; until then reads fall back to the labelled stand-in voice.'
        : bridgeProvision === 'none'
          ? 'This device asked the family for the key itself and got none: either no steward has published it yet (a steward pastes it once in Real Estate \u2192 Photos, and every family device picks it up from then on), or this account is not a member of a family space. Until then reads fall back to the labelled stand-in voice.'
          : 'This device asks the family for the key itself the moment you open the studio signed in; if this row is still failing after a moment, reopen the tab.',
    where: 'infra/voice-studio/voice_forwarder.py (401) \u00b7 lib/bridge-provision.js (get_family_bridge_token, migration 0128) \u00b7 lib/nas-photos.js (bridgeToken)',
  });

  rows.push({
    id: 'studio',
    label: 'The voice studio answers',
    state: studioHealth === 'up' ? PASS : studioHealth === 'down' ? FAIL : UNKNOWN,
    detail: studioHealth === 'up'
      ? 'The service answered its health check. That is not the same as a read succeeding — see the key row above, which is what /speak is actually gated on.'
      : studioHealth === 'down'
        ? 'The service did not answer. Everything else can still be done now; the reading plays in a labelled stand-in voice until it is back.'
        : 'It has not been asked yet on this screen.',
    fix: studioHealth === 'down' ? 'Nothing for you to do — recording now still works, and your voice turns on when the service is back.' : '',
    where: 'DR-0440 · lib/voice-service.js (probeVoiceService)',
  });

  return rows;
}

/**
 * The one-line verdict for the whole chain, from the rows themselves rather
 * than from a second opinion that could disagree with what is on the screen.
 * A chain with an UNKNOWN in it is never called working.
 */
export function overallVerdict(rows = []) {
  if (!rows.length) return { state: UNKNOWN, text: 'Nothing has been checked.' };
  const failed = rows.filter((r) => r.state === FAIL);
  const unknown = rows.filter((r) => r.state === UNKNOWN);
  if (failed.length) {
    return {
      state: FAIL,
      text: `${failed.length} of ${rows.length} checks did not pass. The first one to fix is: ${failed[0].label}.`,
    };
  }
  if (unknown.length) {
    return {
      state: UNKNOWN,
      text: `${rows.length - unknown.length} of ${rows.length} checks pass and ${unknown.length} could not be answered yet. Not calling that working.`,
    };
  }
  return { state: PASS, text: `All ${rows.length} checks pass. Record, save, and it reads in your voice.` };
}

/**
 * Where this system is written down. Rendered in the app, next to the checks,
 * because "the documentation is in the repo" is not an answer to somebody
 * holding a phone.
 */
export const VOICE_SYSTEM_DOCS = [
  { id: 'dr-0047', label: 'The table and the self-consent rule', where: 'infra/supabase/migrations-auto/0047-voice-profiles.sql' },
  { id: 'dr-0430', label: 'Voice and likeness teach the lessons — consent, labelling', where: 'docs/decisions/DR-0430-*.md' },
  { id: 'dr-0440', label: 'Ready means ANSWERING — the studio is asked, never assumed', where: 'docs/decisions/DR-0440-*.md' },
  { id: 'sample', label: 'Where a recorded sample is stored, and its limits', where: 'app/src/lib/voice-reference.js' },
  { id: 'enrol', label: 'Who may enrol, and under what key', where: 'app/src/lib/voice-sync.js' },
];
