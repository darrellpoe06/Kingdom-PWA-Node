// =============================================================================
// PublicFrontDoor — a stranger at poetech.us sees the homes, not a PIN pad
// =============================================================================
// Darrell, 2026-10-11, photographing his own phone on poetech.us:
// "Why are you asking new users to create an account before seeing the
// listings?!!!!!!!!!!!! ... It's advertising!!!!!!!!!!!!"
//
// WHAT WAS THERE. The signed-out gate in the shell rendered exactly one thing:
// <PasswordAuth />, the "Create your profile" form — name, cell phone, a
// 6-digit PIN, confirm the PIN. That is what every person who typed poetech.us,
// scanned a printed code, or followed a link from an advert met FIRST. A
// stranger looking for a place to live was asked to invent a PIN before being
// shown a single room.
//
// Advertising that demands an account before it will show the thing being
// advertised is not advertising. It is a door with the merchandise behind it.
//
// THE PRECEDENT IS ALREADY IN THIS CODEBASE, three lines above the gate it
// fixes: "The Love Corner church door is a PUBLIC community (Darrell
// 2026-07-14): signed-out visitors SEE the church (no private family/financial
// data lives here) — the 'no profile, no access' wall is only for the private
// PoeTech app. Sign-in stays one tap away." The listings are the same kind of
// thing and were never given the same treatment.
//
// SO: the homes first, sign-in one tap away. Nothing private is on this page —
// it draws public_vacancies(), the same RPC the public Poe Properties shelf
// already serves to anonymous visitors, which publishes no street, no tenant
// and no contact (DR-0935).
// =============================================================================
import React, { useEffect, useState } from 'react';
import PasswordAuth from './PasswordAuth.jsx';
import { loadPublicVacancies } from '../modules/properties/cloud.js';
import { VacancyCard } from '../modules/properties/Storefront.jsx';

export default function PublicFrontDoor({ brand = null }) {
  // THE CHURCH'S OWN DOOR IS NOT A RENTAL SHELF.
  //
  // Caught by re-reading this diff before it merged. The shell's gate is
  // `__gate !== 'app' && !churchDoorOnly && !isPublicChurchRoute()`, and
  // isChurchDoorContext() — which decides the BRAND — is a DIFFERENT and wider
  // predicate: it is true for an INSTALLED church PWA launched standalone,
  // which carries no query string, so isPublicChurchRoute() is false and that
  // visitor reaches this component. Without this guard, a Love Corner member
  // opening the app they installed would have been shown Poe Properties
  // listings instead of their church.
  //
  // A branded door keeps exactly the behaviour it had. The homes are for the
  // front door of the business, not for somebody who came to the church.
  //
  // The flag is read here but ACTED ON after the hooks, because a return above
  // them is a conditional hook call — wrong, and the lint rule is right to say so.
  const churchDoor = !!brand;

  // 'shelf' is what a stranger meets. 'auth' is one tap away and never the
  // first thing.
  const [view, setView] = useState('shelf');
  const [vacancies, setVacancies] = useState([]);
  // THREE STATES, NOT TWO (DR-0946). "I have not asked yet", "there are none"
  // and "I could not ask" are different things, and the last one must never
  // render as the middle one on the page that sells the homes.
  const [read, setRead] = useState('loading');

  useEffect(() => {
    if (churchDoor) return undefined;      // nothing to fetch for a church visitor
    let live = true;
    loadPublicVacancies()
      .then((r) => {
        if (!live) return;
        if (r && r.ok) { setVacancies(r.vacancies || []); setRead('ok'); }
        else setRead('failed');
      })
      .catch(() => { if (live) setRead('failed'); });
    return () => { live = false; };
  }, [churchDoor]);

  // Acted on here, below every hook (see the note at the top).
  if (churchDoor) return <PasswordAuth brand={brand} />;

  if (view === 'auth') {
    return (
      <div className="w-full max-w-md mx-auto">
        <button
          type="button"
          onClick={() => setView('shelf')}
          data-testid="front-door-back-to-homes"
          className="text-[0.75rem] underline text-[#2F5D50] mb-4 min-h-[44px]"
        >
          ← Back to the homes
        </button>
        <PasswordAuth brand={brand} />
      </div>
    );
  }

  const count = vacancies.length;

  return (
    <div className="w-full max-w-5xl mx-auto" data-testid="public-front-door">
      <header className="mb-5">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#2F5D50] font-semibold">
          Poe Properties — places to live
        </div>
        <h1 className="text-[1.5rem] sm:text-[2rem] text-[#1A1815] leading-tight mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
          {read === 'ok' && count > 0
            ? `${count} ${count === 1 ? 'place' : 'places'} available`
            : 'Places to live in Champaign'}
        </h1>
        <p className="text-[0.875rem] text-[#5A5751] mt-1">
          No account needed to look. Champaign, Illinois.
        </p>
      </header>

      {read === 'loading' && (
        <p className="text-[0.875rem] text-[#5A5751]" data-testid="front-door-loading">Finding what is open…</p>
      )}

      {/* A READ THAT FAILED IS NOT AN EMPTY SHELF. Saying "nothing available"
          to somebody who came to rent, when the truth is that the list could
          not be fetched, turns a bad minute into a lost tenant. */}
      {read === 'failed' && (
        <div className="border border-[#E8E4DC] bg-white p-4" data-testid="front-door-unreadable">
          <p className="text-[0.875rem] text-[#1A1815]">
            The list of homes could not be loaded just now.
          </p>
          <p className="text-[0.8125rem] text-[#5A5751] mt-1">
            This is us, not you. Please try again in a moment — or call and we will tell you what is open.
          </p>
        </div>
      )}

      {read === 'ok' && count === 0 && (
        <div className="border border-[#E8E4DC] bg-white p-4" data-testid="front-door-none">
          <p className="text-[0.875rem] text-[#1A1815]">Nothing is open at this moment.</p>
          <p className="text-[0.8125rem] text-[#5A5751] mt-1">
            Places come up often. Check back, or ask to be told when one does.
          </p>
        </div>
      )}

      {read === 'ok' && count > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {vacancies.map((v) => (
            <VacancyCard key={v.id} unit={v} />
          ))}
        </div>
      )}

      {/* SIGN-IN IS ONE TAP, AND IT IS NOT THE FIRST THING. Everyone who
          already belongs here — the family, a tenant, a worker — is one
          control away; a stranger is never stopped by it. */}
      <div className="mt-8 pt-5 border-t border-[#E8E4DC] flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setView('auth')}
          data-testid="front-door-sign-in"
          className="inline-flex items-center justify-center min-h-[44px] px-4 bg-[#2F5D50] text-white text-[0.75rem] uppercase tracking-wider"
        >
          Sign in
        </button>
        <span className="text-[0.8125rem] text-[#5A5751]">
          Already with Poe Properties, or part of the family? Sign in here.
        </span>
      </div>
    </div>
  );
}
