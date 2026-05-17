// TTSButton — per-content play button using browser SpeechSynthesis
//
// Spec: UX-PATTERNS.md Pattern 2 (Audio / TTS Component).
// Wraps the browser's Web Speech API behind a minimal inline UI.
// Phase 1 implementation; a premium provider (ElevenLabs, AWS Polly Neural,
// Google Cloud TTS, etc.) can be swapped in later behind the same interface.
//
// Props:
//   text  (string, required) — what to read
//   label (string, optional) — small text shown next to the button, e.g. 'ESV'
//   rate  (number, optional) — initial playback rate (0.5–3.0). Default 1.0.

import React, { useEffect, useState } from 'react';

const SUPPORTED =
  typeof window !== 'undefined' && 'speechSynthesis' in window;

export default function TTSButton({ text, label, rate: initialRate = 1.0 }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(initialRate);
  const [showSpeed, setShowSpeed] = useState(false);

  // Cancel any in-flight utterance when this button unmounts.
  useEffect(
    () => () => {
      if (SUPPORTED) window.speechSynthesis.cancel();
    },
    []
  );

  if (!SUPPORTED || !text) return null;

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const play = () => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = rate;
    utt.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    utt.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    window.speechSynthesis.speak(utt);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const togglePause = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const changeRate = (newRate) => {
    setRate(newRate);
    if (isPlaying) {
      // Restart at the new rate; SpeechSynthesisUtterance.rate is read at speak().
      stop();
      setTimeout(() => {
        const utt = new SpeechSynthesisUtterance(text);
        utt.rate = newRate;
        utt.onend = () => {
          setIsPlaying(false);
          setIsPaused(false);
        };
        utt.onerror = () => {
          setIsPlaying(false);
          setIsPaused(false);
        };
        window.speechSynthesis.speak(utt);
        setIsPlaying(true);
        setIsPaused(false);
      }, 80);
    }
  };

  return (
    <span className="inline-flex items-center gap-1 align-middle">
      {label && (
        <span className="text-[9px] uppercase tracking-wider text-[#5A5751]">
          {label}
        </span>
      )}

      {!isPlaying ? (
        <button
          onClick={play}
          aria-label={`Play${label ? ' ' + label : ''}`}
          title="Play"
          className="border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white px-1.5 py-0.5 text-[10px] uppercase tracking-wider"
        >
          ▷ {rate.toFixed(1)}x
        </button>
      ) : (
        <>
          <button
            onClick={togglePause}
            aria-label={isPaused ? 'Resume' : 'Pause'}
            title={isPaused ? 'Resume' : 'Pause'}
            className="bg-[#1A1815] text-white hover:bg-[#B85838] px-1.5 py-0.5 text-[10px] uppercase tracking-wider"
          >
            {isPaused ? '▷' : '❚❚'}
          </button>
          <button
            onClick={stop}
            aria-label="Stop"
            title="Stop"
            className="border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white px-1.5 py-0.5 text-[10px] uppercase tracking-wider"
          >
            ◼
          </button>
        </>
      )}

      <button
        onClick={() => setShowSpeed((s) => !s)}
        aria-label="Toggle speed slider"
        title="Speed"
        className="text-[10px] text-[#5A5751] hover:text-[#1A1815] uppercase tracking-wider"
      >
        {showSpeed ? '×' : '⚙'}
      </button>

      {showSpeed && (
        <span className="inline-flex items-center gap-1">
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.1"
            value={rate}
            onChange={(e) => changeRate(parseFloat(e.target.value))}
            aria-label="Playback speed"
            className="w-20 accent-[#B85838]"
          />
          <span
            className="text-[10px] text-[#5A5751]"
            style={{ fontFamily: '"JetBrains Mono", monospace' }}
          >
            {rate.toFixed(1)}x
          </span>
        </span>
      )}
    </span>
  );
}
