// The Gilded Vault — tuning and palette. One place for every number the
// game balances on, so a tweak never means hunting through the logic.

export const FRAME_WIDTH = 1280;
export const FRAME_HEIGHT = 800;
export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = 720;
export const HUD_HEIGHT = 48;
export const HINT_HEIGHT = 32;

// Chromatic Language: color is the information system. Safe cover is deep
// blue, guard danger is amber, cameras are red, loot is gold, text is warm
// off-white on near-black ink. Nothing else competes for attention.
export const PALETTE = {
  ink: '#0b0e14',
  page: '#05070b',
  floor: '#10141d',
  floorLine: '#171d2a',
  ventFloor: '#131a28',
  ventLine: '#2a3a55',
  wall: '#232a3a',
  wallEdge: '#39415a',
  cover: '#1d2b45',
  coverEdge: '#2e4266',
  gold: '#e8b64c',
  goldDim: '#8a6d2f',
  amber: '#f2a541',
  red: '#e5484d',
  text: '#e8e6df',
  muted: '#8b93a5',
  thief: '#e8e6df',
  guard: '#c8cdd8',
  smoke: '#9aa3b2',
};

export const THIEF_SPEED = 170;
export const THIEF_RUN_SPEED = 260;
export const THIEF_RADIUS = 12;
export const NOISE_RADIUS = 90;

export const GUARD_PATROL_SPEED = 70;
export const GUARD_CHASE_SPEED = 150;
export const GUARD_RANGE = 170;
export const GUARD_HALF_ANGLE = 0.57;
export const CAMERA_RANGE = 210;
export const CAMERA_HALF_ANGLE = 0.44;
export const GRACE_TIME = 0.7;
export const ALARM_GUARD_RATE = 12;
export const ALARM_CAMERA_RATE = 18;
export const ALARM_DECAY = 4;
export const CHANNEL_RANGE = 46;
export const PAR_TIME = 120;
export const GHOST_BONUS = 500;
export const DIAL_ALARM_BUMP = 15;
export const SMOKE_RADIUS = 70;
export const SMOKE_TIME = 3;
export const JAMMER_TIME = 6;
export const COIN_THROW = 120;
