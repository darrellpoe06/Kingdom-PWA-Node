// =============================================================================
// Feature presence: every registered control still exists (DR-0726).
// =============================================================================
// Darrell 2026-10-01: "Are we making sure we're not losing features
// accidentally?" Before this, no gate asked. Seven open PRs reshaped the same
// reader surfaces at once, and a control could vanish when one restructured a
// panel and another merged on top, or when a builder "moved" a control and
// dropped it on the way. Only a test that happened to cover that exact control
// would notice.
//
// app/src/lib/feature-registry.json lists every user-facing control on the
// guarded surfaces, in plain words, with how to find it. The gate
// (__tests__/feature-presence.test.jsx) renders each surface and calls
// findFeature for every entry. A feature may leave only by moving its entry to
// `removed` with a `removedBecause` line and a DR reference, so a disappearance
// is always deliberate and visible in the diff.
//
// These helpers are pure over a DOM root (or source text), so the gate and its
// proven-to-catch test share one definition of "found".
// =============================================================================

const IMPLICIT_ROLE = {
  button: 'button',
  select: 'combobox',
  textarea: 'textbox',
  summary: 'button',
};

/** The role a person's assistive technology would announce for this element. */
export function roleOf(el) {
  const explicit = el.getAttribute && el.getAttribute('role');
  if (explicit) return explicit;
  const tag = (el.tagName || '').toLowerCase();
  if (tag === 'a') return el.hasAttribute('href') ? 'link' : '';
  if (tag === 'input') {
    const t = (el.getAttribute('type') || 'text').toLowerCase();
    if (t === 'checkbox') return 'checkbox';
    if (t === 'radio') return 'radio';
    if (t === 'range') return 'slider';
    if (t === 'file') return 'file';
    if (t === 'button' || t === 'submit') return 'button';
    return 'textbox';
  }
  return IMPLICIT_ROLE[tag] || '';
}

/** Accessible name, close enough for a presence check: aria-label, else text. */
export function nameOf(el) {
  const label = el.getAttribute && el.getAttribute('aria-label');
  if (label) return label.replace(/\s+/g, ' ').trim();
  return (el.textContent || '').replace(/\s+/g, ' ').trim();
}

const CANDIDATES = 'button,a,input,select,textarea,summary,[role]';

/**
 * Find one registered control under `root`. `find` is one of:
 *   { testid }                     data-testid, preferred
 *   { role, name }                 role + a substring of the accessible name
 *   { role, nameMatch }            role + a regular expression on the name
 *   { selector }                   a CSS selector, for an id a label points at
 * Returns the element or null.
 */
export function findFeature(root, find) {
  if (!root || !find) return null;
  if (find.testid) return root.querySelector(`[data-testid="${find.testid}"]`);
  if (find.selector) return root.querySelector(find.selector);
  if (find.role) {
    const re = find.nameMatch ? new RegExp(find.nameMatch) : null;
    for (const el of root.querySelectorAll(CANDIDATES)) {
      if (roleOf(el) !== find.role) continue;
      const n = nameOf(el);
      if (re ? re.test(n) : n.includes(find.name || '')) return el;
    }
  }
  return null;
}

/** A source pin: the shell is not renderable in jsdom (5,000+ lines, Supabase, a PIN gate). */
export function findInSource(source, find) {
  return !!(find && typeof find.source === 'string' && source.includes(find.source));
}

/** Locator kinds a registry entry may use. */
export const LOCATOR_KEYS = ['testid', 'role', 'selector', 'source'];

/**
 * Structural problems with the registry itself, as plain lines. Empty = sound.
 * Every live entry needs an id, a plain name, a known surface and one locator;
 * every removed entry needs removedBecause and a DR-#### reference.
 */
export function registryProblems(registry) {
  const out = [];
  const surfaces = (registry && registry.surfaces) || {};
  const features = (registry && registry.features) || [];
  const removed = (registry && registry.removed) || [];
  const seen = new Set();
  for (const f of [...features, ...removed]) {
    if (!f || !f.id) { out.push('An entry has no id.'); continue; }
    if (seen.has(f.id)) out.push(`Duplicate id: ${f.id}.`);
    seen.add(f.id);
    if (!f.name || !String(f.name).trim()) out.push(`${f.id} has no plain name.`);
    if (!surfaces[f.surface]) out.push(`${f.id} names an unknown surface "${f.surface}".`);
  }
  for (const f of features) {
    const kinds = LOCATOR_KEYS.filter((k) => f.find && f.find[k]);
    if (kinds.length !== 1) out.push(`${f.id} must say how to find it with exactly one of ${LOCATOR_KEYS.join(', ')}.`);
    if (f.find && f.find.role && !f.find.name && !f.find.nameMatch) out.push(`${f.id} gives a role without a name.`);
    if (f.removedBecause) out.push(`${f.id} carries removedBecause but is still listed as live; move it to "removed".`);
  }
  for (const f of removed) {
    if (!f.removedBecause || !String(f.removedBecause).trim()) out.push(`${f.id} was removed without a removedBecause line.`);
    if (!/^DR-\d{4}$/.test(f.dr || '')) out.push(`${f.id} was removed without a DR reference (dr: "DR-####").`);
  }
  return out;
}

/** "Missing: Give (footer bar), Copy link (lesson header)" or '' when nothing is missing. */
export function missingReport(missing, surfaces) {
  if (!missing.length) return '';
  return 'Missing: ' + missing
    .map((f) => `${f.name} (${(surfaces[f.surface] && surfaces[f.surface].name) || f.surface})`)
    .join(', ');
}
