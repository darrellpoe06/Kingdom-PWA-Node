// =============================================================================
// Lesson Experience — PRIVATE PROTOTYPE, ONE lesson only (Darrell, 2026-11-25).
// =============================================================================
// "I want the actual lesson experience to combine YouTube, a beautifully
// illustrated digital book and an audiobook... four modes: Watch, Read,
// Listen, Study... build ONE complete lesson as a private prototype for my
// approval before expanding across all 994 lessons."
//
// What this reuses, on purpose, so nothing new is invented or paid for:
//   - the SAME 150 approved cinematic images (no new art, no new video)
//   - lib/tts.js's createBrowserTTS -- the same production speech engine
//     already driving Listen/Read-to-me everywhere else in the app (no new
//     audio, no new paid narration)
//   - the lesson's OWN words, verbatim, at every reading level -- nothing
//     summarized, shortened or rewritten
//
// Gated to ONE lesson id (PROTOTYPE_LESSON_ID) and rendered only from a
// button this file itself adds nowhere near the existing Read/Listen/chip
// wiring -- LearnStudio.jsx and LearnStudioPreview.jsx's tested, deployed
// hand-off are untouched. This is additive and removable with one import.
// =============================================================================
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createBrowserTTS, segmentText } from '../../lib/tts.js';
import { motionBehavior } from '../../lib/gentle-motion.js';
import './lesson-experience.css';

const RING = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

export const PROTOTYPE_LESSON_ID = 'll338-not-with-eyeservice';

// Scoped to this ONE overlay: a crash here closes just the prototype and
// returns to the normal Learn Studio home, never the classic-Learn fallback
// (that one guards the already-shipped, tested Read/Listen path and must stay
// untouched by a brand-new, unreviewed surface).
export class LessonExperienceBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { crashed: false };
  }
  static getDerivedStateFromError() {
    return { crashed: true };
  }
  componentDidCatch(error, info) {
    console.error('Lesson Experience prototype crashed; closing it.', error, info && info.componentStack);
    this.props.onExit();
  }
  render() {
    return this.state.crashed ? null : this.props.children;
  }
}

const LEVELS = [
  { key: 'child', label: 'Child' },
  { key: 'youth', label: 'Youth' },
  { key: 'teen', label: 'Teen' },
  { key: 'adult', label: 'Adult' },
  { key: 'senior', label: 'Senior' },
];

const MODES = [
  { key: 'watch', label: 'Watch', icon: '▶' },
  { key: 'read', label: 'Read', icon: '📖' },
  { key: 'listen', label: 'Listen', icon: '🎧' },
  { key: 'study', label: 'Study', icon: '✎' },
];

const PROGRESS_KEY = (id, mode) => `poe-lesson-experience:${id}:${mode}`;

function textFor(lesson, level) {
  if (level !== 'adult' && lesson.levels && lesson.levels[level]) return lesson.levels[level];
  return lesson.lesson;
}

