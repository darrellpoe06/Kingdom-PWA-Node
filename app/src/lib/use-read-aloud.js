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
import { useTextToSpeech } from './tts.js';
import {
  useReadingVoice, isPersonVoiceId, personKeyOf, isSystemVoiceId, SYSTEM_VOICE_ID, personVoiceId,
} from './reading-voice.js';
import { mergeVoiceCatalog, canCloneVoice, isVoiceEntitled, resolveVoiceProvider, KIND } from './voice-registry.js';
import { isVoiceServiceReady, synthesizeSpeech } from './voice-service.js';
import { loadReference, blobToDataUri } from './voice-reference.js';
import { loadVoiceProfiles } from './voice-sync.js';
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
  const [notice, setNotice] = useState('');
  const audioRef = useRef(null);

  useEffect(() => {
    let alive = true;
    (async () => { const { profiles: rows } = await loadVoiceProfiles(); if (alive && rows) setProfiles(rows); })();
    return () => { alive = false; };
  }, []);

  useEffect(() => () => { if (audioRef.current) { try { audioRef.current.pause(); } catch (_) {} audioRef.current = null; } }, []);

  const personalVoices = useMemo(() => mergeVoiceCatalog(profiles).filter((v) => v.kind === KIND.PERSONAL), [profiles]);
  const ctx = { isOwner, subscribed: isOwner };

  // The merged catalog every picker renders: System (free) + personal (cloned) +
  // browser voices/accents. Each item is { id, label, group, ai, entitled, usable }.
  const catalog = useMemo(() => {
    const out = [{ id: SYSTEM_VOICE_ID, label: 'System voice', group: 'Default', ai: false, entitled: true, usable: true }];
    for (const v of personalVoices) {
      if (!canCloneVoice(v)) continue; // only consented personal voices are offerable
      out.push({
        id: personVoiceId(v.personKey), label: v.name, group: 'Your voices', ai: true,
        entitled: isVoiceEntitled(v, ctx), usable: isVoiceEntitled(v, ctx),
        standIn: !resolveVoiceProvider(v, { sovereignVoiceReady }).real,
      });
    }
    const browser = (tts.voices || []).filter((v) => v && /^en/i.test(v.lang || ''));
    const list = browser.length ? browser : (tts.voices || []);
    for (const v of list) {
      out.push({ id: v.voiceURI, label: `${v.name}${v.localService ? '' : ' (online)'}`, group: 'Voices & accents', ai: false, entitled: true, usable: true });
    }
    return out;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personalVoices, tts.voices, isOwner, sovereignVoiceReady]);

  const currentItem = useMemo(() => catalog.find((c) => c.id === voiceId) || catalog[0], [catalog, voiceId]);

  // Apply a chosen BROWSER voice to the engine so System/accent picks read in it.
  useEffect(() => {
    if (!tts.supported) return;
    if (isSystemVoiceId(voiceId) || isPersonVoiceId(voiceId)) return; // system/clone handled at read()
    tts.setVoiceURI(voiceId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceId, tts.supported, tts.voices]);

  const stop = useCallback(() => {
    try { tts.stop(); } catch (_) {}
    if (audioRef.current) { try { audioRef.current.pause(); } catch (_) {} audioRef.current = null; }
    setCloudPlaying(false);
  }, [tts]);

  // The one play path, honoring the global voice preference.
  const read = useCallback(async (text) => {
    const clean = String(text || '').trim();
    if (!clean) return;
    setNotice('');
    stop();

    if (isPersonVoiceId(voiceId)) {
      const personKey = personKeyOf(voiceId);
      const voice = personalVoices.find((v) => v.personKey === personKey);
      if (voice && resolveVoiceProvider(voice, { sovereignVoiceReady }).real && sovereignVoiceReady) {
        const refBlob = await loadReference(personKey);
        if (refBlob) {
          const referenceDataUri = await blobToDataUri(refBlob);
          const { url, error } = await synthesizeSpeech({ text: clean, voiceId: voice.id, personKey, referenceDataUri });
          if (!error && url) {
            try {
              const a = new Audio(url); audioRef.current = a; setCloudPlaying(true);
              a.onended = () => { setCloudPlaying(false); try { URL.revokeObjectURL(url); } catch (_) {} };
              a.onerror = () => { setCloudPlaying(false); if (tts.supported) tts.speak(clean); };
              await a.play();
              return;
            } catch (_) { setCloudPlaying(false); }
          }
          setNotice('Voice endpoint unreachable — using a stand-in voice.');
        } else {
          setNotice('Record a voice sample first — then this reads in that voice.');
        }
      }
      // Stand-in until the endpoint/reference is live: labeled browser voice.
    }

    if (!tts.supported) { setNotice('This device can’t read aloud — try a different browser.'); return; }
    tts.speak(clean);
  }, [voiceId, personalVoices, sovereignVoiceReady, tts, stop]);

  return {
    supported: tts.supported,
    isReading: tts.isReading || cloudPlaying,
    isPaused: tts.isPaused,
    rate: tts.rate,
    segmentIndex: tts.segmentIndex,
    voiceId, setVoiceId, catalog, currentItem, notice,
    read, pause: tts.pause, resume: tts.resume, stop, setRate: tts.setRate,
  };
}
