// Midnight Ledger — screenshot states. One job: deterministic renders
// for ?shot=start|play|alarm|win, so screenshots are reproducible real
// renders of the game's own code.
//
// start: the title screen over the gallery. play: mid-heist, Rook
// crouched behind a display case in the gallery, a guard's cone sweeping
// past, alarm at 58, the painting already pocketed. alarm: the vault
// guard hunting Rook with the alarm at 92 and a camera locked on.
// win: the clean-getaway screen after escaping with the Ledger. When a
// shot is active the game never advances — every capture of the same URL
// shows the same frame.

import { TILE } from './config.js';

export function shotFromUrl() {
  const q = new URLSearchParams(window.location.search);
  const shot = q.get('shot');
  return shot === 'start' || shot === 'play' || shot === 'alarm' || shot === 'win' ? shot : null;
}

function placePlayer(state, col, row, facing, sneaking) {
  state.player.x = (col + 0.5) * TILE;
  state.player.y = (row + 0.5) * TILE;
  state.player.facing = facing;
  state.player.sneaking = !!sneaking;
  state.player.targetX = null;
  state.player.targetY = null;
}

function placeGuard(state, index, col, row, angle, mode) {
  const g = state.guards[index];
  g.x = (col + 0.5) * TILE;
  g.y = (row + 0.5) * TILE;
  g.angle = angle;
  g.mode = mode || 'patrol';
  g.seesPlayer = mode === 'chase';
}

export function applyShot(state, shot) {
  state.shot = shot;
  if (shot === 'start') {
    state.screen = 'title';
    state.time = 0;
    state.alarm = 0;
    return;
  }
  if (shot === 'play') {
    state.screen = 'playing';
    state.time = 47;
    state.alarm = 58;
    state.alarmPeak = 58;
    state.level.loot[0].taken = true; // the painting is already pocketed
    state.lootGot = 1;
    state.lootValue = 220;
    placePlayer(state, 15, 5, Math.PI, true);
    placeGuard(state, 0, 15, 2, Math.PI / 2, 'patrol');
    placeGuard(state, 1, 25, 4, -Math.PI / 2, 'patrol');
    placeGuard(state, 2, 4, 11, 0, 'patrol');
    placeGuard(state, 3, 17, 16, Math.PI, 'patrol');
    state.cameras[0].angle = Math.PI / 2 + 0.5;
    state.cameras[1].angle = Math.PI / 2 - 0.4;
    state.cameras[2].angle = Math.PI / 2 + 0.3;
    return;
  }
  if (shot === 'alarm') {
    state.screen = 'playing';
    state.time = 96;
    state.alarm = 92;
    state.alarmPeak = 92;
    state.level.loot[0].taken = true; // painting pocketed
    state.level.loot[3].taken = true; // gold pocketed
    state.lootGot = 2;
    state.lootValue = 400;
    state.smokeLeft = 1;
    placePlayer(state, 24, 4, -Math.PI / 2, false);
    placeGuard(state, 1, 24, 2, Math.PI / 2, 'chase');
    state.guards[1].lastSeenX = state.player.x;
    state.guards[1].lastSeenY = state.player.y;
    placeGuard(state, 0, 16, 3, Math.PI / 2, 'patrol');
    placeGuard(state, 2, 5, 11, 0, 'patrol');
    placeGuard(state, 3, 16, 16, Math.PI, 'patrol');
    state.cameras[1].angle = Math.PI / 2;
    state.cameras[1].seesPlayer = true;
    state.smokes.push({ x: 23.5 * TILE, y: 5.5 * TILE, until: 9999 });
    return;
  }
  if (shot === 'win') {
    state.screen = 'won';
    state.time = 148;
    state.alarm = 34;
    state.alarmPeak = 41;
    state.lootGot = 4;
    state.lootValue = 1200;
    state.hasLedger = true;
    for (const item of state.level.loot) item.taken = true;
    state.score = 1200 + 250;
    placePlayer(state, 2, 17, Math.PI, false);
    placeGuard(state, 0, 15, 2, Math.PI / 2, 'patrol');
    placeGuard(state, 1, 25, 4, -Math.PI / 2, 'patrol');
    placeGuard(state, 2, 4, 11, 0, 'patrol');
    placeGuard(state, 3, 17, 16, Math.PI, 'patrol');
  }
}
