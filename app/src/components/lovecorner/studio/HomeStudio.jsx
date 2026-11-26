// =============================================================================
// HomeStudio — the redesigned Love Corner homepage (private owner preview)
// =============================================================================
// Built from the mockup Darrell approved as the DESIGN DIRECTION (2026-11-26).
// A visual and navigational redesign only: every control is a door to a place
// that exists today, and every number, name, date, picture and video on it is
// read from the church's own record, its website digest, its YouTube channel's
// feed or this device's saved lesson places. The mockup's words (its sermon
// titles, event names and guest speaker) are NOT data and appear nowhere.
//
// REALITY-TRACE (P15/P16):
//   • Bishop Gwin's photograph is the real file he attached (public/lovecorner),
//     never retouched; his title is Senior Pastor (BISHOP in LoveCornerHome).
//   • Watch Live / Latest Message: lib/church-live.js liveStatus over the
//     church record's own published schedule, the same gate the pinned live
//     bar uses; its destination is the home's Worship section, as before.
//   • Watch & Be Inspired: the channel's own feed (ChurchHome already reads it
//     through /api/church-recent and hands it down; no second request). A tap
//     plays through the shell's mini-player, exactly like Past sermons.
//   • Grow in the Word: lib/learn-resume saved places on this device, resolved
//     against LEARN_CATALOG. No place, no progress line; nothing is painted.
//   • Happening: church record's announced events still ahead + the website's
//     current-event flyers (lib/church-site.js digest). "View all events" is
//     the home's Times section: the complete calendar, every flyer, the office.
//   • Church Office: the digest's real calendar / letter / flyers, moved into
//     the home's Church Office section (ChurchOfficeBoard + the archive).
// PATTERNS KEPT: rem type so large print scales it, 48px targets with focus
// rings, content opens in place (a door sets state; the screen never flies),
// reduced motion respected (the rail never auto-advances).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import UiIcon from '../../UiIcon.jsx';
import { FullPicture } from '../ChurchOfficeBoard.jsx';
import { LOVE_CORNER_ASSETS, BISHOP } from '../LoveCornerHome.jsx';
import { resolveChurch } from '../../../lib/resolve-church.js';
import { liveStatus } from '../../../lib/church-live.js';
import { nextService, featureCards, todayLine } from '../../../lib/home-week.js';
import { requestChurchHomeSection } from '../../../lib/church-home-section.js';
import { LEARN_CATALOG } from '../../../lib/learn-catalog.js';
import { INSTITUTE_META } from '../../../lib/church-institute.js';
import { listPlaces, placeIsFinished, placeWhere, placeAgo } from '../../../lib/learn-resume.js';
import { motionBehavior } from '../../../lib/gentle-motion.js';
import { digestHasNews } from '../../../lib/church-site.js';
import { STUDIO_QUICK, EXPLORE_CARDS, hqThumb, messageCards, messageDate, happeningItems, continueLearning, setHomeStudio } from '../../../lib/home-studio.js';
import './home-studio.css';

const BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
const KEY_ART = `${BASE}lovecorner/kids/bible-adventures-key-art.jpg`;
const WORD_ART = `${BASE}learn-thumbs/topics/faith/w640.webp`; // already-shipped lesson photography (nothing generated or bought)
const INSTITUTE_ART = `${BASE}learn-thumbs/handed-forward/succ2-read-before-you-rule/w640.webp`;
const EVENT_ART = `${BASE}learn-thumbs/topics/faith/w1280.webp`;
const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';

const courseTitleOf = (key) => {
  const entry = Array.isArray(LEARN_CATALOG) ? LEARN_CATALOG.find((c) => c && c.key === key) : null;
  return (entry && entry.meta && entry.meta.title) || '';
};

