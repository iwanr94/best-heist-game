// Midnight Ledger — shared constants. One job: the numbers every other
// module agrees on (tile size, speeds, vision, alarm, tools, scoring).

export const TILE = 32;
export const COLS = 30;
export const ROWS = 20;
export const VIEW_W = COLS * TILE; // 960
export const VIEW_H = ROWS * TILE; // 640
export const HUD_H = 46;

export const PLAYER_SPEED = 178; // px per second, walking
export const PLAYER_SNEAK = 96; // px per second, Shift held
export const PLAYER_RADIUS = 11;

export const GUARD_SPEED = 62; // patrol
export const GUARD_CHASE_SPEED = 165; // chase (just under the thief)
export const GUARD_RADIUS = 12;
export const GUARD_CATCH_DIST = 20; // touch the thief and the run ends

export const VISION_RANGE = 175;
export const VISION_HALF_ANGLE = 0.56; // radians, ~32 degrees each side
export const SNEAK_VISION_FACTOR = 0.62; // sneaking shrinks what guards see

export const CAMERA_RANGE = 155;
export const CAMERA_HALF_ANGLE = 0.5;

export const ALARM_RISE_GUARD = 26; // per second while a guard sees you
export const ALARM_RISE_CAMERA = 18; // per second while a camera sees you
export const ALARM_DECAY = 7; // per second while unseen
export const ALARM_LOCKDOWN = 100; // at 100 every guard hunts you

export const SMOKE_COUNT = 2;
export const SMOKE_RADIUS = 78;
export const SMOKE_SECONDS = 4;
export const EMP_COUNT = 1;
export const EMP_SECONDS = 6;

export const LOOT_VALUE = {
  ledger: 500, // the Midnight Ledger — the job is not done without it
  painting: 220,
  diamond: 300,
  gold: 180,
};

export const COLORS = {
  floor: '#1d2333',
  floorAlt: '#202739',
  wall: '#3d4767',
  wallTop: '#7d8fc9',
  cover: '#3a2f22',
  coverTop: '#6b5433',
  exit: '#1f7a4d',
  exitGlow: '#37d67a',
  ledger: '#ffd94d',
  painting: '#ff7ad9',
  diamond: '#7ae7ff',
  gold: '#ffb347',
  player: '#f2c14e',
  guard: '#e5484d',
  cone: 'rgba(229, 72, 77, 0.20)',
  coneSeen: 'rgba(255, 60, 60, 0.38)',
  camCone: 'rgba(255, 190, 60, 0.16)',
  camSeen: 'rgba(255, 120, 40, 0.36)',
  smoke: 'rgba(180, 190, 210, 0.55)',
  hud: '#0b0e18',
  text: '#e8ecf5',
  dim: '#8b93a7',
  alarm: '#ff4d4d',
  alarmSafe: '#37d67a',
};
