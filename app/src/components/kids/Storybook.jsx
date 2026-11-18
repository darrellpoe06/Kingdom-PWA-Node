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
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { verseText } from '../../lib/bible-kjv.js';
import { useTextToSpeech, segmentText } from '../../lib/tts.js';
import { storybookById, gradeStoryAnswer, storyProgress } from '../../lib/kids/storybooks.js';
import { coloringPage, coloringBooklet, coloringSvg } from '../../lib/coloring-page.js';
import { saveLearnerRecord } from '../../lib/learner-records-sync.js';
import { printDocument, downloadText, sheetFileName } from '../ColoringSheet.jsx';
import { Shot, ShotSlot, GuideBubble, KidsIcon, KZ_FOCUS } from './GuideArt.jsx';

export const STORYBOOK_COURSE_KEY = 'kids-storybooks';
/** How long a page takes to turn; the class comes off the book after it. */
export const TURN_MS = 420;
/** A horizontal swipe shorter than this is a tap, not a page turn. */
export const SWIPE_PX = 48;

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
}) {
  const book = useMemo(() => storybookById(bookId), [bookId]);
  const [index, setIndex] = useState(0);
  const [turn, setTurn] = useState(null); // 'next' | 'prev' while a page turns
  const [texts, setTexts] = useState({});
  const [picks, setPicks] = useState({});
  const [saved, setSaved] = useState(null);
  const [auto, setAuto] = useState(false); // Read to me: verse, caption, next page, on its own
  const phase = useRef(null); // what the reader is reading for Read to me: 'verse' | 'caption' | null
  const wasReading = useRef(false);
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
  const reading = !!(tts && tts.isReading);
  const supported = !!(tts && tts.supported);

  /** Turn to a page with the flip; nothing past the questions, nothing before the first. */
  const go = (to, dir) => {
    const target = Math.max(0, Math.min(pages, to));
    if (target === index) return;
    if (tts && tts.isReading) tts.stop();
    phase.current = null;
    setTurn(dir || (target > index ? 'next' : 'prev'));
    setIndex(target);
    if (turnTimer.current) clearTimeout(turnTimer.current);
    turnTimer.current = setTimeout(() => setTurn(null), TURN_MS);
  };
  const next = () => go(index + 1, 'next');
  const prev = () => (index === 0 ? onBack && onBack() : go(index - 1, 'prev'));

  // Read to me: when the reader falls quiet after the verse, read the caption;
  // after the caption, turn the page; the page's own effect reads the next verse.
  useEffect(() => {
    if (reading) {
      wasReading.current = true;
      return;
    }
    if (!wasReading.current) return;
    wasReading.current = false;
    if (!auto) {
      phase.current = null;
      return;
    }
    if (phase.current === 'verse' && page) {
      phase.current = 'caption';
      tts.speak(page.caption);
    } else if (phase.current === 'caption') {
      phase.current = null;
      if (index < pages - 1) go(index + 1, 'next');
      else setAuto(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reading, auto]);
  useEffect(() => {
    if (!auto) return;
    if (!page) {
      setAuto(false);
      return;
    }
    if (text && !reading && phase.current === null) {
      phase.current = 'verse';
      tts.speak(text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, index, text]);

  if (!book) return <p className="lc-notice">That storybook is not on the shelf.</p>;

  const hear = (words) => {
    if (!supported || !words) return;
    setAuto(false);
    phase.current = 'verse';
    tts.speak(words);
  };
  const readToMe = () => {
    if (!supported) return;
    if (auto) {
      setAuto(false);
      phase.current = null;
      tts.stop();
      return;
    }
    phase.current = null;
    if (tts.isReading) tts.stop();
    setAuto(true);
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

  const verseOn = reading && phase.current !== 'caption' ? tts.segmentIndex || 0 : -1;
  const captionOn = reading && phase.current === 'caption' ? tts.segmentIndex || 0 : -1;

  const allRight = book.questions.every((q, i) => picks[i] != null && gradeStoryAnswer(q, picks[i]).right);
  const finish = async () => {
    const pct = Math.round((book.questions.filter((q, i) => picks[i] != null && gradeStoryAnswer(q, picks[i]).right).length / book.questions.length) * 100);
    const rec = storybookRecord(book, { passed: allRight, pct });
    let result = { skipped: 'signed-out' };
    if (signedIn) {
      try {
        result = await saveRecord(rec);
      } catch (e) {
        result = { error: e };
      }
    }
    setSaved(result);
    if (onDone) onDone(book.id, { passed: allRight, pct, result, record: rec });
  };

  return (
    <div className="kz-story" data-testid="storybook" data-book={book.id} data-page={index} data-auto={auto ? 'true' : 'false'}>
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
                <span>{auto ? 'READING TO YOU' : 'READ-ALONG'}</span>
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
              <button
                type="button"
                className={`kz-act plain ${KZ_FOCUS}`}
                onClick={() => (tts.isPaused ? tts.resume() : tts.pause())}
                aria-pressed={!!tts.isPaused}
                data-testid="storybook-pause"
              >
                {tts.isPaused ? '▶ Keep reading' : '❚❚ Pause'}
              </button>
            </div>
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
