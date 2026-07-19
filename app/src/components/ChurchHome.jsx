// =============================================================================
// ChurchHome — the Church tab's home surface (churchView === 'home')
// =============================================================================
// Extracted WHOLE from the monolith shell 2026-07-03 (was `function Church`,
// poe-financial-mvp-v28.jsx) as the Stage 3 extraction the surface-mount
// registry named: church 'home' now mounts through app/src/surfaces.js like
// its sibling church sub-surfaces (DR-0078 §4.3; monolith budget ratchets
// down by the moved lines). Behavior is unchanged by design — same sections,
// same order, same props from the shell:
//   Live Worship (channel-embedded, service-window-gated, rolling latest) →
//   default-home note → One Voice → Pastoral Content → Testimony Diary door →
//   Yahweh Hears You (speak/type/link) → Service Times + save-to-calendar →
//   Media → Give + Parish Life → Ministry Interest → Prayer Requests →
//   Home Church header → Church Directory (+ invite) → footer note.
// Dependencies that already lived outside the shell (lib/church-live.js,
// ChurchOneVoice) came along untouched; COLG_DEFAULT_CHURCH moved to
// lib/default-church.js so the shell's seed and this module share one record.
// =============================================================================
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { liveStatus, worshipPlayerSrc } from '../lib/church-live.js';
import { parseYoutubeFeed } from '../lib/youtube-feed.js';
import { resolveChurch } from '../lib/resolve-church.js';
import { ChurchOneVoice } from './ChurchOneVoice.jsx';
import AppShareQR from './AppShareQR.jsx';
import { SHARE_DOOR_URL } from '../lib/church-own-door.js';
import UiIcon from './UiIcon.jsx';
import EmojiText from './EmojiText.jsx';
import SectionTabs from './SectionTabs.jsx';
import ScriptureLibrary from './ScriptureLibrary.jsx';
import AuthModal from './AuthModal.jsx';

