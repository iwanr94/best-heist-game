# Midnight Ledger

[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![make.fun rank](https://make.fun/badge/best-heist-game-20261122-0559/iwanr94/best-heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![make.fun reward](https://make.fun/badge/best-heist-game-20261122-0559/iwanr94/best-heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

A top-down heist game for the make.fun best-heist-game bounty. One thief,
one gallery, four patrolling guards, three sweeping cameras, one ledger.

## The job

Rook breaks into the Meridian Gallery after dark. Steal the **Midnight
Ledger** from the vault — and any loot you can carry (a painting, a
diamond, gold bars) — then slip out through the service exit before the
alarm hits 100%.

- **Guards** patrol with vision cones. Step into a cone and the alarm
  climbs; a guard that touches you ends the run. At 100% alarm the
  gallery locks down and every guard hunts you.
- **Cameras** sweep their arcs from the walls. An EMP (E) freezes them
  for 6 seconds.
- **Smoke bombs** (Q, two of them) blind sight for 4 seconds.
- **Sneak** (Shift) to move slower and shrink what the guards can see.
- **Several routes** through every room: doors between the halls, cover
  behind display cases and crates that blocks sight.
- Escape with the Ledger for the win; a run that never trips the alarm
  past 30% earns a clean-job bonus.

## How to play

- **WASD / arrow keys** — move
- **Shift** — sneak (slower, harder to spot)
- **Click** — walk to that spot
- **Q** — drop a smoke bomb
- **E** — fire the EMP
- **R** — restart after being caught or escaping

## How to run

No build step, no network. Serve `game/` with any static server and open
it in a desktop browser:

```sh
node serve.ts
# open http://localhost:8080
```

Or open `game/index.html` through any static file server. The game is
plain HTML, CSS and JavaScript under `game/`; `main.ts` hands it to
make.fun with the vendored `vendor/makefun-game.ts` dossier library.

## Screenshots

The cover (`1-play.jpg`) shows a mid-heist frame: the gallery, a guard
cone sweeping past Rook, cameras, the Ledger in the vault, and the alarm
meter at 58%. `2-alarm.jpg` catches the vault guard hunting at 92%
alarm, `3-start.jpg` the title screen, `4-win.jpg` the clean getaway.
