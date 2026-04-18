import { describe, expect, it } from 'vitest';
import {
  ESTIMATED_BENCHMARK_RATIO,
  getDuelChallenge
} from '../src/player/game-config.js';

describe('getDuelChallenge', () => {
  it('keeps recorded benchmarks for calibrated duel entries', () => {
    const challenge = getDuelChallenge({
      id: 'italy-quali-max-verstappen-2025',
      clipDurationMs: 115944,
      trackName: 'Monza'
    });

    expect(challenge).toEqual(expect.objectContaining({
      benchmarkMs: 22120,
      benchmarkLabel: '22.12s',
      benchmarkSource: 'recorded'
    }));
  });

  it('estimates benchmarks for non-calibrated duel entries from clip duration', () => {
    const challenge = getDuelChallenge({
      id: 'australia-quali-lando-norris-2025',
      clipDurationMs: 102696,
      trackName: 'Albert Park'
    });

    expect(ESTIMATED_BENCHMARK_RATIO).toBe(0.226);
    expect(challenge).toEqual(expect.objectContaining({
      benchmarkMs: 23209,
      benchmarkLabel: '23.21s',
      benchmarkSource: 'estimated'
    }));
  });
});
