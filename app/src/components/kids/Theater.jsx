// =============================================================================
// Theater — the Bible Adventure Theater (DR-1508)
// =============================================================================
// Honest about what exists: until the first episode of The Love Corner Bible
// Adventures is published, Now showing is the church's own channel from the
// record, embedded the way Live Worship embeds it (worshipPlayerSrc). The
// shelf reads the episode registry; nothing reads WATCH before it is. After
// you watch, the matching storybook opens, where the questions live.
import React, { useState } from 'react';
import { resolveChurch } from '../../lib/resolve-church.js';
import { worshipPlayerSrc } from '../../lib/church-live.js';
import { EPISODES, nowShowing, shelfLabel, watchable } from '../../lib/kids/theater.js';
import { Shot, ShotSlot, GuideBubble, KidsIcon, kidsAsset, KZ_FOCUS } from './GuideArt.jsx';
import { KIDS_BRAND } from '../../lib/kids/guides.js';

/** The embed URL of a published episode's YouTube watch link, or null. */
export function episodeEmbedSrc(url) {
  const m = String(url || '').match(/(?:v=|youtu\.be\/)([\w-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}?rel=0` : null;
}

export default function Theater({ church = null, episodes = EPISODES, onOpenStorybook = null, shotList = undefined }) {
  const c = resolveChurch(church);
  const now = nowShowing(c, episodes);
  const src = now.kind === 'episode' ? episodeEmbedSrc(now.url) : now.kind === 'channel' ? worshipPlayerSrc(c.youtubeChannelId) : null;
  // The player loads only on a tap (nothing from YouTube reaches the device
  // until a child asks); until then the approved key art is the poster.
  const [playing, setPlaying] = useState(false);
  return (
    <div className="kz-theater" data-testid="theater" data-now={now.kind} data-playing={playing ? 'true' : 'false'}>
      <div className="kz-book kz-screen">
        {src && playing ? (
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
            <img className="kz-poster-art" src={kidsAsset(KIDS_BRAND.reference)} alt="The Love Corner Bible Adventures" data-interim="true" />
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

      <div className="kz-strip" data-testid="theater-shelf">
        <h3>
          The Love Corner Bible Adventures <small>our own series</small>
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
              <Shot id={`${e.storybook}-3`} alt="" list={shotList} fallback={<ShotSlot id={`${e.storybook}-3`} className="" what="" />} />
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <b style={{ display: 'block', fontSize: '.86rem', fontWeight: 900 }}>{e.title}</b>
              <small className="kz-sub kz-sub-line">{e.scripture}</small>
            </div>
            {watchable(e) ? (
              <a href={e.source} target="_blank" rel="noopener noreferrer" className={`kz-play red ${KZ_FOCUS}`} style={{ marginTop: 0 }}>
                WATCH
              </a>
            ) : (
              <span className="kz-play soon" style={{ marginTop: 0 }}>
                {shelfLabel(e)}
              </span>
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
        Every episode is a true story from the Word. Open the Storybook to read it first, then watch it with me!
      </GuideBubble>

      <div className="kz-strip">
        <h3>
          After you watch <small>earns a stop on your map</small>
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
