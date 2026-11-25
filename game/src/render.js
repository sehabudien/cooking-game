// Caldera Kitchen — Sizzle & Serve: everything the player sees.
// One job: draw the kitchen (wall, board, stations, counter) and every ticket,
// plate and timer from the state. It never changes the state.

import { BIN_ORDER, CANVAS_H, CANVAS_W, INGREDIENTS, SHIFT_SECONDS } from './config.js';
import { matchingOrder } from './state.js';

export const LAYOUT = {
  topBar: { x: 0, y: 0, w: CANVAS_W, h: 64 },
  tickets: { x: 60, y: 88, w: 232, h: 112, gap: 16 },
  grill: { x: 60, y: 212, w: 250, h: 178 },
  chop: { x: 340, y: 212, w: 250, h: 178 },
  plate: { x: 630, y: 212, w: 250, h: 178 },
  serve: { x: 920, y: 212, w: 300, h: 178 },
  trash: { x: 1150, y: 420, w: 70, h: 56 },
  bins: { x: 60, y: 512, w: 158, h: 150, gap: 14 },
  hand: { x: 1120, y: 512, w: 100, h: 150 },
};

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// --- ingredient icons (drawn, never emoji) --------------------------------

export function drawIngredient(ctx, id, x, y, s, state = 'ready') {
  ctx.save();
  ctx.translate(x, y);
  if (id === 'bun') {
    ctx.fillStyle = '#e8a95c';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.5, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-s * 0.5, 0, s, s * 0.16);
    ctx.fillStyle = '#fff3d6';
    for (const [dx, dy] of [[-0.2, -0.28], [0.05, -0.36], [0.24, -0.2]]) {
      ctx.beginPath();
      ctx.arc(dx * s, dy * s, s * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'patty') {
    const c = state === 'burnt' ? '#1f1a16' : state === 'cooked' ? '#5d3a1a' : state === 'cooking' ? '#7a4a22' : '#a86a4a';
    ctx.fillStyle = c;
    rr(ctx, -s * 0.5, -s * 0.18, s, s * 0.36, s * 0.14);
    ctx.fill();
    if (state === 'cooked' || state === 'cooking') {
      ctx.strokeStyle = '#3a2410';
      ctx.lineWidth = s * 0.05;
      for (const dx of [-0.25, 0, 0.25]) {
        ctx.beginPath();
        ctx.moveTo(dx * s, -s * 0.14);
        ctx.lineTo(dx * s, s * 0.14);
        ctx.stroke();
      }
    }
  } else if (id === 'lettuce') {
    ctx.fillStyle = state === 'chopped' ? '#7ed491' : '#58b368';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(i * s * 0.22, 0, s * 0.24, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#3d8a4c';
    ctx.lineWidth = s * 0.04;
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, 0);
    ctx.lineTo(s * 0.4, 0);
    ctx.stroke();
  } else if (id === 'tomato') {
    ctx.fillStyle = '#e0483e';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2827a';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c93329';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.12, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'cheese') {
    ctx.fillStyle = '#f7c948';
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, s * 0.3);
    ctx.lineTo(s * 0.5, s * 0.3);
    ctx.lineTo(0, -s * 0.34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e0a92e';
    for (const [dx, dy] of [[-0.18, 0.12], [0.16, 0.05]]) {
      ctx.beginPath();
      ctx.arc(dx * s, dy * s, s * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'sauce') {
    ctx.strokeStyle = '#f08a24';
    ctx.lineWidth = s * 0.12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-s * 0.42, -s * 0.1);
    ctx.quadraticCurveTo(-s * 0.15, -s * 0.34, s * 0.1, -s * 0.08);
    ctx.quadraticCurveTo(s * 0.3, s * 0.16, s * 0.42, -s * 0.05);
    ctx.stroke();
  }
  ctx.restore();
}

// --- hit zones (input reads these) ----------------------------------------

export function hitZones() {
  const L = LAYOUT;
  const zones = { bins: [], grill: [], chop: [], plate: null, serve: null, trash: null };
  BIN_ORDER.forEach((id, i) => {
    zones.bins.push({ id, rect: { x: L.bins.x + i * (L.bins.w + L.bins.gap), y: L.bins.y, w: L.bins.w, h: L.bins.h } });
  });
  for (let i = 0; i < 2; i++) {
    zones.grill.push({ i, rect: { x: L.grill.x + 14 + i * 118, y: L.grill.y + 52, w: 104, h: 104 } });
    zones.chop.push({ i, rect: { x: L.chop.x + 14 + i * 118, y: L.chop.y + 52, w: 104, h: 104 } });
  }
  zones.plate = { rect: { x: L.plate.x + 25, y: L.plate.y + 40, w: 200, h: 128 } };
  zones.serve = { rect: { x: L.serve.x, y: L.serve.y, w: L.serve.w, h: L.serve.h } };
  zones.trash = { rect: { x: L.trash.x, y: L.trash.y, w: L.trash.w, h: L.trash.h } };
  return zones;
}

export function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// --- the kitchen ------------------------------------------------------------

export function drawGame(ctx, game) {
  // Wall and floor.
  ctx.fillStyle = '#f6ead6';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#bfe3d0';
  for (let x = 0; x < CANVAS_W; x += 64) {
    ctx.fillRect(x + 2, 66, 60, 30);
    ctx.fillRect(x + 34, 96, 60, 30);
  }
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(0, 480, CANVAS_W, 8);
  ctx.fillStyle = '#c89a6b';
  ctx.fillRect(0, 488, CANVAS_W, CANVAS_H - 488);

  drawTopBar(ctx, game);
  drawTickets(ctx, game);
  drawGrill(ctx, game);
  drawChop(ctx, game);
  drawPlate(ctx, game);
  drawServe(ctx, game);
  drawTrash(ctx);
  drawBins(ctx, game);
  drawHand(ctx, game);

  if (game.flash) {
    ctx.globalAlpha = Math.min(1, game.flash.t);
    text(ctx, game.flash.text, CANVAS_W / 2, 452, 30, game.flash.color, 'center');
    ctx.globalAlpha = 1;
  }

  if (game.phase === 'title') drawTitle(ctx);
  if (game.phase === 'done') drawDone(ctx, game);
}

function drawTopBar(ctx, game) {
  const L = LAYOUT.topBar;
  ctx.fillStyle = '#3a2c1e';
  ctx.fillRect(L.x, L.y, L.w, L.h);
  text(ctx, 'SIZZLE & SERVE', 24, 33, 26, '#ffd166');
  text(ctx, 'Caldera Kitchen', 250, 34, 15, '#d8c3a5', 'left', 'normal');
  const mm = Math.floor(game.timeLeft / 60);
  const ss = Math.floor(game.timeLeft % 60).toString().padStart(2, '0');
  const low = game.timeLeft <= 10 && game.phase === 'playing';
  text(ctx, `${mm}:${ss}`, CANVAS_W / 2, 32, 30, low ? '#ff6b5e' : '#ffffff', 'center');
  text(ctx, 'SHIFT', CANVAS_W / 2, 52, 11, '#d8c3a5', 'center', 'normal');
  text(ctx, `COINS ${game.coins}`, CANVAS_W - 250, 33, 24, '#ffd166', 'right');
  text(ctx, `served ${game.served} · missed ${game.missed}`, CANVAS_W - 24, 33, 16, '#ffffff', 'right', 'normal');
  // Shift progress.
  ctx.fillStyle = '#5a4632';
  ctx.fillRect(0, 64, CANVAS_W, 4);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(0, 64, CANVAS_W * (game.time / SHIFT_SECONDS), 4);
}

function drawTickets(ctx, game) {
  const L = LAYOUT.tickets;
  text(ctx, 'ORDER BOARD', L.x, L.y - 8, 13, '#7a5c38');
  if (!game.orders.length && game.phase === 'playing') {
    text(ctx, 'No orders yet — the lunch rush is coming…', L.x, L.y + 50, 18, '#8a7a66', 'left', 'normal');
  }
  game.orders.forEach((order, i) => {
    const x = L.x + i * (L.w + L.gap);
    const y = L.y;
    ctx.fillStyle = '#fffdf5';
    rr(ctx, x, y, L.w, L.h, 8);
    ctx.fill();
    ctx.strokeStyle = '#d8c3a5';
    ctx.lineWidth = 2;
    ctx.stroke();
    const ratio = Math.max(0, order.patience / order.max);
    ctx.fillStyle = ratio > 0.5 ? '#58b368' : ratio > 0.25 ? '#f7c948' : '#e0483e';
    rr(ctx, x + 10, y + 8, (L.w - 20) * ratio, 8, 4);
    ctx.fill();
    text(ctx, `#${order.id} ${order.recipe.name}`, x + 12, y + 34, 18, '#3a2c1e');
    order.recipe.layers.forEach((id, j) => {
      drawIngredient(ctx, id, x + 26 + j * 40, y + 78, 34);
    });
    text(ctx, `${Math.ceil(order.patience)}s`, x + L.w - 12, y + 34, 15, '#8a7a66', 'right', 'normal');
  });
}

function drawGrill(ctx, game) {
  const L = LAYOUT.grill;
  ctx.fillStyle = '#4a4a52';
  rr(ctx, L.x, L.y, L.w, L.h, 10);
  ctx.fill();
  text(ctx, 'GRILL', L.x + 16, L.y + 24, 15, '#ffffff');
  text(ctx, 'patty · 4s', L.x + L.w - 16, L.y + 24, 12, '#b9b9c4', 'right', 'normal');
  game.grill.forEach((slot, i) => {
    const x = L.x + 14 + i * 118;
    const y = L.y + 52;
    ctx.fillStyle = '#2b2b31';
    rr(ctx, x, y, 104, 104, 8);
    ctx.fill();
    ctx.strokeStyle = '#6a6a74';
    ctx.lineWidth = 3;
    for (let g = 1; g < 4; g++) {
      ctx.beginPath();
      ctx.moveTo(x + 8, y + g * 26);
      ctx.lineTo(x + 96, y + g * 26);
      ctx.stroke();
    }
    if (slot.item) {
      drawIngredient(ctx, 'patty', x + 52, y + 48, 76, slot.item.state);
      if (slot.item.state === 'cooking') {
        const p = Math.min(1, slot.t / 4);
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(x + 52, y + 48, 44, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
        ctx.stroke();
      }
      if (slot.item.state === 'burnt') text(ctx, 'BURNT!', x + 52, y + 88, 13, '#ff6b5e', 'center');
      else if (slot.item.state === 'cooked') text(ctx, 'READY', x + 52, y + 88, 13, '#7ed491', 'center');
    }
  });
}

function drawChop(ctx, game) {
  const L = LAYOUT.chop;
  ctx.fillStyle = '#d9a066';
  rr(ctx, L.x, L.y, L.w, L.h, 10);
  ctx.fill();
  text(ctx, 'CHOPPING BOARD', L.x + 16, L.y + 24, 15, '#5a3a1a');
  text(ctx, 'lettuce · tomato · 2.5s', L.x + L.w - 16, L.y + 24, 12, '#7a5a38', 'right', 'normal');
  game.chop.forEach((slot, i) => {
    const x = L.x + 14 + i * 118;
    const y = L.y + 52;
    ctx.fillStyle = '#f3e3c2';
    rr(ctx, x, y, 104, 104, 8);
    ctx.fill();
    ctx.strokeStyle = '#c9a06a';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (slot.item) {
      drawIngredient(ctx, slot.item.id, x + 52, y + 48, 72, slot.item.state);
      if (slot.item.state === 'chopping') {
        const p = Math.min(1, slot.t / 2.5);
        ctx.fillStyle = '#58b368';
        ctx.fillRect(x + 12, y + 92, 80 * p, 6);
      }
      if (slot.item.state === 'chopped') text(ctx, 'CHOPPED', x + 52, y + 88, 12, '#2e9e4f', 'center');
    }
  });
}

function drawPlate(ctx, game) {
  const L = LAYOUT.plate;
  ctx.fillStyle = '#efe3c8';
  rr(ctx, L.x, L.y, L.w, L.h, 10);
  ctx.fill();
  text(ctx, 'ASSEMBLY PLATE', L.x + 16, L.y + 24, 15, '#7a5c38');
  const cx = L.x + L.w / 2;
  const cy = L.y + 108;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 92, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d8c3a5';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Stack the layers bottom-up, squashed so the pile reads as one dish.
  game.plate.forEach((item, i) => {
    drawIngredient(ctx, item.id, cx, cy - 6 - i * 13, 74, item.state);
  });
  if (!game.plate.length) text(ctx, 'click a bin, then here', cx, cy - 4, 13, '#b09a7a', 'center', 'normal');
  else {
    const order = matchingOrder(game);
    text(ctx, order ? `✓ matches #${order.id} ${order.recipe.name}!` : `${game.plate.length} layer${game.plate.length > 1 ? 's' : ''}`, cx, L.y + L.h - 14, 14, order ? '#2e9e4f' : '#7a5c38', 'center');
  }
}

function drawServe(ctx, game) {
  const L = LAYOUT.serve;
  const ready = game.plate.length > 0 && matchingOrder(game);
  ctx.fillStyle = ready ? '#2e9e4f' : '#7a4a2a';
  rr(ctx, L.x, L.y, L.w, L.h, 10);
  ctx.fill();
  text(ctx, 'SERVE WINDOW', L.x + 16, L.y + 24, 15, '#ffffff');
  // The bell.
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(L.x + L.w / 2, L.y + 92, 34, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(L.x + L.w / 2 - 40, L.y + 92, 80, 8);
  ctx.beginPath();
  ctx.arc(L.x + L.w / 2, L.y + 108, 7, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, ready ? 'READY TO SERVE — click!' : 'serve a matching dish here', L.x + L.w / 2, L.y + 152, 15, ready ? '#ffffff' : '#e8d5b5', 'center');
}

function drawTrash(ctx) {
  const L = LAYOUT.trash;
  ctx.fillStyle = '#6a6a74';
  rr(ctx, L.x, L.y, L.w, L.h, 8);
  ctx.fill();
  text(ctx, 'TRASH', L.x + L.w / 2, L.y + 18, 12, '#ffffff', 'center');
  text(ctx, 'T', L.x + L.w / 2, L.y + 38, 16, '#ffffff', 'center');
}

function drawBins(ctx, game) {
  const L = LAYOUT.bins;
  text(ctx, 'INGREDIENT COUNTER — click a bin, or press 1–6', L.x, L.y - 12, 13, '#7a5c38');
  BIN_ORDER.forEach((id, i) => {
    const x = L.x + i * (L.w + L.gap);
    const y = L.y;
    const def = INGREDIENTS[id];
    ctx.fillStyle = '#fffdf5';
    rr(ctx, x, y, L.w, L.h, 10);
    ctx.fill();
    ctx.strokeStyle = '#d8c3a5';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawIngredient(ctx, id, x + L.w / 2, y + 62, 84, def.needs === 'grill' ? 'raw' : 'ready');
    text(ctx, def.name, x + L.w / 2, y + 118, 17, '#3a2c1e', 'center');
    const hint = def.needs === 'grill' ? 'grill 4s' : def.needs === 'chop' ? 'chop 2.5s' : 'ready';
    text(ctx, `${i + 1} · ${hint}`, x + L.w / 2, y + 138, 12, '#8a7a66', 'center', 'normal');
  });
  // Hand slot.
  const H = LAYOUT.hand;
  ctx.fillStyle = '#3a2c1e';
  rr(ctx, H.x, H.y, H.w, H.h, 10);
  ctx.fill();
  text(ctx, 'HAND', H.x + H.w / 2, H.y + 20, 13, '#ffd166', 'center');
  if (game.hand) {
    drawIngredient(ctx, game.hand.id, H.x + H.w / 2, H.y + 78, 72, game.hand.state);
    text(ctx, INGREDIENTS[game.hand.id].name, H.x + H.w / 2, H.y + 128, 14, '#ffffff', 'center');
  } else {
    text(ctx, 'empty', H.x + H.w / 2, H.y + 78, 14, '#8a7a66', 'center', 'normal');
  }
}

function drawHand(ctx, game) {
  // The cursor-following held item is drawn by the browser cursor instead;
  // the HAND slot on the counter already shows it. Nothing extra here.
}

function drawTitle(ctx) {
  ctx.fillStyle = 'rgba(40, 26, 14, 0.82)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'SIZZLE & SERVE', CANVAS_W / 2, 190, 64, '#ffd166', 'center');
  text(ctx, 'Caldera Kitchen — the lunch rush is on', CANVAS_W / 2, 244, 24, '#ffffff', 'center', 'normal');
  const lines = [
    '1–6 or click — grab an ingredient from the counter',
    'Grill the patty · chop the lettuce & tomato · stack it on the plate',
    'Click the green SERVE WINDOW when the plate matches a ticket',
    'Serve fast for tips — combos pay more. 150 seconds a shift!',
  ];
  lines.forEach((line, i) => text(ctx, line, CANVAS_W / 2, 320 + i * 36, 19, '#f3e3c2', 'center', 'normal'));
  ctx.fillStyle = '#2e9e4f';
  rr(ctx, CANVAS_W / 2 - 130, 500, 260, 64, 12);
  ctx.fill();
  text(ctx, 'CLICK TO START', CANVAS_W / 2, 533, 24, '#ffffff', 'center');
}

function drawDone(ctx, game) {
  ctx.fillStyle = 'rgba(40, 26, 14, 0.82)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'SHIFT OVER!', CANVAS_W / 2, 190, 56, '#ffd166', 'center');
  text(ctx, `${game.coins} coins earned`, CANVAS_W / 2, 268, 34, '#ffffff', 'center');
  text(ctx, `Served ${game.served} dishes · ${game.missed} walked out · best combo x${game.bestCombo}`, CANVAS_W / 2, 322, 20, '#f3e3c2', 'center', 'normal');
  const verdict = game.served >= 8 ? 'Head chef material!' : game.served >= 4 ? 'A solid service.' : 'The rush got away — run it back!';
  text(ctx, verdict, CANVAS_W / 2, 368, 22, '#ffd166', 'center');
  ctx.fillStyle = '#2e9e4f';
  rr(ctx, CANVAS_W / 2 - 130, 440, 260, 64, 12);
  ctx.fill();
  text(ctx, 'PLAY AGAIN (R)', CANVAS_W / 2, 473, 24, '#ffffff', 'center');
}
