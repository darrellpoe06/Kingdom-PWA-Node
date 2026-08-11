// DataLiberation — "Bring Your Things Home". The guided, one-step-at-a-time way
// a person gets their own photos, mail and files out of a company's cloud and
// onto something they own.
//
// Darrell 2026-08-11: "easy to do process to help our users through the process
// of getting their data from Google Amazon photo... etc" and then, decisively:
// "user friendly... we have elderly users... or will..."
//
// THAT SECOND SENTENCE IS THE DESIGN. This started as a nine-vendor dashboard.
// A dashboard is the wrong shape for someone who is nervous about deleting
// their own photographs. So:
//
//   ONE QUESTION ON SCREEN. Choose a service, then see exactly one thing to do
//     next. Never a grid of options competing for attention.
//   NO JARGON, EVER. Not "export", not "archive", not "Takeout", not "verify".
//     "Ask for your copy." "Save it to your computer." "Make sure everything
//     arrived." Vendor words appear only inside quoted button names, because
//     that is the word printed on the screen they are looking at.
//   BIG TARGETS, BIG TEXT. Minimum 44px tap height, 18px+ body, generous
//     spacing. Nothing important is carried by color alone — every state is
//     also stated in words.
//   NEVER A DEAD END. Every state renders a next action and a way back.
//   NEVER BLAME THE USER. If something is missing, the copy says the company's
//     copy was incomplete, because that is usually what happened.
//
// THE SAFETY MOMENT (DR-0238 §3 / DR-0076): the one screen that matters is the
// one before deleting. A company's "your copy is ready" email can arrive for an
// INCOMPLETE copy — proven in Darrell's own mail, 2019 and 2021. An incomplete
// copy opens fine and looks perfect. So the delete step is gated on two
// separate confirmations, stated plainly, and the button is simply not there
// until both are ticked. lib/data-liberation.js `canDelete()` is the authority;
// this file never decides on its own.

import React, { useState } from 'react';
import {
  VENDORS, STAGE, STAGE_ORDER, TOTAL_STEPS,
  getVendor, plainStage, canDelete, nextStep, stageIndex,
} from '../lib/data-liberation.js';

const serif = { fontFamily: '"Fraunces", serif' };

// Text tokens kept at the darkest end on purpose — mid-greys are the first
// thing to fail for aging eyes, so body copy uses near-black, not #5A5751.
const INK = '#1A1815';
const ACCENT = '#B85838';
const RULE = '#E8E4DC';

// Every button clears 44px and reads as a button without relying on color.
const bigButton = {
  minHeight: '52px',
  fontSize: '18px',
  fontWeight: 600,
};

function BackLink({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="underline mb-5 px-2 py-3 -ml-2 text-left"
      style={{ ...serif, color: INK, fontSize: '17px', minHeight: '44px' }}
    >
      {children}
    </button>
  );
}

