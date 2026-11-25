// Caldera Kitchen — Sizzle & Serve: bootstrap and the game loop.
// One job: start the canvas, run the clock, and expose a debug handle the
// play-test uses. The game itself lives in state.js and render.js.

import { CANVAS_H, CANVAS_W } from './config.js';
import { drawGame } from './render.js';
import { attachInput } from './input.js';
import { newGame, startShift, update } from './state.js';
import { applyShot } from './shots.js';
import { sfx } from './audio.js';

const canvas = document.getElementById('game');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') || '1');
const shot = params.get('shot');
const game = newGame(seed);
if (shot) applyShot(game, shot);

attachInput(canvas, game, () => startShift(game), () => startShift(game));

// Debug handle for the headless play-test (and curious players).
window.__game = game;

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const before = game.phase;
  update(game, dt);
  if (game.tick) sfx.tick();
  if (game.phase === 'done' && before === 'playing') sfx.done();
  drawGame(ctx, game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Screenshots wait for this flag before they fire.
window.__shotReady = true;
