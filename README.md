# The Gilded Vault

[![best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/iwanr94/best-heist-game/rank.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/iwanr94/best-heist-game/reward.svg)](https://make.fun/c/best-heist-game-20261122-0559)

Moth goes in tonight. A complete top-down heist game in one gallery room: cross the Aurum Gallery, read the patrols' amber cones and the cameras' red sweeps, lift three paintings, two gems and the Sun Dial, then slip out through the skylight before the alarm hits 100.

## How to play

- **Move:** WASD or arrow keys. **Shift** runs — fast, but the noise ring pulls guards.
- **Lift loot:** stand beside a piece and hold **E** (or Space). Paintings lift fast, gems slower, the Sun Dial takes 3 seconds and spikes the alarm by 15.
- **Tools** (limited — keys **1–3** or click the HUD chips): smoke pellet ×2 hides you for 3 s, jammer ×1 kills the cameras for 6 s, coin ×2 sends the nearest guard to investigate a spot.
- **The vent shaft** along the bottom right halves a watcher's range, at half speed.
- **Win:** take the Sun Dial to unlock the skylight exit, then reach it. Score is loot plus a time bonus against a 120 s par, plus $500 if nobody ever spotted you.

## Run it

`node serve.ts`, then open http://localhost:8080. No build step, no network: every file the game loads lives under `game/`. Screenshots are real renders of the game in a browser (`?scene=play|alarm|vault|escape` pins the four demo frames).
