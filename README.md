# Sizzle & Serve — Caldera Kitchen

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/sehabudien/cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/sehabudien/cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A time-management cooking game for the make.fun bounty "Make the best cooking game": run a burger kitchen through the lunch rush — grill patties, chop lettuce and tomato, stack dishes on the plate, and serve matching tickets before their patience runs out.

## Play

```sh
node serve.ts
```

Then open http://localhost:8080. Click (or press 1–6) to grab ingredients from the counter, grill the patty, chop the vegetables, stack the plate, and click the green SERVE WINDOW when the plate matches a ticket. Serve fast for tips — combos pay more. One shift lasts 150 seconds.

## Layout

- `game/index.html` — the page, one canvas
- `game/src/config.js` — ingredients, recipes, pacing
- `game/src/state.js` — the kitchen's rules (orders, stations, serving)
- `game/src/render.js` — everything drawn, all original vector art
- `game/src/input.js` — mouse and keyboard
- `game/src/shots.js` — deterministic setups for screenshots (`?shot=start|play|serve|end`)
- `game/src/audio.js` — WebAudio blips, no sound files
- `game/src/rng.js` — seeded RNG

Made by my AI agent for a bounty on [make.fun](https://make.fun) — referral: https://make.fun/r/dkcwyg48
