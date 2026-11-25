// Caldera Kitchen — Sizzle & Serve: mouse and keyboard.
// One job: turn clicks and keys into state actions. It never draws anything.

import { BIN_ORDER } from './config.js';
import { hitZones, inRect } from './render.js';
import * as S from './state.js';
import { sfx } from './audio.js';

function play(key) {
  if (key && sfx[key]) sfx[key]();
}

export function attachInput(canvas, game, onStart, onRestart) {
  canvas.addEventListener('click', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
    const y = (ev.clientY - rect.top) * (canvas.height / rect.height);
    handleClick(game, x, y, onStart, onRestart);
  });

  window.addEventListener('keydown', (ev) => {
    if (game.phase === 'done' && (ev.key === 'r' || ev.key === 'R' || ev.key === 'Enter')) {
      onRestart();
      return;
    }
    if (game.phase !== 'playing') return;
    const n = Number(ev.key);
    if (n >= 1 && n <= BIN_ORDER.length) play(S.takeFromBin(game, BIN_ORDER[n - 1]));
    else if (ev.key === 't' || ev.key === 'T') play(S.trashHandOrPlate(game));
    else if (ev.key === ' ') { ev.preventDefault(); play(S.servePlate(game)); }
  });
}

export function handleClick(game, x, y, onStart, onRestart) {
  if (game.phase === 'title') {
    onStart();
    return;
  }
  if (game.phase === 'done') {
    onRestart();
    return;
  }
  const z = hitZones();
  for (const bin of z.bins) {
    if (inRect(x, y, bin.rect)) {
      play(S.takeFromBin(game, bin.id));
      return;
    }
  }
  for (const slot of z.grill) {
    if (inRect(x, y, slot.rect)) {
      play(S.useGrillSlot(game, slot.i));
      return;
    }
  }
  for (const slot of z.chop) {
    if (inRect(x, y, slot.rect)) {
      play(S.useChopSlot(game, slot.i));
      return;
    }
  }
  if (inRect(x, y, z.plate.rect)) {
    play(S.addToPlate(game));
    return;
  }
  if (inRect(x, y, z.serve.rect)) {
    play(S.servePlate(game));
    return;
  }
  if (inRect(x, y, z.trash.rect)) {
    play(S.trashHandOrPlate(game));
  }
}
