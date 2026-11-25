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
import { createBrowserTTS, segmentText, RATE_STEPS } from '../../lib/tts.js';
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

// Small inline line icons (no icon library -- dependency skepticism) so the
// four mode pills read like the approved reference, not as emoji.
const ICON_PATHS = {
  watch: 'M8 5v14l11-7z',
  read: 'M3 5h7a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H3zM21 5h-7a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h7z',
  listen: 'M4 15v-3a8 8 0 0 1 16 0v3M4 15h3v5H4zM17 15h3v5h-3z',
  study: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  scripture: 'M3 5h7a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H3zM21 5h-7a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h7z',
  takeaways: 'M12 3a9 9 0 1 0 9 9M12 8a4 4 0 1 0 4 4M12 12l8-8',
  reflect: 'M12 3a7 7 0 0 0-4 12.7V19h8v-3.3A7 7 0 0 0 12 3zM10 22h4',
  practice: 'M4 20h4L19 9l-4-4L4 16z',
  notes: 'M5 3h14v18H5zM9 8h6M9 12h6M9 16h4',
  check: 'M4 12l5 5L20 6',
};
export function Icon({ name, size = 18 }) {
  return (
    <svg className="le-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d={ICON_PATHS[name]}
        fill={name === 'watch' ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const MODES = [
  { key: 'watch', label: 'Watch' },
  { key: 'read', label: 'Read' },
  { key: 'listen', label: 'Listen' },
  { key: 'study', label: 'Study' },
];

// The four speeds the reference shows room for -- the engine's own RATE_STEPS
// (lib/tts.js), the first four, so a speed tap is the real setRate, not a label.
const SPEEDS = RATE_STEPS.slice(0, 4);

// lib/tts.js documents ~15 characters of speech per second at 1x. Times shown
// from this are ESTIMATES and are always printed with a leading "~" -- the
// browser speech engine reports no clock, so we never paint an exact one.
const CHARS_PER_SEC = 15;
function clock(sec) {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// "ll338-..." -> 338: the number is in the lesson's own id, never invented.
function lessonNumberOf(id) {
  const m = /^ll(\d+)/.exec(id || '');
  return m ? Number(m[1]) : null;
}

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

function ModePills({ mode, setMode }) {
  return (
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
          <Icon name={m.key} size={16} /> {m.label}
        </button>
      ))}
    </nav>
  );
}

function LevelChips({ level, setLevel }) {
  return (
    <div className="le-levels" role="group" aria-label="Reading level">
      {LEVELS.map((l) => (
        <button
          key={l.key}
          type="button"
          aria-pressed={level === l.key}
          className={`le-level ${level === l.key ? 'on' : ''} ${RING}`}
          onClick={() => setLevel(l.key)}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

function LessonBadge({ number, className = '' }) {
  if (number == null) return null;
  return <span className={`le-badge ${className}`}>Lesson {number}</span>;
}

function Progress({ pct, label }) {
  return (
    <div className="le-progress" role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="le-progress-fill" style={{ width: `${pct}%` }} />
      <div className="le-progress-dot" style={{ left: `${pct}%` }} aria-hidden="true" />
    </div>
  );
}

const saved = {
  get(key, fallback) {
    try {
      const v = window.localStorage.getItem(key);
      return v == null ? fallback : v;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, String(value));
    } catch {
      /* no storage */
    }
  },
};

export default function LessonExperience({ lesson, record, onExit, initialMode = 'watch', initialLevel = 'adult', moreLessons = [], onOpenOther = null }) {
  const [mode, setMode] = useState(initialMode);
  const [level, setLevel] = useState(initialLevel);
  const [status, setStatus] = useState('idle');
  const [idx, setIdx] = useState(0);
  const [boundary, setBoundary] = useState({ seg: -1, offset: 0 });
  const [resumedFrom, setResumedFrom] = useState(0);
  const [rate, setRateState] = useState(1);
  const [captions, setCaptions] = useState(true);
  const [watchTab, setWatchTab] = useState('transcript');
  const [showChapters, setShowChapters] = useState(false);
  const engineRef = useRef(null);
  const stageRef = useRef(null);
  const activeLineRef = useRef(null);

  const text = useMemo(() => textFor(lesson, level), [lesson, level]);
  const segments = useMemo(() => segmentText(text), [text]);
  const paragraphs = useMemo(() => (text || '').split(/\n\n+/).filter(Boolean), [text]);
  const number = lessonNumberOf(lesson.id);
  const title = record?.displayTitle || lesson.title;

  // Estimated start time of every sentence (see CHARS_PER_SEC) at the live rate.
  const starts = useMemo(() => {
    const out = [];
    let acc = 0;
    for (const s of segments) {
      out.push(acc / (CHARS_PER_SEC * rate));
      acc += s.length + 1;
    }
    out.push(acc / (CHARS_PER_SEC * rate));
    return out;
  }, [segments, rate]);

  // Chapters = the lesson's own section leads ("FIRST, THE MASTER WHO WENT
  // AWAY."), each pointed at the sentence where it begins.
  const chapters = useMemo(
    () =>
      paragraphs
        .map((p) => sectionLeadOf(p).lead)
        .filter(Boolean)
        .map((lead) => ({ lead, at: segments.findIndex((s) => s.includes(lead)) }))
        .filter((c) => c.at >= 0),
    [paragraphs, segments]
  );

  const verses = useMemo(() => (lesson.lesson || '').match(VERSE_RE) || [], [lesson.lesson]);

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
    const resumeAt = Number(saved.get(PROGRESS_KEY(lesson.id, level), 0));
    if (resumeAt > 0 && resumeAt < segments.length) setResumedFrom(resumeAt);
    return () => engine.stop();
  }, [text, lesson.id, level, segments.length]);

  useEffect(() => saved.set(PROGRESS_KEY(lesson.id, level), idx), [idx, lesson.id, level]);

  useEffect(() => {
    try {
      if (activeLineRef.current) activeLineRef.current.scrollIntoView({ block: 'nearest', behavior: motionBehavior() });
    } catch {
      /* no scrollIntoView (tests) */
    }
  }, [idx, mode]);

  const play = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (status === 'paused') engine.resume();
    else if (resumedFrom > 0) {
      playFrom(engine, segments, resumedFrom);
      setResumedFrom(0);
    } else engine.play();
  }, [status, resumedFrom, segments]);

  const pause = useCallback(() => engineRef.current && engineRef.current.pause(), []);
  const jumpTo = useCallback(
    (target) => {
      const engine = engineRef.current;
      if (!engine) return;
      setResumedFrom(0);
      playFrom(engine, segments, Math.max(0, Math.min(segments.length - 1, target)));
    },
    [segments]
  );
  const skip = useCallback((delta) => jumpTo(idx + delta), [jumpTo, idx]);

  const cycleSpeed = useCallback(() => {
    const at = SPEEDS.findIndex((s) => s.value === rate);
    const next = SPEEDS[(at + 1) % SPEEDS.length].value;
    setRateState(next);
    const engine = engineRef.current;
    if (engine && typeof engine.setRate === 'function') engine.setRate(next);
  }, [rate]);

  const fullscreen = useCallback(() => {
    try {
      const el = stageRef.current;
      if (document.fullscreenElement) document.exitFullscreen();
      else if (el && el.requestFullscreen) el.requestFullscreen();
    } catch {
      /* fullscreen refused (iOS Safari on a div) -- nothing to do */
    }
  }, []);

  const shownIdx = resumedFrom > 0 && status === 'idle' ? resumedFrom : idx;
  const pct = segments.length ? Math.round((shownIdx / segments.length) * 100) : 0;
  const isPlaying = status === 'playing';
  const elapsed = `~${clock(starts[shownIdx] || 0)}`;
  const total = `~${clock(starts[segments.length] || 0)}`;
  const speedLabel = (SPEEDS.find((s) => s.value === rate) || SPEEDS[1]).label;
  const resumeNote = resumedFrom > 0 && status === 'idle' && <p className="le-resume-note">Resumed where you left off. Tap play to continue.</p>;

  const playBtn = (cls) => (
    <button type="button" className={`le-ctl ${cls} ${RING}`} onClick={isPlaying ? pause : play} aria-label={isPlaying ? 'Pause' : 'Play'}>
      {isPlaying ? '❚❚' : '▶'}
    </button>
  );

  const header = (
    <header className="le-top">
      <button type="button" className={`le-back ${RING}`} onClick={onExit}>
        ‹ Back to Learn
      </button>
      <span className="le-proto-badge">PROTOTYPE · private, for review</span>
    </header>
  );

  return (
    <div className={`le-root le-root--${mode}`} aria-label="Lesson Experience (prototype)">
      {header}

      {mode === 'watch' && (
        <section className="le-watch">
          <div className="le-stage" ref={stageRef}>
            <CoverImage image={record?.image} alt={record?.imageAlt} className="le-stage-img" animated />
            <div className="le-stage-scrim" aria-hidden="true" />
            <div className="le-stage-title">
              <h1 className="le-title">{title}</h1>
              <LessonBadge number={number} />
            </div>
            {captions && (isPlaying || status === 'paused') && (
              <div className="le-caption" aria-live="off">
                {boundary.seg === idx && segments[idx] ? (
                  <>
                    <span className="le-said">{segments[idx].slice(0, boundary.offset)}</span>
                    <span className="le-unsaid">{segments[idx].slice(boundary.offset)}</span>
                  </>
                ) : (
                  <span className="le-unsaid">{segments[idx] || ''}</span>
                )}
              </div>
            )}
          </div>
          <Progress pct={pct} label="Lesson progress" />
          <div className="le-playerbar">
            {playBtn('le-ctl--bar')}
            <button type="button" className={`le-ctl le-ctl--bar ${RING}`} onClick={() => skip(-1)} aria-label="Previous sentence">
              ⏮
            </button>
            <button type="button" className={`le-ctl le-ctl--bar ${RING}`} onClick={() => skip(1)} aria-label="Next sentence">
              ⏭
            </button>
            <span className="le-time">
              {elapsed} / {total}
            </span>
            <span className="le-spacer" />
            <button type="button" className={`le-chip ${RING}`} onClick={cycleSpeed} aria-label={`Speed ${speedLabel}`}>
              {speedLabel}
            </button>
            <button
              type="button"
              aria-pressed={captions}
              className={`le-chip ${captions ? 'on' : ''} ${RING}`}
              onClick={() => setCaptions((c) => !c)}
              aria-label="Captions"
            >
              CC
            </button>
            <button type="button" className={`le-chip ${RING}`} onClick={fullscreen} aria-label="Full screen">
              ⛶
            </button>
          </div>
          <p className="le-original">{lesson.title}</p>
          <ModePills mode={mode} setMode={setMode} />
          {resumeNote}
          <div className="le-subtabs" role="tablist" aria-label="Lesson details">
            {[
              ['transcript', 'Transcript'],
              ['points', 'Key Points'],
              ['scriptures', 'Scriptures'],
            ].map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={watchTab === k}
                className={`le-subtab ${watchTab === k ? 'on' : ''} ${RING}`}
                onClick={() => setWatchTab(k)}
              >
                {label}
              </button>
            ))}
          </div>
          {watchTab === 'transcript' && (
            <>
              <LevelChips level={level} setLevel={setLevel} />
              <ol className="le-transcript">
                {segments.map((s, i) => (
                  <li key={i} ref={i === idx ? activeLineRef : null} className={`le-tline ${i === idx ? 'on' : ''}`}>
                    <button type="button" className={`le-tline-btn ${RING}`} onClick={() => jumpTo(i)}>
                      <span className="le-tstamp">~{clock(starts[i])}</span>
                      <span className="le-ttext">{s}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </>
          )}
          {watchTab === 'points' && <KeyPoints lesson={lesson} />}
          {watchTab === 'scriptures' && <ScriptureList lesson={lesson} verses={verses} />}
          <MoreLessons items={moreLessons} onOpen={onOpenOther} />
        </section>
      )}

      {mode === 'read' && (
        <ReadMode
          lesson={lesson}
          record={record}
          title={title}
          number={number}
          paragraphs={paragraphs}
          level={level}
          setLevel={setLevel}
          modePills={<ModePills mode={mode} setMode={setMode} />}
        />
      )}

      {mode === 'listen' && (
        <section className="le-listen">
          <ModePills mode={mode} setMode={setMode} />
          <div className="le-listen-art">
            <CoverImage image={record?.image} alt={record?.imageAlt} className="le-listen-img" />
            <div className="le-stage-scrim" aria-hidden="true" />
            <div className="le-listen-title">
              <h1 className="le-title">{title}</h1>
              <LessonBadge number={number} />
              <div className={`le-wave ${isPlaying ? 'on' : ''}`} aria-hidden="true">
                {Array.from({ length: 28 }, (_, i) => (
                  <i key={i} style={{ animationDelay: `${(i % 7) * 0.11}s`, height: `${30 + ((i * 37) % 70)}%` }} />
                ))}
              </div>
            </div>
          </div>
          <p className="le-original">{lesson.title}</p>
          <h2 className="le-listen-h">Full Audio Lesson</h2>
          <LevelChips level={level} setLevel={setLevel} />
          <p className="le-listen-now" aria-live="polite">
            {segments[shownIdx] || 'Ready to begin.'}
          </p>
          <Progress pct={pct} label="Listening progress" />
          <div className="le-times">
            <span>{elapsed}</span>
            <span>{total}</span>
          </div>
          <div className="le-transport">
            <button type="button" className={`le-ctl ${RING}`} onClick={() => skip(-1)} aria-label="Back 1 sentence">
              ⏮
            </button>
            {playBtn('le-ctl--play')}
            <button type="button" className={`le-ctl ${RING}`} onClick={() => skip(1)} aria-label="Forward 1 sentence">
              ⏭
            </button>
          </div>
          {resumeNote}
          <div className="le-listen-tools">
            <button type="button" className={`le-tool ${RING}`} onClick={cycleSpeed}>
              <strong>{speedLabel}</strong>
              <span>Speed</span>
            </button>
            {chapters.length > 0 && (
              <button type="button" aria-expanded={showChapters} className={`le-tool ${RING}`} onClick={() => setShowChapters((v) => !v)}>
                <strong>☰</strong>
                <span>Chapters</span>
              </button>
            )}
          </div>
          {showChapters && (
            <ol className="le-chapters">
              {chapters.map((c) => (
                <li key={c.at}>
                  <button type="button" className={`le-chapter ${RING}`} onClick={() => jumpTo(c.at)}>
                    <span>{c.lead}</span>
                    <span className="le-tstamp">~{clock(starts[c.at])}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {mode === 'study' && (
        <>
          <ModePills mode={mode} setMode={setMode} />
          <StudyMode lesson={lesson} record={record} number={number} verses={verses} />
        </>
      )}
    </div>
  );
}

function KeyPoints({ lesson }) {
  return (
    <div className="le-points">
      {lesson.bigIdea && <p className="le-points-big">{lesson.bigIdea}</p>}
      {Array.isArray(lesson.benefits) && (
        <ul className="le-points-list">
          {lesson.benefits.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ScriptureList({ lesson, verses }) {
  const theme = themeLines(lesson.anchor?.theme);
  return (
    <div className="le-scrips">
      {lesson.anchor?.ref && (
        <p className="le-scrips-anchor">
          Anchor: <strong>{lesson.anchor.ref}</strong>
        </p>
      )}
      {theme.length > 0 && (
        <ol className="le-anchor">
          {theme.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ol>
      )}
      {verses.length > 0 && (
        <ul className="le-verse-list">
          {verses.map((v, i) => (
            <li key={i} className="le-verse">
              {v}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const SCALE_KEY = 'poe-lesson-experience:read-scale';
const BOOKMARK_KEY = (id) => `poe-lesson-experience:${id}:bookmark`;
const SCALES = [0.9, 1, 1.15, 1.3];

// READ — an illustrated book page: the lesson's own words, every paragraph,
// at the chosen reading level. The pager moves between the lesson's own
// paragraphs; nothing is hidden, so the whole text is always on the page.
function ReadMode({ lesson, record, title, number, paragraphs, level, setLevel, modePills }) {
  const [scaleAt, setScaleAt] = useState(() => {
    const v = Number(saved.get(SCALE_KEY, 1));
    const i = SCALES.indexOf(v);
    return i >= 0 ? i : 1;
  });
  const [page, setPage] = useState(0);
  const [mark, setMark] = useState(() => Number(saved.get(BOOKMARK_KEY(lesson.id), -1)));
  const paraRefs = useRef([]);
  const count = paragraphs.length;

  const go = useCallback(
    (to) => {
      const next = Math.max(0, Math.min(count - 1, to));
      setPage(next);
      try {
        const el = paraRefs.current[next];
        if (el) el.scrollIntoView({ block: 'start', behavior: motionBehavior() });
      } catch {
        /* no scrollIntoView (tests) */
      }
    },
    [count]
  );

  const setScale = (i) => {
    const at = Math.max(0, Math.min(SCALES.length - 1, i));
    setScaleAt(at);
    saved.set(SCALE_KEY, SCALES[at]);
  };
  const toggleMark = () => {
    const next = mark === page ? -1 : page;
    setMark(next);
    saved.set(BOOKMARK_KEY(lesson.id), next);
  };

  return (
    <section className="le-read">
      {modePills}
      <LevelChips level={level} setLevel={setLevel} />
      <div className="le-book" style={{ '--le-read-scale': SCALES[scaleAt] }}>
        <h1 className="le-book-title">{title}</h1>
        <p className="le-original le-original--book">{lesson.title}</p>
        {number != null && (
          <div className="le-book-rule">
            <span aria-hidden="true" />
            <LessonBadge number={number} className="le-badge--book" />
            <span aria-hidden="true" />
          </div>
        )}
        <figure className="le-read-hero">
          <CoverImage image={record?.image} alt={record?.imageAlt} className="le-read-hero-img" />
        </figure>
        {lesson.anchor?.ref && (
          <div className="le-wordfirst">
            <span className="le-wordfirst-k">WORD-FIRST</span>
            <span className="le-wordfirst-ref">{lesson.anchor.ref}</span>
          </div>
        )}
        <article className="le-book-text">
          {paragraphs.map((p, i) => {
            const { lead, rest } = sectionLeadOf(p);
            return (
              <React.Fragment key={i}>
                {lead && i > 0 && (
                  <div className="le-ornament" aria-hidden="true">
                    ❖
                  </div>
                )}
                <p ref={(el) => (paraRefs.current[i] = el)} className={`le-book-p ${i === 0 ? 'le-book-p--first' : ''} ${mark === i ? 'marked' : ''}`}>
                  {lead && <strong className="le-book-lead">{lead} </strong>}
                  {renderWithVerses(rest, `p${i}`)}
                </p>
                {i === 0 && lesson.bigIdea && (
                  <aside className="le-keyteach">
                    <span className="le-keyteach-k">KEY TEACHING</span>
                    <p>{lesson.bigIdea}</p>
                  </aside>
                )}
              </React.Fragment>
            );
          })}
        </article>
      </div>
      <div className="le-bookbar">
        <button type="button" className={`le-bb ${RING}`} onClick={() => setScale(scaleAt - 1)} aria-label="Smaller text" disabled={scaleAt === 0}>
          A−
        </button>
        <button
          type="button"
          className={`le-bb ${RING}`}
          onClick={() => setScale(scaleAt + 1)}
          aria-label="Larger text"
          disabled={scaleAt === SCALES.length - 1}
        >
          A+
        </button>
        <button
          type="button"
          aria-pressed={mark === page}
          className={`le-bb ${mark === page ? 'on' : ''} ${RING}`}
          onClick={toggleMark}
          aria-label="Bookmark this paragraph"
        >
          {mark === page ? '★' : '☆'}
        </button>
        {mark >= 0 && mark !== page && (
          <button type="button" className={`le-bb le-bb--text ${RING}`} onClick={() => go(mark)}>
            Go to bookmark
          </button>
        )}
        <span className="le-spacer" />
        <span className="le-bb-count">
          {page + 1} of {count}
        </span>
        <button type="button" className={`le-bb le-bb--nav ${RING}`} onClick={() => go(page - 1)} aria-label="Previous paragraph" disabled={page === 0}>
          ‹
        </button>
        <button type="button" className={`le-bb le-bb--nav ${RING}`} onClick={() => go(page + 1)} aria-label="Next paragraph" disabled={page >= count - 1}>
          ›
        </button>
      </div>
    </section>
  );
}

const NOTES_KEY = (id) => `poe-lesson-experience:${id}:notes`;

function StudySection({ icon, title, open = false, children }) {
  return (
    <details className="le-acc" open={open}>
      <summary className={`le-acc-sum ${RING}`}>
        <span className="le-acc-icon">
          <Icon name={icon} size={20} />
        </span>
        <span className="le-acc-title">{title}</span>
        <span className="le-acc-chev" aria-hidden="true">
          ⌄
        </span>
      </summary>
      <div className="le-acc-body">{children}</div>
    </details>
  );
}

// STUDY — the reference's study guide, filled only from the lesson's own
// fields: anchor + verses, big idea + benefits, discussion prompts, the
// in-app practice and the REAL quiz with its real explanations.
function StudyMode({ lesson, record, number, verses }) {
  const [picked, setPicked] = useState({});
  const [notes, setNotes] = useState(() => saved.get(NOTES_KEY(lesson.id), ''));
  const prompts = lesson.facilitator?.discussionPrompts || [];
  const questions = lesson.quiz?.questions || [];
  return (
    <section className="le-study">
      <div className="le-study-hero">
        <CoverImage image={record?.image} alt="" className="le-study-hero-img" />
        <div className="le-study-hero-scrim" aria-hidden="true" />
        <div className="le-study-hero-text">
          <h2 className="le-study-title">Study Guide</h2>
          {number != null && <p className="le-study-sub">Lesson {number}</p>}
        </div>
      </div>

      <div className="le-study-card">
        <StudySection icon="scripture" title="Scripture Focus">
          <ScriptureList lesson={lesson} verses={verses} />
        </StudySection>

        <StudySection icon="takeaways" title="Key Takeaways">
          <KeyPoints lesson={lesson} />
        </StudySection>

        {prompts.length > 0 && (
          <StudySection icon="reflect" title="Reflection Questions" open>
            <ol className="le-prompts">
              {prompts.map((p, i) => (
                <li key={i}>
                  <span className="le-num" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span>{p}</span>
                </li>
              ))}
            </ol>
          </StudySection>
        )}

        <StudySection icon="practice" title="Practice / Exercise">
          {lesson.inApp && <p className="le-practice">{lesson.inApp}</p>}
        </StudySection>

        {questions.length > 0 && (
          <StudySection icon="check" title="Check Your Understanding">
            <ol className="le-quiz">
              {questions.map((q, qi) => (
                <li key={qi} className="le-quiz-q">
                  <p className="le-quiz-prompt">{q.q}</p>
                  <div className="le-quiz-opts">
                    {q.options.map((opt, oi) => {
                      const show = picked[qi] != null;
                      const correct = oi === q.answer;
                      return (
                        <button
                          key={oi}
                          type="button"
                          className={`le-quiz-opt ${show && correct ? 'correct' : ''} ${show && picked[qi] === oi && !correct ? 'wrong' : ''} ${RING}`}
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
          </StudySection>
        )}

        <StudySection icon="notes" title="My Notes">
          <label className="le-notes-label" htmlFor={`le-notes-${lesson.id}`}>
            Saved on this device only.
          </label>
          <textarea
            id={`le-notes-${lesson.id}`}
            className="le-notes"
            rows={5}
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              saved.set(NOTES_KEY(lesson.id), e.target.value);
            }}
          />
        </StudySection>
      </div>
    </section>
  );
}

// YouTube-style "up next" queue: every available lesson in the same course,
// as a thumbnail + title row, so the whole list of options is visible at a
// glance (Darrell, 2026-11-25: "the all listed should populate like
// YouTube... so all available can be seen in a list of options"). Tapping a
// row exits this overlay and opens that lesson the normal way.
function MoreLessons({ items, onOpen }) {
  if (!items || !items.length) return null;
  return (
    <section className="le-more">
      <h2 className="le-more-h">More Lessons</h2>
      <div className="le-more-grid ts-grid-collapse">
        {items.map((r) => (
          <button key={r.lessonId} type="button" className={`le-more-card ${RING}`} onClick={() => onOpen && onOpen(r.courseKey, r.lessonId)}>
            <CoverImage image={r.image} alt={r.imageAlt} className="le-more-thumb" />
            <span className="le-more-title">{r.displayTitle}</span>
            <span className="le-more-meta">{r.courseTitle}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
