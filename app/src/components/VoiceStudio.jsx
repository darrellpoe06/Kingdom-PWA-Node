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
import { loadVoiceProfiles, enrollMyVoice, revokeMyVoice } from '../lib/voice-sync.js';
import {
  buildStandInAssignments, resolveVoiceURIForId, deviceVoiceOptions, hasVoiceOfGender,
} from '../lib/voice-assignment.js';
import { loadPersonaVoiceMap, savePersonaVoice } from '../lib/persona-voice-prefs.js';
import { isVoiceServiceReady, synthesizeSpeech } from '../lib/voice-service.js';
import { SOVEREIGNTY_GAPS, GAPS_RECORDED, liveVoicePath } from '../lib/sovereignty-gaps.js';
import { useReadingVoice, personVoiceId, SYSTEM_VOICE_ID } from '../lib/reading-voice.js';
import {
  useVoiceRecorder, RECORD_SCRIPT, formatDuration, durationQuality, meetsMinDuration,
} from '../lib/voice-recording.js';
import {
  saveReference, loadReference, hasReference, clearReference, blobToDataUri,
} from '../lib/voice-reference.js';
import { getInstanceId } from '../lib/table-sync.js';
import { supabase } from '../lib/supabase.js';
import SectionTabs from './SectionTabs.jsx';

const SAMPLE = 'Welcome. This is your chosen reading voice. Paste any message, lesson, or passage below and press Read to hear it aloud in this voice.';
const SAMPLE_SHORT = 'For God so loved the world. The Lord is my shepherd; I shall not want.';

const PERSONA_NAME = { darrell: 'Darrell Poe', christina: 'Christina Poe', 'bishop-gwin': 'Bishop Lloyd E. Gwin' };

