// =============================================================================
// InstituteStudio — the approved Institute redesign (owner-device preview)
// =============================================================================
// Darrell 2026-11-25 approved the visual design: a red/black/white/gold
// welcome banner with Senior Bishop Lloyd E. Gwin, a personalized student
// dashboard, Continue Learning, Next Up for You, photographic program cards
// and quick doors into the Institute's sections.
//
// This component is ONLY the new top of the Institute. Every existing section
// (About + disclosure, Courses, Enrollment, Students, Certificates,
// Announcements, Office) still renders through ChurchInstitute's SectionTabs
// directly beneath it, untouched; the tiles here only switch which section is
// open (onOpen). Nothing on this surface is painted — see institute-studio.js
// for where every number comes from. Every block says what it sees and what
// is missing when there is nothing to show (P15).
//
// The photograph is the original portrait already shipped for the Love Corner
// home (public/lovecorner/bishop-lloyd-e-gwin-*.jpg — a straight resize of the
// original, measured mean pixel difference ~2/255). It is cropped by CSS only;
// never retouched, regenerated or cut out.
import React, { useMemo } from 'react';
import UiIcon from '../UiIcon.jsx';
import { InstituteArt } from '../ChurchInstitute.jsx';
import { INSTITUTE_META } from '../../lib/church-institute.js';
import { PROGRAM_ART, studentStats, continueItems, nextUpCourse, firstName } from '../../lib/institute-studio.js';
import { listPlaces, placeReached } from '../../lib/learn-resume.js';
import { presentationIndex, VISIBLE_STATUSES } from '../../lib/learn-presentation/presentation.js';
import { lessonUrl } from '../../lib/lesson-links.js';
import { LIVING_LESSONS_MODULES } from '../../lib/living-lessons-class.js';
import { LITTLE_LEARNERS_MODULES } from '../../lib/little-learners-class.js';

/** A lesson's own title from the lists the Institute already carries; else its id read as words (never invented). */
const LESSON_TITLES = new Map([...(LIVING_LESSONS_MODULES || []), ...(LITTLE_LEARNERS_MODULES || [])].filter((m) => m && m.id).map((m) => [m.id, m.title]));
export function lessonTitle(lessonId) {
  if (LESSON_TITLES.get(lessonId)) return LESSON_TITLES.get(lessonId);
  const words = String(lessonId || '')
    .replace(/^[a-z]+\d+-/, '')
    .split('-')
    .filter(Boolean)
    .join(' ');
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : String(lessonId || '');
}

const BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#CFA63C]';
export const BISHOP = Object.freeze({
  name: 'Senior Bishop Lloyd E. Gwin',
  role: 'Founder & Chancellor',
  of: 'TLC Theological Institute',
  src: `${BASE}lovecorner/bishop-lloyd-e-gwin-800.jpg`,
  srcSet: `${BASE}lovecorner/bishop-lloyd-e-gwin-480.jpg 480w, ${BASE}lovecorner/bishop-lloyd-e-gwin-800.jpg 800w, ${BASE}lovecorner/bishop-lloyd-e-gwin-1200.jpg 1200w`,
});

const FEATURES = Object.freeze([
  { icon: 'bookOpen', label: 'Bible-Based Courses' },
  { icon: 'dove', label: 'Ministry Training' },
  { icon: 'users', label: 'Leadership Development' },
  { icon: 'sparkle', label: 'Certificates of Completion' },
  { icon: 'monitor', label: 'Flexible & Online' },
  { icon: 'calendar', label: 'Learn at Your Pace' },
]);

export const TILES = Object.freeze([
  { id: 'courses', icon: 'book', title: 'Course Catalog', sub: 'Browse all courses', tone: 'red' },
  { id: 'enrollment', icon: 'users', title: 'Enrollment', sub: 'Manage your courses', tone: 'gold' },
  { id: 'certificates', icon: 'sparkle', title: 'My Certificates', sub: 'View & verify', tone: 'red' },
  { id: 'students', icon: 'chart', title: 'My Progress', sub: 'Track your learning', tone: 'gold' },
  { id: 'announcements', icon: 'bell', title: 'Announcements', sub: 'Institute updates', tone: 'red' },
  { id: 'resources', icon: 'folder', title: 'Resources', sub: 'Study tools', tone: 'gold' },
]);

const art = (key) => (PROGRAM_ART[key] ? `${BASE}${PROGRAM_ART[key].src}` : null);

