import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import App from '../src/player/App.jsx';

describe('App', () => {
  it('renders the immersive poster shell with the required HUD modules', () => {
    const markup = renderToStaticMarkup(
      <App
        initialLibrary={[{
          id: 'canada-quali-george-russell-2025',
          title: 'George Russell Pole Lap',
          trackName: 'Circuit Gilles Villeneuve',
          trackCountry: 'Canada',
          driverName: 'George Russell',
          driverNumber: '63',
          audioSrc: '/audio/canada.mp3',
          clipDurationMs: 100848,
          durationLabel: '00:01:40',
          telemetryLocationSrc: '/telemetry/location.json',
          telemetryCarDataSrc: '/telemetry/car-data.json',
          trackSvgSrc: '/assets/tracks/canada.svg',
          options: ['Montreal', 'Monza', 'Silverstone', 'Spa'],
          answerAliases: ['Montreal']
        }]}
      />
    );

    expect(markup).toContain('George Russell Pole Lap');
    expect(markup).toContain('data-testid="poster-stage"');
    expect(markup).toContain('data-testid="waveform-hud"');
    expect(markup).toContain('data-testid="track-hud"');
    expect(markup).toContain('data-testid="timer-ring"');
    expect(markup).toContain('data-testid="answer-dock"');
  });
});
