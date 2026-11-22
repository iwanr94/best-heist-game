// Midnight Ledger — the game loop. One job: own the state, run one
// update per frame, and decide when the heist is won or lost.
//
// Win: carry the Midnight Ledger onto the service exit. Lose: a guard
// touches Rook. The alarm climbs while any guard or camera sees the
// thief and falls while hidden; at 100% the gallery locks down and every
// guard hunts. Smoke blinds sight, the EMP freezes the cameras.

import {
  TILE, VIEW_W, VIEW_H, HUD_H, GUARD_CATCH_DIST,
  ALARM_RISE_GUARD, ALARM_RISE_CAMERA, ALARM_DECAY,
  ALARM_LOCKDOWN, SMOKE_SECONDS, EMP_SECONDS, LOOT_VALUE,
} from './config.js';
import { buildLevel } from './level.js';
import { makeGuards, makeCameras, updateGuards, updateCameras } from './guards.js';
import { makePlayer, resetPlayer, updatePlayer } from './player.js';
import { makeInput } from './input.js';
import { render } from './render.js';
import { sfx } from './audio.js';
import { shotFromUrl, applyShot } from './shots.js';

function freshState() {
  const level = buildLevel();
  return {
    screen: 'title',
    time: 0,
    alarm: 0,
    alarmPeak: 0,
    lootGot: 0,
    lootTotal: level.loot.length,
    lootValue: 0,
    score: 0,
    hasLedger: false,
    smokeLeft: 2,
    empLeft: 1,
    empUntil: 0,
    smokes: [],
    level,
    player: makePlayer(level.spawn),
    guards: makeGuards(),
    cameras: makeCameras(),
    wasSpotted: false,
    shot: null,
  };
}

function resetRun(state) {
  const next = freshState();
  Object.assign(state, next);
  state.screen = 'playing';
}

function playerOnExit(state) {
  const e = state.level.exit;
  const p = state.player;
  return p.x >= e.x && p.x <= e.x + e.w && p.y >= e.y && p.y <= e.y + e.h;
}

function update(state, input, dt) {
  if (state.screen !== 'playing') return;
  state.time += dt;

  // Tools: Q smoke at the thief's feet, E EMP to freeze the cameras.
  if (input.pressed.KeyQ && state.player.smokeLeft > 0) {
    state.smokes.push({ x: state.player.x, y: state.player.y, until: state.time + SMOKE_SECONDS });
    state.player.smokeLeft -= 1;
    sfx.smoke();
  }
  if (input.pressed.KeyE && state.player.empLeft > 0) {
    state.empUntil = state.time + EMP_SECONDS;
    state.player.empLeft -= 1;
    sfx.emp();
  }
  if (input.clickX !== null) {
    const gy = input.clickY - HUD_H;
    if (gy >= 0 && gy <= VIEW_H) {
      state.player.targetX = input.clickX;
      state.player.targetY = gy;
    }
    input.clickX = null;
    input.clickY = null;
  }
  input.pressed = {};

  state.smokes = state.smokes.filter((s) => state.time < s.until);

  updatePlayer(state.player, input, dt);
  updateGuards(state.guards, state.player, state.smokes, dt, state.time);
  updateCameras(state.cameras, state.player, state.smokes, dt, state.time, state.empUntil);

  // Alarm: climbs while seen, falls while hidden. At 100% every guard
  // knows where the thief is and hunts.
  const guardSees = state.guards.some((g) => g.seesPlayer);
  const cameraSees = state.cameras.some((c) => c.seesPlayer);
  if (guardSees) state.alarm += ALARM_RISE_GUARD * dt;
  if (cameraSees) state.alarm += ALARM_RISE_CAMERA * dt;
  if (!guardSees && !cameraSees) {
    state.alarm -= (state.alarm >= ALARM_LOCKDOWN ? 3 : ALARM_DECAY) * dt;
  }
  state.alarm = Math.max(0, Math.min(ALARM_LOCKDOWN, state.alarm));
  state.alarmPeak = Math.max(state.alarmPeak, state.alarm);
  if (state.alarm >= ALARM_LOCKDOWN) {
    for (const g of state.guards) {
      g.mode = 'chase';
      g.lastSeenX = state.player.x;
      g.lastSeenY = state.player.y;
    }
  }
  if (guardSees || cameraSees) {
    if (!state.wasSpotted) sfx.spotted();
    state.wasSpotted = true;
  } else {
    state.wasSpotted = false;
  }

  // Loot: walk over it to pocket it.
  for (const item of state.level.loot) {
    if (item.taken) continue;
    if (Math.hypot(item.x - state.player.x, item.y - state.player.y) < 26) {
      item.taken = true;
      state.lootGot += 1;
      state.lootValue += LOOT_VALUE[item.kind];
      if (item.kind === 'ledger') state.hasLedger = true;
      sfx.pickup();
    }
  }

  // Caught: a guard touches the thief.
  for (const g of state.guards) {
    if (Math.hypot(g.x - state.player.x, g.y - state.player.y) < GUARD_CATCH_DIST) {
      state.screen = 'caught';
      sfx.caught();
      return;
    }
  }

  // Getaway: the Ledger in hand, standing on the service exit.
  if (state.hasLedger && playerOnExit(state)) {
    state.score = state.lootValue + (state.alarmPeak < 30 ? 250 : 0);
    state.screen = 'won';
    sfx.win();
  }
}

