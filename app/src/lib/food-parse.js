// =============================================================================
// food-parse — one sentence of food into its separate items
// =============================================================================
// Darrell 2026-08-31: "if I say I ate a 6 inch subway turkey sandwich with white
// bread, mayo tomatoes, pickles onions olives hot peppers avocado spread. I want
// you to add each thing with calories and then add all the calories together."
//
// So the job is: SPLIT the sentence into the things eaten, keep any size/serving
// words attached to the item they belong to, and hand back one entry per item so
// the log stays one-row-per-food (a meal total is derived, never stored).
//
// PURE AND DETERMINISTIC. No network, no model, no guessing. This file decides
// only WHAT THE ITEMS ARE -- it never invents a calorie or protein number. Those
// come from the person's own remembered library or a cited lookup, and an item
// with no number stays null ("not recorded"), never 0. That split matters: a
// wrong split is a visible annoyance the person fixes in a tap; an invented
// calorie count is a lie that silently corrupts a weight-loss log.
// =============================================================================

// Words that join a list of foods rather than naming one.
const SPLIT_WORDS = /\b(?:with|and|plus|topped with|side of|along with)\b/gi;

// A leading quantity/size phrase we keep WITH its item: "6 inch", "2 slices",
// "1 cup", "12 oz". Captured so the serving can be lifted out of the name.
const SERVING_RE = /^\s*((?:\d+(?:[./]\d+)?)\s*(?:inch|in|oz|ounce|ounces|g|gram|grams|lb|lbs|cup|cups|tbsp|tsp|slice|slices|piece|pieces|scoop|scoops|can|cans|bottle|bottles|serving|servings|egg|eggs)?)\s+/i;

// Filler that adds nothing to a food's identity.
const NOISE = /^\s*(?:a|an|the|some|my|of|i|ate|had|some\s+of)\s+/i;

