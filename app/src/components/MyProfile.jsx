// =============================================================================
// MyProfile — the one place a person owns who they are in the app (DR-0342)
// =============================================================================
// Name, picture (a small thumbnail, camera or file), house, ministries, a
// favorite verse, a testimony, and who may see it. Saves through one server
// function; the name change reaches every roster and thread at once.
import React, { useEffect, useRef, useState } from 'react';
import { loadMyProfile, saveMyProfile, photoThumbFromFile, validateProfileFields, VISIBILITY } from '../lib/profiles-sync.js';
import { isLikelyImageFile } from '../lib/image.js';
import { ProfileAvatar } from './ProfileCard.jsx';

const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';
const FIELD = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
const LABEL = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1';
const VIS_LABEL = { members: 'Anyone who can message me', leaders: 'Church leaders only', private: 'Just my name and picture' };

export default function MyProfile({ initialName = '' }) {
  const [f, setF] = useState({ displayName: initialName, photoThumb: null, house: '', ministries: '', favoriteVerse: '', testimony: '', visibility: 'members' });
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    loadMyProfile().then((p) => {
      if (!p) return;
      setF({ displayName: p.displayName, photoThumb: p.photoThumb, house: p.house, ministries: p.ministries.join(', '), favoriteVerse: p.favoriteVerse, testimony: p.testimony, visibility: p.visibility });
    }).catch(() => {});
  }, []);

  const set = (k) => (e) => setF((prev) => ({ ...prev, [k]: e.target.value }));

  async function onPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isLikelyImageFile(file)) { setStatus('That file does not look like a picture.'); return; }
    try { setF((prev) => ({ ...prev, photoThumb: null })); const thumb = await photoThumbFromFile(file); setF((prev) => ({ ...prev, photoThumb: thumb })); setStatus(''); }
    catch (err) { setStatus(err?.message || 'could not read that picture'); }
    finally { if (fileRef.current) fileRef.current.value = ''; }
  }

  async function onSave(e) {
    e.preventDefault();
    const v = validateProfileFields(f);
    if (!v.ok) { setStatus(v.errors.join('; ')); return; }
    setBusy(true);
    const r = await saveMyProfile(f);
    setBusy(false);
    setStatus(r.saved ? 'Saved — your name is now the same everywhere in the app.' : (r.errors || ['could not save']).join('; '));
  }

  return (
    <form onSubmit={onSave} className="space-y-3" aria-label="My profile">
      <div className="flex items-center gap-3">
        <ProfileAvatar profile={{ displayName: f.displayName, photoThumb: f.photoThumb }} size={64} />
        <div className="flex flex-wrap gap-1.5">
          <label className={`${BTN} border border-[#1A1815] text-[#1A1815] bg-white hover:bg-[#1A1815] hover:text-white cursor-pointer`}>
            Take or choose a picture
            <input ref={fileRef} type="file" accept="image/*" capture="user" className="sr-only" onChange={onPhoto} />
          </label>
          {f.photoThumb && <button type="button" onClick={() => setF((p) => ({ ...p, photoThumb: null }))} className={`${BTN} border border-[#C9BFA8] text-[#5A5751]`}>Remove picture</button>}
        </div>
      </div>
      <label className="block"><span className={LABEL}>Display name</span><input className={FIELD} value={f.displayName} onChange={set('displayName')} maxLength={80} required /></label>
      <label className="block"><span className={LABEL}>House · family</span><input className={FIELD} value={f.house} onChange={set('house')} maxLength={80} placeholder="e.g., the Poe house" /></label>
      <label className="block"><span className={LABEL}>Ministries (comma-separated)</span><input className={FIELD} value={f.ministries} onChange={set('ministries')} placeholder="Choir, Bus, Ushers" /></label>
      <label className="block"><span className={LABEL}>A verse you carry (e.g., Psalms 23:1)</span><input className={FIELD} value={f.favoriteVerse} onChange={set('favoriteVerse')} maxLength={40} /></label>
      <label className="block"><span className={LABEL}>Testimony</span><textarea className={FIELD} rows={4} value={f.testimony} onChange={set('testimony')} maxLength={2000} placeholder="What Yahweh has done — in your own words." /></label>
      <fieldset>
        <legend className={LABEL}>Who may see the rest of this</legend>
        <div className="flex flex-wrap gap-1.5">
          {VISIBILITY.map((v) => (
            <button key={v} type="button" onClick={() => setF((p) => ({ ...p, visibility: v }))} aria-pressed={f.visibility === v}
              className={`${BTN} border ${f.visibility === v ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#C9BFA8] text-[#5A5751]'}`}>
              {VIS_LABEL[v]}
            </button>
          ))}
        </div>
        <p className="text-[0.6875rem] text-[#5A5751] mt-1">Your name and picture are always shown to anyone who can message you, so a thread always shows whom it is with.</p>
      </fieldset>
      {status && <p className="text-xs text-[#5A5751]" role="status">{status}</p>}
      <button type="submit" disabled={busy} className={`${BTN} bg-[#1A1815] text-white hover:bg-[#B85838] disabled:opacity-50`}>{busy ? 'Saving…' : 'Save my profile'}</button>
    </form>
  );
}
