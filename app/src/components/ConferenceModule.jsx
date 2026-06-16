// =============================================================================
// ConferenceModule — the church conference, in the church's hands
// =============================================================================
// Built 2026-06-11 overnight for the COLG 77th National Assembly (Darrell:
// "can we have the conference module tomorrow... then have BG use it and give
// feedback"). Designed from what a conference needs:
//   1. The front door — name, theme, host, dates, livestream — every field
//      editable in place, because Bishop Gwin filling in what the website
//      doesn't publish yet IS the feedback loop.
//   2. The schedule — sessions with day/time/speaker, built up as it firms.
//      A session can be flagged a MAIN SERVICE, which carries a Sermon + a
//      Music set REFERENCED from the Choir module (choir_sermons / choir_songs),
//      so the Choir tab's content flows into the conference services. The data
//      stays in the Choir module (single source of truth); the conference stores
//      only ids and resolves them live (lib/conference.js).
//   3. Meals — a small registration (mealType + allergies) that auto-tallies for
//      catering, plus an edit-in-place menu of what's served each day.
//   4. Who's coming / who's serving — momentum + volunteer interest.
//   5. Bishop's feedback — a direct line onto the build list.
// Local-first like the rest of the Church tab (contributions pattern):
// conference state saves on this device now via updateConference; v2.7
// church-schema sync is the follow-up, and the shapes here are sync-ready
// (RSVP matches the ingestion spec's event_participants.dietary). The Choir
// data it references is already real, instance-scoped, cross-device-synced.
import React, { useEffect, useState } from 'react';
import { N8N_BASE } from '../lib/n8n-base.js';
import { subscribeSongs, subscribeSermons, youtubeTimedUrl, formatTimecode } from '../lib/choir-sync.js';
import {
  MEAL_TYPES, buildRsvp, aggregateMeals, mealCountRows,
  formatMealOptions, buildMeal,
  isMainService, resolveServiceSermon, resolveServiceSongs, toggleSongId,
} from '../lib/conference.js';

export const CONFERENCE_SEED = {
  name: '77th National Assembly',
  theme: 'Reviving Faith, Restoring Hope, Rebuilding Communities',
  host: 'The Church of the Living God',
  location: '312 E. Bradley Avenue, Champaign, IL 61820',
  dates: '', // not yet published — Bishop fills in
  livestreamUrl: 'https://www.youtube.com/channel/UC821pJh7YR5llBNnWUJj-ZA',
  siteUrl: 'https://www.thechurchofthelivinggod.com/77th-national-assembly',
  sessions: [],
  meals: [],
  rsvps: [],
  volunteers: [],
  feedback: [],
};

const card = 'bg-white border border-[#1A1815] p-4 sm:p-5';
const labelCls = 'text-[9px] uppercase tracking-wider text-[#5A5751]';
const fieldCls = 'w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]';
const btnDark = 'bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] min-h-[36px]';
const btnGhost = 'text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]';

// A watch link to the exact sermon/song moment in the church video (reuses the
// Choir module's deep-link helper). Returns null when there's no video yet.
function WatchLink({ url, startSeconds, label }) {
  if (!url) return null;
  const href = youtubeTimedUrl(url, startSeconds);
  const text = startSeconds ? `${label} @ ${formatTimecode(startSeconds)}` : label;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] underline focus:outline focus:outline-2 focus:outline-[#B85838]">▶ {text}</a>
  );
}

