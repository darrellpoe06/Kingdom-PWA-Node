// =============================================================================
// AuthBanner — the signed-in account status, as two compact icons in the header
// =============================================================================
// WAS a full-width text strip above the title that printed the raw phone number
// and email in plain sight and — lacking `ts-chrome-region` — grew with the
// large-print text-size multiplier until it dominated the screen (Darrell
// 2026-09-14, with a screenshot at the largest size: "the Signed in as cellphone
// number and email address can be represented by... a green phone or a not green
// phone and same with email... so the users information isn't exposed... then
// all the real-estate that bar is taking up can be incorporated into the
// header").
//
// NOW: two status icons that ride INSIDE the header's zoom-capped cluster next to
// HeaderAuthButton — so they no longer scale the page, and the strip's whole row
// is reclaimed. The icons carry the state at a glance; the raw digits never touch
// the always-visible chrome:
//   • phone icon — GREEN when signed in by phone (an identity you hold),
//     washed-out otherwise.
//   • envelope icon — full ink when an email is attached (an email account, or a
//     phone door LINKED to its primary email, DR-0311), washed-out when a
//     phone-only account has no email yet.
// One tap opens a quiet Modal (the same one HeaderAuthButton uses) with the
// actual number/email, the DR-0311 "one library, both doors" reassurance for a
// linked door, and the "Add email" promotion for a phone-only account (DR-0253).
// The screen-reader label names the STATE (by phone / email attached) but not the
// digits — the number/email live only inside the dialog (privacy: the exposure
// this fixes is the screenshot / shoulder-surf, stated plainly per DR-0100; it is
// not a security boundary — it is the user's own authenticated screen).
//
// Signed out: renders NOTHING — HeaderAuthButton owns the way in (Darrell
// 2026-07-15). Amends DR-0253 §2 (which chose to SHOW the number on the strip);
// the number is preserved, moved off the chrome into the dialog. DR-0395-class.
// =============================================================================

import React, { useEffect, useState } from 'react';
import { onAuthChange, isPhoneLoginSession, identityLabel, promoteEmailToLogin } from '../lib/supabase.js';
import { authErrorMessage } from '../lib/auth-error-message.js';
import { isLinkedDoor, linkedPrimary } from '../lib/person-links.js';
import UiIcon from './UiIcon.jsx';
import Modal from './Modal.jsx';

