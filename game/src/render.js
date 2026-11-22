// Midnight Ledger — drawing. One job: paint the gallery, the cones, the
// thief, the loot and the HUD, plus the title, caught and win screens.
// Everything is canvas shapes and text; there are no image assets, so
// safe cover, danger and loot are obvious at a glance by colour alone.

import {
  TILE, COLS, ROWS, VIEW_W, VIEW_H, HUD_H, COLORS,
  VISION_RANGE, VISION_HALF_ANGLE, CAMERA_RANGE, CAMERA_HALF_ANGLE,
  SMOKE_RADIUS,
} from './config.js';
import { mapRows } from './level.js';

function conePath(ctx, x, y, angle, range, halfAngle) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, range, halfAngle, fill) {
  conePath(ctx, x, y, angle, range, halfAngle);
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawFloor(ctx) {
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      ctx.fillStyle = (c + r) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
      ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
    }
  }
}

function drawWallsAndCover(ctx) {
  const rows = mapRows();
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      const t = rows[r][c];
      if (t === '#') {
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
        // A top edge only where the tile above is open: the wall's rim,
        // not stripes across a solid band.
        if (r === 0 || rows[r - 1][c] !== '#') {
          ctx.fillStyle = COLORS.wallTop;
          ctx.fillRect(c * TILE, r * TILE, TILE, 4);
        }
      } else if (t === 'C') {
        ctx.fillStyle = COLORS.cover;
        ctx.fillRect(c * TILE + 3, r * TILE + 3, TILE - 6, TILE - 6);
        ctx.strokeStyle = COLORS.coverTop;
        ctx.lineWidth = 2;
        ctx.strokeRect(c * TILE + 3, r * TILE + 3, TILE - 6, TILE - 6);
        ctx.beginPath();
        ctx.moveTo(c * TILE + 5, r * TILE + 5);
        ctx.lineTo(c * TILE + TILE - 5, r * TILE + TILE - 5);
        ctx.moveTo(c * TILE + TILE - 5, r * TILE + 5);
        ctx.lineTo(c * TILE + 5, r * TILE + TILE - 5);
        ctx.stroke();
      }
    }
  }
}

function drawExit(ctx, exit, hasLedger, time) {
  const pulse = hasLedger ? 0.55 + 0.35 * Math.sin(time * 4) : 0.25;
  ctx.fillStyle = hasLedger
    ? `rgba(55, 214, 122, ${pulse})`
    : 'rgba(31, 122, 77, 0.5)';
  ctx.fillRect(exit.x + 2, exit.y + 2, exit.w - 4, exit.h - 4);
  ctx.strokeStyle = COLORS.exitGlow;
  ctx.lineWidth = 2;
  ctx.strokeRect(exit.x + 2, exit.y + 2, exit.w - 4, exit.h - 4);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(hasLedger ? 'EXIT — GO!' : 'EXIT', exit.x + exit.w / 2, exit.y + exit.h / 2 + 5);
}

const LOOT_DRAW = {
  ledger(ctx, x, y) {
    ctx.fillStyle = COLORS.ledger;
    ctx.fillRect(x - 10, y - 8, 20, 16);
    ctx.fillStyle = '#8a6d1f';
    ctx.fillRect(x - 10, y - 8, 4, 16);
    ctx.fillStyle = '#fff3c4';
    ctx.fillRect(x + 1, y - 4, 7, 2);
    ctx.fillRect(x + 1, y + 1, 7, 2);
  },
  painting(ctx, x, y) {
    ctx.fillStyle = '#7a4a21';
    ctx.fillRect(x - 12, y - 9, 24, 18);
    ctx.fillStyle = COLORS.painting;
    ctx.fillRect(x - 9, y - 6, 18, 12);
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  },
  diamond(ctx, x, y) {
    ctx.fillStyle = COLORS.diamond;
    ctx.beginPath();
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x + 9, y - 2);
    ctx.lineTo(x, y + 10);
    ctx.lineTo(x - 9, y - 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8fbff';
    ctx.beginPath();
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x + 9, y - 2);
    ctx.lineTo(x - 9, y - 2);
    ctx.closePath();
    ctx.fill();
  },
  gold(ctx, x, y) {
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(x - 11, y - 3, 22, 7);
    ctx.fillRect(x - 8, y - 9, 16, 7);
    ctx.fillStyle = '#ffe1a8';
    ctx.fillRect(x - 11, y - 3, 22, 2);
  },
};

