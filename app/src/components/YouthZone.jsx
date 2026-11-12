// =============================================================================
// YouthZone — the Love Corner's Youth Zone (churchView 'youth'), Phase 2
// =============================================================================
// The brief (2026-11-12 §6): a place children and teenagers want to visit:
// trivia, Scripture memory, a weekly activity, badges, encouragement, youth
// events, music where authorized; different for kids and teens; no public
// child profiles, no unrestricted messaging.
//
// WHAT IS REAL HERE (P15/P16; DR-0076):
//   • Trivia is Engagement's own TriviaCard: Bishop Gwin's live
//     trivia_questions row when one exists, else the dated anchor set.
//   • The memory verse's words are loaded from the hosted KJV at play time
//     (lib/bible-kjv.js verseText); a verse that does not load says so.
//   • The week's lesson is a real module of a registered course, picked by the
//     calendar week (lib/youth-zone.js), opened by the same link a shared
//     lesson uses (DR-1428).
//   • Badges are derived from the signed-in learner's real rows
//     (lib/learner-records-sync.js); signed out, the card says what signing
//     in earns and shows no badge as earned.
//   • Events are the church record's announced events, future only; the
//     fallback says none are posted. Music is the church's own channel.
// WHAT IS NOT HERE, BY DESIGN: a profile, a chat, a leaderboard, a score of
// anyone else. The door choice is a device preference (localStorage), not a
// record of a child.
// PATTERNS KEPT: SectionTabs; rem text; 36px+ targets with focus rings;
// in-place opens; the still screen.
import React, { useEffect, useMemo, useState } from 'react';
import SectionTabs from './SectionTabs.jsx';
import UiIcon from './UiIcon.jsx';
import { TriviaCard } from './Engagement.jsx';
import { resolveChurch } from '../lib/resolve-church.js';
import { verseText } from '../lib/bible-kjv.js';
import { lessonUrl } from '../lib/lesson-links.js';
import { fetchLearnerRecords } from '../lib/learner-records-sync.js';
import { upcomingAnnounced } from '../lib/home-week.js';
import {
  YOUTH_DOORS,
  DOOR_PREF_KEY,
  normalizeDoor,
  doorBandProfile,
  weeklyVerse,
  weeklyLesson,
  weekIndex,
  blankWords,
  matchesBlank,
  badgesFor,
  encouragement,
} from '../lib/youth-zone.js';

const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';

function readDoorPref() {
  try {
    return normalizeDoor(window.localStorage.getItem(DOOR_PREF_KEY));
  } catch {
    return normalizeDoor(null);
  }
}
function writeDoorPref(key) {
  try {
    window.localStorage.setItem(DOOR_PREF_KEY, key);
  } catch {
    /* a device that cannot remember still plays */
  }
}

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
  if (text === '')
    return (
      <p className="lc-notice" data-testid="memory-unavailable">
        The words of {verseRef} are not on this device yet. Open the Scripture tab once while online and they will be.
      </p>
    );
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
export function BadgeShelf({ signedIn = false, fetchRecords = fetchLearnerRecords, now = null }) {
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
        if (alive) setState({ loading: false, records: (r && r.records) || [], error: (r && r.error) || null });
      })
      .catch((e) => {
        if (alive) setState({ loading: false, records: [], error: e });
      });
    return () => {
      alive = false;
    };
  }, [signedIn, fetchRecords]);
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

