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
//
// THE HERITAGE FRONT PAGE (DR-1046; Christina 2026-10-15: "definitely the
// front page of poetech.us"). The page now opens with PoeTech's own welcome —
// the name, the tagline, what the app is, Sign in and the family sample, the
// two free-forever lines the landing has always carried — and the homes
// follow directly under it with everything Darrell's 2026-10-11 rule asked
// for intact: no account needed to look, the three honest states, sign-in
// one tap away. The welcome is PAINTED (the same sky and ridgelines as the
// signed-in home), never a stock photograph (VISUAL-IDENTITY). Both sign-in
// controls open the same PasswordAuth; nothing about who gets in changed.
// =============================================================================
import React, { useEffect, useState } from 'react';
import PasswordAuth from './PasswordAuth.jsx';
import { loadPublicVacancies } from '../modules/properties/cloud.js';
import { VacancyCard } from '../modules/properties/Storefront.jsx';
import { vacancyUnits, readFailureLine } from '../modules/properties/vacancy-unit.js';
import UiIcon from './UiIcon.jsx';

// FULL WIDTH, NO max-w WRAPPER (CONSISTENCY-STANDARD rule 1, DR-0246).
// The first version centred the shelf in `max-w-5xl mx-auto` and the sign-in
// in `max-w-md mx-auto`; consistency-guard failed the file on two width caps
// against a new file's baseline of 0. Content stretches; a prose measure, if
// one is ever wanted, goes on an element INSIDE this container and never on
// the wrapper itself.

// What the front page says PoeTech is. One source: the same words the app
// store card carries (lib/app-store.js), with the family named.
export const FRONT_DOOR_COPY = {
  eyebrow: 'PoeTech · Family Operating Systems',
  tagline: 'Life · Soul · Money · Family',
  headline: 'One app for the whole house.',
  blurb: 'Books, debts, real estate, church, lessons and every other room of family life, in one place that the family owns.',
  free1: 'Free forever · Financial System for Families',
  free2: 'Free forever · Spiritual Module for the Body',
  sample: 'See the family sample',
  sampleHref: '/?demo=family-of-4',
};

const PILLARS = [
  { icon: 'coins', label: 'Money', sub: 'Books, debts, the 1st' },
  { icon: 'cross', label: 'Soul', sub: 'The Word, lessons, church' },
  { icon: 'home', label: 'Life', sub: 'Home, health, projects' },
  { icon: 'users', label: 'Family', sub: 'Messages, photos, people' },
];

