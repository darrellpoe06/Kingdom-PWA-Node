// =============================================================================
// VoiceStudio — "listen to anything," in a voice you choose
// =============================================================================
// The in-app surface for the sovereign voice layer (lib/voice-registry.js):
//   1. LISTEN TO ANYTHING — paste any message / lesson / passage (or use the
//      floating Read-Aloud button on a reading page) and hear it read now. Playback
//      rides the shared TTS primitive (lib/tts.js) owned by the TTS lane.
//   2. CHOOSE A VOICE — the free System voice, or a personal (cloned) voice as a
//      subscriber feature.
//   3. CONSENT-GATED ENROLLMENT — Darrell may enroll HIS OWN voice (he consents, as
//      the principal + building circle). Bishop Gwin, Christina, and anyone else
//      appear only as "invite to enroll" and become usable solely when THEY opt in.
//
// HONESTY (DR-0076): the real cloned timbre needs the local sovereign voice service
// (Voicebox / XTTS on the GPU box), which is a pending spike. Until it is live, a
// personal voice plays a clearly-labeled STAND-IN preset voice — never a browser
// voice pretending to be the person. resolveVoiceProvider enforces this; this UI
// surfaces it plainly so no one is misled.
import React, { useEffect, useMemo, useState } from 'react';
import { useTextToSpeech, RATE_STEPS } from '../lib/tts.js';
import {
  mergeVoiceCatalog, isVoiceSelectable, canCloneVoice, resolveVoiceProvider,
  aiVoiceLabel, enrollmentStatus, loadVoiceChoice, saveVoiceChoice, KIND, CONSENT,
} from '../lib/voice-registry.js';
import { loadVoiceProfiles, enrollMyVoice, revokeMyVoice } from '../lib/voice-sync.js';
import { getInstanceId } from '../lib/table-sync.js';
import { supabase } from '../lib/supabase.js';

const SAMPLE = 'Welcome. This is your chosen reading voice. Paste any message, lesson, or passage below and press Read to hear it aloud in this voice.';

// Personas the signed-in person may enroll as THEIR OWN voice. Mapping a persona
// key to a display name; the key is also the voice_profiles person_key.
const PERSONA_NAME = { darrell: 'Darrell Poe', christina: 'Christina Poe', 'bishop-gwin': 'Bishop Lloyd E. Gwin' };

export default function VoiceStudio({ personaKey = null, isOwner = false, sovereignVoiceReady = false }) {
  const tts = useTextToSpeech();
  const [profiles, setProfiles] = useState([]);
  const [userId, setUserId] = useState(null);
  const [instanceId, setInstanceId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [text, setText] = useState(SAMPLE);
  const [selectedId, setSelectedId] = useState(() => loadVoiceChoice());

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

  const voices = useMemo(() => mergeVoiceCatalog(profiles), [profiles]);
  const ctx = { isOwner, subscribed: isOwner }; // owner/building circle entitled; real billing slots in here
  const selected = voices.find((v) => v.id === selectedId) || voices[0];

  const choose = (v) => {
    if (!isVoiceSelectable(v, ctx)) return;
    setSelectedId(v.id);
    saveVoiceChoice(v.id);
    setNotice('');
  };

  const readNow = () => {
    const body = (text || '').trim();
    if (!body) return;
    // Honest preview: personal voices currently play a labeled stand-in (the shared
    // engine's most-natural browser voice) until the sovereign service is live.
    tts.speak(body);
  };

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

      {/* The honesty banner — never hidden. */}
      {!sovereignVoiceReady && (
        <div className="mb-5 border-l-4 border-[#B85838] bg-[#FAF8F4] p-3 text-[12px] text-[#5A5751] leading-relaxed">
          <strong>How personal voices work today:</strong> a personal voice is clearly marked
          <em> AI-generated</em> and currently plays a <strong>stand-in</strong> voice. The real cloned
          voice activates when the local voice studio (sovereign, on our own hardware) is live —
          nothing here pretends a stand-in is the person's real voice.
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
                    <button
                      type="button" onClick={() => choose(v)}
                      aria-pressed={isSel}
                      className={`text-[11px] uppercase tracking-wider px-3 py-1.5 border focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838] ${isSel ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white'}`}
                    >{isSel ? '✓ In use' : 'Use this voice'}</button>
                  ) : (
                    <span className="text-[10px] text-[#5A5751] text-right max-w-[9rem]">
                      {canCloneVoice(v) ? 'Available on a subscription' : 'Invite to enroll — usable only after they consent'}
                    </span>
                  )}
                  {/* Self-consent: enroll / withdraw only your OWN voice. */}
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
        {!tts.supported ? (
          <p className="text-[11px] text-[#B85838] mt-2">This device can't read aloud — try a different browser.</p>
        ) : (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {!tts.isReading ? (
              <button type="button" onClick={readNow}
                className="bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">▶ Read</button>
            ) : (
              <>
                <button type="button" onClick={tts.isPaused ? tts.resume : tts.pause}
                  className="bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">{tts.isPaused ? '▶ Resume' : '⏸ Pause'}</button>
                <button type="button" onClick={tts.stop}
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
      </div>

      <p className="text-[11px] text-[#5A5751] mt-4 leading-relaxed">
        Voice cloning is consent-only: a real person's voice is never used until that person enrolls
        it themselves. Anything published in a cloned voice is labeled AI-generated, and a voice is
        only ever used to read content the person means to say — never to put words in their mouth.
      </p>
    </div>
  );
}
