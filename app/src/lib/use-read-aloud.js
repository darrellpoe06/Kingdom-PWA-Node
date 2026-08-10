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
} from './reading-voice.js';
import { mergeVoiceCatalog, canCloneVoice, isVoiceEntitled, resolveVoiceProvider, KIND, SYSTEM_VOICE } from './voice-registry.js';
import { buildStandInAssignments, resolveVoiceURIForId, standInPitch } from './voice-assignment.js';
import { loadPersonaVoiceMap } from './persona-voice-prefs.js';
import { isVoiceServiceReady, synthesizeSpeech, activeVoiceEndpoint } from './voice-service.js';
import { loadReference, blobToDataUri } from './voice-reference.js';
import { loadVoiceProfiles } from './voice-sync.js';
import { createBackgroundAudio } from './background-audio.js';
import { toSpokenForm } from './speech-text.js';
import { supabase } from './supabase.js';

/**
 * @param {object} opts
 * @param {boolean} opts.isOwner       entitled to personal (subscriber) voices
 * @param {boolean} opts.sovereignVoiceReady  override (defaults to the endpoint config)
 */
export function useReadAloud({ isOwner = false, sovereignVoiceReady = isVoiceServiceReady() } = {}) {
  const tts = useTextToSpeech();
  const { voiceId, setVoiceId } = useReadingVoice(supabase);
  const [profiles, setProfiles] = useState([]);
  const [cloudPlaying, setCloudPlaying] = useState(false);
  const [cloudPaused, setCloudPaused] = useState(false);
  const [cloudProgress, setCloudProgress] = useState(0); // 0..1 through the cloud clip
  const [notice, setNotice] = useState('');
  const audioRef = useRef(null);

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
    if (isSystemVoiceId(id)) return resolveVoiceURIForId(SYSTEM_VOICE.id, { assignments, overrides, available });
    if (isPersonVoiceId(id)) {
      const c = fullCatalog.find((x) => x.personKey === personKeyOf(id));
      return c ? resolveVoiceURIForId(c.id, { assignments, overrides, available }) : undefined;
    }
    return id; // a specific browser voice / accent
  }, [assignments, fullCatalog, tts.voices]);

  // The merged catalog every picker renders: System (free) + personal (cloned) +
  // browser voices/accents. Each item is { id, label, group, ai, entitled, usable }.
  const catalog = useMemo(() => {
    const sysDev = assignments[SYSTEM_VOICE.id];
    const out = [{ id: SYSTEM_VOICE_ID, label: 'System voice', group: 'Default', ai: false, entitled: true, usable: true, deviceVoice: sysDev ? sysDev.name : null }];
    for (const v of personalVoices) {
      if (!canCloneVoice(v)) continue; // only consented personal voices are offerable
      const dev = assignments[v.id];
      out.push({
        id: personVoiceId(v.personKey), label: v.name, group: 'Your voices', ai: true,
        entitled: isVoiceEntitled(v, ctx), usable: isVoiceEntitled(v, ctx),
        standIn: !resolveVoiceProvider(v, { sovereignVoiceReady }).real,
        deviceVoice: dev ? dev.name : null,
      });
    }
    const browser = (tts.voices || []).filter((v) => v && /^en/i.test(v.lang || ''));
    const list = browser.length ? browser : (tts.voices || []);
    for (const v of list) {
      out.push({ id: v.voiceURI, label: `${v.name}${v.localService ? '' : ' (online)'}`, group: 'Voices & accents', ai: false, entitled: true, usable: true });
    }
    return out;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personalVoices, tts.voices, isOwner, sovereignVoiceReady, assignments]);

  const currentItem = useMemo(() => catalog.find((c) => c.id === voiceId) || catalog[0], [catalog, voiceId]);

  // Apply a chosen BROWSER voice to the engine so System/accent picks read in it.
  useEffect(() => {
    if (!tts.supported) return;
    if (isSystemVoiceId(voiceId) || isPersonVoiceId(voiceId)) return; // system/clone handled at read()
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
  const bg = useCallback(() => {
    if (!bgRef.current) bgRef.current = createBackgroundAudio();
    return bgRef.current;
  }, []);

  const stop = useCallback(() => {
    try { tts.stop(); } catch (_) {}
    if (audioRef.current) { try { audioRef.current.pause(); } catch (_) {} audioRef.current = null; }
    setCloudPlaying(false);
    setCloudPaused(false);
    if (bgRef.current) bgRef.current.stop();
  }, [tts]);

  // Pause / continue must work in BOTH voices — a cloned-voice reading is an
  // audio clip, not an utterance, and the panel's one Pause button has to hold
  // whichever is actually playing.
  const pause = useCallback(() => {
    if (audioRef.current) { try { audioRef.current.pause(); setCloudPaused(true); } catch (_) {} }
    tts.pause();
  }, [tts]);

  const resume = useCallback(() => {
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
    if (audioRef.current) { try { audioRef.current.pause(); } catch (_) {} audioRef.current = null; }
    setCloudPlaying(false);
    setCloudProgress(0);
  }, []);

  // Surface a silent-start miss (mobile blocked/suspended synth) instead of a dead
  // button — the engine flips `failed` when a tap produces no audio at all.
  useEffect(() => {
    if (tts.failed) setNotice('Audio didn’t start — press play once more, or pick the System voice.');
  }, [tts.failed]);

  // Keep the OS transport and the keep-alive session in step with the reader:
  // released the moment nothing is being read, so a finished reading does not
  // hold an audio session (or a stale lock-screen card) open.
  useEffect(() => {
    const session = bgRef.current;
    if (!session) return;
    const reading = tts.isReading || cloudPlaying;
    if (!reading) { session.stop(); return; }
    session.setState(tts.isPaused ? 'paused' : 'playing');
  }, [tts.isReading, tts.isPaused, cloudPlaying]);

  useEffect(() => () => { if (bgRef.current) bgRef.current.stop(); }, []);

  // The one play path, honoring the global voice preference.
  // `title` names the reading on the phone's lock screen / media notification.
  const read = useCallback(async (text, { title } = {}) => {
    const clean = String(text || '').trim();
    if (!clean) return;
    setNotice('');
    stopCloud();
    // Claim the audio session INSIDE the user's tap — after an await the
    // gesture is spent and the browser refuses to start it.
    const session = bg();
    session.start();
    session.describe({ title: title || (typeof document !== 'undefined' && document.title) || 'Reading' });
    session.onControl({
      onPlay: () => { const c = ctrlRef.current; if (c.resume) c.resume(); },
      onPause: () => { const c = ctrlRef.current; if (c.pause) c.pause(); },
      onStop: () => { const c = ctrlRef.current; if (c.stop) c.stop(); },
    });
    session.setState('playing');

    if (isPersonVoiceId(voiceId)) {
      const personKey = personKeyOf(voiceId);
      const voice = personalVoices.find((v) => v.personKey === personKey);
      if (voice && resolveVoiceProvider(voice, { sovereignVoiceReady }).real && sovereignVoiceReady) {
        const refBlob = await loadReference(personKey);
        if (refBlob) {
          const referenceDataUri = await blobToDataUri(refBlob);
          // The cloned voice gets the same spoken form the device voice does —
          // "2nd Timothy", never "two Timothy" (lib/speech-text.js).
          const { url, error } = await synthesizeSpeech({ text: toSpokenForm(clean), voiceId: voice.id, personKey, referenceDataUri });
          if (!error && url) {
            // Vendor use is never silent (DR-0138): when the bridge (not the
            // sovereign studio) carried this voice, say so — it is a recorded
            // sovereignty gap with a build path home.
            const ep = activeVoiceEndpoint();
            if (ep && ep.kind === 'bridge') {
              setNotice('Read in your voice via the vendor bridge — a recorded gap; arming the church’s own voice studio closes it.');
            }
            try {
              const a = new Audio(url); audioRef.current = a; setCloudPlaying(true); setCloudProgress(0);
              // Follow-along for CLOUD audio (DR-0265): the clip carries no word
              // timings, but its playback fraction maps to a text position well
              // enough for sentence-level follow — the caller converts this
              // 0..1 into the segment to highlight. Estimation, honestly named:
              // exact per-word timing needs the voice service to return
              // timestamps (its own carried item).
              a.ontimeupdate = () => {
                const d = a.duration;
                if (Number.isFinite(d) && d > 0) setCloudProgress(Math.min(1, a.currentTime / d));
              };
              a.onended = () => { setCloudPlaying(false); setCloudProgress(0); try { URL.revokeObjectURL(url); } catch (_) {} };
              a.onerror = () => { setCloudPlaying(false); setCloudProgress(0); if (tts.supported) tts.speak(clean, resolveSpeakURI(voiceId)); };
              await a.play();
              return;
            } catch (_) { setCloudPlaying(false); setCloudProgress(0); }
          }
          setNotice('Voice endpoint unreachable — using a stand-in voice.');
        } else {
          setNotice('Record a voice sample first — then this reads in that voice.');
        }
      }
      // Stand-in until the sovereign studio is live: a gender-correct browser voice —
      // and SAY so (DR-0138), instead of silently sounding like "it never worked".
      if (!sovereignVoiceReady) {
        setNotice('Reading in a stand-in voice — your real voice turns on when the church’s own voice studio is armed (sovereign, no vendor).');
      }
    }

    if (!tts.supported) { setNotice('This device can’t read aloud — try a different browser.'); return; }
    // Close the cold-start gap: on a fresh mobile load the device voice list can
    // still be empty at the tap; a read resolved then falls to the raw OS default
    // (the wrong gender / "never worked" report — DR-0138). Wait briefly for the
    // list and resolve against what ACTUALLY arrived — the memoized assignments
    // were built from the empty list and can't be trusted for this first read.
    // The PROSODY diversifier rides the same resolution: on a device whose voice
    // list can't produce a man or two distinct people (the Android one-female-
    // voice report, 2026-07-10), the person's deterministic PITCH does.
    const catalogIdOf = (id) => (isSystemVoiceId(id)
      ? SYSTEM_VOICE.id
      : isPersonVoiceId(id)
        ? (fullCatalog.find((x) => x.personKey === personKeyOf(id)) || {}).id
        : undefined);
    let uri = resolveSpeakURI(voiceId);
    let liveAssignments = assignments;
    if (!(tts.voices || []).length && typeof window !== 'undefined' && window.speechSynthesis) {
      const fresh = await waitForVoices(window.speechSynthesis);
      if (fresh.length) {
        liveAssignments = buildStandInAssignments(fullCatalog, fresh);
        const overrides = loadPersonaVoiceMap();
        const cidFresh = catalogIdOf(voiceId);
        if (cidFresh) uri = resolveVoiceURIForId(cidFresh, { assignments: liveAssignments, overrides, available: fresh });
      }
    }
    const cid = catalogIdOf(voiceId);
    const pitch = cid ? standInPitch(fullCatalog, liveAssignments, cid) : undefined;
    tts.speak(clean, uri, pitch);
  }, [voiceId, personalVoices, sovereignVoiceReady, tts, stopCloud, resolveSpeakURI, fullCatalog, assignments, bg]);

  // The OS media buttons drive the SAME controls the panel does — kept in a ref
  // so a lock-screen tap can never call a stale closure.
  ctrlRef.current = { pause, resume, stop };

  return {
    supported: tts.supported,
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
    voiceId, setVoiceId, catalog, currentItem, notice,
    read, pause, resume, stop, setRate: tts.setRate,
  };
}
