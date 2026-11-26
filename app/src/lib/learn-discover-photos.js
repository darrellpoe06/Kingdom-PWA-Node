// =============================================================================
// learn-discover-photos — which EXISTING approved lesson photograph fronts each
// discovery category and the welcome banner
// =============================================================================
// Nothing here is new art. Every picture is a lesson cover already shipped in
// public/learn-thumbs, named by the lesson it belongs to, so the file is read
// from the derived index (learn-discover-index.json `im`) and a lesson whose
// picture is ever withdrawn simply falls back to the next one. These are
// STAND-INS chosen from the library as it is; the photograph audit
// (docs/design/learn-discover/PHOTO-NEEDS.md) lists where the library is
// repetitive and what new category photographs would improve.
// =============================================================================

export const HERO_LESSON = 'whohe14-for-ever';

/** category id -> the lesson whose cover fronts it, then fallbacks. */
export const CATEGORY_PHOTO = Object.freeze({
  faith: ['whohe5-the-prophets'],
  marriage: ['ll122-does-she-feel-like-your-favorite-person-preferring-one-another-and-the-first-works'],
  parenting: ['lil3-big-and-small-goliath-and-the-mustard-seed'],
  wellness: ['mit5-those-who-know-their-god'],
  purpose: ['pm14-whose-measure-the-benchmark-the-census-and-the-kpis'],
  money: ['fin6-usury-and-who-your-brother-is'],
  business: ['rto2-what-rent-to-own-actually-is-and-the-just-weight'],
  realestate: ['buy2-two-sets-of-weights-in-one-bag'],
  leadership: ['bc2-camera-and-image'],
  bible: ['pv-williams'],
  history: ['wi-historical-trauma-two-aftermaths'],
  tech: ['wk6-build-something'],
});

/** The lesson row (from the derived index) that fronts a category, or the strongest member with a picture. */
export function categoryPhotoRow(P, catId, memberIds = []) {
  for (const id of CATEGORY_PHOTO[catId] || []) {
    const L = P.byId.get(id);
    if (L && L.raw.im) return L.raw;
  }
  for (const id of memberIds) {
    const L = P.byId.get(id);
    if (L && L.raw.im) return L.raw;
  }
  return null;
}

/** srcset for a shipped cover: only the two widths that exist (640, 1280). */
export function photoSrc(im, base = '') {
  if (!im) return null;
  const b = String(base || '').replace(/\/?$/, '/');
  const big = `${b}${im}`;
  const small = big.replace(/w1280\.webp$/, 'w640.webp');
  return { src: small, srcSet: `${small} 640w, ${big} 1280w` };
}
