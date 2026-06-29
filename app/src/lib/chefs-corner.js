// =============================================================================
// chefs-corner — the pure recipe engine (model + paste-import parser + scaling)
// =============================================================================
// Chef's Corner is the start of a recipe app the family builds with Chef Mario.
// This module is the SHARED, dependency-free core: the canonical recipe shape,
// the plain-text -> structured "paste a recipe" parser (so a user never sees or
// types JSON), and serving scaling. The UI (components/ChefCorner.jsx) and the
// cloud sync (lib/recipes-sync.js) both compose THIS — modular by design so the
// surface grows (more recipes, more chefs, more collections) without rework.
//
// A recipe carries SECTIONED ingredients AND sectioned, ordered steps (e.g. the
// vegan cheeseburger splits into Burgers / House Burger Sauce / Purple Cabbage
// Slaw). A section with `title: null` is the plain, un-sectioned list.
//
// Everything here is pure (no React, no network, no storage) so the model and
// the parser are fully unit-testable on their own — verification doctrine: the
// parser's correctness is proven by tests, not claimed.
// =============================================================================

// The Poe Family Vegan collection — the first collection, attributed to Chef
// Mario. Collections are first-class so a second chef / second collection is an
// added entry, never a rewrite.
export const COLLECTIONS = {
  'poe-family-vegan': {
    id: 'poe-family-vegan',
    name: 'Poe Family Vegan Recipes',
    chef: 'Chef Mario',
    blurb: 'Real plant-based recipes from the Poe family kitchen, by Chef Mario.',
  },
};

export const DEFAULT_COLLECTION = 'poe-family-vegan';

// -----------------------------------------------------------------------------
// makeRecipe — normalize any partial recipe object to the canonical shape so the
// UI and the sync layer can treat every recipe (canonical content OR a cloud
// row OR a freshly parsed paste) uniformly.
// -----------------------------------------------------------------------------
export function makeRecipe(partial = {}) {
  const title = (partial.title || '').trim() || 'Untitled Recipe';
  const ingredientSections = normalizeIngredientSections(partial.ingredientSections);
  const instructionSections = normalizeInstructionSections(partial.instructionSections);
  return {
    id: partial.id || slugify(title),
    title,
    chef: (partial.chef || '').trim() || COLLECTIONS[DEFAULT_COLLECTION].chef,
    collection: partial.collection || DEFAULT_COLLECTION,
    servings: (partial.servings || '').toString().trim(),
    servingsBase: Number.isFinite(partial.servingsBase)
      ? partial.servingsBase
      : servingsBaseOf(partial.servings),
    prepTime: (partial.prepTime || '').toString().trim(),
    cookTime: (partial.cookTime || '').toString().trim(),
    ingredientSections,
    instructionSections,
    toppings: Array.isArray(partial.toppings) && partial.toppings.length
      ? partial.toppings.map((t) => String(t).trim()).filter(Boolean)
      : null,
    storage: (partial.storage || '').trim(),
    reheating: (partial.reheating || '').trim(),
    chefNote: (partial.chefNote || '').trim(),
    tags: Array.isArray(partial.tags) && partial.tags.length
      ? Array.from(new Set(partial.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean)))
      : ['vegan'],
    dateAdded: partial.dateAdded || null,
  };
}

// A section is { title: string|null, items: string[] } for ingredients,
// { title: string|null, steps: string[] } for instructions. Drop empties.
export function normalizeIngredientSections(sections) {
  if (!Array.isArray(sections)) return [];
  return sections
    .map((s) => ({
      title: s && s.title ? String(s.title).trim() : null,
      items: Array.isArray(s?.items) ? s.items.map((i) => String(i).trim()).filter(Boolean) : [],
    }))
    .filter((s) => s.items.length > 0);
}

export function normalizeInstructionSections(sections) {
  if (!Array.isArray(sections)) return [];
  return sections
    .map((s) => ({
      title: s && s.title ? String(s.title).trim() : null,
      steps: Array.isArray(s?.steps) ? s.steps.map((i) => String(i).trim()).filter(Boolean) : [],
    }))
    .filter((s) => s.steps.length > 0);
}

