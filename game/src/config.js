// Caldera Kitchen — Sizzle & Serve: shared constants, ingredients and recipes.
// One job: describe what the kitchen sells and how it is priced.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;
export const SHIFT_SECONDS = 150;
export const MAX_ORDERS = 4;
export const GRILL_SLOTS = 2;
export const CHOP_SLOTS = 2;
export const PLATE_MAX_LAYERS = 6;
export const GRILL_SECONDS = 4;
export const BURN_SECONDS = 9;
export const CHOP_SECONDS = 2.5;

// An ingredient the player can hold. `needs` says what station prepares it:
// 'none' is ready to use, 'grill' must be cooked, 'chop' must be chopped.
export const INGREDIENTS = {
  bun:     { id: 'bun',     name: 'Bun',     needs: 'none', price: 2, color: '#e8a95c' },
  patty:   { id: 'patty',   name: 'Patty',   needs: 'grill', price: 5, color: '#8a5a2b' },
  lettuce: { id: 'lettuce', name: 'Lettuce', needs: 'chop', price: 2, color: '#58b368' },
  tomato:  { id: 'tomato',  name: 'Tomato',  needs: 'chop', price: 2, color: '#e0483e' },
  cheese:  { id: 'cheese',  name: 'Cheese',  needs: 'none', price: 3, color: '#f7c948' },
  sauce:   { id: 'sauce',   name: 'Sauce',   needs: 'none', price: 2, color: '#f08a24' },
};

export const BIN_ORDER = ['bun', 'patty', 'lettuce', 'tomato', 'cheese', 'sauce'];

// Recipes: a dish is a multiset of prepared ingredients. The board shows the
// icons in this order; the plate matches when its layers hold the same multiset.
export const RECIPES = [
  { id: 'classic', name: 'Classic', layers: ['bun', 'patty', 'lettuce'] },
  { id: 'cheesy',  name: 'Cheesy',  layers: ['bun', 'patty', 'cheese'] },
  { id: 'garden',  name: 'Garden',  layers: ['bun', 'lettuce', 'tomato', 'cheese'] },
  { id: 'saucy',   name: 'Saucy',   layers: ['bun', 'patty', 'sauce', 'tomato'] },
  { id: 'double',  name: 'Double Trouble', layers: ['bun', 'patty', 'patty', 'cheese'] },
];

export function recipePrice(recipe) {
  return 6 + recipe.layers.reduce((sum, id) => sum + INGREDIENTS[id].price, 0);
}

// Spawn pacing: orders arrive faster as the shift wears on.
export function spawnGapAt(elapsed) {
  return Math.max(9, 14 - Math.floor(elapsed / 30));
}
