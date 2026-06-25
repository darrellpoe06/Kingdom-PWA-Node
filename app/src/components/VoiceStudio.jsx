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
import { isVoiceServiceReady, synthesizeSpeech } from '../lib/voice-service.js';
import { getInstanceId } from '../lib/table-sync.js';
import { supabase } from '../lib/supabase.js';

const SAMPLE = 'Welcome. This is your chosen reading voice. Paste any message, lesson, or passage below and press Read to hear it aloud in this voice.';
const SAMPLE_SHORT = 'For God so loved the world. The Lord is my shepherd; I shall not want.';

const PERSONA_NAME = { darrell: 'Darrell Poe', christina: 'Christina Poe', 'bishop-gwin': 'Bishop Lloyd E. Gwin' };

export default function VoiceStudio({ personaKey = null, isOwner = false, sovereignVoiceReady = isVoiceServiceReady() }) {
  const tts = useTextToSpeech();
  const [profiles, setProfiles] = useState([]);
  const [userId, setUserId] = useState(null);
  const [instanceId, setInstanceId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [text, setText] = useState(SAMPLE);
  const [selectedId, setSelectedId] = useState(() => loadVoiceChoice());
  const [cloudPlaying, setCloudPlaying] = useState(false); // real cloned-voice audio in flight
  const audioRef = useRef(null);

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
    })();
    return () => { alive = false; };
  }, []);

  // Stop any cloud audio when the surface unmounts.
  useEffect(() => () => { if (audioRef.current) { try { audioRef.current.pause(); } catch (_) {} audioRef.current = null; } }, []);

  const voices = useMemo(() => mergeVoiceCatalog(profiles), [profiles]);
  const ctx = { isOwner, subscribed: isOwner }; // owner/building circle entitled; real billing slots in here
  const selected = voices.find((v) => v.id === selectedId) || voices[0];

  // Highlight-as-it-reads: the engine segments deterministically, so we segment the
  // SAME text and highlight the sentence the engine is currently speaking.
  const segments = useMemo(() => segmentText(text), [text]);
  const activeSeg = tts.isReading ? tts.segmentIndex : -1;

  const choose = (v) => {
    if (!isVoiceSelectable(v, ctx)) return;
    setSelectedId(v.id);
    saveVoiceChoice(v.id);
    setNotice('');
  };

  const stopAll = () => {
    try { tts.stop(); } catch (_) {}
    if (audioRef.current) { try { audioRef.current.pause(); } catch (_) {} audioRef.current = null; }
    setCloudPlaying(false);
  };

  // The one play path. Tries the real sovereign studio for a consented personal
  // voice when it is live; otherwise (and on ANY failure) falls back to the browser
  // voice — the System voice always works, so a tap is never a dead button.
  const playWith = async (voice, body) => {
    const clean = String(body || '').trim();
    if (!clean) return;
    const prov = resolveVoiceProvider(voice, { sovereignVoiceReady });
    if (prov.blocked) { setNotice('That voice needs the person’s consent before it can be used.'); return; }

    stopAll();

    if (prov.real && voice.kind === KIND.PERSONAL && sovereignVoiceReady) {
      // REAL cloned voice via the local studio.
      setBusy(true);
      const { url, error } = await synthesizeSpeech({ text: clean, voiceId: voice.id, personKey: voice.personKey });
      setBusy(false);
      if (!error && url) {
        try {
          const a = new Audio(url);
          audioRef.current = a;
          setCloudPlaying(true);
          a.onended = () => { setCloudPlaying(false); try { URL.revokeObjectURL(url); } catch (_) {} };
          a.onerror = () => { setCloudPlaying(false); tts.speak(clean); }; // never silent
          await a.play();
          return;
        } catch (_) { setCloudPlaying(false); /* fall through to browser */ }
      }
      // Studio unreachable -> honest fallback to the labeled stand-in, with a note.
      setNotice('The voice studio was unreachable — using the stand-in voice for now.');
    }

    // Browser path: System voice (real) or the labeled personal stand-in. Works today.
    if (!tts.supported) { setNotice('This device can’t read aloud — try a different browser.'); return; }
    tts.speak(clean);
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

  return (
    <div className="max-w-3xl">
      <div className="mb-1 text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">🔊 Voice</div>
      <h1 className="text-2xl font-semibold text-[#1A1815] mb-1" style={{ fontFamily: '"Fraunces", serif' }}>Listen to anything</h1>
      <p className="text-sm text-[#5A5751] mb-5 leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
        Pick a voice, then paste any message, lesson, or passage to hear it read aloud. On a reading
        page (Scripture, The Word, a lesson) the floating 🔊 button reads the whole page.
      </p>

      {/* The honesty banner — never hidden while the studio is not live. */}
      {!sovereignVoiceReady && (
        <div className="mb-5 border-l-4 border-[#B85838] bg-[#FAF8F4] p-3 text-[12px] text-[#5A5751] leading-relaxed">
          <strong>How personal voices work today:</strong> a personal voice is clearly marked
          <em> AI-generated</em> and currently plays a <strong>stand-in</strong> voice that you can hear right
          now. The real cloned voice activates when the local voice studio (sovereign, on our own
          hardware) is live — nothing here pretends a stand-in is the person’s real voice.
        </div>
      )}

      {/* Voice picker */}
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

      {notice && <div role="status" aria-live="polite" className="mb-4 text-[12px] text-[#1A1815] bg-[#FAF8F4] border border-[#E8E4DC] p-2">{notice}</div>}

      {/* Listen to anything */}
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

      <p className="text-[11px] text-[#5A5751] mt-4 leading-relaxed">
        Voice cloning is consent-only: a real person’s voice is never used until that person enrolls
        it themselves. Anything published in a cloned voice is labeled AI-generated, and a voice is
        only ever used to read content the person means to say — never to put words in their mouth.
      </p>
    </div>
  );
}
