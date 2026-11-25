// Caldera Kitchen — Sizzle & Serve: the kitchen's state and rules.
// One job: hold the shift (orders, stations, hand, plate, score) and say what
// each action does. Rendering never lives here; input never lives here.

import {
  BIN_ORDER, BURN_SECONDS, CHOP_SECONDS, CHOP_SLOTS, GRILL_SECONDS,
  GRILL_SLOTS, INGREDIENTS, MAX_ORDERS, PLATE_MAX_LAYERS, RECIPES,
  SHIFT_SECONDS, recipePrice, spawnGapAt,
} from './config.js';
import { mulberry32, pick } from './rng.js';

export function makeItem(id, state = 'ready') {
  return { id, state }; // state: 'raw' | 'cooking' | 'cooked' | 'burnt' | 'chopping' | 'chopped' | 'ready'
}

export function newGame(seed = 1) {
  return {
    seed,
    rng: mulberry32(seed),
    phase: 'title', // 'title' | 'playing' | 'done'
    time: 0, // seconds since the shift started
    timeLeft: SHIFT_SECONDS,
    coins: 0,
    served: 0,
    missed: 0,
    combo: 0,
    bestCombo: 0,
    hand: null, // one item, or null
    plate: [], // layers, bottom first
    grill: Array.from({ length: GRILL_SLOTS }, () => ({ item: null, t: 0 })),
    chop: Array.from({ length: CHOP_SLOTS }, () => ({ item: null, t: 0 })),
    orders: [], // { id, recipe, patience, max }
    nextOrderId: 1,
    nextSpawnIn: 2,
    flash: null, // { text, color, t } floating feedback
    lastTickSecond: -1,
  };
}

export function startShift(game) {
  const fresh = newGame(game.seed);
  Object.assign(game, fresh, { phase: 'playing' });
  spawnOrder(game);
}

// --- orders ---------------------------------------------------------------

function spawnOrder(game) {
  if (game.orders.length >= MAX_ORDERS) return;
  const recipe = pick(game.rng, RECIPES);
  const patience = 45;
  game.orders.push({ id: game.nextOrderId++, recipe, patience, max: patience });
}

function layersMatch(a, b) {
  if (a.length !== b.length) return false;
  const count = (list) => list.reduce((m, x) => (m[x] = (m[x] || 0) + 1, m), {});
  const ca = count(a);
  const cb = count(b);
  return Object.keys(cb).every((k) => ca[k] === cb[k]);
}

export function matchingOrder(game) {
  const layers = game.plate.map((item) => item.id);
  return game.orders.find((o) => layersMatch(layers, o.recipe.layers)) || null;
}

// --- clock ----------------------------------------------------------------

export function update(game, dt) {
  if (game.phase !== 'playing') return;
  game.time += dt;
  game.timeLeft = Math.max(0, SHIFT_SECONDS - game.time);
  if (game.flash) {
    game.flash.t -= dt;
    if (game.flash.t <= 0) game.flash = null;
  }

  // Stations cook and chop while the clock runs.
  for (const slot of game.grill) {
    if (slot.item && slot.item.state === 'cooking') {
      slot.t += dt;
      if (slot.t >= GRILL_SECONDS && slot.item.state === 'cooking') {
        slot.item.state = 'cooked';
      }
      if (slot.t >= BURN_SECONDS) slot.item.state = 'burnt';
    }
  }
  for (const slot of game.chop) {
    if (slot.item && slot.item.state === 'chopping') {
      slot.t += dt;
      if (slot.t >= CHOP_SECONDS) slot.item.state = 'chopped';
    }
  }

  // Orders lose patience; an expired ticket walks out.
  for (const order of game.orders) order.patience -= dt;
  const expired = game.orders.filter((o) => o.patience <= 0);
  if (expired.length) {
    game.orders = game.orders.filter((o) => o.patience > 0);
    game.missed += expired.length;
    game.combo = 0;
    game.flash = { text: 'Order walked out!', color: '#e0483e', t: 1.6 };
  }

  // New orders arrive on a quickening schedule.
  game.nextSpawnIn -= dt;
  if (game.nextSpawnIn <= 0) {
    spawnOrder(game);
    game.nextSpawnIn = spawnGapAt(game.time);
  }

  // Last-ten-seconds heartbeat.
  const sec = Math.ceil(game.timeLeft);
  if (game.timeLeft <= 10 && sec !== game.lastTickSecond) {
    game.lastTickSecond = sec;
    game.tick = true;
  } else {
    game.tick = false;
  }

  if (game.timeLeft <= 0) {
    game.phase = 'done';
    game.flash = null;
  }
}

