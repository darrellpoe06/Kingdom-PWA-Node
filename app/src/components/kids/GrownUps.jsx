// =============================================================================
// GrownUps — the parent's and teacher's side of the Kids Zone (DR-1508)
// =============================================================================
// Reads only what exists: the week's lesson with its REAL facilitator notes
// (every Living Lesson carries howToRun, talkingPoints and discussionPrompts),
// the signed-in account's real learner records (signed out: an honest
// sentence and no number), the device settings that exist (door, teens' band),
// Ari's child-mode rules stated plainly, the coloring book and the lesson in
// Learn. No profile, no chat with anyone, no scoreboard.
import React, { useEffect, useMemo, useState } from 'react';
import { fetchLearnerRecords } from '../../lib/learner-records-sync.js';
import { LIVING_LESSONS_MODULES } from '../../lib/living-lessons-class.js';
import { LITTLE_LEARNERS_MODULES } from '../../lib/little-learners-class.js';
import { YOUTH_DOORS, TEEN_BANDS, weeklyLesson, normalizeRecord } from '../../lib/youth-zone.js';
import { CHILD_MODE_RULES } from '../../lib/class-tutor.js';
import { lessonUrl } from '../../lib/lesson-links.js';
import { ColoringBookButton } from '../ColoringSheet.jsx';

/** The module behind a weekly pick, from the course it names. */
export function moduleFor(pick) {
  if (!pick) return null;
  const list = pick.courseKey === 'little-learners' ? LITTLE_LEARNERS_MODULES : LIVING_LESSONS_MODULES;
  return list.find((m) => m.id === pick.lessonId) || null;
}

/** The facilitator's lines, as the lesson wrote them, split on its own " | " joins. */
export function leadLines(module) {
  const f = (module && module.facilitator) || {};
  const how = String(f.howToRun || '')
    .split(' | ')
    .map((s) => s.trim())
    .filter(Boolean);
  const prompts = Array.isArray(f.discussionPrompts) ? f.discussionPrompts : [];
  return { how, prompts, points: Array.isArray(f.talkingPoints) ? f.talkingPoints : [] };
}

/** What the rows say, for a parent: counts of real records, never painted. */
export function summarize(records = []) {
  const rows = (records || []).map(normalizeRecord);
  return {
    read: rows.filter((r) => r.completedAt).length,
    passed: rows.filter((r) => r.quizPassed === true).length,
    storybooks: rows.filter((r) => r.courseKey === 'kids-storybooks' && r.completedAt).length,
  };
}

export default function GrownUps({
  door = 'kids',
  teenBand = 'youth',
  setDoor = null,
  setTeenBand = null,
  now = null,
  signedIn = false,
  fetchRecords = fetchLearnerRecords,
  setChurchView = null,
}) {
  const at = useMemo(() => now || new Date(), [now]);
  const pick = weeklyLesson(door, at);
  const mod = useMemo(() => moduleFor(pick), [pick]);
  const lines = useMemo(() => leadLines(mod), [mod]);
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
  const sum = summarize(state.records);
  const d = YOUTH_DOORS.find((x) => x.key === door) || YOUTH_DOORS[0];
  return (
    <div className="kz-grownups" data-testid="grown-ups">
      <div className="kz-gu" data-testid="grownups-lesson">
        <h3>This week with your child: {pick ? pick.title : ''}</h3>
        {mod && mod.anchor && <p>{mod.anchor.ref}</p>}
        {lines.how.length > 0 && (
          <>
            <p style={{ marginTop: '.375rem' }}>How to lead it, from the lesson's own notes:</p>
            <ul>
              {lines.how.slice(0, 4).map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </>
        )}
        {lines.prompts.length > 0 && (
          <>
            <p style={{ marginTop: '.375rem' }}>Ask together:</p>
            <ul>
              {lines.prompts.slice(0, 3).map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </>
        )}
        {!lines.how.length && !lines.prompts.length && <p>This lesson carries no facilitator notes yet; read it together in Learn.</p>}
      </div>

      <div className="kz-gu" data-testid="grownups-progress" data-read={signedIn && !state.loading && !state.error ? sum.read : ''}>
        <h3>What they did</h3>
        {!signedIn && (
          <p>
            Sign in and this shows the lessons read, quizzes passed and storybooks finished on this account, from the same records Learn keeps. Nothing is
            counted until you do.
          </p>
        )}
        {signedIn && state.loading && <p>Reading the records…</p>}
        {signedIn && !state.loading && state.error && <p>The records could not be read right now. They are safe; try again in a moment.</p>}
        {signedIn && !state.loading && !state.error && (
          <ul>
            <li>Lessons read: {sum.read}</li>
            <li>Quizzes passed: {sum.passed}</li>
            <li>Storybooks finished: {sum.storybooks}</li>
          </ul>
        )}
      </div>

      <div className="kz-gu" data-testid="grownups-settings">
        <h3>Settings on this device</h3>
        <div className="kz-set">
          <span>Door</span>
          <span>
            {YOUTH_DOORS.map((x) => (
              <button
                key={x.key}
                type="button"
                className="kz-pill kz-focus-visible"
                aria-pressed={door === x.key}
                onClick={() => setDoor && setDoor(x.key)}
                data-testid={`set-door-${x.key}`}
                style={{ marginLeft: 4 }}
              >
                {x.title} {x.range}
              </button>
            ))}
          </span>
        </div>
        {door === 'teens' && (
          <div className="kz-set">
            <span>Reading level</span>
            <span>
              {TEEN_BANDS.map((b) => (
                <button
                  key={b}
                  type="button"
                  className="kz-pill kz-focus-visible"
                  aria-pressed={teenBand === b}
                  onClick={() => setTeenBand && setTeenBand(b)}
                  data-testid={`set-band-${b}`}
                  style={{ marginLeft: 4 }}
                >
                  {b === 'youth' ? '11–14' : '15–17'}
                </button>
              ))}
            </span>
          </div>
        )}
        <div className="kz-set">
          <span>Reading band</span>
          <span className="kz-pill kz-focus-visible" style={{ cursor: 'default' }}>
            {d.band === 'child' ? 'Child' : teenBand === 'teen' ? 'Teen' : 'Youth'}
          </span>
        </div>
        <div className="kz-set">
          <span>Text size and voice</span>
          <span className="lc-small">In the app's Personalize sheet</span>
        </div>
      </div>

      <div className="kz-gu" data-testid="grownups-ari">
        <h3>Ari, the lesson helper</h3>
        <p>Ari answers only about the lesson and its verses, in child mode. The rules it carries, word for word:</p>
        <ul>
          {CHILD_MODE_RULES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p style={{ marginTop: '.375rem' }}>The chat is on the lesson screen, where you can read it.</p>
      </div>

      <div className="kz-actions kz-focus-visible">
        {mod && <ColoringBookButton modules={[mod]} title={`${pick.title} — Coloring Page`} className="kz-act orange kz-focus-visible" />}
        {pick && (
          <a className="kz-act blue kz-focus-visible" href={lessonUrl({ courseKey: pick.courseKey, lessonId: pick.lessonId })} data-testid="grownups-learn">
            Full lesson in Learn
          </a>
        )}
        {setChurchView && (
          <button type="button" className="kz-act plain kz-focus-visible" onClick={() => setChurchView('learn')}>
            All courses
          </button>
        )}
      </div>
      <p className="kz-safety">Safe here: no profile, no chat with anyone, no scoreboard. Your child's door and level stay on this device only.</p>
    </div>
  );
}
