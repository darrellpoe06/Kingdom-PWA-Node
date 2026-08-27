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
import React, { useEffect, useState } from 'react';
import supabase from '../lib/supabase.js';
import PasswordAuth from './PasswordAuth.jsx';
import PropertiesApp from '../modules/properties/PropertiesApp.jsx';
import { POE_PROPERTIES } from '../modules/properties/config.js';
import { WHO_OPTIONS } from '../modules/properties/model.js';
import { loadPublicVacancies } from '../modules/properties/cloud.js';

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
  const [who, setWho] = useState(null);
  const [vacancies, setVacancies] = useState(null);   // null = not asked yet

  useEffect(() => {
    if (who !== 'applicant' || vacancies !== null) return;
    let on = true;
    loadPublicVacancies().then((r) => { if (on) setVacancies(r.ok ? r.vacancies : []); });
    return () => { on = false; };
  }, [who, vacancies]);

  const chosen = WHO_OPTIONS.find((w) => w.id === who) || null;

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
        <h2 className="text-lg text-[#1A1815] mb-1" style={serif}>Available now</h2>
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
            </div>
            {v.note && <div className="text-xs text-[#5A5751]" style={serif}>{v.note}</div>}
          </div>
        ))}
        <p className="text-xs text-[#5A5751] mt-3" style={serif}>
          To apply, reach out and we will send you the application. The exact address is given by a person, not published here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-[#E8E4DC] p-4 mb-3">
        <button type="button" onClick={() => setWho(null)} className="text-[0.625rem] uppercase tracking-wider underline text-[#5A5751] mb-2">← Back</button>
        <p className="text-sm text-[#1A1815] mb-1" style={serif}>{chosen.blurb}</p>
        <p className="text-xs text-[#5A5751]" style={serif}>
          Sign in with the email address <strong>or the cell phone number</strong> your landlord used to invite you.
          That is how the app knows which place is yours — nothing to set up. First time here? Create a profile with the same one.
        </p>
      </div>
      <div className="mx-auto w-full sm:w-2/3 lg:w-1/3">
        <PasswordAuth mode="signin" embedded startWith="email" onSignedIn={() => window.location.reload()} />
      </div>
    </>
  );
}
