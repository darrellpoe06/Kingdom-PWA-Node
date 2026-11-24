// =============================================================================
// KidsAdventure — this week's lesson, read as a journey (DR-1508)
// =============================================================================
// The existing lesson, the existing machinery, a child's frame: the band's
// own opening in a speech bubble (never rewritten), the anchor verse from the
// hosted KJV, the age-paced plan that already exists (AgePacedLesson), the
// lesson's real quiz (QuizBlock, with the Little Learners read-aloud rule
// extended to the Kids door), Ask Ari in child mode (the same /llm/chat seam,
// honest when it is offline), and Color it (the existing coloring page). A
// pass writes the same learner record Learn writes, signed in.
//
// Darrell, 2026-11-18: "Can we also have a scroll version as an option?" The
// lesson reads two ways, remembered on the device: STEP BY STEP (the paced
// plan, one segment at a time) or SCROLL (the whole lesson on one page, the
// same segments stacked; Read to me reads it from the top).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { verseText } from '../../lib/bible-kjv.js';
import { useTextToSpeech } from '../../lib/tts.js';
import { lessonPlanForAge, bandOpening } from '../../lib/learn-framework.js';
import { askTutor } from '../../lib/class-tutor.js';
import { LIVING_LESSONS_TUTOR_META } from '../../lib/living-lessons-class.js';
import { LITTLE_LEARNERS_TUTOR_META } from '../../lib/little-learners-class.js';
import { saveLearnerRecord } from '../../lib/learner-records-sync.js';
import { lessonUrl } from '../../lib/lesson-links.js';
import { AgePacedLesson, QuizBlock } from '../ChurchLearn.jsx';
import ColoringSheet from '../ColoringSheet.jsx';
import { GuideBubble, ShotSlot, Shot, KidsIcon, AriStar, KZ_FOCUS } from './GuideArt.jsx';

/** Ari's meta for a child in the Kids Zone: child mode on, whichever course the lesson is from. */
export function kidsTutorMeta(courseKey, band = 'child') {
  const base = courseKey === 'little-learners' ? LITTLE_LEARNERS_TUTOR_META : LIVING_LESSONS_TUTOR_META;
  const who = band === 'child' ? 'a child about 6 to 10 years old' : band === 'youth' ? 'a young person about 11 to 14' : 'a teenager about 15 to 17';
  return {
    ...base,
    childMode: true,
    intro: `You are Ari, a kind, patient helper for ${who} reading this lesson in the Love Corner Kids Zone.`,
  };
}

export const LESSON_MODE_KEY = 'poetech.kids.lessonMode';
/** The way the lesson reads on this device: 'steps' or 'scroll'. */
export function readLessonMode(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  try {
    const v = storage && storage.getItem(LESSON_MODE_KEY);
    return v === 'scroll' ? 'scroll' : 'steps';
  } catch {
    return 'steps';
  }
}
export function writeLessonMode(mode, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  try {
    if (storage) storage.setItem(LESSON_MODE_KEY, mode === 'scroll' ? 'scroll' : 'steps');
  } catch {
    /* a device with no storage still reads */
  }
}
/** The words of a segment, whichever shape the plan gives it. */
export function segmentWords(seg) {
  return typeof seg === 'string' ? seg : (seg && (seg.text || seg.body)) || '';
}

/** The first reference of an anchor like "1 Thessalonians 5:21; Proverbs 25:2". */
export function firstRef(anchor) {
  return String((anchor && anchor.ref) || '')
    .split(';')[0]
    .trim();
}

