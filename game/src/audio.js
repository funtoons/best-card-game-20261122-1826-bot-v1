// Ember Court — every sound is a few synthesized notes (WebAudio, no files):
// a pluck when a card is played, a thud on a hit, a chime for a win, a low
// drone for a loss. Muted with M; nothing is loaded from the network.

export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context) return context;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
    } catch {
      context = null;
    }
    return context;
  }

  function tone(frequency, seconds, type, volume, when = 0) {
    const ctx = ensure();
    if (!ctx || muted) return;
    const start = ctx.currentTime + when;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + seconds + 0.05);
  }

  return {
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() { return muted; },
    unlock() { ensure(); },
    play() { tone(520, 0.12, 'triangle', 0.12); tone(780, 0.1, 'triangle', 0.08, 0.05); },
    hit() { tone(180, 0.16, 'sawtooth', 0.14); tone(90, 0.2, 'sine', 0.18, 0.02); },
    draw() { tone(880, 0.06, 'sine', 0.05); },
    turn() { tone(392, 0.1, 'triangle', 0.08); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, 'triangle', 0.12, i * 0.12)); },
    lose() { [330, 262, 196, 131].forEach((f, i) => tone(f, 0.4, 'sine', 0.12, i * 0.14)); },
  };
}
