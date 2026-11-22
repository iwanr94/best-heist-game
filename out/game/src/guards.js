// Midnight Ledger — guards and cameras. One job: the people and lenses
// that can spot the thief, their patrols, vision cones and states.
//
// A guard patrols its waypoints. When it sees the thief it chases; when
// it loses sight it walks to the last seen spot and looks around. A
// camera sweeps its arc from its wall mount and never moves. Both raise
// the alarm while the thief is inside their cone with line of sight.
// Smoke blocks sight; an EMP freezes every camera.

import {
  TILE, GUARD_SPEED, GUARD_CHASE_SPEED, VISION_RANGE,
  VISION_HALF_ANGLE, SNEAK_VISION_FACTOR, CAMERA_RANGE,
  CAMERA_HALF_ANGLE, SMOKE_RADIUS,
} from './config.js';
import { tileCenter, hasLineOfSight, moveCircle } from './level.js';

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Is point (px,py) inside the cone from (x,y) facing `angle`? Range,
// half-angle and a clear line of sight all have to hold. Smoke that
// covers the target hides it even inside the cone.
function inCone(x, y, angle, range, halfAngle, px, py, smokes) {
  const dx = px - x;
  const dy = py - y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist > 1 && Math.abs(angleDiff(Math.atan2(dy, dx), angle)) > halfAngle) return false;
  for (const s of smokes) {
    if (Math.hypot(px - s.x, py - s.y) < SMOKE_RADIUS) return false;
  }
  return hasLineOfSight(x, y, px, py);
}

export function makeGuards() {
  // Patrols as tile waypoints: gallery, vault, middle hall, lower hall.
  const routes = [
    [[14, 2], [19, 2], [19, 6], [14, 6]],
    [[23, 2], [27, 2], [27, 6], [23, 6]],
    [[2, 11], [10, 11], [10, 13], [2, 13]],
    [[14, 16], [19, 16], [19, 17], [14, 17]],
  ];
  return routes.map((route, i) => {
    const start = tileCenter(route[0][0], route[0][1]);
    return {
      id: i,
      x: start.x,
      y: start.y,
      angle: 0,
      route: route.map(([c, r]) => tileCenter(c, r)),
      waypoint: 1,
      mode: 'patrol', // patrol | suspicious | chase
      wait: 0, // seconds left standing at a waypoint / looking around
      lastSeenX: 0,
      lastSeenY: 0,
      unseenFor: 0,
      seesPlayer: false,
    };
  });
}

export function makeCameras() {
  // Wall mounts (tile, base angle, sweep). All three watch the rooms
  // the loot sits in: the gallery, the vault and the lower hall.
  const mounts = [
    { col: 17, row: 0, base: Math.PI / 2, sweep: 0.65, speed: 0.55 },
    { col: 25, row: 0, base: Math.PI / 2, sweep: 0.6, speed: 0.7 },
    { col: 6, row: 8, base: Math.PI / 2, sweep: 0.7, speed: 0.5 },
  ];
  return mounts.map((m, i) => ({
    id: i,
    x: (m.col + 0.5) * TILE,
    y: (m.row + 0.5) * TILE,
    base: m.base,
    sweep: m.sweep,
    speed: m.speed,
    phase: i * 1.7,
    angle: m.base,
    seesPlayer: false,
    disabledUntil: 0,
  }));
}

function stepToward(g, tx, ty, speed, dt) {
  const dx = tx - g.x;
  const dy = ty - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  const moved = moveCircle(g.x, g.y, (dx / dist) * step, (dy / dist) * step, 12);
  g.x = moved.x;
  g.y = moved.y;
  g.angle = Math.atan2(dy, dx);
  return dist - step < 2;
}

export function updateGuards(guards, player, smokes, dt, time) {
  for (const g of guards) {
    const range = VISION_RANGE * (player.sneaking ? SNEAK_VISION_FACTOR : 1);
    const seen = inCone(g.x, g.y, g.angle, range, VISION_HALF_ANGLE, player.x, player.y, smokes);
    g.seesPlayer = seen;
    if (seen) {
      g.lastSeenX = player.x;
      g.lastSeenY = player.y;
      g.unseenFor = 0;
      if (g.mode !== 'chase') g.mode = 'chase';
    } else if (g.mode === 'chase') {
      g.unseenFor += dt;
      if (g.unseenFor > 3) {
        g.mode = 'suspicious';
        g.wait = 2.5; // look around the last seen spot before giving up
      }
    }

    if (g.mode === 'patrol') {
      const target = g.route[g.waypoint];
      if (g.wait > 0) {
        g.wait -= dt;
      } else if (stepToward(g, target.x, target.y, GUARD_SPEED, dt)) {
        g.waypoint = (g.waypoint + 1) % g.route.length;
        g.wait = 0.6; // pause and scan at each corner
      }
    } else if (g.mode === 'chase') {
      stepToward(g, player.x, player.y, GUARD_CHASE_SPEED, dt);
    } else if (g.mode === 'suspicious') {
      if (g.wait > 0) {
        g.wait -= dt;
        g.angle += dt * 1.4; // scan the room
      } else if (stepToward(g, g.lastSeenX, g.lastSeenY, GUARD_SPEED * 1.4, dt)) {
        g.mode = 'patrol';
      }
    }
  }
}

export function updateCameras(cameras, player, smokes, dt, time, empUntil) {
  for (const cam of cameras) {
    cam.angle = cam.base + Math.sin(time * cam.speed + cam.phase) * cam.sweep;
    const disabled = time < empUntil;
    cam.seesPlayer = !disabled && inCone(
      cam.x, cam.y, cam.angle, CAMERA_RANGE, CAMERA_HALF_ANGLE,
      player.x, player.y, smokes,
    );
  }
}

export { angleDiff };
