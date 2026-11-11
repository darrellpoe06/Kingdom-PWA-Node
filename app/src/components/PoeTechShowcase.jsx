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
// says what is true today: the child level and the first lesson are here, the
// full course lives in PoeTech. It claims no lock, because nothing is locked
// until a real way to pay exists (ACCESS_ENFORCEMENT, DR-1428).
// =============================================================================
import React from 'react';
import { currentDoor } from '../lib/app-doors.js';
import { lessonDoorFor, lessonUrl } from '../lib/lesson-links.js';

/** Pure: the PoeTech link for this course when the page is the Love Corner and the course is a PoeTech subject, else null. */
export function showcaseHref(course, { pathname = '', search = '', origin = '' } = {}) {
  if (!course || !course.meta) return null;
  if (currentDoor(pathname, search)?.key !== 'lovecorner') return null;
  if (lessonDoorFor(course).key !== 'poetech') return null;
  return lessonUrl({ courseKey: course.meta.key || course.key, course, origin });
}

export default function PoeTechShowcase({ course }) {
  const loc = typeof window !== 'undefined' && window.location ? window.location : {};
  const href = showcaseHref(course, { pathname: loc.pathname, search: loc.search, origin: loc.origin });
  if (!href) return null;
  return (
    <div data-testid="poetech-showcase" className="mt-2 border border-[#B85838] bg-white p-3">
      <p className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
        This course lives in the PoeTech app. Here in the Love Corner, the child level of every lesson and the whole first lesson are yours, free.
      </p>
      <p className="text-xs text-[#5A5751] mt-1">
        In PoeTech the course goes deeper: the full lessons at every level, for builders of A.I., business and real projects, with PoeTech+ ($39/mo) and
        in-person workshops when they are offered.
      </p>
      <a
        href={href}
        data-testid="poetech-showcase-link"
        className="inline-block mt-2 text-[0.6875rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]"
      >
        Continue in PoeTech ›
      </a>
    </div>
  );
}
