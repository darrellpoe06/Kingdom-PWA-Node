// =============================================================================
// InstituteCourseCards — a program's courses as photographic invitations
// =============================================================================
// Darrell 2026-11-25, from the live preview on his phone: the program
// drop-down "should look vibrant, not a bunch of links ... thumbnails and
// vibrant invites viewers into each lesson." Each course becomes a card: its
// own lesson artwork (already shipped in public/learn-thumbs; nothing generated
// or bought), the catalog title over it, Required/Open-study, who it is for,
// and a Start or Continue invitation that opens the course in Learn through the
// same link every lesson uses (lessonUrl). Continue appears only when this
// device holds a saved place in that course (learn-resume): never painted.
// Studio (owner-device preview) only; the classic list is unchanged.
import React from 'react';
import { lessonUrl } from '../../lib/lesson-links.js';
import { PROGRAM_ART } from '../../lib/institute-studio.js';

const BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#CFA63C]';

export default function InstituteCourseCards({ items = [], covers = new Map(), started = new Set(), programKey = null, testid, label }) {
  if (items.length === 0) {
    return (
      <p className="lc-small" data-testid={`${testid}-empty`}>
        No course is registered for this program yet.
      </p>
    );
  }
  const fallback = programKey && PROGRAM_ART[programKey] ? PROGRAM_ART[programKey].src : null;
  return (
    <ul className="is-cgrid" aria-label={label} data-testid={testid}>
      {items.map(({ course, required, note }) => {
        const title = (course.meta && course.meta.title) || course.key;
        const cover = covers.get(course.key);
        const src = cover ? cover.src : fallback;
        const going = started.has(course.key);
        return (
          <li key={course.key}>
            <a className={`is-ccard ${FOCUS}`} href={lessonUrl({ courseKey: course.key, course })} data-testid={`${testid}-${course.key}`}>
              <span className="is-cimg">
                {src && (
                  <img
                    src={`${BASE}${src}`}
                    srcSet={cover && cover.srcSet ? cover.srcSet.replace(/(^|, )learn-thumbs\//g, `$1${BASE}learn-thumbs/`) : undefined}
                    sizes="(min-width: 900px) 300px, 90vw"
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                      // A picture that fails to load falls back once to the program photograph, never a broken icon.
                      const el = e.currentTarget;
                      if (el.dataset.fell || !fallback) {
                        el.style.display = 'none';
                        return;
                      }
                      el.dataset.fell = '1';
                      el.removeAttribute('srcset');
                      el.src = `${BASE}${fallback}`;
                    }}
                  />
                )}
                <span className={`is-cbadge ${required ? 'is-cbadge-req' : ''}`}>{required ? 'Required for the certificate' : 'Open study'}</span>
                <b>{title}</b>
              </span>
              <span className="is-cbody">
                {course.meta && course.meta.audience && <small>For {course.meta.audience}</small>}
                {note && <small className="is-cnote">{note}</small>}
                <span className={`is-go ${going ? 'is-go-red' : 'is-go-gold'}`} data-testid={`${testid}-${course.key}-go`}>
                  {going ? 'Continue →' : 'Start course →'}
                </span>
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
