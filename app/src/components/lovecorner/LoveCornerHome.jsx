// =============================================================================
// LoveCornerHome — the top of the Church home: the Love Corner's front door
// =============================================================================
// The redesign (docs/99-session-notes/2026-11-12-the-love-corner-redesign-
// mockup-and-plan.md; the mockup Darrell approved the same day: "Perfect keep
// going"). Mounted by ChurchHome ABOVE its existing sections, which stay as
// they were; everything here is a door to a tab or a section that already
// exists. Nothing is removed, renamed or merged (the brief's §3).
//
// REALITY-TRACE (P15/P16):
//   • The emblem and Bishop Gwin's photograph are the REAL files he attached
//     2026-11-12 (public/lovecorner/*), never generated.
//   • Live / next-service state is lib/church-live.js liveStatus over the
//     church record's own published schedule — the same gate the pinned
//     LiveWorshipBar uses, so the two never disagree.
//   • The feature cards and the week strip are lib/home-week.js over that
//     same record; announced events are filtered to the future; when none
//     remain the card says so (never an invented event).
//   • The course count is LEARN_CATALOG.length; the ministry count is the
//     registry's length. No number here is typed.
//   • Progress is never painted: a signed-out viewer is invited to sign in; a
//     signed-in viewer's progress lives in Learn, where it is read from rows.
// PATTERNS KEPT: rem text so large print scales it, the display title capped
// (UX-PATTERNS 2b); 36px+ targets with focus rings (2g); content opens in
// place — a door sets state, the screen never flies (2e; motionBehavior for
// the one user-invited top scroll); reduced motion respected (the carousel
// never auto-advances).
import React, { useMemo } from 'react';
import UiIcon from '../UiIcon.jsx';
import { InstituteArt } from '../ChurchInstitute.jsx';
import { resolveChurch } from '../../lib/resolve-church.js';
import { liveStatus } from '../../lib/church-live.js';
import { featureCards, weekStrip, todayLine, nextService } from '../../lib/home-week.js';
import { requestChurchHomeSection } from '../../lib/church-home-section.js';
import { LEARN_CATALOG } from '../../lib/learn-catalog.js';
import { CHURCH_MINISTRIES } from '../../lib/church-ministries.js';
import { INSTITUTE_META } from '../../lib/church-institute.js';
import { motionBehavior } from '../../lib/gentle-motion.js';

export const LOVE_CORNER_ASSETS = Object.freeze({
  // The Love Corner Experience seal and Bishop Gwin's portrait, attached by
  // Darrell 2026-11-12 and saved at web sizes (no generation, no retouching).
  logo: '/lovecorner/love-corner-experience-logo-160.png',
  logo512: '/lovecorner/love-corner-experience-logo-512.png',
  bishop: '/lovecorner/bishop-lloyd-e-gwin-480.jpg',
  bishopFull: '/lovecorner/bishop-lloyd-e-gwin-1200.jpg',
});

export const BISHOP = Object.freeze({ name: 'Bishop Lloyd E. Gwin', role: 'Senior Pastor' });

const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';

/** The eight quick-access doors (brief §2). Each opens a tab or a section that exists today. */
export const QUICK_DOORS = Object.freeze([
  { key: 'watch', words: 'Watch Live', icon: 'monitor', sub: 'home', section: 'worship', tone: 'gold' },
  { key: 'word', words: 'The Word', icon: 'bookOpen', sub: 'pulpit', section: null },
  { key: 'ministries', words: 'Ministries', icon: 'users', sub: 'ministries', section: null },
  { key: 'events', words: 'Events', icon: 'calendar', sub: 'home', section: 'times' },
  { key: 'give', words: 'Give', icon: 'heart', sub: 'home', section: 'give', tone: 'heart' },
  { key: 'prayer', words: 'Prayer', icon: 'dove', sub: 'home', section: 'prayer' },
  { key: 'youth', words: 'Youth Zone', icon: 'sparkle', sub: 'engagement', section: null, tone: 'gold' },
  { key: 'connect', words: 'Connect', icon: 'chat', sub: 'home', section: 'about' },
]);

