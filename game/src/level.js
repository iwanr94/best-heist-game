// The Gilded Vault — the gallery floor: walls, cover, loot, patrols,
// cameras and the exit. Every position is fixed, so a screenshot scene
// and a real playthrough share the same room.

import { WORLD_WIDTH, WORLD_HEIGHT } from './config.js';

// Axis-aligned solid rectangles. The first four are the outer walls.
export const WALLS = [
  { x: 0, y: 0, w: WORLD_WIDTH, h: 16 },
  { x: 0, y: WORLD_HEIGHT - 16, w: WORLD_WIDTH, h: 16 },
  { x: 0, y: 0, w: 16, h: WORLD_HEIGHT },
  { x: WORLD_WIDTH - 16, y: 0, w: 16, h: WORLD_HEIGHT },
  // Service corridor divider; the door gap is x 656..776.
  { x: 16, y: 140, w: 640, h: 16 },
  { x: 776, y: 140, w: 488, h: 16 },
  // East wing divider; the door gap is y 420..520.
  { x: 860, y: 156, w: 16, h: 264 },
  // Vault room, top wall; the door gap is x 200..280.
  { x: 16, y: 460, w: 184, h: 16 },
  { x: 280, y: 460, w: 96, h: 16 },
  // Vault room, right wall.
  { x: 360, y: 460, w: 16, h: 244 },
];

// Display pedestals: solid cover blocks the thief and the guards can
// hide behind, and they block a watcher's line of sight.
export const PEDESTALS = [
  { x: 300, y: 300, w: 46, h: 46 },
  { x: 560, y: 300, w: 46, h: 46 },
  { x: 420, y: 480, w: 46, h: 46 },
  { x: 700, y: 480, w: 46, h: 46 },
  { x: 980, y: 300, w: 46, h: 46 },
];

// The vent shaft: a low crawl space along the bottom right. A thief
// inside it is half as easy to spot, at the cost of a slow crawl.
export const VENT = { x: 900, y: 560, w: 348, h: 128 };

// Loot, three tiers. A painting lifts fast, a gem takes longer, and the
// Sun Dial is the slow crack that opens the exit — and spikes the alarm.
export const LOOT = [
  { id: 'painting-ferry', kind: 'painting', name: 'Dusk Ferry', value: 400, x: 240, y: 220, channel: 0.6 },
  { id: 'painting-amber', kind: 'painting', name: 'Amber Field', value: 400, x: 640, y: 260, channel: 0.6 },
  { id: 'painting-orchard', kind: 'painting', name: 'Night Orchard', value: 400, x: 1080, y: 240, channel: 0.6 },
  { id: 'gem-vesper', kind: 'gem', name: 'Vesper Ruby', value: 900, x: 443, y: 503, channel: 1.2 },
  { id: 'gem-tide', kind: 'gem', name: 'Tide Sapphire', value: 900, x: 723, y: 503, channel: 1.2 },
  { id: 'sundial', kind: 'dial', name: 'Sun Dial', value: 2500, x: 200, y: 590, channel: 3.0 },
];

export const GUARD_DEFS = [
  {
    name: 'Hall',
    waypoints: [
      { x: 220, y: 280 },
      { x: 620, y: 280 },
      { x: 620, y: 540 },
      { x: 220, y: 540 },
    ],
  },
  {
    name: 'East',
    waypoints: [
      { x: 940, y: 220 },
      { x: 1160, y: 220 },
      { x: 1160, y: 420 },
      { x: 940, y: 420 },
    ],
  },
  {
    name: 'Vault',
    waypoints: [
      { x: 400, y: 620 },
      { x: 660, y: 620 },
      { x: 660, y: 400 },
      { x: 400, y: 400 },
    ],
  },
];

export const CAMERA_DEFS = [
  { name: 'Cam A', x: 640, y: 24, baseAngle: Math.PI / 2, sweep: 0.87, sweepSpeed: 0.55, phase: 0 },
  { name: 'Cam B', x: 1256, y: 360, baseAngle: Math.PI, sweep: 0.79, sweepSpeed: 0.7, phase: 1.9 },
];

// The skylight exit on the top right wall. Locked until the Sun Dial
// is taken; walking into it with the dial ends the heist.
export const EXIT_ZONE = { x: 1160, y: 16, w: 88, h: 44 };
export const SPAWN = { x: 80, y: 380 };

// ---------------------------------------------------------------- collision

function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

/** Whether a circle at (x, y) with radius r touches any solid rect. */
export function collides(x, y, r) {
  for (const w of WALLS) if (circleHitsRect(x, y, r, w)) return true;
  for (const p of PEDESTALS) if (circleHitsRect(x, y, r, p)) return true;
  return false;
}

/**
 * Moves a circle by (dx, dy) one axis at a time, so it slides along a
 * wall instead of sticking to it. Mutates and returns the position.
 */
export function moveCircle(pos, dx, dy, r) {
  const nx = pos.x + dx;
  if (!collides(nx, pos.y, r)) pos.x = nx;
  const ny = pos.y + dy;
  if (!collides(pos.x, ny, r)) pos.y = ny;
  return pos;
}

// ---------------------------------------------------------------- line of sight

/** Whether the segment (x1,y1)-(x2,y2) crosses a rectangle (slab test). */
function segmentHitsRect(x1, y1, x2, y2, rect) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  if (dx === 0) {
    if (x1 < rect.x || x1 > rect.x + rect.w) return false;
  } else {
    let t1 = (rect.x - x1) / dx;
    let t2 = (rect.x + rect.w - x1) / dx;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (dy === 0) {
    if (y1 < rect.y || y1 > rect.y + rect.h) return false;
  } else {
    let t1 = (rect.y - y1) / dy;
    let t2 = (rect.y + rect.h - y1) / dy;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

/** Whether the segment between two points is blocked by a wall or pedestal. */
export function segmentBlocked(x1, y1, x2, y2) {
  for (const w of WALLS) if (segmentHitsRect(x1, y1, x2, y2, w)) return true;
  for (const p of PEDESTALS) if (segmentHitsRect(x1, y1, x2, y2, p)) return true;
  return false;
}

/** Whether two points can see each other across the room. */
export function losClear(x1, y1, x2, y2) {
  return !segmentBlocked(x1, y1, x2, y2);
}

/** Whether the segment passes through a circle (a smoke cloud). */
export function segmentThroughCircle(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((cx - x1) * dx + (cy - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = x1 + t * dx;
  const py = y1 + t * dy;
  const ddx = cx - px;
  const ddy = cy - py;
  return ddx * ddx + ddy * ddy < r * r;
}

/** Whether a point is inside the vent shaft's crawl space. */
export function inVent(x, y) {
  return x >= VENT.x && x <= VENT.x + VENT.w && y >= VENT.y && y <= VENT.y + VENT.h;
}
