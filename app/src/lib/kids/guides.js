// =============================================================================
// kids/guides — the two approved guides of the Kids Zone, as reusable assets
// =============================================================================
// Darrell, 2026-11-13, with the reference image: "I want the same girl and boy
// throughout the ENTIRE Kids Zone, maintaining their facial features,
// hairstyles, skin tones, and realistic 3D animated appearance. Do not
// substitute simplified SVG drawings, generic cartoon children, or emoji-style
// illustrations... Please create reusable character assets."
//
// WHAT THIS IS. One registry of the character assets every Kids Zone surface
// reads, so the guides are the SAME two children on the home, in the
// storybooks, in the Theater, in the games and at the rewards. Every asset is
// cut from the approved reference image (app/public/lovecorner/kids/
// guides-reference.png) and nothing here is drawn, generated or imitated:
// kids-guides-assets.test.js proves each listed file exists on disk, so a
// surface can never point at a guide that is not there.
//
// WHAT IT IS NOT. New poses and story scenes of these two in the same 3D
// style are renders the reference's own pipeline produces; this registry
// names each one still needed (SHOT_LIST) with its status, and a surface shows
// a labeled slot for a shot whose render has not landed, never a drawn
// stand-in and never a generated face.
//
// Pure: no React, no I/O. Paths are served from the app's public root, which
// the Love Corner door serves under /lovecorner/ as well (DR-0258), so they
// are resolved through assetUrl() with the same BASE the Bible loader uses.
export const KIDS_ASSET_DIR = 'lovecorner/kids/';

/** The two guides. Names come from Darrell with the reference; until then the keys are the roles. */
export const GUIDES = Object.freeze({
  girl: Object.freeze({
    key: 'girl',
    name: null, // given by Darrell; never invented here
    portrait: 'guide-girl.png', // full portrait, from the reference
    face: 'guide-girl-face.png', // circular avatar, transparent
    look: 'long braids with a red bow, hoop earrings, red hoodie with white stripes',
  }),
  boy: Object.freeze({
    key: 'boy',
    name: null,
    portrait: 'guide-boy.png',
    face: 'guide-boy-face.png',
    look: 'short curly twists, black hoodie with red lining',
  }),
});

/** Brand and scene pieces cut from the same reference. */
export const KIDS_BRAND = Object.freeze({
  reference: 'guides-reference.png', // the whole approved image
  logo: 'logo.png', // "The Love Corner Bible Adventures" lockup with the open Bible
  pair: 'guides-pair.png', // both guides at the table over the open Bible
  bible: 'bible-open.png', // the open Bible in the foreground
  doors: Object.freeze({
    stories: 'door-bible-stories.png',
    games: 'door-games.png',
    videos: 'door-videos.png',
    memory: 'door-memory-verses.png',
    activities: 'door-activities.png',
  }),
});

/** Every file the registry names, for the on-disk proof. */
export function listedAssets() {
  const out = [KIDS_BRAND.reference, KIDS_BRAND.logo, KIDS_BRAND.pair, KIDS_BRAND.bible, ...Object.values(KIDS_BRAND.doors)];
  for (const g of Object.values(GUIDES)) out.push(g.portrait, g.face);
  return out;
}

/** A served URL for an asset, under the door's own base path. */
export function assetUrl(file, base = '/') {
  const b = String(base || '/');
  return `${b.endsWith('/') ? b : `${b}/`}${KIDS_ASSET_DIR}${file}`;
}

/**
 * The character artwork collection: every render the screens need from the
 * reference's pipeline, one row per image, the ids being the file names
 * (docs/design/love-corner-kids/2026-11-13-character-artwork-brief.md holds
 * each one's full description). `status` is 'needed' until the file lands
 * in public/lovecorner/kids and the row says 'landed'; a surface renders a
 * labeled slot for a needed shot. Every scene is a true Bible scene told as
 * the text tells it: no magic, no fantasy device, miracles as the acts of
 * Yahweh. kids-guides-assets.test.js proves each id is described in the brief
 * and each landed file is on disk.
 */
const shot = (id, kind, surface, status = 'needed') => ({ id, kind, surface, status });
export const SHOT_LIST = Object.freeze([
  // the home
  shot('home-hero', 'scene', 'Kids home hero'),
  shot('girl-wave', 'cutout', 'Meet your guides'),
  shot('boy-wave', 'cutout', 'Meet your guides'),
  shot('girl-reading-lantern', 'header', "This week's adventure card"),
  shot('pair-theater-tile', 'header', 'Theater door'),
  shot('girl-storybook', 'header', 'Storybooks door'),
  shot('boy-reading-headphones', 'header', 'Reading corner door'),
  shot('girl-remembering', 'header', 'Memory verse tile'),
  shot('boy-question', 'header', 'Bible trivia tile'),
  shot('girl-blocks', 'header', 'Word builder tile'),
  shot('boy-magnifier', 'header', 'Who am I? tile'),
  // the guides' speech bubbles
  shot('girl-point', 'cutout', 'Guide bubble'),
  shot('girl-encourage', 'cutout', 'Guide bubble'),
  shot('girl-wonder', 'cutout', 'Guide bubble'),
  shot('girl-shh-listen', 'cutout', 'Guide bubble'),
  shot('boy-explain', 'cutout', 'Guide bubble'),
  shot('boy-think', 'cutout', 'Guide bubble'),
  shot('boy-cheer', 'cutout', 'Guide bubble'),
  shot('boy-reading-point', 'cutout', 'Guide bubble'),
  // the Theater
  shot('pair-theater-wide', 'scene', 'Adventure Theater, nothing playing'),
  // the storybooks
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => shot(`jonah-${n}`, 'scene', 'Storybook: Jonah and the Great Fish')),
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => shot(`noah-${n}`, 'scene', 'Storybook: Noah and the Door Yahweh Shut')),
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => shot(`david-${n}`, 'scene', 'Storybook: David and the Giant')),
  // the games
  shot('word-builder-header', 'header', 'Word Builder'),
  shot('who-am-i-header', 'header', 'Who am I?'),
  shot('memory-verse-header', 'header', 'Memory verse'),
  shot('trivia-header', 'header', 'Bible trivia'),
  // achievements and the map
  shot('pair-celebrate', 'scene', 'Badges'),
  shot('girl-badge', 'cutout', 'Badges'),
  shot('boy-map', 'cutout', 'Adventure map'),
  shot('pair-chest', 'scene', 'Adventure map, the end of the path'),
  // the coloring sheets
  shot('girl-lineart', 'cutout', 'Coloring page'),
  shot('boy-lineart', 'cutout', 'Coloring page'),
]);

/** The shots whose renders have landed, by id. */
export function landedShots() {
  return SHOT_LIST.filter((s) => s.status === 'landed');
}
