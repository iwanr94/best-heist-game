// Midnight Ledger — sound. One job: small WebAudio bleeps, no audio
// files. The first user gesture unlocks the audio context; until then
// every call is a no-op, so the title screen stays silent.

let ctx = null;

function audio() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq, seconds, type, gainValue, when = 0) {
  const ac = audio();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(gainValue, ac.currentTime + when);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + when + seconds);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(ac.currentTime + when);
    osc.stop(ac.currentTime + when + seconds);
  } catch {
    // Sound is garnish; a failed beep never stops the game.
  }
}

export const sfx = {
  pickup() {
    tone(880, 0.12, 'sine', 0.12);
    tone(1318, 0.16, 'sine', 0.1, 0.08);
  },
  spotted() {
    tone(220, 0.25, 'square', 0.07);
    tone(180, 0.3, 'square', 0.07, 0.12);
  },
  caught() {
    tone(160, 0.5, 'sawtooth', 0.12);
    tone(90, 0.7, 'sawtooth', 0.12, 0.2);
  },
  win() {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'sine', 0.11, i * 0.12));
  },
  smoke() {
    tone(300, 0.3, 'sine', 0.06);
  },
  emp() {
    tone(1200, 0.08, 'square', 0.05);
    tone(500, 0.2, 'square', 0.05, 0.07);
  },
  click() {
    tone(660, 0.05, 'sine', 0.06);
  },
};