export default function HomeStudio({ church = null, setChurchView = null, now = null, office = null, recentVids = [], onPlay = null }) {
  const c = resolveChurch(church);
  const at = useMemo(() => now || new Date(), [now]);
  const status = useMemo(() => liveStatus(c.services || [], at), [c.services, at]);
  const next = useMemo(() => nextService(c.services || [], at), [c.services, at]);
  const [picture, setPicture] = useState(null);
  const closeRef = useRef(null);
  useEffect(() => {
    if (picture && closeRef.current) closeRef.current.focus();
  }, [picture]);

  // A door: a church tab (the shell mounts it) or a section of this home, opened in place.
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

  const nextLine = status.live
    ? 'We are live. Join us in the sanctuary or right here.'
    : next
      ? `Next: ${next.service.label} · ${next.today ? 'today' : next.dayName} ${next.service.time}`
      : 'Service times are in Events.';

  const { latest, more } = useMemo(() => messageCards(recentVids, { limit: 5 }), [recentVids]);
  const playLatest = () => {
    if (status.live || !latest || !onPlay) open('home', 'worship');
    else onPlay(latest);
  };

  const { items: happening, total: happeningTotal } = useMemo(
    () => happeningItems({ office, announcedEvents: c.announcedEvents || [], now: at, limit: 3 }),
    [office, c.announcedEvents, at]
  );

  const learn = useMemo(() => {
    let places = [];
    let finished = 0;
    try {
      places = listPlaces({ inProgress: true });
      finished = listPlaces().filter(placeIsFinished).length;
    } catch {
      /* no storage: nothing painted */
    }
    return continueLearning({ places, finished, titleOf: courseTitleOf, where: placeWhere, ago: placeAgo });
  }, []);

  const officeFacts = [office && office.calendar && `${office.calendar.label} calendar`, office && office.letter && office.letter.label, office && office.events && office.events.flyers.length > 0 && `${office.events.flyers.length} current ${office.events.flyers.length === 1 ? 'flyer' : 'flyers'}`].filter(Boolean);
  // What the current homepage's feature cards and "today" line said, kept as the first cards of the Explore rail (nothing dropped).
  const week = useMemo(
    () => [
      ...featureCards({ services: c.services || [], announcedEvents: c.announcedEvents || [], office, now: at }).filter((f) => f.id !== 'visit'),
      { id: 'today', kicker: 'Today', title: todayLine(c.services || [], at).heading, body: todayLine(c.services || [], at).body, open: { sub: 'home', section: 'times' } },
    ],
    [c.services, c.announcedEvents, office, at]
  );
  const personalize = () => {
    try {
      window.dispatchEvent(new CustomEvent('lovecorner:personalize'));
    } catch {
      /* no window */
    }
  };
  const Chevron = () => (
    <span aria-hidden="true" className="hs-chev">
      ›
    </span>
  );

  return (
    <div className="hs" data-testid="home-studio">
      {/* 1. WELCOME HOME */}
      <section className="hs-hero" aria-labelledby="hs-hero-h" data-testid="hs-hero">
        <figure className="hs-bishop">
          <img src={LOVE_CORNER_ASSETS.bishopFull} alt={`${BISHOP.name}, ${BISHOP.role}`} loading="eager" data-testid="hs-bishop-photo" />
          <figcaption className="hs-plaque" data-testid="hs-plaque">
            <b>{BISHOP.name}</b>
            <span>{BISHOP.role}</span>
          </figcaption>
        </figure>
        <div className="hs-hero-words">
          <h2 id="hs-hero-h" className="hs-h1">
            Welcome Home
            <em>Where Love Lives</em>
          </h2>
          <p className="hs-tag">Worship · Learn · Grow · Belong</p>
          <div className="hs-cta">
            <button type="button" onClick={() => open('home', 'worship')} className={`hs-btn hs-btn-red ${FOCUS}`} data-testid="hs-watch" data-live={status.live ? 'true' : 'false'}>
              <span className="hs-playdot" aria-hidden="true">▶</span>
              {status.live ? 'Watch Live' : 'Watch Latest Message'}
            </button>
            <button type="button" onClick={() => open('home', 'about')} className={`hs-btn hs-btn-gold ${FOCUS}`} data-testid="hs-visit">
              <UiIcon name="pin" />
              Plan a Visit
            </button>
          </div>
        </div>
      </section>
      <p className="hs-next" data-testid="hs-next">
        {nextLine}
      </p>

      {/* 2. QUICK NAVIGATION: one swipeable row */}
      <nav className="hs-quick" aria-label="Quick navigation" data-testid="hs-quick">
        {STUDIO_QUICK.map((d) => (
          <button key={d.key} type="button" onClick={() => open(d.sub, d.section)} className={`hs-q ${FOCUS}`} data-testid={`hs-quick-${d.key}`}>
            <span className="hs-q-ic" aria-hidden="true">
              <UiIcon name={d.icon} />
            </span>
            <span>{d.words}</span>
          </button>
        ))}
      </nav>

      {/* CUSTOMIZE: themes, text size, read aloud, accessibility: the same sheet as before */}
      <button type="button" onClick={personalize} className={`hs-cust ${FOCUS}`} data-testid="hs-customize">
        <UiIcon name="palette" />
        <b>Customize Your App</b>
        <span className="hs-cust-sub">Themes · Text Size · Read Aloud · Accessibility</span>
        <Chevron />
      </button>

      {/* 3. KIDS & YOUTH ZONE: the existing artwork, whole */}
      <section className="hs-adv" aria-labelledby="hs-adv-h" data-testid="hs-kids">
        <img className="hs-adv-art" src={KEY_ART} alt="The Love Corner Bible Adventures: two children with their Bibles, ready for the adventure" />
        <div className="hs-adv-body">
          <h3 id="hs-adv-h" className="hs-adv-h">
            Kids &amp; Youth Zone
          </h3>
          <p className="hs-adv-p">Little Ones 3–6 · Kids 6–10 · Teens 11–17</p>
          <button type="button" onClick={() => open('youth')} className={`hs-btn hs-btn-gold hs-btn-sm ${FOCUS}`} data-testid="hs-kids-go">
            Explore Now →
          </button>
        </div>
      </section>

      {/* 4. WATCH & BE INSPIRED */}
      <section className="hs-sec" aria-labelledby="hs-watch-h" data-testid="hs-watch-section">
        <div className="hs-sec-h">
          <h3 id="hs-watch-h" className="hs-h2">
            Watch &amp; Be Inspired
          </h3>
          <button type="button" onClick={() => open('home', 'worship')} className={`hs-link ${FOCUS}`} data-testid="hs-more-messages">
            More Messages →
          </button>
        </div>
        {latest ? (
          <div className="hs-rail" role="region" aria-label="Latest and recent messages, swipe for more" data-testid="hs-rail">
            {[latest, ...more].map((v, i) => (
              <button
                key={v.videoId}
                type="button"
                onClick={i === 0 ? playLatest : () => (onPlay ? onPlay(v) : open('home', 'worship'))}
                className={`hs-cine ${FOCUS}`}
                data-testid={i === 0 ? 'hs-latest' : `hs-msg-${v.videoId}`}
                aria-label={`${i === 0 ? (status.live ? 'Watch live' : 'Play the latest message') : 'Play'}: ${v.title || 'Message'}`}
              >
                <span className="hs-cine-pic">
                  <img src={v.thumbnail || hqThumb(v.videoId)} alt="" loading="eager" />
                  {i === 0 && <span className="hs-cine-k">{status.live ? 'Live now' : 'Latest'}</span>}
                  {messageDate(v.published) && <small className="hs-cine-d">{messageDate(v.published)}</small>}
                  <span className="hs-play" aria-hidden="true">
                    ▶
                  </span>
                </span>
                <span className="hs-cine-t">{v.title || 'Message'}</span>
              </button>
            ))}
          </div>
        ) : (
          <button type="button" onClick={() => open('home', 'worship')} className={`hs-empty ${FOCUS}`} data-testid="hs-latest-empty">
            <b>Latest message</b>
            <span>The channel&rsquo;s recordings did not come back just now. Open Messages to watch, or find every service on the church&rsquo;s YouTube channel.</span>
          </button>
        )}
      </section>

      {/* 5. GROW IN THE WORD */}
      <section className="hs-sec" aria-labelledby="hs-grow-h" data-testid="hs-grow">
        <div className="hs-sec-h">
          <h3 id="hs-grow-h" className="hs-h2">
            Grow in the Word
          </h3>
        </div>
        <div className="hs-rail hs-rail-2">
          <button type="button" onClick={() => open('learn')} className={`hs-gcard ${FOCUS}`} data-testid="hs-learn">
            <span className="hs-gart">
              <img src={WORD_ART} alt="" loading="lazy" />
            </span>
            <span className="hs-gbody">
              <b className="hs-h3">{learn.has ? 'Continue Learning' : 'The Word'}</b>
              {learn.has ? (
                <span className="hs-gsub" data-testid="hs-learn-progress">
                  {learn.title} · {learn.where}
                  {learn.ago ? ` · ${learn.ago}` : ''}
                </span>
              ) : (
                <span className="hs-gsub">Bible lessons · Study plans · Quizzes · Memory verses</span>
              )}
              {learn.finished > 0 && <span className="hs-gsub" data-testid="hs-learn-finished">{`${learn.finished} ${learn.finished === 1 ? 'lesson' : 'lessons'} finished on this device`}</span>}
            </span>
            <Chevron />
          </button>
          <button type="button" onClick={() => open('institute')} className={`hs-gcard ${FOCUS}`} data-testid="hs-institute">
            <span className="hs-gart">
              <img src={INSTITUTE_ART} alt="" loading="lazy" />
            </span>
            <span className="hs-gbody">
              <b className="hs-h3">{INSTITUTE_META.name}</b>
              <span className="hs-gsub">{INSTITUTE_META.tagline}</span>
            </span>
            <Chevron />
          </button>
        </div>
      </section>

      {/* 6. HAPPENING AT THE LOVE CORNER */}
      <section className="hs-sec" aria-labelledby="hs-ev-h" data-testid="hs-happening">
        <div className="hs-sec-h">
          <h3 id="hs-ev-h" className="hs-h2">
            Happening at The Love Corner
          </h3>
          <button type="button" onClick={() => open('home', 'times')} className={`hs-link ${FOCUS}`} data-testid="hs-view-all-events">
            {happeningTotal > happening.length ? `View All ${happeningTotal} Events →` : 'View All Events →'}
          </button>
        </div>
        {happening.length > 0 ? (
          <div className="hs-rail" role="region" aria-label="Events, swipe for more" data-testid="hs-events">
            {happening.map((e) => (
              <button key={e.id} type="button" className={`hs-cine hs-cine-ev ${FOCUS}`} data-testid="hs-event" onClick={() => (e.flyer ? setPicture(e.flyer) : open('home', 'times'))} aria-label={e.flyer ? `${e.name}: open the flyer` : `${e.name}: open events`}>
                <span className="hs-cine-pic">
                  <img src={e.src || EVENT_ART} alt="" loading="eager" />
                  {e.when && <small className="hs-cine-d hs-cine-chip">{e.when}</small>}
                </span>
                <span className="hs-cine-t">{e.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <button type="button" onClick={() => open('home', 'times')} className={`hs-empty ${FOCUS}`} data-testid="hs-events-empty">
            <b>No new events posted</b>
            <span>When the church office posts an event it appears here first. The full calendar and every service time are in Events.</span>
          </button>
        )}
      </section>

      {/* EXPLORE: every other door the current homepage carries, one swipeable rail */}
      <section className="hs-sec" aria-labelledby="hs-ex-h" data-testid="hs-explore">
        <div className="hs-sec-h">
          <h3 id="hs-ex-h" className="hs-h2">
            More at The Love Corner
          </h3>
          <button type="button" onClick={() => open('home', 'office')} className={`hs-link ${FOCUS}`} data-testid="hs-office">
            Church Office →
          </button>
        </div>
        <div className="hs-rail" role="region" aria-label="More at The Love Corner, swipe for more">
          {week.map((f) => (
            <button key={f.id} type="button" onClick={() => open(f.open.sub, f.open.section)} className={`hs-ex hs-ex-wide ${FOCUS}`} data-testid={`hs-feature-${f.id}`}>
              <span className="hs-k">{f.kicker}</span>
              <b>{f.title}</b>
              <small>{f.body}</small>
            </button>
          ))}
          <button type="button" onClick={() => open('home', 'office')} className={`hs-ex ${FOCUS}`} data-testid="hs-office-card">
            <span className="hs-ex-ic" aria-hidden="true">
              <UiIcon name="mail" />
            </span>
            <b>Church Office</b>
            <small>{digestHasNews(office) ? officeFacts.join(' · ') : 'Calendar, letters, documents, announcements'}</small>
          </button>
          {EXPLORE_CARDS.map((d) => (
            <button key={d.key} type="button" onClick={() => open(d.sub, d.section || null)} className={`hs-ex ${FOCUS}`} data-testid={`hs-explore-${d.key}`}>
              <span className="hs-ex-ic" aria-hidden="true">
                <UiIcon name={d.icon} />
              </span>
              <b>{d.words}</b>
              <small>{d.note}</small>
            </button>
          ))}
        </div>
      </section>

      <div className="hs-note" data-testid="hs-preview-note">
        <span>Private preview · only you see this homepage.</span>
        <button
          type="button"
          className={`hs-note-btn ${FOCUS}`}
          data-testid="hs-show-current"
          onClick={() => {
            setHomeStudio(false);
            try {
              window.location.reload();
            } catch {
              /* no window */
            }
          }}
        >
          Show the current homepage
        </button>
      </div>

      {picture && <FullPicture open={picture} onClose={() => setPicture(null)} closeRef={closeRef} />}
    </div>
  );
}