// Total ingredient / step counts (for card summaries).
export function ingredientCount(recipe) {
  return (recipe.ingredientSections || []).reduce((n, s) => n + s.items.length, 0);
}
export function stepCount(recipe) {
  return (recipe.instructionSections || []).reduce((n, s) => n + s.steps.length, 0);
}

// A stable url-safe id from a title.
export function slugify(title) {
  return (
    'recipe-' +
    String(title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60)
  ) || `recipe-${Math.abs(hashString(String(title)))}`;
}

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

// =============================================================================
// SERVING SCALING — scale the leading quantity of each ingredient by a factor.
// Handles integers, decimals, ASCII fractions (1/2), unicode fractions (½ ¼ ⅓),
// and mixed numbers (1 ½ / 1 1/2). Lines with no leading quantity (e.g.
// "Salt, to taste") pass through unchanged.
// =============================================================================
const UNICODE_FRACTIONS = {
  '½': 0.5, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 0.25, '¾': 0.75,
  '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8,
  '⅙': 1 / 6, '⅚': 5 / 6, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
};

// Parse a leading numeric quantity off the front of an ingredient string.
// Returns { value, rest } or null if the line doesn't start with a quantity.
export function parseLeadingQuantity(text) {
  const s = String(text).trimStart();
  // mixed unicode: "1 ½"  | mixed ascii: "1 1/2"
  let m = s.match(/^(\d+)\s+([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])\s*/);
  if (m) return { value: Number(m[1]) + UNICODE_FRACTIONS[m[2]], rest: s.slice(m[0].length) };
  m = s.match(/^(\d+)\s+(\d+)\/(\d+)\s*/);
  if (m) return { value: Number(m[1]) + Number(m[2]) / Number(m[3]), rest: s.slice(m[0].length) };
  // lone unicode fraction: "½ cup"
  m = s.match(/^([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])\s*/);
  if (m) return { value: UNICODE_FRACTIONS[m[1]], rest: s.slice(m[0].length) };
  // ascii fraction: "1/2 cup"
  m = s.match(/^(\d+)\/(\d+)\s*/);
  if (m) return { value: Number(m[1]) / Number(m[2]), rest: s.slice(m[0].length) };
  // decimal or integer: "2 lbs" / "1.5 cups"
  m = s.match(/^(\d+(?:\.\d+)?)\s*/);
  if (m) return { value: Number(m[1]), rest: s.slice(m[0].length) };
  return null;
}

