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

function createNoopCleanup() {
  return () => {};
}

function playAudioAsset(src, options = {}) {
  if (typeof window === 'undefined') {
    return createNoopCleanup();
  }

  if (!src) {
    return createNoopCleanup();
  }

  const audio = new Audio(src);
  audio.preload = 'auto';
  audio.volume = Math.max(0, Math.min(1, options.volume ?? 1));
  audio.loop = Boolean(options.loop);
  if (typeof options.onEnded === 'function') {
    audio.onended = () => {
      options.onEnded();
    };
  }
  const playback = audio.play?.();
  if (playback && typeof playback.catch === 'function') {
    void playback.catch(() => {});
  }

  return () => {
    audio.onended = null;
    audio.pause();
    audio.currentTime = 0;
  };
}

const SIMPLY_LOVELY_SRC = '/audio/Team Radio/verstappen-simply-lovely.mp3';
const DUTCH_ANTHEM_SRC = '/audio/荷兰国歌.mp3';

export const RESULT_AUDIO_CUES = {
  maxWin: {
    id: 'max-win',
    layers: [
      { id: 'max-simply-lovely', src: SIMPLY_LOVELY_SRC, volume: 0.94 },
      { id: 'dutch-anthem', src: DUTCH_ANTHEM_SRC, volume: 0.8 }
    ]
  }
};

export const AUXILIARY_AUDIO_ASSETS = {
  dutchAnthem: { id: 'dutch-anthem', src: DUTCH_ANTHEM_SRC, volume: 0.8 },
  maxChant: { id: 'max-chant', src: SIMPLY_LOVELY_SRC, volume: 0.88 }
};

export function playDutchAnthemSting() {
  if (AUXILIARY_AUDIO_ASSETS.dutchAnthem.src) {
    return playAudioAsset(
      AUXILIARY_AUDIO_ASSETS.dutchAnthem.src,
      AUXILIARY_AUDIO_ASSETS.dutchAnthem
    );
  }

  if (typeof window === 'undefined') {
    return createNoopCleanup();
  }

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    return createNoopCleanup();
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

function playAudioSequence(layers, options = {}) {
  const queue = layers.filter((layer) => layer?.src);
  const fallback = options.fallback ?? createNoopCleanup;

  if (!queue.length) {
    return fallback();
  }

  let stopped = false;
  let activeCleanup = createNoopCleanup();
  let fallbackCleanup = createNoopCleanup();

  const playLayerAt = (index) => {
    if (stopped) {
      return;
    }

    if (index >= queue.length) {
      fallbackCleanup = fallback();
      return;
    }

    const layer = queue[index];
    activeCleanup = playAudioAsset(layer.src, {
      ...layer,
      onEnded: () => {
        activeCleanup();
        playLayerAt(index + 1);
      }
    });
  };

  playLayerAt(0);

  return () => {
    stopped = true;
    activeCleanup();
    fallbackCleanup();
  };
}

export function playResultAudioCue(result) {
  if (!result || result.outcome === 'win') {
    return createNoopCleanup();
  }

  const cue = RESULT_AUDIO_CUES.maxWin;
  const configuredLayers = cue.layers.filter((layer) => layer.src);

  return playAudioSequence(configuredLayers, {
    fallback: configuredLayers.some((layer) => layer.id === 'dutch-anthem')
      ? createNoopCleanup
      : playDutchAnthemSting
  });
}
