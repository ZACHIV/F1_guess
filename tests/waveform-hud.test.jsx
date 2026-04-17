/* @vitest-environment jsdom */
/* @vitest-environment-options {"url":"http://localhost/"} */
import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import WaveformHUD from '../src/player/components/WaveformHUD.jsx';

const destroy = vi.fn();
const on = vi.fn();
const getMediaElement = vi.fn(() => document.createElement('audio'));
const mountWaveform = vi.fn(() => ({
  destroy,
  on,
  getMediaElement
}));

vi.mock('../src/lib/waveform.js', () => ({
  mountWaveform: (...args) => mountWaveform(...args)
}));

describe('WaveformHUD', () => {
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
});
