// The Gilded Vault — Moth, the thief. Walks quiet, runs loud: running
// paints a noise ring that pulls nearby guards. Loot lifts only while
// the thief stands still and holds the key, and the tools cost a use.

import {
  CHANNEL_RANGE,
  COIN_THROW,
  JAMMER_TIME,
  SMOKE_RADIUS,
  SMOKE_TIME,
  THIEF_RADIUS,
  THIEF_RUN_SPEED,
  THIEF_SPEED,
} from './config.js';
import { inVent, moveCircle } from './level.js';

export function createThief(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    r: THIEF_RADIUS,
    dir: -Math.PI / 2,
    moving: false,
    running: false,
    noise: 0,
    loot: 0,
    channel: null,
    channelProgress: 0,
    smokes: 2,
    jammers: 1,
    coins: 2,
    inVent: false,
  };
}

function nearestLoot(t, loot) {
  let best = null;
  let bestDist = CHANNEL_RANGE;
  for (const item of loot) {
    if (item.taken) continue;
    const d = Math.hypot(item.x - t.x, item.y - t.y);
    if (d < bestDist) {
      best = item;
      bestDist = d;
    }
  }
  return best;
}

export function updateThief(t, dt, input, env) {
  // Movement, one axis at a time so walls slide instead of sticking.
  let mx = 0;
  let my = 0;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  t.moving = mx !== 0 || my !== 0;
  t.running = t.moving && input.run;
  if (t.moving) {
    const len = Math.hypot(mx, my);
    const speed = (t.running ? THIEF_RUN_SPEED : THIEF_SPEED) * (t.inVent ? 0.55 : 1);
    t.dir = Math.atan2(my / len, mx / len);
    moveCircle(t, (mx / len) * speed * dt, (my / len) * speed * dt, t.r);
  }
  t.noise = t.running ? 1 : Math.max(0, t.noise - dt * 3);
  t.inVent = inVent(t.x, t.y);

  // Loot: hold the key beside a piece to lift it. Moving breaks the lift.
  const target = nearestLoot(t, env.loot);
  if (input.channel && target && !t.moving) {
    if (t.channel !== target) {
      t.channel = target;
      t.channelProgress = 0;
    }
    t.channelProgress += dt / target.channel;
    if (t.channelProgress >= 1) {
      target.taken = true;
      t.loot += target.value;
      t.channel = null;
      t.channelProgress = 0;
      if (env.onLoot) env.onLoot(target);
    }
  } else {
    t.channel = null;
    t.channelProgress = 0;
  }

  // Tools, each spent on use.
  if (input.useSmoke && t.smokes > 0) {
    t.smokes -= 1;
    if (env.spawnSmoke) env.spawnSmoke(t.x, t.y, SMOKE_RADIUS, SMOKE_TIME);
  }
  if (input.useJammer && t.jammers > 0) {
    t.jammers -= 1;
    if (env.setJammer) env.setJammer(JAMMER_TIME);
  }
  if (input.useCoin && t.coins > 0) {
    t.coins -= 1;
    const cx = t.x + Math.cos(t.dir) * COIN_THROW;
    const cy = t.y + Math.sin(t.dir) * COIN_THROW;
    if (env.throwCoin) env.throwCoin(cx, cy);
  }
}
