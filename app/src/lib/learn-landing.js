// Where the Learn tab opens (DR-1606). Darrell, 2026-11-19, on The Word tab of
// the Love Corner: "Land on latest every time someone goes to lessons...
// because it defaulting to a confusing situation... make it easy for new
// users!!!!!!!!!" The old first screen was the whole course list, which asks a
// newcomer to choose before they have seen anything. Latest shows the newest
// lessons, each with ▶ Play, so the first screen is something to read.
//
// The area strip exists only when there is more than one course; with one
// course there is no strip to come back by, so that reader opens on its
// lessons as before.
export const LEARN_LANDING_AREA = 'latest';

export function learnLandingArea(courseCount) {
  return Number(courseCount) > 1 ? LEARN_LANDING_AREA : 'lessons';
}
