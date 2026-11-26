// =============================================================================
// chosen-voice-narrator — the new lesson look reads in the voice you chose
// (DR-1685)
// =============================================================================
// Darrell, 2026-11-26: "Can our speech and or readers be better or enhanced?
// I want the reader to read in my voice!!!!! Haven't had that happen yet!!!!!"
//
// THE TRACE. The new lesson look (learn-studio/LessonExperience.jsx) drove ONE
// narrator, lib/tts.js's createBrowserTTS: the phone's own voice, always. It
// never read the reading-voice pick (reading-voice.js), never loaded the
// listener's recording (voice-reference.js), never asked /voice/speak. So even
// with the clone engine answering, "My voice" could not be heard in the look
// most lessons now open in. The classic reader (use-read-aloud.js) has asked
// the clone piece by piece since DR-0721; this brings the same road here.
//
// THE CONTRACT is LessonExperience's own (load, play, pause, resume, stop,
// setRate, an onState({ status, segmentIndex }) option), so the highlight, the
// page turns and the saved place work unchanged. Pieces are segmentText(text),
// the very segments the page highlights.
//
// HONEST BY CONSTRUCTION (DR-0721, DR-0076). The first piece is asked of the
// clone before anything plays. If the clone cannot make it (no recording on
// this device, no key, the engine dark), the device voice reads FROM THAT
// SENTENCE ON and `onNote` says whose voice is reading and why. No sentence is
// ever spoken twice, and no stand-in reads without a sentence saying so.
//
// Every async step is bounded: a piece is asked with synthesizeSpeech's own
// timeout (45 s when the engine was last seen up, 6 s when dark), the next
// piece is fetched while one plays, and a stop or a new play makes every
// in-flight answer stale (a generation number), never a second voice.
// =============================================================================
import { createBrowserTTS, segmentText } from './tts.js';
import { loadReadingVoiceId, isPersonVoiceId, personKeyOf } from './reading-voice.js';
import { myVoiceLine, myVoiceStatus, MY_VOICE } from './my-voice.js';
import { silentWavDataUri } from './background-audio.js';
import { probeVoiceService, synthesizeSpeech, speakTimeoutFor, voiceServiceHealth, voiceServiceEngine } from './voice-service.js';

const UNLOCK_WAV = silentWavDataUri(0.05);

/** The speech pace the clone is asked for, from the player's rate. Pure. */
export function clonePace(rate) {
  const r = Number(rate);
  if (!(r > 0)) return 1;
  return Math.min(2, Math.max(0.5, r));
}

/**
 * The narrator for the listener's own cloned voice. `fetchClip(text, index,
 * pace)` resolves { url } or { error }; `fallback(opts)` makes the device
 * narrator the rest of the reading falls to; `onNote(line)` carries the one
 * sentence the screen shows. Everything is injected, so a test drives it.
 */
