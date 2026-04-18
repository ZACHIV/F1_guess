/* @vitest-environment jsdom */
/* @vitest-environment-options {"url":"http://localhost/"} */
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WaveformHUD from '../src/player/components/WaveformHUD.jsx';

const destroy = vi.fn();
const on = vi.fn();
const mediaElement = document.createElement('audio');
const getMediaElement = vi.fn(() => mediaElement);
const mountWaveform = vi.fn(() => ({
  destroy,
  on,
  getMediaElement
}));

vi.mock('../src/lib/waveform.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    mountWaveform: (...args) => mountWaveform(...args)
  };
});

let originalAudioContext;
let originalWebkitAudioContext;
let originalDevicePixelRatio;
let createMediaElementSource;
let createAnalyser;
let resume;
let close;
let connect;
let disconnect;
let getByteTimeDomainData;
let canvasContext;

describe('WaveformHUD', () => {
  beforeEach(() => {
    destroy.mockClear();
    on.mockClear();
    getMediaElement.mockClear();
    mountWaveform.mockClear();

    connect = vi.fn();
    disconnect = vi.fn();
    getByteTimeDomainData = vi.fn((buffer) => {
      buffer.fill(128);
    });
    createMediaElementSource = vi.fn(() => ({
      connect,
      disconnect
    }));
    createAnalyser = vi.fn(() => ({
      fftSize: 0,
      frequencyBinCount: 1024,
      connect,
      disconnect,
      getByteTimeDomainData
    }));
    resume = vi.fn(() => Promise.resolve());
    close = vi.fn(() => Promise.resolve());
    canvasContext = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      setTransform: vi.fn(),
      setLineDash: vi.fn(),
      quadraticCurveTo: vi.fn(),
      fillRect: vi.fn()
    };

    originalAudioContext = window.AudioContext;
    originalWebkitAudioContext = window.webkitAudioContext;
    originalDevicePixelRatio = window.devicePixelRatio;
    window.devicePixelRatio = 1;
    window.AudioContext = vi.fn(() => ({
      createMediaElementSource,
      createAnalyser,
      resume,
      close,
      destination: { channelCount: 2 }
    }));
    window.webkitAudioContext = undefined;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(canvasContext);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    window.AudioContext = originalAudioContext;
    window.webkitAudioContext = originalWebkitAudioContext;
    window.devicePixelRatio = originalDevicePixelRatio;
    vi.restoreAllMocks();
  });

  it('does not recreate the waveform instance when parent callbacks change identity', () => {
    const { rerender } = render(
      <WaveformHUD
        audioSrc="/audio/test.mp3"
        benchmarkLabel="22.12s"
        elapsedMs={0}
        onFinish={() => {}}
        onPlayStateChange={() => {}}
        onReady={() => {}}
        onTimeUpdate={() => {}}
        result={null}
        runState="idle"
      />
    );

    rerender(
      <WaveformHUD
        audioSrc="/audio/test.mp3"
        benchmarkLabel="22.12s"
        elapsedMs={0}
        onFinish={() => {}}
        onPlayStateChange={() => {}}
        onReady={() => {}}
        onTimeUpdate={() => {}}
        result={null}
        runState="idle"
      />
    );

    expect(mountWaveform).toHaveBeenCalledTimes(1);
    expect(destroy).not.toHaveBeenCalled();
  });

  it('connects the wavesurfer media element to a realtime oscilloscope canvas', () => {
    render(
      <WaveformHUD
        audioSrc="/audio/test.mp3"
        onFinish={() => {}}
        onPlayStateChange={() => {}}
        onReady={() => {}}
        onTimeUpdate={() => {}}
      />
    );

    expect(screen.getByTestId('waveform-oscilloscope')).toBeInTheDocument();
    expect(createMediaElementSource).toHaveBeenCalledWith(mediaElement);
    expect(createAnalyser).toHaveBeenCalledTimes(1);
  });
});
