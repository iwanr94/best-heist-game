// The Aurum Job — world: level state, guard and camera behaviour, loot,
// alarm and tools. One job: decide what the game *is* right now.

import { CONFIG } from './config.js';

export function rectsCollide(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

export function segmentHitsRect(x1, y1, x2, y2, rect) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  if (Math.abs(dx) < 1e-9) {
    if (x1 < rect.x || x1 > rect.x + rect.w) return false;
  } else {
    let t1 = (rect.x - x1) / dx;
    let t2 = (rect.x + rect.w - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (Math.abs(dy) < 1e-9) {
    if (y1 < rect.y || y1 > rect.y + rect.h) return false;
  } else {
    let t1 = (rect.y - y1) / dy;
    let t2 = (rect.y + rect.h - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

export function hasLineOfSight(x1, y1, x2, y2, solids) {
  for (const s of solids) {
    if (segmentHitsRect(x1, y1, x2, y2, s)) return false;
  }
  return true;
}

export function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createWorld(seed) {
  const solids = [...CONFIG.walls, ...CONFIG.pillars];
  const guards = CONFIG.guards.map((g, i) => ({
    name: g.name,
    waypoints: g.waypoints,
    waypointIndex: i % g.waypoints.length,
    x: g.waypoints[i % g.waypoints.length].x,
    y: g.waypoints[i % g.waypoints.length].y,
    angle: Math.PI / 2,
    state: 'patrol',
    suspicion: 0,
    lastSeen: null,
    lostTime: 0,
    searchTime: 0,
    searchAngle: 0,
  }));
  const cameras = CONFIG.cameras.map((c) => ({
    x: c.x,
    y: c.y,
    baseAngle: c.baseAngle,
    angle: c.baseAngle,
    sweepPhase: 0,
    disabledUntil: -1,
    label: c.label,
  }));
  const loot = [
    ...CONFIG.paintings.map((p) => ({ ...p, kind: 'painting', taken: false, progress: 0 })),
    ...CONFIG.gems.map((g) => ({ ...g, kind: 'gem', taken: false, progress: 0 })),
    { ...CONFIG.dial, kind: 'dial', taken: false, progress: 0 },
  ];
  return {
    seed,
    random: mulberry32(seed),
    solids,
    guards,
    cameras,
    loot,
    smoke: [],
    alarm: 0,
    everSeen: false,
    score: 0,
    lootTaken: 0,
    tiersTaken: 0,
    tiers: { painting: false, gem: false, dial: false },
    dialTaken: false,
    exitOpen: false,
    elapsed: 0,
    smokeLeft: CONFIG.tools.smokeCount,
    jammerLeft: CONFIG.tools.jammerCount,
    channelTarget: null,
    channelProgress: 0,
    hint: 'start',
    hintTimer: 0,
    spottedFlash: 0,
  };
}

export function moveWithCollision(entity, dx, dy, solids, radius) {
  let nx = entity.x + dx;
  let ny = entity.y + dy;
  for (const s of solids) {
    if (circleHitsRect(nx, entity.y, radius, s)) nx = entity.x;
    if (circleHitsRect(entity.x, ny, radius, s)) ny = entity.y;
  }
  nx = Math.max(16 + radius, Math.min(CONFIG.worldWidth - 16 - radius, nx));
  ny = Math.max(16 + radius, Math.min(CONFIG.worldHeight - 16 - radius, ny));
  entity.x = nx;
  entity.y = ny;
}

function seesPlayer(observer, range, halfAngle, player, world) {
  const dx = player.x - observer.x;
  const dy = player.y - observer.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 12) return hasLineOfSight(observer.x, observer.y, player.x, player.y, world.solids);
  const ang = Math.atan2(dy, dx);
  if (Math.abs(angleDifference(ang, observer.angle)) > halfAngle) return false;
  return hasLineOfSight(observer.x, observer.y, player.x, player.y, world.solids);
}

function inSmoke(x, y, world, now) {
  for (const s of world.smoke) {
    if (now < s.until && Math.hypot(x - s.x, y - s.y) < CONFIG.tools.smokeRadius) return true;
  }
  return false;
}

export function updateWorld(world, player, dt, now) {
  world.elapsed += dt;
  world.smoke = world.smoke.filter((s) => now < s.until);
  const playerHidden = inSmoke(player.x, player.y, world, now);
  let anySeen = false;

  for (const guard of world.guards) {
    const seen = !playerHidden && seesPlayer(guard, CONFIG.guard.coneRange, CONFIG.guard.coneHalfAngle, player, world);
    if (seen) {
      anySeen = true;
      world.everSeen = true;
      guard.lastSeen = { x: player.x, y: player.y };
      guard.lostTime = 0;
      guard.suspicion += dt;
      if (guard.state === 'patrol' || guard.state === 'search') {
        if (guard.suspicion >= CONFIG.guard.suspicionTime) {
          guard.state = 'chase';
          guard.suspicion = 1;
        }
      }
    } else {
      guard.suspicion = Math.max(0, guard.suspicion - dt * 1.5);
      if (guard.state === 'chase') {
        guard.lostTime += dt;
        if (guard.lostTime >= CONFIG.guard.loseSightTime) {
          guard.state = 'search';
          guard.searchTime = 0;
          guard.searchAngle = guard.angle;
        }
      }
    }

    if (guard.state === 'patrol') {
      const target = guard.waypoints[guard.waypointIndex];
      const dx = target.x - guard.x;
      const dy = target.y - guard.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 6) {
        guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
      } else {
        const step = CONFIG.guard.patrolSpeed * dt;
        const mx = (dx / dist) * step;
        const my = (dy / dist) * step;
        guard.angle = Math.atan2(dy, dx);
        moveWithCollision(guard, mx, my, world.solids, CONFIG.guard.radius);
      }
    } else if (guard.state === 'chase' && guard.lastSeen) {
      const dx = guard.lastSeen.x - guard.x;
      const dy = guard.lastSeen.y - guard.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 4) {
        const step = CONFIG.guard.chaseSpeed * dt;
        const mx = (dx / dist) * step;
        const my = (dy / dist) * step;
        guard.angle = Math.atan2(dy, dx);
        moveWithCollision(guard, mx, my, world.solids, CONFIG.guard.radius);
      }
    } else if (guard.state === 'search') {
      guard.searchTime += dt;
      guard.angle = guard.searchAngle + Math.sin(guard.searchTime * 1.6) * 1.1;
      if (guard.searchTime >= CONFIG.guard.searchTime) {
        guard.state = 'patrol';
        guard.suspicion = 0;
      }
    }

    const touchDist = Math.hypot(player.x - guard.x, player.y - guard.y);
    if (touchDist < CONFIG.guard.touchRadius) {
      world.alarm = Math.min(100, world.alarm + CONFIG.alarm.touchPerSecond * dt);
      anySeen = true;
    }
  }

  for (const camera of world.cameras) {
    camera.sweepPhase += dt * CONFIG.camera.sweepSpeed;
    camera.angle = camera.baseAngle + Math.sin(camera.sweepPhase) * CONFIG.camera.sweep;
    if (now < camera.disabledUntil) continue;
    if (!playerHidden && seesPlayer(camera, CONFIG.camera.range, CONFIG.camera.halfAngle, player, world)) {
      anySeen = true;
      world.everSeen = true;
    }
  }

  if (anySeen) {
    world.alarm = Math.min(100, world.alarm + CONFIG.alarm.risePerSecond * dt);
    world.spottedFlash = Math.min(1, world.spottedFlash + dt * 2);
  } else {
    world.alarm = Math.max(0, world.alarm - CONFIG.alarm.fallPerSecond * dt);
    world.spottedFlash = Math.max(0, world.spottedFlash - dt);
  }

  return anySeen;
}

export function nearestLoot(world, player, maxDist) {
  let best = null;
  let bestDist = maxDist;
  for (const item of world.loot) {
    if (item.taken) continue;
    const d = Math.hypot(item.x - player.x, item.y - player.y);
    if (d < bestDist) {
      best = item;
      bestDist = d;
    }
  }
  return best;
}

export function takeLoot(world, item) {
  item.taken = true;
  world.lootTaken += 1;
  world.score += item.value;
  if (!world.tiers[item.kind]) {
    world.tiers[item.kind] = true;
    world.tiersTaken += 1;
  }
  if (item.kind === 'dial') {
    world.dialTaken = true;
    world.exitOpen = true;
    world.alarm = Math.min(100, world.alarm + CONFIG.alarm.dialPickup);
  }
}

export function dropSmoke(world, player, now) {
  if (world.smokeLeft <= 0) return false;
  world.smokeLeft -= 1;
  world.smoke.push({ x: player.x, y: player.y, until: now + CONFIG.tools.smokeSeconds });
  for (const guard of world.guards) {
    if (guard.state === 'chase') {
      guard.state = 'search';
      guard.searchTime = 0;
      guard.searchAngle = guard.angle;
    }
  }
  return true;
}

export function fireJammer(world, player, now) {
  if (world.jammerLeft <= 0) return false;
  let best = null;
  let bestDist = Infinity;
  for (const camera of world.cameras) {
    if (now < camera.disabledUntil) continue;
    const d = Math.hypot(camera.x - player.x, camera.y - player.y);
    if (d < bestDist) {
      best = camera;
      bestDist = d;
    }
  }
  if (!best) return false;
  world.jammerLeft -= 1;
  best.disabledUntil = now + CONFIG.tools.jammerSeconds;
  return true;
}
