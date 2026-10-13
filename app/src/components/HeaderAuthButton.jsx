// =============================================================================
// HeaderAuthButton — the person's face and name in the top-right, with the
// obvious Log in / Log out box under it, on every app.
// =============================================================================
// Darrell 2026-07-14 (with the TLC screenshot, "like this" + "for all apps" +
// "not at the top on the top right like the image in tlc!!!"): the way in/out
// must be an OBVIOUS bordered button in the header's top-right cluster — the same
// spot TLC's door puts its "LOG OUT" box — NOT a faint centered link. It toggles
// by state: signed IN -> "Log out"; signed OUT -> "Log in" (opens the quiet
// AuthModal over the page you're on, same as AuthBanner — no full-page jump).
//
// Darrell 2026-09-09, his saved profile on one screen and a bare "LOG OUT" box
// on the next: "All apps users profile shows and has login or out under it...
// so it is looked at... or seen... And upload a photo spot." So, signed in, the
// box now carries the person: their picture (or their initials until they add
// one) and their chosen name, with Log out beneath — and the picture IS the
// upload spot: tapping the face or the name opens My profile (DR-0342) in the
// quiet Modal, on whichever app they are in, so a picture can be added from
// the header and not only from the church's Engagement tab. The profile is
// re-read when that dialog closes, so a new picture shows the moment it is
// saved (Reality-Trace P15: the header shows the row, never a stale copy).
//
// Self-contained (its own session state via onAuthChange + its own AuthModal +
// its own profile read) so the frozen monolith still mounts it with ONE line.
// Style matches the sibling header buttons (Subscribe / profile switcher):
// 10px uppercase, bordered, invert on hover — so it themes identically across
// every app's header. Every read is guarded: a profile that cannot be read is
// no profile (initials + the email's local part), never a thrown header.
// =============================================================================
import React, { useEffect, useState } from 'react';
import { onAuthChange, signOut } from '../lib/supabase.js';
import AuthModal from './AuthModal.jsx';
import Modal from './Modal.jsx';
import MyProfile from './MyProfile.jsx';
import { ProfileAvatar } from './ProfileCard.jsx';
import { loadMyProfile } from '../lib/profiles-sync.js';

const BTN =
  'text-[0.625rem] uppercase tracking-wider px-2 py-1.5 border border-[#1A1815] text-[#1A1815] ' +
  'hover:bg-[#1A1815] hover:text-white font-semibold whitespace-nowrap ' +
  'focus:outline focus:outline-2 focus:outline-[#B85838]';

/** The name the chip shows: the chosen profile name, else the sign-in's own handle. */
export function headerName(profile, session) {
  if (profile && profile.displayName) return profile.displayName;
  const email = session && session.user && session.user.email;
  if (email) return String(email).split('@')[0];
  const phone = session && session.user && session.user.phone;
  return phone ? String(phone) : 'Me';
}

export default function HeaderAuthButton() {
  const [session, setSession] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => onAuthChange((s) => setSession(s)), []);

  const signedIn = !!session?.user;

  // Read my row when signed in, and again whenever the editor closes — the
  // header shows what was just saved, not what was loaded at boot.
  useEffect(() => {
    if (!signedIn) { setProfile(null); return undefined; }
    if (profileOpen) return undefined;
    let alive = true;
    Promise.resolve()
      .then(() => loadMyProfile())
      .then((p) => { if (alive) setProfile(p || null); })
      .catch(() => { if (alive) setProfile(null); });
    return () => { alive = false; };
  }, [signedIn, profileOpen]);

  if (signedIn) {
    const name = headerName(profile, session);
    const hasPicture = !!(profile && profile.photoThumb);
    return (
      <div className="flex flex-col items-end gap-1" data-header-account>
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={profileOpen}
          aria-label={hasPicture ? `${name} — open my profile` : `${name} — add your picture and open my profile`}
          title={hasPicture ? 'My profile' : 'Add your picture'}
          className="inline-flex items-center gap-1.5 min-h-[36px] px-1 text-[0.625rem] uppercase tracking-wider text-[#1A1815] hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]"
        >
          <ProfileAvatar profile={profile || { displayName: name }} size={32} />
          <span className="truncate font-semibold" style={{ maxWidth: '9rem' }}>{name}</span>
          {!hasPicture && <span className="text-[#B85838]" aria-hidden="true">+ photo</span>}
        </button>
        <button type="button" onClick={() => { try { signOut(); } catch (_) { /* ignore */ } }} className={BTN}>
          Log out
        </button>
        <Modal open={profileOpen} onClose={() => setProfileOpen(false)} label="My profile">
          <div className="p-4 bg-white text-[#1A1815]">
            <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-2">My profile · picture, name, house, ministries, testimony</div>
            <MyProfile initialName={name} />
          </div>
        </Modal>
      </div>
    );
  }
  return (
    <>
      <button type="button" onClick={() => setLoginOpen(true)} className={BTN}>
        Log in
      </button>
      <AuthModal open={loginOpen} onClose={() => setLoginOpen(false)} onSignedIn={() => setLoginOpen(false)} mode="signup" />
    </>
  );
}
