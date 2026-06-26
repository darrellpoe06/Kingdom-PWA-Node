// chefs-corner — the pure recipe engine: model, paste-import parser, scaling.
// Verification doctrine: the parser's correctness is PROVEN here, not claimed.
import { describe, it, expect } from 'vitest';
import {
  makeRecipe, parseRecipeText, parseLeadingQuantity, formatQuantity,
  scaleIngredientText, scaleRecipe, servingsBaseOf, ingredientCount, stepCount,
  slugify,
} from '../lib/chefs-corner.js';
import { POE_FAMILY_RECIPES } from '../lib/chefs-corner-recipes.js';

describe('makeRecipe — normalizes to the canonical shape', () => {
  it('fills sensible defaults and drops empty sections', () => {
    const r = makeRecipe({
      title: '  Test Dish  ',
      ingredientSections: [{ title: 'A', items: ['x', '', '  '] }, { title: 'Empty', items: [] }],
      instructionSections: [{ title: null, steps: ['do it'] }, { steps: [] }],
    });
    expect(r.title).toBe('Test Dish');
    expect(r.chef).toBe('Chef Mario');
    expect(r.tags).toEqual(['vegan']);
    expect(r.ingredientSections).toEqual([{ title: 'A', items: ['x'] }]);
    expect(r.instructionSections).toEqual([{ title: null, steps: ['do it'] }]);
    expect(r.id).toBe(slugify('Test Dish'));
  });

  it('derives servingsBase from a range (the upper bound)', () => {
    expect(servingsBaseOf('4–6')).toBe(6);
    expect(servingsBaseOf('Serves 8')).toBe(8);
    expect(servingsBaseOf('')).toBe(0);
  });
});

describe('quantity parsing + scaling', () => {
  it('parses integers, decimals, ascii + unicode + mixed fractions', () => {
    expect(parseLeadingQuantity('2 lbs mushrooms')).toEqual({ value: 2, rest: 'lbs mushrooms' });
    expect(parseLeadingQuantity('1.5 cups stock')).toEqual({ value: 1.5, rest: 'cups stock' });
    expect(parseLeadingQuantity('1/2 cup oil')).toEqual({ value: 0.5, rest: 'cup oil' });
    expect(parseLeadingQuantity('½ cup butter')).toEqual({ value: 0.5, rest: 'cup butter' });
    expect(parseLeadingQuantity('1 ½ cups flour')).toEqual({ value: 1.5, rest: 'cups flour' });
    expect(parseLeadingQuantity('Salt, to taste')).toBeNull();
  });

  it('formats numbers back to friendly cooking quantities', () => {
    expect(formatQuantity(1)).toBe('1');
    expect(formatQuantity(0.5)).toBe('½');
    expect(formatQuantity(1.5)).toBe('1 ½');
    expect(formatQuantity(0.25)).toBe('¼');
  });

  it('scales the leading quantity, leaves un-quantified lines alone', () => {
    expect(scaleIngredientText('½ cup vegan butter', 2)).toBe('1 cup vegan butter');
    expect(scaleIngredientText('¼ cup mustard', 2)).toBe('½ cup mustard');
    expect(scaleIngredientText('3 bell peppers, diced (any color)', 2)).toBe('6 bell peppers, diced (any color)');
    expect(scaleIngredientText('Salt, to taste', 2)).toBe('Salt, to taste');
    expect(scaleIngredientText('1 box pasta', 1)).toBe('1 box pasta'); // factor 1 = no-op
  });

  it('scaleRecipe scales every ingredient across every section', () => {
    const r = makeRecipe({
      title: 'X',
      ingredientSections: [
        { title: 'Sauce', items: ['1 cup mayo', 'Salt'] },
        { title: 'Base', items: ['½ cup ketchup'] },
      ],
      instructionSections: [{ title: null, steps: ['mix'] }],
    });
    const scaled = scaleRecipe(r, 2);
    expect(scaled.ingredientSections[0].items).toEqual(['2 cup mayo', 'Salt']);
    expect(scaled.ingredientSections[1].items).toEqual(['1 cup ketchup']);
    // steps are never scaled
    expect(scaled.instructionSections).toEqual(r.instructionSections);
  });
});