// The lesson's OWN structural leads ("FIRST, THE MASTER WHO WENT AWAY.",
// "SECOND, NOT WITH EYESERVICE.") are Darrell's real section markers, written
// into the text already -- recognized for display, never invented, and the
// full paragraph that follows is never shortened.
function sectionLeadOf(paragraph) {
  const m = paragraph.match(/^([A-Z][A-Z ,'-]{2,48}?\.) /);
  return m ? { lead: m[1], rest: paragraph.slice(m[0].length) } : { lead: null, rest: paragraph };
}

// A quoted verse with its own reference, e.g. `"...text..." (Colossians 3:23)`
// -- the EXACT original run of characters (quote marks, parens and all) is
// kept intact; this only wraps it in a styled callout, it never rewrites a
// single character of it.
const VERSE_RE = /"[^"]+"\s*\([^)]+\)/g;

function renderWithVerses(text, keyPrefix) {
  const out = [];
  let last = 0;
  let m;
  let i = 0;
  VERSE_RE.lastIndex = 0;
  while ((m = VERSE_RE.exec(text))) {
    if (m.index > last) out.push(<span key={`${keyPrefix}-t${i++}`}>{text.slice(last, m.index)}</span>);
    out.push(
      <span className="le-verse" key={`${keyPrefix}-v${i++}`}>
        {m[0]}
      </span>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(<span key={`${keyPrefix}-t${i}`}>{text.slice(last)}</span>);
  return out;
}

function CoverImage({ image, alt, className, animated = false }) {
  const BASE = (import.meta.env && import.meta.env.BASE_URL) || '/';
  const at = (s) => (typeof s === 'string' ? s.replace(/(^|, )learn-thumbs\//g, `$1${BASE}learn-thumbs/`) : s);
  if (!image || !image.src) return <div className={`${className} le-img--empty`} aria-hidden="true" />;
  return (
    <picture>
      {image.srcSet && image.srcSet.webp && <source type="image/webp" srcSet={at(image.srcSet.webp)} sizes="100vw" />}
      <img className={`${className}${animated ? ' le-kenburns' : ''}`} src={at(image.src)} alt={alt || ''} loading="eager" decoding="async" />
    </picture>
  );
}

function themeLines(theme) {
  if (!theme) return [];
  return (theme.match(/\b(?:ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN): [^.]*(?:\([^)]*\)[^.]*)*\./g) || [theme]).map((s) => s.trim());
}

/** Reads from `fromIdx` to the end of `segments`, by reloading the remainder
 * (the engine has no seek; this is the prototype's honest, public-API-only way
 * to jump). Stable because segmentText() re-splits the same sentence text the
 * same way every time. */
function playFrom(engine, segments, fromIdx) {
  const remainder = segments.slice(Math.max(0, fromIdx)).join(' ');
  engine.stop();
  engine.load(remainder);
  engine.play();
}

export default function LessonExperience({ lesson, record, onExit }) {
  const [mode, setMode] = useState('watch');
  const [level, setLevel] = useState('adult');
  const [status, setStatus] = useState('idle');
  const [idx, setIdx] = useState(0);
  const [boundary, setBoundary] = useState({ seg: -1, offset: 0 });
  const [resumedFrom, setResumedFrom] = useState(0);
  const engineRef = useRef(null);
  const transcriptRef = useRef(null);
  const activeLineRef = useRef(null);

  const text = useMemo(() => textFor(lesson, level), [lesson, level]);
  const segments = useMemo(() => segmentText(text), [text]);
  const paragraphs = useMemo(() => (text || '').split(/\n\n+/).filter(Boolean), [text]);

  // One engine per (lesson, level) — switching reading level restarts clean.
  useEffect(() => {
    let synth = null;
    let Utterance = null;
    try {
      synth = window.speechSynthesis;
      Utterance = window.SpeechSynthesisUtterance;
    } catch {
      /* no speech support (tests, unsupported browser) */
    }
    const engine = createBrowserTTS({
      synth,
      Utterance,
      onState: (s) => {
        setStatus(s.status);
        setIdx(s.segmentIndex);
      },
    });
    engine.onBoundary = (segIdx, charOffset) => setBoundary({ seg: segIdx, offset: charOffset });
    engine.load(text);
    engineRef.current = engine;
    try {
      const saved = Number(window.localStorage.getItem(PROGRESS_KEY(lesson.id, level)) || 0);
      if (saved > 0 && saved < segments.length) setResumedFrom(saved);
    } catch {
      /* no storage */
    }
    return () => engine.stop();
  }, [text, lesson.id, level, segments.length]);

  // Save position as we go, so leaving and coming back picks up here.
  useEffect(() => {
    try {
      window.localStorage.setItem(PROGRESS_KEY(lesson.id, level), String(idx));
    } catch {
      /* no storage */
    }
  }, [idx, lesson.id, level]);

  useEffect(() => {
    try {
      if (activeLineRef.current) activeLineRef.current.scrollIntoView({ block: 'center', behavior: motionBehavior() });
    } catch {
      /* no scrollIntoView (tests) */
    }
  }, [idx, mode]);

  const play = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (status === 'paused') {
      engine.resume();
    } else if (resumedFrom > 0) {
      playFrom(engine, segments, resumedFrom);
      setResumedFrom(0);
    } else {
      engine.play();
    }
  }, [status, resumedFrom, segments]);

  const pause = useCallback(() => engineRef.current && engineRef.current.pause(), []);
  const skip = useCallback(
    (delta) => {
      const engine = engineRef.current;
      if (!engine) return;
      playFrom(engine, segments, Math.max(0, Math.min(segments.length - 1, idx + delta)));
    },
    [segments, idx]
  );
  const jumpTo = useCallback(
    (target) => {
      const engine = engineRef.current;
      if (!engine) return;
      playFrom(engine, segments, target);
    },
    [segments]
  );

  const pct = segments.length ? Math.round((idx / segments.length) * 100) : 0;
  const isPlaying = status === 'playing';

  return (
    <div className="le-root" aria-label="Lesson Experience (prototype)">
      <header className="le-top">
        <button type="button" className={`le-back ${RING}`} onClick={onExit}>
          ‹ Back to Learn
        </button>
        <span className="le-proto-badge">PROTOTYPE — private, for review</span>
      </header>

      <h1 className="le-title">{record?.displayTitle || lesson.title}</h1>
      <p className="le-original">{lesson.title}</p>

      <nav className="le-modes" role="tablist" aria-label="Lesson mode">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={mode === m.key}
            className={`le-mode ${mode === m.key ? 'on' : ''} ${RING}`}
            onClick={() => setMode(m.key)}
          >
            <span aria-hidden="true">{m.icon}</span> {m.label}
          </button>
        ))}
      </nav>

      {mode !== 'study' && (
        <div className="le-levels">
          {LEVELS.map((l) => (
            <button key={l.key} type="button" className={`le-level ${level === l.key ? 'on' : ''} ${RING}`} onClick={() => setLevel(l.key)}>
              {l.label}
            </button>
          ))}
        </div>
      )}

      {mode === 'watch' && (
        <section className="le-watch">
          <div className="le-stage">
            <CoverImage image={record?.image} alt={record?.imageAlt} className="le-stage-img" animated />
            <div className="le-stage-scrim" aria-hidden="true" />
            <div className="le-caption">
              {boundary.seg === idx && segments[idx] ? (
                <>
                  <span className="le-said">{segments[idx].slice(0, boundary.offset)}</span>
                  <span className="le-unsaid">{segments[idx].slice(boundary.offset)}</span>
                </>
              ) : (
                <span className="le-unsaid">{segments[idx] || ''}</span>
              )}
            </div>
          </div>
          <div className="le-controls">
            <button type="button" className={`le-ctl ${RING}`} onClick={() => skip(-1)} aria-label="Previous sentence">
              ⏮
            </button>
            <button type="button" className={`le-ctl le-ctl--play ${RING}`} onClick={isPlaying ? pause : play} aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button type="button" className={`le-ctl ${RING}`} onClick={() => skip(1)} aria-label="Next sentence">
              ⏭
            </button>
            <div className="le-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="le-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="le-progress-label">
              {idx + 1} / {segments.length}
            </span>
          </div>
          {resumedFrom > 0 && status === 'idle' && <p className="le-resume-note">Resumed where you left off — tap Play to continue.</p>}
          <div className="le-transcript" ref={transcriptRef}>
            {segments.map((s, i) => (
              <p key={i} ref={i === idx ? activeLineRef : null} className={`le-tline ${i === idx ? 'on' : ''}`} onClick={() => jumpTo(i)}>
                {s}
              </p>
            ))}
          </div>
        </section>
      )}

      {mode === 'read' && (
        <section className="le-read">
          <figure className="le-read-hero">
            <CoverImage image={record?.image} alt={record?.imageAlt} className="le-read-hero-img" />
            <figcaption>{record?.thumbHeadline}</figcaption>
          </figure>
          <article className="le-book">
            {paragraphs.map((p, i) => {
              const { lead, rest } = sectionLeadOf(p);
              return (
                <p key={i} className="le-book-p">
                  {lead && <strong className="le-book-lead">{lead} </strong>}
                  {renderWithVerses(rest, `p${i}`)}
                </p>
              );
            })}
          </article>
        </section>
      )}

      {mode === 'listen' && (
        <section className="le-listen">
          <div className="le-listen-art">
            <CoverImage image={record?.image} alt={record?.imageAlt} className="le-listen-img" />
          </div>
          <p className="le-listen-now">{segments[idx] || 'Ready to begin.'}</p>
          <div className="le-controls">
            <button type="button" className={`le-ctl ${RING}`} onClick={() => skip(-1)} aria-label="Back 1 sentence">
              ⏮
            </button>
            <button type="button" className={`le-ctl le-ctl--play ${RING}`} onClick={isPlaying ? pause : play} aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button type="button" className={`le-ctl ${RING}`} onClick={() => skip(1)} aria-label="Forward 1 sentence">
              ⏭
            </button>
            <div className="le-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="le-progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
          {resumedFrom > 0 && status === 'idle' && <p className="le-resume-note">Resumed where you left off — tap Play to continue.</p>}
        </section>
      )}

      {mode === 'study' && <StudyMode lesson={lesson} />}
    </div>
  );
}

