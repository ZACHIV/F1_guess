import WaveSurfer from 'wavesurfer.js';

export function mountWaveform(container, audioSrc) {
  if (!container || !audioSrc) {
    return null;
  }

  const wave = WaveSurfer.create({
    container,
    url: audioSrc,
    height: 64,
    barWidth: 3,
    barRadius: 999,
    barGap: 2,
    normalize: true,
    interact: false,
    waveColor: 'rgba(255,255,255,0.25)',
    progressColor: '#ffffff',
    cursorWidth: 0
  });

  return wave;
}
