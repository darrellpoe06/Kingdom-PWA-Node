// =============================================================================
// HomeStudio — the redesigned Love Corner homepage (private owner preview)
// =============================================================================
// Built from the mockup Darrell approved as the DESIGN DIRECTION (2026-11-26).
// A visual and navigational redesign only: every control is a door to a place
// that exists today, and every number, name, date, picture and video on it is
// read from the church's own record, its website digest, its YouTube channel's
// feed or this device's saved lesson places. The mockup's words (its sermon
// titles, "New Year's Eve", its guest speaker) are NOT data and appear nowhere.
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
import { InstituteArt } from '../../ChurchInstitute.jsx';
import { FullPicture } from '../ChurchOfficeBoard.jsx';
import { LOVE_CORNER_ASSETS, BISHOP } from '../LoveCornerHome.jsx';
import { resolveChurch } from '../../../lib/resolve-church.js';
import { liveStatus } from '../../../lib/church-live.js';
import { nextService } from '../../../lib/home-week.js';
import { requestChurchHomeSection } from '../../../lib/church-home-section.js';
import { LEARN_CATALOG } from '../../../lib/learn-catalog.js';
import { INSTITUTE_META } from '../../../lib/church-institute.js';
import { listPlaces, placeIsFinished, placeWhere, placeAgo } from '../../../lib/learn-resume.js';
import { motionBehavior } from '../../../lib/gentle-motion.js';
import { isChurchDoorContext } from '../../../lib/church-own-door.js';
import { digestHasNews } from '../../../lib/church-site.js';
import { STUDIO_QUICK, hqThumb, messageCards, messageDate, happeningItems, continueLearning, setHomeStudio } from '../../../lib/home-studio.js';
import './home-studio.css';

const BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
const KEY_ART = `${BASE}lovecorner/kids/bible-adventures-key-art.jpg`;
const WORD_ART = `${BASE}learn-thumbs/topics/faith/w640.webp`;
const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';

const courseTitleOf = (key) => {
  const entry = Array.isArray(LEARN_CATALOG) ? LEARN_CATALOG.find((c) => c && c.key === key) : null;
  return (entry && entry.meta && entry.meta.title) || '';
};

