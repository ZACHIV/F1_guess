import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import App from '../src/player/App.jsx';

describe('App', () => {
  it('renders the stripped poster layout with the earphone portrait, hidden audio, timer, and start controls', () => {
    const markup = renderToStaticMarkup(
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

    expect(markup).toContain('data-testid="poster-stage"');
    expect(markup).toContain('data-testid="duel-audio"');
    expect(markup).toContain('data-testid="timer-ring"');
    expect(markup).toContain('data-testid="interaction-dock"');
    expect(markup).toContain('duel-stage__hero duel-stage__hero--anchored');
    expect(markup).toContain('/assets/max_with_earphone.jpeg');
    expect(markup).toContain('Can You Beat Max?');
    expect(markup).toContain('Start Duel');
    expect(markup).not.toContain('Can you beat Max by ear?');
    expect(markup).not.toContain('Hidden Pool');
    expect(markup).not.toContain('data-testid="answer-dock"');
    expect(markup).not.toContain('data-testid="track-hud"');
    expect(markup).not.toContain('data-testid="waveform-hud"');
  });
});
