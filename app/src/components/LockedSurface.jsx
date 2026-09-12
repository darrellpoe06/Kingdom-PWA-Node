// =============================================================================
// LockedSurface — the tab that is there, dark, and tells you how to ask
// =============================================================================
// Darrell 2026-09-11: "not showing tabs unless they are staff or it's black
// with instructions for access..."
//
// This is the second half of that sentence. It replaced five hand-written white
// boxes that each said a variation of "Sign in with a church staff account to
// view it" — which is not instructions: it does not say who holds the key, it
// does not say what the surface is, and for somebody already signed in it is
// simply wrong.
//
// WHAT A LOCKED TILE OWES THE READER, and all four are here:
//   1. WHAT this is, so a shut door is not a mystery.
//   2. WHO holds it — a real person or desk ("the church office, or Bishop
//      Gwin"), never "your administrator".
//   3. WHY it is shut, in the plain register, with no suggestion they did
//      something wrong.
//   4. WHAT IS NOT BUILT: there is no in-app request button yet, and saying so
//      beats a button that goes nowhere (DR-0329).
//
// It is dark on purpose — Darrell's word was "black" — which also makes a shut
// surface unmistakable beside the light ones, without a red warning colour that
// would read as an error. A shut door is not an error.
//
// The DATABASE is the wall (DR-0060). This tile is the app being honest about
// its own shape; it protects nothing by itself and never claims to.
// =============================================================================
import React, { useState } from 'react';
import UiIcon from './UiIcon.jsx';
import { surfaceAccess, canBeRequested, ACCESS_REQUEST_IS_NOT_BUILT } from '../lib/surface-access.js';
import { askForAccess, GRANT_IS_ALL_STAFF_TABS } from '../lib/access-requests.js';

const SERIF = { fontFamily: '"Fraunces", serif' };

/**
 * The registry is SHELL-ONLY (module-boundary-guard), so the shut surface's
 * own entry is handed in rather than looked up here — which also makes this
 * component testable with a two-key object and no registry at all.
 *
 * @param {object} surface the SURFACES entry ({ id, label, requires, whenDenied })
 * @param {object} viewer  { signedIn, isFamilyMember, isChurchStaff, isStudyCircle, instanceRole, reviewerMode }
 * @param {string} [what]  one line on what this surface is, for a reader who has never seen it
 * @param {function} [onSignIn] shown only when the viewer is signed out
 * @param {string} [instanceId] the church this person belongs to, for the ask
 */
