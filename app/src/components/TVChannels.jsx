// =============================================================================
// TVChannels — follow a free YouTube channel, see its new episodes (DR-1168).
//
// Darrell 2026-10-21, on TV Time: "I want users to be able to connect their
// streaming platforms and the free ones YouTube channels explains... just an
// easy way to get it done through this tab."
//
// THIS IS THE HALF THAT GENUINELY CONNECTS. The paid services publish no
// consumer API, so there is no account to link and nothing to read (the honest
// version of that answer lives in the Where-to-watch panel on each card). A free
// YouTube channel is the opposite: its episode list is a PUBLIC Atom feed, no
// key, no OAuth, no account. So the one platform a family really can connect is
// the free one — and following a channel here costs nothing and leaks nothing.
//
// OVER OUR OWN ROAD. The feed is fetched by /api/youtube-feed, our same-origin
// Pages Function, never from the reader's browser: YouTube sends no CORS header,
// and more to the point, resolving it at our edge means the family member's
// device never talks to Google and their viewing interests never leave it. Same
// posture as the rest of TV Time (device-local, private, fail-soft).
//
// A FEED IS MATERIAL TO STUDY, NEVER AN INSTRUCTION TO OBEY. Titles and
// descriptions arriving from a channel are third-party text rendered as content
// (React escapes them); nothing in a feed steers this surface.
//
// Surface only. Parsing + the follow list: ../lib/youtube-follow.js (pure,
// tested against a REAL feed document). Accessibility: the established TV Time
// palette (#1A1815 body, #5A5751 secondary, #5A6E3D + #B85838 accents, #B85838
// focus ring) so every pairing is already measured AA per theme; no device-font
// emoji (icons via UiIcon).
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import UiIcon from './UiIcon.jsx';
import {
  loadChannels, saveChannels, followChannel, unfollowChannel, followedChannels,
  channelIdFrom, parseFeed, mergeEpisodes, isChannelId,
} from '../lib/youtube-follow.js';

const serif = { fontFamily: '"Fraunces", serif' };

const BTN = 'text-[0.6875rem] uppercase tracking-wider px-2 py-1 focus:outline focus:outline-2 focus:outline-[#B85838]';

// Our own edge road to the public feed. Same-origin on purpose (see header).
const FEED_ROUTE = '/api/youtube-feed';

// A friendly, honest word for each failure the edge function can report. Every
// one of these says WHAT happened; none of them says "no episodes", because a
// feed we could not read is not a channel with nothing on it (DR-0076).
const TROUBLE = {
  'not-a-youtube-channel-url': 'That does not look like a YouTube channel link.',
  'bad-channel_id': 'That channel id is not in YouTube’s format.',
  'need-channel_id-or-url': 'Paste a channel link or a channel id.',
  'no-channel-id-on-page': 'That page loaded, but it does not name a channel id — try the channel’s own page.',
  'channel-not-found': 'YouTube does not have a channel at that link.',
  'channel-unreachable': 'Could not reach that channel page just now.',
  'feed-unavailable': 'YouTube does not publish a feed for that channel id.',
  'feed-unreachable': 'Could not reach YouTube just now — your follows are safe; try again.',
  'feed-empty': 'YouTube returned an empty feed for that channel.',
};
const trouble = (code) => TROUBLE[code] || 'Could not read that channel just now.';

// When a date is readable, say it plainly; when it is not, say nothing rather
// than printing a wrong date.
function when(iso) {
  const s = String(iso || '');
  if (!s) return '';
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return ''; }
}

