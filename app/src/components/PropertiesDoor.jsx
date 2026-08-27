// =============================================================================
// PropertiesDoor — the Poe Properties App's own front door (/properties/app/)
// =============================================================================
// Darrell, 2026-08-26: "1099 workers and tenants and their families will use the
// Poe Properties App ... Both Apps should be able to work together or separate."
//
// This is the LEAN boot for that app: sign in, then the properties module. It
// never imports the PoeTech monolith — a tenant opening this door downloads a
// property-management app, not a family finance platform, and sees nothing of
// the books because there is nothing of the books in the bundle OR in the RLS
// (the two agree, which is the point — DR-0060).
//
// It is the same MODULE the PoeTech app mounts. One library, two doors: no
// second copy of the logic and no second store, so both faces are always on the
// same rows (Darrell: "keeping both with latest Synced data").
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import supabase from '../lib/supabase.js';
import PasswordAuth from './PasswordAuth.jsx';
import PropertiesApp from '../modules/properties/PropertiesApp.jsx';
import { POE_PROPERTIES } from '../modules/properties/config.js';
import { WHO_OPTIONS } from '../modules/properties/model.js';
import { readApplyTarget, resolveScan } from '../modules/properties/apply-link.js';
import { loadPublicVacancies, submitApplication } from '../modules/properties/cloud.js';
import { APPLICATION_SECTIONS, validateApplication } from '../modules/properties/intake.js';

const { brand } = POE_PROPERTIES;
const serif = { fontFamily: '"Fraunces", Georgia, serif' };

