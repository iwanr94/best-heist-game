// The Gilded Vault — the game itself: state, input, the loop, the alarm
// economy and the four demo scenes the screenshots are taken from.
// A demo scene freezes the world at one readable frame; real play runs
// the same code with live input.

import {
  ALARM_CAMERA_RATE,
  ALARM_DECAY,
  ALARM_GUARD_RATE,
  DIAL_ALARM_BUMP,
  GHOST_BONUS,
  PAR_TIME,
} from './config.js';
import { CAMERA_DEFS, EXIT_ZONE, GUARD_DEFS, LOOT, SPAWN as START } from './level.js';
import { createCamera, createGuard, updateCamera, updateGuard } from './guard.js';
import { createThief, updateThief } from './thief.js';
import { drawGame, toolChipRects } from './render.js';
import { createSound } from './sound.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const errlog = document.getElementById('errlog');
window.addEventListener('error', (e) => {
  if (errlog) errlog.textContent += `${String(e.message)};`;
});

const params = new URLSearchParams(location.search);
const sceneName = params.get('scene');
const demo = sceneName !== null;

const sound = createSound();
const input = {
  up: false,
  down: false,
  left: false,
  right: false,
  run: false,
  channel: false,
  useSmoke: false,
  useJammer: false,
  useCoin: false,
};

function freshState() {
  return {
    phase: 'title',
    time: 0,
    alarm: 0,
    exitOpen: false,
    spotted: false,
    message: '',
    messageTimer: 0,
    smokes: [],
    jammerTime: 0,
    guards: GUARD_DEFS.map(createGuard),
    cameras: CAMERA_DEFS.map(createCamera),
    thief: createThief(START),
    loot: LOOT.map((l) => ({ ...l, taken: false })),
    score: { loot: 0, timeBonus: 0, ghostBonus: 0, total: 0 },
    muted: false,
    alarmPulseTimer: 0,
    stepTimer: 0,
  };
}

let state = freshState();

function showMessage(text) {
  state.message = text;
  state.messageTimer = 2.5;
}

function cameraAngleAt(c, t) {
  return c.baseAngle + Math.sin(t * c.sweepSpeed + c.phase) * c.sweep;
}

