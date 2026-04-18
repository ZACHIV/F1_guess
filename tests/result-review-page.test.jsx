import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ResultReviewPage from '../src/player/components/ResultReviewPage.jsx';

describe('ResultReviewPage', () => {
  it('renders a separate review screen with track svg debrief and replay controls', () => {
    const markup = renderToStaticMarkup(
      <ResultReviewPage
        challenge={{
          trackName: 'Monza',
          trackCountry: 'Italy',
          driverName: 'Max Verstappen',
          driverNumber: '1',
          trackSvgSrc: '/assets/tracks/italy.svg'
        }}
        dimensions={{ width: 360, height: 250 }}
        marker={{ x: 150, y: 120 }}
        onNextChallenge={() => {}}
        onReplayAudio={() => {}}
        onRetry={() => {}}
        result={{
          outcome: 'lose',
          headline: 'Max still called Monza first.',
          copy: 'Correct answer: Monza · Italy.',
          benchmarkMs: 22120,
          playerTimeMs: 31000,
          deltaLabel: '8.88s slower'
        }}
        telemetryPath="M 10 10 L 100 100"
      />
    );

    expect(markup).toContain('data-testid="result-review-page"');
    expect(markup).toContain('data-testid="track-hud"');
    expect(markup).toContain('Next Duel');
    expect(markup).toContain('Retry');
    expect(markup).toContain('Replay Audio');
    expect(markup).toContain('Monza');
    expect(markup).toContain('/assets/tracks/italy.svg');
  });
});
