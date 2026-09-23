// =============================================================================
// VoiceStudio — "listen to anything," in a voice you choose (and it PLAYS)
// =============================================================================
// The in-app surface for the sovereign voice layer (lib/voice-registry.js):
//   1. LISTEN TO ANYTHING — paste any message / lesson / passage and hear it read
//      aloud RIGHT NOW. Playback rides the shared TTS primitive (lib/tts.js); the
//      free System voice works on every device today.
//   2. CHOOSE A VOICE — the free System voice, or a personal (cloned) voice as a
//      subscriber feature. Tap "Sample" on any usable voice to hear it instantly.
//   3. CONSENT-GATED ENROLLMENT — Darrell may enroll HIS OWN voice; Bishop Gwin,
//      Christina, and anyone else appear as "invite to enroll" until THEY opt in.
//
// HONESTY (DR-0076): the real cloned timbre needs the local sovereign voice studio
// (lib/voice-service.js — Kokoro/Piper/XTTS on the GPU box). Until that endpoint is
// configured, a personal voice plays a clearly-labeled browser STAND-IN — never a
// browser voice pretending to be the person. When the studio is live the SAME UI
// routes to the real voice. Every path falls back to the System voice and NEVER
// fails silently (unbreakable).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTextToSpeech, RATE_STEPS, segmentText } from '../lib/tts.js';
import {
  mergeVoiceCatalog, isVoiceSelectable, canCloneVoice, resolveVoiceProvider,
  aiVoiceLabel, enrollmentStatus, loadVoiceChoice, saveVoiceChoice, KIND, CONSENT,
} from '../lib/voice-registry.js';
import { loadVoiceProfiles, enrollMyVoice, revokeMyVoice, enrollMyLikeness, revokeMyLikeness, personKeyFor, displayNameFor } from '../lib/voice-sync.js';
import { savePortrait, loadPortrait, hasPortrait, clearPortrait, isUsablePortrait } from '../lib/likeness-reference.js';
import { likenessConsented } from '../lib/teacher.js';
import {
  buildStandInAssignments, resolveVoiceURIForId, deviceVoiceOptions, hasVoiceOfGender, describeDeviceVoices,
} from '../lib/voice-assignment.js';
import { loadPersonaVoiceMap, savePersonaVoice } from '../lib/persona-voice-prefs.js';
import { isVoiceServiceReady, synthesizeSpeech, voiceServiceHealth, probeVoiceService, voiceErrorReason, isStudioRoadProblem } from '../lib/voice-service.js';
import { SOVEREIGNTY_GAPS, GAPS_RECORDED, liveVoicePath, liveLikenessPath } from '../lib/sovereignty-gaps.js';
import { useReadingVoice, personVoiceId, SYSTEM_VOICE_ID } from '../lib/reading-voice.js';
import {
  useVoiceRecorder, RECORD_SCRIPT, formatDuration, durationQuality, meetsMinDuration,
} from '../lib/voice-recording.js';
import {
  saveReference, loadReference, clearReference, blobToDataUri,
} from '../lib/voice-reference.js';
import { getInstanceId } from '../lib/table-sync.js';
import { hasBridgeToken } from '../lib/nas-photos.js';
import { provisionBridgeToken } from '../lib/bridge-provision.js';
import { supabase } from '../lib/supabase.js';
import SectionTabs from './SectionTabs.jsx';
import { buildVoiceChecks, overallVerdict, VOICE_SYSTEM_DOCS, PASS, FAIL } from '../lib/voice-system-check.js';
import { detectVoiceDevice, deviceVoiceRoute } from '../lib/device-voice-route.js';
import { isNativeShell } from '../lib/native-shell.js';

const SAMPLE = 'Welcome. This is your chosen reading voice. Paste any message, lesson, or passage below and press Read to hear it aloud in this voice.';
const SAMPLE_SHORT = 'For God so loved the world. The Lord is my shepherd; I shall not want.';

const PERSONA_NAME = { darrell: 'Darrell Poe', christina: 'Christina Poe', 'bishop-gwin': 'Bishop Lloyd E. Gwin' };

