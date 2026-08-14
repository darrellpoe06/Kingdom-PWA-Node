// =============================================================================
// PublicWelcome — what a shared link says to someone who has never been here
// =============================================================================
// Darrell 2026-08-10, after the door was opened: "When I send a link... it
// should be almost like a newsletter... explains why it exist... etc... then
// looks for subscriptions", "then the real account happens when they sign up...
// however... the fruit is obviously good", and "let potential users have the
// clarity to understand what they are using."
//
// A stranger who taps a texted lesson link now gets IN (DR-0290) — but landing
// inside an app with no idea what it is, who runs it, or why it exists is its
// own kind of closed door.
//
// THE INFORMATION IS THE DRAW (Darrell, same sitting: "Explains at the end...
// the information is the draw!?? Short and sweet then... explain at the end").
// So this renders in TWO places and neither one gets between a reader and what
// they came for:
//   • `placement="top"` — ONE short line. Whose house this is, and that it is
//     free to read. Nothing to scroll past, no pitch, no ask.
//   • `placement="end"` — the full explanation AFTER the reading, where a person
//     who just got something good is the only person who has earned the ask:
//     why this exists, what it costs, what an account adds, and the invitation.
// A masthead that argues before the reader has read anything is an ad; the same
// words after the reading are an answer to a question they now actually have.
//
// EVERY NUMBER IS COUNTED, NOT CLAIMED (DR-0121 / DR-0076). The courses and
// lessons are counted live from the mounted catalog at render; there is no
// hand-typed "50+ lessons" here to drift into a lie. If the catalog is empty,
// the count line does not render at all rather than print a zero as a boast.
//
// It shows ONLY to a signed-out visitor on a public church link. A member who
// is signed in never sees it, and it never covers the content.
import React, { useMemo, useState, useEffect } from 'react';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import AuthModal from './AuthModal.jsx';

const SERIF = { fontFamily: '"Fraunces", serif' };
const MONO = { fontFamily: '"JetBrains Mono", monospace' };

/** Live totals from the mounted catalog — counted, never typed. */
export function catalogTotals(catalog = LEARN_CATALOG) {
  const list = Array.isArray(catalog) ? catalog : [];
  let lessons = 0;
  for (const e of list) {
    let rows = e && (e.schedule || e.modules);
    if (!rows && e && typeof e.buildScheduleRows === 'function') {
      try { rows = e.buildScheduleRows(); } catch { rows = []; }
    }
    lessons += Array.isArray(rows) ? rows.length : 0;
  }
  return { courses: list.length, lessons };
}

// How long the top line stays before it steps aside on its own.
//
// Darrell 2026-08-13: "can the banner leave after a certain time for the Word
// or lesson to be most dominant?" and "still before for like the first
// paragraph then move unless prompted for like touching the faint hover."
//
// This is DR-0290's own rule finished rather than a new one. That decision
// already says neither placement may get "between a reader and what they came
// for" — but the top line could only be moved by TAPPING × Hide, which is a
// fight of its own on a phone, and the reader who does nothing keeps a black
// bar over the Word for the whole lesson.
//
// Roughly the time a first paragraph takes at an unhurried pace. It is a
// judgement, not a measurement, and it is the one number here that could be
// wrong for a slow reader — which is exactly why retreating is REVERSIBLE and
// silent rather than a dismissal: the affordance stays, and one touch brings
// the line back for as long as it is wanted.
export const TOP_BANNER_DWELL_MS = 12000;