/** Step 1 of the journey: which service, in plain names people recognise. */
function ChooseService({ onPick, progressById }) {
  return (
    <div>
      <h2 className="text-3xl sm:text-4xl mb-3 leading-tight" style={{ ...serif, fontWeight: 500, color: INK }}>
        Bring your things home
      </h2>
      <p className="mb-2 leading-relaxed" style={{ ...serif, color: INK, fontSize: '19px', maxWidth: '34rem' }}>
        Your photos, your mail and your files belong to you. This helps you get
        your own copy of them, one step at a time.
      </p>
      <p className="mb-7 leading-relaxed" style={{ ...serif, color: INK, fontSize: '19px', maxWidth: '34rem' }}>
        Take as long as you like. Nothing is deleted anywhere until you have your
        copy and we have checked that everything arrived.
      </p>

      <div className="text-lg mb-4" style={{ ...serif, color: INK, fontWeight: 600 }}>
        Where are your things now?
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {VENDORS.map((v) => {
          const p = progressById[v.id];
          const started = p && p.stage && p.stage !== STAGE.NOT_STARTED;
          const done = p && p.stage === STAGE.DELETED;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onPick(v.id)}
              className="border-2 p-4 text-left w-full"
              style={{ borderColor: started ? ACCENT : RULE, minHeight: '96px', background: '#FFFFFF' }}
            >
              <div className="flex items-baseline gap-3">
                <span aria-hidden="true" style={{ fontSize: '26px' }}>{v.icon}</span>
                <span style={{ ...serif, color: INK, fontSize: '21px', fontWeight: 600 }}>{v.name}</span>
              </div>
              <div className="mt-1 leading-relaxed" style={{ ...serif, color: INK, fontSize: '17px' }}>
                {v.holds}
              </div>
              {/* State is always in WORDS, never only a border colour. */}
              {started && (
                <div className="mt-2" style={{ ...serif, color: ACCENT, fontSize: '16px', fontWeight: 600 }}>
                  {done ? 'Finished' : `Started — step ${plainStage(p.stage).step} of ${TOTAL_STEPS}`}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** The safety screen. Two separate confirmations, in plain words. */
function SafetyCheck({ vendor, progress, onConfirm }) {
  const gate = canDelete(progress);
  return (
    <div className="border-2 p-4 mt-5" style={{ borderColor: ACCENT }}>
      <div className="mb-3" style={{ ...serif, color: INK, fontSize: '20px', fontWeight: 600 }}>
        Before anything is deleted
      </div>
      <p className="mb-4 leading-relaxed" style={{ ...serif, color: INK, fontSize: '18px' }}>
        Sometimes a company sends your copy with things missing, and it still
        looks perfectly fine when you open it. So we check two things. Please
        tick each one only when you have actually looked.
      </p>

      <label className="flex items-start gap-3 mb-4 cursor-pointer" style={{ minHeight: '44px' }}>
        <input
          type="checkbox"
          checked={progress.bytesVerified === true}
          onChange={(e) => onConfirm('bytesVerified', e.target.checked)}
          className="mt-1"
          style={{ width: '26px', height: '26px' }}
        />
        <span style={{ ...serif, color: INK, fontSize: '18px' }}>
          I opened some of the files and they work.
        </span>
      </label>

      <label className="flex items-start gap-3 mb-4 cursor-pointer" style={{ minHeight: '44px' }}>
        <input
          type="checkbox"
          checked={progress.completenessConfirmed === true}
          onChange={(e) => onConfirm('completenessConfirmed', e.target.checked)}
          className="mt-1"
          style={{ width: '26px', height: '26px' }}
        />
        <span style={{ ...serif, color: INK, fontSize: '18px' }}>
          I compared how many there are. I looked at{' '}
          <strong>{vendor.completenessCheck.where}</strong> and the number of my
          own files is about the same.
        </span>
      </label>

      {!gate.allowed && (
        <div className="border-l-4 pl-3 py-2" style={{ borderColor: ACCENT }}>
          <div style={{ ...serif, color: INK, fontSize: '17px', fontWeight: 600 }}>
            Not safe to delete yet.
          </div>
          <div style={{ ...serif, color: INK, fontSize: '17px' }}>
            {vendor.completenessCheck.note}
          </div>
        </div>
      )}
    </div>
  );
}

/** The single focused screen for one service. */
function ServiceSteps({ vendor, progress, onSet, onConfirm, onBack }) {
  const plain = plainStage(progress.stage);
  const step = nextStep(vendor.id, progress);
  const atSafety = progress.stage === STAGE.LANDED || progress.stage === STAGE.VERIFIED;
  const gate = canDelete(progress);
  // Two DIFFERENT questions, and conflating them deadlocks the flow:
  //   bothChecked — has the person done the two checks? (true at any stage)
  //   gate        — is deleting authorised? (also requires the stage to have
  //                 reached verified, which is what advancing past LANDED means)
  // The advance out of LANDED asks the first; the delete asks the second.
  const bothChecked = progress.bytesVerified === true && progress.completenessConfirmed === true;
  const blocked = atSafety && !bothChecked;
  const idx = stageIndex(progress.stage);
  const isLast = progress.stage === STAGE.DELETED;

  const advance = () => {
    const next = STAGE_ORDER[Math.min(idx + 1, STAGE_ORDER.length - 1)];
    onSet(next);
  };

  return (
    <div>
      <BackLink onClick={onBack}>← Choose something else</BackLink>

      <div className="flex items-baseline gap-3 mb-1">
        <span aria-hidden="true" style={{ fontSize: '30px' }}>{vendor.icon}</span>
        <h2 className="text-3xl leading-tight" style={{ ...serif, fontWeight: 500, color: INK }}>
          {vendor.name}
        </h2>
      </div>

      {/* Progress in words and numbers, never a bare bar. */}
      <div className="mb-5" style={{ ...serif, color: INK, fontSize: '17px' }}>
        Step {plain.step} of {TOTAL_STEPS} — {plain.title}
      </div>

      <div className="border-2 p-4" style={{ borderColor: RULE, background: '#FFFFFF' }}>
        <p className="mb-4 leading-relaxed" style={{ ...serif, color: INK, fontSize: '20px' }}>
          {plain.you}
        </p>

        <div className="mb-2" style={{ ...serif, color: INK, fontSize: '19px', fontWeight: 600 }}>
          What to do now
        </div>
        <p className="mb-4 leading-relaxed" style={{ ...serif, color: INK, fontSize: '18px' }}>
          {step.detail}
        </p>

        {/* The settings only matter on the very first step. */}
        {progress.stage === STAGE.NOT_STARTED && (
          <div className="border-l-4 pl-3 py-2 mb-4" style={{ borderColor: RULE }}>
            <div className="mb-1" style={{ ...serif, color: INK, fontSize: '17px', fontWeight: 600 }}>
              On their page, choose these:
            </div>
            <ul>
              {vendor.settings.map((s, i) => (
                <li key={i} className="leading-relaxed" style={{ ...serif, color: INK, fontSize: '17px' }}>
                  • {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {step.url && (
          <a
            href={step.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full sm:w-auto px-6 mb-4 border-2"
            style={{ ...serif, ...bigButton, background: ACCENT, color: '#FFFFFF', borderColor: ACCENT, textDecoration: 'none', paddingTop: '12px', paddingBottom: '12px' }}
          >
            {step.action} →
          </a>
        )}

        {/* Things that quietly cost people their data. Plain, not scary. */}
        {progress.stage === STAGE.NOT_STARTED && vendor.warnings.length > 0 && (
          <div className="mt-2">
            <div className="mb-1" style={{ ...serif, color: INK, fontSize: '17px', fontWeight: 600 }}>
              Worth knowing
            </div>
            <ul>
              {vendor.warnings.map((w, i) => (
                <li key={i} className="leading-relaxed mb-1" style={{ ...serif, color: INK, fontSize: '17px' }}>
                  • {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {atSafety && (
          <SafetyCheck vendor={vendor} progress={progress} onConfirm={onConfirm} />
        )}

        {/* Advance. At the delete step the button simply is not there until
            both confirmations are ticked — nothing to mis-tap. */}
        {!isLast && (
          <div className="mt-5">
            {/* Gated from the moment the files land, not just at the last
                click. Reaching "everything is there" should REQUIRE having
                checked, otherwise the final screen inherits a claim nobody
                made. Applies to expert and beginner identically. */}
            {blocked ? (
              <p className="leading-relaxed" style={{ ...serif, color: INK, fontSize: '18px' }}>
                Tick both boxes above when you have checked, and the next step
                will appear here.
              </p>
            ) : (
              <button
                type="button"
                onClick={advance}
                className="w-full sm:w-auto px-6 border-2"
                style={{ ...serif, ...bigButton, background: '#FFFFFF', color: INK, borderColor: INK, paddingTop: '12px', paddingBottom: '12px' }}
              >
                {progress.stage === STAGE.VERIFIED && gate.allowed
                  ? 'I have freed up the space'
                  : 'I have done this — next step'}
              </button>
            )}
          </div>
        )}

        {isLast && (
          <p className="leading-relaxed mt-3" style={{ ...serif, color: INK, fontSize: '18px' }}>
            Keep your copy somewhere safe, and if you can, keep a second copy.
            One copy on one device is not really a backup.
          </p>
        )}
      </div>

      {/* The thing about this service people get caught by. Always visible, so
          it is read before the mistake rather than after. */}
      <div className="border-l-4 pl-3 py-2 mt-5" style={{ borderColor: ACCENT }}>
        <div className="mb-1" style={{ ...serif, color: INK, fontSize: '17px', fontWeight: 600 }}>
          One thing to watch with {vendor.name}
        </div>
        <p className="leading-relaxed" style={{ ...serif, color: INK, fontSize: '17px' }}>
          {vendor.gotcha}
        </p>
      </div>

      {/* Honest about where our information came from (DR-0076). */}
      {vendor.confirmOnPage && (
        <p className="mt-4 leading-relaxed" style={{ ...serif, color: INK, fontSize: '16px' }}>
          Note: {vendor.name} changes their pages from time to time. If what you
          see does not match these steps, follow what is on their screen.
        </p>
      )}
    </div>
  );
}

/** EXPERT VIEW — the whole thing at once, for someone who does not want to be
 *  walked. Darrell 2026-08-11: "Both types of users... kids elderly and all
 *  ages... even experts."
 *
 *  Not a second product and not a shortcut. Same data, same order, same gate —
 *  just unfolded, with the technical names and the provenance shown. The one
 *  thing it deliberately does NOT do is let an expert skip the two
 *  confirmations: a partial copy is byte-perfect no matter who is looking at
 *  it, and confidence is exactly what makes an expert delete it.
 */
function EverythingView({ vendor }) {
  return (
    <div className="border-2 p-4 mt-5" style={{ borderColor: RULE }}>
      <div className="mb-3" style={{ ...serif, color: INK, fontSize: '19px', fontWeight: 600 }}>
        All steps at once
      </div>
      <ol className="mb-4">
        {STAGE_ORDER.filter((s) => s !== STAGE.BUILDING).map((s) => {
          const p = plainStage(s);
          const step = nextStep(vendor.id, { stage: s });
          return (
            <li key={s} className="mb-3 leading-relaxed" style={{ ...serif, color: INK, fontSize: '17px' }}>
              <strong>{p.step}. {p.title}</strong> — {step.detail}
            </li>
          );
        })}
      </ol>

      <div className="mb-2" style={{ ...serif, color: INK, fontSize: '17px', fontWeight: 600 }}>
        Details
      </div>
      <ul className="mb-3">
        <li className="leading-relaxed mb-1" style={{ ...serif, color: INK, fontSize: '16px' }}>
          • Request page: <span className="break-all">{vendor.requestUrl}</span>
        </li>
        <li className="leading-relaxed mb-1" style={{ ...serif, color: INK, fontSize: '16px' }}>
          • Manage / download page: <span className="break-all">{vendor.manageUrl}</span>
        </li>
        <li className="leading-relaxed mb-1" style={{ ...serif, color: INK, fontSize: '16px' }}>
          • Link window: {typeof vendor.expiryDays === 'number'
            ? `about ${vendor.expiryDays} days`
            : 'not published by the vendor — read it off their page'}
        </li>
        <li className="leading-relaxed mb-1" style={{ ...serif, color: INK, fontSize: '16px' }}>
          • Completeness: compare {vendor.completenessCheck.compare} at {vendor.completenessCheck.where} against {vendor.completenessCheck.against}
        </li>
        {vendor.ownedTool && (
          <li className="leading-relaxed mb-1" style={{ ...serif, color: INK, fontSize: '16px' }}>
            • Tooling in this repo: <span className="break-all">{vendor.ownedTool}</span>
          </li>
        )}
      </ul>

      {vendor.gotchaTechnical && (
        <div className="mb-3 leading-relaxed" style={{ ...serif, color: INK, fontSize: '16px' }}>
          Technically: {vendor.gotchaTechnical}
        </div>
      )}

      {/* Provenance, stated rather than implied (DR-0076). */}
      <div style={{ ...serif, color: INK, fontSize: '16px' }}>
        {vendor.verified
          ? <>Verified {vendor.verified.at}: {vendor.verified.how}</>
          : <>Not independently verified by us — confirm against the vendor&apos;s own page.</>}
      </div>
    </div>
  );
}

export default function DataLiberation() {
  const [picked, setPicked] = useState(null);
  const [progressById, setProgressById] = useState({});
  // Default is the guided path, because that serves the most people and an
  // expert loses nothing by one tap. The reverse is not true.
  const [everything, setEverything] = useState(false);

  const vendor = picked ? getVendor(picked) : null;
  const progress = (picked && progressById[picked]) || { stage: STAGE.NOT_STARTED };

  const setStage = (stage) =>
    setProgressById((prev) => ({ ...prev, [picked]: { ...progress, stage } }));

  const setConfirm = (key, value) =>
    setProgressById((prev) => ({ ...prev, [picked]: { ...progress, [key]: value } }));

  return (
    <section className="bg-white border-2 p-5 sm:p-6" style={{ borderColor: INK }}>
      <div className="text-xs uppercase tracking-[0.25em] mb-2 font-semibold" style={{ color: ACCENT }}>
        Your data, your hands
      </div>

      {!vendor ? (
        <ChooseService onPick={setPicked} progressById={progressById} />
      ) : (
        <>
          <ServiceSteps
            vendor={vendor}
            progress={progress}
            onSet={setStage}
            onConfirm={setConfirm}
            onBack={() => setPicked(null)}
          />

          {/* One tap between the two audiences. Placed AFTER the guided step so
              it never competes with the next action, and labelled in plain
              words rather than "advanced" (which reads as "not for you"). */}
          <button
            type="button"
            onClick={() => setEverything((v) => !v)}
            className="underline mt-5 px-2 py-3 -ml-2 text-left"
            style={{ ...serif, color: INK, fontSize: '17px', minHeight: '44px' }}
            aria-expanded={everything}
          >
            {everything ? 'Hide the full list' : 'Show me all the steps at once'}
          </button>

          {everything && <EverythingView vendor={vendor} />}
        </>
      )}
    </section>
  );
}
