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
import React, { useState, useRef } from 'react';
import { liveStatus, liveStreamEmbedUrl, latestUploadEmbedUrl } from '../lib/church-live.js';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';
import { ChurchOneVoice } from './ChurchOneVoice.jsx';
import UiIcon from './UiIcon.jsx';
import EmojiText from './EmojiText.jsx';

export function ChurchHome({ church, prayerRequests, addPrayerRequest, markPrayerRequestSent, deletePrayerRequest, addEvent, conference, updateConference, churchVoice = [], addChurchVoice, sendToPoeTech, addIncident, addInquiry }) {
  const [prForm, setPrForm] = useState({ requester: '', request: '', shareWithChurch: true, anonymous: false });
  const [prError, setPrError] = useState('');
  const [showPrForm, setShowPrForm] = useState(false);
  const [ministryInterest, setMinistryInterest] = useState({ name: '', email: '', interest: '', skills: '' });
  const [showMinistryForm, setShowMinistryForm] = useState(false);
  const [ministryNote, setMinistryNote] = useState('');
  // Live Worship: the player auto-mounts only inside a plausible service window
  // (see lib/church-live.js). Outside it, the visitor can still open the player
  // on demand for an off-schedule stream — this latches that explicit choice.
  const [openLivePlayer, setOpenLivePlayer] = useState(false);

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

  // ---------------------------------------------------------------------------
  // ADD YOUR VOICE — interactive contribution input (2026-05-25, per Darrell):
  // parishioners speak (Web Speech API) or paste a link to drop a note about
  // anything on the church tab — today's sermon, an article, a question for
  // leadership, a ministry idea, a building-fund follow-up. Stored locally
  // for now; future-state syncs to the v2.7 `interactions` table (schema
  // already declared in infra/supabase/schema-v2.7-church.sql §11.5 area).
  // POE binding: the user controls the mic, the link, the topic, and the
  // moment to share. Nothing leaves the device until they tap Send.
  // ---------------------------------------------------------------------------
  const [contribForm, setContribForm] = useState({ topic: '', text: '', link: '' });
  const [contribError, setContribError] = useState('');
  // Per Darrell 2026-05-25: the contribution form is the church tab's center of
  // gravity — open by default so the prompt is one tap away ("speak / type / link"
  // is the action, not a hidden affordance).
  const [showContribForm, setShowContribForm] = useState(true);
  const [contributions, setContributions] = useState([]);  // local-only until v2.7 sync wires up
  // Pagination — match the Queue / Feedback Log pattern: most-recent 5 on the
  // page; older entries reachable with ← / → arrows.
  const CONTRIB_PAGE_SIZE = 5;
  const [contribPage, setContribPage] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Feature detection — Web Speech API (still vendor-prefixed in some browsers)
  const speechSupported = typeof window !== 'undefined'
    && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const toggleSpeech = () => {
    if (!speechSupported) {
      setContribError('Voice input is not supported in this browser. Type your note or paste a link instead.');
      return;
    }
    if (isListening) {
      try { recognitionRef.current?.stop(); } catch (_) { /* ignore */ }
      setIsListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = 'en-US';
    r.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(res => res[0].transcript)
        .join(' ')
        .trim();
      if (transcript) {
        setContribForm(prev => ({
          ...prev,
          text: prev.text ? `${prev.text} ${transcript}`.trim() : transcript,
        }));
      }
    };
    r.onerror = (e) => {
      setContribError(`Voice input error: ${e.error || 'unknown'}. Type your note instead.`);
      setIsListening(false);
    };
    r.onend = () => setIsListening(false);
    recognitionRef.current = r;
    setContribError('');
    try {
      r.start();
      setIsListening(true);
    } catch (err) {
      setContribError('Could not start voice input. Type your note or paste a link instead.');
      setIsListening(false);
    }
  };

  const submitContribution = () => {
    const topic = (contribForm.topic || '').trim();
    const text  = (contribForm.text  || '').trim();
    const link  = (contribForm.link  || '').trim();
    if (!text && !link) {
      setContribError('Add a note (speak or type) or paste a link before saving.');
      return;
    }
    // Light URL sanity check — non-blocking; the user can still save if they
    // typed something that isn't a parseable URL.
    if (link && !/^https?:\/\//i.test(link)) {
      setContribError('Links should start with http:// or https://. Edit and re-save.');
      return;
    }
    setContribError('');
    const entry = {
      id: `contrib-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      topic, text, link,
      createdAt: new Date().toISOString(),
      sentAt: null,
    };
    setContributions(prev => [entry, ...prev]);
    setContribForm({ topic: '', text: '', link: '' });
    setShowContribForm(false);
  };

  const mailtoForContribution = (contrib) => {
    const subject = `Church-tab note${contrib.topic ? ` — ${contrib.topic}` : ''}`;
    const body =
      `Sent from PoeTech Family OS · Church tab.\n\n` +
      (contrib.topic ? `About: ${contrib.topic}\n\n` : '') +
      (contrib.text  ? `Note:\n${contrib.text}\n\n` : '') +
      (contrib.link  ? `Link: ${contrib.link}\n` : '');
    if (c.contactEmail) return `mailto:${c.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return c.links?.stayConnected || c.site || '#';
  };

  const markContributionSent = (id) => {
    const at = new Date().toISOString();
    setContributions(prev => prev.map(c => c.id === id ? { ...c, sentAt: at } : c));
  };

  const deleteContribution = (id) => {
    setContributions(prev => prev.filter(c => c.id !== id));
  };

  // Default church home (D21): COLG / The Love Corner is the platform default
  // that every user lands on until they set their own church home in Settings
  // (the Father's Business anchor — the unchurched get access to OUR church).
  // A user who has set a real custom church home sees that instead; a demo
  // viewer's anonymized 'Your home church' placeholder resolves to the COLG
  // public directory entry. COLG directory info is public-by-design (the named
  // first community per COMMUNITY-FIRST-MISSION), distinct from private seed.
  const resolvedChurch = (church && church.name && church.name !== 'Your home church')
    ? church
    : COLG_DEFAULT_CHURCH;
  // Backfill the COLG live-broadcast channel onto a saved COLG home that predates
  // the youtubeChannelId field (2026-06-15). A real saved record can drop a field
  // the seed default carries, which suppressed Live Worship for COLG members whose
  // home was saved before the field shipped. Only backfills when the record is
  // identifiably COLG AND the id is actually missing — a genuinely different church
  // with no channel id still correctly shows no broadcast (never COLG's stream on
  // someone else's page). Reality-Trace P15/P16.
  const looksLikeCOLG =
    /church of the living god/i.test(resolvedChurch.name || '') ||
    /love corner/i.test(resolvedChurch.nickname || '') ||
    (resolvedChurch.site || '').includes('thechurchofthelivinggod');
  const c = (looksLikeCOLG && !(resolvedChurch.youtubeChannelId || '').trim())
    ? {
        ...resolvedChurch,
        youtubeChannelId: COLG_DEFAULT_CHURCH.youtubeChannelId,
        media: { ...COLG_DEFAULT_CHURCH.media, ...(resolvedChurch.media || {}) },
      }
    : resolvedChurch;
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
  const liveSrc = liveStreamEmbedUrl(liveChannelId);     // live broadcast embed
  const latestSrc = latestUploadEmbedUrl(liveChannelId); // rolling latest upload
  const channelUrl = c.media?.youtube || (liveChannelId ? `https://www.youtube.com/channel/${liveChannelId}` : null);
  const onlineServices = (c.services || []).filter(s => s && s.online !== false);
  // Honest, no-API-key live gate: are we inside a published online-service
  // window right now? Inside it (or on explicit open) we show the live embed;
  // otherwise we roll the latest upload — never a blank/waiting frame.
  const liveNow = liveStatus(onlineServices);
  const showLive = !!liveSrc && (liveNow.live || openLivePlayer);
  // The source actually mounted: live broadcast in-window, else latest upload.
  const playerSrc = showLive ? liveSrc : latestSrc;
  // Render the section whenever we have ANY honest source (live or latest).
  const hasWorshipPlayer = !!liveSrc || !!latestSrc;

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

  return (
    <div className="space-y-6">
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
        <section aria-labelledby="live-worship-h" className="bg-white border-2 border-[#B85838] p-4">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <h3 id="live-worship-h" className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">
              Live Worship · {c.nickname && /love corner/i.test(c.nickname) ? 'The Love Corner' : (c.name || 'Church')}
            </h3>
            <span className="inline-flex items-center gap-1.5 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">
              <span className="w-2 h-2 rounded-full bg-[#B85838]" aria-hidden="true" />
              {showLive ? 'Live service' : 'Latest message'}
            </span>
          </div>
          <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
            When {c.name || 'the church'} is streaming, the live service plays right here automatically. Between services the most recent message keeps playing — and the next live stream rolls in on its own when it starts.
          </p>

          {playerSrc ? (
            <div className="mt-3 aspect-video bg-[#1A1815]">
              <iframe
                key={playerSrc}
                src={playerSrc}
                title={showLive ? `${c.name || 'Church'} — live worship broadcast` : `${c.name || 'Church'} — latest message`}
                className="w-full h-full border border-[#1A1815]"
                allow="encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                loading="lazy"
              />
            </div>
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

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            {onlineServices.length > 0 && (
              <p className="text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
                <span className="text-[0.5625rem] uppercase tracking-wider text-[#B85838] font-semibold mr-1.5">Service times</span>
                {onlineServices.map(s => `${s.day} ${s.time}`).join(' · ')}
              </p>
            )}
            {/* Escape hatch: an off-schedule stream may be live outside the
                published window. While we're showing the latest upload, let the
                visitor switch to the live broadcast on demand. */}
            {!showLive && liveSrc && (
              <button
                type="button"
                onClick={() => setOpenLivePlayer(true)}
                className="inline-flex items-center gap-1 text-[#B85838] hover:text-[#1A1815] underline focus:outline focus:outline-2 focus:outline-[#B85838]"
              >
                Streaming now? Switch to the live player
              </button>
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
        </section>
      )}

      {/* DEFAULT CHURCH HOME NOTE (D21) — shown when the user has not set their
          own church home; COLG / The Love Corner is the platform default (the
          Father's Business anchor). Mars Hill Option B: the visitor who
          navigates to this tab is opted-in to deeper engagement. */}
      {showingDefaultHome && (
        <p className="text-[0.6875rem] text-[#5A5751] bg-[#FAF8F4] border border-[#E8E4DC] px-3 py-2" style={{ fontFamily: '"Fraunces", serif' }}>
          This is your default church home. If you have a church home, you can set it in{' '}
          <button type="button" onClick={() => alert('Coming soon: pick your own church home. Default = The Church of the Living God.')} className="underline text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">Settings &rarr; My church home</button>.
        </p>
      )}

      {/* ONE VOICE — the Church tab's single front door (COUNCIL-CHAMBER:
          one input, the system deduces; MODE-ROUTING: suggestion visible,
          person decides). Ordered first so speaking is always one tap away. */}
      <ChurchOneVoice
        addPrayerRequest={addPrayerRequest}
        updateConference={updateConference}
        conference={conference}
        addChurchVoice={addChurchVoice}
        churchVoice={churchVoice}
        sendToPoeTech={sendToPoeTech}
        addIncident={addIncident}
        addInquiry={addInquiry}
      />

      {/* CONFERENCE / EVENT CENTER moved to its own Church sub-tab (sibling to
          Learn) on 2026-06-16 — see the churchView === 'conference' branch.
          ChurchOneVoice above still carries conference RSVPs via updateConference. */}

      {/* PASTORAL CONTENT — Bishop Gwin (D21). The Sermon-to-Content pipeline is
          a post-vacation build; this is the entry point + placeholder. */}
      <section aria-labelledby="sermons-h" className="bg-white border border-[#1A1815] p-4">
        <h3 id="sermons-h" className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-1">Pastoral Content · Bishop Gwin</h3>
        <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
          Sermons coming soon. Bishop Gwin's messages will be captioned, archived, and searchable here as the Sermon-to-Content pipeline comes online. The church owns every master file.
        </p>
      </section>

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

      {/* YAHWEH HEARS YOU — interactive contribution input (renamed 2026-05-25 per Darrell)
          The church tab's spiritual-surface name for the voice + link + text
          processing center. Per CLAUDE.md typographic theology (Yahweh always
          capitalized) and per the Holy Spirit Integration Worldview binding —
          this title testifies directly: the user speaks; Yahweh hears. The
          warmer-but-secular default ("Your Voice Matters") is reserved for the
          reusable InputCenter component (app/src/components/InputCenter.jsx)
          for use in non-spiritual modules. Below the church-identity "ad" and
          above the Service Times block. Speak (Web Speech API), paste a link,
          or type. Logged locally; sent to the church office via the user's
          email client when they tap Send. */}
      <section aria-labelledby="contrib-h" className="bg-white border-2 border-[#B85838] p-4">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <h3 id="contrib-h" className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Yahweh Hears You · Speak · Type · Link</h3>
          <button type="button" onClick={() => { setShowContribForm(!showContribForm); setContribError(''); }} className="text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">{showContribForm ? '× Cancel' : '+ Speak or share'}</button>
        </div>
        <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
          Speak it, type it, or paste a link — about today's sermon, an article worth sharing, a question for leadership, a ministry idea, a thought you don't want to lose. Logged on your device; send to the church office when you're ready.
        </p>

        {showContribForm && (
          <div className="mt-3 bg-[#FAF8F4] border border-[#B85838] p-3 space-y-2">
            <div>
              <label htmlFor="contrib-topic" className={labelCls}>What's this about? (optional)</label>
              <input
                id="contrib-topic"
                className={fieldCls}
                placeholder="e.g., Today's sermon · Building fund · Ministry idea"
                value={contribForm.topic}
                onChange={e => setContribForm({ ...contribForm, topic: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="contrib-text" className={labelCls}>Your note (type or speak)</label>
              <textarea
                id="contrib-text"
                rows="3"
                className={fieldCls}
                placeholder="Type here, or tap the mic to speak."
                value={contribForm.text}
                onChange={e => setContribForm({ ...contribForm, text: e.target.value })}
              />
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <button
                  type="button"
                  onClick={toggleSpeech}
                  aria-pressed={isListening}
                  aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                  disabled={!speechSupported}
                  className={`text-xs uppercase tracking-wider px-3 py-2 border focus:outline focus:outline-2 focus:outline-[#B85838] ${
                    isListening
                      ? 'bg-[#B85838] text-white border-[#B85838] animate-pulse'
                      : speechSupported
                        ? 'border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white'
                        : 'border-[#E8E4DC] text-[#5A5751] opacity-60 cursor-not-allowed'
                  }`}
                >
                  {isListening ? <><UiIcon name="stop" /> Stop</> : <><UiIcon name="mic" /> Speak</>}
                </button>
                {!speechSupported && (
                  <span className="text-[0.625rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
                    Voice input not available in this browser — type your note instead.
                  </span>
                )}
                {isListening && (
                  <span className="text-[0.625rem] text-[#B85838] uppercase tracking-wider" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    listening…
                  </span>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="contrib-link" className={labelCls}>Or paste a link</label>
              <input
                id="contrib-link"
                type="url"
                className={fieldCls}
                placeholder="https://…"
                value={contribForm.link}
                onChange={e => setContribForm({ ...contribForm, link: e.target.value })}
              />
            </div>
            <button
              type="button"
              onClick={submitContribution}
              className="w-full bg-[#1A1815] text-white py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              Save Note
            </button>
            {contribError && (
              <p role="alert" className="text-xs text-[#B85838]" style={{ fontFamily: '"Fraunces", serif' }}>
                {contribError}
              </p>
            )}
          </div>
        )}

        {contributions.length > 0 && (() => {
          const totalPages = Math.max(1, Math.ceil(contributions.length / CONTRIB_PAGE_SIZE));
          const safePage = Math.min(contribPage, totalPages - 1);
          const start = safePage * CONTRIB_PAGE_SIZE;
          const pageItems = contributions.slice(start, start + CONTRIB_PAGE_SIZE);
          return (
          <>
          <div className="mt-3 border border-[#1A1815]">
            {pageItems.map((entry, i, arr) => (
              <div key={entry.id} className={`p-3 ${i < arr.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                      {entry.createdAt.slice(0, 10)}{entry.topic ? ` · ${entry.topic}` : ''}
                    </div>
                    {entry.text && (
                      <div className="text-sm mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}><EmojiText text={entry.text} /></div>
                    )}
                    {entry.link && (
                      <div className="text-xs mt-0.5">
                        <a
                          href={entry.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-[#B85838] hover:text-[#1A1815] break-all"
                        >
                          {entry.link}
                        </a>
                      </div>
                    )}
                    <div className="text-[0.625rem] uppercase tracking-wider mt-1 text-[#5A5751]">
                      {entry.sentAt ? `✓ sent ${entry.sentAt.slice(0, 10)}` : 'private (on this device)'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!entry.sentAt && (
                      <a
                        href={mailtoForContribution(entry)}
                        target={c.contactEmail ? '_self' : '_blank'}
                        rel="noopener noreferrer"
                        onClick={() => markContributionSent(entry.id)}
                        className="text-xs uppercase tracking-wider px-3 py-1.5 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white min-h-[36px] inline-flex items-center focus:outline focus:outline-2 focus:outline-[#B85838]"
                      >
                        Send →
                      </a>
                    )}
                    <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC] mx-1" />
                    <button
                      type="button"
                      onClick={() => { if (confirm('Delete this note?')) deleteContribution(entry.id); }}
                      aria-label="Delete this note"
                      className="text-sm text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-2 flex items-center justify-between gap-2 text-[0.625rem] uppercase tracking-wider text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <button
                type="button"
                onClick={() => setContribPage(p => Math.max(0, p - 1))}
                disabled={safePage === 0}
                aria-label="Previous page of notes"
                className="px-3 py-1.5 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed focus:outline focus:outline-2 focus:outline-[#B85838]"
              >
                ← prev
              </button>
              <div>
                Page {safePage + 1} of {totalPages} · {contributions.length} note{contributions.length === 1 ? '' : 's'}
              </div>
              <button
                type="button"
                onClick={() => setContribPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
                aria-label="Next page of notes"
                className="px-3 py-1.5 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed focus:outline focus:outline-2 focus:outline-[#B85838]"
              >
                next →
              </button>
            </div>
          )}
          </>
          );
        })()}
      </section>

      {/* SERVICE TIMES + SAVE TO CALENDAR */}
      {(c.services || []).length > 0 && (
        <section aria-labelledby="svc-h">
          <h3 id="svc-h" className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] mb-2 pb-2 border-b border-[#1A1815]">Service Times · in-person + online</h3>
          <div className="bg-white border border-[#1A1815]">
            {c.services.map((svc, i, arr) => (
              <div key={svc.id} className={`p-3 flex items-center justify-between gap-3 flex-wrap ${i < arr.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
                <div className="min-w-0">
                  <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">{svc.day}</div>
                  <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{svc.label} · <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 500 }}>{svc.time}</span></div>
                  {svc.online && <div className="text-[0.625rem] text-[#5A6E3D] uppercase tracking-wider">✓ live online</div>}
                </div>
                <button type="button" onClick={() => saveServiceToCalendar(svc)} className="text-xs uppercase tracking-wider px-3 py-2 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"><UiIcon name="calendar" /> Save next one</button>
              </div>
            ))}
          </div>
        </section>
      )}

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

      {/* HEADER (moved to bottom 2026-05-25 per Darrell — the church-identity "ad"
          lives below the spiritual + parish-life surfaces so the page opens with
          the actions, not with the marquee). */}
      <section className="bg-white border border-[#1A1815] p-5">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-medium mb-1">Home Church</div>
        <h2 className="text-2xl sm:text-3xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>{c.name}</h2>
        {c.nickname && <div className="text-base text-[#5A5751] italic mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{c.nickname}</div>}
        {c.tagline && <p className="text-sm text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>{c.tagline}</p>}
        {c.verse && (
          <blockquote className="mt-3 border-l-2 border-[#B85838] pl-3 text-sm italic" style={{ fontFamily: '"Fraunces", serif' }}>
            "{c.verse.text}" <span className="not-italic text-[#5A5751] text-xs"> — {c.verse.ref}</span>
          </blockquote>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 text-xs" style={{ fontFamily: '"Fraunces", serif' }}>
          {c.address && <div><div className={labelCls}>Location</div><div>{c.address}</div></div>}
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
          <button type="button" onClick={() => alert('Coming soon: pick your own church home. Default = The Church of the Living God.')} className="text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">Settings &rarr; My church home</button>
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
    </div>
  );
}