export default function TVChannels({ email = null }) {
  const [state, setState] = useState(() => loadChannels(email));
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState('');
  // channelId -> { channelTitle, episodes } for every feed we HAVE read. A
  // channel absent from this map is un-read, never "empty" (see mergeEpisodes).
  const [feeds, setFeeds] = useState({});
  const [loading, setLoading] = useState(false);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  // Re-read the follow list when the identity changes (sign-in / sign-out), the
  // same per-identity keying tv-time.js uses.
  useEffect(() => { setState(loadChannels(email)); setFeeds({}); }, [email]);

  const persist = (next) => { saveChannels(email, next); setState(next); };
  const follows = useMemo(() => followedChannels(state), [state]);

  // Read one channel's feed over our own edge. Fail-soft and SPECIFIC: a failure
  // records why, and a channel that failed stays absent from `feeds` so it is
  // reported as un-read rather than as having no episodes.
  const readFeed = useCallback(async (channelId) => {
    try {
      const res = await fetch(`${FEED_ROUTE}?channel_id=${encodeURIComponent(channelId)}`, {
        headers: { Accept: 'application/json' },
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body || !body.xml) {
        return { ok: false, error: (body && body.error) || 'feed-unreachable' };
      }
      const parsed = parseFeed(body.xml);
      return { ok: true, channelTitle: parsed.channelTitle, episodes: parsed.episodes };
    } catch {
      return { ok: false, error: 'feed-unreachable' };
    }
  }, []);

  // Refresh every followed channel. Deliberately a BUTTON plus one fetch on
  // mount-with-follows, never a timer: nothing here loops on a clock.
  const refreshAll = useCallback(async (list) => {
    const ids = (list || []).map((c) => c.id);
    if (!ids.length) { setFeeds({}); return; }
    setLoading(true);
    const got = {};
    for (const id of ids) {
      const r = await readFeed(id);                       // one at a time: a family
      if (r.ok) got[id] = { channelTitle: r.channelTitle, episodes: r.episodes }; // follow list is small
    }
    if (!alive.current) return;
    setFeeds(got);
    setLoading(false);
  }, [readFeed]);

  const followsKey = follows.map((c) => c.id).join(',');
  useEffect(() => {
    if (!followsKey) { setFeeds({}); return; }
    refreshAll(follows);
    // followsKey (not `follows`) so a re-render with the same ids does not refetch.
  }, [followsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Follow what the reader pasted. A bare UC id or a /channel/UC… link is
  // resolved here with no network at all; a @handle or /c/name page has no id in
  // its text, so the edge function reads the page and tells us the id. Either
  // way we verify the channel REALLY EXISTS by reading its feed before storing
  // the follow — so a typo cannot become a permanent dead row on the surface.
  const add = async () => {
    const raw = draft.trim();
    if (!raw) return;
    setAdding(true); setMsg('');
    const direct = channelIdFrom(raw);
    const qs = direct ? `channel_id=${encodeURIComponent(direct)}` : `url=${encodeURIComponent(raw)}`;
    try {
      const res = await fetch(`${FEED_ROUTE}?${qs}`, { headers: { Accept: 'application/json' } });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body || !body.xml || !isChannelId(body.channelId || '')) {
        if (alive.current) setMsg(trouble(body && body.error));
        return;
      }
      const parsed = parseFeed(body.xml);
      const id = body.channelId;
      const next = followChannel(state, { id, title: parsed.channelTitle || id }, new Date().toISOString());
      persist(next);
      setFeeds((f) => ({ ...f, [id]: { channelTitle: parsed.channelTitle, episodes: parsed.episodes } }));
      setDraft('');
      setMsg(`Following ${parsed.channelTitle || id} — ${parsed.episodes.length} episode${parsed.episodes.length === 1 ? '' : 's'} in its feed.`);
    } catch {
      if (alive.current) setMsg(trouble('feed-unreachable'));
    } finally {
      if (alive.current) setAdding(false);
    }
  };

  const drop = (id) => {
    persist(unfollowChannel(state, id));
    setFeeds((f) => { const n = { ...f }; delete n[id]; return n; });
    setMsg('');
  };

  const { episodes, missing, read } = useMemo(() => mergeEpisodes(state, feeds, 24), [state, feeds]);

  return (
    <div className="w-full" data-testid="tv-channels">
      <p className="text-sm text-[#1A1815] mb-1" style={serif}>
        Follow a free YouTube channel and its new episodes show up here. No account to connect and nothing to pay — a channel&apos;s episode list is public, so this needs no sign-in to YouTube at all.
      </p>
      <p className="text-[0.6875rem] text-[#5A5751] mb-3" style={serif}>
        The feed is read by <span className="text-[#5A6E3D]">the PoeTech App&apos;s own server</span>, not by your phone — so what you follow stays here. Your follow list is saved on this device.
      </p>

      {/* Add a channel. Paste anything that names a channel: a @handle page, a
          /channel/UC… link, or the bare id. */}
      <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-3 mb-3">
        <label className="text-[0.5625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold" htmlFor="tv-channel-add">
          Follow a channel
        </label>
        <div className="flex gap-1.5 mt-1.5">
          <input id="tv-channel-add" value={draft} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !adding) add(); }}
            autoComplete="off" data-testid="tv-channel-input"
            placeholder="Paste a channel link — e.g. youtube.com/@SomeChannel"
            className="flex-1 min-w-0 text-sm px-2 py-1.5 border border-[#E8E4DC] bg-white text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]" style={serif} />
          <button type="button" onClick={add} disabled={adding || !draft.trim()}
            data-testid="tv-channel-follow"
            className={`${BTN} bg-[#1A1815] text-white font-semibold hover:bg-[#B85838] disabled:opacity-50 shrink-0`}>
            {adding ? 'Checking…' : 'Follow'}
          </button>
        </div>
        {msg && <p className="text-[0.6875rem] text-[#5A6E3D] mt-1.5" style={serif} role="status" data-testid="tv-channel-msg">{msg}</p>}
      </div>

      {/* The follow list. Each row is real stored state, with the channel's own
          name as its feed reports it. */}
      {follows.length > 0 && (
        <section className="mb-4" aria-labelledby="tv-ch-following">
          <h3 id="tv-ch-following" className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-2">
            Following <span className="text-[#B85838] normal-case tracking-normal font-normal">· {follows.length} channel{follows.length === 1 ? '' : 's'}</span>
          </h3>
          <ul className="space-y-1">
            {follows.map((c) => {
              const got = feeds[c.id];
              return (
                <li key={c.id} className="flex items-center justify-between gap-2 bg-white border border-[#E8E4DC] px-2 py-1.5">
                  <span className="min-w-0">
                    <span className="text-sm text-[#1A1815] block truncate" style={{ ...serif, fontWeight: 600 }}>{(got && got.channelTitle) || c.title}</span>
                    {/* Honest per-channel state: a count when we read the feed,
                        and "not read yet" when we did not — never a zero we
                        did not measure. */}
                    <span className="text-[0.625rem] text-[#5A5751]">
                      {got ? `${got.episodes.length} episode${got.episodes.length === 1 ? '' : 's'} in its feed` : (loading ? 'Reading its feed…' : 'Feed not read yet')}
                    </span>
                  </span>
                  <button type="button" onClick={() => drop(c.id)} className={`${BTN} text-[#991B1B] hover:underline shrink-0`}>Unfollow</button>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <button type="button" onClick={() => refreshAll(follows)} disabled={loading}
              data-testid="tv-channel-refresh"
              className={`${BTN} border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white disabled:opacity-50`}>
              {loading ? 'Checking for new…' : 'Check for new episodes'}
            </button>
            <span className="text-[0.625rem] text-[#5A5751]">{read} of {follows.length} feed{follows.length === 1 ? '' : 's'} read</span>
          </div>
        </section>
      )}

      {/* New episodes, newest first across every channel read. */}
      {episodes.length > 0 && (
        <section className="mb-4" aria-labelledby="tv-ch-new">
          <h3 id="tv-ch-new" className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-2">
            New episodes <span className="text-[#B85838] normal-case tracking-normal font-normal">· newest first, from the channels you follow</span>
          </h3>
          <ul className="space-y-2" data-testid="tv-channel-episodes">
            {episodes.map((ep) => (
              <li key={`${ep.channelId}:${ep.videoId}`} className="bg-white border border-[#1A1815] p-2">
                <a href={ep.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-start gap-2.5 focus:outline focus:outline-2 focus:outline-[#B85838] group">
                  {ep.thumbnail
                    ? <img src={ep.thumbnail} alt="" loading="lazy" className="w-24 h-14 object-cover border border-[#E8E4DC] shrink-0" />
                    : <span className="w-24 h-14 shrink-0 border border-[#E8E4DC] bg-[#FAF8F4] flex items-center justify-center text-[#5A5751]"><UiIcon name="monitor" /></span>}
                  <span className="min-w-0">
                    <span className="text-sm text-[#1A1815] block group-hover:underline" style={{ ...serif, fontWeight: 600 }}>{ep.title}</span>
                    <span className="text-[0.625rem] text-[#5A5751] block">
                      {[ep.channelTitle, when(ep.published)].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* The honest gaps, each named rather than shown as an empty list. */}
      {missing.length > 0 && !loading && (
        <p className="text-[0.6875rem] text-[#5A5751] mb-3" style={serif} data-testid="tv-channel-unread">
          {missing.length} followed channel{missing.length === 1 ? '' : 's'} could not be read just now ({missing.map((c) => c.title).join(', ')}). That is not the same as having no new episodes — tap “Check for new episodes” to try again.
        </p>
      )}

      {follows.length === 0 && (
        <p className="text-sm text-[#5A5751]" style={serif}>
          Nothing followed yet. Paste a channel&apos;s link above — its new episodes land here, free, with nothing to sign in to.
        </p>
      )}
      {follows.length > 0 && !episodes.length && !loading && !missing.length && (
        <p className="text-sm text-[#5A5751]" style={serif}>
          Your channels were read and none of them has posted an episode in its public feed.
        </p>
      )}
    </div>
  );
}

export { TVChannels };