function Welcome({ onSignIn }) {
  return (
    <section
      data-testid="front-door-welcome"
      aria-label="Welcome to PoeTech"
      className="relative overflow-hidden rounded-2xl text-[#F6F1E7] bg-[#1F3A2E] mb-6"
    >
      <svg aria-hidden="true" className="absolute inset-0 w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
        <defs>
          <linearGradient id="poe-door-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#D7B36A" />
            <stop offset="0.3" stopColor="#B9834A" />
            <stop offset="0.65" stopColor="#3B4A42" />
            <stop offset="1" stopColor="#1A2A24" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="1000" height="300" fill="url(#poe-door-sky)" />
        <path d="M0 220 L120 120 L220 180 L330 70 L430 160 L520 110 L640 190 L740 90 L860 170 L1000 100 L1000 300 L0 300Z" fill="#2E4A3E" />
        <path d="M0 260 L150 200 L280 240 L400 190 L520 230 L650 200 L800 250 L1000 210 L1000 300 L0 300Z" fill="#1F3A2E" />
        <path d="M0 290 L200 270 L420 285 L640 265 L820 290 L1000 275 L1000 300 L0 300Z" fill="#16291F" />
      </svg>
      <div className="relative p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-6 items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="w-10 h-10 rounded-xl bg-[#F6F1E7] text-[#1F3A2E] border-2 border-[#C9A227] grid place-items-center font-semibold text-2xl" style={{ fontFamily: '"Fraunces", serif' }}>P</span>
            <span className="leading-tight">
              <span className="block font-semibold tracking-[0.14em] uppercase text-[1rem]" style={{ fontFamily: '"Fraunces", serif' }}>PoeTech</span>
              <span className="block text-[0.5625rem] uppercase tracking-[0.24em] text-[#F0D58A] font-semibold">{FRONT_DOOR_COPY.tagline}</span>
            </span>
          </div>
          <h1 className="mt-4 text-[2rem] sm:text-[2.75rem] leading-none break-words" style={{ fontFamily: '"Fraunces", serif', fontWeight: 700, letterSpacing: '-0.02em' }}>
            {FRONT_DOOR_COPY.headline}
          </h1>
          <p className="mt-3 text-[0.9375rem] sm:text-[1.0625rem] leading-snug opacity-95" style={{ fontFamily: '"Fraunces", serif' }}>{FRONT_DOOR_COPY.blurb}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onSignIn}
              data-testid="front-door-sign-in-top"
              className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl bg-[#9E4A2A] text-white text-[0.75rem] uppercase tracking-wider font-semibold hover:bg-[#7E3A20] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#F0D58A]"
            >
              Sign in
            </button>
            <a
              href={FRONT_DOOR_COPY.sampleHref}
              data-testid="front-door-sample"
              className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl border-2 border-[#F6F1E7] text-[#F6F1E7] text-[0.75rem] uppercase tracking-wider font-semibold hover:bg-[#2B2F2D] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#F0D58A]"
            >
              {FRONT_DOOR_COPY.sample} <span aria-hidden="true" className="ml-1">→</span>
            </a>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-block text-[0.5625rem] uppercase tracking-wider border border-[#F0D58A] text-[#F0D58A] px-2 py-1 rounded-full font-semibold">{FRONT_DOOR_COPY.free1}</span>
            <span className="inline-block text-[0.5625rem] uppercase tracking-wider border border-[#F0D58A] text-[#F0D58A] px-2 py-1 rounded-full font-semibold">{FRONT_DOOR_COPY.free2}</span>
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-2.5 min-w-0" aria-label="What is inside">
          {PILLARS.map((p) => (
            <li key={p.label} className="rounded-xl bg-[#1A1D1B]/70 border border-[#2B2F2D] p-3 flex items-center gap-3 min-w-0">
              <span aria-hidden="true" className="w-9 h-9 rounded-lg bg-[#1F3A2E] border border-[#C9A227] grid place-items-center text-[#F0D58A] text-[1rem] shrink-0"><UiIcon name={p.icon} /></span>
              <span className="min-w-0 leading-tight">
                <span className="block text-sm font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>{p.label}</span>
                <span className="block text-[0.6875rem] opacity-85 truncate">{p.sub}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

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
  // WHAT FAILED, in one plain line (DR-1236). Darrell met "The list of homes
  // could not be loaded just now" on 2026-10-27 and nothing on the screen —
  // or anywhere else — could say what had failed. The visitor's words stay;
  // under them, the ops line names the read and the error code so the next
  // time it happens the cause is on the screen and in the probe's reading.
  const [why, setWhy] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (churchDoor) return undefined;      // nothing to fetch for a church visitor
    let live = true;
    setRead('loading');
    // A failure is said with its reason; "Try again" (below) asks once more
    // by the visitor's own hand, which is honest where a silent retry loop
    // would only hide a road that is down.
    loadPublicVacancies()
      .then((r) => {
        if (!live) return;
        if (r && r.ok) { setVacancies(r.vacancies || []); setWhy(''); setRead('ok'); return; }
        setWhy(readFailureLine(r)); setRead('failed');
      })
      .catch((e) => {
        if (!live) return;
        setWhy(readFailureLine({ reason: 'threw', error: e && e.message })); setRead('failed');
      });
    return () => { live = false; };
  }, [churchDoor, attempt]);

  // Acted on here, below every hook (see the note at the top).
  if (churchDoor) return <PasswordAuth brand={brand} />;

  if (view === 'auth') {
    return (
      <div className="w-full">
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
    <div className="w-full" data-testid="public-front-door">
      <Welcome onSignIn={() => setView('auth')} />

      <header className="mb-5">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#2F5D50] font-semibold">
          Poe Properties — places to live
        </div>
        <h2 className="text-[1.5rem] sm:text-[2rem] text-[#1A1815] leading-tight mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
          {read === 'ok' && count > 0
            ? `${count} ${count === 1 ? 'place' : 'places'} available`
            : 'Places to live in Champaign'}
        </h2>
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
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              data-testid="front-door-try-again"
              className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-xl border border-[#2F5D50] text-[#2F5D50] text-[0.75rem] uppercase tracking-wider"
            >
              Try again
            </button>
            {/* The ops line: the read and the code, never a street or a key. */}
            <span className="text-[0.6875rem] text-[#5A5751] break-all" data-testid="front-door-unreadable-why">{why}</span>
          </div>
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

      {/* THE SAME CARD, FROM THE SAME READING OF THE ROW, AS THE FIRST TAB
          AND THE BRANDED DOOR (DR-1236). The raw row carried no rentalId, so
          the card never asked for its pictures: two cards, zero pictures,
          measured signed out. vacancyUnits() is the one mapping. */}
      {read === 'ok' && count > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none p-0 m-0" data-testid="front-door-shelf">
          {vacancyUnits(vacancies).map((u) => (
            <VacancyCard key={u.id} unit={u} />
          ))}
        </ul>
      )}

      {/* SIGN-IN IS ONE TAP, AND IT IS NOT THE FIRST THING. Everyone who
          already belongs here — the family, a tenant, a worker — is one
          control away; a stranger is never stopped by it. */}
      <div className="mt-8 pt-5 border-t border-[#E8E4DC] flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setView('auth')}
          data-testid="front-door-sign-in"
          className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-xl bg-[#2F5D50] text-white text-[0.75rem] uppercase tracking-wider"
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
