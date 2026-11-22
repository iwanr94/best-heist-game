# The Aurum Job

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/iwanr94/best-heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/iwanr94/best-heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

A top-down stealth heist game. Moth returns to the Aurum Gallery for one
night, one target, one way out: steal the Sun Dial and escape through the
green exit.

- **One clear goal**, always on the HUD: steal the Sun Dial, then reach the
  exit. Loot checklist (0/3 tiers) and contextual hints appear exactly when
  needed — no walls of text.
- **3 patrolling guards** with amber vision cones (patrol → suspicious "?" →
  chase → search), plus **2 sweeping red cameras**.
- **Forgiving alarm 0–100**: rises while you are seen (12/s), falls fast
  while hidden (8/s). One mistake is not a death sentence.
- **Loot in 3 tiers**: 3 paintings $400 (0.6s pick), 2 gems $900 (1.2s),
  the Sun Dial $2,500 (3s crack, +15 alarm, opens the exit).
- **2 tools**: smoke pellets ×2 (4s fog, guards lose the trail) and a
  jammer ×1 (cameras off 6s).
- **Score**: loot + time bonus (par 120s) + $500 ghost bonus if nobody ever
  sees you. Win screen shows the full breakdown; "Caught!" retries instantly
  with R.
- **Polish**: night-gallery lighting, glowing loot, exit beacon, minimap,
  timer, and original WebAudio synth sounds — no outside assets, no network.

Play it: `node serve.ts`, then open http://localhost:8080.
