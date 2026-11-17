// =============================================================================
// TeensZone — the Teens door, ages 11–17: the house by night (DR-1508)
// =============================================================================
// Screen 2 of the approved previews, built: the church's house by night, the
// true bands (youth 11–14 by default, teen 15–17 on a tap, remembered on this
// device only), this week's REAL lesson as the challenge, the games in their
// teen forms, the church record's announced events (future only, honest
// fallback) and the church's own channel, badges derived from real rows, and
// the grown-ups' side. The teens' own two characters wait on their own
// approved reference: the hero carries a labeled slot, never these two
// children re-aged and never a drawing.
import React, { useEffect, useMemo, useState } from 'react';
import './kids-zone.css';
import { resolveChurch } from '../../lib/resolve-church.js';
import { verseText } from '../../lib/bible-kjv.js';
import { fetchLearnerRecords, saveLearnerRecord } from '../../lib/learner-records-sync.js';
import { askTutor } from '../../lib/class-tutor.js';
import { upcomingAnnounced } from '../../lib/home-week.js';
import { YOUTH_DOORS, TEEN_BANDS, weeklyVerse, weeklyLesson, weekIndex } from '../../lib/youth-zone.js';
import { TriviaCard } from '../Engagement.jsx';
import { MemoryVerseGame, BadgeShelf } from './MemoryAndBadges.jsx';
import { ShotSlot, KidsIcon, KZ_FOCUS } from './GuideArt.jsx';
import KidsAdventure from './KidsAdventure.jsx';
import WordBuilder from './WordBuilder.jsx';
import WhoAmI from './WhoAmI.jsx';
import GrownUps, { moduleFor } from './GrownUps.jsx';
import { KidsDock, AdventureMap } from './KidsZone.jsx';

export const TEEN_TABS = Object.freeze([
  { id: 'challenge', label: 'CHALLENGE', icon: 'flag' },
  { id: 'games', label: 'GAMES', icon: 'game' },
  { id: 'badges', label: 'BADGES', icon: 'star' },
  { id: 'events', label: 'EVENTS', icon: 'cal' },
  { id: 'grownups', label: 'GROWN-UPS', icon: 'adult' },
]);

