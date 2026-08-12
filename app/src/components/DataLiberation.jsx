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

import React, { useEffect, useState } from 'react';
import {
  VENDORS, STAGE, STAGE_ORDER, TOTAL_STEPS,
  getVendor, plainStage, canDelete, nextStep, stageIndex,
  loadProgress, saveProgress, attest, attestedBy, exportProgress,
} from '../lib/data-liberation.js';
import { dataLiberationSync, mergeRemoteLiberation } from '../lib/data-liberation-sync.js';

const serif = { fontFamily: '"Fraunces", serif' };

// Text tokens kept at the darkest end on purpose — mid-greys are the first
// thing to fail for aging eyes, so body copy uses near-black, not #5A5751.
const INK = '#1A1815';
const ACCENT = '#B85838';
const RULE = '#E8E4DC';

// Every button clears 44px and reads as a button without relying on color.
const bigButton = {
  minHeight: '52px',
  fontSize: '1.125rem',
  fontWeight: 600,
};

function BackLink({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="underline mb-5 px-2 py-3 -ml-2 text-left"
      className="text-[#1A1815]" style={{ ...serif,  fontSize: '1.0625rem', minHeight: '44px' }}
    >
      {children}
    </button>
  );
}

/** Step 1 of the journey: which service, in plain names people recognise. */
function ChooseService({ onPick, progressById }) {
  return (
    <div>
      <h2 className="ts-chrome-region text-3xl sm:text-4xl mb-3 leading-tight text-[#1A1815]" style={{ ...serif, fontWeight: 500 }}>
        Bring your things home
      </h2>
      <p className="mb-2 leading-relaxed text-[#1A1815]" style={{ ...serif,  fontSize: '1.1875rem', maxWidth: '34rem' }}>
        Your photos, your mail and your files belong to you. This helps you get
        your own copy of them, one step at a time.
      </p>
      <p className="mb-7 leading-relaxed text-[#1A1815]" style={{ ...serif,  fontSize: '1.1875rem', maxWidth: '34rem' }}>
        Take as long as you like. Nothing is deleted anywhere until you have your
        copy and we have checked that everything arrived.
      </p>

      <div className="text-lg mb-4 text-[#1A1815]" style={{ ...serif,  fontWeight: 600 }}>
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
                <span aria-hidden="true" style={{ fontSize: '1.625rem' }}>{v.icon}</span>
                <span className="text-[#1A1815]" style={{ ...serif,  fontSize: '1.3125rem', fontWeight: 600 }}>{v.name}</span>
              </div>
              <div className="mt-1 leading-relaxed text-[#1A1815]" style={{ ...serif,  fontSize: '1.0625rem' }}>
                {v.holds}
              </div>
              {/* State is always in WORDS, never only a border colour. */}
              {started && (
                <div className="mt-2 text-[#B85838]" style={{ ...serif,  fontSize: '1rem', fontWeight: 600 }}>
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
      <div className="mb-3 text-[#1A1815]" style={{ ...serif,  fontSize: '1.25rem', fontWeight: 600 }}>
        Before anything is deleted
      </div>
      <p className="mb-4 leading-relaxed text-[#1A1815]" style={{ ...serif,  fontSize: '1.125rem' }}>
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
        <span className="text-[#1A1815]" style={{ ...serif,  fontSize: '1.125rem' }}>
          I opened some of the files and they work.
          {attestedBy(progress, 'bytesVerified') && (
            <span className="block" style={{ fontSize: '1rem' }}>
              {attestedBy(progress, 'bytesVerified')}
            </span>
          )}
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
        <span className="text-[#1A1815]" style={{ ...serif,  fontSize: '1.125rem' }}>
          I compared how many there are. I looked at{' '}
          <strong>{vendor.completenessCheck.where}</strong> and the number of my
          own files is about the same.
          {attestedBy(progress, 'completenessConfirmed') && (
            <span className="block" style={{ fontSize: '1rem' }}>
              {attestedBy(progress, 'completenessConfirmed')}
            </span>
          )}
        </span>
      </label>

      {!gate.allowed && (
        <div className="border-l-4 pl-3 py-2" style={{ borderColor: ACCENT }}>
          <div className="text-[#1A1815]" style={{ ...serif,  fontSize: '1.0625rem', fontWeight: 600 }}>
            Not safe to delete yet.
          </div>
          <div className="text-[#1A1815]" style={{ ...serif,  fontSize: '1.0625rem' }}>
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
        <span aria-hidden="true" style={{ fontSize: '1.875rem' }}>{vendor.icon}</span>
        <h2 className="ts-chrome-region text-3xl leading-tight text-[#1A1815]" style={{ ...serif, fontWeight: 500 }}>
          {vendor.name}
        </h2>
      </div>

      {/* Progress in words and numbers, never a bare bar. */}
      <div className="mb-5 text-[#1A1815]" style={{ ...serif,  fontSize: '1.0625rem' }}>
        Step {plain.step} of {TOTAL_STEPS} — {plain.title}
      </div>

      <div className="border-2 p-4" style={{ borderColor: RULE, background: '#FFFFFF' }}>
        <p className="mb-4 leading-relaxed text-[#1A1815]" style={{ ...serif,  fontSize: '1.25rem' }}>
          {plain.you}
        </p>

        <div className="mb-2 text-[#1A1815]" style={{ ...serif,  fontSize: '1.1875rem', fontWeight: 600 }}>
          What to do now
        </div>
        <p className="mb-4 leading-relaxed text-[#1A1815]" style={{ ...serif,  fontSize: '1.125rem' }}>
          {step.detail}
        </p>

        {/* The settings only matter on the very first step. */}
        {progress.stage === STAGE.NOT_STARTED && (
          <div className="border-l-4 pl-3 py-2 mb-4" style={{ borderColor: RULE }}>
            <div className="mb-1 text-[#1A1815]" style={{ ...serif,  fontSize: '1.0625rem', fontWeight: 600 }}>
              On their page, choose these:
            </div>
            <ul>
              {vendor.settings.map((s, i) => (
                <li key={i} className="leading-relaxed text-[#1A1815]" style={{ ...serif,  fontSize: '1.0625rem' }}>
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
            <div className="mb-1 text-[#1A1815]" style={{ ...serif,  fontSize: '1.0625rem', fontWeight: 600 }}>
              Worth knowing
            </div>
            <ul>
              {vendor.warnings.map((w, i) => (
                <li key={i} className="leading-relaxed mb-1 text-[#1A1815]" style={{ ...serif,  fontSize: '1.0625rem' }}>
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
              <p className="leading-relaxed text-[#1A1815]" style={{ ...serif,  fontSize: '1.125rem' }}>
                Tick both boxes above when you have checked, and the next step
                will appear here.
              </p>
            ) : (
              <button
                type="button"
                onClick={advance}
                className="w-full sm:w-auto px-6 border-2"
                className="text-[#1A1815]" style={{ ...serif, ...bigButton, background: '#FFFFFF',  borderColor: INK, paddingTop: '12px', paddingBottom: '12px' }}
              >
                {progress.stage === STAGE.VERIFIED && gate.allowed
                  ? 'I have freed up the space'
                  : 'I have done this — next step'}
              </button>
            )}
          </div>
        )}

        {isLast && (
          <p className="leading-relaxed mt-3 text-[#1A1815]" style={{ ...serif,  fontSize: '1.125rem' }}>
            Keep your copy somewhere safe, and if you can, keep a second copy.
            One copy on one device is not really a backup.
          </p>
        )}
      </div>

      {/* The thing about this service people get caught by. Always visible, so
          it is read before the mistake rather than after. */}
      <div className="border-l-4 pl-3 py-2 mt-5" style={{ borderColor: ACCENT }}>
        <div className="mb-1 text-[#1A1815]" style={{ ...serif,  fontSize: '1.0625rem', fontWeight: 600 }}>
          One thing to watch with {vendor.name}
        </div>
        <p className="leading-relaxed text-[#1A1815]" style={{ ...serif,  fontSize: '1.0625rem' }}>
          {vendor.gotcha}
        </p>
      </div>

      {/* Honest about where our information came from (DR-0076). */}
      {vendor.confirmOnPage && (
        <p className="mt-4 leading-relaxed text-[#1A1815]" style={{ ...serif,  fontSize: '1rem' }}>
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
      <div className="mb-3 text-[#1A1815]" style={{ ...serif,  fontSize: '1.1875rem', fontWeight: 600 }}>
        All steps at once
      </div>
      <ol className="mb-4">
        {STAGE_ORDER.filter((s) => s !== STAGE.BUILDING).map((s) => {
          const p = plainStage(s);
          const step = nextStep(vendor.id, { stage: s });
          return (
            <li key={s} className="mb-3 leading-relaxed text-[#1A1815]" style={{ ...serif,  fontSize: '1.0625rem' }}>
              <strong>{p.step}. {p.title}</strong> — {step.detail}
            </li>
          );
        })}
      </ol>

      <div className="mb-2 text-[#1A1815]" style={{ ...serif,  fontSize: '1.0625rem', fontWeight: 600 }}>
        Details
      </div>
      <ul className="mb-3">
        <li className="leading-relaxed mb-1 text-[#1A1815]" style={{ ...serif,  fontSize: '1rem' }}>
          • Request page: <span className="break-all">{vendor.requestUrl}</span>
        </li>
        <li className="leading-relaxed mb-1 text-[#1A1815]" style={{ ...serif,  fontSize: '1rem' }}>
          • Manage / download page: <span className="break-all">{vendor.manageUrl}</span>
        </li>
        <li className="leading-relaxed mb-1 text-[#1A1815]" style={{ ...serif,  fontSize: '1rem' }}>
          • Link window: {typeof vendor.expiryDays === 'number'
            ? `about ${vendor.expiryDays} days`
            : 'not published by the vendor — read it off their page'}
        </li>
        <li className="leading-relaxed mb-1 text-[#1A1815]" style={{ ...serif,  fontSize: '1rem' }}>
          • Completeness: compare {vendor.completenessCheck.compare} at {vendor.completenessCheck.where} against {vendor.completenessCheck.against}
        </li>
        {vendor.ownedTool && (
          <li className="leading-relaxed mb-1 text-[#1A1815]" style={{ ...serif,  fontSize: '1rem' }}>
            • Tooling in this repo: <span className="break-all">{vendor.ownedTool}</span>
          </li>
        )}
      </ul>

      {vendor.gotchaTechnical && (
        <div className="mb-3 leading-relaxed text-[#1A1815]" style={{ ...serif,  fontSize: '1rem' }}>
          Technically: {vendor.gotchaTechnical}
        </div>
      )}

      {/* Provenance, stated rather than implied (DR-0076). */}
      <div className="text-[#1A1815]" style={{ ...serif,  fontSize: '1rem' }}>
        {vendor.verified
          ? <>Verified {vendor.verified.at}: {vendor.verified.how}</>
          : <>Not independently verified by us — confirm against the vendor&apos;s own page.</>}
      </div>
    </div>
  );
}

/** Exportable always (DATA-AS-EMPOWERMENT commitment 3). We teach people to
 *  demand their data back from Google; holding this record hostage would make
 *  the whole surface a hypocrite. Plain JSON, one tap, no permission needed. */
function TakeItWithYou({ progressById }) {
  const [done, setDone] = useState(false);
  const anything = Object.values(progressById || {})
    .some((p) => p && p.stage && p.stage !== STAGE.NOT_STARTED);
  if (!anything) return null;

  const download = () => {
    const payload = { ...exportProgress(progressById), exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-data-progress.json';
    a.click();
    URL.revokeObjectURL(url);
    setDone(true);
  };

  return (
    <div className="mt-7 pt-5" style={{ borderTop: `1px solid ${RULE}` }}>
      <p className="mb-3 leading-relaxed text-[#1A1815]" style={{ ...serif,  fontSize: '1.0625rem', maxWidth: '34rem' }}>
        This list is yours too. You can take a copy of it with you at any time,
        the same way you are taking your photos back from them.
      </p>
      <button
        type="button"
        onClick={download}
        className="px-5 border-2"
        className="text-[#1A1815]" style={{ ...serif,  borderColor: INK, background: '#FFFFFF', minHeight: '48px', fontSize: '1.0625rem', fontWeight: 600 }}
      >
        {done ? 'Saved to your device' : 'Save my progress to my device'}
      </button>
    </div>
  );
}

export default function DataLiberation() {
  const [picked, setPicked] = useState(null);
  // Local-first: the surface is fully usable signed out and offline. The cloud
  // is a courier, never a requirement (table-sync contract).
  const [progressById, setProgressById] = useState(() => loadProgress());
  // Default is the guided path, because that serves the most people and an
  // expert loses nothing by one tap. The reverse is not true.
  const [everything, setEverything] = useState(false);

  const vendor = picked ? getVendor(picked) : null;
  const progress = (picked && progressById[picked]) || { stage: STAGE.NOT_STARTED };

  // Every change is written to this device immediately — a flow that spans days
  // must survive closing the tab.
  useEffect(() => { saveProgress(progressById); }, [progressById]);

  // ...and forwarded to the person's other devices. Rows are user-scoped by RLS
  // (schema v2.17), so this never crosses to another family member.
  useEffect(() => {
    const unsub = dataLiberationSync.subscribe((items) => {
      setProgressById((prev) => {
        const local = Object.entries(prev).map(([id, p]) => ({ id, ...p }));
        const merged = mergeRemoteLiberation(local, items, stageIndex);
        const next = {};
        for (const m of merged) { const { id, ...rest } = m; next[id] = rest; }
        return next;
      });
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);

  const persist = (patch) => {
    const updated = { ...progress, ...patch };
    setProgressById((prev) => ({ ...prev, [picked]: updated }));
    dataLiberationSync.upload({ id: picked, ...updated });
  };

  const setStage = (stage) => persist({ stage });

  // An attestation records WHO and WHEN, not just a boolean — see attest().
  const setConfirm = (key, value) =>
    persist(attest(progress, key, value, { at: new Date().toISOString() }));

  return (
    <section className="bg-white border-2 p-5 sm:p-6" style={{ borderColor: INK }}>
      <div className="text-xs uppercase tracking-[0.25em] mb-2 font-semibold text-[#B85838]" style={{  }}>
        Your data, your hands
      </div>

      {!vendor ? (
        <>
          <ChooseService onPick={setPicked} progressById={progressById} />
          <TakeItWithYou progressById={progressById} />
        </>
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
            className="text-[#1A1815]" style={{ ...serif,  fontSize: '1.0625rem', minHeight: '44px' }}
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
