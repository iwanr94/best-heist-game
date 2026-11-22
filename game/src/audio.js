// The Aurum Job — audio: original WebAudio synth, no outside assets.
// Tiny blips and swells, all generated at run time.

export function createAudio() {
  let ctx = null;
  let alarmOsc = null;
  let alarmGain = null;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, seconds, type, volume, when = 0, slideTo = null) {
    const ac = ensure();
    if (!ac) return;
    try {
      const t0 = ac.currentTime + when;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + seconds);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + seconds + 0.05);
    } catch {
      // Sound is garnish; a silent game is still a game.
    }
  }

  return {
    unlock() {
      const ac = ensure();
      if (ac && ac.state === 'suspended') ac.resume().catch(() => {});
    },
    pickup() {
      tone(660, 0.09, 'sine', 0.12);
      tone(990, 0.12, 'sine', 0.1, 0.07);
    },
    tick() {
      tone(1400, 0.04, 'square', 0.05);
    },
    dial() {
      tone(523, 0.12, 'triangle', 0.12);
      tone(659, 0.12, 'triangle', 0.12, 0.1);
      tone(784, 0.2, 'triangle', 0.12, 0.2);
    },
    smoke() {
      tone(300, 0.35, 'sine', 0.08, 0, 90);
    },
    jammer() {
      tone(1200, 0.08, 'square', 0.05);
      tone(900, 0.08, 'square', 0.05, 0.08);
    },
    spotted() {
      tone(220, 0.18, 'sawtooth', 0.07, 0, 330);
    },
    win() {
      tone(523, 0.16, 'triangle', 0.12);
      tone(659, 0.16, 'triangle', 0.12, 0.14);
      tone(784, 0.16, 'triangle', 0.12, 0.28);
      tone(1047, 0.34, 'triangle', 0.13, 0.42);
    },
    caught() {
      tone(392, 0.2, 'sawtooth', 0.09, 0, 196);
      tone(196, 0.5, 'sawtooth', 0.09, 0.18, 98);
    },
    setAlarmLevel(level) {
      const ac = ensure();
      if (!ac) return;
      try {
        if (level > 0.45 && !alarmOsc) {
          alarmOsc = ac.createOscillator();
          alarmGain = ac.createGain();
          alarmOsc.type = 'sine';
          alarmOsc.frequency.value = 55;
          alarmGain.gain.value = 0.0;
          alarmOsc.connect(alarmGain);
          alarmGain.connect(ac.destination);
          alarmOsc.start();
        }
        if (alarmOsc && alarmGain) {
          alarmGain.gain.setTargetAtTime(level > 0.45 ? 0.03 + level * 0.05 : 0, ac.currentTime, 0.2);
          alarmOsc.frequency.setTargetAtTime(55 + level * 40, ac.currentTime, 0.2);
        }
        if (alarmOsc && level <= 0.45) {
          const osc = alarmOsc;
          const gain = alarmGain;
          alarmOsc = null;
          alarmGain = null;
          gain.gain.setTargetAtTime(0, ac.currentTime, 0.1);
          setTimeout(() => {
            try {
              osc.stop();
            } catch {
              // Already stopped.
            }
          }, 400);
        }
      } catch {
        // Silence is acceptable.
      }
    },
  };
}