export function createCloneNarrator({
  fetchClip,
  fallback = createBrowserTTS,
  fallbackOpts = {},
  onState = () => {},
  onNote = () => {},
  noteFor = (error) => error,
  readyNote = '',
  AudioCtor = typeof Audio !== 'undefined' ? Audio : null,
  revoke = (u) => {
    try {
      URL.revokeObjectURL(u);
    } catch {
      /* nothing to free */
    }
  },
} = {}) {
  let segments = [];
  let at = 0;
  let rate = 1;
  let status = 'idle';
  let gen = 0;
  let audio = null;
  let stand = null; // the device narrator, once the clone has handed over
  let standFrom = 0;
  let clips = new Map(); // index -> Promise<{url}|{error}>
  const urls = new Set();

  const engine = {
    onBoundary: null,
    get status() {
      return status;
    },
    load,
    play,
    pause,
    resume,
    stop,
    setRate,
  };

  function report(s, i = at) {
    status = s;
    onState({ status: s, segmentIndex: s === 'idle' ? 0 : i });
  }

  function clip(i) {
    if (!clips.has(i)) {
      const p = Promise.resolve()
        .then(() => fetchClip(segments[i], i, clonePace(rate)))
        .then((r) => {
          if (r && r.url) urls.add(r.url);
          return r || { error: 'voice-service-empty' };
        })
        .catch((e) => ({ error: (e && e.message) || 'voice-service-error' }));
      clips.set(i, p);
    }
    return clips.get(i);
  }

  function freeClips() {
    for (const u of urls) revoke(u);
    urls.clear();
    clips = new Map();
  }

  function load(text) {
    stop();
    segments = segmentText(String(text || ''));
    at = 0;
  }

  // The device voice reads from sentence `from` on; its indexes are offset so
  // the page still highlights the right sentence.
  function handOver(from, error) {
    standFrom = from;
    onNote(noteFor(error));
    stand = fallback({
      ...fallbackOpts,
      onState: (s) => {
        status = s.status;
        if (s.status === 'idle') onState({ status: 'idle', segmentIndex: 0 });
        else onState({ status: s.status, segmentIndex: standFrom + s.segmentIndex });
      },
    });
    if (typeof stand.setRate === 'function') stand.setRate(rate);
    stand.onBoundary = (seg, off) => engine.onBoundary && engine.onBoundary(standFrom + seg, off);
    stand.load(segments.slice(from).join(' '));
    stand.play();
  }

  async function run(myGen) {
    while (at < segments.length) {
      const i = at;
      const r = await clip(i);
      if (myGen !== gen) return;
      if (!r || !r.url) {
        handOver(i, (r && r.error) || 'voice-service-empty');
        return;
      }
      if (i === 0 || !engine._spoke) {
        engine._spoke = true;
        const line = typeof readyNote === 'function' ? readyNote() : readyNote;
        if (line) onNote(line);
      }
      if (i + 1 < segments.length) clip(i + 1); // the next piece is made while this one plays
      report('playing', i);
      const ended = await new Promise((resolve) => {
        audio.onended = () => resolve(true);
        audio.onerror = () => resolve(false);
        audio.src = r.url;
        try {
          const p = audio.play();
          if (p && typeof p.catch === 'function') p.catch(() => resolve(false));
        } catch {
          resolve(false);
        }
      });
      if (myGen !== gen) return;
      if (!ended) {
        handOver(i, 'voice-play-refused');
        return;
      }
      at = i + 1;
    }
    at = 0;
    freeClips();
    report('idle');
  }

  function play() {
    if (stand) {
      stand.play();
      return;
    }
    if (!segments.length) return;
    if (!AudioCtor) {
      handOver(at, 'voice-play-refused');
      return;
    }
    gen += 1;
    // ONE ELEMENT, UNLOCKED INSIDE THE TAP (DR-0654): the first clone piece
    // arrives seconds after the press, and a phone refuses a late play() on a
    // new element. So the element is made and played silent here, now.
    if (!audio) audio = new AudioCtor();
    try {
      audio.src = UNLOCK_WAV;
      const p = audio.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch {
      /* the piece's own play() will say */
    }
    report('playing', at);
    run(gen);
  }

  function pause() {
    if (stand) return stand.pause();
    if (status !== 'playing') return;
    try {
      if (audio) audio.pause();
    } catch {
      /* already quiet */
    }
    report('paused', at);
  }

  function resume() {
    if (stand) return stand.resume();
    if (status !== 'paused') return play();
    try {
      const p = audio && audio.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch {
      /* the next piece will say */
    }
    report('playing', at);
  }

  function stop() {
    gen += 1;
    if (stand) {
      try {
        stand.stop();
      } catch {
        /* already stopped */
      }
      stand = null;
    }
    try {
      if (audio) {
        audio.onended = null;
        audio.onerror = null;
        audio.pause();
      }
    } catch {
      /* already quiet */
    }
    engine._spoke = false;
    freeClips();
    if (status !== 'idle') report('idle');
  }

  function setRate(r) {
    rate = Number(r) > 0 ? Number(r) : 1;
    if (stand && typeof stand.setRate === 'function') stand.setRate(rate);
    // Pieces not yet made are asked at the new pace; the one playing finishes.
    for (const k of [...clips.keys()]) if (k > at) clips.delete(k);
  }

  return engine;
}

/**
 * The clone's piece-maker for a person's voice, on the real roads: their
 * recording from this device, the family key, /voice/speak. Lazy-imported so
 * a reader that never picks a person voice loads none of it.
 */
export function liveClipFor(personKey) {
  let ref = null; // Promise<dataUri|''>
  let ready = null;
  return async (text, _index, pace) => {
    if (!ready) {
      ready = (async () => {
        const [{ hasBridgeToken }, { provisionBridgeToken }, sb] = await Promise.all([
          import('./nas-photos.js'),
          import('./bridge-provision.js'),
          import('./supabase.js').catch(() => ({ default: null })),
        ]);
        if (!hasBridgeToken()) await provisionBridgeToken(sb && sb.default);
        await probeVoiceService();
      })().catch(() => {});
    }
    if (!ref) {
      ref = (async () => {
        const { loadReference, blobToDataUri } = await import('./voice-reference.js');
        const blob = await loadReference(personKey);
        return blob ? await blobToDataUri(blob) : '';
      })().catch(() => '');
    }
    const [referenceDataUri] = await Promise.all([ref, ready]);
    if (!referenceDataUri) return { error: 'no-voice-sample' };
    return synthesizeSpeech({
      text,
      voiceId: `voice-${personKey}`,
      personKey,
      referenceDataUri,
      speed: pace,
      timeoutMs: speakTimeoutFor(voiceServiceHealth()),
    });
  };
}

/**
 * The `createNarrator` LessonExperience takes: the listener's own voice when
 * they picked it, the device voice exactly as before otherwise. `name` is the
 * listener's name for "My voice (Darrell)". Deps are injectable for tests.
 */
export function chosenVoiceNarrator({
  name = '',
  readVoiceId = loadReadingVoiceId,
  clipFor = liveClipFor,
  base = createBrowserTTS,
  engineName = voiceServiceEngine,
  AudioCtor = undefined,
} = {}) {
  return function createNarrator(opts = {}) {
    let id;
    try {
      id = readVoiceId();
    } catch {
      id = null;
    }
    const onNote = typeof opts.onNote === 'function' ? opts.onNote : () => {};
    if (!isPersonVoiceId(id)) {
      onNote('');
      return base(opts);
    }
    const personKey = personKeyOf(id);
    // "My voice (Darrell)": a named key (person:darrell) names itself; an
    // auth-id key (user:<uuid>) is just "My voice".
    if (!name && /^[a-z]+$/i.test(personKey)) name = personKey[0].toUpperCase() + personKey.slice(1);
    const noteFor = (error) => {
      const miss = String(error || 'voice-service-error');
      const st = miss === 'no-voice-sample' ? MY_VOICE.SAMPLE_MISSING : myVoiceStatus({ hasSample: true, miss });
      return `${myVoiceLine({ name, status: st, miss })} The phone’s own voice reads from here.`;
    };
    onNote(`${myVoiceLine({ name, status: MY_VOICE.CHECKING })}`);
    return createCloneNarrator({
      fetchClip: clipFor(personKey),
      fallback: base,
      fallbackOpts: opts,
      onState: opts.onState,
      onNote,
      noteFor,
      readyNote: () => myVoiceLine({ name, status: MY_VOICE.READY, engine: engineName() }),
      ...(AudioCtor !== undefined ? { AudioCtor } : {}),
    });
  };
}
