// =============================================================================
// KidsZone — the Kids door of the Love Corner Kids Zone (DR-1508)
// =============================================================================
// Screen 1 of the approved previews, built: the church's frame around the
// zone's own bright world; the approved logo and the two guides from the
// reference; this week's REAL lesson as the adventure; the Theater, the
// games, the storybooks and the reading corner as doors that each open a real
// thing; badges and the map derived from real rows; Ari in child mode; the
// Little Ones door; the grown-ups' side. Every character appearance is a
// landed render, the interim cutout from the reference, or a labeled slot
// (GuideArt). No profile, no chat with anyone, no scoreboard, by design.
import React, { useEffect, useMemo, useState } from 'react';
import './kids-zone.css';
import { resolveChurch } from '../../lib/resolve-church.js';
import { verseText } from '../../lib/bible-kjv.js';
import { fetchLearnerRecords, saveLearnerRecord } from '../../lib/learner-records-sync.js';
import { askTutor } from '../../lib/class-tutor.js';
import { LIVING_LESSONS_MODULES } from '../../lib/living-lessons-class.js';
import { LITTLE_LEARNERS_MODULES } from '../../lib/little-learners-class.js';
import { YOUTH_DOORS, weeklyVerse, weeklyLesson, weekIndex, normalizeRecord, badgesFor, encouragement } from '../../lib/youth-zone.js';
import { STORYBOOKS } from '../../lib/kids/storybooks.js';
import { TriviaCard } from '../Engagement.jsx';
import { MemoryVerseGame, BadgeShelf } from './MemoryAndBadges.jsx';
import { KidsLogo, GuidesPair, GuideFace, GuideBubble, Shot, ShotSlot, AriStar, KidsIcon, KZ_FOCUS, kidsAsset } from './GuideArt.jsx';
import { GUIDES } from '../../lib/kids/guides.js';
import KidsAdventure from './KidsAdventure.jsx';
import Storybook from './Storybook.jsx';
import StoryOrder from './StoryOrder.jsx';
import AdventureTrail from './AdventureTrail.jsx';
import Theater from './Theater.jsx';
import WordBuilder from './WordBuilder.jsx';
import WhoAmI from './WhoAmI.jsx';
import GrownUps, { moduleFor } from './GrownUps.jsx';
import { activityRecord, TRAIL_COURSES, trailProgress } from '../../lib/kids/trail.js';

export const KIDS_TABS = Object.freeze([
  { id: 'adventure', label: 'ADVENTURE', icon: 'map' },
  { id: 'theater', label: 'THEATER', icon: 'theater' },
  { id: 'games', label: 'GAMES', icon: 'game' },
  { id: 'badges', label: 'BADGES', icon: 'star' },
  { id: 'grownups', label: 'GROWN-UPS', icon: 'adult' },
]);

