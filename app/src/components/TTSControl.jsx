// =============================================================================
// TTSControl — the floating READ-ALOUD control (the HEAR half of see/hear a11y)
// =============================================================================
// Drives the shared TTS primitive (lib/tts.js). Big, obvious controls for a
// non-technical, elderly reader: a play button, then a Pause/Stop pair, plain
// speed steps (incl. a SLOWER option), and a voice picker when the device offers
// more than one. Reads the visible page so anyone can conduct business without
// reading the screen (COMMUNITY-FIRST-MISSION).
//
// Reliability + accessibility: the engine fixes the "speed didn't change" bug
// (see lib/tts.js header) by re-speaking the current segment at the new rate, so
// a speed change is AUDIBLE live. On a device without speech support the hook
// reports supported:false and this renders nothing — no crash (unbreakable).
// Status is announced politely for screen readers; every control is keyboard
// reachable with a visible focus ring; the panel is a white card with high-
// contrast (WCAG AA) text regardless of app theme.
import React, { useState } from 'react';
import { useTextToSpeech, RATE_STEPS } from '../lib/tts.js';

// Pull the visible page text the same way the old control did: clone <main>,
// strip floating/hidden chrome (including this control), collapse whitespace.
function readablePageText() {
  if (typeof document === 'undefined') return '';
  const main = document.querySelector('main') || document.body;
  if (!main) return '';
  const clone = main.cloneNode(true);
  clone.querySelectorAll('.tts-controls, .feedback-modal, [aria-hidden="true"]').forEach((el) => el.remove());
  return (clone.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 32000);
}

export default function TTSControl() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    supported, isReading, isPaused, rate, voices, voiceURI,
    speak, pause, resume, stop, setRate, setVoiceURI,
  } = useTextToSpeech();

  if (!supported) return null; // graceful: device can't speak — show nothing

  const start = () => {
    const text = readablePageText();
    if (text) speak(text);
  };
  const close = () => { stop(); setIsOpen(false); };

  // Only English voices, de-duplicated, for an uncluttered picker.
  const enVoices = voices.filter((v) => v && /^en/i.test(v.lang || ''));
  const voiceOptions = enVoices.length ? enVoices : voices;
  const statusLabel = isReading ? (isPaused ? 'Paused' : 'Reading…') : 'Ready';

  return (
    <div className="tts-controls fixed bottom-4 right-4 z-40 print:hidden">
      {isOpen ? (
        <div className="bg-white border-2 border-[#1A1815] p-3 shadow-lg w-[260px] max-w-[calc(100vw-2rem)]">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <div className="text-[9px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">🔊 Read Aloud</div>
              <div className="text-[10px] text-[#5A5751]" role="status" aria-live="polite" style={{ fontFamily: '"Fraunces", serif' }}>{statusLabel}</div>
            </div>
            <button type="button" onClick={close} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">× Close</button>
          </div>

          <div className="grid grid-cols-3 gap-1 mb-3">
            {!isReading ? (
              <button type="button" onClick={start} className="col-span-3 bg-[#1A1815] text-white px-3 py-2.5 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">▶ Read this page</button>
            ) : (
              <>
                <button type="button" onClick={isPaused ? resume : pause} className="bg-[#1A1815] text-white px-2 py-2.5 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">{isPaused ? '▶ Resume' : '⏸ Pause'}</button>
                <button type="button" onClick={stop} className="col-span-2 border border-[#1A1815] text-[#1A1815] px-2 py-2.5 text-xs uppercase tracking-wider hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">⏹ Stop</button>
              </>
            )}
          </div>

          <div className="mb-2">
            <div className="text-[9px] uppercase tracking-wider text-[#5A5751] mb-1">Speed: {rate.toFixed(1)}×</div>
            <div className="grid grid-cols-5 gap-1" role="group" aria-label="Reading speed">
              {RATE_STEPS.map((s) => {
                const selected = Math.abs(rate - s.value) < 0.001;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setRate(s.value)}
                    aria-pressed={selected}
                    aria-label={`${s.name} (${s.label})${selected ? ' — current' : ''}`}
                    title={s.name}
                    className={`px-1 py-2 text-[10px] uppercase tracking-wider border min-h-[2.25rem] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838] ${selected ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815]'}`}
                  >{s.label}</button>
                );
              })}
            </div>
          </div>

          {voiceOptions.length > 1 ? (
            <div className="mb-2">
              <label htmlFor="tts-voice" className="block text-[9px] uppercase tracking-wider text-[#5A5751] mb-1">Voice</label>
              <select
                id="tts-voice"
                value={voiceURI || ''}
                onChange={(e) => setVoiceURI(e.target.value)}
                className="w-full text-[11px] border border-[#E8E4DC] bg-white text-[#1A1815] px-2 py-2 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]"
              >
                {voiceOptions.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>{v.name}{v.localService ? '' : ' (online)'}</option>
                ))}
              </select>
            </div>
          ) : null}

          <p className="text-[9px] text-[#5A5751] leading-snug" style={{ fontFamily: '"Fraunces", serif' }}>
            Reads the visible page so anyone can conduct business — even without reading the screen.
          </p>
        </div>
      ) : (
        <button type="button" onClick={() => setIsOpen(true)} aria-label="Open read-aloud controls" title="Read aloud" className="bg-[#1A1815] text-white w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg hover:bg-[#B85838] flex items-center justify-center text-xl sm:text-2xl border-2 border-[#FAF8F4] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">
          🔊
        </button>
      )}
    </div>
  );
}
