// =============================================================================
// TTSControl — the floating READ-ALOUD control (the HEAR half of see/hear a11y)
// =============================================================================
// "Read anywhere": this floating control is on every page, and it reads in the
// user's ONE chosen reading voice (lib/reading-voice via use-read-aloud). Pick a
// voice once (here, in the header, or in the Voice tab) and every page reads in
// it — no re-picking. Big, obvious controls for a non-technical, elderly reader:
// a play button, then a Pause/Stop pair, plain speed steps (incl. SLOWER), and the
// same global voice picker. Reads the visible page so anyone can conduct business
// without reading the screen (COMMUNITY-FIRST-MISSION).
//
// On a device without speech support the hook reports supported:false and this
// renders nothing — no crash (unbreakable). Status is announced for screen
// readers; every control is keyboard reachable; the panel is a high-contrast
// (WCAG AA) white card regardless of app theme.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RATE_STEPS } from '../lib/tts.js';
import { useReadAloud } from '../lib/use-read-aloud.js';
import {
  buildFollowMap, wordRange, highlightSegment, highlightWord,
  clearReadingHighlights, followRange, rangeFor,
  segmentIndexAtDomPoint, alignSegments, segmentIndexAtFraction, startIndexForFraction,
  paragraphStarts, paragraphJumpTarget,
} from '../lib/read-follow.js';
import { segmentText } from '../lib/tts.js';
import { readFromPoint } from '../lib/read-from-here.js';
import { getReadTarget, subscribeReadTarget, pendingRead, takeRead, subscribeRead, requestRead } from '../lib/read-target.js';
import { useShowTheWord, toggleShowTheWord } from '../lib/show-the-word.js';
import { getPlace, recordPlace, sentenceKeyOf, findSentence, finishPlace, placeIsFinished } from '../lib/learn-resume.js';
import { IDLE as RETURN_IDLE, foldReturn, offersReturn, returnPlan, returnLabel } from '../lib/reader-return.js';
import { getBookmark, saveBookmark, offersResume, resumeLabel, paragraphOf, paragraphLabels } from '../lib/reader-bookmarks.js';
import { subscribeReadRequest } from '../lib/read-request.js';
import { revealAllForReading, settled, afterRender } from '../lib/read-reveal.js';
import UiIcon from './UiIcon.jsx';
import { helpFor } from '../lib/help-content.js';
import { buildSurfaceDigest } from '../lib/surface-digest.js';
import { talkAboutSurface } from '../lib/talk-about.js';
import { useIdleReveal } from '../lib/use-idle-reveal.js';
import { motionBehavior } from '../lib/gentle-motion.js';
import { useScreenAwake, NO_WAKE_LOCK_HINT } from '../lib/screen-awake.js';
import { mayTryLiteVoice } from '../lib/voice-service.js';
// COMFORT CONTROLS IN THE READER (DR-0524). Darrell, reading L179 on his phone:
// "Can't change the text side nor etc on o cellphone reader fix it."
// WHAT WAS ACTUALLY WRONG, measured at 360px mid-lesson after a first reading
// of the code got it wrong. The first trace said the header scrolls away; it
// does not -- the header is position:sticky at top 0, so with the top bar OPEN
// five text-size controls stay on screen the whole way down a lesson. The real
// trap is the HIDEAWAY, which is the state his screenshot shows:
//
//     header OPEN       -> 5 text-size controls, all 5 on screen
//     header TUCKED AWAY -> ZERO text-size controls in the DOM, at Normal size
//
// The hideaway unmounts the comfort row, and TextSizeEscapeHatch rendered
// nothing at Normal on the reasoning that "at 1x there is no trap" -- true of
// getting OUT of big text, false of getting INTO it. Two fixes, both measured:
// the hatch now renders at every size while the header is tucked away, and this
// panel carries its own copy so the lesson reader is covered whatever the
// header is doing.
//
// This panel is the one reading-settings surface reachable from anywhere in a
// lesson, and it is where he went looking -- his second screenshot is it, open,
// with speed and voice in it and no text size.
import { useTextSize } from '../lib/text-size.js';
import { THEMES, useThemePref } from '../lib/theme-css.js';

// After the page comes back from dark, the engine's own foreground recovery
// (lib/tts.js _recoverForeground) gets this long to bring the audio back before
// the reader is offered ▶ Continue (DR-0439).
export const INTERRUPT_GRACE_MS = 1500;
// How long a reading must stay continuously live before the "screen went dark"
// offer is taken down. Shorter than this and an engine flicker on wake dismisses
// the offer (Darrell 2026-09-17: it "flashes and leaves pretty quickly").
export const RESUME_CONFIRM_MS = 1200;

// CONTROLS ARE NOT CONTENT — the reader must not read the buttons.
//
// Darrell 2026-08-13, listening on the Scripture tab: "The reader reads the
// Highlight Up Arrow... etc... I want the content."
//
// This is the page-read FALLBACK, used on any surface that has not registered a
// read target (lib/read-target.js). Scripture is one of those surfaces, so its
// reading was the whole of <main>.innerText — and innerText includes every
// control label. A listener heard "↑ HIDE OTHER TRANSLATIONS · ESV · NIV · NKJV
// · AMP · CLEAR HIGHLIGHT · GIVE · FEEDBACK · × HIDE" threaded through the Word.
// On a platform whose point is hearing Scripture, that is the reading itself
// being corrupted by furniture.
//
// So the fallback now strips the interactive layer: navigation, menus, tab
// strips, dialogs, form controls, and buttons. A surface that genuinely renders
// reading material inside a control can opt that node back in with
// `data-read-keep`, and anything can opt out with `data-read-skip` — but the
// DEFAULT is that chrome is silent, because the default was the bug.
//
// This is a fallback, not the destination: the real fix for a surface is to
// register its own reading, which also gets follow-along highlighting and
// hands-free continuation. Stripping here is what makes the fallback honest in
// the meantime.
const CHROME_SELECTOR = [
  '.tts-controls', '.feedback-modal', '[aria-hidden="true"]', '[data-read-skip]',
  'nav', 'button', 'select', 'input', 'textarea',
  '[role="menu"]', '[role="menubar"]', '[role="tablist"]', '[role="dialog"]',
  '[role="listbox"]', '[role="toolbar"]', '[role="navigation"]',
].join(', ');

// THE ONE ROOT BOTH HALVES OF THE READER USE.
//
// Darrell 2026-08-14: "this page just reads without a reader highlighting the
// words and following the word we currently read."
//
// That was this: the TEXT extractor fell back to `document.body` when a surface
// renders no <main>, but the FOLLOW MAP did not — it was built only when
// `querySelector('main')` returned an element, and was left null otherwise. So
// on every surface without a <main> (only six files in the app render one) the
// reader spoke the page perfectly and highlighted nothing, because there was no
// map to highlight from. Reading worked, following did not, and the two were
// reading off different roots.
//
// This is the same shape as SKIP_SELECTOR vs CHROME_SELECTOR earlier the same
// day: two places that must agree, kept in agreement by nobody. One function,
// called by both, is the fix — not a comment asking the next person to
// remember.
export function readingRoot(doc = (typeof document === 'undefined' ? null : document)) {
  if (!doc) return null;
  return doc.querySelector('main') || doc.body || null;
}

function readablePageText() {
  if (typeof document === 'undefined') return '';
  const main = readingRoot();
  if (!main) return '';
  const clone = main.cloneNode(true);
  clone.querySelectorAll(CHROME_SELECTOR).forEach((el) => {
    // An explicit opt-in wins, so a surface that really does render its reading
    // inside a control is not silently truncated by this rule.
    try { if (el.matches && el.matches('[data-read-keep]')) return; } catch (_) { /* fall through to remove */ }
    el.remove();
  });
  return (clone.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 32000);
}

// WHAT HAPPENS WHEN YOU SWITCH APPS — said per voice, never one claim for all
// (Darrell 2026-09-24: "Why doesn't the player remain playing in the background
// when I switch between apps?!!? Fix it."). The panel used to promise "the
// reading carries on when you leave the app" whatever was speaking. That is
// true of a real audio clip and FALSE of the phone's own Web Speech voice,
// which Android stops when the app leaves the screen — and the phone's voice
// is exactly what spoke on the night the studio was offline.
export const BACKGROUND_LINES = {
  audio: 'This voice keeps playing when you switch apps — your phone’s own play/pause controls it.',
  device: 'This voice stops when you switch apps — the audio voice is offline.',
  idle: 'The audio voice keeps playing when you switch apps. If it is offline, the phone’s own voice reads instead, and that one stops when you switch apps.',
};
export function backgroundLine({ isReading, audioVoice } = {}) {
  if (isReading && audioVoice === 'device') return BACKGROUND_LINES.device;
  if (isReading && audioVoice === 'audio') return BACKGROUND_LINES.audio;
  return BACKGROUND_LINES.idle;
}

