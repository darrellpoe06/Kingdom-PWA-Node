// =============================================================================
// kitchen-taxonomy — the chef-first vocabulary for the kitchen inventory vertical
// =============================================================================
// The chef/kitchen inventory app is the rich VERTICAL on the systems-of-record
// inventory base (lib/inventory.js, migration 0052). That base is domain-neutral:
// an item carries a free-text `category`, a `location`, a stock `unit`, a
// `reorderPoint`, and a `unitCost`. This module supplies the KITCHEN meaning of
// those columns — the standard categories a chef organizes by (proteins,
// produce, dairy, dry goods, frozen, beverages, ...), the storage AREAS a
// kitchen counts by (walk-in, freezer, dry storage, the line, the bar), and the
// stock UNITS a kitchen uses (each / case for count, lb / oz for weight, gal /
// qt for volume).
//
// Taxonomy lives here as plain config (not DB rows) for this increment: an item
// just stores the chosen category id / storage-area id in its existing columns,
// so no migration is needed to add a category and the values stay queryable by
// the base inventory engine. Dedicated vendor / storage-area / par-level tables
// are the productization roadmap (see docs/kitchen-inventory/PRD.md).
//
// Pure + dependency-free. No emoji as load-bearing UI (consistency-guard): labels
// are text; the surface draws chrome with UiIcon.
// =============================================================================

// Standard kitchen categories. `id` is the stable value stored on the item's
// `category` column; `label` is what the chef reads.
export const KITCHEN_CATEGORIES = [
  { id: 'proteins',          label: 'Proteins' },
  { id: 'produce',           label: 'Produce' },
  { id: 'dairy',             label: 'Dairy & Eggs' },
  { id: 'dry-goods',         label: 'Dry Goods' },
  { id: 'frozen',            label: 'Frozen' },
  { id: 'beverages',         label: 'Beverages' },
  { id: 'bakery',            label: 'Bakery & Baking' },
  { id: 'condiments',        label: 'Condiments & Sauces' },
  { id: 'spices',            label: 'Spices & Seasonings' },
  { id: 'paper-disposables', label: 'Paper & Disposables' },
  { id: 'cleaning',          label: 'Cleaning & Chemicals' },
  { id: 'smallwares',        label: 'Smallwares & Equipment' },
];

// Storage areas a kitchen physically counts by. `id` is stored on the item's
// `location` column and is the scope a count session can be narrowed to.
export const STORAGE_AREAS = [
  { id: 'walk-in',     label: 'Walk-in Cooler' },
  { id: 'freezer',     label: 'Freezer' },
  { id: 'dry-storage', label: 'Dry Storage' },
  { id: 'line',        label: 'The Line' },
  { id: 'prep',        label: 'Prep Area' },
  { id: 'bar',         label: 'Bar' },
];

// Stock units grouped by the dimension they measure, so the count UI offers the
// right ones and can default the count MODE (a weight unit -> weigh it; a count
// unit -> tally it). These mirror the dimensions lib/recipe-units.js converts in.
export const KITCHEN_UNITS = Object.freeze({
  count:  ['each', 'case', 'box', 'bag', 'can', 'jar', 'bottle', 'dozen', 'pack'],
  weight: ['lb', 'oz', 'kg', 'g'],
  volume: ['gal', 'qt', 'pt', 'cup', 'floz', 'l', 'ml'],
});

export const ALL_KITCHEN_UNITS = [
  ...KITCHEN_UNITS.count,
  ...KITCHEN_UNITS.weight,
  ...KITCHEN_UNITS.volume,
];

const CATEGORY_BY_ID = Object.fromEntries(KITCHEN_CATEGORIES.map((c) => [c.id, c]));
const AREA_BY_ID = Object.fromEntries(STORAGE_AREAS.map((a) => [a.id, a]));

// categoryLabel — display label for a stored category id; falls back to the raw
// value (so a legacy / custom free-text category still reads sensibly) or a dash.
export function categoryLabel(id) {
  if (!id) return 'Uncategorized';
  return CATEGORY_BY_ID[id]?.label || id;
}

// storageAreaLabel — display label for a stored storage-area id; same fallback.
export function storageAreaLabel(id) {
  if (!id) return 'Unassigned';
  return AREA_BY_ID[id]?.label || id;
}

// modeForUnit — the natural count MODE for a unit: a weight unit is weighed,
// everything else (count + volume) is tallied/measured as a unit. Drives the
// default of the count sheet's mode toggle; the chef can always override.
export function modeForUnit(unit) {
  return KITCHEN_UNITS.weight.includes(String(unit || '').toLowerCase()) ? 'weight' : 'unit';
}

// dimensionForUnit — 'weight' | 'volume' | 'count' for a unit, or 'count' when
// unknown. Lets the surface group units and (future) wire recipe-units conversion.
export function dimensionForUnit(unit) {
  const u = String(unit || '').toLowerCase();
  if (KITCHEN_UNITS.weight.includes(u)) return 'weight';
  if (KITCHEN_UNITS.volume.includes(u)) return 'volume';
  return 'count';
}

// =============================================================================
// MODULE CONFIG — the InventoryModule (components/KitchenInventory.jsx) is a
// REUSABLE inventory module: it takes a `config` of taxonomy + copy and renders
// the same Stock + Counts workflow for ANY context. KITCHEN_CONFIG is the chef
// preset that homes the module inside Chef's Corner; a different surface (church
// AV gear, business assets) mounts the SAME module with its own config.
//
// Shape: { key, title, eyebrow, intro, itemNoun, areaNoun, parNoun, emptyHint,
//          categories:[{id,label}], storageAreas:[{id,label}], units:[string] }
// =============================================================================
export const KITCHEN_CONFIG = Object.freeze({
  key: 'kitchen',
  title: 'Kitchen Inventory',
  eyebrow: 'Chef Mario · count by weight or unit · value + variance, derived',
  intro: 'Built for a busy kitchen. Every on-hand and dollar figure is derived from the stock ledger — never typed. Run a count by weight or unit and the system shows your variance and its value live; closing the count reconciles the books to the shelf. It tracks cost and value; it never touches the till.',
  itemNoun: 'item',
  areaNoun: 'storage area',
  parNoun: 'par',
  emptyHint: "Add your first item (a protein, a produce case, a dry good) with its par level and unit cost, post an opening count — on-hand builds from there.",
  categories: KITCHEN_CATEGORIES,
  storageAreas: STORAGE_AREAS,
  units: ALL_KITCHEN_UNITS,
});

// Example of mounting the SAME module in a DIFFERENT context (not wired here —
// it documents the reuse seam the church AV / business-assets surfaces will use):
//   <KitchenInventory config={AV_GEAR_CONFIG} items={...} .../>
// where AV_GEAR_CONFIG swaps categories (Audio/Video/Lighting/Cabling), areas
// (Booth/Stage/Storage), units (each/case/ft), and the copy. Same Stock+Counts
// engine, same derived on-hand + variance — different vocabulary.