export default function PublicWelcome({ catalog = LEARN_CATALOG, placement = 'top', dwellMs = TOP_BANNER_DWELL_MS }) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  // RETREATED is not DISMISSED. Dismissed is the reader's explicit "gone";
  // retreated is the banner getting out of the Word's way by itself, and it is
  // always one touch from coming back.
  const [retreated, setRetreated] = useState(false);
  // A READER WHO ASKS FOR IT IS NOT OVERRULED BY A TIMER.
  //
  // Caught by this component's own test: the retreat effect re-armed the moment
  // `retreated` went back to false, so tapping the faint strip showed the line
  // and then took it away again a few seconds later. Retreating on its own is
  // the app's judgement about a reader who has said nothing; once the reader
  // has said something, the judgement is theirs and the timer is done.
  const [asked, setAsked] = useState(false);
  const totals = useMemo(() => catalogTotals(catalog), [catalog]);

  useEffect(() => {
    if (placement === 'end' || dismissed || retreated || asked) return undefined;
    const ms = Number(dwellMs);
    if (!Number.isFinite(ms) || ms <= 0) return undefined; // 0 disables the retreat
    const t = setTimeout(() => setRetreated(true), ms);
    return () => clearTimeout(t);
  }, [placement, dismissed, retreated, asked, dwellMs]);

  if (dismissed) return null;

  // TOP — one line. Short and sweet, because the reading is the draw.
  if (placement !== 'end') {
    // RETREATED — a faint strip that says whose house this is without taking
    // the room. Kept as a real button so it is reachable by keyboard and by a
    // screen reader, not a hover-only affordance that a touch device can never
    // find (the "faint hover" has to work with a finger).
    if (retreated) {
      return (
        <div className="print:hidden" data-testid="public-welcome-rest">
          <button
            type="button"
            onClick={() => { setRetreated(false); setAsked(true); }}
            aria-label="Show who this is from — The Love Corner, free to read, no account"
            title="The Love Corner — free to read, no account"
            className="w-full border-b border-[#E8E4DC] bg-[#1A1815] text-[#8A857C] hover:text-[#FAF8F4] focus:text-[#FAF8F4] px-4 py-0.5 text-left focus:outline focus:outline-2 focus:outline-[#B85838]"
          >
            <span className="text-[0.5rem] uppercase tracking-[0.3em]" style={MONO}>The Love Corner</span>
          </button>
        </div>
      );
    }
    return (
      <div
        className="border-b border-[#E8E4DC] bg-[#1A1815] text-[#FAF8F4] px-4 py-1.5 flex items-center justify-between gap-3 flex-wrap print:hidden"
        data-testid="public-welcome-top"
      >
        <span className="text-[0.625rem] uppercase tracking-[0.2em]" style={MONO}>
          <strong className="text-[#B89838]">The Love Corner</strong> · The Church of the Living God — free to read, no account
        </span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-[0.625rem] uppercase tracking-wider text-[#D8D4CC] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
        >
          × Hide
        </button>
      </div>
    );
  }

  // END — the full explanation, after they have read the thing they came for.
  return (
    <section aria-label="What this is, and why" className="border border-[#1A1815] bg-white mt-8 mb-4 print:hidden" data-testid="public-welcome-end">
      <div className="bg-[#1A1815] text-[#FAF8F4] px-4 py-2">
        <span className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B89838] font-semibold" style={MONO}>
          You just read something free — here is why it exists
        </span>
      </div>

      <div className="px-4 py-3 space-y-2">
        <p className="text-sm text-[#1A1815] leading-relaxed" style={SERIF}>
          This is <strong>The Love Corner</strong> — the study and stewardship space of
          <strong> The Church of the Living God</strong>, built on PoeTech. It exists so that
          Yahweh’s Word comes first, in plain language, to anyone who wants it: a teenager on a
          phone, an elder who would rather listen than read, a family at a kitchen table. Every
          teaching opens with Scripture, every verse is quoted word-for-word from the KJV, and
          every outside expert is named with their work so you can check them yourself.
        </p>

        <p className="text-sm text-[#1A1815] leading-relaxed" style={SERIF}>
          <strong>All of it is free to read, with no account.</strong> Nothing is locked and
          nothing is sold. Press <strong>Read aloud</strong> on any page and it will read to you —
          and keep reading while you do something else.
        </p>

        {totals.lessons > 0 && (
          <p className="text-[0.6875rem] uppercase tracking-wider text-[#5A6E3D] font-semibold" style={MONO}>
            {totals.courses} courses · {totals.lessons} lessons — counted live, right now
          </p>
        )}

        <div className="border-t border-[#E8E4DC] pt-2 flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-[0.6875rem] uppercase tracking-wider px-4 py-2 min-h-[40px] border-2 border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#B85838] hover:border-[#B85838] font-semibold focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
          >
            Create your free account
          </button>
          <span className="text-[0.75rem] text-[#5A5751]" style={SERIF}>
            An account keeps only YOUR side: your place in a lesson, your progress, your reading
            voice, and prayer requests you send. We process your data; we do not sell it.
          </span>
        </div>
      </div>

      <AuthModal open={open} onClose={() => setOpen(false)} onSignedIn={() => { setOpen(false); setDismissed(true); }} mode="signup" />
    </section>
  );
}
