// The Aurum Job — main: the game loop, the state machine, the HUD and the
// contextual hints. One clear goal, readable in five seconds: steal the Sun
// Dial and escape. Fixed timestep, seeded world, deterministic screenshots.

import { CONFIG } from './config.js';
import {
  createWorld,
  moveWithCollision,
  updateWorld,
  nearestLoot,
  takeLoot,
  dropSmoke,
  fireJammer,
} from './world.js';
import { render } from './render.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hud = {
  objective: document.getElementById('hud-objective'),
  loot: document.getElementById('hud-loot'),
  timer: document.getElementById('hud-timer'),
  score: document.getElementById('hud-score'),
  alarmFill: document.getElementById('alarm-fill'),
  alarmText: document.getElementById('alarm-text'),
  tools: document.getElementById('hud-tools'),
  hint: document.getElementById('hint'),
  menu: document.getElementById('menu-overlay'),
  win: document.getElementById('win-overlay'),
  caught: document.getElementById('caught-overlay'),
  winBreakdown: document.getElementById('win-breakdown'),
  winTotal: document.getElementById('win-total'),
  startButton: document.getElementById('start-button'),
};

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot') || '';
const seed = Number(params.get('seed') || 1) || 1;

const audio = createAudio();
const input = createInput();

let world = createWorld(seed);
let player = { x: CONFIG.playerStart.x, y: CONFIG.playerStart.y };
let state = 'menu';
let clock = 0;
let spottedBefore = false;
let hintText = '';
let hintUntil = 0;
let tickTimer = 0;
let finalScore = null;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function showOverlay(which) {
  hud.menu.classList.toggle('hidden', which !== 'menu');
  hud.win.classList.toggle('hidden', which !== 'win');
  hud.caught.classList.toggle('hidden', which !== 'caught');
}

function startGame() {
  world = createWorld(seed);
  player = { x: CONFIG.playerStart.x, y: CONFIG.playerStart.y };
  state = 'playing';
  spottedBefore = false;
  finalScore = null;
  hintText = 'WASD / arrows to move — stay out of the amber cones';
  hintUntil = clock + 6;
  audio.unlock();
  showOverlay(null);
}

function computeFinalScore() {
  const timeBonus = Math.max(0, Math.round(CONFIG.parSeconds - world.elapsed)) * 10;
  const ghostBonus = world.everSeen ? 0 : CONFIG.ghostBonus;
  return {
    loot: world.score,
    timeBonus,
    ghostBonus,
    total: world.score + timeBonus + ghostBonus,
  };
}

function endGame(won) {
  if (won) {
    finalScore = computeFinalScore();
    hud.winBreakdown.innerHTML =
      `<div><span>Loot</span><b>$${finalScore.loot.toLocaleString()}</b></div>` +
      `<div><span>Time bonus (par ${CONFIG.parSeconds}s)</span><b>$${finalScore.timeBonus.toLocaleString()}</b></div>` +
      `<div><span>Ghost bonus (never seen)</span><b>$${finalScore.ghostBonus.toLocaleString()}</b></div>`;
    hud.winTotal.textContent = `$${finalScore.total.toLocaleString()}`;
    state = 'win';
    audio.win();
    audio.setAlarmLevel(0);
    showOverlay('win');
  } else {
    state = 'caught';
    audio.caught();
    audio.setAlarmLevel(0);
    showOverlay('caught');
  }
}

function updateHint(anySeen, dt) {
  if (anySeen && !spottedBefore) {
    spottedBefore = true;
    hintText = "Break line of sight — the alarm fades when you're hidden";
    hintUntil = clock + 5;
  }
  const near = nearestLoot(world, player, 90);
  if (state === 'playing' && !anySeen && near && clock > hintUntil) {
    hintText = 'Hold E to pick the lock';
    hintUntil = clock + 2;
  }
  hud.hint.textContent = clock < hintUntil ? hintText : '';
  hud.hint.classList.toggle('visible', clock < hintUntil);
}

function updateHud() {
  hud.objective.textContent = world.dialTaken
    ? 'Sun Dial stolen — reach the green exit'
    : 'Steal the Sun Dial and escape';
  hud.loot.textContent = `Loot ${world.tiersTaken}/3`;
  hud.timer.textContent = formatTime(world.elapsed);
  hud.score.textContent = `$${world.score.toLocaleString()}`;
  const alarm = Math.round(world.alarm);
  hud.alarmFill.style.width = `${alarm}%`;
  hud.alarmFill.style.background =
    alarm < 34 ? CONFIG.colors.alarmLow : alarm < 67 ? CONFIG.colors.alarmMid : CONFIG.colors.alarmHigh;
  hud.alarmText.textContent = `ALARM ${alarm}`;
  hud.tools.textContent = `Smoke ${world.smokeLeft} · Jammer ${world.jammerLeft}`;
}

