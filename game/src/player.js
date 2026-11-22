// Midnight Ledger — the thief. One job: Rook's movement and tools.
//
// WASD / arrows walk, Shift sneaks (slower, harder to spot), a mouse
// click walks to that spot, Q drops a smoke bomb, E fires the EMP.
// The thief moves with wall sliding so corners never stick.

import { PLAYER_SPEED, PLAYER_SNEAK, PLAYER_RADIUS, SMOKE_COUNT, EMP_COUNT } from './config.js';
import { moveCircle } from './level.js';

export function makePlayer(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    facing: Math.PI / 2,
    moving: false,
    sneaking: false,
    targetX: null, // click-to-move destination, null when idle
    targetY: null,
    smokeLeft: SMOKE_COUNT,
    empLeft: EMP_COUNT,
  };
}

export function resetPlayer(player, spawn) {
  player.x = spawn.x;
  player.y = spawn.y;
  player.facing = Math.PI / 2;
  player.moving = false;
  player.sneaking = false;
  player.targetX = null;
  player.targetY = null;
  player.smokeLeft = SMOKE_COUNT;
  player.empLeft = EMP_COUNT;
}

export function updatePlayer(player, input, dt) {
  let dx = 0;
  let dy = 0;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;

  if (dx !== 0 || dy !== 0) {
    // Keyboard input wins over a click destination.
    player.targetX = null;
    player.targetY = null;
    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;
  } else if (player.targetX !== null) {
    dx = player.targetX - player.x;
    dy = player.targetY - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) {
      player.targetX = null;
      player.targetY = null;
      dx = 0;
      dy = 0;
    } else {
      dx /= dist;
      dy /= dist;
    }
  }

  player.sneaking = !!input.sneak;
  const speed = player.sneaking ? PLAYER_SNEAK : PLAYER_SPEED;
  player.moving = dx !== 0 || dy !== 0;
  if (player.moving) {
    const moved = moveCircle(player.x, player.y, dx * speed * dt, dy * speed * dt, PLAYER_RADIUS);
    player.x = moved.x;
    player.y = moved.y;
    player.facing = Math.atan2(dy, dx);
  }
}
