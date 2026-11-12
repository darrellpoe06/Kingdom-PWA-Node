// =============================================================================
// PoeTechShowcase — inside the Love Corner, a PoeTech subject points home (DR-1428)
// =============================================================================
// Darrell 2026-11-11: "the others are to advertise PoeTech App learning content
// and space.... PoeTech has the higher level content... however the child level
// for everything is available in The Love Corner App... the initial lesson for
// each course is free inside the Love Corner App and the PoeTech is for curators
// of Ai Technology and Business Development Creators... for Project Management
// of actual projects and or products."
//
// Shown ONLY in the Love Corner app (the door is the page's path, DR-0731) and
// ONLY on a course whose department is a PoeTech subject (lessonDoorFor). It
// says what is true today: the course is in BOTH apps (DR-1430: access, not
// the app, is what is paid for), the child level and the first lesson are free
// to everyone, and PoeTech+ opens the deeper levels in either app. It claims no lock, because nothing is locked
// until a real way to pay exists (ACCESS_ENFORCEMENT, DR-1428).
//
// DR-1432 (the PoeTech+ checkout): the card now carries the way to pay, in
// BOTH apps. On the Love Corner it keeps its link to PoeTech; in PoeTech it
// says the same plain thing without the link. PoeTechPlusButton shows a buy
// button only when checkout is really open, and "manage" once it is yours.
// =============================================================================
import React from 'react';
import { currentDoor } from '../lib/app-doors.js';
import { lessonDoorFor, lessonUrl } from '../lib/lesson-links.js';
import PoeTechPlusButton from './PoeTechPlusButton.jsx';

/** Pure: is this course a PoeTech subject (its deeper levels are PoeTech+)? */
export function isPoeTechSubject(course) {
  return !!(course && course.meta) && lessonDoorFor(course).key === 'poetech';
}

/** Pure: the PoeTech link for this course when the page is the Love Corner and the course is a PoeTech subject, else null. */
export function showcaseHref(course, { pathname = '', search = '', origin = '' } = {}) {
  if (!course || !course.meta) return null;
  if (currentDoor(pathname, search)?.key !== 'lovecorner') return null;
  if (lessonDoorFor(course).key !== 'poetech') return null;
  return lessonUrl({ courseKey: course.meta.key || course.key, course, origin });
}

export default function PoeTechShowcase({ course }) {
  const loc = typeof window !== 'undefined' && window.location ? window.location : {};
  if (!isPoeTechSubject(course)) return null;
  const href = showcaseHref(course, { pathname: loc.pathname, search: loc.search, origin: loc.origin });
  return (
    <div data-testid="poetech-showcase" className="mt-2 border border-[#B85838] bg-white p-3">
      <p className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
        {href
          ? 'This course is here in both apps, the Love Corner and PoeTech. The child level of every lesson and the whole first lesson are free to everyone.'
          : 'The child level of every lesson and the whole first lesson of this course are free to everyone.'}
      </p>
      <p className="text-xs text-[#5A5751] mt-1">
        The deeper levels come with PoeTech+ ($39/mo), in whichever app you read: for builders of A.I., business and real projects, with in-person workshops
        when they are offered.
      </p>
      {href && (
        <a
          href={href}
          data-testid="poetech-showcase-link"
          className="inline-block mt-2 mr-3 text-[0.6875rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]"
        >
          See it in PoeTech ›
        </a>
      )}
      <PoeTechPlusButton />
    </div>
  );
}