/** "  Turkey   Breast " -> "turkey breast" */
export function normalizeName(raw) {
  return String(raw || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

// Strip filler repeatedly ("a some of the turkey" -> "turkey").
function stripNoise(text) {
  let out = String(text || '').trim();
  let prev = null;
  while (prev !== out) { prev = out; out = out.replace(NOISE, '').trim(); }
  return out;
}


// ── THE SEGMENTATION VOCABULARY ──────────────────────────────────────────────
// Darrell's own example has no commas between several foods: "pickles onions
// olives hot peppers avocado spread". Splitting that on spaces would invent
// "hot", "peppers", "avocado" and "spread" as four foods; leaving it whole logs
// one absurd item. Neither is acceptable, so we need to KNOW that "hot peppers"
// and "avocado spread" are each one food.
//
// WHAT THIS LIST IS, AND WHAT IT IS NOT. It is a vocabulary of food NAMES, used
// only to decide where one food ends and the next begins. It carries NO calorie
// or protein values and never will -- recognising the word "olives" is a fact
// about language; asserting how many calories are in them is a nutrition claim,
// and those come only from the person's own confirmed entries or a cited lookup
// (DR-0076). Getting a split wrong is a visible annoyance fixed in one tap; an
// invented calorie count silently corrupts a weight-loss log.
//
// Longest phrases first so "hot peppers" wins over "peppers", and "avocado
// spread" over "avocado". Unknown words are never discarded -- they gather into
// their own item so nothing eaten goes unlogged.
const FOOD_WORDS = [
  'avocado spread', 'avocado', 'hot peppers', 'banana peppers', 'green peppers', 'bell peppers', 'peppers',
  'white bread', 'wheat bread', 'italian bread', 'sourdough', 'bread', 'bun', 'roll', 'tortilla', 'pita',
  'turkey breast', 'turkey', 'chicken breast', 'chicken', 'roast beef', 'beef', 'ham', 'bacon', 'salami',
  'pepperoni', 'tuna', 'salmon', 'white fish', 'tilapia', 'shrimp', 'egg whites', 'eggs', 'egg',
  'black beans', 'pinto beans', 'beans', 'quinoa', 'brown rice', 'white rice', 'rice', 'pasta', 'noodles',
  'sweet potato', 'baked potato', 'potato', 'fries', 'broccoli', 'spinach', 'kale', 'lettuce', 'romaine',
  'mixed vegetables', 'roasted vegetables', 'vegetables', 'veggies', 'salad', 'tomatoes', 'tomato',
  'cucumbers', 'cucumber', 'pickles', 'pickle', 'onions', 'onion', 'olives', 'olive', 'jalapenos',
  'mushrooms', 'carrots', 'celery', 'corn', 'peas', 'green beans', 'asparagus', 'brussels sprouts',
  'cheese', 'american cheese', 'cheddar', 'provolone', 'swiss', 'mozzarella', 'feta',
  'mayo', 'mayonnaise', 'mustard', 'ketchup', 'ranch', 'dressing', 'oil and vinegar', 'hummus', 'guacamole',
  'almonds', 'peanuts', 'walnuts', 'cashews', 'peanut butter', 'almond butter', 'nuts',
  'almond milk', 'oat milk', 'milk', 'yogurt', 'greek yogurt', 'cottage cheese', 'protein shake',
  'protein powder', 'orgain plant protein', 'homemade juice', 'juice', 'water', 'coffee', 'tea',
  'apple', 'banana', 'orange', 'grapes', 'berries', 'strawberries', 'blueberries', 'oatmeal', 'granola',
  'sandwich', 'sub', 'wrap', 'burger', 'pizza', 'soup', 'chips', 'crackers', 'popcorn',
].sort((a, b) => b.length - a.length);

// Split a delimiter-free run like "pickles onions olives hot peppers avocado
// spread" into its foods. Greedy longest-match; anything unrecognised is kept
// as its own item rather than dropped.
function segmentByVocabulary(text) {
  const words = normalizeName(text).split(' ').filter(Boolean);
  if (words.length < 2) return null;
  const found = [];
  let buffer = [];
  let i = 0;
  while (i < words.length) {
    let matched = null;
    for (const phrase of FOOD_WORDS) {
      const parts = phrase.split(' ');
      if (parts.length > words.length - i) continue;
      if (words.slice(i, i + parts.length).join(' ') === phrase) { matched = phrase; break; }
    }
    if (matched) {
      if (buffer.length) { found.push(buffer.join(' ')); buffer = []; }
      found.push(matched);
      i += matched.split(' ').length;
    } else {
      buffer.push(words[i]);
      i += 1;
    }
  }
  if (buffer.length) found.push(buffer.join(' '));
  // Only worth splitting if the vocabulary actually recognised more than one food.
  return found.length > 1 ? found : null;
}

/**
 * Split one line into food items.
 *
 * Splits on commas and on joining words ("with", "and"). Each item keeps its own
 * leading size phrase as `serving`. Returns [] for empty input rather than a
 * row of nothing.
 *
 * @returns {{name: string, serving: string, raw: string}[]}
 */
export function parseFoodLine(line) {
  const text = String(line || '').trim();
  if (!text) return [];

  const pieces = text
    .replace(SPLIT_WORDS, ',')
    .split(/[,;\n]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const out = [];
  const seen = new Set();
  for (const piece of pieces) {
    const cleaned = stripNoise(piece);
    if (!cleaned) continue;

    let serving = '';
    let name = cleaned;
    const m = cleaned.match(SERVING_RE);
    // Only lift a leading quantity when something is actually left to name it.
    if (m && m[1] && cleaned.slice(m[0].length).trim()) {
      serving = m[1].replace(/\s+/g, ' ').trim();
      name = cleaned.slice(m[0].length).trim();
    }

    // A comma-piece may itself hold several foods with no delimiter between
    // them; the vocabulary finds the seams. A piece carrying its own serving
    // ("6 inch subway turkey sandwich") is left whole -- the size belongs to it.
    const segments = serving ? null : segmentByVocabulary(name);
    for (const part of (segments || [name])) {
      const key = normalizeName(part);
      if (!key || seen.has(key + '|' + serving)) continue;
      seen.add(key + '|' + serving);
      out.push({ name: part, serving, raw: piece });
    }
  }
  return out;
}

/**
 * Attach what we KNOW about each parsed item from the person's remembered
 * library. Anything unknown comes back with null numbers and known:false, so the
 * surface can ask for it instead of pretending. Never invents a value.
 *
 * @param items   from parseFoodLine
 * @param library [{ name, serving, calories, proteinG }] — previously confirmed
 */
export function resolveFromLibrary(items, library) {
  const byName = new Map();
  for (const entry of library || []) {
    const key = normalizeName(entry && entry.name);
    if (key && !byName.has(key)) byName.set(key, entry);
  }
  return (items || []).map((item) => {
    const hit = byName.get(normalizeName(item.name));
    if (!hit) return { ...item, calories: null, proteinG: null, known: false, source: null };
    return {
      ...item,
      serving: item.serving || hit.serving || '',
      calories: hit.calories == null ? null : Number(hit.calories),
      proteinG: hit.proteinG == null ? null : Number(hit.proteinG),
      known: hit.calories != null || hit.proteinG != null,
      source: 'remembered',
    };
  });
}

/** How many of a resolved list still need a number from the person. */
export function unknownCount(resolved) {
  return (resolved || []).filter((r) => !r || !r.known).length;
}