/** Ask Ari, in the zone: a small chat that says plainly when Ari is resting. */
export function AriChat({ module, meta, ask = askTutor, firstQuestion = '' }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const askedFirst = useRef(false);
  const send = async (e, given = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const text = String(given != null ? given : draft).trim();
    if (!text || busy) return;
    const next = messages.concat([{ role: 'user', content: text }]);
    setMessages(next);
    setDraft('');
    setBusy(true);
    let res;
    try {
      res = await ask(module, next, { courseMeta: meta });
    } catch (err) {
      res = { ok: false, error: String(err) };
    }
    setBusy(false);
    setMessages(
      next.concat([
        {
          role: 'assistant',
          content: res && res.ok ? res.reply : 'Ari is resting right now. Ask a grown-up, or try again in a minute.',
          offline: !(res && res.ok),
        },
      ])
    );
  };
  // A question typed on the Ask Ari card (Darrell 2026-11-18: "How do they
  // ask Ari? No options?!") arrives here and is asked at once, once.
  useEffect(() => {
    if (firstQuestion && !askedFirst.current) {
      askedFirst.current = true;
      send(null, firstQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstQuestion]);
  return (
    <div className="kz-panel" data-testid="ari-chat" style={{ borderColor: 'var(--kz-violet)' }}>
      <h3>
        <AriStar className="kz-star" /> Ask Ari about this lesson
      </h3>
      <div className="kz-chat" aria-live="polite">
        {messages.length === 0 && <p className="lc-small">Ari only talks about this lesson and its verses. A grown-up can read everything here.</p>}
        {messages.map((m, i) => (
          <div key={i} className={`kz-msg ${m.role === 'user' ? 'me' : 'ari'}`} data-offline={m.offline ? 'true' : undefined}>
            {m.content}
          </div>
        ))}
        <form onSubmit={send}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask about the lesson…"
            aria-label="Ask Ari"
            data-testid="ari-input"
            maxLength={300}
          />
          <button type="submit" className={`kz-act violet ${KZ_FOCUS}`} style={{ flex: '0 0 auto' }} disabled={busy || !draft.trim()} data-testid="ari-send">
            {busy ? '…' : 'Ask'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function KidsAdventure({
  pick,
  module,
  band = 'child',
  signedIn = false,
  loadVerse = verseText,
  saveRecord = saveLearnerRecord,
  ask = askTutor,
  onBack = null,
  backLabel = '◀ Back',
  shotList = undefined,
  firstQuestion = '',
}) {
  const plan = useMemo(() => (module ? lessonPlanForAge(module, band) : null), [module, band]);
  // bandOpening returns { text, levelId, own, band }; the words are what the child reads.
  const opening = useMemo(() => {
    const o = module ? bandOpening(module, band) : null;
    return o && typeof o === 'object' ? String(o.text || '') : String(o || '');
  }, [module, band]);
  const ref = firstRef(module && module.anchor);
  const [verse, setVerse] = useState(null);
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState('');
  const [mode, setMode] = useState(() => readLessonMode());
  const scroll = mode === 'scroll';
  const pickMode = (m) => {
    setMode(m);
    writeLessonMode(m);
  };
  const tts = useTextToSpeech();
  useEffect(() => {
    let alive = true;
    setVerse(null);
    if (!ref) {
      setVerse('');
      return undefined;
    }
    Promise.resolve()
      .then(() => loadVerse(ref))
      .then((t) => {
        if (alive) setVerse(String(t || ''));
      })
      .catch(() => {
        if (alive) setVerse('');
      });
    return () => {
      alive = false;
    };
  }, [ref, loadVerse]);
  if (!module || !plan)
    return (
      <p className="lc-notice" data-testid="adventure-missing">
        This week's lesson could not be found in its course. Open Learn to read it there.
      </p>
    );
  const meta = kidsTutorMeta(pick ? pick.courseKey : module.courseKey, band);
  const record = async (fields) => {
    if (!signedIn) {
      setSaved('signed-out');
      return { skipped: 'signed-out' };
    }
    try {
      const r = await saveRecord({ lessonId: module.id, courseKey: pick ? pick.courseKey : undefined, ageBand: band, ...fields });
      setSaved('saved');
      return r;
    } catch (e) {
      setSaved('error');
      return { error: e };
    }
  };
  const segmentText = plan.segments[Math.min(step, plan.segments.length - 1)];
  const wholeLesson = plan.segments.map(segmentWords).filter(Boolean).join('\n\n');
  const speakable = scroll ? wholeLesson || opening : segmentWords(segmentText) || opening;
  return (
    <div className="kz-adventure" data-testid="kids-adventure" data-lesson={module.id} data-band={band}>
      <div className="kz-bubble-big" data-testid="adventure-opening">
        {opening || module.bigIdea}
      </div>
      {ref && (
        <div className="kz-verse" data-testid="adventure-verse">
          {verse === null
            ? 'Loading the verse from the Word…'
            : verse
              ? `"${verse}"`
              : `The words of ${ref} are not on this device yet. Open the Scripture tab once while online and they will be.`}
          <span className="kz-ref">{ref} · KJV</span>
        </div>
      )}
      <div className="kz-scene" style={{ marginTop: '.75rem' }}>
        <Shot
          id="home-hero"
          alt=""
          list={shotList}
          fallback={<ShotSlot id="home-hero" what="your guides in this week's story (a render from the collection)" />}
        />
      </div>
      <div className="kz-chips" role="radiogroup" aria-label="How to read this lesson" data-testid="adventure-mode">
        <button
          type="button"
          role="radio"
          aria-checked={!scroll}
          className={`kz-chip ${KZ_FOCUS}`}
          onClick={() => pickMode('steps')}
          data-testid="adventure-mode-steps"
        >
          Step by step
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={scroll}
          className={`kz-chip ${KZ_FOCUS}`}
          onClick={() => pickMode('scroll')}
          data-testid="adventure-mode-scroll"
        >
          Scroll the whole lesson
        </button>
      </div>
      <div className="kz-panel" style={{ borderColor: 'var(--kz-butter)' }} data-testid="adventure-plan" data-segments={plan.totalSegments} data-mode={mode}>
        <AgePacedLesson
          key={mode}
          plan={plan}
          showAll={scroll}
          onStepChange={(i) => setStep(i)}
          onSegmentComplete={(i) => {
            if (i >= plan.totalSegments - 1) record({ completedAt: new Date().toISOString() });
          }}
        />
      </div>
      <div className="kz-actions">
        <button
          type="button"
          className={`kz-act blue ${KZ_FOCUS}`}
          onClick={() => tts && tts.supported && tts.speak(speakable)}
          disabled={!(tts && tts.supported)}
          data-testid="adventure-read"
        >
          <KidsIcon name="read" /> Read to me
        </button>
        <a
          className={`kz-act plain ${KZ_FOCUS}`}
          href={lessonUrl({ courseKey: pick ? pick.courseKey : undefined, lessonId: module.id })}
          data-testid="adventure-learn"
        >
          Open in Learn
        </a>
        {onBack && (
          <button type="button" className={`kz-act plain ${KZ_FOCUS}`} onClick={onBack} data-testid="adventure-exit">
            {backLabel}
          </button>
        )}
      </div>
      <GuideBubble who="girl" shot="girl-encourage" right list={shotList}>
        You read it! Now a quick check. The answer is in what you just heard.
      </GuideBubble>
      <div className="kz-panel quiz" data-testid="adventure-quiz">
        <QuizBlock
          module={{ ...module, readOptionsAloud: band === 'child' }}
          onRecord={(id, q) => record({ quiz: { passed: q.passed, pct: q.pct, at: q.at, attempts: 1 } })}
        />
        {saved === 'signed-out' && (
          <p className="lc-small" role="status" data-testid="adventure-saved">
            Sign in and this check lights a stop on your map.
          </p>
        )}
        {saved === 'saved' && (
          <p className="lc-small" role="status" data-testid="adventure-saved">
            Saved. That stop is lit on your map.
          </p>
        )}
        {saved === 'error' && (
          <p className="lc-small" role="status" data-testid="adventure-saved">
            Your stop could not be saved right now; it will count next time.
          </p>
        )}
      </div>
      <AriChat module={module} meta={meta} ask={ask} firstQuestion={firstQuestion} />
      <ColoringSheet module={module} signedIn={signedIn} />
    </div>
  );
}