export default function LockedSurface({ surface: entry = null, viewer = {}, what = '', onSignIn = null, instanceId = null }) {
  const surface = (entry && entry.id) ? entry : { id: 'unknown', label: 'This surface' };
  const access = surfaceAccess(surface, viewer);
  // The ask. Deliberately a small amount of state in the tile itself rather
  // than a modal: somebody who has just met a shut door should not have to
  // navigate somewhere else to knock on it.
  const askable = canBeRequested(surface, viewer) && !!instanceId;
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState('');
  const [said, setSaid] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    const res = await askForAccess({ instanceId, surfaceId: surface.id, surfaceLabel: surface.label, reason });
    setBusy(false);
    setSaid(res.ok
      ? 'Sent. The church office has it, and this tab opens the moment they say yes — you will not have to ask twice.'
      : res.message);
    if (res.ok) setAsking(false);
  };

  return (
    <section
      className="bg-[#1A1815] border-2 border-[#1A1815] p-5 text-[#F3EFE7]"
      aria-labelledby={`locked-${surface.id}`}
    >
      <div className="flex items-start gap-3">
        <UiIcon name="lock" className="w-5 h-5 mt-0.5 shrink-0 text-[#C9BFA8]" />
        <div className="min-w-0">
          <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#C9BFA8] font-semibold">Not open to you yet</div>
          <h2 id={`locked-${surface.id}`} className="text-xl mb-1" style={{ ...SERIF, fontWeight: 600 }}>{surface.label}</h2>

          {/* 1. WHAT it is. A shut door with no label is a mystery, and a
                 mystery is what makes people stop trusting a surface. */}
          {what && <p className="text-sm leading-relaxed text-[#E4DECF]" style={SERIF}>{what}</p>}

          {/* 3. WHY — stated as a fact about the surface, never about them. */}
          <p className="text-sm leading-relaxed text-[#E4DECF] mt-2" style={SERIF}>{access.why || access.plain}</p>

          {/* 2. WHO holds it. A name, not a role noun. */}
          {access.ask && (
            <p className="text-sm leading-relaxed mt-2" style={SERIF}>
              <span className="text-[#C9BFA8]">To ask for it: </span>
              <b className="text-[#F3EFE7]">{access.ask}</b>
            </p>
          )}

          {!viewer.signedIn && onSignIn && (
            <button
              type="button"
              onClick={onSignIn}
              className="mt-3 min-h-[36px] px-3 py-2 text-sm font-semibold border border-[#C9BFA8] text-[#F3EFE7] hover:border-[#F3EFE7] hover:bg-[#2A2724] focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              Sign in
            </button>
          )}

          {/* 4. THE ASK. It reaches the office, and an approval grants the key
                 on the spot — there is no second step for anybody to forget
                 (0211). Where no key exists, no button is drawn and the tile
                 says why instead of filing into nowhere. */}
          {viewer.signedIn && askable && !asking && (
            <div className="mt-3">
              <button type="button" onClick={() => { setAsking(true); setSaid(''); }}
                className="min-h-[36px] px-3 py-2 text-sm font-semibold border border-[#C9BFA8] text-[#F3EFE7] hover:border-[#F3EFE7] hover:bg-[#2A2724] focus:outline focus:outline-2 focus:outline-[#B85838]">
                Ask for access
              </button>
              {said && <p className="text-[0.6875rem] text-[#C9BFA8] mt-2 leading-relaxed">{said}</p>}
            </div>
          )}

          {viewer.signedIn && askable && asking && (
            <div className="mt-3 space-y-2">
              <label className="block text-[0.6875rem] text-[#C9BFA8]">
                Why do you need it? (optional — it helps the office answer)
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
                  placeholder="I look after the cameras on Sunday."
                  className="w-full min-h-[36px] mt-1 px-2 py-1 text-sm bg-[#2A2724] border border-[#4A453E] text-[#F3EFE7] focus:outline focus:outline-2 focus:outline-[#B85838]" />
              </label>
              <p className="text-[0.625rem] text-[#A39C8E] leading-relaxed">{GRANT_IS_ALL_STAFF_TABS}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={send} disabled={busy}
                  className="min-h-[36px] px-3 py-2 text-sm font-semibold border border-[#C9BFA8] text-[#F3EFE7] hover:border-[#F3EFE7] hover:bg-[#2A2724] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]">
                  {busy ? 'Sending…' : 'Send it'}
                </button>
                <button type="button" onClick={() => setAsking(false)}
                  className="min-h-[36px] px-3 py-2 text-sm border border-[#4A453E] text-[#C9BFA8] hover:border-[#C9BFA8] focus:outline focus:outline-2 focus:outline-[#B85838]">
                  Not now
                </button>
              </div>
              {said && <p className="text-[0.6875rem] text-[#C9BFA8] leading-relaxed">{said}</p>}
            </div>
          )}

          {/* No key exists for this one. Said plainly rather than drawn as a
              button that would file into nowhere (DR-0329). */}
          {viewer.signedIn && !askable && !access.grantedBy && (
            <p className="text-[0.6875rem] text-[#A39C8E] mt-3 leading-relaxed">
              {ACCESS_REQUEST_IS_NOT_BUILT.noKey}
            </p>
          )}

          {/* The honest footing: this screen is not what keeps anyone out. */}
          <p className="text-[0.6875rem] text-[#8A8478] mt-3 leading-relaxed">
            This is the app being straight with you about its own shape. What actually protects the data behind this tab is the database, and it holds whether this tab is drawn or not.
          </p>
        </div>
      </div>
    </section>
  );
}
