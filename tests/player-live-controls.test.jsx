/* @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/player/App.jsx';

const play = vi.fn(() => Promise.resolve());
const pause = vi.fn();

describe('live playback controls', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    play.mockClear();
    pause.mockClear();
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(play);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(pause);
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

    const audio = screen.getByTestId('duel-audio');
    audio.currentTime = 9;
    audio.dispatchEvent(new Event('play'));

    await screen.findByRole('button', { name: 'Pause' });
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));

    expect(pause).toHaveBeenCalledTimes(1);

    audio.dispatchEvent(new Event('pause'));

    await screen.findByRole('button', { name: 'Resume' });
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));

    await waitFor(() => {
      expect(play).toHaveBeenCalledTimes(2);
    });

    expect(audio.currentTime).toBe(9);
  });

  it('keeps replay as a separate live control that restarts the clip', async () => {
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

    const audio = screen.getByTestId('duel-audio');
    audio.currentTime = 14;
    audio.dispatchEvent(new Event('play'));

    await screen.findByRole('button', { name: 'Replay' });
    const playsBeforeReplay = play.mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: 'Replay' }));

    await waitFor(() => {
      expect(play.mock.calls.length).toBe(playsBeforeReplay + 1);
    });

    expect(audio.currentTime).toBe(0);
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });

  it('marks submit as wrong briefly after an incorrect guess', async () => {
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

    screen.getByTestId('duel-audio').dispatchEvent(new Event('play'));

    fireEvent.change(screen.getByRole('textbox', { name: 'Circuit guess' }), {
      target: { value: 'Spa' }
    });

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await screen.findByRole('button', { name: 'Wrong' });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });
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

    screen.getByTestId('duel-audio').dispatchEvent(new Event('play'));

    await screen.findByRole('button', { name: 'Surrender' });
    fireEvent.click(screen.getByRole('button', { name: 'Surrender' }));

    await screen.findByTestId('result-review-page');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Visualize Track' })).toBeEnabled();
    });

    const playsBeforeReplay = play.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Visualize Track' }));

    await waitFor(() => {
      expect(play.mock.calls.length).toBeGreaterThan(playsBeforeReplay);
    });
  });
});
