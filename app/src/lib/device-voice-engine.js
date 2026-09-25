// =============================================================================
// device-voice-engine — Piper inference itself (DR-0655)
// =============================================================================
// The work the on-device voice does, apart from HOW it is called: the app runs
// it inside device-voice.worker.js (off the main thread); the measurement
// harness runs the very same functions on a CPU-throttled main thread, because
// Chromium's CPU throttling does not reach a dedicated worker.
//
//   espeak-ng (phonemizer.js, WASM) -> Piper's id recipe -> ONNX Runtime (WASM,
//   one thread) -> Piper's WAV assembly. One sentence is one inference, as the
//   piper binary does it.
//
// LICENSE NOTE: phonemizer.js is Apache-2.0 but EMBEDS espeak-ng, which is
// GPL-3.0-or-later. It is loaded only in the worker chunk, only after the
// person asks for the on-device voice. See NOTICE and DR-0655.
// =============================================================================
import * as ort from 'onnxruntime-web/wasm';
import { phonemize } from 'phonemizer';
import { textToPhonemeSentences, phonemesToIds, assembleWav } from './device-voice-phonemes.js';

function now() { return (typeof performance !== 'undefined' ? performance : Date).now(); }

/** Load a voice. Returns an engine handle. */
export async function createEngine({ model, wasmBinary, config, numThreads = 1 }) {
  const t0 = now();
  ort.env.wasm.wasmBinary = wasmBinary;
  // One thread: more needs SharedArrayBuffer, which needs COOP/COEP headers
  // on the whole app (DR-0655 measured what those would break).
  ort.env.wasm.numThreads = numThreads;
  ort.env.wasm.proxy = false;
  const session = await ort.InferenceSession.create(new Uint8Array(model), {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all',
  });
  return { session, config, initMs: now() - t0 };
}

/** Text -> { wav: ArrayBuffer, ms, audioSeconds } with the loaded engine. */
export async function speakWithEngine(engine, text) {
  const { session, config } = engine;
  const t0 = now();
  const lang = (config.espeak && config.espeak.voice) || 'en-us';
  const sentences = await textToPhonemeSentences(text, (clause) => phonemize(clause, lang));
  const inf = config.inference || {};
  const scales = new Float32Array([inf.noise_scale ?? 0.667, inf.length_scale ?? 1, inf.noise_w ?? 0.8]);
  const multi = config.num_speakers > 1;
  const pcms = [];
  for (const ph of sentences) {
    const ids = phonemesToIds(ph, config.phoneme_id_map);
    if (ids.length <= 3) continue;
    const feeds = {
      input: new ort.Tensor('int64', BigInt64Array.from(ids, (n) => BigInt(n)), [1, ids.length]),
      input_lengths: new ort.Tensor('int64', BigInt64Array.from([BigInt(ids.length)]), [1]),
      scales: new ort.Tensor('float32', scales, [3]),
    };
    if (multi) feeds.sid = new ort.Tensor('int64', BigInt64Array.from([0n]), [1]);
    const out = await session.run(feeds);
    const first = out.output || out[session.outputNames[0]];
    pcms.push(new Float32Array(first.data));
  }
  const rate = (config.audio && config.audio.sample_rate) || 22050;
  const wav = assembleWav(pcms, rate, 0.2);
  return { wav, ms: now() - t0, audioSeconds: (wav.byteLength - 44) / 2 / rate };
}