function StudyMode({ lesson }) {
  const [picked, setPicked] = useState({});
  const theme = useMemo(() => themeLines(lesson.anchor?.theme), [lesson.anchor]);
  return (
    <section className="le-study">
      <h2 className="le-study-h">The Big Idea</h2>
      <p className="le-study-bigidea">{lesson.bigIdea}</p>

      {theme.length > 0 && (
        <>
          <h2 className="le-study-h">Scripture Anchor</h2>
          <ol className="le-anchor">
            {theme.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
        </>
      )}

      <h2 className="le-study-h">Quiz</h2>
      <ol className="le-quiz">
        {(lesson.quiz?.questions || []).map((q, qi) => (
          <li key={qi} className="le-quiz-q">
            <p className="le-quiz-prompt">{q.q}</p>
            <div className="le-quiz-opts">
              {q.options.map((opt, oi) => {
                const chosen = picked[qi];
                const isChosen = chosen === oi;
                const show = chosen != null;
                const correct = oi === q.answer;
                return (
                  <button
                    key={oi}
                    type="button"
                    className={`le-quiz-opt ${show && correct ? 'correct' : ''} ${show && isChosen && !correct ? 'wrong' : ''} ${RING}`}
                    onClick={() => setPicked((p) => ({ ...p, [qi]: oi }))}
                    disabled={show}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {picked[qi] != null && <p className="le-quiz-explain">{q.explain}</p>}
          </li>
        ))}
      </ol>

      {lesson.facilitator?.discussionPrompts?.length > 0 && (
        <>
          <h2 className="le-study-h">Talk It Through</h2>
          <ul className="le-prompts">
            {lesson.facilitator.discussionPrompts.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
