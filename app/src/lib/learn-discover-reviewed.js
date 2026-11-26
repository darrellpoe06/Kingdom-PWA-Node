// =============================================================================
// learn-discover-reviewed — lessons placed by hand after reading them
// =============================================================================
// Darrell 2026-11-26: "Review the remaining uncategorized lessons to determine
// whether they have appropriate category matches. Do not force irrelevant
// assignments." The word rules in learn-discover-categories.js place 917 of 995
// lessons. The 78 left were read one by one (2026-11-26): 75 clearly belong in
// at least one category (most are Living Lessons that quote Scripture in their
// theme without using a category's own words); 3 do not, and stay unplaced.
//
// An entry is the lesson's id up to and including its first hyphen ("ll4-"), so
// a retitled lesson keeps its place. A category only POINTS at a lesson; no
// lesson, title, course or department changes. learn-discover.test.js fails if
// any prefix stops resolving to exactly one lesson.
//
// UNPLACED, with reasons (not forced):
//   ll287  a live-microphone story; teaches about trust in speech, no category's subject
//   ll317  Hosanna then crucify: who decides what is true; no category's subject
//   ll341  one small part stops the whole system; a parable of change, no category's subject
// =============================================================================
export const REVIEWED = Object.freeze({
  faith: ['ll1-', 'll3-', 'll4-', 'll12-', 'll17-', 'll20-', 'll88-', 'll101-', 'll105-', 'll112-', 'll148-', 'll155-', 'll159-', 'll168-', 'll184-', 'll186-', 'll216-', 'll223-', 'll232-', 'll246-', 'll248-', 'll251-', 'll305-', 'll328-', 'll336-'],
  bible: ['ll76-', 'll86-', 'll88-', 'll105-', 'll108-', 'll146-', 'll150-', 'll182-', 'll195-', 'll200-', 'll201-', 'll203-', 'll240-', 'll244-', 'll245-', 'll246-', 'll259-', 'll260-', 'll261-', 'll262-', 'll266-', 'll267-', 'll269-', 'll318-', 'll342-'],
  history: ['ll71-', 'll149-', 'll251-', 'll259-', 'll260-', 'll262-', 'll266-', 'll267-'],
  leadership: ['ll3-', 'll12-', 'll38-', 'll75-', 'll253-', 'll284-'],
  marriage: ['ll21-', 'll253-', 'll256-', 'll294-'],
  parenting: ['ll153-', 'll294-'],
  purpose: ['ll38-', 'll49-', 'll138-', 'll156-', 'll173-', 'll187-', 'll197-', 'll216-', 'll298-', 'll301-', 'll332-', 'll338-'],
  wellness: ['ll1-', 'll173-', 'll179-', 'll238-', 'll305-', 'll336-'],
  money: ['ll82-', 'll134-', 'll144-', 'll225-', 'll236-', 'll284-'],
  business: ['ll134-', 'll144-', 'll192-', 'll197-', 'll284-', 'll338-'],
});

export const UNPLACED = Object.freeze(['ll287-', 'll317-', 'll341-']);
