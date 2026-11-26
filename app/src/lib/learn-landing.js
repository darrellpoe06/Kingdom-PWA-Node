import { useState } from 'react';

// Where the Learn tab opens (DR-1606). Darrell, 2026-11-19, on The Word tab of
// the Love Corner: "Land on latest every time someone goes to lessons...
// because it defaulting to a confusing situation... make it easy for new
// users!!!!!!!!!" The old first screen was the whole course list, which asks a
// newcomer to choose before they have seen anything. Latest shows the newest
// lessons, each with ▶ Play, so the first screen is something to read.
//
// Two readers still open on the lessons: one who arrives on a department tab
// (choosing a department is choosing its course, so its lessons are what they
// came for), and one with a single course (the area strip exists only with
// more than one course, so there would be no way back from Latest).
export const LEARN_LANDING_AREA = 'latest';

export function learnLandingArea(courseCount, { inDepartment = false } = {}) {
  if (inDepartment) return 'lessons';
  return Number(courseCount) > 1 ? LEARN_LANDING_AREA : 'lessons';
}

// Decided once per visit, when the catalog and the department are known, and
// set during render so the first paint is already right: a visit that opens on
// a department, or with one course, moves from Latest to the lessons.
export function useLearnLanding(learnArea, setLearnArea, courseCount, inDepartment) {
  const [landed, setLanded] = useState(false);
  if (landed) return;
  setLanded(true);
  const landing = learnLandingArea(courseCount, { inDepartment });
  if (learnArea === LEARN_LANDING_AREA && landing !== LEARN_LANDING_AREA) setLearnArea(landing);
}

// A ONE-TIME ASK TO OPEN ON AN AREA. The Institute's "Open my full record" sends the reader to
// Learn's Record area; the hint is taken once (session only), so the next ordinary visit lands
// on Latest as before.
export const LEARN_AREA_HINT_KEY = 'poe-learn-open-area';
export function setLearnAreaHint(area) {
  try {
    window.sessionStorage.setItem(LEARN_AREA_HINT_KEY, String(area));
  } catch {
    /* no storage: Learn opens on its usual area */
  }
}
export function takeLearnAreaHint(allowed = ['record']) {
  try {
    const v = window.sessionStorage.getItem(LEARN_AREA_HINT_KEY);
    if (v) window.sessionStorage.removeItem(LEARN_AREA_HINT_KEY);
    return v && allowed.includes(v) ? v : null;
  } catch {
    return null;
  }
}