describe('parseRecipeText — plain text becomes structured fields (no JSON)', () => {
  it('parses a single-section recipe with pipe-meta title and numbered steps', () => {
    const text = [
      'Vegan Mushroom & Vegetable Protein Pasta | Servings: 4–6 | Prep: 15 min | Cook: 25 min',
      '',
      'Ingredients',
      '1 box pasta (penne, spaghetti, linguine, or preferred); 2 lbs mushrooms, sliced; ½ cup vegan butter; Salt, to taste',
      '',
      'Instructions',
      '1) Boil pasta per package directions. 2) Melt vegan butter over medium heat. 3) Serve immediately.',
      '',
      'Storage: airtight container in fridge up to 4 days. Reheating: skillet over medium heat with a splash of water.',
      "Chef's Note: Hearty vegan pasta.",
    ].join('\n');
    const r = parseRecipeText(text);
    expect(r.title).toBe('Vegan Mushroom & Vegetable Protein Pasta');
    expect(r.servings).toBe('4–6');
    expect(r.prepTime).toBe('15 min');
    expect(r.cookTime).toBe('25 min');
    expect(r.ingredientSections).toHaveLength(1);
    expect(r.ingredientSections[0].items).toEqual([
      '1 box pasta (penne, spaghetti, linguine, or preferred)',
      '2 lbs mushrooms, sliced',
      '½ cup vegan butter',
      'Salt, to taste',
    ]);
    expect(r.instructionSections[0].steps).toEqual([
      'Boil pasta per package directions.',
      'Melt vegan butter over medium heat.',
      'Serve immediately.',
    ]);
    expect(r.storage).toBe('airtight container in fridge up to 4 days');
    expect(r.reheating).toBe('skillet over medium heat with a splash of water.');
    expect(r.chefNote).toBe('Hearty vegan pasta.');
  });

  it('parses SECTIONED ingredients and SECTIONED steps (the cheeseburger shape)', () => {
    const text = [
      'Vegan Cheeseburgers with Purple Cabbage Slaw & House Burger Sauce',
      'Servings: 4–6',
      'Prep: 20 min',
      'Cook: 15 min',
      'Ingredients',
      'Burgers: 4–6 vegan burger patties; 4–6 slices vegan cheese; 4–6 burger buns',
      'House Burger Sauce: 1 cup vegan mayonnaise; ½ cup ketchup; ½ cup mustard',
      'Purple Cabbage Slaw: 1 small head purple cabbage, thinly sliced; ¼ cup pickle juice',
      'Instructions',
      'Prepare the Slaw: combine cabbage and onion; add pickle juice, season; toss and refrigerate.',
      'Make the Burger Sauce: combine mayo, ketchup, mustard; mix smooth; refrigerate.',
      'Assemble: spread sauce on buns; add patty; serve immediately.',
    ].join('\n');
    const r = parseRecipeText(text);
    expect(r.ingredientSections.map((s) => s.title)).toEqual(['Burgers', 'House Burger Sauce', 'Purple Cabbage Slaw']);
    expect(r.ingredientSections[0].items).toEqual(['4–6 vegan burger patties', '4–6 slices vegan cheese', '4–6 burger buns']);
    expect(r.ingredientSections[1].items[1]).toBe('½ cup ketchup');
    expect(r.instructionSections.map((s) => s.title)).toEqual(['Prepare the Slaw', 'Make the Burger Sauce', 'Assemble']);
    expect(r.instructionSections[0].steps).toEqual(['combine cabbage and onion', 'add pickle juice, season', 'toss and refrigerate.']);
    expect(r.instructionSections[2].steps).toEqual(['spread sauce on buns', 'add patty', 'serve immediately.']);
  });

  it('parses optional toppings', () => {
    const text = [
      'Vegan Tacos',
      'Ingredients',
      '8 flour tortillas; 2 tbsp vegan butter',
      'Instructions',
      'Warm tortillas; add filling; fold.',
      'Optional Toppings: shredded lettuce; avocado; salsa; fresh cilantro',
    ].join('\n');
    const r = parseRecipeText(text);
    expect(r.toppings).toEqual(['shredded lettuce', 'avocado', 'salsa', 'fresh cilantro']);
  });
});

describe('POE_FAMILY_RECIPES — the real canonical content is intact', () => {
  it('ships exactly the three Poe Family recipes, all by Chef Mario, all vegan', () => {
    expect(POE_FAMILY_RECIPES).toHaveLength(3);
    for (const r of POE_FAMILY_RECIPES) {
      expect(r.chef).toBe('Chef Mario');
      expect(r.collection).toBe('poe-family-vegan');
      expect(r.tags).toContain('vegan');
      expect(r.dateAdded).toBe('2026-06-25');
      expect(ingredientCount(r)).toBeGreaterThan(0);
      expect(stepCount(r)).toBeGreaterThan(0);
    }
  });

  it('preserves the cheeseburger sectioned ingredients AND sectioned steps', () => {
    const burger = POE_FAMILY_RECIPES.find((r) => r.title.startsWith('Vegan Cheeseburgers'));
    expect(burger).toBeTruthy();
    expect(burger.ingredientSections.map((s) => s.title)).toEqual(['Burgers', 'House Burger Sauce', 'Purple Cabbage Slaw']);
    expect(burger.instructionSections.map((s) => s.title)).toEqual([
      'Prepare the Slaw', 'Make the Burger Sauce', 'Cook the Burgers', 'Toast the Buns', 'Assemble',
    ]);
  });

  it('keeps the tacos toppings list', () => {
    const tacos = POE_FAMILY_RECIPES.find((r) => r.title.includes('Tacos'));
    expect(tacos.toppings).toContain('Avocado');
    expect(tacos.toppings).toContain('Fresh cilantro');
    expect(tacos.ingredientSections.map((s) => s.title)).toEqual(['Vegan Taco Filling', 'Taco Assembly']);
  });
});
