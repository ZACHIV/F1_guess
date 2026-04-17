const NOTE_FREQUENCIES = {
  G3: 196,
  A3: 220,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392
};

const WILHELMUS_STING = [
  ['G3', 0.28],
  ['A3', 0.28],
  ['B3', 0.34],
  ['C4', 0.34],
  ['B3', 0.24],
  ['A3', 0.24],
  ['G3', 0.44],
  ['D4', 0.32],
  ['E4', 0.32],
  ['F4', 0.38],
  ['E4', 0.32],
  ['D4', 0.32],
  ['C4', 0.5]
];

export function playDutchAnthemSting() {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    return () => {};
  }

  const context = new AudioContextCtor();
  const masterGain = context.createGain();
  masterGain.gain.value = 0.075;
  masterGain.connect(context.destination);

  const oscillators = [];
  let cursor = context.currentTime + 0.03;

  for (const [note, duration] of WILHELMUS_STING) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = NOTE_FREQUENCIES[note];
    envelope.gain.setValueAtTime(0.0001, cursor);
    envelope.gain.exponentialRampToValueAtTime(0.32, cursor + 0.02);
    envelope.gain.exponentialRampToValueAtTime(0.0001, cursor + duration);
    oscillator.connect(envelope);
    envelope.connect(masterGain);
    oscillator.start(cursor);
    oscillator.stop(cursor + duration + 0.02);
    oscillators.push(oscillator);
    cursor += duration;
  }

  const closeContext = () => {
    oscillators.forEach((oscillator) => {
      try {
        oscillator.disconnect();
      } catch {
        // Ignore disconnect errors during teardown.
      }
    });

    if (context.state !== 'closed') {
      void context.close().catch(() => {});
    }
  };

  window.setTimeout(closeContext, Math.ceil((cursor - context.currentTime) * 1000) + 120);
  return closeContext;
}
