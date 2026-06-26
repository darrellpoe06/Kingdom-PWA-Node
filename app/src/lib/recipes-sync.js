// =============================================================================
// recipes-sync — cross-device sync for the Chef's Corner `recipes` table
// =============================================================================
// A recipe Mario adds on one device opens, unchanged, on every family device —
// the same proven table-sync path creation_workspaces / projects / discussions
// ride. Built on the generic createTableSync + unionPreservingLocal helpers.
//
// The three canonical Poe Family recipes live in lib/chefs-corner-recipes.js as
// version-controlled content (never stripped); THIS layer carries everything
// ADDED afterward — the Add Recipe form and the paste-import — as real, persisted
// rows. Structured fields (sectioned ingredients, sectioned steps, toppings,
// tags) are stored as jsonb, the same way creation_workspaces stores `meta`.
//
// Local shape (the canonical recipe object from chefs-corner.js makeRecipe):
//   { id, title, chef, collection, servings, servingsBase, prepTime, cookTime,
//     ingredientSections[], instructionSections[], toppings[]|null, storage,
//     reheating, chefNote, tags[], dateAdded, remoteUuid?, createdBy?,
//     createdAt?, updatedAt? }
// Remote shape (0052 recipes row): jsonb for the structured arrays; text columns
// for the scalars.
// =============================================================================
import { createTableSync, unionPreservingLocal } from './table-sync.js';

// Exported (named) so the mapping is unit-testable on its own — createTableSync's
// controller does not re-expose toRow/fromRow.
export function recipeToRow(item, { tenantId, userId }) {
  return {
    instance_id:          tenantId,
    created_by:           userId,
    slug:                 item.id,
    title:                item.title ?? 'Untitled Recipe',
    chef:                 item.chef ?? null,
    collection:           item.collection ?? 'poe-family-vegan',
    servings:             item.servings ?? '',
    servings_base:        Number.isFinite(item.servingsBase) ? item.servingsBase : 0,
    prep_time:            item.prepTime ?? '',
    cook_time:            item.cookTime ?? '',
    ingredient_sections:  Array.isArray(item.ingredientSections) ? item.ingredientSections : [],
    instruction_sections: Array.isArray(item.instructionSections) ? item.instructionSections : [],
    toppings:             Array.isArray(item.toppings) ? item.toppings : [],
    storage:              item.storage ?? '',
    reheating:            item.reheating ?? '',
    chef_note:            item.chefNote ?? '',
    tags:                 Array.isArray(item.tags) ? item.tags : ['vegan'],
    date_added:           item.dateAdded ?? null,
  };
}

export function recipeFromRow(row) {
  return {
    id:                  row.slug ?? `recipe-remote-${row.id}`,
    remoteUuid:          row.id,
    tenantId:            row.instance_id,
    createdBy:           row.created_by ?? null,
    title:               row.title ?? 'Untitled Recipe',
    chef:                row.chef ?? 'Chef Mario',
    collection:          row.collection ?? 'poe-family-vegan',
    servings:            row.servings ?? '',
    servingsBase:        Number.isFinite(row.servings_base) ? row.servings_base : 0,
    prepTime:            row.prep_time ?? '',
    cookTime:            row.cook_time ?? '',
    ingredientSections:  Array.isArray(row.ingredient_sections) ? row.ingredient_sections : [],
    instructionSections: Array.isArray(row.instruction_sections) ? row.instruction_sections : [],
    toppings:            Array.isArray(row.toppings) && row.toppings.length ? row.toppings : null,
    storage:             row.storage ?? '',
    reheating:           row.reheating ?? '',
    chefNote:            row.chef_note ?? '',
    tags:                Array.isArray(row.tags) && row.tags.length ? row.tags : ['vegan'],
    dateAdded:           row.date_added ?? null,
    createdAt:           row.created_at,
    updatedAt:           row.updated_at,
  };
}

export const recipesSync = createTableSync({
  localKey: 'recipes',
  remoteTable: 'recipes',
  toRow: recipeToRow,
  fromRow: recipeFromRow,
  idOf: (item) => item.id,
});

// Map a local field name to its `recipes` column, for the monolith's
// updateRecipe patch builder (mirrors WORKSPACE_COLUMN_OF). Only editable
// columns; instance_id / created_by / slug are never patched.
export const RECIPE_COLUMN_OF = {
  title:               'title',
  chef:                'chef',
  collection:          'collection',
  servings:            'servings',
  servingsBase:        'servings_base',
  prepTime:            'prep_time',
  cookTime:            'cook_time',
  ingredientSections:  'ingredient_sections',
  instructionSections: 'instruction_sections',
  toppings:            'toppings',
  storage:             'storage',
  reheating:           'reheating',
  chefNote:            'chef_note',
  tags:                'tags',
  dateAdded:           'date_added',
};

// Field-preserving merge for a realtime refetch (same contract as
// mergeRemoteWorkspaces): the cloud is authoritative for synced rows, then keep
// any never-uploaded local-only record (non-UUID id) so a recipe added offline
// is not dropped by the first refetch.
export function mergeRemoteRecipes(currentLocal, incoming) {
  return unionPreservingLocal(currentLocal, incoming || []);
}
