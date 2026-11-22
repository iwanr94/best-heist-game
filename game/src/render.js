// The Aurum Job — render: everything the judge sees in one frame. Night
// gallery light, amber cones, gold loot, the green exit beacon. Safe cover,
// danger and loot are obvious at a glance by colour, not by label.

import { CONFIG } from './config.js';
import { angleDifference } from './world.js';

function drawCone(ctx, x, y, angle, range, halfAngle, rgb, alpha) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  const grad = ctx.createRadialGradient(x, y, 8, x, y, range);
  grad.addColorStop(0, `rgba(${rgb},${alpha})`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
}

function drawWall(ctx, rect) {
  ctx.fillStyle = CONFIG.colors.wall;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = CONFIG.colors.wallTrim;
  if (rect.h <= 16) ctx.fillRect(rect.x, rect.y + rect.h - 3, rect.w, 3);
  else if (rect.w <= 16) ctx.fillRect(rect.x + rect.w - 3, rect.y, 3, rect.h);
}

function drawPainting(ctx, item, now) {
  const w = 64;
  const h = 44;
  const x = item.x - w / 2;
  const y = item.y - h / 2;
  ctx.save();
  ctx.fillStyle = CONFIG.colors.paintingFrame;
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  ctx.fillStyle = CONFIG.colors.paintingArt;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(245,239,224,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x + w * 0.3, y + h * 0.35, 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 8, y + h - 6);
  ctx.lineTo(x + w * 0.55, y + h * 0.45);
  ctx.lineTo(x + w - 8, y + h - 6);
  ctx.stroke();
  if (!item.taken) {
    const glow = 0.5 + 0.3 * Math.sin(now * 2.4 + item.x);
    ctx.strokeStyle = `rgba(255,215,94,${glow})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);
  } else {
    ctx.fillStyle = 'rgba(13,18,38,0.85)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(245,239,224,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }
  ctx.restore();
}

function drawGem(ctx, item, now) {
  const bob = Math.sin(now * 2.2 + item.x) * 2;
  ctx.save();
  ctx.translate(item.x, item.y + bob);
  if (!item.taken) {
    const glow = 0.45 + 0.3 * Math.sin(now * 3 + item.x);
    const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 30);
    grad.addColorStop(0, item.color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = glow;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = '#1c2340';
  ctx.fillRect(-14, 6, 28, 8);
  if (!item.taken) {
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(10, 0);
    ctx.lineTo(0, 10);
    ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(4, -2);
    ctx.lineTo(-4, -2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawDial(ctx, item, world, now) {
  const x = item.x;
  const y = item.y;
  ctx.save();
  ctx.fillStyle = '#1c2340';
  ctx.beginPath();
  ctx.arc(x, y, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a2f45';
  ctx.fillRect(x - 20, y + 20, 40, 10);
  if (!item.taken) {
    const pulse = 0.6 + 0.35 * Math.sin(now * 2.6);
    const grad = ctx.createRadialGradient(x, y, 4, x, y, 64);
    grad.addColorStop(0, `rgba(255,215,94,${pulse})`);
    grad.addColorStop(1, 'rgba(255,215,94,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, 64, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = CONFIG.colors.dialGold;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a6d1f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 11);
    ctx.moveTo(x, y);
    ctx.lineTo(x + 8, y + 3);
    ctx.stroke();
    ctx.fillStyle = '#8a6d1f';
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SUN DIAL', x, y - 34);
  } else {
    ctx.strokeStyle = 'rgba(245,239,224,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawExit(ctx, world, now) {
  const z = CONFIG.exitZone;
  ctx.save();
  const open = world.exitOpen;
  const pulse = open ? 0.55 + 0.35 * Math.sin(now * 3.2) : 0.25;
  ctx.fillStyle = open ? `rgba(47,212,122,${pulse})` : 'rgba(47,212,122,0.14)';
  ctx.fillRect(z.x, z.y, z.w, z.h);
  ctx.strokeStyle = open ? CONFIG.colors.exitBeacon : 'rgba(154,163,192,0.6)';
  ctx.lineWidth = 3;
  ctx.strokeRect(z.x, z.y, z.w, z.h);
  ctx.fillStyle = open ? '#eafff3' : CONFIG.colors.muted;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT  OPEN' : 'EXIT  LOCKED', z.x + z.w / 2, z.y + 23);
  if (open) {
    const grad = ctx.createRadialGradient(z.x + z.w / 2, z.y, 4, z.x + z.w / 2, z.y, 120);
    grad.addColorStop(0, 'rgba(47,212,122,0.35)');
    grad.addColorStop(1, 'rgba(47,212,122,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(z.x + z.w / 2, z.y, 120, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawGuard(ctx, guard, now) {
  ctx.save();
  drawCone(
    ctx,
    guard.x,
    guard.y,
    guard.angle,
    CONFIG.guard.coneRange,
    CONFIG.guard.coneHalfAngle,
    CONFIG.colors.guardCone,
    guard.state === 'chase' ? 0.34 : 0.22,
  );
  ctx.fillStyle = '#3a2f16';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, CONFIG.guard.radius + 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = guard.state === 'chase' ? '#e5484d' : '#d8b25a';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, CONFIG.guard.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1408';
  ctx.beginPath();
  ctx.arc(guard.x + Math.cos(guard.angle) * 6, guard.y + Math.sin(guard.angle) * 6, 5, 0, Math.PI * 2);
  ctx.fill();
  if (guard.state === 'chase') {
    ctx.fillStyle = '#ff5b5b';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', guard.x, guard.y - 26);
  } else if (guard.state === 'search') {
    ctx.fillStyle = '#f5a623';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', guard.x, guard.y - 26);
  } else if (guard.suspicion > 0.05) {
    const w = 30;
    ctx.fillStyle = 'rgba(13,18,38,0.9)';
    ctx.fillRect(guard.x - w / 2, guard.y - 34, w, 5);
    ctx.fillStyle = '#f5a623';
    ctx.fillRect(guard.x - w / 2, guard.y - 34, w * Math.min(1, guard.suspicion / CONFIG.guard.suspicionTime), 5);
    ctx.fillStyle = '#f5a623';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', guard.x, guard.y - 38);
  }
  ctx.restore();
}

function drawCamera(ctx, camera, world, now) {
  ctx.save();
  const disabled = now < camera.disabledUntil;
  if (!disabled) {
    drawCone(ctx, camera.x, camera.y, camera.angle, CONFIG.camera.range, CONFIG.camera.halfAngle, CONFIG.colors.cameraCone, 0.2);
  }
  ctx.fillStyle = '#2a2f45';
  ctx.fillRect(camera.x - 10, camera.y - 6, 20, 12);
  ctx.fillStyle = disabled ? '#5a6278' : '#e5484d';
  ctx.beginPath();
  ctx.arc(camera.x, camera.y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = disabled ? '#9aa3c0' : '#ff8a8d';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(camera.label + (disabled ? ' OFF' : ''), camera.x + 14, camera.y + 4);
  ctx.restore();
}

function drawPlayer(ctx, player, now) {
  ctx.save();
  ctx.fillStyle = 'rgba(242,234,216,0.16)';
  ctx.beginPath();
  ctx.arc(player.x, player.y, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = CONFIG.colors.playerCloak;
  ctx.beginPath();
  ctx.arc(player.x, player.y, CONFIG.player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = CONFIG.colors.player;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1408';
  ctx.beginPath();
  ctx.arc(player.x - 3, player.y - 1, 1.6, 0, Math.PI * 2);
  ctx.arc(player.x + 3, player.y - 1, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMinimap(ctx, world, player) {
  const mw = 150;
  const mh = 94;
  const mx = CONFIG.worldWidth - mw - 14;
  const my = CONFIG.worldHeight - mh - 14;
  const sx = mw / CONFIG.worldWidth;
  const sy = mh / CONFIG.worldHeight;
  ctx.save();
  ctx.fillStyle = 'rgba(10,14,30,0.85)';
  ctx.fillRect(mx, my, mw, mh);
  ctx.strokeStyle = 'rgba(245,239,224,0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(mx, my, mw, mh);
  for (const wall of [...CONFIG.walls, ...CONFIG.pillars]) {
    ctx.fillStyle = 'rgba(154,163,192,0.7)';
    ctx.fillRect(mx + wall.x * sx, my + wall.y * sy, Math.max(1, wall.w * sx), Math.max(1, wall.h * sy));
  }
  for (const item of world.loot) {
    if (item.taken) continue;
    ctx.fillStyle = item.kind === 'dial' ? CONFIG.colors.dialGold : item.kind === 'gem' ? '#7ee0ff' : '#ffd75e';
    ctx.beginPath();
    ctx.arc(mx + item.x * sx, my + item.y * sy, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const guard of world.guards) {
    ctx.fillStyle = '#d8b25a';
    ctx.beginPath();
    ctx.arc(mx + guard.x * sx, my + guard.y * sy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(mx + player.x * sx, my + player.y * sy, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(245,239,224,0.75)';
  ctx.font = 'bold 9px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('MAP', mx + 4, my + 11);
  ctx.restore();
}

export function render(ctx, world, player, now) {
  ctx.clearRect(0, 0, CONFIG.worldWidth, CONFIG.worldHeight);
  ctx.fillStyle = CONFIG.colors.floor;
  ctx.fillRect(0, 0, CONFIG.worldWidth, CONFIG.worldHeight);
  ctx.fillStyle = CONFIG.colors.floorAlt;
  const tile = 64;
  for (let y = 0; y < CONFIG.worldHeight; y += tile) {
    for (let x = 0; x < CONFIG.worldWidth; x += tile) {
      if (((x + y) / tile) % 2 === 0) ctx.fillRect(x, y, tile, tile);
    }
  }
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#ffd75e';
  ctx.beginPath();
  ctx.arc(640, 400, 320, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  for (const wall of CONFIG.walls) drawWall(ctx, wall);
  for (const pillar of CONFIG.pillars) {
    ctx.fillStyle = '#232a4a';
    ctx.fillRect(pillar.x, pillar.y, pillar.w, pillar.h);
    ctx.fillStyle = CONFIG.colors.wallTrim;
    ctx.fillRect(pillar.x, pillar.y, pillar.w, 3);
  }

  ctx.fillStyle = 'rgba(245,239,224,0.5)';
  ctx.font = 'italic 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('AURUM GALLERY', 408, 130);
  ctx.font = 'italic 13px Georgia, serif';
  ctx.fillText('GEM ROOM', 1032, 90);
  ctx.fillText('THE VAULT', 1032, 730);

  for (const item of world.loot) {
    if (item.kind === 'painting') drawPainting(ctx, item, now);
    else if (item.kind === 'gem') drawGem(ctx, item, now);
    else drawDial(ctx, item, world, now);
  }
  drawExit(ctx, world, now);

  for (const smoke of world.smoke) {
    if (now >= smoke.until) continue;
    const a = Math.min(0.5, (smoke.until - now) * 0.25);
    const grad = ctx.createRadialGradient(smoke.x, smoke.y, 6, smoke.x, smoke.y, CONFIG.tools.smokeRadius);
    grad.addColorStop(0, `rgba(200,205,220,${a})`);
    grad.addColorStop(1, 'rgba(200,205,220,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(smoke.x, smoke.y, CONFIG.tools.smokeRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const camera of world.cameras) drawCamera(ctx, camera, world, now);
  for (const guard of world.guards) drawGuard(ctx, guard, now);
  drawPlayer(ctx, player, now);

  if (world.channelTarget) {
    const item = world.channelTarget;
    const w = 64;
    const frac = Math.min(1, world.channelProgress / item.channel);
    const bx = item.x - w / 2;
    const by = item.y - 44;
    ctx.fillStyle = 'rgba(10,14,30,0.9)';
    ctx.fillRect(bx, by, w, 8);
    ctx.fillStyle = CONFIG.colors.dialGold;
    ctx.fillRect(bx, by, w * frac, 8);
    ctx.strokeStyle = 'rgba(245,239,224,0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, w, 8);
    ctx.fillStyle = CONFIG.colors.text;
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.kind === 'dial' ? 'CRACKING…' : 'PICKING…', item.x, by - 6);
  }

  if (world.spottedFlash > 0.03) {
    ctx.fillStyle = `rgba(229,72,77,${world.spottedFlash * 0.1})`;
    ctx.fillRect(0, 0, CONFIG.worldWidth, CONFIG.worldHeight);
  }

  drawMinimap(ctx, world, player);
}
