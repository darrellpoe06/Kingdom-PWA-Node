// =============================================================================
// tv-franchises — curated "same universe" connections for PoeTech TV Time
// (Darrell 2026-07-04: "spinoff shows connected if possible like Game of Thrones
// new spinoff is House of dragons"). TVmaze/iTunes don't expose a trustworthy
// spinoff/related field, so connections are HUMAN-CURATED KNOWN FACTS — never an
// algorithm guessing a link (DR-0076: no fabricated relationships). Each entry is
// a real franchise the friend group would recognize; the map grows over time.
//
// Matching is by NORMALIZED TITLE (portable across the catalog + custom shows),
// so a looked-up "Game of Thrones" (TVmaze) and a pasted "game of thrones"
// (import) both resolve to the same universe.
// =============================================================================

// Normalize a title to a match key: lowercase, strip punctuation/articles/year.
export function titleKey(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/\(\d{4}\)/g, ' ')            // drop a trailing (2011)
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(the|a|an)\b/g, ' ')       // articles don't distinguish a title
    .replace(/\s+/g, ' ')
    .trim();
}

// The universes. `name` is the franchise label; `titles` are the member works
// (canonical display titles). Only well-established, real connections.
export const FRANCHISES = [
  { name: 'Game of Thrones', titles: ['Game of Thrones', 'House of the Dragon', 'A Knight of the Seven Kingdoms'] },
  { name: 'Breaking Bad', titles: ['Breaking Bad', 'Better Call Saul', 'El Camino: A Breaking Bad Movie'] },
  { name: 'The Walking Dead', titles: ['The Walking Dead', 'Fear the Walking Dead', 'The Walking Dead: Dead City', 'The Walking Dead: Daryl Dixon', 'The Walking Dead: The Ones Who Live', 'The Walking Dead: World Beyond', 'Tales of the Walking Dead'] },
  { name: 'Yellowstone', titles: ['Yellowstone', '1883', '1923', '6666', 'Lawmen: Bass Reeves'] },
  { name: 'The Boys', titles: ['The Boys', 'Gen V', 'The Boys Presents: Diabolical'] },
  { name: 'Star Trek', titles: ['Star Trek', 'Star Trek: The Next Generation', 'Star Trek: Deep Space Nine', 'Star Trek: Voyager', 'Star Trek: Enterprise', 'Star Trek: Discovery', 'Star Trek: Picard', 'Star Trek: Strange New Worlds', 'Star Trek: Lower Decks', 'Star Trek: Prodigy'] },
  { name: 'The Mandalorian & Star Wars', titles: ['The Mandalorian', 'The Book of Boba Fett', 'Ahsoka', 'Andor', 'Obi-Wan Kenobi', 'Star Wars: The Clone Wars', 'Star Wars Rebels', 'The Acolyte', 'Skeleton Crew'] },
  { name: 'Marvel Cinematic Universe', titles: ['WandaVision', 'The Falcon and the Winter Soldier', 'Loki', 'Hawkeye', 'Moon Knight', 'Ms. Marvel', 'She-Hulk: Attorney at Law', 'Secret Invasion', 'Echo', 'Agatha All Along', 'Daredevil: Born Again'] },
  { name: 'Downton Abbey', titles: ['Downton Abbey'] },
  { name: "Grey's Anatomy", titles: ["Grey's Anatomy", 'Private Practice', 'Station 19'] },
  { name: 'NCIS', titles: ['NCIS', 'NCIS: Los Angeles', 'NCIS: New Orleans', "NCIS: Hawai'i", 'NCIS: Sydney', 'NCIS: Origins', 'JAG'] },
  { name: 'FBI', titles: ['FBI', 'FBI: Most Wanted', 'FBI: International'] },
  { name: 'One Chicago', titles: ['Chicago Fire', 'Chicago P.D.', 'Chicago Med', 'Chicago Justice'] },
  { name: 'Law & Order', titles: ['Law & Order', 'Law & Order: Special Victims Unit', 'Law & Order: Criminal Intent', 'Law & Order: Organized Crime', 'Law & Order: Los Angeles'] },
  { name: 'Cobra Kai / Karate Kid', titles: ['Cobra Kai', 'The Karate Kid'] },
  { name: 'Better Things / Fargo (anthology)', titles: ['Fargo'] },
  { name: 'The Originals / Vampire Diaries', titles: ['The Vampire Diaries', 'The Originals', 'Legacies'] },
  { name: 'Arrowverse', titles: ['Arrow', 'The Flash', 'Supergirl', 'Legends of Tomorrow', 'Batwoman', 'Black Lightning'] },
  { name: 'Bridgerton', titles: ['Bridgerton', 'Queen Charlotte: A Bridgerton Story'] },
  { name: 'The Good Wife', titles: ['The Good Wife', 'The Good Fight', 'Elsbeth'] },
];

// Build the lookup once: titleKey -> { franchise, members:[displayTitle] }.
const INDEX = (() => {
  const idx = new Map();
  for (const f of FRANCHISES) {
    for (const t of f.titles) {
      idx.set(titleKey(t), { franchise: f.name, members: f.titles });
    }
  }
  return idx;
})();

// The connected works for a title, EXCLUDING the title itself. [] when the title
// isn't in a known franchise (the honest default — no invented links).
export function relatedTitles(title) {
  const hit = INDEX.get(titleKey(title));
  if (!hit) return [];
  const self = titleKey(title);
  return hit.members.filter((m) => titleKey(m) !== self);
}

// The franchise name for a title, or '' if it isn't in one.
export function franchiseOf(title) {
  const hit = INDEX.get(titleKey(title));
  return hit ? hit.franchise : '';
}

// Is this title part of a known universe with at least one sibling?
export function hasUniverse(title) {
  return relatedTitles(title).length > 0;
}
