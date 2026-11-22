// Midnight Ledger — keyboard and mouse. One job: turn raw events into
// the input object the game loop reads, and expose click-to-move targets
// in canvas coordinates.

export function makeInput(canvas) {
  const input = {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
    clickX: null, // set once per click, consumed by the game loop
    clickY: null,
    pressed: {}, // edge-triggered keys, consumed by the game loop
  };

  const KEYMAP = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
    ShiftLeft: 'sneak', ShiftRight: 'sneak',
  };

  function onKeyDown(e) {
    const name = KEYMAP[e.code];
    if (name) {
      input[name] = true;
      e.preventDefault();
      return;
    }
    if (['KeyQ', 'KeyE', 'KeyR', 'Enter', 'Space'].includes(e.code)) {
      input.pressed[e.code] = true;
      e.preventDefault();
    }
  }

  function onKeyUp(e) {
    const name = KEYMAP[e.code];
    if (name) input[name] = false;
  }

  function onClick(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    input.clickX = (e.clientX - rect.left) * scaleX;
    input.clickY = (e.clientY - rect.top) * scaleY;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('click', onClick);
  return input;
}