// --- actions ---------------------------------------------------------------
// Each returns a short sound key for the caller to play, or null.

export function takeFromBin(game, id) {
  if (game.phase !== 'playing' || game.hand) return null;
  const def = INGREDIENTS[id];
  if (!def) return null;
  game.hand = makeItem(id, def.needs === 'none' ? 'ready' : 'raw');
  return 'pickup';
}

export function useGrillSlot(game, i) {
  if (game.phase !== 'playing') return null;
  const slot = game.grill[i];
  if (!slot) return null;
  // Take a finished patty out.
  if (slot.item && (slot.item.state === 'cooked' || slot.item.state === 'burnt')) {
    if (game.hand) return null;
    game.hand = slot.item;
    slot.item = null;
    slot.t = 0;
    return 'pickup';
  }
  // Put a raw patty on.
  if (!slot.item && game.hand && game.hand.id === 'patty' && game.hand.state === 'raw') {
    slot.item = game.hand;
    slot.item.state = 'cooking';
    slot.t = 0;
    game.hand = null;
    return 'sizzle';
  }
  return null;
}

export function useChopSlot(game, i) {
  if (game.phase !== 'playing') return null;
  const slot = game.chop[i];
  if (!slot) return null;
  if (slot.item && slot.item.state === 'chopped') {
    if (game.hand) return null;
    game.hand = slot.item;
    slot.item = null;
    slot.t = 0;
    return 'pickup';
  }
  if (!slot.item && game.hand && INGREDIENTS[game.hand.id].needs === 'chop' && game.hand.state === 'raw') {
    slot.item = game.hand;
    slot.item.state = 'chopping';
    slot.t = 0;
    game.hand = null;
    return 'chop';
  }
  return null;
}

export function addToPlate(game) {
  if (game.phase !== 'playing' || !game.hand) return null;
  if (game.hand.state !== 'ready' && game.hand.state !== 'cooked' && game.hand.state !== 'chopped') return null;
  if (game.plate.length >= PLATE_MAX_LAYERS) return null;
  game.plate.push(game.hand);
  game.hand = null;
  return 'place';
}

export function servePlate(game) {
  if (game.phase !== 'playing' || game.plate.length === 0) return null;
  const order = matchingOrder(game);
  if (!order) {
    game.plate = [];
    game.combo = 0;
    game.flash = { text: 'Wrong dish — trashed!', color: '#e0483e', t: 1.6 };
    return 'wrong';
  }
  const base = recipePrice(order.recipe);
  const tip = Math.round(base * 0.5 * (order.patience / order.max));
  game.combo += 1;
  game.bestCombo = Math.max(game.bestCombo, game.combo);
  const mult = 1 + Math.min(2, game.combo - 1) * 0.25;
  const earned = Math.round((base + tip) * mult);
  game.coins += earned;
  game.served += 1;
  game.orders = game.orders.filter((o) => o.id !== order.id);
  game.plate = [];
  game.flash = {
    text: `+${earned} coins${game.combo > 1 ? `  ·  combo x${game.combo}` : ''}`,
    color: '#2e9e4f',
    t: 1.8,
  };
  return 'serve';
}

export function trashHandOrPlate(game) {
  if (game.phase !== 'playing') return null;
  if (game.hand) {
    game.hand = null;
    return 'place';
  }
  if (game.plate.length) {
    game.plate = [];
    return 'place';
  }
  return null;
}

export { BIN_ORDER };