// Format a number back to a friendly cooking quantity (prefers common fractions).
export function formatQuantity(n) {
  if (!Number.isFinite(n)) return '';
  const whole = Math.floor(n + 1e-9);
  const frac = n - whole;
  const known = [
    [1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [3 / 8, '⅜'], [1 / 2, '½'],
    [5 / 8, '⅝'], [2 / 3, '⅔'], [3 / 4, '¾'], [7 / 8, '⅞'],
  ];
  let fracStr = '';
  if (frac > 1e-6) {
    let best = null;
    for (const [val, glyph] of known) {
      const d = Math.abs(frac - val);
      if (d < 0.04 && (!best || d < best.d)) best = { glyph, d };
    }
    if (best) fracStr = best.glyph;
    else return String(Math.round(n * 100) / 100); // fall back to a clean decimal
  }
  if (whole === 0 && fracStr) return fracStr;
  if (fracStr) return `${whole} ${fracStr}`;
  return String(whole);
}

// Scale one ingredient line. Non-quantified lines pass through unchanged.
export function scaleIngredientText(text, factor) {
  if (!Number.isFinite(factor) || factor === 1) return text;
  const parsed = parseLeadingQuantity(text);
  if (!parsed) return text;
  const scaled = formatQuantity(parsed.value * factor);
  return `${scaled} ${parsed.rest}`.replace(/\s+/g, ' ').trimEnd();
}

// Return a copy of the recipe with every ingredient scaled by `factor`.
export function scaleRecipe(recipe, factor) {
  if (!Number.isFinite(factor) || factor === 1) return recipe;
  return {
    ...recipe,
    ingredientSections: (recipe.ingredientSections || []).map((s) => ({
      ...s,
      items: s.items.map((i) => scaleIngredientText(i, factor)),
    })),
  };
}

// The numeric base used for scaling: the LARGEST number in a servings string so
// "4–6" scales from 6 (the upper bound a cook plans for). Returns 0 if none.
export function servingsBaseOf(servings) {
  const nums = String(servings || '').match(/\d+/g);
  if (!nums) return 0;
  return Math.max(...nums.map(Number));
}

// =============================================================================
// PASTE-IMPORT PARSER — turn a plain-text recipe into the structured shape.
// The user pastes a recipe; the app structures it. No JSON, ever. The result is
// always editable in the add form before saving, so the parser optimizes for a
// good first pass on the common shapes (labeled meta, INGREDIENTS / INSTRUCTIONS
// headers, sub-section titles, numbered or semicolon-separated steps).
// =============================================================================

const META_PATTERNS = [
  ['servings', /^servings\s*[:-]\s*(.+)$/i],
  ['prepTime', /^prep(?:\s*time)?\s*[:-]\s*(.+)$/i],
  ['cookTime', /^cook(?:\s*time)?\s*[:-]\s*(.+)$/i],
  ['storage', /^storage\s*[:-]\s*(.+)$/i],
  ['reheating', /^reheat(?:ing)?\s*[:-]\s*(.+)$/i],
  ['chefNote', /^(?:chef'?s?\s*note|note)\s*[:-]\s*(.+)$/i],
  ['tags', /^tags?\s*[:-]\s*(.+)$/i],
  ['chef', /^(?:chef|author|by)\s*[:-]\s*(.+)$/i],
];

const SECTION_HEADERS = [
  ['ingredients', /^ingredients\b.*$/i],
  ['instructions', /^(?:instructions|directions|steps|method)\b.*$/i],
  ['toppings', /^(?:optional\s+toppings|toppings)\b\s*[:-]?\s*(.*)$/i],
];

// Split an ingredient blob into items: prefer explicit newlines / bullets; fall
// back to semicolons (the format the Poe recipes use inline).
function splitItems(blob) {
  const byLine = blob
    .split(/\r?\n/)
    .map((l) => l.replace(/^[•\-*·]\s*/, '').trim())
    .filter(Boolean);
  const lines = byLine.length > 1 ? byLine : [blob.trim()];
  const out = [];
  for (const line of lines) {
    if (line.includes(';')) out.push(...line.split(';').map((p) => p.trim()).filter(Boolean));
    else out.push(line);
  }
  return out.filter(Boolean);
}

// Split an instruction blob into ordered steps: strip "1)" / "1." / "Step 1:"
// markers; split on those markers or newlines or semicolons.
function splitSteps(blob) {
  let text = blob.trim();
  // If it uses inline numbered markers ("1) ... 2) ..."), split on them.
  if (/\d+[).]\s/.test(text)) {
    return text
      .split(/\s*(?:^|\s)\d+[).]\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const byLine = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const lines = byLine.length > 1 ? byLine : [text];
  const out = [];
  for (const line of lines) {
    const cleaned = line.replace(/^(?:step\s*)?\d+[).:]\s*/i, '').trim();
    if (cleaned.includes(';')) out.push(...cleaned.split(';').map((p) => p.trim()).filter(Boolean));
    else if (cleaned) out.push(cleaned);
  }
  return out;
}

// Is this line a sub-section title (e.g. "Burgers:", "Prepare the Slaw:")? A
// short line that ends with a colon and has little/no trailing content.
function asSubSectionTitle(line) {
  const m = line.match(/^(.{2,60}?):\s*(.*)$/);
  if (!m) return null;
  const title = m[1].trim();
  const trailing = m[2].trim();
  // A real sub-header is a short label with no sentence after the colon, and is
  // not itself a known meta keyword.
  if (title.split(/\s+/).length > 7) return null;
  if (META_PATTERNS.some(([, re]) => re.test(line))) return null;
  if (SECTION_HEADERS.some(([, re]) => re.test(line))) return null;
  return { title, trailing };
}

export function parseRecipeText(text) {
  const raw = String(text || '');
  const result = {
    title: '', chef: '', servings: '', prepTime: '', cookTime: '',
    ingredientSections: [], instructionSections: [],
    toppings: [], storage: '', reheating: '', chefNote: '', tags: [],
  };
  const lines = raw.split(/\r?\n/);

  let mode = 'head'; // head -> (ingredients | instructions) as headers appear
  let curIngr = null; // { title, items: [] }
  let curStep = null; // { title, steps: [] }

  const pushIngr = () => { if (curIngr && curIngr.items.length) result.ingredientSections.push(curIngr); curIngr = null; };
  const pushStep = () => { if (curStep && curStep.steps.length) result.instructionSections.push(curStep); curStep = null; };

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Title: explicit "Title:" or the first content line. A title line may carry
    // pipe-delimited meta ("Title | Servings: .. | Prep: .. | Cook: ..").
    if (!result.title) {
      const titleMatch = line.match(/^title\s*[:-]\s*(.+)$/i);
      const titleLine = titleMatch ? titleMatch[1] : line;
      const parts = titleLine.split('|').map((p) => p.trim());
      result.title = parts[0];
      for (const p of parts.slice(1)) applyMeta(p, result);
      continue;
    }

    // A "Label: value" meta line (servings/prep/cook/storage/reheating/note/...).
    // Storage + reheating sometimes share one line: "Storage: .. Reheating: ..".
    if (applyMeta(line, result)) continue;

    // Major section headers.
    const header = SECTION_HEADERS.find(([, re]) => re.test(line));
    if (header) {
      const [kind] = header;
      if (kind === 'ingredients') { pushStep(); pushIngr(); mode = 'ingredients'; curIngr = { title: null, items: [] }; continue; }
      if (kind === 'instructions') { pushIngr(); pushStep(); mode = 'instructions'; curStep = { title: null, steps: [] }; continue; }
      if (kind === 'toppings') {
        pushIngr(); pushStep(); mode = 'toppings';
        const inline = line.replace(SECTION_HEADERS[2][1], '$1').trim();
        if (inline) result.toppings.push(...splitItems(inline));
        continue;
      }
    }

    // Sub-section title within ingredients/instructions ("Burgers:", "Prepare the Slaw:").
    if (mode === 'ingredients' || mode === 'instructions') {
      const sub = asSubSectionTitle(line);
      if (sub) {
        if (mode === 'ingredients') {
          pushIngr(); curIngr = { title: sub.title, items: sub.trailing ? splitItems(sub.trailing) : [] };
        } else {
          pushStep(); curStep = { title: sub.title, steps: sub.trailing ? splitSteps(sub.trailing) : [] };
        }
        continue;
      }
    }

    // Content lines routed by mode.
    if (mode === 'ingredients') {
      if (!curIngr) curIngr = { title: null, items: [] };
      curIngr.items.push(...splitItems(line));
    } else if (mode === 'instructions') {
      if (!curStep) curStep = { title: null, steps: [] };
      curStep.steps.push(...splitSteps(line));
    } else if (mode === 'toppings') {
      result.toppings.push(...splitItems(line));
    }
  }
  pushIngr();
  pushStep();

  return makeRecipe({ ...result, toppings: result.toppings, tags: result.tags });
}

// Apply a single "Label: value" fragment to the result. Returns true if it
// matched a known meta label. Handles a combined "Storage: .. Reheating: .."
// line by splitting on an embedded "Reheating:".
function applyMeta(fragment, result) {
  const text = fragment.trim();
  if (!text) return false;

  // Combined storage + reheating on one line.
  const combo = text.match(/^storage\s*[:-]\s*(.+?)\.?\s+reheat(?:ing)?\s*[:-]\s*(.+)$/i);
  if (combo) {
    result.storage = combo[1].trim();
    // a trailing "Chef's Note:" may ride along after reheating
    const tail = combo[2].match(/^(.+?)\.?\s+(?:chef'?s?\s*note|note)\s*[:-]\s*(.+)$/i);
    if (tail) { result.reheating = tail[1].trim(); result.chefNote = tail[2].trim(); }
    else result.reheating = combo[2].trim();
    return true;
  }

  for (const [key, re] of META_PATTERNS) {
    const m = text.match(re);
    if (m) {
      const val = (m[1] || '').trim();
      if (key === 'tags') result.tags = val.split(/[,;]/).map((t) => t.trim().toLowerCase()).filter(Boolean);
      else result[key] = val;
      return true;
    }
  }
  return false;
}
