// =============================================================================
// use-read-aloud — the SHARED "read anything in my chosen voice" primitive
// =============================================================================
// One hook so every read-aloud surface honors the ONE global voice preference
// (lib/reading-voice.js): the floating control (read anywhere), the Voice tab, the
// header picker, any reading page. Pick once, it reads everywhere in that voice.
//
// It composes the existing pieces, it does not replace them:
//   - lib/tts.js (browser engine) for System + browser voices/accents + transport
//   - lib/voice-service.js + lib/voice-reference.js for a personal CLONED voice
//     (bridge/sovereign endpoint + the recorded sample), with a graceful fallback
//     to the labeled browser stand-in — so the pick works TODAY and seamlessly
//     upgrades to the real voice when the endpoint is live (same preference).
//
// read(text) never fails silently: any clone error falls back to a browser voice;
// the System voice always works.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTextToSpeech, waitForVoices } from './tts.js';
import {
  useReadingVoice, isPersonVoiceId, personKeyOf, isSystemVoiceId, SYSTEM_VOICE_ID, personVoiceId,
  isHouseVoiceId, houseModelOf, houseVoiceId, isDeviceVoiceId,
} from './reading-voice.js';
import { mergeVoiceCatalog, canCloneVoice, isVoiceEntitled, resolveVoiceProvider, KIND, SYSTEM_VOICE } from './voice-registry.js';
import { buildStandInAssignments, resolveVoiceURIForId, standInPitch } from './voice-assignment.js';
import { loadPersonaVoiceMap } from './persona-voice-prefs.js';
import { isVoiceServiceReady, synthesizeSpeech, activeVoiceEndpoint, builtInVoiceSupport, voiceServiceHealth, probeVoiceService, voiceErrorReason, speakTimeoutFor, mayAttemptStudio, isStudioRoadProblem, synthesizeLite, mayTryLiteVoice, markLiteVoiceMiss, isPlayRefusal, liteVoiceReasonText, LITE_FIRST_TIMEOUT_MS, fetchHouseVoices } from './voice-service.js';
import { chunkForClips, createClipQueue } from './clip-queue.js';
import { loadReference, blobToDataUri } from './voice-reference.js';
import { loadVoiceProfiles } from './voice-sync.js';
import { createBackgroundAudio, silentWavDataUri } from './background-audio.js';
import { toSpokenForm } from './speech-text.js';
import { clipFraction, estimateClipSeconds, seekableEndOf } from './clip-progress.js';
import { applyClipRate, clipRateNotice } from './clip-rate.js';
import { supabase } from './supabase.js';
import { hrefForView } from './nav-history.js';
import { hasBridgeToken } from './nas-photos.js';
import { provisionBridgeToken } from './bridge-provision.js';
import { newReadingPin, deviceVoiceForPin, genderOfDeviceVoice } from './reading-voice-pin.js';

// =============================================================================
// EVERY VOICE IS CHOOSABLE (DR-0655)
// =============================================================================
// Darrell 2026-09-25, Android, Living Lesson 191 at 1.5x: "I can only pic this
// fake dying voice!!!!!! Why limitations are built into the app!!!!! Fix
// it!!!!!" The picker offered "System voice" (which quietly meant the NAS's one
// male Piper voice while the studio was dark), his cloned voice, and only the
// ENGLISH phone voices; the NAS's own voices were never named at all. Now one
// list, in this order, each entry carrying a one-line truth about itself:
//   1. the church's studio voice, with its honest state;
//   2. every house (NAS Piper) voice the NAS REPORTS as installed;
//   3. every phone voice, English first, natural/Google voices first.
// Your cloned voices sit between the studio and the house, as before.
export const VOICE_GROUPS = {
  STUDIO: 'Church studio',
  PERSONAL: 'Your voices',
  HOUSE: 'House voices (church server)',
  PHONE: 'Phone voices',
};

export const VOICE_SAMPLE = 'The Lord is my shepherd; I shall not want.';

const PHONE_NOTE = 'Your phone’s own voice. On Android it stops when you switch apps or the screen goes off.';
const PHONE_ONLINE_NOTE = 'Your phone’s own voice, from the internet. On Android it stops when you switch apps or the screen goes off.';
const HOUSE_NOTE = 'Real audio from the church’s own server. Keeps playing when you switch apps.';

const NATURAL_VOICE = /natural|neural|google|online|enhanced|premium|wavenet|siri/i;

/**
 * The phone's voices in the order a listener wants them: English first,
 * natural / Google voices first within that, then US English, then by name.
 * De-duplicated by voiceURI. Nothing is filtered out. Pure.
 */
export function rankDeviceVoices(voices) {
  const seen = new Set();
  const list = [];
  for (const v of (Array.isArray(voices) ? voices : [])) {
    if (!v || !v.voiceURI || seen.has(v.voiceURI)) continue;
    seen.add(v.voiceURI);
    list.push(v);
  }
  const score = (v) => {
    let s = 0;
    if (/^en/i.test(v.lang || '')) s += 100;
    if (NATURAL_VOICE.test(v.name || '') || NATURAL_VOICE.test(v.voiceURI || '')) s += 10;
    if (/^en[-_]?US/i.test(v.lang || '')) s += 2;
    return s;
  };
  return list
    .map((v, i) => ({ v, i }))
    .sort((a, b) => (score(b.v) - score(a.v)) || String(a.v.name || '').localeCompare(String(b.v.name || '')) || (a.i - b.i))
    .map((x) => x.v);
}

/**
 * The studio entry's honest state and line. `studio` is the probe
 * ('up' | 'down' | 'unknown'); `ready` is the display readiness.
 */
export function studioVoiceNote({ studio, ready, houseUp }) {
  if (ready && studio === 'up') return { state: 'up', note: 'The church’s own studio voice. Real audio; keeps playing when you switch apps.' };
  const until = houseUp
    ? 'reads in the house voice Ryan until it is back. Real audio; keeps playing when you switch apps.'
    : 'reads in the phone’s voice until it is back. On Android that stops when you switch apps.';
  if (studio === 'down') return { state: 'offline', note: `The studio is offline right now, so this ${until}` };
  return { state: 'unknown', note: `The studio has not answered yet, so this ${until}` };
}

/**
 * @param {object} opts
 * @param {boolean} opts.isOwner       entitled to personal (subscriber) voices
 * @param {boolean} opts.sovereignVoiceReady  override (defaults to the endpoint config)
 */
// The silent clip that unlocks the voice element inside the tap (DR-0654).
const UNLOCK_WAV = silentWavDataUri(0.05);
const pageHidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';
const sentenceCase = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

