// The Gilded Vault — every pixel the judge sees. One canvas, drawn in
// layers: floor, exit, loot, smoke, cameras, guards, thief, then the
// HUD strip, the hint bar and the phase overlays. Color is the
// information system: cover blue, guard amber, camera red, loot gold.

import {
  CAMERA_HALF_ANGLE,
  CAMERA_RANGE,
  FRAME_HEIGHT,
  FRAME_WIDTH,
  GUARD_HALF_ANGLE,
  GUARD_RANGE,
  HINT_HEIGHT,
  HUD_HEIGHT,
  NOISE_RADIUS,
  PALETTE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './config.js';
import { EXIT_ZONE, PEDESTALS, VENT, WALLS } from './level.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

function fmtMoney(n) {
  return '$' + n.toLocaleString('en-US');
}

/** The HUD tool chips, shared with main.js for click hit-testing. */
export function toolChipRects() {
  return [
    { key: 'smoke', x: 1020, y: 10, w: 76, h: 28 },
    { key: 'jammer', x: 1100, y: 10, w: 76, h: 28 },
    { key: 'coin', x: 1180, y: 10, w: 76, h: 28 },
  ];
}

function drawCone(ctx, x, y, dir, range, halfAngle, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, dir - halfAngle, dir + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1;
  ctx.stroke();
}

export function drawGame(ctx, s, now) {
  ctx.clearRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
  drawHud(ctx, s);
  ctx.save();
  ctx.translate(0, HUD_HEIGHT);
  drawFloor(ctx);
  drawExit(ctx, s);
  drawLoot(ctx, s, now);
  drawSmokes(ctx, s);
  drawCameras(ctx, s, now);
  drawGuards(ctx, s, now);
  drawThief(ctx, s, now);
  ctx.restore();
  drawHint(ctx, s);
  if (s.phase === 'title') drawTitle(ctx, s, now);
  else if (s.phase === 'paused') drawPaused(ctx);
  else if (s.phase === 'busted') drawBusted(ctx, s);
  else if (s.phase === 'won') drawWon(ctx, s);
}

function drawFloor(ctx) {
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  ctx.strokeStyle = PALETTE.floorLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 64; x < WORLD_WIDTH; x += 64) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, WORLD_HEIGHT);
  }
  for (let y = 64; y < WORLD_HEIGHT; y += 64) {
    ctx.moveTo(0, y);
    ctx.lineTo(WORLD_WIDTH, y);
  }
  ctx.stroke();
  // Vent shaft: a low crawl space, half as easy to spot inside.
  ctx.fillStyle = PALETTE.ventFloor;
  ctx.fillRect(VENT.x, VENT.y, VENT.w, VENT.h);
  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = PALETTE.ventLine;
  ctx.lineWidth = 2;
  ctx.strokeRect(VENT.x, VENT.y, VENT.w, VENT.h);
  ctx.setLineDash([]);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('VENT — HARD TO SPOT, SLOW TO CRAWL', VENT.x + 12, VENT.y + 20);
  // Walls, with a lit top edge so the room reads at a glance.
  for (const w of WALLS) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = PALETTE.wallEdge;
    ctx.fillRect(w.x, w.y, w.w, 2);
  }
  // Pedestals: safe cover, deep blue.
  for (const p of PEDESTALS) {
    ctx.fillStyle = PALETTE.cover;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = PALETTE.coverEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x + 1, p.y + 1, p.w - 2, p.h - 2);
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(p.x + p.w / 2, p.y + p.h / 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawExit(ctx, s) {
  const z = EXIT_ZONE;
  ctx.fillStyle = s.exitOpen ? 'rgba(232, 182, 76, 0.25)' : '#141a26';
  ctx.fillRect(z.x, z.y, z.w, z.h);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(z.x, z.y, z.w, z.h);
  ctx.fillStyle = s.exitOpen ? PALETTE.gold : PALETTE.red;
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(s.exitOpen ? 'EXIT — GO' : 'LOCKED', z.x + z.w / 2, z.y + z.h / 2 + 5);
}

function drawLoot(ctx, s, now) {
  for (const item of s.loot) {
    if (item.taken) continue;
    if (item.kind === 'painting') {
      ctx.fillStyle = PALETTE.goldDim;
      ctx.fillRect(item.x - 21, item.y - 16, 42, 32);
      ctx.fillStyle = PALETTE.gold;
      ctx.fillRect(item.x - 18, item.y - 13, 36, 26);
      ctx.fillStyle = item.id === 'painting-ferry' ? '#2e6f8e' : item.id === 'painting-amber' ? '#b97f2e' : '#3f7a4a';
      ctx.fillRect(item.x - 18, item.y - 13, 36, 16);
      ctx.fillStyle = 'rgba(232, 230, 223, 0.85)';
      ctx.fillRect(item.x - 18, item.y + 3, 36, 2);
    } else if (item.kind === 'gem') {
      const pulse = 1 + 0.12 * Math.sin(now * 3 + item.x);
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = item.id === 'gem-vesper' ? '#e5484d' : '#4a90d9';
      const r = 13 * pulse;
      ctx.fillRect(-r / 1.4, -r / 1.4, r * 1.4, r * 1.4);
      ctx.restore();
      ctx.strokeStyle = 'rgba(232, 230, 223, 0.9)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(item.x - 20, item.y);
      ctx.lineTo(item.x - 12, item.y);
      ctx.moveTo(item.x + 12, item.y);
      ctx.lineTo(item.x + 20, item.y);
      ctx.stroke();
    } else {
      // The Sun Dial: a gold disc with rays on its pedestal.
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + now * 0.1;
        ctx.beginPath();
        ctx.moveTo(item.x + Math.cos(a) * 22, item.y + Math.sin(a) * 22);
        ctx.lineTo(item.x + Math.cos(a) * 30, item.y + Math.sin(a) * 30);
        ctx.stroke();
      }
      ctx.fillStyle = PALETTE.gold;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.ink;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    // Lifting ring: how far the channel has come.
    if (s.thief.channel === item) {
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 32, -Math.PI / 2, -Math.PI / 2 + s.thief.channelProgress * Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = PALETTE.gold;
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${item.name} ${fmtMoney(item.value)}`, item.x, item.y + 46);
  }
}

function drawSmokes(ctx, s) {
  for (const sm of s.smokes) {
    ctx.fillStyle = 'rgba(154, 163, 178, 0.30)';
    ctx.beginPath();
    ctx.arc(sm.x, sm.y, sm.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(154, 163, 178, 0.22)';
    ctx.beginPath();
    ctx.arc(sm.x, sm.y, sm.r * 0.65, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCameras(ctx, s, now) {
  for (const c of s.cameras) {
    const off = c.off;
    drawCone(
      ctx, c.x, c.y, c.angle, CAMERA_RANGE, CAMERA_HALF_ANGLE,
      off ? 'rgba(139, 147, 165, 0.07)' : 'rgba(229, 72, 77, 0.14)',
      off ? 'rgba(139, 147, 165, 0.35)' : 'rgba(229, 72, 77, 0.5)',
    );
    ctx.fillStyle = off ? PALETTE.muted : PALETTE.red;
    ctx.fillRect(c.x - 7, c.y - 7, 14, 14);
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
    ctx.fill();
    if (c.suspicion > 0.05) {
      ctx.strokeStyle = PALETTE.red;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 16, -Math.PI / 2, -Math.PI / 2 + c.suspicion * Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = off ? PALETTE.muted : PALETTE.red;
    ctx.font = '600 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(off ? 'JAMMED' : c.name.toUpperCase(), c.x, c.y + 26);
  }
}

function drawGuards(ctx, s, now) {
  for (const g of s.guards) {
    drawCone(
      ctx, g.x, g.y, g.dir, GUARD_RANGE, GUARD_HALF_ANGLE,
      'rgba(242, 165, 65, 0.16)', 'rgba(242, 165, 65, 0.5)',
    );
    ctx.fillStyle = PALETTE.guard;
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.dir) * (g.r + 5), g.y + Math.sin(g.dir) * (g.r + 5));
    ctx.stroke();
    if (g.suspicion > 0.05) {
      ctx.strokeStyle = PALETTE.amber;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.r + 6, -Math.PI / 2, -Math.PI / 2 + g.suspicion * Math.PI * 2);
      ctx.stroke();
    }
    if (g.suspicion > 0.25) {
      ctx.fillStyle = PALETTE.amber;
      ctx.font = '700 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - g.r - 8);
    } else if (g.state === 'investigate') {
      ctx.fillStyle = PALETTE.amber;
      ctx.font = '700 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', g.x, g.y - g.r - 8);
    }
  }
}

function drawThief(ctx, s, now) {
  const t = s.thief;
  if (t.running) {
    ctx.strokeStyle = 'rgba(232, 230, 223, 0.14)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(t.x, t.y, NOISE_RADIUS * (1 + 0.05 * Math.sin(now * 6)), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = PALETTE.thief;
  ctx.beginPath();
  ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(t.x, t.y);
  ctx.lineTo(t.x + Math.cos(t.dir) * (t.r + 4), t.y + Math.sin(t.dir) * (t.r + 4));
  ctx.stroke();
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.arc(t.x + Math.cos(t.dir) * 5, t.y + Math.sin(t.dir) * 5, 3, 0, Math.PI * 2);
  ctx.fill();
  if (t.channel) {
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r + 8, -Math.PI / 2, -Math.PI / 2 + t.channelProgress * Math.PI * 2);
    ctx.stroke();
  }
}

function alarmColor(alarm) {
  if (alarm < 40) return '#4caf7d';
  if (alarm < 75) return PALETTE.amber;
  return PALETTE.red;
}

function drawHud(ctx, s) {
  ctx.fillStyle = '#0d1119';
  ctx.fillRect(0, 0, FRAME_WIDTH, HUD_HEIGHT);
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, HUD_HEIGHT - 1, FRAME_WIDTH, 1);
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.text;
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.fillText('THE GILDED VAULT', 16, 20);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '600 10px system-ui, sans-serif';
  ctx.fillText('AURUM GALLERY · NIGHT', 16, 36);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '600 10px system-ui, sans-serif';
  ctx.fillText('LOOT', 330, 18);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = '700 18px ui-monospace, monospace';
  ctx.fillText(fmtMoney(s.thief.loot), 330, 38);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '600 10px system-ui, sans-serif';
  ctx.fillText('ALARM', 560, 18);
  ctx.fillStyle = PALETTE.wall;
  rr(ctx, 560, 24, 220, 12, 6);
  ctx.fill();
  ctx.fillStyle = alarmColor(s.alarm);
  if (s.alarm > 0) {
    rr(ctx, 560, 24, Math.max(12, 220 * (s.alarm / 100)), 12, 6);
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.text;
  ctx.font = '700 13px ui-monospace, monospace';
  ctx.fillText(`${Math.round(s.alarm)}%`, 790, 36);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '600 10px system-ui, sans-serif';
  ctx.fillText('TIME', 880, 18);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '700 18px ui-monospace, monospace';
  ctx.fillText(fmtTime(s.time), 880, 38);
  const chips = toolChipRects();
  const labels = [
    { key: 'smoke', text: `1 SMOKE ×${s.thief.smokes}` },
    { key: 'jammer', text: `2 JAMMER ×${s.thief.jammers}` },
    { key: 'coin', text: `3 COIN ×${s.thief.coins}` },
  ];
  for (let i = 0; i < chips.length; i++) {
    const c = chips[i];
    const spent = labels[i].text.endsWith('×0');
    ctx.fillStyle = spent ? '#141a26' : PALETTE.cover;
    rr(ctx, c.x, c.y, c.w, c.h, 6);
    ctx.fill();
    ctx.strokeStyle = PALETTE.coverEdge;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = spent ? PALETTE.muted : PALETTE.text;
    ctx.font = '600 11px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i].text, c.x + c.w / 2, c.y + 18);
  }
  ctx.textAlign = 'left';
}

function drawHint(ctx, s) {
  const y0 = HUD_HEIGHT + WORLD_HEIGHT;
  ctx.fillStyle = '#0d1119';
  ctx.fillRect(0, y0, FRAME_WIDTH, HINT_HEIGHT);
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, y0, FRAME_WIDTH, 1);
  ctx.textAlign = 'center';
  ctx.font = '12px system-ui, sans-serif';
  if (s.message && s.messageTimer > 0) {
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText(s.message, FRAME_WIDTH / 2, y0 + 21);
  } else {
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(
      'WASD / arrows move · Shift run (loud) · E hold to lift loot · 1 smoke · 2 jammer · 3 coin · P pause · M mute',
      FRAME_WIDTH / 2,
      y0 + 21,
    );
  }
  ctx.textAlign = 'left';
}

function overlay(ctx) {
  ctx.fillStyle = 'rgba(5, 7, 11, 0.78)';
  ctx.fillRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
}

function drawTitle(ctx, s, now) {
  overlay(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = '700 44px system-ui, sans-serif';
  ctx.fillText('THE GILDED VAULT', FRAME_WIDTH / 2, 260);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '400 18px system-ui, sans-serif';
  ctx.fillText('Moth goes in tonight. Aurum Gallery holds $4,700 behind three patrols,', FRAME_WIDTH / 2, 300);
  ctx.fillText('two cameras and one alarm that only goes up.', FRAME_WIDTH / 2, 326);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '400 15px system-ui, sans-serif';
  ctx.fillText('Lift the paintings and the gems. Crack the Sun Dial to open the skylight exit.', FRAME_WIDTH / 2, 372);
  ctx.fillText('Read the cones before you move — amber is a guard, red is a camera, gold is yours.', FRAME_WIDTH / 2, 396);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '600 16px system-ui, sans-serif';
  ctx.globalAlpha = 0.65 + 0.35 * Math.sin(now * 3);
  ctx.fillText('CLICK OR PRESS ENTER TO BEGIN', FRAME_WIDTH / 2, 470);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

function drawPaused(ctx) {
  overlay(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = '700 36px system-ui, sans-serif';
  ctx.fillText('PAUSED', FRAME_WIDTH / 2, 400);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '400 16px system-ui, sans-serif';
  ctx.fillText('Press P to resume', FRAME_WIDTH / 2, 436);
  ctx.textAlign = 'left';
}

function drawBusted(ctx, s) {
  overlay(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.red;
  ctx.font = '700 44px system-ui, sans-serif';
  ctx.fillText('BUSTED', FRAME_WIDTH / 2, 330);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '400 18px system-ui, sans-serif';
  ctx.fillText('The alarm hit 100. The gallery locks down and the night is over.', FRAME_WIDTH / 2, 372);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '400 16px system-ui, sans-serif';
  ctx.fillText(`Loot kept: ${fmtMoney(s.thief.loot)} — press R to run it again`, FRAME_WIDTH / 2, 410);
  ctx.textAlign = 'left';
}

function drawWon(ctx, s) {
  overlay(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = '700 40px system-ui, sans-serif';
  ctx.fillText('CLEAN GETAWAY', FRAME_WIDTH / 2, 280);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '400 17px ui-monospace, monospace';
  const rows = [
    `Loot ............ ${fmtMoney(s.score.loot)}`,
    `Time bonus ...... ${fmtMoney(s.score.timeBonus)}`,
    `Ghost bonus ..... ${s.score.ghostBonus > 0 ? fmtMoney(s.score.ghostBonus) : '—'}`,
    `TOTAL ........... ${fmtMoney(s.score.total)}`,
  ];
  rows.forEach((row, i) => {
    ctx.fillText(row, FRAME_WIDTH / 2, 330 + i * 30);
  });
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '400 16px system-ui, sans-serif';
  ctx.fillText('Press R to run it again', FRAME_WIDTH / 2, 480);
  ctx.textAlign = 'left';
}