export default function AuthBanner() {
  const [session, setSession] = useState(null);
  // Tapping the icons opens the details dialog where the raw number/email lives.
  const [detailsOpen, setDetailsOpen] = useState(false);
  // Phone users adding a real login email (DR-0172 follow-up, DR-0253 built).
  const [addEmailOpen, setAddEmailOpen] = useState(false);
  const [addEmailValue, setAddEmailValue] = useState('');
  const [addEmailStatus, setAddEmailStatus] = useState(null); // { kind:'ok'|'err', message }
  const [addEmailBusy, setAddEmailBusy] = useState(false);

  useEffect(() => {
    // onAuthChange fires immediately with the current session, so we don't
    // need a separate getSession() call here.
    const unsubscribe = onAuthChange((s) => setSession(s));
    return unsubscribe;
  }, []);

  async function handleAddEmail(e) {
    e.preventDefault();
    setAddEmailBusy(true);
    setAddEmailStatus(null);
    const { error } = await promoteEmailToLogin(addEmailValue);
    setAddEmailBusy(false);
    if (error) {
      // An address that already belongs to another account here is usually the
      // READER'S OWN other account (Darrell 2026-08-20: "since we already have
      // my email address why don't we already have it connected?") — one email
      // per account, no duplicates, by design. Say that truth instead of the
      // vendor's "already registered".
      if (/already.{0,30}registered|email_exists|already.{0,30}exists/i.test(String(error.message || error.error_code || ''))) {
        setAddEmailStatus({
          kind: 'err',
          message: 'That address already belongs to another PoeTech account — usually your own original one. If it is yours, you can simply sign in with it (password door); both of your accounts share the same family space, so nothing needs attaching.',
        });
        return;
      }
      // Route through the app's own voice: with SMTP deliberately absent the
      // confirmation send fails server-side, and the raw GoTrue string reads
      // like a mystery ("SENDING…" then vendor text — measured 2026-08-20,
      // Darrell's Add-email attempts). authErrorMessage names the truth.
      setAddEmailStatus({ kind: 'err', message: authErrorMessage(error, 'Could not add that email. Please try again.').text });
      return;
    }
    setAddEmailStatus({ kind: 'ok', message: 'Check your inbox — tap the link we sent to confirm, then you can sign in with this email too.' });
    setAddEmailValue('');
  }

  const userEmail = session?.user?.email;
  // A phone+PIN account with no real email yet: show the number, offer to add one.
  // A door ALREADY LINKED to a primary identity (person_links, DR-0311) gets no
  // "Add email" — the address it would add is its own other account, and the
  // library is already one (measured 2026-08-20: the add could only ever fail
  // "already registered" against himself).
  const isPhoneUser = isPhoneLoginSession(session);
  const linkedDoor = isLinkedDoor(userEmail);
  const label = identityLabel(session) || userEmail;

  // Signed OUT: render nothing. The ONE way in is HeaderAuthButton's "Log in" box
  // in the header cluster — no duplicate login here (Darrell 2026-07-15).
  if (!userEmail) return null;

  // A real email is attached when this is an email account, or a phone door
  // linked to its primary email identity (DR-0311). Phone-only, no email = the
  // washed-out envelope + the "Add email" offer.
  const hasEmail = !isPhoneUser || linkedDoor;

  // Status colours: green phone when a phone identity is held; full ink envelope
  // when an email is attached; washed-out for absent.
  const phoneClass = isPhoneUser ? 'text-[#5A6E3D]' : 'text-[#B0AAA2]';
  const mailClass = hasEmail ? 'text-[#1A1815]' : 'text-[#B0AAA2]';
  // The screen-reader name carries the STATE, never the raw digits — the number
  // and email live only inside the dialog (privacy: what this hides is the
  // glance / screenshot, not the account from its own owner).
  const srStatus =
    `Account — signed in ${isPhoneUser ? 'by phone' : 'by email'}` +
    `${hasEmail ? ', email attached' : ', no email added yet'}. Open account details.`;

  return (
    <div className="inline-flex items-center" data-read-skip data-auth-status>
      <button
        type="button"
        onClick={() => { setDetailsOpen(true); setAddEmailStatus(null); }}
        aria-haspopup="dialog"
        aria-expanded={detailsOpen}
        aria-label={srStatus}
        title="Account & sync status"
        className="inline-flex items-center gap-1 min-h-[36px] px-1.5 text-[#1A1815] hover:text-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]"
      >
        <span className={phoneClass} aria-hidden="true"><UiIcon name="phone" className="text-base" /></span>
        <span className={mailClass} aria-hidden="true"><UiIcon name="mail" className="text-base" /></span>
      </button>

      <Modal open={detailsOpen} onClose={() => setDetailsOpen(false)} label="Account">
        <div className="p-4 bg-white text-[#1A1815]">
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-2">Account · sign-in &amp; sync</div>
          <p className="text-[0.8125rem]" aria-label="Sync status">
            <span className="text-[#5A6E3D]">●</span> Signed in as{' '}
            <span className="font-mono break-all">{label}</span>
          </p>

          {isPhoneUser && linkedDoor && (
            <p className="text-[0.8125rem] mt-2 text-[#5A5751]">
              linked to <span className="font-mono break-all">{linkedPrimary(userEmail)}</span> — one library, both doors
            </p>
          )}

          {isPhoneUser && !linkedDoor && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => { setAddEmailOpen((v) => !v); setAddEmailStatus(null); }}
                aria-expanded={addEmailOpen}
                className="text-[0.8125rem] underline hover:text-[#B85838] focus:outline-none focus:text-[#B85838]"
              >
                Add email
              </button>
            </div>
          )}

          {/* Phone user adding a real login email — same account, same id, no merge:
              a verified email is attached to this account (DR-0172, DR-0253).
              Never shown to a linked door (DR-0311): its email already exists. */}
          {isPhoneUser && !linkedDoor && addEmailOpen && (
            <div className="mt-2">
              <form onSubmit={handleAddEmail} className="flex flex-col gap-2">
                <label htmlFor="add-login-email" className="text-[0.6875rem]">
                  Add your email (you can then sign in with it too):
                </label>
                <input
                  id="add-login-email"
                  type="email"
                  autoComplete="email"
                  value={addEmailValue}
                  onChange={(e) => setAddEmailValue(e.target.value)}
                  placeholder="you@example.com"
                  className="text-[0.8125rem] text-[#1A1815] bg-[#FAF8F4] border border-[#3A2A24] px-2 py-1.5 rounded focus:outline focus:outline-2 focus:outline-[#B85838]"
                />
                <button
                  type="submit"
                  disabled={addEmailBusy}
                  className="text-[0.6875rem] uppercase tracking-wider bg-[#B85838] text-[#FAF8F4] px-3 py-1.5 rounded hover:bg-[#a04d30] focus:outline focus:outline-2 focus:outline-[#1A1815] disabled:opacity-60 self-start"
                >
                  {addEmailBusy ? 'Sending…' : 'Send confirmation'}
                </button>
              </form>
              {addEmailStatus && (
                <p
                  aria-live="polite"
                  className={`text-[0.6875rem] mt-1.5 ${addEmailStatus.kind === 'ok' ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`}
                >
                  {addEmailStatus.message}
                </p>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