export default function TeensZone({
  church = null,
  signedIn = false,
  setChurchView = null,
  now = null,
  loadVerse = verseText,
  fetchRecords = fetchLearnerRecords,
  saveRecord = saveLearnerRecord,
  ask = askTutor,
  teenBand = 'youth',
  setTeenBand = null,
  setDoor = null,
  shotList = undefined,
}) {
  const c = resolveChurch(church);
  const at = useMemo(() => now || new Date(), [now]);
  const d = YOUTH_DOORS.find((x) => x.key === 'teens');
  const pick = weeklyLesson('teens', at);
  const mod = useMemo(() => moduleFor(pick), [pick]);
  const verse = weeklyVerse('teens', at);
  const seed = weekIndex(at);
  const events = upcomingAnnounced(c.announcedEvents || [], at);
  const [tab, setTab] = useState('challenge');
  const [sub, setSub] = useState(null);
  const [records, setRecords] = useState([]);
  const open = (t, s = null) => {
    setTab(t);
    setSub(s);
  };
  const back = () => setSub(null);
  useEffect(() => {
    let alive = true;
    if (!signedIn) {
      setRecords([]);
      return undefined;
    }
    Promise.resolve()
      .then(() => fetchRecords())
      .then((r) => {
        if (alive) setRecords((r && r.records) || []);
      })
      .catch(() => {
        if (alive) setRecords([]);
      });
    return () => {
      alive = false;
    };
  }, [signedIn, fetchRecords]);

  let body;
  if (sub === 'lesson')
    body = (
      <KidsAdventure
        pick={pick}
        module={mod}
        band={teenBand}
        signedIn={signedIn}
        loadVerse={loadVerse}
        saveRecord={saveRecord}
        ask={ask}
        onBack={back}
        shotList={shotList}
      />
    );
  else if (sub === 'memory')
    body = (
      <section className="kz-panel" aria-labelledby="tz-mem-h" data-testid="memory-section">
        <h3 id="tz-mem-h">This week's verse: {verse ? verse.ref : ''}</h3>
        {verse && <MemoryVerseGame verseRef={verse.ref} seed={seed} load={loadVerse} />}
        <div className="kz-actions">
          <button type="button" className={`kz-act plain ${KZ_FOCUS}`} onClick={back}>
            ◀ Back
          </button>
        </div>
      </section>
    );
  else if (sub === 'trivia')
    body = (
      <section className="kz-panel" data-testid="trivia-section">
        <TriviaCard signedIn={signedIn} />
        <div className="kz-actions">
          <button type="button" className={`kz-act plain ${KZ_FOCUS}`} onClick={back}>
            ◀ Back
          </button>
        </div>
      </section>
    );
  else if (sub === 'builder') body = <WordBuilder door="teens" now={at} loadVerse={loadVerse} onBack={back} shotList={shotList} />;
  else if (sub === 'whoami')
    body = (
      <WhoAmI
        door="teens"
        now={at}
        loadVerse={loadVerse}
        onBack={back}
        onOpenScripture={setChurchView ? () => setChurchView('scripture') : null}
        shotList={shotList}
      />
    );
  else if (tab === 'games')
    body = (
      <div className="kz-grid" data-testid="games-grid">
        <button type="button" className={`kz-card ${KZ_FOCUS}`} onClick={() => setSub('memory')} data-testid="tile-memory">
          <div className="kz-words">
            <span className="kz-tag">Memory</span>
            <b>{verse ? verse.ref : ''}</b>
            <small>Fill it in, then say it</small>
          </div>
        </button>
        <button type="button" className={`kz-card ${KZ_FOCUS}`} onClick={() => setSub('trivia')} data-testid="tile-trivia">
          <div className="kz-words">
            <span className="kz-tag">Trivia</span>
            <b>From the message</b>
            <small>Bishop Gwin's question</small>
          </div>
        </button>
        <button type="button" className={`kz-card ${KZ_FOCUS}`} onClick={() => setSub('builder')} data-testid="tile-builder">
          <div className="kz-words">
            <span className="kz-tag">Word builder</span>
            <b>Put it in order</b>
            <small>The verse, phrase by phrase</small>
          </div>
        </button>
        <button type="button" className={`kz-card ${KZ_FOCUS}`} onClick={() => setSub('whoami')} data-testid="tile-whoami">
          <div className="kz-words">
            <span className="kz-tag">Who am I?</span>
            <b>Three clues</b>
            <small>Name the person</small>
          </div>
        </button>
      </div>
    );
  else if (tab === 'badges')
    body = (
      <>
        <BadgeShelf signedIn={signedIn} fetchRecords={fetchRecords} now={at} />
        <AdventureMap pick={pick} records={records} signedIn={signedIn} />
      </>
    );
  else if (tab === 'events')
    body = (
      <>
        <section className="kz-strip" aria-labelledby="tz-ev-h">
          <h3 id="tz-ev-h">
            Youth events <small>from the office</small>
          </h3>
          {events.length === 0 && (
            <p className="lc-empty" data-testid="youth-events-empty">
              No upcoming youth events have been posted yet. When the office posts one, it shows here. Sunday Worship is every week at{' '}
              {(c.services || []).find((s) => s.day === 'Sunday')?.time || 'the posted time'}.
            </p>
          )}
          {events.map((ev) => (
            <div key={ev.id} className="kz-evt" data-testid={`youth-event-${ev.id}`}>
              <span className="kz-d" aria-hidden="true">
                {String(ev.date).slice(8, 10)}
              </span>
              <span style={{ minWidth: 0 }}>
                <b style={{ display: 'block', fontSize: '.85rem' }}>{ev.name}</b>
                <small>
                  {ev.date}
                  {ev.detail ? ` · ${ev.detail}` : ''}
                </small>
              </span>
            </div>
          ))}
        </section>
        {c.media && c.media.youtube && (
          <section className="kz-strip" aria-labelledby="tz-mu-h">
            <h3 id="tz-mu-h">
              Music &amp; messages <small>the church channel</small>
            </h3>
            <p className="lc-p">Worship and the Word from the church's own channel.</p>
            <a href={c.media.youtube} target="_blank" rel="noopener noreferrer" className={`kz-play ${KZ_FOCUS}`} data-testid="youth-channel">
              Open the church channel →
            </a>
          </section>
        )}
      </>
    );
  else if (tab === 'grownups')
    body = (
      <GrownUps
        door="teens"
        teenBand={teenBand}
        setTeenBand={setTeenBand}
        setDoor={setDoor}
        now={at}
        signedIn={signedIn}
        fetchRecords={fetchRecords}
        setChurchView={setChurchView}
      />
    );
  else
    body = (
      <>
        <div className="tz-top">
          <h2>
            Real questions. <em>Real answers.</em>
          </h2>
          <p>
            This week's challenge: <b>{pick ? pick.title : ''}</b>
            {mod && mod.anchor ? ` · ${String(mod.anchor.ref).split(';')[0]}` : ''}
          </p>
          <div className="tz-bands" role="group" aria-label="Read at">
            {TEEN_BANDS.map((b) => (
              <button
                key={b}
                type="button"
                className={`tz-band ${KZ_FOCUS}`}
                aria-pressed={teenBand === b}
                onClick={() => setTeenBand && setTeenBand(b)}
                data-testid={`teen-band-${b}`}
              >
                {b === 'youth' ? 'Read at 11–14' : '15–17'}
              </button>
            ))}
          </div>
        </div>
        <div className="kz-body">
          <div className="kz-grid">
            <button type="button" className={`kz-card big ${KZ_FOCUS}`} onClick={() => setSub('lesson')} data-testid="weekly-lesson-open">
              <div className="kz-words">
                <span className="kz-tag">This week's challenge</span>
                <b>{pick ? pick.title : ''}</b>
                <small>{mod && mod.bigIdea ? String(mod.bigIdea).slice(0, 120) : ''}</small>
                <span className="kz-play">Take it on ▶</span>
              </div>
              <ShotSlot id="teen-summit" className="kz-art" what="a teen planting a flag" />
            </button>
            <button type="button" className={`kz-card ${KZ_FOCUS}`} onClick={() => open('games', 'memory')} data-testid="home-memory">
              <div className="kz-words">
                <span className="kz-tag">Memory</span>
                <b>{verse ? verse.ref : ''}</b>
                <small>Fill it in, then say it</small>
              </div>
            </button>
            <button type="button" className={`kz-card ${KZ_FOCUS}`} onClick={() => open('games', 'trivia')} data-testid="home-trivia">
              <div className="kz-words">
                <span className="kz-tag">Trivia</span>
                <b>From the message</b>
                <small>Bishop Gwin's question</small>
              </div>
            </button>
            <button type="button" className={`kz-card ${KZ_FOCUS}`} onClick={() => open('games', 'builder')} data-testid="home-builder">
              <div className="kz-words">
                <span className="kz-tag">Word builder</span>
                <b>Put it in order</b>
                <small>The verse, phrase by phrase</small>
              </div>
            </button>
            <button type="button" className={`kz-card ${KZ_FOCUS}`} onClick={() => open('games', 'whoami')} data-testid="home-whoami">
              <div className="kz-words">
                <span className="kz-tag">Who am I?</span>
                <b>Three clues</b>
                <small>Name the person</small>
              </div>
            </button>
          </div>
          <p className="kz-safety">{d.cheer} Your door and reading level stay on this phone only.</p>
        </div>
      </>
    );

  return (
    <div className="tz" data-testid="teens-zone" data-band={teenBand} data-tab={tab} data-sub={sub || ''}>
      <div className="kz-hdr">
        {sub ? (
          <button type="button" className={`kz-back ${KZ_FOCUS}`} onClick={back} aria-label="Back" data-testid="teens-back">
            ‹
          </button>
        ) : null}
        <div className="kz-title">
          <b>Teens Zone</b>
          <small>THE LOVE CORNER</small>
        </div>
      </div>
      <div className={tab === 'challenge' && !sub ? '' : 'kz-body'}>{body}</div>
      <KidsDock tabs={TEEN_TABS} active={tab} onPick={(t) => open(t)} idBase="teens" />
      <span hidden>
        <KidsIcon name="flag" />
      </span>
    </div>
  );
}
