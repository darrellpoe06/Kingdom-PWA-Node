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
        {session === null && (
          <>
            <div className="bg-white border border-[#E8E4DC] p-4 mb-3">
              <p className="text-sm text-[#1A1815] mb-1" style={serif}>
                Sign in with the email address your landlord used to invite you.
              </p>
              <p className="text-xs text-[#5A5751]" style={serif}>
                That address is how the app knows which place is yours. Nothing to set up —
                your unit, your work orders, and your messages are here the moment you are in.
                First time here? Create a profile with that same address.
              </p>
            </div>
            <div className="mx-auto w-full sm:w-2/3 lg:w-1/3">
              <PasswordAuth mode="signin" embedded startWith="email" onSignedIn={() => window.location.reload()} />
            </div>
          </>
        )}
        {session && <PropertiesApp surface="door" />}
      </main>

      <footer className="px-4 py-6 text-center">
        <p className="text-[0.625rem] uppercase tracking-[0.2em] text-[#8A867E]">Poe Properties · powered by PoeTech</p>
      </footer>
    </div>
  );
}
