// =============================================================================
// MemoryAndBadges — the memory verse game and the badge shelf (Phase 2, kept)
// =============================================================================
// These two shipped with the Youth Zone (DR-1456) and are kept exactly as
// they work: the verse's words load from the hosted KJV at play time and
// every fourth word is blanked by the week's seed; badges derive from the
// learner's real rows and signed out none is earned. They moved out of
// YouthZone.jsx so the Kids and Teens zones can mount them without a cycle.
import React, { useEffect, useMemo, useState } from 'react';
import UiIcon from '../UiIcon.jsx';
import { verseText } from '../../lib/bible-kjv.js';
import { fetchLearnerRecords } from '../../lib/learner-records-sync.js';
import { blankWords, matchesBlank, badgesFor, encouragement } from '../../lib/youth-zone.js';

const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';

/** The memory verse game: the verse's real words, every fourth one blanked. */
export function MemoryVerseGame({ verseRef, seed = 0, load = verseText }) {
  const [text, setText] = useState(null); // null = loading, '' = could not load
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    let alive = true;
    setText(null);
    setAnswers({});
    setChecked(false);
    Promise.resolve()
      .then(() => load(verseRef))
      .then((t) => {
        if (alive) setText(String(t || ''));
      })
      .catch(() => {
        if (alive) setText('');
      });
    return () => {
      alive = false;
    };
  }, [verseRef, load]);
  const tokens = useMemo(() => (text ? blankWords(text, seed) : []), [text, seed]);
  const blanks = tokens.filter((t) => t.blank);
  const right = blanks.filter((t, i) => matchesBlank(answers[i], t.answer)).length;
  if (text === null)
    return (
      <p className="lc-small" data-testid="memory-loading">
        Loading the verse from the Word…
      </p>
    );
  if (text === '') {
    return (
      <p className="lc-notice" data-testid="memory-unavailable">
        The words of {verseRef} are not on this device yet. Open the Scripture tab once while online and they will be.
      </p>
    );
  }
  let blankIndex = -1;
  return (
    <form
      className="yz-game"
      onSubmit={(e) => {
        e.preventDefault();
        setChecked(true);
      }}
      data-testid="memory-game"
    >
      <p className="yz-verse" aria-label={`${verseRef}, with blanks to fill`}>
        {tokens.map((t, i) => {
          if (!t.blank) return <span key={i}>{t.word} </span>;
          blankIndex += 1;
          const idx = blankIndex;
          const ok = checked && matchesBlank(answers[idx], t.answer);
          return (
            <span key={i} className="yz-blank-wrap">
              <input
                id={`memory-blank-${idx}`}
                className={`yz-blank${checked ? (ok ? ' yz-blank-ok' : ' yz-blank-no') : ''} ${FOCUS}`}
                aria-label={`word ${idx + 1} of ${blanks.length}`}
                autoComplete="off"
                autoCapitalize="none"
                value={answers[idx] || ''}
                onChange={(e) => {
                  setChecked(false);
                  setAnswers((a) => ({ ...a, [idx]: e.target.value }));
                }}
                size={Math.max(4, t.answer.length)}
              />{' '}
            </span>
          );
        })}
      </p>
      <p className="lc-small">{verseRef} (KJV)</p>
      <div className="yz-row">
        <button type="submit" className={`lc-btn lc-btn-red ${FOCUS}`} data-testid="memory-check">
          Check my words
        </button>
        {checked && (
          <span className="lc-status lc-status-ok" role="status" data-testid="memory-result">
            {right === blanks.length ? 'Every word right. Say it out loud now!' : `${right} of ${blanks.length} right. Try the rest again.`}
          </span>
        )}
      </div>
    </form>
  );
}

/** Badges derived from the learner's real rows; signed out, an honest invitation. */
export function BadgeShelf({ signedIn = false, fetchRecords = fetchLearnerRecords, now = null, onRecords = null }) {
  const [state, setState] = useState({ loading: !!signedIn, records: [], error: null });
  useEffect(() => {
    let alive = true;
    if (!signedIn) {
      setState({ loading: false, records: [], error: null });
      return undefined;
    }
    setState({ loading: true, records: [], error: null });
    Promise.resolve()
      .then(() => fetchRecords())
      .then((r) => {
        if (alive) {
          const recs = (r && r.records) || [];
          setState({ loading: false, records: recs, error: (r && r.error) || null });
          if (onRecords) onRecords(recs);
        }
      })
      .catch((e) => {
        if (alive) setState({ loading: false, records: [], error: e });
      });
    return () => {
      alive = false;
    };
  }, [signedIn, fetchRecords, onRecords]);
  const badges = useMemo(() => badgesFor(state.records, { now: now || new Date() }), [state.records, now]);
  const earned = badges.filter((b) => b.earned).length;
  return (
    <section aria-labelledby="yz-badges-h" className="lc-card" data-testid="badge-shelf" data-earned={earned}>
      <h3 id="yz-badges-h" className="lc-h3">
        Badges
      </h3>
      {!signedIn && (
        <p className="lc-p" data-testid="badges-signed-out">
          Sign in and every lesson you read and every quiz you pass earns a badge here. Nothing is counted until you do.
        </p>
      )}
      {signedIn && state.loading && (
        <p className="lc-small" data-testid="badges-loading">
          Reading your lessons…
        </p>
      )}
      {signedIn && !state.loading && state.error && (
        <p className="lc-notice" data-testid="badges-error">
          Your lessons could not be read right now, so no badge is shown. They are safe; try again in a moment.
        </p>
      )}
      {signedIn && !state.loading && !state.error && (
        <p className="lc-p" data-testid="badges-cheer">
          {encouragement(badges)}
        </p>
      )}
      <ul className="yz-badges" aria-label="Badges">
        {badges.map((b) => (
          <li key={b.key} className={`yz-badge${b.earned ? ' yz-badge-on' : ''}`} data-testid={`badge-${b.key}`} data-earned={b.earned ? 'true' : 'false'}>
            <span className="yz-badge-ic" aria-hidden="true">
              <UiIcon name={b.icon} />
            </span>
            <b>{b.title}</b>
            <small>{b.earned ? 'Earned' : b.how}</small>
          </li>
        ))}
      </ul>
      <p className="lc-small lc-mt">Badges are yours alone. There is no scoreboard here: learning, kindness and showing up are the prize.</p>
    </section>
  );
}