/** The dock: five tabs, role=tablist, 52px targets. */
export function KidsDock({ tabs = KIDS_TABS, active, onPick, idBase = 'kids' }) {
  return (
    <div className="kz-dock" role="tablist" aria-label="Kids Zone sections">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          id={`${idBase}-tab-${t.id}`}
          className={`kz-tab ${KZ_FOCUS}`}
          aria-selected={active === t.id}
          onClick={() => onPick(t.id)}
          data-testid={`kids-tab-${t.id}`}
        >
          <KidsIcon name={t.icon} />
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** The adventure map: the course's lessons as stops; a stop lights only from a real record. */
export function AdventureMap({ pick, records = [], signedIn = false }) {
  const courseKey = pick ? pick.courseKey : 'living-lessons';
  const list = courseKey === 'little-learners' ? LITTLE_LEARNERS_MODULES : LIVING_LESSONS_MODULES;
  const done = new Set(
    records
      .map(normalizeRecord)
      .filter((r) => r.completedAt && r.courseKey === courseKey)
      .map((r) => r.lessonId)
  );
  const lit = list.filter((m) => done.has(m.id)).length;
  const stops = Math.min(8, list.length);
  const pts = Array.from({ length: stops }, (_, i) => ({
    x: 30 + (280 / Math.max(1, stops - 1)) * i,
    y: 100 - 40 * Math.sin((i / Math.max(1, stops - 1)) * Math.PI * 1.5),
  }));
  const litStops = Math.min(stops, Math.round((lit / Math.max(1, list.length)) * stops) || (lit > 0 ? 1 : 0));
  const here = pts[Math.min(litStops, stops - 1)]; // the guide waits at the next stop
  return (
    <div className="kz-map" data-testid="adventure-map" data-lit={signedIn ? lit : ''} data-total={list.length}>
      <h3>
        Your adventure map{' '}
        <small className="kz-sub">{signedIn ? `${lit} of ${list.length} lessons` : 'sign in and every lesson you finish lights a stop'}</small>
      </h3>
      <svg viewBox="0 0 340 150" role="img" aria-label={signedIn ? `${lit} of ${list.length} stops lit` : 'no stop lit until you sign in'}>
        <rect x="2" y="2" width="336" height="146" rx="12" fill="#F6E3B4" stroke="#C9A86A" strokeWidth="3" />
        <path
          d={pts.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ')}
          fill="none"
          stroke="#C03222"
          strokeWidth="3"
          strokeDasharray="6 5"
          strokeLinecap="round"
        />
        {here && (
          <image
            href={kidsAsset(GUIDES.girl.face)}
            x={here.x - 19}
            y={here.y - 54}
            width="38"
            height="38"
            data-interim="true"
            data-testid="map-guide"
            aria-label="Your guide waits at your next stop"
          />
        )}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="13" fill={i < litStops ? '#CFA63C' : '#fff'} stroke={i < litStops ? '#7A5C14' : '#C9A86A'} strokeWidth="3" />
            <text
              x={p.x}
              y={p.y + 5}
              textAnchor="middle"
              fontFamily="DM Sans, sans-serif"
              fontWeight="900"
              fontSize="12"
              fill={i < litStops ? '#1A1012' : '#8B7A5A'}
            >
              {i + 1}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function Tile({ cls, big = false, title, sub, shot, what, onClick, testId, cta = null, list }) {
  return (
    <button type="button" className={`kz-card ${cls}${big ? ' big' : ''} ${KZ_FOCUS}`} onClick={onClick} data-testid={testId}>
      <div className="kz-words">
        <b>{title}</b>
        <small>{sub}</small>
        {cta && <span className={`kz-play${cta.red ? ' red' : ''}`}>{cta.text}</span>}
      </div>
      <Shot id={shot} alt="" className="kz-art" list={list} fallback={<ShotSlot id={shot} className="kz-art" what={what} />} />
    </button>
  );
}

export default function KidsZone({
  church = null,
  door = 'kids',
  signedIn = false,
  setChurchView = null,
  now = null,
  loadVerse = verseText,
  fetchRecords = fetchLearnerRecords,
  saveRecord = saveLearnerRecord,
  ask = askTutor,
  setDoor = null,
  shotList = undefined,
}) {
  const c = resolveChurch(church);
  const at = useMemo(() => now || new Date(), [now]);
  const d = YOUTH_DOORS.find((x) => x.key === door) || YOUTH_DOORS[0];
  const pick = weeklyLesson(door, at);
  const mod = useMemo(() => moduleFor(pick), [pick]);
  const verse = weeklyVerse(door, at);
  const seed = weekIndex(at);
  const [tab, setTab] = useState('adventure');
  const [sub, setSub] = useState(null); // 'lesson' | 'memory' | 'memory:<book>' | 'trivia' | 'builder' | 'whoami' | 'whoami:<Hero>' | 'story:<id>' | 'order:<id>'
  const [records, setRecords] = useState([]);
  const open = (t, s = null) => {
    setTab(t);
    setSub(s);
  };
  const back = () => setSub(null);
  /** A trail stop's `open` value routed to its tab (J1, DR-1523). */
  const route = (where) => {
    if (where === 'theater') return open('theater');
    return open('games', where);
  };
  /** A finished activity's record: saved when signed in, and counted here at once so the trail lights without a refetch. */
  const recordDone = async (rec) => {
    if (!signedIn || !rec) return { skipped: 'signed-out' };
    let result;
    try {
      result = await saveRecord(rec);
    } catch (e) {
      result = { error: e };
    }
    if (result && !result.error && !result.skipped) setRecords((r) => [...r, rec]);
    return result;
  };
  const countDone = (rec) => {
    if (signedIn && rec) setRecords((r) => [...r, rec]);
  };
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
  const badges = badgesFor(records, { now: at });
  const earned = badges.filter((b) => b.earned).length;
  const total = (pick && pick.courseKey === 'little-learners' ? LITTLE_LEARNERS_MODULES : LIVING_LESSONS_MODULES).length;
  const read = records.map(normalizeRecord).filter((r) => r.completedAt && r.courseKey === (pick && pick.courseKey)).length;
  const pct = signedIn && total ? Math.round((read / total) * 100) : 0;
  const trail = trailProgress(STORYBOOKS[0], signedIn ? records : []);
  const trailNext = trail.next >= 0 ? trail.stops[trail.next] : null;

  let body;
  if (sub === 'lesson')
    body = (
      <KidsAdventure
        pick={pick}
        module={mod}
        band="child"
        signedIn={signedIn}
        loadVerse={loadVerse}
        saveRecord={saveRecord}
        ask={ask}
        onBack={back}
        shotList={shotList}
      />
    );
  else if (sub === 'memory' || (sub && sub.startsWith('memory:'))) {
    const picked = sub.startsWith('memory:') ? STORYBOOKS.find((b) => b.id === sub.slice(7)) || null : null;
    const ref = picked ? picked.memory : verse ? verse.ref : '';
    body = (
      <section className="kz-panel" aria-labelledby="kz-mem-h" data-testid="memory-section" data-verse={ref}>
        <h3 id="kz-mem-h">{picked ? `${picked.title}: ${picked.memory}` : `This week's verse: ${ref}`}</h3>
        <div className="kz-chips" role="tablist" aria-label="Which verse">
          <button
            type="button"
            role="tab"
            className={`kz-chip ${KZ_FOCUS}`}
            aria-selected={!picked}
            onClick={() => setSub('memory')}
            data-testid="memory-pick-week"
          >
            This week
          </button>
          {STORYBOOKS.filter((b) => b.memory).map((b) => (
            <button
              key={b.id}
              type="button"
              role="tab"
              className={`kz-chip ${KZ_FOCUS}`}
              aria-selected={!!picked && picked.id === b.id}
              onClick={() => setSub(`memory:${b.id}`)}
              data-testid={`memory-pick-${b.id}`}
            >
              {b.hero}
            </button>
          ))}
        </div>
        <GuideBubble who="girl" shot="girl-shh-listen" list={shotList}>
          Read it, say it, then fill in the missing words from memory.
        </GuideBubble>
        {ref && (
          <MemoryVerseGame
            key={ref}
            verseRef={ref}
            seed={seed}
            load={loadVerse}
            onSuccess={(r) =>
              recordDone(
                activityRecord({
                  lessonId: picked
                    ? `memory-${picked.id}`
                    : `memory-week-${String(r)
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')}`,
                  courseKey: TRAIL_COURSES.verse,
                  passed: true,
                  pct: 100,
                })
              )
            }
          />
        )}
        <div className="kz-actions">
          <button type="button" className={`kz-act plain ${KZ_FOCUS}`} onClick={back}>
            ◀ Back to games
          </button>
        </div>
      </section>
    );
  } else if (sub === 'trivia')
    body = (
      <section className="kz-panel" data-testid="trivia-section">
        <GuideBubble who="boy" shot="boy-explain" list={shotList}>
          Bible trivia from the message. Pick an answer and see the verse it came from.
        </GuideBubble>
        <TriviaCard signedIn={signedIn} />
        <div className="kz-actions">
          <button type="button" className={`kz-act plain ${KZ_FOCUS}`} onClick={back}>
            ◀ Back to games
          </button>
        </div>
      </section>
    );
  else if (sub === 'builder') body = <WordBuilder door={door} now={at} loadVerse={loadVerse} onBack={back} shotList={shotList} />;
  else if (sub === 'whoami' || (sub && sub.startsWith('whoami:')))
    body = (
      <WhoAmI
        key={sub}
        door={door}
        now={at}
        loadVerse={loadVerse}
        onBack={back}
        onOpenScripture={setChurchView ? () => setChurchView('scripture') : null}
        shotList={shotList}
        hero={sub.startsWith('whoami:') ? sub.slice(7) : null}
        onSolved={(person) =>
          recordDone(activityRecord({ lessonId: `whoami-${String(person.name).toLowerCase()}`, courseKey: TRAIL_COURSES.hero, passed: true, pct: 100 }))
        }
      />
    );
  else if (sub && sub.startsWith('story:'))
    body = (
      <Storybook
        bookId={sub.slice(6)}
        door={door}
        signedIn={signedIn}
        loadVerse={loadVerse}
        saveRecord={saveRecord}
        onBack={back}
        onDone={(id, r) => r && r.result && !r.result.error && !r.result.skipped && countDone(r.record)}
        onLearnVerse={(b) => open('games', `memory:${b.id}`)}
        shotList={shotList}
      />
    );
  else if (sub && sub.startsWith('order:'))
    body = (
      <StoryOrder
        key={sub}
        bookId={sub.slice(6)}
        seed={seed}
        signedIn={signedIn}
        saveRecord={saveRecord}
        onPick={(id) => setSub(`order:${id}`)}
        onBack={back}
        onDone={(id, r) => r && r.result && !r.result.error && !r.result.skipped && countDone(r.record)}
        shotList={shotList}
      />
    );
  else if (tab === 'theater')
    body = (
      <Theater
        church={c}
        onOpenStorybook={(id) => open('adventure', `story:${id}`)}
        storybook={{
          door,
          signedIn,
          loadVerse,
          saveRecord,
          onDone: (id, r) => r && r.result && !r.result.error && !r.result.skipped && countDone(r.record),
          onLearnVerse: (b) => open('games', `memory:${b.id}`),
        }}
        onWatched={(ep) => recordDone(activityRecord({ lessonId: `episode-${ep.id}`, courseKey: TRAIL_COURSES.watch, passed: true, pct: 100 }))}
        shotList={shotList}
      />
    );
  else if (tab === 'games')
    body = (
      <div className="kz-grid" data-testid="games-grid">
        <Tile
          cls="k2"
          title="Memory verse"
          sub={`${verse ? verse.ref : ''} · fill the words`}
          shot="girl-remembering"
          what="the girl remembering"
          onClick={() => setSub('memory')}
          testId="tile-memory"
          list={shotList}
        />
        <Tile
          cls="k3"
          title="Bible trivia"
          sub="From the message"
          shot="boy-question"
          what="the boy with a question"
          onClick={() => setSub('trivia')}
          testId="tile-trivia"
          list={shotList}
        />
        <Tile
          cls="k4"
          title="Word builder"
          sub="Spell the Bible word"
          shot="girl-blocks"
          what="the girl lifting a block"
          onClick={() => setSub('builder')}
          testId="tile-builder"
          list={shotList}
        />
        <Tile
          cls="k5"
          title="Who am I?"
          sub="Guess the Bible hero"
          shot="boy-magnifier"
          what="the boy with a magnifying glass"
          onClick={() => setSub('whoami')}
          testId="tile-whoami"
          list={shotList}
        />
        <Tile
          cls="k3"
          title="Put the story in order"
          sub="Jonah · Noah · David · what happened first?"
          shot="boy-map"
          what="the boy with the map"
          onClick={() => setSub('order:jonah')}
          testId="tile-order"
          list={shotList}
        />
        {STORYBOOKS.map((b) => (
          <Tile
            key={b.id}
            cls="k6"
            title={b.title}
            sub={`Storybook · ${b.scripture}`}
            shot={`${b.id}-3`}
            what="a page of the story"
            onClick={() => setSub(`story:${b.id}`)}
            testId={`tile-story-${b.id}`}
            list={shotList}
          />
        ))}
      </div>
    );
  else if (tab === 'badges')
    body = (
      <>
        <div className="kz-celebrate">
          <div className="kz-words">
            <h2>{earned ? 'Look at you go!' : 'Your first badge is waiting'}</h2>
            <p data-testid="badges-encouragement">{encouragement(badges)}</p>
          </div>
          <Shot
            id="pair-celebrate"
            alt=""
            className="kz-art"
            list={shotList}
            fallback={<ShotSlot id="pair-celebrate" className="kz-art" what="your guides cheering" />}
          />
        </div>
        {STORYBOOKS.map((b, i) => (
          <AdventureTrail key={b.id} book={b} records={records} signedIn={signedIn} onOpen={route} compact={i > 0} />
        ))}
        <BadgeShelf signedIn={signedIn} fetchRecords={fetchRecords} now={at} />
        <AdventureMap pick={pick} records={records} signedIn={signedIn} />
      </>
    );
  else if (tab === 'grownups')
    body = <GrownUps door={door} setDoor={setDoor} now={at} signedIn={signedIn} fetchRecords={fetchRecords} setChurchView={setChurchView} />;
  else
    body = (
      <>
        <div className="kz-top">
          <KidsLogo />
          <p>
            Your guides are ready. This week: <b>{pick ? pick.title : ''}</b>.
          </p>
          <Shot id="home-hero" alt="Your two guides on the path to the treasure" className="kz-heroimg" list={shotList} fallback={<GuidesPair />} />
          <div className="kz-prog" data-testid="adventure-progress" data-pct={pct}>
            <small>
              {signedIn ? `Your adventure map · ${read} of ${total} lessons` : 'Your adventure map · sign in and every lesson you finish lights a stop'}
            </small>
            <div className="kz-bar">
              <i style={{ width: `${pct}%` }} />
            </div>
          </div>
          {trailNext && (
            <button type="button" className={`kz-next ${KZ_FOCUS}`} onClick={() => route(trailNext.open)} data-testid="home-trail-next">
              <span>
                <small>{STORYBOOKS[0].title} · your next stop</small>
                <b>{trailNext.title} ▶</b>
              </span>
              <GuideFace who="boy" />
            </button>
          )}
        </div>
        <div className="kz-guides" data-testid="meet-guides">
          <Shot id="girl-wave" alt="Your guide" className="kz-face lg" list={shotList} fallback={<GuideFace who="girl" size="lg" />} />
          <Shot id="boy-wave" alt="Your guide" className="kz-face lg" list={shotList} fallback={<GuideFace who="boy" size="lg" />} />
          <div>
            <b>Meet your guides</b>
            <small>Two friends who walk every story with you.</small>
          </div>
        </div>
        <div className="kz-grid">
          <Tile
            cls="k1"
            big
            title="This week's adventure"
            sub={`${pick ? pick.title : ''} · read, listen, play`}
            shot="girl-reading-lantern"
            what="the girl reading by lantern light"
            onClick={() => setSub('lesson')}
            testId="weekly-lesson-open"
            cta={{ text: 'Start ▶', red: true }}
            list={shotList}
          />
          <Tile
            cls="k2"
            big
            title="Bible Adventure Theater"
            sub="Animated Bible stories · the church channel today, our own series next"
            shot="pair-theater-tile"
            what="your guides on beanbags"
            onClick={() => open('theater')}
            testId="tile-theater"
            cta={{ text: 'Open the Theater ▶' }}
            list={shotList}
          />
          <Tile
            cls="k2"
            title="Memory verse"
            sub={`${verse ? verse.ref : ''} · fill the words`}
            shot="girl-remembering"
            what="the girl remembering"
            onClick={() => open('games', 'memory')}
            testId="home-memory"
            list={shotList}
          />
          <Tile
            cls="k3"
            title="Bible trivia"
            sub="From the message"
            shot="boy-question"
            what="the boy with a question"
            onClick={() => open('games', 'trivia')}
            testId="home-trivia"
            list={shotList}
          />
          <Tile
            cls="k4"
            title="Word builder"
            sub="Spell the Bible word"
            shot="girl-blocks"
            what="the girl lifting a block"
            onClick={() => open('games', 'builder')}
            testId="home-builder"
            list={shotList}
          />
          <Tile
            cls="k5"
            title="Who am I?"
            sub="Guess the Bible hero"
            shot="boy-magnifier"
            what="the boy with a magnifying glass"
            onClick={() => open('games', 'whoami')}
            testId="home-whoami"
            list={shotList}
          />
          <Tile
            cls="k4"
            title="Storybooks"
            sub="Jonah · Noah · David · page by page"
            shot="girl-storybook"
            what="the girl holding a storybook"
            onClick={() => open('games', 'story:jonah')}
            testId="home-storybooks"
            list={shotList}
          />
          <Tile
            cls="k6"
            title="Reading corner"
            sub="Read to me · trace it · color it"
            shot="boy-reading-headphones"
            what="the boy reading with headphones"
            onClick={() => setSub('lesson')}
            testId="home-reading"
            list={shotList}
          />
        </div>
        <div className="kz-strip" data-testid="home-badges">
          <h3>
            My badges <small>{signedIn ? `${earned} of ${badges.length}` : `0 of ${badges.length} · sign in to earn`}</small>
          </h3>
          <ul className="yz-badges" aria-label="Badges">
            {badges.map((b) => (
              <li key={b.key} className={`yz-badge${b.earned ? ' yz-badge-on' : ''}`} data-earned={b.earned ? 'true' : 'false'}>
                <b>{b.title}</b>
                <small>{b.earned ? 'Earned' : b.how}</small>
              </li>
            ))}
          </ul>
        </div>
        <div className="kz-ari">
          <AriStar />
          <p>
            <small>ASK ARI · your lesson helper</small>Stuck on a word? Ask me inside any lesson. I only talk about the lesson, and a grown-up can always see
            what we said.
          </p>
        </div>
        {door !== 'little' && setDoor && (
          <button type="button" className={`kz-lil ${KZ_FOCUS}`} onClick={() => setDoor('little')} data-testid="door-little-card">
            <GuideFace who="girl" />
            <span>
              <b>Little Ones (3–6)</b>
              <small>Letters, numbers and first words from the Word · read aloud</small>
            </span>
          </button>
        )}
        <p className="kz-safety">{d.cheer}</p>
      </>
    );

  return (
    <div className="kz" data-testid="kids-zone" data-door={door} data-tab={tab} data-sub={sub || ''}>
      <div className="kz-hdr">
        {sub ? (
          <button type="button" className={`kz-back ${KZ_FOCUS}`} onClick={back} aria-label="Back" data-testid="kids-back">
            ‹
          </button>
        ) : null}
        <div className="kz-title">
          <b>{door === 'little' ? 'Little Ones' : 'Kids Zone'}</b>
          <small>THE LOVE CORNER BIBLE ADVENTURES</small>
        </div>
      </div>
      <div className={tab === 'adventure' && !sub ? '' : 'kz-body'}>{body}</div>
      <KidsDock active={tab} onPick={(t) => open(t)} />
    </div>
  );
}
