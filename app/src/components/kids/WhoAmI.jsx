// =============================================================================
// WhoAmI — guess the Bible hero from three clues that are the Word itself
// =============================================================================
// The roster carries references only (lib/kids/who-am-i.js); the verses load
// from the hosted KJV at play time and the person's name is blanked while the
// child guesses, then shown whole. A wrong tap says "not yet"; stars are the
// round's alone; Next hero walks the roster.
import React, { useEffect, useMemo, useState } from 'react';
import { verseText } from '../../lib/bible-kjv.js';
import { useTextToSpeech } from '../../lib/tts.js';
import { weeklyPick, weekIndex } from '../../lib/youth-zone.js';
import { rosterFor, blankName, choicesFor, nextPerson, gradeGuess, CLUES_PER_PERSON } from '../../lib/kids/who-am-i.js';
import { Shot, ShotSlot, GuideBubble, KidsIcon, KZ_FOCUS } from './GuideArt.jsx';

export default function WhoAmI({ door = 'kids', now = null, loadVerse = verseText, onBack = null, onOpenScripture = null, shotList = undefined }) {
  const at = useMemo(() => now || new Date(), [now]);
  const roster = useMemo(() => rosterFor(door), [door]);
  const seed = weekIndex(at);
  const [person, setPerson] = useState(() => weeklyPick(roster, at));
  const [revealed, setRevealed] = useState(1);
  const [texts, setTexts] = useState(null);
  const [guess, setGuess] = useState(null);
  const tts = useTextToSpeech();
  useEffect(() => {
    let alive = true;
    setTexts(null);
    setRevealed(1);
    setGuess(null);
    Promise.all(
      person.clues.map((ref) =>
        Promise.resolve()
          .then(() => loadVerse(ref))
          .catch(() => '')
      )
    ).then((all) => {
      if (alive) setTexts(all.map((t) => String(t || '')));
    });
    return () => {
      alive = false;
    };
  }, [person, loadVerse]);
  const choices = useMemo(() => choicesFor(person, roster, seed), [person, roster, seed]);
  const result = guess ? gradeGuess(person, guess, revealed) : null;
  const solved = result && result.right;
  return (
    <div className="kz-game" data-testid="who-am-i" data-person={person.name} data-solved={solved ? 'true' : 'false'}>
      <div className="kz-gamehead g-violet">
        <div className="kz-words">
          <h2>Guess the Bible hero</h2>
          <p>Three clues from the Word. Fewer clues, more stars.</p>
        </div>
        <Shot
          id="who-am-i-header"
          alt=""
          className="kz-art"
          list={shotList}
          fallback={<ShotSlot id="who-am-i-header" className="kz-art" what="the boy with the magnifying glass" />}
        />
      </div>
      <div className="kz-body">
        {texts === null && (
          <p className="lc-small" data-testid="whoami-loading">
            Loading the clues from the Word…
          </p>
        )}
        {texts &&
          person.clues.map((ref, i) => {
            const text = texts[i];
            if (i >= revealed) {
              return (
                <button
                  key={ref}
                  type="button"
                  className={`kz-clue locked ${KZ_FOCUS}`}
                  onClick={() => setRevealed(i + 1)}
                  data-testid={`clue-${i + 1}-reveal`}
                  disabled={!!solved}
                >
                  <span className="kz-k">CLUE {i + 1} · tap to reveal</span>
                  <q>…</q>
                </button>
              );
            }
            if (!text) {
              return (
                <div key={ref} className="kz-clue" data-testid={`clue-${i + 1}`}>
                  <span className="kz-k">CLUE {i + 1}</span>
                  <p className="lc-notice">The words of {ref} are not on this device yet. Open the Scripture tab once while online and they will be.</p>
                </div>
              );
            }
            return (
              <div key={ref} className="kz-clue" data-testid={`clue-${i + 1}`}>
                <span className="kz-k">CLUE {i + 1}</span>
                <q>
                  {blankName(text, person.name).map((t, k) =>
                    t.blank ? (
                      <span key={k} className="kz-blankname" aria-label="the name">
                        {solved ? t.word : ''}
                      </span>
                    ) : (
                      <span key={k}>{t.word}</span>
                    )
                  )}
                </q>
                <span className="kz-ref">{ref} · KJV</span>
                <button
                  type="button"
                  className={`kz-spk ${KZ_FOCUS}`}
                  aria-label="Hear this clue"
                  onClick={() => tts && tts.supported && tts.speak(text)}
                  disabled={!(tts && tts.supported)}
                >
                  <KidsIcon name="speaker" />
                </button>
              </div>
            );
          })}
        <GuideBubble who="girl" shot="girl-point" right list={shotList}>
          Who is it? Guess early for three stars, or reveal clue {CLUES_PER_PERSON} for one. No wrong answers here, only "not yet".
        </GuideBubble>
        <div className="kz-names" role="group" aria-label="Who am I?">
          {choices.map((name) => (
            <button
              key={name}
              type="button"
              className={`kz-name${guess === name ? ' pick' : ''} ${KZ_FOCUS}`}
              onClick={() => setGuess(name)}
              disabled={!!solved}
              data-testid={`name-${name}`}
            >
              {name}
            </button>
          ))}
        </div>
        {result && !result.right && (
          <p className="lc-small" role="status" data-testid="whoami-notyet">
            Not yet. {result.more ? 'Reveal the next clue and try again.' : 'Look at the clues once more and try again.'}
          </p>
        )}
        {solved && (
          <div className="kz-panel" data-testid="whoami-solved">
            <h3>
              Yes! {person.name}. {result.stars} {result.stars === 1 ? 'star' : 'stars'}.
            </h3>
            <p className="lc-small">
              Read the story in {person.book} {person.chapter}.
            </p>
            <div className="kz-actions">
              {onOpenScripture && (
                <button
                  type="button"
                  className={`kz-act blue ${KZ_FOCUS}`}
                  onClick={() => onOpenScripture(person.book, person.chapter)}
                  data-testid="whoami-read"
                >
                  <KidsIcon name="read" /> Read the story
                </button>
              )}
              <button type="button" className={`kz-act green ${KZ_FOCUS}`} onClick={() => setPerson(nextPerson(roster, person))} data-testid="whoami-next">
                Next hero ▶
              </button>
              {onBack && (
                <button type="button" className={`kz-act plain ${KZ_FOCUS}`} onClick={onBack}>
                  Back
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
