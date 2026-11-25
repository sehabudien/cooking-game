// Caldera Kitchen — Sizzle & Serve: tiny WebAudio blips, no sound files.
// One job: give every action an instant audible answer.

let ctx = null;

function ensure() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = AC ? new AC() : null;
  } catch {
    ctx = null;
  }
  return ctx;
}

export function blip(freq, ms = 70, type = 'sine', gain = 0.08) {
  const ac = ensure();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + ms / 1000);
    osc.connect(g).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + ms / 1000);
  } catch {
    // Sound is garnish: never let it break the game.
  }
}

export const sfx = {
  pickup: () => blip(520, 60, 'sine'),
  place: () => blip(340, 60, 'triangle'),
  chop: () => blip(220, 50, 'square', 0.05),
  sizzle: () => blip(180, 90, 'sawtooth', 0.04),
  serve: () => { blip(660, 80, 'sine'); setTimeout(() => blip(880, 120, 'sine'), 70); },
  wrong: () => blip(140, 160, 'sawtooth', 0.07),
  tick: () => blip(980, 40, 'sine', 0.04),
  done: () => { [523, 659, 784].forEach((f, i) => setTimeout(() => blip(f, 140, 'sine'), i * 110)); },
};
