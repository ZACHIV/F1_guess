/* @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/player/App.jsx';

const waveformHandlers = new Map();
const play = vi.fn(() => Promise.resolve());
const pause = vi.fn();
const stop = vi.fn();
const setTime = vi.fn();
const destroy = vi.fn();

vi.mock('../src/lib/waveform.js', () => ({
  mountWaveform: () => ({
    play,
    pause,
    stop,
    setTime,
    destroy,
    on: (event, handler) => {
      waveformHandlers.set(event, handler);
    }
  })
}));

describe('live playback controls', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    waveformHandlers.clear();
    play.mockClear();
    pause.mockClear();
    stop.mockClear();
    setTime.mockClear();
    destroy.mockClear();
  });

  it('switches from pause to resume without restarting the audio', async () => {
    render(
      <App
        initialLibrary={[{
          id: 'italy-quali-max-verstappen-2025',
          title: 'Max Verstappen Pole Lap',
          trackName: 'Monza',
          trackCountry: 'Italy',
          driverName: 'Max Verstappen',
          driverNumber: '1',
          audioSrc: '/audio/italy.mp3',
          clipDurationMs: 115944,
          durationLabel: '00:01:52',
          telemetryLocationSrc: '/telemetry/location.json',
          telemetryCarDataSrc: '/telemetry/car-data.json',
          trackSvgSrc: '/assets/tracks/italy.svg',
          options: ['Monza', 'Spa', 'COTA', 'Singapore'],
          answerAliases: ['Italy']
        }]}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Start Duel' })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Start Duel' }));

    await waitFor(() => {
      expect(play).toHaveBeenCalledTimes(1);
    });

    waveformHandlers.get('play')?.();

    await screen.findByRole('button', { name: 'Pause' });
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));

    expect(pause).toHaveBeenCalledTimes(1);

    waveformHandlers.get('pause')?.();

    await screen.findByRole('button', { name: 'Resume' });
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));

    await waitFor(() => {
      expect(play).toHaveBeenCalledTimes(2);
    });

    expect(stop).toHaveBeenCalledTimes(1);
    expect(setTime).toHaveBeenCalledTimes(1);
  });

  it('lets the player surrender early and replay from the review screen', async () => {
    render(
      <App
        initialLibrary={[{
          id: 'italy-quali-max-verstappen-2025',
          title: 'Max Verstappen Pole Lap',
          trackName: 'Monza',
          trackCountry: 'Italy',
          driverName: 'Max Verstappen',
          driverNumber: '1',
          audioSrc: '/audio/italy.mp3',
          clipDurationMs: 115944,
          durationLabel: '00:01:52',
          telemetryLocationSrc: '/telemetry/location.json',
          telemetryCarDataSrc: '/telemetry/car-data.json',
          trackSvgSrc: '/assets/tracks/italy.svg',
          options: ['Monza', 'Spa', 'COTA', 'Singapore'],
          answerAliases: ['Italy']
        }]}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Start Duel' })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Start Duel' }));

    await waitFor(() => {
      expect(play).toHaveBeenCalled();
    });

    waveformHandlers.get('play')?.();

    await screen.findByRole('button', { name: 'Surrender' });
    fireEvent.click(screen.getByRole('button', { name: 'Surrender' }));

    await screen.findByTestId('result-review-page');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Replay Audio' })).toBeEnabled();
    });

    const playsBeforeReplay = play.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Replay Audio' }));

    await waitFor(() => {
      expect(play.mock.calls.length).toBeGreaterThan(playsBeforeReplay);
    });
  });
});