// The four screenshot scenes. Each pins every actor to one fixed,
// readable frame: the cover shows the whole game at once, the others
// show the alarm moment, the vault crack and the getaway.
function applyScene(name) {
  state.phase = 'playing';
  const t = state.thief;
  const g = state.guards;
  const c = state.cameras;
  if (name === 'play') {
    t.x = 560;
    t.y = 420;
    t.dir = -Math.PI / 2;
    state.loot[0].taken = true;
    t.loot = 400;
    state.alarm = 18;
    state.time = 41;
    g[0].x = 420;
    g[0].y = 280;
    g[0].dir = 0;
    g[1].x = 1050;
    g[1].y = 220;
    g[1].dir = Math.PI;
    g[2].x = 530;
    g[2].y = 620;
    g[2].dir = -Math.PI / 2;
    c[0].angle = cameraAngleAt(c[0], 1.4);
    c[1].angle = cameraAngleAt(c[1], 0.6);
  } else if (name === 'alarm') {
    t.x = 700;
    t.y = 300;
    t.dir = Math.PI;
    state.loot[0].taken = true;
    state.loot[3].taken = true;
    t.loot = 1300;
    state.alarm = 72;
    state.time = 72;
    state.spotted = true;
    g[0].x = 620;
    g[0].y = 300;
    g[0].dir = 0;
    g[0].state = 'chase';
    g[0].suspicion = 1;
    g[0].alarming = true;
    g[0].lastSeen = { x: 700, y: 300 };
    g[1].x = 1000;
    g[1].y = 220;
    g[1].dir = Math.PI;
    g[2].x = 500;
    g[2].y = 620;
    g[2].dir = 0;
    c[0].angle = cameraAngleAt(c[0], 2.2);
    c[1].angle = cameraAngleAt(c[1], 1.1);
    state.message = 'SPOTTED — BREAK LINE OF SIGHT';
    state.messageTimer = 99;
  } else if (name === 'vault') {
    t.x = 200;
    t.y = 590;
    t.dir = Math.PI / 2;
    t.channel = state.loot[5];
    t.channelProgress = 0.6;
    state.loot[0].taken = true;
    state.loot[3].taken = true;
    state.loot[4].taken = true;
    t.loot = 2200;
    state.alarm = 34;
    state.time = 108;
    state.spotted = true;
    state.jammerTime = 3.2;
    t.jammers = 0;
    c[0].off = true;
    c[1].off = true;
    g[0].x = 300;
    g[0].y = 280;
    g[0].dir = Math.PI / 2;
    g[1].x = 1100;
    g[1].y = 300;
    g[1].dir = Math.PI;
    g[2].x = 480;
    g[2].y = 400;
    g[2].dir = -Math.PI / 2;
    c[0].angle = cameraAngleAt(c[0], 0.8);
    c[1].angle = cameraAngleAt(c[1], 2.6);
    state.message = 'CRACKING THE SUN DIAL…';
    state.messageTimer = 99;
  } else if (name === 'escape') {
    t.x = 1204;
    t.y = 38;
    t.dir = -Math.PI / 2;
    for (const item of state.loot) item.taken = true;
    t.loot = 4700;
    state.exitOpen = true;
    state.time = 96;
    state.alarm = 12;
    state.score = { loot: 4700, timeBonus: 240, ghostBonus: 500, total: 5440 };
    state.phase = 'won';
    g[0].x = 300;
    g[0].y = 540;
    g[0].dir = Math.PI;
    g[1].x = 980;
    g[1].y = 420;
    g[1].dir = 0;
    g[2].x = 420;
    g[2].y = 400;
    g[2].dir = Math.PI / 2;
    c[0].angle = cameraAngleAt(c[0], 1.0);
    c[1].angle = cameraAngleAt(c[1], 0.4);
  }
}

if (demo) applyScene(sceneName);

function startGame() {
  state = freshState();
  state.phase = 'playing';
  if (demo) applyScene(sceneName);
}

function finishRun() {
  const timeBonus = Math.max(0, Math.round((PAR_TIME - state.time) * 10));
  const ghostBonus = state.spotted ? 0 : GHOST_BONUS;
  state.score = {
    loot: state.thief.loot,
    timeBonus,
    ghostBonus,
    total: state.thief.loot + timeBonus + ghostBonus,
  };
  state.phase = 'won';
  sound.win();
}

