// councilChamberVoice.js — leaf util wrapping the browser-native Web Speech
// API for the Council Chamber. Pure of React; the component owns the UI state.
// Swap point: if a different speech-to-text service is ever chosen, replace the
// internals here without touching the component.

export function isVoiceSupported() {
  return typeof window !== 'undefined'
    && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

// Create a recognizer instance. Callbacks:
//   onTranscript(fullText)  — fired as interim + final results accumulate
//   onEnd()                 — fired when recognition stops (any reason)
//   onError(message)        — fired on a recognition error
// Returns { start, stop } or null if the browser has no Web Speech API.
export function createRecognizer({ onTranscript, onEnd, onError }) {
  const Impl = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;
  if (!Impl) return null;

  const recognition = new Impl();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  let finalText = '';

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const chunk = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalText += chunk;
      else interim += chunk;
    }
    if (onTranscript) onTranscript((finalText + interim).trim());
  };

  recognition.onerror = (event) => {
    if (onError) onError(event.error || 'speech-recognition-error');
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return {
    start: () => {
      finalText = '';
      try {
        recognition.start();
      } catch {
        // start() throws if already started; safe to ignore.
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch {
        // stop() throws if not running; safe to ignore.
      }
    },
  };
}
