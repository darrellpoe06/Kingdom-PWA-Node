// =============================================================================
// StoryOrder — Put the story in order (DR-1523, J1)
// =============================================================================
// The eight pages of a storybook, shuffled, each a card with the guide's
// caption for that page (and the page's picture once its render lands); the
// child taps them in the order the Word tells the story. The grade comes
// from the pages' own order (lib/kids/storybooks.js gradeOrder); a wrong
// order says "not yet" and names where to look again, never "wrong". A right
// order writes `order-<book>` (signed in), the trail's second stop.
import React, { useMemo, useState } from 'react';
import { useTextToSpeech } from '../../lib/tts.js';
import { STORYBOOKS, storybookById, orderShuffle, gradeOrder } from '../../lib/kids/storybooks.js';
import { activityRecord, TRAIL_COURSES } from '../../lib/kids/trail.js';
import { saveLearnerRecord } from '../../lib/learner-records-sync.js';
import { Shot, ShotSlot, GuideBubble, KidsIcon, KZ_FOCUS } from './GuideArt.jsx';

export default function StoryOrder({
  bookId = 'jonah',
  seed = 0,
  signedIn = false,
  saveRecord = saveLearnerRecord,
  onPick = null,
  onBack = null,
  onDone = null,
  shotList = undefined,
}) {
  const book = useMemo(() => storybookById(bookId), [bookId]);
  const [round, setRound] = useState(0);
  const shuffled = useMemo(() => orderShuffle(book, seed + round), [book, seed, round]);
  const [placed, setPlaced] = useState([]); // page indexes, in the order the child placed them
  const [checked, setChecked] = useState(null);
  const [saved, setSaved] = useState(null);
  const tts = useTextToSpeech();
  if (!book) return <p className="lc-notice">That storybook is not on the shelf.</p>;
  const n = book.pages.length;
  const left = shuffled.filter((i) => !placed.includes(i));
  const grade = gradeOrder(book, placed);

  const place = (i) => {
    setChecked(null);
    setPlaced((p) => (p.includes(i) ? p : [...p, i]));
  };
  const takeBack = (i) => {
    setChecked(null);
    setPlaced((p) => p.filter((x) => x !== i));
  };
  const check = async () => {
    const g = gradeOrder(book, placed);
    setChecked(g);
    if (!g.right) {
      // Keep what is right so far; hand back the pages from the first slip on.
      if (g.firstWrong >= 0) setPlaced((p) => p.slice(0, g.firstWrong));
      return;
    }
    const rec = activityRecord({ lessonId: `order-${book.id}`, courseKey: TRAIL_COURSES.order, passed: true, pct: 100 });
    let result = { skipped: 'signed-out' };
    if (signedIn) {
      try {
        result = await saveRecord(rec);
      } catch (e) {
        result = { error: e };
      }
    }
    setSaved(result);
    if (onDone) onDone(book.id, { passed: true, result, record: rec });
  };
  const again = () => {
    setPlaced([]);
    setChecked(null);
    setSaved(null);
    setRound((r) => r + 1);
  };
  const hear = (words) => {
    if (tts && tts.supported && words) tts.speak(words);
  };

  return (
    <div className="kz-game" data-testid="story-order" data-book={book.id} data-placed={placed.length} data-right={checked && checked.right ? 'true' : 'false'}>
      <div className="kz-gamehead g-teal">
        <div className="kz-words">
          <h2>Put the story in order</h2>
          <p>
            {book.title} · {placed.length} of {n} pages placed
          </p>
        </div>
        <Shot
          id={`${book.id}-3`}
          alt=""
          className="kz-art"
          list={shotList}
          fallback={<ShotSlot id={`${book.id}-3`} className="kz-art" what="a page of the story" />}
        />
      </div>
      <div className="kz-body">
        {onPick && STORYBOOKS.length > 1 && (
          <div className="kz-chips" role="tablist" aria-label="Which story">
            {STORYBOOKS.map((b) => (
              <button
                key={b.id}
                type="button"
                role="tab"
                className={`kz-chip ${KZ_FOCUS}`}
                aria-selected={b.id === book.id}
                onClick={() => onPick(b.id)}
                data-testid={`order-pick-${b.id}`}
              >
                {b.hero}
              </button>
            ))}
          </div>
        )}
        <GuideBubble who="boy" shot="boy-think" list={shotList}>
          What happened first? Tap the pages in the order the Word tells it. Tap a placed page to take it back.
        </GuideBubble>

        <ol className="kz-order-placed" aria-label="The order you built" data-testid="order-placed">
          {Array.from({ length: n }, (_, slot) => {
            const i = placed[slot];
            const wrongHere = checked && !checked.right && checked.firstWrong === slot;
            return (
              <li key={slot} className={`kz-order-slot${i != null ? ' filled' : ''}${wrongHere ? ' no' : ''}`} data-slot={slot}>
                <span className="kz-order-n" aria-hidden="true">
                  {slot + 1}
                </span>
                {i != null ? (
                  <button
                    type="button"
                    className={`kz-order-card placed ${KZ_FOCUS}`}
                    onClick={() => takeBack(i)}
                    data-testid={`order-placed-${i}`}
                    aria-label={`Take back: ${book.pages[i].caption}`}
                  >
                    <Shot id={book.pages[i].shot} alt="" className="kz-order-pic" list={shotList} fallback={null} />
                    <span>{book.pages[i].caption}</span>
                  </button>
                ) : (
                  <span className="kz-order-empty">{slot === placed.length ? 'Tap the page that comes here' : ''}</span>
                )}
              </li>
            );
          })}
        </ol>

        {left.length > 0 && (
          <div className="kz-order-pile" data-testid="order-pile">
            {left.map((i) => (
              <div key={i} className="kz-order-row">
                <button type="button" className={`kz-order-card ${KZ_FOCUS}`} onClick={() => place(i)} data-testid={`order-card-${i}`}>
                  <Shot id={book.pages[i].shot} alt="" className="kz-order-pic" list={shotList} fallback={null} />
                  <span>{book.pages[i].caption}</span>
                </button>
                <button
                  type="button"
                  className={`kz-spk ${KZ_FOCUS}`}
                  onClick={() => hear(book.pages[i].caption)}
                  aria-label="Hear this page"
                  disabled={!(tts && tts.supported)}
                >
                  <KidsIcon name="speaker" />
                </button>
              </div>
            ))}
          </div>
        )}

        {checked && (
          <p className={`lc-small${checked.right ? ' kz-yes' : ''}`} role="status" data-testid="order-says">
            {checked.says}
          </p>
        )}
        {saved && (
          <p className="lc-small" role="status" data-testid="order-saved">
            {saved.skipped === 'signed-out'
              ? 'Sign in and this lights the second stop on your trail.'
              : saved.error
                ? 'Your stop could not be saved right now; it will count next time.'
                : 'The second stop on your trail is lit.'}
          </p>
        )}
        <div className="kz-actions">
          {onBack && (
            <button type="button" className={`kz-act plain ${KZ_FOCUS}`} onClick={onBack} data-testid="order-back">
              ◀ Back to games
            </button>
          )}
          {checked && checked.right ? (
            <button type="button" className={`kz-act teal ${KZ_FOCUS}`} onClick={again} data-testid="order-again">
              Play again
            </button>
          ) : (
            <button type="button" className={`kz-act green ${KZ_FOCUS}`} onClick={check} disabled={!grade.complete} data-testid="order-check">
              <KidsIcon name="star" /> Check my order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
