// =============================================================================
// chefs-corner-recipes — the canonical Poe Family Vegan Recipes, by Chef Mario
// =============================================================================
// REAL DATA, not strippable demo seed. These are the family's actual recipes,
// contributed by Chef Mario as he moves out of town — version-controlled here so
// they can NEVER be lost, stripped, or "reset to demo". They always render
// (offline, signed-out, fresh device) the same proven way the Scripture KJV text
// and the Living Lessons content ship as version-controlled constants.
//
// User-/Mario-added recipes (the Add Recipe form + paste-import) persist to the
// shared backend (the `recipes` table via lib/recipes-sync.js), sync across
// devices, and survive refresh. The component renders canonical ∪ cloud, deduped
// by id — so this file is the immutable starting collection and the backend
// carries everything added afterward. Honest split: precious content is in git;
// living additions are in the persisted, synced backend.
//
// Transcribed verbatim from Chef Mario's source. The sectioned ingredients and
// sectioned, ordered steps are preserved exactly (Burgers / House Burger Sauce /
// Purple Cabbage Slaw, etc.).
// =============================================================================
import { makeRecipe } from './chefs-corner.js';

const DATE_ADDED = '2026-06-25';

const RAW_RECIPES = [
  // ── Recipe 1 ──────────────────────────────────────────────────────────────
  {
    id: 'recipe-poe-mushroom-vegetable-protein-pasta',
    title: 'Vegan Mushroom & Vegetable Protein Pasta',
    chef: 'Chef Mario',
    servings: '4–6',
    prepTime: '15 min',
    cookTime: '25 min',
    ingredientSections: [
      {
        title: null,
        items: [
          '1 box pasta (penne, spaghetti, linguine, or preferred)',
          '4 bags vegan protein crumbles (or preferred vegan ground meat substitute)',
          '2 lbs mushrooms, sliced',
          '1 large onion, diced',
          '3 bell peppers, diced (any color)',
          '4 cloves garlic, minced',
          '½ cup vegan butter',
          '¼ cup mustard',
          '¼ cup ketchup',
          '2 tomatoes, diced',
          'Salt, to taste',
          'Black pepper, to taste',
        ],
      },
    ],
    instructionSections: [
      {
        title: null,
        steps: [
          'Bring a large pot of salted water to a boil and cook pasta per package directions. Drain and set aside.',
          'In a large skillet/sauté pan, melt vegan butter over medium heat.',
          'Add onions and peppers; cook 5–7 min until softened.',
          'Add mushrooms; cook until they release moisture and begin to brown, ~8–10 min.',
          'Add vegan protein crumbles; cook until heated through and lightly browned.',
          'Stir in garlic; cook 1 min until fragrant.',
          'Add mustard, ketchup, diced tomatoes; stir and cook 3–5 min.',
          'Season with salt and pepper.',
          'Add cooked pasta; toss until coated.',
          'Serve immediately.',
        ],
      },
    ],
    storage: 'Airtight container in fridge up to 4 days.',
    reheating: 'Skillet over medium heat with a splash of water, or microwave until heated through.',
    chefNote:
      'Hearty vegan pasta packed with vegetables and plant-based protein. Substitute favorite/in-season vegetables.',
    tags: ['vegan'],
  },

  // ── Recipe 2 ──────────────────────────────────────────────────────────────
  {
    id: 'recipe-poe-vegan-cheeseburgers-slaw-sauce',
    title: 'Vegan Cheeseburgers with Purple Cabbage Slaw & House Burger Sauce',
    chef: 'Chef Mario',
    servings: '4–6',
    prepTime: '20 min',
    cookTime: '15 min',
    ingredientSections: [
      {
        title: 'Burgers',
        items: [
          '4–6 vegan burger patties',
          '4–6 slices vegan cheese',
          '4–6 burger buns',
          '2 tbsp vegan butter, softened',
        ],
      },
      {
        title: 'House Burger Sauce',
        items: [
          '1 cup vegan mayonnaise',
          '½ cup ketchup',
          '½ cup mustard',
          '½ cup diced pickles',
          '1 tbsp onion powder',
          '2 tbsp agave or maple syrup (vegan honey sub)',
          '½ tbsp vinegar',
          'Salt',
          'Black pepper',
        ],
      },
      {
        title: 'Purple Cabbage Slaw',
        items: [
          '1 small head purple cabbage, thinly sliced',
          '1 onion, thinly sliced',
          '¼ cup pickle juice',
          '½ cup diced pickles',
          '1 red bell pepper, julienned (optional)',
          '1 green bell pepper, julienned (optional)',
          'Salt and pepper',
        ],
      },
    ],
    instructionSections: [
      {
        title: 'Prepare the Slaw',
        steps: [
          'Combine purple cabbage, onion, diced pickles, optional peppers.',
          'Add pickle juice, season.',
          'Toss and refrigerate.',
        ],
      },
      {
        title: 'Make the Burger Sauce',
        steps: [
          'Combine vegan mayo, ketchup, mustard, diced pickles, onion powder, agave, vinegar.',
          'Season.',
          'Mix smooth; refrigerate.',
        ],
      },
      {
        title: 'Cook the Burgers',
        steps: [
          'Preheat broiler high; broil patties 10–15 min until golden and heated.',
          'Add vegan cheese last 1–2 min.',
        ],
      },
      {
        title: 'Toast the Buns',
        steps: ['Butter cut sides; toast under broiler or skillet until golden.'],
      },
      {
        title: 'Assemble',
        steps: [
          'Spread burger sauce on top + bottom buns.',
          'Add patty; top with scoop of slaw.',
          'Serve immediately.',
        ],
      },
    ],
    storage: 'Burger sauce fridge up to 1 week; slaw up to 3 days; cooked burgers up to 4 days.',
    reheating: 'Skillet/oven/air fryer until warm; assemble with fresh slaw.',
    chefNote:
      'Tangy slaw + creamy sauce balance the savory vegan cheeseburger — a satisfying plant-based diner classic.',
    tags: ['vegan'],
  },

  // ── Recipe 3 ──────────────────────────────────────────────────────────────
  {
    id: 'recipe-poe-vegan-street-style-tacos',
    title: 'Vegan Street-Style Tacos',
    chef: 'Chef Mario',
    servings: '4–6',
    prepTime: '15 min',
    cookTime: '20 min',
    ingredientSections: [
      {
        title: 'Vegan Taco Filling',
        items: [
          '4 bags vegan protein crumbles (or plant-based ground meat)',
          '2 tbsp olive oil',
          '1 onion, diced',
          '1 red bell pepper, diced',
          '1 green bell pepper, diced',
          '3 cloves garlic, minced',
          '1 cup diced tomatoes',
          '1 cup vegetable stock',
          '½ cup mustard',
          '¼ cup ketchup',
          '1 packet taco seasoning',
          'Salt',
          'Black pepper',
        ],
      },
      {
        title: 'Taco Assembly',
        items: [
          '8–12 flour tortillas',
          '2 tbsp vegan butter',
          '2 cups shredded vegan cheese',
        ],
      },
    ],
    instructionSections: [
      {
        title: 'Prepare the Filling',
        steps: [
          'Heat olive oil over medium-high; add crumbles, cook until lightly browned.',
          'Add onions, peppers, garlic, sauté 5–7 min.',
          'Stir in diced tomatoes 2–3 min.',
          'Add stock, mustard, ketchup, taco seasoning; simmer.',
          'Reduce heat, cook 8–10 min to reduce; season.',
        ],
      },
      {
        title: 'Assemble the Tacos',
        steps: [
          'Butter one side of each tortilla; place butter-side down on hot flat top/skillet.',
          'Sprinkle vegan cheese over half; add scoop of filling.',
          'Fold and cook until golden and crispy, ~2–3 min per side.',
          'Serve immediately.',
        ],
      },
    ],
    toppings: [
      'Shredded lettuce',
      'Diced tomatoes',
      'Avocado',
      'Pickled onions',
      'Salsa',
      'Fresh cilantro',
    ],
    storage: 'Filling separately airtight in fridge up to 4 days.',
    reheating: 'Skillet over medium or microwave; assemble fresh.',
    chefNote:
      'Rich, savory, packed with plant-based protein; crisping tortillas on the flat top with vegan butter gives a golden crust and extra flavor.',
    tags: ['vegan'],
  },
];

// Normalize through makeRecipe so canonical recipes share the exact shape the
// parser and the cloud rows produce — the UI treats them all uniformly.
export const POE_FAMILY_RECIPES = RAW_RECIPES.map((r) => makeRecipe({ ...r, dateAdded: DATE_ADDED }));
