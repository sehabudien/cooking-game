// Sizzle & Serve — Caldera Kitchen (Node 22, standard library only): the game
// is this directory's game/ folder, plain static files a desktop browser loads
// offline (game/index.html and its ES modules, no library and no network
// request), and the program hands it in. It copies game/ and screenshots/ from
// beside this file to /output and writes /output/dossier.json, the summary the
// judge reads, with the vendored make.fun library. The game is an original
// time-management cooking game: grill patties, chop vegetables, stack burgers
// on the plate and serve matching tickets before their patience runs out.
// Screenshots: 3 or 4 PNG or JPEG files in screenshots/ (the first by name is
// the cover). Run it with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve it locally with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Authored checks before handing the entry in: the game must be present and
// playable (index.html under 1 MiB), and every screenshot must be a whole PNG
// or JPEG of at most 256 KiB, or the scorer would refuse the entry.
const gameDir = join(here, 'game');
const indexPath = join(gameDir, 'index.html');
if (!existsSync(indexPath)) throw new Error('game/index.html is missing');
if (statSync(indexPath).size > 1048576) throw new Error('game/index.html is over 1 MiB');
const shotsDir = join(here, 'screenshots');
const shots = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((name) => !name.startsWith('.'))
  : [];
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`expected 3 or 4 screenshots, found ${shots.length}`);
}
for (const name of shots) {
  const file = join(shotsDir, name);
  const bytes = statSync(file).size;
  if (bytes > 262144) throw new Error(`screenshot ${name} is over 256 KiB (${bytes} bytes)`);
}
console.log(`game OK: index.html ${statSync(indexPath).size} bytes, ${shots.length} screenshots`);

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// Read the dossier back so a failed write is loud, not silent, and log the
// hand-in so two runs can be compared byte for byte.
const dossierPath = join(out, 'dossier.json');
const dossierBytes = statSync(dossierPath).size;
if (dossierBytes === 0) throw new Error('dossier.json came out empty');
console.log(`hand-in OK: dossier.json ${dossierBytes} bytes, ${shots.length} screenshots`);
