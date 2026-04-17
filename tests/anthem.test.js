import { describe, expect, it } from 'vitest';
import { AUXILIARY_AUDIO_ASSETS, RESULT_AUDIO_CUES, playResultAudioCue } from '../src/player/anthem.js';

describe('result audio cues', () => {
  it('keeps the max-win result cue scoped to simply lovely only', () => {
    expect(RESULT_AUDIO_CUES.maxWin.layers.map((layer) => layer.id)).toEqual([
      'max-simply-lovely'
    ]);
  });

  it('returns a cleanup function even before audio assets are wired in', () => {
    const cleanup = playResultAudioCue({ outcome: 'lose' });
    expect(typeof cleanup).toBe('function');
  });

  it('keeps the anthem and chant assets available for other flows', () => {
    expect(AUXILIARY_AUDIO_ASSETS.dutchAnthem.id).toBe('dutch-anthem');
    expect(AUXILIARY_AUDIO_ASSETS.maxChant.id).toBe('max-chant');
  });
});
