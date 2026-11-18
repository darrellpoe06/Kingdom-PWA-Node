// =============================================================================
// Storybook — an interactive Bible storybook with read-along (DR-1508, DR-1523)
// =============================================================================
// Every page is a King James verse loaded at read time, word for word; the
// guide's caption sits beside it, never inside it; the picture is a render of
// the approved reference (the interim art until it lands); Hear this page is
// the app's own read-aloud; Color this page is the existing coloring page
// derived from the same verse; the last page asks three questions whose
// answers are in the verses just read, and a pass writes a learner record
// (signed in) so the trail and the badges can light. Nothing is painted.
//
// J1 of the Jonah adventure (DR-1523): the pages TURN (a short flip; a
// crossfade under prefers-reduced-motion), a swipe or the arrow keys turn
// them, Read to me reads the verse then the caption and turns the page by
// itself until the questions, and the sentence being read is highlighted
// from the reader's own segment index (lib/tts.js segments deterministically,
// so the page maps index to sentence without the engine handing text back).
// The last page offers the book's memory verse to the memory verse game.
//
// J2 (DR-1527): a page whose RECORDING is on disk (lib/kids/narration.js,
// from the landed manifest) plays the recording instead of the device
// reader: Hear this page and Read to me play it, pause and resume hold it,
// its end turns the page, and the sentence being read follows the
// recording's cues (or an estimate until the cues are timed). The device
// reader remains the road for every page with no recording yet.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { verseText } from '../../lib/bible-kjv.js';
import { useTextToSpeech, segmentText } from '../../lib/tts.js';
import { storybookById, gradeStoryAnswer, storyProgress } from '../../lib/kids/storybooks.js';
import { narrationFor, narrationSentences, estimateCues, sentenceAt } from '../../lib/kids/narration.js';
import { LANDED } from '../../lib/kids/guides.js';
import { coloringPage, coloringBooklet, coloringSvg } from '../../lib/coloring-page.js';
import { saveLearnerRecord } from '../../lib/learner-records-sync.js';
import { printDocument, downloadText, sheetFileName } from '../ColoringSheet.jsx';
import { Shot, ShotSlot, GuideBubble, KidsIcon, kidsAsset, KZ_FOCUS } from './GuideArt.jsx';

export const STORYBOOK_COURSE_KEY = 'kids-storybooks';
/** How long a page takes to turn; the class comes off the book after it. */
export const TURN_MS = 420;
/** A horizontal swipe shorter than this is a tap, not a page turn. */
export const SWIPE_PX = 48;
/** A device reading that ends sooner than this produced no audio: Read to me stops rather than racing on in silence. */
export const MIN_READ_MS = 400;

/** The record a finished storybook writes: one row per book, like a lesson. */
export function storybookRecord(book, { passed, pct, at = new Date().toISOString() } = {}) {
  return {
    lessonId: `storybook-${book.id}`,
    courseKey: STORYBOOK_COURSE_KEY,
    ageBand: 'child',
    completedAt: at,
    quiz: { passed: !!passed, pct, at, attempts: 1 },
  };
}

/** The coloring page of one page of a book: the same verse, through the existing derivation. */
export function pageColoringModule(book, page, text) {
  return { id: `storybook-${book.id}-${page.ref}`, title: book.title, levels: { child: `"${text}" (${page.ref})` } };
}

/** Which way a swipe turns the page: 'next', 'prev', or null for a tap or a scroll. */
export function swipeDirection(dx, dy, min = SWIPE_PX) {
  if (Math.abs(dx) < min || Math.abs(dx) <= Math.abs(dy)) return null;
  return dx < 0 ? 'next' : 'prev';
}

/** The sentences of a page as the reader will speak them, so the one being read can light. */
export function sentencesOf(text) {
  return text ? segmentText(String(text)) : [];
}

