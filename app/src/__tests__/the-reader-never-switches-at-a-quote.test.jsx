// @vitest-environment jsdom
// =============================================================================
// The reader never switches voice at a quote (DR-1498)
// =============================================================================
// Darrell, 2026-11-13, reading lessons aloud on Chrome after DR-1482 shipped
// (rendered for meaning, DR-0331): at a quoted verse, where the text says
// things like saith the LORD, the reader paused a moment and went on in
// another voice, not the man's voice he chose; pushing forward put his voice
// back, and it came again at the next quote. His screenshot shows the FOLLOW
// highlight sitting on the lone closing quote mark after "your thoughts."
//
// THE CAUSE, traced (not assumed):
//   1. The sentence cut (speech-shape.js clauseSegments) fell after the full
//      stop and before the closing quote, so every quoted verse left a piece
//      that BEGAN with a bare `"`.
//   2. On the lesson page every reference is a chip (WordInline, a kept
//      <button>), and the follow map took a button for a block: it put a full
//      stop either side of the chip, so "(Isaiah 55:8-9, KJV)" was read as
//      "(. Isaiah 55:8-9. , KJV)", and the cut made a piece that was only
//      `" (.` -- no word in it at all.
//   3. A piece with no word in it is spoken as nothing: the NAS voice is asked
//      for an empty text, the ask fails, and the queue handed THE WHOLE REST
//      of the reading to the phone's own voice (use-read-aloud.js onFallback
//      -> deviceRestRef). A skip or a rewind read afresh in the NAS voice,
//      which is why pushing forward fixed it until the next quote.
//
// PROVEN TO CATCH: sections 1-4 were run against origin/main's
// speech-shape.js, read-follow.js, clip-queue.js and use-read-aloud.js and
// fail there (recorded in DR-1498). Section 5 pins (B): the list of the
// books stays out of every reading path.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

const family = vi.hoisted(() => ({ key: null }));
vi.mock('../lib/supabase.js', () => ({
  supabase: {
    rpc: async (name) => (name === 'get_family_bridge_token' ? { data: family.key, error: null } : { data: null, error: null }),
    auth: {
      getUser: async () => ({ data: { user: null } }),
      updateUser: async () => ({ data: null, error: null }),
    },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
  },
}));
vi.mock('../lib/voice-sync.js', () => ({ loadVoiceProfiles: async () => ({ profiles: [] }) }));
vi.mock('../lib/voice-service.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, isVoiceServiceReady: () => false, mayAttemptStudio: () => false, probeVoiceService: async () => 'down', voiceServiceHealth: () => 'down' };
});
vi.mock('../lib/device-voice.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, checkDeviceVoice: async () => ({ state: 'downloadable', cached: false }), synthesizeOnDevice: async () => ({ error: 'not-kept' }) };
});

import { chunkForClips, createClipQueue } from '../lib/clip-queue.js';
import { segmentText } from '../lib/tts.js';
import { wordSequence } from '../lib/speech-shape.js';
import { buildFollowMap } from '../lib/read-follow.js';
import { revealAllForReading } from '../lib/read-reveal.js';
import { useReadAloud } from '../lib/use-read-aloud.js';
import { _resetLiteVoiceForTests } from '../lib/voice-service.js';
import { _setDeviceClipCacheForTests } from '../lib/clip-cache.js';
import { CHAT_BRIDGE_TOKEN_KEY } from '../lib/nas-photos.js';
import { saveReadingVoiceId } from '../lib/reading-voice.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { readAloudTextFromArc, buildLessonArc } from '../lib/lesson-flow.js';
import { lessonTimelineFor, figuresFor } from '../lib/lesson-figures.js';
import WordInline from '../components/WordInline.jsx';
import LessonFigures from '../components/LessonFigures.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// His paragraph, built the way the lesson builds it: verses quoted back to
// back, each with its reference in brackets, then the next label.
const PARAGRAPH =
  'And they overcame him by the blood of the Lamb, and by the word of their testimony; and they loved not their lives unto the death." (Revelation 12:11, KJV) "Thy words were found, and I did eat them; and thy word was unto me the joy and rejoicing of mine heart: for I am called by thy name, O LORD God of hosts." (Jeremiah 15:16, KJV) "For my thoughts are not your thoughts, neither are your ways my ways, saith the LORD. For as the heavens are higher than the earth, so are my ways higher than your ways, and my thoughts than your thoughts." (Isaiah 55:8-9, KJV) "Render therefore to all their dues: tribute to whom tribute is due; custom to whom custom; fear to whom fear; honour to whom honour." (Romans 13:7, KJV) 3D · practical: give each one what is owed today.';