function drawLoot(ctx, loot, time) {
  ctx.textAlign = 'center';
  for (const item of loot) {
    if (item.taken) continue;
    const bob = Math.sin(time * 2 + item.x) * 2;
    const y = item.y + bob;
    // Glow ring so the target reads from across the room.
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(item.x, y, 16 + Math.sin(time * 3) * 2, 0, Math.PI * 2);
    ctx.stroke();
    LOOT_DRAW[item.kind](ctx, item.x, y);
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(item.kind.toUpperCase(), item.x, y + 26);
  }
}

function drawGuard(ctx, g) {
  drawCone(ctx, g.x, g.y, g.angle, VISION_RANGE,
    VISION_HALF_ANGLE, g.seesPlayer ? COLORS.coneSeen : COLORS.cone);
  ctx.fillStyle = COLORS.guard;
  ctx.beginPath();
  ctx.arc(g.x, g.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = g.mode === 'chase' ? '#ffd94d' : '#7a1d20';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Facing tick.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.lineTo(g.x + Math.cos(g.angle) * 16, g.y + Math.sin(g.angle) * 16);
  ctx.stroke();
  if (g.seesPlayer) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', g.x, g.y - 18);
  }
}

function drawCamera(ctx, cam, disabled) {
  drawCone(ctx, cam.x, cam.y, cam.angle, CAMERA_RANGE,
    CAMERA_HALF_ANGLE, cam.seesPlayer ? COLORS.camSeen : COLORS.camCone);
  ctx.fillStyle = disabled ? '#5a6274' : '#c9a227';
  ctx.fillRect(cam.x - 7, cam.y - 7, 14, 14);
  ctx.fillStyle = disabled ? '#3a4152' : '#ff5a3c';
  ctx.beginPath();
  ctx.arc(cam.x + Math.cos(cam.angle) * 8, cam.y + Math.sin(cam.angle) * 8, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer(ctx, player) {
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.sneaking ? 9 : 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7a5c14';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x + Math.cos(player.facing) * 15, player.y + Math.sin(player.facing) * 15);
  ctx.stroke();
  if (player.targetX !== null) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(player.targetX, player.targetY, 6, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawSmoke(ctx, smokes) {
  for (const s of smokes) {
    ctx.fillStyle = COLORS.smoke;
    ctx.beginPath();
    ctx.arc(s.x, s.y, SMOKE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(220, 228, 240, 0.5)';
    ctx.beginPath();
    ctx.arc(s.x - 20, s.y + 10, SMOKE_RADIUS * 0.5, 0, Math.PI * 2);
    ctx.arc(s.x + 18, s.y - 14, SMOKE_RADIUS * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHud(ctx, state) {
  ctx.fillStyle = COLORS.hud;
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('MIDNIGHT LEDGER', 12, 19);

  // Alarm meter.
  const ax = 190;
  const aw = 260;
  ctx.fillStyle = COLORS.dim;
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('ALARM', ax, 19);
  ctx.fillStyle = '#222a3d';
  ctx.fillRect(ax + 58, 8, aw, 16);
  const frac = state.alarm / 100;
  ctx.fillStyle = frac < 0.4 ? COLORS.alarmSafe : frac < 0.75 ? '#ffb347' : COLORS.alarm;
  ctx.fillRect(ax + 58, 8, aw * frac, 16);
  ctx.strokeStyle = '#4a5468';
  ctx.lineWidth = 1;
  ctx.strokeRect(ax + 58, 8, aw, 16);
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`${Math.round(state.alarm)}%`, ax + 58 + aw + 8, 19);
  if (state.alarm >= 100) {
    ctx.fillStyle = COLORS.alarm;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('LOCKDOWN!', ax + 58 + aw + 52, 19);
  }

  // Loot, tools, timer.
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`LOOT $${state.lootValue}  (${state.lootGot}/${state.lootTotal})`, 560, 19);
  ctx.fillStyle = COLORS.dim;
  ctx.font = '12px sans-serif';
  ctx.fillText(`Smoke ${state.smokeLeft}  •  EMP ${state.empLeft}  •  ${formatTime(state.time)}`, 190, 37);
  ctx.fillStyle = state.hasLedger ? COLORS.ledger : COLORS.dim;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(state.hasLedger ? 'LEDGER SECURED — GET TO THE EXIT' : 'STEAL THE MIDNIGHT LEDGER', VIEW_W - 12, 19);
  ctx.fillStyle = COLORS.dim;
  ctx.font = '11px sans-serif';
  ctx.fillText('WASD move • Shift sneak • Click walk • Q smoke • E EMP • R restart', VIEW_W - 12, 37);
  ctx.textAlign = 'left';
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function overlay(ctx, title, lines, accent, footer) {
  ctx.fillStyle = 'rgba(5, 8, 16, 0.82)';
  ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText(title, VIEW_W / 2, HUD_H + 190);
  ctx.fillStyle = COLORS.text;
  ctx.font = '18px sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW_W / 2, HUD_H + 240 + i * 30);
  });
  ctx.fillStyle = COLORS.dim;
  ctx.font = '15px sans-serif';
  ctx.fillText(footer, VIEW_W / 2, HUD_H + 240 + lines.length * 30 + 24);
}

export function render(ctx, state) {
  ctx.save();
  ctx.clearRect(0, 0, VIEW_W, VIEW_H + HUD_H);
  drawHud(ctx, state);
  ctx.translate(0, HUD_H);
  drawFloor(ctx);
  drawWallsAndCover(ctx);
  drawExit(ctx, state.level.exit, state.hasLedger, state.time);
  drawLoot(ctx, state.level.loot, state.time);
  for (const cam of state.cameras) drawCamera(ctx, cam, state.time < state.empUntil);
  for (const g of state.guards) drawGuard(ctx, g);
  drawSmoke(ctx, state.smokes);
  if (state.screen === 'playing' || state.screen === 'caught' || state.screen === 'won') {
    drawPlayer(ctx, state.player);
  }
  ctx.restore();

  if (state.screen === 'title') {
    overlay(ctx, 'MIDNIGHT LEDGER',
      [
        'One thief. One gallery. Four guards, three cameras, one ledger.',
        'Steal the Midnight Ledger from the vault — and any loot you can carry —',
        'then slip out through the service exit before the alarm hits 100%.',
        '',
        'WASD / arrows to move, Shift to sneak, click to walk, Q smoke, E EMP.',
      ], COLORS.ledger, 'Click or press Enter to begin the heist');
  } else if (state.screen === 'caught') {
    overlay(ctx, 'CAUGHT!',
      [
        `The guards closed in with $${state.lootValue} of loot in your pockets.`,
        `Alarm peaked at ${Math.round(state.alarmPeak)}% after ${formatTime(state.time)}.`,
        state.hasLedger ? 'You had the Ledger — so close.' : 'The Midnight Ledger is still in the vault.',
      ], COLORS.alarm, 'Press R or click to play again');
  } else if (state.screen === 'won') {
    const clean = state.alarmPeak < 30 ? ' — a clean job, the gallery never knew.' : '.';
    overlay(ctx, 'CLEAN GETAWAY!',
      [
        `You slipped out with the Midnight Ledger and $${state.lootValue} of loot${clean}`,
        `Time ${formatTime(state.time)} • Alarm peaked at ${Math.round(state.alarmPeak)}% • Score ${state.score}`,
      ], COLORS.exitGlow, 'Press R or click to play again');
  }
}
