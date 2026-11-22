// The Gilded Vault — the watchers: patrolling guards and sweeping
// cameras. Both read the same cone: range, angle and a clear line of
// sight. A sighting is never instant: a 0.7 s grace with a filling ring
// and a "!" gives the thief a fair chance to break away.

import {
  GUARD_HALF_ANGLE,
  GUARD_RANGE,
  CAMERA_HALF_ANGLE,
  CAMERA_RANGE,
  GRACE_TIME,
  GUARD_PATROL_SPEED,
  GUARD_CHASE_SPEED,
} from './config.js';
import { losClear, moveCircle, segmentThroughCircle } from './level.js';

function angleTo(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return Math.abs(d);
}

/** Whether a watcher's cone reaches the thief, through smoke and walls. */
function coneSees(wx, wy, dir, range, halfAngle, thief, env) {
  const dx = thief.x - wx;
  const dy = thief.y - wy;
  const dist = Math.hypot(dx, dy);
  const sight = thief.inVent ? range * 0.5 : range;
  if (dist > sight) return false;
  if (angleDiff(Math.atan2(dy, dx), dir) > halfAngle) return false;
  if (!losClear(wx, wy, thief.x, thief.y)) return false;
  for (const s of env.smokes) {
    if (segmentThroughCircle(wx, wy, thief.x, thief.y, s.x, s.y, s.r)) return false;
  }
  return true;
}

// ---------------------------------------------------------------- guards

export function createGuard(def) {
  const start = def.waypoints[0];
  return {
    name: def.name,
    waypoints: def.waypoints,
    x: start.x,
    y: start.y,
    r: 13,
    dir: 0,
    wp: 1,
    state: 'patrol',
    suspicion: 0,
    lostTimer: 0,
    searchTimer: 0,
    scanDir: 0,
    lastSeen: null,
    investigateTarget: null,
    investigateTimer: 0,
    alarming: false,
    stuckTimer: 0,
    prevX: start.x,
    prevY: start.y,
  };
}

export function guardSeesThief(g, thief, env) {
  return coneSees(g.x, g.y, g.dir, GUARD_RANGE, GUARD_HALF_ANGLE, thief, env);
}

export function updateGuard(g, dt, env) {
  const thief = env.thief;
  const sees = guardSeesThief(g, thief, env);
  if (sees) {
    g.lastSeen = { x: thief.x, y: thief.y };
    g.lostTimer = 0;
    g.suspicion = Math.min(1, g.suspicion + dt / GRACE_TIME);
    g.dir = angleTo(g.x, g.y, thief.x, thief.y);
    if (g.suspicion >= 1 && g.state !== 'chase') {
      g.state = 'chase';
      if (env.onSpotted) env.onSpotted('guard');
    }
  } else {
    g.suspicion = Math.max(0, g.suspicion - dt / (GRACE_TIME * 2));
    if (g.state === 'chase') {
      g.lostTimer += dt;
      if (g.lostTimer > 2) {
        g.state = 'search';
        g.searchTimer = 2.5;
        g.lostTimer = 0;
      }
    }
  }
  g.alarming = g.state === 'chase' && sees;

  if (g.state === 'patrol') {
    const target = g.waypoints[g.wp];
    const dx = target.x - g.x;
    const dy = target.y - g.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) {
      g.wp = (g.wp + 1) % g.waypoints.length;
    } else {
      g.dir = angleTo(g.x, g.y, target.x, target.y);
      moveCircle(g, (dx / dist) * GUARD_PATROL_SPEED * dt, (dy / dist) * GUARD_PATROL_SPEED * dt, g.r);
    }
    const moved = Math.hypot(g.x - g.prevX, g.y - g.prevY);
    if (moved < GUARD_PATROL_SPEED * dt * 0.15 && dist >= 6) {
      g.stuckTimer += dt;
      if (g.stuckTimer > 1.5) {
        g.wp = (g.wp + 1) % g.waypoints.length;
        g.stuckTimer = 0;
      }
    } else {
      g.stuckTimer = 0;
    }
    g.prevX = g.x;
    g.prevY = g.y;
  } else if (g.state === 'chase') {
    const tx = sees ? thief.x : g.lastSeen.x;
    const ty = sees ? thief.y : g.lastSeen.y;
    const dx = tx - g.x;
    const dy = ty - g.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 4) {
      g.dir = angleTo(g.x, g.y, tx, ty);
      moveCircle(g, (dx / dist) * GUARD_CHASE_SPEED * dt, (dy / dist) * GUARD_CHASE_SPEED * dt, g.r);
    }
  } else if (g.state === 'search') {
    g.searchTimer -= dt;
    g.dir += dt * 1.6;
    if (g.searchTimer <= 0) g.state = 'patrol';
  } else if (g.state === 'investigate') {
    const t = g.investigateTarget;
    if (t) {
      const dx = t.x - g.x;
      const dy = t.y - g.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 10) {
        g.investigateTimer -= dt;
        g.dir += dt * 1.2;
        if (g.investigateTimer <= 0) {
          g.state = 'patrol';
          g.investigateTarget = null;
        }
      } else {
        g.dir = angleTo(g.x, g.y, t.x, t.y);
        moveCircle(g, (dx / dist) * GUARD_PATROL_SPEED * dt, (dy / dist) * GUARD_PATROL_SPEED * dt, g.r);
      }
    } else {
      g.state = 'patrol';
    }
  }
}

// ---------------------------------------------------------------- cameras

export function createCamera(def) {
  return {
    name: def.name,
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    sweep: def.sweep,
    sweepSpeed: def.sweepSpeed,
    phase: def.phase,
    time: 0,
    angle: def.baseAngle,
    suspicion: 0,
    alarmed: false,
    off: false,
  };
}

export function cameraSeesThief(c, thief, env) {
  return coneSees(c.x, c.y, c.angle, CAMERA_RANGE, CAMERA_HALF_ANGLE, thief, env);
}

export function updateCamera(c, dt, env) {
  c.time += dt;
  c.angle = c.baseAngle + Math.sin(c.time * c.sweepSpeed + c.phase) * c.sweep;
  c.alarmed = false;
  if (env.jammerTime > 0) {
    c.off = true;
    c.suspicion = 0;
    return;
  }
  c.off = false;
  if (cameraSeesThief(c, env.thief, env)) {
    c.suspicion = Math.min(1, c.suspicion + dt / GRACE_TIME);
    if (c.suspicion >= 1) {
      c.alarmed = true;
      if (env.onSpotted) env.onSpotted('camera');
    }
  } else {
    c.suspicion = Math.max(0, c.suspicion - dt / (GRACE_TIME * 2));
  }
}
