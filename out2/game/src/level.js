// Midnight Ledger — the Meridian Gallery floor plan. One job: the tile
// map, what is solid, where the loot, spawn and exit sit, and the
// line-of-sight test guards and cameras use.
//
// Legend: # wall, . floor, C cover (crate / display case — blocks movement
// and sight), S thief spawn, X service exit, L the Midnight Ledger,
// P painting, d diamond, G gold bars. 30 columns x 20 rows.

import { TILE, COLS, ROWS } from './config.js';

const MAP = [
  '##############################',
  '#...........#........#.......#',
  '#..S........#...P....#...L...#',
  '#...........#........#.......#',
  '#....CC...................CC.#',
  '#...........#........#.......#',
  '#.....C.....#........#..C....#',
  '#...........#........#.......#',
  '#####.##########.########.####',
  '#...........#........#.......#',
  '#..CC.......#........#....CC.#',
  '#............................#',
  '#.....C.....#........#...C...#',
  '#...........#........#.......#',
  '#####.##########.########.####',
  '#...........#........#.......#',
  '#..XX.......#...d....#...G...#',
  '#..XX........................#',
  '#....CC.....#........#....CC.#',
  '##############################',
];

function tileAt(col, row) {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return '#';
  return MAP[row][col];
}

export function isSolidTile(col, row) {
  const t = tileAt(col, row);
  return t === '#' || t === 'C';
}

// Circle (px) against the solid grid: true when the circle overlaps a
// solid tile. The thief, guards and smoke all move through this test.
export function circleHitsSolid(x, y, radius) {
  const c0 = Math.floor((x - radius) / TILE);
  const c1 = Math.floor((x + radius) / TILE);
  const r0 = Math.floor((y - radius) / TILE);
  const r1 = Math.floor((y + radius) / TILE);
  for (let r = r0; r <= r1; r += 1) {
    for (let c = c0; c <= c1; c += 1) {
      if (!isSolidTile(c, r)) continue;
      const nearestX = Math.max(c * TILE, Math.min(x, (c + 1) * TILE));
      const nearestY = Math.max(r * TILE, Math.min(y, (r + 1) * TILE));
      const dx = x - nearestX;
      const dy = y - nearestY;
      if (dx * dx + dy * dy < radius * radius) return true;
    }
  }
  return false;
}

// Slide a circle along one axis: move, and if blocked, stay. Lets the
// thief glide along walls instead of sticking to them.
export function moveCircle(x, y, dx, dy, radius) {
  let nx = x + dx;
  if (circleHitsSolid(nx, y, radius)) nx = x;
  let ny = y + dy;
  if (circleHitsSolid(nx, ny, radius)) ny = y;
  return { x: nx, y: ny };
}

// Line of sight between two points (px): sample the segment; a solid
// tile anywhere on it blocks the view. Cover blocks sight too.
export function hasLineOfSight(x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 4));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const col = Math.floor((x0 + dx * t) / TILE);
    const row = Math.floor((y0 + dy * t) / TILE);
    if (isSolidTile(col, row)) return false;
  }
  return true;
}

export function tileCenter(col, row) {
  return { x: (col + 0.5) * TILE, y: (row + 0.5) * TILE };
}

export function buildLevel() {
  const loot = [];
  const exitTiles = [];
  let spawn = { x: 2.5 * TILE, y: 2.5 * TILE };
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      const t = MAP[r][c];
      const at = tileCenter(c, r);
      if (t === 'S') spawn = at;
      else if (t === 'X') exitTiles.push({ col: c, row: r });
      else if (t === 'L') loot.push({ kind: 'ledger', x: at.x, y: at.y, taken: false });
      else if (t === 'P') loot.push({ kind: 'painting', x: at.x, y: at.y, taken: false });
      else if (t === 'd') loot.push({ kind: 'diamond', x: at.x, y: at.y, taken: false });
      else if (t === 'G') loot.push({ kind: 'gold', x: at.x, y: at.y, taken: false });
    }
  }
  const xs = exitTiles.map((t) => t.col);
  const ys = exitTiles.map((t) => t.row);
  const exit = {
    x: Math.min(...xs) * TILE,
    y: Math.min(...ys) * TILE,
    w: (Math.max(...xs) - Math.min(...xs) + 1) * TILE,
    h: (Math.max(...ys) - Math.min(...ys) + 1) * TILE,
  };
  return { loot, spawn, exit };
}

export function mapRows() {
  return MAP;
}
