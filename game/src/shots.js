// Caldera Kitchen — Sizzle & Serve: deterministic setups for screenshots.
// One job: given a fresh game, pose one exact moment (?shot=start|play|serve|end)
// so a screenshot replays byte for byte. Played games never call this.

import { RECIPES } from './config.js';
import { makeItem } from './state.js';

function order(game, recipeId, patience) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  return { id: game.nextOrderId++, recipe, patience, max: 45 };
}

export function applyShot(game, shot) {
  if (shot === 'start') {
    game.phase = 'title';
    return;
  }
  game.phase = 'playing';
  if (shot === 'play') {
    game.time = 63;
    game.timeLeft = 87;
    game.coins = 240;
    game.served = 4;
    game.combo = 2;
    game.bestCombo = 2;
    game.orders = [
      order(game, 'classic', 38),
      order(game, 'garden', 22),
      order(game, 'saucy', 12),
    ];
    // A patty mid-grill, a tomato mid-chop, a plate mid-assembly, cheese in hand.
    game.grill[0].item = makeItem('patty', 'cooking');
    game.grill[0].t = 2.4;
    game.chop[0].item = makeItem('tomato', 'chopping');
    game.chop[0].t = 1.4;
    game.plate = [makeItem('bun', 'ready'), makeItem('patty', 'cooked'), makeItem('lettuce', 'chopped')];
    game.hand = makeItem('cheese', 'ready');
    return;
  }
  if (shot === 'serve') {
    game.time = 105;
    game.timeLeft = 45;
    game.coins = 410;
    game.served = 7;
    game.combo = 3;
    game.bestCombo = 3;
    game.orders = [order(game, 'cheesy', 30), order(game, 'classic', 18)];
    // A finished Cheesy on the plate, matching ticket #1 — the green window glows.
    game.plate = [makeItem('bun', 'ready'), makeItem('patty', 'cooked'), makeItem('cheese', 'ready')];
    game.grill[1].item = makeItem('patty', 'cooked');
    game.chop[1].item = makeItem('lettuce', 'chopped');
    return;
  }
  if (shot === 'end') {
    game.phase = 'done';
    game.time = 150;
    game.timeLeft = 0;
    game.coins = 512;
    game.served = 9;
    game.missed = 2;
    game.bestCombo = 4;
    return;
  }
  game.phase = 'title';
}
