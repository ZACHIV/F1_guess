// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AUXILIARY_AUDIO_ASSETS,
  RESULT_AUDIO_CUES,
  muteDutchAnthemPlayback,
  playResultAudioCue,
  resetResultAudioState
} from '../src/player/anthem.js';

describe('result audio cues', () => {
  afterEach(() => {
    resetResultAudioState();
    vi.restoreAllMocks();
  });

  it('keeps the defeat result cue ordered from simply lovely into the Dutch anthem', () => {
    expect(RESULT_AUDIO_CUES.maxWin.layers.map((layer) => layer.id)).toEqual([
      'max-simply-lovely',
      'dutch-anthem'
    ]);
    expect(RESULT_AUDIO_CUES.maxWin.layers[0].src).toBe('/audio/Team Radio/verstappen-simply-lovely.mp3');
    expect(RESULT_AUDIO_CUES.maxWin.layers[1].src).toBe('/audio/荷兰国歌.mp3');
  });

  it('routes defeat playback to simply lovely first, then starts the Dutch anthem after it ends', async () => {
    const audioInstances = [];
    const AudioMock = vi.fn((src) => {
      const audio = {
        src,
        preload: '',
        volume: 1,
        loop: false,
        play: vi.fn(() => Promise.resolve()),
        pause: vi.fn(),
        currentTime: 0,
        onended: null
      };
      audioInstances.push(audio);
      return audio;
    });

    vi.stubGlobal('Audio', AudioMock);

    const loseCleanup = playResultAudioCue({ outcome: 'lose' });

    expect(AudioMock).toHaveBeenNthCalledWith(1, '/audio/Team Radio/verstappen-simply-lovely.mp3');
    expect(AudioMock).toHaveBeenCalledTimes(1);
    expect(typeof loseCleanup).toBe('function');
    expect(audioInstances[0].play).toHaveBeenCalledTimes(1);

    await audioInstances[0].onended?.();

    expect(AudioMock).toHaveBeenNthCalledWith(2, '/audio/荷兰国歌.mp3');
    expect(audioInstances[1].play).toHaveBeenCalledTimes(1);
  });

  it('keeps timeout on the same ordered sequence', async () => {
    const audioInstances = [];
    const AudioMock = vi.fn((src) => {
      const audio = {
        src,
        preload: '',
        volume: 1,
        loop: false,
        play: vi.fn(() => Promise.resolve()),
        pause: vi.fn(),
        currentTime: 0,
        onended: null
      };
      audioInstances.push(audio);
      return audio;
    });

    vi.stubGlobal('Audio', AudioMock);

    const timeoutCleanup = playResultAudioCue({ outcome: 'timeout' });

    expect(AudioMock).toHaveBeenNthCalledWith(1, '/audio/Team Radio/verstappen-simply-lovely.mp3');
    expect(typeof timeoutCleanup).toBe('function');

    await audioInstances[0].onended?.();

    expect(AudioMock).toHaveBeenNthCalledWith(2, '/audio/荷兰国歌.mp3');
  });

  it('returns a cleanup function for non-winning outcomes', () => {
    const cleanup = playResultAudioCue({ outcome: 'lose' });
    expect(typeof cleanup).toBe('function');
  });

  it('mutes the active Dutch anthem layer without stopping the sequence', async () => {
    const audioInstances = [];
    const AudioMock = vi.fn((src) => {
      const audio = {
        src,
        preload: '',
        volume: 1,
        loop: false,
        play: vi.fn(() => Promise.resolve()),
        pause: vi.fn(),
        currentTime: 12,
        onended: null
      };
      audioInstances.push(audio);
      return audio;
    });

    vi.stubGlobal('Audio', AudioMock);

    playResultAudioCue({ outcome: 'lose' });
    await audioInstances[0].onended?.();
    muteDutchAnthemPlayback();

    expect(audioInstances[1].pause).not.toHaveBeenCalled();
    expect(audioInstances[1].volume).toBe(0);
  });

  it('keeps the Dutch anthem muted if mute is requested before that layer starts', async () => {
    const audioInstances = [];
    const AudioMock = vi.fn((src) => {
      const audio = {
        src,
        preload: '',
        volume: 1,
        loop: false,
        play: vi.fn(() => Promise.resolve()),
        pause: vi.fn(),
        currentTime: 0,
        onended: null
      };
      audioInstances.push(audio);
      return audio;
    });

    vi.stubGlobal('Audio', AudioMock);

    playResultAudioCue({ outcome: 'timeout' });
    muteDutchAnthemPlayback();
    await audioInstances[0].onended?.();

    expect(audioInstances[1].volume).toBe(0);
  });

  it('keeps the anthem and chant assets available for other flows', () => {
    expect(AUXILIARY_AUDIO_ASSETS.dutchAnthem.id).toBe('dutch-anthem');
    expect(AUXILIARY_AUDIO_ASSETS.dutchAnthem.src).toBe('/audio/荷兰国歌.mp3');
    expect(AUXILIARY_AUDIO_ASSETS.maxChant.id).toBe('max-chant');
    expect(AUXILIARY_AUDIO_ASSETS.maxChant.src).toBe('/audio/Team Radio/verstappen-simply-lovely.mp3');
  });
});
