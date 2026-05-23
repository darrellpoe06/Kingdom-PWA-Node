import { useState } from 'react';

export default function Church({ church, prayerRequests, addPrayerRequest, markPrayerRequestSent, deletePrayerRequest, addEvent }) {
  const [prForm, setPrForm] = useState({ requester: '', request: '', shareWithChurch: true, anonymous: false });
  const [prError, setPrError] = useState('');
  const [showPrForm, setShowPrForm] = useState(false);
  const [ministryInterest, setMinistryInterest] = useState({ name: '', email: '', interest: '', skills: '' });
  const [showMinistryForm, setShowMinistryForm] = useState(false);
  const [ministryNote, setMinistryNote] = useState('');

  const c = church || {};
  const fieldCls = 'w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]';
  const labelCls = 'text-[9px] uppercase tracking-wider text-[#5A5751]';

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
      {/* HEADER */}
      <section className="bg-white border border-[#1A1815] p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-medium mb-1">Home Church</div>
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

      {/* SERVICE TIMES + SAVE TO CALENDAR */}
      {(c.services || []).length > 0 && (
        <section aria-labelledby="svc-h">
          <h3 id="svc-h" className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2 pb-2 border-b border-[#1A1815]">Service Times · in-person + online</h3>
          <div className="bg-white border border-[#1A1815]">
            {c.services.map((svc, i, arr) => (
              <div key={svc.id} className={`p-3 flex items-center justify-between gap-3 flex-wrap ${i < arr.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">{svc.day}</div>
                  <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{svc.label} · <span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 500 }}>{svc.time}</span></div>
                  {svc.online && <div className="text-[10px] text-[#5A6E3D] uppercase tracking-wider">✓ live online</div>}
                </div>
                <button type="button" onClick={() => saveServiceToCalendar(svc)} className="text-xs uppercase tracking-wider px-3 py-2 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">📅 Save next one</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* MEDIA / BROADCAST */}
      {c.media && (
        <section aria-labelledby="media-h">
          <h3 id="media-h" className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2 pb-2 border-b border-[#1A1815]">Watch · Listen · Follow</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {c.media.youtube && <a href={c.media.youtube} target="_blank" rel="noopener noreferrer" className="bg-white border border-[#E8E4DC] hover:border-[#B85838] p-3 text-center focus:outline focus:outline-2 focus:outline-[#B85838]"><div className="text-2xl mb-1" aria-hidden="true">▶</div><div className="text-xs uppercase tracking-wider font-semibold">YouTube</div><div className="text-[10px] text-[#5A5751]">Recorded services</div></a>}
            {c.media.facebook && <a href={c.media.facebook} target="_blank" rel="noopener noreferrer" className="bg-white border border-[#E8E4DC] hover:border-[#B85838] p-3 text-center focus:outline focus:outline-2 focus:outline-[#B85838]"><div className="text-2xl mb-1" aria-hidden="true">f</div><div className="text-xs uppercase tracking-wider font-semibold">Facebook</div><div className="text-[10px] text-[#5A5751]">Love Corner Live</div></a>}
            {c.media.instagram && <a href={c.media.instagram} target="_blank" rel="noopener noreferrer" className="bg-white border border-[#E8E4DC] hover:border-[#B85838] p-3 text-center focus:outline focus:outline-2 focus:outline-[#B85838]"><div className="text-2xl mb-1" aria-hidden="true">◉</div><div className="text-xs uppercase tracking-wider font-semibold">Instagram</div><div className="text-[10px] text-[#5A5751]">@tlcexperience</div></a>}
            {c.media.broadcast && <a href={c.media.broadcast} target="_blank" rel="noopener noreferrer" className="bg-white border border-[#E8E4DC] hover:border-[#B85838] p-3 text-center focus:outline focus:outline-2 focus:outline-[#B85838]"><div className="text-2xl mb-1" aria-hidden="true">📻</div><div className="text-xs uppercase tracking-wider font-semibold">Broadcast</div><div className="text-[10px] text-[#5A5751]">All channels</div></a>}
          </div>
        </section>
      )}

      {/* GIVE + PARISH LIFE */}
      <section aria-labelledby="give-h" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {c.links?.give && (
          <div className="bg-white border-2 border-[#B85838] p-4">
            <h3 id="give-h" className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">Tithes · Offering · Gifts</h3>
            <p className="text-sm leading-relaxed text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>Giving runs through the church's own secure page — no payment data passes through this app.</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <a href={c.links.give} target="_blank" rel="noopener noreferrer" className="text-xs uppercase tracking-wider px-3 py-2 bg-[#1A1815] text-white hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Give →</a>
              {c.links.giversCreed && <a href={c.links.giversCreed} target="_blank" rel="noopener noreferrer" className="text-xs uppercase tracking-wider px-3 py-2 border border-[#1A1815] hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">Givers Creed</a>}
            </div>
          </div>
        )}
        <div className="bg-white border border-[#1A1815] p-4">
          <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-1">Parish Life</h3>
          <ul className="text-xs space-y-1.5" style={{ fontFamily: '"Fraunces", serif' }}>
            {c.links?.calendar && <li>📅 <a href={c.links.calendar} target="_blank" rel="noopener noreferrer" className="underline text-[#B85838] hover:text-[#1A1815]">Church calendar</a></li>}
            {c.links?.bibleChallenge && <li>📖 <a href={c.links.bibleChallenge} target="_blank" rel="noopener noreferrer" className="underline text-[#B85838] hover:text-[#1A1815]">Bible Reading Challenge 2026</a></li>}
            {c.links?.classPoints && <li>✏️ <a href={c.links.classPoints} target="_blank" rel="noopener noreferrer" className="underline text-[#B85838] hover:text-[#1A1815]">Bible study class points</a></li>}
            {c.links?.lettersFromBG && <li>✉️ <a href={c.links.lettersFromBG} target="_blank" rel="noopener noreferrer" className="underline text-[#B85838] hover:text-[#1A1815]">Letters from Bishop Gwin</a></li>}
            {c.links?.assembly && <li>🏛 <a href={c.links.assembly} target="_blank" rel="noopener noreferrer" className="underline text-[#B85838] hover:text-[#1A1815]">National Assembly</a></li>}
            {c.links?.stayConnected && <li>🔗 <a href={c.links.stayConnected} target="_blank" rel="noopener noreferrer" className="underline text-[#B85838] hover:text-[#1A1815]">Stay connected</a></li>}
          </ul>
        </div>
      </section>

      {/* MINISTRY INTEREST */}
      {c.links?.ministries && (
        <section aria-labelledby="min-h" className="bg-white border border-[#1A1815] p-4">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <h3 id="min-h" className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">Ministry Opportunities</h3>
            <button type="button" onClick={() => setShowMinistryForm(!showMinistryForm)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">{showMinistryForm ? '× Cancel' : '+ Express interest'}</button>
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
          <h3 id="pr-h" className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">Prayer Requests · {prayerRequests.length}</h3>
          <button type="button" onClick={() => { setShowPrForm(!showPrForm); setPrError(''); }} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">{showPrForm ? '× Cancel' : '+ Add request'}</button>
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
                    <div className="text-[10px] uppercase tracking-wider text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{pr.createdAt.slice(0, 10)} · {pr.requester || '(anonymous)'}</div>
                    <div className="text-sm mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{pr.request}</div>
                    <div className="text-[10px] uppercase tracking-wider mt-1 text-[#5A5751]">{pr.sentAt ? `✓ sent ${pr.sentAt.slice(0, 10)}` : pr.shareWithChurch ? 'ready to share' : 'private'}</div>
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

      <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
        Content links to the church's own pages. Service times, media, and ministry openings live on <a href={c.site} target="_blank" rel="noopener noreferrer" className="underline">{(c.site || '').replace(/^https?:\/\//, '')}</a> — this tab is a shortcut, not a copy. Edits to service times can be made in the seed data ({`data.church.services`}) as the church publishes them.
      </p>
    </div>
  );
}
