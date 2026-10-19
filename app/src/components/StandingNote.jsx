// =============================================================================
// StandingNote — a shut panel tells a signed-in person what they DO hold
// =============================================================================
// Darrell, 2026-10-19: "he gets access... we want them to learn by doing or
// helping and or witnessing our businesses."
//
// THE DEFECT THIS CLOSES, measured. Eight steward-only panels end their locked
// message with a variation of "Sign in with a family/governor account" or
// "Sign in with a steward account" — written when the only person who could
// meet a shut panel was signed OUT. DR-1107 wired authority to the database
// role, so from now on the people who meet these panels are signed IN: a son
// at 'child', a daughter at 'member'. To them that sentence is simply false,
// and it reads as though the app did not notice they were there.
//
// It is the same miss LockedSurface's own header names about the five boxes it
// replaced: "for somebody already signed in it is simply wrong."
//
// WHAT THIS SAYS INSTEAD. The sentence from lib/family-standing.js — what the
// person HOLDS, in the Governor's own frame (witnessing / helping / governing),
// never "denied", "forbidden" or "no access" (asserted by a case). Then one
// line naming who can place them differently, because a shut door owes the
// reader the person who holds the key and not "your administrator".
//
// HONEST BY CONSTRUCTION:
//   - signed out, or the role not read yet -> renders the `fallback` the panel
//     passed, which is that panel's existing sign-in sentence. Nothing is
//     claimed about a person we have not identified (DR-0076 §8).
//   - the space is named from the slug the DATABASE returned, never painted. An
//     unknown slug says "this space" rather than inventing a household name.
//   - it renders nothing for a governor: a person who governs is not reading a
//     locked panel, and if they somehow are, a standing line would be noise.
// =============================================================================
import React from 'react';
import { useInstanceRole } from '../lib/instance-role.js';
import { standingInSpace, standingSentence, STANDING } from '../lib/family-standing.js';

// 'poe-family' -> 'Poe Family'. Only ever applied to a slug the database gave
// us; an empty or missing slug falls through to standingSentence's own default.
export const spaceNameFromSlug = (slug) => String(slug || '')
  .split('-').filter(Boolean)
  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
  .join(' ');

/**
 * @param {string} fallback  the panel's existing sentence, shown when we do not
 *                           know who is reading (signed out / role not read).
 * @param {string} [className] the panel's own small-print class, so this line
 *                           looks like the rest of the box rather than imported.
 */
export default function StandingNote({ fallback = '', className = 'text-xs mt-1.5 leading-relaxed text-[#5A5751]' }) {
  const roleState = useInstanceRole();
  const role = roleState?.role || null;
  if (!role) return fallback ? <p className={className}>{fallback}</p> : null;

  const view = standingInSpace({ role });
  if (view.isGovernor) return null;

  const where = spaceNameFromSlug(roleState.instanceSlug);
  const sentence = where ? standingSentence(view, where) : standingSentence(view);
  // Who holds the key. A helper is already doing the work, so the line names
  // the one thing that changes the answer; a witness is told the same, because
  // DR-0094 makes WHAT a child sees the guardian's decision and not the app's.
  const whoPlaces = view.standing === STANDING.HELPER
    ? 'A steward can open this one for you in Role & stewards.'
    : 'Ask a steward to place you here — it is set in Role & stewards.';
  return (
    <>
      <p className={className}>{sentence}</p>
      <p className={className}>{whoPlaces}</p>
    </>
  );
}