const SPEAKABLE = /[\p{L}\p{N}]/u;
// A CLOSING mark at the head of a piece: a quote or bracket with nothing (or
// only a space or the next bracket) after it. An opening quote ("Thy words)
// is not one.
const CLOSERS = /^["'”’)\]](\s|$|\()/;

const flush = async (n = 8) => {
  for (let i = 0; i < n; i += 1)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
};

// =============================================================================
describe('1. the cut never leaves a piece with no word in it', () => {
  it('HIS PARAGRAPH: every piece has a word, none begins with a closing mark, and "thoughts." keeps its quote', () => {
    const pieces = chunkForClips(PARAGRAPH).map((c) => c.text);
    for (const p of pieces) {
      expect(SPEAKABLE.test(p), `a piece with nothing to say: ${JSON.stringify(p)}`).toBe(true);
      expect(CLOSERS.test(p), `a piece that begins with a closing mark: ${JSON.stringify(p)}`).toBe(false);
    }
    expect(
      pieces.some((p) => p.endsWith('than your thoughts." (Isaiah 55:8-9, KJV)')),
      'the verse keeps its quote and its reference'
    ).toBe(true);
    // Nothing lost, nothing reordered.
    expect(wordSequence(pieces.join(' '))).toEqual(wordSequence(PARAGRAPH));
  });

  it('a reading that ends on a closing quote, or a bracket, ends inside the last sentence', () => {
    for (const end of ['"', '”', '’', "'", ')', ']']) {
      const segs = segmentText(`He said it plainly.${end} And it was done.${end}`);
      for (const s of segs) expect(SPEAKABLE.test(s), `${JSON.stringify(s)} for ${end}`).toBe(true);
      expect(segs[0].endsWith(`plainly.${end}`)).toBe(true);
    }
  });

  it('a piece that is only punctuation joins its neighbour, and every piece is still a slice of the text', () => {
    const text = 'and my thoughts than your thoughts." (. Isaiah 55:8-9. , KJV) "Render therefore to all their dues."';
    const segs = segmentText(text);
    let at = 0;
    for (const s of segs) {
      expect(SPEAKABLE.test(s), JSON.stringify(s)).toBe(true);
      const found = text.indexOf(s, at);
      expect(found, `${JSON.stringify(s)} is not a slice of the text`).toBeGreaterThanOrEqual(0);
      at = found + s.length;
    }
  });
});

// =============================================================================
describe('2. on the lesson page a reference chip is a word of its sentence', () => {
  let container;
  let root;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('the real WordInline paragraph maps to the words as written, and every highlight piece has a word', async () => {
    await act(async () => root.render(createElement('div', { id: 'read-root' }, createElement(WordInline, { text: PARAGRAPH }))));
    const el = container.querySelector('#read-root');
    expect(el.querySelectorAll('button[data-read-keep]').length, 'the references render as chips').toBeGreaterThan(0);
    const follow = buildFollowMap(el, document);
    expect(follow.text).toContain('your thoughts." (Isaiah 55:8-9, KJV) "Render');
    expect(follow.text, 'a stop was put inside the reference').not.toMatch(/\(\.\s/);
    for (const seg of follow.segments) {
      expect(seg, 'every piece is found on the page').toBeTruthy();
      expect(SPEAKABLE.test(seg.text), `a highlight piece with nothing to say: ${JSON.stringify(seg.text)}`).toBe(true);
    }
  });
});

// =============================================================================
// The queue, with a NAS voice that answers an empty text the way the real one
// does (synthesizeLite: 'empty-text') and a piece that will not come.
function fakeAudio() {
  return {
    src: '',
    paused: true,
    ended: false,
    currentTime: 0,
    duration: 1,
    playbackRate: 1,
    play() {
      this.paused = false;
      return Promise.resolve();
    },
    pause() {
      this.paused = true;
    },
    addEventListener() {},
    removeEventListener() {},
  };
}
function queueWith(texts, { bad = () => false, standIn = undefined } = {}) {
  const asked = [];
  const fallbacks = [];
  const pieces = [];
  const audio = fakeAudio();
  const answer = (t) => {
    asked.push(t);
    if (!SPEAKABLE.test(t)) return Promise.resolve({ error: 'empty-text' });
    if (bad(t)) return Promise.resolve({ error: 'voice-lite-404' });
    return Promise.resolve({ url: `blob:${asked.length}` });
  };
  const q = createClipQueue({
    chunks: texts.map((t) => ({ text: t, len: t.length })),
    fetchClip: (t) => answer(t),
    fetchFresh: (t) => answer(t),
    standIn,
    audio,
    onPiece: (i) => pieces.push(i),
    onFallback: (rest, i, reason) => fallbacks.push({ rest, i, reason }),
  });
  const end = async () => {
    audio.onended();
    await flush(4);
  };
  return { q, asked, fallbacks, pieces, audio, end };
}

describe('3. a piece with nothing to say is passed, never asked for, never a failure', () => {
  it('the bare closing quote is skipped and the reading goes on in the same voice', async () => {
    const r = queueWith(['their lives unto the death.', '"', 'Thy words were found.']);
    await r.q.start();
    await flush(4);
    await r.end();
    expect(r.asked, 'the voice was asked to say a quote mark').not.toContain('"');
    expect(r.fallbacks, 'the reading was handed to another voice').toEqual([]);
    expect(r.pieces).toEqual([0, 1, 2]);
    expect(r.audio.src).toMatch(/^blob:/);
  });
});

describe('4. one piece that will not come is one piece, not the rest of the reading', () => {
  const texts = ['First sentence.', 'Thy words were found.', 'For my thoughts are not your thoughts.', 'Render therefore.'];
  const thy = (t) => t.startsWith('Thy words');

  it('asked again once; then the stand-in says THAT piece alone and the next piece is the NAS voice again', async () => {
    const said = [];
    const r = queueWith(texts, {
      bad: thy,
      standIn: async (t) => {
        said.push(t);
        return true;
      },
    });
    await r.q.start();
    await flush(4);
    await r.end();
    expect(r.asked.filter(thy).length, 'asked once, then once more fresh').toBe(2);
    expect(said).toEqual(['Thy words were found.']);
    expect(r.fallbacks, 'the rest was handed to another voice').toEqual([]);
    expect(r.asked, 'the NAS voice took the next piece').toContain('For my thoughts are not your thoughts.');
    await r.end();
    expect(r.asked).toContain('Render therefore.');
  });

  it('a piece that comes on the second ask is the NAS voice; no stand-in is used', async () => {
    let first = true;
    const said = [];
    const r = queueWith(texts, {
      bad: (t) => {
        if (thy(t) && first) {
          first = false;
          return true;
        }
        return false;
      },
      standIn: async (t) => {
        said.push(t);
        return true;
      },
    });
    await r.q.start();
    await flush(4);
    await r.end();
    expect(said).toEqual([]);
    expect(r.fallbacks).toEqual([]);
  });

  it('a stand-in that cannot (no voice of the same kind, DR-1482) hands the rest on, so the hold decides', async () => {
    const r = queueWith(texts, { bad: thy, standIn: async () => false });
    await r.q.start();
    await flush(4);
    await r.end();
    expect(r.fallbacks.length).toBe(1);
    expect(r.fallbacks[0].i).toBe(1);
  });

  it('two pieces in a row is the voice gone: the rest is handed on, not asked twice a sentence', async () => {
    const r = queueWith(texts, { bad: (t) => !t.startsWith('First'), standIn: async () => true });
    await r.q.start();
    await flush(4);
    await r.end();
    await flush(4);
    expect(r.fallbacks.length).toBe(1);
    expect(r.fallbacks[0].i).toBe(2);
  });
});

// =============================================================================
// The hook, end to end, with a phone that HAS a man's voice: the one piece
// the NAS cannot give is said by the phone, and the man's NAS voice reads on.
const MAN = { name: 'English (United States) Male', voiceURI: 'en-us-male', lang: 'en-US', localService: true };
const WOMAN = { name: 'English (United States) Female', voiceURI: 'en-us-female', lang: 'en-US', localService: true };
const road = { calls: [], answer: null };
function voiceLiteFetch(url, init) {
  if (!String(url).includes('/voice-lite/')) return Promise.resolve({ ok: false, status: 404, headers: { get: () => null } });
  const body = JSON.parse(init.body);
  road.calls.push({ voice: body.voice, text: body.text });
  const status = road.answer ? road.answer({ n: road.calls.length, body }) : 200;
  return Promise.resolve({
    ok: status === 200,
    status,
    headers: { get: (k) => (k.toLowerCase() === 'content-type' ? (status === 200 ? 'audio/wav' : 'application/json') : null) },
    blob: async () => ({ size: 3200 }),
  });
}
const media = { plays: [] };
function installMedia() {
  window.HTMLMediaElement.prototype.play = function play() {
    media.plays.push({ blob: String(this.src || '').startsWith('blob:'), el: this });
    return Promise.resolve();
  };
  window.HTMLMediaElement.prototype.pause = function pause() {};
  window.HTMLMediaElement.prototype.load = function load() {};
}
function installPhone(voices) {
  function Utt(text) {
    this.text = text;
  }
  const s = {
    spoken: [],
    speaking: false,
    paused: false,
    pending: false,
    speak(u) {
      s.spoken.push(u);
      s.speaking = true;
      if (u.onstart) u.onstart();
      setTimeout(() => {
        s.speaking = false;
        if (u.onend) u.onend();
      }, 0);
    },
    cancel() {
      s.speaking = false;
    },
    pause() {},
    resume() {},
    getVoices() {
      return [...voices];
    },
    addEventListener() {},
    removeEventListener() {},
    onvoiceschanged: null,
  };
  window.speechSynthesis = s;
  window.SpeechSynthesisUtterance = Utt;
  return s;
}

describe('4b. the hook: one sentence on the phone, then the man’s voice again', () => {
  let container;
  let root;
  let api;
  function Probe() {
    api = useReadAloud({ isOwner: true });
    return null;
  }
  beforeEach(() => {
    localStorage.clear();
    family.key = 'fam-key';
    localStorage.setItem(CHAT_BRIDGE_TOKEN_KEY, 'fam-key');
    saveReadingVoiceId('person:darrell');
    road.calls = [];
    road.answer = null;
    media.plays = [];
    _resetLiteVoiceForTests();
    _setDeviceClipCacheForTests(null);
    globalThis.fetch = vi.fn(voiceLiteFetch);
    URL.createObjectURL = () => `blob:clip-${Math.random().toString(36).slice(2, 8)}`;
    URL.revokeObjectURL = () => {};
    installMedia();
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    delete window.speechSynthesis;
    delete window.SpeechSynthesisUtterance;
  });

  it('the quoted verse the NAS will not give is said alone, in a man’s voice, and the NAS man’s voice reads the next one', async () => {
    const phone = installPhone([WOMAN, MAN]);
    await act(async () => root.render(createElement(Probe)));
    await flush();
    road.answer = ({ body }) => (/Thy words were found/.test(body.text) ? 404 : 200);
    api.claimAudio('Lesson');
    const reading = api.read(PARAGRAPH, { title: 'Lesson' });
    await act(async () => {
      await reading;
    });
    await flush();
    for (let k = 0; k < 4; k += 1) {
      const el = media.plays.filter((p) => p.blob).at(-1);
      if (el && el.el.onended)
        await act(async () => {
          el.el.onended();
        });
      await flush();
    }
    expect(phone.spoken.length, 'the phone said more than the one piece').toBe(1);
    expect(phone.spoken[0].text).toMatch(/Thy words were found/);
    expect(phone.spoken[0].text).not.toMatch(/For my thoughts/);
    expect(phone.spoken[0].voice && phone.spoken[0].voice.voiceURI).toBe(MAN.voiceURI);
    const after = road.calls.filter((c) => /For my thoughts/.test(c.text));
    expect(after.length, 'the NAS voice was not asked for the next piece').toBeGreaterThan(0);
    expect(after[0].voice).toBe('male');
  });
});

// =============================================================================
// (B) The list of the books, in a lesson page, opened and closed.
describe('5. the books timeline is never in what any reading path speaks', () => {
  let container;
  let root;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });
  // The books list's own words. (A figure that is NOT the list, L140's, is
  // still read by design, DR-1482, so its own "Source:" line may be heard.)
  const LIST_WORDS = [/optional, open to review/, /books? this lesson quotes/, /The Word dates it/, /We did not check/];
  const FIGURE_WORDS = [...LIST_WORDS, /Source:/];
  const L140 = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll140-'));
  const ONLY_TIMELINE = LIVING_LESSONS_MODULES.find((m) => lessonTimelineFor(m) && figuresFor(m).length === 0);

  async function page(module, open) {
    await act(async () =>
      root.render(
        createElement(
          'main',
          { id: 'read-root' },
          createElement('p', null, 'As the Word says, "In the beginning God created the heaven and the earth" (Genesis 1:1), and that is where we stand.'),
          createElement(LessonFigures, { module })
        )
      )
    );
    const el = container.querySelector('#read-root');
    if (open) for (const d of el.querySelectorAll('details')) d.open = true;
    await revealAllForReading(el);
    return el;
  }

  for (const [name, pick, words] of [
    ['a lesson whose only figure is the books list', () => ONLY_TIMELINE, FIGURE_WORDS],
    ['a lesson with the books list AND another figure (L140)', () => L140, LIST_WORDS],
  ]) {
    for (const open of [false, true]) {
      it(`${name}, fold ${open ? 'opened by hand' : 'closed'}: the page reader and the lesson reader speak none of it`, async () => {
        const module = pick();
        expect(module, name).toBeTruthy();
        expect(lessonTimelineFor(module), 'the lesson has the books list').toBeTruthy();
        const el = await page(module, open);
        expect(el.querySelector('[data-testid="lesson-figures-summary"]').textContent).toMatch(/optional, open to review/);
        const spoken = buildFollowMap(el, document).text;
        expect(spoken).toContain('In the beginning God created the heaven and the earth');
        for (const w of words) expect(spoken, `the reader speaks ${w}`).not.toMatch(w);
      });
    }
  }

  it('the lesson’s composed reading (the saved-lesson path) carries none of it', () => {
    for (const m of [ONLY_TIMELINE, L140]) {
      const text = readAloudTextFromArc(buildLessonArc(m, { ageBand: 'adult' }));
      for (const w of FIGURE_WORDS) expect(text, `${m.id} composed reading has ${w}`).not.toMatch(w);
    }
  });
});
