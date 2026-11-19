// =============================================================================
// Theater — the Bible Adventure Theater (DR-1508)
// =============================================================================
// Honest about what exists: until the first episode of The Love Corner Bible
// Adventures is published, Now showing is the church's own channel from the
// record, embedded the way Live Worship embeds it (worshipPlayerSrc). The
// shelf reads the episode registry; nothing reads WATCH before it is. After
// you watch, the matching storybook opens, where the questions live.
//
// J1 of the Jonah adventure (DR-1523): a published episode of our own may
// be a file we serve (MP4/WebM under lovecorner/kids/episodes/), played in
// a <video> with its poster frame and a WebVTT caption track; the YouTube
// road stays. Only the file road hears `ended`, so only it tells the zone a
// child watched to the end (the trail's last stop, the Front Row badge).
import React, { useState } from 'react';
import Storybook from './Storybook.jsx';
import { gentleReveal } from '../../lib/gentle-motion.js';
import { resolveChurch } from '../../lib/resolve-church.js';
import { worshipPlayerSrc } from '../../lib/church-live.js';
import { EPISODES, nowShowing, shelfLabel, watchable, mediaKind } from '../../lib/kids/theater.js';
import { Shot, ShotSlot, GuideBubble, KidsIcon, kidsAsset, isLanded, KZ_FOCUS } from './GuideArt.jsx';
import { KIDS_BRAND } from '../../lib/kids/guides.js';

