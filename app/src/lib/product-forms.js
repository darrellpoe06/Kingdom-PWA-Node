// =============================================================================
// product-forms — every product's forms and documents, on one engine (DR-0357)
// =============================================================================
// Darrell 2026-09-11: "Create the same type of intake forms for PoeTech and
// Poe Properties Apps... however make sure they fit the requirements of the
// product it claims to be... each has their own databases so each can work
// independently and together as our Ways and documentation state."
//
// This is the registry. Each product names the forms and documents its own
// office may edit, the ORIGINAL the code ships for each, and the floor that
// can never be un-required. The engine (lib/forms-engine.js) does the rest,
// exactly as it does for TLC.
//
// "ITS OWN DATABASE", precisely: every row the engine writes carries an
// `instance_id`, and RLS on that column is the wall (DR-0060). A product's
// forms therefore live in whichever INSTANCE runs that product — TLC's in
// `tlc-therapy-solutions`, the household's in the family instance, the
// landlord's in whatever instance holds its doors. Nothing here assumes the
// products share one; nothing here forces them apart. That is what lets them
// work independently and together.
//
// A STANDING TRUTH, recorded rather than papered over (DR-0076): as of
// 2026-09-11 the live database holds no `landlord` instance — Poe Properties'
// 12 doors sit in the `poe-family` instance, because DR-0313 deliberately
// decided one module behind two doors. So the properties forms resolve through
// whatever instance the caller's doors are in, and the day a landlord instance
// is created (a tenancy decision, Tier B/C, the Governor's) this registry
// needs no edit at all.
//
// Pure: no React, no network.
// =============================================================================
import {
  defaultForm, normalizeForm, validateForm, liveSections, requiredCustomKeys,
  normalizeAgreement, validateAgreement, resolveProductForms, clone,
} from './forms-engine.js';
import { HOUSEHOLD_SECTIONS, HOUSEHOLD_FLOOR } from './household-intake.js';
import { HOUSEHOLD_COVENANT } from './household-covenant.js';
import { RENTAL_CRITERIA, FAIR_HOUSING_STATEMENT } from './properties-documents.js';
import { APPLICATION_SECTIONS } from '../modules/properties/intake.js';

// ---------------------------------------------------------------------------
// POE PROPERTIES — the application that already exists, on the engine
// ---------------------------------------------------------------------------
// The rental application was transcribed field-for-field from the family's own
// paper form and is live on the door (modules/properties/intake.js). It was
// CODE-ONLY: nobody could change a word of it without a deploy. Converting it
// here gives the landlord the same control the office has over the TLC intake,
// and loses nothing — the conversion keeps every app-collected field, its
// label, its kind and its required flag, and DROPS exactly the fields the app
// refuses to hold (`collect: 'out-of-band'`, the SSN and the licence number)
// and the ones the app already knows (`collect: 'derived'`, the door and the
// rent). A dropped field cannot be re-added by editing the form: the engine
// only ever renders what the ORIGINAL defines plus the office's own additions.

/** intake.js kinds → the kinds the shared form components render. */
const PROPERTY_TYPE_MAP = Object.freeze({
  text: 'text', longtext: 'textarea', date: 'date', tel: 'tel', email: 'email',
  yesno: 'yesno', money: 'text', people: 'text',
});

/** The application as engine sections: app-collected fields only. */
export function rentalApplicationSections(sections = APPLICATION_SECTIONS) {
  const out = [];
  for (const s of sections) {
    const fields = (s.fields || [])
      .filter((f) => f.collect === 'app' && PROPERTY_TYPE_MAP[f.type])
      .map((f) => ({
        key: `${s.id}.${f.id}`,
        type: PROPERTY_TYPE_MAP[f.type],
        label: f.label,
        required: !!f.required,
        ...(f.help ? { help: f.help } : {}),
      }));
    if (fields.length) out.push({ id: s.id, title: s.title, blurb: s.note || '', fields });
  }
  return out;
}

export const RENTAL_APPLICATION_SECTIONS = Object.freeze(rentalApplicationSections());

/** The answers a landlord cannot act on an application without. */
export const RENTAL_APPLICATION_FLOOR = Object.freeze(
  RENTAL_APPLICATION_SECTIONS.flatMap((s) => s.fields.filter((f) => f.required).map((f) => f.key)),
);

// ---------------------------------------------------------------------------
// THE REGISTRY
// ---------------------------------------------------------------------------