/** The four ministry groups on the homepage, each a door into the registry's directory. */
export const MINISTRY_GROUPS = Object.freeze([
  { key: 'music', title: 'Music & Worship', caption: 'Choir · Band · Rehearsals', sub: 'choir' },
  { key: 'transport', title: 'Transportation', caption: 'Bus Ministry · Request a ride', sub: 'bus' },
  { key: 'youth', title: 'Children & Youth', caption: "Children's · Youth · College", sub: 'ministries' },
  { key: 'life', title: 'Church Life', caption: 'Hospitality · Outreach · Prayer · Care', sub: 'ministries' },
]);

export default function LoveCornerHome({ church = null, setChurchView = null, signedIn = false, onSignIn = null, now = null }) {
  const c = resolveChurch(church);
  const at = useMemo(() => now || new Date(), [now]);
  const status = useMemo(() => liveStatus(c.services || [], at), [c.services, at]);
  const next = useMemo(() => nextService(c.services || [], at), [c.services, at]);
  const cards = useMemo(
    () => featureCards({ services: c.services || [], announcedEvents: c.announcedEvents || [], now: at }),
    [c.services, c.announcedEvents, at]
  );
  const week = useMemo(() => weekStrip(c.services || [], at), [c.services, at]);
  const today = useMemo(() => todayLine(c.services || [], at), [c.services, at]);
  const courseCount = Array.isArray(LEARN_CATALOG) ? LEARN_CATALOG.length : 0;
  const ministryCount = Array.isArray(CHURCH_MINISTRIES) ? CHURCH_MINISTRIES.length : 0;

  // A door: a sub-tab (the shell mounts it) and, for the Church home, the
  // section to show. The home's strip is right below this component, so an
  // in-place section change is the still-screen open (2e); a different tab
  // is a view change, an instant cut.
  const open = (sub, section = null) => {
    if (sub === 'home') {
      if (section) requestChurchHomeSection(section);
      return;
    }
    if (setChurchView) setChurchView(sub);
    try {
      window.scrollTo({ top: 0, behavior: motionBehavior() });
    } catch {
      /* no window */
    }
  };

  const watchLabel = status.live && status.current ? `Live now · ${status.current.label}` : 'Watch · latest message';
  const nextLine = status.live
    ? 'We are live. Join us in the sanctuary or right here.'
    : next
      ? `Next: ${next.service.label} · ${next.today ? 'today' : next.dayName} ${next.service.time}`
      : 'Service times are below.';

  return (
    <div className="lc-home" data-testid="lovecorner-home">
      {/* HERO */}
      <section className="lc-band lc-band-hero" aria-labelledby="lc-hero-h">
        <div className="lc-brandrow">
          <img
            src={LOVE_CORNER_ASSETS.logo}
            width="40"
            height="40"
            alt="The Love Corner Experience seal: a gold cross and the letters C L G over a red heart, with a dove"
            className="lc-seal"
          />
          <div className="lc-brand-t ts-chrome-region">
            <b>The Love Corner</b>
            <span>
              {c.name}
              {c.address ? ' · Champaign, IL' : ''}
            </span>
          </div>
          {!signedIn && onSignIn && (
            <button type="button" onClick={onSignIn} className={`lc-acct ${FOCUS}`} data-testid="lc-sign-in">
              Sign in
            </button>
          )}
        </div>
        <div className="lc-hero">
          <div className="min-w-0">
            <h2 id="lc-hero-h" className="lc-h1 ts-chrome-region">
              Welcome home.
              <br />
              <em>Where Love Lives.</em>
            </h2>
            <p className="lc-band-p">You belong here. Worship with us, learn the Word all week, and find your place in the house.</p>
          </div>
          <figure className="lc-bishop">
            <img src={LOVE_CORNER_ASSETS.bishop} width="104" height="104" alt={`${BISHOP.name}, ${BISHOP.role}`} className="lc-bishop-ph" loading="eager" />
            <figcaption>
              <b>{BISHOP.name}</b>
              {BISHOP.role}
            </figcaption>
          </figure>
        </div>
        <div className="lc-cta">
          <button
            type="button"
            onClick={() => open('home', 'worship')}
            className={`lc-btn lc-btn-gold ${FOCUS}`}
            data-testid="lc-watch"
            data-live={status.live ? 'true' : 'false'}
          >
            <i className={`lc-live-dot${status.live ? ' lc-live-on' : ''}`} aria-hidden="true" />
            {watchLabel}
          </button>
          <button type="button" onClick={() => open('home', 'about')} className={`lc-btn lc-btn-ghost ${FOCUS}`}>
            Plan a visit
          </button>
        </div>
        <p className="lc-next" data-testid="lc-next">
          {nextLine}
        </p>
        <p className="lc-visitor">
          First time here?{' '}
          <button type="button" onClick={() => open('home', 'about')} className={`lc-inline-link ${FOCUS}`}>
            We saved you a seat. See what to expect →
          </button>
        </p>
      </section>

      {/* ROTATING FEATURE — swiped by the reader, never auto-advanced */}
      <div className="lc-feature" role="region" aria-label="This week at The Love Corner">
        <div className="lc-feat-track" data-testid="lc-feature-cards">
          {cards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => open(card.open.sub, card.open.section)}
              className={`lc-feat ${FOCUS}`}
              data-testid={`lc-feature-${card.id}`}
            >
              <span className="lc-eyebrow">{card.kicker}</span>
              <b className="lc-feat-t">{card.title}</b>
              <span className="lc-p">{card.body}</span>
            </button>
          ))}
        </div>
      </div>

      {/* QUICK ACCESS */}
      <section className="lc-sec" aria-labelledby="lc-qa-h">
        <div className="lc-sec-h">
          <h3 id="lc-qa-h" className="lc-h2">
            Where do you want to go?
          </h3>
        </div>
        <nav className="lc-quick" aria-label="Quick access">
          {QUICK_DOORS.map((d) => (
            <button key={d.key} type="button" onClick={() => open(d.sub, d.section)} className={`lc-q ${FOCUS}`} data-testid={`lc-quick-${d.key}`}>
              <span className={`lc-q-ic${d.tone === 'gold' ? ' lc-q-gold' : ''}${d.tone === 'heart' ? ' lc-q-heart' : ''}`} aria-hidden="true">
                <UiIcon name={d.icon} />
              </span>
              <span>{d.words}</span>
            </button>
          ))}
        </nav>
      </section>

      {/* THIS WEEK */}
      <section className="lc-sec" aria-labelledby="lc-wk-h">
        <div className="lc-sec-h">
          <h3 id="lc-wk-h" className="lc-h2">
            This week
          </h3>
          <button type="button" onClick={() => open('program')} className={`lc-link ${FOCUS}`}>
            Order of Service →
          </button>
        </div>
        <ol className="lc-week" aria-label="Service days this week">
          {week.map((d) => (
            <li
              key={d.day}
              className={`lc-day${d.services.length ? ' lc-day-svc' : ''}${d.today ? ' lc-day-today' : ''}`}
              aria-current={d.today ? 'date' : undefined}
              title={d.services.length ? `${d.name}: ${d.services.join(', ')}` : d.name}
            >
              <span aria-hidden="true">{d.letter}</span>
              <span className="sr-only">
                {d.name}
                {d.services.length ? `: ${d.services.join(', ')}` : ''}
              </span>
            </li>
          ))}
        </ol>
        <div className="lc-card" data-testid="lc-today">
          <b className="lc-h3">{today.heading}</b>
          <p className="lc-p">{today.body}</p>
        </div>
      </section>

      {/* THE WORD — LEARNING ZONE */}
      <section className="lc-sec" aria-labelledby="lc-lz-h">
        <div className="lc-sec-h">
          <h3 id="lc-lz-h" className="lc-h2">
            The Word · Learning Zone
          </h3>
          <button type="button" onClick={() => open('learn')} className={`lc-link ${FOCUS}`}>
            All courses →
          </button>
        </div>
        <div className="lc-lz">
          <b className="lc-h3">Come back every day. The Word is here all week.</b>
          <p className="lc-p">
            Lessons, Scripture study, quizzes and memory verses, at the depth that fits you: every lesson carries its child, youth, teen, adult and senior
            reading.
          </p>
          <div className="lc-tiles">
            <button type="button" onClick={() => open('scripture')} className={`lc-tile ${FOCUS}`}>
              <b>Today's reading</b>
              <small>The Scripture reader, read aloud</small>
            </button>
            <button type="button" onClick={() => open('learn')} className={`lc-tile ${FOCUS}`}>
              <b>Bible lessons</b>
              <small>{courseCount} courses, by age and depth</small>
            </button>
            <button type="button" onClick={() => open('engagement')} className={`lc-tile ${FOCUS}`}>
              <b>Trivia &amp; challenges</b>
              <small>This week's Bible trivia</small>
            </button>
            <button type="button" onClick={() => open('pulpit')} className={`lc-tile ${FOCUS}`}>
              <b>Sermon study</b>
              <small>The Word, from this week's message</small>
            </button>
          </div>
          {!signedIn && <p className="lc-small lc-mt">Sign in to keep your place and your progress across devices.</p>}
        </div>
      </section>

      {/* YOUTH ZONE — opens the trivia that exists today; the kids and teens surface is Phase 2 */}
      <section className="lc-sec" aria-labelledby="lc-yz-h">
        <div className="lc-sec-h">
          <h3 id="lc-yz-h" className="lc-h2">
            Youth Zone
          </h3>
        </div>
        <button type="button" onClick={() => open('engagement')} className={`lc-yz ${FOCUS}`} data-testid="lc-youth">
          <b className="lc-h3">Play. Learn. Grow.</b>
          <span className="lc-band-p">Bible trivia this week, and every lesson in Learn has a kids and a teens reading. Pick yours inside any lesson.</span>
          <span className="lc-doors">
            <span className="lc-door lc-door-gold">
              <b>Kids 6–10</b>
              <small>Short bursts, pictures, quick wins</small>
            </span>
            <span className="lc-door">
              <b>Teens 11–17</b>
              <small>Real questions, real challenges</small>
            </span>
          </span>
        </button>
      </section>

      {/* MINISTRIES */}
      <section className="lc-sec" aria-labelledby="lc-mn-h">
        <div className="lc-sec-h">
          <h3 id="lc-mn-h" className="lc-h2">
            Ministries
          </h3>
          <button type="button" onClick={() => open('ministries')} className={`lc-link ${FOCUS}`}>
            All {ministryCount} →
          </button>
        </div>
        <div className="lc-mins">
          {MINISTRY_GROUPS.map((g) => (
            <button key={g.key} type="button" onClick={() => open(g.sub)} className={`lc-min ${FOCUS}`} data-testid={`lc-ministry-${g.key}`}>
              <i className="lc-min-bar" aria-hidden="true" />
              <b>{g.title}</b>
              <small>{g.caption}</small>
            </button>
          ))}
        </div>
      </section>

      {/* TLC THEOLOGICAL INSTITUTE — the featured card, its own door (Darrell 2026-11-12) */}
      <section className="lc-sec" aria-labelledby="lc-in-h">
        <div className="lc-sec-h">
          <h3 id="lc-in-h" className="lc-h2">
            A major educational ministry
          </h3>
        </div>
        <div className="lc-inst-card" data-testid="lc-institute-card">
          <div className="lc-inst-art-band" aria-hidden="true">
            <InstituteArt />
          </div>
          <div className="lc-inst-body">
            <span className="lc-eyebrow lc-eyebrow-gold">{INSTITUTE_META.of}</span>
            <b className="lc-inst-title">{INSTITUTE_META.name}</b>
            <span className="lc-inst-tag">{INSTITUTE_META.tagline}</span>
            <span className="lc-tracks">
              <span>Biblical Studies</span>
              <span>Ministry Leadership</span>
              <span>Christian Education</span>
            </span>
            <span className="lc-inst-btns">
              <button type="button" onClick={() => open('institute')} className={`lc-btn lc-btn-gold ${FOCUS}`} data-testid="lc-institute-explore">
                Explore the Institute
              </button>
              <button type="button" onClick={() => open('institute')} className={`lc-btn lc-btn-red ${FOCUS}`} data-testid="lc-institute-courses">
                View Courses
              </button>
            </span>
            <small className="lc-small lc-mt">{INSTITUTE_META.credentialNote}</small>
          </div>
        </div>
      </section>
    </div>
  );
}
