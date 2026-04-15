import { describe, expect, it } from 'vitest';
import { getClipOutputPaths, normalizeChallenge } from '../src/lib/challenge-utils.js';

describe('normalizeChallenge', () => {
  it('adds a ready status when audio exists', () => {
    const result = normalizeChallenge({
      audioSrc: '/audio/test.mp3',
      clipDurationMs: 4200
    });

    expect(result.hasAudio).toBe(true);
    expect(result.statusLabel).toBe('Clip ready');
    expect(result.durationSeconds).toBe(4);
  });

  it('adds setup helper copy when audio is missing', () => {
    const result = normalizeChallenge({
      audioSrc: '',
      clipDurationMs: 0
    });

    expect(result.hasAudio).toBe(false);
    expect(result.helperCopy).toContain('Run the extraction tool');
  });
});

describe('getClipOutputPaths', () => {
  it('returns both wav and mp3 output locations', () => {
    expect(getClipOutputPaths('japan-round')).toEqual({
      wav: 'public/audio/japan-round.wav',
      mp3: 'public/audio/japan-round.mp3'
    });
  });
});