/** The text in sentence spans; the `on` one is being read right now. */
function Sentences({ text, on = -1, testId }) {
  const parts = useMemo(() => sentencesOf(text), [text]);
  return (
    <span data-testid={testId}>
      {parts.map((s, i) => (
        <React.Fragment key={`${i}-${s.slice(0, 12)}`}>
          {i ? ' ' : ''}
          <span className={`kz-sent${i === on ? ' on' : ''}`} data-sentence={i}>
            {s}
          </span>
        </React.Fragment>
      ))}
    </span>
  );
}

const defaultAudio = (src) => new Audio(src);

/**
 * A page's recording as an element the page controls: status, the second it
 * is at, its length, and how many times it has ended. A new source is a new
 * element; leaving the page stops it.
 */
function useRecording(src, createAudio) {
  const [st, setSt] = useState({ status: 'idle', t: 0, duration: 0, ended: 0, failed: false });
  const ref = useRef(null);
  useEffect(() => {
    // A new element starts idle; the ended count stays monotonic across elements,
    // so a page turn never reads as another ending.
    setSt((s) => ({ status: 'idle', t: 0, duration: 0, ended: s.ended, failed: false }));
    if (!src) return undefined;
    const a = createAudio(src);
    ref.current = a;
    try {
      a.preload = 'metadata';
    } catch {
      /* a fake element */
    }
    // A listener speaks only while its element is the page's: a page turn
    // replaces the element, and the old one's last events (its pause, fired
    // late by the browser) must not touch the new one's state.
    const on = (type, f) =>
      a.addEventListener(type, () => {
        if (ref.current === a) f();
      });
    on('play', () => setSt((s) => ({ ...s, status: 'playing', failed: false })));
    on('pause', () => setSt((s) => (s.status === 'playing' ? { ...s, status: 'paused' } : s)));
    on('ended', () => setSt((s) => ({ ...s, status: 'idle', t: 0, ended: s.ended + 1 })));
    on('timeupdate', () => setSt((s) => ({ ...s, t: Number(a.currentTime) || 0, duration: Number(a.duration) || s.duration })));
    on('loadedmetadata', () => setSt((s) => ({ ...s, duration: Number(a.duration) || 0 })));
    on('error', () => setSt((s) => ({ ...s, status: 'idle', failed: true })));
    return () => {
      try {
        a.pause();
      } catch {
        /* nothing to stop */
      }
      ref.current = null;
    };
  }, [src, createAudio]);
  return {
    ...st,
    play: () => {
      const a = ref.current;
      if (!a) return;
      const p = a.play && a.play();
      if (p && typeof p.catch === 'function') p.catch(() => setSt((s) => ({ ...s, status: 'idle', failed: true })));
    },
    pause: () => ref.current && ref.current.pause && ref.current.pause(),
    stop: () => {
      const a = ref.current;
      if (a) {
        try {
          a.pause();
          a.currentTime = 0;
        } catch {
          /* a fake element */
        }
      }
      setSt((s) => ({ ...s, status: 'idle', t: 0 }));
    },
  };
}