function start() {
  const canvas = document.getElementById('game');
  canvas.width = VIEW_W;
  canvas.height = VIEW_H + HUD_H;
  const ctx = canvas.getContext('2d');
  const input = makeInput(canvas);
  const state = freshState();
  window.__midnight = state; // playtest hook for the maker's own checks

  const shot = shotFromUrl();
  if (shot) {
    applyShot(state, shot);
  } else {
    state.screen = 'title';
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!state.shot) {
      if (state.screen === 'title' && (input.pressed.Enter || input.clickX !== null)) {
        state.screen = 'playing';
        sfx.click();
        input.clickX = null;
        input.clickY = null;
        input.pressed = {};
      } else if ((state.screen === 'caught' || state.screen === 'won')
        && (input.pressed.KeyR || input.clickX !== null)) {
        resetRun(state);
        input.clickX = null;
        input.clickY = null;
        input.pressed = {};
      } else if (state.screen === 'playing' && input.pressed.KeyR) {
        resetRun(state);
        input.pressed = {};
      }
      update(state, input, dt);
    }
    render(ctx, state);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Headless self-test (?selftest=1): drive the real update loop with
// scripted positions and report PASS/FAIL into the document, so the
// maker can verify the game without playing it by hand.
function selfTest() {
  const results = [];
  const check = (name, ok) => results.push(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  const input = { up: false, down: false, left: false, right: false, sneak: false, clickX: null, clickY: null, pressed: {} };

  // 1. Walking over the painting pockets it.
  const s1 = freshState();
  s1.screen = 'playing';
  const painting = s1.level.loot.find((l) => l.kind === 'painting');
  s1.player.x = painting.x;
  s1.player.y = painting.y;
  update(s1, input, 0.1);
  check('loot pickup', painting.taken && s1.lootValue === LOOT_VALUE.painting);

  // 2. Standing in a guard's cone raises the alarm.
  const s2 = freshState();
  s2.screen = 'playing';
  const g = s2.guards[0];
  s2.player.x = g.x + 60;
  s2.player.y = g.y;
  g.angle = 0;
  const alarmBefore = s2.alarm;
  update(s2, input, 0.5);
  check('guard vision raises alarm', s2.alarm > alarmBefore && g.seesPlayer);

  // 3. A guard touching the thief ends the run.
  const s3 = freshState();
  s3.screen = 'playing';
  s3.guards[0].x = s3.player.x + 5;
  s3.guards[0].y = s3.player.y;
  update(s3, input, 0.1);
  check('caught on touch', s3.screen === 'caught');

  // 4. Ledger + exit = getaway.
  const s4 = freshState();
  s4.screen = 'playing';
  const ledger = s4.level.loot.find((l) => l.kind === 'ledger');
  s4.player.x = ledger.x;
  s4.player.y = ledger.y;
  update(s4, input, 0.1);
  check('ledger pickup', s4.hasLedger);
  s4.player.x = s4.level.exit.x + 10;
  s4.player.y = s4.level.exit.y + 10;
  update(s4, input, 0.1);
  check('win at exit with ledger', s4.screen === 'won' && s4.score > 0);

  // 5. Exit without the Ledger is not a win.
  const s5 = freshState();
  s5.screen = 'playing';
  s5.player.x = s5.level.exit.x + 10;
  s5.player.y = s5.level.exit.y + 10;
  update(s5, input, 0.1);
  check('no win without ledger', s5.screen === 'playing');

  // 6. Smoke hides the thief from a guard's cone.
  const s6 = freshState();
  s6.screen = 'playing';
  const g6 = s6.guards[0];
  s6.player.x = g6.x + 60;
  s6.player.y = g6.y;
  g6.angle = 0;
  s6.smokes.push({ x: s6.player.x, y: s6.player.y, until: 99 });
  update(s6, input, 0.5);
  check('smoke blocks vision', !g6.seesPlayer && s6.alarm === 0);

  document.title = results.every((r) => r.startsWith('PASS')) ? 'SELFTEST PASS' : 'SELFTEST FAIL';
  const pre = document.createElement('pre');
  pre.id = 'selftest';
  pre.textContent = results.join('\n');
  document.body.appendChild(pre);
}

if (new URLSearchParams(window.location.search).get('selftest') === '1') {
  selfTest();
} else {
  start();
}
