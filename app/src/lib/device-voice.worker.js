// =============================================================================
// device-voice.worker — runs the Piper engine off the main thread (DR-0655)
// =============================================================================
// device-voice.js reads the three files from Cache Storage and hands them over;
// this worker never touches the network. The engine is device-voice-engine.js.
// =============================================================================
import { createEngine, speakWithEngine } from './device-voice-engine.js';

let engine = null;

self.onmessage = async (e) => {
  const msg = e.data || {};
  try {
    if (msg.type === 'init') {
      engine = await createEngine(msg);
      self.postMessage({ id: msg.id, ok: true, ms: engine.initMs });
    } else if (msg.type === 'speak') {
      if (!engine) throw new Error('not-initialized');
      const r = await speakWithEngine(engine, msg.text);
      self.postMessage({ id: msg.id, ok: true, ...r }, [r.wav]);
    }
  } catch (err) {
    self.postMessage({ id: msg.id, error: String((err && err.message) || err) });
  }
};