export default function TTSControl({ isOwner = false, view, churchView, booksView }) {
  const [isOpen, setIsOpen] = useState(false);
  // Same switch as the in-lesson bar: one module store, never two states.
  const showWord = useShowTheWord();
  // WHILE READING, THE PANEL GETS OUT OF THE WAY (Darrell 2026-08-03: "the
  // read along blocks the readers page with the data being read"): once
  // reading starts, the full card collapses to a slim pill (pause/stop/
  // expand) so the page — and its moving highlight — stays visible. Expanding
  // re-opens the full card; stopping restores it.
  const [minimized, setMinimized] = useState(false);
  // Both are module-published (text-size.js / theme-css.js), so these pickers
  // and the header's are the SAME switch and can never disagree -- the same
  // reason show-the-word.js is reused below rather than re-implemented.
  const [textSize, setTextSizeKey, textSizeSteps] = useTextSize();
  const [theme, setTheme] = useThemePref('cream');
  // "Talk about this" state: thinking, and the source of the last explanation
  // (live NAS A.I. vs on-device authored) so the user knows which they heard.
  const [talking, setTalking] = useState(false);
  const [talkSource, setTalkSource] = useState('');
  const {
    supported, isReading, isPaused, rate, read, pause, resume, stop, setRate, claimAudio,
    catalog, voiceId, setVoiceId, currentItem,
    segmentIndex, setBoundaryHandler, deviceRead, cloudProgress,
    // `notice` WAS NOT TAKEN HERE until 2026-09-20, and that single omission
    // broke the engine's own guarantee at its very last hop. tts.js runs a
    // start watchdog whose comment reads "Truly silent after a retry — report
    // it. Never a dead, silent button," and use-read-aloud turns that into
    // 'Audio didn't start…'. The message was computed on every failure and
    // then thrown away, because this component — the one behind the READ
    // ALOUD button — never destructured it. Darrell hit it on a Fire TV:
    // pressed read, heard nothing, was told nothing.
    notice,
    // 'audio' | 'device' | '' — only an audio voice survives switching apps.
    audioVoice,
    // The OS skip buttons get the bar's paragraph step (optional in mocks).
    setSkipHandlers,
    setNotice,
    noticeAction,
    standInWhy,
  } = useReadAloud({ isOwner });

  // THE SCREEN STAYS ON WHILE IT READS (DR-0439; Darrell 2026-09-16: his phone
  // goes black at 10 minutes and cuts the lesson). One shared wake-lock holder
  // named for the reader; the lesson space holds its own while a lesson is
  // open (ChurchLearn). Per-device switch in the panel below.
  const awake = useScreenAwake(isReading, 'read-aloud');
  // WENT DARK MID-READING → ▶ CONTINUE (Darrell: "a prompt to users... so it
  // doesn't cut out their lesson and they can push play and it will continue").
  // If the page hid while a reading was live and, on return, the engine's own
  // recovery did not bring it back within the grace period, offer the way on —
  // from the held sentence, never the top. A reader's own pause is never nagged
  // (paused still counts as reading, so nothing was lost).
  const [interrupted, setInterrupted] = useState(false);
  const readingRef = useRef(false);
  readingRef.current = isReading;
  // LIKE A RADIO (Darrell 2026-09-24: "the player should be able to play no
  // matter what's going on... It is like a radio in the background... Stop
  // trying to constrain it."). Which voice is speaking decides what the dark
  // screen does: a real audio clip plays on through it, the phone's own
  // speech engine is stopped by the OS. So on the way into the dark the
  // phone's voice hands over to the audio voice when there is one, and on the
  // way back a reading that died is picked up again without being asked.
  const deviceVoiceRef = useRef(false);
  deviceVoiceRef.current = isReading && !isPaused && (audioVoice === 'device' || (audioVoice !== 'audio' && deviceRead));
  const pausedRef = useRef(false);
  pausedRef.current = isPaused;
  const handOverRef = useRef(null);   // phone voice -> audio voice, same sentence
  const pickUpRef = useRef(null);     // a reading that died in the dark, continued
  const hidWhileReadingRef = useRef(false);

  // A NOTICE IS NOT A POPUP (Darrell 2026-09-23, a lesson page with the
  // studio's HTTP 404 floating over it: "Popup's?!!!"). The 2026-09-22 answer
  // was a twelve-second timer that took the floating box down; that treated
  // the symptom -- the box still appeared over the Word, and a message that
  // vanishes while you are reading it is its own kind of unintuitive. The
  // notice now lives INSIDE the reader's own chrome: a line in the open panel,
  // a small mark on the pill and on the speaker button when the panel is
  // closed. Nothing new is painted over the page, so nothing needs a timer;
  // the person dismisses it, or the next read replaces it (use-read-aloud.js).
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    let timer = null;
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        hidWhileReadingRef.current = readingRef.current;
        // The phone's own voice is about to be stopped by the OS: hand the
        // same sentence to the audio voice, which a phone keeps playing.
        if (deviceVoiceRef.current && mayTryLiteVoice() && handOverRef.current) {
          try { handOverRef.current(); } catch (_) { /* the backstop below still runs */ }
        }
        return;
      }
      if (!hidWhileReadingRef.current) return;
      hidWhileReadingRef.current = false;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (readingRef.current) return;
        // Picked up again without being asked (never a deliberate pause —
        // paused still counts as reading). The offer shows too, and clears
        // itself once the reading has stayed live.
        if (pickUpRef.current) { try { pickUpRef.current(); } catch (_) { /* offer below */ } }
        setInterrupted(true);
      }, INTERRUPT_GRACE_MS);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => { document.removeEventListener('visibilitychange', onVis); if (timer) clearTimeout(timer); };
  }, []);
  // WHY THIS IS NOT `if (isReading) setInterrupted(false)` (Darrell 2026-09-17:
  // "the continue button flashes and leaves pretty quickly"). That one-line
  // effect cleared the offer on the FIRST tick of isReading - and on waking a
  // dark screen the speech engine frequently performs its own brief recovery,
  // flickers alive, and then dies again. So the notice appeared and vanished
  // within a frame or two, leaving the reader with no reading AND no way back
  // to the sentence they lost. The offer was being dismissed by the very
  // failure it exists to recover from.
  //
  // It now clears only once reading has been continuously live for
  // RESUME_CONFIRM_MS - long enough that a flicker cannot claim success - and
  // any drop inside that window cancels the clear and leaves the offer
  // standing. Once shown, nothing auto-hides it: only the reader pressing
  // Continue or the dismiss X takes it away. An offer to restore a lost place
  // must not evaporate on its own, because the reader may be looking at the
  // screen rather than at it.
  useEffect(() => {
    if (!isReading) return undefined;
    const t = setTimeout(() => { if (readingRef.current) setInterrupted(false); }, RESUME_CONFIRM_MS);
    return () => clearTimeout(t);
  }, [isReading]);

  // FOLLOW-ALONG (DR-0264, Darrell 2026-08-03: readers "could be 6 or 60 years
  // old... highlighted as it reads so users can see their place and the screen
  // should move with the location of the words"). When Play starts from the
  // visible page, the SAME normalized text handed to the engine is mapped to
  // live DOM ranges (read-follow.js — alignment by construction). The engine's
  // segmentIndex then drives a sentence highlight + centered auto-scroll, and
  // word boundaries (where the device fires them) drive the word highlight.
  // followRef holds { ranges (Range|null per SPOKEN segment), lens (spoken
  // segment char lengths — cloud fraction mapping), follow + base (word-level
  // mapping where the mode supports it), wordable }.
  const followRef = useRef(null);
  const lastCloudIdxRef = useRef(-1);
  // A LEVEL SWITCH MID-READ KEEPS THE PLACE (DR-0426). When the listener picks
  // a level from this panel while a lesson is being read, the lesson
  // re-registers its target with the new level's words; this remembers how
  // far through the OLD words the reader was, so the new read can begin at
  // the same fraction (half-way stays half-way — DR-0418's law, per sentence).
  const relevelRef = useRef(null);
  // DECLARED ABOVE THE EFFECT THAT LISTS IT. A dependency array is evaluated
  // DURING RENDER, so this const sitting below the effect put it in the
  // temporal dead zone and every mount of the reader threw
  // "Cannot access 'rememberSentence' before initialization" -- 67 render
  // failures across 12 files, on a change whose own unit tests were green.
  // STABLE BY CONSTRUCTION: this runs inside the per-sentence effect, so a new
  // identity every render would re-fire that effect on every render instead of
  // only when the sentence changes. It closes over nothing from this render --
  // the guard is re-read from the registry each call -- so the empty dep list
  // is honest rather than a lint silencer.
  const rememberSentence = useCallback((absIndex, text) => {
    if (!text) return;
    // THE BOOKMARK FOR THIS READING (Darrell 2026-09-24: "start where I left
    // off"). Written for the reading the follow map was built from — never for
    // a tap-started or whole-page read that happens to run while a lesson is
    // registered — so each lesson, chapter or page keeps its own place.
    try {
      const f = followRef.current;
      const t = getReadTarget();
      if (f && f.owner && t && t.owner === f.owner && f.follow && f.follow.segments) {
        if (!f.paraStarts) f.paraStarts = paragraphStarts(f.follow);
        const total = f.follow.segments.length;
        saveBookmark(f.owner, {
          sentence: absIndex,
          key: sentenceKeyOf(text),
          para: paragraphOf(f.paraStarts, absIndex),
          paras: f.paraStarts.length,
          done: total > 0 && absIndex >= total - 1,
        });
      }
    } catch { /* a bookmark that cannot be written never breaks a read */ }
    try {
      const t = getReadTarget();
      const place = getPlace();
      if (!t || !t.owner || !place || !place.lessonId || t.owner !== place.lessonId) return;
      recordPlace({ sentence: absIndex, sentenceKey: sentenceKeyOf(text) });
      // IF IT IS OVER, IT IS OVER (Darrell 2026-09-16, from his phone at part
      // 7/7: "can't re-listen to the lesson after the lesson is over because
      // it's allowing the lesson to keep starting at the end because it thinks
      // it's finished because it's starting where it left off at").
      //
      // The line above is the whole trap: every sentence is remembered, the
      // LAST one included, so a lesson heard to its end saved its end. The
      // next press resolved that sentence, spoke it, and stopped.
      //
      // The final sentence is the one moment that means HEARD TO THE END, and
      // it needs no guess about whether the engine finished or the listener
      // pressed Stop on the closing words — either way they heard it all, and
      // either way the next start belongs at the top. Read from the follow map
      // through the ref, so this keeps its empty dependency list honest.
      const st = followRef.current;
      const total = st && st.follow && st.follow.segments ? st.follow.segments.length : 0;
      if (total > 0 && absIndex >= total - 1) finishPlace();
    } catch { /* a place that cannot be written never breaks a read */ }
  }, []);

  useEffect(() => {
    if (!isReading || !deviceRead || !followRef.current) {
      if (!isReading) { clearReadingHighlights(); highlightWord(null); lastCloudIdxRef.current = -1; }
      return;
    }
    const r = followRef.current.ranges[segmentIndex] || null;
    highlightSegment(r);
    highlightWord(null); // a new sentence clears the previous word
    followRange(r);
    // The sentence just reached IS the place. `base` is the offset this run
    // started at, so the stored index is absolute within the lesson.
    const st = followRef.current;
    const seg = st.follow && st.follow.segments ? st.follow.segments[st.base + segmentIndex] : null;
    if (seg && seg.text) rememberSentence(st.base + segmentIndex, seg.text);
  }, [segmentIndex, isReading, deviceRead, rememberSentence]);
  // CLOUD (cloned-voice) sentence-follow (DR-0265): the clip has no word
  // timings, but playback fraction → character position → sentence works at
  // sentence granularity. Only re-highlights when the sentence changes.
  useEffect(() => {
    if (!isReading || deviceRead || !followRef.current) return;
    const idx = segmentIndexAtFraction(followRef.current.lens, cloudProgress);
    if (idx < 0 || idx === lastCloudIdxRef.current) return;
    lastCloudIdxRef.current = idx;
    const r = followRef.current.ranges[idx] || null;
    highlightSegment(r);
    followRange(r);
    // THE CLOUD VOICE KEEPS THE PLACE TOO (Darrell 2026-09-14: "Lessons keep
    // being interrupted and I'm loosing my exact location"). The sentence write
    // shipped only in the DEVICE-voice effect above, so listening in the
    // sovereign/cloned voice -- which is what the voice picker defaults people
    // into -- recorded nothing at all. Same absolute index convention as the
    // device path: base + local.
    const st = followRef.current;
    const seg = st.follow && st.follow.segments ? st.follow.segments[st.base + idx] : null;
    if (seg && seg.text) rememberSentence(st.base + idx, seg.text);
  }, [cloudProgress, isReading, deviceRead, rememberSentence]);
  // Reading over (or never started) → the full card comes back next open.
  useEffect(() => { if (!isReading) setMinimized(false); }, [isReading]);
  // PLAY MEANS READ IT. A Play press records a want (read-target.js) and this
  // starts that lesson's reading the moment its target registers -- which is
  // usually a frame or two later, because pressing Play also opens the lesson
  // whose component does the registering. Both the want arriving and the target
  // arriving are watched, since either can be second.
  useEffect(() => {
    const tryStart = () => {
      const t = getReadTarget();
      const w = pendingRead();
      if (!t || !w || t.owner !== w.owner) return;
      if (!takeRead(t.owner)) return;
      if (readTargetRef.current) readTargetRef.current(t);
    };
    tryStart();
    const offWant = subscribeRead(tryStart);
    const offTarget = subscribeReadTarget(tryStart);
    return () => { offWant(); offTarget(); };
  }, []);

  useEffect(() => {
    if (!setBoundaryHandler) return undefined;
    setBoundaryHandler((segIdx, charIndex) => {
      const f = followRef.current;
      if (!f || !f.wordable) return;
      const r = wordRange(f.follow, f.base + segIdx, charIndex);
      if (r) highlightWord(r);
    });
    return () => setBoundaryHandler(null);
  }, [setBoundaryHandler]);

  // Builders for the three followable read modes (DR-0264/DR-0265).
  // RESUME AT THE SENTENCE (Darrell 2026-09-14: "Also need the lessons to begin
  // exactly where they left off at least the sentence....").
  //
  // The learner's place record already held the lesson and the paragraph
  // (`step`); what it could not hold was the SENTENCE, so reopening a lesson
  // restarted the paragraph you were in the middle of. Read aloud, on a long
  // teaching paragraph, that is most of a minute of hearing what you already
  // heard.
  //
  // The reader is the right place to write it from, because the reader is the
  // thing that knows which sentence is being spoken. It does NOT need the lesson
  // component to hand it down: recordPlace MERGES, so writing only
  // {sentence, sentenceKey} lands on the lesson the place already names — no
  // prop threaded through the app shell, and nothing added to the frozen
  // monolith.
  //
  // THE GUARD THAT KEEPS IT HONEST: only write when the registered reading's
  // owner IS the lesson the place names. Without that, reading a Bible chapter
  // or a public door would stamp a sentence onto whatever lesson happened to be
  // open last, and the next resume would jump somewhere the reader never was.
  const placeLessonIfMine = () => {
    try {
      const t = getReadTarget();
      const place = getPlace();
      if (!t || !t.owner || !place || !place.lessonId) return null;
      return t.owner === place.lessonId ? place : null;
    } catch { return null; }
  };


  /** Where a lesson read should START, or -1 for the top. */
  const savedStartIndex = (segments, owner) => {
    const place = placeLessonIfMine();
    if (!place) {
      // Not the lesson the app-wide place names: this reading's own bookmark.
      const b = owner ? getBookmark(owner) : null;
      if (!offersResume(b)) return -1;
      const hit = findSentence((segments || []).map((g) => (g && g.text) || ''), { sentence: b.sentence, sentenceKey: b.key });
      return hit.how === 'exact' || hit.how === 'moved' || hit.how === 'index-only' ? hit.index : -1;
    }
    // A FINISHED LESSON BEGINS AGAIN. Without this, the saved sentence IS the
    // last sentence, and "Read this lesson — start to finish" spoke one line
    // and stopped — which is exactly what re-listening looked like from his
    // phone. The flag is cleared by the first sentence this read then stores,
    // so an interrupted re-listen resumes normally (lib/learn-resume.js).
    if (placeIsFinished(place)) return -1;
    const found = findSentence((segments || []).map((g) => (g && g.text) || ''), place);
    // `gone` / `unknown` deliberately fall through to the top rather than guess.
    return found.how === 'exact' || found.how === 'moved' || found.how === 'index-only'
      ? found.index : -1;
  };

  const pageFollowState = (follow, base = 0) => ({
    follow,
    base,
    ranges: follow.segments.slice(base).map((s) => (s ? rangeFor(follow, s.start, s.end) : null)),
    lens: follow.segments.slice(base).map((s) => (s ? s.text.length : 0)),
    wordable: true,
  });

  // START WHERE I TAP (DR-0144): "if Ari could start right at wherever users
  // want it to start... whatever word on the page" (Darrell, 2026-07-10). Arm a
  // one-shot capture listener; the next tap on the page becomes the reading
  // start — mapped to the exact word via lib/read-from-here, falling back to the
  // top of the page (never silence) when the device can't resolve the tap.
  const [armed, setArmed] = useState(false);
  // READ ONE FULL PIECE (Darrell 2026-07-30: "The reader reads different
  // lessons not one full one... Just the pages showing"): when a surface
  // registers its primary reading (e.g. the open Learn lesson, complete —
  // lib/read-target.js), reading THAT start-to-finish is the primary action;
  // whole-page reading stays as the fallback below it.
  const [target, setTarget] = useState(() => getReadTarget());
  // "Start at" — the paragraphs of the registered reading, listed on request.
  const [pickList, setPickList] = useState(null); // { owner, labels } | null
  useEffect(() => subscribeReadTarget(setTarget), []);
  // DECLARED BELOW `target` ON PURPOSE. The first placement of this block sat
  // above the useState above — the same temporal-dead-zone trap this file
  // already records costing 67 render failures at rememberSentence. A
  // dependency array is evaluated DURING render, so a const listed there but
  // declared later throws on every mount of the reader.
  // THE WAY BACK WHEN YOU LEAVE THE PAGE (DR-0552; Darrell 2026-09-20: "if and
  // when you leave the page to do something necessary and want to come back in
  // and listen to what you were just listening to... move them back to the
  // highlighted sentences and pages right away from the reader").
  //
  // The screen-off recoveries above all hang off `visibilitychange`, and
  // IN-APP NAVIGATION FIRES NONE OF THEM. But a lesson's unmount already calls
  // clearReadTarget(owner), so the target going {owner: X} -> null WHILE the
  // place still names lesson X IS the departure event — no new bookkeeping.
  // reader-return.js decides when an offer is honest (it never restarts a
  // deliberate pause, and stays silent on a finished lesson); this only folds
  // observations in and renders what it decides.
  // A place that cannot be read is simply no place — never a throw that takes
  // the reader down with it.
  const readPlace = () => { try { return getPlace(); } catch { return null; } };
  const [ret, setRet] = useState(RETURN_IDLE);
  // TAKING THE WAY BACK. The plan always carries the SENTENCE — "move them back
  // to the highlighted sentences" is the half that did not exist — and `speak`
  // honours how they left, so a deliberate pause is never restarted for them.
  const takeMeBack = useCallback(() => {
    const plan = returnPlan(ret, readPlace());
    if (!plan) return;
    // The lesson's own space is the thing that knows how to open a lesson and
    // scroll within it; asking for the read re-arms the reader the moment that
    // lesson re-registers, and savedStartIndex() lands it on the sentence.
    try { requestRead(plan.lessonId); } catch { /* a way back that fails is never fatal */ }
    setRet(RETURN_IDLE);
  }, [ret]);

  useEffect(() => {
    setRet((prev) => foldReturn(prev, { target, isReading, paused: isPaused, place: readPlace() }));
  }, [target, isReading, isPaused]);
  // THE READER CAN SWITCH THE LEVEL TOO (Darrell 2026-09-15: "we would also
  // want the reader to be able to switch too" — DR-0426). The lesson hands
  // its "Who is learning?" choice to the target (level / levels / setLevel);
  // a pick here reaches the same remembered state the in-lesson row sets.
  // Mid-read, the current fraction is kept, the engine stops, and when the
  // lesson re-registers with the new words the reading resumes there.
  const pickLevel = (id) => {
    if (!target || !target.setLevel || !id || id === target.level) return;
    if (isReading && followRef.current && followRef.current.follow) {
      const total = followRef.current.follow.segments.length || 1;
      relevelRef.current = { owner: target.owner, fromLevel: target.level, fraction: Math.min(1, Math.max(0, currentGlobalSegment() / total)) };
      // Not an ended piece: the hands-free run must not advance to the next
      // lesson while the same lesson re-registers at the new level.
      jumpingRef.current = true;
      stop();
    }
    try { target.setLevel(id); } catch (_) { relevelRef.current = null; jumpingRef.current = false; }
  };
  useEffect(() => {
    const pending = relevelRef.current;
    if (!pending || !target || target.owner !== pending.owner || target.level === pending.fromLevel) return;
    relevelRef.current = null;
    if (readTargetRef.current) readTargetRef.current(target, { continuing: true, startFraction: pending.fraction });
  }, [target]);
  // ONE-BUTTON PLAY FROM ANY SURFACE (Darrell 2026-08-10: "speakers are
  // supposed to be able to push play for reading whatever"). A surface asks
  // (lib/read-request) and the reader answers with its full behavior — the
  // registered piece start to finish, the follow-along, and the hands-free run
  // to the next piece. No panel to find, no three taps.
  useEffect(() => subscribeReadRequest(() => {
    const t = getReadTarget();
    if (t && readTargetRef.current) { readTargetRef.current(t); return; }
    if (startRef.current) startRef.current();
  }), []);
  const startRef = useRef(null);
  // The target we asked to render in full (read-this-piece), so its paced view
  // can be restored when the reading ends. Declared with the other hooks —
  // above the unsupported-device early return — so hook order never varies.
  const preparedRef = useRef(null);
  // HANDS-FREE RUN (Darrell 2026-08-10: "can't read the whole lesson... without
  // a human turning the page!!! users should be able to listen to the whole
  // thing without needing to intervene"). While a target read is running, this
  // holds the piece being read; when it finishes on its own the reader asks the
  // surface for the NEXT piece, waits for it to register, and keeps reading.
  // Stop clears it — that is the difference between "it ended" and "you ended
  // it", and it is the only thing that ends the run.
  const runRef = useRef(null);
  const [runInfo, setRunInfo] = useState(null); // { label } while a run is live
  // A paragraph jump restarts the engine mid-piece; that restart can flicker
  // through a not-reading render, which the run-continuation effect below must
  // not mistake for "the piece ended on its own". Declared here — above the
  // unsupported-device early return — so hook order never varies.
  const jumpingRef = useRef(false);
  useEffect(() => { if (isReading) jumpingRef.current = false; }, [isReading]);
  // THE HEADSET'S, THE CAR'S AND THE LOCK SCREEN'S SKIP BUTTONS step one
  // paragraph, exactly as the bar's ↪¶ and ↩¶ do. Reached through a ref: the
  // step is defined below the unsupported-device early return.
  const jumpParaRef = useRef(null);
  useEffect(() => {
    if (typeof setSkipHandlers !== 'function') return undefined;
    setSkipHandlers({
      next: () => { if (jumpParaRef.current) jumpParaRef.current(1); },
      prev: () => { if (jumpParaRef.current) jumpParaRef.current(-1); },
    });
    return () => setSkipHandlers(null);
  }, [setSkipHandlers]);
  // readTargetNow is defined below the unsupported-device early return; the run
  // loop reaches it through this ref so the effect never depends on definition
  // order.
  const readTargetRef = useRef(null);
  // When the reading ends (finished or stopped), give the surface its paced
  // view back — the expansion belongs to the reading, not to the learner's
  // place. Only ever restores a target THIS control expanded.
  useEffect(() => {
    if (isReading) return;
    // A jump-in-progress is not an ended piece — the new read is about to
    // start; touching the run or the prepared surface here would double-read.
    if (jumpingRef.current) return;
    const prepared = preparedRef.current;
    // A run that is still live means the piece ENDED on its own (Stop clears
    // the run). Ask the surface for the next piece and keep reading.
    const run = runRef.current;
    if (run && run.next) {
      let advanced;
      try { advanced = !!run.next(); } catch (_) { advanced = false; }
      if (advanced) {
        // The next piece registers its own target; wait for it, then read it.
        // Bounded — a surface that advances without registering ends the run
        // quietly rather than hanging on a promise that never settles.
        const from = run.owner;
        (async () => {
          for (let i = 0; i < 12; i++) {
            await afterRender();
            const t = getReadTarget();
            if (t && t.owner !== from) {
              if (prepared && prepared !== t) { try { prepared.prepare(false); } catch (_) { /* best-effort */ } }
              preparedRef.current = null;
              if (readTargetRef.current) readTargetRef.current(t, { continuing: true });
              return;
            }
          }
          runRef.current = null;
          setRunInfo(null);
        })();
        return;
      }
    }
    // No next piece (the end of the series) or no run at all: the reading is
    // over — put the surface's paced view back.
    runRef.current = null;
    setRunInfo(null);
    if (!prepared) return;
    preparedRef.current = null;
    try { prepared.prepare(false); } catch (_) { /* restoring is best-effort */ }
  }, [isReading]);
  // The collapsed read-aloud button is a gentle reminder: it dims + settles when
  // idle and re-reveals on scroll/touch. Declared before the early return below
  // so the hook order is stable (rules-of-hooks). Applies to the collapsed button
  // only — an OPEN panel is in active use and must never fade.
  const revealFab = useIdleReveal();
  // BACK TO TOP (Darrell 2026-08-15: "a way to get back to the top"). A long
  // lesson leaves the reader far from the header with only a flick-scroll
  // marathon home. One button, shown once the page is more than a screen deep,
  // stacked above the read-aloud button so both thumbs find it in the same
  // corner. Rendered even on a device with no speech support — scrolling is
  // not a speech feature.
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setShowTop(window.scrollY > window.innerHeight * 1.25);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
  const scrollTopBtn = showTop && !isOpen ? (
    <button
      type="button"
      onClick={() => { try { window.scrollTo({ top: 0, behavior: motionBehavior() }); } catch (_) { window.scrollTo(0, 0); } }}
      aria-label="Back to the top of the page"
      title="Back to top"
      className="ts-chrome-region bg-[#FAF8F4] text-[#1A1815] w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg border-2 border-[#1A1815] hover:bg-[#1A1815] hover:text-white flex items-center justify-center text-xl sm:text-2xl focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
    >
      ↑
    </button>
  ) : null;
  useEffect(() => {
    if (!armed || typeof document === 'undefined') return undefined;
    const main = readingRoot();
    if (!main) return undefined;
    const onTap = (e) => {
      const inControls = e.target && e.target.closest && e.target.closest('.tts-controls');
      if (inControls) return; // panel taps (incl. Cancel) keep working normally
      e.preventDefault();
      e.stopPropagation();
      setArmed(false);
      // START-AT-TAP now FOLLOWS too (DR-0265): resolve the tapped character,
      // find its sentence in the page map, and read from that sentence with the
      // highlight tracking from there. Falls back to the unmapped legacy path
      // when the device can't resolve the tap into the map.
      const follow = buildFollowMap(main);
      let caret = null;
      try {
        if (document.caretRangeFromPoint) {
          const r = document.caretRangeFromPoint(e.clientX, e.clientY);
          if (r) caret = { node: r.startContainer, offset: r.startOffset };
        } else if (document.caretPositionFromPoint) {
          const p = document.caretPositionFromPoint(e.clientX, e.clientY);
          if (p) caret = { node: p.offsetNode, offset: p.offset };
        }
      } catch (_) { caret = null; }
      const segIdx = follow && caret ? segmentIndexAtDomPoint(follow, caret.node, caret.offset) : -1;
      if (follow && segIdx >= 0) {
        followRef.current = pageFollowState(follow, segIdx);
        // Same law as Read-this-page: a tap-started read follows and highlights,
        // so the card must collapse to the pill or it covers the very words it
        // just lit up (reported 2026-08-06 — the panel sat over the read text).
        setMinimized(true);
        read(follow.text.slice(follow.segments[segIdx].start));
        return;
      }
      const hit = readFromPoint(main, e.clientX, e.clientY);
      const text = (hit && hit.text) || readablePageText();
      followRef.current = null; // unresolvable tap reads unmapped — no stale highlight
      if (text) { setMinimized(true); read(text); }
    };
    const onKey = (e) => { if (e.key === 'Escape') setArmed(false); };
    document.addEventListener('click', onTap, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('click', onTap, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [armed, read]);

  // A device that can't speak still scrolls: the read-aloud card stays hidden
  // below but Back-to-top renders in the ONE corner wrapper (the fab-overlap
  // guard rightly counts anchors — one anchor, one wrapper, both features).
  if (!supported && !scrollTopBtn) return null;

  const start = async () => {
    // OPEN WHAT IS CLOSED FIRST (Darrell 2026-08-10: "deeper doesn't get read at
    // all" / "dropdown information need to be understood.... too"). This app's
    // disclosures are conditionally rendered, so a collapsed "About this" panel
    // has no text in the document — it could not be read because it was not
    // there. Reveal, let it paint, THEN map: what is heard is what is shown.
    // CLAIM THE AUDIO SESSION FIRST — before ANY await (Darrell 2026-08-13:
    // "I cant listen to a lesson in the background yet", "if the top tab is
    // moved the reader stops"). `settled()` waits up to ten double-rAF frames,
    // and a user gesture cannot be re-entered once awaited: claiming after it
    // is claiming after the browser has already stopped listening.
    claimAudio();
    const main = readingRoot();
    if (main) { await revealAllForReading(main); await settled(main); }
    // Build the follow map from the LIVE page and speak its exact normalized
    // text, so the engine's sentence N and the on-screen range N are the same
    // sentence by construction. Falls back to the plain extractor when the map
    // can't be built (empty page) — reading always still works.
    const follow = main ? buildFollowMap(main) : null;
    if (follow && follow.text) {
      followRef.current = pageFollowState(follow);
      setMinimized(true);
      read(follow.text);
      return;
    }
    followRef.current = null;
    const text = readablePageText();
    if (text) { setMinimized(true); read(text); }
  };

  // READ-THIS-PIECE — now ALIGNED BY CONSTRUCTION (2026-08-10, DR-0285).
  //
  // What was wrong: this mode spoke the surface's COMPOSED text and tried to
  // find each spoken sentence back in the DOM (alignSegments). On a Learn
  // lesson almost nothing matched — the composed text carries connective
  // sentences that are not on screen ("Anchor scripture — …", "Questions to
  // think about:"), and the lesson renders ONE stage at a time, so four of five
  // stages were not in the document at all. Result, exactly as reported: the
  // Learn read highlighted NOTHING (while Eternal Algorithms, which has no
  // registered target and therefore maps the page itself, highlighted fine),
  // and the unrendered stages were never read.
  //
  // The fix is the same law the page read has always obeyed: make the DOM the
  // source of the spoken text. `prepare(true)` asks the surface to render the
  // WHOLE piece (every stage), collapsed disclosures inside it are opened, and
  // then the element is mapped and its own text is spoken — so every sentence
  // spoken has a range, word-level follow works again, and nothing deeper is
  // skipped. The composed text remains the honest fallback for a surface that
  // registers no element (or one that isn't in the DOM).
  // "START AT": map the piece to list its paragraphs, and read nothing — no
  // run, no audio claim, the surface's paced view put back afterwards.
  const listParagraphs = async (t) => {
    if (!t) return;
    let el = typeof document !== 'undefined'
      ? ((t.elementId ? document.getElementById(t.elementId) : null) || (t.owner ? document.getElementById(`learn-lesson-${t.owner}`) : null))
      : null;
    if (t.prepare) {
      try { t.prepare(true); } catch (_) { /* never blocks */ }
      if (!el) { await afterRender(); el = t.elementId ? document.getElementById(t.elementId) : null; }
      await settled(el, { requireChange: true });
    }
    if (el) { await revealAllForReading(el); await settled(el); }
    const follow = el ? buildFollowMap(el) : null;
    const labels = follow && follow.segments && follow.segments.length
      ? paragraphLabels(follow.segments, paragraphStarts(follow)) : [];
    if (t.prepare && !isReading) { try { t.prepare(false); } catch (_) { /* best-effort */ } }
    setPickList({ owner: t.owner, labels });
  };

  const readTargetNow = async (t, { continuing = false, startFraction = null, startSentence = null } = {}) => {
    if (!t) return;
    // A target read is always a RUN: it keeps going to the next piece unless
    // the listener stops it.
    runRef.current = t;
    // Same reason as the page path: the reveal + settle below spend the tap.
    // A CONTINUING piece is not a new gesture, but the session is already held
    // from the first press and start() is idempotent, so this is safe either way.
    claimAudio(t.label);
    if (!continuing) setRunInfo({ label: t.label });
    let el = null;
    if (typeof document !== 'undefined') {
      // PREPARE CAN RENDER THE ELEMENT, NOT ONLY EXPAND IT — SO RE-RESOLVE.
      //
      // Darrell 2026-08-31, from the presenter console: "it doesn't follow the
      // text as it reads."
      //
      // The element was resolved ONCE, before prepare() ran. That holds for a
      // surface whose reading element is already mounted and prepare() merely
      // expands its stages (Learn). It is wrong for a surface whose reading is
      // not in the DOM at all until prepare() shows it — the presenter's class
      // mirror can be collapsed, and a collapsed mirror means getElementById
      // returned null, prepare() then mounted it, and nothing ever looked
      // again. `el` stayed null, so the mapped path was skipped and the read
      // fell through to page-level sentence alignment: it spoke correctly and
      // highlighted nothing, which is precisely the reported defect.
      //
      // Settling on a null element also measures nothing (textContent of null),
      // so with requireChange it could only spin out its tries — one more
      // reason the first resolve has to be allowed a second look.
      const resolveEl = () => (t.elementId ? document.getElementById(t.elementId) : null)
        || (t.owner ? document.getElementById(`learn-lesson-${t.owner}`) : null);
      el = resolveEl();
      if (t.prepare) {
        try { t.prepare(true); preparedRef.current = t; } catch (_) { /* never blocks the read */ }
        // Give the surface a frame to mount what it just revealed, then look
        // again before settling — otherwise we settle on nothing.
        if (!el) { await afterRender(); el = resolveEl(); }
        // requireChange: we just asked for more of the piece — do not accept
        // "nothing has happened yet" as "it is done".
        await settled(el, { requireChange: true }); // the whole piece is rendered before anything is mapped
        // prepare() may have replaced the node rather than grown it.
        el = resolveEl() || el;
      }
      if (el) { await revealAllForReading(el); await settled(el); }
    }
    const follow = el ? buildFollowMap(el) : null;
    if (follow && follow.text) {
      // BEGIN WHERE HE LEFT OFF. A CONTINUING piece is a different lesson the
      // run advanced into, so it starts at its top; only a read the listener
      // themselves started resumes. Unresolvable saved sentence -> the top,
      // never a guess.
      const at = startSentence != null
        ? Math.max(0, Math.min(follow.segments.length - 1, startSentence))
        : startFraction != null
          ? startIndexForFraction(startFraction, follow.segments.length)
          : (continuing ? -1 : savedStartIndex(follow.segments, t.owner));
      if (at > 0 && follow.segments[at]) {
        followRef.current = { ...pageFollowState(follow, at), owner: t.owner };
        setMinimized(true);
        read(follow.text.slice(follow.segments[at].start));
        return;
      }
      followRef.current = { ...pageFollowState(follow), owner: t.owner };
      setMinimized(true);
      read(follow.text);
      return;
    }
    // No element to map: speak the registered text and align what we can find
    // on screen (sentence-level, unrendered passages carry no highlight).
    const spoken = segmentText(t.text);
    const pageRoot = readingRoot();
    const pageFollow = pageRoot ? buildFollowMap(pageRoot) : null;
    followRef.current = pageFollow ? {
      follow: pageFollow,
      base: 0,
      ranges: alignSegments(pageFollow, spoken),
      lens: spoken.map((s) => s.length),
      wordable: false,
    } : null;
    setMinimized(true);
    read(t.text);
  };

  readTargetRef.current = readTargetNow;
  startRef.current = start;

  // TALK ABOUT THIS: build a grounded digest of the CURRENT surface (real
  // on-screen numbers via data-talk markers, else the surface's "?" help), have
  // Ari explain it (live NAS model when reachable, deterministic on-device
  // otherwise — never fabricated), then speak it in the chosen reading voice.
  const talkAbout = async () => {
    setTalking(true);
    setTalkSource('');
    // Same root as the reader (DR-0304): a surface with no <main> is still a
    // surface a person can ask about, and describing it from `null` gave the
    // help entry alone with none of the real on-screen numbers.
    const main = readingRoot();
    const helpEntry = helpFor({ view, churchView, booksView });
    const digest = buildSurfaceDigest({ root: main, helpEntry, title: helpEntry && helpEntry.title });
    const { text, source } = await talkAboutSurface(digest);
    setTalking(false);
    setTalkSource(source === 'live' ? 'Ari, live' : 'Ari, on-device');
    followRef.current = null; // Ari's explanation isn't on-screen text — no highlight map
    if (text) read(text);
  };

  // CLOSING IS NOT SILENCING (Darrell 2026-08-10: "The reader can't be closed
  // after opening to change speed of the reader... we need that"). Closing used
  // to call stop(), so the only way out of the panel after adjusting the speed
  // was to kill the reading — the listener had to choose between the controls
  // and the Word. Now there is ONE thing that stops the voice: Stop. Close puts
  // the panel away; while reading, the collapsed button stays visibly in the
  // reading state so Stop is always one tap away.
  // The ONE thing that ends a hands-free run. Every Stop control routes here so
  // "it ended" and "you ended it" can never be confused.
  const stopAll = () => {
    runRef.current = null;
    setRunInfo(null);
    jumpingRef.current = false;
    stop();
  };

  // PARAGRAPH NAVIGATION + TOP (Darrell 2026-08-15: "a way to get back to the
  // top or relisten to the last paragraph or pages/s and forward to the
  // whatever number of page/s"). The reader restarts from a chosen sentence the
  // same way Start-where-I-tap always has (play() cancels the prior utterance
  // safely) — so Back re-listens the paragraph just heard (tap again to keep
  // walking back), Forward skips to the next paragraph, and Top restarts the
  // whole reading. Each tap moves ONE paragraph; several taps move several —
  // that is the "whatever number" without inventing a page unit a continuous
  // scroll does not have.
  const currentGlobalSegment = () => {
    const f = followRef.current;
    if (!f) return -1;
    const local = deviceRead ? segmentIndex : Math.max(0, lastCloudIdxRef.current);
    return f.base + Math.max(0, local);
  };
  const jumpToSegment = (globalIdx) => {
    const f = followRef.current;
    if (!f || !f.follow || globalIdx == null) return;
    const segs = f.follow.segments;
    const idx = Math.max(0, Math.min(segs.length - 1, globalIdx));
    const seg = segs[idx];
    if (!seg) return;
    const paraStarts = f.paraStarts || null;
    // A jump can flicker the engine through a not-reading render; the guard
    // keeps the hands-free run from mistaking that for "the piece ended".
    jumpingRef.current = true;
    followRef.current = { ...pageFollowState(f.follow, idx), paraStarts, owner: f.owner };
    read(f.follow.text.slice(seg.start));
  };
  const jumpParagraph = (dir) => {
    const f = followRef.current;
    if (!f || !f.follow) return;
    if (!f.paraStarts) f.paraStarts = paragraphStarts(f.follow);
    const target = paragraphJumpTarget(f.paraStarts, currentGlobalSegment(), dir);
    if (target != null) jumpToSegment(target);
  };
  const jumpTop = () => {
    const f = followRef.current;
    try { window.scrollTo({ top: 0, behavior: motionBehavior() }); } catch (_) { /* best-effort */ }
    if (f && f.follow && isReading) jumpToSegment(0);
  };
  const canJump = isReading && !!(followRef.current && followRef.current.follow);
  jumpParaRef.current = jumpParagraph;
  // ▶ Continue after the screen went dark: resume a pause, else re-speak from
  // the held sentence when a follow map exists, else start the page read.
  const continueReading = () => {
    setInterrupted(false);
    if (isPaused) { resume(); return; }
    const f = followRef.current;
    if (f && f.follow) jumpToSegment(currentGlobalSegment()); else start();
  };
  // The radio's two automatic moves (see the visibility effect above).
  handOverRef.current = () => {
    const f = followRef.current;
    if (f && f.follow) jumpToSegment(currentGlobalSegment());
  };
  pickUpRef.current = () => {
    const f = followRef.current;
    if (f && f.follow && !pausedRef.current) jumpToSegment(currentGlobalSegment());
  };

  // START WHERE I LEFT OFF, AND START ANYWHERE (Darrell 2026-09-24). The
  // bookmark is this reading's own (lib/reader-bookmarks.js); the paragraphs
  // come from the same follow map the paragraph steps use.
  const bookmarkNow = target ? getBookmark(target.owner) : null;
  const readingParagraphs = () => {
    const f = followRef.current;
    if (!isReading || !f || !f.follow || !f.follow.segments) return [];
    try {
      if (!f.paraStarts) f.paraStarts = paragraphStarts(f.follow);
      return paragraphLabels(f.follow.segments, f.paraStarts);
    } catch (_) { return []; }
  };
  const currentParagraph = () => {
    const f = followRef.current;
    return f && f.paraStarts ? paragraphOf(f.paraStarts, currentGlobalSegment()) : -1;
  };
  const selectClass = 'w-full text-[0.6875em] border border-[#1A1815] bg-white text-[#1A1815] px-[0.5em] py-[0.5em] min-h-[2.75em] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]';

  const close = () => {
    if (!isReading) stopAll(); // idle: also stands down an armed tap-to-start
    setArmed(false);
    setIsOpen(false);
  };

  // Grouped voice options (System / Your voices / Voices & accents) — same global
  // preference the header picker and Voice tab write.
  const groups = catalog.reduce((acc, item) => { (acc[item.group] = acc[item.group] || []).push(item); return acc; }, {});
  const order = ['Default', 'Your voices', 'Voices & accents'].filter((g) => groups[g] && groups[g].length);
  const onVoice = (e) => { const item = catalog.find((c) => c.id === e.target.value); if (item && !item.usable) return; setVoiceId(e.target.value); };
  // WHICH VOICE, AND WHY, on the status line (Darrell 2026-09-23: "No
  // headaches!!!!"). A dark studio is not a message to dismiss; it is a
  // word beside Reading.
  const standInNote = standInWhy === 'studio-offline'
    ? ' · stand-in voice, the studio is offline'
    : standInWhy === 'studio-unarmed' ? ' · stand-in voice until the studio is armed' : '';
  const statusLabel = (isReading ? (isPaused ? 'Paused' : 'Reading…') : 'Ready') + standInNote;

  return (
    // THE READER MUST OUTRANK A FULL-SCREEN PRESENTING SURFACE.
    //
    // Darrell 2026-08-31, from the live presenter console: "we dont have control
    // over the voice... the controls dont show on the screen to even have a
    // chance of adjustment."
    //
    // This control sat at z-40 while Presenter.jsx paints its console at
    // zIndex 60 and its on-screen presenting mode at zIndex 70. So on exactly
    // the surface that offers a "Read it aloud" button, pressing it started a
    // reading whose voice, speed, pause and stop controls were painted
    // UNDERNEATH the overlay — audible, and unreachable. A speaker standing in
    // front of a room could start the reader and then could not adjust or stop
    // it.
    //
    // 80 is the deliberate slot: above the presenting overlays (60/70) so the
    // reader stays reachable wherever it can be started, and still below the
    // true modal layer — HelpWalkthrough (110), Modal/Lightbox (120) — which
    // must keep covering it.
    <div className="tts-controls fixed bottom-4 right-4 z-[80] print:hidden flex flex-col items-end gap-2">
      {/* THE FAILURE THE ENGINE ALREADY DETECTED, finally shown. Fire TV is the
          case that exposed it: Silk exposes speechSynthesis and
          SpeechSynthesisUtterance, so isTTSSupported() answers true, but the
          device carries no voice engine — getVoices() stays empty, the
          utterance produces no audio, and the watchdog flips `failed`. Every
          piece worked except the last one. role="status" so a screen reader
          announces it, and it sits ABOVE the panel so it cannot be missed. */}
      {/* A NOTICE MAY NOT SIT ON THE WORD (Darrell 2026-09-22): "these types
          of words covering the Word and perspectives being explained are not
          wanted." And 2026-09-23, when the same box came back with an HTTP
          404 in it: "Popup's?!!!" The notice used to be its own floating box
          in this fixed stack, painted over the prose by construction. It is
          no longer rendered here at all: it lives inside the open panel (below,
          under the header), and while the panel is a pill or a button it is a
          small mark on that pill or button. See the panel for the block. */}
      {interrupted && (
        <div role="status" data-testid="reading-interrupted" className="bg-white border-2 border-[#1A1815] shadow-lg px-[0.75em] py-[0.5em] flex items-center flex-wrap justify-end gap-[0.5em]" style={{ fontSize: 'calc(1rem * var(--ts-chrome-scale, 1))' }}>
          <span className="text-[0.75em] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>The screen went dark and the reading stopped.</span>
          <button type="button" onClick={continueReading} className="px-[0.625em] py-[0.375em] min-h-[2.75em] text-[0.75em] uppercase tracking-wider border-2 border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#B85838] hover:border-[#B85838] font-semibold whitespace-nowrap focus:outline focus:outline-2 focus:outline-[#B85838]">▶ Continue</button>
          <button type="button" onClick={() => setInterrupted(false)} aria-label="Dismiss" className="px-[0.5em] py-[0.375em] text-[0.75em] border-2 border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
        </div>
      )}
      {offersReturn(ret) && (
        <div role="status" data-testid="reading-way-back" className="bg-white border-2 border-[#1A1815] shadow-lg px-[0.75em] py-[0.5em] flex items-center flex-wrap justify-end gap-[0.5em]" style={{ fontSize: 'calc(1rem * var(--ts-chrome-scale, 1))' }}>
          <span className="text-[0.75em] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{returnLabel(ret)}</span>
          <button type="button" onClick={takeMeBack} data-testid="reading-way-back-go" className="px-[0.625em] py-[0.375em] min-h-[2.75em] text-[0.75em] uppercase tracking-wider border-2 border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#B85838] hover:border-[#B85838] font-semibold whitespace-nowrap focus:outline focus:outline-2 focus:outline-[#B85838]">↩ Take me back</button>
          <button type="button" onClick={() => setRet(RETURN_IDLE)} aria-label="Dismiss" className="px-[0.5em] py-[0.375em] text-[0.75em] border-2 border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
        </div>
      )}
      {scrollTopBtn}
      {supported && (isOpen && minimized && isReading ? (
        /* THE READING PILL (DR-0265): while the voice is reading, the full card
           would sit on top of the very words being read + highlighted — so it
           collapses to this slim pill. Pause/resume, stop, and expand only;
           everything else waits behind the ⌃.
           EVERY SIZE INSIDE IS EM (Darrell 2026-09-15, Big Print on Lesson
           127: the pill was huge). The pill's font-size is the capped chrome
           size, but its buttons carried a 2.75rem min-height — a REM, which reads
           the 2.75x root and escaped the cap: 44px tap floors became 121px.
           2.75em is the same 44px at Normal and follows the cap above it. The
           expanded panel's buttons had the same escape and the same fix. */
        <div
          className="bg-white border-2 border-[#1A1815] shadow-lg px-[0.5em] py-[0.375em] flex items-center gap-[0.375em]"
          style={{ fontSize: 'calc(1rem * var(--ts-chrome-scale, 1))' }}
          role="region"
          aria-label="Reading controls (minimized)"
        >
          <span className="text-[0.6875em] uppercase tracking-wider text-[#B85838] font-semibold" aria-live="polite">{isPaused ? 'Paused' : 'Reading…'}{runInfo ? ' · keeps going' : ''}</span>
          {/* THE MARK ON THE PILL: a notice is waiting in the panel. Tapping
              it expands the panel where the words are; nothing floats. */}
          {notice && (
            <button type="button" onClick={() => setMinimized(false)} data-testid="read-aloud-notice-mark" aria-label={`A message is waiting: ${notice}`} title={notice} className="px-[0.5em] py-[0.375em] min-h-[2.75em] text-[0.75em] font-bold border-2 border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">!</button>
          )}
          {/* The level, one tap wide, on the pill too (DR-0426): the pill is
              what a listener sees for the whole reading. */}
          {target && target.setLevel && Array.isArray(target.levels) && target.levels.length > 0 && (
            <select aria-label="Who is learning? Switch the level — the reading keeps its place" value={target.level || ''} onChange={(e) => pickLevel(e.target.value)}
              className="min-h-[2.75em] text-[0.6875em] uppercase tracking-wider border-2 border-[#E8E4DC] bg-white text-[#1A1815] px-[0.25em] focus:outline focus:outline-2 focus:outline-[#B85838]" data-testid="reader-level-select">
              {target.levels.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          )}
          {canJump && (
            <>
              <button type="button" onClick={() => jumpParagraph(-1)} aria-label="Back — re-listen this paragraph; tap again for the one before" title="Re-listen this paragraph (again = the one before)" className="px-[0.625em] py-[0.375em] min-h-[2.75em] text-[0.75em] border-2 border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815] font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]">
                ↩¶
              </button>
              <button type="button" onClick={() => jumpParagraph(1)} aria-label="Forward — skip to the next paragraph" title="Skip to the next paragraph" className="px-[0.625em] py-[0.375em] min-h-[2.75em] text-[0.75em] border-2 border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815] font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]">
                ↪¶
              </button>
            </>
          )}
          <button type="button" onClick={isPaused ? resume : pause} className="px-[0.625em] py-[0.375em] min-h-[2.75em] text-[0.75em] uppercase tracking-wider border-2 border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]">
            {isPaused ? '▶' : '⏸'}
          </button>
          <button type="button" onClick={stopAll} aria-label="Stop reading" className="px-[0.625em] py-[0.375em] text-[0.75em] uppercase tracking-wider border-2 border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]">
            ⏹
          </button>
          <button type="button" onClick={() => setMinimized(false)} aria-label="Expand reading controls" className="px-[0.5em] py-[0.375em] text-[0.75em] border-2 border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">
            ⌃
          </button>
          {/* Put the pill away without silencing the Word — the button it
              collapses into keeps reading and keeps Stop one tap away. */}
          <button type="button" onClick={close} aria-label="Hide reading controls — keeps reading" className="px-[0.5em] py-[0.375em] text-[0.75em] border-2 border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">
            ×
          </button>
        </div>
      ) : isOpen ? (
        /* THE PANEL IS CHROME, NOT READING TEXT (Pattern 2b; Darrell 2026-07-27:
           "The sizes of text makes the talk section not useful" — at A+++/A44
           the rem-based labels ballooned inside the fixed 260px box: buttons
           wrapped to three lines, the five speed chips crushed together, and
           the panel clipped off-screen). Fix, same law as the collapsed FAB's
           ts-chrome-region: the panel's font-size is the CAPPED chrome size
           (1rem × --ts-chrome-scale = the capped chrome multiplier — ~1.1x at
           A+++, ~1.4x at A44, exactly 1x at Normal), and EVERYTHING inside is
           sized in em so text, padding, and the box grow together, bounded.
           Width is em too (16.25em = 260px at Normal) so the panel widens in
           step with its own capped text; max-h + scroll keep it on-screen at
           any size instead of clipping controls off the top. */
        <div
          className="bg-white border-2 border-[#1A1815] p-[0.75em] shadow-lg w-[16.25em] max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-7rem)] overflow-y-auto"
          style={{ fontSize: 'calc(1rem * var(--ts-chrome-scale, 1))' }}
        >
          <div className="flex items-baseline justify-between mb-[0.75em]">
            <div>
              <div className="text-[0.5625em] uppercase tracking-[0.25em] text-[#B85838] font-semibold">🔊 Read Aloud</div>
              <div className="text-[0.625em] text-[#5A5751]" role="status" aria-live="polite" style={{ fontFamily: '"Fraunces", serif' }}>{armed ? 'Tap any word on the page — reading starts there' : (talking ? 'Ari is looking at this screen…' : (talkSource && !isReading ? talkSource : (isReading && runInfo ? `${statusLabel} — keeps going to the next one` : statusLabel)))}</div>
            </div>
            <div className="flex items-center gap-[0.375em]">
              {/* TOP LIVES IN THE HEADER (Darrell 2026-09-19: "sometimes I can't
                  find the back to the Top button... why?"). He was right and the
                  cause was structural, not his memory. The floating ↑ is hidden
                  whenever this panel is open — it shares a bottom-anchored
                  flex column with the panel and a tall card would push it off
                  the top of the screen — so with the panel open the ONLY way
                  back was ⏮ Top down in the second button row, which on a phone
                  is below the fold of the panel itself. The header never
                  scrolls away, so a Top here is always findable. jumpTop only
                  re-seeks the voice when a reading is actually running, so for
                  a reader using their eyes this is a plain scroll home. */}
              <button type="button" onClick={jumpTop} data-testid="tts-header-top" aria-label="Back to the top of the lesson" title="Back to the top" className="text-[0.625em] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">↑ Top</button>
              {isReading && (
                <button type="button" onClick={() => setMinimized(true)} aria-label="Collapse to the reading pill — keeps reading" className="text-[0.625em] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">⌄ Smaller</button>
              )}
              <button type="button" onClick={close} title={isReading ? 'Closes the panel — the reading keeps going' : 'Close'} className="text-[0.625em] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">× Close</button>
            </div>
          </div>

          {/* THE NOTICE, IN THE PANEL THE PERSON OPENED — not over the Word.
              role="status" announces it the moment it appears; the door
              (noticeAction, 2026-09-22) is an anchor because this panel is
              mounted on three surfaces with no nav shell to call into. */}
          {notice && (
            <div role="status" data-testid="read-aloud-notice" className="border-2 border-[#B85838] bg-[#FAF8F4] px-[0.5em] py-[0.375em] mb-[0.75em] flex items-start gap-[0.5em]">
              <span className="text-[0.6875em] text-[#1A1815] text-left" style={{ fontFamily: '"Fraunces", serif' }}>{notice}</span>
              {noticeAction?.href && (
                <a
                  href={noticeAction.href}
                  data-testid="read-aloud-notice-action"
                  className="shrink-0 px-[0.625em] py-[0.375em] text-[0.6875em] uppercase tracking-wider border-2 border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#B85838] hover:border-[#B85838] font-semibold whitespace-nowrap focus:outline focus:outline-2 focus:outline-[#B85838]"
                >{noticeAction.label || 'Open'}</a>
              )}
              <button
                type="button"
                onClick={() => setNotice('')}
                aria-label="Dismiss this message"
                data-testid="read-aloud-notice-dismiss"
                className="shrink-0 px-[0.5em] py-[0.25em] text-[0.75em] border-2 border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]"
              >×</button>
            </div>
          )}
          {/* SAID WHERE IT IS SEEN: while the phone's own voice is reading, the
              one fact that matters most on a phone is that it will stop if
              they switch apps. Not a popup — a line in the panel they opened. */}
          {isReading && audioVoice === 'device' && (
            <div data-testid="reader-device-voice-warning" className="text-[0.625em] text-[#1A1815] border-l-4 border-[#B85838] pl-[0.5em] mb-[0.75em]" style={{ fontFamily: '"Fraunces", serif' }}>
              {BACKGROUND_LINES.device}
            </div>
          )}
          {/* THE SCREEN STAYS ON WHILE IT READS (DR-0439) — the per-device switch,
              and the honest line where the browser has no wake lock. */}
          <div className="flex items-center justify-between gap-[0.5em] mb-[0.75em]" data-testid="screen-awake-row">
            <span className="text-[0.625em] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{awake.supported ? 'Keeps the screen on while it reads' : NO_WAKE_LOCK_HINT}</span>
            {awake.supported && (
              <button type="button" role="switch" aria-checked={awake.enabled} onClick={() => awake.setEnabled(!awake.enabled)} aria-label="Keep the screen on while reading" className={`px-[0.625em] py-[0.375em] min-h-[2.75em] text-[0.625em] uppercase tracking-wider border-2 font-semibold whitespace-nowrap focus:outline focus:outline-2 focus:outline-[#B85838] ${awake.enabled ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751]'}`}>{awake.enabled ? 'On' : 'Off'}</button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-[0.25em] mb-[0.75em]">
            {!isReading ? (
              <>
                {/* One full piece, start to finish — primary when a surface has
                    registered its reading (the open lesson). Never the page mix. */}
                {target && (
                  <button type="button" onClick={() => readTargetNow(target)} className="col-span-3 bg-[#5A6E3D] text-white px-[0.75em] py-[0.625em] text-[0.75em] uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">▶ Read {target.label} — start to finish</button>
                )}
                {/* RESUME — where this reading was left, said in paragraphs. */}
                {target && offersResume(bookmarkNow) && (
                  <button type="button" data-testid="reader-resume" onClick={() => readTargetNow(target, { startSentence: bookmarkNow.sentence })} className="col-span-3 border-2 border-[#5A6E3D] text-[#1A1815] px-[0.75em] py-[0.625em] text-[0.75em] uppercase tracking-wider font-semibold hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">▶ {resumeLabel(bookmarkNow)}</button>
                )}
                {/* START AT ANY PARAGRAPH — listed on request, because listing
                    means laying the whole piece out first. */}
                {target && (pickList && pickList.owner === target.owner && pickList.labels.length ? (
                  <label className="col-span-3 block">
                    <span className="block text-[0.5625em] uppercase tracking-wider text-[#5A5751] mb-[0.25em]">Start at</span>
                    <select data-testid="reader-start-at" aria-label="Start reading at this paragraph" className={selectClass} value="" onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n)) readTargetNow(target, { startSentence: n }); }}>
                      <option value="" disabled>Pick a paragraph…</option>
                      {pickList.labels.map((l) => <option key={l.index} value={l.sentence}>{l.label}</option>)}
                    </select>
                  </label>
                ) : (
                  <button type="button" data-testid="reader-start-at-open" onClick={() => listParagraphs(target)} className="col-span-3 border border-[#1A1815] text-[#1A1815] px-[0.75em] py-[0.625em] text-[0.75em] uppercase tracking-wider font-semibold hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">Start at a paragraph…</button>
                ))}
                <button type="button" onClick={start} className={`col-span-3 px-[0.75em] py-[0.625em] text-[0.75em] uppercase tracking-wider font-semibold focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838] ${target ? 'border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white' : 'bg-[#1A1815] text-white hover:bg-[#B85838]'}`}>▶ Read this page</button>
                {/* START WHERE I TAP — arm, then the next tap on the page picks
                    the word reading begins from (Esc or Cancel to stand down). */}
                {!armed ? (
                  <button type="button" onClick={() => setArmed(true)} className="col-span-3 flex items-center justify-center gap-[0.375em] border border-[#1A1815] text-[#1A1815] px-[0.75em] py-[0.625em] text-[0.75em] uppercase tracking-wider font-semibold hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]"><UiIcon name="pin" /> Start where I tap</button>
                ) : (
                  <button type="button" onClick={() => setArmed(false)} className="col-span-3 bg-[#B85838] text-white px-[0.75em] py-[0.625em] text-[0.75em] uppercase tracking-wider font-semibold focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#1A1815]">Now tap the word to start from — or Cancel</button>
                )}
                {/* TALK ABOUT THIS — Ari explains the current screen (its real
                    numbers, or what the tab is), spoken in the chosen voice. */}
                <button type="button" onClick={talkAbout} disabled={talking} className="col-span-3 flex items-center justify-center gap-[0.375em] border border-[#B85838] text-[#B85838] px-[0.75em] py-[0.625em] text-[0.75em] uppercase tracking-wider font-semibold hover:bg-[#B85838] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]"><UiIcon name="volume" /> {talking ? 'Thinking…' : 'Talk about this'}</button>
              </>
            ) : (
              <>
                <button type="button" onClick={isPaused ? resume : pause} className="bg-[#1A1815] text-white px-[0.5em] py-[0.625em] min-h-[2.75em] text-[0.75em] uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">{isPaused ? '▶ Resume' : '⏸ Pause'}</button>
                <button type="button" onClick={stopAll} className="col-span-2 border border-[#1A1815] text-[#1A1815] px-[0.5em] py-[0.625em] min-h-[2.75em] text-[0.75em] uppercase tracking-wider hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">⏹ Stop</button>
                {/* Move by the unit a listener thinks in: re-listen the
                    paragraph just heard (again = further back), skip the next,
                    or start the whole reading over from the top. */}
                {canJump && (
                  <>
                    <button type="button" onClick={() => jumpParagraph(-1)} aria-label="Back — re-listen this paragraph; tap again for the one before" className="border border-[#E8E4DC] text-[#5A5751] px-[0.5em] py-[0.625em] min-h-[2.75em] text-[0.6875em] uppercase tracking-wider hover:border-[#1A1815] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">↩¶ Back</button>
                    <button type="button" onClick={() => jumpParagraph(1)} aria-label="Forward — skip to the next paragraph" className="border border-[#E8E4DC] text-[#5A5751] px-[0.5em] py-[0.625em] min-h-[2.75em] text-[0.6875em] uppercase tracking-wider hover:border-[#1A1815] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">↪¶ Next</button>
                    <button type="button" onClick={jumpTop} aria-label="Back to the top — and if a reading is running, it starts again from the first line" className="border border-[#E8E4DC] text-[#5A5751] px-[0.5em] py-[0.625em] min-h-[2.75em] text-[0.6875em] uppercase tracking-wider hover:border-[#1A1815] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]">⏮ Top</button>
                    {(() => {
                      const paras = readingParagraphs();
                      if (paras.length < 2) return null;
                      const cur = currentParagraph();
                      return (
                        <label className="col-span-3 block">
                          <span className="block text-[0.5625em] uppercase tracking-wider text-[#5A5751] mb-[0.25em]">Go to{cur >= 0 ? ` — now paragraph ${cur + 1} of ${paras.length}` : ''}</span>
                          <select data-testid="reader-go-to" aria-label="Jump the reading to this paragraph" className={selectClass} value="" onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n)) jumpToSegment(n); }}>
                            <option value="" disabled>Pick a paragraph…</option>
                            {paras.map((l) => <option key={l.index} value={l.sentence}>{l.label}</option>)}
                          </select>
                        </label>
                      );
                    })()}
                  </>
                )}
              </>
            )}
          </div>

          {/* HOW IT LOOKS — text size and theme, reachable while READING (DR-0524).
              Darrell, on his phone in L179: "Can't change the text side nor etc
              on o cellphone reader fix it." Both controls existed only in the
              header's comfort row, which the header HIDEAWAY unmounts — and
              measured at 360px mid-lesson, header tucked away, Normal size:
              ZERO text-size controls in the DOM. (With the header open there
              are five, on screen, because the header is sticky; the first
              reading of this got that backwards and a measurement fixed it.)
              Theme rides along because reading at night is precisely when a
              person reaches for Midnight.

              FIRST among the settings on purpose: it is the one he went looking
              for and did not find, so it does not go below Speed and Voice.

              RE-RENDERED, NOT IMPORTED, for the reason the Show-the-Word comment
              below records: TextSizeControl sizes its labels in fixed px and its
              panel box in rem, and this panel is deliberately em-sized so its
              chrome rides the CAPPED chrome multiplier. Importing it would break
              at A+++/A44, which is the exact defect that comment exists about.
              The STORES are shared (text-size.js / theme-css.js), so this and
              the header are one switch -- there is no second source of truth. */}
          <div className="mb-[0.5em]" data-testid="reader-look-and-feel">
            <div className="text-[0.5625em] uppercase tracking-wider text-[#5A5751] mb-[0.25em]">Text size — make the words bigger</div>
            <div className="grid grid-cols-5 gap-[0.25em]" role="group" aria-label="Text size — make reading text larger" data-testid="reader-text-size">
              {textSizeSteps.map((st) => {
                const on = textSize === st.key;
                return (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setTextSizeKey(st.key)}
                    aria-pressed={on}
                    aria-label={`${st.name} text size${on ? ' (current)' : ''}`}
                    title={`${st.name} text`}
                    className={`px-[0.25em] py-[0.5em] min-h-[2.25em] text-[0.625em] font-semibold leading-none border focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838] ${on ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815]'}`}
                  >{st.label}</button>
                );
              })}
            </div>
            <div className="text-[0.5625em] uppercase tracking-wider text-[#5A5751] mt-[0.5em] mb-[0.25em]">Colors — dark for night reading</div>
            <div className="flex flex-wrap items-center gap-[0.375em]" role="group" aria-label="Theme selector" data-testid="reader-theme">
              {THEMES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTheme(t.key)}
                  aria-pressed={theme === t.key}
                  aria-label={`${t.label} theme${theme === t.key ? ' (currently selected)' : ''}`}
                  title={t.label}
                  className={`w-[1.75em] h-[1.75em] rounded-full transition-all focus:outline focus:outline-2 focus:outline-[#B85838] ${theme === t.key ? 'ring-2 ring-[#B85838] ring-offset-1 scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
                  style={{ backgroundColor: t.color, border: `1.5px solid ${t.border}` }}
                />
              ))}
            </div>
          </div>

          {/* WHO IS LEARNING — the level, switchable from the reader (DR-0426).
              Same row the lesson shows at every stage; a pick mid-read keeps
              the place and resumes in the new words. */}
          {target && target.setLevel && Array.isArray(target.levels) && target.levels.length > 0 && (
            <div className="mb-[0.5em]" data-testid="reader-level-control">
              <div className="text-[0.5625em] uppercase tracking-wider text-[#5A5751] mb-[0.25em]">Who is learning?{isReading ? ' — switch and it keeps your place' : ' — sets the words and the pace'}</div>
              <div className="flex flex-wrap gap-[0.25em]" role="radiogroup" aria-label="Who is learning? Sets the words and the pace">
                {target.levels.map((b) => {
                  const on = b.id === target.level;
                  return (
                    <button key={b.id} type="button" role="radio" aria-checked={on} onClick={() => pickLevel(b.id)}
                      className={`px-[0.5em] py-[0.5em] min-h-[2.25em] text-[0.625em] uppercase tracking-wider border focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838] ${on ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815]'}`}>
                      {b.label}{b.range ? <span className="opacity-70"> {b.range}</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SHOW / HIDE THE WORD LIVES WITH THE PLAY CONTROLS (Darrell
              2026-09-14, from the lesson with this panel open: "I want that bar
              to be where the play button is or have the same impact").
              It was a bar in the lesson BODY -- and it is a READING preference,
              so it belongs where the reading is controlled, at the same weight
              as the read buttons rather than buried in the prose above them.
              The STORE is reused, not the component: show-the-word.js is a
              module store, so this button and the in-lesson bar are the same
              switch and can never disagree. It is re-rendered here rather than
              imported because ShowTheWordToggle sizes in rem, and this panel is
              deliberately em-sized so its chrome scales with the capped chrome
              multiplier (see the panel comment above) -- importing it would
              break at A+++/A44, which is the exact defect that comment records. */}
          <button
            type="button" onClick={toggleShowTheWord} aria-pressed={showWord}
            className={`w-full mb-[0.5em] px-[0.75em] py-[0.625em] text-[0.6875em] uppercase tracking-wider font-semibold border focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838] ${
              showWord ? 'bg-[#5A6E3D] text-white border-[#5A6E3D]' : 'bg-white text-[#5A6E3D] border-[#5A6E3D] hover:text-[#1A1815] hover:border-[#1A1815]'}`}
          >
            {showWord ? 'Hide the Word — read without the verses open' : 'Show the Word — open every verse'}
          </button>

          <div className="mb-[0.5em]">
            <div className="text-[0.5625em] uppercase tracking-wider text-[#5A5751] mb-[0.25em]">Speed: {rate.toFixed(1)}×</div>
            <div className="grid grid-cols-4 gap-[0.25em]" role="group" aria-label="Reading speed">
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
                    className={`px-[0.25em] py-[0.5em] text-[0.625em] uppercase tracking-wider border min-h-[2.25em] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838] ${selected ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815]'}`}
                  >{s.label}</button>
                );
              })}
            </div>
          </div>

          {catalog.length > 1 ? (
            <div className="mb-[0.5em]">
              <label htmlFor="tts-voice" className="block text-[0.5625em] uppercase tracking-wider text-[#5A5751] mb-[0.25em]">Voice (used everywhere)</label>
              <select
                id="tts-voice"
                value={voiceId}
                onChange={onVoice}
                className="w-full text-[0.6875em] border border-[#E8E4DC] bg-white text-[#1A1815] px-[0.5em] py-[0.5em] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]"
              >
                {order.map((g) => (
                  <optgroup key={g} label={g}>
                    {groups[g].map((item) => (
                      <option key={item.id} value={item.id} disabled={!item.usable}>
                        {item.label}{item.ai ? ' · AI' : ''}{item.standIn ? ' (stand-in)' : ''}{!item.usable ? ' — subscriber' : ''}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          ) : null}

          <p className="text-[0.5625em] text-[#5A5751] leading-snug" style={{ fontFamily: '"Fraunces", serif' }}>
            {target ? `Read ${target.label} opens every part of that one piece and reads it start to finish — nothing else on the page mixed in. ` : ''}Read this page opens what is collapsed on it and recites it from the top; Start where I tap begins at the word you touch; Talk about this has Ari explain what is on it — all in your chosen voice{currentItem && currentItem.ai ? ' (AI-generated)' : ''}, on every page.
          </p>
          <p className="text-[0.5625em] text-[#5A5751] leading-snug mt-[0.375em]" style={{ fontFamily: '"Fraunces", serif' }}>
            Only <strong>Stop</strong> stops the voice. Close puts this panel away and keeps reading. <span data-testid="reader-background-line">{backgroundLine({ isReading, audioVoice })}</span>
          </p>
        </div>
      ) : (
        // .ts-chrome-region caps it so it does NOT grow with the text-size
        // control — chrome, not reading text (Pattern 2b/2d). Idle-reveal dims +
        // settles it when idle, springs it back on scroll/touch.
        // While reading it never dims and never hides: it wears the reading
        // state (a live badge + an honest label) so a closed panel still shows
        // the Word is playing and Stop is one tap away — including after the
        // user has left the app and come back (background playback).
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label={notice ? `A message is waiting: ${notice} — open read-aloud controls` : isReading ? (isPaused ? 'Reading paused — open read-aloud controls' : 'Reading aloud — open read-aloud controls') : 'Open read-aloud controls'}
          title={notice ? notice : isReading ? 'Reading aloud — tap for pause, speed and stop' : 'Read aloud'}
          className={`ts-chrome-region relative ${isReading ? 'bg-[#B85838]' : 'bg-[#1A1815]'} text-white w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg hover:bg-[#B85838] flex items-center justify-center text-xl sm:text-2xl border-2 border-[#FAF8F4] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] transition-all duration-500 hover:opacity-100 focus:opacity-100 ${(revealFab || isReading) ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-2'}`}
        >
          🔊
          {isReading && (
            <span aria-hidden="true" className="absolute -top-1 -right-1 bg-[#1A1815] text-white text-[0.5rem] leading-none px-1.5 py-1 rounded-full border border-[#FAF8F4]">
              {isPaused ? '❚❚' : '▶'}
            </span>
          )}
          {/* THE MARK ON THE BUTTON: a notice is waiting inside. */}
          {notice && !isReading && (
            <span aria-hidden="true" data-testid="read-aloud-notice-mark" className="absolute -top-1 -right-1 bg-[#B85838] text-white text-[0.625rem] font-bold leading-none px-1.5 py-1 rounded-full border border-[#FAF8F4]">!</span>
          )}
        </button>
      ))}
    </div>
  );
}
