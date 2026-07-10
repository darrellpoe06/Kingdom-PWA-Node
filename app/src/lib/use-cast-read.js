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
import { segmentText } from './tts.js';

/**
 * A pure, injectable cast player, HARDENED like the main engine (DR-0138 — the
 * un-hardened bulk-queue was the app's most fragile speech path):
 *   - SEQUENTIAL chaining: one utterance in flight, the next spoken from onend
 *     (never bulk-queued — iOS caps the native queue and drops later lines).
 *   - Long lines are segmented (segmentText) so Chrome's ~15 s / iOS truncation
 *     never eats the middle of a chapter.
 *   - The in-flight utterance is RETAINED on the player (Chrome/Android GC an
 *     unreferenced speaking utterance into silence).
 *   - cancel() only when the synth is actually busy (the "tap Read, nothing
 *     happens" race), plus a resume() kick for Chrome's paused-start.
 *   - onerror advances to the next line instead of dying silently.
 * `synth` is SpeechSynthesis-like; `Utterance` is the utterance constructor.
 */
export function createCastPlayer({ synth, Utterance }) {
  let gen = 0;
  let playing = false;
  let _current = null; // GC-retain the in-flight utterance (held, never read — the retention IS the use)
  const busy = () => { try { return !!(synth.speaking || synth.pending); } catch (_) { return false; } };
  return {
    isPlaying() { return playing; },
    stop() {
      gen += 1; playing = false; _current = null;
      try { synth.cancel(); } catch (_) { /* ignore */ }
    },
    play(lines, voiceForKey, onDone) {
      const myGen = (gen += 1);
      if (busy()) { try { synth.cancel(); } catch (_) { /* ignore */ } }
      // Flatten to speakable segments, each carrying its line's voice.
      const segs = [];
      for (const l of (Array.isArray(lines) ? lines : [])) {
        if (!l || !String(l.text || '').trim()) continue;
        for (const piece of segmentText(String(l.text))) segs.push({ text: piece, voice: l.voice });
      }
      if (!segs.length) { playing = false; if (onDone) onDone(); return; }
      playing = true;
      const speakAt = (i) => {
        if (myGen !== gen) return; // superseded by a newer play()/stop()
        if (i >= segs.length) { playing = false; _current = null; if (onDone) onDone(); return; }
        const u = new Utterance(segs[i].text);
        const v = typeof voiceForKey === 'function' ? voiceForKey(segs[i].voice) : null;
        if (v) u.voice = v;
        const next = () => { if (myGen === gen) speakAt(i + 1); };
        u.onend = next;
        u.onerror = next; // a failed line never kills the reading
        _current = u;
        try { synth.speak(u); } catch (_) { next(); return; }
        // Chrome sometimes starts the synth paused; a kick is a no-op elsewhere.
        try { if (typeof synth.resume === 'function') synth.resume(); } catch (_) { /* ignore */ }
      };
      speakAt(0);
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
    const synth = window.speechSynthesis;
    const load = () => setVoices(synth.getVoices() || []);
    load();
    // addEventListener, never `.onvoiceschanged =` — the main engine (tts.js)
    // listens too, and property assignment clobbers whichever hook mounted first
    // (a real both-readers-on-one-page failure). Poll as the fallback for engines
    // that populate late without firing the event (Android WebView).
    let polls = 0;
    const timer = setInterval(() => {
      polls += 1;
      const got = synth.getVoices() || [];
      if (got.length || polls >= 12) { clearInterval(timer); if (got.length) setVoices(got); }
    }, 250);
    try { synth.addEventListener('voiceschanged', load); } catch (_) { /* ignore */ }
    return () => {
      clearInterval(timer);
      try { synth.removeEventListener('voiceschanged', load); } catch (_) { /* ignore */ }
      try { synth.cancel(); } catch (_) { /* ignore */ }
    };
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