export default function YouthZone({
  church = null,
  signedIn = false,
  setChurchView = null,
  now = null,
  loadVerse = verseText,
  fetchRecords = fetchLearnerRecords,
  initialDoor = null,
}) {
  const c = resolveChurch(church);
  const at = useMemo(() => now || new Date(), [now]);
  const [door, setDoor] = useState(() => (normalizeDoor(initialDoor) === initialDoor && initialDoor ? initialDoor : readDoorPref()));
  const chooseDoor = (k) => {
    setDoor(k);
    writeDoorPref(k);
  };
  const d = YOUTH_DOORS.find((x) => x.key === door) || YOUTH_DOORS[0];
  const band = doorBandProfile(door);
  const verse = weeklyVerse(door, at);
  const lesson = weeklyLesson(door, at);
  const events = upcomingAnnounced(c.announcedEvents || [], at);
  const seed = weekIndex(at);

  const sections = [
    {
      id: 'play',
      label: 'Trivia',
      icon: 'dice',
      render: () => (
        <div className="lc-stack">
          <p className="lc-p">Bible trivia from the message. Pick an answer and see the verse it came from.</p>
          <TriviaCard signedIn={signedIn} />
        </div>
      ),
    },
    {
      id: 'memory',
      label: 'Memory verse',
      icon: 'bookOpen',
      render: () => (
        <section aria-labelledby="yz-mem-h" className="lc-card">
          <h3 id="yz-mem-h" className="lc-h3">
            This week&apos;s verse: {verse ? verse.ref : ''}
          </h3>
          <p className="lc-p">Read it, say it, then fill in the missing words from memory.</p>
          {verse && <MemoryVerseGame verseRef={verse.ref} seed={seed} load={loadVerse} />}
        </section>
      ),
    },
    {
      id: 'week',
      label: 'This week',
      icon: 'calendar',
      render: () => (
        <div className="lc-stack">
          {lesson && (
            <section aria-labelledby="yz-les-h" className="lc-card" data-testid="weekly-lesson">
              <span className="lc-eyebrow">This week&apos;s lesson · {d.title}</span>
              <h3 id="yz-les-h" className="lc-h3">
                {lesson.title}
              </h3>
              {lesson.bigIdea && <p className="lc-p yz-bigidea">{lesson.bigIdea}</p>}
              <div className="yz-row">
                <a
                  href={lessonUrl({ courseKey: lesson.courseKey, lessonId: lesson.lessonId })}
                  className={`lc-btn lc-btn-gold ${FOCUS}`}
                  data-testid="weekly-lesson-open"
                >
                  Open the lesson
                </a>
                <span className="lc-small">
                  Reads at the {band ? band.label : d.title} level: {band ? band.hint : ''}
                </span>
              </div>
            </section>
          )}
          <section aria-labelledby="yz-ev-h">
            <h3 id="yz-ev-h" className="lc-h3 mb-2">
              Youth events
            </h3>
            {events.length === 0 && (
              <p className="lc-empty" data-testid="youth-events-empty">
                No upcoming youth events have been posted yet. When the office posts one, it shows here. Sunday Worship is every week at{' '}
                {(c.services || []).find((s) => s.day === 'Sunday')?.time || 'the posted time'}.
              </p>
            )}
            {events.map((ev) => (
              <div key={ev.id} className="lc-course" data-testid={`youth-event-${ev.id}`}>
                <span className="lc-course-n" aria-hidden="true">
                  {String(ev.date).slice(8, 10)}
                </span>
                <span className="min-w-0">
                  <b className="block text-[0.85rem]">{ev.name}</b>
                  <small className="lc-small block">
                    {ev.date}
                    {ev.detail ? ` · ${ev.detail}` : ''}
                  </small>
                </span>
              </div>
            ))}
          </section>
          {c.media && c.media.youtube && (
            <section aria-labelledby="yz-mu-h" className="lc-card">
              <h3 id="yz-mu-h" className="lc-h3">
                Music &amp; messages
              </h3>
              <p className="lc-p">Worship and the Word from the church&apos;s own channel.</p>
              <a href={c.media.youtube} target="_blank" rel="noopener noreferrer" className={`lc-link ${FOCUS}`} data-testid="youth-channel">
                Open the church channel →
              </a>
            </section>
          )}
        </div>
      ),
    },
    {
      id: 'badges',
      label: 'Badges',
      icon: 'sparkle',
      render: () => <BadgeShelf signedIn={signedIn} fetchRecords={fetchRecords} now={at} />,
    },
  ];

  return (
    <div className="lc-home" data-testid="youth-zone" data-door={door}>
      <section className="lc-band yz-band" aria-labelledby="yz-h">
        <div className="lc-eyebrow lc-eyebrow-gold">The Love Corner · Youth Zone</div>
        <h2 id="yz-h" className="lc-h1 ts-chrome-region">
          Play. Learn. Grow.
        </h2>
        <p className="lc-band-p">{d.cheer}</p>
        <div className="yz-doors" role="group" aria-label="Choose your door">
          {YOUTH_DOORS.map((x) => (
            <button
              key={x.key}
              type="button"
              onClick={() => chooseDoor(x.key)}
              aria-pressed={door === x.key}
              className={`yz-door${door === x.key ? ' yz-door-on' : ''} ${FOCUS}`}
              data-testid={`door-${x.key}`}
            >
              <b>
                {x.title} {x.range}
              </b>
              <small>{x.caption}</small>
            </button>
          ))}
        </div>
      </section>
      <SectionTabs sections={sections} ariaLabel="Youth Zone sections" idBase="youth" variant="sub" defaultId="play" />
      <p className="lc-small" data-testid="youth-safety">
        Safe here: no profile, no chat, no scoreboard. A grown-up at the church office can answer questions; your door choice stays on this device only.
      </p>
      {setChurchView && (
        <p className="lc-small">
          Grown-ups: the full lessons live in{' '}
          <button type="button" onClick={() => setChurchView('learn')} className={`lc-inline-link-ink ${FOCUS}`}>
            Learn
          </button>
          .
        </p>
      )}
    </div>
  );
}
