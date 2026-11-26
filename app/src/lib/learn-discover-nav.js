// =============================================================================
// learn-discover-nav — from the discovery page into the Learning Zone that already exists
// =============================================================================
// The discovery page opens the EXISTING Learn; it never renders a second one. Learn has two looks:
//
//   the NEW look (Learn Studio, the default for every member since DR-1664) — Courses, Departments and
//   the Learn tools strip live on its home. We reach them by pressing Learn Studio's OWN controls
//   (its All Courses button, its tool chips), so what happens is exactly what a tap on Learn does.
//   Nothing in Learn Studio is edited.
//
//   the CLASSIC look (the fail-safe, or a device that chose ?learnStudio=0) — reached through the
//   one-time area hint Learn already reads (learn-landing.js). That hint is the one thing
//   ChurchLearn.jsx was changed for (its allow-list, DEEP_LINK_AREAS).
//
// Either way a person's saved preferences are honoured: nothing here writes a theme, a course, a
// sort order, a level or a look. The hint is session-only and taken once.
// =============================================================================
import { setLearnAreaHint } from './learn-landing.js';
import { rememberCourseKey } from './learn-organize.js';

/**
 * area -> what to ask of each look.
 *   hint : the classic area (learn-landing DEEP_LINK_AREAS)
 *   click: the Learn Studio control that does the same thing
 *   show : or the Learn Studio region to bring into view
 */
export const AREA_ROUTES = Object.freeze({
  lessons: { hint: 'lessons', click: 'ls-all-courses' },
  browse: { hint: 'browse', click: 'ls-tool-browse' },
  record: { hint: 'record', click: 'ls-tool-record' },
  downloads: { hint: 'downloads', click: 'ls-tool-downloads' },
  tools: { hint: 'find', show: '.ls-tools-strip' },
});

const PRESENT = '[data-testid="ls-hero"], [data-testid="ls-courses"], [data-testid="ls-full-tools"], .ls-tools-strip';

/**
 * Open Learn and take it to `area`.
 * @param area one of Object.keys(AREA_ROUTES)
 * @param opts.openLearn  opens the Learn tab (the shell's setChurchView('learn'))
 * @returns a cancel function (stop looking for Learn Studio's controls)
 */
export function openLearnArea(
  area,
  { openLearn, doc = typeof document !== 'undefined' ? document : null, tries = 40, every = 100, setTimer = setTimeout, clearTimer = clearTimeout } = {}
) {
  const route = AREA_ROUTES[area];
  if (typeof openLearn === 'function') {
    if (route) setLearnAreaHint(route.hint);
    openLearn();
  }
  if (!route || !doc) return () => {};
  let n = 0;
  let timer = null;
  let stopped = false;
  const step = () => {
    if (stopped) return;
    n += 1;
    const studio = doc.querySelector(PRESENT);
    if (studio) {
      const el = route.click ? doc.querySelector(`[data-testid="${route.click}"]`) : doc.querySelector(route.show);
      if (el) {
        if (route.click && typeof el.click === 'function') el.click();
        else if (el.scrollIntoView) el.scrollIntoView({ block: 'start' });
        return;
      }
    }
    // The classic look has no Learn Studio controls; its hint was taken when Learn mounted, so there is nothing more to do.
    if (n < tries && !doc.querySelector('[data-testid="learn-areas"]')) timer = setTimer(step, every);
  };
  timer = setTimer(step, 0);
  return () => {
    stopped = true;
    if (timer) clearTimer(timer);
  };
}

/**
 * Open Learn on ONE COURSE'S OWN PAGE (Darrell 2026-11-26: a course card opens the course, never its first lesson).
 *   new look: presses Learn Studio's own course card (showing the full course list first when that course is not on the
 *             first shelf), exactly what a tap on that course inside Learn does;
 *   classic : remembers the course as the one chosen (the same record Learn's own course picker writes) and lands on Lessons.
 * @returns a cancel function
 */
export function openLearnCourse(
  courseKey,
  { openLearn, doc = typeof document !== 'undefined' ? document : null, tries = 60, every = 100, setTimer = setTimeout, clearTimer = clearTimeout } = {}
) {
  if (typeof courseKey !== 'string' || !courseKey) return () => {};
  try {
    rememberCourseKey(courseKey);
  } catch {
    /* no storage: the new look does not need it */
  }
  setLearnAreaHint('lessons');
  if (typeof openLearn === 'function') openLearn();
  if (!doc) return () => {};
  let n = 0;
  let timer = null;
  let stopped = false;
  let expanded = false;
  const step = () => {
    if (stopped) return;
    n += 1;
    const card = doc.querySelector(`[data-testid="ls-course-${courseKey}"]`);
    if (card && typeof card.click === 'function') {
      card.click();
      return;
    }
    const all = doc.querySelector('[data-testid="ls-courses-all"]');
    if (all && !expanded && typeof all.click === 'function') {
      expanded = true;
      all.click();
    }
    if (n < tries && !doc.querySelector('[data-testid="learn-areas"]')) timer = setTimer(step, every);
  };
  timer = setTimer(step, 0);
  return () => {
    stopped = true;
    if (timer) clearTimer(timer);
  };
}
