// =============================================================================
// use-cast-read — PLAY a dramatized reading: each speaker heard in their own
// voice (Darrell 2026-07-04: "a different voice depends on the person speaking —
// that would be fire"). It speaks a cast SCRIPT (scripture-voice-cast) where every
// line already carries its verified speaker, and gives each speaker a distinct,
// gender-correct device voice via the same tested engine that colors the text.
//
// Playback rides the browser's native speech QUEUE: utterances queued in order
// play in order, each with its own voice — no custom scheduler to get wrong. The
// engine is dependency-injected (createCastPlayer) so the queueing + voice
// assignment are unit-tested with a mock synth; the hook is the thin window glue.
// Fail-soft: no speech support → supported:false and play() is a no-op.
// =============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildCast, castVoiceURI } from './scripture-voice-cast.js';

/**
 * A pure, injectable cast player. `synth` is a SpeechSynthesis-like object
 * (speak/cancel); `Utterance` is a SpeechSynthesisUtterance-like constructor.
 * play(lines, voiceForKey, onDone): queue one utterance per line, each spoken in
 * the voice voiceForKey(line.voice) returns (or the default when it returns null).
 */
export function createCastPlayer({ synth, Utterance }) {
  let gen = 0;
  let playing = false;
  return {
    isPlaying() { return playing; },
    stop() { gen += 1; playing = false; try { synth.cancel(); } catch (_) { /* ignore */ } },
    play(lines, voiceForKey, onDone) {
      const myGen = (gen += 1);
      try { synth.cancel(); } catch (_) { /* ignore */ }
      const list = (Array.isArray(lines) ? lines : []).filter((l) => l && String(l.text || '').trim());
      if (!list.length) { playing = false; if (onDone) onDone(); return; }
      playing = true;
      list.forEach((line, i) => {
        const u = new Utterance(String(line.text));
        const v = typeof voiceForKey === 'function' ? voiceForKey(line.voice) : null;
        if (v) u.voice = v;
        u.onend = () => {
          if (myGen !== gen) return;              // superseded by a newer play()/stop()
          if (i === list.length - 1) { playing = false; if (onDone) onDone(); }
        };
        try { synth.speak(u); } catch (_) { /* keep queueing the rest */ }
      });
    },
  };
}

// The React hook: enumerate the device voices, assign the cast, and expose
// play(lines) / stop(). supported is false where the browser has no speech.
export function useCastRead() {
  const supported = typeof window !== 'undefined'
    && !!window.speechSynthesis && !!window.SpeechSynthesisUtterance;
  const [voices, setVoices] = useState([]);
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!supported) return undefined;
    const load = () => setVoices(window.speechSynthesis.getVoices() || []);
    load();
    try { window.speechSynthesis.onvoiceschanged = load; } catch (_) { /* ignore */ }
    return () => { try { window.speechSynthesis.cancel(); } catch (_) { /* ignore */ } };
  }, [supported]);

  const assignments = useMemo(() => buildCast(voices), [voices]);
  const voiceForKey = useCallback((key) => {
    const uri = castVoiceURI(assignments, key);
    return uri ? (voices.find((v) => v && v.voiceURI === uri) || null) : null;
  }, [assignments, voices]);

  const play = useCallback((lines) => {
    if (!supported) return;
    if (!playerRef.current) {
      playerRef.current = createCastPlayer({ synth: window.speechSynthesis, Utterance: window.SpeechSynthesisUtterance });
    }
    setPlaying(true);
    playerRef.current.play(lines, voiceForKey, () => setPlaying(false));
  }, [supported, voiceForKey]);

  const stop = useCallback(() => {
    if (playerRef.current) playerRef.current.stop();
    setPlaying(false);
  }, []);

  return { supported, playing, play, stop };
}