function step(dt) {
  clock += dt;
  if (state !== 'playing') return;

  const move = input.moveVector();
  const moving = move.x !== 0 || move.y !== 0;
  if (moving) {
    const speed = CONFIG.player.speed * dt;
    moveWithCollision(player, move.x * speed, move.y * speed, world.solids, CONFIG.player.radius);
    world.channelTarget = null;
    world.channelProgress = 0;
  }

  const anySeen = updateWorld(world, player, dt, clock);
  audio.setAlarmLevel(world.alarm / 100);

  const near = nearestLoot(world, player, 56);
  if (input.isDown('interact') && near && !moving) {
    if (world.channelTarget !== near) {
      world.channelTarget = near;
      world.channelProgress = 0;
    }
    world.channelProgress += dt;
    tickTimer += dt;
    if (tickTimer > 0.15) {
      tickTimer = 0;
      audio.tick();
    }
    if (world.channelProgress >= near.channel) {
      takeLoot(world, near);
      if (near.kind === 'dial') audio.dial();
      else audio.pickup();
      world.channelTarget = null;
      world.channelProgress = 0;
    }
  } else {
    world.channelTarget = null;
    world.channelProgress = 0;
    tickTimer = 0;
  }

  if (input.wasPressed('smoke') && dropSmoke(world, player, clock)) audio.smoke();
  if (input.wasPressed('jammer') && fireJammer(world, player, clock)) audio.jammer();

  updateHint(anySeen, dt);

  if (world.alarm >= 100) {
    endGame(false);
    return;
  }
  const z = CONFIG.exitZone;
  if (
    world.exitOpen &&
    player.x > z.x - 6 &&
    player.x < z.x + z.w + 6 &&
    player.y > z.y - 10 &&
    player.y < z.y + z.h + 6
  ) {
    endGame(true);
  }
}

function frame() {
  const dt = 1 / 60;
  if (input.wasPressed('pause') && state === 'playing') {
    state = 'paused';
    hud.hint.textContent = 'Paused — press P to continue';
    hud.hint.classList.add('visible');
  } else if (input.wasPressed('pause') && state === 'paused') {
    state = 'playing';
    hud.hint.classList.remove('visible');
  }
  if (state === 'menu' && (input.wasPressed('start') || input.clicked())) startGame();
  if ((state === 'caught' || state === 'win') && (input.wasPressed('retry') || input.wasPressed('start'))) {
    startGame();
  }
  if (state !== 'paused') step(dt);
  updateHud();
  render(ctx, world, player, clock);
  input.endFrame();
  requestAnimationFrame(frame);
}

function stageShot(name) {
  if (name === 'start') {
    state = 'menu';
    showOverlay('menu');
    return;
  }
  if (name === 'play') {
    startGame();
    world.loot[0].taken = true;
    world.lootTaken = 1;
    world.score = 400;
    world.tiers.painting = true;
    world.tiersTaken = 1;
    world.alarm = 35;
    world.elapsed = 47;
    player.x = 430;
    player.y = 210;
    world.guards[0].x = 420;
    world.guards[0].y = 150;
    world.guards[0].angle = Math.PI / 2;
    world.guards[0].waypointIndex = 1;
    world.guards[2].x = 300;
    world.guards[2].y = 620;
    world.guards[2].angle = 0;
    world.cameras[0].angle = Math.PI / 2 + 0.5;
    clock = 12;
    return;
  }
  if (name === 'win') {
    startGame();
    for (const item of world.loot) item.taken = true;
    world.lootTaken = 6;
    world.score = 5500;
    world.tiers = { painting: true, gem: true, dial: true };
    world.tiersTaken = 3;
    world.dialTaken = true;
    world.exitOpen = true;
    world.elapsed = 96;
    player.x = 95;
    player.y = 766;
    clock = 12;
    endGame(true);
    return;
  }
  if (name === 'night') {
    startGame();
    world.alarm = 72;
    world.everSeen = true;
    world.elapsed = 83;
    // Player tucked behind the west wall; the guard has lost sight and is
    // searching, so the alarm falls instead of ending the game mid-shot.
    player.x = 270;
    player.y = 500;
    const guard = world.guards[0];
    guard.state = 'search';
    guard.searchTime = 0;
    guard.suspicion = 1;
    guard.x = 430;
    guard.y = 420;
    guard.angle = Math.atan2(player.y - guard.y, player.x - guard.x);
    guard.searchAngle = guard.angle;
    guard.lastSeen = { x: player.x, y: player.y };
    world.guards[2].x = 520;
    world.guards[2].y = 700;
    world.guards[2].angle = Math.PI;
    world.spottedFlash = 0.6;
    hintText = "Break line of sight — the alarm fades when you're hidden";
    hintUntil = clock + 30;
    clock = 12;
  }
}

hud.startButton.addEventListener('click', () => {
  audio.unlock();
  startGame();
});

if (shot) {
  stageShot(shot);
} else {
  showOverlay('menu');
}
requestAnimationFrame(frame);