export default function VoiceStudio({ personaKey = null, isOwner = false, sovereignVoiceReady = isVoiceServiceReady() }) {
  const tts = useTextToSpeech();
  const { setVoiceId: setGlobalVoiceId } = useReadingVoice(supabase); // the ONE global pref
  const [profiles, setProfiles] = useState([]);
  const [userId, setUserId] = useState(null);
  const [instanceId, setInstanceId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [text, setText] = useState(SAMPLE);
  const [selectedId, setSelectedId] = useState(() => loadVoiceChoice());
  const [cloudPlaying, setCloudPlaying] = useState(false); // real cloned-voice audio in flight
  const audioRef = useRef(null);

  // Record-your-voice enrollment (the recorded sample IS the clone reference).
  const recorder = useVoiceRecorder();
  const [myRefExists, setMyRefExists] = useState(false);

  // Resolve identity + load enrollment rows (RLS-scoped to the caller's instance).
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (alive) setUserId(data?.user?.id || null);
      } catch (_) { /* signed out — local-only, still usable */ }
      try { const id = await getInstanceId(); if (alive) setInstanceId(id || null); } catch (_) { /* offline */ }
      const { profiles: rows } = await loadVoiceProfiles();
      if (alive && rows) setProfiles(rows);
      if (personaKey) { try { if (alive) setMyRefExists(await hasReference(personaKey)); } catch (_) {} }
    })();
    return () => { alive = false; };
  }, [personaKey]);

  // Stop any cloud audio when the surface unmounts.
  useEffect(() => () => { if (audioRef.current) { try { audioRef.current.pause(); } catch (_) {} audioRef.current = null; } }, []);

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
  // The voiceURI each option ACTUALLY speaks in right now (pin first, else auto).
  const resolvedURIFor = (v) => resolveVoiceURIForId(v.id, { assignments, overrides, available: tts.voices });
  const pinDeviceVoice = (catalogId, voiceURI) => {
    setOverrides(savePersonaVoice(catalogId, voiceURI || ''));
  };

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
        setNotice('Record a voice sample first — then this reads in that voice.');
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
      // Studio unreachable -> honest fallback to the labeled stand-in, with a note.
      setNotice('The voice studio was unreachable — using the stand-in voice for now.');
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
  const canEnrollSelf = !!(personaKey && PERSONA_NAME[personaKey] && userId && instanceId);

  const enrollSelf = async () => {
    if (!canEnrollSelf) { setNotice('Sign in to enroll your voice.'); return; }
    setBusy(true); setNotice('');
    const { error } = await enrollMyVoice({
      instanceId, userId, personKey: personaKey,
      displayName: PERSONA_NAME[personaKey], scope: 'read-aloud-narration',
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
    const ok = await saveReference(personaKey, recorder.blob);
    if (!ok) { setNotice('That sample was too short or empty — record a few more seconds.'); setBusy(false); return; }
    setMyRefExists(true);
    // Persist consent (best-effort; the local sample already works for synth).
    if (canEnrollSelf) {
      const { error } = await enrollMyVoice({
        instanceId, userId, personKey: personaKey,
        displayName: PERSONA_NAME[personaKey], scope: 'read-aloud-narration',
      });
      if (!error) { const { profiles: rows } = await loadVoiceProfiles(); if (rows) setProfiles(rows); }
    }
    recorder.reset();
    setNotice(sovereignVoiceReady
      ? 'Saved. Select your voice and press Read — it will speak in your voice.'
      : 'Saved on this device. The moment the voice endpoint is live, this reads in your real voice.');
    setBusy(false);
  };

  const clearMyRecording = async () => {
    await clearReference(personaKey);
    setMyRefExists(false);
    setNotice('Your voice sample was removed from this device.');
  };

  const showRecorder = !!(personaKey && PERSONA_NAME[personaKey]);

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
        <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mb-2">
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
          <p className="text-[11px] text-[#B85838] mt-2">This device can’t read aloud — try a different browser.</p>
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
            <div className="flex items-center gap-1 ml-auto" role="group" aria-label="Reading speed">
              {RATE_STEPS.map((s) => {
                const on = Math.abs(tts.rate - s.value) < 0.001;
                return (
                  <button key={s.value} type="button" onClick={() => tts.setRate(s.value)} aria-pressed={on} title={s.name}
                    className={`px-2 py-1.5 text-[10px] uppercase tracking-wider border focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838] ${on ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815]'}`}>{s.label}</button>
                );
              })}
            </div>
          </div>
        )}
        {tts.supported && tts.voices.length === 0 && (
          <p className="text-[10px] text-[#5A5751] mt-2">Your device is still loading its voices — give it a moment, then press Read again.</p>
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
          const isMine = personaKey && v.personKey === personaKey;
          const isSel = selected && selected.id === v.id;
          return (
            <div key={v.id} className={`border p-3 ${isSel ? 'border-[#1A1815] bg-[#FAF8F4]' : 'border-[#E8E4DC] bg-white'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[#1A1815]">{v.name}</span>
                    {aiVoiceLabel(v) && (
                      <span className="text-[9px] uppercase tracking-wider bg-[#1A1815] text-white px-1.5 py-0.5">AI-generated voice</span>
                    )}
                    {v.kind === KIND.SYNTHETIC && (
                      <span className="text-[9px] uppercase tracking-wider border border-[#1A1815] text-[#1A1815] px-1.5 py-0.5">Free</span>
                    )}
                    {v.kind === KIND.PERSONAL && (
                      <span className="text-[9px] uppercase tracking-wider border border-[#B85838] text-[#B85838] px-1.5 py-0.5">Subscriber voice</span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#5A5751] mt-0.5">{v.description}</div>
                  <div className={`text-[10px] mt-1 ${status.tone === 'ok' ? 'text-[#1A1815]' : status.tone === 'off' ? 'text-[#B85838]' : 'text-[#5A5751]'}`}>
                    {status.label}
                    {prov.standIn ? ' · plays a stand-in until the voice studio is live' : ''}
                    {prov.real && v.kind === KIND.PERSONAL ? ' · cloned voice live' : ''}
                  </div>
                  {/* Pick the ACTUAL device voice this option speaks in — the same
                      voices other apps use (speechSynthesis.getVoices()). The choice
                      persists and applies to every read-aloud. This is the fix for
                      "still sounds female for Darrell": pin a male voice here. */}
                  {selectable && deviceOptions.length > 0 && (
                    <div className="mt-1.5">
                      <label htmlFor={`dv-${v.id}`} className="text-[10px] text-[#5A5751] block mb-0.5">
                        {prov.standIn ? 'Stand-in device voice' : 'Device voice'}
                      </label>
                      <select
                        id={`dv-${v.id}`}
                        value={resolvedURIFor(v) || ''}
                        onChange={(e) => pinDeviceVoice(v.id, e.target.value)}
                        className="text-[11px] border border-[#E8E4DC] bg-white text-[#1A1815] px-2 py-1 rounded-md max-w-[12rem] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]"
                      >
                        {deviceOptions.map((o) => (
                          <option key={o.uri} value={o.uri}>
                            {o.name}{o.gender !== 'unknown' ? ` · ${o.gender}` : ''}{o.lang ? ` (${o.lang})` : ''}
                          </option>
                        ))}
                      </select>
                      {v.kind === KIND.PERSONAL && v.gender === 'male' && !hasVoiceOfGender(tts.voices, 'male') && (
                        <p className="text-[10px] text-[#B85838] mt-0.5 max-w-[15rem]">This browser only exposes female voices to web pages. To get a male voice on Android: pick <strong>“Phone’s default voice”</strong> above, then set a male voice in <strong>Android Settings → Text-to-speech</strong>. (Your real voice needs the voice-clone endpoint.)</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  {selectable ? (
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => sampleVoice(v)} disabled={busy}
                        title="Hear this voice now"
                        className="text-[11px] uppercase tracking-wider px-2 py-1.5 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">▶ Sample</button>
                      <button type="button" onClick={() => choose(v)} aria-pressed={isSel}
                        className={`text-[11px] uppercase tracking-wider px-3 py-1.5 border focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838] ${isSel ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white'}`}
                      >{isSel ? '✓ In use' : 'Use'}</button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-[#5A5751] text-right max-w-[9rem]">
                      {canCloneVoice(v) ? 'Available on a subscription' : 'Invite to enroll — usable only after they consent'}
                    </span>
                  )}
                  {isMine && v.consentState !== CONSENT.GRANTED && (
                    <button type="button" disabled={busy || !canEnrollSelf} onClick={enrollSelf}
                      className="text-[10px] uppercase tracking-wider px-2 py-1 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">
                      Enroll my voice
                    </button>
                  )}
                  {isMine && v.consentState === CONSENT.GRANTED && v.remoteId && (
                    <button type="button" disabled={busy} onClick={() => revokeSelf(v)}
                      className="text-[10px] uppercase tracking-wider px-2 py-1 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">
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
            <div className="text-sm font-semibold text-[#1A1815]">🎙 Record your voice — {PERSONA_NAME[personaKey]}</div>
            <span className="text-[9px] uppercase tracking-wider bg-[#1A1815] text-white px-1.5 py-0.5">AI-generated voice</span>
          </div>
          <p className="text-[12px] text-[#5A5751] leading-relaxed mb-3">
            Read the lines below aloud (about 30 seconds). This becomes <strong>your</strong> voice for
            reading app text — clean audio, and recording it <strong>is</strong> your consent. It stays on
            this device; it’s only ever sent to your own voice endpoint to read text you choose.
          </p>

          {!recorder.supported ? (
            <p className="text-[11px] text-[#B85838]">Recording isn’t supported in this browser — try Chrome or Safari on your phone.</p>
          ) : (
            <>
              <div className="text-[12px] text-[#1A1815] leading-relaxed border border-[#E8E4DC] bg-[#FAF8F4] p-2 mb-3">
                {RECORD_SCRIPT.map((line, i) => <div key={i} className="mb-1">{line}</div>)}
              </div>

              {myRefExists && !recorder.blob && !recorder.recording && (
                <div className="text-[11px] text-[#1A1815] mb-2">✓ A voice sample is saved on this device.
                  <button type="button" onClick={clearMyRecording} className="ml-2 underline text-[#B85838] hover:no-underline">Remove</button>
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
                    <span className={`text-[11px] ${durationQuality(recorder.seconds).tone === 'short' ? 'text-[#B85838]' : 'text-[#1A1815]'}`}>{durationQuality(recorder.seconds).label}</span>
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
              {recorder.error && <p className="text-[11px] text-[#B85838] mt-2">{recorder.error}</p>}
              {!sovereignVoiceReady && (
                <p className="text-[10px] text-[#5A5751] mt-2">Recording works now. Hearing your voice read <em>new</em> text needs the voice endpoint live (bridge or the church GPU studio) — see your steward for the one-time enable.</p>
              )}
            </>
          )}
        </div>
      ),
    } : null,
  ];

  return (
    <div className="max-w-3xl">
      <div className="mb-1 text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">🔊 Voice</div>
      <h1 className="text-2xl font-semibold text-[#1A1815] mb-1" style={{ fontFamily: '"Fraunces", serif' }}>Listen to anything</h1>
      <p className="text-sm text-[#5A5751] mb-5 leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
        Pick a voice, then paste any message, lesson, or passage to hear it read aloud. On a reading
        page (Scripture, The Word, a lesson) the floating 🔊 button reads the whole page.
      </p>

      {/* The honesty banner — never hidden while the studio is not live. Pinned above the strip. */}
      {!sovereignVoiceReady && (
        <div className="mb-5 border-l-4 border-[#B85838] bg-[#FAF8F4] p-3 text-[12px] text-[#5A5751] leading-relaxed">
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
      {notice && <div role="status" aria-live="polite" className="mb-4 text-[12px] text-[#1A1815] bg-[#FAF8F4] border border-[#E8E4DC] p-2">{notice}</div>}

      <SectionTabs sections={sections} ariaLabel="Voice sections" idBase="voice" defaultId="listen" />

      <p className="text-[11px] text-[#5A5751] mt-4 leading-relaxed">
        Voice cloning is consent-only: a real person’s voice is never used until that person enrolls
        it themselves. Anything published in a cloned voice is labeled AI-generated, and a voice is
        only ever used to read content the person means to say — never to put words in their mouth.
      </p>
    </div>
  );
}