// The read view of a Main Service's linked Choir content — sermon (speaker +
// title + video) and the music set (choir songs + their videos). All resolved
// LIVE from the subscribed choir lists; nothing here is stored on the conference.
function ServiceLinks({ session, sermons, songs }) {
  const sermon = resolveServiceSermon(session, sermons);
  const set = resolveServiceSongs(session, songs);
  if (!sermon && set.length === 0) return null;
  return (
    <div className="mt-1.5 ml-[7.5rem] pl-2 border-l-2 border-[#5A6E3D] space-y-1.5">
      {sermon && (
        <div className="text-[11px]" style={{ fontFamily: '"Fraunces", serif' }}>
          <span className="uppercase tracking-wider text-[9px] text-[#5A6E3D] font-semibold">✦ Sermon</span>{' '}
          <span className="font-semibold text-[#1A1815]">{sermon.title}</span>
          {sermon.speaker ? <span className="text-[#5A5751]"> — {sermon.speaker}</span> : null}
          {sermon.scriptureRef ? <span className="text-[#5A5751]"> · {sermon.scriptureRef}</span> : null}{' '}
          <WatchLink url={sermon.youtubeUrl} startSeconds={sermon.startSeconds} label="Watch" />
        </div>
      )}
      {set.length > 0 && (
        <div className="text-[11px]" style={{ fontFamily: '"Fraunces", serif' }}>
          <span className="uppercase tracking-wider text-[9px] text-[#5A6E3D] font-semibold">♪ Music</span>
          <ul className="mt-0.5 space-y-0.5">
            {set.map((s) => (
              <li key={s.id} className="flex items-baseline gap-2 flex-wrap">
                <span className="text-[#1A1815]">{s.title}</span>
                <WatchLink url={s.youtubeUrl} startSeconds={s.startSeconds} label="Watch" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Inline editor to flag a session a Main Service and link a Choir sermon + songs
// by REFERENCE. Only the ids are written to conference state; the sermon/song
// data stays in the Choir module. Renders only when choir data is reachable
// (signed-in choir member); otherwise the schedule shows a gentle hint.
function ServiceLinkEditor({ session, sermons, songs, onChange }) {
  const main = isMainService(session);
  const songIds = session.songIds || [];
  return (
    <div className="mt-1.5 ml-[7.5rem] pl-2 border-l-2 border-[#B85838] bg-[#FAF8F4] p-2 space-y-2">
      <label className="flex items-center gap-2 text-[11px] text-[#1A1815] cursor-pointer" style={{ fontFamily: '"Fraunces", serif' }}>
        <input type="checkbox" checked={main} onChange={(e) => onChange({ kind: e.target.checked ? 'main' : 'breakout' })} className="accent-[#B85838]" />
        <span className="font-semibold">Main Service</span> — carries a sermon + music from the Choir module
      </label>
      {main && (
        <>
          <div>
            <label className={labelCls}>Sermon (from Choir module)</label>
            {sermons.length === 0 ? (
              <p className="text-[10px] text-[#8A6E1F] italic" style={{ fontFamily: '"Fraunces", serif' }}>No sermons loaded — add them in the Choir tab, then link here.</p>
            ) : (
              <select className={fieldCls} value={session.sermonId || ''} onChange={(e) => onChange({ sermonId: e.target.value || null })} aria-label="Link a sermon">
                <option value="">— none —</option>
                {sermons.map((s) => <option key={s.id} value={s.id}>{[s.title, s.speaker].filter(Boolean).join(' — ')}{s.serviceDate ? ` (${s.serviceDate})` : ''}</option>)}
              </select>
            )}
          </div>
          <div>
            <label className={labelCls}>Music set (choir songs · {songIds.length} selected)</label>
            {songs.length === 0 ? (
              <p className="text-[10px] text-[#8A6E1F] italic" style={{ fontFamily: '"Fraunces", serif' }}>No songs loaded — add them in the Choir tab, then select here.</p>
            ) : (
              <ul className="max-h-40 overflow-auto border border-[#E8E4DC] bg-white p-1.5 space-y-0.5">
                {songs.map((s) => (
                  <li key={s.id}>
                    <label className="flex items-center gap-2 text-[11px] text-[#1A1815] cursor-pointer py-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
                      <input type="checkbox" checked={songIds.includes(s.id)} onChange={() => onChange({ songIds: toggleSongId(songIds, s.id) })} className="accent-[#5A6E3D]" />
                      {s.title}{s.serviceDate ? <span className="text-[#5A5751]"> · {s.serviceDate}</span> : null}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function ConferenceModule({ conference, updateConference }) {
  const conf = { ...CONFERENCE_SEED, ...(conference || {}) };
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(conf);
  const [sessForm, setSessForm] = useState({ day: '', time: '', title: '', speaker: '' });
  const [showSessForm, setShowSessForm] = useState(false);
  const [linkingId, setLinkingId] = useState(null); // session whose Choir link is open
  const [mealForm, setMealForm] = useState({ day: '', mealName: '', options: '', notes: '' });
  const [showMealForm, setShowMealForm] = useState(false);
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpMealType, setRsvpMealType] = useState('Regular');
  const [rsvpDietary, setRsvpDietary] = useState('');
  const [volForm, setVolForm] = useState({ name: '', area: 'Hospitality' });
  const [fbText, setFbText] = useState('');
  const [fbSent, setFbSent] = useState(false);

  // Live Choir data — the SINGLE SOURCE OF TRUTH for sermons + songs. The
  // conference references these by id; it never copies them. Subscribers no-op
  // for a signed-out / non-choir visitor (RLS), so the linking UI simply shows a
  // hint and the schedule renders without the linked content for them.
  const [sermons, setSermons] = useState([]);
  const [songs, setSongs] = useState([]);
  useEffect(() => {
    const unsubSermon = subscribeSermons((rows) => setSermons(rows || []));
    const unsubSong = subscribeSongs((rows) => setSongs((rows || []).filter((s) => s.status !== 'archived')));
    return () => { unsubSermon(); unsubSong(); };
  }, []);
  const choirReachable = sermons.length > 0 || songs.length > 0;

  const saveDetails = () => { updateConference({ ...form }); setEditing(false); };
  const addSession = () => {
    if (!sessForm.title.trim()) return;
    updateConference({ sessions: [...(conf.sessions || []), { ...sessForm, kind: 'breakout', sermonId: null, songIds: [], id: `cs-${Date.now()}` }] });
    setSessForm({ day: sessForm.day, time: '', title: '', speaker: '' });
    setShowSessForm(false);
  };
  const updateSession = (id, patch) => {
    updateConference({ sessions: (conf.sessions || []).map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  };
  const removeSession = (id) => {
    if (!window.confirm('Remove this session from the schedule?')) return;
    updateConference({ sessions: (conf.sessions || []).filter(s => s.id !== id) });
  };
  const addMeal = () => {
    if (!mealForm.mealName.trim()) return;
    updateConference({ meals: [...(conf.meals || []), buildMeal({ ...mealForm, id: `ml-${Date.now()}` })] });
    setMealForm({ day: mealForm.day, mealName: '', options: '', notes: '' });
    setShowMealForm(false);
  };
  const removeMeal = (id) => {
    if (!window.confirm('Remove this meal from the menu?')) return;
    updateConference({ meals: (conf.meals || []).filter(m => m.id !== id) });
  };
  const addRsvp = () => {
    const rec = buildRsvp({ name: rsvpName, mealType: rsvpMealType, dietary: rsvpDietary, id: `rv-${Date.now()}`, at: new Date().toISOString().slice(0, 10) });
    if (!rec.name) return;
    updateConference({ rsvps: [...(conf.rsvps || []), rec] });
    setRsvpName('');
    setRsvpMealType('Regular');
    setRsvpDietary('');
  };
  const addVolunteer = () => {
    const n = volForm.name.trim();
    if (!n) return;
    updateConference({ volunteers: [...(conf.volunteers || []), { id: `vl-${Date.now()}`, ...volForm, name: n, at: new Date().toISOString().slice(0, 10) }] });
    setVolForm({ name: '', area: volForm.area });
  };
  const sendFeedback = async () => {
    const t = fbText.trim();
    if (!t) return;
    updateConference({ feedback: [...(conf.feedback || []), { id: `cf-${Date.now()}`, text: t, at: new Date().toISOString() }] });
    setFbText('');
    // 2026-06-12 fix: this button used to show "✓ Received" while wired to
    // nothing — and for an anonymous visitor on poetech.us (Bishop Gwin's
    // actual path) the local record doesn't even persist across refresh.
    // Now it rides the same wf30 family-feedback lane as the app's feedback
    // button, so the words actually reach PoeTech — and the confirmation
    // only shows when they did.
    try {
      const base = N8N_BASE;
      if (!base) { setFbSent('offline'); return; }
      const r = await fetch(`${base.replace(/\/+$/, '')}/webhook/family-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        mode: 'cors',
        body: JSON.stringify({
          sender: 'conference-module',
          type: 'conference-feedback',
          message: t,
          screen_context: { path: '/church/conference', conference: conf.name },
          user_agent: (typeof navigator !== 'undefined') ? navigator.userAgent : '',
          source: 'poetech.us',
        }),
      });
      setFbSent(r.ok ? 'sent' : 'offline');
    } catch (_) {
      setFbSent('offline');
    }
  };

  // Organizer aggregation off the RSVP roll — exact counts per mealType + the
  // allergy/dietary list, so catering plans quantities with no manual tally.
  const { counts, notes: dietaryNotes, total: rsvpTotal } = aggregateMeals(conf.rsvps);
  const countRows = mealCountRows(counts);

  return (
    <section className={card} aria-labelledby="conference-h">
      {/* FRONT DOOR */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">⛪ Conference</div>
          <h2 id="conference-h" className="text-xl sm:text-2xl mt-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{conf.name}</h2>
          <p className="text-sm text-[#5A6E3D] font-semibold mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>“{conf.theme}”</p>
          <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
            {conf.host} · {conf.location}{conf.dates ? ` · ${conf.dates}` : ''}
          </p>
          {!conf.dates && <p className="text-[10px] text-[#B85838] italic mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>Dates not set yet — tap Edit and add them when they’re confirmed.</p>}
        </div>
        <div className="flex gap-2 shrink-0">
          {conf.livestreamUrl && <a href={conf.livestreamUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-wider px-3 py-1.5 min-h-[36px] inline-flex items-center border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white no-underline">▶ Livestream</a>}
          {conf.siteUrl && <a href={conf.siteUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-wider px-3 py-1.5 min-h-[36px] inline-flex items-center border border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815] no-underline">Site</a>}
          <button type="button" onClick={() => { setForm(conf); setEditing(!editing); }} className={btnGhost}>{editing ? '× Cancel' : '✎ Edit'}</button>
        </div>
      </div>
      {editing && (
        <div className="bg-[#FAF8F4] border border-[#B85838] p-3 mt-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div><label className={labelCls}>Conference name</label><input className={fieldCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className={labelCls}>Theme</label><input className={fieldCls} value={form.theme} onChange={e => setForm({ ...form, theme: e.target.value })} /></div>
            <div><label className={labelCls}>Dates (e.g., July 14–18, 2026)</label><input className={fieldCls} value={form.dates} onChange={e => setForm({ ...form, dates: e.target.value })} /></div>
            <div><label className={labelCls}>Location</label><input className={fieldCls} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
            <div><label className={labelCls}>Livestream link</label><input className={fieldCls} value={form.livestreamUrl} onChange={e => setForm({ ...form, livestreamUrl: e.target.value })} /></div>
            <div><label className={labelCls}>Website page</label><input className={fieldCls} value={form.siteUrl} onChange={e => setForm({ ...form, siteUrl: e.target.value })} /></div>
          </div>
          <button type="button" onClick={saveDetails} className={btnDark}>Save conference details</button>
        </div>
      )}

      {/* SCHEDULE — sessions, with Main Services carrying Choir sermon + music */}
      <div className="mt-4 pt-3 border-t border-[#E8E4DC]">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">📅 Schedule · {(conf.sessions || []).length} sessions</h3>
          <button type="button" onClick={() => setShowSessForm(!showSessForm)} className={btnGhost}>{showSessForm ? '× Cancel' : '+ Add session'}</button>
        </div>
        {showSessForm && (
          <div className="bg-[#FAF8F4] border border-[#B85838] p-2 mb-2 grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
            <div><label className={labelCls}>Day</label><input className={fieldCls} placeholder="e.g., Tue Jul 15" value={sessForm.day} onChange={e => setSessForm({ ...sessForm, day: e.target.value })} /></div>
            <div><label className={labelCls}>Time</label><input className={fieldCls} placeholder="7:00 PM" value={sessForm.time} onChange={e => setSessForm({ ...sessForm, time: e.target.value })} /></div>
            <div className="col-span-2"><label className={labelCls}>Session</label><input className={fieldCls} placeholder="Evening Worship · Revival Night" value={sessForm.title} onChange={e => setSessForm({ ...sessForm, title: e.target.value })} /></div>
            <div><label className={labelCls}>Speaker</label><input className={fieldCls} placeholder="optional" value={sessForm.speaker} onChange={e => setSessForm({ ...sessForm, speaker: e.target.value })} /></div>
            <button type="button" onClick={addSession} className={`${btnDark} col-span-2 sm:col-span-5`}>Add to schedule</button>
          </div>
        )}
        {(conf.sessions || []).length === 0 ? (
          <p className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No sessions yet — add them as the program firms up. Flag a session a Main Service to carry its sermon + music from the Choir tab. (For now entries save on this device; shared church-wide sync is coming.)</p>
        ) : (
          <ul className="space-y-1">
            {(conf.sessions || []).map(s => {
              const main = isMainService(s);
              const linking = linkingId === s.id;
              return (
                <li key={s.id} className="py-1 border-b border-[#E8E4DC] last:border-0">
                  <div className="flex items-center gap-2 text-xs" style={{ fontFamily: '"Fraunces", serif' }}>
                    <span className="text-[10px] text-[#5A5751] w-28 shrink-0" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{[s.day, s.time].filter(Boolean).join(' · ')}</span>
                    <span className="flex-1 min-w-0">
                      {main && <span className="text-[9px] uppercase tracking-wider text-white bg-[#5A6E3D] px-1.5 py-0.5 mr-1.5 align-middle">⛪ Main Service</span>}
                      {s.title}{s.speaker ? <span className="text-[#5A5751]"> — {s.speaker}</span> : null}
                    </span>
                    <button type="button" onClick={() => setLinkingId(linking ? null : s.id)} className="text-[10px] uppercase tracking-wider text-[#5A6E3D] hover:text-[#1A1815] px-1" aria-expanded={linking}>{linking ? '× Close' : (main ? '✎ Service' : '✦ Service')}</button>
                    <button type="button" onClick={() => removeSession(s.id)} aria-label={`Remove ${s.title}`} className="text-[#5A5751] hover:text-[#B85838] px-2">×</button>
                  </div>
                  {/* Read view of the linked Choir content (everyone who can see it) */}
                  {!linking && main && <ServiceLinks session={s} sermons={sermons} songs={songs} />}
                  {/* Inline link editor (organizer) */}
                  {linking && (
                    choirReachable ? (
                      <ServiceLinkEditor session={s} sermons={sermons} songs={songs} onChange={(patch) => updateSession(s.id, patch)} />
                    ) : (
                      <div className="mt-1.5 ml-[7.5rem] pl-2 border-l-2 border-[#B85838] bg-[#FAF8F4] p-2">
                        <label className="flex items-center gap-2 text-[11px] text-[#1A1815] cursor-pointer" style={{ fontFamily: '"Fraunces", serif' }}>
                          <input type="checkbox" checked={main} onChange={(e) => updateSession(s.id, { kind: e.target.checked ? 'main' : 'breakout' })} className="accent-[#B85838]" />
                          <span className="font-semibold">Main Service</span>
                        </label>
                        <p className="text-[10px] text-[#8A6E1F] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Sign in as a choir member to link a sermon + music from the Choir tab.</p>
                      </div>
                    )
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* MEALS — what's being served, so attendees know and leadership can plan */}
      <div className="mt-4 pt-3 border-t border-[#E8E4DC]">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">🍽 Meals · {(conf.meals || []).length}</h3>
          <button type="button" onClick={() => setShowMealForm(!showMealForm)} className={btnGhost}>{showMealForm ? '× Cancel' : '+ Add meal'}</button>
        </div>
        {showMealForm && (
          <div className="bg-[#FAF8F4] border border-[#B85838] p-2 mb-2 grid grid-cols-2 sm:grid-cols-6 gap-2 items-end">
            <div><label className={labelCls}>Day</label><input className={fieldCls} placeholder="e.g., Tue Jul 15" value={mealForm.day} onChange={e => setMealForm({ ...mealForm, day: e.target.value })} /></div>
            <div className="col-span-2"><label className={labelCls}>Meal</label><input className={fieldCls} placeholder="Dinner · Fellowship Hall" value={mealForm.mealName} onChange={e => setMealForm({ ...mealForm, mealName: e.target.value })} /></div>
            <div className="col-span-2"><label className={labelCls}>Options served (· or comma)</label><input className={fieldCls} placeholder="Baked chicken · vegan plate · salad" value={mealForm.options} onChange={e => setMealForm({ ...mealForm, options: e.target.value })} /></div>
            <div><label className={labelCls}>Notes</label><input className={fieldCls} placeholder="optional" value={mealForm.notes} onChange={e => setMealForm({ ...mealForm, notes: e.target.value })} /></div>
            <button type="button" onClick={addMeal} className={`${btnDark} col-span-2 sm:col-span-6`}>Add to menu</button>
          </div>
        )}
        {(conf.meals || []).length === 0 ? (
          <p className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No meals listed yet — add what's being served so attendees know what to expect. (Saves on this device for now; church-wide sync is coming.)</p>
        ) : (
          <ul className="space-y-1">
            {(conf.meals || []).map(m => (
              <li key={m.id} className="flex items-center gap-2 text-xs py-1 border-b border-[#E8E4DC] last:border-0" style={{ fontFamily: '"Fraunces", serif' }}>
                <span className="text-[10px] text-[#5A5751] w-28 shrink-0" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{m.day}</span>
                <span className="flex-1 min-w-0"><span className="font-semibold">{m.mealName}</span>{(m.options && m.options.length) ? <span className="text-[#5A5751]"> — {formatMealOptions(m.options)}</span> : null}{m.notes ? <span className="text-[#5A6E3D] italic"> · {m.notes}</span> : null}</span>
                <button type="button" onClick={() => removeMeal(m.id)} aria-label={`Remove ${m.mealName}`} className="text-[#5A5751] hover:text-[#B85838] px-2">×</button>
              </li>
            ))}
          </ul>
        )}
        {/* ORGANIZER VIEW — auto-tallied counts + the allergy list for catering */}
        {rsvpTotal > 0 && (
          <div className="mt-2 bg-[#FAF8F4] border border-[#E8E4DC] p-2">
            <p className="text-[10px] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
              <span className="uppercase tracking-wider text-[#B85838] font-semibold">Meal counts</span> ({rsvpTotal} RSVP{rsvpTotal === 1 ? '' : 's'}): {countRows.map(([k, n]) => `${n} ${k}`).join(' · ')}
            </p>
            {dietaryNotes.length > 0 && (
              <div className="mt-1.5">
                <p className="text-[9px] uppercase tracking-wider text-[#B85838] font-semibold">Allergies / specific needs</p>
                <ul className="mt-0.5 space-y-0.5">
                  {dietaryNotes.map((d, i) => (
                    <li key={i} className="text-[11px] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
                      <span className="font-semibold text-[#1A1815]">{d.name || 'Guest'}</span> <span className="text-[9px] uppercase tracking-wider">({d.mealType})</span> — {d.dietary}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* WHO'S COMING + WHO'S SERVING */}
      <div className="mt-4 pt-3 border-t border-[#E8E4DC] grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-2">🙋 I’m coming · {(conf.rsvps || []).length}</h3>
          <div className="flex gap-1.5 flex-wrap">
            <input className={`${fieldCls} flex-1 min-w-[120px]`} placeholder="Your name" value={rsvpName} onChange={e => setRsvpName(e.target.value)} />
            <select className={`${fieldCls} w-auto`} aria-label="Meal preference" value={rsvpMealType} onChange={e => setRsvpMealType(e.target.value)}>
              {MEAL_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <button type="button" onClick={addRsvp} className={btnDark}>RSVP</button>
          </div>
          <input className={`${fieldCls} mt-1.5`} placeholder="Allergy or specific need (optional)" aria-label="Allergy or specific dietary need" value={rsvpDietary} onChange={e => setRsvpDietary(e.target.value)} />
          {(conf.rsvps || []).length > 0 && (
            <p className="text-[11px] text-[#5A5751] mt-1.5" style={{ fontFamily: '"Fraunces", serif' }}>{(conf.rsvps || []).slice(-6).map(r => r.name).join(' · ')}{(conf.rsvps || []).length > 6 ? ` · +${(conf.rsvps || []).length - 6} more` : ''}</p>
          )}
        </div>
        <div>
          <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-2">🤝 I’ll serve · {(conf.volunteers || []).length}</h3>
          <div className="flex gap-1.5 flex-wrap">
            <input className={`${fieldCls} flex-1 min-w-[120px]`} placeholder="Your name" value={volForm.name} onChange={e => setVolForm({ ...volForm, name: e.target.value })} />
            <select className={`${fieldCls} w-auto`} value={volForm.area} onChange={e => setVolForm({ ...volForm, area: e.target.value })}>
              {['Hospitality', 'Ushers', 'Music & Worship', 'Media / Livestream', 'Kitchen', 'Setup & Teardown', 'Transportation', 'Prayer Team', 'Other'].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <button type="button" onClick={addVolunteer} className={btnDark}>Sign up</button>
          </div>
          {(conf.volunteers || []).length > 0 && (
            <p className="text-[11px] text-[#5A5751] mt-1.5" style={{ fontFamily: '"Fraunces", serif' }}>{(conf.volunteers || []).slice(-4).map(v => `${v.name} (${v.area})`).join(' · ')}</p>
          )}
        </div>
      </div>

      {/* BISHOP'S FEEDBACK — the direct line that shapes this module */}
      <div className="mt-4 pt-3 border-t border-[#E8E4DC]">
        <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold mb-1">📣 Bishop’s feedback · shapes what we build next</h3>
        <p className="text-[11px] text-[#5A5751] italic mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
          What’s missing? What would actually help the Assembly run well? Say it plainly — it goes straight onto the build list.
        </p>
        <textarea className={fieldCls} rows="2" placeholder="e.g., We need a printable program · registration with meal counts · hotel block info…" value={fbText} onChange={e => setFbText(e.target.value)} />
        <div className="flex items-center gap-2 mt-1.5">
          <button type="button" onClick={sendFeedback} className={btnDark}>Send feedback</button>
          {fbSent === 'sent' && <span className="text-[11px] text-[#5A6E3D] font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>✓ Received — thank you, Bishop.</span>}
          {fbSent === 'offline' && <span className="text-[11px] text-[#8A6E1F] font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>Saved on this device — couldn’t reach PoeTech just now; please mention it to Darrell directly.</span>}
        </div>
        {(conf.feedback || []).length > 0 && (
          <ul className="mt-2 space-y-1">
            {(conf.feedback || []).slice(-3).map(f => (
              <li key={f.id} className="text-[11px] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>“{f.text}” <span className="text-[9px]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{(f.at || '').slice(0, 10)}</span></li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default ConferenceModule;