/**
 * @typedef {object} ProductForm
 * @property {'form'|'document'} kind
 * @property {string} label      what the editor's tab says
 * @property {string} purpose    why this document exists, in one line
 * @property {Array}  [sections] a form's ORIGINAL questions
 * @property {Array}  [floor]    keys that stay required and never hide
 * @property {object} [original] a document's ORIGINAL words
 */

export const PRODUCTS = Object.freeze({
  poetech: {
    key: 'poetech',
    label: 'PoeTech · the household',
    // The household's own instance. A family instance is the shell's default
    // instance for its members, so no new resolver is needed.
    instanceTypes: ['family'],
    forms: {
      'household-intake': {
        kind: 'form', label: 'Household record · the questions',
        purpose: 'What this app needs to know to serve this household, and nothing else.',
        sections: HOUSEHOLD_SECTIONS, floor: HOUSEHOLD_FLOOR,
      },
      'household-covenant': {
        kind: 'document', label: 'Household Covenant',
        purpose: 'What the record is, who sees it, what we will never do with it, and what we have not built.',
        original: HOUSEHOLD_COVENANT,
      },
    },
  },
  properties: {
    key: 'properties',
    label: 'Poe Properties · the application',
    // Today: whichever instance holds the doors (poe-family, live). The day a
    // landlord instance exists, this list is where it is named — and nothing
    // else about the engine changes.
    instanceTypes: ['landlord', 'family'],
    forms: {
      'rental-application': {
        kind: 'form', label: 'Rental application · the questions',
        purpose: 'The application every adult 18 or older fills out, as the office asks it.',
        sections: RENTAL_APPLICATION_SECTIONS, floor: RENTAL_APPLICATION_FLOOR,
      },
      'rental-criteria': {
        kind: 'document', label: 'What we look at in an application',
        purpose: 'The documented, consistent criteria every application is judged by (DR-0101).',
        original: RENTAL_CRITERIA,
      },
      'fair-housing': {
        kind: 'document', label: 'How we choose, and how we do not',
        purpose: 'The fair-housing commitment and the applicant’s rights, in writing.',
        original: FAIR_HOUSING_STATEMENT,
      },
    },
  },
});

export const PRODUCT_KEYS = Object.freeze(Object.keys(PRODUCTS));

export function productDef(product) {
  return PRODUCTS[product] || null;
}

export function productFormKeys(product) {
  const p = productDef(product);
  return p ? Object.freeze(Object.keys(p.forms)) : Object.freeze([]);
}

function formDef(product, key) {
  const p = productDef(product);
  return (p && p.forms[key]) || null;
}

/** The ORIGINAL body for one of a product's forms or documents. */
export function originalFor(product, key) {
  const d = formDef(product, key);
  if (!d) return null;
  return d.kind === 'form' ? defaultForm(d.sections, { floor: d.floor || [] }) : clone(d.original);
}

/** A saved body merged onto the original — never less, never broken. */
export function normalizeFor(product, key, body) {
  const d = formDef(product, key);
  if (!d) return null;
  return d.kind === 'form' ? normalizeForm(d.sections, body, { floor: d.floor || [] }) : normalizeAgreement(d.original, body);
}

/** What is wrong with a body about to be saved. Empty = nothing. */
export function validateFor(product, key, body) {
  const d = formDef(product, key);
  if (!d) return ['unknown form'];
  return d.kind === 'form' ? validateForm(d.sections, body, { floor: d.floor || [] }) : validateAgreement(body);
}

/** The sections a product's form RENDERS, under the office's live words. */
export function liveSectionsFor(product, key, body) {
  const d = formDef(product, key);
  if (!d || d.kind !== 'form') return [];
  return liveSections(d.sections, body, { floor: d.floor || [] });
}

/** The keys the office marked required beyond the floor. */
export function requiredCustomKeysFor(product, key, body) {
  const d = formDef(product, key);
  if (!d || d.kind !== 'form') return [];
  return requiredCustomKeys(d.sections, body, { floor: d.floor || [] });
}

/**
 * Live-or-original for a whole product: hand it the rows the office saved,
 * get back every form and document with its version (0 = never saved).
 */
export function resolveProduct(product, read) {
  const p = productDef(product);
  if (!p) return {};
  const registry = {};
  for (const [key, d] of Object.entries(p.forms)) {
    registry[key] = d.kind === 'form'
      ? { kind: 'form', sections: d.sections, floor: d.floor || [] }
      : { kind: 'document', original: d.original };
  }
  return resolveProductForms(read, registry);
}

/** The ORIGINAL set for a product, as the app ships it (version 0 everywhere). */
export function originalProduct(product) {
  return resolveProduct(product, null);
}
