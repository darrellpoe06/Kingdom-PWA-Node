// recipes-sync — the local<->row mapping for the Chef's Corner `recipes` table.
// Pure functions; no network. Proves a recipe round-trips through the cloud row
// shape with its sectioned structure intact (the persistence requirement).
import { describe, it, expect } from 'vitest';
import { recipeToRow, recipeFromRow, RECIPE_COLUMN_OF, mergeRemoteRecipes } from '../lib/recipes-sync.js';
import { makeRecipe } from '../lib/chefs-corner.js';

const SAMPLE = makeRecipe({
  id: 'recipe-test-burger',
  title: 'Test Burger',
  chef: 'Chef Mario',
  servings: '4–6',
  servingsBase: 6,
  prepTime: '20 min',
  cookTime: '15 min',
  ingredientSections: [
    { title: 'Burgers', items: ['4 patties', '4 buns'] },
    { title: 'Sauce', items: ['1 cup mayo'] },
  ],
  instructionSections: [
    { title: 'Assemble', steps: ['spread sauce', 'add patty'] },
  ],
  toppings: ['lettuce', 'tomato'],
  storage: 'fridge 4 days',
  reheating: 'skillet',
  chefNote: 'tasty',
  tags: ['vegan'],
  dateAdded: '2026-06-25',
});

describe('recipeToRow — carries the tenant + author + structured jsonb', () => {
  it('includes instance_id, created_by and slug (RLS + idempotent upsert key)', () => {
    const row = recipeToRow(SAMPLE, { tenantId: 'inst-1', userId: 'user-1' });
    expect(row.instance_id).toBe('inst-1');
    expect(row.created_by).toBe('user-1');
    expect(row.slug).toBe('recipe-test-burger');
  });

  it('maps the sectioned arrays to their jsonb columns', () => {
    const row = recipeToRow(SAMPLE, { tenantId: 'inst-1', userId: 'user-1' });
    expect(row.ingredient_sections).toEqual(SAMPLE.ingredientSections);
    expect(row.instruction_sections).toEqual(SAMPLE.instructionSections);
    expect(row.toppings).toEqual(['lettuce', 'tomato']);
    expect(row.servings_base).toBe(6);
    expect(row.chef_note).toBe('tasty');
  });
});

describe('recipeFromRow — a cloud row becomes a canonical recipe object', () => {
  it('round-trips toRow -> fromRow with sectioned structure intact', () => {
    const row = recipeToRow(SAMPLE, { tenantId: 'inst-1', userId: 'user-1' });
    const back = recipeFromRow({ ...row, id: 'uuid-123', created_at: '2026-06-25T00:00:00Z' });
    expect(back.id).toBe('recipe-test-burger'); // slug becomes the stable local id
    expect(back.remoteUuid).toBe('uuid-123');
    expect(back.ingredientSections).toEqual(SAMPLE.ingredientSections);
    expect(back.instructionSections).toEqual(SAMPLE.instructionSections);
    expect(back.toppings).toEqual(['lettuce', 'tomato']);
    expect(back.chef).toBe('Chef Mario');
    expect(back.servingsBase).toBe(6);
  });

  it('toppings normalizes to null when empty (UI hides the block)', () => {
    const back = recipeFromRow({ slug: 'r', title: 'R', toppings: [], ingredient_sections: [], instruction_sections: [] });
    expect(back.toppings).toBeNull();
    expect(back.tags).toEqual(['vegan']);
  });
});

describe('RECIPE_COLUMN_OF — every editable local field maps to a column', () => {
  it('covers the structured fields used by the update patch builder', () => {
    expect(RECIPE_COLUMN_OF.ingredientSections).toBe('ingredient_sections');
    expect(RECIPE_COLUMN_OF.instructionSections).toBe('instruction_sections');
    expect(RECIPE_COLUMN_OF.chefNote).toBe('chef_note');
    // never patch identity columns
    expect(RECIPE_COLUMN_OF.id).toBeUndefined();
  });
});

describe('mergeRemoteRecipes — preserves a local-only recipe through a cloud refetch', () => {
  it('keeps a not-yet-uploaded local recipe (non-UUID id) when the cloud list arrives', () => {
    const local = [{ id: 'recipe-local-new', title: 'Local' }];
    const remote = [{ id: '11111111-1111-1111-1111-111111111111', title: 'Cloud' }];
    const merged = mergeRemoteRecipes(local, remote);
    expect(merged.map((r) => r.title).sort()).toEqual(['Cloud', 'Local']);
  });
});
