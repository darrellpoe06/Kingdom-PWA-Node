// =============================================================================
// YouthZone — the Love Corner's Youth Zone (churchView 'youth'): the doors
// =============================================================================
// Phase 2 (DR-1456) built this surface; Phases D and E (DR-1508) make it the
// door switch of the Kids Zone redesign: Kids 6–10 and Little Ones 3–6 open
// KidsZone, Teens 11–17 opens TeensZone. The door and the teens' reading band
// are device preferences (localStorage), never a record of a child.
//
// WHAT IS REAL HERE (P15/P16; DR-0076): every door reads a real course at a
// real age band; the week's lesson is a real module; verses load from the
// hosted KJV; badges derive from real rows; the Theater plays the church's
// own channel until an episode is published; the two guides are the approved
// reference or a labeled slot. WHAT IS NOT HERE, BY DESIGN: a profile, a chat
// with anyone, a leaderboard, a score of anyone else.
import React, { useState } from 'react';
import { YOUTH_DOORS, DOOR_PREF_KEY, TEEN_BAND_PREF_KEY, normalizeDoor, normalizeTeenBand } from '../lib/youth-zone.js';
import { verseText } from '../lib/bible-kjv.js';
import { fetchLearnerRecords, saveLearnerRecord } from '../lib/learner-records-sync.js';
import { askTutor } from '../lib/class-tutor.js';
import KidsZone from './kids/KidsZone.jsx';
import TeensZone from './kids/TeensZone.jsx';

export { MemoryVerseGame, BadgeShelf } from './kids/MemoryAndBadges.jsx';

const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';

function readPref(key, normalize) {
  try { return normalize(window.localStorage.getItem(key)); } catch { return normalize(null); }
}
function writePref(key, value) {
  try { window.localStorage.setItem(key, value); } catch { /* a device that cannot remember still plays */ }
}

export default function YouthZone({
  church = null,
  signedIn = false,
  setChurchView = null,
  now = null,
  loadVerse = verseText,
  fetchRecords = fetchLearnerRecords,
  saveRecord = saveLearnerRecord,
  ask = askTutor,
  initialDoor = null,
  shotList = undefined,
}) {
  const [door, setDoorState] = useState(() => (initialDoor && normalizeDoor(initialDoor) === initialDoor ? initialDoor : readPref(DOOR_PREF_KEY, normalizeDoor)));
  const [teenBand, setTeenBandState] = useState(() => readPref(TEEN_BAND_PREF_KEY, normalizeTeenBand));
  const setDoor = (k) => { const v = normalizeDoor(k); setDoorState(v); writePref(DOOR_PREF_KEY, v); };
  const setTeenBand = (b) => { const v = normalizeTeenBand(b); setTeenBandState(v); writePref(TEEN_BAND_PREF_KEY, v); };
  const d = YOUTH_DOORS.find((x) => x.key === door) || YOUTH_DOORS[0];
  const shared = { church, signedIn, setChurchView, now, loadVerse, fetchRecords, saveRecord, ask, setDoor, shotList };

  return (
    <div className="lc-home" data-testid="youth-zone" data-door={door}>
      <section className="lc-band yz-band" aria-labelledby="yz-h">
        <div className="lc-eyebrow lc-eyebrow-gold">The Love Corner · Kids &amp; Youth Zone</div>
        <h2 id="yz-h" className="lc-h1 ts-chrome-region">Play. Learn. Grow.</h2>
        <p className="lc-band-p">{d.cheer}</p>
        <div className="yz-doors" role="group" aria-label="Choose your door">
          {YOUTH_DOORS.map((x) => (
            <button key={x.key} type="button" onClick={() => setDoor(x.key)} aria-pressed={door === x.key} className={`yz-door${door === x.key ? ' yz-door-on' : ''} ${FOCUS}`} data-testid={`door-${x.key}`}>
              <b>{x.title} {x.range}</b>
              <small>{x.caption}</small>
            </button>
          ))}
        </div>
      </section>
      {door === 'teens'
        ? <TeensZone {...shared} teenBand={teenBand} setTeenBand={setTeenBand} />
        : <KidsZone {...shared} door={door} />}
      <p className="lc-small" data-testid="youth-safety">
        Safe here: no profile, no chat, no scoreboard. A grown-up at the church office can answer questions; your door choice stays on this device only.
      </p>
      {setChurchView && (
        <p className="lc-small">
          Grown-ups: the full lessons live in{' '}
          <button type="button" onClick={() => setChurchView('learn')} className={`lc-inline-link-ink ${FOCUS}`}>Learn</button>.
        </p>
      )}
    </div>
  );
}