export default function HomeStudio({ church = null, setChurchView = null, signedIn = false, onSignIn = null, now = null, office = null, recentVids = [], onPlay = null }) {
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

  return (
    <div className="hs" data-testid="home-studio">
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

      {/* 1. WELCOME HOME */}
      <section className="hs-hero" aria-labelledby="hs-hero-h" data-testid="hs-hero">
        {!isChurchDoorContext() && (
          <div className="hs-brandrow">
            <img src={LOVE_CORNER_ASSETS.logo} width="40" height="40" alt="The Love Corner Experience seal: a gold cross and the letters C L G over a red heart, with a dove" className="hs-seal" />
            <b>The Love Corner</b>
            {!signedIn && onSignIn && (
              <button type="button" onClick={onSignIn} className={`hs-signin ${FOCUS}`} data-testid="hs-sign-in">
                Sign in
              </button>
            )}
          </div>
        )}
        <div className="hs-hero-top">
          <figure className="hs-bishop">
            <img src={LOVE_CORNER_ASSETS.bishopFull} alt={`${BISHOP.name}, ${BISHOP.role}`} loading="eager" data-testid="hs-bishop-photo" />
            <figcaption className="hs-plaque" data-testid="hs-plaque">
              <b>{BISHOP.name}</b>
              <span>{BISHOP.role}</span>
            </figcaption>
          </figure>
          <div className="hs-hero-words">
            <h2 id="hs-hero-h" className="hs-h1">
              Welcome Home.
              <em>Where Love Lives.</em>
            </h2>
            <p className="hs-tag">Worship. Learn. Grow. Belong.</p>
          </div>
        </div>
        <div className="hs-cta">
          <button type="button" onClick={() => open('home', 'worship')} className={`hs-btn hs-btn-gold ${FOCUS}`} data-testid="hs-watch" data-live={status.live ? 'true' : 'false'}>
            <i className={`hs-dot${status.live ? ' hs-dot-on' : ''}`} aria-hidden="true" />
            {status.live ? 'Watch Live' : 'Latest Message'}
          </button>
          <button type="button" onClick={() => open('home', 'about')} className={`hs-btn hs-btn-line ${FOCUS}`} data-testid="hs-visit">
            <UiIcon name="pin" />
            Plan a Visit
          </button>
        </div>
        <p className="hs-next" data-testid="hs-next">
          {nextLine}
        </p>
      </section>

      {/* 2. QUICK NAVIGATION */}
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

      {/* 3. KIDS & YOUTH ZONE: the existing illustration, shown whole */}
      <section className="hs-adv" aria-labelledby="hs-adv-h" data-testid="hs-kids">
        <img className="hs-adv-art" src={KEY_ART} alt="The Love Corner Bible Adventures: two children with their Bibles, ready for the adventure" />
        <div className="hs-adv-body">
          <h3 id="hs-adv-h" className="hs-adv-h">
            The Love Corner Kids &amp; Youth Zone
          </h3>
          <p className="hs-adv-p">Little Ones 3–6 · Kids 6–10 · Teens 11–17</p>
          <button type="button" onClick={() => open('youth')} className={`hs-btn hs-btn-gold ${FOCUS}`} data-testid="hs-kids-go">
            Explore Kids &amp; Youth Zone →
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
          <button type="button" onClick={playLatest} className={`hs-latest ${FOCUS}`} data-testid="hs-latest" aria-label={`${status.live ? 'Watch live' : 'Play the latest message'}: ${latest.title || 'Latest message'}`}>
            <span className="hs-latest-pic">
              <img src={hqThumb(latest.videoId)} alt="" loading="lazy" />
              <span className="hs-play" aria-hidden="true">
                ▶
              </span>
            </span>
            <span className="hs-latest-t">
              <span className="hs-k">{status.live ? 'Live now' : 'Latest message'}</span>
              <b>{latest.title || 'Latest message'}</b>
              {messageDate(latest.published) && <small>{messageDate(latest.published)}</small>}
            </span>
          </button>
        ) : (
          <button type="button" onClick={() => open('home', 'worship')} className={`hs-empty ${FOCUS}`} data-testid="hs-latest-empty">
            <b>Latest message</b>
            <span>The channel&rsquo;s recordings did not come back just now. Open Messages to watch, or find every service on the church&rsquo;s YouTube channel.</span>
          </button>
        )}
        {more.length > 0 && (
          <div className="hs-rail" role="region" aria-label="Recent messages, swipe for more" data-testid="hs-rail">
            {more.map((v) => (
              <button key={v.videoId} type="button" onClick={() => (onPlay ? onPlay(v) : open('home', 'worship'))} className={`hs-msg ${FOCUS}`} data-testid={`hs-msg-${v.videoId}`} aria-label={`Play: ${v.title || 'Message'}`}>
                <img src={v.thumbnail || hqThumb(v.videoId)} alt="" loading="lazy" />
                <span className="hs-msg-t">{v.title || 'Message'}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 5. GROW IN THE WORD */}
      <section className="hs-sec" aria-labelledby="hs-grow-h" data-testid="hs-grow">
        <div className="hs-sec-h">
          <h3 id="hs-grow-h" className="hs-h2">
            Grow in the Word
          </h3>
        </div>
        <div className="hs-growgrid">
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
              <span className="hs-go" aria-hidden="true">
                →
              </span>
            </span>
          </button>
          <button type="button" onClick={() => open('institute')} className={`hs-gcard ${FOCUS}`} data-testid="hs-institute">
            <span className="hs-gart hs-gart-art" aria-hidden="true">
              <InstituteArt />
            </span>
            <span className="hs-gbody">
              <b className="hs-h3">{INSTITUTE_META.name}</b>
              <span className="hs-gsub">{INSTITUTE_META.tagline}</span>
              <span className="hs-go" aria-hidden="true">
                →
              </span>
            </span>
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
            View All Events →
          </button>
        </div>
        {happening.length > 0 ? (
          <ul className="hs-events">
            {happening.map((e) => (
              <li key={e.id}>
                <button type="button" className={`hs-ev ${FOCUS}`} data-testid="hs-event" onClick={() => (e.flyer ? setPicture(e.flyer) : open('home', 'times'))} aria-label={e.flyer ? `${e.name}: open the flyer` : `${e.name}: open events`}>
                  <span className="hs-ev-pic" aria-hidden="true">
                    {e.src ? <img src={e.src} alt="" loading="lazy" /> : <UiIcon name="calendar" />}
                  </span>
                  <span className="hs-ev-t">
                    {e.when && <small className="hs-k2">{e.when}</small>}
                    <b>{e.name}</b>
                    {e.detail && <small>{e.detail}</small>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <button type="button" onClick={() => open('home', 'times')} className={`hs-empty ${FOCUS}`} data-testid="hs-events-empty">
            <b>No new events posted</b>
            <span>When the church office posts an event it appears here first. The full calendar and every service time are in Events.</span>
          </button>
        )}
        {happeningTotal > happening.length && (
          <button type="button" onClick={() => open('home', 'times')} className={`hs-btn hs-btn-red hs-wide ${FOCUS}`} data-testid="hs-view-all-events-2">
            {`View all ${happeningTotal} events`}
          </button>
        )}
      </section>

      {/* 7. CHURCH OFFICE: its own section; the homepage shows one door */}
      <button type="button" onClick={() => open('home', 'office')} className={`hs-office ${FOCUS}`} data-testid="hs-office">
        <span className="hs-office-ic" aria-hidden="true">
          <UiIcon name="mail" />
        </span>
        <span className="hs-office-t">
          <b className="hs-h3">Church Office</b>
          <small>{digestHasNews(office) ? officeFacts.join(' · ') : 'The church calendar, letters from Bishop Gwin, documents and announcements'}</small>
        </span>
        <span aria-hidden="true" className="hs-chev">
          ›
        </span>
      </button>

      {picture && <FullPicture open={picture} onClose={() => setPicture(null)} closeRef={closeRef} />}
    </div>
  );
}