export default function PropertiesDoor() {
  const [session, setSession] = useState(undefined); // undefined = still checking

  useEffect(() => {
    let on = true;
    // Hard deadline (the DoorAuth precedent): getSession() can wait on a
    // cross-tab auth lock a wedged window holds. A door that cannot answer in
    // time renders SIGNED OUT — the honest state that always shows a way in,
    // never a blank screen.
    const deadline = new Promise((resolve) => setTimeout(() => resolve({ timedOut: true }), 5000));
    (async () => {
      const s = await Promise.race([supabase.auth.getSession(), deadline]);
      if (!on) return;
      setSession(s?.timedOut ? null : (s?.data?.session || null));
    })().catch(() => { if (on) setSession(null); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { if (on) setSession(s || null); });
    return () => { on = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  return (
    <div className="min-h-screen" style={{ background: brand.background }}>
      <header className="border-b-2 px-4 py-3 flex flex-wrap items-baseline justify-between gap-2" style={{ borderColor: brand.accent }}>
        <div>
          <h1 className="text-lg font-semibold" style={{ ...serif, color: brand.accent }}>{brand.label}</h1>
          <p className="text-xs text-[#5A5751]" style={serif}>{brand.tagline}</p>
        </div>
        {session && (
          <button
            type="button"
            className="text-[0.625rem] uppercase tracking-wider underline text-[#5A5751]"
            onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
          >Sign out</button>
        )}
      </header>

      <main className="w-full p-3 sm:p-4 lg:px-8">
        {session === undefined && (
          <p className="text-xs text-[#5A5751] p-2" style={serif}>Checking your sign-in…</p>
        )}
        {session === null && <SignedOutDoor />}
        {session && <PropertiesApp surface="door" />}
      </main>

      <footer className="px-4 py-6 text-center">
        <p className="text-[0.625rem] uppercase tracking-[0.2em] text-[#8A867E]">Poe Properties · powered by PoeTech</p>
      </footer>
    </div>
  );
}

/**
 * The door with NO account (Darrell, 2026-08-26: "Ask who they are landlord
 * tenant or applicant... others?" and "See options without a user account").
 *
 * It used to say one thing — "a landlord invites you" — which is a dead end for
 * the person most likely to open a property app first: someone looking for a
 * place. Now it asks, and the one answer that needs no account (looking for a
 * place) is served immediately from the listed vacancies.
 */
function SignedOutDoor() {
  // A QR on a vacant unit lands here with ?apply=<rental id>. Someone who
  // scanned a code at a property has already answered "who are you" — they are
  // asking about that unit — so the who-picker is skipped rather than made into
  // a toll gate in front of the thing they came for.
  const scanned = useMemo(
    () => (typeof window === 'undefined' ? null : readApplyTarget(window.location.search)),
    [],
  );
  const [who, setWho] = useState(scanned ? 'applicant' : null);
  const [wantsAuth, setWantsAuth] = useState(false);
  const [vacancies, setVacancies] = useState(null);   // null = not asked yet

  useEffect(() => {
    if (who !== 'applicant' || vacancies !== null) return;
    let on = true;
    loadPublicVacancies().then((r) => { if (on) setVacancies(r.ok ? r.vacancies : []); });
    return () => { on = false; };
  }, [who, vacancies]);

  // The vacancies list is the authority on whether a scanned card is still
  // good: public_vacancies already refuses a door that is unadvertised or
  // occupied, so a card left in a window after the unit was taken degrades to
  // the truth instead of opening an application for something gone.
  const scan = useMemo(
    () => resolveScan(scanned, vacancies || []),
    [scanned, vacancies],
  );

  const chosen = WHO_OPTIONS.find((w) => w.id === who) || null;
  const back = () => { setWho(null); setWantsAuth(false); };

  if (!chosen) {
    return (
      <div className="bg-white border border-[#E8E4DC] p-4">
        <h2 className="text-lg text-[#1A1815] mb-1" style={serif}>Who are you?</h2>
        <p className="text-xs text-[#5A5751] mb-3" style={serif}>
          Pick the one that fits. Only the first needs no account.
        </p>
        <div className="grid sm:grid-cols-2 gap-2">
          {WHO_OPTIONS.map((w) => (
            <button
              key={w.id} type="button" onClick={() => setWho(w.id)}
              className="text-left border border-[#E8E4DC] p-3 hover:border-[#2F5D50] focus:outline focus:outline-2 focus:outline-[#2F5D50]"
            >
              <div className="text-sm text-[#1A1815]" style={serif}>{w.label}</div>
              <div className="text-xs text-[#5A5751]" style={serif}>{w.blurb}</div>
              {!w.needsAccount && (
                <div className="text-[0.625rem] uppercase tracking-wider mt-1" style={{ color: brand.accent }}>No account needed</div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (chosen.id === 'applicant') {
    return (
      <div className="bg-white border border-[#E8E4DC] p-4">
        <button type="button" onClick={() => setWho(null)} className="text-[0.625rem] uppercase tracking-wider underline text-[#5A5751] mb-2">← Back</button>
        <h2 className="text-lg text-[#1A1815] mb-1" style={serif}>
          {scan.matched ? `${scan.unit.label}${scan.unit.unit ? ` · ${scan.unit.unit}` : ''}` : 'Available now'}
        </h2>
        {scanned && vacancies !== null && !scan.matched && (
          <p className="text-xs text-[#5A5751] mb-2" style={serif}>{scan.reason}</p>
        )}
        {vacancies === null && <p className="text-xs text-[#5A5751]" style={serif}>Checking…</p>}
        {vacancies !== null && vacancies.length === 0 && (
          <p className="text-xs text-[#5A5751]" style={serif}>
            Nothing is listed right now. Only units the landlord has listed appear here — an empty unit is never advertised automatically.
          </p>
        )}
        {(vacancies || []).map((v) => (
          <div key={v.id} className="border-b border-[#F0EDE6] py-2">
            <div className="text-sm text-[#1A1815]" style={serif}>
              {v.label}{v.unit ? ` · ${v.unit}` : ''}
            </div>
            <div className="text-xs text-[#5A5751]" style={serif}>
              {[v.city, v.state].filter(Boolean).join(', ')}
              {v.property_type ? ` · ${v.property_type}` : ''}
              {v.rent ? ` · $${Number(v.rent).toFixed(0)}/mo` : ''}
              {Number(v.bedrooms) > 0 ? ` · ${v.bedrooms} bed` : ''}
              {Number(v.bathrooms) > 0 ? ` / ${v.bathrooms} bath` : ''}
            </div>
            {(v.offering === 'short-term' || v.offering === 'both') && (
              <div className="text-xs" style={{ ...serif, color: brand.accent }}>
                {v.offering === 'both' ? 'Lease or short stay' : 'Short stay'}
                {v.nightly_rate ? ` · $${Number(v.nightly_rate).toFixed(0)}/night` : ''}
                {v.min_stay_nights ? ` · ${v.min_stay_nights} night minimum` : ''}
              </div>
            )}
            {v.note && <div className="text-xs text-[#5A5751]" style={serif}>{v.note}</div>}
          </div>
        ))}
        <p className="text-xs text-[#5A5751] mt-3 mb-2" style={serif}>
          The exact address is given by a person, not published here.
        </p>
        <ApplyForm vacancies={vacancies || []} preselect={scan.matched ? scan.unit.id : ''} />
      </div>
    );
  }

  // Signing in is a door you TAKE, not a gate you pass (Darrell: "only if they
  // want or need to log in to the app"). So this says what is behind it and
  // waits — the form appears when the person asks for it.
  return (
    <>
      <div className="bg-white border border-[#E8E4DC] p-4 mb-3">
        <button type="button" onClick={back} className="text-[0.625rem] uppercase tracking-wider underline text-[#5A5751] mb-2">← Back</button>
        <p className="text-sm text-[#1A1815] mb-1" style={serif}>{chosen.blurb}</p>
        <p className="text-xs text-[#5A5751] mb-3" style={serif}>
          Your place is tied to the email address <strong>or the cell phone number</strong> your landlord used to invite you — that
          is how the app knows which one is yours. Nothing to set up.
        </p>
        {!wantsAuth && (
          <button
            type="button" onClick={() => setWantsAuth(true)}
            className="text-[0.625rem] uppercase tracking-wider px-3 py-2 border bg-[#2F5D50] text-white border-[#2F5D50] focus:outline focus:outline-2 focus:outline-[#2F5D50]"
          >Sign in / create a profile</button>
        )}
      </div>
      {wantsAuth && (
        <div className="mx-auto w-full sm:w-2/3 lg:w-1/3">
          <PasswordAuth mode="signin" embedded startWith="email" onSignedIn={() => window.location.reload()} />
        </div>
      )}
    </>
  );
}

/**
 * The application, filled by someone with NO account. Renders the family's own
 * form (intake.js, read from their Drive) — app-collected fields only, so an
 * SSN is never even asked for here. Submitting needs no sign-in; an account is
 * OFFERED afterward, never required, because the application is the point.
 */
function ApplyForm({ vacancies, preselect = '' }) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({});
  // A scan already said which unit. Preselecting it is the whole point of the
  // code — otherwise the person picks their own door out of a list they did not
  // need to see.
  const [unit, setUnit] = useState(preselect);
  const [sent, setSent] = useState(null);
  const set = (key) => (e) => setValues((p) => ({ ...p, [key]: e.target.value }));

  if (!open) {
    return (
      <button
        type="button" onClick={() => setOpen(true)}
        className="text-[0.625rem] uppercase tracking-wider px-3 py-2 border bg-[#2F5D50] text-white border-[#2F5D50] focus:outline focus:outline-2 focus:outline-[#2F5D50]"
      >Apply — no account needed</button>
    );
  }
  if (sent) {
    return (
      <div className="border border-[#E8E4DC] p-3">
        <p className="text-sm text-[#1A1815]" style={serif}>{sent}</p>
        <p className="text-xs text-[#5A5751] mt-1" style={serif}>
          You do not need an account for us to read this. If you want one — to follow your application and, once you are approved,
          to reach your unit — you can make one any time from this page.
        </p>
      </div>
    );
  }

  const check = validateApplication(values);
  const name = `${values['applicant.firstName'] || ''} ${values['applicant.lastName'] || ''}`.trim();

  return (
    <div className="border border-[#E8E4DC] p-3">
      <p className="text-xs text-[#5A5751] mb-2" style={serif}>
        Every adult 18 or older fills out their own. We never ask for a Social Security number here — if screening needs one,
        a person asks you directly.
      </p>
      {vacancies.length > 0 && (
        <select value={unit} onChange={(e) => setUnit(e.target.value)} aria-label="Which unit"
          className="text-xs border border-[#E8E4DC] px-2 py-2 bg-white mb-2 w-full" style={serif}>
          <option value="">Which unit are you applying for?</option>
          {vacancies.map((v) => <option key={v.id} value={v.id}>{v.label}{v.unit ? ` · ${v.unit}` : ''}</option>)}
        </select>
      )}
      {APPLICATION_SECTIONS.map((section) => {
        const fields = section.fields.filter((f) => f.collect === 'app');
        if (!fields.length) return null;
        return (
          <fieldset key={section.id} className="mb-3">
            <legend className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold" style={{ color: brand.accent }}>{section.title}</legend>
            {section.note && <p className="text-xs text-[#5A5751] mb-1" style={serif}>{section.note}</p>}
            {fields.map((f) => {
              const key = `${section.id}.${f.id}`;
              return (
                <label key={key} className="block text-xs text-[#5A5751] mb-2" style={serif}>
                  {f.label}{f.required ? ' *' : ''}
                  {f.type === 'yesno' ? (
                    <select value={values[key] || ''} onChange={set(key)} className="w-full text-sm border border-[#E8E4DC] px-2 py-2 bg-white">
                      <option value="">—</option><option value="no">No</option><option value="yes">Yes</option>
                    </select>
                  ) : (
                    <input
                      value={values[key] || ''} onChange={set(key)}
                      type={f.type === 'date' ? 'date' : f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : 'text'}
                      className="w-full text-sm border border-[#E8E4DC] px-2 py-2"
                    />
                  )}
                  {f.help && <span className="text-[0.625rem] text-[#8A867E]">{f.help}</span>}
                </label>
              );
            })}
          </fieldset>
        );
      })}
      <button
        type="button" disabled={!check.ok || !name}
        onClick={async () => {
          const res = await submitApplication({
            rentalId: unit || null, name,
            email: values['applicant.email'], phone: values['applicant.cellPhone'], answers: values,
          });
          setSent(res.ok
            ? 'Your application is in. Someone will reach out about the next step.'
            : `That did not send (${res.reason}). Nothing was lost — try again, or call us.`);
        }}
        className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 border ${check.ok && name ? 'bg-[#2F5D50] text-white border-[#2F5D50]' : 'opacity-40 border-[#E8E4DC]'}`}
      >Send my application</button>
      {!check.ok && check.missing.length > 0 && (
        <p className="text-[0.625rem] text-[#8A867E] mt-1">Still needed: {check.missing.length} required field{check.missing.length === 1 ? '' : 's'}.</p>
      )}
    </div>
  );
}