/** The embed URL of a published episode's YouTube watch link, or null. */
export function episodeEmbedSrc(url) {
  const m = String(url || '').match(/(?:v=|youtu\.be\/)([\w-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}?rel=0` : null;
}

/** The served path of a file of our own (an episode, its poster, its captions). */
export function episodeFileSrc(path) {
  return kidsAsset(String(path || '').replace(/^\/?lovecorner\/kids\//, ''));
}

/** The poster an episode shows before it plays: its own frame, else the story's third scene once landed, else the key art. */
export function posterFor(episode, list) {
  if (episode && episode.poster) return episodeFileSrc(episode.poster);
  if (episode && episode.storybook && isLanded(`${episode.storybook}-3`, list)) return kidsAsset(`${episode.storybook}-3.png`);
  return kidsAsset(KIDS_BRAND.reference);
}

export default function Theater({ church = null, episodes = EPISODES, onOpenStorybook = null, onWatched = null, shotList = undefined, storybook = {} }) {
  const c = resolveChurch(church);
  const now = nowShowing(c, episodes);
  // THE SHOW (Darrell, 2026-11-18, on three COMING SOON rows: "Theater?!!!!!"):
  // until an episode is published, every adventure PLAYS here as its storybook
  // read aloud, page by page, with the scene art and the guide's voice; the
  // animated episode replaces it the day its file lands. Nothing waits.
  const [show, setShow] = useState(null);
  const playing2 = show ? episodes.find((e) => e.storybook === show) : null;
  const file = now.kind === 'episode' && now.media === 'file';
  const src = file
    ? episodeFileSrc(now.url)
    : now.kind === 'episode'
      ? episodeEmbedSrc(now.url)
      : now.kind === 'channel'
        ? worshipPlayerSrc(c.youtubeChannelId)
        : null;
  const poster = now.kind === 'episode' ? posterFor(now.episode, shotList) : kidsAsset(KIDS_BRAND.reference);
  // The player loads only on a tap (nothing from YouTube reaches the device
  // until a child asks); until then the approved key art is the poster.
  const [playing, setPlaying] = useState(false);
  return (
    <div className="kz-theater" data-testid="theater" data-now={now.kind} data-playing={playing ? 'true' : 'false'}>
      <div className="kz-book kz-screen">
        {src && playing && file ? (
          <video
            className="kz-video"
            src={src}
            poster={poster}
            controls
            playsInline
            autoPlay
            preload="metadata"
            onEnded={() => onWatched && onWatched(now.episode)}
            data-testid="theater-video"
            aria-label={now.title}
          >
            {now.episode.captions && <track kind="captions" srcLang="en" label="English" src={episodeFileSrc(now.episode.captions)} default />}
          </video>
        ) : src && playing ? (
          <div style={{ position: 'relative', paddingTop: '56.25%' }}>
            <iframe
              title={now.title}
              src={src}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              data-testid="theater-player"
            />
          </div>
        ) : (
          <div className="kz-poster">
            <img
              className="kz-poster-art"
              src={poster}
              alt="The Love Corner Bible Adventures"
              data-interim={now.kind === 'episode' && now.episode.poster ? 'false' : 'true'}
            />
            {src ? (
              <button
                type="button"
                className={`kz-poster-play ${KZ_FOCUS}`}
                onClick={() => setPlaying(true)}
                data-testid="theater-play"
                aria-label={`Play: ${now.title}`}
              >
                <span className="kz-poster-btn">▶</span>
                <span className="kz-poster-cap">Tap to play</span>
              </button>
            ) : null}
          </div>
        )}
        <div className="kz-page" style={{ borderTop: '2px solid var(--lc-gold)' }}>
          <b className="kz-now" data-testid="theater-now">
            Now showing: {now.title}
          </b>
          <small className="kz-nowsub">
            {now.kind === 'episode'
              ? now.episode.scripture
              : now.kind === 'channel'
                ? 'No episode of our own series is published yet. Worship and the Word from the church channel play here today.'
                : 'Nothing is published yet, and the church record carries no channel to play.'}
          </small>
        </div>
      </div>

      {show && (
        <div className="kz-strip kz-show" data-testid="theater-show" data-book={show}>
          <h3>
            Now playing: {playing2 ? playing2.title : show} <small>the storybook, read aloud</small>
          </h3>
          <Storybook key={show} bookId={show} autoStart shotList={shotList} onBack={() => setShow(null)} {...storybook} />
        </div>
      )}

      <div className="kz-strip" data-testid="theater-shelf">
        <h3>
          The Love Corner Bible Adventures <small>{episodes.some(watchable) ? 'our own series' : 'read aloud now · episodes to come'}</small>
        </h3>
        {episodes.map((e) => (
          <div
            key={e.id}
            className="kz-evt"
            style={{ display: 'flex', gap: '.625rem', alignItems: 'center', padding: '.5rem 0', borderTop: '2px dashed #F3E7C9' }}
            data-testid={`episode-${e.id}`}
            data-status={e.status}
          >
            <span className="kz-shelf-thumb">
              {e.poster ? (
                <img src={episodeFileSrc(e.poster)} alt="" data-testid={`episode-${e.id}-poster`} />
              ) : (
                <Shot id={`${e.storybook}-3`} alt="" list={shotList} fallback={<ShotSlot id={`${e.storybook}-3`} className="" what="" />} />
              )}
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <b style={{ display: 'block', fontSize: '.86rem', fontWeight: 900 }}>{e.title}</b>
              <small className="kz-sub kz-sub-line">
                {e.scripture} · {watchable(e) ? 'the episode' : `read aloud now · episode ${shelfLabel(e).toLowerCase()}`}
              </small>
            </div>
            {watchable(e) && mediaKind(e.source) === 'file' ? (
              <button
                type="button"
                className={`kz-play red ${KZ_FOCUS}`}
                style={{ marginTop: 0 }}
                onClick={() => {
                  setPlaying(true);
                  if (typeof document !== 'undefined') gentleReveal(document.querySelector('[data-testid="theater"]'));
                }}
                data-testid={`episode-${e.id}-watch`}
              >
                WATCH
              </button>
            ) : watchable(e) ? (
              <a href={e.source} target="_blank" rel="noopener noreferrer" className={`kz-play red ${KZ_FOCUS}`} style={{ marginTop: 0 }}>
                WATCH
              </a>
            ) : (
              <button
                type="button"
                className={`kz-play red ${KZ_FOCUS}`}
                style={{ marginTop: 0 }}
                onClick={() => {
                  setShow(e.storybook);
                  if (typeof document !== 'undefined') gentleReveal(document.querySelector('[data-testid="theater-show"]'));
                }}
                aria-label={`Play ${e.title}: the storybook read aloud`}
                data-testid={`episode-${e.id}-play`}
              >
                PLAY
              </button>
            )}
          </div>
        ))}
        {c.media && c.media.youtube && (
          <div className="kz-evt" style={{ display: 'flex', gap: '.625rem', alignItems: 'center', padding: '.5rem 0', borderTop: '2px dashed #F3E7C9' }}>
            <span
              style={{ width: 64, height: 44, borderRadius: 10, background: '#1A1012', display: 'grid', placeItems: 'center', color: '#fff', flex: '0 0 auto' }}
            >
              ▶
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <b style={{ display: 'block', fontSize: '.86rem', fontWeight: 900 }}>The church channel</b>
              <small className="kz-sub kz-sub-line">Live worship and messages</small>
            </div>
            <a
              href={c.media.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className={`kz-play red ${KZ_FOCUS}`}
              style={{ marginTop: 0 }}
              data-testid="theater-channel"
            >
              WATCH
            </a>
          </div>
        )}
      </div>

      <GuideBubble who="girl" shot="girl-point" list={shotList}>
        Every adventure is a true story from the Word. Tap PLAY and I read it to you, page by page; the animated episodes come next!
      </GuideBubble>

      <div className="kz-strip">
        <h3>
          Read the stories <small>each one lights a stop on your trail</small>
        </h3>
        <div className="kz-actions" style={{ marginTop: 0 }}>
          {episodes.slice(0, 3).map((e) => (
            <button
              key={e.id}
              type="button"
              className={`kz-act orange ${KZ_FOCUS}`}
              onClick={() => onOpenStorybook && onOpenStorybook(e.storybook)}
              data-testid={`theater-read-${e.storybook}`}
            >
              <KidsIcon name="map" /> Read {e.title.split(' and ')[0]}
            </button>
          ))}
        </div>
      </div>
      <p className="kz-safety">
        Videos play inside the app from the church's own channel. No comments, no recommendations, no autoplay to anything we did not choose.
      </p>
    </div>
  );
}
