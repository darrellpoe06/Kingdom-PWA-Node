// =============================================================================
// ProfileCard — who this person is, as much as they let you see (DR-0342)
// =============================================================================
// Opens from a name anywhere a person is shown (first: the 1:1 thread header).
// Reads by id through lib/profiles-sync.js; shows the honest partial card when
// the owner's visibility narrows it. The favorite verse opens in place
// (VerseChips) — the Word is never a string here.
import React, { useEffect, useState } from 'react';
import VerseChips from './VerseChips.jsx';
import { loadProfile, initialsOf } from '../lib/profiles-sync.js';

const serif = { fontFamily: '"Fraunces", serif' };

export function ProfileAvatar({ profile, size = 48 }) {
  const px = `${size}px`;
  if (profile?.photoThumb) {
    return <img src={profile.photoThumb} alt="" width={size} height={size} className="rounded-full object-cover border border-[#E8E4DC]" style={{ width: px, height: px }} />;
  }
  return (
    <span aria-hidden="true" className="inline-flex items-center justify-center rounded-full bg-[#F2F4EC] border border-[#E8E4DC] text-[#5A6E3D] font-semibold" style={{ width: px, height: px, fontSize: `${Math.round(size * 0.38)}px` }}>
      {initialsOf(profile?.displayName)}
    </span>
  );
}

export default function ProfileCard({ userId, fallbackName = 'Member', onMessage }) {
  const [profile, setProfile] = useState(undefined); // undefined = loading, null = none
  useEffect(() => {
    let alive = true;
    setProfile(undefined);
    loadProfile(userId).then((p) => { if (alive) setProfile(p); }).catch(() => { if (alive) setProfile(null); });
    return () => { alive = false; };
  }, [userId]);

  const name = profile?.displayName || fallbackName;
  return (
    <section aria-label={`Profile — ${name}`} className="border border-[#E8E4DC] bg-white p-3 space-y-2">
      <div className="flex items-center gap-3">
        <ProfileAvatar profile={profile || { displayName: name }} size={56} />
        <div className="min-w-0">
          <div className="text-base text-[#1A1815]" style={{ ...serif, fontWeight: 600 }}>{name}</div>
          {profile?.house && <div className="text-xs text-[#5A5751]" style={serif}>{profile.house}</div>}
          {profile?.ministries?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {profile.ministries.map((m) => <span key={m} className="text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 bg-[#F2F4EC] border border-[#E8E4DC] text-[#5A6E3D]">{m}</span>)}
            </div>
          )}
        </div>
      </div>
      {profile === undefined && <p className="text-xs text-[#5A5751]">Loading…</p>}
      {profile === null && <p className="text-xs text-[#5A5751]" style={serif}>No profile yet — just the name.</p>}
      {profile && profile.fullView === false && (
        <p className="text-xs text-[#5A5751]" style={serif}>{name} keeps the rest of their profile private.</p>
      )}
      {profile?.favoriteVerse && (
        <div>
          <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1">Their verse</span>
          <VerseChips refs={[profile.favoriteVerse]} />
        </div>
      )}
      {profile?.testimony && (
        <div>
          <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1">Testimony</span>
          <p className="text-sm text-[#1A1815] leading-relaxed whitespace-pre-wrap" style={serif}>{profile.testimony}</p>
        </div>
      )}
      {onMessage && (
        <button type="button" onClick={onMessage} className="text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">
          Message {name}
        </button>
      )}
    </section>
  );
}
