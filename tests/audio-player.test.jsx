/* @vitest-environment jsdom */
/* @vitest-environment-options {"url":"http://localhost/"} */
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AudioPlayer from '../src/player/components/AudioPlayer.jsx';

describe('AudioPlayer', () => {
  const onFinish = vi.fn();
  const onPlayStateChange = vi.fn();
  const onReady = vi.fn();
  const onTimeUpdate = vi.fn();
  const pause = vi.fn();
  let requestAnimationFrameSpy;
  let cancelAnimationFrameSpy;
  let animationFrameCallback;

  beforeEach(() => {
    onFinish.mockClear();
    onPlayStateChange.mockClear();
    onReady.mockClear();
    onTimeUpdate.mockClear();
    pause.mockClear();
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(pause);
    animationFrameCallback = null;
    requestAnimationFrameSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      animationFrameCallback = callback;
      return 42;
    });
    cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('mounts a hidden audio element instead of a waveform and reports media events', () => {
    render(
      <AudioPlayer
        audioSrc="/audio/test.mp3"
        onFinish={onFinish}
        onPlayStateChange={onPlayStateChange}
        onReady={onReady}
        onTimeUpdate={onTimeUpdate}
      />
    );

    const audio = screen.getByTestId('duel-audio');
    audio.currentTime = 12.345;
    audio.dispatchEvent(new Event('play'));
    audio.dispatchEvent(new Event('timeupdate'));
    audio.dispatchEvent(new Event('pause'));
    audio.dispatchEvent(new Event('ended'));

    expect(audio).toHaveAttribute('src', '/audio/test.mp3');
    expect(onReady).toHaveBeenCalledWith(audio);
    expect(onPlayStateChange).toHaveBeenNthCalledWith(1, true);
    expect(onTimeUpdate).toHaveBeenCalledWith(12_345);
    expect(onPlayStateChange).toHaveBeenNthCalledWith(2, false);
    expect(onPlayStateChange).toHaveBeenNthCalledWith(3, false);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('drives time updates from animation frames while playback is active', () => {
    render(
      <AudioPlayer
        audioSrc="/audio/test.mp3"
        onFinish={onFinish}
        onPlayStateChange={onPlayStateChange}
        onReady={onReady}
        onTimeUpdate={onTimeUpdate}
      />
    );

    const audio = screen.getByTestId('duel-audio');
    Object.defineProperty(audio, 'paused', { configurable: true, get: () => false });
    Object.defineProperty(audio, 'ended', { configurable: true, get: () => false });
    audio.dispatchEvent(new Event('play'));

    expect(requestAnimationFrameSpy).toHaveBeenCalled();
    expect(typeof animationFrameCallback).toBe('function');

    audio.currentTime = 0.48;
    animationFrameCallback?.();
    audio.currentTime = 0.96;
    animationFrameCallback?.();

    expect(onTimeUpdate).toHaveBeenCalledWith(480);
    expect(onTimeUpdate).toHaveBeenCalledWith(960);

    audio.dispatchEvent(new Event('pause'));

    expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(42);
  });
});
