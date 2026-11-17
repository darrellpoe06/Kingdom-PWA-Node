// =============================================================================
// Storybook — an interactive Bible storybook with read-along (DR-1508)
// =============================================================================
// Every page is a King James verse loaded at read time, word for word; the
// guide's caption sits beside it, never inside it; the picture is a render of
// the approved reference (a labeled slot until it lands); Hear this page is
// the app's own read-aloud; Color this page is the existing coloring page
// derived from the same verse; the last page asks three questions whose
// answers are in the verses just read, and a pass writes a learner record
// (signed in) so the map and the badges can light. Nothing is painted.
import React, { useEffect, useMemo, useState } from 'react';
import { verseText } from '../../lib/bible-kjv.js';
import { useTextToSpeech } from '../../lib/tts.js';
import { storybookById, gradeStoryAnswer, storyProgress } from '../../lib/kids/storybooks.js';
import { coloringPage, coloringBooklet, coloringSvg } from '../../lib/coloring-page.js';
import { saveLearnerRecord } from '../../lib/learner-records-sync.js';
import { printDocument, downloadText, sheetFileName } from '../ColoringSheet.jsx';
import { Shot, ShotSlot, GuideBubble, KidsIcon, KZ_FOCUS } from './GuideArt.jsx';

export const STORYBOOK_COURSE_KEY = 'kids-storybooks';

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

export default function Storybook({
  bookId,
  door = 'kids',
  signedIn = false,
  loadVerse = verseText,
  saveRecord = saveLearnerRecord,
  onBack = null,
  onDone = null,
  shotList = undefined,
}) {
  const book = useMemo(() => storybookById(bookId), [bookId]);
  const [index, setIndex] = useState(0);
  const [texts, setTexts] = useState({});
  const [picks, setPicks] = useState({});
  const [saved, setSaved] = useState(null);
  const tts = useTextToSpeech();

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

  if (!book) return <p className="lc-notice">That storybook is not on the shelf.</p>;
  const onQuestions = index >= book.pages.length;
  const page = onQuestions ? null : book.pages[index];
  const text = page ? texts[page.ref] : '';
  const loading = page && text === undefined;
  const progress = storyProgress(book, index);
  const reading = tts && tts.state && tts.state.status === 'speaking';

  const hear = (words) => {
    if (tts && tts.supported && words) tts.speak(words);
  };
  const color = () => {
    if (!page || !text) return;
    const mod = pageColoringModule(book, page, text);
    const pg = coloringPage(mod);
    if (!pg) return;
    if (printDocument(coloringBooklet([mod], { title: `${book.title} · ${page.ref}` }), book.title)) return;
    downloadText(coloringSvg(pg), sheetFileName(pg), 'image/svg+xml;charset=utf-8');
  };

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
    if (onDone) onDone(book.id, { passed: allRight, pct, result });
  };

  return (
    <div className="kz-story" data-testid="storybook" data-book={book.id} data-page={index}>
      {page ? (
        <>
          <div className="kz-book">
            <div className="kz-scene">
              <Shot
                id={page.shot}
                alt={`${book.title}, page ${index + 1}`}
                list={shotList}
                fallback={<ShotSlot id={page.shot} what={`${page.ref}, with your guides`} />}
              />
            </div>
            <div className="kz-page">
              <div className="kz-pn">
                <span>
                  PAGE {index + 1} OF {book.pages.length}
                </span>
                <span>READ-ALONG</span>
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
                <p className={`kz-v${reading ? ' reading' : ''}`} data-testid="storybook-verse">
                  "{text}"
                </p>
              )}
              <span className="kz-ref">{page.ref} · KJV</span>
            </div>
          </div>
          <GuideBubble who={page.who} shot={page.who === 'girl' ? 'girl-point' : 'boy-reading-point'} list={shotList}>
            {page.caption}
          </GuideBubble>
          <div className="kz-actions">
            <button
              type="button"
              className={`kz-act blue ${KZ_FOCUS}`}
              onClick={() => hear(text)}
              disabled={!text || !(tts && tts.supported)}
              data-testid="storybook-hear"
            >
              <KidsIcon name="read" /> Hear this page
            </button>
            <button type="button" className={`kz-act orange ${KZ_FOCUS}`} onClick={color} disabled={!text} data-testid="storybook-color">
              <KidsIcon name="crayon" /> Color this page
            </button>
          </div>
          <div className="kz-dots" aria-hidden="true">
            {book.pages.map((p, i) => (
              <i key={p.ref} className={i < index ? 'done' : i === index ? 'on' : ''} />
            ))}
          </div>
          <div className="kz-actions">
            <button
              type="button"
              className={`kz-act plain ${KZ_FOCUS}`}
              onClick={() => (index === 0 ? onBack && onBack() : setIndex(index - 1))}
              data-testid="storybook-back"
            >
              ◀ Back
            </button>
            <button type="button" className={`kz-act green ${KZ_FOCUS}`} onClick={() => setIndex(index + 1)} data-testid="storybook-next">
              {index === book.pages.length - 1 ? 'The questions ▶' : 'Next page ▶'}
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
            <button type="button" className={`kz-act plain ${KZ_FOCUS}`} onClick={() => setIndex(book.pages.length - 1)}>
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
                ? 'Finished! Sign in and a finished storybook lights a stop on your map.'
                : saved.error
                  ? 'Finished! Your stop could not be saved right now; it will count next time.'
                  : 'Finished! That stop is lit on your map.'}
            </p>
          )}
        </div>
      )}
      <p className="lc-small" style={{ marginTop: '.5rem' }}>
        {door === 'teens' ? 'Read the whole chapter in the Scripture tab.' : 'A grown-up can read along with you.'}
      </p>
    </div>
  );
}
