// The Gilded Vault — original synthesized sound. No audio files: every
// blip is an oscillator built when the player first presses a key, so a
// headless screenshot never touches the audio stack.

export function createSound() {
  return {
    ctx: null,
    muted: false,

    ensure() {
      if (!this.ctx) {
        try {
          const AC = window.AudioContext || window.webkitAudioContext;
          this.ctx = new AC();
        } catch (e) {
          this.ctx = null;
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
    },

    tone(freq, dur, type, vol, delay) {
      if (!this.ctx || this.muted) return;
      const t0 = this.ctx.currentTime + (delay || 0);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    },

    blip() {
      this.tone(880, 0.08, 'sine', 0.15, 0);
      this.tone(1320, 0.12, 'sine', 0.1, 0.06);
    },

    alarmPulse() {
      this.tone(220, 0.15, 'square', 0.05, 0);
    },

    step() {
      this.tone(140, 0.03, 'sine', 0.035, 0);
    },

    coin() {
      this.tone(1568, 0.07, 'triangle', 0.12, 0);
    },

    smoke() {
      this.tone(300, 0.2, 'sine', 0.05, 0);
    },

    win() {
      [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.12, i * 0.09));
    },

    bust() {
      [330, 262, 196].forEach((f, i) => this.tone(f, 0.22, 'sawtooth', 0.07, i * 0.12));
    },
  };
}
