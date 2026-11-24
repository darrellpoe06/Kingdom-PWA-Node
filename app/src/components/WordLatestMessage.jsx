// =============================================================================
// WordLatestMessage — The Word tab opens on Bishop Gwin's latest, in big (DR-1639)
// =============================================================================
// Darrell 2026-11-24: "The Word tab needs to be updated... it should be
// inviting... BG's latest in big like the Home tab does."
//
// The same player the Church tab uses (worshipPlayerSrc: the message, then
// the channel's uploads queued behind it) at full width, with the same skip
// buttons a TV remote can reach (VideoSkip). The feed is the one The Word tab
// already reads (/api/church-recent), passed in; nothing new is fetched.
// No feed yet, no hero: the library below still fills the tab, so the
// surface is never blank, and no failure is claimed before the feed answers.
// =============================================================================
import React, { useRef } from 'react';
import { worshipPlayerSrc } from '../lib/church-live.js';
import { withJsApi } from '../lib/youtube-embed-control.js';
import { wordLatest, latestDate } from '../lib/word-latest.js';
import VideoSkip from './VideoSkip.jsx';

export default function WordLatestMessage({ feed, channelId }) {
  const frameRef = useRef(null);
  const pick = wordLatest(feed);
  if (!pick) return null;
  const { video, his } = pick;
  const src = worshipPlayerSrc(channelId, video.videoId);
  if (!src) return null;
  const embed = withJsApi(src, typeof window !== 'undefined' ? window.location.origin : '');
  const when = latestDate(video.published);
  const heading = his ? 'Bishop Gwin’s latest message' : 'The latest message';
  return (
    <section aria-labelledby="word-latest-h" className="mb-5 bg-white border border-[#E8E4DC] p-4" data-testid="word-latest">
      <h3 id="word-latest-h" className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">
        {heading}
      </h3>
      <p className="mt-1 text-lg sm:text-xl text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }} data-testid="word-latest-title">
        {video.title || 'The newest message'}
      </p>
      <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
        {when ? `${when} · ` : ''}Come and hear the Word. Every earlier message is in the library below.
      </p>
      <div className="mt-3 aspect-video w-full bg-[#1A1815]">
        <iframe
          ref={frameRef}
          key={src}
          src={embed}
          title={`${heading}: ${video.title || ''}`.trim()}
          className="w-full h-full border-0"
          allow="encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          loading="lazy"
        />
      </div>
      <VideoSkip frameRef={frameRef} src={src} />
    </section>
  );
}
