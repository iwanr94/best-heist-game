// The Aurum Job — input: keyboard and mouse, nothing else. WASD and arrows
// move, E holds a lock open, Q throws smoke, F fires the jammer, R retries,
// Enter starts, P pauses.

export function createInput() {
  const keys = new Set();
  const pressed = new Set();
  let mouseClicked = false;

  const KEYMAP = {
    KeyW: 'up',
    ArrowUp: 'up',
    KeyS: 'down',
    ArrowDown: 'down',
    KeyA: 'left',
    ArrowLeft: 'left',
    KeyD: 'right',
    ArrowRight: 'right',
    KeyE: 'interact',
    KeyQ: 'smoke',
    KeyF: 'jammer',
    KeyR: 'retry',
    Enter: 'start',
    KeyP: 'pause',
    Escape: 'pause',
  };

  function onKeyDown(event) {
    const action = KEYMAP[event.code];
    if (!action) return;
    if (['up', 'down', 'left', 'right'].includes(action)) event.preventDefault();
    if (!keys.has(action)) pressed.add(action);
    keys.add(action);
  }

  function onKeyUp(event) {
    const action = KEYMAP[event.code];
    if (action) keys.delete(action);
  }

  function onMouseDown() {
    mouseClicked = true;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('mousedown', onMouseDown);

  return {
    isDown(action) {
      return keys.has(action);
    },
    wasPressed(action) {
      return pressed.has(action);
    },
    clicked() {
      return mouseClicked;
    },
    moveVector() {
      let x = 0;
      let y = 0;
      if (keys.has('left')) x -= 1;
      if (keys.has('right')) x += 1;
      if (keys.has('up')) y -= 1;
      if (keys.has('down')) y += 1;
      if (x !== 0 && y !== 0) {
        x *= Math.SQRT1_2;
        y *= Math.SQRT1_2;
      }
      return { x, y };
    },
    endFrame() {
      pressed.clear();
      mouseClicked = false;
    },
  };
}