export default function VoiceStudio({ personaKey = null, isOwner = false, reviewerMode = false, sovereignVoiceReady: readyOverride }) {
  // THE STUDIO'S REAL STATE, SAID PLAINLY (DR-0440): not answering / answering /
  // not asked yet — asked, never assumed.
  const [studioHealth, setStudioHealth] = useState(() => voiceServiceHealth());
  useEffect(() => {
    let alive = true;
    probeVoiceService().then((h) => { if (alive) setStudioHealth(h); });
    return () => { alive = false; };
  }, []);
  // THE SAME DERIVATION THE READER USES (use-read-aloud.js), and for the same
  // reason. This was a default parameter reading isVoiceServiceReady() alone,
  // which became a constant `true` when /voice turned into a same-origin route.
  // Every consequence of that was a lie in the person's favour: the "your voice
  // is a stand-in until the studio is armed" panel could never render, the
  // recording notice always promised the real voice, and a personal voice was
  // sent to a studio that might be dark. A parameter default cannot see
  // studioHealth, so the prop becomes a pure override and the honest value is
  // derived here.
  const sovereignVoiceReady = readyOverride !== undefined
    ? readyOverride
    : (isVoiceServiceReady() && studioHealth !== 'down');
  // THE FIRST BRANCH USED TO BE `!isVoiceServiceReady()`, AND IT IS GONE
  // BECAUSE IT COULD NO LONGER RENDER. Once /voice became a same-origin route
  // the endpoint is derived from window.location, so the config check answers
  // true everywhere and that line was unreachable. Deleting it is not a loss:
  // it told the steward to point the build at VITE_VOICE_SERVICE_URL, and that
  // instruction was WRONG on its own terms — the studio speaks plain HTTP on
  // :8770, which an HTTPS page refuses as mixed content, so no value in that
  // variable could ever have worked from poetech.us. What is left is the only
  // question that is still open on any given day: does the studio ANSWER.
  const studioLine = studioHealth === 'down'
    ? 'The church\'s voice studio did not answer — your voice plays as the labelled stand-in until it does.'
    : studioHealth === 'up'
      ? 'The voice studio is armed and answering — your recorded voice reads new text.'
      : 'Asking the church\'s voice studio whether it is up…';
  const tts = useTextToSpeech();
  const { setVoiceId: setGlobalVoiceId } = useReadingVoice(supabase); // the ONE global pref
  const [profiles, setProfiles] = useState([]);
  const [userId, setUserId] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [instanceId, setInstanceId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [text, setText] = useState(SAMPLE);
  const [selectedId, setSelectedId] = useState(() => loadVoiceChoice());
  const [cloudPlaying, setCloudPlaying] = useState(false); // real cloned-voice audio in flight
  const audioRef = useRef(null);

  // THE ENROLMENT IDENTITY -- who this person is allowed to enrol AS.
  //
  // It used to be `personaKey` alone, a value that exists for exactly three
  // hardcoded names, and `showRecorder` was gated on it -- so for every other
  // signed-in person the Record section did not render AT ALL. Not hidden
  // behind a scroll: absent. Meanwhile migration 0047's own INSERT policy
  // already allows any member of the instance to create their OWN row. The app
  // was stricter than the rule it was enforcing, and the cost is measurable:
  // ever_inserted on voice_profiles was ONE, over the whole life of the
  // sovereign database (measured 2026-09-22 via sovereign-read).
  //
  // Now: a named persona keeps its historical key so nothing is orphaned, and
  // anybody else is keyed by their own auth id. Both from a pure helper, so the
  // rule lives in a test instead of inside a component.
  const enrolKey = personKeyFor({ personaKey, userId });
  const enrolName = displayNameFor({ personaKey, personaNames: PERSONA_NAME, user: authUser });

  // Record-your-voice enrollment (the recorded sample IS the clone reference).
  const recorder = useVoiceRecorder();
  const [myRefExists, setMyRefExists] = useState(false);
  // THE RECORDING STAYS, AND IT PLAYS (Darrell 2026-09-22: "Where does my voice
  // go after?!!! I would like to have access to it stay right there after the
  // recording!!!!!! Why not?!!!! Also where does it live on the device anywhy").
  //
  // saveRecording called recorder.reset(), which threw away the only playable
  // handle on the audio. The bytes were safe in IndexedDB the whole time and the
  // surface simply would not hand them back -- a line saying "saved" and no way
  // to hear it. This holds an object URL for the SAVED sample, read back out of
  // the store, so what is on the page is the thing that was actually persisted
  // rather than a leftover from the recorder.
  const [savedUrl, setSavedUrl] = useState('');
  // THE LIKENESS (DR-0430): his enrolled portrait, on this device, and the
  // consent stamp on his own row. Recording IS consent, exactly as the voice.
  const [myPortraitExists, setMyPortraitExists] = useState(false);
  const [portraitPreview, setPortraitPreview] = useState('');
  const [portraitFile, setPortraitFile] = useState(null);

  // Resolve identity + load enrollment rows (RLS-scoped to the caller's instance).
  useEffect(() => {
    let alive = true;
    (async () => {
      // The key is derived from the id this call just returned, NOT from the
      // userId state, which is still last render's value inside this closure.
      // Reading the stale one would look for a saved sample under the wrong key
      // on first load and report "no sample" to someone who has one.
      let key = personKeyFor({ personaKey, userId });
      // THE SESSION FIRST, AND THE REASON IS A REAL DEFECT (Darrell, 2026-09-22,
      // on the new "Does it work?" tab: "I'm signed in and it doesn't work!!!!!!!"
      // — the panel read FAIL on "You are signed in on this device" while the
      // header beside it showed his name and a LOG OUT button).
      //
      // getUser() is a NETWORK call to the auth server. getSession() reads the
      // session this device already holds. This component asked the network,
      // swallowed any failure, and left userId null — so a slow or unreachable
      // auth server rendered as "you are not signed in", which is a different
      // and much more alarming claim than the truth. The shell never had this
      // problem because it works from the stored session.
      //
      // So: the local session decides, and getUser() is only a top-up for the
      // profile metadata the display name reads. A failure there can no longer
      // make a signed-in person read as a stranger.
      try {
        const { data: sess } = await supabase.auth.getSession();
        const su = sess?.session?.user || null;
        if (su) {
          if (alive) { setUserId(su.id); setAuthUser(su); }
          key = personKeyFor({ personaKey, userId: su.id });
        }
      } catch (_) { /* no stored session — the getUser attempt below still runs */ }
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user && alive) { setUserId(data.user.id); setAuthUser(data.user); }
        if (data?.user) key = personKeyFor({ personaKey, userId: data.user.id });
      } catch (_) { /* network said nothing; the stored session already answered */ }
      try { const id = await getInstanceId(); if (alive) setInstanceId(id || null); } catch (_) { /* offline */ }
      const { profiles: rows } = await loadVoiceProfiles();
      if (alive && rows) setProfiles(rows);
      if (key) {
        try {
          const blob = await loadReference(key);
          if (alive) {
            setMyRefExists(!!blob);
            setSavedUrl((prev) => { if (prev) { try { URL.revokeObjectURL(prev); } catch (_) {} } return blob ? URL.createObjectURL(blob) : ''; });
          }
        } catch (_) { /* no sample yet */ }
      }
      if (key) {
        try {
          const has = await hasPortrait(key);
          if (alive) setMyPortraitExists(has);
          if (has && alive) { const b = await loadPortrait(key); if (b && alive) setPortraitPreview(URL.createObjectURL(b)); }
        } catch (_) { /* no portrait yet */ }
      }
    })();
    return () => { alive = false; };
  }, [personaKey, userId]);

  // Stop any cloud audio when the surface unmounts.
  useEffect(() => () => { if (audioRef.current) { try { audioRef.current.pause(); } catch (_) {} audioRef.current = null; } }, []);

  // THE KEY PROVISIONS ITSELF (DR-0574). The bridge-key row used to tell a
  // signed-in person to "provision this device" by hand while the machine
  // path already existed (bridge-provision.js, migration 0128) and only Real
  // Estate ever ran it. Run it here the moment a signed-in person opens the
  // studio without the key; the row then reports what actually happened —
  // present, provisioned just now, or none (not a family member, or no
  // steward has published the key yet) — rather than a chore.
  const [bridgeProvision, setBridgeProvision] = useState(() => (hasBridgeToken() ? 'present' : 'unknown'));
  useEffect(() => {
    if (!userId) { setBridgeProvision(hasBridgeToken() ? 'present' : 'unknown'); return undefined; }
    if (hasBridgeToken()) { setBridgeProvision('present'); return undefined; }
    let live = true;
    provisionBridgeToken(supabase).then((r) => { if (live) setBridgeProvision(r); });
    return () => { live = false; };
  }, [userId]);

  // DOES IT ACTUALLY WORK -- answered on the screen, from this render's own
  // measurements (Darrell 2026-09-22: "I want to be able to review it myself
  // within the PoeTech App build"). Nothing here is a claim; every row is a
  // value this component already holds, turned into a verdict by a pure
  // function that is tested separately.
  const checks = useMemo(() => buildVoiceChecks({
    signedIn: !!userId,
    enrolKey,
    instanceId,
    reviewerMode,
    recorderSupported: !!recorder.supported,
    sampleOnDevice: myRefExists,
    consentRow: !!profiles.find((x) => x.personKey === enrolKey),
    studioHealth,
    bridgeKey: hasBridgeToken(),
    bridgeProvision,
  }), [userId, enrolKey, instanceId, reviewerMode, recorder.supported, myRefExists, profiles, studioHealth, bridgeProvision]);
  const verdict = useMemo(() => overallVerdict(checks), [checks]);

  const voices = useMemo(() => mergeVoiceCatalog(profiles), [profiles]);
  const ctx = { isOwner, subscribed: isOwner }; // owner/building circle entitled; real billing slots in here
  const selected = voices.find((v) => v.id === selectedId) || voices[0];

  // Map each option to a DISTINCT, gender-correct device voice (the stand-in fix):
  // a man reads in a male voice, a woman in a female voice, different people sound
  // different — instead of everything falling through to the one default voice.
  const assignments = useMemo(() => buildStandInAssignments(voices, tts.voices), [voices, tts.voices]);

  // Per-persona device-voice PIN (persona-voice-prefs). When the auto gender-mapping
  // picks the wrong voice on a given phone, the user pins the right one here and it
  // persists + applies on every read-aloud. `overrides` is state so the dropdown +
  // playback update the instant a pin changes.
  const [overrides, setOverrides] = useState(() => loadPersonaVoiceMap());
  const deviceOptions = useMemo(() => deviceVoiceOptions(tts.voices), [tts.voices]);
  // WHAT THIS DEVICE ACTUALLY GAVE US, counted rather than promised.
  const voiceCensus = useMemo(() => describeDeviceVoices(tts.voices), [tts.voices]);
  // The voiceURI each option ACTUALLY speaks in right now (pin first, else auto).
  const resolvedURIFor = (v) => resolveVoiceURIForId(v.id, { assignments, overrides, available: tts.voices });
  const pinDeviceVoice = (catalogId, voiceURI) => {
    setOverrides(savePersonaVoice(catalogId, voiceURI || ''));
    // HEAR IT THE MOMENT IT IS PICKED (Darrell 2026-09-23: "Intuitive
    // Design!!!!!!"). A change that makes no sound leaves the person guessing
    // whether anything happened -- which, on a phone whose list is one voice
    // per language, was the exact experience: "changing the selection does not
    // change how it sounds". Now every pick speaks a line in the voice picked.
    if (tts.supported) { try { tts.speak(SAMPLE_SHORT, voiceURI || ''); } catch (_) { /* a silent pick is still a pick */ } }
  };
  // WHICH SETTINGS SCREEN, DEDUCED FROM THE DEVICE (Darrell 2026-09-23, three
  // screenshots of Samsung Settings searched for "voice" and finding nothing
  // that changes the reading voice: "How do we know which settings to
  // change?!!!!"). The old note said "Settings → Text-to-speech" as if every
  // phone filed it in the same place under a word a person would search for.
  // lib/device-voice-route.js answers per device: a one-tap door on Android in
  // a browser, the word to search, and the steps in the phone's own menu words.
  const voiceRoute = useMemo(() => deviceVoiceRoute(
    detectVoiceDevice(typeof navigator !== 'undefined' ? navigator.userAgent : ''),
    { nativeShell: typeof window !== 'undefined' && isNativeShell(window) },
  ), []);

  // Highlight-as-it-reads: the engine segments deterministically, so we segment the
  // SAME text and highlight the sentence the engine is currently speaking.
  const segments = useMemo(() => segmentText(text), [text]);
  const activeSeg = tts.isReading ? tts.segmentIndex : -1;

  const choose = (v) => {
    if (!isVoiceSelectable(v, ctx)) return;
    setSelectedId(v.id);
    saveVoiceChoice(v.id);
    // Make this the GLOBAL reading voice — honored by the floating control and
    // every reading page, saved to the account so it follows the user everywhere.
    setGlobalVoiceId(v.kind === KIND.PERSONAL ? personVoiceId(v.personKey) : SYSTEM_VOICE_ID);
    setNotice('');
  };

  const stopAll = () => {
    try { tts.stop(); } catch (_) {}
    if (audioRef.current) { try { audioRef.current.pause(); } catch (_) {} audioRef.current = null; }
    setCloudPlaying(false);
  };

  // Stop only any in-flight CLOUD audio. Used right before a fresh browser-voice
  // read: the TTS engine's own play() already cancels a prior utterance safely, so
  // we must NOT bare-cancel the synth here — a cancel() immediately before the first
  // speak() is swallowed on Chrome/mobile (the classic "tap Read, nothing happens").
  const stopCloudAudio = () => {
    if (audioRef.current) { try { audioRef.current.pause(); } catch (_) {} audioRef.current = null; }
    setCloudPlaying(false);
  };

  // The engine reports when a tap produced no audio at all (mobile blocked/suspended
  // synth) — never leave the button dead and quiet; tell the listener what to do.
  useEffect(() => {
    if (tts.failed) setNotice('Your phone didn’t start the audio on that tap. Press Read once more — some phones need a second tap, or pick the free System voice.');
  }, [tts.failed]);

  // The one play path. Tries the real sovereign studio for a consented personal
  // voice when it is live; otherwise (and on ANY failure) falls back to the browser
  // voice — the System voice always works, so a tap is never a dead button.
  const playWith = async (voice, body) => {
    const clean = String(body || '').trim();
    if (!clean) return;
    const prov = resolveVoiceProvider(voice, { sovereignVoiceReady });
    if (prov.blocked) { setNotice('That voice needs the person’s consent before it can be used.'); return; }

    stopCloudAudio();

    if (prov.real && voice.kind === KIND.PERSONAL && sovereignVoiceReady) {
      // REAL cloned voice: condition on the person's RECORDED sample (few-shot).
      const refBlob = await loadReference(voice.personKey);
      if (!refBlob) {
        setNotice('Record a voice sample first — use Record above, then this reads in that voice.');
        if (!tts.supported) return;
        tts.speak(clean, resolvedURIFor(voice)); // pinned/gendered stand-in until a sample exists
        return;
      }
      const referenceDataUri = await blobToDataUri(refBlob);
      setBusy(true);
      const { url, error } = await synthesizeSpeech({ text: clean, voiceId: voice.id, personKey: voice.personKey, referenceDataUri });
      setBusy(false);
      if (!error && url) {
        try {
          const a = new Audio(url);
          audioRef.current = a;
          setCloudPlaying(true);
          a.onended = () => { setCloudPlaying(false); try { URL.revokeObjectURL(url); } catch (_) {} };
          a.onerror = () => { setCloudPlaying(false); tts.speak(clean, resolvedURIFor(voice)); }; // never silent
          await a.play();
          return;
        } catch (_) { setCloudPlaying(false); /* fall through to browser */ }
      }
      // SAY WHICH FAILURE IT WAS. This threw the tagged error away and printed
      // "unreachable" for every one of them -- including a 401, which is a
      // credential being refused by a studio that is running perfectly and
      // sends a person to check their network for no reason.
      // The road is the house's problem: a dark studio marks the studio line
      // 'down' (the line already says the stand-in plays until it is back) and
      // raises no message. A refused key or a missing sample is the person's.
      if (isStudioRoadProblem(error)) setStudioHealth('down');
      else setNotice(`${voiceErrorReason(error)} Using the labelled stand-in voice for now.`);
    }

    // Browser path: System voice (real) or the labeled personal stand-in. Each option
    // speaks in its assigned device voice (gender-correct + distinct) — never the one
    // shared default that made every pick sound like the same person.
    if (!tts.supported) { setNotice('This device can’t read aloud — try a different browser.'); return; }
    tts.speak(clean, resolvedURIFor(voice));
  };

  const readNow = () => playWith(selected, text);
  const sampleVoice = (v) => playWith(v, `${v.kind === KIND.PERSONAL ? `This is the ${v.name} voice. ` : ''}${SAMPLE_SHORT}`);

  const isReading = tts.isReading || cloudPlaying;

  // Self-consent enrollment: only ever the signed-in person's OWN persona.
  const canEnrollSelf = !!(enrolKey && userId && instanceId && !reviewerMode);

  const enrollSelf = async () => {
    if (!canEnrollSelf) { setNotice('Sign in to enroll your voice.'); return; }
    setBusy(true); setNotice('');
    const { error } = await enrollMyVoice({
      instanceId, userId, personKey: enrolKey,
      displayName: enrolName, scope: 'read-aloud-narration',
    });
    if (error) { setNotice(error.message || 'Could not enroll right now.'); setBusy(false); return; }
    const { profiles: rows } = await loadVoiceProfiles();
    if (rows) setProfiles(rows);
    setNotice('Your voice is enrolled. It reads with a labeled stand-in until the local voice studio is live.');
    setBusy(false);
  };

  const revokeSelf = async (v) => {
    if (!v?.remoteId) return;
    setBusy(true);
    const { error } = await revokeMyVoice(v.remoteId);
    if (!error) { const { profiles: rows } = await loadVoiceProfiles(); if (rows) setProfiles(rows); }
    setNotice(error ? (error.message || 'Could not withdraw.') : 'Consent withdrawn.');
    setBusy(false);
  };

  // Save the recorded sample as MY voice reference + grant consent in one gesture —
  // recording IS the consent. The sample lives on the device (sovereign) and feeds
  // the clone model when the endpoint is live.
  const saveRecording = async () => {
    if (!recorder.blob) return;
    setBusy(true); setNotice('');
    const ok = await saveReference(enrolKey, recorder.blob);
    if (ok) {
      // Read it BACK OUT of the store rather than reusing the recorder's blob:
      // what plays on the page is then provably the thing that persisted.
      try {
        const saved = await loadReference(enrolKey);
        setSavedUrl((prev) => { if (prev) { try { URL.revokeObjectURL(prev); } catch (_) {} } return saved ? URL.createObjectURL(saved) : ''; });
      } catch (_) { /* the line below still reports the save */ }
    }
    if (!ok) { setNotice('That sample was too short or empty — record a few more seconds.'); setBusy(false); return; }
    setMyRefExists(true);
    // Persist consent (best-effort; the local sample already works for synth).
    // THE CONSENT ROW, AND WHAT HAPPENS WHEN IT DOES NOT GET WRITTEN.
    //
    // This was best-effort AND SILENT: if instanceId or userId was missing the
    // upsert was skipped entirely, the sample still saved locally, and the
    // person was told "Saved on this device" -- true, and hiding the fact that
    // no consent record existed anywhere. That silence is the mechanism behind
    // a table with one row in it. An enrolment that did not enrol now SAYS SO.
    let enrolled = false;
    let enrolProblem = '';
    if (canEnrollSelf) {
      const { error } = await enrollMyVoice({
        instanceId, userId, personKey: enrolKey,
        displayName: enrolName, scope: 'read-aloud-narration',
      });
      if (error) enrolProblem = error.message || 'the consent record could not be saved';
      else { enrolled = true; const { profiles: rows } = await loadVoiceProfiles(); if (rows) setProfiles(rows); }
    } else if (!userId) {
      enrolProblem = 'you are not signed in on this device';
    } else if (!instanceId) {
      enrolProblem = 'this account is not a member of a family or church space yet';
    }
    recorder.reset();
    const where = enrolled
      ? 'Saved on this device, and your consent is recorded.'
      : `Saved on this device ONLY — the consent record was not written because ${enrolProblem}. The sample works here; it will not follow you to another device.`;
    setNotice(sovereignVoiceReady
      ? `${where} Select your voice and press Read — it will speak in your voice.`
      : `${where} The moment the voice endpoint is live, this reads in your real voice.`);
    setBusy(false);
  };

  // Save the chosen photo as MY likeness reference + stamp consent on my own
  // row in one gesture (DR-0430). The photo stays on this device; it is only
  // ever sent to the family's own likeness studio, never a vendor.
  const savePortraitAndConsent = async () => {
    if (!portraitFile || !isUsablePortrait(portraitFile)) { setNotice('Choose a clear photo of your face first (a real image file).'); return; }
    setBusy(true); setNotice('');
    const ok = await savePortrait(enrolKey, portraitFile);
    if (!ok) { setNotice('That image could not be saved — try a different photo.'); setBusy(false); return; }
    setMyPortraitExists(true);
    setPortraitPreview(URL.createObjectURL(portraitFile));
    setPortraitFile(null);
    if (canEnrollSelf) {
      const { error } = await enrollMyLikeness({ instanceId, userId, personKey: enrolKey, displayName: enrolName });
      if (error) { setNotice(error.message || 'The photo is saved on this device, but the consent record could not be written — try again when online.'); setBusy(false); return; }
      const { profiles: rows } = await loadVoiceProfiles(); if (rows) setProfiles(rows);
    }
    setNotice('Your likeness is enrolled. The Teacher panel in every lesson now shows you — a still portrait beside your voice until the likeness studio is armed, and always labelled AI-generated.');
    setBusy(false);
  };
  const clearMyPortrait = async () => {
    await clearPortrait(enrolKey);
    setMyPortraitExists(false); setPortraitPreview(''); setPortraitFile(null);
    const mine = profiles.find((p) => p.personKey === enrolKey);
    if (mine && mine.remoteId && likenessConsented(mine)) {
      await revokeMyLikeness(mine.remoteId, mine.meta);
      const { profiles: rows } = await loadVoiceProfiles(); if (rows) setProfiles(rows);
    }
    setNotice('Your likeness was removed from this device and the consent withdrawn.');
  };

  // A SAMPLE BROUGHT AS A FILE is saved exactly as a recorded one: same store,
  // same key, same read-back so what plays is what persisted. The consent row
  // is written in the same gesture when this device can write one, because a
  // sample in the store with no consent record is the silent failure DR-0563
  // closed.
  const loadRecordingFile = async (file) => {
    if (!file) return;
    setBusy(true); setNotice('');
    const ok = await saveReference(enrolKey, file);
    if (!ok) { setNotice('That file is not an audio recording this device can use — choose the sample you downloaded here, or record again.'); setBusy(false); return; }
    try {
      const saved = await loadReference(enrolKey);
      setSavedUrl((prev) => { if (prev) { try { URL.revokeObjectURL(prev); } catch (_) {} } return saved ? URL.createObjectURL(saved) : ''; });
    } catch (_) { /* the line below still reports the save */ }
    setMyRefExists(true);
    if (canEnrollSelf) {
      const { error } = await enrollMyVoice({ instanceId, userId, personKey: enrolKey, displayName: enrolName, scope: 'read-aloud-narration' });
      if (!error) { const { profiles: rows } = await loadVoiceProfiles(); if (rows) setProfiles(rows); }
    }
    setNotice('Your sample is loaded on this device. Select your voice and press Read.');
    setBusy(false);
  };

  const clearMyRecording = async () => {
    await clearReference(enrolKey);
    setSavedUrl((prev) => { if (prev) { try { URL.revokeObjectURL(prev); } catch (_) {} } return ''; });
    setMyRefExists(false);
    setNotice('Your voice sample was removed from this device.');
  };

  // SIGNED IN IS THE GATE, and reviewer mode is called out rather than silently
  // emptying the tab: reviewing production as a visitor must never write a real
  // consent row, but a blank screen is what sent Darrell hunting in the first
  // place. See the explanatory panel where the Record tab is composed.
  const showRecorder = !!enrolKey && !reviewerMode;

  // Swipeable sections instead of a stacked scroll (Darrell 2026-07-04: "sliding
  // tabs for all tabs instead of a long scroll"). Every hook stays at the top
  // level above — these render thunks are plain closures over that state, so
  // playback (tts / audioRef) keeps running across section switches. The header,
  // the honesty banner, and the live status notice stay PINNED above the strip
  // so an action's result is visible no matter which section set it.
  const sections = [
    {
      id: 'listen',
      label: 'Listen',
      icon: 'volume',
      render: () => (
      /* Listen to anything */
      <div className="border border-[#E8E4DC] bg-white p-4">
        <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-2">
          Reading with: <span className="text-[#1A1815] font-semibold">{selected?.name}</span>
          {selected && aiVoiceLabel(selected) ? ' (AI-generated voice — stand-in)' : ''}
        </div>
        <label htmlFor="vs-text" className="sr-only">Text to read aloud</label>
        <textarea
          id="vs-text" value={text} onChange={(e) => setText(e.target.value)} rows={4}
          placeholder="Paste any message, lesson, or passage…"
          className="w-full text-sm border border-[#E8E4DC] p-2 text-[#1A1815] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]"
        />

        {/* Highlight-as-it-reads: the active sentence lights up while reading. */}
        {isReading && segments.length > 0 && !cloudPlaying && (
          <div aria-hidden="true" className="mt-2 text-sm leading-relaxed border border-[#E8E4DC] bg-[#FAF8F4] p-2 max-h-40 overflow-auto">
            {segments.map((s, i) => (
              <span key={i} className={i === activeSeg ? 'bg-[#1A1815] text-white px-0.5' : 'text-[#5A5751]'}>{s}{' '}</span>
            ))}
          </div>
        )}

        {!tts.supported ? (
          <p className="text-[0.6875rem] text-[#B85838] mt-2">This device can’t read aloud — try a different browser.</p>
        ) : (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {!isReading ? (
              <button type="button" onClick={readNow} disabled={busy}
                className="bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">{busy ? '…' : '▶ Read'}</button>
            ) : (
              <>
                {!cloudPlaying && (
                  <button type="button" onClick={tts.isPaused ? tts.resume : tts.pause}
                    className="bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">{tts.isPaused ? '▶ Resume' : '⏸ Pause'}</button>
                )}
                <button type="button" onClick={stopAll}
                  className="border border-[#1A1815] text-[#1A1815] px-4 py-2 text-xs uppercase tracking-wider hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">⏹ Stop</button>
              </>
            )}
            <div className="flex flex-wrap items-center gap-1 ml-auto" role="group" aria-label="Reading speed">
              {RATE_STEPS.map((s) => {
                const on = Math.abs(tts.rate - s.value) < 0.001;
                return (
                  <button key={s.value} type="button" onClick={() => tts.setRate(s.value)} aria-pressed={on} title={s.name}
                    className={`px-2 py-1.5 text-[0.625rem] uppercase tracking-wider border focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838] ${on ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815]'}`}>{s.label}</button>
                );
              })}
            </div>
          </div>
        )}
        {tts.supported && tts.voices.length === 0 && (
          <p className="text-[0.625rem] text-[#5A5751] mt-2">Your device is still loading its voices — give it a moment, then press Read again.</p>
        )}
      </div>
      ),
    },
    {
      id: 'voices',
      label: 'Voices',
      icon: 'users',
      render: () => (
      /* Voice picker */
      <div className="grid gap-2 mb-6">
        {voices.map((v) => {
          const selectable = isVoiceSelectable(v, ctx);
          const status = enrollmentStatus(v);
          const prov = resolveVoiceProvider(v, { sovereignVoiceReady });
          const isMine = enrolKey && v.personKey === enrolKey;
          const isSel = selected && selected.id === v.id;
          return (
            <div key={v.id} className={`border p-3 ${isSel ? 'border-[#1A1815] bg-[#FAF8F4]' : 'border-[#E8E4DC] bg-white'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[#1A1815]">{v.name}</span>
                    {aiVoiceLabel(v) && (
                      <span className="text-[0.5625rem] uppercase tracking-wider bg-[#1A1815] text-white px-1.5 py-0.5">AI-generated voice</span>
                    )}
                    {v.kind === KIND.SYNTHETIC && (
                      <span className="text-[0.5625rem] uppercase tracking-wider border border-[#1A1815] text-[#1A1815] px-1.5 py-0.5">Free</span>
                    )}
                    {v.kind === KIND.PERSONAL && (
                      <span className="text-[0.5625rem] uppercase tracking-wider border border-[#B85838] text-[#B85838] px-1.5 py-0.5">Subscriber voice</span>
                    )}
                  </div>
                  <div className="text-[0.6875rem] text-[#5A5751] mt-0.5">{v.description}</div>
                  <div className={`text-[0.625rem] mt-1 ${status.tone === 'ok' ? 'text-[#1A1815]' : status.tone === 'off' ? 'text-[#B85838]' : 'text-[#5A5751]'}`}>
                    {status.label}
                    {prov.standIn ? ' · plays a stand-in until the voice studio is live' : ''}
                    {/* LIVE HAS TO BE EARNED (Darrell 2026-09-22: the card said
                        "cloned voice live · IN USE" while a device voice was what
                        he actually heard). `prov.real` only knows the studio is
                        configured and answering. It does NOT know whether THIS
                        device holds the sample the clone is conditioned on — and
                        without that sample the read falls back to a device voice
                        with the card still claiming live. Same class as a feedback
                        log counting rows it never fetched. */}
                    {prov.real && v.kind === KIND.PERSONAL
                      ? (isMine
                          ? (myRefExists
                              ? ' · cloned voice live'
                              : ' · the studio is answering, but THIS device holds no sample of your voice — it will read in a stand-in until you record here')
                          : ' · cloned voice live')
                      : ''}
                  </div>
                  {/* Pick the ACTUAL device voice this option speaks in — the same
                      voices other apps use (speechSynthesis.getVoices()). The choice
                      persists and applies to every read-aloud. This is the fix for
                      "still sounds female for Darrell": pin a male voice here. */}
                  {selectable && deviceOptions.length > 0 && (
                    <div className="mt-1.5">
                      <label htmlFor={`dv-${v.id}`} className="text-[0.625rem] text-[#5A5751] block mb-0.5">
                        {prov.standIn ? 'Stand-in device voice' : 'Device voice'}
                      </label>
                      <select
                        id={`dv-${v.id}`}
                        value={resolvedURIFor(v) || ''}
                        onChange={(e) => pinDeviceVoice(v.id, e.target.value)}
                        className="text-[0.6875rem] border border-[#E8E4DC] bg-white text-[#1A1815] px-2 py-1 rounded-md max-w-[12rem] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]"
                      >
                        {deviceOptions.map((o) => (
                          <option key={o.uri} value={o.uri}>
                            {o.name}{o.gender !== 'unknown' ? ` · ${o.gender}` : ''}{o.lang ? ` (${o.lang})` : ''}
                          </option>
                        ))}
                      </select>
                      {/* WHAT IS ACTUALLY THERE, COUNTED (Darrell 2026-09-22:
                          "No choice for male or female like the verbiage on the
                          app explains... not accurate?!!!!!!!!").
                          The old copy asserted the list was female-only. On his
                          Android it is not female-only — it is GENDERLESS: every
                          entry is named by locale ("English Nigeria (en_NG)"),
                          so nothing can be classified and no male/female match
                          is possible from this list at all. Asserting the wrong
                          reason is its own defect, so the surface now reports
                          the census it just took. */}
                      {v.kind === KIND.PERSONAL && !hasVoiceOfGender(tts.voices, v.gender) && (
                        <div className="mt-1.5 border border-[#E8E4DC] bg-[#FAF8F4] p-2" data-testid="device-voice-route">
                          {/* THE ONE-LINE WHY, then THE DOOR. The paragraph this
                              replaces explained the census in full and ended with
                              "Settings → Text-to-speech" -- a hunt (Darrell: "Make
                              this easy!!!!!!!!!!!!"). The census is still here,
                              shortened to the sentence that matters; the route is
                              deduced from the device (device-voice-route.js). */}
                          <p className="text-[0.625rem] text-[#5A5751]" data-testid="device-voice-census">
                            {voiceCensus.total === 0
                              ? 'This browser handed us no voices at all, so nothing in this list can change how it sounds.'
                              : voiceCensus.anyGendered
                                ? `Of the ${voiceCensus.total} voices here, ${voiceCensus.male} read as male and ${voiceCensus.female} as female — none of them ${v.gender}. Pick one above and you hear it at once.`
                                : `This list ${voiceCensus.namedByLocale ? 'names every one of them by LANGUAGE rather than by voice' : `declares no gender on any of its ${voiceCensus.total} voices`}, which is why changing the selection does not change how it sounds. The phone’s own setting decides.`}
                          </p>
                          <p className="text-[0.6875rem] text-[#1A1815] font-semibold mt-1">{voiceRoute.title}</p>
                          {voiceRoute.href && (
                            <a
                              href={voiceRoute.href}
                              data-testid="device-voice-settings-door"
                              className="inline-block mt-1 px-3 py-1.5 text-[0.6875rem] uppercase tracking-wider border border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#B85838] hover:border-[#B85838] font-semibold focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]"
                            >{voiceRoute.hrefLabel}</a>
                          )}
                          <ol className="list-decimal pl-4 mt-1 space-y-0.5">
                            {voiceRoute.steps.map((s) => <li key={s} className="text-[0.625rem] text-[#5A5751]">{s}</li>)}
                          </ol>
                          <p className="text-[0.625rem] text-[#5A5751] mt-1">{voiceRoute.after} Your own recorded voice comes from the voice studio, not from this list.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  {selectable ? (
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => sampleVoice(v)} disabled={busy}
                        title="Hear this voice now"
                        className="text-[0.6875rem] uppercase tracking-wider px-2 py-1.5 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">▶ Sample</button>
                      <button type="button" onClick={() => choose(v)} aria-pressed={isSel}
                        className={`text-[0.6875rem] uppercase tracking-wider px-3 py-1.5 border focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838] ${isSel ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white'}`}
                      >{isSel ? '✓ In use' : 'Use'}</button>
                    </div>
                  ) : (
                    <span className="text-[0.625rem] text-[#5A5751] text-right max-w-[9rem]">
                      {canCloneVoice(v) ? 'Available on a subscription' : 'Invite to enroll — usable only after they consent'}
                    </span>
                  )}
                  {isMine && v.consentState !== CONSENT.GRANTED && (
                    <button type="button" disabled={busy || !canEnrollSelf} onClick={enrollSelf}
                      className="text-[0.625rem] uppercase tracking-wider px-2 py-1 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">
                      Enroll my voice
                    </button>
                  )}
                  {isMine && v.consentState === CONSENT.GRANTED && v.remoteId && (
                    <button type="button" disabled={busy} onClick={() => revokeSelf(v)}
                      className="text-[0.625rem] uppercase tracking-wider px-2 py-1 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">
                      Withdraw consent
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      ),
    },
    // DOES IT WORK? — the dependency chain, checked in front of the person.
    // ALWAYS present, including when enrolment is off, because the whole point
    // is to answer "why can't I record" on the screen instead of leaving it to
    // a guess. This is the tab Darrell asked for by name.
    {
      id: 'works',
      label: 'Does it work?',
      icon: 'check',
      render: () => (
        <div className="mb-6 border border-[#1A1815] bg-white p-4" data-testid="voice-system-check">
          <div className="text-sm font-semibold text-[#1A1815] mb-1">Does the voice system actually work — right now, on this device?</div>
          <p
            data-testid="voice-system-verdict"
            className={`text-[0.75rem] mb-3 ${verdict.state === PASS ? 'text-[#5A6E3D]' : verdict.state === FAIL ? 'text-[#B85838]' : 'text-[#5A5751]'}`}
          >
            {verdict.text}
          </p>
          <ul className="space-y-2">
            {checks.map((c) => (
              <li key={c.id} data-testid={`voice-check-${c.id}`} className="border border-[#E8E4DC] p-2">
                <div className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className={`text-[0.6875rem] font-bold shrink-0 ${c.state === PASS ? 'text-[#5A6E3D]' : c.state === FAIL ? 'text-[#B85838]' : 'text-[#5A5751]'}`}
                  >{c.state === PASS ? 'PASS' : c.state === FAIL ? 'FAIL' : '????'}</span>
                  <div className="min-w-0">
                    <div className="text-[0.75rem] text-[#1A1815] font-semibold">
                      <span className="sr-only">{c.state === PASS ? 'Passing: ' : c.state === FAIL ? 'Failing: ' : 'Not answered: '}</span>
                      {c.label}
                    </div>
                    <div className="text-[0.6875rem] text-[#5A5751]">{c.detail}</div>
                    {c.fix && <div className="text-[0.6875rem] text-[#B85838] mt-0.5">What to do: {c.fix}</div>}
                    {/* THE CITATION FOLDS (Darrell 2026-09-23, on a row whose
                        file paths took three lines at Big Print: "Why does
                        this need this?!!!!!!!!!!!" / "Intuitive!!!!!!!!"). He
                        asked for the documentation IN the app (2026-09-22), and
                        it stays in the app -- one tap away, under the verdict
                        and the fix, instead of between the person and them. */}
                    <details className="mt-0.5">
                      <summary className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] cursor-pointer focus:outline focus:outline-2 focus:outline-[#B85838]">Where this is decided</summary>
                      <div className="text-[0.5625rem] text-[#5A5751] mt-0.5" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{c.where}</div>
                    </details>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-[#E8E4DC] pt-2">
            <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Where this system is written down</div>
            <ul className="space-y-0.5">
              {VOICE_SYSTEM_DOCS.map((d) => (
                <li key={d.id} className="text-[0.625rem] text-[#5A5751]">
                  {d.label} — <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{d.where}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
    },
    // RECORD YOUR VOICE — the primary enrollment: clean audio + explicit consent
    // in one gesture. The recorded sample IS the clone reference. Gated exactly
    // as before (showRecorder); SectionTabs filters the null so the tab never
    // leaks for a visitor with no persona.
    showRecorder ? {
      id: 'record',
      label: 'Record',
      icon: 'mic',
      render: () => (
        <div className="mb-6 border border-[#1A1815] bg-white p-4">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <div className="text-sm font-semibold text-[#1A1815]">🎙 Record your voice — {enrolName}</div>
            <span className="text-[0.5625rem] uppercase tracking-wider bg-[#1A1815] text-white px-1.5 py-0.5">AI-generated voice</span>
          </div>
          <p className="text-[0.75rem] text-[#5A5751] leading-relaxed mb-3">
            Read the lines below aloud (about 30 seconds). This becomes <strong>your</strong> voice for
            reading app text — clean audio, and recording it <strong>is</strong> your consent. It stays on
            this device; it’s only ever sent to your own voice endpoint to read text you choose.
          </p>

          {!recorder.supported ? (
            <p className="text-[0.6875rem] text-[#B85838]">Recording isn’t supported in this browser — try Chrome or Safari on your phone.</p>
          ) : (
            <>
              <div className="text-[0.75rem] text-[#1A1815] leading-relaxed border border-[#E8E4DC] bg-[#FAF8F4] p-2 mb-3">
                {RECORD_SCRIPT.map((line, i) => <div key={i} className="mb-1">{line}</div>)}
              </div>

              {myRefExists && !recorder.blob && !recorder.recording && (
                <div className="mb-2" data-testid="saved-sample">
                  <div className="text-[0.6875rem] text-[#1A1815]">✓ A voice sample is saved on this device.
                    <button type="button" onClick={clearMyRecording} className="ml-2 underline text-[#B85838] hover:no-underline">Remove</button>
                  </div>
                  {/* IT STAYS AND IT PLAYS. Before this the save threw away the
                      only playable handle and left a sentence, so a person could
                      be told their voice was kept and have no way to hear it. */}
                  {savedUrl && (
                    <audio
                      src={savedUrl}
                      controls
                      /* No width cap here ON PURPOSE. A first pass wrote
                         a max-width utility class and the guard failed it —
                         width-cap 5 against this file's frozen baseline of 4
                         (DR-0246). The cap was never load-bearing: what matters
                         is that the sample PLAYS, not that the player is narrow.
                         So the cap came out rather than the baseline going up,
                         exactly as it did for the read-aloud notice today. */
                      className="h-8 mt-1 w-full"
                      data-testid="saved-sample-audio"
                    />
                  )}
                  {/* KEEP IT, AND BRING IT (Darrell 2026-09-23: "Where are my
                      voices stored in my cellphone so I can troubleshoot without
                      having to do the recording over and over again"). The
                      sample is not a file in the phone's Files app -- it is in
                      this browser's own storage, which no file manager shows --
                      so the honest answer is a Download that makes it a file,
                      and a Use-a-file that takes one back on any device. */}
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    {savedUrl && (
                      <a
                        href={savedUrl}
                        download={`poetech-voice-${enrolKey}.webm`}
                        data-testid="saved-sample-download"
                        className="px-3 py-1.5 text-[0.6875rem] uppercase tracking-wider border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white font-semibold focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]"
                      >⇩ Download my sample</a>
                    )}
                    <label className="px-3 py-1.5 text-[0.6875rem] uppercase tracking-wider border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white font-semibold cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-[#B85838]">
                      Use a recording file
                      <input type="file" accept="audio/*" className="sr-only" data-testid="saved-sample-import" onChange={(e) => loadRecordingFile(e.target.files && e.target.files[0])} />
                    </label>
                  </div>
                  <div className="text-[0.625rem] text-[#5A5751] mt-1">
                    It is saved on this phone, inside this browser’s own storage — not as a file you can find in your Files app, and it does not follow you to another device. Download it to keep a copy; on another device, tap Use a recording file to load it instead of recording again.
                  </div>
                  <details className="mt-0.5">
                    <summary className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] cursor-pointer focus:outline focus:outline-2 focus:outline-[#B85838]">Exactly where</summary>
                    <div className="text-[0.5625rem] text-[#5A5751] mt-0.5">IndexedDB, database <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>poe-voice</span>, store <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>references</span>, key <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>ref:{enrolKey}</span>. Clearing this browser’s site data deletes it.</div>
                  </details>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                {!recorder.recording && !recorder.blob && (
                  <button type="button" onClick={recorder.start} disabled={busy}
                    className="bg-[#B85838] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#1A1815] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">● Record</button>
                )}
                {recorder.recording && (
                  <>
                    <span className="text-sm font-mono text-[#B85838]" role="status" aria-live="polite">● {formatDuration(recorder.seconds)}</span>
                    <button type="button" onClick={recorder.stop}
                      className="bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">■ Stop</button>
                    <span className={`text-[0.6875rem] ${durationQuality(recorder.seconds).tone === 'short' ? 'text-[#B85838]' : 'text-[#1A1815]'}`}>{durationQuality(recorder.seconds).label}</span>
                  </>
                )}
                {recorder.blob && !recorder.recording && (
                  <>
                    <audio src={recorder.url} controls className="h-8 max-w-[200px]" />
                    <button type="button" onClick={saveRecording} disabled={busy || !meetsMinDuration(recorder.seconds)}
                      className="bg-[#1A1815] text-white px-3 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">✓ Save my voice</button>
                    <button type="button" onClick={recorder.reset}
                      className="border border-[#1A1815] text-[#1A1815] px-3 py-2 text-xs uppercase tracking-wider hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">↺ Re-record</button>
                  </>
                )}
              </div>
              {recorder.error && <p className="text-[0.6875rem] text-[#B85838] mt-2">{recorder.error}</p>}
              <p className="text-[0.625rem] text-[#5A5751] mt-2" data-testid="voice-studio-state">{studioLine}</p>
            </>
          )}
        </div>
      ),
    } : null,
    // YOUR LIKENESS — the Teacher's portrait (DR-0430). Same gate and the same
    // consent doctrine as Record: only the signed-in person, only their own.
    showRecorder ? {
      id: 'likeness',
      label: 'Likeness',
      icon: 'users',
      render: () => (
        <div className="mb-6 border border-[#1A1815] bg-white p-4" data-testid="likeness-tab">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <div className="text-sm font-semibold text-[#1A1815]">Your likeness — {enrolName}</div>
            <span className="text-[0.5625rem] uppercase tracking-wider bg-[#1A1815] text-white px-1.5 py-0.5">AI-generated likeness</span>
          </div>
          <p className="text-[0.75rem] text-[#5A5751] leading-relaxed mb-3">
            Choose one clear photo of your face. This becomes <strong>your</strong> portrait as the Teacher in every lesson —
            saving it <strong>is</strong> your consent. It stays on this device and is only ever sent to the family’s own
            likeness studio to be animated to your own voice. It is never sent to a vendor. Likeness path right now:
            <strong> {liveLikenessPath().label}</strong>.
          </p>
          {portraitPreview && (
            <div className="flex items-center gap-3 mb-3">
              <img src={portraitPreview} alt="Your enrolled portrait" className="w-20 h-20 object-cover border border-[#1A1815]" />
              {myPortraitExists && <span className="text-[0.6875rem] text-[#1A1815]">✓ A portrait is saved on this device.</span>}
            </div>
          )}
          <label htmlFor="vs-portrait" className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Photo</label>
          <input id="vs-portrait" type="file" accept="image/*" className="block text-[0.75rem] mt-1 mb-3"
            onChange={(e) => { const f = e.target.files && e.target.files[0]; setPortraitFile(f || null); if (f) setPortraitPreview(URL.createObjectURL(f)); }} />
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" onClick={savePortraitAndConsent} disabled={busy || !portraitFile}
              className="bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">Save as my likeness — I consent</button>
            {myPortraitExists && (
              <button type="button" onClick={clearMyPortrait} disabled={busy}
                className="border border-[#B85838] text-[#B85838] px-4 py-2 text-xs uppercase tracking-wider hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">Remove and withdraw consent</button>
            )}
          </div>
        </div>
      ),
    } : null,
  ];

  return (
    <div className="w-full">
      <div className="mb-1 text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">🔊 Voice</div>
      <h1 className="text-2xl font-semibold text-[#1A1815] mb-1" style={{ fontFamily: '"Fraunces", serif' }}>Listen to anything</h1>
      <p className="text-sm text-[#5A5751] mb-5 leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
        Pick a voice, then paste any message, lesson, or passage to hear it read aloud. On a reading
        page (Scripture, The Word, a lesson) the floating 🔊 button reads the whole page.
      </p>

      {/* The honesty banner — never hidden while the studio is not live. Pinned above the strip. */}
      {!sovereignVoiceReady && (
        <div className="mb-5 border-l-4 border-[#B85838] bg-[#FAF8F4] p-3 text-[0.75rem] text-[#5A5751] leading-relaxed">
          <strong>How personal voices work today:</strong> a personal voice is clearly marked
          <em> AI-generated</em> and currently plays a <strong>stand-in</strong> voice that you can hear right
          now. The real cloned voice activates when the local voice studio (sovereign, on our own
          hardware) is live — nothing here pretends a stand-in is the person’s real voice.
        </div>
      )}

      {/* The sovereignty ledger (DR-0138) — sovereign first; any vendor need is a
          RECORDED gap with its build/purchase path home. Live path derives from
          the real endpoint config; the ledger validates itself in CI. */}
      <div className="mb-5 border border-[#E8E4DC] bg-white p-3">
        <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">Sovereign first — the vendor ledger (recorded {GAPS_RECORDED})</div>
        <p className="text-[0.75rem] text-[#1A1815] mb-2">Speaking path right now: <strong>{liveVoicePath().label}</strong></p>
        <ul className="space-y-2">
          {SOVEREIGNTY_GAPS.map((g) => (
            <li key={g.id} className="text-[0.6875rem] text-[#5A5751] leading-relaxed border-l-2 border-[#C9C2B6] pl-2">
              <span className="text-[#1A1815] font-semibold">{g.capability}</span>
              {' '}<span className="uppercase text-[0.625rem] tracking-wider">({g.status} · needed since {g.neededSince} · re-review {g.reReview})</span>
              <br />Local today: {g.localToday}
              <br />Build path home: {g.buildPath} {g.purchasePath && g.purchasePath !== 'None — the device is already owned.' ? `· Purchase: ${g.purchasePath}` : '· No purchase needed'}
            </li>
          ))}
        </ul>
      </div>

      {/* Status notice — pinned above the strip so a result set from ANY section
          (enroll, save a recording, a playback fallback) stays visible no matter
          which section is open. */}
      {notice && <div role="status" aria-live="polite" className="mb-4 text-[0.75rem] text-[#1A1815] bg-[#FAF8F4] border border-[#E8E4DC] p-2">{notice}</div>}

      <SectionTabs sections={sections} ariaLabel="Voice sections" idBase="voice" defaultId="listen" />

      <p className="text-[0.6875rem] text-[#5A5751] mt-4 leading-relaxed">
        Voice cloning is consent-only: a real person’s voice is never used until that person enrolls
        it themselves. Anything published in a cloned voice is labeled AI-generated, and a voice is
        only ever used to read content the person means to say — never to put words in their mouth.
      </p>
    </div>
  );
}
