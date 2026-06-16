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
//   3. Who's coming — a simple RSVP roll so leadership sees momentum.
//   4. Who's serving — volunteer interest by area.
//   5. Bishop's feedback — a direct line: what's missing, what would help.
// Local-first like the rest of the Church tab (contributions pattern):
// everything saves on this device now; v2.7 church-schema sync is the
// follow-up. Seeded with the REAL assembly from thechurchofthelivingGod.com
// (77th National Assembly · "Reviving Faith, Restoring Hope, Rebuilding
// Communities") — no fabricated dates: what the site doesn't publish, the
// church fills in.
import React, { useState } from 'react';
import { N8N_BASE } from '../lib/n8n-base.js';

export const CONFERENCE_SEED = {
  name: '77th National Assembly',
  theme: 'Reviving Faith, Restoring Hope, Rebuilding Communities',
  host: 'The Church of the Living God',
  location: '312 E. Bradley Avenue, Champaign, IL 61820',
  dates: '', // not yet published — Bishop fills in
  livestreamUrl: 'https://www.youtube.com/channel/UC821pJh7YR5llBNnWUJj-ZA',
  siteUrl: 'https://www.thechurchofthelivinggod.com/77th-national-assembly',
  sessions: [],
  rsvps: [],
  volunteers: [],
  feedback: [],
};

const card = 'bg-white border border-[#1A1815] p-4 sm:p-5';
const labelCls = 'text-[9px] uppercase tracking-wider text-[#5A5751]';
const fieldCls = 'w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]';
const btnDark = 'bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] min-h-[36px]';
const btnGhost = 'text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]';

// Maps to the spec's event_participants.dietary column (2026-06-08 ingestion
// spec, line 117) so the local RSVP shape already matches the eventual table.
const DIET_OPTIONS = ['No preference', 'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Other / allergy'];

export function ConferenceModule({ conference, updateConference }) {
  const conf = { ...CONFERENCE_SEED, ...(conference || {}) };
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(conf);
  const [sessForm, setSessForm] = useState({ day: '', time: '', title: '', speaker: '' });
  const [showSessForm, setShowSessForm] = useState(false);
  const [mealForm, setMealForm] = useState({ day: '', name: '', options: '', notes: '' });
  const [showMealForm, setShowMealForm] = useState(false);
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpDiet, setRsvpDiet] = useState('No preference');
  const [rsvpDietNote, setRsvpDietNote] = useState('');
  const [volForm, setVolForm] = useState({ name: '', area: 'Hospitality' });
  const [fbText, setFbText] = useState('');
  const [fbSent, setFbSent] = useState(false);

  const saveDetails = () => { updateConference({ ...form }); setEditing(false); };
  const addSession = () => {
    if (!sessForm.title.trim()) return;
    updateConference({ sessions: [...(conf.sessions || []), { ...sessForm, id: `cs-${Date.now()}` }] });
    setSessForm({ day: sessForm.day, time: '', title: '', speaker: '' });
    setShowSessForm(false);
  };
  const removeSession = (id) => {
    if (!window.confirm('Remove this session from the schedule?')) return;
    updateConference({ sessions: (conf.sessions || []).filter(s => s.id !== id) });
  };
  const addMeal = () => {
    if (!mealForm.name.trim()) return;
    updateConference({ meals: [...(conf.meals || []), { ...mealForm, id: `ml-${Date.now()}` }] });
    setMealForm({ day: mealForm.day, name: '', options: '', notes: '' });
    setShowMealForm(false);
  };
  const removeMeal = (id) => {
    if (!window.confirm('Remove this meal from the menu?')) return;
    updateConference({ meals: (conf.meals || []).filter(m => m.id !== id) });
  };
  const addRsvp = () => {
    const n = rsvpName.trim();
    if (!n) return;
    updateConference({ rsvps: [...(conf.rsvps || []), { id: `rv-${Date.now()}`, name: n, diet: rsvpDiet, dietNote: rsvpDietNote.trim(), at: new Date().toISOString().slice(0, 10) }] });
    setRsvpName('');
    setRsvpDiet('No preference');
    setRsvpDietNote('');
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

  // Meal counts for leadership — the "registration with meal counts" the
  // feedback hint has asked for since v0. Real tally off the RSVP roll.
  const dietTally = (conf.rsvps || []).reduce((acc, r) => {
    const k = r.diet || 'No preference';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const dietSummary = Object.entries(dietTally).filter(([, n]) => n > 0);

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

      {/* SCHEDULE */}
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
          <p className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No sessions yet — add them as the program firms up. (For now entries save on this device; shared church-wide sync is coming.)</p>
        ) : (
          <ul className="space-y-1">
            {(conf.sessions || []).map(s => (
              <li key={s.id} className="flex items-center gap-2 text-xs py-1 border-b border-[#E8E4DC] last:border-0" style={{ fontFamily: '"Fraunces", serif' }}>
                <span className="text-[10px] text-[#5A5751] w-28 shrink-0" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{[s.day, s.time].filter(Boolean).join(' · ')}</span>
                <span className="flex-1 min-w-0">{s.title}{s.speaker ? <span className="text-[#5A5751]"> — {s.speaker}</span> : null}</span>
                <button type="button" onClick={() => removeSession(s.id)} aria-label={`Remove ${s.title}`} className="text-[#5A5751] hover:text-[#B85838] px-2">×</button>
              </li>
            ))}
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
            <div className="col-span-2"><label className={labelCls}>Meal</label><input className={fieldCls} placeholder="Dinner · Fellowship Hall" value={mealForm.name} onChange={e => setMealForm({ ...mealForm, name: e.target.value })} /></div>
            <div className="col-span-2"><label className={labelCls}>Options served</label><input className={fieldCls} placeholder="Baked chicken · vegan plate · salad" value={mealForm.options} onChange={e => setMealForm({ ...mealForm, options: e.target.value })} /></div>
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
                <span className="flex-1 min-w-0"><span className="font-semibold">{m.name}</span>{m.options ? <span className="text-[#5A5751]"> — {m.options}</span> : null}{m.notes ? <span className="text-[#5A6E3D] italic"> · {m.notes}</span> : null}</span>
                <button type="button" onClick={() => removeMeal(m.id)} aria-label={`Remove ${m.name}`} className="text-[#5A5751] hover:text-[#B85838] px-2">×</button>
              </li>
            ))}
          </ul>
        )}
        {dietSummary.length > 0 && (
          <p className="text-[10px] text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
            <span className="uppercase tracking-wider text-[#B85838] font-semibold">Meal counts:</span> {dietSummary.map(([k, n]) => `${n} ${k}`).join(' · ')}
          </p>
        )}
      </div>

      {/* WHO'S COMING + WHO'S SERVING */}
      <div className="mt-4 pt-3 border-t border-[#E8E4DC] grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-2">🙋 I’m coming · {(conf.rsvps || []).length}</h3>
          <div className="flex gap-1.5 flex-wrap">
            <input className={`${fieldCls} flex-1 min-w-[120px]`} placeholder="Your name" value={rsvpName} onChange={e => setRsvpName(e.target.value)} />
            <select className={`${fieldCls} w-auto`} aria-label="Meal preference" value={rsvpDiet} onChange={e => setRsvpDiet(e.target.value)}>
              {DIET_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <button type="button" onClick={addRsvp} className={btnDark}>RSVP</button>
          </div>
          {rsvpDiet === 'Other / allergy' && (
            <input className={`${fieldCls} mt-1.5`} placeholder="Tell us — allergy or specific need" value={rsvpDietNote} onChange={e => setRsvpDietNote(e.target.value)} />
          )}
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
