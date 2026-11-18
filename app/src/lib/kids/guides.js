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
// bible-adventures-key-art.jpg) and nothing here is drawn, generated or imitated:
// kids-guides-assets.test.js proves each listed file exists on disk, so a
// surface can never point at a guide that is not there.
//
// WHAT IT IS NOT. New poses and story scenes of these two in the same 3D
// style are renders the reference's own pipeline produces; this registry
// names each one still needed (SHOT_LIST) with its status, and a surface shows
// a labeled slot for a shot whose render has not landed, never a drawn
// stand-in and never a generated face.
//
// Pure: no React, no I/O (the landed manifest is a JSON import, written at
// build time). Paths are served from the app's public root, which
// the Love Corner door serves under /lovecorner/ as well (DR-0258), so they
// are resolved through assetUrl() with the same BASE the Bible loader uses.
import landed from './landed.json';

export const KIDS_ASSET_DIR = 'lovecorner/kids/';

/**
 * What is on disk under the kids folder (app/src/lib/kids/landed.json, written
 * by scripts/kids-landed-manifest.mjs before every build; DR-1527). A render,
 * a recording or an episode is taken the moment its file is there, with no
 * code change: the registry below reads this, never a hand-kept status.
 */
export const LANDED = Object.freeze(landed);
const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'webp'];

/** True when the kids folder carries this file (by its path under the folder). */
export function onDisk(file, manifest = LANDED) {
  return !!(manifest && manifest.files && manifest.files[String(file)]);
}

/** The image file a shot's render landed as (png first, then jpg/jpeg/webp), or null. */
export function landedFile(id, manifest = LANDED) {
  for (const ext of IMAGE_EXTS) if (onDisk(`${id}.${ext}`, manifest)) return `${id}.${ext}`;
  return null;
}

/** The two guides. Names come from Darrell with the reference; until then the keys are the roles. */
export const GUIDES = Object.freeze({
  girl: Object.freeze({
    key: 'girl',
    name: null, // given by Darrell; never invented here
    portrait: 'guide-girl.png', // waist-up, transparent, holding her Bible (approved 2026-11-17)
    face: 'guide-girl-face.png', // head and shoulders, transparent, circle-safe
    look: 'braids gathered in a top bun with pink and white beads, small stud earrings, red hoodie, black backpack',
  }),
  boy: Object.freeze({
    key: 'boy',
    name: null,
    portrait: 'guide-boy.png', // waist-up, transparent, arms folded (approved 2026-11-17)
    face: 'guide-boy-face.png', // head and shoulders, transparent, circle-safe
    look: 'short curly twists with a fade, blue hoodie, tan utility vest, backpack',
  }),
});

/** Brand and scene pieces from the approved illustration (the key art, 2026-11-17). */
export const KIDS_BRAND = Object.freeze({
  reference: 'bible-adventures-key-art.jpg', // the whole approved illustration: the pair, the valley, the logo
  logo: 'logo.png', // "The Love Corner Bible Adventures" lockup with the open Bible, from the key art
  pair: 'guides-pair.png', // both guides reading the open Bible together, from their own approved scene
  bible: 'bible-open.png', // the open Bible in their hands, from that scene
});

/** Every file the registry names, for the on-disk proof. */
export function listedAssets() {
  const out = [KIDS_BRAND.reference, KIDS_BRAND.logo, KIDS_BRAND.pair, KIDS_BRAND.bible];
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
 * each one's full description). `status` is 'landed' the moment the file is
 * in public/lovecorner/kids (the landed manifest, DR-1527), else 'needed',
 * and a surface shows the interim art for a needed shot. Every scene is a true Bible scene told as
 * the text tells it: no magic, no fantasy device, miracles as the acts of
 * Yahweh. kids-guides-assets.test.js proves each id is described in the brief
 * and each landed file is on disk.
 */
const shot = (id, kind, surface) => ({ id, kind, surface, status: landedFile(id) ? 'landed' : 'needed' });
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

/**
 * The interim art a surface shows for a shot that has not landed (Darrell,
 * 2026-11-17: the best version NOW, from the assets we already have; the
 * approved reference wherever it fits; a clear mark where new art is still
 * needed). Every file here is a crop of the approved reference, never a
 * drawing: a guide's portrait for a shot of that guide, the pair for a shot
 * of both, the open Bible for a story scene (with the page's narrator). A
 * shot no reference can stand in for (the teens' own guides) returns null and
 * the surface keeps its labeled slot.
 */
const HEADER_WHO = Object.freeze({
  'word-builder-header': 'girl',
  'who-am-i-header': 'boy',
  'memory-verse-header': 'girl',
  'trivia-header': 'boy',
});
export function interimFor(id) {
  const key = String(id || '');
  const story = key.match(/^(jonah|noah|david)-\d+$/);
  if (story) return { kind: 'story', book: story[1], who: null, file: KIDS_BRAND.bible };
  const who = key.startsWith('girl-') ? 'girl' : key.startsWith('boy-') ? 'boy' : HEADER_WHO[key] || null;
  if (who) return { kind: 'portrait', book: null, who, file: GUIDES[who].portrait };
  if (key.startsWith('pair-') || key === 'home-hero') return { kind: 'pair', book: null, who: 'pair', file: KIDS_BRAND.pair };
  return null;
}

/** The shots whose renders have landed, by id. */
export function landedShots() {
  return SHOT_LIST.filter((s) => s.status === 'landed');
}
