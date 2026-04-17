import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import App from '../src/player/App.jsx';

describe('App', () => {
  it('renders the duel shell with waveform, timer, and answer controls', () => {
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

    expect(markup).toContain('Can you beat Max by ear?');
    expect(markup).toContain('data-testid="poster-stage"');
    expect(markup).toContain('data-testid="waveform-hud"');
    expect(markup).toContain('data-testid="timer-ring"');
    expect(markup).toContain('data-testid="answer-dock"');
    expect(markup).toContain('Hidden Pool');
  });
});