export function useReadAloud({ isOwner = false, sovereignVoiceReady: readyOverride } = {}) {
  const tts = useTextToSpeech();
  // READY MEANS ANSWERING (DR-0440): configured is not the same as alive. A
  // configured studio is probed once (cached a minute) and a studio that did
  // not answer reads as not ready — the stand-in plays and says why — instead
  // of every read timing out. A caller's explicit override still wins (tests).
  const [studioHealth, setStudioHealth] = useState(() => voiceServiceHealth());
  useEffect(() => {
    let alive = true;
    if (readyOverride === undefined && isVoiceServiceReady()) probeVoiceService().then((h) => { if (alive) setStudioHealth(h); });
    return () => { alive = false; };
  }, [readyOverride]);
  // WHAT WE SAY vs WHAT WE TRY, split on purpose (Darrell 2026-09-22: "Why does
  // the health matter?!!! Can't we build it to work independently?").
  //
  // `sovereignVoiceReady` is the DISPLAY signal -- it decides the copy and
  // whether a personal voice is labelled a stand-in. It still listens to the
  // probe, because telling someone the studio is answering when it is not would
  // be the lie DR-0440 was written about.
  //
  // `attemptStudio` is the ATTEMPT, and it does NOT consult the probe. A health
  // check is a second system that can be wrong about the first, and when it was
  // wrong it withheld a working feature without a word. The call itself is the
  // only thing that proves the call works.
  const sovereignVoiceReady = readyOverride !== undefined ? readyOverride : (isVoiceServiceReady() && studioHealth !== 'down');
  const attemptStudio = readyOverride !== undefined ? readyOverride : mayAttemptStudio();
  const { voiceId, setVoiceId } = useReadingVoice(supabase);
  const [profiles, setProfiles] = useState([]);
  // The house voices AS THE NAS REPORTS THEM (never a painted list).
  // loaded=false until the NAS has answered or failed once.
  const [house, setHouse] = useState({ loaded: false, voices: [], error: null });
  useEffect(() => {
    let alive = true;
    fetchHouseVoices().then((r) => { if (alive) setHouse({ loaded: true, voices: r.voices || [], error: r.error || null }); });
    return () => { alive = false; };
  }, []);
  const [cloudPlaying, setCloudPlaying] = useState(false);
  const [cloudPaused, setCloudPaused] = useState(false);
  const [cloudProgress, setCloudProgress] = useState(0); // 0..1 through the cloud clip
  // Which reading segment the NAS voice is speaking (-1 when it is not). The
  // pieces ARE the segments, so this is exact, never a guess from the clock.
  const [cloudPiece, setCloudPiece] = useState(-1);
  // A NOTICE MAY CARRY A DOOR (2026-09-22). Most notices are just news. One of
  // them tells the reader to go and do something in another tab, and telling is
  // where it failed him — so a notice can hand over `{ href, label }` and the
  // panel draws it as a button. Every plain setNotice() call clears the action,
  // which is why the raw setter is wrapped rather than exported: a stale door
  // under a new message would send someone somewhere the message never meant.
  const [notice, setNoticeRaw] = useState('');
  const [noticeAction, setNoticeAction] = useState(null);
  // WHY THE STAND-IN IS SPEAKING, as STATUS rather than a message (Darrell
  // 2026-09-23: "No headaches!!!!"). '' = the chosen voice is speaking;
  // 'studio-offline' = the road to the studio failed on this read;
  // 'studio-unarmed' = the studio is not armed for this voice yet. The panel
  // prints it beside Reading/Paused. Nothing here is a popup and nothing here
  // is the reader's to fix; the house sees the studio through nas-health.
  const [standInWhy, setStandInWhy] = useState('');
  // WHICH KIND OF VOICE IS SPEAKING, because only one of them survives the
  // app leaving the screen: 'audio' (a real clip — studio or NAS voice, keeps
  // playing in the background) or 'device' (the phone's Web Speech, which
  // Android stops when you switch apps). '' before the first read.
  const [audioVoice, setAudioVoice] = useState('');
  const setNotice = useCallback((msg, action = null) => {
    setNoticeRaw(msg);
    setNoticeAction(msg ? action : null);
  }, []);
  const audioRef = useRef(null);
  // The paragraph-clip player for the NAS audio voice (lib/clip-queue.js).
  const queueRef = useRef(null);
  // The NAS voice (DR-0654): ONE element, unlocked in the tap and reused; the
  // reason of the last miss, so the notice can name it; and a reading held
  // while the page was hidden, resumed in the same voice when it is seen.
  const liteAudioRef = useRef(null);
  const liteMissRef = useRef('');
  const heldLiteRef = useRef('');
  const resumeHeldRef = useRef(() => false);
  // One reading, one voice (DR-0654): the pin made when a reading starts, the
  // one hand-off to the device voice, and whether a reading is live now.
  const readingPinRef = useRef(null);
  const deviceRestRef = useRef(() => {});
  const readingNowRef = useRef(false);
  // THE SPEED CHIP HAS TO REACH THE CLIP (2026-09-18). A cloud read is one
  // audio element, and playbackRate was never touched on it — so on the
  // sovereign/bridge path (which since DR-0382 carries the SYSTEM voice, the
  // default nobody changes) the chips moved the button highlight and changed
  // nothing about the speech, while the device-voice path honoured them. One
  // device honouring the rate and the other ignoring it IS "different on the
  // laptop than the phone". The rate lives in a ref so a clip created inside
  // an async read uses the CURRENT speed rather than a render's stale closure
  // — the same class of bug tts.js was built to kill.
  const rateRef = useRef(tts.rate);
  rateRef.current = tts.rate;

  /** Set the read speed, and carry it to a clip already playing. */
  const setRate = useCallback((r) => {
    rateRef.current = r;
    tts.setRate(r);
    // The clip queue re-applies its own speed on every new piece, so it must
    // hear the change too, or the next paragraph snaps back to the old speed.
    if (queueRef.current) queueRef.current.setRate(r);
    const a = audioRef.current;
    if (a) {
      // An audio element takes a live rate change mid-play, unlike an
      // utterance, so this is audible immediately rather than at the next
      // sentence — and it is MEASURED, never assumed (DR-0076).
      const applied = applyClipRate(a, r);
      const msg = clipRateNotice(applied);
      if (msg) setNotice(msg);
    }
  // setNotice is a useCallback with an empty dep list, so it is stable for the
  // life of the hook; it is listed because it is now a function rather than a
  // raw setState, and the linter cannot know that by itself.
  }, [tts, setNotice]);

  useEffect(() => {
    let alive = true;
    (async () => { const { profiles: rows } = await loadVoiceProfiles(); if (alive && rows) setProfiles(rows); })();
    return () => { alive = false; };
  }, []);

  useEffect(() => () => { if (audioRef.current) { try { audioRef.current.pause(); } catch (_) {} audioRef.current = null; } }, []);

  const fullCatalog = useMemo(() => mergeVoiceCatalog(profiles), [profiles]);
  const personalVoices = useMemo(() => fullCatalog.filter((v) => v.kind === KIND.PERSONAL), [fullCatalog]);
  const ctx = { isOwner, subscribed: isOwner };

  // Distinct, gender-correct device-voice assignment for System + each person, so a
  // man's stand-in sounds male, a woman's female, and different people sound
  // different — instead of every pick falling through to one default voice.
  const assignments = useMemo(() => buildStandInAssignments(fullCatalog, tts.voices), [fullCatalog, tts.voices]);

  // The actual device voiceURI to speak a given global selection in: a user PIN
  // (persona-voice-prefs) wins, else the auto gender-mapping. Read fresh from storage
  // so a pin set in the Voice tab applies here immediately, on every read-aloud — the
  // fix for "the chosen voice won't work afterward" + "Darrell still sounds female".
  const resolveSpeakURI = useCallback((id) => {
    const overrides = loadPersonaVoiceMap();
    const available = tts.voices;
    // A house voice that cannot answer falls back like the studio voice does.
    if (isSystemVoiceId(id) || isHouseVoiceId(id)) return resolveVoiceURIForId(SYSTEM_VOICE.id, { assignments, overrides, available });
    if (isPersonVoiceId(id)) {
      const c = fullCatalog.find((x) => x.personKey === personKeyOf(id));
      return c ? resolveVoiceURIForId(c.id, { assignments, overrides, available }) : undefined;
    }
    return id; // a specific browser voice / accent
  }, [assignments, fullCatalog, tts.voices]);

  // The ONE list every picker renders, in order (see VOICE_GROUPS above). Each
  // item is { id, label, group, ai, entitled, usable, note, background } —
  // `note` is the one-line truth shown for it, `background` whether it keeps
  // playing when the listener switches apps.
  //
  // Nothing is filtered away any more. This used to keep only ENGLISH phone
  // voices (`/^en/` on v.lang) and never named the NAS's voices at all; the
  // studio entry was called "System voice" and quietly read in the NAS's one
  // male voice while the studio was dark (DR-0655).
  const catalog = useMemo(() => {
    const sysDev = assignments[SYSTEM_VOICE.id];
    const studio = studioVoiceNote({ studio: studioHealth, ready: sovereignVoiceReady, houseUp: house.voices.length > 0 });
    const out = [{
      id: SYSTEM_VOICE_ID,
      label: studio.state === 'up' ? 'Church studio voice' : `Church studio voice (${studio.state === 'offline' ? 'offline now' : 'not answering yet'})`,
      group: VOICE_GROUPS.STUDIO, ai: false, entitled: true, usable: true,
      deviceVoice: sysDev ? sysDev.name : null, note: studio.note, state: studio.state,
      background: studio.state === 'up' || house.voices.length > 0,
    }];
    for (const v of personalVoices) {
      if (!canCloneVoice(v)) continue; // only consented personal voices are offerable
      const dev = assignments[v.id];
      const standIn = !resolveVoiceProvider(v, { sovereignVoiceReady }).real;
      out.push({
        id: personVoiceId(v.personKey), label: v.name, group: VOICE_GROUPS.PERSONAL, ai: true,
        entitled: isVoiceEntitled(v, ctx), usable: isVoiceEntitled(v, ctx),
        standIn,
        deviceVoice: dev ? dev.name : null,
        note: standIn
          ? 'A cloned voice (AI). The studio that makes it is not answering, so a stand-in reads for now, and says so.'
          : 'A cloned voice (AI), made by the church’s studio. Keeps playing when you switch apps.',
        background: !standIn || house.voices.length > 0,
      });
    }
    // THE HOUSE: exactly what the NAS reported as installed.
    const houseIds = new Set();
    for (const v of house.voices) {
      const gender = v.gender === 'male' ? 'man' : v.gender === 'female' ? 'woman' : '';
      const detail = [v.accent, gender].filter(Boolean).join(' ');
      houseIds.add(houseVoiceId(v.id));
      out.push({
        id: houseVoiceId(v.id), label: `${v.label}${detail ? ` · ${detail}` : ''}${v.quality === 'high' ? ' · slower' : ''}`,
        group: VOICE_GROUPS.HOUSE, ai: false, entitled: true, usable: true,
        note: v.note || HOUSE_NOTE, background: true, quality: v.quality, model: v.id,
      });
    }
    // A house voice the listener picked stays visible and chosen when the NAS
    // does not answer — with its honest state, never silently replaced.
    if (isHouseVoiceId(voiceId) && !houseIds.has(voiceId)) {
      out.push({
        id: voiceId, label: `${houseModelOf(voiceId)} (not answering right now)`, group: VOICE_GROUPS.HOUSE,
        ai: false, entitled: true, usable: true, background: false,
        note: 'The church server is not answering, so this reads in the phone’s voice until it is back, and says so.',
      });
    } else if (house.loaded && !house.voices.length) {
      out.push({
        id: 'house:', label: 'House voices are not answering right now', group: VOICE_GROUPS.HOUSE,
        ai: false, entitled: true, usable: false, background: false,
        note: 'The church server did not list its voices. They return here when it answers.',
      });
    }
    // THE PHONE: every voice its engine reports, English + natural first.
    const phone = rankDeviceVoices(tts.voices || []);
    for (const v of phone) {
      out.push({
        id: v.voiceURI, label: `${v.name}${v.localService === false ? ' (online)' : ''}`,
        group: VOICE_GROUPS.PHONE, ai: false, entitled: true, usable: true,
        note: v.localService === false ? PHONE_ONLINE_NOTE : PHONE_NOTE, background: false, lang: v.lang || '',
      });
    }
    if (isDeviceVoiceId(voiceId) && phone.length && !phone.some((v) => v.voiceURI === voiceId)) {
      out.push({
        id: voiceId, label: `${voiceId} (not on this device)`, group: VOICE_GROUPS.PHONE,
        ai: false, entitled: true, usable: true, background: false,
        note: 'Picked on another device. This phone does not have it, so the phone’s default voice reads, and says so.',
      });
    }
    return out;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personalVoices, tts.voices, isOwner, sovereignVoiceReady, studioHealth, assignments, house, voiceId]);

  const currentItem = useMemo(() => catalog.find((c) => c.id === voiceId) || catalog[0], [catalog, voiceId]);

  // Apply a chosen BROWSER voice to the engine so System/accent picks read in it.
  //
  // A VOICE-LIST REFRESH NEVER RESTARTS A READING (DR-0654). This effect ran on
  // every refresh of the phone's voice list, and setVoiceURI restarts the
  // sentence being spoken; a refresh in which the picked voice was briefly
  // missing restarted it in the default voice. A NEW PICK still applies at
  // once, mid-reading; a refresh of the same pick waits until nothing is read.
  const appliedVoiceRef = useRef(null);
  useEffect(() => {
    if (!tts.supported) return;
    if (!isDeviceVoiceId(voiceId)) return; // studio/clone/house handled at read()
    const newPick = appliedVoiceRef.current !== voiceId;
    if (!newPick && tts.isReading) return;
    appliedVoiceRef.current = voiceId;
    tts.setVoiceURI(voiceId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceId, tts.supported, tts.voices]);

  // BACKGROUND PLAYBACK (Darrell 2026-08-10: "let it run in the background
  // while I work on other apps etc... so I can hear the Word"). A backgrounded
  // page is frozen unless it is playing media, and Web Speech is not media — so
  // the session holds one silent looping element for exactly as long as the
  // reader is reading, and hands the OS lock-screen controls that drive THESE
  // controls. See lib/background-audio.js for the mechanism and its honest
  // limits (Android/Chromium is the proven path; iOS suspends device speech).
  const bgRef = useRef(null);
  const ctrlRef = useRef({});
  // NEXT / BACK FROM THE HEADSET, THE CAR AND THE LOCK SCREEN (Darrell
  // 2026-09-24: start anywhere, step through). The paragraph steps live in the
  // reader bar (it holds the follow map), so the bar hands them in here and
  // the OS 'nexttrack' / 'previoustrack' buttons call exactly what the bar's
  // forward and back buttons call.
  const skipRef = useRef({});
  const setSkipHandlers = useCallback((h) => { skipRef.current = h || {}; }, []);
  const titleRef = useRef('');
  const bg = useCallback(() => {
    if (!bgRef.current) bgRef.current = createBackgroundAudio();
    return bgRef.current;
  }, []);
  // The OS buttons, always reading the CURRENT controls through refs.
  const osControls = useCallback(() => ({
    onPlay: () => { const c = ctrlRef.current; if (c.resume) c.resume(); },
    onPause: () => { const c = ctrlRef.current; if (c.pause) c.pause(); },
    onStop: () => { const c = ctrlRef.current; if (c.stop) c.stop(); },
    onNext: () => { const k = skipRef.current; if (k.next) k.next(); },
    onPrev: () => { const k = skipRef.current; if (k.prev) k.prev(); },
  }), []);

  // SILENCE EVERY AUDIO VOICE, AND LET NONE OF THEM SPEAK AGAIN (DR-0654).
  // Pausing was not enough: a studio clip's onerror handed its text to the
  // phone's voice, so a clip torn down during a hand-off could start a second
  // voice after the new one had begun. Handlers are detached before the pause
  // and the source is dropped, so a silenced element stays silent.
  const silenceAudio = useCallback(() => {
    heldLiteRef.current = '';
    if (queueRef.current) { queueRef.current.stop(); queueRef.current = null; }
    setCloudPiece(-1);
    for (const el of [audioRef.current, liteAudioRef.current]) {
      if (!el) continue;
      try { el.onerror = null; el.onended = null; el.ontimeupdate = null; } catch (_) { /* a fake */ }
      try { el.pause(); } catch (_) { /* ignore */ }
      try { if (el.getAttribute && el.getAttribute('src') && !String(el.src).startsWith('data:audio/wav')) { el.removeAttribute('src'); if (el.load) el.load(); } } catch (_) { /* ignore */ }
    }
    audioRef.current = null;
  }, []);

  const stop = useCallback(() => {
    silenceAudio();
    try { tts.stop(); } catch (_) {}
    readingPinRef.current = null;
    setCloudPlaying(false);
    setCloudPaused(false);
    if (bgRef.current) bgRef.current.stop();
  }, [tts, silenceAudio]);

  // Pause / continue must work in BOTH voices — a cloned-voice reading is an
  // audio clip, not an utterance, and the panel's one Pause button has to hold
  // whichever is actually playing.
  const pause = useCallback(() => {
    if (audioRef.current) { try { audioRef.current.pause(); setCloudPaused(true); } catch (_) {} }
    tts.pause();
  }, [tts]);

  const resume = useCallback(() => {
    // A reading held while the page was hidden picks up in the NAS voice.
    if (heldLiteRef.current && resumeHeldRef.current()) return;
    if (audioRef.current) {
      try { const p = audioRef.current.play(); if (p && p.catch) p.catch(() => {}); setCloudPaused(false); } catch (_) {}
    }
    tts.resume();
  }, [tts]);

  // Stop only in-flight CLOUD audio before a fresh browser-voice read. The TTS
  // engine's play() already cancels a prior utterance safely; a bare cancel() here
  // (via the full stop()) immediately before the first speak() is swallowed on
  // Chrome/mobile — the "tap Read, nothing happens" race. So we don't pre-cancel.
  const stopCloud = useCallback(() => {
    silenceAudio();
    setCloudPlaying(false);
    setCloudProgress(0);
  }, [silenceAudio]);

  // Surface a silent-start miss (mobile blocked/suspended synth) instead of a dead
  // button — the engine flips `failed` when a tap produces no audio at all.
  useEffect(() => {
    if (tts.failed) setNotice('Audio didn’t start — press play once more, or pick the System voice.');
  }, [tts.failed, setNotice]);

  // Keep the OS transport and the keep-alive session in step with the reader:
  // released the moment nothing is being read, so a finished reading does not
  // hold an audio session (or a stale lock-screen card) open.
  useEffect(() => {
    const session = bgRef.current;
    if (!session) return;
    const reading = tts.isReading || cloudPlaying;
    if (!reading) { session.stop(); return; }
    // Stop hands every OS button back (background-audio release). A paragraph
    // jump restarts the engine and can flicker through not-reading, so the
    // buttons are put back the moment reading is live again.
    if (!session.wired) { session.describe({ title: titleRef.current }); session.onControl(osControls()); }
    session.setState((tts.isPaused || cloudPaused) ? 'paused' : 'playing');
  }, [tts.isReading, tts.isPaused, cloudPlaying, cloudPaused, osControls]);

  useEffect(() => () => { if (bgRef.current) bgRef.current.stop(); }, []);

  // The one play path, honoring the global voice preference.
  // `title` names the reading on the phone's lock screen / media notification.
  // CLAIM THE AUDIO SESSION INSIDE THE TAP — the caller must be able to do this
  // BEFORE it awaits anything.
  //
  // Darrell 2026-08-13: "I cant listen to a lesson in the background yet."
  // `read()` already claimed the session before its own awaits, and that was
  // correct but not sufficient: BOTH play paths in TTSControl reveal collapsed
  // content and `await settled(...)` — up to ten double-rAF frames — before they
  // ever call read(). By then the user's gesture is spent, the browser refuses
  // to start the silent looping element, the page never becomes an audio
  // session, and a backgrounded tab is frozen mid-sentence. The rule was written
  // here; the call site defeated it.
  //
  // start() is idempotent (it begins OR keeps the loop), so claiming early and
  // again inside read() is safe — and claiming early is the only thing that can
  // work, because a gesture cannot be re-entered once awaited.
  const claimAudio = useCallback((title) => {
    try {
      const session = bg();
      session.start();
      titleRef.current = title || (typeof document !== 'undefined' && document.title) || 'Reading';
      session.describe({ title: titleRef.current });
      session.onControl(osControls());
      session.setState('playing');
    } catch (_) { /* no audio session is a degraded read, never a broken one */ }
    // ONE VOICE ELEMENT, UNLOCKED INSIDE THE TAP (DR-0654). The NAS voice's
    // first piece arrives seconds after the press (a CPU synthesis, a
    // Funnel), and a browser that asks for a user gesture refuses a play()
    // made that late on a NEW element. So the element the voice will use is
    // made and played here, silent, while the gesture is live, and the queue
    // reuses it. Measured with a strict-gesture Chromium profile: a fresh
    // element after the await was refused; this one plays.
    try {
      if (typeof Audio !== 'undefined') {
        if (!liteAudioRef.current) liteAudioRef.current = new Audio();
        const el = liteAudioRef.current;
        if (!el.dataset || el.dataset.unlocked !== '1') {
          el.src = UNLOCK_WAV;
          const p = el.play();
          const done = () => {
            if (el.dataset) el.dataset.unlocked = '1';
            // Only the silent clip is paused; a voice piece that already took
            // the element is left playing.
            try { if (String(el.src).startsWith('data:audio/wav')) el.pause(); } catch (_) { /* ignore */ }
          };
          if (p && typeof p.then === 'function') p.then(done, () => { /* refused: the queue says so */ });
          else done();
        }
      }
    } catch (_) { /* a device without media still reads in its own voice */ }
  }, [bg, osControls]);

  // Which NAS voice reads: a house voice the listener PICKED is that model,
  // exactly; a man's stand-in reads as a man (DR-0138).
  const liteVoiceFor = useCallback((vid) => {
    if (isHouseVoiceId(vid)) return houseModelOf(vid);
    if (isPersonVoiceId(vid)) {
      const v = personalVoices.find((x) => x.personKey === personKeyOf(vid));
      return v && v.gender === 'female' ? 'female' : 'male';
    }
    return SYSTEM_VOICE.gender === 'male' ? 'male' : 'female';
  }, [personalVoices]);

  // THE PICK IS THE READING'S PIN (DR-0655 with DR-0654). One mechanism: the
  // voice the listener picked is written into the pin when a reading starts,
  // with the gender it speaks in, and every hand-off in that reading (the NAS
  // voice, the phone's voice, a pick-up after the dark) reads it from the pin.
  // Nothing re-resolves the pick mid-reading.
  const pinFor = useCallback((vid) => {
    let gender;
    if (isHouseVoiceId(vid)) {
      const h = house.voices.find((v) => v.id === houseModelOf(vid));
      gender = h && h.gender === 'female' ? 'female' : 'male';
    } else {
      gender = liteVoiceFor(vid);
    }
    const pin = newReadingPin(gender);
    pin.voiceId = vid;
    return pin;
  }, [liteVoiceFor, house.voices]);

  /**
   * Play `clean` in the NAS audio voice. `vid` defaults to the reading's pin.
   * A picked HOUSE voice is that exact model; otherwise the pinned gender
   * (DR-0654), never a fresh choice mid-reading. Resolves true once the first
   * piece plays.
   */
  const playLiteVoice = useCallback(async (clean, vidArg) => {
    const pin = readingPinRef.current;
    const vid = vidArg || (pin && pin.voiceId) || voiceId;
    const voice = isHouseVoiceId(vid)
      ? houseModelOf(vid)
      : ((pin && pin.gender) || liteVoiceFor(vid));
    // Pieces are cut from the text AS WRITTEN, so piece i is highlight segment
    // i; each piece is turned into its spoken form on its own way out
    // (DR-0653). Cutting the SPOKEN form moves the cuts wherever the spoken
    // form drops a full stop ("2 Tim." -> "2nd Timothy"), and from there on
    // the lit sentence is not the one being heard.
    const chunks = chunkForClips(clean);
    if (!chunks.length || typeof Audio === 'undefined') return false;
    // The NAS takes two syntheses at once and answers a third with 503 busy:
    // that is a wait, not a failure, so a busy piece is asked again shortly.
    const speakPiece = async (t, timeoutMs) => {
      let got = await synthesizeLite({ text: toSpokenForm(t), voice, timeoutMs });
      for (let tries = 0; got.error === 'voice-lite-503' && tries < 4; tries++) {
        await new Promise((r) => setTimeout(r, 600 * (tries + 1)));
        got = await synthesizeLite({ text: toSpokenForm(t), voice, timeoutMs });
      }
      return got;
    };
    // The first piece decides: if the NAS voice cannot answer it in time, the
    // device voice speaks instead and the road is not asked again for a while.
    const first = await speakPiece(chunks[0].text, LITE_FIRST_TIMEOUT_MS);
    // The reason is KEPT (DR-0654): the notice names what the NAS voice said.
    if (first.error || !first.url) { liteMissRef.current = first.error || 'voice-lite-empty'; markLiteVoiceMiss(liteMissRef.current); return false; }
    liteMissRef.current = '';
    const a = liteAudioRef.current || new Audio();
    liteAudioRef.current = a;
    let served = false;
    const q = createClipQueue({
      chunks,
      audio: a,
      rate: rateRef.current,
      fetchClip: (t) => {
        if (!served) { served = true; return Promise.resolve(first); }
        return speakPiece(t);
      },
      revoke: (u) => { try { URL.revokeObjectURL(u); } catch (_) { /* ignore */ } },
      onProgress: (f) => setCloudProgress(f),
      onPiece: (i) => { if (queueRef.current === q) setCloudPiece(i); },
      onEnd: () => { if (queueRef.current === q) { queueRef.current = null; audioRef.current = null; setCloudPlaying(false); setCloudPaused(false); setCloudProgress(0); setCloudPiece(-1); } },
      // A piece that cannot be had: the rest of the reading continues in the
      // device voice rather than stopping (and the panel says which voice).
      onFallback: (rest, _i, reason) => {
        if (queueRef.current !== q) return;
        queueRef.current = null; audioRef.current = null;
        setCloudPiece(-1);
        liteMissRef.current = reason || 'voice-lite-error';
        markLiteVoiceMiss(liteMissRef.current);
        // THE SCREEN IS OFF OR ANOTHER APP IS UP: never hand to Web Speech
        // (DR-0654). Android stops Web Speech in the background, so that
        // hand-off WAS the "stopped working in the background" report. The
        // place is held, the reading shows as paused, and it resumes in the
        // NAS voice the moment the page is seen again (or Play is pressed).
        if (pageHidden()) {
          heldLiteRef.current = rest || '';
          setCloudPlaying(true); setCloudPaused(true);
          try { if (bgRef.current) bgRef.current.setState('paused'); } catch (_) { /* ignore */ }
          return;
        }
        setCloudPlaying(false); setCloudProgress(0);
        // A play the screen refused is a gesture matter, not a voice fault:
        // the NAS voice is not rested, and the listener is told the one thing
        // that works.
        if (isPlayRefusal(reason)) { setNotice(`${sentenceCase(liteVoiceReasonText(reason))}.`); return; }
        // A picked house voice that stopped answering says so on the status line.
        if (isHouseVoiceId(vid)) setStandInWhy('house-offline');
        deviceRestRef.current(rest, reason);
      },
    });
    queueRef.current = q;
    audioRef.current = a;
    setCloudPlaying(true); setCloudPaused(false); setCloudProgress(0);
    setAudioVoice('audio');
    const ok = await q.start();
    return ok || queueRef.current === null;
  }, [liteVoiceFor, setNotice, voiceId]);

  // THE ONE HAND-OFF TO THE DEVICE VOICE (DR-0654). Every path that moves a
  // reading from an audio voice to the phone's own voice comes through here:
  // the audio element is silenced first (its handlers detached, so a late
  // error cannot start a second voice), then the phone speaks in the voice
  // PINNED for this reading, never a fresh pick from a list that may still be
  // empty. The switch is said in one line. A device with no voice of its own
  // (a Fire TV) hears nothing from a hand-off, so it is told why instead.
  deviceRestRef.current = async (rest, reason) => {
    silenceAudio();
    const pin = readingPinRef.current || (readingPinRef.current = pinFor(voiceId));
    // The voice list can still be empty on a cold phone; wait for it rather
    // than let the phone's default (any gender) take the reading.
    let voices = tts.voices || [];
    if (!voices.length && typeof window !== 'undefined' && window.speechSynthesis) {
      try { voices = await waitForVoices(window.speechSynthesis); } catch (_) { voices = []; }
    }
    setAudioVoice('device');
    if (!tts.supported || !voices.length) {
      const why = String(reason || '').startsWith('studio') ? 'the studio clip failed' : liteVoiceReasonText(reason, { hasKey: hasBridgeToken() });
      setNotice(`The reading stopped: ${why}.`);
      return;
    }
    const pick = deviceVoiceForPin(pin, { voices, preferredURI: resolveSpeakURI(pin.voiceId || voiceId) });
    pin.uri = pick.uri; pin.matched = pick.matched;
    if (rest) tts.speak(rest, pick.uri);
    const man = pin.gender === 'male';
    setNotice(pick.matched
      ? `The church’s reading voice stopped, so the rest reads in this phone’s own voice: ${man ? 'a man’s' : 'a woman’s'} voice, as before.`
      : `The church’s reading voice stopped, so the rest reads in this phone’s own voice. This phone has no ${man ? 'man’s' : 'woman’s'} voice to match it.`);
  };
  // A reading held in the background resumes in the NAS voice, from the piece
  // that failed, once the page is seen (DR-0654). If the NAS voice still
  // cannot answer then, the page is visible, so the device voice may take it.
  resumeHeldRef.current = () => {
    const rest = heldLiteRef.current;
    if (!rest) return false;
    heldLiteRef.current = '';
    setCloudPaused(false);
    playLiteVoice(rest).then((played) => {
      if (played) return;
      setCloudPlaying(false); setCloudProgress(0);
      deviceRestRef.current(rest, liteMissRef.current);
    });
    return true;
  };
  useEffect(() => {
    if (typeof document === 'undefined' || !document.addEventListener) return undefined;
    const onVisible = () => { if (!pageHidden() && heldLiteRef.current) resumeHeldRef.current(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  // `voice` reads THIS once in a given voice without changing the pick — the
  // tap-to-hear sample in the picker. Otherwise the listener's pick reads.
  const read = useCallback(async (text, { title, voice } = {}) => {
    const clean = String(text || '').trim();
    if (!clean) return;
    // ONE READING, ONE VOICE (DR-0654). A read called while a reading is live
    // (a paragraph jump, the hand-over into the dark, a pick-up) CONTINUES
    // that reading and keeps its pin; a read from rest starts a new one. The
    // PICK is part of the pin (DR-0655): a new pick, or a sample in another
    // voice, starts a new pin; the same pick keeps the reading's voice.
    const requested = voice || voiceId;
    const continuing = readingNowRef.current && !!readingPinRef.current
      && readingPinRef.current.voiceId === requested;
    if (!continuing) readingPinRef.current = pinFor(requested);
    const vid = readingPinRef.current.voiceId;
    setNotice('');
    setStandInWhy('');
    stopCloud();
    // Claim the audio session INSIDE the user's tap — after an await the
    // gesture is spent and the browser refuses to start it.
    claimAudio(title);
    // THE KEY BEFORE ANY NAS READ, WHATEVER THE VOICE (DR-0654). DR-0574 put
    // this ask inside the cloned-voice branch only, so the System voice, the
    // default nobody changes, went to /voice-lite with NO bearer on any device
    // that had never opened Real Estate, Taxes, the Gallery or the Voice
    // studio. The NAS answered 401, and on a Fire TV (Silk reports no device
    // voices) that was silence. Measured in Chromium at 960x540 with a family
    // key waiting at the RPC: one POST, Authorization absent, 401, nothing
    // heard. Asking here, once, costs one RPC on a device without the key.
    // A house pick is a NAS read too (DR-0655), and so is a phone pick on a
    // device that cannot speak (it reads in the house voice).
    const nasRead = isSystemVoiceId(vid) || isPersonVoiceId(vid) || isHouseVoiceId(vid)
      || (isDeviceVoiceId(vid) && !tts.supported);
    if (nasRead && !hasBridgeToken()) await provisionBridgeToken(supabase);
    // ONE VOICE AT A TIME (DR-0654). An audio voice is about to be tried, so
    // the phone's own voice stops first; before this, a hand-over or a jump
    // started the NAS clip while Web Speech was still mid-sentence, and the
    // reading spoke in two voices at once. tts.stop() only cancels speech this
    // reader's own engine is speaking (#1796), and the awaits below keep it
    // well clear of the speak() it could otherwise swallow.
    if (nasRead) { try { tts.stop(); } catch (_) { /* nothing to stop */ } }

    if (isPersonVoiceId(vid)) {
      const personKey = personKeyOf(vid);
      const voice = personalVoices.find((v) => v.personKey === personKey);
      if (voice && attemptStudio) {
        // THE KEY PROVISIONS ITSELF BEFORE THE READ (DR-0574). /speak is gated
        // on the family bridge key, and the key already provisions itself on a
        // signed-in family device through the RLS-deny-all + SECURITY DEFINER
        // RPC pair (migration 0128) — but only Real Estate ever asked for it,
        // so a device that had never opened Rentals was refused at the studio
        // door with a key it could have had. Ask here, once, before the first
        // attempt; a signed-out or non-family device gets nothing and the read
        // falls back honestly, exactly as before.
        if (!hasBridgeToken()) await provisionBridgeToken(supabase);
        const refBlob = await loadReference(personKey);
        if (refBlob) {
          const referenceDataUri = await blobToDataUri(refBlob);
          // The cloned voice gets the same spoken form the device voice does —
          // "2nd Timothy", never "two Timothy" (lib/speech-text.js).
          const { url, error } = await synthesizeSpeech({ text: toSpokenForm(clean), voiceId: voice.id, personKey, referenceDataUri, timeoutMs: speakTimeoutFor(studioHealth) });
          if (!error && url) {
            // Vendor use is never silent (DR-0138): when the bridge (not the
            // sovereign studio) carried this voice, say so — it is a recorded
            // sovereignty gap with a build path home.
            const ep = activeVoiceEndpoint();
            if (ep && ep.kind === 'bridge') {
              setNotice('Read in your voice via the vendor bridge — a recorded gap; arming the church’s own voice studio closes it.');
            }
            try {
              const a = new Audio(url); audioRef.current = a; setCloudPlaying(true); setCloudProgress(0); setAudioVoice('audio');
              // The chosen speed applies to the clip from its first second, and a
              // device that refuses the rate says so instead of quietly reading slow.
              const rateApplied = applyClipRate(a, rateRef.current);
              if (!rateApplied.honored) setNotice(clipRateNotice(rateApplied));
              // Follow-along for CLOUD audio (DR-0265): the clip carries no word
              // timings, but its playback fraction maps to a text position well
              // enough for sentence-level follow — the caller converts this
              // 0..1 into the segment to highlight. Estimation, honestly named:
              // exact per-word timing needs the voice service to return
              // timestamps (its own carried item).
              // A STREAMED CLIP NEVER REPORTS ITS LENGTH, AND THE HIGHLIGHT FROZE
              // ON SENTENCE ONE BECAUSE OF IT (2026-09-18). This callback used to
              // be `const d = a.duration; if (Number.isFinite(d) && d > 0)` and
              // nothing else — so on a chunk-encoded body, where `duration` is
              // Infinity for the whole of playback, it set nothing on every tick,
              // cloudProgress stayed at its initial 0, and the follow highlight
              // painted the first sentence once and never moved again while the
              // lesson read on to the end. clipFraction takes a real duration when
              // one exists and falls back through seekable to a named estimate, so
              // the highlight keeps moving either way.
              a.ontimeupdate = () => {
                const f = clipFraction({
                  currentTime: a.currentTime,
                  duration: a.duration,
                  seekableEnd: seekableEndOf(a),
                  estimatedSeconds: estimateClipSeconds(clean),
                });
                if (f != null) setCloudProgress(f);
              };
              a.onended = () => { setCloudPlaying(false); setCloudProgress(0); try { URL.revokeObjectURL(url); } catch (_) {} };
              a.onerror = () => { setCloudPlaying(false); setCloudProgress(0); deviceRestRef.current(clean, 'studio-clip-error'); };
              await a.play();
              return;
            } catch (_) { setCloudPlaying(false); setCloudProgress(0); }
          }
          // THE ROAD IS THE HOUSE'S PROBLEM; THE DEVICE IS THE READER'S.
          // A dark studio or an unmounted route (404, timeout, 5xx, no
          // answer) raises NO message -- the person can do nothing about it
          // and was shown "HTTP 404" over a lesson for it (2026-09-23). The
          // read falls back and the status line says so. A refused key or a
          // missing sample is the reader's, and keeps its sentence + door.
          if (isStudioRoadProblem(error)) {
            setStandInWhy('studio-offline');
            try { console.warn('[read-aloud] studio road failed, stand-in voice used:', error); } catch (_) { /* no console */ }
          } else {
            setNotice(`${voiceErrorReason(error)} Using a stand-in voice.`);
          }
        } else {
          setNotice(
            'Record a voice sample first in the Voice tab, then this reads in that voice.',
            { href: hrefForView('voice'), label: 'Open the Voice tab' },
          );
        }
      }
      // Stand-in until the sovereign studio is live: a gender-correct browser voice —
      // and SAY so (DR-0138), instead of silently sounding like "it never worked".
      // Status, not a message: the panel prints "stand-in voice until the
      // studio is armed" beside Reading. Still never silent (DR-0138).
      if (!sovereignVoiceReady) setStandInWhy((w) => w || 'studio-unarmed');
    }

    // THE SYSTEM VOICE REACHES THE SOVEREIGN STUDIO TOO (DR-0382).
    //
    // Darrell 2026-09-13: "can we get close to humans when talking or do we
    // still have to sound like a computer". Shaping the text fixed the RHYTHM;
    // this is the TIMBRE. Until now the studio was reachable only by a person's
    // CLONED voice, because voice-service hardcoded needsReference — so the
    // System voice, which is the default nobody changes, always fell to the
    // device engine even on a church running its own voice studio. That one
    // word is why every lesson sounded like Android.
    //
    // Fail-soft by construction: if the studio is not configured, refuses a
    // built-in request, or errors, this falls straight through to exactly the
    // device-voice path below. It can only ever sound better, never worse, and
    // a refusal is remembered so the round trip is paid once.
    if (isSystemVoiceId(vid) && sovereignVoiceReady && builtInVoiceSupport() !== 'no') {
      const { url, error } = await synthesizeSpeech({
        text: toSpokenForm(clean), voiceId: SYSTEM_VOICE.id, allowBuiltIn: true,
      });
      if (!error && url) {
        const ep = activeVoiceEndpoint();
        if (ep && ep.kind === 'bridge') {
          setNotice('Read via the vendor bridge — a recorded gap; arming the church’s own voice studio closes it.');
        }
        try {
          const a = new Audio(url); audioRef.current = a; setCloudPlaying(true); setCloudProgress(0); setAudioVoice('audio');
          // The chosen speed applies to the clip from its first second, and a
          // device that refuses the rate says so instead of quietly reading slow.
          const rateApplied = applyClipRate(a, rateRef.current);
          if (!rateApplied.honored) setNotice(clipRateNotice(rateApplied));
          // A STREAMED CLIP NEVER REPORTS ITS LENGTH, AND THE HIGHLIGHT FROZE
          // ON SENTENCE ONE BECAUSE OF IT (2026-09-18). This callback used to
          // be `const d = a.duration; if (Number.isFinite(d) && d > 0)` and
          // nothing else — so on a chunk-encoded body, where `duration` is
          // Infinity for the whole of playback, it set nothing on every tick,
          // cloudProgress stayed at its initial 0, and the follow highlight
          // painted the first sentence once and never moved again while the
          // lesson read on to the end. clipFraction takes a real duration when
          // one exists and falls back through seekable to a named estimate, so
          // the highlight keeps moving either way.
          a.ontimeupdate = () => {
            const f = clipFraction({
              currentTime: a.currentTime,
              duration: a.duration,
              seekableEnd: seekableEndOf(a),
              estimatedSeconds: estimateClipSeconds(clean),
            });
            if (f != null) setCloudProgress(f);
          };
          a.onended = () => { setCloudPlaying(false); setCloudProgress(0); try { URL.revokeObjectURL(url); } catch (_) {} };
          // A mid-clip failure is NOT silence: hand the same text to the device
          // engine so the reader keeps hearing the lesson.
          a.onerror = () => {
            setCloudPlaying(false); setCloudProgress(0);
            deviceRestRef.current(clean, 'studio-clip-error');
          };
          await a.play();
          return;
        } catch (_) { setCloudPlaying(false); setCloudProgress(0); }
      }
      // Nothing is said to the reader here on purpose. A built-in miss is not a
      // failure they can act on — the device voice is about to speak, and the
      // sovereignty notice above already covers the case that matters.
    }

    // THE STAND-IN IS AUDIO WHEN IT CAN BE (Darrell 2026-09-24: "Why doesn't
    // the player remain playing in the background when I switch between
    // apps?!!? Fix it."). Everything below this point is the phone's Web
    // Speech engine, which Android stops the moment the app leaves the screen.
    // So before falling to it, the System voice and a person's stand-in ask
    // the NAS's own voice (/voice-lite, Piper) for REAL AUDIO, played piece by
    // piece through one <audio> element: media, which the phone keeps playing.
    // A browser accent the listener picked on purpose is left as their choice.
    // A HOUSE voice the listener picked (DR-0655) is that exact NAS voice; if
    // the NAS cannot answer, the phone's voice reads and the status says why.
    //
    // A DEVICE WITH NO VOICES NEVER GETS A PHONE VOICE (Fire TV, 2026-09-25).
    // Silk exposes speechSynthesis and reports no voices at all. A phone voice
    // picked on another device follows the account here; reading it would be
    // silence. On such a device every read goes to the house voice instead.
    let noDeviceVoices = !tts.supported;
    if (isDeviceVoiceId(vid) && !noDeviceVoices && !(tts.voices || []).length
      && typeof window !== 'undefined' && window.speechSynthesis) {
      noDeviceVoices = !(await waitForVoices(window.speechSynthesis)).length;
    }
    if (isDeviceVoiceId(vid) && noDeviceVoices) {
      // The family key first, as for every NAS read (DR-0654).
      if (!hasBridgeToken()) await provisionBridgeToken(supabase);
      if (mayTryLiteVoice() && await playLiteVoice(clean, SYSTEM_VOICE_ID)) {
        setNotice('This device has no voice of its own, so the church’s house voice is reading.');
        return;
      }
    }
    if ((isSystemVoiceId(vid) || isPersonVoiceId(vid) || isHouseVoiceId(vid)) && mayTryLiteVoice()) {
      const played = await playLiteVoice(clean, vid);
      if (played) return;
    }
    if (isHouseVoiceId(vid)) setStandInWhy('house-offline');
    setAudioVoice('device');
    if (!tts.supported) { setNotice('This device can’t read aloud — try a different browser.'); return; }
    // Close the cold-start gap: on a fresh mobile load the device voice list can
    // still be empty at the tap; a read resolved then falls to the raw OS default
    // (the wrong gender / "never worked" report — DR-0138). Wait briefly for the
    // list and resolve against what ACTUALLY arrived — the memoized assignments
    // were built from the empty list and can't be trusted for this first read.
    // The PROSODY diversifier rides the same resolution: on a device whose voice
    // list can't produce a man or two distinct people (the Android one-female-
    // voice report, 2026-07-10), the person's deterministic PITCH does.
    const catalogIdOf = (id) => ((isSystemVoiceId(id) || isHouseVoiceId(id))
      ? SYSTEM_VOICE.id
      : isPersonVoiceId(id)
        ? (fullCatalog.find((x) => x.personKey === personKeyOf(id)) || {}).id
        : undefined);
    let uri = resolveSpeakURI(vid);
    let liveAssignments = assignments;
    let deviceVoices = tts.voices || [];
    if (!(tts.voices || []).length && typeof window !== 'undefined' && window.speechSynthesis) {
      const fresh = await waitForVoices(window.speechSynthesis);
      deviceVoices = fresh;
      if (fresh.length) {
        liveAssignments = buildStandInAssignments(fullCatalog, fresh);
        const overrides = loadPersonaVoiceMap();
        const cidFresh = catalogIdOf(vid);
        if (cidFresh) uri = resolveVoiceURIForId(cidFresh, { assignments: liveAssignments, overrides, available: fresh });
      } else {
        // NO VOICES AT ALL, after waiting. This is NOT the cold-start case the
        // wait exists for (DR-0138) — the list is genuinely empty because the
        // device has no speech engine installed. Fire TV is the one that found
        // it: Silk exposes speechSynthesis and SpeechSynthesisUtterance, so
        // isTTSSupported() answers true and the "can't read aloud" path never
        // runs, but nothing can ever speak.
        //
        // Falling through here would call speak() with no voice, produce
        // silence, and leave the start watchdog to report 'Audio didn't start
        // — press play once more', which is ADVICE THAT CANNOT WORK: pressing
        // again cannot install a voice engine. Naming the real cause costs one
        // branch and saves someone pressing a button forever.
        //
        // AND THE MESSAGE MUST NAME THE RIGHT CAUSE. The first version of this
        // said "open the lesson on a phone or tablet" — defeatist AND wrong,
        // because it treats a device limit as the end of the story when the
        // app already carries a device-independent answer. The System-voice
        // cloud read above synthesizes server-side and plays through an
        // <audio> element, which works on Fire TV, on a smart TV, on anything
        // with a speaker. It did not fire here for exactly one reason: no
        // voice endpoint is configured. So the notice says which of the two
        // situations this actually is, because they have completely different
        // remedies and only one of them is ours to fix.
        // WHICH of the two it is comes from the PROBE, not from configuration.
        // It used to come from isVoiceServiceReady(), and that stopped being a
        // question the moment /voice became a same-origin route: the URL is now
        // built from window.location and is therefore ALWAYS present, so the
        // config check answers true on every device and the second branch below
        // could never render. A message that cannot render is not a message —
        // and the one that CAN would have told a reader the service "did not
        // answer" on a night when it was simply never switched on. Same defect
        // class as DR-0440, which is quoted three files away: a config check
        // reading as armed. The studio is ASKED instead.
        //
        // THE NAS VOICE'S OWN REASON IS THE CAUSE (DR-0654). This notice
        // used to name only the GPU studio, whatever the NAS voice had said.
        // On Darrell's Firestick the NAS voice refused a device with no key
        // (401) and the screen said "the church's voice service did not
        // answer", sending him to wait for a service that was up. When the
        // NAS voice was asked, its answer is what is said: no key (sign in),
        // slow, busy, a missing route, or a play the screen refused.
        if (nasRead && liteMissRef.current) {
          setNotice(`This device has no voice of its own, and ${liteVoiceReasonText(liteMissRef.current, { hasKey: hasBridgeToken() })}.`);
          return;
        }
        setNotice(studioHealth === 'down'
          ? 'This device has no voice of its own, and the church’s voice service did not answer. The text is all here to read; the reading voice returns when the service is back.'
          : studioHealth === 'up'
            ? 'This device has no voice of its own, and the church’s voice service is answering but could not read this passage. The text is all here; try once more in a moment.'
            : 'This device has no voice of its own — and the church’s own voice service has not answered yet. Once it is up, the lesson reads aloud HERE, on this screen, with no device voice needed.');
        return;
      }
    }
    // A PHONE VOICE PICKED ON PURPOSE IS NEVER SWAPPED IN SILENCE (2026-09-25).
    // A pick made on another device (it follows the account) may not exist on
    // this one; the engine then speaks its default. Say so, rather than let the
    // listener think the pick was ignored.
    if (isDeviceVoiceId(vid) && deviceVoices.length
      && !deviceVoices.some((v) => v && v.voiceURI === vid)) {
      setNotice('The voice you picked is not on this device, so it is reading in the phone’s default voice. Pick again from the Voice list to change it.');
    }
    const cid = catalogIdOf(vid);
    const pitch = cid ? standInPitch(fullCatalog, liveAssignments, cid) : undefined;
    // THE READING KEEPS ITS VOICE (DR-0654). A reading that already chose a
    // device voice keeps it through every jump and hand-off; a new reading
    // pins the voice it starts in, and its gender, so a later hand-over to the
    // NAS voice speaks as the same kind of voice.
    const pin = readingPinRef.current;
    if (pin && continuing && pin.uri) uri = pin.uri;
    else if (pin) {
      pin.uri = uri;
      pin.matched = true;
      pin.gender = genderOfDeviceVoice(uri, deviceVoices) || pin.gender;
    }
    tts.speak(clean, uri, pitch);
  }, [voiceId, personalVoices, sovereignVoiceReady, attemptStudio, studioHealth, tts, stopCloud, resolveSpeakURI, fullCatalog, assignments, claimAudio, setNotice, playLiteVoice, pinFor]);

  // HEAR BEFORE CHOOSING (DR-0655): a short sample in one voice, without
  // touching the listener's pick or a reading already under way.
  const preview = useCallback((id, text = VOICE_SAMPLE) => read(text, { voice: id, title: 'Voice sample' }), [read]);

  // The OS media buttons drive the SAME controls the panel does — kept in a ref
  // so a lock-screen tap can never call a stale closure.
  ctrlRef.current = { pause, resume, stop };
  readingNowRef.current = !!(tts.isReading || cloudPlaying || heldLiteRef.current);

  return {
    supported: tts.supported,
    // The synchronous claim a play handler makes INSIDE the tap, before it
    // awaits a reveal. Omitting it here is what made claimAudio undefined at
    // the call site and threw on every press — caught by the reader suite.
    claimAudio,
    // The bar's paragraph steps, handed in for the OS skip buttons.
    setSkipHandlers,
    isReading: tts.isReading || cloudPlaying,
    isPaused: tts.isPaused || cloudPaused,
    rate: tts.rate,
    segmentIndex: tts.segmentIndex,
    // Follow-along (DR-0264): device-voice reads report per-sentence progress
    // via segmentIndex and, where the engine fires them, per-word boundaries
    // via this handler. Cloud (cloned-voice) audio has neither — a caller
    // checks deviceRead before following so a highlight never sits frozen on
    // sentence 0 while a cloud clip plays.
    setBoundaryHandler: tts.setBoundaryHandler,
    deviceRead: !cloudPlaying,
    cloudProgress,
    // The NAS voice's piece IS the reading segment (-1 when not playing one).
    cloudPiece,
    voiceId, setVoiceId, catalog, currentItem, notice,
    // Tap-to-hear, and whether the house (NAS) list has answered yet.
    preview,
    houseVoicesLoaded: house.loaded,
    standInWhy,
    audioVoice,
    // setNotice is exported so the panel can DISMISS a notice (2026-09-22).
    // Before this the only clear was at the start of the next read, so a
    // fault message stayed on top of the lesson indefinitely.
    setNotice,
    // The door a notice carries, when it has one: { href, label }.
    noticeAction,
    read, pause, resume, stop, setRate,
  };
}