export default function Storybook({
  bookId,
  door = 'kids',
  signedIn = false,
  loadVerse = verseText,
  saveRecord = saveLearnerRecord,
  onBack = null,
  onDone = null,
  onLearnVerse = null,
  shotList = undefined,
  useTts = useTextToSpeech,
  manifest = LANDED,
  cueTable = undefined,
  createAudio = defaultAudio,
  // The Theater's show (Darrell, 2026-11-18: "Theater?!"): the book starts
  // reading itself as soon as its first page's words are here.
  autoStart = false,
}) {
  const book = useMemo(() => storybookById(bookId), [bookId]);
  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState(null); // 'next' | 'prev' while a page turns
  const [texts, setTexts] = useState({});
  const [picks, setPicks] = useState({});
  const [saved, setSaved] = useState(null);
  const [auto, setAuto] = useState(false); // Read to me: verse, caption, next page, on its own
  const autoStarted = useRef(false);
  const phase = useRef(null); // what the device reader is reading for Read to me: 'verse' | 'caption' | null
  const wasReading = useRef(false);
  const startedFor = useRef(-1); // the page whose recording Read to me has started
  const endedSeen = useRef(0);
  const speakAt = useRef(0); // when the device reader was last asked to read for Read to me
  const [quiet, setQuiet] = useState(false); // the device reader went silent under Read to me
  const touch = useRef(null);
  const turnTimer = useRef(null);
  const tts = useTts();

  // Load every page's verse once, so paging is instant and a miss is said once.
  useEffect(() => {
    let alive = true;
    if (!book) return undefined;
    setTexts({});
    Promise.all(
      book.pages.map((p) =>
        Promise.resolve()
          .then(() => loadVerse(p.ref))
          .catch(() => '')
      )
    ).then((all) => {
      if (!alive) return;
      const next = {};
      book.pages.forEach((p, i) => {
        next[p.ref] = String(all[i] || '');
      });
      setTexts(next);
    });
    return () => {
      alive = false;
    };
  }, [book, loadVerse]);

  useEffect(
    () => () => {
      if (turnTimer.current) clearTimeout(turnTimer.current);
    },
    []
  );

  const pages = book ? book.pages.length : 0;
  const onQuestions = index >= pages;
  const page = onQuestions || !book ? null : book.pages[index];
  const text = page ? texts[page.ref] : '';
  const loading = page && text === undefined;
  const progress = storyProgress(book, index);

  // The page's recording, when it is on disk; else the device reader.
  const rec = useMemo(() => (book && page ? narrationFor(book.id, index, manifest, cueTable) : null), [book, page, index, manifest, cueTable]);
  const recSrc = rec ? kidsAsset(rec.file) : null;
  const audio = useRecording(recSrc, createAudio);
  const recorded = !!rec;
  const ttsReading = !!(tts && tts.isReading);
  const reading = recorded ? audio.status !== 'idle' : ttsReading;
  const paused = recorded ? audio.status === 'paused' : !!(tts && tts.isPaused);
  const supported = recorded || !!(tts && tts.supported);
  useEffect(() => {
    if (autoStart && supported && text && !autoStarted.current) {
      autoStarted.current = true;
      setAuto(true);
    }
  }, [autoStart, supported, text]);

  /** Turn to a page with the flip; nothing past the questions, nothing before the first. */
  const go = (to, dir) => {
    const target = Math.max(0, Math.min(pages, to));
    if (target === index) return;
    if (tts && tts.isReading) tts.stop();
    if (recorded) audio.stop();
    phase.current = null;
    setTurn(dir || (target > index ? 'next' : 'prev'));
    setIndex(target);
    if (turnTimer.current) clearTimeout(turnTimer.current);
    turnTimer.current = setTimeout(() => setTurn(null), TURN_MS);
  };
  const next = () => go(index + 1, 'next');
  const prev = () => (index === 0 ? onBack && onBack() : go(index - 1, 'prev'));

  // Read to me on the device reader: when it falls quiet after the verse, read
  // the caption; after the caption, turn the page; the page's own effect reads
  // the next verse.
  useEffect(() => {
    if (recorded) return;
    if (ttsReading) {
      wasReading.current = true;
      return;
    }
    if (!wasReading.current) return;
    wasReading.current = false;
    if (!auto) {
      phase.current = null;
      return;
    }
    if (tts.failed || Date.now() - speakAt.current < MIN_READ_MS) {
      // The reader produced no audio (no voice on this device, blocked, or an
      // engine that "ends" at once): Read to me stops here and says so rather
      // than racing silently through the book.
      phase.current = null;
      setAuto(false);
      setQuiet(true);
      return;
    }
    if (phase.current === 'verse' && page) {
      phase.current = 'caption';
      speakAt.current = Date.now();
      tts.speak(page.caption);
    } else if (phase.current === 'caption') {
      phase.current = null;
      if (index < pages - 1) go(index + 1, 'next');
      else setAuto(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsReading, auto, recorded]);
  useEffect(() => {
    if (!auto) return;
    if (!page) {
      setAuto(false);
      return;
    }
    if (recorded) {
      if (audio.status === 'idle' && startedFor.current !== index) {
        startedFor.current = index;
        audio.play();
      }
      return;
    }
    if (text && !ttsReading && phase.current === null) {
      phase.current = 'verse';
      speakAt.current = Date.now();
      tts.speak(text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, index, text, recorded, audio.status]);
  // Read to me on a recording: its end turns the page.
  useEffect(() => {
    if (audio.ended === endedSeen.current) return;
    endedSeen.current = audio.ended;
    if (!auto || !recorded) return;
    if (index < pages - 1) go(index + 1, 'next');
    else setAuto(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio.ended]);

  if (!book) return <p className="lc-notice">That storybook is not on the shelf.</p>;

  const hear = (words) => {
    if (!words) return;
    setAuto(false);
    if (recorded && words === text) {
      startedFor.current = -1;
      phase.current = null;
      audio.stop();
      audio.play();
      return;
    }
    if (!(tts && tts.supported)) return;
    phase.current = 'verse';
    tts.speak(words);
  };
  const readToMe = () => {
    if (!supported) return;
    if (auto) {
      setAuto(false);
      phase.current = null;
      startedFor.current = -1;
      if (recorded) audio.stop();
      else tts.stop();
      return;
    }
    phase.current = null;
    startedFor.current = -1;
    setQuiet(false);
    if (tts && tts.isReading) tts.stop();
    if (recorded) audio.stop();
    setAuto(true);
  };
  const pauseOrResume = () => {
    if (recorded) {
      if (audio.status === 'paused') audio.play();
      else audio.pause();
      return;
    }
    if (tts.isPaused) tts.resume();
    else tts.pause();
  };
  const color = () => {
    if (!page || !text) return;
    const mod = pageColoringModule(book, page, text);
    const pg = coloringPage(mod);
    if (!pg) return;
    if (printDocument(coloringBooklet([mod], { title: `${book.title} · ${page.ref}` }), book.title)) return;
    downloadText(coloringSvg(pg), sheetFileName(pg), 'image/svg+xml;charset=utf-8');
  };
  const onTouchStart = (e) => {
    const t = e.touches && e.touches[0];
    touch.current = t ? { x: t.clientX, y: t.clientY } : null;
  };
  const onTouchEnd = (e) => {
    const start = touch.current;
    touch.current = null;
    const t = e.changedTouches && e.changedTouches[0];
    if (!start || !t || onQuestions) return;
    const dir = swipeDirection(t.clientX - start.x, t.clientY - start.y);
    if (dir === 'next') next();
    else if (dir === 'prev' && index > 0) go(index - 1, 'prev');
  };
  const onKeyDown = (e) => {
    if (onQuestions) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      go(index - 1, 'prev');
    }
  };

  // Which sentence is lit: from the recording's cues (or an estimate), or the device reader's segment.
  let verseOn = -1;
  let captionOn = -1;
  if (recorded && page) {
    if (reading) {
      const s = narrationSentences(text, page.caption);
      const cues = rec.cues && rec.cues.length === s.all.length ? rec.cues : estimateCues(s.all, audio.duration);
      const i = sentenceAt(cues, audio.t);
      if (i >= 0 && i < s.verse.length) verseOn = i;
      else if (i >= s.verse.length) captionOn = i - s.verse.length;
    }
  } else if (ttsReading) {
    if (phase.current !== 'caption') verseOn = tts.segmentIndex || 0;
    else captionOn = tts.segmentIndex || 0;
  }

  const allRight = book.questions.every((q, i) => picks[i] != null && gradeStoryAnswer(q, picks[i]).right);
  const finish = async () => {
    const pct = Math.round((book.questions.filter((q, i) => picks[i] != null && gradeStoryAnswer(q, picks[i]).right).length / book.questions.length) * 100);
    const rec2 = storybookRecord(book, { passed: allRight, pct });
    let result = { skipped: 'signed-out' };
    if (signedIn) {
      try {
        result = await saveRecord(rec2);
      } catch (e) {
        result = { error: e };
      }
    }
    setSaved(result);
    if (onDone) onDone(book.id, { passed: allRight, pct, result, record: rec2 });
  };

  return (
    <div
      className="kz-story"
      data-testid="storybook"
      data-book={book.id}
      data-page={index}
      data-auto={auto ? 'true' : 'false'}
      data-narration={page ? (recorded ? 'recorded' : 'device') : ''}
      data-cues={recorded ? (rec.cues ? 'timed' : 'estimated') : ''}
    >
      {page ? (
        <>
          <div
            className={`kz-book${turn ? ` kz-turn-${turn}` : ''}`}
            data-turn={turn || ''}
            role="group"
            aria-roledescription="storybook page"
            aria-label={`${book.title}, page ${index + 1} of ${pages}. Swipe or use the arrow keys to turn the page.`}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            data-testid="storybook-book"
          >
            <div className="kz-scene">
              <Shot
                id={page.shot}
                alt={`${book.title}, page ${index + 1}`}
                list={shotList}
                fallback={<ShotSlot id={page.shot} who={page.who} what={`${page.ref}, with your guides`} />}
              />
            </div>
            <div className="kz-page">
              <div className="kz-pn">
                <span aria-live="polite" data-testid="storybook-pn">
                  PAGE {index + 1} OF {pages}
                </span>
                <span data-testid="storybook-mode">{auto ? 'READING TO YOU' : recorded ? 'NARRATED' : 'READ-ALONG'}</span>
              </div>
              {loading && (
                <p className="lc-small" data-testid="storybook-loading">
                  Loading the Word…
                </p>
              )}
              {!loading && !text && (
                <p className="lc-notice" data-testid="storybook-unavailable">
                  The words of {page.ref} are not on this device yet. Open the Scripture tab once while online and they will be.
                </p>
              )}
              {!loading && text && (
                <p className={`kz-v${verseOn >= 0 ? ' reading' : ''}`}>
                  "<Sentences text={text} on={verseOn} testId="storybook-verse" />"
                </p>
              )}
              <span className="kz-ref">{page.ref} · KJV</span>
            </div>
          </div>
          <GuideBubble who={page.who} shot={page.who === 'girl' ? 'girl-point' : 'boy-reading-point'} list={shotList}>
            <Sentences text={page.caption} on={captionOn} testId="storybook-caption" />
          </GuideBubble>
          <div className="kz-actions">
            <button
              type="button"
              className={`kz-act violet ${KZ_FOCUS}`}
              onClick={readToMe}
              disabled={!text || !supported}
              aria-pressed={auto}
              data-testid="storybook-read-to-me"
            >
              <KidsIcon name={auto ? 'speaker' : 'read'} /> {auto ? 'Stop reading to me' : 'Read to me, page by page'}
            </button>
          </div>
          <div className="kz-actions">
            <button type="button" className={`kz-act blue ${KZ_FOCUS}`} onClick={() => hear(text)} disabled={!text || !supported} data-testid="storybook-hear">
              <KidsIcon name="read" /> Hear this page
            </button>
            <button type="button" className={`kz-act orange ${KZ_FOCUS}`} onClick={color} disabled={!text} data-testid="storybook-color">
              <KidsIcon name="crayon" /> Color this page
            </button>
          </div>
          {auto && supported && (
            <div className="kz-actions" data-testid="storybook-reader-bar">
              <button type="button" className={`kz-act plain ${KZ_FOCUS}`} onClick={pauseOrResume} aria-pressed={paused} data-testid="storybook-pause">
                {paused ? '▶ Keep reading' : '❚❚ Pause'}
              </button>
            </div>
          )}
          {quiet && !auto && (
            <p className="lc-notice" role="status" data-testid="storybook-reader-quiet">
              The device reader went quiet, so Read to me stopped here. Tap Hear this page to try again, or choose a voice in Settings.
            </p>
          )}
          {recorded && audio.failed && (
            <p className="lc-notice" role="status" data-testid="storybook-narration-failed">
              The recording could not play just now. Tap again, or use the device reader from the Scripture tab.
            </p>
          )}
          <div className="kz-dots" aria-hidden="true">
            {book.pages.map((p, i) => (
              <i key={p.ref} className={i < index ? 'done' : i === index ? 'on' : ''} />
            ))}
          </div>
          <div className="kz-actions">
            <button type="button" className={`kz-act plain ${KZ_FOCUS}`} onClick={prev} data-testid="storybook-back">
              ◀ Back
            </button>
            <button type="button" className={`kz-act green ${KZ_FOCUS}`} onClick={next} data-testid="storybook-next">
              {index === pages - 1 ? 'The questions ▶' : 'Next page ▶'}
            </button>
          </div>
        </>
      ) : (
        <div className="kz-panel quiz" data-testid="storybook-questions">
          <h3>Do you remember? {progress.total} pages read.</h3>
          {book.questions.map((q, qi) => {
            const pick = picks[qi];
            const graded = pick != null ? gradeStoryAnswer(q, pick) : null;
            return (
              <fieldset key={q.question} style={{ border: 0, padding: 0, margin: '0 0 .75rem' }}>
                <legend style={{ fontWeight: 800, marginBottom: '.25rem' }}>{q.question}</legend>
                {q.options.map((o, oi) => (
                  <button
                    key={o}
                    type="button"
                    className={`kz-opt${pick === oi ? (graded && graded.right ? ' yes' : ' no') : ''} ${KZ_FOCUS}`}
                    onClick={() => setPicks((p) => ({ ...p, [qi]: oi }))}
                    data-testid={`story-q${qi}-o${oi}`}
                    aria-pressed={pick === oi}
                  >
                    <i>{String.fromCharCode(65 + oi)}</i>
                    {o}
                    <span
                      className="kz-spk"
                      role="button"
                      aria-label={`Hear: ${o}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        hear(o);
                      }}
                    >
                      <KidsIcon name="speaker" />
                    </span>
                  </button>
                ))}
                {graded && (
                  <p className="lc-small" role="status" data-testid={`story-q${qi}-says`}>
                    {graded.says} ({q.from})
                  </p>
                )}
              </fieldset>
            );
          })}
          <div className="kz-actions">
            <button type="button" className={`kz-act plain ${KZ_FOCUS}`} onClick={() => go(pages - 1, 'prev')}>
              ◀ Back to the book
            </button>
            <button
              type="button"
              className={`kz-act green ${KZ_FOCUS}`}
              onClick={finish}
              disabled={Object.keys(picks).length < book.questions.length}
              data-testid="storybook-finish"
            >
              <KidsIcon name="star" /> Finish
            </button>
          </div>
          {saved && (
            <p className="lc-small" role="status" data-testid="storybook-saved">
              {saved.skipped === 'signed-out'
                ? 'Finished! Sign in and a finished storybook lights the first stop on your trail.'
                : saved.error
                  ? 'Finished! Your stop could not be saved right now; it will count next time.'
                  : 'Finished! The first stop on your trail is lit.'}
            </p>
          )}
          {book.memory && onLearnVerse && (
            <div className="kz-actions">
              <button type="button" className={`kz-act teal ${KZ_FOCUS}`} onClick={() => onLearnVerse(book)} data-testid="storybook-learn-verse">
                <KidsIcon name="bulb" /> Learn the verse · {book.memory}
              </button>
            </div>
          )}
        </div>
      )}
      <p className="lc-small" style={{ marginTop: '.5rem' }}>
        {door === 'teens' ? 'Read the whole chapter in the Scripture tab.' : 'A grown-up can read along with you.'}
      </p>
    </div>
  );
}