// initialSection (DR-0142): a launch target may open a SPECIFIC section — the
// Council Chamber is the Speak section of this surface, and "Open the Council
// Chamber" landing on the Worship video was the 2026-07-10 premise miss.
export function ChurchHome({ church, prayerRequests, addPrayerRequest, markPrayerRequestSent, deletePrayerRequest, addEvent, conference, updateConference, churchVoice = [], addChurchVoice, sendToPoeTech, addIncident, addInquiry, initialSection = null, setChurchView = null, email = null, canStudy = false, signedIn = false }) {
  // Obvious, prominent LOG IN / CREATE ACCOUNT for the public Love Corner door
  // (Darrell 2026-07-14). The community is public; this is the clear way in for a
  // member/staff/admin to sign in, or anyone to make an account (e.g. to request a
  // ride). One sign-in serves everyone — the role follows the account.
  const [loginOpen, setLoginOpen] = useState(false);
  // Follow along in the Word — open the Scripture reader INLINE on THIS page so
  // you can watch the service AND read the Word together (Darrell 2026-07-14:
  // navigating to the Scripture tab moved you off the live player). The ref lets
  // us scroll the reader into view when it opens, without leaving the video.
  const [followAlong, setFollowAlong] = useState(false);
  // Size + float the live player so the Word shows alongside the livestream
  // (Darrell 2026-07-16: "size the video player or even pop-out while still
  // playing... see the Word at the same time"). playerScale sizes the pinned
  // player (s/m/l); floating pops it to a corner MINI-player so the Word reads
  // full-width underneath. Both are pure layout on the SAME iframe — never a
  // remount, so the stream keeps playing while you resize/float.
  const [playerScale, setPlayerScale] = useState('m'); // 's' | 'm' | 'l'
  const [floating, setFloating] = useState(false);
  // The floating mini-player is DRAGGABLE anywhere (Darrell 2026-07-18: "why cant
  // the video only size like small MOVE ANYWHERE we want and go back whenever").
  // floatPos = {x,y} once dragged; null = the default bottom-right resting spot.
  // Dragging never remounts the iframe (the drag handle is a sibling bar in the
  // SAME wrapper), so the stream keeps playing while you move it.
  const [floatPos, setFloatPos] = useState(null);
  const floatDrag = useRef({ on: false, offX: 0, offY: 0, w: 0, h: 0 });
  const onFloatPointerDown = useCallback((e) => {
    const wrap = e.currentTarget.parentElement;
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    floatDrag.current = { on: true, offX: e.clientX - r.left, offY: e.clientY - r.top, w: r.width, h: r.height };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* non-fatal */ }
  }, []);
  const onFloatPointerMove = useCallback((e) => {
    const d = floatDrag.current;
    if (!d.on) return;
    const x = Math.max(4, Math.min(e.clientX - d.offX, window.innerWidth - d.w - 4));
    const y = Math.max(4, Math.min(e.clientY - d.offY, window.innerHeight - d.h - 4));
    setFloatPos({ x, y });
  }, []);
  const onFloatPointerUp = useCallback((e) => {
    floatDrag.current.on = false;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) { /* non-fatal */ }
  }, []);
  const followRef = useRef(null);
  const openFollowAlong = useCallback(() => {
    setFollowAlong(true);
    setFloating(true); // pop the video to a small DRAGGABLE mini-player so the Word reads clean below (no big orange box)
    setTimeout(() => { try { followRef.current && followRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { /* non-fatal */ } }, 60);
  }, []);
  const [prForm, setPrForm] = useState({ requester: '', request: '', shareWithChurch: true, anonymous: false });
  const [prError, setPrError] = useState('');
  const [showPrForm, setShowPrForm] = useState(false);
  const [ministryInterest, setMinistryInterest] = useState({ name: '', email: '', interest: '', skills: '' });
  const [showMinistryForm, setShowMinistryForm] = useState(false);
  const [ministryNote, setMinistryNote] = useState('');

  // D21 — Multi-church directory "invite your church" form (skeleton; full
  // partner-onboarding flow ships V2). Local-only, no backend — submit shows an
  // inline confirmation, matching the existing local-first contribution pattern.
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({ churchName: '', city: '', contactName: '', email: '', note: '' });
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteError, setInviteError] = useState('');

  // D21 — Testimony Diary PIN-locked entry point (the diary MVP V0 ships later
  // per project_testimony_diary_glory_to_glory; this is the door). PIN is held
  // on-device only; nothing leaves the browser.
  const [diaryPin, setDiaryPin] = useState('');
  const [diaryUnlocked, setDiaryUnlocked] = useState(false);
  const [diaryError, setDiaryError] = useState('');


  // Default church home (D21): COLG / The Love Corner is the platform default
  // that every user lands on until they set their own church home in Settings
  // (the Father's Business anchor — the unchurched get access to OUR church).
  // A user who has set a real custom church home sees that instead; a demo
  // viewer's anonymized 'Your home church' placeholder resolves to the COLG
  // public directory entry. COLG directory info is public-by-design (the named
  // first community per COMMUNITY-FIRST-MISSION), distinct from private seed.
  // The effective church-home record — COLG default fallback + the COLG
  // channel/media backfill for pre-2026-06-15 saved homes — now lives in
  // lib/resolve-church.js so the Church tab AND the global Live Worship bar
  // resolve the SAME record from one source (Reality-Trace P15/P16). Behavior
  // is unchanged from the inline logic this replaced.
  const c = resolveChurch(church);
  const showingDefaultHome = c.isDefaultHome === true;
  const fieldCls = 'w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]';
  const labelCls = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751]';

  // LIVE WORSHIP (2026-06-14; service-window-gated 2026-06-17; ROLLING-LATEST
  // 2026-06-17) — embed the church's worship by CHANNEL, never a single video
  // id, so it auto-follows every future stream with no weekly edits. Two no-key
  // YouTube embeds, no API key, no vendor lock (see lib/church-live.js):
  //   • live   : /embed/live_stream?channel=UC...  — the current live broadcast.
  //   • latest : /embed/videoseries?list=UU...     — the channel's uploads
  //              playlist, newest-first, so it opens on the MOST RECENT message
  //              (after a stream ends, that IS the finished stream) and rolls
  //              forward on its own as new streams land.
  //
  // Darrell's directive: "the live stream should show the latest live stream
  // until the next one is streaming, and repeat." So the slot is NEVER a
  // dead/waiting frame: inside a plausible service window (honest, no-key gate
  // from the church's real published schedule) we mount the LIVE embed; the rest
  // of the time we roll the latest upload. The window gate also avoids the
  // earlier bug where the bare live_stream embed paints a frozen "Waiting for
  // <stale 2019 stream>" frame when nothing is live — outside the window we
  // simply never mount that embed; we mount the latest-upload embed instead.
  // We do NOT paint our own "LIVE NOW" badge — the client cannot truthfully
  // detect live state without the YouTube Data API (Reality-Trace P15). A real
  // live/offline detector (same-origin n8n proxy, no key) is the follow-up.
  const liveChannelId = (c.youtubeChannelId || '').trim();
  const channelUrl = c.media?.youtube || (liveChannelId ? `https://www.youtube.com/channel/${liveChannelId}` : null);
  const onlineServices = (c.services || []).filter(s => s && s.online !== false);
  // The ONE reliable embed: the uploads-playlist player (newest-first). A broadcast
  // that is currently LIVE is the channel's newest item, so it plays here on its
  // own, and the most recent message keeps playing between services — no API key,
  // no weekly edits. The old /embed/live_stream?channel= form is abandoned: YouTube
  // rendered it "This video is unavailable" even while the church WAS live on
  // YouTube (Darrell 2026-07-19). See worshipPlayerSrc.
  const playerSrc = worshipPlayerSrc(liveChannelId);
  // Honest, no-API-key window gate — used ONLY for the "Live service"/"Latest
  // message" label and heading, never to swap the source (the one embed covers
  // both states). Inside a published online-service window we call it live.
  const liveNow = liveStatus(onlineServices);
  const showLive = liveNow.live;
  // Render the section whenever we have a source at all.
  const hasWorshipPlayer = !!playerSrc;

  // Recent livestreams straight from the channel (Darrell 2026-07-19: "keep each of
  // the 5 last livestreams right below the current livestream... whenever the other
  // tab pulls it in it'll be there too"). Source is the channel's no-key public RSS
  // via the same-origin /api/church-recent proxy — always current, independent of
  // the curated sermon library (which is sometimes missing recent streams). The
  // newest item is what the player above is showing, so the strip lists the ones
  // BELOW it. Degrades to nothing on any failure — never blocks the page.
  const [recentVids, setRecentVids] = useState([]);
  useEffect(() => {
    if (!/^UC[A-Za-z0-9_-]{22}$/.test(liveChannelId)) { setRecentVids([]); return undefined; }
    let cancelled = false;
    fetch(`/api/church-recent?channel=${encodeURIComponent(liveChannelId)}`)
      .then((r) => (r.ok ? r.text() : ''))
      .then((xml) => { if (!cancelled) setRecentVids(parseYoutubeFeed(xml, 6)); })
      .catch(() => { if (!cancelled) setRecentVids([]); });
    return () => { cancelled = true; };
  }, [liveChannelId]);
  // The 5 BELOW the one now playing (the player shows the newest item).
  const priorStreams = recentVids.slice(1, 6);

  const submitPrayer = () => {
    const requester = prForm.anonymous ? '(anonymous)' : (prForm.requester || '').trim();
    const request = (prForm.request || '').trim();
    if (!request) { setPrError('Please describe the prayer request.'); return; }
    if (!prForm.anonymous && !requester) { setPrError('Add your name, or check anonymous.'); return; }
    setPrError('');
    addPrayerRequest({ requester, request, shareWithChurch: !!prForm.shareWithChurch });
    setPrForm({ requester: '', request: '', shareWithChurch: true, anonymous: false });
    setShowPrForm(false);
  };

  const mailtoFor = (pr) => {
    const subject = `Prayer request from ${pr.requester}`;
    const body = `Hello — please add this to the prayer list at The Love Corner.\n\nFrom: ${pr.requester}\nDate: ${pr.createdAt.slice(0, 10)}\n\n${pr.request}\n\nThank you.`;
    // The site uses an obfuscated email; users without the church's address can paste the contact form URL.
    // If a contactEmail is configured, prefer that. Otherwise fall back to the Stay Connected page.
    if (c.contactEmail) return `mailto:${c.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return c.links?.stayConnected || c.site || '#';
  };


  // Save a one-tap event to the family calendar from a service entry.
  const saveServiceToCalendar = (svc) => {
    if (!addEvent) return;
    // Build the next occurrence of this day-of-week + time.
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const targetDow = days.indexOf(svc.day);
    if (targetDow < 0) return;
    const now = new Date();
    const ahead = (targetDow - now.getDay() + 7) % 7;
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (ahead === 0 ? 7 : ahead));
    const isoDate = next.toISOString().slice(0, 10);
    // Parse "11:00 AM" → "11:00"
    const m = (svc.time || '').match(/(\d+):(\d+)\s*(AM|PM)?/i);
    let hh = m ? parseInt(m[1]) : 11; const mm = m ? parseInt(m[2]) : 0;
    if (m && m[3] && m[3].toUpperCase() === 'PM' && hh < 12) hh += 12;
    if (m && m[3] && m[3].toUpperCase() === 'AM' && hh === 12) hh = 0;
    addEvent({
      title: `${c.nickname || c.name || 'Church'} · ${svc.label}`,
      description: `${svc.day} ${svc.time} — saved from Church tab.`,
      date: isoDate,
      time: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
      category: 'family',
      reminders: ['at-event', 'thirty-min-before'],
    });
    alert(`Saved to your calendar: ${svc.label} on ${isoDate} at ${svc.time}`);
  };

  const submitMinistry = () => {
    if (!ministryInterest.email) { setMinistryNote('Add an email so the church can follow up.'); return; }
    setMinistryNote('');
    const subject = `Ministry interest — ${ministryInterest.interest || 'general'}`;
    const body = `Name: ${ministryInterest.name}\nEmail: ${ministryInterest.email}\nMinistry of interest: ${ministryInterest.interest}\nSkills / availability:\n${ministryInterest.skills}\n\nSent from PoeTech Family OS · Church tab.`;
    // Open the church's Stay Connected page so the parishioner can paste/forward;
    // when contactEmail is set, open a proper mailto instead.
    if (c.contactEmail) {
      window.location.href = `mailto:${c.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } else {
      window.open(c.links?.stayConnected || c.site, '_blank', 'noopener,noreferrer');
    }
    setMinistryInterest({ name: '', email: '', interest: '', skills: '' });
    setShowMinistryForm(false);
  };

  const sections = [
    {
      id: 'worship',
      label: 'Worship',
      icon: 'volume',
      render: () => (
        <>
      {/* LIVE WORSHIP (2026-06-14; service-window-gated 2026-06-17; ROLLING-LATEST
          2026-06-17) — TOP of the Church tab by Darrell's direction: worship is
          the most prominent thing on the unchurched on-ramp. Embedded by CHANNEL
          (never a single video id) so it auto-follows every future stream with
          no weekly edits. Rolling-latest: inside a plausible service window the
          LIVE broadcast plays; the rest of the time the channel's MOST RECENT
          upload plays (after a stream ends, that IS the finished stream), and
          rolls forward on its own as new streams land — never a dead/waiting
          frame. The honest service window comes from the church's real published
          schedule (lib/church-live.js); we do not paint our own "LIVE NOW" badge
          (the client cannot truthfully detect live state without the YouTube
          Data API — Reality-Trace P15). A real live/offline detector
          (same-origin n8n proxy, no key) is the follow-up. */}
      {hasWorshipPlayer && (
        // When "Follow along" is open, the player PINS to the top (sticky) and goes
        // compact — so it stays watchable while you scroll + work the Word below it,
        // both together (Darrell 2026-07-15). Otherwise it's the normal full card.
        <section aria-labelledby="live-worship-h" className="bg-white border border-[#E8E4DC] p-4">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <h3 id="live-worship-h" className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">
              Live Worship · {c.nickname && /love corner/i.test(c.nickname) ? 'The Love Corner' : (c.name || 'Church')}
            </h3>
            <span className="inline-flex items-center gap-1.5 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">
              <span className="w-2 h-2 rounded-full bg-[#B85838]" aria-hidden="true" />
              {showLive ? 'Live service' : 'Latest message'}
            </span>
          </div>
          {!followAlong && (
            <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
              When {c.name || 'the church'} is streaming, the live service plays right here automatically. Between services the most recent message keeps playing — and the next live stream rolls in on its own when it starts.
            </p>
          )}

          {playerSrc ? (
            <>
              {/* Size + float controls — pure layout on the SAME iframe (no reload).
                  Shown whenever there's a player; float pops it to a corner mini so
                  the Word reads full-width. */}
              <div className="mt-3 flex items-center gap-1.5 flex-wrap text-[0.5625rem] uppercase tracking-wider">
                <span className="text-[#5A5751] font-semibold mr-0.5">Player</span>
                {!floating && !followAlong && ['s', 'm', 'l'].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setPlayerScale(sz)}
                    aria-pressed={playerScale === sz}
                    className={`px-2 py-1 min-h-[32px] border font-semibold focus:outline focus:outline-2 focus:outline-[#B85838] ${playerScale === sz ? 'border-[#B85838] bg-[#B85838] text-white' : 'border-[#CFC9BD] text-[#5A5751] hover:border-[#B85838] hover:text-[#B85838]'}`}
                  >
                    {sz === 's' ? 'Small' : sz === 'm' ? 'Medium' : 'Large'}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setFloating((f) => !f)}
                  aria-pressed={floating}
                  className={`px-2 py-1 min-h-[32px] border font-semibold focus:outline focus:outline-2 focus:outline-[#B85838] ${floating ? 'border-[#B85838] bg-[#B85838] text-white' : 'border-[#CFC9BD] text-[#5A5751] hover:border-[#B85838] hover:text-[#B85838]'}`}
                >
                  {floating ? '⤡ Dock' : '⤢ Pop out'}
                </button>
              </div>
              <div
                className={floating
                  ? 'fixed z-[60] w-[46vw] max-w-[300px] bg-[#1A1815] shadow-2xl rounded-md overflow-hidden'
                  : 'mt-2 aspect-video bg-[#1A1815]'}
                style={floating
                  ? (floatPos ? { left: `${floatPos.x}px`, top: `${floatPos.y}px` } : { right: '0.75rem', bottom: '5rem' })
                  : { width: playerScale === 's' ? '56%' : playerScale === 'l' ? '100%' : '80%' }}
              >
                {/* Drag grip — ONLY when floating. Lets you move the mini-player
                    ANYWHERE on screen (touch + mouse). It is a sibling BAR in the
                    SAME wrapper as the keyed iframe, so dragging/floating never
                    remounts the iframe — the stream keeps playing (Darrell 2026-07-18). */}
                {floating && (
                  <div
                    onPointerDown={onFloatPointerDown}
                    onPointerMove={onFloatPointerMove}
                    onPointerUp={onFloatPointerUp}
                    onPointerCancel={onFloatPointerUp}
                    className="flex items-center justify-between gap-2 px-2 h-7 bg-[#26211d] cursor-move touch-none select-none"
                  >
                    <span className="text-[0.5625rem] uppercase tracking-wider text-[#CFC9BD] flex items-center gap-1 pointer-events-none" aria-hidden="true">⠿ Drag</span>
                    <button
                      type="button"
                      onClick={() => { setFloating(false); setFloatPos(null); }}
                      aria-label="Dock the player back into the page"
                      className="text-[0.5625rem] uppercase tracking-wider text-[#EBA77E] hover:text-white font-semibold px-1.5 py-0.5 focus:outline focus:outline-2 focus:outline-white"
                    >
                      ⤡ Dock
                    </button>
                  </div>
                )}
                {/* iframe stays keyed + in the SAME wrapper so toggling size/float/drag
                    never remounts it (a remount would restart the stream). */}
                <div className={floating ? 'aspect-video' : 'contents'}>
                  <iframe
                    key={playerSrc}
                    src={playerSrc}
                    title={showLive ? `${c.name || 'Church'} — live worship broadcast` : `${c.name || 'Church'} — latest message`}
                    className="w-full h-full border-0"
                    allow="encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>
              {floating && !floatPos && (
                <p className="mt-2 text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
                  Playing in a small window — drag it anywhere by its grip, and tap <span className="font-semibold text-[#B85838]">Dock</span> to bring it back.
                </p>
              )}
            </>
          ) : (
            /* Fallback ONLY when no embeddable source resolves (e.g. a
               non-standard channel id with no derivable uploads playlist):
               never a dead frame — link straight out to the channel. */
            <div className="mt-3 aspect-video bg-[#1A1815] text-white flex flex-col items-center justify-center text-center gap-3 p-4">
              <p className="text-sm font-semibold">Watch {c.name || 'the church'} on YouTube</p>
              {channelUrl && (
                <a
                  href={channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-[#B85838] text-white px-3 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#9A4729] focus:outline focus:outline-2 focus:outline-white"
                >
                  Open the channel
                </a>
              )}
            </div>
          )}

          {/* Follow along in the Word (Darrell 2026-07-14): open the Scripture
              reader INLINE — below the player, on THIS page — so you watch the
              service AND read the Word together. It used to navigate to the
              Scripture tab, which moved you off the live video. */}
          <button
            type="button"
            onClick={() => (followAlong ? setFollowAlong(false) : openFollowAlong())}
            aria-expanded={followAlong}
            className="mt-3 inline-flex items-center gap-1.5 border border-[#B85838] text-[#B85838] px-3 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
          >
            <UiIcon name="book" /> {followAlong ? 'Close the Word' : 'Follow along in the Word'}
          </button>

          {!followAlong && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            {onlineServices.length > 0 && (
              <p className="text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
                <span className="text-[0.5625rem] uppercase tracking-wider text-[#B85838] font-semibold mr-1.5">Service times</span>
                {onlineServices.map(s => `${s.day} ${s.time}`).join(' · ')}
              </p>
            )}
            {channelUrl && (
              <a
                href={channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#B85838] hover:text-[#1A1815] underline focus:outline focus:outline-2 focus:outline-[#B85838]"
              >
                Watch on YouTube
              </a>
            )}
          </div>
          )}
          {/* Recent livestreams — the last 5 below the one now playing, pulled
              straight from the channel so they're always here (Darrell 2026-07-19). */}
          {!followAlong && priorStreams.length > 0 && (
            <div className="mt-4">
              <div className="text-[0.5625rem] uppercase tracking-wider text-[#B85838] font-semibold mb-2">Recent livestreams</div>
              <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 list-none p-0 m-0">
                {priorStreams.map((v) => (
                  <li key={v.videoId}>
                    <a
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group focus:outline focus:outline-2 focus:outline-[#B85838]"
                      title={v.title}
                    >
                      <div className="relative aspect-video bg-[#1A1815] overflow-hidden border border-[#E8E4DC]">
                        {v.thumbnail && (
                          <img src={v.thumbnail} alt="" loading="lazy" className="w-full h-full object-cover opacity-95 group-hover:opacity-100" />
                        )}
                        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-white text-2xl drop-shadow">▶</span>
                      </div>
                      <div className="mt-1 text-[0.6875rem] leading-tight text-[#1A1815] line-clamp-2 group-hover:text-[#B85838]" style={{ fontFamily: '"Fraunces", serif' }}>
                        {v.title || 'Livestream'}
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* The Word, INLINE — the Scripture reader opens right here on the same page
          as the live player above, so watching + following along happen together
          (never a navigate-away). Public: works signed in or not. */}
      {followAlong && (
        <section ref={followRef} aria-label="Follow along in the Word" className="bg-white border border-[#E8E4DC] p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Follow Along · The Word</h3>
            <button
              type="button"
              onClick={() => setFollowAlong(false)}
              className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] underline-offset-2 hover:underline focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              × Close
            </button>
          </div>
          <ScriptureLibrary email={email} canStudy={canStudy} setChurchView={setChurchView} />
        </section>
      )}

      {/* PASTORAL CONTENT — Bishop Gwin (D21). The Sermon-to-Content pipeline is
          LIVE (choir_sermons + video_transcripts + the Harvest Ledger); this
          entry point names the real progress and the real next action, never a
          dead end (audit: no-dead-ends, DR-0075). */}
      <section aria-labelledby="sermons-h" className="bg-white border border-[#1A1815] p-4">
        <h3 id="sermons-h" className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-1">Pastoral Content · Bishop Gwin</h3>
        <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
          Bishop Gwin's messages are being captioned, archived, and made searchable by the Sermon-to-Content pipeline — its real progress is on the Harvest Ledger (Church → Harvest), and recorded services play today from the Worship section above. The church owns every master file.
        </p>
        <button
          type="button"
          onClick={openFollowAlong}
          className="mt-2 inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]"
        >
          <UiIcon name="book" /> Follow along in the Word
        </button>
      </section>

      {/* MEDIA / BROADCAST */}
      {c.media && (
        <section aria-labelledby="media-h">
          <h3 id="media-h" className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] mb-2 pb-2 border-b border-[#1A1815]">Watch · Listen · Follow</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {c.media.youtube && <a href={c.media.youtube} target="_blank" rel="noopener noreferrer" className="bg-white border border-[#E8E4DC] hover:border-[#B85838] p-3 text-center focus:outline focus:outline-2 focus:outline-[#B85838]"><div className="text-2xl mb-1" aria-hidden="true">▶</div><div className="text-xs uppercase tracking-wider font-semibold">YouTube</div><div className="text-[0.625rem] text-[#5A5751]">Recorded services</div></a>}
            {c.media.facebook && <a href={c.media.facebook} target="_blank" rel="noopener noreferrer" className="bg-white border border-[#E8E4DC] hover:border-[#B85838] p-3 text-center focus:outline focus:outline-2 focus:outline-[#B85838]"><div className="text-2xl mb-1" aria-hidden="true">f</div><div className="text-xs uppercase tracking-wider font-semibold">Facebook</div><div className="text-[0.625rem] text-[#5A5751]">Love Corner Live</div></a>}
            {c.media.instagram && <a href={c.media.instagram} target="_blank" rel="noopener noreferrer" className="bg-white border border-[#E8E4DC] hover:border-[#B85838] p-3 text-center focus:outline focus:outline-2 focus:outline-[#B85838]"><div className="text-2xl mb-1" aria-hidden="true">◉</div><div className="text-xs uppercase tracking-wider font-semibold">Instagram</div><div className="text-[0.625rem] text-[#5A5751]">@tlcexperience</div></a>}
            {c.media.broadcast && <a href={c.media.broadcast} target="_blank" rel="noopener noreferrer" className="bg-white border border-[#E8E4DC] hover:border-[#B85838] p-3 text-center focus:outline focus:outline-2 focus:outline-[#B85838]"><div className="text-2xl mb-1" aria-hidden="true"><UiIcon name="radio" /></div><div className="text-xs uppercase tracking-wider font-semibold">Broadcast</div><div className="text-[0.625rem] text-[#5A5751]">All channels</div></a>}
          </div>
        </section>
      )}

      {/* GET / SHARE OUR APP (DR-0174) — the church's own door as a scannable
          code the congregation can pass on: project it, print it for the
          bulletin, or show a phone. Encodes SHARE_DOOR_URL (poetech.us/lovecorner
          → installs "The Love Corner"), one source with the door + manifest. */}
      <section aria-labelledby="shareapp-h">
        <h3 id="shareapp-h" className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] mb-2 pb-2 border-b border-[#1A1815]">Get our app · Share it</h3>
        <AppShareQR
          url={SHARE_DOOR_URL}
          shown="poetech.us/lovecorner"
          title="The Love Corner app"
          blurb="Point a phone camera at this code to install our church app — services, live worship, sermons, giving, and prayer, all in one place. Project it, print it for the bulletin, or just show your phone."
          ariaLabel="QR code to install The Love Corner church app"
        />
      </section>
        </>
      ),
    },
    {
      id: 'speak',
      label: 'Speak',
      icon: 'mic',
      render: () => (
        <>
      {/* ONE VOICE — the Church tab's single front door (COUNCIL-CHAMBER:
          one input, the system deduces; MODE-ROUTING: suggestion visible,
          person decides). Ordered first so speaking is always one tap away. */}
      {/* THE ONE INPUT SURFACE (DR-0131; Darrell 2026-07-09: "only have one
          input surface from PoeTech on any and all tabs"). The former second
          widget below this box saved notes to MEMORY ONLY and its Send was a
          raw mailto that yanked the whole surface into the mail app (the
          fast shift that can make a person dizzy). Everything it promised now
          rides THIS box, in place: every entry routes to a real persistent
          stream (church voice, prayer, PoeTech build directives → the NAS
          thought-inbox), the log below is the synced record, and emailing the
          office is an explicit secondary link that never navigates this
          surface. */}
      <ChurchOneVoice
        addPrayerRequest={addPrayerRequest}
        updateConference={updateConference}
        conference={conference}
        addChurchVoice={addChurchVoice}
        churchVoice={churchVoice}
        sendToPoeTech={sendToPoeTech}
        addIncident={addIncident}
        addInquiry={addInquiry}
        officeEmail={c.contactEmail || null}
      />

      {/* CONFERENCE / EVENT CENTER moved to its own Church sub-tab (sibling to
          Learn) on 2026-06-16 — see the churchView === 'conference' branch.
          ChurchOneVoice above still carries conference RSVPs via updateConference. */}

      {/* TESTIMONY DIARY — PIN-locked entry point (D21). The diary MVP V0 ships
          later (project_testimony_diary_glory_to_glory); this is the door. */}
      <section aria-labelledby="diary-h" className="bg-white border border-[#1A1815] p-4">
        <h3 id="diary-h" className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-1">Testimony Diary · Glory to Glory <UiIcon name="lock" /></h3>
        <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
          A private place to record what Yahweh has done — kept on your device, locked behind a PIN you set. "And we all... are being transformed... from one degree of glory to another" (2 Corinthians 3:18, ESV).
        </p>
        {!diaryUnlocked ? (
          <div className="mt-3 flex items-end gap-2 flex-wrap">
            <div>
              <label htmlFor="diary-pin" className={labelCls}>Set / enter your PIN</label>
              <input id="diary-pin" type="password" inputMode="numeric" className={`${fieldCls} max-w-[8rem]`} value={diaryPin} onChange={e => { setDiaryPin(e.target.value); setDiaryError(''); }} placeholder="4+ digits" />
            </div>
            <button type="button" onClick={() => { if ((diaryPin || '').length < 4) { setDiaryError('Use at least 4 digits.'); return; } setDiaryError(''); setDiaryUnlocked(true); }} className="text-xs uppercase tracking-wider px-3 py-2 bg-[#1A1815] text-white hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Unlock</button>
            {diaryError && <span role="alert" className="text-xs text-[#B85838]" style={{ fontFamily: '"Fraunces", serif' }}>{diaryError}</span>}
          </div>
        ) : (
          <p className="mt-3 text-sm bg-[#FAF8F4] border border-[#B85838] p-3" style={{ fontFamily: '"Fraunces", serif' }}>
            Your testimony diary is being prepared (V0 ships soon). Your PIN is held on this device only — nothing is sent anywhere. Come back to begin recording, from glory to glory.
          </p>
        )}
      </section>
        </>
      ),
    },
    {
      id: 'prayer',
      label: 'Prayer',
      icon: 'dove',
      render: () => (
        <>
      {/* PRAYER REQUESTS — local log, optional send-out */}
      <section aria-labelledby="pr-h">
        <div className="flex items-baseline justify-between mb-2 pb-2 border-b border-[#1A1815] gap-2 flex-wrap">
          <h3 id="pr-h" className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751]">Prayer Requests · {prayerRequests.length}</h3>
          <button type="button" onClick={() => { setShowPrForm(!showPrForm); setPrError(''); }} className="text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">{showPrForm ? '× Cancel' : '+ Add request'}</button>
        </div>
        <p className="text-xs text-[#5A5751] italic mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
          Logged locally on your device. Tap "Send" to forward a request to the church office through your email client — you stay in control of what leaves your device.
        </p>
        {showPrForm && (
          <div className="bg-white border border-[#B85838] p-3 mb-3 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div><label htmlFor="pr-name" className={labelCls}>Requested by</label><input id="pr-name" className={fieldCls} value={prForm.requester} onChange={e => setPrForm({ ...prForm, requester: e.target.value })} disabled={prForm.anonymous} placeholder={prForm.anonymous ? '(anonymous)' : 'Your name'} /></div>
              <div className="flex items-end gap-3">
                <label className="flex items-baseline gap-2 text-xs" style={{ fontFamily: '"Fraunces", serif' }}>
                  <input type="checkbox" checked={prForm.anonymous} onChange={e => setPrForm({ ...prForm, anonymous: e.target.checked })} className="accent-[#B85838]" /> Submit anonymously
                </label>
              </div>
            </div>
            <div><label htmlFor="pr-text" className={labelCls}>Prayer request</label><textarea id="pr-text" rows="3" className={fieldCls} value={prForm.request} onChange={e => setPrForm({ ...prForm, request: e.target.value })} /></div>
            <label className="flex items-baseline gap-2 text-xs" style={{ fontFamily: '"Fraunces", serif' }}>
              <input type="checkbox" checked={prForm.shareWithChurch} onChange={e => setPrForm({ ...prForm, shareWithChurch: e.target.checked })} className="accent-[#B85838]" /> Mark as ready to share with the church
            </label>
            <button type="button" onClick={submitPrayer} className="w-full bg-[#1A1815] text-white py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Save Prayer Request</button>
            {prError && <p role="alert" className="text-xs text-[#B85838]" style={{ fontFamily: '"Fraunces", serif' }}>{prError}</p>}
          </div>
        )}
        {prayerRequests.length === 0 ? (
          <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No prayer requests logged yet.</p>
        ) : (
          <div className="bg-white border border-[#1A1815]">
            {[...prayerRequests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((pr, i, arr) => (
              <div key={pr.id} className={`p-3 ${i < arr.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{pr.createdAt.slice(0, 10)} · {pr.requester || '(anonymous)'}</div>
                    <div className="text-sm mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}><EmojiText text={pr.request} /></div>
                    <div className="text-[0.625rem] uppercase tracking-wider mt-1 text-[#5A5751]">{pr.sentAt ? `✓ sent ${pr.sentAt.slice(0, 10)}` : pr.shareWithChurch ? 'ready to share' : 'private'}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {pr.shareWithChurch && !pr.sentAt && (
                      <a href={mailtoFor(pr)} target={c.contactEmail ? '_self' : '_blank'} rel="noopener noreferrer" onClick={() => markPrayerRequestSent(pr.id)} className="text-xs uppercase tracking-wider px-3 py-1.5 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white min-h-[36px] inline-flex items-center focus:outline focus:outline-2 focus:outline-[#B85838]">Send →</a>
                    )}
                    <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC] mx-1" />
                    <button type="button" onClick={() => { if (confirm('Delete this prayer request?')) deletePrayerRequest(pr.id); }} aria-label={`Delete prayer request from ${pr.requester}`} className="text-sm text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
        </>
      ),
    },
    {
      id: 'give',
      label: 'Give & Serve',
      icon: 'coins',
      render: () => (
        <>
      {/* GIVE + PARISH LIFE */}
      <section aria-labelledby="give-h" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {c.links?.give && (
          <div className="bg-white border-2 border-[#B85838] p-4">
            <h3 id="give-h" className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">Tithes · Offering · Gifts</h3>
            <p className="text-sm leading-relaxed text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>Giving runs through the church's own secure page — no payment data passes through this app.</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <a href={c.links.give} target="_blank" rel="noopener noreferrer" className="text-xs uppercase tracking-wider px-3 py-2 bg-[#1A1815] text-white hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Give →</a>
              {c.links.giversCreed && <a href={c.links.giversCreed} target="_blank" rel="noopener noreferrer" className="text-xs uppercase tracking-wider px-3 py-2 border border-[#1A1815] hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">Givers Creed</a>}
            </div>
          </div>
        )}
        <div className="bg-white border border-[#1A1815] p-4">
          <h3 className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-1">Parish Life</h3>
          {Array.isArray(c.announcedEvents) && c.announcedEvents.length > 0 && (
            <ul className="text-xs space-y-1.5 mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
              {c.announcedEvents.map((ev) => (
                <li key={ev.id} className="flex items-baseline justify-between gap-2 flex-wrap">
                  <span>
                    <UiIcon name="calendar" /> <strong>{ev.name}</strong>
                    {' '}· {ev.date}{ev.endDate ? ` → ${ev.endDate}` : ''}{ev.detail ? ` · ${ev.detail}` : ''}
                  </span>
                  {addEvent && (
                    <button
                      type="button"
                      onClick={() => addEvent({ id: `church-${ev.id}`, title: ev.name, date: ev.date, time: '', notes: ev.detail || '' })}
                      className="text-[0.625rem] uppercase tracking-wider px-2 py-1 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
                    >
                      + Calendar
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <ul className="text-xs space-y-1.5" style={{ fontFamily: '"Fraunces", serif' }}>
            {c.links?.calendar && <li><UiIcon name="calendar" /> <a href={c.links.calendar} target="_blank" rel="noopener noreferrer" className="underline text-[#B85838] hover:text-[#1A1815]">Church calendar</a></li>}
            {c.links?.bibleChallenge && <li><UiIcon name="bookOpen" /> <a href={c.links.bibleChallenge} target="_blank" rel="noopener noreferrer" className="underline text-[#B85838] hover:text-[#1A1815]">Bible Reading Challenge 2026</a></li>}
            {c.links?.classPoints && <li><UiIcon name="pencil" /> <a href={c.links.classPoints} target="_blank" rel="noopener noreferrer" className="underline text-[#B85838] hover:text-[#1A1815]">Bible study class points</a></li>}
            {c.links?.lettersFromBG && <li><UiIcon name="mail" /> <a href={c.links.lettersFromBG} target="_blank" rel="noopener noreferrer" className="underline text-[#B85838] hover:text-[#1A1815]">Letters from Bishop Gwin</a></li>}
            {c.links?.assembly && <li><UiIcon name="landmark" /> <a href={c.links.assembly} target="_blank" rel="noopener noreferrer" className="underline text-[#B85838] hover:text-[#1A1815]">National Assembly</a></li>}
            {c.links?.stayConnected && <li><UiIcon name="link" /> <a href={c.links.stayConnected} target="_blank" rel="noopener noreferrer" className="underline text-[#B85838] hover:text-[#1A1815]">Stay connected</a></li>}
          </ul>
        </div>
      </section>

      {/* MINISTRY INTEREST */}
      {c.links?.ministries && (
        <section aria-labelledby="min-h" className="bg-white border border-[#1A1815] p-4">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <h3 id="min-h" className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">Ministry Opportunities</h3>
            <button type="button" onClick={() => setShowMinistryForm(!showMinistryForm)} className="text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">{showMinistryForm ? '× Cancel' : '+ Express interest'}</button>
          </div>
          <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Where you'd like to serve, what hours fit your life. Your note goes to the church office via your email client — nothing is sent through us.</p>
          <a href={c.links.ministries} target="_blank" rel="noopener noreferrer" className="text-xs uppercase tracking-wider text-[#B85838] underline hover:text-[#1A1815] inline-block mt-2">See current openings →</a>
          {showMinistryForm && (
            <div className="mt-3 bg-[#FAF8F4] border border-[#B85838] p-3 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><label htmlFor="min-name" className={labelCls}>Your name</label><input id="min-name" className={fieldCls} value={ministryInterest.name} onChange={e => setMinistryInterest({ ...ministryInterest, name: e.target.value })} /></div>
                <div><label htmlFor="min-email" className={labelCls}>Email (so they can reply)</label><input id="min-email" type="email" className={fieldCls} value={ministryInterest.email} onChange={e => setMinistryInterest({ ...ministryInterest, email: e.target.value })} /></div>
              </div>
              <div><label htmlFor="min-interest" className={labelCls}>Ministry of interest</label><input id="min-interest" className={fieldCls} placeholder="e.g., Music · Youth · Tech · Outreach" value={ministryInterest.interest} onChange={e => setMinistryInterest({ ...ministryInterest, interest: e.target.value })} /></div>
              <div><label htmlFor="min-skills" className={labelCls}>Skills · availability</label><textarea id="min-skills" rows="3" className={fieldCls} value={ministryInterest.skills} onChange={e => setMinistryInterest({ ...ministryInterest, skills: e.target.value })} /></div>
              <button type="button" onClick={submitMinistry} className="w-full bg-[#1A1815] text-white py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Send to Church Office</button>
              {ministryNote && <p role="alert" className="text-xs text-[#B85838]" style={{ fontFamily: '"Fraunces", serif' }}>{ministryNote}</p>}
            </div>
          )}
        </section>
      )}
        </>
      ),
    },
    {
      id: 'times',
      label: 'Times',
      icon: 'calendar',
      render: () => (
        <>
      {/* SERVICE TIMES + SAVE TO CALENDAR */}
      {(c.services || []).length > 0 && (
        <section aria-labelledby="svc-h">
          <h3 id="svc-h" className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] mb-2 pb-2 border-b border-[#1A1815]">Service Times · in-person + online</h3>
          <div className="bg-white border border-[#1A1815]">
            {c.services.map((svc, i, arr) => (
              <div key={svc.id} className={`p-3 flex items-center justify-between gap-3 flex-wrap ${i < arr.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
                <div className="min-w-0">
                  <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">{svc.day}</div>
                  <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{svc.label} · <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 500 }}>{svc.time}{svc.endTime ? `–${svc.endTime}` : ''}</span></div>
                  {svc.online && <div className="text-[0.625rem] text-[#5A6E3D] uppercase tracking-wider">✓ live online</div>}
                </div>
                <button type="button" onClick={() => saveServiceToCalendar(svc)} className="text-xs uppercase tracking-wider px-3 py-2 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"><UiIcon name="calendar" /> Save next one</button>
              </div>
            ))}
          </div>
        </section>
      )}
        </>
      ),
    },
    {
      id: 'about',
      label: 'About',
      icon: 'landmark',
      render: () => (
        <>
      {/* HEADER (moved to bottom 2026-05-25 per Darrell — the church-identity "ad"
          lives below the spiritual + parish-life surfaces so the page opens with
          the actions, not with the marquee). */}
      <section className="bg-white border border-[#1A1815] p-5">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-medium mb-1">Home Church</div>
        <h2 className="text-2xl sm:text-3xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>{c.name}{c.founded && <span className="text-sm text-[#5A5751] font-normal ml-2" style={{ letterSpacing: 0 }}>· Est. {c.founded}</span>}</h2>
        {c.nickname && <div className="text-base text-[#5A5751] italic mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{c.nickname}</div>}
        {c.tagline && <p className="text-sm text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>{c.tagline}</p>}
        {c.verse && (
          <blockquote className="mt-3 border-l-2 border-[#B85838] pl-3 text-sm italic" style={{ fontFamily: '"Fraunces", serif' }}>
            "{c.verse.text}" <span className="not-italic text-[#5A5751] text-xs"> — {c.verse.ref}</span>
          </blockquote>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 text-xs" style={{ fontFamily: '"Fraunces", serif' }}>
          {c.address && <div><div className={labelCls}>Location</div><div>{c.address}</div></div>}
          {c.pastor && <div><div className={labelCls}>Pastor</div><div>{c.pastor}</div></div>}
          {c.phone && <div><div className={labelCls}>Phone</div><a href={`tel:${c.phone.replace(/[^0-9]/g, '')}`} className="underline text-[#B85838] hover:text-[#1A1815]">{c.phone}</a></div>}
          {c.officeHours && <div><div className={labelCls}>Office</div><div>{c.officeHours}</div></div>}
        </div>
        <div className="mt-3 flex gap-2 flex-wrap">
          {c.site && <a href={c.site} target="_blank" rel="noopener noreferrer" className="text-xs uppercase tracking-wider px-3 py-2 bg-[#1A1815] text-white hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Visit Church Site →</a>}
          {c.links?.about && <a href={c.links.about} target="_blank" rel="noopener noreferrer" className="text-xs uppercase tracking-wider px-3 py-2 border border-[#1A1815] hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">About Us →</a>}
        </div>
      </section>

      {/* MULTI-CHURCH DIRECTORY (D21, skeleton) — one church today (COLG, the
          public anchor entry); grows as partners join. Partner-church alignment
          is Word-first + non-denominational + Christ-confessing (Q8 framework
          per project_non_denominational_word_first_body_undivided). Full
          partner-onboarding flow ships V2. */}
      <section aria-labelledby="dir-h" className="bg-white border border-[#1A1815] p-4">
        <div className="flex items-baseline justify-between gap-2 flex-wrap mb-2 pb-2 border-b border-[#1A1815]">
          <h3 id="dir-h" className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">Church Directory</h3>
          <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">My church home: COLG (default)</span>
        </div>
        <div className="border border-[#E8E4DC]">
          <div className="p-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>The Church of the Living God</div>
              <div className="text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>The Love Corner · Champaign, IL · your default church home</div>
            </div>
            <span className="text-[0.625rem] uppercase tracking-wider px-2 py-1 border border-[#5A6E3D] text-[#5A6E3D] shrink-0">Default</span>
          </div>
        </div>
        <p className="text-xs text-[#5A5751] mt-3" style={{ fontFamily: '"Fraunces", serif' }}>More churches coming as they join PoeTech.</p>
        <div className="mt-2">
          <button type="button" onClick={() => { setShowInviteForm(!showInviteForm); setInviteSent(false); setInviteError(''); }} className="text-xs uppercase tracking-wider px-3 py-2 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">{showInviteForm ? '× Close' : 'Your church not here? Invite them'}</button>
        </div>
        {showInviteForm && !inviteSent && (
          <div className="mt-3 bg-[#FAF8F4] border border-[#B85838] p-3 space-y-2">
            <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>Tell us about your church home and we'll reach out about joining the PoeTech partner directory.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div><label htmlFor="inv-church" className={labelCls}>Church name</label><input id="inv-church" className={fieldCls} value={inviteForm.churchName} onChange={e => setInviteForm({ ...inviteForm, churchName: e.target.value })} /></div>
              <div><label htmlFor="inv-city" className={labelCls}>City / state</label><input id="inv-city" className={fieldCls} value={inviteForm.city} onChange={e => setInviteForm({ ...inviteForm, city: e.target.value })} /></div>
              <div><label htmlFor="inv-name" className={labelCls}>Your name</label><input id="inv-name" className={fieldCls} value={inviteForm.contactName} onChange={e => setInviteForm({ ...inviteForm, contactName: e.target.value })} /></div>
              <div><label htmlFor="inv-email" className={labelCls}>Email (so we can reply)</label><input id="inv-email" type="email" className={fieldCls} value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} /></div>
            </div>
            <div><label htmlFor="inv-note" className={labelCls}>Anything else? (optional)</label><textarea id="inv-note" rows="2" className={fieldCls} value={inviteForm.note} onChange={e => setInviteForm({ ...inviteForm, note: e.target.value })} /></div>
            <button type="button" onClick={() => { if (!inviteForm.churchName || !inviteForm.email) { setInviteError('Add at least your church name and an email.'); return; } setInviteError(''); setInviteSent(true); }} className="w-full bg-[#1A1815] text-white py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Send invite</button>
            {inviteError && <p role="alert" className="text-xs text-[#B85838]" style={{ fontFamily: '"Fraunces", serif' }}>{inviteError}</p>}
          </div>
        )}
        {inviteSent && (
          <p className="mt-3 text-sm bg-[#FAF8F4] border border-[#5A6E3D] p-3" style={{ fontFamily: '"Fraunces", serif' }}>
            Thank you — we'll reach out about joining the PoeTech partner directory. Partner churches are Word-first, non-denominational in posture, and Christ-confessing.
          </p>
        )}
      </section>

      <p className="text-[0.625rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
        Content links to the church's own pages. Service times, media, and ministry openings live on <a href={c.site} target="_blank" rel="noopener noreferrer" className="underline">{(c.site || '').replace(/^https?:\/\//, '')}</a> — this tab is a shortcut, not a copy. Edits to service times can be made in the seed data ({`data.church.services`}) as the church publishes them.
      </p>
        </>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Obvious LOG IN / CREATE ACCOUNT — signed-out only. The community is
          public (no account needed to look around); this is the clear way for a
          member/staff/admin to sign in, or anyone to make an account to request a
          ride and save their place. */}
      {!signedIn && (
        <div className="bg-white border-2 border-[#1A1815] p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-0.5">The Love Corner</div>
            <p className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>Members &amp; staff — log in to your account. New here? Create one to request a ride and save your place.</p>
          </div>
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="shrink-0 inline-flex items-center px-5 py-3 bg-[#1A1815] text-white text-sm font-semibold uppercase tracking-wider hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
          >
            Log in / Create account
          </button>
        </div>
      )}
      {!signedIn && (
        <AuthModal open={loginOpen} onClose={() => setLoginOpen(false)} onSignedIn={() => setLoginOpen(false)} mode="signup" />
      )}

      {/* DEFAULT CHURCH HOME NOTE (D21) — shown when the user has not set their
          own church home; COLG / The Love Corner is the platform default (the
          Father's Business anchor). Mars Hill Option B: the visitor who
          navigates to this tab is opted-in to deeper engagement. */}
      {showingDefaultHome && (
        <p className="text-[0.6875rem] text-[#5A5751] bg-[#FAF8F4] border border-[#E8E4DC] px-3 py-2" style={{ fontFamily: '"Fraunces", serif' }}>
          This is your default church home — The Church of the Living God, the platform&apos;s first community. Choosing your own church home opens as partner churches join the directory; until then, the real next step is inviting yours from the Church Directory (About section).
        </p>
      )}

      <SectionTabs sections={sections} ariaLabel="Church" idBase="church" defaultId={initialSection || 'worship'} />
    </div>
  );
}