export default function InstituteStudio({
  programs,
  catalog = new Map(),
  mine = [],
  standing = {},
  creds = [],
  signedIn = false,
  studentName = null,
  onOpen = () => {},
  onExplore = () => {},
  places = null,
}) {
  const stats = studentStats({ mine, standing, creds });
  const name = firstName(studentName);
  const index = useMemo(() => presentationIndex(), []);
  const titleOf = (k) => (catalog.get(k) && catalog.get(k).meta && catalog.get(k).meta.title) || k;
  const saved = useMemo(() => (places != null ? places : listPlaces({ inProgress: true })), [places]);
  const programOfCourse = (k) => programs.find((p) => [...(p.courseKeys || []), ...(p.alsoKeys || [])].includes(k));
  const lookup = (courseKey, lessonId) => {
    const r = index.get(lessonId);
    const shown = r && VISIBLE_STATUSES.includes(r.status);
    const prog = programOfCourse(courseKey);
    return {
      title: shown && r.displayTitle ? r.displayTitle : lessonTitle(lessonId),
      image: shown && r.image && r.image.src ? `${BASE}${r.image.src}` : prog ? art(prog.key) : null,
    };
  };
  const going = continueItems(saved, { reached: placeReached, lookup, courseTitle: titleOf, programs });
  const next = nextUpCourse({
    mine,
    standing,
    programs,
    startedKeys: new Set(saved.map((p) => p.courseKey)),
    registered: (k) => catalog.has(k),
  });
  const nextCourse = next ? catalog.get(next.courseKey) : null;

  return (
    <div className="is-studio" data-testid="institute-studio">
      <section className="is-hero" aria-labelledby="is-hero-h">
        <div className="is-hero-text">
          <div className="is-crest-row">
            <span className="is-crest" aria-hidden="true">
              <InstituteArt />
            </span>
            <h2 id="is-hero-h" className="is-title ts-chrome-region">
              <span>TLC</span> Theological Institute
            </h2>
          </div>
          <p className="is-tagline" data-testid="institute-studio-motto">
            {INSTITUTE_META.tagline}
          </p>
          <p className="is-lede">A biblical training and learning center for believers, ministers and leaders who are called to serve.</p>
          <div className="is-cta">
            <button type="button" className={`is-btn is-btn-gold ${FOCUS}`} onClick={() => onOpen('about')} data-testid="institute-studio-explore">
              Explore Programs <span aria-hidden="true">→</span>
            </button>
            <button type="button" className={`is-btn is-btn-line ${FOCUS}`} onClick={() => onOpen('enrollment')} data-testid="institute-studio-enroll">
              Enroll Today
            </button>
          </div>
        </div>
        <figure className="is-leader" data-testid="institute-studio-leader">
          <img className="is-leader-ph" src={BISHOP.src} srcSet={BISHOP.srcSet} sizes="(min-width: 768px) 320px, 46vw" alt={`${BISHOP.name}, ${BISHOP.role}`} />
          <figcaption className="is-leader-cap">
            <b>{BISHOP.name}</b>
            <i>{BISHOP.role}</i>
            <span>{BISHOP.of}</span>
          </figcaption>
        </figure>
      </section>

      <ul className="is-feats" aria-label="What the Institute offers">
        {FEATURES.map((f) => (
          <li key={f.label}>
            <UiIcon name={f.icon} />
            <span>{f.label}</span>
          </li>
        ))}
      </ul>

      <section className="is-welcome" aria-label="My dashboard" data-testid="institute-studio-dashboard">
        <div className="is-hello">
          <span className="is-avatar" aria-hidden="true">
            {name ? name[0] : <UiIcon name="users" />}
          </span>
          <div className="min-w-0">
            <b className="is-hello-t" data-testid="institute-studio-hello">
              {name ? `Welcome back, ${name}` : signedIn ? 'Welcome back' : 'Welcome'}
            </b>
            <small>{!signedIn ? 'Sign in to see your dashboard' : stats.enrolled > 0 ? 'TLC Institute Student' : 'Not enrolled yet'}</small>
          </div>
        </div>
        <div className="is-prog" data-testid="institute-studio-progress">
          <small>My Learning Progress</small>
          {stats.progress != null ? (
            <div className="is-bar-row">
              <span
                className="is-bar"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={stats.progress}
                aria-label={`${stats.passed} of ${stats.required} required courses passed`}
              >
                <i style={{ width: `${stats.progress}%` }} />
              </span>
              <b>{stats.progress}%</b>
            </div>
          ) : (
            <p className="is-none">{signedIn ? 'Shown once you are enrolled in a program' : 'Sign in to see it'}</p>
          )}
        </div>
        <dl className="is-stats">
          <div data-testid="institute-studio-stat-enrolled">
            <dt>
              <UiIcon name="bookOpen" /> <b>{signedIn ? stats.enrolled : '—'}</b>
            </dt>
            <dd>Enrolled</dd>
          </div>
          <div data-testid="institute-studio-stat-completed">
            <dt>
              <UiIcon name="check" /> <b>{signedIn ? stats.completed : '—'}</b>
            </dt>
            <dd>Completed</dd>
          </div>
          <div data-testid="institute-studio-stat-certificates">
            <dt>
              <UiIcon name="sparkle" /> <b>{signedIn ? stats.certificates : '—'}</b>
            </dt>
            <dd>Certificates</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="is-cont-h">
        <div className="is-head">
          <h3 id="is-cont-h" className="is-h">
            <span className="is-play" aria-hidden="true">
              ▶
            </span>{' '}
            Continue Learning
          </h3>
          <button type="button" className={`is-more ${FOCUS}`} onClick={onExplore}>
            View my courses <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="is-cont">
          {going.length === 0 ? (
            <p className="is-card is-empty" data-testid="institute-studio-continue-empty">
              No Institute lesson begun on this device yet. Open any course below and your place is saved as you go.
            </p>
          ) : (
            going.map((g) => (
              <a
                key={g.lessonId}
                className={`is-card is-lesson ${FOCUS}`}
                href={lessonUrl({ courseKey: g.courseKey, lessonId: g.lessonId, course: catalog.get(g.courseKey) })}
                data-testid={`institute-studio-continue-${g.lessonId}`}
              >
                {g.image && <img src={g.image} alt="" loading="lazy" className="is-lesson-img" />}
                <span className="is-lesson-b">
                  <b>{g.title}</b>
                  <small>{g.course}</small>
                  <span className="is-bar-row">
                    <span className="is-bar" aria-hidden="true">
                      <i style={{ width: `${g.percent}%` }} />
                    </span>
                    <small>{g.percent}% reached</small>
                  </span>
                </span>
                <span className="is-go is-go-red">Continue →</span>
              </a>
            ))
          )}
          {nextCourse && (
            <a
              className={`is-card is-lesson is-next ${FOCUS}`}
              href={lessonUrl({ courseKey: next.courseKey, course: nextCourse })}
              data-testid="institute-studio-next"
            >
              {art(next.programKey) && <img src={art(next.programKey)} alt="" loading="lazy" className="is-lesson-img" />}
              <span className="is-lesson-b">
                <em>Next Up for You</em>
                <b>{titleOf(next.courseKey)}</b>
                <small>{next.why === 'required' ? `Required for ${next.programTitle}` : next.programTitle}</small>
              </span>
              <span className="is-go is-go-line">Start →</span>
            </a>
          )}
        </div>
      </section>

      <section aria-labelledby="is-prog-h">
        <div className="is-head">
          <h3 id="is-prog-h" className="is-h">
            <UiIcon name="landmark" /> Academic Programs
          </h3>
          <button type="button" className={`is-more ${FOCUS}`} onClick={() => onOpen('about')}>
            View all programs <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="is-progs">
          {programs.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`is-pcard ${FOCUS}`}
              onClick={() => onOpen('courses', p.key)}
              data-testid={`institute-studio-program-${p.key}`}
            >
              <span className="is-pimg">
                {art(p.key) && <img src={art(p.key)} alt={PROGRAM_ART[p.key].alt} loading="lazy" />}
                <b>{p.title}</b>
              </span>
              <span className="is-pbody">
                <small>{p.blurb}</small>
                <span className="is-prow">
                  <span className="is-count" data-testid={`institute-studio-program-count-${p.key}`}>
                    {p.list.length} courses
                  </span>
                  <span className="is-arrow" aria-hidden="true">
                    →
                  </span>
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <nav className="is-tiles" aria-label="Institute doors">
        {TILES.map((t) => (
          <button key={t.id} type="button" className={`is-tile ${FOCUS}`} onClick={() => onOpen(t.id)} data-testid={`institute-studio-tile-${t.id}`}>
            <span className={`is-tile-ic is-tile-${t.tone}`}>
              <UiIcon name={t.icon} />
            </span>
            <b>{t.title}</b>
            <small>{t.sub}</small>
          </button>
        ))}
      </nav>
    </div>
  );
}