function update(dt) {
  if (state.messageTimer > 0) state.messageTimer -= dt;
  if (state.phase !== 'playing') return;
  state.time += dt;

  const env = {
    loot: state.loot,
    onLoot(item) {
      if (item.id === 'sundial') {
        state.exitOpen = true;
        state.alarm = Math.min(100, state.alarm + DIAL_ALARM_BUMP);
        showMessage('SUN DIAL TAKEN — EXIT OPEN');
      } else {
        showMessage(`${item.name} lifted — $${item.value}`);
      }
      sound.blip();
    },
    spawnSmoke(x, y, r, t) {
      state.smokes.push({ x, y, r, t });
      sound.smoke();
    },
    setJammer(t) {
      state.jammerTime = t;
      showMessage('JAMMER UP — CAMERAS DARK 6s');
    },
    throwCoin(x, y) {
      let best = null;
      let bestDist = 350;
      for (const g of state.guards) {
        const d = Math.hypot(g.x - x, g.y - y);
        if (d < bestDist) {
          best = g;
          bestDist = d;
        }
      }
      if (best) {
        best.state = 'investigate';
        best.investigateTarget = { x, y };
        best.investigateTimer = 2;
        best.suspicion = 0;
      }
      sound.coin();
    },
  };
  updateThief(state.thief, dt, input, env);
  input.useSmoke = false;
  input.useJammer = false;
  input.useCoin = false;

  if (state.thief.moving) {
    state.stepTimer -= dt;
    if (state.stepTimer <= 0) {
      state.stepTimer = state.thief.running ? 0.22 : 0.38;
      sound.step();
    }
  }

  const watchEnv = {
    thief: state.thief,
    smokes: state.smokes,
    jammerTime: state.jammerTime,
    onSpotted() {
      if (!state.spotted) {
        state.spotted = true;
        showMessage('SPOTTED');
      }
    },
  };
  for (const g of state.guards) updateGuard(g, dt, watchEnv);
  for (const c of state.cameras) updateCamera(c, dt, watchEnv);

  if (state.jammerTime > 0) state.jammerTime -= dt;
  state.smokes = state.smokes.filter((s) => (s.t -= dt) > 0);

  let rise = 0;
  for (const g of state.guards) if (g.alarming) rise += ALARM_GUARD_RATE;
  for (const c of state.cameras) if (c.alarmed) rise += ALARM_CAMERA_RATE;
  state.alarm = Math.max(0, Math.min(100, state.alarm + (rise > 0 ? rise : -ALARM_DECAY) * dt));
  if (rise > 0) {
    state.alarmPulseTimer -= dt;
    if (state.alarmPulseTimer <= 0) {
      state.alarmPulseTimer = 0.5;
      sound.alarmPulse();
    }
  }

  if (state.alarm >= 100) {
    state.phase = 'busted';
    sound.bust();
    return;
  }

  const t = state.thief;
  if (
    state.exitOpen &&
    t.x > EXIT_ZONE.x &&
    t.x < EXIT_ZONE.x + EXIT_ZONE.w &&
    t.y > EXIT_ZONE.y &&
    t.y < EXIT_ZONE.y + EXIT_ZONE.h
  ) {
    finishRun();
  }
}

const KEYMAP = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ShiftLeft: 'run',
  ShiftRight: 'run',
  KeyE: 'channel',
  Space: 'channel',
};

window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  sound.ensure();
  if (e.code === 'Enter') {
    if (state.phase === 'title' || state.phase === 'won' || state.phase === 'busted') startGame();
    return;
  }
  if (e.code === 'KeyR') {
    if (state.phase !== 'title') startGame();
    return;
  }
  if (e.code === 'KeyP') {
    if (state.phase === 'playing') state.phase = 'paused';
    else if (state.phase === 'paused') state.phase = 'playing';
    return;
  }
  if (e.code === 'KeyM') {
    sound.muted = !sound.muted;
    state.muted = sound.muted;
    return;
  }
  if (e.code === 'Digit1' || e.code === 'Numpad1') input.useSmoke = true;
  if (e.code === 'Digit2' || e.code === 'Numpad2') input.useJammer = true;
  if (e.code === 'Digit3' || e.code === 'Numpad3') input.useCoin = true;
  const field = KEYMAP[e.code];
  if (field) input[field] = true;
});

window.addEventListener('keyup', (e) => {
  const field = KEYMAP[e.code];
  if (field) input[field] = false;
});

canvas.addEventListener('click', (e) => {
  sound.ensure();
  if (state.phase === 'title' || state.phase === 'won' || state.phase === 'busted') {
    startGame();
    return;
  }
  if (state.phase !== 'playing') return;
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
  const chips = toolChipRects();
  if (y >= 10 && y <= 38) {
    if (x >= chips[0].x && x <= chips[0].x + chips[0].w) input.useSmoke = true;
    else if (x >= chips[1].x && x <= chips[1].x + chips[1].w) input.useJammer = true;
    else if (x >= chips[2].x && x <= chips[2].x + chips[2].w) input.useCoin = true;
  }
});

let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = demo ? 0 : Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!demo) update(dt);
  drawGame(ctx, state, demo ? 1.2 : now / 1000);
}
requestAnimationFrame(frame);
